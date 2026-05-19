"""Import parte4 (Cartagena) into Supabase - APPEND mode"""
import asyncio, csv, math
from pathlib import Path

import asyncpg

CSV_PATH = Path(r"D:\sentinel 2\nvdi\nvdi_parte4\nvdi_parte4final.csv")
BATCH_SIZE = 1000
SAMPLE_EVERY = 20
NDVI_MIN = 0.15
CLOUD_COVER = 20

DATABASE_URL = "postgresql://postgres.hpmjbgqjwopxlgurczna:LRLv7mBEkfZnsm7B@aws-1-us-west-1.pooler.supabase.com:6543/postgres"


def calidad(ndvi: float) -> str:
    if ndvi > 0.6:  return "Alta"
    if ndvi > 0.4:  return "Media-Alta"
    if ndvi > 0.2:  return "Media-Baja"
    return "Baja"


async def main():
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)

    total = 0
    kept = 0

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
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
                print(f"  {kept} insertados de {total} leidos...", end="\r")

        if batch:
            await conn.executemany(
                """INSERT INTO indices_satelitales
                   (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion)
                   VALUES ($1, $2, $3, $4, $5, $6,
                           ST_SetSRID(ST_MakePoint($7, $8), 4326))""",
                batch,
            )

    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_indices_satelitales_ubicacion "
        "ON indices_satelitales USING GIST (ubicacion)"
    )
    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_indices_satelitales_coords "
        "ON indices_satelitales (lat, lng)"
    )

    await conn.close()
    print(f"\nListo. {kept} filas insertadas de {total} leidas (Cartagena)")


if __name__ == "__main__":
    asyncio.run(main())
