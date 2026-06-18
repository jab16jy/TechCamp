---
titulo: "Referencia de API — AgroCaribe IA"
proyecto: AgroCaribe IA
tags: [api, endpoints, referencia, fastapi, schemas]
---

# Referencia de API

## 1. Endpoints (25+)

### 1.1 Contrato Completo

| Método | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| `GET` | `/health` | Health check del backend | ✅ |
| `GET` | `/municipalities` | Lista de municipios con geometría PostGIS | ✅ |
| `POST` | `/analyze-location` | Análisis completo de aptitud de cultivos | ✅ |
| `GET` | `/analysis/{id}` | Detalle de un análisis por ID (UUID o prefijo 8 chars) | ✅ |
| `GET` | `/climate` | Clima actual desde OpenMeteo (`lat`, `lng` query) | ✅ |
| `GET` | `/satellite-indicators` | NDVI/NDWI más cercano desde tabla satelital | ✅ |
| `GET` | `/history` | Historial de análisis con JOIN a municipios | ✅ |
| `DELETE` | `/history/{id}` | Eliminar entrada del historial (UUID o prefijo 8 chars) | ✅ |
| `POST` | `/predict` | Proyección fenológica a 6 meses (NASA POWER + OpenMeteo) | ✅ |
| `POST` | `/predict/optimal-day` | Ventana óptima de siembra en próximos 90 días | ✅ |
| `POST` | `/predict/scenario` | Simulador de escenarios climáticos (El Niño/La Niña) | ✅ |
| `GET` | `/soil/data` | Datos de suelo desde ISRIC SoilGrids v2.0 | ✅ |
| `POST` | `/irrigation-plans` | Generar plan de riego inteligente | ✅ |
| `GET` | `/irrigation-plans/{id}` | Obtener plan de riego por ID | ✅ |
| `GET` | `/irrigation-plans/thresholds` | Umbrales de riego por cultivo | ✅ |
| `GET` | `/sensors` | Lista de sensores IoT con última lectura | ✅ |
| `GET` | `/sensors/{id}/readings` | Lecturas históricas de un sensor | ✅ |
| `POST` | `/sensors/readings` | Registrar nueva lectura de sensor | ✅ |
| `POST` | `/chat` | AgroAsesor: chatbot con RAG + LLM + fallback | ✅ |
| `GET` | `/chat/test-llm` | Verificar disponibilidad del LLM | ✅ |
| `POST` | `/geo/decode` | Reverse geocoding via PostGIS `ST_Contains` | ✅ |
| `POST` | `/auth/login` | Autenticación contra Supabase Auth | ✅ |
| `GET` | `/dashboard/summary` | Resumen del dashboard principal | ✅ |
| `GET` | `/reports/alerts` | Alertas automáticas del sistema | ✅ |
| `POST` | `/reports/compare` | Comparar dos o más análisis | ✅ |
| `POST` | `/reports/export` | Exportar reporte en formato estructurado | ✅ |

---

## 2. Endpoints Clave — Especificación Detallada

### 2.1 `POST /analyze-location`

Endpoint principal de análisis de aptitud de cultivos. Ejecuta el pipeline completo: clima, NDVI, anomalías LSTM y motor de recomendación híbrido.

```json
// Request
{
  "departamento": "Bolívar",
  "municipio": "Turbaco",
  "lat": 10.33,
  "lng": -75.41,
  "tipo_suelo": "Franco-Arcilloso",
  "acceso_riego": true,
  "mes_siembra": "Mayo",
  "area_hectareas": 5.0,
  "ph_suelo": 6.5,
  "materia_organica": 3.2,
  "textura_suelo": "Franco"
}

// Response 200
{
  "clima": {
    "temperatura": 29.1,
    "precipitacion": 74.5,
    "humedad": 78.0,
    "viento": 12.5
  },
  "indicadores_satelite": {
    "ndvi": 0.42,
    "ndwi": 0.18,
    "calidad_suelo": "moderado",
    "cobertura_nube": 15
  },
  "recomendaciones": [
    {
      "cultivo": "Maíz",
      "score": 86,
      "riesgo": "medio",
      "justificacion": "Temperatura y precipitación dentro del rango óptimo. Suelo franco con pH 6.5 ideal.",
      "emoji": "🌽",
      "ciclo_dias": 90,
      "rendimiento_estimado": "4.2 t/ha",
      "metodo": "hist_gradient_boosting",
      "probabilidad": 0.86
    }
  ],
  "anomalia": {
    "temp_anomalies": [],
    "precip_anomalies": [],
    "humedad_anomalies": []
  },
  "ubicacion": {
    "lat": 10.33,
    "lng": -75.41
  },
  "es_mock": false
}
```

