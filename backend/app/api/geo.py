import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func

from app.core.dependencies import get_db
from app.models.municipio import Municipio
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/geo", tags=["geo"])


class GeoDecodeRequest(BaseModel):
    lat: float
    lng: float


class GeoDecodeResponse(BaseModel):
    departamento: str | None = None
    municipio: str | None = None
    municipio_id: int | None = None
    detectado: bool = False


@router.post("/decode", response_model=GeoDecodeResponse)
async def geo_decode(
    body: GeoDecodeRequest,
    db: AsyncSession = Depends(get_db),
):
    if not (-90 <= body.lat <= 90) or not (-180 <= body.lng <= 180):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordenadas fuera de rango valido",
        )

    try:
        point_wkt = f"POINT({body.lng} {body.lat})"
        query = (
            select(
                Municipio.id,
                Municipio.nombre,
                Municipio.departamento,
            )
            .where(
                func.ST_Contains(
                    Municipio.geometry,
                    func.ST_GeomFromText(point_wkt, 4326),
                )
            )
            .limit(1)
        )
        result = await db.execute(query)
        row = result.one_or_none()

        if row is None:
            return GeoDecodeResponse(detectado=False)

        return GeoDecodeResponse(
            departamento=row.departamento,
            municipio=row.nombre,
            municipio_id=row.id,
            detectado=True,
        )
    except Exception as e:
        logger.warning(f"Geo decode fallback: {e}")
        return GeoDecodeResponse(detectado=False)
