"""Foliar tissue analysis service.

Loads foliar_caribe.csv at module import and exposes statistical
summaries (mean, std, p10, p50, p90) per crop and department.
Used by AgroAsesor to diagnose nutrient gaps vs. regional norms.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

_CSV_PATH = Path(__file__).parents[2] / "data" / "caribe" / "foliar_caribe.csv"

NUTRIENTS = {
    "n_pct":  "Nitrógeno (N) % STD",
    "p_pct":  "Fósforo (P) % STD",
    "k_pct":  "Potasio (K) % STD",
    "ca_pct": "Calcio (Ca) % STD",
    "mg_pct": "Magnesio (Mg) % STD",
    "s_pct":  "Azufre (S) % STD",
    "fe_ppm": "Hierro (Fe) mg/kg STD",
    "cu_ppm": "Cobre (Cu) mg/kg STD",
    "mn_ppm": "Manganeso (Mn) mg/kg STD",
    "zn_ppm": "Zinc (Zn) mg/kg STD",
    "b_ppm":  "Boro (B) mg/kg STD",
}

NUTRIENT_LABELS = {
    "n_pct":  ("Nitrógeno", "%"),
    "p_pct":  ("Fósforo", "%"),
    "k_pct":  ("Potasio", "%"),
    "ca_pct": ("Calcio", "%"),
    "mg_pct": ("Magnesio", "%"),
    "s_pct":  ("Azufre", "%"),
    "fe_ppm": ("Hierro", "mg/kg"),
    "cu_ppm": ("Cobre", "mg/kg"),
    "mn_ppm": ("Manganeso", "mg/kg"),
    "zn_ppm": ("Zinc", "mg/kg"),
    "b_ppm":  ("Boro", "mg/kg"),
}

# Sufficiency ranges per nutrient for interpretation
# Based on general tropical crop norms (AGROSAVIA / IPNI references)
SUFFICIENCY_RANGES = {
    "n_pct":  (2.0, 5.0),
    "p_pct":  (0.15, 0.50),
    "k_pct":  (1.2, 3.5),
    "ca_pct": (0.40, 2.50),
    "mg_pct": (0.20, 1.00),
    "s_pct":  (0.15, 0.50),
    "fe_ppm": (50,   300),
    "cu_ppm": (4,    20),
    "mn_ppm": (20,   300),
    "zn_ppm": (15,   100),
    "b_ppm":  (20,   80),
}


@lru_cache(maxsize=1)
def _load_df() -> pd.DataFrame:
    if not _CSV_PATH.exists():
        logger.warning("foliar_caribe.csv not found at %s", _CSV_PATH)
        return pd.DataFrame()

    df = pd.read_csv(_CSV_PATH)
    rename = {v: k for k, v in NUTRIENTS.items()}
    df = df.rename(columns=rename)
    for col in NUTRIENTS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    logger.info("Foliar CSV cargado: %d registros", len(df))
    return df


def _stats(series: pd.Series) -> dict:
    valid = series.dropna()
    if len(valid) < 3:
        return {}
    return {
        "n":   int(len(valid)),
        "mean": round(float(valid.mean()), 3),
        "std":  round(float(valid.std()), 3),
        "p10":  round(float(np.percentile(valid, 10)), 3),
        "p50":  round(float(np.percentile(valid, 50)), 3),
        "p90":  round(float(np.percentile(valid, 90)), 3),
    }


def get_foliar_profile(cultivo: str, depto: str | None = None) -> dict:
    """Return nutrient statistics for a crop, optionally filtered by department.

    Falls back to all-department aggregate when depto filter yields < 5 rows.
    """
    df = _load_df()
    if df.empty:
        return {}

    norm_cultivo = cultivo.strip().title()

    mask = df["_cultivo_norm"].str.title() == norm_cultivo
    subset = df[mask]

    if depto and len(subset) >= 5:
        depto_norm = depto.upper().strip()
        depto_mask = subset["_depto_norm"].str.upper() == depto_norm
        if depto_mask.sum() >= 5:
            subset = subset[depto_mask]

    if subset.empty:
        return {}

    profile: dict = {
        "cultivo": norm_cultivo,
        "n_samples": len(subset),
        "departamentos": sorted(subset["_depto_norm"].dropna().unique().tolist()),
        "nutrients": {},
    }

    for key in NUTRIENTS:
        if key not in subset.columns:
            continue
        stats = _stats(subset[key])
        if stats:
            label, unit = NUTRIENT_LABELS[key]
            lo, hi = SUFFICIENCY_RANGES.get(key, (None, None))
            profile["nutrients"][key] = {
                "label": label,
                "unit": unit,
                "sufficient_lo": lo,
                "sufficient_hi": hi,
                **stats,
            }

    return profile


def diagnose_nutrient_gaps(
    cultivo: str,
    depto: str | None = None,
    measured: dict | None = None,
) -> list[dict]:
    """Compare measured foliar values against regional norms.

    Returns list of {nutrient, label, unit, measured, norm_p50, status, message}.
    Status: 'optimal' | 'low' | 'high' | 'unknown'.
    If `measured` is None, returns norm profile only (no comparison).
    """
    profile = get_foliar_profile(cultivo, depto)
    if not profile:
        return []

    gaps = []
    for key, nut in profile["nutrients"].items():
        entry: dict = {
            "nutrient": key,
            "label": nut["label"],
            "unit": nut["unit"],
            "norm_p10": nut.get("p10"),
            "norm_p50": nut.get("p50"),
            "norm_p90": nut.get("p90"),
            "measured": measured.get(key) if measured else None,
            "status": "unknown",
            "message": "",
        }

        if measured and key in measured and measured[key] is not None:
            val = float(measured[key])
            entry["measured"] = val
            p10, p90 = nut.get("p10"), nut.get("p90")
            if p10 is not None and p90 is not None:
                if val < p10:
                    entry["status"] = "low"
                    entry["message"] = f"Por debajo del rango normal ({p10}–{p90} {nut['unit']})"
                elif val > p90:
                    entry["status"] = "high"
                    entry["message"] = f"Por encima del rango normal ({p10}–{p90} {nut['unit']})"
                else:
                    entry["status"] = "optimal"
                    entry["message"] = f"Dentro del rango normal ({p10}–{p90} {nut['unit']})"
        else:
            entry["status"] = "norm_only"
            p50 = nut.get("p50")
            if p50 is not None:
                entry["message"] = f"Norma regional p50: {p50} {nut['unit']}"

        gaps.append(entry)

    return gaps


def format_foliar_for_llm(cultivo: str, depto: str | None = None) -> str:
    """Return a concise text block for LLM context injection."""
    profile = get_foliar_profile(cultivo, depto)
    if not profile:
        return f"Sin datos foliares disponibles para {cultivo}."

    lines = [
        f"Perfil foliar de {cultivo} ({profile['n_samples']} muestras",
        f"  Departamentos: {', '.join(profile['departamentos'])}",
        "  Nutrientes (p10 | p50 | p90):",
    ]
    for key, nut in profile["nutrients"].items():
        lines.append(
            f"    {nut['label']}: {nut.get('p10', '?')} | "
            f"{nut.get('p50', '?')} | {nut.get('p90', '?')} {nut['unit']}"
        )
    return "\n".join(lines)
