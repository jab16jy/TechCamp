from fastapi import APIRouter, Query

from app.schemas.analisis import ClimateData

router = APIRouter(prefix="/climate", tags=["clima"])


@router.get("", response_model=ClimateData)
async def get_climate(lat: float = Query(...), lng: float = Query(...)):
    return ClimateData(
        temperatura=29.1,
        precipitacion=74.5,
        humedad=77,
        evapotranspiracion=5.2,
        radiacion_solar=18.4,
    )
