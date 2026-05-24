import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.irrigation import (
    IrrigationPlanRequest,
    IrrigationPlanResponse,
    TaskCreateRequest,
    TaskResponse,
    ThresholdsResponse,
    CropThreshold,
)
from app.services import irrigation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/irrigation-plans", tags=["irrigation"])


@router.post("", response_model=IrrigationPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_irrigation_plan(
    body: IrrigationPlanRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        sensor_uuid = uuid.UUID(body.sensor_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de sensor invalido",
        )

    result = await irrigation_service.generar_plan(
        sensor_uuid=sensor_uuid,
        db=db,
        cultivo=body.cultivo,
        analysis_id=body.analysis_id,
    )

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )

    return result


@router.get("/{plan_id}", response_model=IrrigationPlanResponse)
async def get_irrigation_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        plan_uuid = uuid.UUID(plan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de plan invalido",
        )

    from sqlalchemy import select
    from app.models.plan_riego import PlanRiego

    plan = await db.get(PlanRiego, plan_uuid)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan de riego no encontrado",
        )

    return {
        "plan_id": str(plan.id),
        "sensor_id": str(plan.sensor_id) if plan.sensor_id else "",
        "sensor_nodo": "",
        "cultivo": plan.cultivo,
        "humedad_actual": plan.humedad_actual,
        "umbral_cultivo": plan.umbral_humedad,
        "prob_lluvia_7d": plan.prob_lluvia_7d,
        "prob_lluvia_14d": plan.prob_lluvia_14d,
        "riesgo": "critico" if plan.humedad_actual < plan.umbral_humedad else "moderado",
        "volumen_total_m3_ha": plan.volumen_agua_m3_ha,
        "frecuencia_dias": plan.frecuencia_dias,
        "horario_optimo": plan.horario_optimo,
        "ventana_inicio": plan.ventana_inicio.strftime("%d %b %Y"),
        "ventana_fin": plan.ventana_fin.strftime("%d %b %Y"),
        "eventos": [],
        "justificacion_xai": plan.justificacion_xai,
        "textura_suelo": plan.textura_suelo,
        "et0_mm_dia": plan.et0_mm_dia,
        "temperatura_media": plan.temperatura_media,
        "coordenadas": None,
    }


@router.get("/thresholds", response_model=ThresholdsResponse)
async def get_crop_thresholds():
    umbrales = await irrigation_service.get_umbrales()
    return {"cultivos": umbrales}
