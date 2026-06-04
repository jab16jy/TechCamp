# Design: IA Predictiva — Risk Focus Refactor

## 1. Architecture Overview

### 1.1 Component Tree (After Refactor)

```
IAPredictiva (page)
├── ResearcherLayout
├── [Header] "IA Predictiva — Riesgos y Mitigación"
│   ├── Back button → /investigador/dashboard
│   ├── Title + Config button
│   ├── Page intent description
│   └── Badge bar (mode, Niño/Niña badges, analysis info)
├── QueryConfigModal (modal, outside BentoGrid)
└── BentoGrid (12-column CSS Grid)
    ├── [IDLE state] — Full-width config prompt card
    ├── [LOADING/SIMULATING] — Full-width spinner card
    └── [PROJECTED state]
        ├── Row 1 (col-8 + col-4)
        │   ├── MonthlyProjectionTabs (col-8, title: "Proyección Estacional")
        │   └── ClimateRiskPanel (col-4, alert data from proyeccion6M)
        ├── Row 2 (col-8 + col-4)
        │   ├── ScenarioSimulator (col-8)
        │   └── ScenarioSelector (col-4)
        ├── Row 3 (col-6 + col-6)
        │   ├── GrowthStressChart (col-6)
        │   └── FeatureChart (col-6)
        └── Row 4 (col-12)
            └── MitigationActions (col-12, NEW)
```

**Removed from render tree** (files kept on disk):
- SensorDashboard, SensorCard
- NinoPanel, NinaPanel
- OptimalWindowCard
- FenologiaTimeline
- PlanVisualizationCard, StressReductionChart
- ExportPlanButton
- Plan history section
- Plan generation banner + loading state

### 1.2 Layout Grid (12-column BentoGrid)

```
┌──────────────────────────────────────┬──────────────────────────┐
│  MonthlyProjectionTabs (col-8)       │  ClimateRiskPanel (4)   │  ← Row 1
├──────────────────────────────────────┼──────────────────────────┤
│  ScenarioSimulator (col-8)           │  ScenarioSelector (4)   │  ← Row 2
├───────────────────┬──────────────────┴──────────────────────────┤
│ GrowthStress (6)  │  FeatureChart (6)                          │  ← Row 3
├───────────────────┴────────────────────────────────────────────┤
│  MitigationActions (col-12)                                    │  ← Row 4
└────────────────────────────────────────────────────────────────┘
```

Each BentoCard uses the existing `BentoCard` component with `span={{ col: N, row: 1 }}`. The BentoGrid is a CSS Grid with `grid-template-columns: repeat(12, 1fr)`.

### 1.3 State Machine (Unchanged)

```
IDLE ──► LOADING ──► PROJECTED
                       │
                       ├── simulate ──► SIMULATING ──► PROJECTED
                       │
                       └── clear ──► IDLE
```

The `usePrediccion` hook state machine is preserved as-is. No new states are added. The `PLAN_READY` state becomes unreachable since `marcarPlanListo` is only called by `handleGenerarPlan`, which is removed. This is harmless — `PLAN_READY` was treated identically to `PROJECTED` in the render (`isProjected` check).

**State-to-Render mapping**:
| State | Render |
|-------|--------|
| IDLE | Full-width config prompt card |
| LOADING | Full-width spinner + "Calculando proyección estacional..." |
| SIMULATING | Full-width spinner + "Recalculando proyección con escenario..." |
| PROJECTED | Full 4-row BentoGrid |
| PLAN_READY | Full 4-row BentoGrid (same as PROJECTED) |

### 1.4 File Map

| File | Action |
|------|--------|
| `src/features/predictions/pages/IAPredictiva.jsx` | **MODIFY** — Strip hooks, imports, components, layout, rename header, remove feature flag |
| `src/features/predictions/pages/IAPredictiva.css` | **MODIFY** — Remove action-banner, plan-history, generando-plan styles (`.ia-action-banner` preserved for possible reuse) |
| `src/features/predictions/components/MitigationActions/MitigationActions.jsx` | **CREATE** — New component |
| `src/features/predictions/components/MitigationActions/MitigationActions.css` | **CREATE** — Styles for MitigationActions |
| `src/features/predictions/components/MonthlyProjectionTabs/MonthlyProjectionTabs.jsx` | **MODIFY** — Add debug logging + optional data transform |
| `src/features/predictions/components/ClimateRiskPanel/ClimateRiskPanel.jsx` | **NO CHANGE** — Already compatible |

