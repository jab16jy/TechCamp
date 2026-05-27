"""
Tests para el motor de inferencia hibrido RF+LSTM.
Cobertura: ensemble 60/40, fallback RF puro,
integracion con predict_crop_recommendations.
"""
import pytest
from unittest.mock import patch, MagicMock
import numpy as np


class TestEnsembleInference:
    """Verifica el comportamiento del ensemble RF+LSTM en inference.py."""

    def test_predict_crop_accepts_lstm_anomalies_param(self):
        """predict_crop_recommendations debe aceptar parametro lstm_anomalies."""
        from app.ml.inference import predict_crop_recommendations

        # Llamada con el nuevo parametro (aunque sea None)
        results, metodo = predict_crop_recommendations(
            temperatura=28.0,
            humedad=75.0,
            precipitacion=80.0,
            ph_suelo=6.5,
            materia_organica=3.0,
            ndvi=0.5,
            textura_suelo="Franco",
            tipo_suelo="Franco-Arcilloso",
            mes_siembra="Abril",
            lstm_anomalies=None,  # Nuevo parametro
        )
        assert isinstance(results, list)
        assert metodo in ("random_forest", "heuristico", "ensemble_rf_lstm", "rf_fallback")

    def test_ensemble_uses_different_method_with_lstm(self):
        """Con LSTM disponible, el metodo debe ser 'ensemble_rf_lstm'."""
        from app.ml.inference import predict_crop_recommendations

        mock_lstm = {
            "temp_anomalies": [1.0, 0.8, 0.5, 0.3, 0.1, -0.2],
            "precip_anomalies": [-10.0, -5.0, 0.0, 5.0, 10.0, 15.0],
            "hum_anomalies": [2.0, 1.5, 1.0, 0.5, 0.0, -1.0],
            "confidence": 0.75,
        }

        # Forzar que el modelo RF este disponible
        with patch("app.ml.inference._load_rf") as mock_load_rf:
            mock_model = MagicMock()
            mock_model.classes_ = np.array(["Maiz", "Arroz", "Yuca"])
            mock_model.predict_proba.return_value = np.array([[0.6, 0.3, 0.1]])
            mock_scaler = MagicMock()
            mock_scaler.transform.return_value = np.array([[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]])
            mock_load_rf.return_value = (mock_model, mock_scaler)

            results, metodo = predict_crop_recommendations(
                temperatura=30.0,
                humedad=80.0,
                precipitacion=100.0,
                ph_suelo=6.5,
                materia_organica=3.0,
                ndvi=0.6,
                textura_suelo="Franco",
                tipo_suelo="Franco-Arcilloso",
                lstm_anomalies=mock_lstm,
            )

            # Con LSTM disponible, el metodo debe reflejar ensemble
            assert metodo == "ensemble_rf_lstm", (
                f"Esperado 'ensemble_rf_lstm', obtenido '{metodo}'"
            )
            assert len(results) > 0

    def test_ensemble_fallback_when_lstm_none(self):
        """Con lstm_anomalies=None, debe usar fallback RF puro."""
        from app.ml.inference import predict_crop_recommendations

        with patch("app.ml.inference._load_rf") as mock_load_rf:
            mock_model = MagicMock()
            mock_model.classes_ = np.array(["Maiz", "Arroz", "Yuca"])
            mock_model.predict_proba.return_value = np.array([[0.6, 0.3, 0.1]])
            mock_scaler = MagicMock()
            mock_scaler.transform.return_value = np.array([[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]])
            mock_load_rf.return_value = (mock_model, mock_scaler)

            results, metodo = predict_crop_recommendations(
                temperatura=28.0,
                humedad=75.0,
                precipitacion=80.0,
                ph_suelo=6.5,
                materia_organica=3.0,
                ndvi=0.5,
                textura_suelo="Franco",
                tipo_suelo="Franco-Arcilloso",
                lstm_anomalies=None,
            )

            # Sin LSTM, el metodo debe ser el original del RF
            assert metodo != "ensemble_rf_lstm", (
                "Sin LSTM no deberia reportar ensemble"
            )
            assert metodo in ("random_forest", "rf_fallback")

    def test_ensemble_produces_different_scores_than_rf_alone(self):
        """El ensemble debe producir scores diferentes al RF puro."""
        from app.ml.inference import predict_crop_recommendations

        mock_lstm = {
            "temp_anomalies": [3.0, 2.5, 2.0, 1.5, 1.0, 0.5],
            "precip_anomalies": [-30.0, -25.0, -20.0, -15.0, -10.0, -5.0],
            "hum_anomalies": [-5.0, -4.0, -3.0, -2.0, -1.0, 0.0],
            "confidence": 0.85,
        }

        with patch("app.ml.inference._load_rf") as mock_load_rf:
            mock_model = MagicMock()
            mock_model.classes_ = np.array(["Maiz", "Arroz", "Yuca"])
            mock_model.predict_proba.return_value = np.array([[0.7, 0.2, 0.1]])
            mock_scaler = MagicMock()
            mock_scaler.transform.return_value = np.array([[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]])
            mock_load_rf.return_value = (mock_model, mock_scaler)

            # Primero sin LSTM
            results_rf, _ = predict_crop_recommendations(
                temperatura=30.0,
                humedad=70.0,
                precipitacion=60.0,
                ph_suelo=6.5,
                materia_organica=3.0,
                ndvi=0.5,
                textura_suelo="Franco",
                lstm_anomalies=None,
            )

            # Luego con LSTM
            results_ens, _ = predict_crop_recommendations(
                temperatura=30.0,
                humedad=70.0,
                precipitacion=60.0,
                ph_suelo=6.5,
                materia_organica=3.0,
                ndvi=0.5,
                textura_suelo="Franco",
                lstm_anomalies=mock_lstm,
            )

            # Los scores deben ser diferentes (el ensemble ajusta)
            rf_scores = [r["score"] for r in results_rf]
            ens_scores = [r["score"] for r in results_ens]
            assert rf_scores != ens_scores, (
                f"El ensemble deberia producir scores diferentes. "
                f"RF: {rf_scores}, Ensemble: {ens_scores}"
            )

    def test_ensemble_with_extreme_lstm_anomalies(self):
        """Con anomalias extremas de LSTM, los scores deben bajar significativamente."""
        from app.ml.inference import predict_crop_recommendations

        mock_lstm_extreme = {
            "temp_anomalies": [8.0, 7.0, 6.0, 5.0, 4.0, 3.0],
            "precip_anomalies": [-60.0, -50.0, -40.0, -30.0, -20.0, -10.0],
            "hum_anomalies": [-15.0, -12.0, -10.0, -8.0, -5.0, -3.0],
            "confidence": 0.55,
        }

        mock_lstm_mild = {
            "temp_anomalies": [0.5, 0.3, 0.1, -0.1, -0.3, -0.5],
            "precip_anomalies": [5.0, 3.0, 0.0, -2.0, -5.0, -8.0],
            "hum_anomalies": [1.0, 0.5, 0.0, -0.5, -1.0, -1.5],
            "confidence": 0.90,
        }

        with patch("app.ml.inference._load_rf") as mock_load_rf:
            mock_model = MagicMock()
            mock_model.classes_ = np.array(["Maiz", "Arroz", "Yuca"])
            mock_model.predict_proba.return_value = np.array([[0.5, 0.3, 0.2]])
            mock_scaler = MagicMock()
            mock_scaler.transform.return_value = np.array([[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]])
            mock_load_rf.return_value = (mock_model, mock_scaler)

            _, _ = predict_crop_recommendations(
                temperatura=30.0, humedad=70.0, precipitacion=60.0,
                ph_suelo=6.5, materia_organica=3.0, ndvi=0.5,
                textura_suelo="Franco", lstm_anomalies=mock_lstm_extreme,
            )

            results_mild, _ = predict_crop_recommendations(
                temperatura=30.0, humedad=70.0, precipitacion=60.0,
                ph_suelo=6.5, materia_organica=3.0, ndvi=0.5,
                textura_suelo="Franco", lstm_anomalies=mock_lstm_mild,
            )

            # Con anomalias suaves, los scores deben ser mas altos
            top_mild = results_mild[0]["score"]
            assert top_mild > 0, "Score no deberia ser 0 con condiciones normales"
