# Climate Risk Merge Specification

## Purpose

Integrate El Niño/La Niña climate pattern detection into ClimateRiskPanel (which already supports `fenomeno_nino` and `fenomeno_nina` types via native banner rendering) and remove standalone NinoPanel/NinaPanel rendering from IAPredictiva.

## Requirements

### Requirement: ClimateRiskPanel Handles Niño/Niña

The ClimateRiskPanel SHALL render specialized banners for `fenomeno_nino` and `fenomeno_nina` alert types from `alertas_patrones`.

#### Scenario: El Niño banner renders
- GIVEN `proyeccion.alertas_patrones` contains an alert with `tipo: 'fenomeno_nino'`
- WHEN ClimateRiskPanel renders
- THEN a red-themed banner MUST appear with "El Niño" in its heading
- AND the banner MUST include an action recommendation for drought preparation

#### Scenario: La Niña banner renders
- GIVEN `proyeccion.alertas_patrones` contains an alert with `tipo: 'fenomeno_nina'`
- WHEN ClimateRiskPanel renders
- THEN a blue-themed banner MUST appear with "La Niña" in its heading
- AND the banner MUST include an action recommendation for drainage and fungal monitoring

#### Scenario: Both Niño and Niña present
- GIVEN `alertas_patrones` contains both `fenomeno_nino` and `fenomeno_nina` alerts
- WHEN ClimateRiskPanel renders
- THEN the El Niño banner MUST render first (higher severity, red theme)
- AND La Niña specific alerts MUST still appear in the alerts list below the banner

#### Scenario: No climate patterns
- GIVEN `alertas_patrones` is empty or absent
- WHEN ClimateRiskPanel renders
- THEN a "Sin fenómenos climáticos extremos detectados" message SHALL display

### Requirement: Standalone Panels Removed

IAPredictiva MUST NOT render NinoPanel or NinaPanel components.

#### Scenario: NinoPanel and NinaPanel unused
- GIVEN IAPredictiva.jsx in PROJECTED state
- WHEN the rendered JSX is inspected
- THEN no `<NinoPanel>` or `<NinaPanel>` component SHALL appear
- AND the `showNino` / `showNina` derived variables SHALL be removed from the page

### Requirement: alertas_patrones Propagation

The `proyeccion6M.alertas_patrones` MUST flow correctly to ClimateRiskPanel as part of the `proyeccion` prop.

#### Scenario: alertas_patrones renders in panel
- GIVEN `proyeccion6M` has `alertas_patrones` with `fenomeno_nino` data
- WHEN `proyeccion6M` is passed as `proyeccion` to ClimateRiskPanel
- THEN the panel SHALL render the El Niño banner from `proyeccion.alertas_patrones`
