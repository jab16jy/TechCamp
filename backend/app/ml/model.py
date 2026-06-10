import csv
import json
import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

CSV_PATH = Path(__file__).parent / "crops_requirements.csv"

SCORING_FACTORS = [
    # Environmental factors (weighted proportionally, total ~0.68)
    {"column": "temperatura", "weight": 0.15, "range": None},
    {"column": "humedad", "weight": 0.10, "range": None},
    {"column": "precipitacion", "weight": 0.14, "range": None},
    {"column": "ph_suelo", "weight": 0.10, "range": None},
    {"column": "materia_organica", "weight": 0.07, "range": None},
    {"column": "ndvi", "weight": 0.04, "range": None},
    {"column": "tipo_suelo", "weight": 0.07, "range": None},
    # Agronomic factors (total ~0.32)
    {"column": "drought_tolerance", "weight": 0.06, "range": [0, 1]},
    {"column": "photoperiod_hours", "weight": 0.06, "range": [0, 14]},
    {"column": "soil_depth_cm", "weight": 0.05, "range": [20, 100]},
    {"column": "kc_value", "weight": 0.04, "range": [0.8, 1.3]},
    {"column": "salinity_ds_per_m", "weight": 0.05, "range": [0, 8]},
    {"column": "is_c4", "weight": 0.06, "range": [0, 1]},
]
# Total weight: 0.15 + 0.10 + 0.14 + 0.10 + 0.07 + 0.04 + 0.07 + 0.06 + 0.06 + 0.05 + 0.04 + 0.05 + 0.06 = 0.99


