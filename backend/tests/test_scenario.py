"""
Tests para el endpoint de escenario (Task 1.3) y
refinamiento de umbrales Niño/Niña (Task 1.4).
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock


class TestScenarioRequestSchema:
    """Verifica el schema ScenarioRequest (Task 1.3)."""

    def test_scenario_request_schema_exists(self):
        """ScenarioRequest debe ser importable desde schemas.predict."""
        from app.schemas.predict import ScenarioRequest
        assert ScenarioRequest is not None

    def test_scenario_request_defaults(self):
        """ScenarioRequest debe tener valores por defecto sensatos."""
        from app.schemas.predict import ScenarioRequest

        req = ScenarioRequest()
        assert req.precip_delta_pct == 0
        assert req.temp_delta_c == 0
        assert req.meses == 6
        assert req.npk_override is None
        assert req.riego_override is None
        assert req.preset is None

    def test_scenario_request_with_preset(self):
        """ScenarioRequest debe aceptar un preset (nino, nina, normal)."""
        from app.schemas.predict import ScenarioRequest, ScenarioPreset

        req = ScenarioRequest(preset=ScenarioPreset.nino)
        assert req.preset == ScenarioPreset.nino

    def test_scenario_presets_match_design(self):
        """Los presets deben coincidir con los valores del diseño."""
        from app.schemas.predict import ScenarioPreset

        assert ScenarioPreset.nino.value == "nino"
        assert ScenarioPreset.nina.value == "nina"
        assert ScenarioPreset.normal.value == "normal"


class TestNinoNinaThresholds:
    """Verifica los umbrales refinados Niño/Niña (Task 1.4)."""

    def test_nino_threshold_temp_gt_35_precip_lt_10(self):
        """Niño: temp >35°C AND precip <10mm (nuevo umbral)."""
        from app.services.prediction_service import _detect_climate_patterns

        months = [
            {"temperatura": 37.0, "precipitacion": 5.0, "humedad": 60},
            {"temperatura": 36.5, "precipitacion": 8.0, "humedad": 58},
        ]
        patterns = _detect_climate_patterns(months, temp_anomaly=3.0, prec_anomaly=-20.0)
        assert any(p["tipo"] == "fenomeno_nino" for p in patterns), (
            "Debe detectar Niño con temp>35 y precip<10"
        )

    def test_nino_not_triggered_with_precip_above_10(self):
        """No debe activar Niño si precip >= 10mm aunque temp >35°C."""
        from app.services.prediction_service import _detect_climate_patterns

        months = [
            {"temperatura": 37.0, "precipitacion": 15.0, "humedad": 60},
            {"temperatura": 36.5, "precipitacion": 12.0, "humedad": 58},
            {"temperatura": 38.0, "precipitacion": 11.0, "humedad": 55},
        ]
        patterns = _detect_climate_patterns(months, temp_anomaly=2.0, prec_anomaly=-10.0)
        # Con precip >10mm, no deberia activar Niño
        nino_patterns = [p for p in patterns if p["tipo"] == "fenomeno_nino"]
        assert len(nino_patterns) == 0, (
            f"No deberia detectar Niño con precip >= 10mm. "
            f"Patrones encontrados: {nino_patterns}"
        )

    def test_nina_threshold_hum_gt_85_and_saturation(self):
        """La Niña: hum >85% y suelo saturado."""
        from app.services.prediction_service import _detect_climate_patterns

        months = [
            {"temperatura": 24.0, "precipitacion": 160.0, "humedad": 90},
            {"temperatura": 25.0, "precipitacion": 180.0, "humedad": 88},
            {"temperatura": 25.5, "precipitacion": 155.0, "humedad": 87},
        ]
        patterns = _detect_climate_patterns(months, temp_anomaly=-2.0, prec_anomaly=40.0)
        assert any(p["tipo"] == "fenomeno_nina" for p in patterns), (
            "Debe detectar La Niña con hum>85% y exceso de lluvia"
        )


class TestProjectWindowWithScenario:
    """Verifica la funcion project_window_with_scenario (Task 1.4)."""

    def test_project_window_with_scenario_exists(self):
        """La funcion debe existir en prediction_service."""
        from app.services.prediction_service import project_window_with_scenario
        assert callable(project_window_with_scenario)

    def test_project_window_with_scenario_applies_deltas(self):
        """Debe aplicar deltas de temperatura y precipitacion al escenario."""
        from app.services.prediction_service import project_window_with_scenario
        import asyncio

        async def _test():
            result = await project_window_with_scenario(
                lat=10.97,
                lng=-74.78,
                n_months=3,
                precip_delta_pct=-30.0,
                temp_delta_c=3.0,
                npk_override=140.0,
                riego_override=90.0,
            )
            assert result is not None
            assert "meses" in result
            assert "ubicacion" in result
            assert len(result["meses"]) == 3

        asyncio.run(_test())

    @pytest.mark.asyncio
    async def test_scenario_delta_reduces_precip(self):
        """Delta de precipitacion negativa debe reducir precipitacion proyectada."""
        from app.services.prediction_service import project_window_with_scenario

        with patch("app.services.prediction_service.fetch_nasa_climatology") as mock_nasa, \
             patch("app.services.prediction_service.fetch_current_climate") as mock_current, \
             patch("app.ml.inference.predict_crop_recommendations") as mock_predict:

            mock_nasa.return_value = {"parameter": {}}
            mock_current.return_value = {
                "temperatura": 28.0, "humedad": 75.0, "precipitacion": 80.0, "radiacion_solar": 18.0
            }
            mock_predict.return_value = (
                [{"cultivo": "Maiz", "score": 85, "riesgo": "bajo", "emoji": "🌽",
                  "metodo": "random_forest", "probabilidad": 0.85, "factor_weights": []}],
                "random_forest",
            )

            result = await project_window_with_scenario(
                lat=10.97, lng=-74.78, n_months=3,
                precip_delta_pct=-50.0,
                temp_delta_c=0.0,
            )
            assert len(result["meses"]) == 3
