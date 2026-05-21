"""Import PARTE 1 — Riohacha NDVI CSV into local Docker PostGIS"""
import asyncio
import csv
import math
from pathlib import Path

import asyncpg

DATABASE_URL = "postgresql://agrocaribe:agrocaribe_secret@localhost:5432/agrocaribe"

CSV_PATH = Path(r"D:\sentinel 2\nvdi\nvdi_parte1\NVDI_PART1FINAL.csv")
SAMPLE_EVERY = 20
NDVI_MIN = 0.15
BATCH_SIZE = 5000
CLOUD_COVER = 20


def calidad(ndvi: float) -> str:
    if ndvi > 0.6: return "Alta"
    if ndvi > 0.4: return "Media-Alta"
    if ndvi > 0.2: return "Media-Baja"
    return "Baja"


async def main():
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)

    print("Truncando tabla indices_satelitales local...")
    await conn.execute("TRUNCATE TABLE indices_satelitales RESTART IDENTITY CASCADE")

    print(f"\n--- Riohacha (Parte 1) ---")
    if not CSV_PATH.exists():
        print(f"  [ERROR] Archivo no encontrado: {CSV_PATH}")
        await conn.close()
        return

    total = 0
    kept = 0
    batch = []

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

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
                print(f"    Riohacha: {kept} insertados...", end="\r")

        if batch:
            await conn.executemany(
                """INSERT INTO indices_satelitales
                   (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion)
                   VALUES ($1, $2, $3, $4, $5, $6,
                           ST_SetSRID(ST_MakePoint($7, $8), 4326))""",
                batch,
            )

    print(f"\n    Riohacha: {kept} insertados de {total} leidos")

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
        print(f"  VACUUM fallo: {e}")
        await conn.execute("ANALYZE indices_satelitales")

    await conn.close()
    print(f"\n=== PARTE 1 COMPLETADA: {kept} filas insertadas ===")


if __name__ == "__main__":
    asyncio.run(main())
