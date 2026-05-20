import logging
from pathlib import Path

import numpy as np
from joblib import load

from app.ml.model import get_crop_classifier
from app.ml.training import FEATURE_COLS, ENGINEERED_COLS, ALL_FEATURE_COLS, TEXTURE_MAP, MODEL_PATH, SCALER_PATH, train_model

logger = logging.getLogger(__name__)

_model = None
_scaler = None


def _load_rf():
    global _model, _scaler
    if _model is not None and _scaler is not None:
        return _model, _scaler

    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        logger.info("Modelo RF no encontrado. Entrenando...")
        try:
            train_model()
        except Exception as e:
            logger.warning(f"Error entrenando modelo RF: {e}")
            return None, None

    try:
        _model = load(MODEL_PATH)
        _scaler = load(SCALER_PATH)
        logger.info("Modelo RF cargado exitosamente")
    except Exception as e:
        logger.warning(f"No se pudo cargar el modelo RF: {e}")
        _model = None
        _scaler = None

    return _model, _scaler


def _enrich_with_metadata(results: list[dict]) -> list[dict]:
    classifier = get_crop_classifier()
    for r in results:
        raw_name = r["cultivo"].replace(" ", "_")
        crop_data = next(
            (c for c in classifier.crops if c["cultivo"] == raw_name), None
        )
        if crop_data:
            r.setdefault("emoji", crop_data.get("emoji", ""))
            r.setdefault("ciclo_dias", crop_data.get("ciclo_dias"))
            r.setdefault(
                "rendimiento_estimado",
                f"{crop_data.get('rendimiento_promedio', '')} t/ha",
            )
        else:
            r.setdefault("emoji", "")
            r.setdefault("ciclo_dias", None)
            r.setdefault("rendimiento_estimado", None)
    return results


def predict_crop_recommendations(
    temperatura: float,
    humedad: float,
    precipitacion: float,
    ph_suelo: float,
    materia_organica: float,
    ndvi: float,
    textura_suelo: str = "",
    tipo_suelo: str = "",
    mes_siembra: str = "",
) -> tuple[list[dict], str]:
    model, scaler = _load_rf()

    if model is not None and scaler is not None:
        try:
            # Codificar textura si esta disponible, si no usar valor neutral (7 = Franco)
            textura_encoded = TEXTURE_MAP.get(textura_suelo, 7.0)

            # Construir vector con features originales + engineered
            features = {
                "temperatura": temperatura,
                "humedad": humedad,
                "precipitacion": precipitacion,
                "ph_suelo": ph_suelo,
                "materia_organica": materia_organica,
                "ndvi": ndvi,
                "textura_encoded": textura_encoded,
            }

            # Calcular interacciones (debe coincidir con training.py)
            features["temp_hum_interaction"] = temperatura * humedad / 1000.0
            features["ph_mo_interaction"] = ph_suelo * materia_organica
            features["precip_hum_ratio"] = precipitacion / max(humedad, 1.0)

            feat_vector = [features.get(c, 0) for c in ALL_FEATURE_COLS]
            X = np.array([feat_vector])
            X_scaled = scaler.transform(X)
            probas = model.predict_proba(X_scaled)[0]
            classes = model.classes_

            results = []
            for cultivo, prob in zip(classes, probas):
                score = int(prob * 100)
                results.append(
                    {
                        "cultivo": cultivo.replace("_", " "),
                        "score": score,
                        "riesgo": "bajo" if score >= 80 else ("medio" if score >= 55 else "alto"),
                        "justificacion": f"Probabilidad estimada por modelo Random Forest: {prob:.1%}",
                        "emoji": "",
                        "ciclo_dias": None,
                        "rendimiento_estimado": None,
                        "metodo": "random_forest",
                        "probabilidad": round(float(prob), 4),
                    }
                )

            results.sort(key=lambda r: r["score"], reverse=True)
            results = _enrich_with_metadata(results[:3])
            return results, "random_forest"
        except Exception as e:
            logger.warning(f"Error en prediccion RF: {e}. Fallback a heuristico.")

    classifier = get_crop_classifier()
    scores = classifier.score(
        temperatura=temperatura,
        humedad=humedad,
        precipitacion=precipitacion,
        ph_suelo=ph_suelo,
        materia_organica=materia_organica,
        ndvi=ndvi,
        textura_suelo=textura_suelo,
        tipo_suelo=tipo_suelo,
        mes_siembra=mes_siembra,
    )
    for s in scores:
        s["metodo"] = "heuristico"
        s["probabilidad"] = None
    return scores, "heuristico"
