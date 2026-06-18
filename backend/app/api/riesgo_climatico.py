import json
import logging
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from app.schemas.riesgo_climatico import (
    ClimateRiskRequest,
    ClimateRiskResponse,
    FactorContribucion,
    RiesgoScore,
)

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


async def _fetch_static(lat: float, lon: float) -> dict:
    """Fetch soil + elevation for inference so features match training."""
    try:
        from app.services.soil_service import get_soil_data
        from app.ml.data_sources.elevation import get_elevation

        soil = await get_soil_data(lat, lon) or {}
        elev = await get_elevation(lat, lon)
        return {
            "soil_ph": soil.get("ph"),
            "soil_clay": soil.get("clay"),
            "soil_awc": soil.get("awc"),
            "elevation_m": elev,
        }
    except Exception as e:
        logger.warning("Static feature fetch failed for (%s,%s): %s", lat, lon, e)
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


@router.post("", response_model=ClimateRiskResponse)
async def predict_climate_risk(req: ClimateRiskRequest) -> ClimateRiskResponse:
    """Predict flood and drought risk for a given location and time.

    Uses the trained RiskClassifier (Fase 2) when available.
    Falls back to the rule-based heuristic transparently when the model is not trained.
    """
    from app.ml.riesgo_climatico_model import RiskClassifier, is_trained

    riesgos: list[RiesgoScore] = []
    factores: list[FactorContribucion] = []
    modelo_disponible = False
    mensaje = None

    flood_trained = is_trained("flood")
    drought_trained = is_trained("drought")
    modelo_disponible = flood_trained or drought_trained

    if modelo_disponible:
        # Fetch soil/elevation once so inference features match training.
        static = await _fetch_static(req.lat, req.lon)
        for event_type, trained in [("flood", flood_trained), ("drought", drought_trained)]:
            if not trained:
                continue
            try:
                clf = RiskClassifier(event_type)
                result = clf.predict_from_coords(
                    req.lat, req.lon, req.year, req.month, static=static
                )
                if result.get("probability") is None:
                    logger.warning("Insufficient CHIRPS coverage for %s at (%s, %s)", event_type, req.lat, req.lon)
                    continue
                prob = result["probability"]
                tipo = "inundacion" if event_type == "flood" else "sequia"

                m = _load_risk_metrics(event_type)
                supera = m.get("beats_baseline")
                brier = m.get("test_brier")
                confianza = round(max(0.0, min(1.0, 1.0 - brier)), 3) if brier is not None else None
                advertencia = None
                if supera is False:
                    advertencia = (
                        "El modelo ML no supera el heurístico base en validación; "
                        "interpretar esta probabilidad con cautela."
                    )

                riesgos.append(RiesgoScore(
                    tipo=tipo,
                    probabilidad=prob,
                    # severity from the model's own validation-derived bands
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

    if not riesgos:
        riesgos = _heuristic_fallback(req.lat, req.lon, req.year, req.month)
        if not riesgos:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No climate risk model or heuristic available for this location.",
            )
        mensaje = (
            "Modelo ML no entrenado aún. Se usa el heurístico de reglas como aproximación. "
            "Ejecuta riesgo_climatico_training.py para entrenar el modelo."
        )

    return ClimateRiskResponse(
        lat=req.lat,
        lon=req.lon,
        year=req.year,
        month=req.month,
        riesgos=riesgos,
        factores_principales=factores,
        modelo_disponible=modelo_disponible,
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
