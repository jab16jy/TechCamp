import csv
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from joblib import dump, load

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "crop_model_rf.joblib"
SCALER_PATH = Path(__file__).parent / "crop_scaler.joblib"
CSV_PATH = Path(__file__).parent / "crops_requirements.csv"

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

# Mapeo de texturas a valores ordinales (centro del espectro USDA)
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


def _triangular_sample(lo: float, hi: float, mode_pct: float = 0.5) -> float:
    """Genera una muestra con distribucion triangular centrada en el optimo.

    mode_pct: posicion del modo dentro del rango [lo, hi], 0.5 = centro.
    """
    mode = lo + (hi - lo) * mode_pct
    return np.random.triangular(lo, mode, hi)


def _add_gaussian_noise(value: float, range_span: float, noise_pct: float = 0.05) -> float:
    """Agrega ruido gaussiano realista proporcional al rango de la variable."""
    std = range_span * noise_pct
    noise = np.random.normal(0, std)
    return value + noise


def generate_synthetic_dataset(n_samples_per_crop: int = 1000) -> pd.DataFrame:
    """Genera dataset sintetico con distribucion triangular + ruido gaussiano.

    Aumenta de 200 a 1000 muestras por cultivo para mejorar la precision del modelo.
    """
    crops_df = pd.read_csv(CSV_PATH)
    rows = []

    for _, crop in crops_df.iterrows():
        temp_range = crop["temp_max"] - crop["temp_min"]
        hum_range = crop["humedad_max"] - crop["humedad_min"]
        prec_range = crop["precipitacion_max"] - crop["precipitacion_min"]
        ph_range = crop["ph_max"] - crop["ph_min"]
        mo_range = 2.5

        # Textura optima del cultivo con variacion realista
        tex_opt = TEXTURE_MAP.get(crop["textura_optima"], 7)

        for _ in range(n_samples_per_crop):
            # Distribucion triangular centrada en el optimo
            temp = _triangular_sample(crop["temp_min"], crop["temp_max"], 0.5)
            hum = _triangular_sample(crop["humedad_min"], crop["humedad_max"], 0.5)
            prec = _triangular_sample(crop["precipitacion_min"], crop["precipitacion_max"], 0.5)
            ph = _triangular_sample(crop["ph_min"], crop["ph_max"], 0.5)

            # Materia organica
            mo_center = max(crop["materia_organica_min"], 1.5)
            mo_lo = max(0.5, mo_center - 1.5)
            mo_hi = mo_center + 2.0
            mo = _triangular_sample(mo_lo, mo_hi, 0.45)

            # NDVI
            ndvi = _triangular_sample(0.2, 0.9, 0.48)

            # Textura: centrada en la optima del cultivo con desviacion gaussiana
            textura_encoded = tex_opt + np.random.normal(0, 1.8)
            textura_encoded = max(1.0, min(12.0, textura_encoded))

            # Ruido gaussiano controlado
            temp = _add_gaussian_noise(temp, temp_range, 0.05)
            hum = _add_gaussian_noise(hum, hum_range, 0.05)
            prec = _add_gaussian_noise(prec, prec_range, 0.05)
            ph = _add_gaussian_noise(ph, ph_range, 0.04)
            mo = _add_gaussian_noise(mo, mo_range, 0.06)
            ndvi = _add_gaussian_noise(ndvi, 0.7, 0.05)
            textura_encoded = _add_gaussian_noise(textura_encoded, 5.0, 0.08)

            # Feature engineering: interacciones
            temp_hum_interaction = temp * hum / 1000.0
            ph_mo_interaction = ph * mo
            precip_hum_ratio = prec / max(hum, 1.0)

            rows.append({
                "temperatura": round(temp, 2),
                "humedad": round(hum, 2),
                "precipitacion": round(prec, 1),
                "ph_suelo": round(ph, 2),
                "materia_organica": round(mo, 2),
                "ndvi": round(ndvi, 3),
                "textura_encoded": round(textura_encoded, 2),
                "temp_hum_interaction": round(temp_hum_interaction, 3),
                "ph_mo_interaction": round(ph_mo_interaction, 3),
                "precip_hum_ratio": round(precip_hum_ratio, 3),
                "cultivo": crop["cultivo"],
            })

    return pd.DataFrame(rows)


