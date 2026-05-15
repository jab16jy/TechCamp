from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.analisis import SatelliteData
from app.services.satellite_service import get_satellite_data, get_mock_satellite

router = APIRouter(prefix="/satellite-indicators", tags=["satelite"])


@router.get("", response_model=SatelliteData)
async def get_satellite_indicators(
    lat: float = Query(...),
    lng: float = Query(...),
    db: AsyncSession = Depends(get_db),
):
    return await get_satellite_data(db, lat, lng)
