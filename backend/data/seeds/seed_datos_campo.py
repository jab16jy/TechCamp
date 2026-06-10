"""Seed datos_campo table from EVA, Suelos, and Foliar CSV datasets.

Idempotent — uses TRUNCATE + reinsert pattern.
"""
import asyncio
import csv
import logging
import math
from pathlib import Path

import asyncpg

logger = logging.getLogger(__name__)

DATABASE_URL = "postgresql://agrocaribe:agrocaribe_secret@localhost:5432/agrocaribe"

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "caribe"

BATCH_SIZE = 2000

# Known crop names that map to our model crops
KNOWN_CROPS = {
    "Maíz", "Yuca", "Arroz", "Frijol", "Ñame",
    "Plátano", "Cacao", "Algodón", "Sorgo", "Palma_Aceitera",
}

# Normalize crop names from CSV to our model names
CROP_ALIASES = {
    "maiz": "Maíz",
    "maíz": "Maíz",
    "yuca": "Yuca",
    "arroz": "Arroz",
    "frijol": "Frijol",
    "name": "Ñame",
    "ñame": "Ñame",
    "platano": "Plátano",
    "plátano": "Plátano",
    "cacao": "Cacao",
    "algodon": "Algodón",
    "algodón": "Algodón",
    "sorgo": "Sorgo",
    "palma": "Palma_Aceitera",
    "palma aceitera": "Palma_Aceitera",
    "palma africana": "Palma_Aceitera",
}


def normalize_cultivo(raw: str) -> str | None:
    """Normalize crop name to our model names, return None if unknown."""
    if not raw:
        return None
    cleaned = raw.strip()
    if cleaned in KNOWN_CROPS:
        return cleaned
    return CROP_ALIASES.get(cleaned.lower())


def safe_float(val: str) -> float | None:
    """Parse float from string, return None if invalid."""
    if not val or not val.strip():
        return None
    try:
        f = float(val.strip())
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def safe_int(val: str) -> int | None:
    """Parse int from string, return None if invalid."""
    if not val or not val.strip():
        return None
    try:
        return int(float(val.strip()))
    except (ValueError, TypeError):
        return None


# ── EVA (production data) ────────────────────────────────────────────────


def read_eva(path: Path) -> list[tuple]:
    """Read EVA Caribe CSV and yield (cultivo, departamento, municipio,
    lat, lng, ph, mo, textura, ndvi, ndwi, rendimiento, fuente, anio) tuples."""
    rows = []
    if not path.exists():
        logger.warning("EVA file not found: %s", path)
        return rows

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cultivo = normalize_cultivo(
                row.get("_cultivo_norm", "") or row.get("Cultivo", "")
            )
            if cultivo is None:
                continue

            rendimiento = safe_float(row.get("Rendimiento (t/ha)", ""))
            if rendimiento is None or rendimiento <= 0:
                continue

            anio = safe_int(row.get("Año", ""))
            departamento = (row.get("Departamento", "") or "").strip()
            municipio = (row.get("Municipio", "") or "").strip()

            rows.append((
                cultivo,
                departamento or None,
                municipio or None,
                None,  # lat
                None,  # lng
                None,  # ph
                None,  # mo
                None,  # textura
                None,  # ndvi
                None,  # ndwi
                rendimiento,
                "EVA",
                anio,
            ))

    logger.info("EVA: %d rows loaded", len(rows))
    return rows


# ── Suelos (physicochemical data) ────────────────────────────────────────


def read_suelos(path: Path) -> list[tuple]:
    """Read Suelos Caribe CSV."""
    rows = []
    if not path.exists():
        logger.warning("Suelos file not found: %s", path)
        return rows

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cultivo = normalize_cultivo(
                row.get("_cultivo_norm", "") or row.get("Cultivo", "")
            )
            if cultivo is None:
                continue

            ph = safe_float(row.get("pH agua:suelo", ""))
            mo = safe_float(row.get("Materia organica", ""))
            if ph is None and mo is None:
                continue  # skip if no useful data

            departamento = (row.get("Departamento", "") or "").strip()
            municipio = (row.get("Municipio", "") or "").strip()
            textura = (row.get("Textura", "") or "").strip() or None

            rows.append((
                cultivo,
                departamento or None,
                municipio or None,
                None,  # lat
                None,  # lng
                ph,
                mo,
                textura,
                None,  # ndvi
                None,  # ndwi
                None,  # rendimiento
                "SUELOS",
                None,  # anio
            ))

    logger.info("Suelos: %d rows loaded", len(rows))
    return rows


