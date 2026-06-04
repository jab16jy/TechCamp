import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, desc
from sqlalchemy.sql import func

from app.models.indice_satelital import IndiceSatelital
from app.schemas.satelite import SatelliteData

logger = logging.getLogger(__name__)


async def get_satellite_data(
    db: AsyncSession, lat: float, lng: float
) -> SatelliteData:
    """Busca el punto NDVI/NDWI más cercano, prefiriendo el más reciente.

    Primero encuentra el punto geográficamente más cercano, y si hay
    múltiples mediciones para ese punto (series temporales), devuelve
    la más reciente (por fecha o created_at).
    """
    try:
        point_wkt = f"POINT({lng} {lat})"
        # Encontrar el ID del punto más cercano con ST_Distance
        query = (
            select(IndiceSatelital)
            .order_by(
                func.ST_Distance(
                    IndiceSatelital.ubicacion,
                    func.ST_GeomFromText(point_wkt, 4326),
                ),
                # Si hay múltiples lecturas del mismo punto, la más reciente
                desc(IndiceSatelital.fecha),
                desc(IndiceSatelital.created_at),
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
    except Exception as e:
        logger.warning(f"Error consultando datos satelitales: {e}")

    return get_mock_satellite()


def get_mock_satellite() -> SatelliteData:
    return SatelliteData(
        ndvi=0.42,
        ndwi=0.18,
        calidad_suelo="Media-Alta",
        cobertura_nube=12,
    )
