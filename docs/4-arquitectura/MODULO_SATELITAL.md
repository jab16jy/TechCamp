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

## Guia QGIS para procesar Sentinel-2

### Paso 1: Descargar imagenes
1. Ir a [Copernicus Browser](https://browser.dataspace.copernicus.eu/)
2. Seleccionar Sentinel-2 L2A (reflectancia de superficie)
3. Dibujar area de interes en el Caribe colombiano
4. Filtrar por cobertura de nubes < 20%
5. Descargar bandas B04 y B08

### Paso 2: Calcular NDVI en QGIS
```
Raster Calculator:
("B08" - "B04") / ("B08" + "B04" + 0.0001)
```

### Paso 3: Generar puntos
1. `Processing → Create Grid` (puntos cada 500m)
2. `Sample Raster Values` sobre el NDVI
3. Exportar tabla resultante

### Paso 4: Exportar a CSV
```csv
lat,lng,ndvi,ndwi,calidad_suelo,cobertura_nube
10.9685,-74.7813,0.62,0.18,Media-Alta,8
```

### Paso 5: Insertar en Supabase
```sql
INSERT INTO indices_satelitales (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion)
VALUES (10.9685, -74.7813, 0.62, 0.18, 'Media-Alta', 8,
  ST_SetSRID(ST_MakePoint(-74.7813, 10.9685), 4326));
```

## Version Avanzada (Futuro)

Backend descarga Sentinel-2 via Copernicus Data Space API, calcula NDVI automaticamente y lo cachea en `indices_satelitales`. Requiere `rasterio` + `sentinelhub` + API key.

## Datos actuales en DB

Actualmente hay **18 puntos** de NDVI insertados manualmente con valores plausibles para la region Caribe. No son datos reales de Sentinel-2, sino valores ajustados a cada zona:

| Zona | NDVI tipico | Caracteristica |
|------|-------------|----------------|
| Santa Marta | 0.71 | Alta vegetacion (Sierra Nevada) |
| Monteria | 0.68 | Valle del Sinu, alta produccion |
| Barranquilla | 0.42 | Urbano/secano |
| Valledupar | 0.55 | Valle semiarido |
| Sincelejo | 0.50 | Sabana |
| Riohacha | 0.28 | Arido (La Guajira) |
| Cartagena | 0.35 | Costero/urbano |

---

## Referencias

- [[4-arquitectura/GUIAS_QGIS]] — Guia paso a paso para procesar imagenes Sentinel-2
- [[4-arquitectura/VISION_SISTEMA]] — Vision general del sistema
- [[4-arquitectura/ARQUITECTURA_DB]] — Tabla indices_satelitales y PostGIS
- [[2-backend/ARQUITECTURA_BACKEND]] — Endpoint GET /satellite-indicators
