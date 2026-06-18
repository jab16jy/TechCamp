---
titulo: "Arquitectura del Backend — AgroCaribe IA"
proyecto: AgroCaribe IA
tags: [backend, arquitectura, fastapi, postgresql, langgraph, docker]
---

# Arquitectura del Backend

## 1. Technology Stack

| Componente           | Tecnología                     | Versión     | Propósito                                                                 |
| -------------------- | ------------------------------ | ----------- | ------------------------------------------------------------------------- |
| Framework API        | FastAPI                        | 0.115+      | Framework REST asíncrono con validación Pydantic y OpenAPI automático     |
| Base de datos        | PostgreSQL + PostGIS           | 16 / 3.4    | Datos relacionales + geometrías (parcelas, municipios, sensores)          |
| ORM                  | SQLAlchemy 2.0 (async)         | 2.0+        | Mapeo objeto-relacional con soporte async vía asyncpg                     |
| Cliente DB asíncrono | asyncpg                        | 0.30+       | Conexión nativa PostgreSQL desde FastAPI asíncrono                        |
| Chatbot              | LangGraph                      | 0.3+        | Agente conversacional con estado, RAG y herramientas (3 nodos)            |
| LLM local            | Ollama (gemma2:2b)             | latest      | Generación de respuestas del asistente AgroAsesor                         |
| Modelo ML            | HistGradientBoosting + CalibratedClassifierCV | 1.6+        | Clasificación de aptitud de cultivos (10 clases, precisión 84.6%)         |
| Modelo LSTM          | TensorFlow / Keras             | 2.21+       | Predicción de anomalías climáticas a 6 meses                              |
| Búsqueda RAG         | TF-IDF (scikit-learn)          | 1.6+        | Indexación y recuperación de 40+ documentos agronómicos                   |
| Contenedores         | Docker + Docker Compose        | 27+ / 2.30+ | Orquestación multi-servicio (db + ollama + backend)                       |
| Proxy inverso        | Nginx                          | 1.27        | Servir frontend build + enrutar `/api/*` al backend                       |

### Justificación de elecciones

- **FastAPI** sobre Flask: rendimiento async superior, validación automática con Pydantic, documentación OpenAPI interactiva (útil para debuguear el frontend)
- **PostGIS** desde el día 1: el frontend trabaja con coordenadas Leaflet, parcelas con geometría y consultas espaciales como "sensores dentro de un radio"
- **LangGraph** sobre LangChain simple: porque el chatbot necesita estado multi-turno, herramientas (consultar DB, clima, sensores) y branching condicional
- **Ollama local** sobre APIs externas: evita costos de inferencia, funciona offline, datos sensibles nunca salen del servidor
- **HistGradientBoosting** sobre Random Forest clásico: mejor rendimiento en datos tabulares sintéticos, entrenamiento más rápido, soporta nativamente valores nulos
- **TF-IDF** sobre embeddings densos para RAG: 0 dependencias externas, funciona sin GPU, resultados interpretables

---

