---
title: "Runbook de Operaciones — AgroCaribe AI"
proyecto: AgroCaribe IA
tags: [operaciones, runbook, docker, postgis, ollama, nginx, monitoreo]
---

# Runbook de Operaciones

Sistema desplegado con Docker Compose en 4 contenedores. Referencias:
[[docker]] para arquitectura de contenedores y
[[esquema]] para esquema de base de datos.

---

## 1. Health Checks

### 1.1 Endpoint `/health` del Backend

```bash
# Desde el host
curl -f http://localhost:8000/health

# Desde el contenedor nginx (si se llega por proxy)
curl -f http://localhost/health

# Respuesta esperada (200 OK):
# {"status": "ok", "database": "connected", "ollama": "connected"}
```

El backend incluye un HEALTHCHECK nativo en el Dockerfile que ejecuta este
mismo endpoint cada 30s. Docker reinicia el contenedor si falla 3 veces
consecutivas.

### 1.2 Estado de Contenedores

```bash
# Estado resumido
docker compose ps

# Salida esperada:
# NAME                IMAGE                      STATUS
# agrocaribe-db       postgis/postgis:16-3.4     Up (healthy)
# agrocaribe-ollama   ollama/ollama:latest       Up
# agrocaribe-backend  techcamp-backend           Up (healthy)
# agrocaribe-nginx    nginx:alpine               Up

# Métricas detalladas (CPU, memoria)
docker stats --no-stream
```

Un contenedor debe mostrar `Up (healthy)` si su healthcheck pasó.
Si aparece `(unhealthy)`, revisar los logs del servicio correspondiente.

### 1.3 PostGIS — Consultas Espaciales

```bash
# Verificar extensión PostGIS instalada y activa
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT PostGIS_Full_Version();
"

# Probar consulta espacial básica
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT ST_AsText(ST_MakePoint(-58.5, -34.5));
"

# Respuesta esperada:
#          st_astext
# ---------------------------
#  POINT(-58.5 -34.5)
```

Si `PostGIS_Full_Version()` falla, la extensión no está instalada:

```bash
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
"
```

---

## 2. Logs

### 2.1 Backend (FastAPI)

```bash
# Tiempo real
docker compose logs -f backend

# Últimas 100 líneas
docker compose logs --tail=100 backend

# Filtrar por nivel
docker compose logs backend 2>&1 | grep -i "ERROR"
docker compose logs backend 2>&1 | grep -i "WARNING"

# Desde una fecha/hora
docker compose logs --since="2026-06-10T10:00:00" backend
```

El nivel de log se configura con `LOG_LEVEL` en `docker-compose.yml`
(default: `INFO`). Para debugging temporal:

```bash
LOG_LEVEL=DEBUG docker compose up -d backend
```

### 2.2 Base de Datos (PostGIS)

```bash
docker compose logs -f db
docker compose logs --tail=50 db

# Conexiones rechazadas, errores de autenticación
docker compose logs db 2>&1 | grep -i "FATAL"

# Queries lentas (requiere log_min_duration_statement activado)
docker compose logs db 2>&1 | grep "duration:"
```

### 2.3 Ollama

```bash
docker compose logs -f ollama

# Verificar descarga de modelo
docker compose logs ollama 2>&1 | grep -i "pull"
# Si no aparece "success", el modelo no se descargó correctamente
```

La primera vez que arranca, Ollama descarga `gemma2:2b` (~1.6 GB).
Esto puede tomar varios minutos. El log mostrará el progreso.

### 2.4 Nginx

Nginx escribe a stdout/stderr dentro del contenedor:

```bash
# Logs completos de nginx (access + error combinados)
docker compose logs -f nginx

# Solo errores
docker compose logs nginx 2>&1 | grep -i "error"

# Ver configuración activa
docker compose exec nginx nginx -T
```

