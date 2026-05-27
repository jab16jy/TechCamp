"""
Modelo LSTM para prediccion de anomalias climaticas a 6 meses.

Entrenado sobre series temporales sinteticas generadas a partir
de climatologia NASA POWER para la region Caribe colombiana.

Arquitectura:
  - Secuencia de entrada: 12 meses (temp, precip, humedad)
  - Prediccion: 6 meses de anomalias proyectadas
  - Guardado: modelo .keras + scaler .joblib
"""
import logging
import math
import os
from pathlib import Path
from typing import Optional

import numpy as np
from joblib import dump as jl_dump
from joblib import load as jl_load
from sklearn.preprocessing import StandardScaler

# Parche para Windows Store Python: Keras internamente usa tempfile.mkdtemp()
# que crashea por restricciones de App Execution Alias. Monkey-patcheamos
# tempfile.mkdtemp para que use un directorio pre-aprobado.
_ACCEPTABLE_TMP = Path(os.environ.get("LSTM_TMPDIR", "C:/Users/PC/AppData/Local/Temp/opencode/lstm_keras_tmp"))
_ACCEPTABLE_TMP.mkdir(parents=True, exist_ok=True)

import tempfile as _tempfile_mod
_original_mkdtemp = _tempfile_mod.mkdtemp

def _safe_mkdtemp(suffix=None, prefix=None, dir=None):
    """Reemplazo de tempfile.mkdtemp que usa directorio pre-aprobado.

    Windows Store Python crashea con mkdtemp nativo incluso en dirs permitidos.
    Creamos directorios manualmente como alternativa segura.
    """
    import uuid as _uuid
    target_dir = Path(dir) if dir else _ACCEPTABLE_TMP
    target_dir.mkdir(parents=True, exist_ok=True)
    pfx = prefix or "keras_tmp"
    sfx = suffix or ""
    fallback = target_dir / f"{pfx}{_uuid.uuid4().hex[:12]}{sfx}"
    fallback.mkdir(parents=True, exist_ok=True)
    return str(fallback)

_tempfile_mod.mkdtemp = _safe_mkdtemp

os.environ.setdefault("TMPDIR", str(_ACCEPTABLE_TMP))
os.environ.setdefault("TMP", str(_ACCEPTABLE_TMP))
os.environ.setdefault("TEMP", str(_ACCEPTABLE_TMP))

logger = logging.getLogger(__name__)

# Rutas por defecto para modelo y scaler LSTM
DEFAULT_LSTM_MODEL_PATH = Path(__file__).parent / "data" / "lstm_model.keras"
DEFAULT_LSTM_SCALER_PATH = Path(__file__).parent / "data" / "lstm_scaler.joblib"

# Constantes climaticas para el Caribe colombiano (base NASA POWER)
CARIBE_CLIMATOLOGY = {
    1:  {"temp": 27.5, "precip": 15,  "hum": 75},   # Enero
    2:  {"temp": 27.8, "precip": 10,  "hum": 73},   # Febrero
    3:  {"temp": 28.2, "precip": 20,  "hum": 72},   # Marzo
    4:  {"temp": 28.5, "precip": 60,  "hum": 76},   # Abril
    5:  {"temp": 28.3, "precip": 120, "hum": 80},   # Mayo
    6:  {"temp": 28.0, "precip": 100, "hum": 82},   # Junio
    7:  {"temp": 28.0, "precip": 90,  "hum": 81},   # Julio
    8:  {"temp": 28.0, "precip": 110, "hum": 82},   # Agosto
    9:  {"temp": 27.8, "precip": 130, "hum": 84},   # Septiembre
    10: {"temp": 27.5, "precip": 150, "hum": 86},   # Octubre
    11: {"temp": 27.3, "precip": 100, "hum": 85},   # Noviembre
    12: {"temp": 27.2, "precip": 40,  "hum": 78},   # Diciembre
}