## 2. Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                        # FastAPI app, CORS, lifespan, router mounts
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                  # Settings via pydantic-settings (env vars)
│   │   ├── database.py                # AsyncEngine, session factory
│   │   └── dependencies.py            # DI: get_db, get_current_user (JWT Supabase)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                    # SQLAlchemy declarative base
│   │   ├── usuario.py                 # Users (investigadores/productores)
│   │   ├── municipio.py               # Municipios table + geometry (PostGIS)
│   │   ├── analisis.py                # Analysis records (simple/advanced)
│   │   ├── parcela.py                 # Parcelas with geometry
│   │   ├── sensor.py                  # IoT sensor nodes
│   │   ├── lectura_sensor.py          # Time-series sensor readings
│   │   ├── indice_satelital.py        # Satellite indices (NDVI, NDWI) con geometría
│   │   ├── conversacion.py            # Chat conversations
│   │   ├── mensaje.py                 # Chat messages
│   │   ├── plan_riego.py              # Irrigation plans generados por IA
│   │   └── tarea.py                   # Tasks vinculadas a planes de riego
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── analisis.py                # AnalyzeRequest/Response, HistorialEntry, MunicipioResponse
│   │   ├── clima.py                   # ClimateData, AnomaliaClimatica
│   │   ├── satelite.py                # SatelliteData
│   │   ├── chat.py                    # ChatRequest, ChatResponse, ChatMessage
│   │   ├── predict.py                 # PredictRequest/Response, OptimalDay, Scenario, Alert
│   │   ├── auth.py                    # LoginRequest, TokenResponse, UserInfo
│   │   ├── sensor.py                  # SensorResponse, LecturaResponse, CreateLecturaRequest
│   │   ├── dashboard.py               # DashboardSummaryResponse
│   │   ├── reports.py                 # AlertItem, CompareResponse, ExportResponse
│   │   └── irrigation.py              # IrrigationPlanRequest/Response, TaskRequest, Thresholds
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py                  # Main router aggregator (15 routers)
│   │   ├── analisis.py                # POST /analyze-location + GET /analysis/{id}
│   │   ├── municipios.py              # GET /municipalities
│   │   ├── clima.py                   # GET /climate
│   │   ├── satelite.py                # GET /satellite-indicators
│   │   ├── historial.py               # GET /history + DELETE /history/{id}
│   │   ├── auth.py                    # POST /auth/login (Supabase)
│   │   ├── chat.py                    # POST /chat + GET /chat/test-llm
│   │   ├── sensores.py                # GET /sensors + GET /sensors/{id}/readings + POST /sensors/readings
│   │   ├── geo.py                     # POST /geo/decode (reverse geocode con PostGIS)
│   │   ├── predict.py                 # POST /predict + /predict/optimal-day + /predict/scenario
│   │   ├── reports.py                 # GET /reports/alerts + POST /reports/compare + /reports/export
│   │   ├── dashboard.py               # GET /dashboard/summary
│   │   ├── soil.py                    # GET /soil/data (ISRIC SoilGrids)
│   │   └── irrigation.py             # POST /irrigation-plans + GET /irrigation-plans/{id} + GET /thresholds
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── climate_service.py         # OpenMeteo API + NASA POWER climatology + anomalías
│   │   ├── satellite_service.py       # NDVI lookups desde DB (tabla indices_satelitales)
│   │   ├── soil_service.py            # ISRIC SoilGrids v2.0 + fallback por zona agroecológica
│   │   ├── prediction_service.py      # Proyección de ventanas de siembra (6 meses, fenología, NPK, riego)
│   │   ├── recommendation.py          # Motor híbrido: rules + ML, antes llamado `recommendation.py`
│   │   ├── irrigation_service.py      # Planificación de riego: umbrales, ET0, textura, eventos
│   │   ├── chat_service.py            # Orquestador del chat: agent graph → LLM → keyword fallback
│   │   ├── rag_service.py             # TF-IDF vectorizer + keyword search sobre 40+ docs agronómicos
│   │   └── llm_service.py             # Cliente HTTP para Ollama API (gemma2:2b)
│   │
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── crops_requirements.csv     # Rangos óptimos de cultivos
│   │   ├── crop_model_rf.joblib       # Modelo entrenado (HistGradientBoosting)
│   │   ├── crop_scaler.joblib         # StandardScaler del modelo
│   │   ├── training.py                # Pipeline de entrenamiento con datos sintéticos
│   │   ├── inference.py               # Inferencia ML con fallback automático a CropClassifier
│   │   ├── model.py                   # CropClassifier heurístico (reglas agronómicas)
│   │   └── lstm_model.py             # LSTM para anomalías climáticas a 6 meses
│   │
│   └── agent/
│       ├── __init__.py
│       ├── state.py                   # AgentState TypedDict
│       ├── graph.py                   # StateGraph: orchestrator → generate (2 nodos)
│       └── tools.py                   # Herramientas: get_last_analysis, get_history_summary, get_sensor_status
│
├── data/
│   ├── migrations/                    # Alembic migration scripts
│   ├── seeds/                         # Seed data (municipios, demo)
│   ├── ndvi/                          # Pre-processed NDVI GeoJSON files
│   └── rag/                           # 40+ documentos agronómicos en Markdown
│       ├── 01-cultivos-caribe.md
│       ├── 02-maiz.md
│       ├── ...
│       └── 40-planificacion-finca.md
│
├── docker/
│   └── ollama-entrypoint.sh           # Entrypoint que descarga gemma2:2b al iniciar
│
├── tests/
│   ├── test_analisis.py
│   ├── test_clima.py
│   ├── test_satelite.py
│   └── test_chat.py
│
├── alembic.ini
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## 3. Base de Datos

