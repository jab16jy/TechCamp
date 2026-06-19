"""CHIRPS v2.0 monthly precipitation loader.

Reads pre-clipped GeoTIFF files (one per month) downloaded to CHIRPS_DIR.
Files follow the naming convention: chirps_col_{YYYY}_{MM:02d}.tif
"""
import logging
from functools import lru_cache
from pathlib import Path

import numpy as np

from app.ml.data_sources.config import CHIRPS_DIR

logger = logging.getLogger(__name__)

# mm/month climatological means per calendar month for Colombia Caribbean region.
# Derived from NASA POWER 1981-2010 baseline — used for anomaly computation
# when CHIRPS files are fully loaded.
_CARIBE_CLIM_MM: dict[int, float] = {
    1: 23.4, 2: 13.1, 3: 12.5, 4: 52.8, 5: 115.6, 6: 93.2,
    7: 80.7, 8: 99.3, 9: 142.1, 10: 158.4, 11: 106.3, 12: 44.7,
}


@lru_cache(maxsize=512)
def _load_tif(tif_path: str) -> tuple[np.ndarray, object] | None:
    """Load a CHIRPS TIF and return (data_array, transform). Cached per path."""
    try:
        import rasterio
        with rasterio.open(tif_path) as src:
            data = src.read(1).astype(np.float32)
            # CHIRPS uses -9999 as nodata
            data[data < -9000] = np.nan
            return data, src.transform
    except Exception as e:
        logger.warning("Could not load CHIRPS file %s: %s", tif_path, e)
        return None


def _tif_path(year: int, month: int) -> Path:
    return CHIRPS_DIR / f"chirps_col_{year}_{month:02d}.tif"


def get_precip(lat: float, lon: float, year: int, month: int) -> float | None:
    """Return monthly precipitation (mm) at (lat, lon) for the given year/month.

    Returns None if the file is missing or the coordinate falls outside coverage.
    """
    path = _tif_path(year, month)
    if not path.exists():
        return None

    result = _load_tif(str(path))
    if result is None:
        return None

    data, transform = result
    try:
        from rasterio.transform import rowcol
        row, col = rowcol(transform, lon, lat)
        if row < 0 or col < 0 or row >= data.shape[0] or col >= data.shape[1]:
            return None
        val = float(data[row, col])
        return None if np.isnan(val) else val
    except Exception:
        return None


def get_precip_window(
    lat: float,
    lon: float,
    year: int,
    month: int,
    n_months: int = 6,
) -> list[float | None]:
    """Return precipitation for the n_months ending at (year, month) inclusive."""
    months = []
    y, m = year, month
    for _ in range(n_months):
        months.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    months.reverse()
    return [get_precip(lat, lon, y, m) for y, m in months]


def compute_precip_features(
    lat: float,
    lon: float,
    year: int,
    month: int,
    n_months: int = 6,
) -> dict[str, float]:
    """Derive precipitation features over the n_months window.

    Returns a dict with keys:
        precip_m{1..n}          raw monthly values (m1 = oldest)
        precip_total_3m
        precip_total_6m
        precip_max_month
        precip_min_month
        precip_anomaly_last     last month vs climatological mean
        consecutive_wet_months  months with precip > 100mm
        consecutive_dry_months  months with precip < 30mm
        chirps_coverage         fraction of months with data (0-1)
    """
    window = get_precip_window(lat, lon, year, month, n_months)
    available = [v for v in window if v is not None]
    coverage = len(available) / n_months

    # Fill missing with climatological mean (avoids NaN propagation)
    y, m = year, month
    cal_months = []
    for _ in range(n_months):
        cal_months.append(m)
        m -= 1
        if m == 0:
            m = 12
    cal_months.reverse()

    filled = [
        v if v is not None else _CARIBE_CLIM_MM.get(cal_months[i], 80.0)
        for i, v in enumerate(window)
    ]

    feats: dict[str, float] = {}
    for i, v in enumerate(filled):
        feats[f"precip_m{i + 1}"] = v

    last3 = filled[-3:]
    feats["precip_total_3m"] = float(sum(last3))
    feats["precip_total_6m"] = float(sum(filled))
    feats["precip_max_month"] = float(max(filled))
    feats["precip_min_month"] = float(min(filled))

    # Anomaly of the most recent month vs climatology
    clim_mean = _CARIBE_CLIM_MM.get(cal_months[-1], 80.0)
    feats["precip_anomaly_last"] = filled[-1] - clim_mean

    # Consecutive wet/dry months (from most recent going back)
    wet = dry = 0
    for v in reversed(filled):
        if v > 100:
            wet += 1
            dry = 0
        elif v < 30:
            dry += 1
            wet = 0
        else:
            break
    feats["consecutive_wet_months"] = float(wet)
    feats["consecutive_dry_months"] = float(dry)
    feats["chirps_coverage"] = coverage

    return feats


def available_year_range() -> tuple[int, int] | None:
    """Return (min_year, max_year) of downloaded CHIRPS files, or None."""
    files = list(CHIRPS_DIR.glob("chirps_col_*.tif"))
    if not files:
        return None
    years = []
    for f in files:
        try:
            years.append(int(f.stem.split("_")[2]))
        except (IndexError, ValueError):
            pass
    return (min(years), max(years)) if years else None


@lru_cache(maxsize=1)
def latest_available_month() -> tuple[int, int] | None:
    """Return the most recent (year, month) with a CHIRPS file, or None.

    Used to evaluate risk against the latest real climate window when the caller
    asks for a date beyond coverage (e.g. a future month).
    """
    months: list[tuple[int, int]] = []
    for f in CHIRPS_DIR.glob("chirps_col_*.tif"):
        parts = f.stem.split("_")
        try:
            months.append((int(parts[2]), int(parts[3])))
        except (IndexError, ValueError):
            pass
    return max(months) if months else None


@lru_cache(maxsize=16)
def latest_year_for_month(month: int) -> int | None:
    """Most recent year that has a CHIRPS file for the given month, or None.

    Lets the UI offer a 'month to evaluate' (Jan–Dec) and resolve it to the
    latest real window (e.g. month=6 → 2024 when 2024-06 is the newest June).
    """
    years = []
    for f in CHIRPS_DIR.glob(f"chirps_col_*_{month:02d}.tif"):
        parts = f.stem.split("_")
        try:
            years.append(int(parts[2]))
        except (IndexError, ValueError):
            pass
    return max(years) if years else None
