from fastapi import APIRouter, Query

from app.schemas.analisis import SatelliteData

router = APIRouter(prefix="/satellite-indicators", tags=["satelite"])


@router.get("", response_model=SatelliteData)
async def get_satellite_indicators(lat: float = Query(...), lng: float = Query(...)):
    return SatelliteData(
        ndvi=0.42,
        ndwi=0.18,
        calidad_suelo="Media-Alta",
        cobertura_nube=12,
    )