### 3.1 Esquema Relacional

```mermaid
erDiagram
    USUARIO ||--o{ ANALISIS : realiza
    USUARIO ||--o{ CONVERSACION : tiene
    USUARIO ||--o{ PARCELA : administra
    USUARIO ||--o{ TAREA : recibe

    MUNICIPIO ||--o{ ANALISIS : referencia

    SENSOR ||--o{ LECTURA_SENSOR : genera
    SENSOR ||--o{ PLAN_RIEGO : activa

    PLAN_RIEGO ||--o{ TAREA : genera
    PARCELA ||--o{ PLAN_RIEGO : referencia

    ANALISIS {
        uuid id PK
        uuid usuario_id FK
        int municipio_id FK
        varchar tipo "simple | advanced"
        jsonb datos_formulario
        jsonb resultado_completo
        float lat
        float lng
        varchar cultivo_recomendado
        int score
        timestamp created_at
    }

    PARCELA {
        uuid id PK
        uuid usuario_id FK
        varchar nombre
        float area_hectareas
        geometry poligono "PostGIS"
        timestamp created_at
    }

    SENSOR {
        uuid id PK
        varchar nodo_id "Norte-01, Sur-02..."
        varchar nombre
        float lat
        float lng
        varchar estado "ok | warn | critical"
        geometry ubicacion "PostGIS Point"
    }

    LECTURA_SENSOR {
        uuid id PK
        uuid sensor_id FK
        float ndvi
        float humedad
        float temperatura
        float viento_kmh
        float pluviometria_mm
        float humectacion_hoja_pct
        timestamp created_at
    }

    INDICE_SATELITAL {
        int id PK
        float lat
        float lng
        geometry ubicacion "PostGIS Point"
        float ndvi
        float ndwi
        varchar calidad_suelo
        int cobertura_nube
        timestamp fecha
        varchar escena_id
        timestamp created_at
    }

    MUNICIPIO {
        int id PK
        varchar nombre
        varchar departamento
        geometry geometry "PostGIS MultiPolygon"
    }

    CONVERSACION {
        uuid id PK
        uuid usuario_id FK
        timestamp created_at
    }

    CONVERSACION ||--o{ MENSAJE : contiene
    MENSAJE {
        uuid id PK
        uuid conversacion_id FK
        varchar rol "usuario | ia"
        text contenido
        jsonb metadata
        timestamp created_at
    }

    USUARIO {
        uuid id PK
        varchar email UK
        varchar nombre
        varchar rol "investigador | productor"
        timestamp created_at
    }

    PLAN_RIEGO {
        uuid id PK
        uuid sensor_id FK
        uuid parcela_id FK
        varchar cultivo
        float umbral_humedad
        float humedad_actual
        float prob_lluvia_7d
        float prob_lluvia_14d
        float volumen_agua_m3_ha
        int frecuencia_dias
        varchar horario_optimo
        timestamp ventana_inicio
        timestamp ventana_fin
        text justificacion_xai
        varchar textura_suelo
        float et0_mm_dia
        float temperatura_media
        varchar estado "generado | activo | completado"
        timestamp created_at
    }

    TAREA {
        uuid id PK
        uuid usuario_id FK
        uuid plan_riego_id FK
        varchar titulo
        text descripcion
        varchar tipo "riego | fertilizacion | monitoreo"
        varchar prioridad "alta | media | baja"
        varchar estado "pendiente | en_progreso | completada"
        float litros_ha_total
        timestamp fecha_inicio
        timestamp fecha_fin
        timestamp created_at
    }
```

### 3.2 Notas del esquema

- **PostGIS** habilita `geometry` types. Municipios usan `MultiPolygon` para consultas espaciales ("qué municipio contiene este punto").
- **JSONB** en `analisis.datos_formulario` y `analisis.resultado_completo` para flexibilidad: cada tipo de análisis (simple/advanced) tiene campos distintos.
- **IndiceSatelital** almacena datos pre-procesados desde Sentinel-2 vía QGIS, con geometría y metadatos de escena.
- **PlanRiego** y **Tarea** son las tablas más nuevas: soportan el módulo de riego inteligente con trazabilidad XAI.
- Las lecturas de sensores son **time-series**. Para alto volumen futuro considerar TimescaleDB.
- LangGraph usa la tabla `conversaciones`/`mensajes` para persistir el estado del agente entre turnos.

