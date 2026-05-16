---
tags: [backend, tracking, mvp]
updated: 2026-05-16
---

# Backend — Seguimiento de Tareas

Progreso del backend comparando la documentación de `ARQUITECTURA_BACKEND.md` contra el código implementado.

Última actualización: 2026-05-16

## ✅ Completado — Infraestructura base

- [x] Scaffold FastAPI: `main.py`, CORS, health check ✅ 2026-05-16
- [x] Config vía pydantic-settings (`core/config.py`) ✅ 2026-05-16
- [x] DB async engine + session factory (`core/database.py`) ✅ 2026-05-16
- [x] Dependencias compartidas (`core/dependencies.py`) ✅ 2026-05-16
- [x] Router aggregator (`api/router.py`) ✅ 2026-05-16
- [x] Dockerfile (Python 3.12-slim) ✅ 2026-05-16
- [x] docker-compose.yml (backend + postgis) ✅ 2026-05-16
- [x] requirements.txt con todas las dependencias base ✅ 2026-05-16
- [x] Alembic config (`alembic.ini` + `data/migrations/env.py`) ✅ 2026-05-16

## ✅ Completado — Modelos

- [x] `models/base.py` — Base declarativa ✅ 2026-05-16
- [x] `models/municipio.py` — Municipios con PostGIS geometry ✅ 2026-05-16
- [x] `models/analisis.py` — Registros de análisis ✅ 2026-05-16
- [x] `models/usuario.py` — Usuarios ✅ 2026-05-16
- [x] `models/indice_satelital.py` — Índices satelitales ✅ 2026-05-16

## ✅ Completado — Schemas

- [x] `schemas/analisis.py` — Todos los DTOs (AnalyzeRequest, AnalyzeResponse, ClimateData, SatelliteData, etc.) ✅ 2026-05-16

## ✅ Completado — Endpoints (con fallback mock)

- [x] `GET /municipalities` — Lista de municipios ✅ 2026-05-16
- [x] `POST /analyze-location` — Análisis completo de cultivos ✅ 2026-05-16
- [x] `GET /climate` — Clima vía OpenMeteo API ✅ 2026-05-16
- [x] `GET /satellite-indicators` — NDVI desde DB ✅ 2026-05-16
- [x] `GET /history` — Historial desde DB ✅ 2026-05-16

## ✅ Completado — Services

- [x] `services/climate_service.py` — Cliente OpenMeteo + mock fallback ✅ 2026-05-16
- [x] `services/satellite_service.py` — Lookup NDVI en DB + mock fallback ✅ 2026-05-16

## ✅ Completado — Seeds

- [x] `seeds/municipios.py` — Seed de municipios e índices satelitales ✅ 2026-05-16
- [x] `data/seeds/01_municipios.sql` — SQL de inicialización ✅ 2026-05-16

## ⏳ Pendiente — Modelos faltantes

- [ ] `models/parcela.py` — Parcelas con geometría PostGIS 📅 2026-06-01
- [ ] `models/sensor.py` — Nodos IoT 📅 2026-06-01
- [ ] `models/lectura_sensor.py` — Lecturas time-series de sensores 📅 2026-06-01
- [ ] `models/conversacion.py` — Conversaciones del chat 📅 2026-06-08
- [ ] `models/mensaje.py` — Mensajes del chat 📅 2026-06-08

## ⏳ Pendiente — Schemas faltantes

- [ ] `schemas/clima.py` — Modelos Pydantic de clima 📅 2026-06-01
- [ ] `schemas/satelite.py` — Modelos Pydantic de satélite 📅 2026-06-01
- [ ] `schemas/chat.py` — Modelos Pydantic de chat 📅 2026-06-08

## ⏳ Pendiente — Endpoints faltantes

- [ ] `POST /chat` — Endpoint de chatbot (LangGraph MVP) 📅 2026-06-15
- [ ] `POST /auth/login` — Autenticación 📅 2026-06-22

## ⏳ Pendiente — Services faltantes

- [ ] `services/recommendation.py` — Motor híbrido: reglas agronómicas + Random Forest 📅 2026-06-08
- [ ] `services/chat_service.py` — Orquestación LangGraph 📅 2026-06-15

## ⏳ Pendiente — Machine Learning

- [ ] `ml/model.py` — Wrapper del modelo Random Forest 📅 2026-06-08
- [ ] `ml/training.py` — Pipeline de entrenamiento 📅 2026-06-08
- [ ] `ml/crops_requirements.csv` — Rangos óptimos por cultivo 📅 2026-06-01

## ⏳ Pendiente — Agente LangGraph

- [ ] `agent/graph.py` — Definición del grafo de estado 📅 2026-06-15
- [ ] `agent/tools.py` — Herramientas del agente (query DB, clima, sensores) 📅 2026-06-15
- [ ] `agent/state.py` — GraphState con TypedDict 📅 2026-06-15

## ⏳ Pendiente — Tests

- [ ] `tests/test_analisis.py` 📅 2026-06-01
- [ ] `tests/test_clima.py` 📅 2026-06-01
- [ ] `tests/test_satelite.py` 📅 2026-06-01
- [ ] `tests/test_chat.py` 📅 2026-06-15

## ⏳ Pendiente — Infraestructura

- [ ] Migraciones Alembic versionadas (`data/migrations/versions/`) 📅 2026-06-01
- [ ] `nginx.conf` — Proxy inverso para producción 📅 2026-06-15
- [ ] `data/ndvi/` — Archivos GeoJSON pre-procesados 📅 2026-06-08

---

## Queries

### Tareas completadas

\`\`\`tasks
done
heading includes Completado
sort by heading
\`\`\`

### Tareas pendientes

\`\`\`tasks
not done
heading includes Pendiente
sort by heading
sort by due
\`\`\`

### Próximos 7 días

\`\`\`tasks
not done
due before 2026-05-23
sort by due
\`\`\`
