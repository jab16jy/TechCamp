# Tareas: Reconstrucción IA Predictiva

## Pronóstico de Carga de Revisión

| Campo | Valor |
|-------|-------|
| Líneas estimadas cambiadas | 1000–1200 (12 archivos creados, 8 modificados, 5 eliminados, 1 reescritura) |
| Riesgo presupuesto 400 líneas | Alto |
| PRs encadenados recomendados | Sí |
| Estrategia de entrega | ask-always |
| Estrategia de cadena | pendiente |
| División sugerida | PR1: Backend (~210L) → PR2: Hooks (~250L) → PR3: Componentes (~440L; considerar 3a+3b) → PR4: Integración+Verificación (~200L) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Unidades de Trabajo Sugeridas

| Unidad | Objetivo | PR probable | Notas |
|--------|----------|-------------|-------|
| 1 | Backend: LSTM, ensemble, /predict/scenario, esquema sensores, mock (tareas 1–6) | PR 1 | ~210 líneas; base: feature/ia-predictiva-rebuild |
| 2 | Frontend: 3 hooks especializados + api.js (tareas 7–9) | PR 2 | ~250 líneas; base: PR 1 |
| 3 | Componentes: SensorDashboard, Paneles Niño/Niña, ScenarioSimulator, OptimalWindowCard (tareas 10–13) | PR 3 | ~440 líneas — supera presupuesto; dividir en PR 3a (tareas 10–11, ~220L) y PR 3b (tareas 12–13, ~220L) o aceptar size:exception |
| 4 | Integración: rewrite IAPredictiva + borrado + verificación (tareas 14–18) | PR 4 | ~200 líneas; base: PR 3b |

## Fase 1: Fundación Backend

- [x] 1.1 Crear `backend/app/ml/lstm_model.py` (clase LSTMModel: train, load, predict con TensorFlow/Keras). Agregar `tensorflow` a `backend/requirements.txt`. Capacidad: hybrid-prediction-engine.
- [x] 1.2 Modificar `backend/app/ml/inference.py`: agregar parámetro `lstm_anomalies` a `predict_crop_recommendations()`, lógica ensemble 60% RF + 40% LSTM con fallback RF puro. Capacidad: hybrid-prediction-engine.
- [x] 1.3 Crear endpoint `POST /predict/scenario` en `backend/app/api/predict.py` y schema `ScenarioRequest` en `backend/app/schemas/predict.py`. Capacidad: scenario-simulator.
- [x] 1.4 Refinar umbrales Niño (>35°C, <10mm) y Niña (>85% HR, suelo saturado) en `backend/app/services/prediction_service.py`. Agregar método `project_window_with_scenario()`. Capacidad: climate-scenario-panels.
- [x] 1.5 Extender `LecturaResponse` en `backend/app/schemas/sensor.py` con campos `viento_kmh`, `pluviometria_mm`, `humectacion_hoja_pct`. Capacidad: weather-station-dashboard.
- [x] 1.6 Agregar generador de datos mock realistas (rango Caribe) en `backend/app/api/sensores.py` para los nuevos campos de sensor. Capacidad: weather-station-dashboard.

## Fase 2: Hooks Frontend

- [x] 2.1 Crear `src/features/predictions/hooks/useSensores.js`: fetch `GET /sensors`, cálculo de riesgo (`critico`|`alto`|`moderado`|`ok`) por tipo de sensor, selección de sensor activo. Capacidad: weather-station-dashboard.
- [x] 2.2 Crear `src/features/predictions/hooks/usePrediccion.js`: fetch `POST /predict` y `POST /predict/scenario`, máquina de estados (`IDLE`→`LOADING`→`PROJECTED`→`SIMULATING`→`PROJECTED`), manejo de errores. Capacidad: hybrid-prediction-engine, scenario-simulator.
- [x] 2.3 Crear `src/features/predictions/hooks/usePlanRiego.js`: `POST /sensors/{id}/plan`, toggle preview, exportación de plan. Agregar función `postScenario()` a `src/shared/services/api.js`. Capacidad: optimal-planting-window.

## Fase 3: Componentes Frontend

- [x] 3.1 Crear `SensorDashboard/SensorDashboard.jsx` (grid 3×2 con `SensorCard`) y `SensorCard/SensorCard.jsx` (ícono Lucide, valor+unidad, umbral, badge riesgo con animación pulso para estado crítico). Capacidad: weather-station-dashboard.
- [x] 3.2 Crear `NinoPanel/NinoPanel.jsx` (termómetro, temp/precip, alerta «Riego Crítico», severidad, mulch tip) y `NinaPanel/NinaPanel.jsx` (humedad, alerta «Riesgo Hongos», tracking NDVI, severidad). Capacidad: climate-scenario-panels.
- [x] 3.3 Crear `ScenarioSimulator/ScenarioSimulator.jsx` (4 sliders con valor numérico visible), `ScenarioSelector.jsx` (3 presets: Niño/Niña/Normal), `GrowthStressChart.jsx` (SVG inline: trayectoria crecimiento vs estrés hídrico+térmico con interpolación animada). Capacidad: scenario-simulator.
- [x] 3.4 Crear `OptimalWindowCard/OptimalWindowCard.jsx`: fechas inicio/fin 7 días, confianza %, justificación agronómica, estado «Sin ventana óptima» con factores limitantes. Capacidad: optimal-planting-window.

## Fase 4: Integración

- [ ] 4.1 Reescribir `src/features/predictions/pages/IAPredictiva.jsx`: layout 6 filas BentoGrid con componentes nuevos, máquina de estados explícita, feature flag `VITE_USE_NEW_PREDICTION_HOOKS`. Capacidad: todas.
- [ ] 4.2 Eliminar `RiskDetectionPanel/`, `MitigationSimulator/`, `SensorMicroGrid/`, `SensorStatusCard/` de `src/features/predictions/components/`. Capacidad: todas.
- [ ] 4.3 Eliminar `usePlanRiegoActivo.jsx` y limpiar código muerto en `analysisService`. Capacidad: todas.

## Fase 5: Verificación

- [ ] 5.1 Ejecutar `npm run build` — verificar cero errores de importación y cero componentes huérfanos.
- [ ] 5.2 Verificación end-to-end: POST /predict → sensores → paneles Niño/Niña → POST /predict/scenario → plan de riego.
- [ ] 5.3 Tests pytest (TDD backend): ensemble 60/40 con ambos modelos, fallback RF puro, endpoint /predict/scenario con deltas, mock NASA/OpenMeteo. Comando: `pytest backend/tests/`.
