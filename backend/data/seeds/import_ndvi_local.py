"""Import all NDVI CSVs into local Docker PostGIS (replaces Supabase import scripts)"""
import asyncio
import csv
import math
from pathlib import Path

import asyncpg

# Local Docker PostGIS credentials
DATABASE_URL = "postgresql://agrocaribe:agrocaribe_secret@localhost:5432/agrocaribe"

BASE = Path(r"D:\sentinel 2\nvdi")

FILES = {
    "Riohacha":       BASE / "nvdi_parte1" / "NVDI_PART1FINAL.csv",
    "Barranquilla":   BASE / "nvdi_parte2" / "nvdi_parte2final.csv",
    "Santa Marta-A":  BASE / "nvdi_parte3" / "nvdi_parte3final.csv",
    "Cartagena":      BASE / "nvdi_parte4" / "nvdi_parte4final.csv",
    "Santa Marta-B":  BASE / "nvdi_parte5" / "nvdi_parte5final.csv",
    "Sincelejo":      BASE / "nvdi_parte6" / "nvdi_parte6final.csv",
    "Monteria":       BASE / "nvdi_parte7" / "nvdi_parte7final.csv",
}

# Config per part
CONFIG = {
    "Riohacha":       {"sample_every": 20, "ndvi_min": 0.15},
    "Barranquilla":   {"sample_every": 10, "ndvi_min": 0.1},
    "Santa Marta-A":  {"sample_every": 10, "ndvi_min": 0.1},
    "Cartagena":      {"sample_every": 10, "ndvi_min": 0.1},
    "Santa Marta-B":  {"sample_every": 10, "ndvi_min": 0.1},
    "Sincelejo":      {"sample_every": 10, "ndvi_min": 0.1},
    "Monteria":       {"sample_every": 10, "ndvi_min": 0.1},
}

BATCH_SIZE = 5000
CLOUD_COVER = 20


def calidad(ndvi: float) -> str:
    if ndvi > 0.6:
        return "Alta"
    if ndvi > 0.4:
        return "Media-Alta"
    if ndvi > 0.2:
        return "Media-Baja"
    return "Baja"


async def process_file(conn, name: str, path: Path):
    if not path.exists():
        print(f"  [SALTAR] {name}: archivo no encontrado: {path}")
        return 0, 0

    cfg = CONFIG[name]
    sample_every = cfg["sample_every"]
    ndvi_min = cfg["ndvi_min"]

    total = 0
    kept = 0

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        batch = []

        for i, row in enumerate(reader):
            total += 1
            if i % sample_every != 0:
                continue

            raw = row.get("SAMPLE_1", "")
            if not raw:
                continue
            ndvi = float(raw)
            if math.isnan(ndvi) or ndvi < ndvi_min:
                continue

            lat = float(row["Y"])
            lng = float(row["X"])
            ndwi = round(max(0, ndvi * 0.35), 4)
            cq = calidad(ndvi)
            ndvi_rounded = round(ndvi, 4)

            batch.append((lat, lng, ndvi_rounded, ndwi, cq, CLOUD_COVER, lng, lat))
            kept += 1

            if len(batch) >= BATCH_SIZE:
                await conn.executemany(
                    """INSERT INTO indices_satelitales
                       (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion)
                       VALUES ($1, $2, $3, $4, $5, $6,
                               ST_SetSRID(ST_MakePoint($7, $8), 4326))""",
                    batch,
                )
                batch.clear()
                print(f"    {name}: {kept} insertados...", end="\r")

        if batch:
            await conn.executemany(
                """INSERT INTO indices_satelitales
                   (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion)
                   VALUES ($1, $2, $3, $4, $5, $6,
                           ST_SetSRID(ST_MakePoint($7, $8), 4326))""",
                batch,
            )

    print(f"    {name}: {kept} insertados de {total} leidos")
    return total, kept


async def main():
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)

    # Clear existing local data
    print("Truncando tabla indices_satelitales local...")
    await conn.execute("TRUNCATE TABLE indices_satelitales RESTART IDENTITY CASCADE")

    total_all = 0
    kept_all = 0

    for name, path in FILES.items():
        print(f"\n--- {name} ---")
        total, kept = await process_file(conn, name, path)
        total_all += total
        kept_all += kept

    print("\nCreando indices espaciales...")
    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_indices_satelitales_ubicacion "
        "ON indices_satelitales USING GIST (ubicacion)"
    )
    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_indices_satelitales_coords "
        "ON indices_satelitales (lat, lng)"
    )
    try:
        await conn.execute("VACUUM ANALYZE indices_satelitales")
    except Exception as e:
        print(f"  VACUUM fallo (limitacion de Docker shm): {e}")
        await conn.execute("ANALYZE indices_satelitales")
        print("  ANALYZE ejecutado como alternativa")

    await conn.close()
    print(f"\n=== TOTAL: {kept_all} filas insertadas de {total_all} leidas ===")


if __name__ == "__main__":
    asyncio.run(main())
