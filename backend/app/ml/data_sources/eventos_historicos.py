"""Historical flood/drought events WITH impact figures, for contextual display.

This is a *separate* concern from `ungrd.py`:
  - `ungrd.py` produces minimal labels (date, dept, type, coords) for ML training.
  - this module preserves the human-impact columns (people, families, homes,
    hectares, deaths...) so the UI can show *evidence*, not predictions.

Sources reuse the same raw files (UNGRD CSVs + HDX xlsx). Column names differ
between exports, so every field is resolved by keyword, never by a fixed name.

IMPORTANT (transparency rule): impacts are shown ONLY when present in the source.
A missing/blank value becomes ``None`` — it is never estimated or filled with 0.
A reported ``0`` is kept as ``0`` because that is a real recorded value.
"""
from __future__ import annotations

import logging
import threading
import unicodedata
from pathlib import Path

import pandas as pd

from app.ml.data_sources.config import (
    DEPT_CENTROIDS,
    HDX_PATH,
    UNGRD_CSV_PATHS,
)
from app.ml.data_sources.ungrd import _parse_date

logger = logging.getLogger(__name__)

# Module-level cache: the raw files are static, so we normalize once.
# The lock prevents a concurrent double-load (startup warm-up vs first request).
_EVENTS_CACHE: list[dict] | None = None
_LOAD_LOCK = threading.Lock()

_TEXT_NULLS = frozenset(["", "NO REGISTRA", "NO APLICA", "N/A", "NA", "SIN DATO", "NINGUNO"])


# ── Normalization helpers (pure — unit-tested without touching disk) ─────────

def _strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )


def normalize_municipio(value: str | None) -> str | None:
    """Uppercase, accent-free municipio name. HDX uses 'DEPT/MUNICIPIO' — take last."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    if "/" in text:
        text = text.split("/")[-1].strip()
    text = _strip_accents(text).upper()
    return text or None


def _find_col(columns, *, exact: str | None = None, contains: tuple[str, ...] | None = None):
    """Resolve a column by exact (accent-insensitive) name first, then by keywords."""
    norm = {c: _strip_accents(str(c)).upper().strip() for c in columns}
    if exact:
        target = _strip_accents(exact).upper()
        for col, up in norm.items():
            if up == target:
                return col
    if contains:
        keys = tuple(_strip_accents(k).upper() for k in contains)
        for col, up in norm.items():
            if all(k in up for k in keys):
                return col
    return None


def _to_number(value) -> float | int | None:
    """Coerce a cell to a number; blanks / sentinels / NaN → None (never estimated)."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, str) and _strip_accents(value).upper().strip() in _TEXT_NULLS:
        return None
    num = pd.to_numeric(str(value).replace(",", "").strip(), errors="coerce")
    if pd.isna(num):
        return None
    num = float(num)
    return int(num) if num.is_integer() else num


def _to_text(value) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    if _strip_accents(text).upper() in _TEXT_NULLS:
        return None
    return text or None


# Field -> (exact name candidate, keyword tuple). First match wins.
_IMPACT_FIELDS = {
    "personas_afectadas":  dict(exact="PERSONAS"),
    "familias_afectadas":  dict(exact="FAMILIAS"),
    "viviendas_destruidas": dict(contains=("VIV", "DESTRU")),
    "viviendas_averiadas":  dict(contains=("VIV", "AVER")),
    "hectareas_afectadas":  dict(contains=("HECTAREA",)),
    "fallecidos":           dict(exact="FALLECIDOS"),   # HDX fallback handled below
    "heridos":              dict(exact="HERIDOS"),
    "desaparecidos":        dict(contains=("DESAPA",)),
}


