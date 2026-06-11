import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import httpx

from app.core.dependencies import get_db
from app.models.analisis import Analisis
from app.schemas.analisis import (
    AnalyzeRequest,
    AnalyzeResponse,
    RecomendacionCultivo,
    FeedbackRequest,
)
from app.services.climate_service import get_climate_data, get_mock_climate, get_climate_anomaly
from app.services.satellite_service import get_satellite_data
from app.services.recommendation import generate_recommendations
from app.services.foliar_service import get_foliar_profile, diagnose_nutrient_gaps
from app.services.eva_service import get_harvest_forecast, get_production_trends

logger = logging.getLogger(__name__)

ELEVATION_API_URL = "https://api.open-meteo.com/v1/elevation"


async def _fetch_elevation(lat: float, lng: float) -> float:
    """Fetch elevation in meters from Open-Meteo Elevation API.
    Falls back to 0.0 if API is unreachable.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                ELEVATION_API_URL,
                params={"latitude": lat, "longitude": lng},
            )
            resp.raise_for_status()
            data = resp.json()
            return float(data.get("elevation", [0.0])[0])
    except Exception as e:
        logger.warning("Elevation API fallo para (%.4f, %.4f): %s. Usando 0.0", lat, lng, e)
        return 0.0


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

    anomaly = await get_climate_anomaly(body.lat, body.lng)

    elevation = await _fetch_elevation(body.lat, body.lng)

    try:
        recommendations = await generate_recommendations(
            climate=climate,
            satellite=satellite,
            ph_suelo=body.ph_suelo,
            materia_organica=body.materia_organica,
            textura_suelo=body.textura_suelo,
            tipo_suelo=body.tipo_suelo,
            mes_siembra=body.mes_siembra,
            anomaly=anomaly.model_dump() if anomaly is not None else None,
            altitud=elevation,
            calcio=body.calcio,
            magnesio=body.magnesio,
            azufre=body.azufre,
            boro=body.boro,
            sodio=body.sodio,
            fosforo=body.fosforo,
            potasio=body.potasio,
            cic=body.cic,
            conductividad=body.conductividad,
        )
    except Exception:
        logger.exception("Error en motor de recomendacion")
        recommendations = []

    analysis_id = ""
    ana = None
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
        await db.commit()
        analysis_id = str(ana.id)[:8].upper()
    except Exception:
        logger.exception("Error guardando analisis")

    return AnalyzeResponse(
        clima=climate,
        indicadores_satelite=satellite,
        recomendaciones=recommendations,
        anomalia=anomaly,
        ubicacion={"lat": body.lat, "lng": body.lng},
        es_mock=es_mock,
        id=analysis_id,
    )


from sqlalchemy import cast, String
import uuid

analysis_router = APIRouter(prefix="/analysis", tags=["analisis"])


@analysis_router.get("/studio-data")
async def get_studio_data(
    cultivo: str = Query(..., description="Crop name"),
    depto: str | None = Query(None, description="Department (optional)"),
    area_ha: float | None = Query(None, description="Area in hectares for production estimate"),
):
    """Return harvest forecast + foliar profile for the Studio Panel."""
    result: dict = {"cultivo": cultivo, "depto": depto}
    result["harvest"] = get_harvest_forecast(cultivo, depto, area_ha) or None
    result["production_trend"] = get_production_trends(cultivo, depto, last_n_years=5)
    foliar = get_foliar_profile(cultivo, depto)
    result["foliar"] = foliar if foliar else None
    return result


@analysis_router.get("/{id}")
async def get_analysis_by_id(id: str, db: AsyncSession = Depends(get_db)):
    query = select(Analisis)
    if len(id) == 8:
        query = query.where(cast(Analisis.id, String).like(f"{id.lower()}%"))
    else:
        try:
            uid = uuid.UUID(id)
            query = query.where(Analisis.id == uid)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de analisis invalido")

    result = await db.execute(query)
    ana = result.scalars().first()
    if not ana:
        raise HTTPException(status_code=404, detail="Analisis no encontrado")

    datos = ana.datos_formulario or {}
    return {
        "id": str(ana.id)[:8].upper(),
        "lat": ana.lat,
        "lng": ana.lng,
        "municipio": datos.get("municipio", ""),
        "departamento": datos.get("departamento", ""),
        "tipo_suelo": datos.get("tipo_suelo") or datos.get("textura_suelo") or "",
        "ph_suelo": datos.get("ph_suelo") or datos.get("ph"),
        "materia_organica": datos.get("materia_organica"),
        "textura_suelo": datos.get("textura_suelo"),
        "mes_siembra": datos.get("mes_siembra"),
        "cultivo": ana.cultivo_recomendado,
        "score": ana.score,
        "tipo": ana.tipo,
        "fecha": ana.created_at.isoformat() if ana.created_at else "",
    }


@analysis_router.put("/{id}/feedback")
async def set_analysis_feedback(
    id: str,
    body: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """Record feedback (success/failure and real yield) for an analysis."""
    query = select(Analisis)
    if len(id) == 8:
        query = query.where(cast(Analisis.id, String).like(f"{id.lower()}%"))
    else:
        try:
            uid = uuid.UUID(id)
            query = query.where(Analisis.id == uid)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de analisis invalido")

    result = await db.execute(query)
    ana = result.scalars().first()
    if not ana:
        raise HTTPException(status_code=404, detail="Analisis no encontrado")

    ana.exito = body.exito
    if body.rendimiento_real is not None:
        ana.rendimiento_real = body.rendimiento_real

    await db.flush()
    return {
        "success": True,
        "message": "Feedback registrado correctamente",
        "id": str(ana.id)[:8].upper(),
        "exito": ana.exito,
        "rendimiento_real": ana.rendimiento_real,
    }



