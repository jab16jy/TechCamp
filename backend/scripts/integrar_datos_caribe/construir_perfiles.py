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
]

SUELOS_STATS_COLS: Final[list[str]] = [
    "pH agua:suelo",
    "Materia organica",
    "Fósforo Bray II",
    "Potasio intercambiable",
    "Calcio intercambiable",
    "Magnesio intercambiable",
]

FOLIAR_STATS_COLS: Final[dict[str, str]] = {
    "Nitrógeno (N) % STD": "n_foliar_promedio",
    "Fósforo (P) % STD": "p_foliar_promedio",
    "Potasio (K) % STD": "k_foliar_promedio",
}

# Output CSV column order
OUTPUT_COLUMNS: Final[list[str]] = [
    "cultivo",
    "ph_promedio",
    "ph_p10",
    "ph_p50",
    "ph_p90",
    "mo_promedio",
    "mo_p10",
    "mo_p50",
    "mo_p90",
    "p_bray_promedio",
    "k_interc_promedio",
    "drenaje_predominante",
    "topografia_predominante",
    "n_foliar_promedio",
    "p_foliar_promedio",
    "k_foliar_promedio",
    "n_registros_eva",
    "n_registros_suelos",
    "n_registros_foliar",
    "n_municipios",
    "n_departamentos",
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


def _compute_suelos_stats(
    suelos: pd.DataFrame,
    cultivo: str,
) -> dict[str, Any]:
    """Compute soil statistics for a single crop.

    Args:
        suelos: Suelos DataFrame filtered for the given crop.
        cultivo: Crop name.

    Returns:
        Dictionary with pH/MO stats, P/K means, drenaje/topografia mode.
    """
    stats: dict[str, Any] = {
        "cultivo": cultivo,
        "n_registros_suelos": len(suelos),
    }

    # pH stats
    ph = suelos["pH agua:suelo"].dropna()
    stats["ph_promedio"] = round(ph.mean(), 2) if len(ph) > 0 else np.nan
    if len(ph) > 0:
        ph_q = ph.quantile([0.1, 0.5, 0.9])
        stats["ph_p10"] = round(ph_q.iloc[0], 2)
        stats["ph_p50"] = round(ph_q.iloc[1], 2)
        stats["ph_p90"] = round(ph_q.iloc[2], 2)
    else:
        stats["ph_p10"] = stats["ph_p50"] = stats["ph_p90"] = np.nan

    # MO stats
    mo = suelos["Materia organica"].dropna()
    stats["mo_promedio"] = round(mo.mean(), 2) if len(mo) > 0 else np.nan
    if len(mo) > 0:
        mo_q = mo.quantile([0.1, 0.5, 0.9])
        stats["mo_p10"] = round(mo_q.iloc[0], 2)
        stats["mo_p50"] = round(mo_q.iloc[1], 2)
        stats["mo_p90"] = round(mo_q.iloc[2], 2)
    else:
        stats["mo_p10"] = stats["mo_p50"] = stats["mo_p90"] = np.nan

    # P Bray II mean
    p = suelos["Fósforo Bray II"].dropna()
    stats["p_bray_promedio"] = round(p.mean(), 2) if len(p) > 0 else np.nan

    # K intercambiable mean
    k = suelos["Potasio intercambiable"].dropna()
    stats["k_interc_promedio"] = round(k.mean(), 2) if len(k) > 0 else np.nan

    # Drenaje mode
    stats["drenaje_predominante"] = _mode(suelos["Drenaje"])

    # Topografia mode
    stats["topografia_predominante"] = _mode(suelos["Topografia"])

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

        # Filter by normalized crop name
        eva_crop = eva[eva["_cultivo_norm"] == cultivo]
        suelos_crop = suelos[suelos["_cultivo_norm"] == cultivo]
        foliar_crop = foliar[foliar["_cultivo_norm"] == cultivo]

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