def normalize_events_frame(raw: pd.DataFrame, source: str) -> list[dict]:
    """Turn one raw source DataFrame into normalized flood/drought event dicts.

    Pure transform: no disk access, so tests feed synthetic frames here.
    Rows that are not floods/droughts, or lack a date/divipola, are dropped.
    """
    if raw is None or raw.empty:
        return []

    cols = list(raw.columns)
    evento_col = _find_col(cols, exact="EVENTO")
    fecha_col = _find_col(cols, exact="FECHA")  # exact avoids 'FECHA ACTIVACION'
    muni_col = _find_col(cols, exact="MUNICIPIO")
    depto_col = _find_col(cols, exact="DEPARTAMENTO")
    divipola_col = _find_col(cols, exact="DIVIPOLA") or _find_col(cols, contains=("DIVIPOLA",))
    comentario_col = _find_col(cols, contains=("OTROS",))
    if not all([evento_col, fecha_col, divipola_col]):
        logger.warning("eventos_historicos: %s missing required columns", source)
        return []

    impact_cols = {}
    for field, spec in _IMPACT_FIELDS.items():
        impact_cols[field] = _find_col(cols, **spec)
    if impact_cols["fallecidos"] is None:  # HDX names it MUERTOS
        impact_cols["fallecidos"] = _find_col(cols, exact="MUERTOS")

    # Vectorized event-type classification → keep ONLY flood/drought rows first.
    # Iterating every row of the multi-MB exports is the slow path; pre-filtering
    # drops it from ~300k rows to ~20k before we build per-row dicts.
    evento_norm = (
        raw[evento_col].fillna("").astype(str)
        .str.normalize("NFKD").str.encode("ascii", "ignore").str.decode("ascii")
        .str.upper()
    )
    is_flood = evento_norm.str.contains("INUNDACION|AVENIDA|CRECIENTE|DESBORD", regex=True, na=False)
    is_drought = evento_norm.str.contains("SEQU", regex=True, na=False)
    mask = is_flood | is_drought
    if not mask.any():
        return []

    df = raw.loc[mask].copy()
    df["_tipo"] = "sequia"
    df.loc[is_flood.loc[mask], "_tipo"] = "inundacion"  # flood wins if both match
    df["_ts"] = _parse_date(df[fecha_col])
    df["_dvp"] = pd.to_numeric(
        df[divipola_col].astype(str).str.replace(",", "").str.strip(), errors="coerce"
    )
    df = df.dropna(subset=["_ts", "_dvp"])
    if df.empty:
        return []
    df["_dept"] = (df["_dvp"] // 1000).astype(int)
    df["_coords"] = df["_dept"].map(DEPT_CENTROIDS)
    df = df[df["_coords"].notna()]

    events: list[dict] = []
    for rec in df.to_dict("records"):
        dvp = int(rec["_dvp"])
        lon, lat = rec["_coords"]
        muni_raw = _to_text(rec[muni_col]) if muni_col else None
        # HDX stores 'DEPT/MUNICIPIO' — show only the municipio segment.
        muni_display = muni_raw.split("/")[-1].strip() if muni_raw and "/" in muni_raw else muni_raw
        event = {
            "fecha": rec["_ts"].date().isoformat(),
            "_ts": rec["_ts"],
            "departamento": _to_text(rec[depto_col]) if depto_col else None,
            "municipio": muni_display,
            "municipio_norm": normalize_municipio(muni_raw),
            "tipo": rec["_tipo"],
            "fuente": source,
            "comentarios": _to_text(rec[comentario_col]) if comentario_col else None,
            "divipola": dvp,
            "dept_code": dvp // 1000,
            "lat": lat,
            "lon": lon,
        }
        for field, col in impact_cols.items():
            event[field] = _to_number(rec[col]) if col else None
        events.append(event)

    logger.info("eventos_historicos: %s → %d flood/drought events", source, len(events))
    return events


# ── I/O loaders (read disk, delegate to the pure transform) ──────────────────

def _read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    try:
        return pd.read_csv(path, on_bad_lines="skip", low_memory=False)
    except Exception as e:  # pragma: no cover - defensive
        logger.warning("eventos_historicos: cannot read %s: %s", path.name, e)
        return pd.DataFrame()


def _read_excel(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    try:
        return pd.read_excel(path)
    except Exception as e:  # pragma: no cover - defensive
        logger.warning("eventos_historicos: cannot read %s: %s", path.name, e)
        return pd.DataFrame()


def load_all_events(*, force_reload: bool = False) -> list[dict]:
    """Load + normalize every flood/drought event with impacts (cached).

    Thread-safe (double-checked lock) so the startup warm-up and a racing first
    request don't both pay the multi-MB parse cost.
    """
    global _EVENTS_CACHE
    if _EVENTS_CACHE is not None and not force_reload:
        return _EVENTS_CACHE

    with _LOAD_LOCK:
        if _EVENTS_CACHE is not None and not force_reload:
            return _EVENTS_CACHE

        events: list[dict] = []
        events += normalize_events_frame(_read_excel(HDX_PATH), "hdx_1990_2020")
        for path in UNGRD_CSV_PATHS:
            stem = path.stem.lower()
            label = stem if stem.startswith("ungrd") else "ungrd_emergencias"
            events += normalize_events_frame(_read_csv(path), label)

        events.sort(key=lambda e: e["_ts"], reverse=True)
        _EVENTS_CACHE = events
        logger.info("eventos_historicos: cached %d total events", len(events))
        return _EVENTS_CACHE


# ── Querying (pure — unit-tested with synthetic event lists) ─────────────────

def nearest_dept_code(lat: float, lon: float) -> int | None:
    """Closest department (by centroid) to a coordinate. Caribbean-region safe."""
    best, best_d = None, float("inf")
    for code, (clon, clat) in DEPT_CENTROIDS.items():
        d = (clat - lat) ** 2 + (clon - lon) ** 2
        if d < best_d:
            best, best_d = code, d
    return best


def _aggregate(events: list[dict]) -> dict:
    def _sum(field: str):
        vals = [e[field] for e in events if e.get(field) is not None]
        return sum(vals) if vals else None

    fechas = [e["fecha"] for e in events]

    # Per-year counts for the UI sparkline (computed over the full filtered set).
    by_year: dict[int, dict] = {}
    for e in events:
        y = int(e["fecha"][:4])
        bucket = by_year.setdefault(y, {"anio": y, "total": 0, "inundaciones": 0, "sequias": 0})
        bucket["total"] += 1
        bucket["inundaciones" if e["tipo"] == "inundacion" else "sequias"] += 1
    serie_anual = [by_year[y] for y in sorted(by_year)]

    return {
        "total_eventos": len(events),
        "inundaciones": sum(1 for e in events if e["tipo"] == "inundacion"),
        "sequias": sum(1 for e in events if e["tipo"] == "sequia"),
        "personas_afectadas": _sum("personas_afectadas"),
        "familias_afectadas": _sum("familias_afectadas"),
        "hectareas_afectadas": _sum("hectareas_afectadas"),
        "viviendas_destruidas": _sum("viviendas_destruidas"),
        "viviendas_averiadas": _sum("viviendas_averiadas"),
        "fallecidos": _sum("fallecidos"),
        "rango_fechas": {"desde": min(fechas), "hasta": max(fechas)} if fechas else None,
        "serie_anual": serie_anual,
    }


def query_events(
    events: list[dict],
    lat: float,
    lon: float,
    *,
    event_type: str | None = None,
    municipio: str | None = None,
    limit: int = 20,
) -> dict:
    """Filter normalized events by location/type and return events + aggregate.

    ``event_type`` accepts flood/drought or inundacion/sequia.
    Aggregate is computed over the FULL filtered set (before the limit cut).
    """
    dept_code = nearest_dept_code(lat, lon)
    matched = [e for e in events if e["dept_code"] == dept_code]

    if municipio:
        target = normalize_municipio(municipio)
        matched = [e for e in matched if e.get("municipio_norm") == target]

    if event_type:
        tipo_map = {"flood": "inundacion", "drought": "sequia"}
        wanted = tipo_map.get(event_type.lower(), event_type.lower())
        matched = [e for e in matched if e["tipo"] == wanted]

    matched.sort(key=lambda e: e["_ts"], reverse=True)
    resumen = _aggregate(matched)
    recientes = matched[: max(1, limit)]

    return {
        "dept_code": dept_code,
        "total_disponibles": len(matched),
        "eventos": recientes,
        "resumen": resumen,
    }
