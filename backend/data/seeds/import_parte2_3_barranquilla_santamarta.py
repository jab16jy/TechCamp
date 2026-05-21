"""Import PARTE 2 + 3 — Barranquilla + Santa Marta NDVI into local Docker PostGIS"""
import asyncio
import csv
import math
from pathlib import Path

import asyncpg

DATABASE_URL = "postgresql://agrocaribe:agrocaribe_secret@localhost:5432/agrocaribe"
BATCH_SIZE = 5000
CLOUD_COVER = 20

FILES = [
    ("Barranquilla", Path(r"D:\sentinel 2\nvdi\nvdi_parte2\nvdi_parte2final.csv"), 10, 0.1),
    ("Santa Marta-A", Path(r"D:\sentinel 2\nvdi\nvdi_parte3\nvdi_parte3final.csv"), 10, 0.1),
]


def calidad(ndvi: float) -> str:
    if ndvi > 0.6: return "Alta"
    if ndvi > 0.4: return "Media-Alta"
    if ndvi > 0.2: return "Media-Baja"
    return "Baja"


async def process(conn, name, path, sample_every, ndvi_min):
    if not path.exists():
        print(f"  [SALTAR] {name}: archivo no encontrado: {path}")
        return 0, 0

    total = 0
    kept = 0
    batch = []

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
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
    print(f"\n    {name}: {kept} insertados de {total} leidos")
    return total, kept


async def main():
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)

    result = await conn.fetch("SELECT COUNT(*) AS c FROM indices_satelitales")
    print(f"Registros existentes antes de importar: {result[0]['c']} (Riohacha)")

    total_all = 0
    kept_all = 0
    for name, path, sample_every, ndvi_min in FILES:
        print(f"\n--- {name} ---")
        total, kept = await process(conn, name, path, sample_every, ndvi_min)
        total_all += total
        kept_all += kept

    result = await conn.fetch("SELECT COUNT(*) AS c FROM indices_satelitales")
    print(f"\nRegistros totales despues de importacion: {result[0]['c']}")

    await conn.close()
    print(f"\n=== COMPLETADO: {kept_all} nuevas filas insertadas ===")


if __name__ == "__main__":
    asyncio.run(main())
