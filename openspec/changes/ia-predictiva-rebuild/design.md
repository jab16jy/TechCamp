# Design: Reconstrucción IA Predictiva

## Technical Approach

Reconstrucción completa del módulo IA Predictiva con motor híbrido RF+LSTM, estación meteorológica de 6 sensores, paneles climáticos diferenciados (Niño/Niña), simulador de escenarios con 4 sliders, y descomposición del hook monolítico de 376 líneas en 3 hooks especializados. El layout pasa de 5 filas a 6 filas con BentoGrid de 12 columnas existente.

## Architecture Decisions

| Decision | Option A | Option B | Decision | Rationale |
|----------|----------|----------|----------|-----------|
| Motor de predicción | RF puro (actual) | Ensemble 60% RF + 40% LSTM | **B** | LSTM captura patrones temporales que RF ignora; fallback a RF puro si LSTM no disponible |
| Hooks | Monolítico 376 líneas | 3 hooks <150 líneas c/u | **3 hooks** | Separación de responsabilidades: sensores, predicción, plan de riego |
| Estado de página | useState disperso | Máquina de estados explícita | **Máquina de estados** | 6 estados claros (IDLE→CONFIGURING→LOADING→PROJECTED→SIMULATING→PLAN_READY) evita estados inconsistentes |
| Gráficas | Recharts (dependencia nueva) | SVG inline (sin deps) | **SVG inline** | El proyecto ya no tiene librería de charts; GrowthStressChart usa SVG puro como FeatureChart existente |
| Datos sensores | IoT real | Mock backend | **Mock** | Out of scope en proposal; extender schema + mock con valores realistas Caribe |
| LSTM training | Datos reales | Series sintéticas NASA POWER | **Sintéticas** | Mismo approach que training.py; consistente con patrón existente |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                          │
│                                                                     │
│  User clicks "Configurar" → QueryConfigModal                        │
│    → handleManualQuery / handleSelectAnalysis                       │
│      → usePrediccion.fetchProyeccion(lat, lng, cultivo, meses)      │
│        → POST /predict (api.js)                                     │
│                                                                     │
│  State: IDLE → LOADING → PROJECTED                                  │
│                                                                     │
│  PROJECTED render:                                                  │
│    ROW 1: SensorDashboard (col-8) │ NinoPanel/NinaPanel (col-4)    │
│    ROW 2: MonthlyProjectionTabs (col-8) │ OptimalWindowCard (col-4)│
│    ROW 3: ScenarioSimulator (col-12)                                │
│    ROW 4: GrowthStressChart (col-6) │ FeatureChart (col-6)         │
│    ROW 5: FenologiaTimeline (col-6) │ ClimateRiskPanel (col-6)     │
│    ROW 6: PlanVisualizationCard + StressReductionChart (conditional)│
│                                                                     │
│  User adjusts sliders → "Aplicar Contramedida"                      │
│    → usePrediccion.simularEscenario(scenario)                       │
│      → POST /predict/scenario (api.js)                              │
│    State: PROJECTED → SIMULATING → PROJECTED                        │
│                                                                     │
│  User clicks "Generar Plan"                                         │
│    → usePlanRiego.generarPlan(sensorId)                             │
│      → POST /sensors/{id}/plan (api.js)                             │
│    State: PROJECTED → PLAN_READY                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                            │
│                                                                     │
│  POST /predict                                                      │
│    → prediction_service.project_window()                            │
│      → fetch_nasa_climatology(lat, lng)                             │
│      → fetch_current_climate(lat, lng) [OpenMeteo]                  │
│      → compute anomalies (temp, precip, humidity)                   │
│      → LSTM forecast (if available):                                │
│          lstm_model.predict_lstm(lat, lng, historical_window=12)    │
│          → returns 6-month anomaly projections                      │
│      → predict_crop_recommendations(lstm_anomalies=anomalies)       │
│          → ensemble: 60% RF + 40% LSTM-adjusted heuristic           │
│          → fallback: RF pure if LSTM unavailable                    │
│      → _detect_climate_patterns() [Niño/Niña thresholds]            │
│      → _detect_disease_risks()                                      │
│      → _find_optimal_window()                                       │
│    → PredictResponse{meses[], alertas_patrones[], best_window}      │
│                                                                     │
│  POST /predict/scenario                                             │
│    → prediction_service.project_window_with_scenario()              │
│      → same pipeline + apply precip_delta_pct, temp_delta_c         │
│      → npk_override, riego_override from scenario                   │
│    → PredictResponse (same schema)                                  │
│                                                                     │
│  GET /sensors                                                       │
│    → DB query with extended LecturaSensor fields                    │
│    → mock data: viento_kmh, pluviometria_mm, humectacion_hoja_pct   │
└─────────────────────────────────────────────────────────────────────┘
```

### Sequence: Prediction with LSTM Ensemble

```
Frontend         predict.py          prediction_service       inference.py       lstm_model.py
    │                │                      │                      │                  │
    │──POST /predict─▶│                      │                      │                  │
    │                │──project_window()─────▶│                      │                  │
    │                │                      │──fetch_nasa_clim()───▶│                  │
    │                │                      │◀──climatology dict────│                  │
    │                │                      │──fetch_current()─────▶│                  │
    │                │                      │◀──current dict────────│                  │
    │                │                      │──compute anomalies    │                  │
    │                │                      │──predict_lstm()───────▶│──load_lstm()     │
    │                │                      │                      │──predict_lstm()──▶│
    │                │                      │◀──6mo anomalies──────│◀──tensor output──│
    │                │                      │──predict_crop_rec()──▶│                  │
    │                │                      │                      │──60% RF + 40% LSTM│
    │                │                      │◀──crop scores────────│                  │
    │                │                      │──detect_patterns()    │                  │
    │                │                      │──find_optimal()       │                  │
    │                │◀──PredictResponse────│                      │                  │
    │◀──JSON─────────│                      │                      │                  │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/predictions/hooks/useSensores.js` | Create | Hook: fetch sensores, risk calculation per sensor type, selection state |
| `src/features/predictions/hooks/usePrediccion.js` | Create | Hook: fetch projection, scenario simulation, state machine management |
| `src/features/predictions/hooks/usePlanRiego.js` | Create | Hook: irrigation plan generation, preview toggle, export |
| `src/features/predictions/components/SensorDashboard/SensorDashboard.jsx` | Create | 3×2 grid of SensorCards (wind, rain, soil humidity, leaf wetness, temp, NDVI) |
| `src/features/predictions/components/SensorCard/SensorCard.jsx` | Create | Single sensor card: icon + label + value + unit + threshold + risk badge |
| `src/features/predictions/components/NinoPanel/NinoPanel.jsx` | Create | El Niño panel: thermometer, temp/projection stats, "Riego Crítico" callout, mulch tip |
| `src/features/predictions/components/NinaPanel/NinaPanel.jsx` | Create | La Niña panel: cloud/rain icon, humidity stats, fungus risk, NDVI tracking |
| `src/features/predictions/components/ScenarioSimulator/ScenarioSimulator.jsx` | Create | Container: 4 sliders + 3 preset buttons + apply button |
| `src/features/predictions/components/ScenarioSimulator/GrowthStressChart.jsx` | Create | SVG chart: growth trajectory vs hydric/thermal stress lines |
| `src/features/predictions/components/ScenarioSimulator/ScenarioSelector.jsx` | Create | 3 preset buttons (Niño/Niña/Normal) applying predefined slider values |
| `src/features/predictions/components/OptimalWindowCard/OptimalWindowCard.jsx` | Create | Card: optimal window start/end dates, confidence %, justification |
| `src/features/predictions/pages/IAPredictiva.jsx` | Rewrite | New 6-row layout with explicit state machine |
| `src/features/predictions/components/RiskDetectionPanel/` | Delete | Unused component |
| `src/features/predictions/components/MitigationSimulator/` | Delete | Replaced by ScenarioSimulator |
| `src/features/predictions/components/SensorMicroGrid/` | Delete | Replaced by SensorDashboard |
| `src/features/predictions/components/SensorStatusCard/` | Delete | Replaced by SensorCard |
| `src/features/predictions/hooks/usePlanRiegoActivo.jsx` | Delete | Replaced by 3 specialized hooks |
| `backend/app/ml/lstm_model.py` | Create | LSTM class: train, load, predict with TensorFlow/Keras |
| `backend/app/ml/inference.py` | Modify | Add `lstm_anomalies` param to `predict_crop_recommendations()`, ensemble logic |
| `backend/app/services/prediction_service.py` | Modify | Refine Niño/Niña thresholds, add `project_window_with_scenario()` |
| `backend/app/api/predict.py` | Modify | Add `POST /predict/scenario` endpoint |
| `backend/app/api/sensores.py` | Modify | Mock data generator for new sensor types |
| `backend/app/schemas/sensor.py` | Modify | Add `viento_kmh`, `pluviometria_mm`, `humectacion_hoja_pct` to LecturaResponse |
| `backend/app/schemas/predict.py` | Modify | Add `ScenarioRequest` schema |
| `src/shared/services/api.js` | Modify | Add `postScenario()` function |
| `backend/requirements.txt` | Modify | Add `tensorflow`, `joblib` (if not present) |

## Interfaces / Contracts

### New Schema: ScenarioRequest

```python
class ScenarioPreset(str, Enum):
    nino = "nino"
    nina = "nina"
    normal = "normal"

class ScenarioRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    meses: int = Field(default=6, ge=1, le=6)
    precip_delta_pct: float = Field(default=0, ge=-80, le=80)
    temp_delta_c: float = Field(default=0, ge=-5, le=5)
    npk_override: Optional[float] = None
    riego_override: Optional[float] = None
    preset: Optional[ScenarioPreset] = None
```

### New Hook Interfaces

```javascript
// useSensores.js
// Returns: { sensores, selectedSensorId, selectedSensor, sensorRiskMap, sensoresEnRiesgo, loading, handleSelectSensor }
// Risk types: 'critico' | 'alto' | 'moderado' | 'ok' | 'sin_datos'
// Sensor types: 'viento' | 'pluviometro' | 'humedad_suelo' | 'humectacion_hoja' | 'temperatura' | 'ndvi'

// usePrediccion.js
// Returns: { proyeccion6M, loadingProyeccion, estado, npkSim, riegoSim, stale,
//            fetchProyeccion({lat, lng, cultivo, meses}), simularEscenario(scenario),
//            setNpkSim, setRiegoSim, clearProyeccion }
// Estados: 'IDLE' | 'CONFIGURING' | 'LOADING' | 'PROJECTED' | 'SIMULATING' | 'PLAN_READY'

// usePlanRiego.js
// Returns: { plan, generandoPlan, previewActive, historialPlanes,
//            generarPlan(sensorId), togglePreview, exportarPlan(), clearPlan() }
```

### LSTM Model Interface

```python
class LSTMModel:
    def train_lstm(nasa_data: dict, sequence_length: int = 12, forecast_horizon: int = 6) -> dict
        # Returns: {"metrics": {...}, "model_path": Path, "scaler_path": Path}

    def load_lstm(model_path: Path, scaler_path: Path) -> tuple[Model, StandardScaler]

    def predict_lstm(lat: float, lng: float, historical_window: int = 12) -> dict
        # Returns: {
        #   "temp_anomalies": [float] * 6,  # °C deviation per month
        #   "precip_anomalies": [float] * 6, # mm deviation per month
        #   "hum_anomalies": [float] * 6,    # % deviation per month
        #   "confidence": float              # 0-1 model confidence
        # }
