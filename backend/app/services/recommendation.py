import logging

from app.ml.model import get_crop_classifier
from app.schemas.analisis import ClimateData, SatelliteData, RecomendacionCultivo

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
    classifier = get_crop_classifier()

    scores = classifier.score(
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

    return [RecomendacionCultivo(**s) for s in scores]
