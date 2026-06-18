# ADR-002: PostGIS desde el día 1

## Contexto

El frontend de AgroCaribe trabaja con coordenadas geográficas en cada pantalla principal: clic en mapa Leaflet para análisis, polígonos de parcelas, sensores IoT con ubicación, municipios con geometría para reverse geocoding. Las consultas espaciales son parte del core del sistema:

- "¿Qué municipio contiene este punto?" (POST /geo/decode)
- "Sensores dentro de un radio de 10 km"
- "Índice NDVI más cercano a esta coordenada"
- "Parcelas que intersectan este polígono"

Inicialmente se consideró Supabase DB (PostgreSQL estándar sin PostGIS, o con extensión limitada) para todo, pero los 500 MB de almacenamiento gratuito estaban al 93.8% solo con los índices satelitales (2.5M+ puntos NDVI). Además, Supabase no exponía PostGIS directamente para joins espaciales complejos desde el backend.

## Decisión

**PostgreSQL 16 + PostGIS 3.4 en Docker local**, reemplazando a Supabase para todos los datos. Supabase se mantiene solo para Auth.

Razones:

1. **PostGIS nativo** — `geometry`, `geography`, índices GIST, funciones como `ST_Contains`, `ST_DWithin`, `ST_Distance`, `<->` (ordenamiento por distancia). El endpoint `/geo/decode` usa `ST_Contains` sobre 30+ geometrías municipales en <10 ms.
2. **Sin límite de almacenamiento** — Docker volume local sin restricciones de 500 MB. Los 2.5M puntos NDVI y geometrías viven localmente.
3. **Latencia cero de red** — Backend y base de datos en la misma red Docker (backend_net). Sin round-trips a Supabase cloud.
4. **Seed data automatizado** — Los municipios, sensores IoT demo, parcelas de prueba se insertan via `docker-entrypoint-initdb.d` al iniciar el contenedor.
5. **Alembic para migraciones** — Control de versiones del esquema DB con migraciones locales, no dependientes de Supabase dashboard UI.

## Consecuencias

**Positivas:**
- + Consultas espaciales nativas con plan de ejecución optimizable: reverse geocoding en <10 ms, nearest-neighbor NDVI con índice GIST
- + Sin límite de almacenamiento: 2.5M+ puntos NDVI sin preocupación de cuota
- + PostGIS habilita features futuras: clustering espacial, buffers, intersecciones complejas
- + Operación local: funciona offline, sin dependencia de conectividad cloud para datos
- + Migraciones versionadas con Alembic: cambios de esquema trazables y reversibles

**Negativas:**
- - Operación de base de datos separada: requiere Docker, backup propio, monitoreo de volumen
- - Mayor consumo de recursos: PostgreSQL + PostGIS necesita ~1-2 GB RAM frente a Supabase DB manejado
- - Más responsabilidad DevOps: actualizaciones de seguridad, migraciones, backups manuales

## Referencias

- [[backend]]
- [[esquema]]
- [[07-deployment/]] (Docker Compose con db service)