**Pipeline interno:**
1. Validar request (Pydantic)
2. Obtener clima → OpenMeteo API (o mock si falla)
3. Obtener NDVI → lookup pre-procesado en tabla `indices_satelitales`
4. Obtener anomalía climática → LSTM (si disponible)
5. Ejecutar motor de recomendación híbrido (reglas + HistGradientBoosting + CalibratedClassifierCV)
6. Guardar análisis en DB (tabla `analisis`)
7. Retornar respuesta con `metodo` y `probabilidad` por cultivo

---

### 2.2 `POST /predict`

Proyección fenológica a 6 meses. Acepta `analysis_id` para heredar datos de un análisis previo, o coordenadas directas.

```json
// Request
{
  "lat": 10.33,
  "lng": -75.41,
  "cultivo": "Maíz",
  "meses": 6,
  "npk_override": 120,
  "riego_override": 75,
  "fecha_siembra": "2025-04-01"
}

// Response 200
{
  "ubicacion": { "lat": 10.33, "lng": -75.41 },
  "meses": [
    {
      "mes": "Mayo",
      "temp_media": 28.3,
      "precipitacion": 120.0,
      "humedad": 80.0,
      "ndvi_estimado": 0.52,
      "score": 86,
      "alertas": []
    }
  ],
  "mejor_mes": "Mayo",
  "mejor_cultivo": "Maíz",
  "best_window": {
    "fecha_inicio": "2025-05-01",
    "dias_optimos": 25
  },
  "alertas_globales": [],
  "alertas_patrones": [],
  "fuente": "NASA POWER + OpenMeteo + NDVI: Sentinel-2 BD + Suelo: ISRIC SoilGrids v2.0"
}
```

---

### 2.3 `POST /predict/optimal-day`

Encuentra la ventana óptima de siembra en los próximos 90 días. Analiza temperatura, precipitación y fenología del cultivo seleccionado. Retorna `fecha_inicio` y `dias_optimos`.

### 2.4 `POST /predict/scenario`

Simulador de escenarios climáticos **what-if** con presets predefinidos:

| Preset | Precipitación | Temperatura | NPK | Riego |
|--------|---------------|-------------|-----|-------|
| `nino` | -30% | +3.0°C | 140 | 90% |
| `nina` | +40% | -1.5°C | 100 | 40% |
| `normal` | 0% | 0.0°C | 120 | 75% |

El usuario puede sobrescribir cualquier delta individualmente.

### 2.5 `DELETE /history/{id}`

Elimina un análisis del historial. Soporta búsqueda por UUID completo o por prefijo de 8 caracteres (formato `C-0421` → UUID match).

### 2.6 `GET /analysis/{id}`

Retorna detalle completo de un análisis por ID (UUID o prefijo de 8 chars).

### 2.7 `GET /sensors` / `GET /sensors/{id}/readings` / `POST /sensors/readings`

CRUD completo de sensores IoT y sus lecturas. Incluye joins optimizados con subquery para obtener la última lectura de cada sensor en una sola consulta.

### 2.8 `GET /reports/alerts`

Genera alertas automáticas basadas en:
- Sensores en estado `warn` o `critical`
- Análisis con score < 50%
- Lecturas anormales (NDVI bajo, humedad crítica, temperatura elevada)

### 2.9 `POST /geo/decode`

Reverse geocoding usando PostGIS `ST_Contains`: dada una coordenada, retorna municipio y departamento.

---

## 3. Schemas Pydantic

Los schemas de validación viven en `backend/app/schemas/` y cubren toda la superficie de la API:

### 3.1 `schemas/analisis.py`

