#!/usr/bin/env python3
"""
catalogo_expanision.py — Catálogo de cultivos candidatos para expansión del modelo.

Identifica cultivos en EVA Caribe con datos suficientes que NO están entre los
10 prioritarios, verifica soporte cruzado en Suelos y Foliar, clasifica por
prioridad y genera un catálogo priorizado.

Criterios de clasificación:
  - ALTA:  ≥50 EVA + ≥20 Suelos + ≥10 Foliar + ≥5 municipios
  - MEDIA: ≥50 EVA + al menos uno de (≥20 Suelos o ≥10 Foliar)
  - BAJA:  ≥50 EVA solamente (sin soporte cruzado suficiente)

Usage:
    python catalogo_expanision.py [--data-dir ../../../data/caribe/]
                                  [--output ../../../data/caribe/catalogo_expanision.csv]
"""

from __future__ import annotations

import argparse
import logging
import sys
import unicodedata
from pathlib import Path
from typing import Any, Final

import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PRIORITY_CROPS: Final[set[str]] = {
    "ALGODÓN",
    "ARROZ",
    "CACAO",
    "FRIJOL",
    "MAÍZ",
    "PALMA",
    "PLÁTANO",
    "SORGO",
    "YUCA",
    "ÑAME",
    "MANGO",
    "AJÍ",
}

# Additional normalized names to exclude (variants of priority crops)
PRIORITY_CROPS_NORM: Final[set[str]] = {
    "ALGODON",
    "ARROZ",
    "CACAO",
    "FRIJOL",
    "MAIZ",
    "PALMA",
    "PALMA DE ACEITE",
    "PLATANO",
    "SORGO",
    "YUCA",
    "NAME",
    "MANGO",
    "AJI",
}

# Minimum thresholds for each priority tier
MIN_EVA: Final[int] = 50
MIN_SUELOS_ALTA: Final[int] = 20
MIN_FOLIAR_ALTA: Final[int] = 10
MIN_MUNICIPIOS_ALTA: Final[int] = 5

