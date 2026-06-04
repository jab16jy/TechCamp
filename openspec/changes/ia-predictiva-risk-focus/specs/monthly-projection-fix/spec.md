# Monthly Projection Fix Specification

## Purpose

Fix the data display pipeline for MonthlyProjectionTabs so that 6-month projection data from POST /predict (or mock fallback) renders correctly in the tabbed interface.

## Requirements

### Requirement: Data Shape Compatibility

The `meses` array in the `proyeccion` prop MUST match the fields expected by MonthlyProjectionTabs: `month`, `temperatura`, `precipitacion`, `humedad`, `ndvi_estimado`, `cultivos_recomendados`, and optionally `etapa_fenologica`.

#### Scenario: Full meses array renders correctly
- GIVEN `proyeccion.meses` has 6 entries with all required fields
- WHEN MonthlyProjectionTabs renders the overview tab
- THEN each month card SHALL display temperature, precipitation, humidity, and NDVI values
- AND the displayed values SHALL match the numeric data from each month entry

#### Scenario: Temperatura tab renders bars
- GIVEN `proyeccion.meses` with valid `temperatura` values
- WHEN the "Temperatura" tab is active
- THEN each month SHALL show a horizontal bar proportional to its temperature value
- AND the label SHALL display the numeric °C value

#### Scenario: Cultivos tab renders recommendations
- GIVEN `proyeccion.meses` with `cultivos_recomendados` arrays
- WHEN the "Cultivos" tab is active
- THEN each month SHALL display up to 3 crop recommendations with score and risk badge

### Requirement: Null/Empty Guards

MonthlyProjectionTabs MUST properly guard against nullish `proyeccion` and empty `meses` arrays without throwing.

#### Scenario: Null proyeccion
- GIVEN `proyeccion` prop is null or undefined
- WHEN MonthlyProjectionTabs renders
- THEN it MUST return null (render nothing)
- AND MUST NOT throw TypeError

#### Scenario: Empty meses array
- GIVEN `proyeccion.meses` is an empty array `[]`
- WHEN the `!proyeccion?.meses?.length` guard evaluates
- THEN the component MUST return null

### Requirement: Loading State

MonthlyProjectionTabs SHALL display a loading spinner when `loading` prop is true, and MUST NOT attempt to render month data.

#### Scenario: Loading spinner shown
- GIVEN `loading` prop is true
- WHEN MonthlyProjectionTabs renders
- THEN it MUST show an animated spinner and "Calculando proyeccion..." text

### Requirement: State Machine Timing

The `usePrediccion` hook state machine (`IDLE → LOADING → PROJECTED`) MUST set `proyeccion6M` only after the full response is received, so that `proyeccion?.meses?.length` is non-null when the component reads it.

#### Scenario: Projected state has meses
- GIVEN `fetchProyeccion` resolves successfully
- WHEN `setEstado(ESTADOS.PROJECTED)` is called
- THEN `proyeccion6M.meses` MUST be a non-empty array
- AND MonthlyProjectionTabs SHALL render month cards

### Requirement: Mock Fallback Compatibility

The mock fallback in `getPrediccion` MUST produce a `meses` array whose entries match the MonthProjection schema expected by the tabs.

#### Scenario: Mock data renders in tabs
- GIVEN the API client fallback is used (backend unavailable)
- WHEN `fetchProyeccion` returns mock data
- THEN MonthlyProjectionTabs SHALL render all months without errors
- AND the mock `meses` SHALL include `month`, `temperatura`, `precipitacion`, `humedad`, `ndvi_estimado`, and `cultivos_recomendados` fields