# Minimo de meses requeridos para entrenar el LSTM
MIN_TRAINING_MONTHS = 24


def _generate_synthetic_nasa_series(
    lat: float = 10.97,
    lng: float = -74.78,
    n_months: int = 48,
    seed: int = 42,
) -> list[dict]:
    """Genera serie temporal sintetica con patrones climaticos del Caribe.

    Usa climatologia base NASA POWER para la region y agrega variabilidad
    estacional realista con ruido controlado.

    Args:
        lat: Latitud de la ubicacion objetivo.
        lng: Longitud de la ubicacion objetivo.
        n_months: Numero de meses a generar (minimo 24).
        seed: Semilla aleatoria para reproducibilidad.

    Returns:
        Lista de diccionarios con temperatura, precipitacion y humedad por mes.
    """
    rng = np.random.default_rng(seed)
    data = []

    # Factor de ajuste por latitud (mas calido cerca del ecuador)
    lat_factor = 1.0 + max(0, (12 - abs(lat)) * 0.02)

    for i in range(n_months):
        month = (i % 12) + 1
        base = CARIBE_CLIMATOLOGY[month]

        # Variacion estacional con ruido gaussiano controlado
        temp = base["temp"] * lat_factor + rng.normal(0, 1.2)
        temp = round(max(22.0, min(38.0, temp)), 1)

        # Precipitacion con mayor varianza en meses humedos
        prec_std = 30 if base["precip"] > 80 else 12
        precip = base["precip"] + rng.normal(0, prec_std)
        precip = round(max(0.0, min(350.0, precip)), 1)

        # Humedad relativa
        hum = base["hum"] + rng.normal(0, 4.0)
        hum = round(max(55.0, min(98.0, hum)), 1)

        data.append({
            "temperatura": temp,
            "precipitacion": precip,
            "humedad": hum,
        })

    return data


def _prepare_sequences(
    data: list[dict],
    sequence_length: int = 12,
    forecast_horizon: int = 6,
) -> tuple[np.ndarray, np.ndarray, StandardScaler]:
    """Convierte serie temporal en secuencias para entrenamiento LSTM.

    Args:
        data: Lista de diccionarios con datos climaticos mensuales.
        sequence_length: Ventana de meses de entrada (default 12).
        forecast_horizon: Meses a predecir (default 6).

    Returns:
        Tupla (X, y, scaler) con secuencias normalizadas.
    """
    # Extraer features: temperatura, precipitacion, humedad
    features = np.array([
        [d["temperatura"], d["precipitacion"], d["humedad"]]
        for d in data
    ], dtype=np.float32)

    # Normalizar
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)

    X, y_temp, y_prec, y_hum = [], [], [], []

    total_sequences = len(data) - sequence_length - forecast_horizon + 1
    if total_sequences <= 0:
        raise ValueError(
            f"Datos insuficientes: se necesitan al menos "
            f"{sequence_length + forecast_horizon} meses, "
            f"se recibieron {len(data)}"
        )

    for i in range(total_sequences):
        seq_x = features_scaled[i:i + sequence_length]
        seq_y_start = i + sequence_length
        seq_y = features_scaled[seq_y_start:seq_y_start + forecast_horizon]

        X.append(seq_x)
        y_temp.append(seq_y[:, 0])
        y_prec.append(seq_y[:, 1])
        y_hum.append(seq_y[:, 2])

    X = np.array(X, dtype=np.float32)

    # Targets: forma (n_samples, forecast_horizon, 3)
    y = np.stack([
        np.array(y_temp, dtype=np.float32),
        np.array(y_prec, dtype=np.float32),
        np.array(y_hum, dtype=np.float32),
    ], axis=-1)

    return X, y, scaler


