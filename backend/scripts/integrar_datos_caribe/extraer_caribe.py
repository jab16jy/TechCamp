#!/usr/bin/env python3
"""
extraer_caribe.py — Extracción y limpieza de datos agrícolas del Caribe colombiano.

Lee 3 datasets originales:
  1. EVA (Excel) — Encuesta Nacional Agropecuaria
  2. Suelos (CSV) — Resultados de Análisis de Laboratorio AGROSAVIA
  3. Foliar (CSV) — Análisis Vegetal AGROSAVIA

Filtra a los 7 departamentos del Caribe, normaliza nombres, limpia valores
faltantes (ND → NaN, <0 → NaN) y guarda CSVs limpios en el directorio de salida.

Usage:
    python extraer_caribe.py [--output-dir ../../../data/caribe/]
"""

from __future__ import annotations

import argparse
import logging
import os
import re
import sys
from pathlib import Path
from typing import Final

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CARIBE_DEPARTMENTS: Final[list[str]] = [
    "ATLANTICO",
    "BOLIVAR",
    "CESAR",
    "CORDOBA",
    "LA GUAJIRA",
    "MAGDALENA",
    "SUCRE",
]

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

# Default paths to original source files
DEFAULT_EVA_PATH: Final[str] = (
    "/home/jabyn/Downloads/dataset/20260526_BaseAgricola20192025.xlsx"
)
DEFAULT_SUELOS_PATH: Final[str] = (
    "/home/jabyn/Downloads/dataset/"
    "Resultados_de_Análisis_de_Laboratorio_Suelos_en_Colombia_20260609.csv"
)
DEFAULT_FOLIAR_PATH: Final[str] = (
    "/home/jabyn/Downloads/dataset/"
    "Análisis_vegetal_(foliar)_Agrosavia_20260609.csv"
)

# Numeric columns in Suelos that should be converted from string to float
SUELOS_NUMERIC_COLS: Final[list[str]] = [
    "pH agua:suelo",
    "Materia organica",
    "Fósforo Bray II",
    "Azufre Fosfato monocalcico",
    "Acidez Intercambiable",
    "Aluminio intercambiable",
    "Calcio intercambiable",
    "Magnesio intercambiable",
    "Potasio intercambiable",
    "Sodio intercambiable",
    "capacidad de intercambio cationico",
    "Conductividad electrica",
    "Hierro disponible olsen",
    "Cobre disponible",
    "Manganeso disponible Olsen",
    "Zinc disponible Olsen",
    "Boro disponible",
    "Hierro disponible doble acido",
    "Cobre disponible doble acido",
    "Manganeso disponible doble acido",
    "Zinc disponible doble \xa0acido",
]

# Numeric columns in Foliar
FOLIAR_NUMERIC_COLS: Final[list[str]] = [
    "Nitrógeno (N) % STD",
    "Fósforo (P) % STD",
    "Potasio (K) % STD",
    "Calcio (Ca) % STD",
    "Magnesio (Mg) % STD",
    "Sodio (Na) % STD",
    "Azufre (S) % STD",
    "Hierro (Fe) mg/kg STD",
    "Cobre (Cu) mg/kg STD",
    "Manganeso (Mn) mg/kg STD",
    "Zinc (Zn) mg/kg STD",
    "Boro (B) mg/kg STD",
]

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("extraer_caribe")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _normalize_depto(depto: str) -> str:
    """Normalize department name: uppercase, no accents, no leading/trailing spaces.

    Args:
        depto: Raw department name (e.g. 'Atlántico', 'BOLIVAR', '  Córdoba  ').

    Returns:
        Normalized uppercase string without accents.
    """
    accent_map = {
        "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U",
        "á": "A", "é": "E", "í": "I", "ó": "O", "ú": "U",
        "Ü": "U", "ü": "U", "Ñ": "Ñ", "ñ": "Ñ",
    }
    cleaned = depto.strip().upper()
    for acc, no_acc in accent_map.items():
        cleaned = cleaned.replace(acc, no_acc)
    return cleaned


def _normalize_cultivo(cultivo: str) -> str:
    """Normalize crop name: capitalize first letter, strip whitespace.

    Args:
        cultivo: Raw crop name.

    Returns:
        Normalized crop name with consistent capitalization.
    """
    return cultivo.strip().capitalize()


