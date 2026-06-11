# AgroCaribe AI — Documentación

Plataforma de análisis agrícola con inteligencia artificial para la región Caribe colombiana.

**Stack:** React 19 + FastAPI + PostgreSQL/PostGIS + HistGradientBoosting + LangChain + Ollama

---

## Estructura de la documentación

```
docs/
├── README.md                 ← Este archivo (índice maestro)
├── 01-business/              ← Contexto de negocio, problema, objetivos
├── 02-requirements/          ← Requisitos funcionales y escenarios de validación
├── 03-architecture/          ← Arquitectura del sistema, módulos, flujo de datos
├── 04-development/           ← Guías de desarrollo, setup, troubleshooting
├── 05-database/              ← Esquema de base de datos, PostGIS, migraciones
├── 06-api/                   ← Referencia de API REST, endpoints, schemas
├── 07-deployment/            ← Despliegue con Docker + Vercel/Cloudflare
├── 08-testing/               ← Estrategia de validación, resultados ML, plan de reentreno
├── 09-operations/            ← Runbook, monitoreo, backup, operaciones
├── 10-decisions/             ← Architecture Decision Records (ADRs)
└── _archive/                 ← Documentación histórica (referencia)
```

---

## Índice rápido

| Sección | Contenido | Para quién |
|---------|-----------|------------|
| [01-business](01-business/vision.md) | Visión del proyecto, problema, objetivos | Stakeholders, nuevos miembros |
| [02-requirements](02-requirements/requisitos.md) | Requisitos del sistema, escenarios de prueba | QA, producto |
| [03-architecture](03-architecture/) | Visión general, frontend, backend, módulos (clima, satélite, suelo, recomendación) | Arquitectos, desarrolladores |
| [04-development](04-development/setup.md) | Setup local, workflow, troubleshooting, progreso | Desarrolladores |
| [05-database](05-database/esquema.md) | ERD, PostGIS, índices, migraciones, seeds | Backend, DBAs |
| [06-api](06-api/referencia.md) | Endpoints, schemas, flujos request-response | Frontend, integraciones |
| [07-deployment](07-deployment/docker.md) | Docker, Vercel, Cloudflare, variables de entorno | DevOps, deploy |
| [08-testing](08-testing/estrategia.md) | Validación ML, resultados reales vs sintéticos, plan de reentreno | ML, QA |
| [09-operations](09-operations/runbook.md) | Health checks, logs, backup, monitoreo | Operaciones |
| [10-decisions](10-decisions/) | ADRs: decisiones arquitectónicas fundamentales | Arquitectos, revisores |

---

## Stack tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Frontend | React + Vite + Tailwind + Zustand | 19 / 8 / 3.4 / 5 |
| Backend | FastAPI + SQLAlchemy + asyncpg | 0.115+ / 2.0+ / 0.30+ |
| Base de datos | PostgreSQL + PostGIS (Docker local) | 17 / 3.4 |
| ML | scikit-learn HistGradientBoosting + CalibratedClassifierCV | 1.6+ |
| Predicción climática | LSTM (TensorFlow/Keras) | 2.21+ |
| Agente IA | LangChain + LangGraph + Ollama + RAG TF-IDF | 0.3+ |
| Datos satelitales | Sentinel-2 (ESA) procesados en QGIS | — |
| Datos climáticos | NASA POWER + OpenMeteo | — |
| Datos de suelo | ISRIC SoilGrids v2.0 | REST API |
| Mapas | Leaflet + react-leaflet + leaflet-draw | 1.9 / 5.0 / 1.0 |
| Contenedores | Docker + Docker Compose | 27+ / 2.30+ |

---

## Comandos rápidos

```bash
# Desarrollo (2 terminales)
cd backend && uvicorn app.main:app --reload   # Terminal 1
npm run dev                                    # Terminal 2

# Docker (PostGIS + Backend + Ollama)
docker compose up -d

# Tests
cd backend && python -m pytest tests/ -v

# Build frontend
npm run build
```

---

## Documentación histórica

La carpeta `_archive/` contiene documentación original del prototipo y registros de sesiones de implementación. Se conserva como referencia histórica pero **no refleja el estado actual del sistema**. Para documentación vigente, usar las secciones `01` a `10`.

---

> Esta documentación usa formato [[wikilink]] de Obsidian. Abre `docs/` como vault en Obsidian para navegación en grafo.
