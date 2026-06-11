---
titulo: "Setup — Instalación y configuración local"
proyecto: AgroCaribe IA
tags: [setup, instalacion, desarrollo, docker, backend, frontend]
---

# Setup — Instalación y configuración local

> **Nota:** La URL del backend se puede cambiar desde la UI en Ajustes (`/investigador/ajustes`) sin recompilar.
> Ya no existe MOCK_DATA — todos los datos provienen de APIs reales o la base de datos local.

---

## Requisitos previos

- **Node.js** 18+
- **npm** 9+
- **Python** 3.12+
- **Docker** + **Docker Compose** (para PostgreSQL/PostGIS local)

---

## Instalación

### Frontend

```bash
npm install
```

### Backend

```bash
cd backend
pip install -r requirements.txt
```

---

## Docker Compose (BD local + backend)

El proyecto usa Docker Compose para la base de datos PostgreSQL/PostGIS y opcionalmente el backend contenedorizado.

```bash
# Iniciar BD + Backend
docker compose up -d

# Solo la BD
docker compose up -d db

# Ver logs del backend
docker compose logs -f backend

# Reconstruir backend tras cambios
docker compose up -d --build backend

# Detener todo y eliminar volumen BD (pierde datos)
docker compose down -v
```

**Credenciales BD local:** `localhost:5432`, usuario `agrocaribe`, password `agrocaribe_secret`, base de datos `agrocaribe`.
**Backend:** `localhost:8000`, healthcheck en `/health`.

### Servicios en docker-compose.yml

| Servicio | Imagen | Puerto | Descripción |
|----------|--------|--------|-------------|
| `db` | postgis/postgis:16-3.4 | 5432 | PostgreSQL + PostGIS |
| `backend` | (build local) | 8000 | FastAPI + ML + RAG |

---

## Migraciones (Alembic)

Si la BD se crea desde cero, ejecutar las migraciones:

```bash
docker compose exec backend alembic upgrade head
```

Para generar una nueva migración:

```bash
docker compose exec backend alembic revision --autogenerate -m "descripcion"
```

---

## Seeds

Los seeds de municipios se ejecutan automáticamente al crear el contenedor DB por primera vez.

Datos satelitales NDVI (~2.5M puntos) requieren importación manual:

```bash
docker compose exec backend python /app/data/seeds/import_ndvi_local.py
```

---

## Variables de entorno (desarrollo)

Crear un archivo `.env` en la raíz del proyecto:

| Variable | Descripción | Default (desarrollo) |
|----------|-------------|----------------------|
| `DATABASE_URL` | Conexión PostgreSQL async | `postgresql+asyncpg://agrocaribe:agrocaribe_secret@db:5432/agrocaribe` |
| `SUPABASE_URL` | URL proyecto Supabase (Auth) | — |
| `SUPABASE_ANON_KEY` | Anon key Supabase | — |
| `VITE_API_URL` | URL del backend para frontend | `http://localhost:8000` |
| `OPENMETEO_BASE_URL` | API de clima | `https://api.open-meteo.com/v1` |
| `CORS_ORIGINS` | Orígenes CORS permitidos | `http://localhost:5173,http://localhost:5173,http://localhost` |
| `LOG_LEVEL` | Nivel de logging | `DEBUG` |
| `OLLAMA_BASE_URL` | URL de Ollama local (opcional) | — |
| `OPENAI_API_KEY` | API key OpenAI (opcional, para LLM real) | — |

> La URL del backend también se configura desde la UI en `/investigador/ajustes` (persiste en localStorage).

---

## Scripts de desarrollo

### Frontend

| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor desarrollo en `localhost:5173` |
| `npm run build` | Build producción en `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Previsualizar build producción |

### Backend

| Comando | Acción |
|---------|--------|
| `cd backend && uvicorn app.main:app --reload` | Servidor desarrollo en `localhost:8000` |
| `cd backend && python -m pytest tests/ -v` | Ejecutar tests (16 tests) |
| `docker compose up -d` | Backend containerizado |

---

## Desarrollo local (2 terminales)

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
npm run dev
```

Abrir `http://localhost:5173` en el navegador.

---

## Credenciales de prueba (Login Investigador)

- **Email:** `investigador@techcamp.co`
- **Contraseña:** `AgroCaribe2025`

La sesión se guarda en `sessionStorage` y se limpia al cerrar la pestaña.

---

## Notas

- Backend con 16+ tests (pytest + httpx.AsyncClient)
- No hay test suite frontend configurada
- ESLint como único linter frontend
- **No existe MOCK_DATA** — Los datos vienen de APIs reales (OpenMeteo, SoilGrids, NASA POWER, PostgreSQL)
- El único fallback son 3 recomendaciones estáticas en `analysisService.js` cuando el backend no responde

---

## Referencias

- [[07-deployment/docker]] — Despliegue con Docker + Vercel (producción)
- [[03-architecture/backend]] — Arquitectura del backend y endpoints
- [[03-architecture/vision-general]] — Stack tecnológico completo
- [[03-architecture/frontend]] — Frontend, páginas y configuración
- [[04-development/troubleshooting]] — Problemas comunes y soluciones
