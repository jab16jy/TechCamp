import csv
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from joblib import dump, load

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "crop_model_rf.joblib"
SCALER_PATH = Path(__file__).parent / "crop_scaler.joblib"
CSV_PATH = Path(__file__).parent / "crops_requirements.csv"

FEATURE_COLS = [
    "temperatura",
    "humedad",
    "precipitacion",
    "ph_suelo",
    "materia_organica",
    "ndvi",
]


def generate_synthetic_dataset(n_samples_per_crop: int = 200) -> pd.DataFrame:
    crops_df = pd.read_csv(CSV_PATH)
    rows = []

    for _, crop in crops_df.iterrows():
        for _ in range(n_samples_per_crop):
            temp = np.random.uniform(crop["temp_min"], crop["temp_max"])
            hum = np.random.uniform(crop["humedad_min"], crop["humedad_max"])
            prec = np.random.uniform(crop["precipitacion_min"], crop["precipitacion_max"])
            ph = np.random.uniform(crop["ph_min"], crop["ph_max"])
            mo = np.random.uniform(max(0.5, crop["materia_organica_min"] - 1.0), crop["materia_organica_min"] + 2.0)
            ndvi = np.random.uniform(0.2, 0.9)

            rows.append({
                "temperatura": temp,
                "humedad": hum,
                "precipitacion": prec,
                "ph_suelo": ph,
                "materia_organica": mo,
                "ndvi": ndvi,
                "cultivo": crop["cultivo"],
            })

    return pd.DataFrame(rows)


def train_model(
    n_samples_per_crop: int = 200,
    test_size: float = 0.2,
    random_state: int = 42,
) -> dict:
    logger.info("Generando dataset sintetico de entrenamiento...")
    df = generate_synthetic_dataset(n_samples_per_crop)

    X = df[FEATURE_COLS].values
    y = df["cultivo"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        random_state=random_state,
        n_jobs=-1,
    )
    logger.info("Entrenando Random Forest...")
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled) if hasattr(model, "predict_proba") else None

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision_macro": round(precision_score(y_test, y_pred, average="macro", zero_division=0), 4),
        "recall_macro": round(recall_score(y_test, y_pred, average="macro", zero_division=0), 4),
        "f1_macro": round(f1_score(y_test, y_pred, average="macro", zero_division=0), 4),
    }

    cv_scores = cross_val_score(model, scaler.transform(X), y, cv=5, scoring="accuracy")
    metrics["cv_accuracy_mean"] = round(cv_scores.mean(), 4)
    metrics["cv_accuracy_std"] = round(cv_scores.std(), 4)

    dump(model, MODEL_PATH)
    dump(scaler, SCALER_PATH)
    logger.info(f"Modelo guardado en {MODEL_PATH}")
    logger.info(f"Metricas: {metrics}")

    return metrics


def load_model() -> tuple[Optional[RandomForestClassifier], Optional[StandardScaler]]:
    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        logger.warning("Modelo no encontrado. Ejecuta train_model() primero.")
        return None, None
    model = load(MODEL_PATH)
    scaler = load(SCALER_PATH)
    return model, scaler


def predict(model, scaler, features: dict) -> tuple[str, dict]:
    if model is None or scaler is None:
        return "Modelo no disponible", {}

    X = np.array([[features.get(c, 0) for c in FEATURE_COLS]])
    X_scaled = scaler.transform(X)

    probas = model.predict_proba(X_scaled)[0]
    classes = model.classes_

    results = sorted(
        [{"cultivo": c, "probabilidad": round(float(p), 4)} for c, p in zip(classes, probas)],
        key=lambda x: x["probabilidad"],
        reverse=True,
    )

    return results[0]["cultivo"], {"top": results[:3]}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    metrics = train_model()
    print(f"\nResultados del entrenamiento:")
    for k, v in metrics.items():
        print(f"  {k}: {v}")
