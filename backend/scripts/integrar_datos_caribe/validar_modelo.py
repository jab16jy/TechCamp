#!/usr/bin/env python3
"""
F5: validar_modelo.py — Validate ML model against real EVA observations.

Pipeline:
  1. Load trained model (CalibratedClassifierCV) and StandardScaler from joblib
  2. Load EVA Caribe, filter to 10 prioritized crops, remove rend=0
  3. Assign climate by department (NASA POWER annual climatology per CARIBBEAN_POINT)
  4. Build 12-feature vectors matching the original training feature engineering
  5. Run batch inference (predict + predict_proba)
  6. Calculate Top-1, Top-3, per-crop metrics, confusion matrix
  7. Compare against synthetic accuracy (~87%)
  8. Save resultados_validacion.json + reporte_validacion_modelo.md

Feature order (12 features, from original training.py ALL_FEATURE_COLS):
    temperatura, humedad, precipitacion, ph_suelo, materia_organica,
    ndvi, textura_encoded, altitud,
    temp_hum_interaction (= temp * hum / 1000),
    ph_mo_interaction (= ph * mo),
    precip_hum_ratio (= precip / max(hum, 1)),
    precip_temp_ratio (= precip / max(temp, 0.1))
"""

import json
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from joblib import load
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parents[2]  # backend/
DATA_DIR = BASE_DIR.parent / "data" / "caribe"
ML_DIR = BASE_DIR / "app" / "ml"

MODEL_PATH = ML_DIR / "crop_model_rf.joblib"
SCALER_PATH = ML_DIR / "crop_scaler.joblib"
EVA_PATH = DATA_DIR / "eva_caribe.csv"
PERFILES_PATH = DATA_DIR / "perfiles_cultivo_reales.csv"
REQUIREMENTS_PATH = ML_DIR / "crops_requirements.csv"

OUTPUT_JSON = DATA_DIR / "resultados_validacion.json"
OUTPUT_REPORT = DATA_DIR / "reporte_validacion_modelo.md"

# ── Constants ──────────────────────────────────────────────────────────

# Model class order from training.py line 114-116
CLASSES = [
    "Maíz", "Yuca", "Arroz", "Frijol", "Ñame",
    "Plátano", "Cacao", "Algodón", "Sorgo", "Palma_Aceitera",
]

# EVA _cultivo_norm → model class name mapping
CROP_MAP = {
    "Maíz": "Maíz",
    "Yuca": "Yuca",
    "Arroz": "Arroz",
    "Frijol": "Frijol",
    "Ñame": "Ñame",
    "Plátano": "Plátano",
    "Cacao": "Cacao",
    "Algodón": "Algodón",
    "Sorgo": "Sorgo",
    "Palma": "Palma_Aceitera",
}

# Department → CARIBBEAN_POINT mapping (from design.md D1)
DEPT_POINTS = {
    "ATLANTICO":   {"name": "Barranquilla", "lat": 10.9685, "lng": -74.7813},
    "BOLIVAR":     {"name": "Cartagena",    "lat": 10.3997, "lng": -75.5144},
    "CESAR":       {"name": "Valledupar",   "lat": 10.4631, "lng": -73.2532},
    "CORDOBA":     {"name": "Monteria",     "lat": 8.7578,  "lng": -75.8814},
    "LA GUAJIRA":  {"name": "Riohacha",     "lat": 11.5444, "lng": -72.9072},
    "MAGDALENA":   {"name": "Santa Marta",  "lat": 11.2408, "lng": -74.1990},
    "SUCRE":       {"name": "Sincelejo",    "lat": 9.3047,  "lng": -75.3978},
}

# Annual climatology prefetched from NASA POWER climatology API
# (T2M annual mean °C, PRECTOTCORR annual total mm, RH2M annual mean %)
# Elevations from Open-Meteo Elevation API
ANNUAL_CLIMATE = {
    "Barranquilla": {"temp": 27.80, "precip": 1126.2, "hum": 80.22, "elevation": 21.0},
    "Cartagena":    {"temp": 28.09, "precip": 1370.4, "hum": 79.93, "elevation": 25.0},
    "Santa Marta":  {"temp": 27.28, "precip": 847.6,  "hum": 76.17, "elevation": 10.0},
    "Monteria":     {"temp": 27.91, "precip": 1327.1, "hum": 79.19, "elevation": 19.0},
    "Valledupar":   {"temp": 22.83, "precip": 717.9,  "hum": 76.00, "elevation": 169.0},
    "Sincelejo":    {"temp": 28.07, "precip": 1430.2, "hum": 79.19, "elevation": 209.0},
    "Riohacha":     {"temp": 27.38, "precip": 930.4,  "hum": 78.63, "elevation": 7.0},
}