**Unchanged files** (preserved on disk for reuse by other pages):
- `SensorDashboard/`, `SensorCard/`, `NinoPanel/`, `NinaPanel/`, `OptimalWindowCard/`, `FenologiaTimeline/`
- `PlanVisualizationCard/`, `StressReductionChart/`, `ExportPlanButton/`, `FieldMap/`, `MonthlyProjectionGrid/`
- `usePlanRiego`, `useSensores` hooks
- `AnalisisSelector/`

---

## 2. Data Flow

### 2.1 Proyección Data Pipeline

```
User action (QueryConfigModal / selectAnalysis / manual query)
    │
    ▼
fetchProyeccion / selectAnalysis (usePrediccion)
    │  setEstado(LOADING)
    ▼
getPrediccion() (api.js)
    │
    ├── POST /predict → returns PredictResponse JSON
    │                     { meses, alertas_globales, alertas_patrones,
    │                       ubicacion, fuente, mejor_mes, mejor_cultivo }
    │
    └── [catch] Mock fallback → same shape with synthetic data
    │
    ▼
setProyeccion6M(result) + setEstado(PROJECTED)
    │
    ▼
Components read proyeccion6M directly:
  ├── MonthlyProjectionTabs  ← proyeccion6M.meses[]
  ├── ClimateRiskPanel       ← proyeccion6M.alertas_patrones + alertas_globales
  ├── GrowthStressChart      ← proyeccion6M.meses[].cultivos_recomendados etc.
  ├── FeatureChart           ← proyeccion6M.meses[0].cultivos_recomendados[0].factor_weights
  └── MitigationActions (NEW) ← proyeccion6M.alertas_globales + alertas_patrones
```

### 2.2 Scenario Simulation Flow

```
ScenarioSimulator sliders → onChange handlers
    │
    ▼
handlePrecipChange / handleTempChange → update local state, setStale(true)
    │
    ▼
User clicks "Aplicar y Recalcular" → handleSimularContramedida
    │
    ▼
simularEscenario (usePrediccion) → setEstado(SIMULATING)
    │
    ▼
postScenario() (api.js) → POST /predict/scenario
    │
    ▼
setProyeccion6M(result) + setEstado(PROJECTED)
```

### 2.3 PredictResponse Schema (Source of Truth)

Both real backend and mock fallback produce this shape:

```typescript
interface PredictResponse {
  meses: Array<{
    month: string;            // "Ene", "Feb", etc.
    year: number;
    month_num?: number;       // 1-12
    temperatura: number;      // °C
    precipitacion: number;    // mm
    humedad: number;          // %
    ndvi_estimado: number;    // 0.00-1.00
    etapa_fenologica?: string; // "germinacion", "floracion", etc.
    cultivos_recomendados: Array<{
      cultivo: string;
      score: number;          // 0-100
      riesgo: "bajo" | "medio" | "alto";
      emoji?: string;
      factor_weights?: Array<{
        factor: string;
        peso: number;
        score_parcial: number;
        porcentaje_impacto: number;
      }>;
    }>;
  }>;
  alertas_globales: Array<Alert>;
  alertas_patrones: Array<Alert>;
  ubicacion: { lat: number; lng: number; municipio?: string };
  fuente: string;
  mejor_mes: string;          // month name
  mejor_cultivo: string;
  best_window?: {
    ventana_inicio: string;
    ventana_fin: string;
    confianza: number;
    justificacion: string;
    riesgo_minimizado: string[];
  };
  es_mock?: boolean;          // true when using fallback
}

interface Alert {
  tipo: string;               // "fenomeno_nino" | "fenomeno_nina" | "fitosanitario" | "estres_hidrico" | "estres_termico" | "tendencia_calida"
  severidad: "critico" | "alto" | "moderado";
  mensaje: string;
  accion?: string;
  cultivo_afectado?: string | null;
  mes?: string | null;
  enfermedad?: string | null;
}
```