class LSTMModel:
    """Modelo LSTM para prediccion de anomalias climaticas a 6 meses.

    Entrenado con datos sinteticos basados en climatologia NASA POWER.
    Predice desviaciones de temperatura, precipitacion y humedad
    para los proximos 6 meses.

    Uso:
        # Entrenar
        data = _generate_synthetic_nasa_series(lat=10.97, lng=-74.78)
        metrics = LSTMModel.train_lstm(data)

        # Predecir
        anomalias = LSTMModel.predict_lstm(lat=10.97, lng=-74.78)
    """

    @staticmethod
    def train_lstm(
        nasa_data: list[dict],
        sequence_length: int = 12,
        forecast_horizon: int = 6,
        model_path: Optional[Path] = None,
        scaler_path: Optional[Path] = None,
        epochs: int = 50,
        batch_size: int = 8,
        validation_split: float = 0.2,
    ) -> dict:
        """Entrena el modelo LSTM sobre datos sinteticos NASA POWER.

        Args:
            nasa_data: Lista de diccionarios con series temporales climaticas.
            sequence_length: Ventana de meses de entrada.
            forecast_horizon: Meses a predecir.
            model_path: Ruta para guardar el modelo .keras.
            scaler_path: Ruta para guardar el scaler .joblib.
            epochs: Epocas de entrenamiento.
            batch_size: Tamaño de batch.
            validation_split: Proporcion de datos para validacion.

        Returns:
            Diccionario con metricas de entrenamiento (loss, val_loss).

        Raises:
            ValueError: Si los datos son insuficientes.
        """
        import tensorflow as tf
        from tensorflow import keras

        if len(nasa_data) < MIN_TRAINING_MONTHS:
            raise ValueError(
                f"Datos insuficientes para entrenar LSTM: "
                f"se requieren al menos {MIN_TRAINING_MONTHS} meses, "
                f"se recibieron {len(nasa_data)}"
            )

        # Usar rutas por defecto si no se especifican
        model_path = model_path or DEFAULT_LSTM_MODEL_PATH
        scaler_path = scaler_path or DEFAULT_LSTM_SCALER_PATH

        # Crear directorio data si no existe
        model_path.parent.mkdir(parents=True, exist_ok=True)

        # Preparar secuencias
        X, y, scaler = _prepare_sequences(
            nasa_data,
            sequence_length=sequence_length,
            forecast_horizon=forecast_horizon,
        )

        n_features = 3  # temp, precip, humedad

        # Arquitectura LSTM ligera para datos sinteticos
        model = keras.Sequential([
            keras.layers.Input(shape=(sequence_length, n_features)),
            keras.layers.LSTM(32, return_sequences=True, activation="tanh"),
            keras.layers.Dropout(0.2),
            keras.layers.LSTM(16, activation="tanh"),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(forecast_horizon * n_features),
            keras.layers.Reshape((forecast_horizon, n_features)),
        ])

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss="mse",
            metrics=["mae"],
        )

        logger.info(
            f"Entrenando LSTM: {X.shape[0]} secuencias, "
            f"{sequence_length} meses → {forecast_horizon} meses"
        )

        history = model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=0,
        )

        # Guardar modelo y scaler
        model.save(model_path)
        jl_dump(scaler, scaler_path)

        loss = float(history.history["loss"][-1])
        val_loss = float(history.history["val_loss"][-1])

        logger.info(
            f"LSTM entrenado: loss={loss:.4f}, val_loss={val_loss:.4f}, "
            f"guardado en {model_path}"
        )

        return {
            "loss": loss,
            "val_loss": val_loss,
            "model_path": str(model_path),
            "scaler_path": str(scaler_path),
            "epochs": epochs,
        }

    @staticmethod
    def load_lstm(
        model_path: Optional[Path] = None,
        scaler_path: Optional[Path] = None,
    ) -> tuple:
        """Carga el modelo LSTM y scaler desde disco.

        Args:
            model_path: Ruta al archivo .keras del modelo.
            scaler_path: Ruta al archivo .joblib del scaler.

        Returns:
            Tupla (modelo_keras, scaler_sklearn).

        Raises:
            FileNotFoundError: Si el modelo o scaler no existen.
        """
        import tensorflow as tf
        from tensorflow import keras

        model_path = model_path or DEFAULT_LSTM_MODEL_PATH
        scaler_path = scaler_path or DEFAULT_LSTM_SCALER_PATH

        if not model_path.exists():
            raise FileNotFoundError(
                f"Modelo LSTM no encontrado en {model_path}. "
                f"Ejecute LSTMModel.train_lstm() primero."
            )
        if not scaler_path.exists():
            raise FileNotFoundError(
                f"Scaler LSTM no encontrado en {scaler_path}."
            )

        model = keras.models.load_model(model_path)
        scaler = jl_load(scaler_path)

        logger.info(f"LSTM cargado desde {model_path}")
        return model, scaler

    @staticmethod
    def predict_lstm(
        lat: float = 10.97,
        lng: float = -74.78,
        historical_window: int = 12,
        model_path: Optional[Path] = None,
        scaler_path: Optional[Path] = None,
    ) -> dict:
        """Predice anomalias climaticas para los proximos 6 meses.

        Usa el modelo LSTM entrenado para proyectar desviaciones
        de temperatura, precipitacion y humedad.

        Args:
            lat: Latitud de la ubicacion.
            lng: Longitud de la ubicacion.
            historical_window: Meses historicos a usar como entrada.
            model_path: Ruta al modelo .keras.
            scaler_path: Ruta al scaler .joblib.

        Returns:
            Diccionario con anomalias de temp, precip, hum (6 meses cada una)
            y confianza del modelo.
        """
        model_path = model_path or DEFAULT_LSTM_MODEL_PATH
        scaler_path = scaler_path or DEFAULT_LSTM_SCALER_PATH

        # Cargar modelo
        model, scaler = LSTMModel.load_lstm(model_path, scaler_path)

        # Generar datos historicos sinteticos para la ubicacion
        historical = _generate_synthetic_nasa_series(
            lat=lat, lng=lng, n_months=historical_window
        )

        # Preparar features
        features = np.array([
            [d["temperatura"], d["precipitacion"], d["humedad"]]
            for d in historical
        ], dtype=np.float32)

        # Normalizar con el scaler de entrenamiento
        features_scaled = scaler.transform(features)

        # Reshape para LSTM: (1, sequence_length, n_features)
        X = features_scaled.reshape(1, historical_window, 3)

        # Predecir
        predictions = model.predict(X, verbose=0)[0]  # (forecast_horizon, 3)

        # Des-normalizar para obtener valores reales
        pred_reshaped = predictions.reshape(-1, 3)
        pred_original = scaler.inverse_transform(pred_reshaped)

        # Obtener climatologia base para calcular anomalias
        base_data = _generate_synthetic_nasa_series(
            lat=lat, lng=lng, n_months=6, seed=99
        )

        temp_anomalies = []
        precip_anomalies = []
        hum_anomalies = []

        for i in range(6):
            pred_temp = float(pred_original[i, 0])
            pred_precip = float(pred_original[i, 1])
            pred_hum = float(pred_original[i, 2])

            base_temp = base_data[i]["temperatura"]
            base_precip = base_data[i]["precipitacion"]
            base_hum = base_data[i]["humedad"]

            temp_anomalies.append(round(pred_temp - base_temp, 2))
            precip_anomalies.append(round(pred_precip - base_precip, 1))
            hum_anomalies.append(round(pred_hum - base_hum, 1))

        # Calcular confianza basada en la magnitud de las predicciones
        # (valores extremos = menor confianza)
        max_temp_anom = max(abs(a) for a in temp_anomalies)
        confidence = round(max(0.3, min(0.95, 1.0 - max_temp_anom / 10.0)), 2)

        return {
            "temp_anomalies": temp_anomalies,
            "precip_anomalies": precip_anomalies,
            "hum_anomalies": hum_anomalies,
            "confidence": confidence,
        }