| Schema | Campos principales | Uso |
|--------|-------------------|-----|
| `AnalyzeRequest` | `departamento`, `municipio`, `lat`, `lng`, `tipo_suelo`, `acceso_riego`, `mes_siembra`, `area_hectareas`, `ph_suelo`, `materia_organica`, `textura_suelo` | Input de `POST /analyze-location` |
| `AnalyzeResponse` | `clima: ClimateData`, `indicadores_satelite: SatelliteData`, `recomendaciones: list[Recomendacion]`, `anomalia`, `ubicacion`, `es_mock` | Output de `POST /analyze-location` |
| `HistorialEntry` | `id`, `municipio`, `departamento`, `cultivo_recomendado`, `score`, `created_at` | Item del historial |
| `MunicipioResponse` | `id`, `nombre`, `departamento` | Listado de municipios |

### 3.2 `schemas/clima.py`

| Schema | Campos principales | Uso |
|--------|-------------------|-----|
| `ClimateData` | `temperatura`, `precipitacion`, `humedad`, `viento`, `fuente` | Datos climáticos actuales |
| `AnomaliaClimatica` | `temp_anomalies: list[float]`, `precip_anomalies`, `humedad_anomalies`, `confianza` | Anomalías LSTM |

### 3.3 `schemas/satelite.py`

| Schema | Campos | Uso |
|--------|--------|-----|
| `SatelliteData` | `ndvi`, `ndwi`, `calidad_suelo`, `cobertura_nube`, `fuente` | Indicadores satelitales |

### 3.4 `schemas/predict.py`

| Schema | Campos | Uso |
|--------|--------|-----|
| `PredictRequest` | `lat`, `lng`, `cultivo`, `meses`, `npk_override`, `riego_override`, `fecha_siembra`, `analysis_id` | Input de proyección |
| `PredictResponse` | `ubicacion`, `meses: list[MonthlyProjection]`, `mejor_mes`, `mejor_cultivo`, `best_window`, `alertas_globales` | Output de proyección |
| `OptimalDay` | `fecha_inicio`, `dias_optimos`, `score`, `factores` | Ventana óptima de siembra |
| `Scenario` | `nombre`, `delta_temp`, `delta_precip`, `delta_npk`, `delta_riego` | Escenario what-if |

### 3.5 `schemas/chat.py`

| Schema | Campos | Uso |
|--------|--------|-----|
| `ChatRequest` | `message`, `conversacion_id` (opcional) | Input del chat |
| `ChatResponse` | `response`, `source`, `conversacion_id`, `rag_snippets` | Output del chat |

### 3.6 `schemas/auth.py`

| Schema | Campos | Uso |
|--------|--------|-----|
| `LoginRequest` | `email`, `password` | Input de login |
| `TokenResponse` | `access_token`, `token_type`, `user: UserInfo` | Output de login |
| `UserInfo` | `id`, `email`, `nombre`, `rol` | Datos del usuario autenticado |

### 3.7 `schemas/sensor.py`

| Schema | Campos | Uso |
|--------|--------|-----|
| `SensorResponse` | `id`, `nodo_id`, `nombre`, `lat`, `lng`, `estado`, `ultima_lectura` | Sensor con su última lectura |
| `LecturaResponse` | `id`, `sensor_id`, `ndvi`, `humedad`, `temperatura`, `viento_kmh`, `pluviometria_mm`, `humectacion_hoja_pct`, `created_at` | Lectura individual |
| `CreateLecturaRequest` | `sensor_id`, `ndvi`, `humedad`, `temperatura`, `viento_kmh`, `pluviometria_mm`, `humectacion_hoja_pct` | Input para nueva lectura |

### 3.8 `schemas/irrigation.py`

| Schema | Campos | Uso |
|--------|--------|-----|
| `IrrigationPlanRequest` | `sensor_id`, `cultivo`, `area_hectareas` | Input de plan de riego |
| `IrrigationPlanResponse` | `id`, `cultivo`, `umbral_humedad`, `humedad_actual`, `volumen_agua_m3_ha`, `frecuencia_dias`, `horario_optimo`, `justificacion_xai` | Plan generado |

---

## 4. Ejemplos de Llamadas

### 4.1 Análisis de cultivos

