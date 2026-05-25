import logging

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.dependencies import get_db
from app.models.analisis import Analisis
from app.schemas.predict import (
    PredictRequest, PredictResponse, OptimalDayRequest, OptimalDayResponse,
    MonthProjection, CropScore, FactorWeight, Alert, CICLOS_DIAS_MAP,
)
from app.services.prediction_service import project_window, _mes_siembra_to_num
from app.services.soil_service import get_soil_data
from app.services.satellite_service import get_satellite_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["predict"])


def _validate_coords(lat: float | None, lng: float | None) -> tuple[float, float]:
    if lat is None or lng is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere lat y lng o un analysis_id valido",
        )
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordenadas fuera de rango valido",
        )
    return lat, lng


async def _resolve_analysis(
    analysis_id: str | None,
    db: AsyncSession,
) -> dict | None:
    if not analysis_id:
        return None
    try:
        uid = UUID(analysis_id)
    except (ValueError, TypeError):
        logger.warning(f"analysis_id no es un UUID valido: {analysis_id}, usando defaults")
        return None
    except Exception:
        logger.warning(f"Error al consultar analysis_id {analysis_id}, usando defaults")
        return None

    try:
        result = await db.execute(select(Analisis).where(Analisis.id == uid))
        ana = result.scalar_one_or_none()
    except Exception:
        logger.warning(f"Error de DB al consultar analysis_id {analysis_id}, usando defaults")
        return None

    if ana is None:
        logger.info(f"analysis_id {analysis_id} no encontrado en DB, usando defaults")
        return None

    formulario = ana.datos_formulario or {}
    return {
        "lat": ana.lat,
        "lng": ana.lng,
        "cultivo_recomendado": ana.cultivo_recomendado,
        "score": ana.score,
        "ph_suelo": formulario.get("ph_suelo", 6.5),
        "materia_organica": formulario.get("materia_organica", 3.0),
        "textura_suelo": formulario.get("textura_suelo", "Franco"),
        "tipo_suelo": formulario.get("tipo_suelo", "Franco-Arcilloso"),
        "mes_siembra": formulario.get("mes_siembra"),
        "departamento": formulario.get("departamento"),
        "municipio": formulario.get("municipio"),
        "area_hectareas": formulario.get("area_hectareas"),
    }


