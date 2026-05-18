from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import get_settings
from app.schemas.clima import ClimateData

settings = get_settings()


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