```bash
curl -X POST http://localhost:8000/analyze-location \
  -H "Content-Type: application/json" \
  -d '{
    "departamento": "Bolívar",
    "municipio": "Turbaco",
    "lat": 10.33,
    "lng": -75.41,
    "tipo_suelo": "Franco-Arcilloso",
    "acceso_riego": true,
    "mes_siembra": "Mayo",
    "area_hectareas": 5.0,
    "ph_suelo": 6.5,
    "materia_organica": 3.2,
    "textura_suelo": "Franco"
  }'
```

### 4.2 Proyección fenológica

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 10.33,
    "lng": -75.41,
    "cultivo": "Maíz",
    "meses": 6,
    "npk_override": 120,
    "riego_override": 75,
    "fecha_siembra": "2025-04-01"
  }'
```

### 4.3 Chat AgroAsesor

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cómo controlo el gusano cogollero en maíz?"
  }'
```

### 4.4 Simulación de escenario (El Niño)

```bash
curl -X POST http://localhost:8000/predict/scenario \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "nino",
    "lat": 10.33,
    "lng": -75.41,
    "cultivo": "Maíz",
    "fecha_siembra": "2025-04-01"
  }'
```

### 4.5 Plan de riego inteligente

```bash
curl -X POST http://localhost:8000/irrigation-plans \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": "uuid-del-sensor",
    "cultivo": "Maíz",
    "area_hectareas": 5.0
  }'
```

### 4.6 Obtener datos de suelo desde coordenada

```bash
curl -X GET "http://localhost:8000/soil/data?lat=10.33&lng=-75.41"
```

### 4.7 Reverse geocoding

```bash
curl -X POST http://localhost:8000/geo/decode \
  -H "Content-Type: application/json" \
  -d '{"lat": 10.33, "lng": -75.41}'
```

### 4.8 Sensores — última lectura de cada sensor

```bash
curl http://localhost:8000/sensors
```

### 4.9 Historial de análisis

```bash
curl "http://localhost:8000/history?tipo=simple&limit=10"
```

### 4.10 Dashboard

```bash
curl http://localhost:8000/dashboard/summary
```

---

## 5. Data Flow Diagrams

### 5.1 Mapa de conexión Frontend ↔ Backend

```
Frontend (api.js)                   Backend (api/)                 Fuente
──────────────────────────────────────────────────────────────────────────
GET /municipalities          →   api/municipios.py       →   PostgreSQL
POST /analyze-location       →   api/analisis.py         →   OpenMeteo + NDVI + ML
                                services/climate_service
                                services/satellite_service
                                services/recommendation
                                ml/inference
GET /climate                 →   api/clima.py            →   OpenMeteo
GET /satellite-indicators    →   api/satelite.py         →   PostgreSQL (nearest NDVI)
GET /history                 →   api/historial.py        →   PostgreSQL + Municipios
DELETE /history/{id}         →   api/historial.py        →   PostgreSQL
GET /analysis/{id}           →   api/analisis.py         →   PostgreSQL (analisis detail)
POST /auth/login             →   api/auth.py             →   Supabase Auth
POST /chat                   →   api/chat.py             →   RAG + LangGraph + Ollama
                                services/chat_service
                                services/rag_service
                                services/llm_service
GET /sensors                 →   api/sensores.py         →   PostgreSQL
GET /sensors/{id}/readings   →   api/sensores.py         →   PostgreSQL (lecturas)
POST /sensors/readings       →   api/sensores.py         →   PostgreSQL (insert)
POST /geo/decode             →   api/geo.py              →   PostgreSQL (ST_Contains)
POST /predict                →   api/predict.py          →   NASA POWER + OpenMeteo
                                services/prediction_service
POST /predict/optimal-day    →   api/predict.py          →   NASA POWER + OpenMeteo
POST /predict/scenario       →   api/predict.py          →   NASA POWER + OpenMeteo
GET /reports/alerts          →   api/reports.py          →   PostgreSQL (sensores + analisis)
POST /reports/compare        →   api/reports.py          →   PostgreSQL (analisis)
POST /reports/export         →   api/reports.py          →   PostgreSQL (analisis)
GET /dashboard/summary       →   api/dashboard.py        →   PostgreSQL (analisis + sensores)
GET /soil/data               →   api/soil.py             →   ISRIC SoilGrids REST API
POST /irrigation-plans       →   api/irrigation.py       →   PostgreSQL + ET0 calculation
GET /irrigation-plans/{id}   →   api/irrigation.py       →   PostgreSQL
GET /irrigation-plans/thresholds → api/irrigation.py    →   Cultivo-specific thresholds
```

