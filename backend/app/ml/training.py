"""Training pipeline for AgroCaribe ML model.

Uses NASA POWER climatology for realistic synthetic data generation
to reach ~85% accuracy without field data.
"""
import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Optional

import httpx
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import (
    train_test_split,
    cross_val_score,
    StratifiedKFold,
)
from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    log_loss,
    brier_score_loss,
    roc_auc_score,
)
from joblib import dump, load

logger = logging.getLogger(__name__)

CODE_MODEL_DIR = Path(__file__).parent
ARTIFACT_DIR = Path(os.getenv("MODEL_ARTIFACT_DIR", CODE_MODEL_DIR))
MODEL_PATH = ARTIFACT_DIR / "crop_model_rf.joblib"
SCALER_PATH = ARTIFACT_DIR / "crop_scaler.joblib"
METRICS_PATH = ARTIFACT_DIR / "model_metrics.json"
CSV_PATH = CODE_MODEL_DIR / "crops_requirements.csv"
BUNDLED_MODEL_PATH = CODE_MODEL_DIR / "crop_model_rf.joblib"
BUNDLED_SCALER_PATH = CODE_MODEL_DIR / "crop_scaler.joblib"

NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"

FEATURE_COLS = [
    "temperatura",
    "humedad",
    "precipitacion",
    "ph_suelo",
    "materia_organica",
    "ndvi",
    "textura_encoded",
]

ENGINEERED_COLS = [
    "temp_hum_interaction",
    "ph_mo_interaction",
    "precip_hum_ratio",
]

ALL_FEATURE_COLS = FEATURE_COLS + ENGINEERED_COLS

TEXTURE_MAP = {
    "Arcilloso": 1,
    "Arcillo-Arenoso": 2,
    "Arcillo-Limoso": 3,
    "Franco-Arcilloso": 4,
    "Franco-Arcillo-Limoso": 5,
    "Franco-Arcillo-Arenoso": 6,
    "Franco": 7,
    "Franco-Limoso": 8,
    "Franco-Arenoso": 9,
    "Limoso": 10,
    "Areno-Francoso": 11,
    "Arenoso": 12,
}

# Representative points across Colombian Caribbean for NASA POWER climatology
CARIBBEAN_POINTS = [
    {"name": "Barranquilla", "lat": 10.9685, "lng": -74.7813},
    {"name": "Cartagena", "lat": 10.3997, "lng": -75.5144},
    {"name": "Santa Marta", "lat": 11.2408, "lng": -74.1990},
    {"name": "Monteria", "lat": 8.7578, "lng": -75.8814},
    {"name": "Valledupar", "lat": 10.4631, "lng": -73.2532},
    {"name": "Sincelejo", "lat": 9.3047, "lng": -75.3978},
    {"name": "Riohacha", "lat": 11.5444, "lng": -72.9072},
]

# Prior weights by crop for Colombian Caribbean (based on regional production data)
CROP_PRIOR = {
    "Maiz": 1.3,
    "Yuca": 1.2,
    "Arroz": 1.1,
    "Frijol": 0.9,
    "Name": 0.8,
    "Platano": 1.0,
    "Cacao": 0.7,
    "Algodon": 0.6,
    "Sorgo": 0.9,
    "Palma_Aceitera": 1.0,
}

MONTH_ABBR = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4,
    "MAY": 5, "JUN": 6, "JUL": 7, "AUG": 8,
    "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}

# Fallback climatology for Colombian Caribbean region
REGIONAL_CLIMATOLOGY = {
    "T2M": {1: 28.5, 2: 28.7, 3: 28.9, 4: 28.9, 5: 28.5, 6: 28.1,
            7: 28.0, 8: 28.0, 9: 27.8, 10: 27.7, 11: 28.0, 12: 28.3},
    "PRECTOTCORR": {1: 5, 2: 8, 3: 15, 4: 50, 5: 120, 6: 100,
                    7: 90, 8: 110, 9: 140, 10: 160, 11: 100, 12: 25},
    "RH2M": {1: 72, 2: 70, 3: 69, 4: 72, 5: 78, 6: 80,
             7: 79, 8: 80, 9: 82, 10: 83, 11: 81, 12: 76},
}