def train_model(
    n_samples_per_crop: int = 1000,
    test_size: float = 0.2,
    random_state: int = 42,
) -> dict:
    logger.info("Generando dataset sintetico de entrenamiento (triangular + gaussian noise)...")
    df = generate_synthetic_dataset(n_samples_per_crop)
    logger.info(f"Dataset generado: {len(df)} muestras, {len(ALL_FEATURE_COLS)} features")

    X = df[ALL_FEATURE_COLS].values
    y = df["cultivo"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # HistGradientBoosting: mas rapido que GradientBoosting clasico, buen accuracy
    model = HistGradientBoostingClassifier(
        max_iter=300,
        max_depth=6,
        learning_rate=0.1,
        random_state=random_state,
    )
    logger.info("Entrenando HistGradientBoosting (max_iter=300, max_depth=6)...")
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision_macro": round(precision_score(y_test, y_pred, average="macro", zero_division=0), 4),
        "recall_macro": round(recall_score(y_test, y_pred, average="macro", zero_division=0), 4),
        "f1_macro": round(f1_score(y_test, y_pred, average="macro", zero_division=0), 4),
    }

    # Validacion cruzada estratificada con 5 folds
    logger.info("Ejecutando validacion cruzada (5-fold)...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    cv_scores = cross_val_score(model, scaler.transform(X), y, cv=skf, scoring="accuracy")
    metrics["cv_accuracy_mean"] = round(cv_scores.mean(), 4)
    metrics["cv_accuracy_std"] = round(cv_scores.std(), 4)
    metrics["cv_scores"] = [round(s, 4) for s in cv_scores]

    # Feature importance (solo disponible en RF/GB tradicional, no en HistGB)
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feature_importance = sorted(
            [(name, round(imp, 4)) for name, imp in zip(ALL_FEATURE_COLS, importances)],
            key=lambda x: x[1],
            reverse=True,
        )
        metrics["feature_importance"] = feature_importance

    dump(model, MODEL_PATH)
    dump(scaler, SCALER_PATH)
    logger.info(f"Modelo guardado en {MODEL_PATH}")
    logger.info(f"Metricas: {metrics}")

    return metrics


def load_model() -> tuple[Optional[HistGradientBoostingClassifier], Optional[StandardScaler]]:
    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        logger.warning("Modelo no encontrado. Ejecuta train_model() primero.")
        return None, None
    model = load(MODEL_PATH)
    scaler = load(SCALER_PATH)
    return model, scaler


def predict(model, scaler, features: dict) -> tuple[str, dict]:
    if model is None or scaler is None:
        return "Modelo no disponible", {}

    # Construir vector con features originales + engineered
    feat_vector = []
    for col in FEATURE_COLS:
        feat_vector.append(features.get(col, 0))

    # Calcular interacciones
    temp = features.get("temperatura", 0)
    hum = features.get("humedad", 0)
    prec = features.get("precipitacion", 0)
    ph = features.get("ph_suelo", 0)
    mo = features.get("materia_organica", 0)

    feat_vector.extend([
        temp * hum / 1000.0,
        ph * mo,
        prec / max(hum, 1.0),
    ])

    X = np.array([feat_vector])
    X_scaled = scaler.transform(X)

    probas = model.predict_proba(X_scaled)[0]
    classes = model.classes_

    results = sorted(
        [{"cultivo": c, "probabilidad": round(float(p), 4)} for c, p in zip(classes, probas)],
        key=lambda x: x["probabilidad"],
        reverse=True,
    )

    return results[0]["cultivo"], {"top": results[:3]}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    metrics = train_model()
    print(f"\nResultados del entrenamiento:")
    for k, v in metrics.items():
        if k == "feature_importance":
            print(f"  {k}:")
            for name, imp in v:
                print(f"    {name}: {imp}")
        else:
            print(f"  {k}: {v}")
