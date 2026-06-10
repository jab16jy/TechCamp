#!/usr/bin/env python3
"""
construir_perfiles.py — Construcción de perfiles de cultivo reales del Caribe.

Lee los 3 datasets Caribe (EVA, Suelos, Foliar) y para cada uno de los 10
cultivos prioritarios calcula estadísticos agregados:

  - Suelos: pH, MO (mean, p10, p50, p90), P Bray II (mean), K (mean),
            drenaje (mode), topografia (mode)
  - Foliar: N, P, K foliar mean (si hay >= 5 muestras)
  - EVA:    n registros, n municipios, n departamentos, rendimiento promedio

No realiza joins entre datasets — cada dataset se procesa independientemente
y los resultados se agregan por cultivo.

Usage:
    python construir_perfiles.py [--data-dir ../../../data/caribe/]
                                 [--output ../../../data/caribe/perfiles_cultivo_reales.csv]
"""

from __future__ import annotations

import argparse
import logging
import sys
import unicodedata
from pathlib import Path
from typing import Any, Final

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PRIORITY_CROPS: Final[list[str]] = [
    "Algodón",
    "Arroz",
    "Cacao",
    "Frijol",
    "Maíz",
    "Palma",
    "Plátano",
    "Sorgo",
    "Yuca",
    "Ñame",
    "Mango",
    "Ají",
]

SUELOS_STATS_COLS: Final[list[str]] = [
    "pH agua:suelo",
    "Materia organica",
    "Fósforo Bray II",
    "Potasio intercambiable",
    "Calcio intercambiable",
    "Magnesio intercambiable",
    # New chemistry analytes (9 total, 4 already above)
    "capacidad de intercambio cationico",
    "Conductividad electrica",
    "Azufre Fosfato monocalcico",
    "Boro disponible",
    "Sodio intercambiable",
]

FOLIAR_STATS_COLS: Final[dict[str, str]] = {
    "Nitrógeno (N) % STD": "n_foliar_promedio",
    "Fósforo (P) % STD": "p_foliar_promedio",
    "Potasio (K) % STD": "k_foliar_promedio",
}

