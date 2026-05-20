from fastapi import APIRouter, Query, HTTPException, status

from app.services.soil_service import get_soil_data

router = APIRouter(prefix="/soil", tags=["soil"])


@router.get("/data")
async def soil_data(
    lat: float = Query(..., ge=-90, le=90, description="Latitud"),
    lng: float = Query(..., ge=-180, le=180, description="Longitud"),
):
    data = await get_soil_data(lat, lng)
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudieron obtener datos de suelo desde ISRIC SoilGrids. Intente mas tarde.",
        )
    return data
