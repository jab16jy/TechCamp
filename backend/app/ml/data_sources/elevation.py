"""Open-Elevation API client with file-based cache.

API: GET https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}
Response: {"results": [{"latitude": ..., "longitude": ..., "elevation": ...}]}

Cache: stores results in DATA_DIR/elevation_cache.json (keyed by "lat,lon" rounded to 3dp).
Fallback: returns median elevation per department (hardcoded from IDEAM data).
"""
import json
import logging
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

_MODEL_DIR = Path(__file__).parent.parent / "data"
_MODEL_DIR.mkdir(parents=True, exist_ok=True)

_CACHE_PATH = _MODEL_DIR / "elevation_cache.json"

_OPEN_ELEVATION_URL = "https://api.open-elevation.com/api/v1/lookup"

# Approximate median elevations in metres per Caribbean-region department.
# Derived from IDEAM digital elevation data.
_DEPT_ELEVATION_FALLBACK: dict[str, float] = {
    "Atlántico":  98.0,
    "Bolívar":    74.0,
    "Córdoba":   155.0,
    "Magdalena":  43.0,
    "Cesar":     172.0,
    "La Guajira": 112.0,
    "Sucre":      63.0,
    "San Andrés": 15.0,
    "Antioquia": 1495.0,
    "Chocó":      52.0,
}

# Regional fallback when no department is matched.
_DEFAULT_ELEVATION = 100.0


def _cache_key(lat: float, lon: float) -> str:
    return f"{round(lat, 3)},{round(lon, 3)}"


def _load_cache() -> dict[str, float]:
    if _CACHE_PATH.exists():
        try:
            return json.loads(_CACHE_PATH.read_text())
        except Exception:
            return {}
    return {}


def _save_cache(cache: dict[str, float]) -> None:
    try:
        _CACHE_PATH.write_text(json.dumps(cache))
    except Exception as exc:
        logger.warning("Could not write elevation cache: %s", exc)


async def get_elevation(lat: float, lon: float) -> float | None:
    """Return elevation in metres for the given coordinates.

    Tries Open-Elevation API first, falls back to the in-memory file cache,
    and finally to the hardcoded department medians.

    Returns None only when all resolution paths fail unexpectedly.
    """
    key = _cache_key(lat, lon)

    cache = _load_cache()
    if key in cache:
        logger.debug("Elevation cache hit for %s", key)
        return cache[key]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                _OPEN_ELEVATION_URL,
                params={"locations": f"{lat},{lon}"},
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if results:
                elevation = float(results[0]["elevation"])
                cache[key] = elevation
                _save_cache(cache)
                logger.debug("Elevation fetched from API for %s: %.1f m", key, elevation)
                return elevation
    except Exception as exc:
        logger.warning("Open-Elevation API unavailable (%s) — using dept fallback", exc)

    # Dept-level fallback: pick the closest department by crude coordinate bounds.
    # This is intentionally simple — the goal is a reasonable feature value, not
    # a precise lookup.
    fallback = _dept_fallback(lat, lon)
    cache[key] = fallback
    _save_cache(cache)
    return fallback


def _dept_fallback(lat: float, lon: float) -> float:
    """Return a rough elevation estimate based on known dept centroids."""
    from app.ml.data_sources.config import DEPT_CENTROIDS

    # Map dept_code → dept name (only for depts we have elevation data for).
    _CODE_TO_NAME: dict[int, str] = {
        5:  "Antioquia",
        8:  "Atlántico",
        13: "Bolívar",
        20: "Cesar",
        23: "Córdoba",
        27: "Chocó",
        44: "La Guajira",
        47: "Magdalena",
        70: "Sucre",
        88: "San Andrés",
    }

    best_dist_sq = float("inf")
    best_name: str | None = None

    for dept_code, (clon, clat) in DEPT_CENTROIDS.items():
        if dept_code not in _CODE_TO_NAME:
            continue
        dist_sq = (lat - clat) ** 2 + (lon - clon) ** 2
        if dist_sq < best_dist_sq:
            best_dist_sq = dist_sq
            best_name = _CODE_TO_NAME[dept_code]

    if best_name is not None:
        return _DEPT_ELEVATION_FALLBACK.get(best_name, _DEFAULT_ELEVATION)
    return _DEFAULT_ELEVATION
