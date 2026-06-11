---
titulo: "Modulo Satelital — QGIS + Sentinel-2 + NDVI"
proyecto: AgroCaribe IA
tags: [sentinel-2, ndvi, qgis, satelital]
---

# Modulo Satelital

## Enfoque Implementado: Version Simple (Pre-procesada)

La documentacion recomienda la **version simple** para un proyecto academico viable:

```
Sentinel-2 → QGIS (procesamiento manual) → NDVI/NDWI por zona → Export CSV/GeoJSON
    → INSERT en indices_satelitales → Backend consulta via ST_Distance
```

## Tabla indices_satelitales

```sql
CREATE TABLE indices_satelitales (
    id SERIAL PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    ubicacion GEOMETRY(Point, 4326),
    ndvi DOUBLE PRECISION,
    ndwi DOUBLE PRECISION,
    calidad_suelo VARCHAR(50),
    cobertura_nube INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_indices_satelitales_ubicacion ON indices_satelitales USING GIST (ubicacion);
CREATE INDEX idx_indices_satelitales_coords ON indices_satelitales (lat, lng);
```

## Busqueda del indice mas cercano

```python
async def get_satellite_data(db: AsyncSession, lat: float, lng: float) -> SatelliteData:
    point_wkt = f"POINT({lng} {lat})"
    query = select(IndiceSatelital).order_by(
        func.ST_Distance(
            IndiceSatelital.ubicacion,
            func.ST_GeomFromText(point_wkt, 4326),
        )
    ).limit(1)
    result = await db.execute(query)
    nearest = result.scalars().first()
    return SatelliteData(ndvi=nearest.ndvi, ndwi=nearest.ndwi, ...)
```

## Que es el NDVI

```
NDVI = (B08 - B04) / (B08 + B04)

B08 = Infrarrojo cercano (Sentinel-2)
B04 = Rojo (Sentinel-2)

Rangos:
  0.7-1.0: Vegetacion muy densa (optimo)
  0.5-0.7: Vegetacion saludable
  0.3-0.5: Vegetacion moderada
  0.2-0.3: Vegetacion estresada
  < 0.2:  Suelo desnudo / agua
```

## Procesamiento real: QGIS + Sentinel-2

Los datos actuales provienen de imagenes **Sentinel-2 L2A procesadas en QGIS** para 7 regiones del Caribe.

Pipeline:
```
Sentinel-2 L2A (Copernicus Browser)
  → Descargar B04 + B08 (< 20% nubes)
  → QGIS Raster Calc: NDVI = (B08 - B04) / (B08 + B04)
  → Create Grid (puntos cada 500m)
  → Sample Raster Values
  → Exportar CSV por region (7 partes)
  → import_ndvi_local.py → INSERT masivo en PostGIS
```

## Script de importacion

`backend/data/seeds/import_ndvi_local.py` procesa los 7 CSVs:

| Region | Config (sample_every, ndvi_min) |
|--------|:-------------------------------:|
| Riohacha | cada 20 filas, NDVI > 0.15 |
| Barranquilla | cada 10 filas, NDVI > 0.10 |
| Santa Marta | cada 10 filas, NDVI > 0.10 |
| Cartagena | cada 10 filas, NDVI > 0.10 |
| Sincelejo | cada 10 filas, NDVI > 0.10 |
| Monteria | cada 10 filas, NDVI > 0.10 |

## Datos actuales en DB

Actualmente hay **2,517,987 puntos NDVI reales** de Sentinel-2, importados desde CSVs de QGIS (7 regiones).

| Region | Puntos NDVI | CSV original |
|--------|:----------:|:------------:|
| Riohacha | 162,696 | 678 MB |
| Barranquilla | 670,717 | ~750 MB |
| Santa Marta-A | 127,690 | ~750 MB |
| Cartagena | 581,900 | ~750 MB |
| Santa Marta-B | 81,499 | ~750 MB |
| Sincelejo | 383,583 | ~750 MB |
| Monteria | 509,902 | ~750 MB |
| **Total** | **2,517,987** | **~5.2 GB** |

Tamano real en BD: **587 MB** con indices GIST y btree.

## Version Avanzada (Futuro)

Backend descarga Sentinel-2 via Copernicus Data Space API, calcula NDVI automaticamente y lo cachea en `indices_satelitales`. Requiere `rasterio` + `sentinelhub` + API key.

---

## Referencias

- [[03-architecture/guia-qgis]] — Guia paso a paso para procesar imagenes Sentinel-2
- [[03-architecture/vision-sistema]] — Vision general del sistema
- [[05-database/arquitectura-db]] — Tabla indices_satelitales y PostGIS
- [[06-api/backend-architecture]] — Endpoint GET /satellite-indicators
