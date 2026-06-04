# Frontend Refactor Specification

## Purpose

Strip IAPredictiva from its overstuffed "DSS Integral" rendering into a focused risk prediction and mitigation tool by removing unused hooks, components, and feature flags, simplifying layout to 4 rows, and renaming the header.

## Requirements

### Requirement: Hook Stripping

The IAPredictiva page MUST NOT import or use `usePlanRiego` or `useSensores` hooks. Only `usePrediccion` SHALL remain.

#### Scenario: No usePlanRiego import exists
- GIVEN IAPredictiva.jsx
- WHEN the file is inspected
- THEN there MUST be no `import usePlanRiego` statement
- AND no destructured values from `usePlanRiego()` appear in the render

#### Scenario: No useSensores import exists
- GIVEN IAPredictiva.jsx
- WHEN the file is inspected
- THEN there MUST be no `import useSensores` statement
- AND no destructured values from `useSensores()` appear in the render

#### Scenario: usePrediccion remains
- GIVEN IAPredictiva.jsx
- WHEN the file is inspected
- THEN `usePrediccion` MUST remain imported and used
- AND the page MUST still call `fetchProyeccion`, `simularEscenario`, `selectAnalysis`, `handleManualQuery`, and `clearProyeccion`

### Requirement: Feature Flag Removal

The `VITE_USE_NEW_PREDICTION_HOOKS` feature flag MUST be removed from IAPredictiva.jsx.

#### Scenario: No feature flag reference
- GIVEN IAPredictiva.jsx
- WHEN the file is searched for `USE_NEW_HOOKS` or `VITE_USE_NEW_PREDICTION_HOOKS`
- THEN no reference MUST exist

### Requirement: Component Rendering Removal

IAPredictiva MUST NOT render SensorDashboard, NinoPanel, NinaPanel, OptimalWindowCard, FenologiaTimeline, PlanVisualizationCard, StressReductionChart, or ExportPlanButton. The HistorialPlanes section MUST also be removed. Component files SHALL remain on disk for reuse elsewhere.

#### Scenario: Removed components absent from JSX
- GIVEN IAPredictiva.jsx in PROJECTED state
- WHEN the rendered DOM is inspected
- THEN there MUST be no SensorDashboard, NinoPanel, NinaPanel, OptimalWindowCard, FenologiaTimeline, PlanVisualizationCard, StressReductionChart, ExportPlanButton, or HistorialPlanes elements

#### Scenario: Import lines removed
- GIVEN IAPredictiva.jsx
- WHEN import statements are inspected
- THEN imports for all 8 removed components MUST be absent

#### Scenario: Component files preserved
- GIVEN the filesystem under `src/features/predictions/components/`
- WHEN SensorDashboard, NinoPanel, NinaPanel, OptimalWindowCard, FenologiaTimeline directories are listed
- THEN each component file MUST still exist on disk

### Requirement: Simplified Layout

The projected state layout MUST render exactly 4 rows in the BentoGrid.

#### Scenario: Four-row layout renders
- GIVEN IAPredictiva.jsx in PROJECTED state
- WHEN the BentoGrid content is rendered
- THEN row 1 MUST contain MonthlyProjectionTabs + ClimateRiskPanel
- AND row 2 MUST contain ScenarioSimulator + ScenarioSelector
- AND row 3 MUST contain GrowthStressChart + FeatureChart
- AND row 4 MUST contain MitigationActions

### Requirement: Header Rename

The page header MUST display "IA Predictiva — Riesgos y Mitigación" instead of "DSS Integral".

#### Scenario: Header displays new title
- GIVEN IAPredictiva.jsx
- WHEN the `<h1>` element is rendered
- THEN its text MUST include "IA Predictiva — Riesgos y Mitigación"
- AND MUST NOT contain "DSS Integral"

### Requirement: Build Integrity

The refactored page MUST pass `npm run build` with zero errors.

#### Scenario: Build succeeds
- GIVEN the refactored IAPredictiva.jsx
- WHEN `npm run build` is executed
- THEN it MUST exit with code 0
- AND no unresolved import or missing reference errors MUST appear
