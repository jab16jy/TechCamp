---
titulo: "Guia QGIS — Procesamiento de imagenes Sentinel-2"
proyecto: AgroCaribe IA
tags: [qgis, sentinel-2, ndvi, procesamiento, guia]
---

# Guia QGIS para Procesamiento de Imagenes Sentinel-2

## Por que QGIS?

QGIS es la herramienta recomendada para pre-procesar imagenes satelitales porque:
- Es **gratuito y open source**
- Permite **calcular y validar indices** como NDVI, NDWI
- Exporta capas en formatos **GeoJSON, SHP y GeoPackage**
- Prepara cartografia para informes academicos
- Es la herramienta estandar en trabajos de grado con componente SIG

## Flujo de trabajo

```
1. Copernicus Browser   →  Descargar Sentinel-2 L2A
2. QGIS                  →  Cargar bandas B04 y B08
3. QGIS Raster Calc     →  NDVI = (B08 - B04) / (B08 + B04)
4. QGIS Processing      →  Crear grilla de puntos + muestrear NDVI
5. Export CSV           →  lat, lng, ndvi, ndwi, calidad_suelo
6. SQL INSERT           →  indices_satelitales + PostGIS geometry
7. Backend              →  Consulta el punto mas cercano con ST_Distance
```

## Paso 1: Descargar imagenes Sentinel-2

1. Abrir [Copernicus Data Space Browser](https://browser.dataspace.copernicus.eu/)
2. Crear cuenta gratuita (si no tienes)
3. Seleccionar **Sentinel-2 L2A** (reflectancia de superficie corregida atmosfericamente)
4. Dibujar area de interes en el mapa del Caribe colombiano
5. En filtros:
   - Fecha: Ultimos 30 dias con baja nubosidad
   - Cobertura de nubes: **< 20%**
   - Ordenar por cobertura de nubes ascendente
6. Seleccionar la mejor escena y hacer clic en **Download**
7. Descargar como **Sen2Cor** o **JPEG2000** (las bandas vienen en archivos separados)

## Paso 2: Abrir en QGIS

1. Abrir QGIS
2. Arrastrar la carpeta descargada al panel de capas
3. QGIS detectara automaticamente las bandas. Buscar:
   - **B04.tif** — Banda Roja
   - **B08.tif** — Banda Infrarrojo Cercano

## Paso 3: Calcular NDVI

1. Menu: `Raster → Calculadora Raster`
2. Ingresar formula:
   ```
   ("B08@1" - "B04@1") / ("B08@1" + "B04@1" + 0.0001)
   ```
   (El 0.0001 evita division por cero)
3. Guardar como `ndvi_output.tif`
4. Opcional: calcular NDWI para contenido de agua:
   ```
   ("B03@1" - "B08@1") / ("B03@1" + "B08@1" + 0.0001)
   ```

## Paso 4: Generar puntos de muestra

1. Menu: `Processing → Toolbox`
2. Buscar `Create Grid`
3. Configurar:
   - Tipo de cuadricula: **Punto**
   - Extension: Igual al raster NDVI
   - Espaciado: **0.01 grados** (~1km)
4. Ejecutar → se crea una capa de puntos
5. Menu: `Processing → Sample Raster Values`
   - Capa de puntos: la grilla creada
   - Raster a muestrear: `ndvi_output.tif`
6. Ejecutar → cada punto tendra el valor NDVI

## Paso 5: Exportar a CSV

1. Clic derecho en la capa de puntos muestreados
2. `Export → Save Features As...`
3. Formato: **Comma Separated Value (CSV)**
4. Incluir: `lat`, `lng`, `ndvi`, opcionalmente `ndwi`
5. CRS: **WGS 84 (EPSG:4326)**
6. Guardar

## Paso 6: Insertar en Supabase

```sql
-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS indices_satelitales (
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

-- Insertar desde CSV (via pgAdmin, DBeaver o Supabase SQL Editor)
INSERT INTO indices_satelitales (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion)
VALUES
  (10.9685, -74.7813, 0.62, 0.18, 'Media-Alta', 8,
   ST_SetSRID(ST_MakePoint(-74.7813, 10.9685), 4326));

-- Crear indices espaciales
CREATE INDEX IF NOT EXISTS idx_indices_satelitales_ubicacion
  ON indices_satelitales USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_indices_satelitales_coords
  ON indices_satelitales (lat, lng);
```

## Paso 7: Verificar que el backend lo usa

El backend automaticamente usara los datos insertados. La consulta es:

```python
# satellite_service.py
point_wkt = f"POINT({lng} {lat})"
query = select(IndiceSatelital).order_by(
    func.ST_Distance(
        IndiceSatelital.ubicacion,
        func.ST_GeomFromText(point_wkt, 4326),
    )
).limit(1)
```

Si hay datos en la tabla, el backend los usara. Si no, retorna valores mock.

## Resumen de productos que salen de QGIS

| Producto | Formato | Uso |
|----------|---------|-----|
| Capa de municipios | GeoJSON | Visualizacion en mapa |
| Mapa de vegetacion | Raster / PNG | Informes academicos |
| Mapa de cobertura | Shapefile | Analisis SIG |
| Puntos NDVI muestreados | CSV | Poblar indices_satelitales |
| Evidencia cartografica | Imagen | Documento de tesis |

---

## Referencias

- [[03-architecture/modulo-satelital]] — Detalle del almacenamiento y consulta de NDVI
- [[05-database/arquitectura-db]] — Tabla indices_satelitales y PostGIS
- [[07-deployment/despliegue]] — Como desplegar el sistema con Docker
