"""
Tests para el modelo LSTM de prediccion climatica.
Cobertura: entrenamiento con datos sinteticos NASA POWER,
prediccion de anomalias a 6 meses, carga/guardado de modelo,
y fallback cuando el modelo no esta disponible.
"""
import os
import shutil
import pytest
import numpy as np
from pathlib import Path

# Directorio temporal pre-aprobado (Windows Store Python no soporta tempfile)
_TMP_BASE = Path("C:/Users/PC/AppData/Local/Temp/opencode/lstm_tests")


@pytest.fixture(scope="function")
def temp_model_dir():
    """Directorio temporal para modelos de prueba."""
    import uuid
    tmp = _TMP_BASE / str(uuid.uuid4())[:8]
    tmp.mkdir(parents=True, exist_ok=True)
    yield tmp
    shutil.rmtree(str(tmp), ignore_errors=True)


class TestLSTMModelExists:
    """Verifica que la clase LSTMModel existe y tiene los metodos requeridos."""

    def test_lstm_model_class_exists(self):
        """La clase LSTMModel debe ser importable desde app.ml.lstm_model."""
        from app.ml.lstm_model import LSTMModel
        assert LSTMModel is not None

    def test_lstm_model_has_required_methods(self):
        """LSTMModel debe exponer train_lstm, load_lstm y predict_lstm."""
        from app.ml.lstm_model import LSTMModel
        assert hasattr(LSTMModel, "train_lstm")
        assert hasattr(LSTMModel, "load_lstm")
        assert hasattr(LSTMModel, "predict_lstm")
        assert callable(LSTMModel.train_lstm)
        assert callable(LSTMModel.load_lstm)
        assert callable(LSTMModel.predict_lstm)


class TestLSTMSyntheticData:
    """Verifica la generacion de datos sinteticos para entrenamiento LSTM."""

    def test_generate_synthetic_nasa_series(self):
        """Debe generar series temporales con 36+ meses de datos climaticos."""
        from app.ml.lstm_model import _generate_synthetic_nasa_series

        data = _generate_synthetic_nasa_series(
            lat=10.97, lng=-74.78, n_months=36
        )
        assert data is not None
        assert len(data) >= 36
        first = data[0]
        assert "temperatura" in first
        assert "precipitacion" in first
        assert "humedad" in first

    def test_synthetic_data_realistic_ranges(self):
        """Los valores generados deben estar en rangos realistas del Caribe."""
        from app.ml.lstm_model import _generate_synthetic_nasa_series

        data = _generate_synthetic_nasa_series(
            lat=10.97, lng=-74.78, n_months=48
        )
        temps = [d["temperatura"] for d in data]
        precips = [d["precipitacion"] for d in data]
        hums = [d["humedad"] for d in data]

        assert all(20 <= t <= 40 for t in temps), f"Temperaturas fuera de rango: {temps}"
        assert all(0 <= p <= 400 for p in precips), f"Precipitaciones fuera de rango: {precips}"
        assert all(50 <= h <= 100 for h in hums), f"Humedades fuera de rango: {hums}"

    def test_synthetic_data_seasonal_pattern(self):
        """Debe mostrar patron estacional: meses humedos mas lluvia que secos."""
        from app.ml.lstm_model import _generate_synthetic_nasa_series

        data = _generate_synthetic_nasa_series(
            lat=10.97, lng=-74.78, n_months=48
        )
        monthly_prec = {}
        for i, d in enumerate(data):
            month = (i % 12) + 1
            monthly_prec.setdefault(month, []).append(d["precipitacion"])

        wet_months = [5, 6, 7, 8, 9, 10]
        dry_months = [12, 1, 2, 3]
        avg_wet = np.mean([np.mean(monthly_prec[m]) for m in wet_months])
        avg_dry = np.mean([np.mean(monthly_prec[m]) for m in dry_months])
        assert avg_wet > avg_dry, (
            f"Precipitacion en meses humedos ({avg_wet:.0f}) "
            f"debe superar meses secos ({avg_dry:.0f})"
        )


