---
title: "Despliegue Docker — Backend + Base de Datos + ML"
proyecto: AgroCaribe IA
tags: [despliegue, docker, docker-compose, postgis, ollama, nginx]
---

# Despliegue Docker

## Arquitectura de Contenedores

```
┌─────────────────────────────────────────────────────────────────┐
│                        backend_net (bridge)                      │
│                                                                  │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │    nginx (alpine)     │     │   backend (FastAPI Python)   │  │
│  │    :80 → frontend     │◄────│   :8000 uvicorn              │  │
│  │    → proxy API /      │     │   ────────────────────────── │  │
│  │    → proxy /model/    │     │   app/main.py                │  │
│  │                      │     │   Chat RAG + ML               │  │
│  └──────────────────────┘     └──────────┬───────────────────┘  │
│                                          │                      │
│  ┌──────────────────────┐               │                      │
│  │  postgis/postgis:16  │◄──────────────┘                      │
│  │  PostgreSQL + PostGIS │     asyncpg                          │
│  │  :5432                │                                      │
│  │  Base de datos        │     ┌────────────────────────────┐  │
│  │  geoespacial          │     │  ollama/ollama:latest       │  │
│  └──────────────────────┘     │  gemma2:2b (LLM local)      │  │
│                               │  :11434                     │  │
│                               │  Entrypoint: descarga auto  │  │
│                               └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Servicios

| Servicio | Imagen | Puerto | Rol |
|----------|--------|--------|-----|
| **db** | `postgis/postgis:16-3.4` | 5432 | PostgreSQL + PostGIS — datos geoespaciales |
| **ollama** | `ollama/ollama:latest` | 11434 | LLM local (gemma2:2b) para RAG |
| **backend** | build local `./backend` | 8000 | FastAPI — API REST + ML |
| **nginx** | `nginx:alpine` | 80 | Reverse proxy + frontend estático |

---

## `docker-compose.yml` explicado

### Servicio `db` — PostGIS

```yaml
db:
  image: postgis/postgis:16-3.4
  container_name: agrocaribe-db
  environment:
    POSTGRES_USER: agrocaribe
    POSTGRES_PASSWORD: agrocaribe_secret
    POSTGRES_DB: agrocaribe
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./backend/data/seeds:/docker-entrypoint-initdb.d:ro
  networks:
    - backend_net
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U agrocaribe -d agrocaribe"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
```

- **Imagen oficial** `postgis/postgis` con PostgreSQL 16 + PostGIS 3.4
- **Volumen persistente** `pgdata` — los datos sobreviven a reinicios
- **Seeds iniciales** — archivos SQL en `./backend/data/seeds/` se ejecutan al crear la BD
- **Healthcheck** con `pg_isready` — el backend espera a que esté listo
- **Red** `backend_net` — aislado de la red del host

### Servicio `ollama` — LLM Local

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: agrocaribe-ollama
  ports:
    - "11434:11434"
  volumes:
    - ollama_data:/root/.ollama
    - ./backend/docker/ollama-entrypoint.sh:/entrypoint.sh:ro
  networks:
    - backend_net
  restart: unless-stopped
  environment:
    OLLAMA_KEEP_ALIVE: 24h
    OLLAMA_HOST: 0.0.0.0
  deploy:
    resources:
      limits:
        memory: 4G
  entrypoint: ["/bin/sh", "/entrypoint.sh"]
```

- **Volumen** `ollama_data` — modelos descargados persistentes (~1.6 GB gemma2:2b)
- **Entrypoint personalizado** — `ollama-entrypoint.sh`:
  1. Inicia `ollama serve` en background
  2. Espera a que la API esté lista (polling hasta 30s)
  3. Descarga `gemma2:2b` si no está cacheado
- **Límite de memoria** 4 GB — el modelo requiere ~2 GB en RAM
- **OLLAMA_KEEP_ALIVE: 24h** — el modelo queda cargado en memoria

