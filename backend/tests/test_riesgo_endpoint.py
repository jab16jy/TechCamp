"""Tests for the /riesgo-climatico endpoint transparency logic.

Calls the async handler directly with mocked internals, so neither CHIRPS data
nor a trained model is required.
"""
import asyncio
from unittest.mock import patch

from app.api import riesgo_climatico as api
from app.schemas.riesgo_climatico import ClimateRiskRequest


def _run(coro):
    return asyncio.run(coro)


def _req():
    return ClimateRiskRequest(lat=10.94, lon=-74.88, year=2024, month=6)


class _FakeClf:
    """Stand-in RiskClassifier returning a fixed prediction."""

    def __init__(self, event_type="flood"):
        self.event_type = event_type

    def predict_from_coords(self, lat, lon, year, month, static=None):
        return {
            "probability": 0.62,
            "severity": "alto",
            "event_type": self.event_type,
            "calibration_method": "sigmoid",
            "features_used": 25,
        }


class TestHeuristicFallback:
    def test_marks_modelo_usado_heuristico(self):
        with patch("app.ml.riesgo_climatico_model.is_trained", return_value=False), \
             patch("app.ml.data_sources.chirps.get_precip", return_value=80.0), \
             patch("app.services.prediction_service._compute_flood_risk",
                   return_value={"score": 40.0, "severidad": "medio"}), \
             patch("app.services.prediction_service._compute_drought_risk",
                   return_value={"score": 20.0, "severidad": "bajo"}):
            resp = _run(api.predict_climate_risk(_req()))

        assert resp.modelo_disponible is False
        assert resp.mensaje is not None
        assert resp.riesgos, "expected heuristic scores"
        for r in resp.riesgos:
            assert r.modelo_usado == "heuristico"
            assert r.fallback_heuristico is True


class TestMLPathTransparency:
    def test_exposes_calibration_baseline_and_warning(self):
        with patch("app.ml.riesgo_climatico_model.is_trained", return_value=True), \
             patch("app.ml.riesgo_climatico_model.RiskClassifier", _FakeClf), \
             patch.object(api, "_fetch_static", return_value={}), \
             patch.object(api, "_load_risk_metrics",
                          return_value={"beats_baseline": False, "test_brier": 0.14}):
            resp = _run(api.predict_climate_risk(_req()))

        assert resp.modelo_disponible is True
        assert resp.riesgos
        r = resp.riesgos[0]
        assert r.modelo_usado == "RiskClassifier"
        assert r.fallback_heuristico is False
        assert r.calibracion == "sigmoid"
        assert r.severidad == "alto"            # from the model's own band, not _severidad
        assert r.supera_baseline is False
        assert r.advertencia is not None        # warned because it does not beat baseline
        assert r.confianza_modelo == 0.86       # 1 - 0.14

    def test_no_warning_when_model_beats_baseline(self):
        with patch("app.ml.riesgo_climatico_model.is_trained", return_value=True), \
             patch("app.ml.riesgo_climatico_model.RiskClassifier", _FakeClf), \
             patch.object(api, "_fetch_static", return_value={}), \
             patch.object(api, "_load_risk_metrics",
                          return_value={"beats_baseline": True, "test_brier": 0.10}):
            resp = _run(api.predict_climate_risk(_req()))

        r = resp.riesgos[0]
        assert r.supera_baseline is True
        assert r.advertencia is None
        assert r.confianza_modelo == 0.90


def test_load_risk_metrics_is_safe_when_missing(tmp_path):
    # Pointing at a non-existent metrics file must not raise.
    with patch.object(api, "_METRICS_PATH", tmp_path / "nope.json"):
        assert api._load_risk_metrics("flood") == {}
