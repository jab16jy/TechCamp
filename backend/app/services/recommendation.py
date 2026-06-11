import logging

from app.ml.inference import predict_crop_recommendations
from app.schemas.clima import ClimateData
from app.schemas.satelite import SatelliteData
from app.schemas.analisis import RecomendacionCultivo

logger = logging.getLogger(__name__)


def _anomaly_to_lstm_format(anomaly: dict | None) -> dict | None:
    """Convierte AnomaliaClimatica (single-month) al formato lstm_anomalies
    (6-month series) que espera _apply_lstm_ensemble.

    Si el anomaly esta mal formado (None, o sin campos requeridos), retorna
    None para activar el fallback RF puro sin errores.

    La proyeccion LSTM real genera 6 meses de anomalias; aqui replicamos el
    mismo valor actual 6 veces (la media del ensemble es invariante a esta
    replicacion). Confidence se mantiene en 0.7 (default conservador del
    modelo), podria afinarse segun la magnitud de la anomalia real.
    """
    if not anomaly or not isinstance(anomaly, dict):
        return None
    try:
        temp = float(anomaly.get("anomalia_temperatura", 0.0))
        precip = float(anomaly.get("anomalia_precipitacion", 0.0))
        hum = float(anomaly.get("anomalia_humedad", 0.0))
    except (TypeError, ValueError):
        logger.warning("anomaly mal formado, fallback a RF puro")
        return None
    return {
        "temp_anomalies": [temp] * 6,
        "precip_anomalies": [precip] * 6,
        "hum_anomalies": [hum] * 6,
        "confidence": 0.7,
    }


async def generate_recommendations(
    climate: ClimateData,
    satellite: SatelliteData,
    ph_suelo: float,
    materia_organica: float,
    textura_suelo: str,
    tipo_suelo: str,
    mes_siembra: str,
    anomaly: dict | None = None,
    altitud: float = 0.0,
    calcio: float | None = None,
    magnesio: float | None = None,
    azufre: float | None = None,
    boro: float | None = None,
    sodio: float | None = None,
    fosforo: float | None = None,
    potasio: float | None = None,
    cic: float | None = None,
    conductividad: float | None = None,
) -> list[RecomendacionCultivo]:
    lstm_anomalies = _anomaly_to_lstm_format(anomaly)
    scores, metodo = predict_crop_recommendations(
        temperatura=climate.temperatura,
        humedad=climate.humedad,
        precipitacion=climate.precipitacion,
        ph_suelo=ph_suelo,
        materia_organica=materia_organica,
        ndvi=satellite.ndvi,
        textura_suelo=textura_suelo,
        tipo_suelo=tipo_suelo,
        mes_siembra=mes_siembra,
        lstm_anomalies=lstm_anomalies,
        altitud=altitud,
        calcio=calcio,
        magnesio=magnesio,
        azufre=azufre,
        boro=boro,
        sodio=sodio,
        p_bray=fosforo,
        k_interc=potasio,
        cic=cic,
        conductividad=conductividad,
    )
    logger.info(f"Recomendaciones generadas via {metodo}")

    return [RecomendacionCultivo(**s) for s in scores]
