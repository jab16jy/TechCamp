# Propuesta: Reconstrucción IA Predictiva

## Intent

El módulo IA Predictiva existe pero es insuficiente: motor solo RF (sin LSTM), sensores limitados a humedad/temperatura, simulador con solo 2 sliders, sin paneles Niño/Niña diferenciados, y un hook monolítico de 376 líneas. Se requiere reconstruir con motor híbrido RF+LSTM, estación meteorológica completa, paneles climáticos dedicados, y simulador de escenarios interactivo.

## Scope

### In Scope
- Motor híbrido RF+LSTM (inferencia.py → ensemble 60/40)
- LSTM entrenado sobre series sintéticas NASA POWER
- Paneles El Niño (temp >35°C + precip <10mm) y La Niña (humedad >85% + suelos saturados)
- SensorDashboard con anemómetro, pluviómetro, humedad suelo, humectación hoja
- ScenarioSimulator con 4 sliders, presets Niño/Niña/Normal, gráficas crecimiento vs estrés
- Refactor hook: usePlanRiegoActivo (376 líneas) → useSensores + usePrediccion + usePlanRiego
- Endpoint `POST /predict/scenario` para what-if
- Extensión modelo LecturaSensor (viento_kmh, pluviometria_mm, humectacion_hoja_pct)
- Layout 5 filas con BentoGrid existente

### Out of Scope
- Reentrenamiento del modelo RF existente
- Datos reales de sensores IoT (usar mocks del backend)
- NDVI tracking (mencionado en spec de La Niña, se difiere)
- Test E2E con Playwright
- PWA/offline

## Capabilities

### New Capabilities
- `hybrid-prediction-engine`: Motor RF+LSTM con ensemble ponderado y fallback heurístico
- `weather-station-dashboard`: Grid de sensores meteorológicos con cálculo de riesgo por tipo
- `climate-scenario-panels`: Paneles dedicados El Niño/La Niña con umbrales precisos y alertas
- `scenario-simulator`: Simulador what-if con presets, 4 sliders, gráficas crecimiento/estrés
- `optimal-planting-window`: Visualización de ventana óptima de siembra

### Modified Capabilities
- None (no existen specs previas — primera iteración)

## Approach

1. **Backend primero**: agregar campos sensor al schema/models, crear `lstm_model.py`, extender `inference.py` con ensemble, nuevo endpoint `/predict/scenario`
2. **Refactor hooks**: descomponer `usePlanRiegoActivo.jsx` en 3 hooks fijos
3. **Componentes nuevos**: SensorDashboard, SensorCard, NinoPanel, NinaPanel, ScenarioSimulator, GrowthStressChart, ScenarioSelector, OptimalWindowCard
4. **Reescritura de página**: `IAPredictiva.jsx` con layout 5 filas y renderizado condicional
5. **Eliminar**: RiskDetectionPanel, MitigationSimulator, SensorMicroGrid, SensorStatusCard, código muerto de simulatePrediction

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `src/features/predictions/pages/IAPredictiva.jsx` | Modified | Reescritura completa con layout 5 filas |
| `src/features/predictions/hooks/` | Modified | Descomposición hook monolítico → 3 hooks |
| `src/features/predictions/components/` | New | 8 componentes nuevos |
| `src/features/predictions/components/` | Removed | 4 componentes eliminados |
| `backend/app/ml/lstm_model.py` | New | Modelo LSTM |
| `backend/app/ml/inference.py` | Modified | Ensemble RF+LSTM |
| `backend/app/api/predict.py` | Modified | Nuevo endpoint scenario |
| `backend/app/services/prediction_service.py` | Modified | Umbrales Niño/Niña + what-if |
| `backend/app/models/ & schemas/` | Modified | Campos sensor extendidos |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| LSTM con datos sintéticos produce predicciones poco confiables | Med | Fallback heurístico ya existe; ensemble ponderado atenúa errores LSTM |
| Breakage de componentes existentes al refactor hooks | Med | Refactor incremental; mantener interfaces compatibles primero |
| Cresería de lines del PR > 400 | Med | Estrategia de chained PRs si forecast lo amerita |

## Rollback Plan

1. Revertir a rama anterior: todos los componentes eliminados siguen en git
2. El hook monolítico se preserva en git hasta confirmar estabilidad
3. Backend: el endpoint `/predict` original no se modifica, solo se agrega `/predict/scenario`
4. Si LSTM falla, el ensemble degrada a RF puro (ya es el comportamiento actual)

## Dependencies

- TensorFlow/Keras para LSTM (agregar al requirements.txt)
- NASA POWER API (ya usada en climate_service.py)

## Success Criteria

- [ ] Motor híbrido RF+LSTM responde en <2s con fallback a RF
- [ ] Paneles Niño/Niña activan alertas con umbrales exactos (>35°C+<10mm / >85%humedad)
- [ ] SensorDashboard muestra 4 tipos de sensor con estado de riesgo visual
- [ ] ScenarioSimulator ejecuta what-if reactivo con presets
- [ ] Hook monolítico eliminado, reemplazado por 3 hooks <150 líneas cada uno
- [ ] `npm run build` pasa sin errores