class CropClassifier:
    def __init__(self):
        self.crops: list[dict] = []
        self._load_requirements()

    def _load_requirements(self):
        if not CSV_PATH.exists():
            logger.warning("crops_requirements.csv no encontrado")
            return
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.crops.append(
                    {
                        "cultivo": row["cultivo"],
                        "temp_min": float(row["temp_min"]),
                        "temp_max": float(row["temp_max"]),
                        "ph_min": float(row["ph_min"]),
                        "ph_max": float(row["ph_max"]),
                        "humedad_min": float(row["humedad_min"]),
                        "humedad_max": float(row["humedad_max"]),
                        "precipitacion_min": float(row["precipitacion_min"]),
                        "precipitacion_max": float(row["precipitacion_max"]),
                        "tipo_suelo": row["tipo_suelo"].split(";"),
                        "textura_optima": row["textura_optima"],
                        "materia_organica_min": float(row["materia_organica_min"]),
                        "altitud_min": float(row["altitud_min"]),
                        "altitud_max": float(row["altitud_max"]),
                        "emoji": row["emoji"],
                        "ciclo_dias": int(row["ciclo_dias"]),
                        "rendimiento_promedio": row["rendimiento_promedio"],
                        # Agronomic features
                        "drought_tolerance": float(row.get("drought_tolerance", 0.5)),
                        "photoperiod_hours": float(row.get("photoperiod_hours", 0)),
                        "soil_depth_cm": float(row.get("soil_depth_cm", 50)),
                        "kc_value": float(row.get("kc_value", 1.0)),
                        "salinity_ds_per_m": float(row.get("salinity_ds_per_m", 0)),
                        "is_c4": int(row.get("is_c4", 0)),
                    }
                )
        logger.info(f"Cargados {len(self.crops)} cultivos desde crops_requirements.csv")

    @staticmethod
    def _is_in_range(value: float, lo: float, hi: float) -> float:
        if value < lo:
            return 0.0
        if value > hi:
            return 0.0
        center = (lo + hi) / 2.0
        span = (hi - lo) / 2.0
        if span == 0:
            return 1.0
        return max(0.0, 1.0 - abs(value - center) / span)

    def score(
        self,
        temperatura: float,
        humedad: float,
        precipitacion: float,
        ph_suelo: float,
        materia_organica: float,
        ndvi: float,
        textura_suelo: str = "",
        tipo_suelo: str = "",
        mes_siembra: str = "",
    ) -> list[dict]:
        results = []
        for crop in self.crops:
            s_temp = self._is_in_range(temperatura, crop["temp_min"], crop["temp_max"])
            s_hum = self._is_in_range(humedad, crop["humedad_min"], crop["humedad_max"])
            s_prec = self._is_in_range(precipitacion, crop["precipitacion_min"], crop["precipitacion_max"])
            s_ph = self._is_in_range(ph_suelo, crop["ph_min"], crop["ph_max"])
            s_mo = 1.0 if materia_organica >= crop["materia_organica_min"] else materia_organica / max(crop["materia_organica_min"], 0.001)
            s_suelo = 1.0
            if tipo_suelo and tipo_suelo not in crop["tipo_suelo"]:
                s_suelo = 0.3
            s_ndvi = min(1.0, max(0.2, ndvi / 0.5)) if ndvi > 0 else 0.5

            weights = {"temp": 0.25, "hum": 0.15, "prec": 0.20, "ph": 0.15, "mo": 0.10, "suelo": 0.10, "ndvi": 0.05}
            total = (
                s_temp * weights["temp"]
                + s_hum * weights["hum"]
                + s_prec * weights["prec"]
                + s_ph * weights["ph"]
                + s_mo * weights["mo"]
                + s_suelo * weights["suelo"]
                + s_ndvi * weights["ndvi"]
            )
            score = int(min(98, max(10, total * 100)))

            riesgo = "bajo" if score >= 80 else ("medio" if score >= 55 else "alto")

            justificacion_parts = []
            if s_temp < 0.5:
                justificacion_parts.append(f"temperatura fuera del rango optimo ({crop['temp_min']}-{crop['temp_max']}°C)")
            if s_prec < 0.5:
                justificacion_parts.append("precipitacion insuficiente")
            if s_ph < 0.5:
                justificacion_parts.append(f"pH fuera del rango ({crop['ph_min']}-{crop['ph_max']})")
            justificacion = (
                f"Las condiciones son favorables para {crop['cultivo'].replace('_', ' ')}."
                if score >= 70
                else f"Condiciones regulares para {crop['cultivo'].replace('_', ' ')}."
            )
            if justificacion_parts:
                justificacion += " " + "; ".join(justificacion_parts) + "."

            results.append(
                {
                    "cultivo": crop["cultivo"].replace("_", " "),
                    "score": score,
                    "riesgo": riesgo,
                    "justificacion": justificacion,
                    "emoji": crop["emoji"],
                    "ciclo_dias": crop["ciclo_dias"],
                    "rendimiento_estimado": f"{crop['rendimiento_promedio']} t/ha",
                }
            )

        results.sort(key=lambda r: r["score"], reverse=True)
        return results[:3]

    def score_with_factors(
        self,
        temperatura: float,
        humedad: float,
        precipitacion: float,
        ph_suelo: float,
        materia_organica: float,
        ndvi: float,
        textura_suelo: str = "",
        tipo_suelo: str = "",
        mes_siembra: str = "",
    ) -> list[dict]:
        results = []
        # Build parameter map for environmental scoring
        env_params = {
            "temperatura": temperatura,
            "humedad": humedad,
            "precipitacion": precipitacion,
            "ph_suelo": ph_suelo,
            "materia_organica": materia_organica,
            "ndvi": ndvi,
        }

        for crop in self.crops:
            raw_scores = {}
            contributions = {}
            total_contrib = 0.0
            factor_weights = []
            justificacion_parts = []

            for factor in SCORING_FACTORS:
                col = factor["column"]
                weight = factor["weight"]
                rng = factor["range"]

                if col in env_params:
                    # Environmental factor — score measurement against crop range
                    # Map column names to crop dict keys (they differ in some cases)
                    crop_min_key = {"temperatura": "temp_min", "ph_suelo": "ph_min"}.get(col, f"{col}_min")
                    crop_max_key = {"temperatura": "temp_max", "ph_suelo": "ph_max"}.get(col, f"{col}_max")
                    val = env_params[col]
                    if col == "materia_organica":
                        s = 1.0 if val >= crop["materia_organica_min"] else val / max(crop["materia_organica_min"], 0.001)
                    elif col == "ndvi":
                        s = min(1.0, max(0.2, ndvi / 0.5)) if ndvi > 0 else 0.5
                    else:
                        s = self._is_in_range(val, crop[crop_min_key], crop[crop_max_key])
                    label = {"temperatura": "Temperatura", "humedad": "Humedad",
                             "precipitacion": "Precipitacion", "ph_suelo": "pH del Suelo",
                             "materia_organica": "Materia Organica", "ndvi": "NDVI"}.get(col, col)
                elif col in crop:
                    # Agronomic factor — score crop's constant against global range
                    val = crop[col]
                    if col == "tipo_suelo":
                        s = 1.0
                        if tipo_suelo and tipo_suelo not in crop["tipo_suelo"]:
                            s = 0.3
                        label = "Tipo de Suelo"
                    elif rng is not None and rng[1] > rng[0]:
                        # Normalize crop's constant value within global range
                        s = max(0.0, min(1.0, (val - rng[0]) / (rng[1] - rng[0])))
                        label = col.replace("_", " ").title()
                    else:
                        s = float(val)
                        label = col.replace("_", " ").title()
                else:
                    continue

                raw_scores[col] = s
                contrib = s * weight
                contributions[col] = contrib
                total_contrib += contrib

                if s < 0.5:
                    if col == "temperatura":
                        justificacion_parts.append(
                            f"temperatura fuera del rango optimo ({crop['temp_min']}-{crop['temp_max']}°C)"
                        )
                    elif col == "precipitacion":
                        justificacion_parts.append("precipitacion insuficiente")
                    elif col == "ph_suelo":
                        justificacion_parts.append(f"pH fuera del rango ({crop['ph_min']}-{crop['ph_max']})")

                factor_weights.append({
                    "factor": label,
                    "peso": weight,
                    "score_parcial": round(float(s), 3),
                    "porcentaje_impacto": 0.0,  # computed after loop
                })

            # Compute impact percentages
            factor_sum = sum(contributions.values()) or 0.001
            for fw in factor_weights:
                col_key = {"Temperatura": "temperatura", "Humedad": "humedad",
                           "Precipitacion": "precipitacion", "pH del Suelo": "ph_suelo",
                           "Materia Organica": "materia_organica", "NDVI": "ndvi",
                           "Tipo de Suelo": "tipo_suelo"}.get(fw["factor"])
                if col_key is None:
                    col_key = fw["factor"].lower().replace(" ", "_")
                contrib = contributions.get(col_key, 0)
                fw["porcentaje_impacto"] = round(contrib / factor_sum * 100, 1)

            score = int(min(98, max(10, total_contrib * 100)))
            riesgo = "bajo" if score >= 80 else ("medio" if score >= 55 else "alto")

            justificacion = (
                f"Las condiciones son favorables para {crop['cultivo'].replace('_', ' ')}."
                if score >= 70
                else f"Condiciones regulares para {crop['cultivo'].replace('_', ' ')}."
            )
            if justificacion_parts:
                justificacion += " " + "; ".join(justificacion_parts) + "."

            results.append({
                "cultivo": crop["cultivo"].replace("_", " "),
                "score": score,
                "riesgo": riesgo,
                "justificacion": justificacion,
                "emoji": crop["emoji"],
                "ciclo_dias": crop["ciclo_dias"],
                "rendimiento_estimado": f"{crop['rendimiento_promedio']} t/ha",
                "factor_weights": factor_weights,
            })

        results.sort(key=lambda r: r["score"], reverse=True)
        return results[:3]


_crop_classifier: CropClassifier | None = None


def get_crop_classifier() -> CropClassifier:
    global _crop_classifier
    if _crop_classifier is None:
        _crop_classifier = CropClassifier()
    return _crop_classifier