### 5.2 Flujo de un análisis típico

```
Usuario completa formulario en AnalisisCultivos
  → departamento, municipio, lat, lng, tipo_suelo, mes_siembra, area_hectareas, ph, MO, textura
  (pH, MO y textura se autocompletan via SoilGrids al hacer clic en el mapa)
  ↓
useAnalisisCultivos.handleSubmit()
  ↓
AnalysisService.performAnalysis(formulario)
  ↓
POST /analyze-location (JSON body)
  ↓
Backend:
1. climate_service.get_climate_data() → OpenMeteo API
2. satellite_service.get_satellite_data() → nearest NDVI from PostgreSQL
3. inference.predict_crop_recommendations() → HistGradientBoosting + fallback heurístico
4. Guardar en analisis (datos_formulario JSONB + resultado_completo JSONB)
5. Retornar AnalyzeResponse
  ↓
Frontend recibe datos → Zustand setResultado() → agrega al historial
  ↓
Navega a /resultado → AnalysisResults muestra reporte
```

### 5.3 Flujo AgroAsesor (Chat + RAG + LangGraph + Ollama)

```
Usuario escribe "¿cómo controlo el gusano cogollero en maíz?"
  ↓
POST /chat {"message": "¿cómo controlo el gusano cogollero en maíz?"}
  ↓
chat_service.process_chat_message()
  ↓
1. Guardar mensaje en conversaciones + mensajes
2. Buscar intención:
   - Keywords: "maíz", "gusano", "cogollero", "plaga"
   - Coincide con: plagas-enfermedades (17 intenciones total)
3. search_rag(query, k=3):
   - Keyword scoring sobre 40+ documentos agronómicos en backend/data/rag/
   - Retorna chunks del doc de plagas + maíz
4. _gather_db_context():
   - Último análisis del usuario
   - Estado de sensores
5. Si hay Ollama disponible:
   - LangGraph Agent genera respuesta con contexto RAG + DB
6. Si no:
   - Formatear respuesta con RAG context + DB context template (keyword fallback)
7. Guardar mensaje IA en mensajes
8. Retornar respuesta
```

### 5.4 Flujo IA Predictiva (Proyección 6 meses)

```
Usuario va a IA Predictiva
  ↓
usePrediccion.js carga coordenadas (manualmente o desde GET /history)
  ↓
Usuario selecciona análisis del historial o ingresa coordenadas manuales
  ↓
Usuario ajusta sliders de fertilización (NPK) y riego
  ↓
Clic en "Generar Proyección"
  ↓
POST /predict {"lat", "lng", "analysis_id", "meses": 3, "npk_override", "riego_override"}
  ↓
prediction_service.project_window()
  ↓
1. fetch_nasa_climatology(lat, lng) → NASA POWER (promedios históricos mensuales)
2. fetch_current_climate(lat, lng) → OpenMeteo
3. Anomalía: current - historical mean
4. Si analysis_id: resolver datos heredados (cultivo, pH, MO, textura)
5. Para cada mes (próximos 6):
   a. Proyectar clima: historical_month + anomaly * decay_factor(exp(-0.3*i))
   b. Aplicar NPK_override y riego_override como factores de ajuste
   c. score_with_factors() → incorpora temp, humedad, precip, pH, MO, textura, NDVI, NPK, riego
   d. Detectar riesgo de enfermedades (Roya si humedad > 80% y temp 20-25°C)
6. Identificar mejor mes, mejor cultivo, ventana óptima de siembra
  ↓
Response: meses[], factor_weights[], alertas_globales[], best_window{}
  ↓
Frontend renderiza:
  - MonthlyProjectionGrid: grid 6 meses con stats climáticos + cultivos
  - FeatureChart: factores de influencia (barras)
  - SimulationSection: riesgo de inundación/sequía/rayos/Niño
  - ClimateRiskPanel: alertas climáticas
  - MitigationActions: acciones de mitigación sugeridas
```

### 5.5 Flujo SoilGrids (Datos de Suelo Automáticos)

