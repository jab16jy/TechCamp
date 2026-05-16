from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.clima import ClimateData
from app.services.climate_service import get_climate_data, get_mock_climate
from app.services.satellite_service import get_satellite_data, get_mock_satellite

router = APIRouter(prefix="/climate", tags=["clima"])


@router.get("", response_model=ClimateData)
async def get_climate(
    lat: float = Query(...),
    lng: float = Query(...),
):
    climate = await get_climate_data(lat, lng)
    if climate.temperatura == 0.0 and climate.precipitacion == 0.0:
        return get_mock_climate()
    return climate
