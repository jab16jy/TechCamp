"""API endpoints for ML model metrics and training."""

import logging

from fastapi import APIRouter

from app.ml.training import (
    get_saved_metrics,
    train_model,
    fetch_caribbean_climatology,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/model", tags=["modelo"])


@router.get("/metrics")
async def model_metrics():
    """Return real model accuracy metrics from the last training run.

    Reads the persisted metrics.json saved after training.
    If no model exists, returns model_available: false.
    """
    metrics = get_saved_metrics()
    if not metrics.get("model_available", True) or metrics.get("accuracy") is None:
        metrics["model_available"] = False
        metrics["message"] = (
            "Modelo no entrenado. Use POST /model/retrain para entrenar."
        )
    return metrics


async def _fetch_zones_or_fallback() -> list[dict]:
    """Fetch NASA POWER climatology asynchronously, with fallback."""
    try:
        zones = await fetch_caribbean_climatology()
        logger.info("NASA POWER: %d zonas cargadas", len(zones))
        return zones
    except Exception as e:
        logger.warning("Error en NASA POWER: %s. Usando climatologia regional.", e)
        from app.ml.training import REGIONAL_CLIMATOLOGY
        return [{
            "name": "Caribe", "lat": 10.0, "lng": -75.0,
            "monthly": dict(REGIONAL_CLIMATOLOGY),
        }]


@router.post("/retrain")
async def retrain_model():
    """Retrain the ML model with NASA POWER climatology data.

    Fetches NASA POWER climatology asynchronously (safe from uvicorn's
    event loop) before running the synchronous training pipeline.
    """
    try:
        climate_zones = await _fetch_zones_or_fallback()
        metrics = train_model(climate_zones=climate_zones)
        return {
            "success": True,
            "message": "Modelo reentrenado exitosamente",
            "accuracy": metrics.get("accuracy"),
            "cv_accuracy_mean": metrics.get("cv_accuracy_mean"),
            "n_climate_zones": metrics.get("n_climate_zones"),
            "data_source": metrics.get("data_source"),
        }
    except Exception as e:
        logger.exception("Error reentrenando modelo")
        return {
            "success": False,
            "message": f"Error reentrenando modelo: {e}",
        }
