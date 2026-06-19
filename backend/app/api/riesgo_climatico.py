import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.riesgo_climatico import (
    ClimateRiskRequest,
    ClimateRiskResponse,
    FactorContribucion,
    RegistroPrediccionRequest,
    RiesgoScore,
)
from app.schemas.historial_eventos import (
    EventoHistorico,
    HistorialEventosResponse,
    ResumenAgregado,
)
from app.core.dependencies import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/riesgo-climatico", tags=["riesgo-climatico"])

_METRICS_PATH = Path(__file__).resolve().parent.parent / "ml" / "model_metrics.json"


def _severidad(prob: float) -> str:
    if prob >= 0.7:
        return "critico"
    if prob >= 0.5:
        return "alto"
    if prob >= 0.3:
        return "medio"
    return "bajo"


def _load_risk_metrics(event_type: str) -> dict:
    """Read the persisted training metrics for one event type (best-effort)."""
    try:
        data = json.loads(_METRICS_PATH.read_text())
        return data.get("climate_risk", {}).get("models", {}).get(event_type, {}) or {}
    except Exception:
        return {}


def _heuristic_fallback(lat: float, lon: float, year: int, month: int) -> list[RiesgoScore]:
    """Use existing rule-based heuristic when ML model is not trained yet."""
    try:
        from app.ml.data_sources.chirps import get_precip
        from app.services.prediction_service import _compute_flood_risk, _compute_drought_risk

        precip = get_precip(lat, lon, year, month) or 80.0
        flood = _compute_flood_risk(textura_suelo="Franco", awc=0.15, precipitacion=precip)
        drought = _compute_drought_risk(
            textura_suelo="Franco", awc=0.15, precipitacion=precip, temperatura=27.0
        )
        return [
            RiesgoScore(
                tipo="inundacion",
                probabilidad=round(flood["score"] / 100.0, 3),
                severidad=flood["severidad"],
                modelo_usado="heuristico",
                fallback_heuristico=True,
            ),
            RiesgoScore(
                tipo="sequia",
                probabilidad=round(drought["score"] / 100.0, 3),
                severidad=drought["severidad"],
                modelo_usado="heuristico",
                fallback_heuristico=True,
            ),
        ]
    except Exception as e:
        logger.warning("Heuristic fallback failed: %s", e)
        return []


def _run_models(lat, lon, year, month, trained: dict[str, bool],
                precip_scale: float = 1.0, temp_delta_c: float = 0.0) -> list[RiesgoScore]:
    """Run the trained RiskClassifier(s) for one (year, month) window.

    Returns [] when the window has no usable climate coverage (probability None).
    `precip_scale`/`temp_delta_c` apply the climate what-if to the model inputs.
    """
    from app.ml.riesgo_climatico_model import RiskClassifier

    riesgos: list[RiesgoScore] = []
    for event_type in ("flood", "drought"):
        if not trained.get(event_type):
            continue
        try:
            result = RiskClassifier(event_type).predict_from_coords(
                lat, lon, year, month, precip_scale=precip_scale, temp_delta_c=temp_delta_c
            )
            if result.get("probability") is None:
                logger.warning("Insufficient CHIRPS coverage for %s at (%s, %s) %s-%s",
                               event_type, lat, lon, year, month)
                continue
            prob = result["probability"]
            m = _load_risk_metrics(event_type)
            supera = m.get("beats_baseline")
            brier = m.get("test_brier")
            confianza = round(max(0.0, min(1.0, 1.0 - brier)), 3) if brier is not None else None
            advertencia = (
                "El modelo ML no supera el heurístico base en validación; "
                "interpretar esta probabilidad con cautela."
            ) if supera is False else None

            riesgos.append(RiesgoScore(
                tipo="inundacion" if event_type == "flood" else "sequia",
                probabilidad=prob,
                severidad=result.get("severity") or _severidad(prob),
                modelo_usado="RiskClassifier",
                fallback_heuristico=False,
                confianza_modelo=confianza,
                calibracion=result.get("calibration_method"),
                supera_baseline=supera,
                advertencia=advertencia,
            ))
        except Exception as e:
            logger.error("RiskClassifier failed for %s: %s", event_type, e)
    return riesgos


