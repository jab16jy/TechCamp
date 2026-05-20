---
titulo: "Arquitectura de Base de Datos"
proyecto: AgroCaribe IA
tags: [base-datos, postgresql, postgis, esquema, supabase]
---

# Arquitectura de Base de Datos

## Esquema Relacional

```mermaid
erDiagram
    USUARIO ||--o{ ANALISIS : realiza
    USUARIO ||--o{ CONVERSACION : tiene
    USUARIO ||--o{ PARCELA : administra
    MUNICIPIO ||--o{ ANALISIS : referencia
    SENSOR ||--o{ LECTURA_SENSOR : genera
    CONVERSACION ||--o{ MENSAJE : contiene

    ANALISIS {
        uuid id PK
        uuid usuario_id FK
        int municipio_id FK
        varchar tipo "simple | advanced"
        jsonb datos_formulario
        jsonb resultado_completo
        float lat
        float lng
        varchar cultivo_recomendado
        int score
        timestamp created_at
    }

    MUNICIPIO {
        int id PK
        varchar nombre
        varchar departamento
        geometry geometry "MultiPolygon, SRID 4326"
    }

    INDICES_SATELITALES {
        int id PK
        float lat
        float lng
        geometry ubicacion "Point, SRID 4326"
        float ndvi
        float ndwi
        varchar calidad_suelo
        int cobertura_nube
        timestamp created_at
    }

    SENSOR {
        uuid id PK
        varchar nodo_id UK
        varchar nombre
        float lat
        float lng
        varchar estado "ok | warn | critical"
        geometry ubicacion "Point, SRID 4326"
    }

    LECTURA_SENSOR {
        uuid id PK
        uuid sensor_id FK
        float ndvi
        float humedad
        float temperatura
        timestamp created_at
    }

    PARCELA {
        uuid id PK
        uuid usuario_id FK
        varchar nombre
        float area_hectareas
        geometry poligono "Polygon, SRID 4326"
        timestamp created_at
    }

    CONVERSACION {
        uuid id PK
        uuid usuario_id FK
        timestamp created_at
    }

    MENSAJE {
        uuid id PK
        uuid conversacion_id FK
        varchar rol "usuario | ia"
        text contenido
        jsonb metadata
        timestamp created_at
    }

    USUARIO {
        uuid id PK
        varchar email UK
        varchar nombre
        varchar rol "investigador | productor"
        timestamp created_at
    }
```

## PostGIS

Extension geoespacial habilitada. Los municipios usan `MultiPolygon` para permitir consultas "que municipio contiene este punto" via `ST_Contains`.

### Indices espaciales

| Tabla | Columna | Indice |
|-------|---------|--------|
| municipios | geometry | GIST |
| indices_satelitales | ubicacion | GIST |
| sensores | ubicacion | GIST |
| parcelas | poligono | GIST |

### Consultas espaciales clave

**Detectar municipio desde coordenadas (POST /geo/decode):**
```sql
SELECT m.id, m.nombre, m.departamento
FROM municipios m
WHERE ST_Contains(m.geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
LIMIT 1;
```

**Buscar NDVI mas cercano (GET /satellite-indicators):**
```sql
SELECT ndvi, ndwi, calidad_suelo, cobertura_nube
FROM indices_satelitales
ORDER BY ubicacion <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
LIMIT 1;
```

## JSONB

Las tablas `analisis.datos_formulario` y `analisis.resultado_completo` usan JSONB para flexibilidad: cada tipo de analisis (simple/advanced) tiene campos distintos. Esto evita columnas NULL y permite extender el formulario sin migraciones.

## RLS (Row Level Security)

Actualmente todas las politicas RLS permiten SELECT sin restricciones (`USING (true)`) para que el backend pueda leer datos sin autenticacion. Esto es para desarrollo/demo. En produccion, las politicas originales deben restaurarse:

```sql
-- Originales (guardadas en supabase/migrations/)
analisis: FOR SELECT USING (usuario_id = auth.uid())
usuarios: FOR SELECT USING (id = auth.uid())
municipios: FOR SELECT USING (true)
indices_satelitales: FOR SELECT USING (true)
sensores: FOR SELECT USING (true)
lecturas_sensores: FOR SELECT USING (true)
conversaciones: FOR SELECT USING (usuario_id = auth.uid())
mensajes: via conversacion_id IN (SELECT id FROM conversaciones WHERE usuario_id = auth.uid())
```

## Conexion

| Propiedad | Valor |
|-----------|-------|
| Host | aws-1-us-west-1.pooler.supabase.com |
| Puerto | 6543 |
| Base de datos | postgres |
| Usuario | postgres.hpmjbgqjwopxlgurczna |
| SSL | Requerido (pooler transaction mode) |
| Prepared stmts | DESHABILITADOS (`prepared_statement_cache_size=0`) |

---

## Referencias

- [[2-backend/ARQUITECTURA_BACKEND]] — Modelos SQLAlchemy + ERD
- [[4-arquitectura/VISION_SISTEMA]] — Flujo de datos en el sistema
- [[4-arquitectura/FLUJO_DATOS]] — Mapeo de endpoints a tablas
- [[4-arquitectura/DESPLIEGUE]] — Conexion Docker-Supabase y pooler
- [[5-implementacion/CHAT_2025-05-19]] — Contexto de migracion a DB local