# Texture encoding from training.py TEXTURE_MAP
TEXTURE_MAP = {
    "Arcilloso": 1, "Arcillo-Arenoso": 2, "Arcillo-Limoso": 3,
    "Franco-Arcilloso": 4, "Franco-Arcillo-Limoso": 5,
    "Franco-Arcillo-Arenoso": 6, "Franco": 7, "Franco-Limoso": 8,
    "Franco-Arenoso": 9, "Limoso": 10, "Areno-Francoso": 11, "Arenoso": 12,
}

# Synthetic accuracy reference from model_metrics.json
SYNTHETIC_ACCURACY = 0.8701

# Per-crop synthetic accuracy for gap analysis
SYNTHETIC_PER_CROP = {
    "Maíz": 69.36, "Yuca": 78.06, "Arroz": 84.10, "Frijol": 87.83,
    "Ñame": 91.55, "Plátano": 99.15, "Cacao": 98.18, "Algodón": 96.26,
    "Sorgo": 77.99, "Palma_Aceitera": 99.92,
}

# Feature order (from original training.py)
FEATURE_NAMES = [
    "temperatura", "humedad", "precipitacion", "ph_suelo",
    "materia_organica", "ndvi", "textura_encoded", "altitud",
    "temp_hum_interaction", "ph_mo_interaction",
    "precip_hum_ratio", "precip_temp_ratio",
]


# ── Helpers ────────────────────────────────────────────────────────────

def load_perfiles(path: Path) -> dict:
    """Load real profiles CSV → {cultivo_modelo: {ph, mo}}.
    
    CSV uses EVA crop names (e.g. "Palma"); we alias to model class names
    (e.g. "Palma_Aceitera") for lookups.
    """
    # Map from CSV crop name → model class name when they differ
    PROFILE_NAME_MAP = {
        "Palma": "Palma_Aceitera",
    }

    df = pd.read_csv(path)
    profiles = {}
    for _, row in df.iterrows():
        key = PROFILE_NAME_MAP.get(row["cultivo"], row["cultivo"])
        profiles[key] = {
            "ph": float(row["ph_promedio"]),
            "mo": float(row["mo_promedio"]),
        }
    return profiles


def load_texture_map(path: Path) -> dict:
    """Load crops_requirements.csv → {cultivo: texture_encoded}."""
    df = pd.read_csv(path)
    textures = {}
    for _, row in df.iterrows():
        tex_name = row["textura_optima"]
        textures[row["cultivo"]] = TEXTURE_MAP.get(tex_name, 7)
    return textures


def build_feature_vector(
    clima: dict, ph: float, mo: float, textura: float
) -> list[float]:
    """Build the 12-feature vector matching original training feature engineering.
    
    Feature engineering formulas (from training.py commit before d265808):
        temp_hum_interaction = temp * hum / 1000.0
        ph_mo_interaction    = ph * mo
        precip_hum_ratio     = precip / max(hum, 1.0)
        precip_temp_ratio    = precip / max(temp, 0.1)
    """
    temp = clima["temp"]
    hum = clima["hum"]
    precip = clima["precip"]
    altitud = clima["elevation"]
    ndvi = 0.5  # default regional NDVI (EVA does not have spectral data)

    temp_hum_interaction = temp * hum / 1000.0
    ph_mo_interaction = ph * mo
    precip_hum_ratio = precip / max(hum, 1.0)
    precip_temp_ratio = precip / max(temp, 0.1)

    return [
        round(temp, 2),
        round(hum, 2),
        round(precip, 1),
        round(ph, 2),
        round(mo, 2),
        round(ndvi, 3),
        round(textura, 2),
        round(altitud, 1),
        round(temp_hum_interaction, 3),
        round(ph_mo_interaction, 3),
        round(precip_hum_ratio, 3),
        round(precip_temp_ratio, 3),
    ]


# ── Main Pipeline ──────────────────────────────────────────────────────

