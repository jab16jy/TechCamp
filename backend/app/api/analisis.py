import uuid
import random
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.analisis import Analisis
from app.schemas.analisis import (
    AnalyzeRequest,
    AnalyzeResponse,
    ClimateData,
    SatelliteData,
    RecomendacionCultivo,
)
from app.services.climate_service import get_climate_data, get_mock_climate
from app.services.satellite_service import get_satellite_data, get_mock_satellite

router = APIRouter(prefix="/analyze-location", tags=["analisis"])

MOCK_RECOMMENDATIONS = [
    {
        "cultivo": "Maíz",
        "score": 86,
        "riesgo": "medio",
        "justificacion": "Las condiciones de temperatura (29.1°C) y precipitación (74.5 mm) son adecuadas para el desarrollo del maíz. El pH del suelo (6.5) está en el rango óptimo.",
        "emoji": "🌽",
        "ciclo_dias": 90,
        "rendimiento_estimado": "4.2 t/ha",
    },
    {
        "cultivo": "Yuca",
        "score": 74,
        "riesgo": "bajo",
        "justificacion": "La yuca es altamente tolerante a las condiciones actuales. El suelo franco-arcilloso favorece el desarrollo radicular.",
        "emoji": "🥔",
        "ciclo_dias": 270,
        "rendimiento_estimado": "12.5 t/ha",
    },
    {
        "cultivo": "Arroz",
        "score": 62,
        "riesgo": "alto",
        "justificacion": "El arroz requiere alta disponibilidad hídrica. Con acceso a riego, las condiciones son favorables pero con riesgo moderado.",
        "emoji": "🍚",
        "ciclo_dias": 120,
        "rendimiento_estimado": "5.8 t/ha",
    },
]


def _score_from_location(lat: float, lng: float) -> list[dict]:
    base_score = 50 + int((lat % 10) * 3) + int(abs(lng % 10) * 2)
    base_score = min(base_score, 98)

    recommendations = []
    for i, rec in enumerate(MOCK_RECOMMENDATIONS):
        adjusted = rec.copy()
        adjusted["score"] = min(base_score + (2 - i) * 5 + random.randint(-3, 3), 98)
        recommendations.append(adjusted)
    return recommendations


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

    recommendations = _score_from_location(body.lat, body.lng)

    try:
        ana = Analisis(
            municipio_id=None,
            tipo="simple" if body.area_hectareas < 10 else "advanced",
            datos_formulario=body.model_dump(),
            resultado_completo={
                "clima": climate.model_dump(),
                "satelite": satellite.model_dump(),
                "recomendaciones": recommendations,
            },
            lat=body.lat,
            lng=body.lng,
            cultivo_recomendado=recommendations[0]["cultivo"] if recommendations else None,
            score=recommendations[0]["score"] if recommendations else None,
        )
        db.add(ana)
        await db.flush()
    except Exception:
        pass

    return AnalyzeResponse(
        clima=climate,
        indicadores_satelite=satellite,
        recomendaciones=[RecomendacionCultivo(**r) for r in recommendations],
        ubicacion={"lat": body.lat, "lng": body.lng},
        es_mock=es_mock,
    )