@router.post("", response_model=PredictResponse)
async def predict_crops(
    body: PredictRequest,
    db: AsyncSession = Depends(get_db),
):
    analysis_data = await _resolve_analysis(body.analysis_id, db)

    if analysis_data:
        lat = analysis_data["lat"]
        lng = analysis_data["lng"]
        ph_suelo = analysis_data["ph_suelo"]
        materia_organica = analysis_data["materia_organica"]
        textura_suelo = analysis_data["textura_suelo"]
        tipo_suelo = analysis_data["tipo_suelo"]
        cultivo = body.cultivo or analysis_data["cultivo_recomendado"] or "Maiz"
        start_month = _mes_siembra_to_num(analysis_data.get("mes_siembra"))
        inherited = {
            "cultivo_recomendado": analysis_data["cultivo_recomendado"],
            "score": analysis_data["score"],
            "ph_suelo": ph_suelo,
            "materia_organica": materia_organica,
            "textura_suelo": textura_suelo,
            "mes_siembra": analysis_data["mes_siembra"],
            "departamento": analysis_data["departamento"],
            "municipio": analysis_data["municipio"],
            "area_hectareas": analysis_data["area_hectareas"],
            "analysis_id": body.analysis_id,
        }
    else:
        lat, lng = _validate_coords(body.lat, body.lng)
        cultivo = body.cultivo or "Maiz"

        # Obtener suelo real desde ISRIC SoilGrids si no hay analisis
        soil = await get_soil_data(lat, lng)
        if soil and soil.get("ph") is not None:
            ph_suelo = soil["ph"]
            materia_organica = soil.get("materia_organica", 3.0) or 3.0
            textura_suelo = soil.get("textura_suelo", "Franco") or "Franco"
            tipo_suelo = textura_suelo
            soil_source = soil.get("fuente", "ISRIC SoilGrids v2.0")
        else:
            ph_suelo = 6.5
            materia_organica = 3.0
            textura_suelo = "Franco"
            tipo_suelo = "Franco-Arcilloso"
            soil_source = "Default (sin datos ISRIC)"

        start_month = None
        inherited = None

    _validate_coords(lat, lng)

    # Obtener NDVI real desde la base de datos
    base_ndvi = 0.42  # fallback
    ndvi_source = "Sintetico (fallback)"
    try:
        satellite = await get_satellite_data(db, lat, lng)
        if satellite and satellite.ndvi is not None:
            base_ndvi = satellite.ndvi
            ndvi_source = "Sentinel-2 BD"
    except Exception:
        logger.warning("No se pudo obtener NDVI real desde la BD, usando sintetico")

    # Calcular datos fenologicos si se proporciona fecha_siembra
    dias_desde_siembra = body.dias_desde_siembra
    ciclo_dias = body.ciclo_dias
    if body.fecha_siembra and not dias_desde_siembra:
        from datetime import datetime, timezone
        try:
            siembra = datetime.fromisoformat(body.fecha_siembra.replace("Z", "+00:00"))
            dias_desde_siembra = max(0, (datetime.now(timezone.utc) - siembra).days)
        except (ValueError, AttributeError):
            dias_desde_siembra = None

    if not ciclo_dias and cultivo:
        ciclo_dias = CICLOS_DIAS_MAP.get(cultivo, CICLOS_DIAS_MAP.get("Maiz", 90))

    try:
        result = await project_window(
            lat=lat,
            lng=lng,
            start_month=start_month,
            n_months=body.meses,
            ph_suelo=ph_suelo,
            materia_organica=materia_organica,
            textura_suelo=textura_suelo,
            tipo_suelo=tipo_suelo,
            npk_override=body.npk_override,
            riego_override=body.riego_override,
            fecha_inicio=body.fecha_inicio,
            dias_desde_siembra=dias_desde_siembra,
            ciclo_dias=ciclo_dias,
            base_ndvi=base_ndvi,
            cultivo=cultivo,
        )

        # Enriquecer fuente con datos reales usados
        fuente_partes = []
        fuente_base = result.get("fuente", "NASA POWER + OpenMeteo")
        fuente_partes.append(fuente_base)
        if ndvi_source != "Sintetico (fallback)":
            fuente_partes.append(f"NDVI: {ndvi_source}")
        if inherited:
            fuente_partes.append("Suelo: analisis previo")
        elif soil_source and soil_source != "Default (sin datos ISRIC)":
            fuente_partes.append(f"Suelo: {soil_source}")
        result["fuente"] = " + ".join(fuente_partes)

        return PredictResponse(
            ubicacion=result["ubicacion"],
            meses=[MonthProjection(**m) for m in result["meses"]],
            mejor_mes=result.get("mejor_mes"),
            mejor_cultivo=result.get("mejor_cultivo"),
            fuente=result["fuente"],
            alertas_globales=[Alert(**a) for a in result.get("alertas_globales", [])],
            alertas_patrones=[Alert(**a) for a in result.get("alertas_patrones", [])],
            best_window=OptimalDayResponse(**result["best_window"]) if result.get("best_window") else None,
            analysis_inherited=inherited,
        )
    except Exception as e:
        logger.exception("Prediction error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando la prediccion: {e}",
        )


@router.post("/optimal-day", response_model=OptimalDayResponse)
async def find_optimal_day(
    body: OptimalDayRequest,
    db: AsyncSession = Depends(get_db),
):
    analysis_data = await _resolve_analysis(body.analysis_id, db)

    if analysis_data:
        lat = analysis_data["lat"]
        lng = analysis_data["lng"]
        start_month = _mes_siembra_to_num(analysis_data.get("mes_siembra"))
    elif body.lat is not None and body.lng is not None:
        lat, lng = _validate_coords(body.lat, body.lng)
        start_month = _mes_siembra_to_num(body.mes_siembra)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere lat/lng o analysis_id valido",
        )

    try:
        result = await project_window(
            lat=lat, lng=lng, start_month=start_month, n_months=3,
        )
        bw = result.get("best_window")
        if bw is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontro una ventana optima en los 90 dias proyectados",
            )
        return OptimalDayResponse(**bw)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Optimal day error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculando ventana optima: {e}",
        )