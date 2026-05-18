import logging
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

import httpx
import numpy as np

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"


async def fetch_nasa_climatology(lat: float, lng: float) -> dict | None:
    params = {
        "parameters": "T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN",
        "community": "AG",
        "longitude": lng,
        "latitude": lat,
        "format": "JSON",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(NASA_POWER_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            return data.get("properties", {}).get("parameter", {})
        except Exception as e:
            logger.warning(f"NASA POWER unavailable: {e}")
            return None


async def fetch_current_climate(lat: float, lng: float) -> dict:
    url = f"{settings.OPENMETEO_BASE_URL}/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation",
        "timezone": "America/Bogota",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            current = data.get("current", {})
            return {
                "temperatura": current.get("temperature_2m", 28.0),
                "humedad": current.get("relative_humidity_2m", 75.0),
                "precipitacion": current.get("precipitation", 80.0),
                "radiacion_solar": current.get("shortwave_radiation", 18.0),
            }
        except Exception:
            return {"temperatura": 28.0, "humedad": 75.0, "precipitacion": 80.0, "radiacion_solar": 18.0}


def _monthly_climatology_from_nasa(nasa_data: dict | None) -> dict:
    monthly = {}
    if nasa_data is None:
        monthly = {
            "T2M": {1: 28.5, 2: 28.7, 3: 28.9, 4: 28.9, 5: 28.5, 6: 28.1,
                    7: 28.0, 8: 28.0, 9: 27.8, 10: 27.7, 11: 28.0, 12: 28.3},
            "PRECTOTCORR": {1: 5, 2: 8, 3: 15, 4: 50, 5: 120, 6: 100,
                           7: 90, 8: 110, 9: 140, 10: 160, 11: 100, 12: 25},
            "RH2M": {1: 72, 2: 70, 3: 69, 4: 72, 5: 78, 6: 80,
                     7: 79, 8: 80, 9: 82, 10: 83, 11: 81, 12: 76},
            "ALLSKY_SFC_SW_DWN": {1: 5.0, 2: 5.5, 3: 5.8, 4: 5.5, 5: 5.0, 6: 4.8,
                                  7: 5.0, 8: 4.8, 9: 4.5, 10: 4.3, 11: 4.5, 12: 4.8},
        }
        return monthly

    for param, values in nasa_data.items():
        monthly[param] = {}
        for month_str, val in values.items():
            month_num = int(month_str[:2]) if len(month_str) >= 2 else int(month_str)
            monthly[param][month_num] = float(val)
    return monthly


def _ndvi_estimate(month: int, base_ndvi: float = 0.42, precipitacion: float = 80) -> float:
    precip_factor = min(1.2, max(0.7, precipitacion / 100.0))
    if 4 <= month <= 11:
        precip_factor += 0.1
    ndvi = base_ndvi * precip_factor * (0.95 + np.random.default_rng(42 + month).random() * 0.1)
    return round(min(0.95, max(0.15, ndvi)), 2)


async def project_6_months(lat: float, lng: float, ph_suelo: float = 6.5,
                           materia_organica: float = 3.0, textura_suelo: str = "Franco",
                           tipo_suelo: str = "Franco-Arcilloso") -> dict:
    from app.ml.model import get_crop_classifier

    nasa_data = await fetch_nasa_climatology(lat, lng)
    climatology = _monthly_climatology_from_nasa(nasa_data)
    current = await fetch_current_climate(lat, lng)

    now = datetime.now(timezone.utc)
    current_month = now.month
    current_temp = current["temperatura"]
    current_hum = current["humedad"]
    current_prec = current["precipitacion"]

    hist_temp = climatology.get("T2M", {}).get(current_month, current_temp)
    hist_prec = climatology.get("PRECTOTCORR", {}).get(current_month, current_prec)
    hist_hum = climatology.get("RH2M", {}).get(current_month, current_hum)

    temp_anomaly = current_temp - hist_temp if hist_temp else 0
    prec_anomaly = current_prec - hist_prec if hist_prec else 0
    hum_anomaly = current_hum - hist_hum if hist_hum else 0

    classifier = get_crop_classifier()
    months = []
    best_score = 0
    best_month = None
    best_crop = None

    mes_labels = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
        5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
        9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
    }

    for i in range(6):
        future = now + relativedelta(months=i + 1)
        m = future.month
        y = future.year

        proj_temp = climatology.get("T2M", {}).get(m, 28.5) + temp_anomaly * (0.8 ** (i + 1))
        proj_prec = climatology.get("PRECTOTCORR", {}).get(m, 80) + prec_anomaly * (0.7 ** (i + 1))
        proj_hum = climatology.get("RH2M", {}).get(m, 75) + hum_anomaly * (0.8 ** (i + 1))
        proj_rad = climatology.get("ALLSKY_SFC_SW_DWN", {}).get(m, 5.0)

        proj_prec = max(0, proj_prec)
        proj_hum = min(98, max(30, proj_hum))

        ndvi = _ndvi_estimate(m, 0.42, proj_prec)

        scores = classifier.score(
            temperatura=proj_temp,
            humedad=proj_hum,
            precipitacion=proj_prec,
            ph_suelo=ph_suelo,
            materia_organica=materia_organica,
            ndvi=ndvi,
            textura_suelo=textura_suelo,
            tipo_suelo=tipo_suelo,
        )

        month_entry = {
            "month": mes_labels.get(m, "Desconocido"),
            "year": y,
            "month_num": m,
            "temperatura": round(proj_temp, 1),
            "precipitacion": round(proj_prec, 1),
            "humedad": round(proj_hum, 1),
            "ndvi_estimado": ndvi,
            "radiacion_solar": round(proj_rad, 1) if proj_rad else None,
            "cultivos_recomendados": [
                {"cultivo": s["cultivo"], "score": s["score"], "riesgo": s["riesgo"], "emoji": s["emoji"]}
                for s in scores
            ],
        }
        months.append(month_entry)

        if scores and scores[0]["score"] > best_score:
            best_score = scores[0]["score"]
            best_month = mes_labels.get(m)
            best_crop = scores[0]["cultivo"]

    return {
        "ubicacion": {"lat": lat, "lng": lng},
        "meses": months,
        "mejor_mes": best_month,
        "mejor_cultivo": best_crop,
        "fuente": "NASA POWER + OpenMeteo" if nasa_data else "Datos historicos del Caribe + OpenMeteo",
    }
