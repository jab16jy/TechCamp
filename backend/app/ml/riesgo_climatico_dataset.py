"""Supervised ML dataset builder for climate risk prediction (flood / drought).

Builds a binary classification dataset where:
  - Positive samples  = recorded flood or drought events (UNGRD + HDX + DesInventar)
  - Negative samples  = random dept-month pairs with no recorded events

Features per sample:
  CHIRPS window  — 6 months of precipitation + derived metrics (SPI-proxy, anomaly, etc.)
  ERA5 window    — temperature, soil moisture, runoff (if downloaded; else omitted)
  Temporal       — month_sin, month_cos (cyclical)
  Heuristic      — existing rule-based flood/drought score as a FEATURE (not a target)
  Static         — soil_ph, soil_clay, soil_awc, elevation_m (pre-fetched once per dept)

Temporal split (no leakage):
  train      1990 – 2016
  validation 2017 – 2019
  test       2020 – 2024

Usage:
    from app.ml.riesgo_climatico_dataset import build_dataset
    X_tr, y_tr, X_val, y_val, X_te, y_te, feat_names = build_dataset("flood")
"""
import asyncio
import logging
import math
import random
from pathlib import Path

import numpy as np
import pandas as pd

from app.ml.data_sources.chirps import compute_precip_features, available_year_range
from app.ml.data_sources.config import DATA_DIR, DEPT_CENTROIDS
from app.ml.data_sources.era5 import get_era5_window, is_available as era5_available
from app.ml.data_sources.ungrd import load_all_labels

logger = logging.getLogger(__name__)

CACHE_PATH = Path(__file__).parent / "data" / "riesgo_climatico_dataset.parquet"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

TRAIN_END   = 2016
VAL_END     = 2019
# test = 2020+

NEG_RATIO   = 3          # negative samples per positive
N_MONTHS    = 6          # CHIRPS lookback window
ERA5_WINDOW = 3          # ERA5 lookback (shorter — heavier files)

# Negative sampling strategy. "Hard" negatives sit in the SAME department as a
# real event but at a nearby (year, month) with no recorded event — they teach a
# real decision frontier instead of a trivial geographic/seasonal split. A small
# fraction stay globally random to preserve coverage of event-free regions.
HARD_NEG_FRAC   = 0.7    # share of negatives drawn near real positives
NEG_TIME_WINDOW = 24     # months around a positive a hard negative may fall in
STATIC_FEATURES = ("soil_ph", "soil_clay", "soil_awc", "elevation_m")

ALL_DEPT_MONTHS: list[tuple[int, int, int]] = []   # (dept_code, year, month) — populated lazily


def _temporal_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train = df[df["year"] <= TRAIN_END]
    val   = df[(df["year"] > TRAIN_END) & (df["year"] <= VAL_END)]
    test  = df[df["year"] > VAL_END]
    return train, val, test


def _month_cyclical(month: int) -> tuple[float, float]:
    angle = 2 * math.pi * (month - 1) / 12
    return math.sin(angle), math.cos(angle)


def _heuristic_score(lat: float, lon: float, year: int, month: int,
                     event_type: str) -> float:
    """Call the existing rule-based scorer as a FEATURE (not a target)."""
    try:
        from app.services.prediction_service import (
            _compute_flood_risk, _compute_drought_risk,
        )
        # prediction_service expects precipitacion, textura_suelo, awc, temperatura
        # Use CHIRPS last month as precipitation proxy, default soil params
        from app.ml.data_sources.chirps import get_precip
        precip = get_precip(lat, lon, year, month) or 80.0
        if event_type == "flood":
            result = _compute_flood_risk(
                precipitacion=precip, textura_suelo="Franco", awc=0.15
            )
        else:
            result = _compute_drought_risk(
                precipitacion=precip, textura_suelo="Franco",
                awc=0.15, temperatura=27.0
            )
        # Both functions return a dict with a "score" key (0-100)
        score = result["score"] if isinstance(result, dict) else result
        return float(score) / 100.0
    except Exception:
        return 0.5   # neutral fallback


