import csv
import json
import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

CSV_PATH = Path(__file__).parent / "crops_requirements.csv"


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
                        "emoji": row["emoji"],
                        "ciclo_dias": int(row["ciclo_dias"]),
                        "rendimiento_promedio": row["rendimiento_promedio"],
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


_crop_classifier: CropClassifier | None = None


def get_crop_classifier() -> CropClassifier:
    global _crop_classifier
    if _crop_classifier is None:
        _crop_classifier = CropClassifier()
    return _crop_classifier