# Output CSV column order
OUTPUT_COLUMNS: Final[list[str]] = [
    "cultivo",
    "n_eva_caribe",
    "n_suelos_caribe",
    "n_foliar_caribe",
    "n_municipios",
    "n_departamentos",
    "rendimiento_promedio",
    "prioridad",
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("catalogo_expanision")


# ---------------------------------------------------------------------------
# Text normalization
# ---------------------------------------------------------------------------


def _normalize_cultivo(name: str) -> str:
    """Normalize a crop name for cross-dataset matching.

    - Uppercase
    - Strip whitespace
    - Remove accents (NFD decomposition + discard combining marks)

    Args:
        name: Raw crop name from any dataset.

    Returns:
        Normalized string suitable for matching.
    """
    if not isinstance(name, str):
        return ""
    s = name.upper().strip()
    # Normalize to NFD and discard combining diacritical marks
    s = "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )
    return s


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------


def _clasificar(
    n_eva: int,
    n_suelos: int,
    n_foliar: int,
    n_municipios: int,
) -> str:
    """Classify a candidate crop into a priority tier.

    Args:
        n_eva: Number of EVA records.
        n_suelos: Number of Suelos records.
        n_foliar: Number of Foliar records.
        n_municipios: Number of municipalities present.

    Returns:
        Priority tier: "ALTA", "MEDIA", or "BAJA".
    """
    if n_eva < MIN_EVA:
        return "BAJA"

    alta_suelos = n_suelos >= MIN_SUELOS_ALTA
    alta_foliar = n_foliar >= MIN_FOLIAR_ALTA
    suficientes_municipios = n_municipios >= MIN_MUNICIPIOS_ALTA

    if alta_suelos and alta_foliar and suficientes_municipios:
        return "ALTA"

    if alta_suelos or alta_foliar:
        return "MEDIA"

    return "BAJA"


# ---------------------------------------------------------------------------
# Candidate analysis
# ---------------------------------------------------------------------------


def _analizar_candidatos(
    eva: pd.DataFrame,
    suelos: pd.DataFrame,
    foliar: pd.DataFrame,
) -> pd.DataFrame:
    """Identify and classify expansion candidates.

    Args:
        eva: Cleaned EVA Caribe DataFrame.
        suelos: Cleaned Suelos Caribe DataFrame.
        foliar: Cleaned Foliar Caribe DataFrame.

    Returns:
        DataFrame with candidate crops, cross-dataset counts, and priority.
    """
    # Normalize crop names in all datasets
    eva = eva.copy()
    suelos = suelos.copy()
    foliar = foliar.copy()

    eva["_cultivo_key"] = eva["Cultivo"].apply(_normalize_cultivo)
    suelos["_cultivo_key"] = suelos["Cultivo"].apply(_normalize_cultivo)
    foliar["_cultivo_key"] = foliar["Cultivo"].apply(_normalize_cultivo)

    # Get EVA counts by normalized crop name
    eva_counts = (
        eva.groupby("_cultivo_key")
        .agg(
            n_eva=("Cultivo", "count"),
            n_municipios=("Municipio", "nunique"),
            n_departamentos=("_depto_norm", "nunique"),
            rendimiento_promedio=("Rendimiento (t/ha)", "mean"),
        )
        .reset_index()
    )

    # Get Suelos counts by normalized crop name
    suelos_counts = (
        suelos.groupby("_cultivo_key")
        .size()
        .reset_index(name="n_suelos")
    )

    # Get Foliar counts by normalized crop name
    foliar_counts = (
        foliar.groupby("_cultivo_key")
        .size()
        .reset_index(name="n_foliar")
    )

    # Filter to crops with >= MIN_EVA records
    eva_counts = eva_counts[eva_counts["n_eva"] >= MIN_EVA].copy()

    # Exclude priority crops
    eva_counts = eva_counts[~eva_counts["_cultivo_key"].isin(PRIORITY_CROPS_NORM)].copy()

    if eva_counts.empty:
        logger.warning("No se encontraron cultivos candidatos con >= %s registros EVA", MIN_EVA)
        return pd.DataFrame(columns=OUTPUT_COLUMNS)

    # Merge EVA counts with Suelos and Foliar
    merged = eva_counts.merge(suelos_counts, on="_cultivo_key", how="left")
    merged = merged.merge(foliar_counts, on="_cultivo_key", how="left")

    # Fill NaN with 0 where datasets had no matching records
    merged["n_suelos"] = merged["n_suelos"].fillna(0).astype(int)
    merged["n_foliar"] = merged["n_foliar"].fillna(0).astype(int)

    # Filter out zero-yield records for average rendimiento
    rend_means = []
    for cultivo_key in merged["_cultivo_key"]:
        crop_data = eva[eva["_cultivo_key"] == cultivo_key]
        rend = crop_data["Rendimiento (t/ha)"].dropna()
        rend_pos = rend[rend > 0]
        rend_means.append(round(rend_pos.mean(), 2) if len(rend_pos) > 0 else 0.0)

    merged["rendimiento_promedio"] = rend_means

    # Classify each candidate
    merged["prioridad"] = merged.apply(
        lambda r: _clasificar(
            n_eva=r["n_eva"],
            n_suelos=r["n_suelos"],
            n_foliar=r["n_foliar"],
            n_municipios=r["n_municipios"],
        ),
        axis=1,
    )

    # Build output: use original Cultivo name from EVA (first occurrence)
    cultivo_names = (
        eva.groupby("_cultivo_key")["Cultivo"]
        .first()
        .reset_index()
        .rename(columns={"Cultivo": "cultivo"})
    )
    result = merged.merge(cultivo_names, on="_cultivo_key", how="left")

    # Rename columns to match OUTPUT_COLUMNS naming convention
    result = result.rename(
        columns={
            "n_eva": "n_eva_caribe",
            "n_suelos": "n_suelos_caribe",
            "n_foliar": "n_foliar_caribe",
        }
    )

    # Select and order output columns
    result = result[OUTPUT_COLUMNS]

    # Sort: ALTA → MEDIA → BAJA, then by n_eva descending
    priority_order = {"ALTA": 0, "MEDIA": 1, "BAJA": 2}
    result["_sort_key"] = result["prioridad"].map(priority_order)
    result = result.sort_values(["_sort_key", "n_eva_caribe"], ascending=[True, False])
    result = result.drop(columns=["_sort_key"])

    return result


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


def _print_summary(catalogo: pd.DataFrame) -> None:
    """Print a summary of the expansion catalog by priority tier.

    Args:
        catalogo: Catalog DataFrame with prioridad column.
    """
    print("\n" + "=" * 100)
    print("CATÁLOGO DE EXPANSIÓN DE CULTIVOS — CARIBE")
    print("=" * 100)

    for tier in ("ALTA", "MEDIA", "BAJA"):
        subset = catalogo[catalogo["prioridad"] == tier]
        print(f"\n{'─' * 100}")
        print(f"  PRIORIDAD {tier}: {len(subset)} candidatos")
        print(f"{'─' * 100}")
        if not subset.empty:
            pd.set_option("display.max_columns", None)
            pd.set_option("display.width", 200)
            pd.set_option(
                "display.float_format",
                lambda x: f"{x:.2f}" if not pd.isna(x) else "NaN",
            )
            display_cols = [
                "cultivo",
                "n_eva_caribe",
                "n_suelos_caribe",
                "n_foliar_caribe",
                "n_municipios",
                "n_departamentos",
                "rendimiento_promedio",
            ]
            print(subset[display_cols].to_string(index=False))

    print(f"\n{'=' * 100}")
    print(f"  TOTAL candidatos: {len(catalogo)}")
    for tier in ("ALTA", "MEDIA", "BAJA"):
        n = len(catalogo[catalogo["prioridad"] == tier])
        print(f"  {tier}: {n}")
    print(f"{'=' * 100}\n")


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
            "Identifica y clasifica cultivos candidatos para expansión "
            "del modelo de recomendación en la Región Caribe."
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
        default="../../../data/caribe/catalogo_expanision.csv",
        help="Ruta de salida para el CSV del catálogo (default: data/caribe/catalogo_expanision.csv)",
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

    # --- Analyze candidates ---
    catalogo = _analizar_candidatos(eva, suelos, foliar)

    if catalogo.empty:
        logger.warning("No se encontraron candidatos. Verifica los datos de entrada.")
        return

    # --- Save ---
    output_path.parent.mkdir(parents=True, exist_ok=True)
    catalogo.to_csv(output_path, index=False)
    logger.info("Catálogo guardado: %s", output_path)

    # --- Print summary ---
    _print_summary(catalogo)


if __name__ == "__main__":
    main()
