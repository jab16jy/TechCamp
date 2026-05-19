"""Import remaining NDVI CSVs into Supabase (APPEND mode, no DELETE)"""
import asyncio, csv, math, sys
from pathlib import Path

import asyncpg

BASE = Path(r"D:\sentinel 2\nvdi")
FILES = {
    "Barranquilla":   BASE / "nvdi_parte2" / "nvdi_parte2final.csv",
    "Santa Marta-A":  BASE / "nvdi_parte3" / "nvdi_parte3final.csv",
    "Cartagena":      BASE / "nvdi_parte4" / "nvdi_parte4final.csv",
    "Santa Marta-B":  BASE / "nvdi_parte5" / "nvdi_parte5final.csv",
    "Sincelejo":      BASE / "nvdi_parte6" / "nvdi_parte6final.csv",
    "Monteria":       BASE / "nvdi_parte7" / "nvdi_parte7final.csv",
}

BATCH_SIZE = 500
SAMPLE_EVERY = 10
NDVI_MIN = 0.1
CLOUD_COVER = 20

DATABASE_URL = "postgresql://postgres.hpmjbgqjwopxlgurczna:LRLv7mBEkfZnsm7B@aws-1-us-west-1.pooler.supabase.com:6543/postgres"


def calidad(ndvi: float) -> str:
    if ndvi > 0.6:  return "Alta"
    if ndvi > 0.4:  return "Media-Alta"
    if ndvi > 0.2:  return "Media-Baja"
    return "Baja"


async def process_file(conn, name: str, path: Path):
    if not path.exists():
        print(f"  [SALTAR] {name}: archivo no encontrado")
        return 0, 0

    total = 0
    kept = 0

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        batch = []

        for i, row in enumerate(reader):
            total += 1
            if i % SAMPLE_EVERY != 0:
                continue

            raw = row.get("SAMPLE_1", "")
            if not raw:
                continue
            ndvi = float(raw)
            if math.isnan(ndvi) or ndvi < NDVI_MIN:
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
                print(f"    {kept}k insertados...", end="\r")

        if batch:
            await conn.executemany(
                """INSERT INTO indices_satelitales
                   (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion)
                   VALUES ($1, $2, $3, $4, $5, $6,
                           ST_SetSRID(ST_MakePoint($7, $8), 4326))""",
                batch,
            )

    return total, kept


async def main():
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)

    total_all = 0
    kept_all = 0

    for name, path in FILES.items():
        print(f"\n--- {name} ---")
        total, kept = await process_file(conn, name, path)
        print(f"    {name}: {kept} insertados de {total} leidos")
        total_all += total
        kept_all += kept

    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_indices_satelitales_ubicacion "
        "ON indices_satelitales USING GIST (ubicacion)"
    )
    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_indices_satelitales_coords "
        "ON indices_satelitales (lat, lng)"
    )

    await conn.close()
    print(f"\n=== TOTAL: {kept_all} filas insertadas de {total_all} leidas ===")


if __name__ == "__main__":
    asyncio.run(main())
