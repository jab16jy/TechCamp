import httpx
from app.core.config import get_settings
from app.schemas.clima import ClimateData

settings = get_settings()


async def get_climate_data(lat: float, lng: float) -> ClimateData:
    url = f"{settings.OPENMETEO_BASE_URL}/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation",
        "timezone": "America/Bogota",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            current = data.get("current", {})

            return ClimateData(
                temperatura=current.get("temperature_2m", 0.0),
                precipitacion=current.get("precipitation", 0.0),
                humedad=current.get("relative_humidity_2m", 0.0),
                radiacion_solar=current.get("shortwave_radiation", 0.0),
            )
        except Exception:
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
