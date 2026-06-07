import logging
import math
from datetime import datetime, timezone

import httpx
from cachetools import TTLCache

logger = logging.getLogger(__name__)

ISRIC_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
ISRIC_PROPERTIES = ["phh2o", "soc", "sand", "silt", "clay"]
ISRIC_DEPTH = "0-5cm"

# Cache de SoilGrids: 256 entradas, TTL 7 dias = 604800 segundos
# Las coordenadas se redondean a 3 decimales (~111m) para agrupar peticiones cercanas
_soil_cache: TTLCache = TTLCache(maxsize=256, ttl=604800)

# ── Zonas agroecológicas del Caribe colombiano ──
# Valores de referencia basados en estudios de Agrosavia e IGAC
# NO son datos inventados por ciudad, son perfiles zonales de la región

_ZONA_CARIBE_SECA = {
    "ph": 7.0,
    "materia_organica": 1.5,
    "textura_suelo": "Franco-Arenoso",
    "zona": "Costa seca Caribe",
}

_ZONA_CARIBE_HUMEDA = {
    "ph": 6.2,
    "materia_organica": 3.5,
    "textura_suelo": "Franco-Arcilloso",
    "zona": "Sabanas Caribe",
}

_ZONA_CARIBE_TRANSICION = {
    "ph": 6.5,
    "materia_organica": 2.5,
    "textura_suelo": "Franco",
    "zona": "Transición Caribe",
}


# ── Datos de suelo por municipio del Caribe colombiano ──
# Coordenadas: centroide aproximado del casco urbano
# Valores basados en estudios de IGAC, Agrosavia y reportes departamentales

_MUNICIPIOS_SUELO_MAP: dict[str, dict] = {
    "Riohacha": {
        "lat": 11.5444,
        "lng": -72.9072,
        "ph": 7.8,
        "materia_organica": 1.2,
        "textura_suelo": "Arenosa",
        "tipo_suelo": "Aridisol",
    },
    "Santa Marta": {
        "lat": 11.2408,
        "lng": -74.1990,
        "ph": 7.2,
        "materia_organica": 2.1,
        "textura_suelo": "Franca",
        "tipo_suelo": "Inceptisol",
    },
    "Barranquilla": {
        "lat": 10.9685,
        "lng": -74.7813,
        "ph": 7.5,
        "materia_organica": 1.8,
        "textura_suelo": "Franco-arenosa",
        "tipo_suelo": "Entisol",
    },
    "Cartagena": {
        "lat": 10.3910,
        "lng": -75.5144,
        "ph": 7.6,
        "materia_organica": 1.5,
        "textura_suelo": "Arcillosa",
        "tipo_suelo": "Vertisol",
    },
    "Sincelejo": {
        "lat": 9.3047,
        "lng": -75.3978,
        "ph": 6.8,
        "materia_organica": 2.8,
        "textura_suelo": "Franca",
        "tipo_suelo": "Mollisol",
    },
    "Montería": {
        "lat": 8.7579,
        "lng": -75.8900,
        "ph": 6.2,
        "materia_organica": 3.5,
        "textura_suelo": "Franco-arcillosa",
        "tipo_suelo": "Alfisol",
    },
    "Valledupar": {
        "lat": 10.4631,
        "lng": -73.2532,
        "ph": 7.3,
        "materia_organica": 2.0,
        "textura_suelo": "Franca",
        "tipo_suelo": "Inceptisol",
    },
    "Maicao": {
        "lat": 11.3824,
        "lng": -72.2396,
        "ph": 7.9,
        "materia_organica": 0.9,
        "textura_suelo": "Arenosa",
        "tipo_suelo": "Aridisol",
    },
}


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distancia en km entre dos puntos geográficos (fórmula de Haversine)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _municipio_fallback(lat: float, lng: float) -> dict | None:
    """Busca coincidencia con un municipio conocido por distancia Haversine.

    Retorna datos específicos del municipio si las coordenadas están
    dentro del radio de tolerancia (~20 km del centroide urbano).
    """
    best_dist = float("inf")
    best_name: str | None = None

    for name, info in _MUNICIPIOS_SUELO_MAP.items():
        dist = _haversine(lat, lng, info["lat"], info["lng"])
        if dist < best_dist:
            best_dist = dist
            best_name = name

    RADIO_KM = 20
    if best_name is not None and best_dist <= RADIO_KM:
        data = _MUNICIPIOS_SUELO_MAP[best_name]
        return {
            "ph": data["ph"],
            "materia_organica": data["materia_organica"],
            "textura_suelo": data["textura_suelo"],
            "tipo_suelo": data["tipo_suelo"],
            "municipio": best_name,
            "fuente": f"Datos de referencia — {best_name}, Caribe colombiana",
            "cached_at": datetime.now(timezone.utc).isoformat(),
            "_fallback": True,
        }

    return None


