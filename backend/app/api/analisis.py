import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.analisis import Analisis
from app.schemas.analisis import (
    AnalyzeRequest,
    AnalyzeResponse,
    RecomendacionCultivo,
)
from app.services.climate_service import get_climate_data, get_mock_climate
from app.services.satellite_service import get_satellite_data
from app.services.recommendation import generate_recommendations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze-location", tags=["analisis"])


@router.post("", response_model=AnalyzeResponse)
async def analyze_location(
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    climate = await get_climate_data(body.lat, body.lng)
    if climate.temperatura == 0.0 and climate.precipitacion == 0.0:
        climate = get_mock_climate()
        es_mock = True
    else:
        es_mock = False

    satellite = await get_satellite_data(db, body.lat, body.lng)

    try:
        recommendations = await generate_recommendations(
            climate=climate,
            satellite=satellite,
            ph_suelo=body.ph_suelo,
            materia_organica=body.materia_organica,
            textura_suelo=body.textura_suelo,
            tipo_suelo=body.tipo_suelo,
            mes_siembra=body.mes_siembra,
        )
    except Exception:
        logger.exception("Error en motor de recomendacion")
        recommendations = []

    try:
        ana = Analisis(
            municipio_id=None,
            tipo="simple" if body.area_hectareas < 10 else "advanced",
            datos_formulario=body.model_dump(),
            resultado_completo={
                "clima": climate.model_dump(),
                "satelite": satellite.model_dump(),
                "recomendaciones": [r.model_dump() for r in recommendations],
            },
            lat=body.lat,
            lng=body.lng,
            cultivo_recomendado=recommendations[0].cultivo if recommendations else None,
            score=recommendations[0].score if recommendations else None,
        )
        db.add(ana)
        await db.flush()
    except Exception:
        logger.exception("Error guardando analisis")
        pass

    return AnalyzeResponse(
        clima=climate,
        indicadores_satelite=satellite,
        recomendaciones=recommendations,
        ubicacion={"lat": body.lat, "lng": body.lng},
        es_mock=es_mock,
    )
