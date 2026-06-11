"""EVA (Evaluaciones Agropecuarias) service.

Loads eva_caribe.csv at module import and exposes yield forecasts
and production trends per crop and department for the Caribbean region.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

_CSV_PATH = Path(__file__).parents[2] / "data" / "caribe" / "eva_caribe.csv"

# Map EVA crop names to our normalized names
_CROP_ALIASES: dict[str, list[str]] = {
    "Maíz": ["Maíz", "Maiz", "MAIZ", "Maíz tecnificado", "Maíz tradicional"],
    "Yuca": ["Yuca", "YUCA"],
    "Arroz": ["Arroz", "ARROZ", "Arroz riego", "Arroz secano"],
    "Plátano": ["Plátano", "PLATANO", "Plátano", "Plátano exportación"],
    "Cacao": ["Cacao", "CACAO"],
    "Palma": ["Palma de aceite", "Palma aceitera", "PALMA"],
    "Frijol": ["Fríjol", "Frijol", "FRIJOL"],
    "Ñame": ["Ñame", "Name", "ÑAME"],
    "Algodón": ["Algodón", "ALGODON"],
    "Sorgo": ["Sorgo", "SORGO"],
    "Mango": ["Mango", "MANGO"],
}

_ALIAS_INDEX: dict[str, str] = {}
for canonical, aliases in _CROP_ALIASES.items():
    for alias in aliases:
        _ALIAS_INDEX[alias.lower()] = canonical


def _normalize_crop(name: str) -> str:
    return _ALIAS_INDEX.get(name.strip().lower(), name.strip().title())


@lru_cache(maxsize=1)
def _load_df() -> pd.DataFrame:
    if not _CSV_PATH.exists():
        logger.warning("eva_caribe.csv not found at %s", _CSV_PATH)
        return pd.DataFrame()

    df = pd.read_csv(_CSV_PATH)
    df["cultivo_norm"] = df["Cultivo"].apply(_normalize_crop)
    df["depto_norm"] = df["_depto_norm"].str.upper().str.strip()

    for col in ["Rendimiento (t/ha)", "Producción (t)", "Área cosechada (ha)", "Área sembrada (ha)"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    if "Año" in df.columns:
        df["Año"] = pd.to_numeric(df["Año"], errors="coerce")

    logger.info("EVA CSV cargado: %d registros, %d cultivos únicos", len(df), df["cultivo_norm"].nunique())
    return df


def get_harvest_forecast(
    cultivo: str,
    depto: str | None = None,
    area_ha: float | None = None,
    last_n_years: int = 3,
) -> dict:
    """Return yield statistics and production forecast for a crop.

    Args:
        cultivo: Crop name (normalized internally).
        depto: Optional department filter.
        area_ha: If provided, calculates estimated total production.
        last_n_years: How many recent years to use for stats.

    Returns:
        Dict with yield_median, yield_p10, yield_p90, trend, estimated_production,
        years_covered, n_records, and a summary string for LLM injection.
    """
    df = _load_df()
    if df.empty:
        return {}

    cultivo_norm = _normalize_crop(cultivo)
    mask = df["cultivo_norm"] == cultivo_norm
    subset = df[mask]

    if depto:
        depto_upper = depto.upper().strip()
        depto_mask = subset["depto_norm"] == depto_upper
        if depto_mask.sum() >= 5:
            subset = subset[depto_mask]

    # Drop zero-yield rows (municipalities where crop wasn't actually harvested)
    if "Rendimiento (t/ha)" in subset.columns:
        subset = subset[subset["Rendimiento (t/ha)"] > 0]

    if subset.empty:
        return {}

    # Filter to last N years
    if "Año" in subset.columns:
        max_year = subset["Año"].max()
        recent = subset[subset["Año"] >= max_year - last_n_years + 1]
        if len(recent) >= 3:
            subset = recent
            years = sorted(subset["Año"].dropna().unique().astype(int).tolist())
        else:
            years = sorted(subset["Año"].dropna().unique().astype(int).tolist())
    else:
        years = []

    rend = subset["Rendimiento (t/ha)"].dropna()
    if rend.empty:
        return {}

    yield_median = round(float(rend.median()), 2)
    yield_p10 = round(float(np.percentile(rend, 10)), 2)
    yield_p90 = round(float(np.percentile(rend, 90)), 2)

    # Simple trend: compare last year avg vs previous years avg
    trend_pct: float | None = None
    trend_label = "estable"
    if "Año" in subset.columns and len(years) >= 2:
        last_year = years[-1]
        last_rend = subset[subset["Año"] == last_year]["Rendimiento (t/ha)"].mean()
        prev_rend = subset[subset["Año"] < last_year]["Rendimiento (t/ha)"].mean()
        if not (np.isnan(last_rend) or np.isnan(prev_rend)) and prev_rend > 0:
            trend_pct = round((last_rend - prev_rend) / prev_rend * 100, 1)
            if trend_pct > 5:
                trend_label = "en aumento"
            elif trend_pct < -5:
                trend_label = "en descenso"

    result: dict = {
        "cultivo": cultivo_norm,
        "depto": depto.upper() if depto else "Caribe (todos los dptos)",
        "yield_median_t_ha": yield_median,
        "yield_p10_t_ha": yield_p10,
        "yield_p90_t_ha": yield_p90,
        "trend_pct": trend_pct,
        "trend_label": trend_label,
        "years_covered": years,
        "n_records": int(len(rend)),
    }

    if area_ha and area_ha > 0:
        result["area_ha"] = area_ha
        result["estimated_production_t"] = round(yield_median * area_ha, 1)
        result["estimated_low_t"] = round(yield_p10 * area_ha, 1)
        result["estimated_high_t"] = round(yield_p90 * area_ha, 1)

    # Build summary for LLM
    years_str = f"{years[0]}–{years[-1]}" if len(years) >= 2 else str(years[0]) if years else "N/D"
    summary_parts = [
        f"Rendimiento histórico de {cultivo_norm}",
        f"en {result['depto']} ({years_str}, {result['n_records']} registros):",
        f"  Mediana: {yield_median} t/ha",
        f"  Rango típico: {yield_p10}–{yield_p90} t/ha",
        f"  Tendencia: {trend_label}" + (f" ({trend_pct:+.1f}%)" if trend_pct is not None else ""),
    ]
    if area_ha:
        summary_parts.append(
            f"  Producción estimada para {area_ha} ha: "
            f"{result['estimated_production_t']} t "
            f"(rango: {result['estimated_low_t']}–{result['estimated_high_t']} t)"
        )
    result["summary"] = "\n".join(summary_parts)

    return result


def get_production_trends(
    cultivo: str,
    depto: str | None = None,
    last_n_years: int = 5,
) -> list[dict]:
    """Return year-by-year area, production, and yield for charting."""
    df = _load_df()
    if df.empty:
        return []

    cultivo_norm = _normalize_crop(cultivo)
    mask = df["cultivo_norm"] == cultivo_norm
    subset = df[mask]

    if depto:
        depto_upper = depto.upper().strip()
        depto_mask = subset["depto_norm"] == depto_upper
        if depto_mask.sum() >= 3:
            subset = subset[depto_mask]

    if subset.empty or "Año" not in subset.columns:
        return []

    max_year = subset["Año"].max()
    subset = subset[subset["Año"] >= max_year - last_n_years + 1]

    grouped = (
        subset.groupby("Año")
        .agg(
            area_ha=("Área cosechada (ha)", "sum"),
            produccion_t=("Producción (t)", "sum"),
            rendimiento_t_ha=("Rendimiento (t/ha)", "median"),
        )
        .reset_index()
        .sort_values("Año")
    )

    return [
        {
            "year": int(row["Año"]),
            "area_ha": round(float(row["area_ha"]), 1) if not np.isnan(row["area_ha"]) else None,
            "produccion_t": round(float(row["produccion_t"]), 1) if not np.isnan(row["produccion_t"]) else None,
            "rendimiento_t_ha": round(float(row["rendimiento_t_ha"]), 2) if not np.isnan(row["rendimiento_t_ha"]) else None,
        }
        for _, row in grouped.iterrows()
    ]


def get_available_crops(depto: str | None = None) -> list[str]:
    df = _load_df()
    if df.empty:
        return []
    subset = df
    if depto:
        mask = df["depto_norm"] == depto.upper().strip()
        if mask.sum() > 0:
            subset = df[mask]
    return sorted(subset["cultivo_norm"].dropna().unique().tolist())