# ── Foliar (tissue analysis data) ────────────────────────────────────────


def read_foliar(path: Path) -> list[tuple]:
    """Read Foliar Caribe CSV."""
    rows = []
    if not path.exists():
        logger.warning("Foliar file not found: %s", path)
        return rows

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cultivo = normalize_cultivo(
                row.get("_cultivo_norm", "") or row.get("Cultivo", "")
            )
            if cultivo is None:
                continue

            departamento = (row.get("departamento revisado", "") or "").strip()
            municipio = (row.get("municipio revisado", "") or "").strip()

            rows.append((
                cultivo,
                departamento or None,
                municipio or None,
                None,  # lat
                None,  # lng
                None,  # ph
                None,  # mo
                None,  # textura
                None,  # ndvi
                None,  # ndwi
                None,  # rendimiento
                "FOLIAR",
                None,  # anio
            ))

    logger.info("Foliar: %d rows loaded", len(rows))
    return rows


# ── Main ──────────────────────────────────────────────────────────────────


async def main():
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)

    # Create table if not exists (idempotent)
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS datos_campo (
            id SERIAL PRIMARY KEY,
            cultivo VARCHAR(100) NOT NULL,
            departamento VARCHAR(100),
            municipio VARCHAR(100),
            lat DOUBLE PRECISION,
            lng DOUBLE PRECISION,
            ph DOUBLE PRECISION,
            mo DOUBLE PRECISION,
            textura VARCHAR(50),
            ndvi DOUBLE PRECISION,
            ndwi DOUBLE PRECISION,
            rendimiento DOUBLE PRECISION,
            fuente VARCHAR(20),
            anio INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_datos_campo_cultivo
        ON datos_campo (cultivo)
    """)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_datos_campo_cultivo_fuente
        ON datos_campo (cultivo, fuente)
    """)

    # Truncate for idempotency
    print("Truncando datos_campo...")
    await conn.execute("TRUNCATE TABLE datos_campo RESTART IDENTITY CASCADE")

    # Load all data sources
    all_rows = []

    print("\n--- Cargando EVA Caribe ---")
    all_rows.extend(read_eva(DATA_DIR / "eva_caribe.csv"))

    print("\n--- Cargando Suelos Caribe ---")
    all_rows.extend(read_suelos(DATA_DIR / "suelos_caribe.csv"))

    print("\n--- Cargando Foliar Caribe ---")
    all_rows.extend(read_foliar(DATA_DIR / "foliar_caribe.csv"))

    logger.info("Total rows to insert: %d", len(all_rows))
    print(f"\nTotal filas a insertar: {len(all_rows)}")

    # Batch insert
    total = 0
    batch = []
    for row in all_rows:
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            await conn.executemany(
                """INSERT INTO datos_campo
                   (cultivo, departamento, municipio, lat, lng, ph, mo, textura,
                    ndvi, ndwi, rendimiento, fuente, anio)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
                           $9, $10, $11, $12, $13)""",
                batch,
            )
            total += len(batch)
            print(f"  {total} insertados...", end="\r")
            batch.clear()

    if batch:
        await conn.executemany(
            """INSERT INTO datos_campo
               (cultivo, departamento, municipio, lat, lng, ph, mo, textura,
                ndvi, ndwi, rendimiento, fuente, anio)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
                       $9, $10, $11, $12, $13)""",
            batch,
        )
        total += len(batch)

    print(f"\n=== TOTAL: {total} filas insertadas ===")

    # Count per fuente
    counts = await conn.fetch(
        "SELECT fuente, COUNT(*) as n FROM datos_campo GROUP BY fuente ORDER BY fuente"
    )
    for c in counts:
        print(f"  {c['fuente'] or 'N/A'}: {c['n']} registros")

    # Count per cultivo
    crop_counts = await conn.fetch(
        "SELECT cultivo, COUNT(*) as n FROM datos_campo GROUP BY cultivo ORDER BY n DESC LIMIT 10"
    )
    print("\nTop cultivos:")
    for c in crop_counts:
        print(f"  {c['cultivo']}: {c['n']}")

    await conn.close()
    print("\nSeed completado exitosamente.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    asyncio.run(main())
