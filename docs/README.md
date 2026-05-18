# Documentacion AgroCaribe IA

Plataforma de analisis agricola con inteligencia artificial para la region Caribe colombiana.
React 19 + FastAPI + Supabase PostGIS + ML + LangChain.

> Esta documentacion usa formato [[wikilink]] de Obsidian. Abre `docs/` como vault en Obsidian para navegacion en grafo.

## Estructura de la documentacion

```
docs/
├── 1-inicial/        → Diseno original, setup, modulos, troubleshooting
├── 2-backend/        → Arquitectura backend, API endpoints, seguimiento
├── 3-frontend/       → Arquitectura frontend, componentes, estado global
├── 4-arquitectura/   → Notas conceptuales: vision, modulos, despliegue, QGIS
└── README.md         → Este archivo (indice)
```

---

## 1-inicial — Documentacion de origen

| Archivo | Contenido |
|---------|-----------|
| `DOCUMENTACION_INICIAL.md` | Flujo de trabajo original, fuentes de datos (NASA POWER, Sentinel-2), diseno funcional |
| `PLAN_DESARROLLO.md` | Cronograma original (21 semanas) con entregables por fase |
| `VALIDACION_SISTEMA.md` | Escenarios de validacion, metricas del modelo Random Forest, pruebas UI/UX |
| `SETUP.md` | Instalacion, variables de entorno, credenciales de prueba, scripts |
| `DISENO_MODULOS.md` | Descripcion detallada de cada modulo del sistema (diseno original) |
| `TROUBLESHOOTING.md` | Problemas comunes y soluciones, convenciones de estilo |

## 2-backend — Backend FastAPI

| Archivo | Contenido |
|---------|-----------|
| `ARQUITECTURA_BACKEND.md` | Stack tecnico, estructura del proyecto, esquema DB, 19 endpoints documentados, pipeline de analisis, Docker |
| `TASKS.md` | Seguimiento de implementacion: 9 fases completadas, 0 pendientes |

## 3-frontend — Frontend React

| Archivo | Contenido |
|---------|-----------|
| `ARQUITECTURA_FRONTEND.md` | Stack, routing, 15 rutas, estado global (Zustand 3 slices), tokens de diseno M3, 3 enfoques CSS, componentes por modulo |

## 4-arquitectura — Notas conceptuales

| Archivo | Contenido |
|---------|-----------|
| `VISION_SISTEMA.md` | Diagrama de bloques, flujo de procesamiento, 19 endpoints |
| `MODULO_CLIMA.md` | NASA POWER + OpenMeteo, proyeccion a 6 meses, schemas Pydantic |
| `MODULO_SATELITAL.md` | Sentinel-2 + QGIS + NDVI/NDWI, guia de procesamiento, tabla con datos actuales |
| `MODULO_RECOMENDACION.md` | Motor hibrido (reglas + RF), CropClassifier, crops_requirements.csv |
| `ARQUITECTURA_DB.md` | Esquema entidad-relacion, PostGIS, RLS, conexion Supabase |
| `FLUJO_DATOS.md` | Mapa de conexion Frontend ↔ Backend, flujo de analisis, chat, prediccion |
| `DESPLIEGUE.md` | Docker + Vercel: paso a paso, variables de entorno, configs |
| `GUIAS_QGIS.md` | Guia paso a paso para procesar imagenes Sentinel-2 y poblar indices NDVI |

---

## Stack

| Componente | Tecnologia | Version |
|-----------|-----------|---------|
| Frontend | React + Vite + Tailwind + Zustand | 19 / 8 / 3.4 / 5 |
| Backend | FastAPI + SQLAlchemy + asyncpg | 0.115 / 2.0 / 0.30 |
| Base de datos | PostgreSQL + PostGIS (Supabase) | 17 / 3.4 |
| ML | scikit-learn Random Forest | 1.6 |
| Agente IA | LangChain + LangGraph + RAG | 0.3 |
| Contenedores | Docker | 27+ |

## Comandos rapidos

```powershell
# Desarrollo (2 terminales)
cd backend && uvicorn app.main:app --reload   # Terminal 1
npm run dev                                    # Terminal 2

# Docker (solo backend)
docker compose up -d                   # Backend en :8000

# Tests
cd backend && python -m pytest tests/ -v

# Documentacion
# Abrir docs/ en Obsidian o cualquier editor markdown
```
