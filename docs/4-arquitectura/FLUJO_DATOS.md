---
titulo: "Flujo de Datos Completo"
proyecto: AgroCaribe IA
tags: [flujo, datos, pipeline, integracion]
---

# Flujo de Datos Completo

## Mapa de conexion Frontend ↔ Backend

```
Frontend (api.js)                   Backend (api/)                 Fuente
──────────────────────────────────────────────────────────────────────────
GET /municipalities          →   api/municipios.py       →   PostgreSQL
POST /analyze-location       →   api/analisis.py         →   OpenMeteo + NDVI
                                services/climate_service (+ PostgreSQL)
                                services/satellite_service
                                services/recommendation
GET /climate                 →   api/clima.py            →   OpenMeteo
GET /satellite-indicators    →   api/satelite.py         →   PostgreSQL (nearest NDVI)
GET /history                 →   api/historial.py        →   PostgreSQL + Municipios
POST /auth/login             →   api/auth.py             →   Supabase Auth
POST /chat                   →   api/chat.py             →   RAG + LangChain + PostgreSQL
                                services/chat_service
                                services/rag_service
GET /sensors                 →   api/sensores.py         →   PostgreSQL
GET /sensors/{id}/readings   →   api/sensores.py         →   PostgreSQL (lecturas)
POST /sensors/readings       →   api/sensores.py         →   PostgreSQL (insert)
POST /geo/decode             →   api/geo.py              →   PostgreSQL (ST_Contains)
POST /predict                →   api/predict.py          →   NASA POWER + OpenMeteo
                                services/prediction_service
GET /reports/alerts          →   api/reports.py          →   PostgreSQL (sensores + analisis)
POST /reports/compare        →   api/reports.py          →   PostgreSQL (analisis)
POST /reports/export         →   api/reports.py          →   PostgreSQL (analisis)
GET /dashboard/summary       →   api/dashboard.py        →   PostgreSQL (analisis + sensores)
```

## Flujo de un analisis tipico

```
Usuario completa formulario en AnalisisCultivos (modo simple)
  → departamento, municipio, lat, lng, tipo_suelo, mes_siembra, area_hectareas, ph, MO, textura
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
  3. generate_recommendations(climate, satellite, ph, MO, textura, tipo_suelo)
  4.   → CropClassifier.score() → weighted scoring → top 3 crops
  5. Guardar en analisis (datos_formulario JSONB + resultado_completo JSONB)
  6. Retornar AnalyzeResponse
  ↓
Frontend recibe datos → Zustand setResultado() → agrega al historial
  ↓
Navega a /resultado → AnalysisResults muestra reporte
```

## Flujo AgroAsesor (Chat + RAG + LangChain)

```
Usuario escribe "como controlo el gusano cogollero en maiz?"
  ↓
POST /chat {"message": "como controlo el gusano cogollero en maiz?"}
  ↓
chat_service.process_chat_message()
  ↓
1. Guardar mensaje en conversaciones + mensajes
2. Buscar intencion:
   - Keywords: "maiz", "gusano", "cogollero", "plaga"
   - Coincide con: plagas-enfermedades
3. search_rag(query, k=3):
   - Keyword scoring sobre los 20 docs de backend/data/rag/
   - Retorna chunks del doc de plagas + maiz
4. _gather_db_context():
   - Ultimo analisis del usuario
   - Estado de sensores
5. Formatear respuesta con RAG context + DB context
6. Guardar mensaje IA en mensajes
7. Retornar respuesta
```

## Flujo IA Predictiva

```
Usuario va a IA Predictiva
  ↓
useIAPredictiva.js detecta ultimas coordenadas del analisis
  ↓
Usuario hace clic en "Generar Proyeccion"
  ↓
POST /predict {"lat": 10.96, "lng": -74.78}
  ↓
prediction_service.project_6_months()
  ↓
1. fetch_nasa_climatology(lat, lng) → NASA POWER API (promedios mensuales historicos)
2. fetch_current_climate(lat, lng) → OpenMeteo (clima actual)
3. Calcular anomalia: current - historical mean
4. Para cada mes (proximos 6):
   a. Proyectar: historical_month + anomaly * decay_factor(0.8^i)
   b. Calcular NDVI estimado desde precipitacion proyectada
   c. Ejecutar CropClassifier
5. Identificar mejor mes y mejor cultivo
6. Retornar proyeccion
```

## Pagina de Ajustes

La pagina `/investigador/ajustes` permite:

| Seccion | Accion | Storage |
|---------|--------|---------|
| Mi Finca | Guardar coordenadas default | localStorage (agrocaribe_finca) |
| Servidor API | Cambiar URL del backend | localStorage (agrocaribe_api_url) |
| Datos | Exportar / Importar JSON | localStorage completo |
| Sistema | Limpiar cache + reiniciar | localStorage (prefijo agrocaribe_) |

Los mapas y formularios usan `getSetting('finca')` para las coordenadas default.
La URL del backend se lee desde localStorage en `api.js` al importar el modulo.

---

## Referencias

- [[4-arquitectura/VISION_SISTEMA]] — Diagrama de bloques del sistema
- [[4-arquitectura/MODULO_CLIMA]] — Servicio climatico detallado
- [[4-arquitectura/MODULO_SATELITAL]] — Servicio satelital detallado
- [[4-arquitectura/MODULO_RECOMENDACION]] — Motor de recomendacion detallado
- [[4-arquitectura/ARQUITECTURA_DB]] — Tablas involucradas por endpoint
- [[2-backend/ARQUITECTURA_BACKEND]] — Documentacion de endpoints
- [[3-frontend/ARQUITECTURA_FRONTEND]] — Documentacion del frontend

## Flujo SoilGrids (Datos de Suelo Automaticos)

```
Usuario hace clic en el mapa (MapSelector)
  ↓
handleMapChange() en useAnalisisCultivos.js
  ↓
GET /soil/data?lat=10.33&lng=-75.41
  ↓
soil_service.get_soil_data()
  → POST rest.isric.org/soilgrids/v2.0/properties/query
  → phh2o, soc, sand, silt, clay
  → ph directo, MO = SOC * 1.724 / 10, textura = USDA triangle
  ↓
Response: { ph, materia_organica, textura_suelo, fuente }
  ↓
actualizarFormulario() → toast informativo
  ↓
usuario puede sobrescribir manualmente
```

## Flujo Motor Hibrido (Random Forest + Heuristico)

```
recommendation.generate_recommendations()
  ↓
inference.predict_crop_recommendations()
  ↓
1. Cargar modelo RF (crop_model_rf.joblib + crop_scaler.joblib)
2. Si modelo existe:
   - RF.predict_proba() → probabilidades por cultivo
   - score = int(prob * 100)
   - metodo = "random_forest", probabilidad = prob
3. Si modelo no existe o falla:
   - Fallback a CropClassifier.score() (reglas heuristicas)
   - metodo = "heuristico", probabilidad = null
  ↓
Enriquecer con metadatos del CSV (emoji, ciclo, rendimiento)
  ↓
Retornar top 3 + metodo usado
```