# Output CSV column order
# 22 original + 36 new = 58 columns total
# New analyte groups (4 stats each: promedio, p10, p50, p90) inserted after mo_p90
OUTPUT_COLUMNS: Final[list[str]] = [
    "cultivo",
    # pH (4)
    "ph_promedio",
    "ph_p10",
    "ph_p50",
    "ph_p90",
    # MO (4)
    "mo_promedio",
    "mo_p10",
    "mo_p50",
    "mo_p90",
    # NEW: 7 completely new chemistry analytes (7 × 4 = 28)
    "calcio_promedio",
    "calcio_p10",
    "calcio_p50",
    "calcio_p90",
    "cic_promedio",
    "cic_p10",
    "cic_p50",
    "cic_p90",
    "conductividad_promedio",
    "conductividad_p10",
    "conductividad_p50",
    "conductividad_p90",
    "magnesio_promedio",
    "magnesio_p10",
    "magnesio_p50",
    "magnesio_p90",
    "azufre_promedio",
    "azufre_p10",
    "azufre_p50",
    "azufre_p90",
    "boro_promedio",
    "boro_p10",
    "boro_p50",
    "boro_p90",
    "sodio_promedio",
    "sodio_p10",
    "sodio_p50",
    "sodio_p90",
    # EXISTING: P Bray II - keep promedio, ADD percentiles (4)
    "p_bray_promedio",
    "p_bray_p10",
    "p_bray_p50",
    "p_bray_p90",
    # EXISTING: K intercambiable - keep promedio, ADD percentiles (4)
    "k_interc_promedio",
    "k_interc_p10",
    "k_interc_p50",
    "k_interc_p90",
    # Drenaje / Topografia (2)
    "drenaje_predominante",
    "topografia_predominante",
    # Foliar (3)
    "n_foliar_promedio",
    "p_foliar_promedio",
    "k_foliar_promedio",
    # EVA counts (5)
    "n_registros_eva",
    "n_registros_suelos",
    "n_registros_foliar",
    "n_municipios",
    "n_departamentos",
    # Rendimiento (1)
    "rendimiento_promedio",
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("construir_perfiles")


# ---------------------------------------------------------------------------
# Suelos stats
# ---------------------------------------------------------------------------


def _mode(series: pd.Series) -> Any:
    """Compute the mode of a pandas Series.

    Args:
        series: Input series.

    Returns:
        The most frequent value, or NaN if the series is empty/all NaN.
    """
    result = series.dropna().mode()
    if result.empty:
        return np.nan
    return result.iloc[0]


# Mapping from input column name to output field prefix
SUELOS_COLUMN_MAP: Final[dict[str, str]] = {
    "pH agua:suelo": "ph",
    "Materia organica": "mo",
    "Fósforo Bray II": "p_bray",
    "Potasio intercambiable": "k_interc",
    "Calcio intercambiable": "calcio",
    "Magnesio intercambiable": "magnesio",
    "capacidad de intercambio cationico": "cic",
    "Conductividad electrica": "conductividad",
    "Azufre Fosfato monocalcico": "azufre",
    "Boro disponible": "boro",
    "Sodio intercambiable": "sodio",
}


def _compute_stats_for_column(
    series: pd.Series,
    prefix: str,
) -> dict[str, Any]:
    """Compute mean + percentiles (p10, p50, p90) for a single column.

    Args:
        series: Data series (may contain NaN).
        prefix: Output field prefix (e.g., 'ph', 'calcio', 'cic').

    Returns:
        Dictionary with {prefix}_promedio, {prefix}_p10, {prefix}_p50, {prefix}_p90.
    """
    vals = series.dropna()
    result: dict[str, Any] = {}

    if len(vals) > 0:
        result[f"{prefix}_promedio"] = round(vals.mean(), 2)
        q = vals.quantile([0.1, 0.5, 0.9])
        result[f"{prefix}_p10"] = round(q.iloc[0], 2)
        result[f"{prefix}_p50"] = round(q.iloc[1], 2)
        result[f"{prefix}_p90"] = round(q.iloc[2], 2)
    else:
        result[f"{prefix}_promedio"] = np.nan
        result[f"{prefix}_p10"] = np.nan
        result[f"{prefix}_p50"] = np.nan
        result[f"{prefix}_p90"] = np.nan

    return result


def _compute_suelos_stats(
    suelos: pd.DataFrame,
    cultivo: str,
) -> dict[str, Any]:
    """Compute soil statistics for a single crop.

    Computes mean + percentiles (p10, p50, p90) for all columns in SUELOS_STATS_COLS,
    plus drenaje and topografia modes.

    Args:
        suelos: Suelos DataFrame filtered for the given crop.
        cultivo: Crop name.

    Returns:
        Dictionary with stats for all soil chemistry analytes.
    """
    stats: dict[str, Any] = {
        "cultivo": cultivo,
        "n_registros_suelos": len(suelos),
    }

    # Compute mean + percentiles for each soil column
    for col, prefix in SUELOS_COLUMN_MAP.items():
        if col in suelos.columns:
            stats.update(_compute_stats_for_column(suelos[col], prefix))
        else:
            # Column not present in data — fill with NaN
            stats[f"{prefix}_promedio"] = np.nan
            stats[f"{prefix}_p10"] = np.nan
            stats[f"{prefix}_p50"] = np.nan
            stats[f"{prefix}_p90"] = np.nan

    # Drenaje mode
    stats["drenaje_predominante"] = _mode(suelos["Drenaje"]) if "Drenaje" in suelos.columns else np.nan

    # Topografia mode
    stats["topografia_predominante"] = _mode(suelos["Topografia"]) if "Topografia" in suelos.columns else np.nan

    return stats


# ---------------------------------------------------------------------------
# Foliar stats
# ---------------------------------------------------------------------------


def _compute_foliar_stats(
    foliar: pd.DataFrame,
    cultivo: str,
    min_samples: int = 5,
) -> dict[str, Any]:
    """Compute foliar statistics for a single crop.

    Args:
        foliar: Foliar DataFrame filtered for the given crop.
        cultivo: Crop name.
        min_samples: Minimum number of samples to compute foliar stats.

    Returns:
        Dictionary with N, P, K foliar means (NaN if insufficient data).
    """
    n = len(foliar)
    stats: dict[str, Any] = {
        "n_registros_foliar": n,
        "n_foliar_promedio": np.nan,
        "p_foliar_promedio": np.nan,
        "k_foliar_promedio": np.nan,
    }

    if n < min_samples:
        logger.info(
            "  %s: datos foliares insuficientes (%s registros, mínimo %s)",
            cultivo,
            n,
            min_samples,
        )
        return stats

    for col, key in FOLIAR_STATS_COLS.items():
        if col in foliar.columns:
            vals = foliar[col].dropna()
            if len(vals) > 0:
                stats[key] = round(vals.mean(), 2)

    return stats


# ---------------------------------------------------------------------------
# NFD normalization helper
# ---------------------------------------------------------------------------


def _norm_nfd(s: str) -> str:
    """Remove accents using NFD normalization + ASCII encoding.

    Ensures that accented (e.g. 'Ají') and unaccented (e.g. 'Aji')
    crop names match across datasets.
    """
    if not isinstance(s, str):
        return ""
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii")


# ---------------------------------------------------------------------------
# EVA stats
# ---------------------------------------------------------------------------


def _compute_eva_stats(
    eva: pd.DataFrame,
    cultivo: str,
) -> dict[str, Any]:
    """Compute EVA statistics for a single crop.

    Args:
        eva: EVA DataFrame filtered for the given crop.
        cultivo: Crop name.

    Returns:
        Dictionary with counts and average yield.
    """
    stats: dict[str, Any] = {
        "n_registros_eva": len(eva),
        "n_municipios": int(eva["Municipio"].nunique()),
        "n_departamentos": int(eva["_depto_norm"].nunique()),
    }

    # Average yield
    rend = eva["Rendimiento (t/ha)"].dropna()
    # Filter out zero yields for the average
    rend_pos = rend[rend > 0]
    if len(rend_pos) > 0:
        stats["rendimiento_promedio"] = round(rend_pos.mean(), 2)
    else:
        stats["rendimiento_promedio"] = 0.0

    return stats


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------


def construir_perfiles(
    eva: pd.DataFrame,
    suelos: pd.DataFrame,
    foliar: pd.DataFrame,
) -> pd.DataFrame:
    """Build crop profiles for all priority crops.

    Args:
        eva: Cleaned EVA Caribe DataFrame.
        suelos: Cleaned Suelos Caribe DataFrame.
        foliar: Cleaned Foliar Caribe DataFrame.

    Returns:
        DataFrame with one row per priority crop and profile statistics.
    """
    rows: list[dict[str, Any]] = []

    for cultivo in PRIORITY_CROPS:
        logger.info("Procesando: %s", cultivo)

        # Filter by normalized crop name (NFD-normalized to handle accents)
        cultivo_nfd = _norm_nfd(cultivo)
        eva_crop = eva[eva["_cultivo_norm"].apply(_norm_nfd) == cultivo_nfd]
        suelos_crop = suelos[suelos["_cultivo_norm"].apply(_norm_nfd) == cultivo_nfd]
        foliar_crop = foliar[foliar["_cultivo_norm"].apply(_norm_nfd) == cultivo_nfd]

        # Compute stats from each dataset
        eva_stats = _compute_eva_stats(eva_crop, cultivo)
        suelos_stats = _compute_suelos_stats(suelos_crop, cultivo)
        foliar_stats = _compute_foliar_stats(foliar_crop, cultivo)

        # Merge all stats into one row
        row: dict[str, Any] = {"cultivo": cultivo}
        row.update(eva_stats)
        row.update(suelos_stats)
        row.update(foliar_stats)
        rows.append(row)

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments.

    Args:
        argv: Argument list (defaults to sys.argv[1:]).

    Returns:
        Parsed namespace.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Construye perfiles de cultivo reales del Caribe "
            "a partir de datos EVA, Suelos y Foliar."
        ),
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default="../../../data/caribe/",
        help="Directorio con los CSVs de entrada (default: data/caribe/)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="../../../data/caribe/perfiles_cultivo_reales.csv",
        help="Ruta de salida para el CSV de perfiles (default: data/caribe/perfiles_cultivo_reales.csv)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Main entry point.

    Args:
        argv: Optional argument list for testing.
    """
    args = parse_args(argv)

    # Resolve paths relative to this script's location
    script_dir = Path(__file__).parent.resolve()
    data_dir = (script_dir / args.data_dir).resolve()
    output_path = (script_dir / args.output).resolve()

    if not data_dir.exists():
        logger.error("Directorio de datos no encontrado: %s", data_dir)
        sys.exit(1)

    # --- Load datasets ---
    eva_path = data_dir / "eva_caribe.csv"
    suelos_path = data_dir / "suelos_caribe.csv"
    foliar_path = data_dir / "foliar_caribe.csv"

    for p in [eva_path, suelos_path, foliar_path]:
        if not p.exists():
            logger.error("Archivo no encontrado: %s", p)
            sys.exit(1)

    logger.info("Cargando EVA: %s", eva_path)
    eva = pd.read_csv(eva_path)
    logger.info("Cargando Suelos: %s", suelos_path)
    suelos = pd.read_csv(suelos_path)
    logger.info("Cargando Foliar: %s", foliar_path)
    foliar = pd.read_csv(foliar_path)

    logger.info(
        "Datasets cargados: EVA=%s, Suelos=%s, Foliar=%s",
        len(eva),
        len(suelos),
        len(foliar),
    )

    # --- Build profiles ---
    perfiles = construir_perfiles(eva, suelos, foliar)

    # Ensure column order
    perfiles = perfiles[OUTPUT_COLUMNS]

    # --- Save ---
    output_path.parent.mkdir(parents=True, exist_ok=True)
    perfiles.to_csv(output_path, index=False)
    logger.info("Perfiles guardados: %s", output_path)

    # --- Print table ---
    print("\n" + "=" * 100)
    print("PERFILES DE CULTIVO REALES — CARIBE")
    print("=" * 100)

    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 200)
    pd.set_option("display.float_format", lambda x: f"{x:.2f}" if not pd.isna(x) else "NaN")

    display_cols = [
        "cultivo",
        "ph_promedio",
        "mo_promedio",
        "p_bray_promedio",
        "k_interc_promedio",
        "drenaje_predominante",
        "topografia_predominante",
        "n_foliar_promedio",
        "p_foliar_promedio",
        "k_foliar_promedio",
        "n_registros_eva",
        "n_registros_suelos",
        "rendimiento_promedio",
    ]
    print(perfiles[display_cols].to_string(index=False))

    print("\n" + "=" * 100)


if __name__ == "__main__":
    main()