---

## 3. Component Designs

### 3.1 IAPredictiva.jsx — Stripping Details

#### 3.1.1 Imports to Remove

```javascript
// REMOVE these import lines:
import useSensores from '@features/predictions/hooks/useSensores';
import usePlanRiego from '@features/predictions/hooks/usePlanRiego';
import SensorDashboard from '@features/predictions/components/SensorDashboard/SensorDashboard';
import NinoPanel from '@features/predictions/components/NinoPanel/NinoPanel';
import NinaPanel from '@features/predictions/components/NinaPanel/NinaPanel';
import OptimalWindowCard from '@features/predictions/components/OptimalWindowCard/OptimalWindowCard';
import FenologiaTimeline from '@features/predictions/components/FenologiaTimeline/FenologiaTimeline';
import PlanVisualizationCard from '@features/predictions/components/PlanVisualizationCard/PlanVisualizationCard';
import StressReductionChart from '@features/predictions/components/StressReductionChart/StressReductionChart';
import ExportPlanButton from '@features/predictions/components/ExportPlanButton/ExportPlanButton';

// REMOVE Lucide icons no longer used (after checking remaining code):
// ArrowLeft, AlertTriangle, Loader2, Sparkles, Settings2, Search, Shield,
// Thermometer, CloudRain, Sun — keep only those still used.
```

#### 3.1.2 Hook Destructuring to Remove

```javascript
// REMOVE entire sensorHook and planHook destructuring:
const sensorHook = useSensores();       // remove
const planHook = usePlanRiego();        // remove

const {
  sensores, selectedSensorId, selectedSensor,
  sensoresEnRiego, riskStatus,
} = sensorHook;                         // remove

const {
  plan, generandoPlan, previewActive, historialPlanes,
  generarPlan, togglePreview, exportarPlan, clearPlan,
} = planHook;                           // remove
```

#### 3.1.3 Derived State to Remove

```javascript
// REMOVE riskStatus check (was from sensorHook):
const isCritico = riskStatus === 'critico' || riskStatus === 'alto';
// Remove isCritico from header badges, keep showNino/showNina badges
```

#### 3.1.4 Handlers to Remove

```javascript
// REMOVE:
const handleGenerarPlan = useCallback(...)     // calls planHook
```

#### 3.1.5 JSX Sections to Remove (in PROJECTED state)

1. **Row 1, col-8**: `SensorDashboard` → replace with `MonthlyProjectionTabs` (moved from Row 2)
2. **Row 1, col-4**: `NinoPanel` / `NinaPanel` / placeholder → replace with `ClimateRiskPanel` (moved)
3. **Old Row 3**: `OptimalWindowCard` → remove entirely
4. **Critical action banner** (`isCritico && !plan && !generandoPlan`) → remove entirely (depends on planHook)
5. **Row 5**: `GrowthStressChart` + `FeatureChart` → unchanged
6. **Row 6**: `FenologiaTimeline` → remove entirely
7. **Plan section**: `PlanVisualizationCard`, `StressReductionChart`, `ExportPlanButton`, plan history → remove entirely
8. **GenerandoPlan loading spinner** → remove entirely

#### 3.1.6 Header Rename

```html
<!-- FROM: -->
<h1 className="ia-title">
  DSS Integral
  <span className="ia-title-light"> — IA Predictiva</span>
</h1>

<!-- TO: -->
<h1 className="ia-title">
  IA Predictiva
  <span className="ia-title-light"> — Riesgos y Mitigación</span>
</h1>
```

Also update the page intent subtitle to reflect the narrower focus.

#### 3.1.7 Feature Flag Removal

```javascript
// REMOVE:
const USE_NEW_HOOKS = import.meta.env.VITE_USE_NEW_PREDICTION_HOOKS === 'true';
// Entire conditional block referencing USE_NEW_HOOKS (there is none currently,
// but the constant itself and the env var are dead code)
```

