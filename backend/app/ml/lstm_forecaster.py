"""LSTM Forecaster for precipitation and temperature anomalies (Fase 1).

Trained on real CHIRPS + ERA5 monthly time series (1990-2024).
Replaces the previous synthetic-data LSTM in lstm_model.py.

Architecture:
  - Input:  12 months of (precip, t2m, soil_moisture) → shape (12, 3)
  - Output: 6 months of anomalies (vs climatological mean) → shape (6, 3)
  - Loss:   MSE + 0.3 * MAE (combined for robustness to outliers)

Temporal split (no leakage):
  train  1990 – 2016
  val    2017 – 2019  (early stopping criterion)
  test   2020 – 2024  (honest evaluation)

Persistence:
  app/ml/data/lstm_forecaster.keras
  app/ml/data/lstm_forecaster_scaler.joblib
  app/ml/data/lstm_forecaster_clim.json   ← climatological means per month
"""
import json
import logging
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).parent / "data"
_DATA_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = _DATA_DIR / "lstm_forecaster.keras"
SCALER_PATH = _DATA_DIR / "lstm_forecaster_scaler.joblib"
CLIM_PATH = _DATA_DIR / "lstm_forecaster_clim.json"

SEQ_LEN = 12        # months of historical input
HORIZON = 6         # months to forecast ahead
N_FEATS = 3         # precip, t2m, soil_moisture
TRAIN_END = 2016
VAL_END = 2019


# ── Data collection ───────────────────────────────────────────────────────────

def _collect_series(dept_code: int) -> list[dict] | None:
    """Build monthly time series for a department centroid from CHIRPS + ERA5."""
    from app.ml.data_sources.config import DEPT_CENTROIDS
    from app.ml.data_sources.chirps import get_precip
    from app.ml.data_sources.era5 import get_era5_features

    coords = DEPT_CENTROIDS.get(dept_code)
    if coords is None:
        return None
    lon, lat = coords

    rows = []
    for year in range(1990, 2025):
        for month in range(1, 13):
            precip = get_precip(lat, lon, year, month)
            if precip is None:
                precip = float("nan")
            era5 = get_era5_features(lat, lon, year, month)
            rows.append({
                "year": year,
                "month": month,
                "precip": precip,
                "t2m": era5.get("era5_t2m", float("nan")),
                "soil_moisture": era5.get("era5_soil_moisture_mean", float("nan")),
            })
    return rows