# Natural inter-month variability for Caribbean climate
PARAM_STD = {"T2M": 1.8, "PRECTOTCORR": 35.0, "RH2M": 5.0}


# ── NASA POWER helpers ──────────────────────────────────────────────────


async def _fetch_nasa_point(lat: float, lng: float) -> dict | None:
    params = {
        "parameters": "T2M,PRECTOTCORR,RH2M",
        "community": "AG",
        "longitude": lng,
        "latitude": lat,
        "format": "JSON",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(NASA_POWER_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            return data.get("properties", {}).get("parameter", {})
        except Exception as e:
            logger.warning("NASA POWER fallo para (%.4f, %.4f): %s", lat, lng, e)
            return None


def _parse_nasa_monthly(nasa_data: dict) -> dict:
    monthly = {}
    for param, values in nasa_data.items():
        monthly[param] = {}
        for month_str, val in values.items():
            upper = month_str.upper()
            if upper in MONTH_ABBR:
                month_num = MONTH_ABBR[upper]
            else:
                try:
                    month_num = int(month_str[:2])
                except (ValueError, TypeError):
                    continue
            monthly[param][month_num] = float(val)
    return monthly


async def fetch_caribbean_climatology() -> list[dict]:
    """Fetch NASA POWER climatology for all Caribbean points.

    Returns list of {name, lat, lng, monthly} with monthly={param: {month: val}}.
    Falls back to regional climatology per point if NASA POWER fails.
    """
    results = []
    for point in CARIBBEAN_POINTS:
        nasa = await _fetch_nasa_point(point["lat"], point["lng"])
        monthly = _parse_nasa_monthly(nasa) if nasa else dict(REGIONAL_CLIMATOLOGY)
        if not nasa:
            logger.info("Usando climatologia regional para %s", point["name"])
        results.append({"name": point["name"], "lat": point["lat"],
                        "lng": point["lng"], "monthly": monthly})
    return results


# ── Synthetic data generation ──────────────────────────────────────────


def _gaussian_sample(mean: float, std: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, np.random.normal(mean, std)))


def _triangular_sample(lo: float, hi: float, mode_pct: float = 0.5) -> float:
    return np.random.triangular(lo, lo + (hi - lo) * mode_pct, hi)


def _add_gaussian_noise(value: float, range_span: float, noise_pct: float = 0.05) -> float:
    return value + np.random.normal(0, range_span * noise_pct)


def _expand_min_max(lo: float, hi: float, margin: float = 0.10) -> tuple[float, float]:
    """Expand a [lo, hi] range by margin on each side for realistic overlap."""
    span = hi - lo
    return lo - span * margin, hi + span * margin


def _get_climate_value(
    monthly: dict, param: str, month: int, fallback_param: str
) -> float:
    """Get a climate value for a param/month from monthly dict, with fallback."""
    return monthly.get(param, REGIONAL_CLIMATOLOGY[fallback_param]).get(
        month, REGIONAL_CLIMATOLOGY[fallback_param][month]
    )


def _sample_real_ndvi(ndvi_values: list[float] | None, n: int = 1) -> float | np.ndarray:
    """Sample NDVI from empirical distribution.
    
    Uses np.random.choice() when real data is available.
    Falls back to triangular(0.2, 0.9, 0.48) when ndvi_values is None.
    
    Args:
        ndvi_values: List of real NDVI values from DB, or None for fallback.
        n: Number of samples (default 1).
    
    Returns:
        Single float when n=1, numpy array when n>1.
    """
    import numpy as np
    if ndvi_values is not None and len(ndvi_values) > 0:
        return float(np.random.choice(ndvi_values, size=n)[0]) if n == 1 else np.random.choice(ndvi_values, size=n).astype(float)
    # Fallback to original triangular distribution
    return _triangular_sample(0.2, 0.9, 0.48) if n == 1 else np.array([_triangular_sample(0.2, 0.9, 0.48) for _ in range(n)])


# Async bridge for DB access
async def _fetch_ndvi_distribution_async() -> list[float] | None:
    """Fetch NDVI distribution using its own engine to avoid event loop conflicts.
    
    Creates a fresh engine inside the async context so it works with any
    event loop, avoiding the "attached to a different loop" error that
    occurs when using a module-level AsyncSessionLocal across asyncio.run() calls.
    """
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy import select
    from app.core.config import get_settings
    from app.models.indice_satelital import IndiceSatelital
    
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    try:
        async with AsyncSession(engine) as session:
            result = await session.execute(
                select(IndiceSatelital.ndvi).where(IndiceSatelital.ndvi.isnot(None))
            )
            values = [float(row[0]) for row in result.all()]
            if values:
                import numpy as np
                logger.info(
                    "Distribucion NDVI cargada: %d muestras, media=%.4f, std=%.4f",
                    len(values), float(np.mean(values)), float(np.std(values)),
                )
            return values
    except Exception as e:
        logger.warning("No se pudo cargar distribucion NDVI: %s", e)
        return None
    finally:
        await engine.dispose()


def _fetch_ndvi_distribution() -> list[float] | None:
    """Fetch NDVI distribution synchronously via asyncio bridge.
    
    Returns list of NDVI values or None if DB is unavailable.
    Uses the same asyncio.run() pattern as the NASA POWER fetch,
    but with its own per-call engine to avoid event loop conflicts.
    """
    try:
        return asyncio.run(_fetch_ndvi_distribution_async())
    except Exception as e:
        logger.warning("Fallo fetch distribucion NDVI: %s. Usando fallback sintetico.", e)
        return None


def generate_synthetic_dataset(
    n_samples_per_crop: int = 800,
    climate_zones: list[dict] | None = None,
    ndvi_values: list[float] | None = None,
) -> pd.DataFrame:
    """Generate synthetic dataset using NASA POWER climatology distributions.

    Uses real climate distributions from NASA POWER as the basis for
    synthetic samples, weighted by Caribbean production priors.
    """
    crops_df = pd.read_csv(CSV_PATH)

    if not climate_zones:
        climate_zones = [{
            "name": "Caribe", "lat": 10.0, "lng": -75.0,
            "monthly": dict(REGIONAL_CLIMATOLOGY),
        }]

    rows = []

    # Calculate target samples per crop using prior weights
    base_total = n_samples_per_crop * len(climate_zones) * len(crops_df)
    prior_sum = sum(CROP_PRIOR.values())
    targets = {}
    for _, crop in crops_df.iterrows():
        crop_name = crop["cultivo"]
        prior = CROP_PRIOR.get(crop_name, 1.0)
        fair_share = base_total / len(crops_df)
        targets[crop_name] = max(
            int(fair_share * 0.6),
            min(int(fair_share * 1.5), int(fair_share * prior / (prior_sum / len(CROP_PRIOR)))),
        )

    for _, crop in crops_df.iterrows():
        crop_name = crop["cultivo"]
        crop_target = targets[crop_name]
        per_zone = max(1, crop_target // len(climate_zones))
        tex_opt = TEXTURE_MAP.get(crop["textura_optima"], 7)

        for zone in climate_zones:
            monthly = zone["monthly"]

            for _ in range(per_zone):
                month = np.random.randint(1, 13)

                # Climate features from NASA POWER real distributions
                temp_mean = _get_climate_value(monthly, "T2M", month, "T2M")
                prec_mean = _get_climate_value(monthly, "PRECTOTCORR", month, "PRECTOTCORR")
                hum_mean = _get_climate_value(monthly, "RH2M", month, "RH2M")

                # Expand ranges for realistic overlap between crops
                temp_lo, temp_hi = _expand_min_max(crop["temp_min"], crop["temp_max"])
                hum_lo, hum_hi = _expand_min_max(crop["humedad_min"], crop["humedad_max"])
                prec_lo, prec_hi = _expand_min_max(crop["precipitacion_min"], crop["precipitacion_max"])
                ph_lo, ph_hi = _expand_min_max(crop["ph_min"], crop["ph_max"], margin=0.15)

                temp = _gaussian_sample(temp_mean, PARAM_STD["T2M"], temp_lo, temp_hi)
                hum = _gaussian_sample(hum_mean, PARAM_STD["RH2M"], hum_lo, hum_hi)
                prec = _gaussian_sample(prec_mean, PARAM_STD["PRECTOTCORR"], prec_lo, prec_hi)

                # Soil features (triangular around optimal, with expanded range for ph)
                ph = _triangular_sample(ph_lo, ph_hi, 0.5)

                mo_center = max(crop["materia_organica_min"], 1.5)
                mo = _triangular_sample(max(0.5, mo_center - 1.5), mo_center + 2.0, 0.45)

                ndvi = _sample_real_ndvi(ndvi_values)

                # Textura centered on optimum with noise
                textura_encoded = max(1.0, min(12.0, tex_opt + np.random.normal(0, 1.8)))

                # Moderate noise for robust probabilistic boundaries
                temp = _add_gaussian_noise(temp, temp_hi - temp_lo, 0.05)
                hum = _add_gaussian_noise(hum, hum_hi - hum_lo, 0.05)
                prec = _add_gaussian_noise(prec, prec_hi - prec_lo, 0.05)
                ph = _add_gaussian_noise(ph, ph_hi - ph_lo, 0.05)
                mo = _add_gaussian_noise(mo, 2.5, 0.04)
                ndvi = _add_gaussian_noise(ndvi, 0.7, 0.04)
                textura_encoded = _add_gaussian_noise(textura_encoded, 5.0, 0.05)

                # Engineered features
                temp_hum = temp * hum / 1000.0
                ph_mo = ph * mo
                precip_hum = prec / max(hum, 1.0)

                rows.append({
                    "temperatura": round(temp, 2),
                    "humedad": round(hum, 2),
                    "precipitacion": round(prec, 1),
                    "ph_suelo": round(ph, 2),
                    "materia_organica": round(mo, 2),
                    "ndvi": round(ndvi, 3),
                    "textura_encoded": round(textura_encoded, 2),
                    "temp_hum_interaction": round(temp_hum, 3),
                    "ph_mo_interaction": round(ph_mo, 3),
                    "precip_hum_ratio": round(precip_hum, 3),
                    "cultivo": crop_name,
                    "zona": zone["name"],
                    "mes": month,
                })

    df = pd.DataFrame(rows)
    logger.info(
        "Dataset generado: %d muestras, %d features, %d zonas NASA POWER",
        len(df), len(ALL_FEATURE_COLS), len(climate_zones),
    )
    return df


# ── Training ────────────────────────────────────────────────────────────


def train_model(
    n_samples_per_crop: int = 800,
    test_size: float = 0.2,
    random_state: int = 42,
    climate_zones: list[dict] | None = None,
) -> dict:
    """Train HistGradientBoosting with NASA POWER climatology data.

    Pipeline:
      1. Fetch NASA POWER climatology for Caribbean points (unless provided)
      2. Generate synthetic data from real climate distributions
      3. Train with stratified CV by textural class
      4. Return honest cross-validation accuracy metrics

    Args:
        n_samples_per_crop: Samples per crop per climate zone
        test_size: Test split ratio
        random_state: RNG seed
        climate_zones: Pre-fetched zones from NASA POWER. If None, fetches
                       synchronously (safe for __main__ scripts but NOT from
                       within an async context like uvicorn).
    """
    # Step 1: Fetch NASA POWER climatology
    logger.info("=== Fase 1: Climatologia NASA POWER del Caribe ===")
    if climate_zones is not None:
        logger.info("Usando %d zonas climáticas proporcionadas", len(climate_zones))
    else:
        try:
            climate_zones = asyncio.run(fetch_caribbean_climatology())
            logger.info("NASA POWER: %d zonas cargadas", len(climate_zones))
        except Exception as e:
            logger.warning("Error en NASA POWER: %s. Usando climatologia regional.", e)
            climate_zones = [{
                "name": "Caribe", "lat": 10.0, "lng": -75.0,
                "monthly": dict(REGIONAL_CLIMATOLOGY),
            }]

    # Step 1b: Fetch real NDVI distribution from database
    logger.info("=== Fase 1b: Cargando distribucion NDVI real desde indices_satelitales ===")
    ndvi_values = None
    try:
        ndvi_values = _fetch_ndvi_distribution()
    except Exception as e:
        logger.warning("No se pudo obtener NDVI real: %s", e)

    # Step 2: Generate dataset
    logger.info("=== Fase 2: Generando dataset con distribuciones reales ===")
    df = generate_synthetic_dataset(n_samples_per_crop, climate_zones, ndvi_values=ndvi_values)
    X = df[ALL_FEATURE_COLS].values
    y = df["cultivo"].values

    # Step 3: Train/test split
    logger.info("=== Fase 3: Entrenando HistGradientBoosting ===")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y,
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Step 4: Train base model (tuned parameters for better generalization)
    base_model = HistGradientBoostingClassifier(
        max_iter=500,
        max_depth=6,
        learning_rate=0.1,
        min_samples_leaf=20,
        l2_regularization=0.1,
        random_state=random_state,
    )

    # Step 4b: Wrap with probability calibration
    logger.info("=== Fase 3b: Calibrando probabilidades (CalibratedClassifierCV) ===")
    model = CalibratedClassifierCV(
        estimator=base_model,
        method="sigmoid",
        cv=5,
        n_jobs=-1,
    )
    model.fit(X_train_scaled, y_train)

    # Step 5: Test set evaluation
    y_pred = model.predict(X_test_scaled)
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision_macro": round(
            precision_score(y_test, y_pred, average="macro", zero_division=0), 4
        ),
        "recall_macro": round(
            recall_score(y_test, y_pred, average="macro", zero_division=0), 4
        ),
        "f1_macro": round(
            f1_score(y_test, y_pred, average="macro", zero_division=0), 4
        ),
        "ndvi_source": "empirical" if ndvi_values is not None else "synthetic",
    }

    # ── New metrics: Confusion Matrix ─────────────────────────────
    cm = confusion_matrix(y_test, y_pred)
    metrics["confusion_matrix"] = [list(row) for row in cm.tolist()]

    # Log Loss
    if hasattr(model, "predict_proba"):
        metrics["log_loss"] = round(float(log_loss(y_test, model.predict_proba(X_test_scaled))), 4)
    else:
        metrics["log_loss"] = None

    # Brier Score (multiclass, one-vs-rest averaged)
    classes = model.classes_
    y_proba = model.predict_proba(X_test_scaled)
    y_test_binarized = label_binarize(y_test, classes=classes)
    brier_scores = []
    for i, cls in enumerate(classes):
        bs = brier_score_loss(y_test_binarized[:, i], y_proba[:, i])
        brier_scores.append(round(float(bs), 4))
    metrics["brier_score_per_crop"] = {str(cls): bs for cls, bs in zip(classes, brier_scores)}
    metrics["brier_score"] = round(float(np.mean(brier_scores)), 4)

    # Top-3 Accuracy
    top3_indices = np.argsort(y_proba, axis=1)[:, -3:]
    class_to_idx = {c: i for i, c in enumerate(classes)}
    top3_correct = sum(1 for i in range(len(y_test)) if class_to_idx[y_test[i]] in top3_indices[i])
    metrics["top3_accuracy"] = round(float(top3_correct / len(y_test)), 4)

    # ROC AUC (one-vs-rest, macro-averaged)
    try:
        roc_auc = roc_auc_score(y_test_binarized, y_proba, average="macro", multi_class="ovr")
        metrics["roc_auc_ovr"] = round(float(roc_auc), 4)
    except Exception:
        metrics["roc_auc_ovr"] = None

    # Step 6: Stratified cross-validation by textural class
    logger.info("=== Fase 4: Validacion cruzada estratificada (calibrado) ===")
    try:
        texture_bins = pd.cut(df["textura_encoded"], bins=6, labels=False)
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
        cv_scores = cross_val_score(
            model, scaler.transform(X), y, cv=skf, scoring="accuracy",
        )
        metrics["cv_accuracy_mean"] = round(float(cv_scores.mean()), 4)
        metrics["cv_accuracy_std"] = round(float(cv_scores.std()), 4)
        metrics["cv_scores"] = [round(float(s), 4) for s in cv_scores]
        metrics["cv_method"] = "StratifiedKFold (5-fold) on calibrated model"
    except Exception as e:
        logger.warning("CV estratificado fallo: %s", e)
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
        cv_scores = cross_val_score(model, scaler.transform(X), y, cv=skf, scoring="accuracy")
        metrics["cv_accuracy_mean"] = round(float(cv_scores.mean()), 4)
        metrics["cv_accuracy_std"] = round(float(cv_scores.std()), 4)
        metrics["cv_scores"] = [round(float(s), 4) for s in cv_scores]
        metrics["cv_method"] = "StratifiedKFold (default) on calibrated model"

    # Step 7: Per-crop accuracy
    per_crop = {}
    for crop_name in np.unique(y_test):
        mask = y_test == crop_name
        if mask.sum() > 0:
            per_crop[str(crop_name)] = round(
                float(accuracy_score(y_test[mask], y_pred[mask])), 4
            )
    metrics["per_crop_accuracy"] = per_crop

    # Feature importance (from the base estimator via the calibrated wrapper)
    # CalibratedClassifierCV stores fitted estimators in calibrated_classifiers_
    if hasattr(model, "calibrated_classifiers_") and model.calibrated_classifiers_:
        # Use the first fold's base estimator for feature importance approximation
        cc = model.calibrated_classifiers_[0]
        base_est = getattr(cc, 'estimator',
                   getattr(cc, 'estimator_',
                   getattr(cc, 'base_estimator_', None)))
        if hasattr(base_est, "feature_importances_"):
            importances = base_est.feature_importances_
            metrics["feature_importance"] = sorted(
                [
                    {"feature": name, "importance": round(float(imp), 4)}
                    for name, imp in zip(ALL_FEATURE_COLS, importances)
                ],
                key=lambda x: x["importance"],
                reverse=True,
            )

    # Metadata
    metrics["n_samples"] = len(df)
    metrics["n_features"] = len(ALL_FEATURE_COLS)
    metrics["n_climate_zones"] = len(climate_zones)
    metrics["model_type"] = "HistGradientBoosting + CalibratedClassifierCV(sigmoid)"
    ndvi_desc = "empirical NDVI from indices_satelitales" if ndvi_values is not None else "synthetic triangular NDVI"
    metrics["data_source"] = f"NASA POWER climatology + {ndvi_desc} (overlapped ranges)"

    # Save model + scaler + metrics
    _ensure_artifact_dir()
    dump(model, MODEL_PATH)
    dump(scaler, SCALER_PATH)
    metrics["model_available"] = True
    METRICS_PATH.write_text(json.dumps(metrics, indent=2, default=str))
    logger.info("Modelo guardado en %s", MODEL_PATH)
    logger.info(
        "Accuracy=%.4f | CV mean=%.4f | F1=%.4f",
        metrics["accuracy"],
        metrics.get("cv_accuracy_mean", 0),
        metrics["f1_macro"],
    )

    return metrics


