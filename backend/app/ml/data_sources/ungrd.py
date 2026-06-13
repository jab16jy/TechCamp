"""Label loader for flood and drought events in Colombia.

Sources (in priority order):
  1. HDX Precipitaciones+Inundaciones 1990-2020  (floods only, CHIRPS precip pre-joined)
  2. UNGRD Emergencias CSV files                 (floods + droughts, 2019-2024)
  3. DesInventar Colombia XML                    (droughts + floods, 1912-2020, if downloaded)

All sources are merged, deduplicated, and normalized into a single schema:
    date        datetime64[ns]
    dept_code   int   (first 2 digits of DIVIPOLA)
    divipola    int
    event_type  str   ("flood" | "drought")
    lat         float (department centroid)
    lon         float (department centroid)
    source      str
"""
import logging
import xml.etree.ElementTree as ET
from pathlib import Path

import pandas as pd

from app.ml.data_sources.config import (
    DESINVENTAR_PATH,
    HDX_PATH,
    UNGRD_CSV_PATHS,
    divipola_to_coords,
)

logger = logging.getLogger(__name__)

_FLOOD_KEYWORDS  = frozenset(["INUNDACION", "INUNDACIÓN", "AVENIDA", "CRECIENTE", "DESBORD"])
_DROUGHT_KEYWORDS = frozenset(["SEQU", "SEQUÍA", "SEQUIA"])


def _normalize_event(raw: str) -> str | None:
    upper = raw.upper().strip()
    if any(k in upper for k in _FLOOD_KEYWORDS):
        return "flood"
    if any(k in upper for k in _DROUGHT_KEYWORDS):
        return "drought"
    return None