async def _prefetch_dept_static(sem: asyncio.Semaphore) -> dict[int, dict]:
    """Fetch soil + elevation for all dept centroids concurrently.

    Returns dict[dept_code -> {"soil_ph": ..., "soil_clay": ..., "soil_awc": ..., "elevation_m": ...}]
    The dept centroids are fixed (33 depts), so we pre-fetch once and reuse per-row.
    """
    from app.services.soil_service import get_soil_data
    from app.ml.data_sources.elevation import get_elevation

    async def _fetch_one(dept_code: int, lon: float, lat: float) -> tuple[int, dict]:
        # Per-dept resilience: one failing API call must NOT wipe static features
        # for every department (the previous version let a single exception bubble
        # up and drop statics from the entire dataset).
        try:
            async with sem:
                soil, elev = await asyncio.gather(
                    get_soil_data(lat, lon),
                    get_elevation(lat, lon),
                )
            soil = soil or {}
            return dept_code, {
                "soil_ph":    soil.get("ph"),
                "soil_clay":  soil.get("clay"),
                "soil_awc":   soil.get("awc"),
                "elevation_m": elev,
            }
        except Exception as exc:
            logger.warning("Static prefetch failed for dept %s: %s", dept_code, exc)
            return dept_code, {k: None for k in STATIC_FEATURES}

    tasks = [
        _fetch_one(dept_code, lon, lat)
        for dept_code, (lon, lat) in DEPT_CENTROIDS.items()
    ]
    results = await asyncio.gather(*tasks, return_exceptions=False)
    static = dict(results)
    n_with_soil = sum(1 for v in static.values() if v.get("soil_ph") is not None)
    logger.info("Static prefetch: %d/%d depts have soil data", n_with_soil, len(static))
    return static


def _build_feature_row(
    lat: float,
    lon: float,
    year: int,
    month: int,
    event_type: str,
    label: int,
    static: dict | None = None,
) -> dict | None:
    chirps = compute_precip_features(lat, lon, year, month, N_MONTHS)
    if chirps["chirps_coverage"] < 0.5:
        return None   # too many missing months — skip

    row = dict(chirps)
    row["month_sin"], row["month_cos"] = _month_cyclical(month)
    row["heuristic_score"] = _heuristic_score(lat, lon, year, month, event_type)

    if era5_available():
        era5 = get_era5_window(lat, lon, year, month, ERA5_WINDOW)
        row.update(era5)

    # Always emit static columns so the feature schema is consistent across
    # rows even when a department's soil/elevation prefetch failed (value=None,
    # later filled to 0 at split time). Missing-as-absent silently dropped these
    # features from the whole cached dataset before.
    static = static or {}
    for key in STATIC_FEATURES:
        row[key] = static.get(key)

    row.update({"year": year, "month": month,
                "lat": lat, "lon": lon,
                "event_type": event_type, "label": label})
    return row