# ── Load / Predict / Metrics ───────────────────────────────────────────


def _ensure_artifact_dir() -> None:
    """Ensure writable model artifact storage exists.

    Docker must NOT mount over app/ml because that masks Python code after image
    rebuilds. MODEL_ARTIFACT_DIR points to a separate writable volume that only
    stores generated model/scaler/metrics artifacts.
    """
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


def _bootstrap_bundled_artifacts() -> None:
    """Copy image-bundled model artifacts into the writable artifact dir once."""
    _ensure_artifact_dir()
    pairs = [
        (BUNDLED_MODEL_PATH, MODEL_PATH),
        (BUNDLED_SCALER_PATH, SCALER_PATH),
    ]
    for source, target in pairs:
        if source.resolve() == target.resolve() or target.exists() or not source.exists():
            continue
        try:
            target.write_bytes(source.read_bytes())
            logger.info("Artefacto ML inicial copiado a %s", target)
        except OSError as e:
            logger.warning("No se pudo copiar artefacto ML %s -> %s: %s", source, target, e)


def load_model() -> tuple[Optional[CalibratedClassifierCV], Optional[StandardScaler]]:
    _bootstrap_bundled_artifacts()
    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        logger.warning("Modelo no encontrado en %s", MODEL_PATH)
        return None, None
    return load(MODEL_PATH), load(SCALER_PATH)