def _is_caribe(depto_norm: str) -> bool:
    """Check if a normalized department name belongs to the Caribe region.

    Args:
        depto_norm: Normalized department name (uppercase, no accents).

    Returns:
        True if the department is one of the 7 Caribe departments.
    """
    return depto_norm in CARIBE_DEPARTMENTS


# ---------------------------------------------------------------------------
# EVA extraction
# ---------------------------------------------------------------------------


def extraer_eva(path: str | Path) -> pd.DataFrame:
    """Extract and filter EVA data from Excel, keeping only Caribe departments.

    Args:
        path: Path to the EVA Excel file.

    Returns:
        DataFrame with EVA records filtered to the 7 Caribe departments,
        with added '_depto_norm' and '_cultivo_norm' columns.
    """
    logger.info("Leyendo EVA desde %s ...", path)
    df: pd.DataFrame = pd.read_excel(
        path,
        sheet_name="BasePagina",
        header=8,
        dtype={"Código Dane departamento": str},
    )

    # Drop rows that are notes or completely empty
    df = df.dropna(subset=["Departamento"]).copy()

    logger.info("EVA registros totales (nacional): %s", len(df))

    # Normalize department names
    df["_depto_norm"] = df["Departamento"].astype(str).apply(_normalize_depto)

    # Filter to Caribe
    mask = df["_depto_norm"].isin(CARIBE_DEPARTMENTS)
    df_caribe = df[mask].copy()
    logger.info("EVA registros Caribe: %s", len(df_caribe))

    # Normalize crop names
    df_caribe["_cultivo_norm"] = (
        df_caribe["Cultivo"].astype(str).apply(_normalize_cultivo)
    )

    return df_caribe


# ---------------------------------------------------------------------------
# Suelos extraction
# ---------------------------------------------------------------------------


def _parse_numeric(value: str) -> float:
    """Parse a numeric string, converting 'ND' and empty values to NaN.

    Args:
        value: Raw string value.

    Returns:
        float value, or NaN if the value is 'ND', empty, or unparseable.
    """
    if pd.isna(value):
        return np.nan
    s = str(value).strip()
    if s.upper() in ("ND", "N.D.", "N/D", "", "NO INDICA", "NO APLICA"):
        return np.nan
    try:
        return float(s.replace(",", "."))
    except (ValueError, TypeError):
        return np.nan


def extraer_suelos(path: str | Path) -> pd.DataFrame:
    """Extract and filter Suelos data, keeping only Caribe departments.

    Converts numeric columns to float, replacing 'ND' with NaN.

    Args:
        path: Path to the Suelos CSV file.

    Returns:
        DataFrame with Suelos records filtered to the 7 Caribe departments.
    """
    logger.info("Leyendo Suelos desde %s ...", path)
    df: pd.DataFrame = pd.read_csv(path, dtype=str)

    # Normalize department
    df["_depto_norm"] = df["Departamento"].astype(str).apply(_normalize_depto)
    mask = df["_depto_norm"].isin(CARIBE_DEPARTMENTS)
    df_caribe = df[mask].copy()
    logger.info(
        "Suelos registros totales: %s | Caribe: %s",
        len(df),
        len(df_caribe),
    )

    # Convert numeric columns
    for col in SUELOS_NUMERIC_COLS:
        if col in df_caribe.columns:
            df_caribe[col] = df_caribe[col].apply(_parse_numeric)

    # Normalize crop names
    df_caribe["_cultivo_norm"] = (
        df_caribe["Cultivo"].astype(str).apply(_normalize_cultivo)
    )

    return df_caribe


# ---------------------------------------------------------------------------
# Foliar extraction
# ---------------------------------------------------------------------------


def _replace_lt_zero(value: str) -> float:
    """Replace '<0' strings with NaN, otherwise try to parse as float.

    Args:
        value: Raw string value, possibly '<0'.

    Returns:
        float value or NaN.
    """
    if pd.isna(value):
        return np.nan
    s = str(value).strip()
    if s in ("<0", "< 0", "<0.0", "", "ND", "N.D."):
        return np.nan
    try:
        return float(s.replace(",", "."))
    except (ValueError, TypeError):
        return np.nan


