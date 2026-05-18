---
titulo: "Despliegue — Docker + Vercel"
proyecto: AgroCaribe IA
tags: [despliegue, docker, vercel, produccion]
---

# Despliegue

## Arquitectura de despliegue

```
                        Internet
                           │
                    ┌──────┴──────┐
                    │  Vercel     │  ← Frontend (estatico)
                    │ Cloudflare  │     dist/ → npm run build
                    │ Pages       │     https://agrocaribe.vercel.app
                    └──────┬──────┘
                           │ https
                           ▼
┌──────────────────────────────────────┐
│ Docker (VPS / Railway / Fly.io)      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Backend FastAPI :8000           │  │
│  │ app/main.py                     │  │
│  │ ↓ DATABASE_URL pooler           │  │
│  └────────────────────────────────┘  │
└──────────────────┬───────────────────┘
                   │ asyncpg
                   ▼
┌──────────────────────────────┐
│ Supabase Cloud               │
│ PostgreSQL + PostGIS + Auth  │
└──────────────────────────────┘
```

## Paso a paso

### 1. Backend con Docker

```powershell
# Construir imagen
docker compose build backend

# Probar localmente
docker compose up -d
curl http://localhost:8000/health

# Publicar (ejemplo con Docker Hub)
docker tag techcamp-backend tu-usuario/agrocaribe-backend:latest
docker push tu-usuario/agrocaribe-backend:latest
```

### 2. Frontend en Vercel

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Construir
npm run build

# Desplegar
vercel --prod
```

O con Cloudflare Pages (ya configurado en `wrangler.toml`):

```powershell
npm run build
npx wrangler pages deploy dist
```

### 3. Variables de entorno en produccion

El backend necesita:
```env
DATABASE_URL=postgresql+asyncpg://postgres.hpmjbgqjwopxlgurczna:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://hpmjbgqjwopxlgurczna.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
ENVIRONMENT=production
LOG_LEVEL=INFO
OPENMETEO_BASE_URL=https://api.open-meteo.com/v1
CORS_ORIGINS=https://tu-dominio.com
```

El frontend necesita configurar `VITE_API_URL` en Vercel:
```
VITE_API_URL=https://tu-backend.com
```

## Archivos de configuracion

### `docker-compose.yml` (produccion)

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: ${DATABASE_URL}
      CORS_ORIGINS: ${CORS_ORIGINS}
    restart: always
```

### `wrangler.toml` (Cloudflare Pages)

```toml
name = "techcamp"
pages_build_output_dir = "./dist"
compatibility_date = "2024-05-10"
```

## Desarrollo local

```powershell
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
npm run dev
```

## Arquitectura final del proyecto

```
D:\PROYECTOS\TechCamp
├── src/               → Frontend React
├── backend/           → FastAPI Docker
├── supabase/          → Migraciones DB
├── docs/              → Documentacion
├── docker-compose.yml → Solo backend
├── nginx.conf         → Para proxy inverso (opcional)
├── wrangler.toml      → Cloudflare Pages config
└── .env               → Credenciales locales (no se sube a git)

---

## Referencias

- [[1-inicial/SETUP]] — Instalacion y configuracion local
- [[2-backend/ARQUITECTURA_BACKEND]] — Dockerfile y dependencias del backend
- [[4-arquitectura/GUIAS_QGIS]] — Guia QGIS para datos satelitales
```