def main() -> dict:
    logger.info("=" * 60)
    logger.info("F5: Validación del modelo ML contra EVA Caribe")
    logger.info("=" * 60)

    # ── Step 1: Load model + scaler ──────────────────────────────────
    logger.info("[1/7] Cargando modelo y scaler...")
    for p, label in [(MODEL_PATH, "Modelo"), (SCALER_PATH, "Scaler")]:
        if not p.exists():
            logger.error("%s no encontrado: %s", label, p)
            sys.exit(1)

    model = load(MODEL_PATH)
    scaler = load(SCALER_PATH)
    logger.info("  Modelo: %s | %d clases", type(model).__name__, len(model.classes_))
    logger.info("  Scaler: %s | %d features", type(scaler).__name__, scaler.n_features_in_)

    # ── Step 2: Load and filter EVA Caribe ───────────────────────────
    logger.info("[2/7] Cargando EVA Caribe...")
    if not EVA_PATH.exists():
        logger.error("EVA Caribe no encontrado: %s", EVA_PATH)
        sys.exit(1)

    eva = pd.read_csv(EVA_PATH)
    logger.info("  Total registros EVA Caribe: %d", len(eva))

    # Filter to only rows with a valid normalized crop name
    eva = eva[eva["_cultivo_norm"].notna()].copy()

    # Filter to our 10 prioritized crops
    valid_crops = set(CROP_MAP.keys())
    eva = eva[eva["_cultivo_norm"].isin(valid_crops)].copy()
    eva["cultivo_modelo"] = eva["_cultivo_norm"].map(CROP_MAP)
    logger.info("  Registros con cultivos priorizados: %d", len(eva))

    # Remove zero-rendimiento records (no-harvest)
    n_before = len(eva)
    eva = eva[eva["Rendimiento (t/ha)"] > 0].copy()
    n_rend_zero = n_before - len(eva)
    logger.info("  Excluidos por rend=0: %d", n_rend_zero)
    logger.info("  Registros para validacion: %d", len(eva))

    if len(eva) == 0:
        logger.error("No hay registros EVA con rendimiento > 0")
        sys.exit(1)

    # ── Step 3: Load profiles + textures ─────────────────────────────
    logger.info("[3/7] Cargando perfiles reales y texturas...")
    perfiles = load_perfiles(PERFILES_PATH)
    textures = load_texture_map(REQUIREMENTS_PATH)
    logger.info("  Perfiles cargados: %d cultivos", len(perfiles))
    logger.info("  Texturas cargadas: %d cultivos", len(textures))

    # ── Step 4: Build feature vectors ────────────────────────────────
    logger.info("[4/7] Construyendo vectores de features...")

    records = []          # list of dicts for each valid record
    skipped_no_dept = 0
    skipped_no_climate = 0
    skipped_no_soil = 0
    skipped_no_texture = 0

    for idx, row in eva.iterrows():
        dept = row["_depto_norm"]
        crop_model = row["cultivo_modelo"]

        # Get department climate point
        point = DEPT_POINTS.get(dept)
        if point is None:
            skipped_no_dept += 1
            continue

        clima = ANNUAL_CLIMATE.get(point["name"])
        if clima is None:
            skipped_no_climate += 1
            continue

        # Get soil data from real aggregated profiles
        soil = perfiles.get(crop_model)
        if soil is None:
            skipped_no_soil += 1
            continue

        # Get texture from crops_requirements (synthetic optimal)
        tex = textures.get(crop_model)
        if tex is None:
            skipped_no_texture += 1
            continue

        feat = build_feature_vector(clima, soil["ph"], soil["mo"], tex)
        records.append({
            "features": feat,
            "true_crop": crop_model,
            "department": dept,
            "municipio": row.get("Municipio", ""),
        })

    logger.info("  Vectores construidos: %d", len(records))
    logger.info("  Omitidos (sin dpto): %d", skipped_no_dept)
    logger.info("  Omitidos (sin clima): %d", skipped_no_climate)
    logger.info("  Omitidos (sin suelo): %d", skipped_no_soil)
    logger.info("  Omitidos (sin textura): %d", skipped_no_texture)

    if len(records) == 0:
        logger.error("No se pudo construir ningun vector de features")
        sys.exit(1)

    # ── Step 5: Batch inference ──────────────────────────────────────
    logger.info("[5/7] Ejecutando inferencia batch...")

    X = np.array([r["features"] for r in records], dtype=np.float64)
    y_true = np.array([r["true_crop"] for r in records])
    dept_list = [r["department"] for r in records]

    X_scaled = scaler.transform(X)
    y_pred = model.predict(X_scaled)
    y_proba = model.predict_proba(X_scaled)
    actual_classes = list(model.classes_)

    logger.info("  Predicciones: %d", len(y_pred))

    # ── Step 6: Calculate metrics ────────────────────────────────────
    logger.info("[6/7] Calculando metricas...")

    # Top-1 Accuracy
    top1_acc = accuracy_score(y_true, y_pred)

    # Top-3 Accuracy
    top3_indices = np.argsort(y_proba, axis=1)[:, -3:]
    class_to_idx = {c: i for i, c in enumerate(actual_classes)}
    top3_correct = sum(
        1 for i in range(len(y_true))
        if class_to_idx.get(y_true[i], -1) in top3_indices[i]
    )
    top3_acc = top3_correct / len(y_true)

    logger.info("  Top-1 Accuracy: %.4f (%.2f%%)", top1_acc, top1_acc * 100)
    logger.info("  Top-3 Accuracy: %.4f (%.2f%%)", top3_acc, top3_acc * 100)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred, labels=actual_classes)

    # Per-crop metrics
    per_crop = {}
    for crop_name in actual_classes:
        mask = y_true == crop_name
        n = int(mask.sum())
        if n == 0:
            continue
        ca = float(accuracy_score(y_true[mask], y_pred[mask]))
        # Top-3 per crop
        top3_crop = sum(
            1 for j in range(len(mask))
            if mask[j] and class_to_idx.get(y_true[j], -1) in top3_indices[j]
        )
        per_crop[crop_name] = {
            "n_records": n,
            "top1_accuracy": round(ca, 4),
            "top1_pct": round(ca * 100, 2),
            "top3_count": top3_crop,
            "top3_pct": round(top3_crop / n * 100, 2) if n > 0 else 0.0,
        }

    # Per-crop precision, recall, F1
    p, r, f1, s = precision_recall_fscore_support(
        y_true, y_pred, labels=actual_classes, zero_division=0
    )
    for i, crop_name in enumerate(actual_classes):
        if crop_name in per_crop:
            per_crop[crop_name]["precision"] = round(float(p[i]), 4)
            per_crop[crop_name]["recall"] = round(float(r[i]), 4)
            per_crop[crop_name]["f1"] = round(float(f1[i]), 4)

    # Top-3 global by crop (already computed above)

    # Accuracy by department
    dept_results = {}
    unique_depts = sorted(set(d for d in dept_list if d in DEPT_POINTS))
    for dept in unique_depts:
        dept_mask = np.array([d == dept for d in dept_list])
        n = int(dept_mask.sum())
        if n == 0:
            continue
        dept_acc = float(accuracy_score(y_true[dept_mask], y_pred[dept_mask]))
        dept_top3 = sum(
            1 for j in range(len(dept_mask))
            if dept_mask[j] and class_to_idx.get(y_true[j], -1) in top3_indices[j]
        )
        dept_results[dept] = {
            "n_records": n,
            "top1_accuracy": round(dept_acc, 4),
            "top1_pct": round(dept_acc * 100, 2),
            "top3_pct": round(dept_top3 / n * 100, 2) if n > 0 else 0.0,
        }

    # Gap analysis: synthetic vs real per crop
    gap_analysis = {}
    for crop in actual_classes:
        if crop not in SYNTHETIC_PER_CROP:
            continue
        ref_pct = SYNTHETIC_PER_CROP[crop]
        real_pct = per_crop.get(crop, {}).get("top1_pct", 0.0)
        gap_analysis[crop] = {
            "synthetic_accuracy_pct": ref_pct,
            "real_accuracy_pct": real_pct,
            "gap_pct": round(real_pct - ref_pct, 2),
        }

    # ── Step 7: Compile and save results ─────────────────────────────
    logger.info("[7/7] Guardando resultados y reporte...")

    results = {
        "model": "CalibratedClassifierCV(HistGradientBoostingClassifier, sigmoid)",
        "n_records_total": int(n_before + n_rend_zero),
        "n_records_filtered_10_crops": int(n_before),
        "n_records_excluded_rend_zero": n_rend_zero,
        "n_records_valid": len(records),
        "n_features": scaler.n_features_in_,
        "feature_names": FEATURE_NAMES,
        "synthetic_accuracy": SYNTHETIC_ACCURACY,
        "synthetic_accuracy_pct": round(SYNTHETIC_ACCURACY * 100, 2),
        "top1_accuracy": round(float(top1_acc), 4),
        "top1_accuracy_pct": round(float(top1_acc * 100), 2),
        "top3_accuracy": round(float(top3_acc), 4),
        "top3_accuracy_pct": round(float(top3_acc * 100), 2),
        "per_crop": per_crop,
        "confusion_matrix": {
            "labels": actual_classes,
            "matrix": [list(row) for row in cm.tolist()],
        },
        "department_accuracy": dept_results,
        "gap_analysis": gap_analysis,
        "precision_macro": round(float(np.mean(p)), 4),
        "recall_macro": round(float(np.mean(r)), 4),
        "f1_macro": round(float(np.mean(f1)), 4),
        "skipped_no_dept": skipped_no_dept,
        "skipped_no_climate": skipped_no_climate,
        "skipped_no_soil": skipped_no_soil,
        "skipped_no_texture": skipped_no_texture,
        "data_source": "EVA Caribe + NASA POWER annual climatology + perfiles reales por cultivo",
        "limitations": [
            "pH/MO assigned as per-crop averages from aggregated real profiles (partial circularity)",
            "NDVI fixed at 0.5 (no spectral data in EVA)",
            "Climate assigned by department, not by municipality",
            "Texture from synthetic optimal profile (crops_requirements.csv), not real texture data",
            "Altitude as department point elevation, not per-record topography",
            "Annual total precipitation, not intra-annual distribution",
        ],
    }

    # Write JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    logger.info("  JSON guardado: %s", OUTPUT_JSON)

    # ── Generate Markdown Report ─────────────────────────────────────
    report = []
    report.append("# Reporte de Validación: Modelo ML vs EVA Caribe")
    report.append("")
    report.append("## Resumen")
    report.append("")
    report.append(f"| Métrica | Valor real | Referencia sintética (87.01%) | Diferencia |")
    report.append(f"|---------|------------|------|")
    report.append(
        f"| **Top-1 Accuracy** | **{results['top1_accuracy_pct']:.2f}%** | 87.01% | "
        f"{results['top1_accuracy_pct'] - 87.01:+.2f}% |"
    )
    report.append(
        f"| **Top-3 Accuracy** | **{results['top3_accuracy_pct']:.2f}%** | 99.40% | "
        f"{results['top3_accuracy_pct'] - 99.40:+.2f}% |"
    )
    report.append(f"| Registros evaluados | {results['n_records_valid']:,} | 63,778 (sintéticos) | — |")
    report.append(f"| Registros excluidos (rend=0) | {results['n_records_excluded_rend_zero']:,} | — | — |")
    report.append(f"| Macro Precision | {results['precision_macro']:.4f} | 0.8761 | {results['precision_macro'] - 0.8761:+.4f} |")
    report.append(f"| Macro Recall | {results['recall_macro']:.4f} | 0.8824 | {results['recall_macro'] - 0.8824:+.4f} |")
    report.append(f"| Macro F1 | {results['f1_macro']:.4f} | 0.8779 | {results['f1_macro'] - 0.8779:+.4f} |")
    report.append("")

    # Accuracy by crop table
    report.append("## Accuracy por Cultivo")
    report.append("")
    report.append("| Cultivo | Top-1 | Top-3 | N registros | Precisión | Recall | F1 |")
    report.append("|---------|-------|-------|-------------|-----------|--------|-----|")
    for crop in actual_classes:
        cp = per_crop.get(crop)
        if cp is None:
            continue
        report.append(
            f"| {crop} | {cp['top1_pct']:.2f}% | {cp['top3_pct']:.2f}% | {cp['n_records']:,} | "
            f"{cp.get('precision', 0)*100:.2f}% | {cp.get('recall', 0)*100:.2f}% | {cp.get('f1', 0):.4f} |"
        )
    report.append("")

    # Confusion Matrix
    report.append("## Matriz de Confusión (10×10)")
    report.append("")
    header = "| Real \\ Pred | " + " | ".join(actual_classes) + " |"
    separator = "|" + "|".join(["---"] * (len(actual_classes) + 1)) + "|"
    report.append(header)
    report.append(separator)
    for i, crop in enumerate(actual_classes):
        row_vals = " | ".join(str(cm[i][j]) for j in range(len(actual_classes)))
        report.append(f"| **{crop}** | {row_vals} |")
    report.append("")

    # Department accuracy
    report.append("## Accuracy por Departamento")
    report.append("")
    report.append("| Departamento | Top-1 | Top-3 | N registros |")
    report.append("|-------------|-------|-------|-------------|")
    for dept in ["ATLANTICO", "BOLIVAR", "CESAR", "CORDOBA", "LA GUAJIRA", "MAGDALENA", "SUCRE"]:
        da = dept_results.get(dept)
        if da:
            report.append(f"| {dept} | {da['top1_pct']:.2f}% | {da['top3_pct']:.2f}% | {da['n_records']:,} |")
        else:
            report.append(f"| {dept} | — | — | 0 |")
    report.append("")

    # Gap analysis
    report.append("## Análisis de Brecha: Sintético vs Real")
    report.append("")
    report.append("| Cultivo | Sintético (%) | Real (%) | Brecha (pp) | Diagnóstico |")
    report.append("|---------|--------------|----------|-------------|-------------|")
    for crop in actual_classes:
        ga = gap_analysis.get(crop)
        if ga is None:
            continue
        gap = ga["gap_pct"]
        if gap >= 5:
            diag = "✅ Mejora significativa"
        elif gap >= -5:
            diag = "👌 Estable"
        elif gap >= -15:
            diag = "⚠️ Pérdida moderada"
        else:
            diag = "❌ Pérdida severa"
        report.append(
            f"| {crop} | {ga['synthetic_accuracy_pct']:.2f}% | {ga['real_accuracy_pct']:.2f}% | "
            f"{gap:+.2f} | {diag} |"
        )
    report.append("")

    # Issues found
    report.append("## Problemas Detectados")
    report.append("")
    report.append("| Cultivo | Problema | Impacto |")
    report.append("|---------|----------|---------|")

    # Identify worst performers
    worst_crops = sorted(
        [(c, cp) for c, cp in per_crop.items()],
        key=lambda x: x[1]["top1_pct"],
    )
    for crop, cp in worst_crops[:3]:
        report.append(f"| {crop} | Bajo Top-1 ({cp['top1_pct']:.2f}%) | Baja confiabilidad del modelo para este cultivo en condiciones Caribe |")

    for crop in ["Cacao", "Plátano", "Palma_Aceitera"]:
        if crop in per_crop:
            ga = gap_analysis.get(crop)
            if ga and ga["gap_pct"] < -15:
                report.append(
                    f"| {crop} | MO sintética muy superior a real | Sobreestimación de viabilidad en suelos Caribe |"
                )

    report.append("")

    # Conclusion
    report.append("## Conclusión")
    report.append("")

    if results["top1_accuracy_pct"] >= 70:
        report.append(
            f"La Top-1 Accuracy real ({results['top1_accuracy_pct']:.2f}%) es ≥ 70%. "
            "Los perfiles sintéticos son aceptables con ajustes menores (MO, rendimiento, drenaje). "
            "No se requiere reentrenamiento inmediato del modelo."
        )
    else:
        report.append(
            f"La Top-1 Accuracy real ({results['top1_accuracy_pct']:.2f}%) es < 70%. "
            "Se recomienda reentrenar el modelo con perfiles ajustados a datos reales del Caribe."
        )
    report.append("")

    report.append("## Limitaciones (documentadas)")
    report.append("")
    for lim in results["limitations"]:
        report.append(f"- {lim}")
    report.append("")

    report_text = "\n".join(report)

    with open(OUTPUT_REPORT, "w", encoding="utf-8") as f:
        f.write(report_text)
    logger.info("  Reporte markdown guardado: %s", OUTPUT_REPORT)

    # ── Summary ──────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("VALIDACION COMPLETADA")
    logger.info("  Top-1 Accuracy: %.2f%%", results["top1_accuracy_pct"])
    logger.info("  Top-3 Accuracy: %.2f%%", results["top3_accuracy_pct"])
    logger.info("  Registros validos: %d de %d", len(records), n_before)
    logger.info("=" * 60)

    return results


if __name__ == "__main__":
    main()