Para más detalle, se puede inspeccionar el archivo de configuración en
[[docker#nginx---reverse-proxy]].

---

## 3. Backup y Restauración de BD

### 3.1 Backup

```bash
# Backup completo (formato SQL plano)
docker compose exec db pg_dump -U agrocaribe -d agrocaribe \
    --no-owner --no-acl \
    > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
docker compose exec db pg_dump -U agrocaribe -d agrocaribe \
    --no-owner --no-acl \
    | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup solo esquema (sin datos)
docker compose exec db pg_dump -U agrocaribe -d agrocaribe \
    --schema-only --no-owner --no-acl \
    > esquema_$(date +%Y%m%d).sql

# Backup solo datos de tablas específicas
docker compose exec db pg_dump -U agrocaribe -d agrocaribe \
    --data-only --table=municipio --table=analisis \
    > datos_municipios_analisis.sql
```

**⏰ Frecuencia recomendada:** backup diario vía cron. Retención: 7 días
locales, 30 días en almacenamiento externo.

### 3.2 Restauración

```bash
# Restaurar desde backup plano
cat backup_20260610_120000.sql | docker compose exec -T db psql -U agrocaribe -d agrocaribe

# Restaurar desde backup comprimido
zcat backup_20260610_120000.sql.gz | docker compose exec -T db psql -U agrocaribe -d agrocaribe

# Desde un archivo dentro del contenedor
docker compose cp backup.sql agrocaribe-db:/tmp/
docker compose exec db psql -U agrocaribe -d agrocaribe -f /tmp/backup.sql
```

**⚠️ La restauración reemplaza los datos existentes.**
Si la BD actual tiene datos que no deben perderse, haz un backup previo.

### 3.3 Backup Automatizado (cron)

Agregar al crontab del servidor (`crontab -e`):

```cron
# Backup diario a las 3am, mantener últimos 7
0 3 * * * cd /ruta/del/proyecto && \
  docker compose exec -T db pg_dump -U agrocaribe -d agrocaribe \
    --no-owner --no-acl | gzip > backups/diario/agrocaribe_$(date +\%Y\%m\%d).sql.gz && \
  find backups/diario -name "*.sql.gz" -mtime +7 -delete
```

---

## 4. Reinicio de Servicios

### 4.1 Reinicio Individual

```bash
# Solo backend (sin pérdida de datos)
docker compose restart backend

# Solo base de datos
docker compose restart db

# Solo ollama
docker compose restart ollama

# Solo nginx
docker compose restart nginx
```

Todos los servicios tienen `restart: unless-stopped` en el compose.
Si un servicio crasha, Docker lo reinicia automáticamente.

### 4.2 Reinicio Completo (sin pérdida de datos)

```bash
docker compose down
docker compose up -d
```

Los volúmenes `pgdata`, `ollama_data` y `ml-data` persisten.

### 4.3 Reset Total (⚠️ PÉRDIDA DE DATOS)

```bash
# DETIENE y ELIMINA volúmenes — todos los datos se pierden
docker compose down -v

# Reconstruir desde cero
docker compose build --no-cache backend
docker compose up -d
```

Esto es útil para:

- Entornos de desarrollo/testing donde se quiere empezar limpio
- Recuperación de una BD corrupta sin backup (último recurso)
- Pruebas de integración desde estado inicial

**NUNCA ejecutar `docker compose down -v` en producción sin antes**
**verificar que existe un backup válido y reciente.**

### 4.4 Reconstruir Backend (código nuevo)

```bash
# Cuando cambia el código del backend
docker compose build backend
docker compose up -d backend
```

Nota: en desarrollo con `--reload`, el backend se reinicia solo al
detectar cambios. No es necesario reconstruir.

---

## 5. Monitoreo

### 5.1 Tamaño de la Base de Datos

```bash
# Tamaño total de la BD
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT
    pg_database_size('agrocaribe') AS bytes,
    pg_size_pretty(pg_database_size('agrocaribe')) AS humano;
"

# Tamaño por tabla (incluye índices)
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT
    relname AS tabla,
    pg_size_pretty(pg_total_relation_size(relid)) AS total,
    pg_size_pretty(pg_relation_size(relid)) AS datos,
    pg_size_pretty(pg_indexes_size(relid)) AS indices
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
"

# Tamaño por índice
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT
    indexrelname AS indice,
    pg_size_pretty(pg_relation_size(indexrelid)) AS tamanio,
    relname AS tabla
FROM pg_catalog.pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
"
```

### 5.2 Estado de Índices GIST (geoespaciales)

```bash
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexdef LIKE '%GIST%';
"

# Estadísticas de uso de índices
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS lecturas,
    idx_tup_read AS tuplas_leidas,
    idx_tup_fetch AS tuplas_recuperadas
FROM pg_stat_user_indexes
WHERE indexdef LIKE '%GIST%'
ORDER BY idx_scan DESC;
"

# Reindexar índices GIST (si lecturas bajas o rendimiento degradado)
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
REINDEX INDEX CONCURRENTLY idx_parcela_geom;
-- Reemplazar idx_parcela_geom por el nombre real del índice GIST
"
```

### 5.3 Conexiones Activas

```bash
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT
    pid,
    usename AS usuario,
    application_name AS app,
    client_addr AS ip,
    state AS estado,
    query_start AS inicio,
    NOW() - query_start AS duracion,
    LEFT(query, 100) AS query_truncada
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start DESC;
"

# Conexiones por estado
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT state, COUNT(*) AS total
FROM pg_stat_activity
GROUP BY state;
"

# Matar una conexión específica (reemplazar PID)
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT pg_terminate_backend(PID);
"
```

### 5.4 Uso de Recursos del Sistema

```bash
# Uso de CPU/memoria por contenedor
docker stats --no-stream agrocaribe-backend agrocaribe-db agrocaribe-ollama

# Espacio en disco ocupado por volúmenes Docker
docker system df -v | grep -E "pgdata|ollama_data|ml-data"

# Espacio en disco del servidor
df -h

# Memoria RAM
free -h
```

Ollama está limitado a 4 GB de RAM en `docker-compose.yml`.
Si el servidor tiene menos de 8 GB de RAM, puede haber swapping.

---

## 6. Comandos Útiles

### 6.1 Migraciones Alembic

```bash
# Ejecutar migraciones pendientes
docker compose exec backend alembic upgrade head

# Revertir última migración
docker compose exec backend alembic downgrade -1

# Ver historial de migraciones
docker compose exec backend alembic history

# Ver migración actual
docker compose exec backend alembic current

# Crear nueva migración (autogenerate)
docker compose exec backend alembic revision --autogenerate -m "descripcion"
```

Las migraciones de Alembic se guardan en `backend/alembic/versions/`.
Referencia: [[esquema]] para el esquema completo.

### 6.2 PostGIS

```bash
# Versión de PostGIS
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT PostGIS_Lib_Version();
"

# Versión de PostgreSQL
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT version();
"

# Reindexar TODOS los índices de la BD (puede tomar varios minutos)
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
REINDEX DATABASE agrocaribe;
"

# Vacuum + Analyze (mantenimiento regular)
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
VACUUM ANALYZE;
"

# Vacuum full (reescribe tablas, requiere lock exclusivo — solo en ventana de mantenimiento)
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
VACUUM FULL;
"
```

### 6.3 Limpiar Volúmenes Docker

```bash
# Ver volúmenes en uso
docker volume ls

# Eliminar volúmenes huérfanos (no usados por ningún contenedor)
docker volume prune

# Eliminar TODOS los volúmenes del proyecto (⚠️ pérdida de datos)
docker compose down -v

# Limpiar cache de build de Docker
docker builder prune
```

### 6.4 Shell Interactivo en Contenedores

```bash
# Backend (Python)
docker compose exec backend python

# Base de datos (psql)
docker compose exec db psql -U agrocaribe -d agrocaribe

# Ollama
docker compose exec ollama ollama list

# Nginx (verificar configuración)
docker compose exec nginx nginx -T

# Shell bash genérica
docker compose exec backend bash
docker compose exec db bash
```

### 6.5 Verificar Variables de Entorno

```bash
# Backend
docker compose exec backend env | grep -E "DATABASE_URL|OLLAMA|SUPABASE|LOG_LEVEL"

# Ver configuración activa del backend
docker compose exec backend python -c "
from app.core.config import settings
print(settings.model_dump_json(indent=2))
"
```

---

## 7. Procedimientos de Incidentes

### 7.1 Base de Datos Corrupta

**Síntomas:** El backend loggea errores de conexión, queries fallan con
mensajes de "relation does not exist" o errores de índice corrupto.

**Diagnóstico:**

```bash
# Ver logs de la BD
docker compose logs --tail=50 db

# Verificar integridad de la BD
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT datname, datconnlimit, datistemplate
FROM pg_database;
"

# Verificar extensiones
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT * FROM pg_extension;
"
```

**Procedimiento:**

1. Detener el backend para evitar escrituras adicionales:
   ```bash
   docker compose stop backend
   ```

2. Tomar un backup de emergencia (aunque esté corrupto):
   ```bash
   docker compose exec db pg_dump -U agrocaribe -d agrocaribe \
       --no-owner --no-acl \
       > backup_emergencia_$(date +%Y%m%d_%H%M%S).sql \
       2>&1 | tee backup_error.log
   ```

3. Si el backup se generó correctamente, restaurar:
   ```bash
   # Opción A: Restaurar sobre la BD existente
   docker compose exec db psql -U agrocaribe -d agrocaribe < backup.sql

   # Opción B: Reset total + restaurar (más limpio)
   docker compose down -v
   docker compose up -d db
   # Esperar a que db esté healthy
   cat backup.sql | docker compose exec -T db psql -U agrocaribe
   docker compose up -d
   ```

4. **Si no hay backup válido**, ver [[esquema]] para
   recrear el esquema desde las migraciones Alembic y los seeds.

### 7.2 Backend No Arranca

**Síntomas:** El contenedor del backend está en `restarting` o
`unhealthy`. `curl localhost:8000/health` no responde.

**Diagnóstico:**

```bash
# Logs del backend
docker compose logs --tail=100 backend

# Verificar si la BD está accesible
docker compose exec backend python -c "
import urllib.request
try:
    r = urllib.request.urlopen('http://db:5432')
    print('BD responde')
except Exception as e:
    print(f'Error: {e}')
"

# Verificar requirements.txt
docker compose exec backend pip list --format=columns
```

**Causas comunes:**

| Causa | Síntoma en logs | Solución |
|-------|----------------|----------|
| Dependencia faltante | `ModuleNotFoundError: No module named 'xxx'` | Verificar `requirements.txt` vs `pip list` |
| BD no accesible | `Can't connect to PostgreSQL` | Verificar `DATABASE_URL` y estado de `db` |
| Puerto ocupado | `Address already in use` | Ver sección 7.4 |
| Error de sintaxis | `SyntaxError` o `ImportError` | Revisar código recién modificado |

**Procedimiento:**

1. Verificar `requirements.txt` contra lo instalado:
   ```bash
   docker compose exec backend pip list --format=freeze | sort > /tmp/instalado.txt
   sort requirements.txt | diff - /tmp/instalado.txt
   ```

   Si faltan dependencias, reconstruir la imagen:
   ```bash
   docker compose build --no-cache backend
   docker compose up -d backend
   ```

2. Verificar que `DATABASE_URL` sea correcta:
   ```bash
   docker compose exec backend env | grep DATABASE_URL
   # Debe ser: postgresql+asyncpg://agrocaribe:agrocaribe_secret@db:5432/agrocaribe
   ```

3. Verificar que la BD esté corriendo:
   ```bash
   docker compose ps db
   # Debe mostrar: Up (healthy)
   ```

### 7.3 Ollama Sin Modelo

**Síntomas:** El backend loggea `HTTP 404` o `connection refused` a
Ollama. Las consultas de chat devuelven error.

**Diagnóstico:**

```bash
# Verificar si ollama está corriendo
docker compose ps ollama

# Ver logs de ollama
docker compose logs --tail=50 ollama

# Listar modelos disponibles
docker compose exec ollama ollama list
# Si está vacío, no hay modelos descargados
```

**Procedimiento:**

```bash
# Descargar el modelo (gemma2:2b es el default)
docker compose exec ollama ollama pull gemma2:2b

# Verificar que se descargó correctamente
docker compose exec ollama ollama list
# Debe mostrar: gemma2:2b

# Probar inferencia directa
docker compose exec ollama ollama run gemma2:2b \
    "¿Cuál es el mejor cultivo para suelo arenoso en clima tropical?"

# Verificar variable de entorno en backend
docker compose exec backend env | grep OLLAMA_MODEL
# Debe ser: OLLAMA_MODEL=gemma2:2b
```

Si el entrypoint automático falló (por timeout o falta de espacio):

```bash
# Verificar espacio en disco
df -h /var/lib/docker/volumes/agrocaribe_ollama_data

# El modelo gemma2:2b requiere ~1.6 GB libres
```

### 7.4 Puerto en Uso

**Síntomas:** `docker compose up -d` falla con
`port is already allocated` o `address already in use`.

**Diagnóstico:**

```bash
# Verificar qué ocupa los puertos del sistema
# Puerto 5432 (PostgreSQL local)
sudo lsof -i :5432

# Puerto 8000 (Backend)
sudo lsof -i :8000

# Puerto 11434 (Ollama)
sudo lsof -i :11434

# Puerto 80 (Nginx)
sudo lsof -i :80
```

**Procedimiento:**

```bash
# Si lo ocupa otro proceso de Docker:
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "5432|8000|11434|80"

# Si lo ocupa un proceso del sistema (ej: postgres nativo):
# Opción A: Detener el proceso del sistema
sudo systemctl stop postgresql  # Ejemplo si PostgreSQL nativo ocupa 5432

# Opción B: Cambiar puertos en docker-compose.yml
# Editar la línea ports: - "5433:5432" para mapear a puerto alternativo

# Liberar puerto matando el proceso
sudo kill -9 $(sudo lsof -ti :5432)
```

**Puertos del proyecto:**

| Puerto | Servicio | Propósito |
|--------|----------|-----------|
| 5432 | db | PostgreSQL / PostGIS |
| 11434 | ollama | API de Ollama |
| 8000 | backend | FastAPI (desarrollo directo) |
| 80 | nginx | Reverse proxy (producción) |

### 7.5 Backend Lento o Timeouts

**Síntomas:** Las requests tardan más de lo normal, el frontend muestra
errores 504 Gateway Timeout.

**Diagnóstico:**

```bash
# Logs del backend con timeouts
docker compose logs backend 2>&1 | grep -i "timeout"

# Conexiones activas en la BD
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
"

# Queries lentas en ejecución
docker compose exec db psql -U agrocaribe -d agrocaribe -c "
SELECT pid, NOW() - query_start AS duracion, LEFT(query, 150) AS query
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;
"
```

**Procedimiento:**

1. Verificar si hay queries bloqueadas:
   ```bash
   docker compose exec db psql -U agrocaribe -d agrocaribe -c "
   SELECT blocked_locks.pid AS pid_bloqueado,
          blocked_activity.query AS query_bloqueada,
          blocking_locks.pid AS pid_bloqueante,
          blocking_activity.query AS query_bloqueante
   FROM pg_locks blocked_locks
   JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.database = blocked_locks.database
        AND blocking_locks.relation = blocked_locks.relation
        AND blocking_locks.page = blocked_locks.page
   JOIN pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;
   "
   ```

2. Matar queries bloqueantes si es necesario (reemplazar PID):
   ```bash
   docker compose exec db psql -U agrocaribe -d agrocaribe -c "
   SELECT pg_terminate_backend(PID);
   "
   ```

3. Verificar memory leak en el backend:
   ```bash
   docker stats agrocaribe-backend --no-stream
   ```

4. Si es recurrente: considerar índices faltantes, revisar
   [[esquema]] para optimizar consultas.

### 7.6 Disco Lleno

**Síntomas:** Docker falla con `no space left on device`,
PostgreSQL no escribe, descargas de Ollama fallan.

**Diagnóstico:**

```bash
df -h
docker system df
du -sh /var/lib/docker/volumes/
```

**Procedimiento:**

```bash
# Limpiar contenedores/imágenes no usados
docker system prune -a

# Limpiar cache de build de Docker
docker builder prune

# Verificar qué volumen pesa más
docker run --rm -v pgdata:/data alpine du -sh /data
docker run --rm -v ollama_data:/data alpine du -sh /data
docker run --rm -v ml-data:/data alpine du -sh /data

# Rotar logs de Docker (evitar que /var/lib/docker/containers crezca)
# Configurar en /etc/docker/daemon.json:
# {
#   "log-driver": "json-file",
#   "log-opts": {
#     "max-size": "10m",
#     "max-file": "3"
#   }
# }
```

---

## Referencias

| Documento | Descripción |
|-----------|-------------|
| [[docker]] | Arquitectura Docker, compose, healthchecks, troubleshooting |
| [[esquema]] | Esquema relacional, migraciones, índices geoespaciales |
| `docker-compose.yml` | Configuración de servicios, volúmenes, redes |
| `nginx.conf` | Reglas de proxy reverso, cache, timeouts |
| `backend/Dockerfile` | Construcción de imagen del backend |
| `backend/alembic.ini` | Configuración de migraciones Alembic |