### 3.3 Seed Data

```sql
-- Municipios del Caribe colombiano con geometría PostGIS
INSERT INTO municipios (nombre, departamento, geometry) VALUES
  ('Barranquilla', 'Atlántico', ST_GeomFromGeoJSON('...')),
  ('Soledad', 'Atlántico', ST_GeomFromGeoJSON('...')),
  ('Cartagena', 'Bolívar', ST_GeomFromGeoJSON('...')),
  ('Santa Marta', 'Magdalena', ST_GeomFromGeoJSON('...')),
  ('Montería', 'Córdoba', ST_GeomFromGeoJSON('...')),
  ('Valledupar', 'Cesar', ST_GeomFromGeoJSON('...')),
  ('Sincelejo', 'Sucre', ST_GeomFromGeoJSON('...')),
  ('Riohacha', 'La Guajira', ST_GeomFromGeoJSON('...'));

-- Sensores IoT demo
INSERT INTO sensores (nodo_id, nombre, lat, lng, estado, ubicacion) VALUES
  ('Norte-01', 'Nodo Norte', 10.50, -74.80, 'ok', ST_SetSRID(ST_MakePoint(-74.80, 10.50), 4326)),
  ('Sur-02', 'Nodo Sur', 10.48, -74.78, 'warn', ST_SetSRID(ST_MakePoint(-74.78, 10.48), 4326)),
  ('Este-03', 'Nodo Este', 10.52, -74.75, 'critical', ST_SetSRID(ST_MakePoint(-74.75, 10.52), 4326));
```

---

## 4. Pipeline de Análisis (Workflow)

```mermaid
graph TD
    A[Frontend: POST /analyze-location] --> B{Validar payload}
    B -->|Inválido| C[400 Error]
    B -->|Válido| D[Buscar clima]
    D --> E[OpenMeteo API]
    E --> F{Respuesta válida?}
    F -->|No| G[Mock climate data]
    F -->|Sí| H[Cachear en memoria]

    H --> I[Buscar NDVI en DB]
    G --> I
    I --> J{NDVI en tabla?}
    J -->|No| K[NDVI sintético 0.42]
    J -->|Sí| L[NDVI real Sentinel-2]

    K --> M[Obtener anomalía LSTM]
    L --> M
    M --> N{Modelo LSTM disponible?}
    N -->|Sí| O[Anomalías 6 meses]
    N -->|No| P[Sin anomalía]

    O --> Q[Motor de Recomendación Híbrido]
    P --> Q

    subgraph Q [Motor Híbrido]
        Q1[Reglas Agronómicas → filtro inicial]
        Q2[HistGradientBoosting → scoring fino]
        Q3{Cargó modelo ML?}
        Q3 -->|Sí| Q4[Predict proba + top 3]
        Q3 -->|No| Q5[CropClassifier heurístico]
        Q4 --> Q6[Ensemble ML+LSTM 60/40 si hay anomalías]
        Q6 --> Q7[Enriquecer: emoji, ciclo, rendimiento]
        Q5 --> Q7
    end

    Q7 --> R[Guardar en tabla analisis]
    R --> S[Response JSON al frontend]
```

### 4.1 Reglas Agronómicas (Filtro inicial en `model.py`)

Validación de rangos óptimos para cada cultivo con scoring por factores:

```python
# Extracto de CropClassifier.score_with_factors()
CROP_REQUIREMENTS = {
    "Maíz": {
        "temp_min": 24, "temp_max": 30,
        "ph_min": 5.5, "ph_max": 7.5,
        "humedad_min": 60, "humedad_max": 85,
        "precipitacion_min": 400, "precipitacion_max": 1200,
    },
    "Yuca": {
        "temp_min": 20, "temp_max": 35,
        "ph_min": 4.5, "ph_max": 8.0,
        "humedad_min": 50, "humedad_max": 80,
        "precipitacion_min": 500, "precipitacion_max": 1500,
    },
}
```

Si las variables están fuera de rango, el score del cultivo se penaliza drásticamente.

### 4.2 HistGradientBoosting (Scoring fino en `training.py`)

El modelo en producción es **HistGradientBoostingClassifier** (guardado como `crop_model_rf.joblib` por razones históricas):