def _generate_negative_keys(
    positive_seeds: list[tuple[int, int, int]],
    n: int,
    positive_keys: set[tuple[int, int, int]],
    dept_codes: list[int],
    min_year: int,
    max_year: int,
    hard_frac: float = HARD_NEG_FRAC,
    time_window: int = NEG_TIME_WINDOW,
    rng: random.Random | None = None,
) -> list[tuple[int, int, int]]:
    """Generate `n` unique negative (dept, year, month) keys.

    Pure — no CHIRPS / I/O — so it is independently unit-testable.

    Invariants guaranteed:
      - no key collides with a positive (never in `positive_keys`)
      - no duplicate keys among the returned negatives
      - HARD negatives share a department with a real positive and fall within
        `time_window` months of it; the rest are globally random for coverage
    """
    rng = rng or random
    used: set[tuple[int, int, int]] = set()
    out: list[tuple[int, int, int]] = []

    def _try_add(dept: int, year: int, month: int) -> bool:
        if not (min_year <= year <= max_year):
            return False
        key = (dept, year, month)
        if key in positive_keys or key in used:
            return False
        used.add(key)
        out.append(key)
        return True

    n_hard = int(n * hard_frac) if positive_seeds else 0
    max_attempts = n * 40

    # ── Hard negatives: same dept as a positive, nearby in time, no event ──
    attempts = 0
    while len([k for k in out]) < n_hard and attempts < max_attempts:
        attempts += 1
        dept, pyear, pmonth = positive_seeds[rng.randrange(len(positive_seeds))]
        # perturb the date by ±time_window months, but not the exact event month
        delta = rng.randint(-time_window, time_window)
        if delta == 0:
            continue
        total = (pyear * 12 + (pmonth - 1)) + delta
        year, month = divmod(total, 12)
        month += 1
        _try_add(dept, year, month)

    # ── Coverage negatives: globally random (fills remainder too) ──
    attempts = 0
    while len(out) < n and attempts < max_attempts:
        attempts += 1
        dept = dept_codes[rng.randrange(len(dept_codes))]
        year = rng.randint(min_year, max_year)
        month = rng.randint(1, 12)
        _try_add(dept, year, month)

    return out


def _sample_negatives(
    positives: pd.DataFrame,
    event_type: str,
    n: int,
    positive_keys: set[tuple[int, int, int]],
    static_by_dept: dict[int, dict] | None = None,
) -> list[dict]:
    """Generate `n` negative samples not overlapping with known events.

    Negatives are biased toward HARD cases (same department as a real event,
    nearby in time, no recorded event) per HARD_NEG_FRAC, with the remainder
    drawn globally for coverage. See `_generate_negative_keys`.
    """
    yr_range = available_year_range()
    if yr_range is None:
        logger.warning("CHIRPS data not available — cannot generate negatives")
        return []

    min_year, max_year = yr_range
    dept_codes = list(DEPT_CENTROIDS.keys())

    positive_seeds = [
        (int(r["dept_code"]), int(r["year"]), int(r["month"]))
        for _, r in positives.iterrows()
        if int(r["dept_code"]) in DEPT_CENTROIDS
    ]

    # Over-generate keys: some will be dropped for insufficient CHIRPS coverage.
    keys = _generate_negative_keys(
        positive_seeds, int(n * 1.5), positive_keys, dept_codes, min_year, max_year
    )

    rows = []
    for dept, year, month in keys:
        if len(rows) >= n:
            break
        coords = DEPT_CENTROIDS[dept]
        static = static_by_dept.get(dept) if static_by_dept else None
        row = _build_feature_row(coords[1], coords[0], year, month, event_type, 0, static=static)
        if row:
            row["dept_code"] = dept
            rows.append(row)

    n_hard_target = int(n * HARD_NEG_FRAC)
    logger.info(
        "Negatives: %d built (target %d, ~%d hard near positives)",
        len(rows), n, n_hard_target,
    )
    if len(rows) < n:
        logger.warning("Only generated %d/%d negatives", len(rows), n)
    return rows