class TestLSTMTrainPredict:
    """Verifica el pipeline de entrenamiento y prediccion del LSTM."""

    def test_train_lstm_produces_model_file(self, temp_model_dir):
        """train_lstm debe generar y guardar modelo .keras y scaler .joblib."""
        from app.ml.lstm_model import LSTMModel, _generate_synthetic_nasa_series

        model_path = temp_model_dir / "test_lstm.keras"
        scaler_path = temp_model_dir / "test_scaler.joblib"

        data = _generate_synthetic_nasa_series(lat=10.97, lng=-74.78, n_months=48)

        metrics = LSTMModel.train_lstm(
            nasa_data=data,
            sequence_length=12,
            forecast_horizon=6,
            model_path=model_path,
            scaler_path=scaler_path,
            epochs=2,
        )

        assert model_path.exists(), f"Modelo no guardado en {model_path}"
        assert scaler_path.exists(), f"Scaler no guardado en {scaler_path}"
        assert "loss" in metrics
        assert metrics["loss"] > 0

    def test_predict_lstm_output_shape(self, temp_model_dir):
        """predict_lstm debe retornar anomalias para exactamente 6 meses."""
        from app.ml.lstm_model import LSTMModel, _generate_synthetic_nasa_series

        model_path = temp_model_dir / "test_lstm.keras"
        scaler_path = temp_model_dir / "test_scaler.joblib"

        data = _generate_synthetic_nasa_series(lat=10.97, lng=-74.78, n_months=48)
        LSTMModel.train_lstm(
            nasa_data=data,
            sequence_length=12,
            forecast_horizon=6,
            model_path=model_path,
            scaler_path=scaler_path,
            epochs=2,
        )

        result = LSTMModel.predict_lstm(
            lat=10.97,
            lng=-74.78,
            historical_window=12,
            model_path=model_path,
            scaler_path=scaler_path,
        )

        assert "temp_anomalies" in result
        assert "precip_anomalies" in result
        assert "hum_anomalies" in result
        assert "confidence" in result
        assert len(result["temp_anomalies"]) == 6
        assert len(result["precip_anomalies"]) == 6
        assert len(result["hum_anomalies"]) == 6
        assert 0 <= result["confidence"] <= 1

    def test_train_lstm_insufficient_data_raises(self, temp_model_dir):
        """Debe lanzar error si hay menos de 24 meses de datos."""
        from app.ml.lstm_model import LSTMModel, _generate_synthetic_nasa_series

        model_path = temp_model_dir / "test_lstm.keras"
        scaler_path = temp_model_dir / "test_scaler.joblib"

        data = _generate_synthetic_nasa_series(lat=10.97, lng=-74.78, n_months=12)

        with pytest.raises(ValueError, match="insuficientes|minimo"):
            LSTMModel.train_lstm(
                nasa_data=data,
                sequence_length=12,
                forecast_horizon=6,
                model_path=model_path,
                scaler_path=scaler_path,
                epochs=1,
            )

    def test_load_lstm_missing_model_raises(self, temp_model_dir):
        """load_lstm debe lanzar FileNotFoundError si el modelo no existe."""
        from app.ml.lstm_model import LSTMModel

        fake_path = temp_model_dir / "no_existe.keras"
        fake_scaler = temp_model_dir / "no_existe.joblib"

        with pytest.raises(FileNotFoundError, match="no encontrado|not found"):
            LSTMModel.load_lstm(model_path=fake_path, scaler_path=fake_scaler)

    def test_predict_lstm_with_different_historical_window(self, temp_model_dir):
        """predict_lstm debe funcionar con diferentes ventanas historicas."""
        from app.ml.lstm_model import LSTMModel, _generate_synthetic_nasa_series

        model_path = temp_model_dir / "test_lstm2.keras"
        scaler_path = temp_model_dir / "test_scaler2.joblib"

        data = _generate_synthetic_nasa_series(lat=10.97, lng=-74.78, n_months=48)
        LSTMModel.train_lstm(
            nasa_data=data,
            sequence_length=12,
            forecast_horizon=6,
            model_path=model_path,
            scaler_path=scaler_path,
            epochs=2,
        )

        # Probar con ventana de 18 meses
        result = LSTMModel.predict_lstm(
            lat=10.97,
            lng=-74.78,
            historical_window=18,
            model_path=model_path,
            scaler_path=scaler_path,
        )

        assert len(result["temp_anomalies"]) == 6
        assert all(isinstance(a, (int, float)) for a in result["temp_anomalies"])
        assert 0 <= result["confidence"] <= 1