```python
from sklearn.ensemble import HistGradientBoostingClassifier

model = HistGradientBoostingClassifier(
    max_iter=300,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
)
```

**Features de entrada (10):** temperatura, humedad, precipitación, pH, materia orgánica, NDVI, textura_encoded + 3 features ingenieriles (temp_hum_interaction, ph_mo_interaction, precip_hum_ratio).

**Salida:** Probabilidad de aptitud por cultivo (10 clases). Se combina con el score heurístico vía ensemble ponderado (60% ML, 40% reglas cuando hay anomalías LSTM).

**Precisión actual:** ~84.6% en datos sintéticos (evaluado con validación cruzada 5-fold + calibración con CalibratedClassifierCV). El modelo se entrena con 1000 muestras sintéticas por cultivo usando distribución triangular centrada en rangos óptimos + ruido gaussiano.

> El pipeline se envuelve en `CalibratedClassifierCV` (Platt scaling) para calibrar las probabilidades predichas, lo que mejora la precisión respecto al `HistGradientBoosting` sin calibrar (~62.5%). La calibración ajusta la confianza de las predicciones a la frecuencia observada de clases, crítica para un sistema de recomendación donde el score de probabilidad se muestra al usuario.

### 4.3 Ensamble ML + LSTM (en `inference.py`)

Cuando el modelo LSTM está disponible, se aplica un ensamble 60/40:

```
score_final = score_ml * 0.6 + lstm_factor * 0.4
```

Donde `lstm_factor` se calcula a partir de las anomalías proyectadas de temperatura, precipitación y humedad para los próximos 6 meses. Anomalías extremas reducen el score, condiciones favorables lo mantienen.

### 4.4 Mecanismo de Fallback (`inference.py`)

Carga lazy del modelo (`_load_model()`) con auto-entrenamiento si los archivos `.joblib` no existen:

1. **Intenta cargar** HistGradientBoosting + scaler desde disco
2. **Si no existen:** ejecuta `train_model()` con datos sintéticos
3. **Si falla:** retorna `CropClassifier` heurístico puro (sin `metodo: hist_gradient_boosting`)

---

## 5. Arquitectura del Chatbot (AgroAsesor IA)

### 5.1 Estado del Agente

```python
from typing import TypedDict

class AgentState(TypedDict):
    user_message: str
    user_id: str | None
    history_text: str
    search_keywords: str
    rag_results: list[str]
    db_context: str
    intent: str
    final_response: str
```

### 5.2 Flujo del Chat

```mermaid
graph TD
    A[Usuario escribe mensaje] --> B[POST /chat]
    B --> C[chat_service.process_chat_message]
    C --> D{LLM disponible?}
    D -->|Sí| E[LangGraph Agent]
    D -->|No| F[Keyword fallback]

    E --> G[Orquestador: clasificar intent + RAG + DB context]
    G --> H[Generador: Ollama gemma2:2b]
    H --> I[Respuesta con fuente: langgraph-agent]

    F --> J[Intent matching 17 categorías]
    J --> K[Respuesta con fuente: keyword-fallback]

    I --> L[Guardar mensajes en DB]
    K --> L
    L --> M[Response al frontend]
```

### 5.3 Sistema de 3 Capas

| Capa | Fuente | Activación |
|------|--------|------------|
| **LangGraph Agent** | Ollama gemma2:2b + RAG TF-IDF + DB context | Siempre que Ollama esté disponible |
| **LLM Directo** | Ollama gemma2:2b + RAG (sin herramientas) | Si el agent graph falla |
| **Keyword Fallback** | Matching de palabras clave + RAG snippets | Si Ollama no responde |

### 5.4 Clasificación de Intents (17 categorías en `graph.py`)