#### 3.1.8 Clear Handler Simplification

```javascript
// FROM (calls clearPlan from planHook):
const handleClearAll = useCallback(() => {
  clearProyeccion();
  clearPlan();
  setSelectedAnalysisId(null);
  setQueryCoords(null);
  setPrecipDeltaPctState(0);
  setTempDeltaCState(0);
}, [clearProyeccion, clearPlan]);

// TO (only uses usePrediccion):
const handleClearAll = useCallback(() => {
  clearProyeccion();
  setSelectedAnalysisId(null);
  setQueryCoords(null);
  setPrecipDeltaPctState(0);
  setTempDeltaCState(0);
}, [clearProyeccion]);
```

### 3.2 MitigationActions — New Component

#### 3.2.1 Props Interface

```typescript
interface MitigationActionsProps {
  proyeccion: PredictResponse | null;
}
```

#### 3.2.2 Data Mapping

```typescript
// Merge both alert arrays into a single flat list
const allAlerts = [
  ...(proyeccion?.alertas_globales || []),
  ...(proyeccion?.alertas_patrones || []),
];

// Filter to show only critical/alto severity
// (or show all if below a threshold — subject to tuning)
const relevantAlerts = allAlerts.filter(
  a => a.severidad === 'critico' || a.severidad === 'alto'
);
```

#### 3.2.3 Card Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [Icon]  SEVERITY · tipo_display                             │
│         mensaje (alert description)                         │
│         Cultivo afectado: ...  Mes: ...                     │
│         [ Acción recomendada: ... ]  →  [Qué hacer] button  │
└─────────────────────────────────────────────────────────────┘
```

**Icon mapping** (reuse `TIPO_ICON` pattern from ClimateRiskPanel):
| tipo | Icon |
|------|------|
| `fenomeno_nino` | Thermometer |
| `fenomeno_nina` | Cloud |
| `tendencia_calida` | Thermometer |
| `fitosanitario` | Bug |
| `estres_hidrico` | Droplets |
| `estres_termico` | Thermometer |
| default | AlertTriangle |

**Severity color mapping** (reuse from ClimateRiskPanel):
| severidad | Color |
|-----------|-------|
| `critico` | `#ba1a1a` (red) |
| `alto` | `#b8860b` (amber) |
| `moderado` | `#2563eb` (blue) |

#### 3.2.4 Action Button Behavior

The "Qué hacer" button per card should:
1. **Primary behavior**: Expand an inline detail section showing the `accion` field text with more detail
2. **Fallback**: If no `accion` field, scroll to the related section (e.g., ScenarioSimulator for mitigation actions)

Implementation approach: Use a local state `expandedIndex` per card. On click, toggle expansion to show the full action text + any recommended next steps.

#### 3.2.5 Empty State

When no alerts exist (or all are below threshold), render:
```html
<div>
  <Shield icon />
  <h2>Riesgos Detectados</h2>
  <p>No se detectaron riesgos significativos en la proyección actual.</p>
</div>
```

#### 3.2.6 Layout & Styling

- CSS file: `MitigationActions.css`
- Container: full-width card with glass effect (matching existing component pattern)
- Cards grid: 2-column layout on desktop (`grid grid-cols-1 sm:grid-cols-2 gap-3`)
- Each card: `.rounded-xl p-4` with severity-colored left border accent
- Consistent with existing glassmorphism: `rgba(255,255,255,0.55)` background, blur backdrop

### 3.3 MonthlyProjectionTabs — Fix Strategy

#### 3.3.1 Root Cause Investigation (Console-Debug Approach)

Add a debug log at the top of the component render:

```javascript
// Temporarily add in MonthlyProjectionTabs:
console.debug('[MonthlyProjectionTabs] proyeccion:', proyeccion);
console.debug('[MonthlyProjectionTabs] meses:', proyeccion?.meses);
if (proyeccion?.meses?.length) {
  console.debug('[MonthlyProjectionTabs] first mes shape:', proyeccion.meses[0]);
}
```

