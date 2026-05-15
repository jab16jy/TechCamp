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

MOCK_CLIMATE = ClimateData(
    temperatura=29.1,
    precipitacion=74.5,
    humedad=77,
    evapotranspiracion=5.2,
    radiacion_solar=18.4,
)

MOCK_SATELLITE = SatelliteData(
    ndvi=0.42,
    ndwi=0.18,
    calidad_suelo="Media-Alta",
    cobertura_nube=12,
)


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
    recommendations = _score_from_location(body.lat, body.lng)

    try:
        ana = Analisis(
            municipio_id=None,
            tipo="simple" if body.area_hectareas < 10 else "advanced",
            datos_formulario=body.model_dump(),
            resultado_completo={
                "clima": MOCK_CLIMATE.model_dump(),
                "satelite": MOCK_SATELLITE.model_dump(),
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
        clima=MOCK_CLIMATE,
        indicadores_satelite=MOCK_SATELLITE,
        recomendaciones=[RecomendacionCultivo(**r) for r in recommendations],
        ubicacion={"lat": body.lat, "lng": body.lng},
        es_mock=True,
    )