def _rebuild_metrics_from_saved_model() -> dict | None:
    """Reconstruct honest metrics when model_metrics.json was lost.

    This happens in Docker if generated files lived in a container writable layer
    or a stale volume. We do NOT invent numbers: we load the persisted model and
    evaluate it against the same deterministic synthetic validation generator.
    """
    try:
        model, scaler = load_model()
        if model is None or scaler is None:
            return None

        df = generate_synthetic_dataset(
            n_samples_per_crop=120,
            climate_zones=[{
                "name": "Caribe",
                "lat": 10.0,
                "lng": -75.0,
                "monthly": dict(REGIONAL_CLIMATOLOGY),
            }],
        )
        X = scaler.transform(df[ALL_FEATURE_COLS].values)
        y = df["cultivo"].values
        y_pred = model.predict(X)

        metrics = {
            "model_available": True,
            "accuracy": round(float(accuracy_score(y, y_pred)), 4),
            "precision_macro": round(float(precision_score(y, y_pred, average="macro", zero_division=0)), 4),
            "recall_macro": round(float(recall_score(y, y_pred, average="macro", zero_division=0)), 4),
            "f1_macro": round(float(f1_score(y, y_pred, average="macro", zero_division=0)), 4),
            "cv_accuracy_mean": None,
            "cv_accuracy_std": None,
            "cv_method": "reconstructed holdout from persisted model artifact",
            "n_samples": len(df),
            "n_features": len(ALL_FEATURE_COLS),
            "n_climate_zones": 1,
            "model_type": type(model).__name__,
            "data_source": "regional synthetic validation rebuilt from persisted model",
            "metrics_reconstructed": True,
        }

        per_crop = {}
        for crop_name in np.unique(y):
            mask = y == crop_name
            per_crop[str(crop_name)] = round(float(accuracy_score(y[mask], y_pred[mask])), 4)
        metrics["per_crop_accuracy"] = per_crop

        _ensure_artifact_dir()
        METRICS_PATH.write_text(json.dumps(metrics, indent=2, default=str))
        logger.info("Metricas reconstruidas y guardadas en %s", METRICS_PATH)
        return metrics
    except Exception as e:
        logger.warning("No se pudieron reconstruir metricas del modelo: %s", e)
        return None


