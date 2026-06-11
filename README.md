# AgroCaribe AI

**AgroCaribe AI** es una plataforma avanzada de análisis agrícola impulsada por inteligencia artificial, diseñada específicamente para optimizar la producción de cultivos en la región del Caribe colombiano.

---

## Inicio Rápido

```bash
npm install
npm run dev
```

---

## Documentación Técnica

La documentación completa está organizada en `docs/`:

### [👉 Ir a la Documentación](docs/README.md)

| Sección | Contenido |
|---------|-----------|
| [01-business](docs/01-business/vision.md) | Visión del proyecto, problema, objetivos |
| [02-requirements](docs/02-requirements/requisitos.md) | Requisitos y escenarios de validación |
| [03-architecture](docs/03-architecture/vision-general.md) | Arquitectura, módulos, flujo de datos |
| [04-development](docs/04-development/setup.md) | Setup, workflow, troubleshooting |
| [05-database](docs/05-database/esquema.md) | Base de datos, PostGIS, migraciones |
| [06-api](docs/06-api/referencia.md) | API REST, endpoints, schemas |
| [07-deployment](docs/07-deployment/docker.md) | Docker, Vercel, Cloudflare |
| [08-testing](docs/08-testing/estrategia.md) | Validación ML, resultados, plan de reentreno |
| [09-operations](docs/09-operations/runbook.md) | Runbook, monitoreo, backup |
| [10-decisions](docs/10-decisions/) | Architecture Decision Records |

---

## Stack Tecnológico

- **Frontend**: React 19 + Vite 8 + Zustand 5 + Tailwind CSS 3
- **Backend**: FastAPI + SQLAlchemy + asyncpg + PostGIS
- **ML**: HistGradientBoosting + CalibratedClassifierCV + LSTM
- **IA**: LangChain + LangGraph + Ollama + RAG (TF-IDF)
- **Infra**: Docker + Docker Compose

---

## Estado del Proyecto

Backend funcional con 26+ endpoints, modelo ML entrenado (84.6% accuracy en sintéticos), chatbot con RAG sobre 40+ documentos agronómicos, y pipeline de reentreno con datos reales EVA Caribe en progreso.

---

## Workflow con OpenCode

Este proyecto se desarrolla usando OpenCode con branches por tarea:

- `feature/*` — nuevas funcionalidades
- `fix/*` — corrección de bugs
- `refactor/*` — refactorización de código
- `docs/*` — documentación
- `infra/*` — infraestructura y CI/CD

Los cambios se hacen en branches aislados y se integran a `main` via Pull Request.