@router.post("", response_model=ClimateRiskResponse)
async def predict_climate_risk(req: ClimateRiskRequest) -> ClimateRiskResponse:
    """Predict flood and drought risk for a given location and time.

    Uses the trained RiskClassifier (Fase 2) when available. If the requested
    window is beyond climate-data coverage (e.g. a future month), it re-evaluates
    the most recent available window and says so. Falls back to the rule-based
    heuristic only when no model or no usable climate data exists.
    """
    from app.ml.riesgo_climatico_model import is_trained
    from app.ml.data_sources.chirps import latest_available_month, latest_year_for_month

    factores: list[FactorContribucion] = []
    mensaje = None

    # Resolve the year: prefer the request's, else the latest year that has data
    # for the requested month, else the latest available month overall.
    req_year = req.year or latest_year_for_month(req.month)
    if req_year is None:
        latest = latest_available_month()
        req_year, req_month = (latest if latest else (2024, req.month))
    else:
        req_month = req.month
    eval_year, eval_month = req_year, req_month

    # Climate scenario knobs (the model's real inputs — soil is NOT a feature).
    precip_scale = 1.0 + (req.precip_delta_pct or 0.0) / 100.0
    temp_delta = req.temp_delta_c or 0.0
    simulacion = precip_scale != 1.0 or temp_delta != 0.0

    trained = {"flood": is_trained("flood"), "drought": is_trained("drought")}
    modelo_disponible = any(trained.values())

    riesgos: list[RiesgoScore] = []
    if modelo_disponible:
        riesgos = _run_models(req.lat, req.lon, eval_year, eval_month, trained, precip_scale, temp_delta)

        # Requested window out of coverage → evaluate the latest real window.
        if not riesgos:
            latest = latest_available_month()
            if latest and latest != (eval_year, eval_month):
                ly, lm = latest
                retry = _run_models(req.lat, req.lon, ly, lm, trained, precip_scale, temp_delta)
                if retry:
                    riesgos = retry
                    eval_year, eval_month = ly, lm
                    mensaje = (
                        f"Sin datos climáticos para {eval_month:02d}/{req_year}. "
                        f"Se evalúa la ventana más reciente disponible: {lm:02d}/{ly}."
                    )

    if not riesgos:
        riesgos = _heuristic_fallback(req.lat, req.lon, eval_year, eval_month)
        if not riesgos:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No climate risk model or heuristic available for this location.",
            )
        mensaje = (
            "Modelo ML no entrenado aún. Se usa el heurístico de reglas como aproximación. "
            "Ejecuta riesgo_climatico_training.py para entrenar el modelo."
            if not modelo_disponible else
            "No hay datos climáticos suficientes para esta ubicación. "
            "Se usa el heurístico de reglas como aproximación."
        )

    escenario = {
        "precip_delta_pct": req.precip_delta_pct or 0.0,
        "temp_delta_c": temp_delta,
    } if simulacion else None

    return ClimateRiskResponse(
        lat=req.lat,
        lon=req.lon,
        year=eval_year,
        month=eval_month,
        riesgos=riesgos,
        factores_principales=factores,
        modelo_disponible=modelo_disponible,
        mensaje=mensaje,
        escenario=escenario,
        simulacion=simulacion,
    )


@router.post("/registro", status_code=status.HTTP_201_CREATED)
async def guardar_registro(
    req: RegistroPrediccionRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Persist one IAPredictiva run as a prediction record (tipo='prediccion')."""
    from app.models.analisis import Analisis

    try:
        ana = Analisis(
            municipio_id=None,
            tipo="prediccion",
            datos_formulario=req.datos_formulario or {},
            resultado_completo=req.resultado_completo or {},
            lat=req.lat,
            lng=req.lon,
            cultivo_recomendado=req.riesgo_dominante,
            score=req.score,
        )
        db.add(ana)
        await db.commit()
        return {"id": str(ana.id)[:8].upper(), "tipo": "prediccion"}
    except Exception:
        await db.rollback()
        logger.exception("Error guardando registro de prediccion")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el registro de predicción.",
        )


@router.get("/historial", response_model=HistorialEventosResponse)
async def historial_eventos(
    lat: float = Query(..., ge=-4.5, le=12.5, description="Latitud WGS84"),
    lon: float = Query(..., ge=-79.0, le=-66.0, description="Longitud WGS84"),
    event_type: Optional[str] = Query(
        None, description="Filtrar: flood/inundacion | drought/sequia"
    ),
    municipio: Optional[str] = Query(None, description="Filtrar por municipio"),
    limit: int = Query(20, ge=1, le=100),
) -> HistorialEventosResponse:
    """Recent real flood/drought events near a location, with reported impacts.

    Contextual EVIDENCE only — not a prediction. Impacts are surfaced exactly as
    reported by the source (UNGRD / HDX); missing figures stay null, never zero.
    Returns an empty list (not an error) when no records match.
    """
    from app.ml.data_sources.eventos_historicos import load_all_events, query_events

    try:
        # Disk read + pandas work runs off the event loop; cached after first call.
        events = await asyncio.to_thread(load_all_events)
        result = await asyncio.to_thread(
            query_events, events, lat, lon,
            event_type=event_type, municipio=municipio, limit=limit,
        )
    except Exception as e:
        logger.error("historial_eventos failed at (%s,%s): %s", lat, lon, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo cargar el historial de eventos.",
        )

    eventos = [EventoHistorico(**e) for e in result["eventos"]]
    resumen = ResumenAgregado(**result["resumen"])
    departamento = eventos[0].departamento if eventos else None
    mensaje = None
    if not eventos:
        mensaje = "Sin registros históricos cercanos en las fuentes disponibles."

    return HistorialEventosResponse(
        departamento=departamento,
        municipio=municipio,
        event_type=event_type,
        total_disponibles=result["total_disponibles"],
        eventos=eventos,
        resumen=resumen,
        mensaje=mensaje,
    )


@router.get("/status")
async def model_status() -> dict:
    """Return training status of climate risk models."""
    from app.ml.riesgo_climatico_model import is_trained
    from app.ml.riesgo_climatico_dataset import dataset_summary

    summary = dataset_summary()
    return {
        "flood_model_trained": is_trained("flood"),
        "drought_model_trained": is_trained("drought"),
        "dataset": summary,
        "checked_at": datetime.utcnow().isoformat(),
    }