| Categoría | Keywords | Comportamiento |
|-----------|----------|----------------|
| `maiz` | maiz, maíz, cereal | RAG en doc de maíz |
| `yuca` | yuca, mandioca, casabe | RAG en doc de yuca |
| `platano` | platano, plátano, banano | RAG en doc de plátano |
| `arroz` | arroz, paddy | RAG en doc de arroz |
| `cacao` | cacao, chocolate | RAG en doc de cacao |
| `palma` | palma, aceite, palma aceitera | RAG en doc de palma |
| `name` | name, ñame | RAG en doc de ñame |
| `frijol` | frijol, fríjol, leguminosa | RAG en doc de frijol |
| `algodon` | algodon, algodón | RAG en doc de algodón |
| `sorgo` | sorgo | RAG en doc de sorgo |
| `plagas` | plaga, enfermedad, hongo, insecto | RAG en doc de plagas |
| `fertilizacion` | fertiliz, abono, nutriente, npk | RAG en doc de fertilización |
| `riego` | riego, regar, agua, sequía, drenaje | RAG + servicio de irrigación |
| `suelo` | suelo, ph, tierra, textura | RAG en doc de manejo de suelo |
| `clima` | clima, temperatura, lluvia, humedad | RAG + OpenMeteo |
| `ndvi` | ndvi, satélite, índice vegetación | RAG en doc de NDVI |
| `siembra` | siembra, sembrar, época, calendario | RAG en doc de épocas de siembra |

### 5.5 Módulo RAG (`rag_service.py`)

- **Vectorizer:** TF-IDF con n-gramas (1,2), max_features=5000, stopwords personalizadas
- **Indexación:** Documentos chunked por secciones (target 500 chars por chunk)
- **Búsqueda:** Cosine similarity sobre matriz TF-IDF → top-k por doc único
- **Fallback:** Keyword search con scoring por término cuando TF-IDF falla
- **Documentos:** 40+ archivos Markdown en `backend/data/rag/` cubriendo cultivos, plagas, fertilización, BPA, clima, NDVI, suelos, postcosecha, economía agrícola, etc.

### 5.6 Herramientas del Agente (`agent/tools.py`)

| Herramienta | Función | Fuente |
|-------------|---------|--------|
| `get_last_analysis` | Último análisis del usuario | Tabla `analisis` |
| `get_history_summary` | Resumen de últimos 5 análisis | Tabla `analisis` |
| `get_sensor_status` | Estado actual + última lectura de sensores | Tablas `sensores` + `lecturas_sensores` |

---

## 6. Docker Compose

### 6.1 Servicios (Actual — 3 contenedores)

```yaml
services:
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

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://agrocaribe:agrocaribe_secret@db:5432/agrocaribe
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      OLLAMA_BASE_URL: http://ollama:11434
      OLLAMA_MODEL: gemma2:2b
      ENVIRONMENT: ${ENVIRONMENT:-development}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
      OPENMETEO_BASE_URL: https://api.open-meteo.com/v1
      CORS_ORIGINS: http://localhost:5173,http://localhost
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      ollama:
        condition: service_started
    restart: unless-stopped
    networks:
      - backend_net

volumes:
  pgdata:
    driver: local
  ollama_data:
    driver: local

networks:
  backend_net:
    driver: bridge
```

### 6.2 Arquitectura de Servicios

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  :80        │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐     ┌─────────▼──────────┐
     │   Backend        │     │   Frontend (SPA)   │
     │   FastAPI :8000  │     │   Vite /dist       │
     └────────┬─────────┘     └────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼──────┐     ┌──────▼──────┐
│   DB      │     │   Ollama    │
│  PostGIS  │     │  gemma2:2b  │
│  :5432    │     │  :11434     │
└───────────┘     └─────────────┘
```

**Supabase solo se usa para autenticación (Auth).** La base de datos principal es PostgreSQL local vía PostGIS. No hay dependencia de Supabase DB.

### 6.3 Variables de Entorno

```
# .env
DATABASE_URL=postgresql+asyncpg://agrocaribe:agrocaribe_secret@localhost:5432/agrocaribe
SUPABASE_URL=https://hpmjbgqjwopxlgurczna.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
ENVIRONMENT=development
LOG_LEVEL=DEBUG
OPENMETEO_BASE_URL=https://api.open-meteo.com/v1
CORS_ORIGINS=http://localhost:5173,http://localhost
```

### 6.4 Uso

```bash
# Desarrollo local (sin Docker)
cd backend && uvicorn app.main:app --reload        # Terminal 1
npm run dev                                          # Terminal 2
ollama pull gemma2:2b                                # Una vez, para el chat

# Con Docker (stack completo)
docker compose up -d
docker compose logs -f backend

# Verificar healthcheck
docker compose ps
# agrocaribe-db      should be "healthy"
# agrocaribe-ollama  should be "up"
# backend            should be "up"