### Servicio `backend` — FastAPI

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  ports:
    - "8000:8000"
  environment:
    DATABASE_URL: postgresql+asyncpg://agrocaribe:agrocaribe_secret@db:5432/agrocaribe
    SUPABASE_URL: ${SUPABASE_URL}
    SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    ENVIRONMENT: ${ENVIRONMENT:-development}
    LOG_LEVEL: ${LOG_LEVEL:-INFO}
    OPENMETEO_BASE_URL: https://api.open-meteo.com/v1
    OLLAMA_BASE_URL: http://ollama:11434
    OLLAMA_MODEL: gemma2:2b
    MODEL_ARTIFACT_DIR: /app/model_artifacts
    CORS_ORIGINS: http://localhost:5173,http://localhost
  depends_on:
    db:
      condition: service_healthy
    ollama:
      condition: service_started
  volumes:
    - ml-data:/app/model_artifacts/
    - ./data/caribe:/app/data/caribe:ro
  restart: unless-stopped
  networks:
    - backend_net
```

- **Variables sensibles** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) se pasan desde `.env` del host
- **`DATABASE_URL`** apunta al contenedor `db` por nombre de servicio — Docker DNS resuelve interno
- **`OLLAMA_BASE_URL`** apunta a `http://ollama:11434`
- **`depends_on` condicional** — espera a que `db` pase el healthcheck
- **Volumen `ml-data`** — artefactos de modelos ML entrenados
- **Bind mount `./data/caribe`** — datos geoespaciales semilla (solo lectura)

### Servicio `nginx` — Reverse Proxy

```yaml
nginx:
  image: nginx:alpine
  container_name: agrocaribe-nginx
  ports:
    - "80:80"
  volumes:
    - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - ./dist:/usr/share/nginx/html:ro
  depends_on:
    - backend
  networks:
    - backend_net
  restart: unless-stopped
```

- Sirve el **frontend compilado** desde `./dist`
- Proxy inverso hacia el backend para rutas `/api/*` y `/model/*`
- Depende de `backend` pero sin healthcheck — nginx arranca rápido y falla graceful

### Volúmenes y Redes

```yaml
volumes:
  pgdata:
    driver: local       # Datos PostgreSQL (persistentes)
  ollama_data:
    driver: local       # Modelos Ollama descargados
  ml-data:
    driver: local       # Artefactos ML entrenados

networks:
  backend_net:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1500
```

| Volumen | Path en contenedor | Persistencia |
|---------|-------------------|--------------|
| `pgdata` | `/var/lib/postgresql/data` | ✅ Datos de BD |
| `ollama_data` | `/root/.ollama` | ✅ Modelos LLM |
| `ml-data` | `/app/model_artifacts/` | ✅ Modelos entrenados |

Los 4 servicios comparten `backend_net` — comunicación interna por nombre de servicio. El MTU 1500 es el estándar para redes Ethernet.

---

## Dockerfile del Backend

```dockerfile
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Dependencias del sistema para psycopg2 / asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**Puntos clave:**
- **`python:3.12-slim`** — imagen minimalista, reduce superficie de ataque
- **`gcc libpq-dev`** — necesarios para compilar `psycopg2` / `asyncpg` desde pip
- **`--no-cache-dir`** — evita cache de pip en la imagen final
- **`HEALTHCHECK`** integrado — llama a `/health` cada 30s
- **`--reload`** solo para desarrollo — en producción se quita

**Optimización de capas (multi-stage recomendado para producción):**

```dockerfile
# ---- build stage ----
FROM python:3.12-slim AS builder
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# ---- runtime stage ----
FROM python:3.12-slim
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Nginx — Reverse Proxy

