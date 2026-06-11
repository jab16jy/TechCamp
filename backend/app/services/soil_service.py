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

# ── Química de suelo por departamento ──
# Medianas calculadas de suelos_caribe.csv (11,949 muestras AGROSAVIA)
_DEPARTAMENTO_CHEMISTRY: dict[str, dict] = {
    "ATLANTICO":  dict(calcio=12.42, cic=19.89, conductividad=0.49, magnesio=4.48, potasio=0.36, fosforo=21.70, azufre=14.66, boro=0.41, sodio=0.72),
    "BOLIVAR":    dict(calcio=10.72, cic=15.53, conductividad=0.25, magnesio=2.83, potasio=0.29, fosforo=6.46,  azufre=5.19,  boro=0.24, sodio=0.23),
    "CESAR":      dict(calcio=5.68,  cic=7.92,  conductividad=0.21, magnesio=1.38, potasio=0.24, fosforo=11.73, azufre=4.70,  boro=0.22, sodio=0.18),
    "CORDOBA":    dict(calcio=10.45, cic=17.28, conductividad=0.25, magnesio=4.95, potasio=0.32, fosforo=7.86,  azufre=5.52,  boro=0.24, sodio=0.16),
    "LA GUAJIRA": dict(calcio=20.00, cic=25.18, conductividad=0.64, magnesio=2.78, potasio=0.37, fosforo=25.20, azufre=10.82, boro=0.51, sodio=0.27),
    "MAGDALENA":  dict(calcio=9.25,  cic=14.18, conductividad=0.29, magnesio=3.32, potasio=0.25, fosforo=19.05, azufre=5.50,  boro=0.29, sodio=0.51),
    "SUCRE":      dict(calcio=15.55, cic=23.18, conductividad=0.22, magnesio=5.33, potasio=0.36, fosforo=6.38,  azufre=4.03,  boro=0.25, sodio=0.31),
}

# Regional Caribe default (median across all 7 departments)
_DEFAULT_CHEMISTRY = dict(calcio=10.45, cic=17.28, conductividad=0.27, magnesio=3.49, potasio=0.31, fosforo=11.73, azufre=5.52, boro=0.27, sodio=0.30)

# Zone-level chemistry aggregates (average of constituent departments)
_ZONA_CHEMISTRY: dict[str, dict] = {
    "seca":       dict(calcio=16.21, cic=22.54, conductividad=0.57, magnesio=3.63, potasio=0.37, fosforo=23.45, azufre=12.74, boro=0.46, sodio=0.50),
    "humeda":     dict(calcio=13.00, cic=20.23, conductividad=0.24, magnesio=5.14, potasio=0.34, fosforo=7.12,  azufre=4.78,  boro=0.25, sodio=0.24),
    "transicion": dict(calcio=8.55,  cic=12.54, conductividad=0.25, magnesio=2.51, potasio=0.26, fosforo=12.41, azufre=5.13,  boro=0.25, sodio=0.31),
}


# ── Datos de suelo por municipio del Caribe colombiano ──
# Coordenadas: centroide aproximado del casco urbano
# Valores basados en estudios de IGAC, Agrosavia y reportes departamentales

