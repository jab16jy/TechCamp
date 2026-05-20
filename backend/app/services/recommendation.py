import logging

from app.ml.inference import predict_crop_recommendations
from app.schemas.clima import ClimateData
from app.schemas.satelite import SatelliteData
from app.schemas.analisis import RecomendacionCultivo

logger = logging.getLogger(__name__)


async def generate_recommendations(
    climate: ClimateData,
    satellite: SatelliteData,
    ph_suelo: float,
    materia_organica: float,
    textura_suelo: str,
    tipo_suelo: str,
    mes_siembra: str,
) -> list[RecomendacionCultivo]:
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
    )
    logger.info(f"Recomendaciones generadas via {metodo}")

    return [RecomendacionCultivo(**s) for s in scores]