def _parse_date(series: pd.Series) -> pd.Series:
    for fmt in ("%d/%m/%Y", "%Y %b %d %I:%M:%S %p", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            parsed = pd.to_datetime(series, format=fmt, errors="coerce")
            if parsed.notna().mean() > 0.8:
                return parsed
        except Exception:
            continue
    # Last resort — suppress infer warning since we intentionally fall back
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return pd.to_datetime(series, errors="coerce")


def _add_coords(df: pd.DataFrame) -> pd.DataFrame:
    coords = df["divipola"].apply(
        lambda d: divipola_to_coords(int(d)) if pd.notna(d) else None
    )
    df["lon"] = coords.apply(lambda c: c[0] if c else None)
    df["lat"] = coords.apply(lambda c: c[1] if c else None)
    return df


# ── HDX ──────────────────────────────────────────────────────────────

def _load_hdx() -> pd.DataFrame:
    if not HDX_PATH.exists():
        logger.warning("HDX file not found: %s", HDX_PATH)
        return pd.DataFrame()

    try:
        raw = pd.read_excel(HDX_PATH)
    except Exception as e:
        logger.error("Could not read HDX file: %s", e)
        return pd.DataFrame()

    raw["date"]       = _parse_date(raw["FECHA"])
    raw["event_type"] = raw["EVENTO"].apply(_normalize_event)
    raw["divipola"]   = pd.to_numeric(raw["DIVIPOLA"], errors="coerce")
    raw["source"]     = "hdx_1990_2020"

    df = raw.dropna(subset=["date", "event_type", "divipola"])
    df = df[df["event_type"].notna()]
    df["dept_code"] = (df["divipola"] // 1000).astype(int)
    df = _add_coords(df)
    logger.info("HDX loaded: %d events (%s)", len(df),
                df["event_type"].value_counts().to_dict())
    return df[["date", "dept_code", "divipola", "event_type", "lat", "lon", "source"]]


# ── UNGRD CSVs ───────────────────────────────────────────────────────

def _load_ungrd_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    try:
        raw = pd.read_csv(path, on_bad_lines="skip", low_memory=False)
    except Exception as e:
        logger.warning("Could not read UNGRD CSV %s: %s", path.name, e)
        return pd.DataFrame()

    evento_col   = next((c for c in raw.columns if "EVENTO"    in c.upper()), None)
    fecha_col    = next((c for c in raw.columns if "FECHA"     in c.upper()), None)
    divipola_col = next((c for c in raw.columns if "DIVIPOLA"  in c.upper()
                         or "CODIFICACI" in c.upper()), None)

    if not all([evento_col, fecha_col, divipola_col]):
        logger.warning("UNGRD CSV %s missing required columns", path.name)
        return pd.DataFrame()

    raw["date"]       = _parse_date(raw[fecha_col])
    raw["event_type"] = raw[evento_col].apply(_normalize_event)
    raw["divipola"]   = pd.to_numeric(
        raw[divipola_col].astype(str).str.replace(",", "").str.strip(),
        errors="coerce",
    )
    raw["source"] = f"ungrd_{path.stem}"

    df = raw.dropna(subset=["date", "event_type", "divipola"])
    df = df[df["event_type"].notna()]
    df["dept_code"] = (df["divipola"] // 1000).astype(int)
    df = _add_coords(df)
    return df[["date", "dept_code", "divipola", "event_type", "lat", "lon", "source"]]


def _load_all_ungrd() -> pd.DataFrame:
    frames = [_load_ungrd_csv(p) for p in UNGRD_CSV_PATHS]
    frames = [f for f in frames if not f.empty]
    if not frames:
        return pd.DataFrame()
    combined = pd.concat(frames, ignore_index=True)
    logger.info("UNGRD combined (pre-dedup): %d rows", len(combined))
    return combined


# ── DesInventar XML ──────────────────────────────────────────────────

def _load_desinventar() -> pd.DataFrame:
    if not DESINVENTAR_PATH.exists():
        logger.info("DesInventar XML not found — skipping (download from db.desinventar.org)")
        return pd.DataFrame()

    rows = []
    try:
        tree = ET.parse(DESINVENTAR_PATH)
        root = tree.getroot()
        # Structure: <DESINVENTAR><fichas><TR>...</TR>...
        fichas_el = root.find("fichas")
        if fichas_el is None:
            logger.warning("DesInventar XML: <fichas> element not found")
            return pd.DataFrame()

        for card in fichas_el.iter("TR"):
            evento = (card.findtext("evento") or "").upper()
            event_type = None
            if any(k in evento for k in _FLOOD_KEYWORDS):
                event_type = "flood"
            elif any(k in evento for k in _DROUGHT_KEYWORDS):
                event_type = "drought"
            else:
                continue

            # Date from fechano/fechames fields
            fechano = card.findtext("fechano") or ""
            fechames = card.findtext("fechames") or "1"
            try:
                date = pd.to_datetime(f"{fechano}-{int(fechames):02d}-01", errors="coerce")
            except Exception:
                date = pd.NaT

            # DIVIPOLA from level1 (municipality code); fall back to level0 (dept)
            cod = card.findtext("level1") or card.findtext("level0") or ""
            try:
                divipola = int(cod.strip())
            except ValueError:
                divipola = None

            if pd.isna(date) or divipola is None:
                continue

            rows.append({"date": date, "divipola": divipola, "event_type": event_type})

    except Exception as e:
        logger.error("Could not parse DesInventar XML: %s", e)
        return pd.DataFrame()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["dept_code"] = (df["divipola"] // 1000).astype(int)
    df["source"] = "desinventar"
    df = _add_coords(df)
    logger.info("DesInventar loaded: %d events (%s)", len(df),
                df["event_type"].value_counts().to_dict())
    return df[["date", "dept_code", "divipola", "event_type", "lat", "lon", "source"]]


# ── Public API ───────────────────────────────────────────────────────

def load_all_labels(deduplicate: bool = True) -> pd.DataFrame:
    """Load, merge, and optionally deduplicate all label sources.

    Dedup key: (year, month, dept_code, event_type).
    UNGRD reports multiple response records per event — keeping one per
    department per month is the correct unit of analysis.
    """
    frames = [_load_hdx(), _load_all_ungrd(), _load_desinventar()]
    frames = [f for f in frames if not f.empty]

    if not frames:
        logger.error("No label data available — check DATA_DIR paths")
        return pd.DataFrame()

    df = pd.concat(frames, ignore_index=True)
    df = df.dropna(subset=["date", "lat", "lon"])
    df["year"]  = df["date"].dt.year
    df["month"] = df["date"].dt.month

    if deduplicate:
        before = len(df)
        # Keep first occurrence per (year, month, dept, type) — prefer HDX > DesInventar > UNGRD
        source_priority = {"hdx_1990_2020": 0, "desinventar": 1}
        df["_priority"] = df["source"].map(lambda s: source_priority.get(s, 2))
        df = df.sort_values("_priority").drop_duplicates(
            subset=["year", "month", "dept_code", "event_type"], keep="first"
        ).drop(columns="_priority")
        logger.info("Dedup: %d → %d rows", before, len(df))

    df = df.sort_values("date").reset_index(drop=True)
    logger.info(
        "Labels final: %d total | %s",
        len(df),
        df["event_type"].value_counts().to_dict(),
    )
    return df


def load_flood_labels() -> pd.DataFrame:
    return load_all_labels()[lambda df: df["event_type"] == "flood"]


def load_drought_labels() -> pd.DataFrame:
    return load_all_labels()[lambda df: df["event_type"] == "drought"]