def build_dataset(
    event_type: str = "flood",
    force_rebuild: bool = False,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray,
           np.ndarray, np.ndarray, list[str]]:
    """Build (X_train, y_train, X_val, y_val, X_test, y_test, feature_names).

    Results are cached to CACHE_PATH. Pass force_rebuild=True to regenerate.
    event_type: "flood" | "drought" | "all"
    """
    cache_key = CACHE_PATH.with_name(f"riesgo_climatico_{event_type}.parquet")

    if cache_key.exists() and not force_rebuild:
        logger.info("Loading cached dataset: %s", cache_key.name)
        df = pd.read_parquet(cache_key)
        return _df_to_splits(df)

    logger.info("Building dataset for event_type=%s …", event_type)

    labels = load_all_labels()
    if labels.empty:
        raise RuntimeError("No label data loaded. Check DATA_DIR and dataset files.")

    if event_type != "all":
        labels = labels[labels["event_type"] == event_type]

    if labels.empty:
        raise RuntimeError(f"No labels found for event_type='{event_type}'")

    logger.info("Positive events: %d", len(labels))

    # Pre-fetch static features (soil + elevation) once for all dept centroids.
    # This avoids redundant API calls — 33 depts × 2 APIs, done once up front.
    logger.info("Pre-fetching soil + elevation for %d dept centroids …", len(DEPT_CENTROIDS))
    try:
        sem = asyncio.Semaphore(8)  # limit concurrent API calls
        static_by_dept: dict[int, dict] = asyncio.run(_prefetch_dept_static(sem))
        logger.info("Static features fetched for %d departments", len(static_by_dept))
    except Exception as exc:
        logger.warning("Could not pre-fetch static features (%s) — proceeding without them", exc)
        static_by_dept = {}

    # Build positive samples
    pos_rows: list[dict] = []
    positive_keys: set[tuple[int, int, int]] = set()

    for _, ev in labels.iterrows():
        dept_code = int(ev["dept_code"])
        static = static_by_dept.get(dept_code)
        row = _build_feature_row(
            lat=ev["lat"], lon=ev["lon"],
            year=ev["year"], month=ev["month"],
            event_type=ev["event_type"],
            label=1,
            static=static,
        )
        if row:
            row["dept_code"] = dept_code
            pos_rows.append(row)
            positive_keys.add((dept_code, ev["year"], ev["month"]))

    logger.info("Positive rows with sufficient CHIRPS coverage: %d / %d",
                len(pos_rows), len(labels))

    if not pos_rows:
        raise RuntimeError("No positive samples built — CHIRPS data may not be downloaded yet.")

    # Build negative samples
    n_neg = len(pos_rows) * NEG_RATIO
    neg_rows = _sample_negatives(labels, event_type, n_neg, positive_keys, static_by_dept=static_by_dept)
    logger.info("Negative rows: %d", len(neg_rows))

    df = pd.DataFrame(pos_rows + neg_rows)
    df = df.sort_values("year").reset_index(drop=True)

    # Cache to disk
    df.to_parquet(cache_key, index=False)
    logger.info("Dataset cached: %s (%d rows, %d columns)", cache_key.name, len(df), len(df.columns))

    return _df_to_splits(df)


def _df_to_splits(
    df: pd.DataFrame,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray,
           np.ndarray, np.ndarray, list[str]]:
    META = {"year", "month", "lat", "lon", "event_type", "label", "dept_code"}
    feat_cols = [c for c in df.columns if c not in META]

    df_train, df_val, df_test = _temporal_split(df)

    def to_xy(split: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        X = split[feat_cols].fillna(0).values.astype(np.float32)
        y = split["label"].values.astype(np.int32)
        return X, y

    X_tr, y_tr = to_xy(df_train)
    X_val, y_val = to_xy(df_val)
    X_te, y_te = to_xy(df_test)

    logger.info(
        "Splits — train: %d | val: %d | test: %d",
        len(df_train), len(df_val), len(df_test),
    )
    logger.info(
        "Class balance — train pos: %.1f%% | val pos: %.1f%% | test pos: %.1f%%",
        y_tr.mean() * 100, y_val.mean() * 100, y_te.mean() * 100,
    )

    return X_tr, y_tr, X_val, y_val, X_te, y_te, feat_cols


def dataset_summary() -> dict:
    """Quick summary without building — useful for health checks."""
    from app.ml.data_sources.chirps import available_year_range as chirps_range
    labels = load_all_labels()
    return {
        "total_labels": len(labels),
        "floods": int((labels["event_type"] == "flood").sum()) if not labels.empty else 0,
        "droughts": int((labels["event_type"] == "drought").sum()) if not labels.empty else 0,
        "chirps_year_range": chirps_range(),
        "era5_available": era5_available(),
        "label_year_range": (
            (int(labels["year"].min()), int(labels["year"].max()))
            if not labels.empty else None
        ),
    }