```

### SensorCard Props

```javascript
SensorCard({
  tipo: 'viento' | 'pluviometro' | 'humedad_suelo' | 'humectacion_hoja' | 'temperatura' | 'ndvi',
  valor: number,
  unidad: string,
  umbral: number,
  riesgo: 'critico' | 'alto' | 'moderado' | 'ok' | 'sin_datos',
  icono: LucideIcon,
  seleccionado: boolean,
  onClick: () => void,
})
```

### Scenario Presets

```javascript
const PRESETS = {
  nino:   { precip_delta_pct: -30, temp_delta_c: 3.0, npk_override: 140, riego_override: 90 },
  nina:   { precip_delta_pct: 40,  temp_delta_c: -1.5, npk_override: 100, riego_override: 40 },
  normal: { precip_delta_pct: 0,   temp_delta_c: 0,    npk_override: 120, riego_override: 75 },
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `lstm_model.py` train/predict with synthetic data | pytest: verify output shape (6 months), anomaly ranges reasonable |
| Unit | `inference.py` ensemble weighting | pytest: verify 60/40 blend produces different scores than RF alone |
| Unit | `prediction_service.py` scenario deltas | pytest: verify `project_window_with_scenario` applies deltas correctly |
| Unit | `useSensores` risk calculation | Verify each sensor type maps to correct risk level |
| Unit | `usePrediccion` state transitions | Verify IDLE→LOADING→PROJECTED→SIMULATING→PROJECTED cycle |
| Integration | `POST /predict/scenario` endpoint | pytest + httpx: full pipeline with mock NASA/OpenMeteo |
| Integration | `GET /sensors` with extended fields | Verify new sensor types appear in response |
| Build | `npm run build` passes | No import errors, no unused components |

## Migration / Rollout

**No data migration required.** All changes are additive or replace unused code.

**Phased rollout:**
1. Backend first: deploy schema changes + LSTM model + scenario endpoint (backward compatible)
2. Frontend: deploy new hooks alongside old hook temporarily (feature flag via env var `USE_NEW_PREDICTION_HOOKS`)
3. Switch: flip feature flag, remove old hook and deleted components
4. **Rollback**: revert git commit; old components and hook preserved in history; `/predict` endpoint unchanged

**Feature flag pattern:**
```javascript
// In IAPredictiva.jsx
const useNewHooks = import.meta.env.VITE_USE_NEW_PREDICTION_HOOKS === 'true';
const hookData = useNewHooks ? useNewHooksBundle() : usePlanRiegoActivo();
```

## Open Questions

- [ ] ¿TensorFlow se incluye en Docker Compose o se entrena localmente y se sube el `.keras` como artifact?
- [ ] ¿El modelo LSTM se entrena on-demand al primer request o se pre-entrena en CI/CD?
- [ ] ¿Los valores mock de sensores nuevos (viento, pluviometría, humectación) deben variar por hora o son estáticos por sesión?
- [ ] ¿GrowthStressChart necesita tooltips interactivos o solo líneas estáticas?