def _caribbean_zone_fallback(lat: float, lng: float) -> dict | None:
    """Estima valores de suelo según la zona agroecológica del Caribe colombiano
    cuando SoilGrids no tiene datos para esas coordenadas.

    Basado en referencias de Agrosavia e IGAC para las zonas del Caribe colombiano.
    """
    # Verificar si las coordenadas están dentro del Caribe colombiano
    if not (7.0 <= lat <= 12.8 and -78.0 <= lng <= -70.5):
        return None

    # --- Zona seca: Guajira, Atlántico, Bolívar costero ---
    # Mayor pH por suelos calcáreos, baja MO por aridez
    if lat > 10.8 or (lat > 10.2 and lng < -75.2):
        zone = _ZONA_CARIBE_SECA
    # --- Zona húmeda: Córdoba, Sucre, sur de Bolívar ---
    # Menor pH por lixiviación, mayor MO
    elif lat < 9.5 and lng > -76.2:
        zone = _ZONA_CARIBE_HUMEDA
    # --- Zona de transición: Magdalena, Cesar, Bolívar interior ---
    else:
        zone = _ZONA_CARIBE_TRANSICION

    return {
        "ph": zone["ph"],
        "materia_organica": zone["materia_organica"],
        "textura_suelo": zone["textura_suelo"],
        "fuente": f"Estimación para zona agroecológica ({zone['zona']}) — Agrosavia/IGAC",
        "cached_at": datetime.now(timezone.utc).isoformat(),
        "_fallback": True,
    }


def _caribbean_fallback(lat: float, lng: float) -> dict:
    """Cadena de respaldo para datos de suelo en el Caribe colombiano.

    Prioridad:
    1. Coincidencia exacta por municipio (centroide + radio 20 km)
    2. Zona agroecológica (Agrosavia/IGAC)
    3. Valores genéricos por defecto
    """
    # 1. Municipio
    match = _municipio_fallback(lat, lng)
    if match is not None:
        return match

    # 2. Zona agroecológica
    zone = _caribbean_zone_fallback(lat, lng)
    if zone is not None:
        return zone

    # 3. Valores por defecto (siempre retorna algo)
    return {
        "ph": 6.5,
        "materia_organica": 2.0,
        "textura_suelo": "Franco",
        "fuente": "Valores genéricos por defecto",
        "cached_at": datetime.now(timezone.utc).isoformat(),
        "_fallback": True,
    }


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


def _cache_key(lat: float, lng: float) -> tuple:
    """Redondea a 3 decimales (~111m) para agrupar coordenadas cercanas."""
    return (round(lat, 3), round(lng, 3))


def _extract_layer_value(layer: dict, d_factor: float | None = None) -> float | None:
    """Extrae el valor 'mean' de una capa y aplica el d_factor si existe.

    ISRIC almacena ciertos valores con un factor de escala (d_factor),
    ej: pH * 10 (d_factor=10). Este método aplica la conversión.
    """
    depths = layer.get("depths", [])
    if not depths:
        return None
    raw = depths[0].get("values", {}).get("mean")
    if raw is None:
        return None
    val = float(raw)
    if d_factor and d_factor > 0:
        val = val / d_factor
    return val


async def get_soil_data(lat: float, lng: float) -> dict | None:
    """Obtiene pH, materia organica y textura desde ISRIC SoilGrids v2.0.

    La API cambió a GET (antes era POST). También maneja el d_factor
    que ISRIC usa para codificar ciertos valores (ej: pH*10).

    Cadena de respaldo para el Caribe colombiano (cuando SoilGrids no tiene datos):
    1. Coincidencia exacta por municipio (centroide + radio 20 km)
    2. Zona agroecológica (Agrosavia/IGAC)
    3. Valores genéricos por defecto
    """
    key = _cache_key(lat, lng)
    cached = _soil_cache.get(key)
    if cached is not None:
        logger.debug(f"SoilGrids cache hit para {key}")
        cached["_cache_hit"] = True
        return cached

    # ── Llamada a SoilGrids vía GET ──
    params = {
        "lon": lng,
        "lat": lat,
        "property": ISRIC_PROPERTIES,
        "depth": [ISRIC_DEPTH],
        "value": ["mean"],
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(ISRIC_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.warning(f"SoilGrids API no disponible: {e}")
            # Fallback: municipio → zona → valores por defecto
            fallback = _caribbean_fallback(lat, lng)
            _soil_cache[key] = fallback
            return fallback

    layers = data.get("properties", {}).get("layers", [])
    if not layers:
        fallback = _caribbean_fallback(lat, lng)
        _soil_cache[key] = fallback
        return fallback

    values = {}
    for layer in layers:
        name = layer.get("name", "")
        d_factor = layer.get("unit_measure", {}).get("d_factor")
        val = _extract_layer_value(layer, d_factor)
        if val is not None:
            values[name] = val

    ph = values.get("phh2o")
    soc = values.get("soc")
    sand = values.get("sand")
    silt = values.get("silt")
    clay = values.get("clay")

    # Si no hay datos de SoilGrids, probar fallback Caribe
    if ph is None and soc is None and sand is None:
        fallback = _caribbean_fallback(lat, lng)
        _soil_cache[key] = fallback
        return fallback

    ph = round(ph, 1) if ph is not None else None
    materia_organica = round(soc * 1.724 / 10, 2) if soc is not None else None

    textura = _usda_texture_class(
        float(sand) if sand is not None else 0,
        float(silt) if silt is not None else 0,
        float(clay) if clay is not None else 0,
    )

    result = {
        "ph": ph,
        "materia_organica": materia_organica,
        "textura_suelo": textura,
        "fuente": "ISRIC SoilGrids v2.0",
        "cached_at": datetime.now(timezone.utc).isoformat(),
    }

    _soil_cache[key] = result
    logger.debug(f"SoilGrids cache miss para {key} — guardado en cache")
    return result