Archivo [`nginx.conf`](../../nginx.conf):

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    # HTML — no cache (nuevos bundles inmediatos)
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Assets estáticos — cache agresivo (30 días, inmutable)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy a FastAPI — endpoints de modelo (timeout largo 120s)
    location /model/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Proxy a FastAPI — API REST
    location ~* ^/(municipalities|analyze-location|climate|satellite-indicators
                   |auth|chat|history|analysis|sensors|geo|soil|predict
                   |irrigation-plans|reports|dashboard/summary|tasks
                   |docs|redoc|openapi\.json|health)($|/) {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # SPA fallback — todo lo demás sirve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Headers de proxy importantes:**

| Header | Propósito |
|--------|-----------|
| `X-Real-IP` | IP real del cliente |
| `X-Forwarded-For` | Cadena de proxies |
| `X-Forwarded-Proto` | `http` o `https` |
| `X-Forwarded-Host` | Host original del request |

**Timeouts diferenciados:**
- **API general**: 60s — suficiente para consultas normales
- **Endpoint `/model/`**: 120s — inferencia de modelos puede tomar más tiempo

---

## Healthchecks

| Servicio | Comando | Intervalo | Timeout | Start period |
|----------|---------|-----------|---------|--------------|
| **db** | `pg_isready -U agrocaribe -d agrocaribe` | 10s | 5s | 30s |
| **backend** | `curl localhost:8000/health` (vía Python) | 30s | 10s | 5s |

El backend usa `depends_on: db: condition: service_healthy` — no arranca hasta que PostGIS acepte conexiones.

---

## Comandos Comunes

```bash
# Construir imágenes
docker compose build backend
docker compose build --no-cache backend   # rebuild total sin cache

# Iniciar todos los servicios
docker compose up -d

# Ver logs
docker compose logs -f backend
docker compose logs -f db

# Ejecutar comandos dentro de un contenedor
docker compose exec backend python -m pytest
docker compose exec db psql -U agrocaribe -d agrocaribe

# Detener y limpiar volúmenes (⚠️ borra datos)
docker compose down -v

# Ver estado
docker compose ps
docker compose top
```

### Comandos para Ollama

```bash
# Verificar que el modelo está cargado
docker compose exec ollama ollama list

# Probar inferencia directa
docker compose exec ollama ollama run gemma2:2b "Hola, ¿qué cultivos recomiendas?"

# Traer otro modelo
docker compose exec ollama ollama pull llama3.2:3b
```

---

## Construcción y Publicación de Imágenes

### Construir para producción

```bash
# Etiquetar con versión
docker compose build backend
docker tag techcamp-backend docker.io/tuusuario/agrocaribe-backend:1.0.0

# Publicar en Docker Hub
docker login
docker push docker.io/tuusuario/agrocaribe-backend:1.0.0
```

### Publicar en GitHub Container Registry

```bash
docker tag techcamp-backend ghcr.io/tuusuario/agrocaribe-backend:latest
echo $GITHUB_TOKEN | docker login ghcr.io -u tuusuario --password-stdin
docker push ghcr.io/tuusuario/agrocaribe-backend:latest
```

### Pull y deploy en VPS

```bash
docker pull ghcr.io/tuusuario/agrocaribe-backend:latest
docker compose -f docker-compose.prod.yml up -d
```

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```bash
# Obligatorias
SUPABASE_URL=https://hpmjbgqjwopxlgurczna.supabase.co
SUPABASE_ANON_KEY=eyJ...

# Opcionales (con defaults)
ENVIRONMENT=development
LOG_LEVEL=INFO
```

Referencia: [[Proyectos/docs techcamp/04-development/setup|04-development/setup]] — configuración local del entorno de desarrollo.

---

## Troubleshooting

### `db` no arranca — "connection refused"

```bash
docker compose logs db
# Verificar si PostGIS se está iniciando correctamente
docker compose exec db pg_isready -U agrocaribe
```

### `ollama` no responde

```bash
docker compose logs ollama
# El entrypoint tarda en descargar gemma2:2b (~1.6 GB)
# Verificar espacio en disco
df -h
```

### `backend` no se conecta a `db`

```bash
# Verificar red
docker compose exec backend ping db
# Probar conexión directa
docker compose exec backend python -c "
import asyncpg
import asyncio
asyncio.run(asyncpg.connect('postgresql+asyncpg://agrocaribe:agrocaribe_secret@db:5432/agrocaribe'))
print('OK')
"
```
