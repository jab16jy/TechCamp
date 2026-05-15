import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from sqlalchemy.sql import func

from app.models.indice_satelital import IndiceSatelital
from app.schemas.analisis import SatelliteData

logger = logging.getLogger(__name__)


async def get_satellite_data(
    db: AsyncSession, lat: float, lng: float
) -> SatelliteData:
    try:
        point_wkt = f"POINT({lng} {lat})"
        query = (
            select(IndiceSatelital)
            .order_by(
                func.ST_Distance(
                    IndiceSatelital.ubicacion,
                    func.ST_GeomFromText(point_wkt, 4326),
                )
            )
            .limit(1)
        )
        result = await db.execute(query)
        nearest = result.scalars().first()

        if nearest:
            return SatelliteData(
                ndvi=nearest.ndvi or 0.42,
                ndwi=nearest.ndwi or 0.18,
                calidad_suelo=nearest.calidad_suelo or "Media-Alta",
                cobertura_nube=nearest.cobertura_nube or 12,
            )
    except Exception:
        pass

    return get_mock_satellite()


def get_mock_satellite() -> SatelliteData:
    return SatelliteData(
        ndvi=0.42,
        ndwi=0.18,
        calidad_suelo="Media-Alta",
        cobertura_nube=12,
    )
