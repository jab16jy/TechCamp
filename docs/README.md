# Documentacion AgroCaribe IA

Plataforma de analisis agricola con inteligencia artificial para la region Caribe colombiana.
React 19 + FastAPI + PostgreSQL/PostGIS + ML + LangChain.

> Esta documentacion usa formato [[wikilink]] de Obsidian. Abre `docs/` como vault en Obsidian para navegacion en grafo.

## Estructura de la documentacion

```
docs/
├── 1-inicial/        → Diseno original, setup, modulos, troubleshooting
├── 2-backend/        → Arquitectura backend, API endpoints, seguimiento
├── 3-frontend/       → Arquitectura frontend, componentes, estado global
├── 4-arquitectura/   → Notas conceptuales: vision, modulos, despliegue, QGIS
├── 5-implementacion/ → Registro de sesiones de implementacion
└── README.md         → Este archivo (indice)
```

---

## 1-inicial — Documentacion de origen

| Archivo | Contenido |
|---------|-----------|
| `DOCUMENTACION_INICIAL.md` | Flujo de trabajo original, fuentes de datos (NASA POWER, Sentinel-2), diseno funcional |
| `PLAN_DESARROLLO.md` | Cronograma original (21 semanas) con entregables por fase |
| `VALIDACION_SISTEMA.md` | Escenarios de validacion, metricas del modelo, pruebas UI/UX |
| `SETUP.md` | Instalacion, variables de entorno, credenciales de prueba, scripts |
| `DISENO_MODULOS.md` | Descripcion detallada de cada modulo del sistema (diseno original) |
| `TROUBLESHOOTING.md` | Problemas comunes y soluciones, convenciones de estilo |

## 2-backend — Backend FastAPI

| Archivo | Contenido |
|---------|-----------|
| `ARQUITECTURA_BACKEND.md` | Stack tecnico, estructura del proyecto, esquema DB, 25+ endpoints, pipeline de analisis, Docker |
| `TASKS.md` | Seguimiento de implementacion por fases |

## 3-frontend — Frontend React

| Archivo | Contenido |
|---------|-----------|
| `ARQUITECTURA_FRONTEND.md` | Stack, routing, componentes, estado global (Zustand 3 slices), diseno, modulos |

## 4-arquitectura — Notas conceptuales

| Archivo | Contenido |
|---------|-----------|
| `VISION_SISTEMA.md` | Diagrama de bloques, flujo de procesamiento, 25 endpoints |
| `MODULO_CLIMA.md` | NASA POWER + OpenMeteo, proyeccion a 6 meses, schemas Pydantic |
| `MODULO_SATELITAL.md` | Sentinel-2 + QGIS + NDVI/NDWI, tabla con 2.5M puntos |
| `MODULO_RECOMENDACION.md` | Motor hibrido (reglas + RF), CropClassifier, crops_requirements.csv |
| `MODULO_SUELO_SOILGRIDS.md` | Integracion ISRIC SoilGrids v2.0: pH, MO, textura automaticos |
| `ARQUITECTURA_DB.md` | Esquema entidad-relacion, PostGIS, RLS, conexion |
| `FLUJO_DATOS.md` | Mapa de conexion Frontend ↔ Backend, flujo de analisis, chat, prediccion |
| `DESPLIEGUE.md` | Docker + Vercel: paso a paso, variables de entorno, configs |
| `GUIAS_QGIS.md` | Guia paso a paso para procesar imagenes Sentinel-2 y poblar indices NDVI |

## 5-implementacion — Registro de sesiones

| Archivo | Contenido |
|---------|-----------|
| `CHAT_2025-05-19.md` | Implementacion: SoilGrids API, RF en produccion, migracion DB local |
| `CHAT_2025-06-06.md` | Refactor IA Predictiva, rediseno AnalisisCultivos, actualizacion docs |

---

## Stack

| Componente | Tecnologia | Version |
|-----------|-----------|---------|
| Frontend | React + Vite + Tailwind + Zustand | 19 / 8 / 3.4 / 5 |
| Backend | FastAPI + SQLAlchemy + asyncpg | 0.115+ / 2.0+ / 0.30+ |
| Base de datos | PostgreSQL + PostGIS (Docker local) | 17 / 3.4 |
| Datos de suelo | ISRIC SoilGrids v2.0 API | REST |
| ML | scikit-learn Random Forest + LSTM | 1.6+ |
| Agente IA | LangChain + LangGraph + RAG | 0.3+ |
| Mapas | Leaflet + react-leaflet + leaflet-draw | 1.9 / 5.0 / 1.0 |
| Contenedores | Docker + Docker Compose | 27+ / 2.30+ |

## Comandos rapidos

```bash
# Desarrollo (2 terminales)
cd backend && uvicorn app.main:app --reload   # Terminal 1
npm run dev                                    # Terminal 2

# Docker (PostGIS + Backend)
docker compose up -d                   # DB en :5432, Backend en :8000
docker compose logs -f backend         # Ver logs del backend

# Tests
cd backend && python -m pytest tests/ -v

# Documentacion
# docs/ usa formato Obsidian. Abrir como vault: Obsidian → Abrir vault → docs/
```
