"""Tests for the /riesgo-climatico endpoint logic.

Calls the async handlers directly with mocked internals, so neither CHIRPS data
nor a trained model is required.
"""
import asyncio
from unittest.mock import patch

from app.api import riesgo_climatico as api
from app.schemas.riesgo_climatico import ClimateRiskRequest, RegistroPrediccionRequest


def _run(coro):
    return asyncio.run(coro)


def _req(**kw):
    base = dict(lat=10.94, lon=-74.88, year=2024, month=6)
    base.update(kw)
    return ClimateRiskRequest(**base)


class _FakeClf:
    """Stand-in RiskClassifier returning a fixed prediction (new scenario signature)."""

    def __init__(self, event_type="flood"):
        self.event_type = event_type

    def predict_from_coords(self, lat, lon, year, month, precip_scale=1.0, temp_delta_c=0.0):
        return {
            "probability": 0.62,
            "severity": "alto",
            "event_type": self.event_type,
            "calibration_method": "sigmoid",
            "features_used": 25,
        }


class _RecordingClf(_FakeClf):
    """Captures the climate-scenario knobs it was called with."""
    last: dict = {}

    def predict_from_coords(self, lat, lon, year, month, precip_scale=1.0, temp_delta_c=0.0):
        _RecordingClf.last = {"precip_scale": precip_scale, "temp_delta_c": temp_delta_c,
                              "year": year, "month": month}
        return super().predict_from_coords(lat, lon, year, month)


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
        assert resp.simulacion is False         # no scenario knobs → not a simulation

    def test_no_warning_when_model_beats_baseline(self):
        with patch("app.ml.riesgo_climatico_model.is_trained", return_value=True), \
             patch("app.ml.riesgo_climatico_model.RiskClassifier", _FakeClf), \
             patch.object(api, "_load_risk_metrics",
                          return_value={"beats_baseline": True, "test_brier": 0.10}):
            resp = _run(api.predict_climate_risk(_req()))

        r = resp.riesgos[0]
        assert r.supera_baseline is True
        assert r.advertencia is None
        assert r.confianza_modelo == 0.90


class TestClimateScenario:
    def test_scenario_knobs_forwarded_and_flagged(self):
        with patch("app.ml.riesgo_climatico_model.is_trained", return_value=True), \
             patch("app.ml.riesgo_climatico_model.RiskClassifier", _RecordingClf), \
             patch.object(api, "_load_risk_metrics", return_value={}):
            resp = _run(api.predict_climate_risk(_req(precip_delta_pct=80, temp_delta_c=2)))

        assert resp.simulacion is True
        assert resp.escenario == {"precip_delta_pct": 80.0, "temp_delta_c": 2.0}
        # precip_delta_pct=80 → scale 1.8; temp delta forwarded verbatim
        assert _RecordingClf.last["precip_scale"] == 1.8
        assert _RecordingClf.last["temp_delta_c"] == 2.0

    def test_year_resolved_from_month_when_omitted(self):
        with patch("app.ml.riesgo_climatico_model.is_trained", return_value=True), \
             patch("app.ml.riesgo_climatico_model.RiskClassifier", _RecordingClf), \
             patch.object(api, "_load_risk_metrics", return_value={}), \
             patch("app.ml.data_sources.chirps.latest_year_for_month", return_value=2024):
            resp = _run(api.predict_climate_risk(
                ClimateRiskRequest(lat=10.94, lon=-74.88, month=6)))  # no year

        assert resp.year == 2024 and resp.month == 6
        assert _RecordingClf.last["year"] == 2024


def test_scale_precip_features_recomputes_consistently():
    from app.ml.riesgo_climatico_model import _scale_precip_features
    row = {f"precip_m{i}": v for i, v in enumerate([20, 40, 60, 80, 100, 120], start=1)}
    row.update({"precip_total_3m": 300, "precip_total_6m": 420,
                "precip_max_month": 120, "precip_min_month": 20, "precip_anomaly_last": 20})
    _scale_precip_features(row, 2.0)
    assert row["precip_m6"] == 240
    assert row["precip_total_6m"] == 840          # sum doubled
    assert row["precip_max_month"] == 240
    # anomaly keeps the climatological baseline (120-20=100): 240 - 100 = 140
    assert row["precip_anomaly_last"] == 140


class _FakeDB:
    def __init__(self):
        self.added = []
        self.committed = False
    def add(self, obj):
        self.added.append(obj)
    async def commit(self):
        self.committed = True
    async def rollback(self):
        pass


def test_registro_persists_prediccion():
    db = _FakeDB()
    req = RegistroPrediccionRequest(
        lat=10.9, lon=-74.8, municipio="Barranquilla", departamento="Atlántico",
        score=66, riesgo_dominante="inundacion",
        datos_formulario={"mes": 6, "precip_delta_pct": 0},
        resultado_completo={"riesgos": []},
    )
    out = _run(api.guardar_registro(req, db=db))

    assert db.committed is True
    assert len(db.added) == 1
    row = db.added[0]
    assert row.tipo == "prediccion"
    assert row.score == 66
    assert row.cultivo_recomendado == "inundacion"
    assert out["tipo"] == "prediccion"


def test_load_risk_metrics_is_safe_when_missing(tmp_path):
    # Pointing at a non-existent metrics file must not raise.
    with patch.object(api, "_METRICS_PATH", tmp_path / "nope.json"):
        assert api._load_risk_metrics("flood") == {}
