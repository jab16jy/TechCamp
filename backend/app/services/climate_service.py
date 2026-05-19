import logging
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import get_settings
from app.schemas.clima import ClimateData, AnomaliaClimatica

logger = logging.getLogger(__name__)
settings = get_settings()

NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"

MONTH_ABBR = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4,
    "MAY": 5, "JUN": 6, "JUL": 7, "AUG": 8,
    "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}


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
            upper = month_str.upper()
            if upper in MONTH_ABBR:
                month_num = MONTH_ABBR[upper]
            else:
                try:
                    month_num = int(month_str[:2]) if len(month_str) >= 2 else int(month_str)
                except (ValueError, TypeError):
                    continue
            monthly[param][month_num] = float(val)
    return monthly


async def get_climate_anomaly(lat: float, lng: float) -> AnomaliaClimatica | None:
    nasa_data = await fetch_nasa_climatology(lat, lng)
    climatology = _monthly_climatology_from_nasa(nasa_data)
    current_month = datetime.now(timezone.utc).month

    current = ClimateData(temperatura=0, precipitacion=0, humedad=0, radiacion_solar=0)
    url = f"{settings.OPENMETEO_BASE_URL}/forecast"
    params = {
        "latitude": lat, "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation",
        "timezone": "America/Bogota",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            c = resp.json().get("current", {})
            current = ClimateData(
                temperatura=c.get("temperature_2m", 28.0),
                precipitacion=c.get("precipitation", 0.0),
                humedad=c.get("relative_humidity_2m", 75.0),
                radiacion_solar=c.get("shortwave_radiation", 18.0),
            )
        except Exception:
            return None

    hist_temp = climatology.get("T2M", {}).get(current_month, current.temperatura)
    hist_prec = climatology.get("PRECTOTCORR", {}).get(current_month, current.precipitacion)
    hist_hum = climatology.get("RH2M", {}).get(current_month, current.humedad)

    return AnomaliaClimatica(
        temperatura_actual=round(current.temperatura, 1),
        temperatura_historica=round(hist_temp, 1),
        anomalia_temperatura=round(current.temperatura - hist_temp, 1),
        precipitacion_actual=round(current.precipitacion, 1),
        precipitacion_historica=round(hist_prec, 1),
        anomalia_precipitacion=round(current.precipitacion - hist_prec, 1),
        humedad_actual=round(current.humedad, 1),
        humedad_historica=round(hist_hum, 1),
        anomalia_humedad=round(current.humedad - hist_hum, 1),
        fuente="NASA POWER" if nasa_data else "Climatologia regional Caribe",
    )


async def get_climate_data(lat: float, lng: float) -> ClimateData:
    today = datetime.now(timezone.utc)
    start = today - timedelta(days=30)

    url = f"{settings.OPENMETEO_BASE_URL}/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": "temperature_2m_mean,precipitation_sum,shortwave_radiation_sum",
        "hourly": "relative_humidity_2m",
        "start_date": start.strftime("%Y-%m-%d"),
        "end_date": today.strftime("%Y-%m-%d"),
        "timezone": "America/Bogota",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            daily = data.get("daily", {})
            hourly = data.get("hourly", {})

            temps = [t for t in daily.get("temperature_2m_mean", []) if t is not None]
            precips = [p for p in daily.get("precipitation_sum", []) if p is not None]
            rads = [r for r in daily.get("shortwave_radiation_sum", []) if r is not None]
            hums = [h for h in hourly.get("relative_humidity_2m", []) if h is not None]

            if not temps:
                return _zero_climate()

            temperatura = round(sum(temps) / len(temps), 1)
            precipitacion = round(sum(precips), 1) if precips else 0.0
            humedad = round(sum(hums) / len(hums), 1) if hums else 0.0
            radiacion = round(sum(rads) / len(rads), 1) if rads else 0.0

            return ClimateData(
                temperatura=temperatura,
                precipitacion=precipitacion,
                humedad=humedad,
                radiacion_solar=radiacion,
            )
        except Exception:
            return _zero_climate()


def _zero_climate() -> ClimateData:
    return ClimateData(
        temperatura=0.0,
        precipitacion=0.0,
        humedad=0.0,
        radiacion_solar=0.0,
    )


def get_mock_climate() -> ClimateData:
    return ClimateData(
        temperatura=29.1,
        precipitacion=74.5,
        humedad=77,
        evapotranspiracion=5.2,
        radiacion_solar=18.4,
    )
