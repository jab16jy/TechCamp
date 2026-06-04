# Tasks: IA Predictiva — Risk Focus Refactor

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~330 (180 additions + 150 deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |
| Decision needed before apply | No |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|-----|-------|
| 1 | Frontend refactor + MitigationActions | PR 1 | All phases → single PR; changes concentrated in IAPredictiva.jsx |

## Phase 1: Frontend Refactor (Core)

- [ ] 1.1 Remove `usePlanRiego` and `useSensores` hook imports + destructuring (IAPredictiva.jsx)
- [ ] 1.2 Remove `VITE_USE_NEW_PREDICTION_HOOKS` constant (IAPredictiva.jsx)
- [ ] 1.3 Remove SensorDashboard, NinoPanel, NinaPanel, OptimalWindowCard, FenologiaTimeline from JSX (IAPredictiva.jsx)
- [ ] 1.4 Remove PlanVisualizationCard, StressReductionChart, ExportPlanButton from JSX (IAPredictiva.jsx)
- [ ] 1.5 Remove HistorialPlanes section + `generandoPlan` loading spinner (IAPredictiva.jsx)
- [ ] 1.6 Remove `handleGenerarPlan` handler (IAPredictiva.jsx)
- [ ] 1.7 Simplify `handleClearAll` — drop `clearPlan` call, relabel button text (IAPredictiva.jsx)
- [ ] 1.8 Rename header from "DSS Integral" to "IA Predictiva — Riesgos y Mitigación" (IAPredictiva.jsx)
- [ ] 1.9 Remove unused Lucide icons from import (IAPredictiva.jsx)
- [ ] 1.10 Remove unused CSS classes (`.ia-action-banner`, plan-history, etc.) (IAPredictiva.css)

## Phase 2: MitigationActions Component

- [ ] 2.1 Create `MitigationActions/MitigationActions.jsx` — accept `proyeccion` prop, merge `alertas_globales` + `alertas_patrones`, filter to `critico`/`alto` severity
- [ ] 2.2 Render action cards with severity-colored left border, TIPO_ICON map, "Qué hacer" expand toggle
- [ ] 2.3 Create `MitigationActions/MitigationActions.css` — glass container, 2-col card grid, expanded detail panel, empty state
- [ ] 2.4 Wire MitigationActions into IAPredictiva.jsx — import + place as col-12 row 4 in BentoGrid

## Phase 3: Climate Risk Merge

- [ ] 3.1 Verify `proyeccion6M.alertas_patrones` passes to ClimateRiskPanel via `proyeccion` prop (design says no changes needed)
- [ ] 3.2 Remove `showNino`/`showNina` derived variables from IAPredictiva.jsx (standalone panels already gone in 1.3)

## Phase 4: MonthlyProjectionTabs Fix

- [ ] 4.1 Add `console.debug` logs for `proyeccion`, `meses`, and first `mes` shape (MonthlyProjectionTabs.jsx)
- [ ] 4.2 Add `normalizePredictResponse()` in `api.js` — defensive field aliasing (`temperatura_media`→`temperatura`, etc.)
- [ ] 4.3 Call normalize in `getPrediccion()` after POST /predict succeeds
- [ ] 4.4 Remove debug logging after confirming data renders

## Phase 5: Backend/Data Verification

- [ ] 5.1 Verify POST /predict returns valid PredictResponse with non-empty `meses`, `alertas_globales`, `alertas_patrones`
- [ ] 5.2 Verify POST /predict/scenario applies preset deltas (nino→-30%/+3.0°C, nina→+40%/-1.5°C)
- [ ] 5.3 Verify NASA POWER timeout fallback returns `fuente: "Datos historicos del Caribe"` with valid data
- [ ] 5.4 Verify `npm run build` passes with zero errors

## Phase 6: Clean Up

- [ ] 6.1 Audit unused imports (icons, components, hooks) — remove any stragglers missed in Phase 1
- [ ] 6.2 Final verification: `npm run lint` + `npm run build` + manual PROJECTED state check
