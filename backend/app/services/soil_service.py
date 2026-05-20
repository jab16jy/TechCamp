import logging

import httpx

logger = logging.getLogger(__name__)

ISRIC_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
ISRIC_PROPERTIES = ["phh2o", "soc", "sand", "silt", "clay"]
ISRIC_DEPTH = "0-5cm"


def _usda_texture_class(sand: float, silt: float, clay: float) -> str:
    """Clasifica la textura del suelo usando el triangulo USDA con % normalizados."""
    total = sand + silt + clay
    if total == 0:
        return "Desconocido"
    s = sand / total * 100
    si = silt / total * 100
    c = clay / total * 100

    if c >= 40 and s <= 45 and si <= 40:
        return "Arcilloso"
    if c >= 35 and s >= 45:
        return "Arcillo-Arenoso"
    if c >= 40 and si >= 40:
        return "Arcillo-Limoso"
    if 27 <= c < 40 and 20 <= s <= 45 and si <= 40:
        return "Franco-Arcilloso"
    if 27 <= c < 40 and si >= 40:
        return "Franco-Arcillo-Limoso"
    if 20 <= c < 35 and s >= 45 and si <= 28:
        return "Franco-Arcillo-Arenoso"
    if 7 <= c <= 27 and 28 <= si <= 50 and s <= 52:
        return "Franco"
    if 7 <= c <= 27 and si >= 50:
        return "Franco-Limoso"
    if s >= 52 and c <= 20 and (s < 85 or c > 10):
        return "Franco-Arenoso"
    if si >= 80 and c <= 12:
        return "Limoso"
    if 70 <= s < 90 and c <= 15:
        return "Areno-Francoso"
    if s >= 85:
        return "Arenoso"
    if si >= 50 and 0 <= c <= 27:
        return "Franco-Limoso"
    return "Franco"


async def get_soil_data(lat: float, lng: float) -> dict | None:
    """Obtiene pH, materia organica y textura desde ISRIC SoilGrids v2.0."""
    body = {
        "lon": lng,
        "lat": lat,
        "property": ISRIC_PROPERTIES,
        "depth": [ISRIC_DEPTH],
        "value": "mean",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.post(ISRIC_URL, json=body)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.warning(f"SoilGrids API no disponible: {e}")
            return None

    layers = data.get("properties", {}).get("layers", [])
    if not layers:
        logger.warning("SoilGrids: sin datos para las coordenadas dadas")
        return None

    values = {}
    for layer in layers:
        name = layer.get("name", "")
        depths = layer.get("depths", [])
        if not depths:
            continue
        val = depths[0].get("values", {}).get("mean")
        values[name] = val

    ph = values.get("phh2o")
    soc = values.get("soc")
    sand = values.get("sand")
    silt = values.get("silt")
    clay = values.get("clay")

    if ph is None and soc is None and sand is None:
        return None

    ph = round(float(ph), 1) if ph is not None else None
    soc_val = float(soc) if soc is not None else None
    materia_organica = round(soc_val * 1.724 / 10, 2) if soc_val is not None else None

    textura = _usda_texture_class(
        float(sand) if sand is not None else 0,
        float(silt) if silt is not None else 0,
        float(clay) if clay is not None else 0,
    )

    return {
        "ph": ph,
        "materia_organica": materia_organica,
        "textura_suelo": textura,
        "fuente": "ISRIC SoilGrids v2.0",
    }