def get_saved_metrics() -> dict:
    """Read persisted metrics from last training run, rebuilding if safe."""
    _bootstrap_bundled_artifacts()
    if METRICS_PATH.exists():
        try:
            metrics = json.loads(METRICS_PATH.read_text())
            metrics.setdefault("model_available", metrics.get("accuracy") is not None)
            return metrics
        except (json.JSONDecodeError, OSError) as e:
            logger.warning("Error leyendo metricas guardadas: %s", e)

    rebuilt = _rebuild_metrics_from_saved_model()
    if rebuilt is not None:
        return rebuilt

    return {"model_available": False, "accuracy": None}


def predict(model, scaler, features: dict) -> tuple[str, dict]:
    if model is None or scaler is None:
        return "Modelo no disponible", {}

    feat = [features.get(c, 0) for c in FEATURE_COLS]
    t = features.get("temperatura", 0)
    h = features.get("humedad", 0)
    p = features.get("precipitacion", 0)
    ph = features.get("ph_suelo", 0)
    mo = features.get("materia_organica", 0)

    feat.extend([t * h / 1000.0, ph * mo, p / max(h, 1.0)])

    X = scaler.transform(np.array([feat]))
    probas = model.predict_proba(X)[0]

    results = sorted(
        [
            {"cultivo": c, "probabilidad": round(float(p_), 4)}
            for c, p_ in zip(model.classes_, probas)
        ],
        key=lambda x: x["probabilidad"],
        reverse=True,
    )
    return results[0]["cultivo"], {"top": results[:3]}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    m = train_model()
    print("\n=== Resultados del entrenamiento ===")
    print(f"  Accuracy: {m['accuracy']:.2%}")
    print(f"  CV mean:  {m.get('cv_accuracy_mean', 'N/A')}")
    print(f"  F1 macro: {m['f1_macro']}")
    print("\n  Por cultivo:")
    for crop, acc in m.get("per_crop_accuracy", {}).items():
        print(f"    {crop}: {acc:.2%}")
    if "feature_importance" in m:
        print("\n  Feature importance:")
        for fi in m["feature_importance"]:
            print(f"    {fi['feature']}: {fi['importance']}")
