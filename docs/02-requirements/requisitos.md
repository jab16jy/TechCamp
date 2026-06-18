# Requisitos del Sistema

## Escenarios de validación

### Escenario A: Estrés hídrico en fenómeno de El Niño

- **Contexto:** Temperaturas > 35°C, humedad relativa < 50%, precipitación acumulada < 10 mm en 30 días.
- **Validación esperada:** El modelo debe priorizar alertas de riego crítico y optimización de cobertura (mulch) en el módulo de Reportes.
- **Implementación:** Ajuste de umbrales en el algoritmo HistGradientBoosting utilizando datos históricos de la región.

### Escenario B: Riesgo fitosanitario en época de lluvias

- **Contexto:** Humedad > 85%, lluvias constantes, suelos saturados.
- **Validación esperada:** La IA debe detectar patrones de riesgo de hongos (ej. pudrición del cogollo) mediante análisis de vigor (NDVI) y sensores de humedad.
- **Implementación:** Integración con OpenMeteo para predecir ventanas de aplicación de fungicidas preventivos.

## Requisitos funcionales (por módulo)

### Análisis de Cultivos
- Selección de parcela en mapa interactivo (clic o dibujo de polígono).
- Autocompletado de pH, materia orgánica y textura del suelo vía ISRIC SoilGrids.
- Recomendación de Top 3 cultivos con puntuación, justificación y metadatos (ciclo, rendimiento).
- Visualización de factores de influencia (clima, suelo, satélite).

### Predicción Climática
- Proyección de variables climáticas a 6 meses usando NASA POWER + OpenMeteo.
- Simulación de escenarios con ajuste de riego y fertilización NPK.
- Detección de riesgo de enfermedades (Roya, etc.) basada en condiciones proyectadas.
- Identificación de ventana óptima de siembra.

### AgroAsesor (Chatbot)
- Consultas en lenguaje natural sobre cultivos, plagas, fertilización y prácticas agronómicas.
- Búsqueda semántica sobre 40+ documentos agronómicos del Caribe (RAG con TF-IDF).
- Respuestas con contexto de la base de datos del usuario (último análisis, sensores).
- Generación de respuestas vía LLM local (Ollama) o externo (OpenAI).

### Dashboard
- Resumen de análisis recientes, métricas de sensores y alertas del sistema.
- Visualización de ubicaciones en mapa con estado de sensores IoT.

### Sensores IoT
- Monitoreo en vivo de 6 nodos sensores desplegados en el Caribe.
- Lecturas históricas de NDVI, humedad y temperatura.
- Alertas por estado crítico de sensores.

### Reportes
- Generación de alertas basadas en sensores y análisis.
- Comparativa entre análisis guardados.
- Exportación de reportes en PDF.

### Riego Inteligente
- Cálculo de ET0 (Penman-Monteith simplificado).
- Programación semanal de riego basada en balance hídrico.
- Umbrales específicos por cultivo.

### Autenticación
- Login con Supabase Auth.
- Roles: investigador y productor.

## Requisitos no funcionales

- **Rendimiento:** Las APIs externas (OpenMeteo, SoilGrids) deben responder en < 15 segundos con fallback graceful.
- **Disponibilidad:** El backend debe incluir health check en `/health`.
- **Portabilidad:** Todo el entorno se despliega con Docker Compose (PostGIS + Backend + Ollama).
- **Escalabilidad:** La base de datos soporta 2.5M+ puntos NDVI con índices GIST.
- **Idioma:** Interfaz de usuario en español.
- **Navegación:** 13 rutas públicas y protegidas con React Router.
- **Persistencia:** Historial de análisis guardado en PostgreSQL. Configuración de usuario en localStorage.

---

**Documentación relacionada:** [[vision]] — [[modulo-recomendacion]]

**Referencia histórica (diseño original de módulos):** [[DISENO_MODULOS]] — [[VALIDACION_SISTEMA]]