# Acceder
# API:      http://localhost:8000/docs
# DB:       localhost:5432 (usuario: agrocaribe)
# Ollama:   http://localhost:11434
```

---

## 7. Módulo de Riego Inteligente

### 7.1 Arquitectura

El módulo de riego (`irrigation_service.py`) genera planes de riego personalizados basados en:

1. **Lectura actual del sensor IoT** → humedad del suelo en tiempo real
2. **Umbral por cultivo** → estrés hídrico (Maíz: 20%, Yuca: 18%, Arroz: 30%, etc.)
3. **Proyección climática** → probabilidad de lluvia a 7 y 14 días (vía `prediction_service.py`)
4. **Textura del suelo** → factor de retención (arenoso: 1.3, arcilloso: 0.75)
5. **ISRIC SoilGrids** → datos reales de textura para la coordenada
6. **ET0 de referencia** → evapotranspiración base por cultivo

### 7.2 Explicabilidad (XAI)

Cada plan incluye `justificacion_xai` en lenguaje natural explicando:

```
Plan sugerido para compensar 7 días de ausencia de lluvias
(probabilidad estimada: 20%) y radiación solar extrema
(18.0 MJ/m2/día). La humedad del suelo actual (15%) está
por debajo del umbral crítico para Maíz (20%).
El suelo franco-arenoso tiene alta capacidad de drenaje,
requiriendo riego más frecuente.
```

### 7.3 Cálculo de Volumen

```
volumen = ET0_ajustada * factor_textura * factor_raiz * 7 días
frecuencia = 3 días (franco) | 2 días (arenoso) | 4 días (arcilloso)
horario_optimo = 05:00 - 07:00 (mínima evaporación)
```

---

## 8. Modelo de Machine Learning

### 8.1 Pipeline de Entrenamiento

El modelo se entrena con datos **sintéticos** generados por distribución triangular + ruido gaussiano:

```
1000 muestras/cultivo × 10 cultivos = 10,000 muestras
Features: temperatura, humedad, precipitación, pH, MO, NDVI, textura
          + temp_hum_interaction, ph_mo_interaction, precip_hum_ratio