def build_series_dataset() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray,
                                     np.ndarray, np.ndarray, dict]:
    """Collect CHIRPS+ERA5 time series for all departments and build sequences.

    Returns (X_tr, y_tr, X_val, y_val, X_te, y_te, climatology).
    """
    from app.ml.data_sources.config import DEPT_CENTROIDS

    logger.info("Collecting ERA5+CHIRPS series for %d departments…", len(DEPT_CENTROIDS))
    all_rows: list[dict] = []
    for dept_code in DEPT_CENTROIDS:
        rows = _collect_series(dept_code)
        if rows:
            all_rows.extend(rows)

    import pandas as pd
    df = pd.DataFrame(all_rows)

    # Compute climatological means per calendar month (from training period only)
    train_df = df[df["year"] <= TRAIN_END]
    clim: dict[int, dict[str, float]] = {}
    for m in range(1, 13):
        m_df = train_df[train_df["month"] == m]
        clim[m] = {
            "precip": float(m_df["precip"].mean(skipna=True)),
            "t2m": float(m_df["t2m"].mean(skipna=True)),
            "soil_moisture": float(m_df["soil_moisture"].mean(skipna=True)),
        }

    # Fill NaN with climatological mean
    def fill_row(row):
        c = clim[int(row["month"])]
        for col in ("precip", "t2m", "soil_moisture"):
            if np.isnan(row[col]):
                row[col] = c[col]
        return row

    df = df.apply(fill_row, axis=1)

    # Compute anomalies (target = deviation from climatological mean)
    def anomaly(row, col):
        return row[col] - clim[int(row["month"])][col]

    df["anom_precip"] = df.apply(lambda r: anomaly(r, "precip"), axis=1)
    df["anom_t2m"] = df.apply(lambda r: anomaly(r, "t2m"), axis=1)
    df["anom_soil"] = df.apply(lambda r: anomaly(r, "soil_moisture"), axis=1)

    feats_cols = ["precip", "t2m", "soil_moisture"]
    anom_cols = ["anom_precip", "anom_t2m", "anom_soil"]

    # Build sequences per department using per-dept series
    logger.info("Building sequences…")
    all_X_tr, all_y_tr = [], []
    all_X_val, all_y_val = [], []
    all_X_te, all_y_te = [], []

    for dept_code in DEPT_CENTROIDS:
        rows = _collect_series(dept_code)
        if not rows:
            continue
        dept_df = pd.DataFrame(rows)

        # Fill NaN
        for col in ("precip", "t2m", "soil_moisture"):
            dept_df[col] = dept_df.apply(
                lambda r, c=col: r[c] if not np.isnan(r[c]) else clim[int(r["month"])][c], axis=1
            )

        # Compute anomalies
        for col, acol in zip(feats_cols, anom_cols):
            dept_df[acol] = dept_df.apply(
                lambda r, c=col, ac=acol: r[c] - clim[int(r["month"])][c], axis=1
            )

        arr_feats = dept_df[feats_cols].values.astype(np.float32)    # (420, 3)
        arr_anoms = dept_df[anom_cols].values.astype(np.float32)     # (420, 3)
        years = dept_df["year"].values

        for i in range(len(dept_df) - SEQ_LEN - HORIZON + 1):
            x = arr_feats[i: i + SEQ_LEN]          # (12, 3)
            y = arr_anoms[i + SEQ_LEN: i + SEQ_LEN + HORIZON]  # (6, 3)
            end_year = int(years[i + SEQ_LEN - 1])

            if end_year <= TRAIN_END:
                all_X_tr.append(x)
                all_y_tr.append(y)
            elif end_year <= VAL_END:
                all_X_val.append(x)
                all_y_val.append(y)
            else:
                all_X_te.append(x)
                all_y_te.append(y)

    X_tr = np.array(all_X_tr, dtype=np.float32)
    y_tr = np.array(all_y_tr, dtype=np.float32)
    X_val = np.array(all_X_val, dtype=np.float32)
    y_val = np.array(all_y_val, dtype=np.float32)
    X_te = np.array(all_X_te, dtype=np.float32)
    y_te = np.array(all_y_te, dtype=np.float32)

    logger.info(
        "Sequences — train: %d | val: %d | test: %d",
        len(X_tr), len(X_val), len(X_te),
    )
    return X_tr, y_tr, X_val, y_val, X_te, y_te, clim


# ── Training ──────────────────────────────────────────────────────────────────