```
Usuario hace clic en el mapa (MapSelector) o dibuja un área
  ↓
handleMapChange() en useAnalisisCultivos.js
  ↓
GET /soil/data?lat=10.33&lng=-75.41
  ↓
soil_service.get_soil_data()
  → POST rest.isric.org/soilgrids/v2.0/properties/query
  → phh2o, soc, sand, silt, clay
  → ph directo, MO = SOC * 1.724 / 10, textura = triángulo USDA
  ↓
Response: { ph, materia_organica, textura_suelo, fuente }
  ↓
actualizarFormulario() → toast informativo "Datos de suelo cargados"
  ↓
Usuario puede sobrescribir manualmente los valores
```

### 5.6 Flujo Motor Híbrido (HistGradientBoosting + Heurístico)

```
recommendation.generate_recommendations()
  ↓
inference.predict_crop_recommendations()
  ↓
1. Cargar modelo ML (crop_model_rf.joblib + crop_scaler.joblib)
2. Si modelo existe:
   - HistGradientBoosting.predict_proba() → probabilidades por cultivo
   - CalibratedClassifierCV ajusta confianza (Platt scaling)
   - score = int(prob * 100)
   - metodo = "hist_gradient_boosting", probabilidad = prob
3. Si modelo no existe o falla:
   - Fallback a CropClassifier.score() (reglas heurísticas)
   - metodo = "heuristico", probabilidad = null
  ↓
Enriquecer con metadatos del CSV (emoji, ciclo, rendimiento)
  ↓
Retornar top 3 + método usado
```

### 5.7 Flujo Plan de Riego Inteligente

```
Usuario va a SensoresIoT → panel de riego
  ↓
Selecciona sensor/cultivo o ingresa datos manualmente
  ↓
POST /irrigation-plans {"sensor_id", "cultivo", "area_hectareas"}
  ↓
irrigation_service.generate_irrigation_plan()
  ↓
1. Obtener datos climáticos actuales (OpenMeteo)
2. Calcular ET0 (Penman-Monteith simplificado)
3. Obtener textura de suelo (SoilGrids o manual)
4. Calcular balance hídrico: lluvia - ET0
5. Generar programación: frecuencia, volumen, duración
6. Aplicar umbrales específicos por cultivo
  ↓
Response: plan_riego con schedule semanal + volumen total
  ↓
Frontend muestra plan con opción de exportar a tareas
```

---

## 6. Migración del Frontend

El frontend consume estos endpoints principales desde `api.js`:

| Función Frontend | Endpoint Backend | Estado |
|-----------------|-----------------|--------|
| `getMunicipios()` | `GET /municipalities` | ✅ Real |
| `analizarUbicacion()` | `POST /analyze-location` | ✅ Real |
| `getClima()` | `GET /climate` | ✅ Real |
| `getIndicadoresSatelite()` | `GET /satellite-indicators` | ✅ Real |
| `getHistorial()` | `GET /history` | ✅ Real |
| `deleteHistorial()` | `DELETE /history/{id}` | ✅ Real |
| `sendChatMessage()` | `POST /chat` | ✅ Real |
| `getSensores()` | `GET /sensors` | ✅ Real |
| `getAlertas()` | `GET /reports/alerts` | ✅ Real |
| `predecir()` | `POST /predict` | ✅ Real |

Los mecanismos de fallback mock en `api.js` ya no son necesarios para la mayoría de endpoints, pero permanecen como safety net.

---

## Referencias

- [[backend]] — Arquitectura del backend (stack, DB, pipelines, infra)
- [[../4-arquitectura/ARQUITECTURA_DB]] — Esquema detallado de la base de datos
- [[../4-arquitectura/MODULO_CLIMA]] — Servicio climático (OpenMeteo + NASA POWER + LSTM)
- [[../4-arquitectura/MODULO_SATELITAL]] — Servicio satelital (Sentinel-2 + NDVI)
- [[../4-arquitectura/MODULO_RECOMENDACION]] — Motor híbrido de recomendación
- [[../4-arquitectura/FLUJO_DATOS]] — Mapa completo de conexión Frontend-Backend
- [[../4-arquitectura/DESPLIEGUE]] — Docker y producción
- [[../3-frontend/ARQUITECTURA_FRONTEND]] — Documentación del frontend