Algoritmo: HistGradientBoosting (max_iter=300, max_depth=6)
Validación: StratifiedKFold 5-fold + CalibratedClassifierCV → accuracy ~84.6%
```

### 8.2 Modelo LSTM (`lstm_model.py`)

- **Arquitectura:** Input(12 meses, 3 features) → LSTM(32) → Dropout(0.2) → LSTM(16) → Dropout(0.2) → Dense(6×3)
- **Datos:** Series sintéticas basadas en climatología NASA POWER para el Caribe colombiano
- **Salida:** Anomalías de temperatura, precipitación y humedad para los próximos 6 meses
- **Confianza:** Calculada dinámicamente según la magnitud de las anomalías (max_temp_anomalía / 10)

### 8.3 Precisión vs. Documentación Anterior

| Métrica | Valor Anterior (Doc) | Valor Real (Código) | Nota |
|---------|---------------------|---------------------|------|
| Algoritmo | Random Forest | HistGradientBoosting + CalibratedClassifierCV | Mejor performance en tabular |
| Accuracy | ~94% | ~84.6% | Datos sintéticos con ruido realista + calibración Platt |
| Clases | 6 cultivos | 10 cultivos | Mayor granularidad |
| Features | 7 raw | 10 (7 raw + 3 engineered) | Interacciones incluidas |
| LSTM | No existía | 2 capas, 6 meses forecast | Nuevo desde Fase 3 |

---

## 9. Dependencias (requirements.txt)

```txt
fastapi==0.115.0
uvicorn[standard]==0.34.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.0
geoalchemy2==0.15.2
pydantic-settings==2.7.0
pydantic[email]==2.10.0
httpx<0.28
scikit-learn==1.6.1
pandas==2.2.3
numpy==2.1.3
python-dotenv==1.0.1
pyjwt==2.10.1
python-dateutil==2.9.0
langgraph==0.3.0
langchain-core==0.3.0
tensorflow==2.21.0
joblib==1.5.3
cachetools==5.5.0
rasterio>=1.4.0
lxml>=5.3.0
```

---

## 10. Plan de Implementación — Estado Actual

### ✅ Fase MVP (Completada) — Backend funcional

| Actividad | Estado |
|-----------|--------|
| Scaffold FastAPI + Docker | ✅ Completado |
| PostgreSQL + PostGIS + Alembic | ✅ Completado |
| Modelos: municipios, analisis, usuario | ✅ Completado |
| GET /municipalities | ✅ Completado |
| GET /history | ✅ Completado |
| POST /analyze-location con motor de reglas | ✅ Completado |
| GET /climate (proxy OpenMeteo) | ✅ Completado |
| GET /satellite-indicators | ✅ Completado |
| Docker Compose (db + backend) | ✅ Completado |

### ✅ Fase 2 (Completada) — ML + Chat

| Actividad | Estado |
|-----------|--------|
| Entrenar HistGradientBoosting con dataset sintético | ✅ Completado |
| Integrar modelo en POST /analyze-location | ✅ Completado |
| Módulo de inferencia con fallback | ✅ Completado |
| POST /chat con RAG + LLM + keyword fallback | ✅ Completado |
| Sistema de RAG con TF-IDF (40+ documentos) | ✅ Completado |
| Modelos conversaciones + mensajes | ✅ Completado |
| Cliente Ollama (gemma2:2b) | ✅ Completado |
| Docker Compose con Ollama | ✅ Completado |

### ✅ Fase 3 (Completada) — Sensores, Riego, Escenarios

| Actividad | Estado |
|-----------|--------|
| Agente LangGraph con herramientas | ✅ Completado |
| Modelos sensores + lecturas_sensores | ✅ Completado |
| GET /sensors + GET /sensors/{id}/readings | ✅ Completado |
| POST /sensors/readings (ingesta IoT) | ✅ Completado |
| POST /predict (proyección fenológica 6 meses) | ✅ Completado |
| POST /predict/optimal-day (ventana óptima de siembra) | ✅ Completado |
| POST /predict/scenario (simulador El Niño/La Niña) | ✅ Completado |
| Modelo LSTM para anomalías climáticas | ✅ Completado |
| GET /soil/data (ISRIC SoilGrids) | ✅ Completado |
| POST /irrigation-plans (plan de riego inteligente) | ✅ Completado |
| Modelos plan_riego + tarea | ✅ Completado |
| DELETE /history/{id} | ✅ Completado |
| GET /analysis/{id} | ✅ Completado |
| POST /geo/decode (reverse geocode PostGIS) | ✅ Completado |
| GET /dashboard/summary | ✅ Completado |
| GET /reports/alerts + /compare + /export | ✅ Completado |
| GET /chat/test-llm | ✅ Completado |
| Persistencia de conversaciones en PostgreSQL | ✅ Completado |
| POST /auth/login (Supabase Auth) | ✅ Completado |
| GET /irrigation-plans/thresholds | ✅ Completado |

### 📋 Fase 4 (Próximo) — Producción y Optimización

| Actividad | Prioridad |
|-----------|-----------|
| Tests unitarios y de integración completos | Alta |
| Rate limiting y middleware de seguridad | Alta |
| Paginación en GET /history | Media |
| Caché Redis para OpenMeteo y SoilGrids | Media |
| Migrar a pgvector para RAG semántico | Baja |
| Dashboard de monitoreo de ML (accuracy drift) | Baja |
| Despliegue con CI/CD (GitHub Actions) | Media |

---

## Referencias

- [[../2-backend/TASKS]] — Seguimiento de implementación por fase
- [[../4-arquitectura/ARQUITECTURA_DB]] — Esquema detallado de la base de datos
- [[../4-arquitectura/MODULO_CLIMA]] — Servicio climático (OpenMeteo + NASA POWER + LSTM)
- [[../4-arquitectura/MODULO_SATELITAL]] — Servicio satelital (Sentinel-2 + NDVI + índices)
- [[../4-arquitectura/MODULO_RECOMENDACION]] — Motor híbrido de recomendación (ML + reglas)
- [[../4-arquitectura/MODULO_SUELO_SOILGRIDS]] — Integración SoilGrids ISRIC v2.0
- [[../4-arquitectura/MODULO_RIEGO]] — Planificación inteligente de riego
- [[../4-arquitectura/FLUJO_DATOS]] — Mapa de conexión Frontend-Backend
- [[../4-arquitectura/DESPLIEGUE]] — Docker y producción
- [[../4-arquitectura/GUIAS_QGIS]] — Guía para procesar imágenes satelitales
- [[CHAT_2025-05-19]] — Contexto de sesión (chat completado)
- [[referencia]] — Referencia completa de API y endpoints