def train(epochs: int = 200, batch_size: int = 64) -> dict:
    """Train the LSTM forecaster on real CHIRPS+ERA5 series.

    Returns metrics dict with train/val/test RMSE per variable.
    """
    from sklearn.preprocessing import StandardScaler
    import joblib

    X_tr, y_tr, X_val, y_val, X_te, y_te, clim = build_series_dataset()

    if len(X_tr) == 0:
        raise RuntimeError("No training sequences built. Check CHIRPS/ERA5 availability.")

    # Scale input features (fit only on train)
    n_tr, seq, n_feat = X_tr.shape
    scaler = StandardScaler()
    X_tr_2d = X_tr.reshape(-1, n_feat)
    scaler.fit(X_tr_2d)

    def scale(X):
        s = X.shape
        return scaler.transform(X.reshape(-1, n_feat)).reshape(s)

    X_tr_s = scale(X_tr)
    X_val_s = scale(X_val)
    X_te_s = scale(X_te)

    try:
        from tensorflow import keras
        import tensorflow as tf
    except ImportError:
        raise ImportError("TensorFlow is required for LSTM training. pip install tensorflow")

    # ── Model ──
    inp = keras.Input(shape=(SEQ_LEN, N_FEATS))
    x = keras.layers.LSTM(64, return_sequences=True)(inp)
    x = keras.layers.Dropout(0.2)(x)
    x = keras.layers.LSTM(32)(x)
    x = keras.layers.Dropout(0.2)(x)
    x = keras.layers.Dense(HORIZON * N_FEATS)(x)
    out = keras.layers.Reshape((HORIZON, N_FEATS))(x)
    model = keras.Model(inp, out)

    def combined_loss(y_true, y_pred):
        return tf.reduce_mean(tf.square(y_true - y_pred)) + \
               0.3 * tf.reduce_mean(tf.abs(y_true - y_pred))

    model.compile(optimizer=keras.optimizers.Adam(1e-3), loss=combined_loss)

    cb = [
        keras.callbacks.EarlyStopping(
            patience=15, restore_best_weights=True, monitor="val_loss"
        ),
        keras.callbacks.ReduceLROnPlateau(
            patience=7, factor=0.4, min_lr=1e-5
        ),
    ]

    logger.info("Training LSTM: %d sequences, %d epochs", len(X_tr), epochs)
    model.fit(
        X_tr_s, y_tr,
        validation_data=(X_val_s, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=cb,
        verbose=1,
    )

    # ── Evaluate ──
    def rmse_per_var(X_s, y_true):
        pred = model.predict(X_s, verbose=0)
        err = y_true - pred           # (n, 6, 3)
        return np.sqrt(np.mean(err ** 2, axis=(0, 1)))  # (3,)

    rmse_tr = rmse_per_var(X_tr_s, y_tr)
    rmse_val = rmse_per_var(X_val_s, y_val)
    rmse_te = rmse_per_var(X_te_s, y_te)
    var_names = ["precip_mm", "t2m_c", "soil_moisture"]

    logger.info("Test RMSE — %s", dict(zip(var_names, rmse_te.round(3).tolist())))

    # ── Persist ──
    model.save(MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    CLIM_PATH.write_text(json.dumps(clim))
    logger.info("LSTM saved: %s", MODEL_PATH)

    return {
        "train_rmse": dict(zip(var_names, rmse_tr.round(4).tolist())),
        "val_rmse": dict(zip(var_names, rmse_val.round(4).tolist())),
        "test_rmse": dict(zip(var_names, rmse_te.round(4).tolist())),
        "n_train": int(len(X_tr)),
        "n_val": int(len(X_val)),
        "n_test": int(len(X_te)),
    }


# ── Inference ─────────────────────────────────────────────────────────────────

class LSTMForecaster:
    """Thin wrapper around the trained LSTM for anomaly forecasting."""

    def __init__(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"LSTM model not found: {MODEL_PATH}. Run lstm_forecaster.train() first."
            )
        import joblib
        from tensorflow import keras
        self._model = keras.models.load_model(MODEL_PATH, compile=False)
        self._scaler = joblib.load(SCALER_PATH)
        self._clim: dict[int, dict[str, float]] = {
            int(k): v for k, v in json.loads(CLIM_PATH.read_text()).items()
        }

    def predict(self, lat: float, lon: float, year: int, month: int) -> dict:
        """Forecast anomalies for 6 months starting from (year, month+1).

        Returns dict with keys: precip_anomalies, t2m_anomalies,
        soil_anomalies — each a list of 6 floats.
        """
        from app.ml.data_sources.chirps import get_precip
        from app.ml.data_sources.era5 import get_era5_features

        # Build 12-month input ending at (year, month)
        rows = []
        y, m = year, month
        for _ in range(SEQ_LEN):
            precip = get_precip(lat, lon, y, m)
            if precip is None:
                precip = self._clim.get(m, {}).get("precip", 80.0)
            era5 = get_era5_features(lat, lon, y, m)
            t2m = era5.get("era5_t2m", self._clim.get(m, {}).get("t2m", 27.0))
            soil = era5.get("era5_soil_moisture_mean", self._clim.get(m, {}).get("soil_moisture", 0.4))
            rows.insert(0, [precip, t2m, soil])
            m -= 1
            if m == 0:
                m, y = 12, y - 1

        X = np.array(rows, dtype=np.float32).reshape(1, SEQ_LEN, N_FEATS)
        X_s = self._scaler.transform(X.reshape(-1, N_FEATS)).reshape(1, SEQ_LEN, N_FEATS)

        pred = self._model.predict(X_s, verbose=0)[0]  # (6, 3)

        # pred already contains anomalies (model was trained on anomaly targets)
        return {
            "precip_anomalies": [round(float(v), 2) for v in pred[:, 0]],
            "t2m_anomalies": [round(float(v), 2) for v in pred[:, 1]],
            "soil_anomalies": [round(float(v), 2) for v in pred[:, 2]],
        }


def is_trained() -> bool:
    return MODEL_PATH.exists() and SCALER_PATH.exists() and CLIM_PATH.exists()
