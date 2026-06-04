# Proposal: IA Predictiva — Risk Focus Refactor

## Intent

Strip IAPredictiva from overstuffed "DSS Integral" into a focused risk prediction + mitigation simulator. The previous `ia-predictiva-rebuild` added SensorDashboard, NinoPanel, NinaPanel, OptimalWindowCard, FenologiaTimeline, PlanVisualizationCard, StressReductionChart, ExportPlanButton, and HistorialPlanes — all features that belong on other pages. This change removes them from rendering, fixes the broken MonthlyProjectionTabs data pipeline, and adds a Mitigation Actions section for concrete recommendations per risk.

## Scope

### In Scope
- Remove SensorDashboard, NinoPanel, NinaPanel, OptimalWindowCard, FenologiaTimeline from IAPredictiva rendering (keep files for reuse)
- Remove PlanVisualizationCard, StressReductionChart, ExportPlanButton, HistorialPlanes section (candidates for deletion)
- Remove usePlanRiego and useSensores hooks (imports + usage)
- Remove `VITE_USE_NEW_PREDICTION_HOOKS` feature flag
- Merge Niño/Niña indicators into ClimateRiskPanel (remove standalone panels)
- Fix MonthlyProjectionTabs data display (data arrives but doesn't render)
- Add MitigationActions component — per-risk recommendation cards
- Simplify BentoGrid layout to 4 rows max
- Rename header from "DSS Integral" to "IA Predictiva — Riesgos"

### Out of Scope
- Deleting component files — keep for other pages (SensoresIoT, AnalisisCultivos)
- Moving components to other pages — deferred to future changes
- Backend changes — pure frontend refactor
- New charts or prediction model changes

## Capabilities

### New Capabilities
- `mitigation-actions`: Risk-based mitigation recommendations rendered as actionable cards per detected risk

### Modified Capabilities
- `climate-scenario-panels`: Merge El Niño/La Niña standalone panels into ClimateRiskPanel as sub-indicators. Remove standalone NinoPanel/NinaPanel rendering. ClimateRiskPanel gains integrated pattern display.

## Approach

1. **Strip hooks**: Remove `usePlanRiego`, `useSensores` imports and all destructured values. Only `usePrediccion` remains.
2. **Strip components**: Remove all 7 feature components + HistorialPlanes section from JSX.
3. **Remove flag**: Delete `VITE_USE_NEW_PREDICTION_HOOKS` — no longer needed with single hook.
4. **Merge Niño/Niña**: Pass `proyeccion6M.alertas_patrones` to ClimateRiskPanel. Add sub-indicator rendering for El Niño/La Niña conditions inside the panel.
5. **Fix projection data**: Investigate MonthlyProjectionTabs prop shape — data arrives from API but months array may have wrong structure. Fix data transformation or prop mapping.
6. **Add MitigationActions**: New component reads `proyeccion6M.riesgos` + `alertas_patrones`, maps each to a recommendation card with icon, title, description, and action button.
7. **Simplify layout**: Remove rows for sensors, optimal window, fenologia, plan section. Remaining: ProjectionTabs + ClimateRiskPanel, ScenarioSimulator + Selector, GrowthStressChart + FeatureChart, MitigationActions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/predictions/pages/IAPredictiva.jsx` | Modified | Strip hooks, rendering, layout, header |
| `src/features/predictions/components/ClimateRiskPanel/` | Modified | Merge Niño/Niña indicators |
| `src/features/predictions/components/MonthlyProjectionTabs/` | Fix | Data pipeline — inspect + correct |
| `src/features/predictions/components/MitigationActions/` | New | Risk recommendation cards |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| MonthlyProjectionTabs fix reveals backend shape mismatch | Med | Investigate network response first; adjust frontend mapping |
| ClimateRiskPanel becomes crowded with Niño/Niña merged | Low | Use collapsible sub-section or badge indicators |
| Components reused elsewhere still depend on hooks we strip | None | Hooks not deleted; unstripped imports from other pages work |

## Rollback Plan

1. Revert commit — all removed rendering code in git history.
2. Component files untouched — no data loss for other pages.
3. Hooks preserved on disk — only import lines removed from IAPredictiva.jsx.

## Dependencies

None. Pure frontend JSX refactor. No backend, no API contract changes.

## Success Criteria

- [ ] IAPredictiva renders only: QueryConfigModal, MonthlyProjectionTabs, ClimateRiskPanel, ScenarioSimulator+Selector, GrowthStressChart, FeatureChart, MitigationActions
- [ ] MonthlyProjectionTabs displays 6-month data correctly
- [ ] Niño/Niña indicators appear inside ClimateRiskPanel as sub-badges
- [ ] MitigationActions shows ≥1 recommendation per detected risk
- [ ] `npm run build` passes with zero errors
- [ ] No usePlanRiego, useSensores, or VITE_USE_NEW_PREDICTION_HOOKS references in IAPredictiva.jsx
