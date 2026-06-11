import logging
from pathlib import Path

import numpy as np
from joblib import load

from app.ml.model import get_crop_classifier
from app.ml.training import FEATURE_COLS, ENGINEERED_COLS, ALL_FEATURE_COLS, TEXTURE_MAP, MODEL_PATH, SCALER_PATH, train_model

logger = logging.getLogger(__name__)

_model = None
_scaler = None
_real_profiles = None

_PROFILE_NAME_MAP = {
    "Palma Aceitera": "Palma",
}


def _get_real_profiles() -> dict:
    global _real_profiles
    if _real_profiles is not None:
        return _real_profiles
    try:
        from app.ml.perfiles_reales import PerfilCultivoReal
        _real_profiles = PerfilCultivoReal.load_all()
        logger.info("Perfiles reales cargados: %d cultivos", len(_real_profiles))
    except Exception as e:
        logger.warning("No se pudieron cargar perfiles reales para semáforo: %s", e)
        _real_profiles = {}
    return _real_profiles


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
    """Enrich RF results with metadata from crops_requirements.csv and chemistry profiles.

    Always overwrites emoji/ciclo_dias/rendimiento_estimado with real data
    because the inference loop pre-populates these keys with empty/None values
    before calling this function — setdefault() would silently skip them.
    """
    classifier = get_crop_classifier()
    profiles = _get_real_profiles()

    for r in results:
        raw_name = r["cultivo"].replace(" ", "_")
        crop_data = next(
            (c for c in classifier.crops if c["cultivo"] == raw_name), None
        )
        if crop_data:
            r["emoji"] = crop_data.get("emoji", "")
            r["ciclo_dias"] = crop_data.get("ciclo_dias")
            r["rendimiento_estimado"] = f"{crop_data.get('rendimiento_promedio', '')} t/ha"
        else:
            r["emoji"] = ""
            r["ciclo_dias"] = None
            r["rendimiento_estimado"] = None

        # Chemistry profile for semaphore comparison (p10/p90 per analyte)
        profile_name = _PROFILE_NAME_MAP.get(r["cultivo"], r["cultivo"])
        profile = profiles.get(profile_name)
        if profile:
            r["perfil_quimico"] = {
                "calcio_p10": profile.calcio_p10,        "calcio_p90": profile.calcio_p90,
                "cic_p10": profile.cic_p10,              "cic_p90": profile.cic_p90,
                "conductividad_p10": profile.conductividad_p10, "conductividad_p90": profile.conductividad_p90,
                "magnesio_p10": profile.magnesio_p10,    "magnesio_p90": profile.magnesio_p90,
                "fosforo_p10": profile.p_bray_p10,       "fosforo_p90": profile.p_bray_p90,
                "potasio_p10": profile.k_interc_p10,     "potasio_p90": profile.k_interc_p90,
                "azufre_p10": profile.azufre_p10,        "azufre_p90": profile.azufre_p90,
                "boro_p10": profile.boro_p10,            "boro_p90": profile.boro_p90,
                "sodio_p10": profile.sodio_p10,          "sodio_p90": profile.sodio_p90,
            }
        else:
            r["perfil_quimico"] = {}

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
    lstm_anomalies: dict | None = None,
    altitud: float = 0.0,
    ndwi: float = 0.0,
    # New soil features
    calcio: float | None = None,
    magnesio: float | None = None,
    azufre: float | None = None,
    boro: float | None = None,
    sodio: float | None = None,
    p_bray: float | None = None,
    k_interc: float | None = None,
    cic: float | None = None,
    conductividad: float | None = None,
) -> tuple[list[dict], str]:
    """Predice recomendaciones de cultivo con ensemble RF+LSTM.

    Combina Random Forest (60%) con ajuste heuristico basado en
    anomalias LSTM (40%) cuando el LSTM esta disponible.
    Si lstm_anomalies es None, opera en modo RF puro (fallback).

    Args:
        temperatura: Temperatura actual en °C.
        humedad: Humedad relativa en %.
        precipitacion: Precipitacion acumulada en mm.
        ph_suelo: pH del suelo.
        materia_organica: Materia organica en %.
        ndvi: Indice de vegetacion NDVI.
        textura_suelo: Clasificacion USDA de textura.
        tipo_suelo: Tipo de suelo general.
        mes_siembra: Mes de siembra previsto.
        lstm_anomalies: Anomalias climaticas del LSTM a 6 meses
            (dict con temp_anomalies, precip_anomalies, hum_anomalies, confidence).
            None para usar solo RF.
        altitud: Elevacion del terreno en metros. Default 0.0.
        ndwi: Indice de agua NDWI. Default 0.0.
        calcio: Contenido de calcio.
        magnesio: Contenido de magnesio.
        azufre: Contenido de azufre.
        boro: Contenido de boro.
        sodio: Contenido de sodio.
        p_bray: Fósforo Bray.
        k_interc: Potasio intercambiable.
        cic: Capacidad de intercambio catiónico.
        conductividad: Conductividad eléctrica.

    Returns:
        Tupla (resultados, metodo) donde metodo indica el motor usado:
        'ensemble_rf_lstm', 'rf_fallback', o 'heuristico'.
    """
    model, scaler = _load_rf()

    classifier = get_crop_classifier()
    heuristic_scores = classifier.score_with_factors(
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
    _heuristic_by_crop = {h["cultivo"]: h.get("factor_weights", []) for h in heuristic_scores}

    if model is not None and scaler is not None:
        try:
            textura_encoded = TEXTURE_MAP.get(textura_suelo, 7.0)

            features = {
                "temperatura": temperatura,
                "humedad": humedad,
                "precipitacion": precipitacion,
                "ph_suelo": ph_suelo,
                "materia_organica": materia_organica,
                # Use provided values or regional defaults (matching synthetic training averages)
                "calcio": calcio if calcio is not None else 5.0,
                "magnesio": magnesio if magnesio is not None else 1.5,
                "azufre": azufre if azufre is not None else 15.0,
                "boro": boro if boro is not None else 0.3,
                "sodio": sodio if sodio is not None else 0.1,
                "p_bray": p_bray if p_bray is not None else 15.0,
                "k_interc": k_interc if k_interc is not None else 0.3,
                "cic": cic if cic is not None else 15.0,
                "conductividad": conductividad if conductividad is not None else 0.5,
                "ndvi": ndvi,
                "ndwi": ndwi,
                "textura_encoded": textura_encoded,
                "altitud": altitud,
            }

            features["precip_hum_ratio"] = precipitacion / max(humedad, 1.0)
            features["precip_temp_ratio"] = precipitacion / max(temperatura, 0.1)
            features["ndvi_ndwi_ratio"] = ndvi / max(ndwi, 0.01)

            feat_vector = [features.get(c, 0) for c in ALL_FEATURE_COLS]
            X = np.array([feat_vector])
            X_scaled = scaler.transform(X)
            probas = model.predict_proba(X_scaled)[0]
            classes = model.classes_

            results = []
            for cultivo, prob in zip(classes, probas):
                score = int(prob * 100)
                crop_name = cultivo.replace("_", " ")
                results.append({
                    "cultivo": crop_name,
                    "score": score,
                    "riesgo": "bajo" if score >= 80 else ("medio" if score >= 55 else "alto"),
                    "justificacion": f"Probabilidad estimada por modelo Random Forest: {prob:.1%}",
                    "emoji": "",
                    "ciclo_dias": None,
                    "rendimiento_estimado": None,
                    "metodo": "random_forest",
                    "probabilidad": round(float(prob), 4),
                    "factor_weights": _heuristic_by_crop.get(crop_name, []),
                })

            results.sort(key=lambda r: r["score"], reverse=True)

            # --- Ensemble RF + LSTM (60/40) ---
            if lstm_anomalies is not None:
                results = _apply_lstm_ensemble(
                    results, lstm_anomalies, temperatura, humedad, precipitacion
                )
                metodo_detectado = "ensemble_rf_lstm"
            else:
                metodo_detectado = "random_forest"

            results = _enrich_with_metadata(results[:3])
            return results, metodo_detectado
        except Exception as e:
            logger.warning(f"Error en prediccion RF: {e}. Fallback a heuristico.")

    for s in heuristic_scores:
        s["metodo"] = "heuristico"
        s["probabilidad"] = None
    return heuristic_scores, "heuristico"


def _apply_lstm_ensemble(
    rf_results: list[dict],
    lstm_anomalies: dict,
    temperatura: float,
    humedad: float,
    precipitacion: float,
) -> list[dict]:
    """Aplica ajuste de ensemble 60% RF + 40% LSTM sobre los scores.

    El LSTM ajusta los scores del RF basado en las anomalias climaticas
    proyectadas a 6 meses. Anomalias extremas reducen el score,
    condiciones favorables lo mantienen o mejoran ligeramente.

    Args:
        rf_results: Resultados ordenados del Random Forest.
        lstm_anomalies: Diccionario con anomalias del LSTM.
        temperatura: Temperatura base.
        humedad: Humedad base.
        precipitacion: Precipitacion base.

    Returns:
        Lista de resultados con scores ajustados por ensemble.
    """
    temp_anoms = lstm_anomalies.get("temp_anomalies", [0] * 6)
    precip_anoms = lstm_anomalies.get("precip_anomalies", [0] * 6)
    hum_anoms = lstm_anomalies.get("hum_anomalies", [0] * 6)
    lstm_confidence = lstm_anomalies.get("confidence", 0.7)

    # Calcular factor de ajuste LSTM basado en anomalias promedio
    avg_temp_anom = sum(temp_anoms) / max(len(temp_anoms), 1)
    avg_precip_anom = sum(precip_anoms) / max(len(precip_anoms), 1)
    avg_hum_anom = sum(hum_anoms) / max(len(hum_anoms), 1)

    # Factor LSTM: penaliza anomalias extremas
    # Temp: ideal 0-1°C, critico >4°C o < -2°C
    temp_factor = max(0.5, 1.0 - abs(avg_temp_anom) / 8.0)
    # Precip: deficit severo (< -30%) o exceso (> +40%) penalizan
    precip_factor = 1.0
    if avg_precip_anom < -20:
        precip_factor = max(0.4, 1.0 - abs(avg_precip_anom) / 50.0)
    elif avg_precip_anom > 30:
        precip_factor = max(0.6, 1.0 - (avg_precip_anom - 30) / 70.0)
    # Humedad: desviaciones >10% penalizan
    hum_factor = max(0.6, 1.0 - abs(avg_hum_anom) / 20.0)

    # Factor combinado LSTM (ponderado por confianza del modelo)
    lstm_factor = (temp_factor * 0.4 + precip_factor * 0.35 + hum_factor * 0.25)
    lstm_factor = lstm_factor * lstm_confidence + 1.0 * (1.0 - lstm_confidence)

    for result in rf_results:
        rf_score = result["score"] / 100.0  # Normalizar 0-1
        # Ensemble: 60% RF + 40% LSTM heuristico
        ensemble_score = rf_score * 0.6 + lstm_factor * 0.4
        result["score"] = int(max(5, min(98, ensemble_score * 100)))
        result["metodo"] = "ensemble_rf_lstm"
        # Agregar info de anomalias al resultado
        result["lstm_confidence"] = lstm_confidence
        result["temp_anomaly_avg"] = round(avg_temp_anom, 2)
        result["precip_anomaly_avg"] = round(avg_precip_anom, 1)

    return rf_results
