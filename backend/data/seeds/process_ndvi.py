"""Process QGIS NDVI CSV -> INSERT SQL for Supabase indices_satelitales"""
import csv, math
from pathlib import Path

CSV_PATH = Path(r"D:\sentinel 2\nvdi\NVDI_PART1FINAL.csv")
OUTPUT_SQL = Path(__file__).parent / "ndvi_real.sql"
SAMPLE_EVERY = 10
NDVI_MIN = 0.1
CLOUD_COVER = 20
BATCH_SIZE = 500


def calidad(ndvi: float) -> str:
    if ndvi > 0.6:  return "Alta"
    if ndvi > 0.4:  return "Media-Alta"
    if ndvi > 0.2:  return "Media-Baja"
    return "Baja"


total = 0
kept = 0

with open(CSV_PATH, newline="", encoding="utf-8") as f, \
     open(OUTPUT_SQL, "w", encoding="utf-8") as out:

    reader = csv.DictReader(f)
    out.write("DELETE FROM indices_satelitales;\n\n")
    out.write("INSERT INTO indices_satelitales (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion) VALUES\n")

    batch = []

    for i, row in enumerate(reader):
        total += 1
        if i % SAMPLE_EVERY != 0:
            continue

        ndvi = float(row["SAMPLE_1"]) if row["SAMPLE_1"] else 0
        if math.isnan(ndvi) or ndvi < NDVI_MIN:
            continue

        lat = float(row["Y"])
        lng = float(row["X"])
        ndwi_val = round(max(0, ndvi * 0.35), 4)
        cq = calidad(ndvi)
        ndvi_rounded = round(ndvi, 4)

        batch.append(
            f"({lat}, {lng}, {ndvi_rounded}, {ndwi_val}, '{cq}', {CLOUD_COVER},"
            f" ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326))"
        )
        kept += 1

        if len(batch) >= BATCH_SIZE:
            out.write(",\n".join(batch) + ";\n\n")
            batch = []

    if batch:
        out.write(",\n".join(batch) + ";\n\n")

    out.write("CREATE INDEX IF NOT EXISTS idx_indices_satelitales_ubicacion ON indices_satelitales USING GIST (ubicacion);\n")
    out.write("CREATE INDEX IF NOT EXISTS idx_indices_satelitales_coords ON indices_satelitales (lat, lng);\n")

print(f"Total filas leidas: {total}")
print(f"Filas insertadas: {kept}")
print(f"SQL guardado en: {OUTPUT_SQL}")
print(f"Tamanio: {OUTPUT_SQL.stat().st_size / 1e6:.1f} MB")