#### 3.3.2 Investigative Questions

1. **Is the data arriving?** Check the browser devtools Network tab for POST /predict response body. Verify the `meses` array is non-empty and has the expected fields.

2. **Does the shape match?** Compare the real backend response to the MonthlyProjectionTabs expectations:
   - `mes[].month` — month name string (component expects this)
   - `mes[].temperatura` — numeric (component renders as `${mes.temperatura}°C`)
   - `mes[].precipitacion` — numeric (component renders as `${mes.precipitacion}mm`)
   - `mes[].humedad` — numeric (component renders as `${mes.humedad}%`)
   - `mes[].ndvi_estimado` — numeric (component renders directly)
   - `mes[].etapa_fenologica` — optional string
   - `mes[].cultivos_recomendados` — array with `cultivo`, `score`, `riesgo`

3. **Is the guard too aggressive?** The guard `if (!proyeccion?.meses?.length) return null;` will return null for:
   - `proyeccion` is null/undefined → `usePrediccion` starts with `null` (IDLE state, not rendered)
   - `proyeccion.meses` is undefined → possible if real backend uses a different key (e.g., `mensual`)
   - `proyeccion.meses` is empty `[]` → possible with certain edge cases

4. **Is the state machine timing correct?** Verify in `usePrediccion.fetchProyeccion`:
   - `setEstado(ESTADOS.LOADING)` is called first
   - `await _runPrediccion(...)` resolves
   - `setProyeccion6M(result)` is called
   - Then `setEstado(ESTADOS.PROJECTED)` is called
   
   If the response returns but `setEstado` fires before `setProyeccion6M` (unlikely since they're in the same try block), the component renders with PROJECTED state but null data. But React batches these, so this should not happen.

#### 3.3.3 Potential Fixes (in order of likelihood)

1. **No fix needed — data already works**: The mock fallback produces correct data. If real backend returns the same shape, the component should render. The bug may be environmental (e.g., CORS, 404, missing auth).

2. **Backend field name mismatch**: If POST /predict returns different field names (e.g., `temperatura_media` instead of `temperatura`), add a normalization transform in `getPrediccion()` after receiving the response:
   ```javascript
   // In getPrediccion, after successful POST /predict:
   const { data } = await apiClient.post("/predict", payload);
   return normalizePredictResponse(data);
   ```

3. **Deep clone needed**: If the response object has frozen/read-only nested objects that React can't detect changes on, add `return JSON.parse(JSON.stringify(data))` in `getPrediccion()`.

4. **Missing months field at top level**: If real backend wraps `meses` in a different key, adjust the response handling in `getPrediccion()` or `usePrediccion`.

#### 3.3.4 Normalization Function (Preventive)

Add a defensive normalization in `getPrediccion()` after the API call that ensures all required fields exist at minimum:

```javascript
function normalizePredictResponse(raw) {
  // Ensure meses exists and has required fields
  const meses = (raw.meses || raw.monthly_projections || raw.proyeccion || [])
    .map(m => ({
      month: m.month || m.mes || '',
      year: m.year ?? new Date().getFullYear(),
      month_num: m.month_num ?? (m.month ? meses.indexOf(m) + 1 : 1),
      temperatura: Number(m.temperatura || m.temp || m.temperatura_media || 0),
      precipitacion: Number(m.precipitacion || m.precip || m.lluvia || 0),
      humedad: Number(m.humedad || m.hum || m.humidity || 0),
      ndvi_estimado: Number(m.ndvi_estimado || m.ndvi || 0),
      etapa_fenologica: m.etapa_fenologica || m.etapa || null,
      cultivos_recomendados: (m.cultivos_recomendados || m.cultivos || []).map(c => ({
        ...c,
        score: Number(c.score || c.puntaje || 0),
      })),
    }));

  return {
    meses,
    alertas_globales: raw.alertas_globales || raw.alertas || [],
    alertas_patrones: raw.alertas_patrones || raw.patrones || [],
    ubicacion: raw.ubicacion || raw.location || { lat: 0, lng: 0 },
    fuente: raw.fuente || raw.source || 'Unknown',
    mejor_mes: raw.mejor_mes || raw.mejorMes || '',
    mejor_cultivo: raw.mejor_cultivo || raw.mejorCultivo || '',
  };
}
```

### 3.4 ClimateRiskPanel — Integration (No Changes Needed)

The component already:
- Accepts `proyeccion` prop (full PredictResponse)
- Reads `proyeccion.alertas_patrones` and `proyeccion.alertas_globales`
- Has `TIPO_ICON` mapping for `fenomeno_nino` and `fenomeno_nina`
- Renders a macro banner for El Niño / La Niña with color-coded themes
- Shows individual alert cards with severity color, icon, message, and action

**Data flow**: `proyeccion6M` is passed directly as the `proyeccion` prop. No transformation needed. The `alertas_patrones` array already contains `fenomeno_nino`/`fenomeno_nina` entries from `prediction_service.py` or the mock fallback.

---

## 4. Architecture Decision Records

### ADR-1: Strip Component Files vs. Delete

**Problem**: Should we delete the unused component files or keep them?

**Options Considered**:
1. **Delete all unused components** — Cleans up the codebase, dead code cannot rot
2. **Keep files on disk, remove from rendering** — Preserves code for future reuse

**Decision**: Keep files on disk, only remove imports and rendering from IAPredictiva.jsx.

**Rationale**:
- SensorDashboard, NinoPanel, NinaPanel, OptimalWindowCard, and FenologiaTimeline are candidates for the SensoresIoT and AnalisisCultivos pages
- PlanVisualizationCard, StressReductionChart, and ExportPlanButton could be used on a dedicated irrigation planning page
- No other page depends on these components yet, but deleting them is premature without a concrete decision to discard the features entirely
- Git history preserves the code if we change our mind

**Consequences**:
- Dead code remains in the codebase (unused exports, no tree-shaking issues since Vite handles this)
- Future changes must explicitly adopt or delete components
- No data loss risk for other teams

### ADR-2: Niño/Niña Merge into ClimateRiskPanel

**Problem**: Should we modify ClimateRiskPanel, modify NinoPanel/NinaPanel, or create a new merged component?

**Options Considered**:
1. **Keep ClimateRiskPanel as-is** — Already handles `fenomeno_nino`/`fenomeno_nina` via TIPO_ICON and macro banner
2. **Modify ClimateRiskPanel** — Add new sub-components
3. **Merge NinoPanel/NinaPanel content into ClimateRiskPanel** — Duplicate code

**Decision**: Keep ClimateRiskPanel unchanged. It already renders Niño/Niña alerts from `alertas_patrones` correctly.

**Rationale**:
- ClimateRiskPanel already has `hasNino`/`hasNina` detection, `TIPO_ICON` mapping, severity-colored alert cards, and `accion` display
- It already has a macro banner for El Niño / La Niña with appropriate themes (red for Niño, blue for Niña)
- The standalone NinoPanel/NinaPanel add no rendering value beyond what ClimateRiskPanel already provides
- Zero risk of regressions from modifying working code

**Consequences**:
- NinoPanel/NinaPanel become dead code (not imported anywhere)
- ClimateRiskPanel is now the single source of truth for climate pattern display
- To add more detailed Niño/Niña sub-indicators in the future, modify ClimateRiskPanel

### ADR-3: MitigationActions Data Source

**Problem**: Should MitigationActions fetch its own data from a new endpoint, or read from existing state?

**Options Considered**:
1. **Read from `proyeccion6M`** — `alertas_globales` + `alertas_patrones` already contain all needed data
2. **New API endpoint** — Dedicated `/predict/mitigations` endpoint
3. **Derive from proyeccion.meses** — Compute mitigation actions from raw climate data

**Decision**: Read from `proyeccion6M.alertas_globales` + `alertas_patrones` directly.

**Rationale**:
- Both alert arrays already carry `accion` (recommended action), `mensaje`, `severidad`, and `tipo` fields
- The backend `prediction_service.py` already computes these with action recommendations
- No new API contracts, no backend changes, no additional loading states
- The data is already available synchronously when the projection loads

**Consequences**:
- MitigationActions is a pure presentational component (no hooks, no fetchers)
- Action quality depends on backend action generation
- If we want richer mitigation data later, we can extend the backend response without changing the frontend

### ADR-4: MonthlyProjectionTabs Fix Strategy

**Problem**: MonthlyProjectionTabs renders null despite data being available.

**Options Considered**:
1. **Console-debug first** — Add logging to identify root cause
2. **Add normalization transform** — Normalize response in `getPrediccion()` preemptively
3. **Rewrite guard logic** — Make guard less strict
4. **Change state machine** — Move `setProyeccion6M` before `setEstado`

**Decision**: Console-debug first, then apply targeted fix based on findings. Add a normalization layer preventively.

**Rationale**:
- We don't know the root cause yet — it could be a field name mismatch, a missing `meses` key, a frozen object, or even a non-issue
- Debug-first is the lowest-risk approach (see Section 3.3 for the investigation protocol)
- Adding a normalization function is preventive and makes the frontend resilient to backend shape changes
- Changing the state machine timing or guard logic without understanding the root cause could mask real bugs

**Consequences**:
- Fix may require changes in `getPrediccion()` (api.js), `usePrediccion.js`, or `MonthlyProjectionTabs.jsx` depending on root cause
- Normalization function adds a small processing overhead per response (negligible)
- The debug logs should be cleaned up after verification

### ADR-5: Feature Flag Removal — Always Use New Hooks

**Problem**: `VITE_USE_NEW_PREDICTION_HOOKS` conditional was used during migration. Should it stay?

**Options Considered**:
1. **Remove completely** — Single path, cleaner code, no dead branches
2. **Keep as safety toggle** — Can revert to old hooks path without git revert

**Decision**: Remove the feature flag entirely.

**Rationale**:
- The old hooks path (`usePlanRiego`, `useSensores` etc.) is being removed anyway — no old path to fall back to
- The flag adds conditional complexity with zero value
- Since we're stripping those hooks from the page, the flag has no purpose
- Environment variables that affect rendering logic are a maintenance burden

**Consequences**:
- No rollback path except git revert
- Cleaner code — one less conditional branch to reason about
- Future hook migrations should use feature flags only during active migration

---

## 5. Noteworthy Technical Details

### 5.1 `clearPlan` Dependency Removal

The `handleClearAll` callback currently calls both `clearProyeccion()` (from `usePrediccion`) and `clearPlan()` (from `usePlanRiego`). After removing `usePlanRiego`, the `clearPlan` call is removed. The "Descartar plan y proyección actual" button text should be simplified to "Descartar proyección actual" since there's no plan concept anymore.

### 5.2 `marcarPlanListo` Unused But Harmless

The `marcarPlanListo` function is destructured from `usePrediccion` but only called inside `handleGenerarPlan`, which is removed. The `marcarPlanListo` export from `usePrediccion` can remain — it's harmless dead code and removing it would change the hook's API for no benefit.

### 5.3 `etapaFenologica`/`fenologia` Still in Hook

The `usePrediccion` hook still computes and exposes `etapaFenologica` and `fenologia`. These are no longer used in the render. They remain in the hook as they have no performance cost and removing them would change the hook's return shape unnecessarily. They can be cleaned up in a future change if needed.

### 5.4 `NPKSim`/`RiegoSim` Stale Trigger Pattern

The `handlePrecipChange` and `handleTempChange` callbacks use a hack to trigger the stale flag:
```javascript
const handlePrecipChange = useCallback((v) => {
  setPrecipDeltaPctState(v);
  setNpkSim(npkSim); // trigger stale flag via usePrediccion
}, [setNpkSim, npkSim]);
```
This works by calling `setNpkSim` with the same value, which triggers `setStale(true)` inside `usePrediccion`. This is an existing pattern and should be preserved. A cleaner alternative would be exposing `setStale` directly from `usePrediccion`, but that's out of scope.

### 5.5 `best_window` Data Not Rendered

The `best_window` field in the PredictResponse (containing optimal planting window) is computed by the backend and mock but never rendered in the new layout. The OptimalWindowCard that rendered it was removed. This data is now "dead in transit" — it's fetched but not used. No change needed, but worth noting for future enhancements.

---

## 6. CSS Changes

### 6.1 Preserved Styles

- `.ia-root`, `.ia-header`, `.ia-header-left`, `.ia-header-row`
- `.ia-back-btn`, `.ia-config-btn`, `.ia-title`, `.ia-title-light`
- `.ia-page-intent`, `.ia-badge-mode`
- `.ia-generate-btn` (used by ScenarioSimulator "Aplicar y Recalcular" button)
- `.bento-field-label`, `.bento-field-input`, `.bento-btn-primary`, `.bento-btn-secondary`
- `.bento-card-skeleton`, `.no-scrollbar`, `.spin`, range slider styles
- `.ia-dropdown-container`, `.ia-use-last`, `.ia-history-popover` (used by QueryConfigModal)

### 6.2 Remove

- `.ia-action-banner` — was used for the critical risk banner that called `handleGenerarPlan`. Check IAPredictiva.css to see if it's used elsewhere; if not, remove.

### 6.3 Add (MitigationActions.css)

- Container/heading styles following glassmorphism pattern
- Card layout with severity-colored left border
- Expanded action detail panel (collapsible)
- Empty state styling
- Animation (fade-in-up) matching existing pattern

---

## 7. Verification Strategy

### 7.1 Build Verification
```bash
npm run build
# Expect: exit 0, no unresolved imports or missing references
```

### 7.2 Runtime Verification

1. **IDLE state**: Page loads with config prompt, no errors
2. **QueryConfigModal**: Opens, accepts coordinates, triggers fetch
3. **LOADING state**: Spinner appears, no broken layout
4. **PROJECTED state (mock)**: 
   - MonthlyProjectionTabs renders 6 month cards with correct data
   - ClimateRiskPanel shows alert cards from mock data
   - ScenarioSimulator/Selector visible and interactive
   - GrowthStressChart renders SVG chart
   - FeatureChart renders factor bars
   - MitigationActions shows cards for fitosanitario/estres_hidrico alerts
5. **Simulation**: Apply scenario, verify new data replaces old
6. **Clear**: Verify all projection data clears, returns to IDLE
7. **Console**: No React warnings, no "missing months" errors
8. **Header**: Shows "IA Predictiva — Riesgos y Mitigación"

### 7.3 Component Verification

| Component | Check |
|-----------|-------|
| MonthlyProjectionTabs | All 5 tabs render data correctly |
| ClimateRiskPanel | Alert cards display, Niño/Niña banner present |
| ScenarioSimulator | Sliders adjust values, stale badge appears |
| ScenarioSelector | Preset buttons populate simulator values |
| GrowthStressChart | SVG renders with 3 lines + legend |
| FeatureChart | Bars render from factor_weights |
| MitigationActions | Cards render from both alert arrays |

---

## 8. Files Checklist

### Modified
- [ ] `src/features/predictions/pages/IAPredictiva.jsx`
- [ ] `src/features/predictions/pages/IAPredictiva.css` (if `.ia-action-banner` is removed)

### Created
- [ ] `src/features/predictions/components/MitigationActions/MitigationActions.jsx`
- [ ] `src/features/predictions/components/MitigationActions/MitigationActions.css`

### Modified (depending on debug findings)
- [ ] `src/features/predictions/components/MonthlyProjectionTabs/MonthlyProjectionTabs.jsx` (if data shape fix needed)
- [ ] `src/shared/services/api.js` (if normalization function added in `getPrediccion`)
- [ ] `src/features/predictions/hooks/usePrediccion.js` (if state machine timing adjustment needed)

### Preserved (untouched)
- All removed component files
- `usePlanRiego`, `useSensores` hooks
- `ClimateRiskPanel/ClimateRiskPanel.jsx`
- `BentoGrid`, `BentoCard`