_MUNICIPIOS_SUELO_MAP: dict[str, dict] = {
    "Riohacha": {
        "lat": 11.5444, "lng": -72.9072,
        "ph": 7.8, "materia_organica": 1.2,
        "textura_suelo": "Arenoso", "orden_suelo": "Aridisol",
        "depto_norm": "LA GUAJIRA",
    },
    "Maicao": {
        "lat": 11.3824, "lng": -72.2396,
        "ph": 7.9, "materia_organica": 0.9,
        "textura_suelo": "Arenoso", "orden_suelo": "Aridisol",
        "depto_norm": "LA GUAJIRA",
    },
    "Santa Marta": {
        "lat": 11.2408, "lng": -74.1990,
        "ph": 7.2, "materia_organica": 2.1,
        "textura_suelo": "Franco", "orden_suelo": "Inceptisol",
        "depto_norm": "MAGDALENA",
    },
    "Barranquilla": {
        "lat": 10.9685, "lng": -74.7813,
        "ph": 7.5, "materia_organica": 1.8,
        "textura_suelo": "Franco-Arenoso", "orden_suelo": "Entisol",
        "depto_norm": "ATLANTICO",
    },
    "Soledad": {
        "lat": 10.9186, "lng": -74.7646,
        "ph": 7.4, "materia_organica": 1.7,
        "textura_suelo": "Franco-Arenoso", "orden_suelo": "Entisol",
        "depto_norm": "ATLANTICO",
    },
    "Cartagena": {
        "lat": 10.3910, "lng": -75.5144,
        "ph": 7.6, "materia_organica": 1.5,
        "textura_suelo": "Arcilloso", "orden_suelo": "Vertisol",
        "depto_norm": "BOLIVAR",
    },
    "Sincelejo": {
        "lat": 9.3047, "lng": -75.3978,
        "ph": 6.8, "materia_organica": 2.8,
        "textura_suelo": "Franco", "orden_suelo": "Mollisol",
        "depto_norm": "SUCRE",
    },
    "Montería": {
        "lat": 8.7579, "lng": -75.8900,
        "ph": 6.2, "materia_organica": 3.5,
        "textura_suelo": "Franco-Arcilloso", "orden_suelo": "Alfisol",
        "depto_norm": "CORDOBA",
    },
    "Valledupar": {
        "lat": 10.4631, "lng": -73.2532,
        "ph": 7.3, "materia_organica": 2.0,
        "textura_suelo": "Franco", "orden_suelo": "Inceptisol",
        "depto_norm": "CESAR",
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
        textura = data["textura_suelo"]
        awc = _available_water_capacity(None, None, None, textura)
        depto = data.get("depto_norm", "")
        chemistry = _DEPARTAMENTO_CHEMISTRY.get(depto, _DEFAULT_CHEMISTRY)
        return {
            "ph": data["ph"],
            "materia_organica": data["materia_organica"],
            "textura_suelo": textura,
            "tipo_suelo": data.get("tipo_suelo", data.get("textura_suelo")),
            "orden_suelo": data.get("orden_suelo"),
            "municipio": best_name,
            "sand": None,
            "silt": None,
            "clay": None,
            "awc": awc,
            "textura_clasificacion_usda": textura,
            **chemistry,
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
        zone_key = "seca"
    # --- Zona húmeda: Córdoba, Sucre, sur de Bolívar ---
    # Menor pH por lixiviación, mayor MO
    elif lat < 9.5 and lng > -76.2:
        zone = _ZONA_CARIBE_HUMEDA
        zone_key = "humeda"
    # --- Zona de transición: Magdalena, Cesar, Bolívar interior ---
    else:
        zone = _ZONA_CARIBE_TRANSICION
        zone_key = "transicion"

    textura = zone["textura_suelo"]
    awc = _available_water_capacity(None, None, None, textura)
    chemistry = _ZONA_CHEMISTRY[zone_key]
    return {
        "ph": zone["ph"],
        "materia_organica": zone["materia_organica"],
        "textura_suelo": textura,
        "tipo_suelo": zone.get("textura_suelo", textura),
        "sand": None,
        "silt": None,
        "clay": None,
        "awc": awc,
        "textura_clasificacion_usda": textura,
        **chemistry,
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
    textura = "Franco"
    awc = _available_water_capacity(None, None, None, textura)
    return {
        "ph": 6.5,
        "materia_organica": 2.0,
        "textura_suelo": textura,
        "tipo_suelo": textura,
        "sand": None,
        "silt": None,
        "clay": None,
        "awc": awc,
        "textura_clasificacion_usda": textura,
        **_DEFAULT_CHEMISTRY,
        "fuente": "Valores genéricos por defecto",
        "cached_at": datetime.now(timezone.utc).isoformat(),
        "_fallback": True,
    }


def _available_water_capacity(sand: float | None, silt: float | None, clay: float | None, textura_suelo: str | None = None) -> float | None:
    """Rawls et al. 1982 — AWC en cm³/cm³ desde textura USDA.

    Si sand/silt/clay son None, usa valores por defecto según textura.
    """
    if sand is not None and silt is not None and clay is not None:
        # Punto de marchitez permanente (PMP) θ a -1.5 MPa
        wp = -0.024 * sand + 0.048 * silt + 0.09 * clay + 0.015
        # Capacidad de campo (CC) θ a -0.033 MPa
        fc = -0.003 * sand + 0.058 * silt + 0.078 * clay + 0.074
        awc = fc - wp
        return round(max(0.02, min(0.25, awc)), 3)

    # Fallback por textura
    texture_awc = {
        "Arenoso": 0.05, "Areno-Francoso": 0.06, "Franco-Arenoso": 0.08,
        "Franco": 0.12, "Franco-Limoso": 0.14, "Franco-Arcilloso": 0.16,
        "Franco-Arcillo-Arenoso": 0.15, "Franco-Arcillo-Limoso": 0.18,
        "Arcillo-Arenoso": 0.17, "Arcillo-Limoso": 0.20, "Arcilloso": 0.20,
        "Limoso": 0.15,
    }
    if textura_suelo and textura_suelo in texture_awc:
        return texture_awc[textura_suelo]
    return 0.12


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

    sand_val = float(sand) if sand is not None else None
    silt_val = float(silt) if silt is not None else None
    clay_val = float(clay) if clay is not None else None
    awc = _available_water_capacity(sand_val, silt_val, clay_val, textura)

    # SoilGrids doesn't have chemistry data — supplement with Caribe fallback by zone
    chemistry = _caribbean_fallback(lat, lng)
    chemistry_fields = {k: chemistry.get(k) for k in ("calcio", "cic", "conductividad", "magnesio", "potasio", "fosforo", "azufre", "boro", "sodio")}

    result = {
        "ph": ph,
        "materia_organica": materia_organica,
        "textura_suelo": textura,
        "tipo_suelo": textura,
        "sand": sand_val,
        "silt": silt_val,
        "clay": clay_val,
        "awc": awc,
        "textura_clasificacion_usda": textura,
        **chemistry_fields,
        "fuente": "ISRIC SoilGrids v2.0 + química AGROSAVIA",
        "cached_at": datetime.now(timezone.utc).isoformat(),
    }

    _soil_cache[key] = result
    logger.debug(f"SoilGrids cache miss para {key} — guardado en cache")
    return result