def extraer_foliar(path: str | Path) -> pd.DataFrame:
    """Extract and filter Foliar data, keeping only Caribe departments.

    Replaces '<0' values with NaN.

    Args:
        path: Path to the Foliar CSV file.

    Returns:
        DataFrame with Foliar records filtered to the 7 Caribe departments.
    """
    logger.info("Leyendo Foliar desde %s ...", path)
    df: pd.DataFrame = pd.read_csv(path, dtype=str)

    # Normalize department
    df["_depto_norm"] = (
        df["departamento revisado"].astype(str).apply(_normalize_depto)
    )
    mask = df["_depto_norm"].isin(CARIBE_DEPARTMENTS)
    df_caribe = df[mask].copy()
    logger.info(
        "Foliar registros totales: %s | Caribe: %s",
        len(df),
        len(df_caribe),
    )

    # Convert numeric columns, handling <0
    for col in FOLIAR_NUMERIC_COLS:
        if col in df_caribe.columns:
            df_caribe[col] = df_caribe[col].apply(_replace_lt_zero)

    # Normalize crop names
    df_caribe["_cultivo_norm"] = (
        df_caribe["Cultivo"].astype(str).apply(_normalize_cultivo)
    )

    return df_caribe


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


def print_summary(eva: pd.DataFrame, suelos: pd.DataFrame, foliar: pd.DataFrame) -> None:
    """Print a summary of extracted datasets.

    Args:
        eva: Filtered EVA DataFrame.
        suelos: Filtered Suelos DataFrame.
        foliar: Filtered Foliar DataFrame.
    """
    print("\n" + "=" * 60)
    print("RESUMEN DE EXTRACCIÓN — DATOS CARIBE")
    print("=" * 60)

    for name, df in [("EVA", eva), ("Suelos", suelos), ("Foliar", foliar)]:
        print(f"\n--- {name} ---")
        print(f"  Registros: {len(df)}")
        deptos = sorted(df["_depto_norm"].unique())
        print(f"  Departamentos ({len(deptos)}): {', '.join(deptos)}")

        if "_cultivo_norm" in df.columns:
            crops = df["_cultivo_norm"].dropna().unique()
            priority = [c for c in crops if c in PRIORITY_CROPS]
            other = [c for c in crops if c not in PRIORITY_CROPS]
            print(f"  Cultivos prioritarios ({len(priority)}): {', '.join(sorted(priority))}")
            print(f"  Otros cultivos ({len(other)}): {len(other)} únicos")

    print("\n" + "=" * 60)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments.

    Args:
        argv: Argument list (defaults to sys.argv[1:]).

    Returns:
        Parsed namespace with 'output_dir'.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Extrae y filtra datos agrícolas del Caribe colombiano "
            "desde los datasets originales EVA, Suelos y Foliar."
        ),
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="../../../data/caribe/",
        help="Directorio donde guardar los CSVs filtrados (default: data/caribe/)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Main entry point: extract all three datasets and save to output dir.

    Args:
        argv: Optional argument list for testing.
    """
    args = parse_args(argv)

    # Resolve output directory relative to this script's location
    script_dir = Path(__file__).parent.resolve()
    output_dir = (script_dir / args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Directorio de salida: %s", output_dir)

    # --- EVA ---
    eva_path = Path(DEFAULT_EVA_PATH)
    if not eva_path.exists():
        logger.error("Archivo EVA no encontrado: %s", eva_path)
        sys.exit(1)
    eva = extraer_eva(eva_path)
    eva_out = output_dir / "eva_caribe.csv"
    eva.to_csv(eva_out, index=False)
    logger.info("EVA Caribe guardado: %s (%s registros)", eva_out, len(eva))

    # --- Suelos ---
    suelos_path = Path(DEFAULT_SUELOS_PATH)
    if not suelos_path.exists():
        logger.error("Archivo Suelos no encontrado: %s", suelos_path)
        sys.exit(1)
    suelos = extraer_suelos(suelos_path)
    suelos_out = output_dir / "suelos_caribe.csv"
    suelos.to_csv(suelos_out, index=False)
    logger.info("Suelos Caribe guardado: %s (%s registros)", suelos_out, len(suelos))

    # --- Foliar ---
    foliar_path = Path(DEFAULT_FOLIAR_PATH)
    if not foliar_path.exists():
        logger.error("Archivo Foliar no encontrado: %s", foliar_path)
        sys.exit(1)
    foliar = extraer_foliar(foliar_path)
    foliar_out = output_dir / "foliar_caribe.csv"
    foliar.to_csv(foliar_out, index=False)
    logger.info("Foliar Caribe guardado: %s (%s registros)", foliar_out, len(foliar))

    # Print summary
    print_summary(eva, suelos, foliar)


if __name__ == "__main__":
    main()
