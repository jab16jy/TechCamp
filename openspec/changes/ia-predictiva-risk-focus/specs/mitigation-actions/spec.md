# Mitigation Actions Specification

## Purpose

Add a new MitigationActions component that renders per-risk recommendation cards from `proyeccion6M.alertas_globales` and `alertas_patrones`, providing actionable guidance for each detected risk.

## Requirements

### Requirement: Component Existence

A MitigationActions component MUST exist at `src/features/predictions/components/MitigationActions/MitigationActions.jsx` and MUST accept a `proyeccion` prop.

#### Scenario: Component renders without error
- GIVEN the MitigationActions component
- WHEN rendered with a `proyeccion` prop containing alert data
- THEN it MUST return valid JSX
- AND MUST NOT throw

### Requirement: Risk Card Rendering

MitigationActions MUST render one card per alert across both `alertas_globales` and `alertas_patrones`.

#### Scenario: Cards from global alerts
- GIVEN `proyeccion.alertas_globales` contains 3 alerts
- WHEN MitigationActions renders
- THEN it MUST show exactly 3 cards
- AND each card MUST display an icon matching the alert `tipo`

#### Scenario: Cards from pattern alerts
- GIVEN `proyeccion.alertas_patrones` contains a `fenomeno_nino` alert
- WHEN MitigationActions renders
- THEN it MUST include a card with the El Niño risk
- AND the card MUST display the description from `alert.mensaje`

#### Scenario: Combined deduplicated rendering
- GIVEN `proyeccion` has 2 items in `alertas_globales` and 1 in `alertas_patrones`
- WHEN MitigationActions renders
- THEN it MUST render exactly 3 cards total

#### Scenario: Empty state
- GIVEN `proyeccion` has empty or absent `alertas_globales` and `alertas_patrones`
- WHEN MitigationActions renders
- THEN it MUST show an empty state message indicating no risks detected

### Requirement: Card Structure

Each risk card MUST contain: an icon specific to the alert `tipo`, a risk title, a description from `alert.mensaje`, and an action button labeled "Qué hacer".

#### Scenario: Card icon by tipo
- GIVEN an alert with `tipo: 'fitosanitario'`
- WHEN the card renders
- THEN the card icon SHALL be the Bug icon or equivalent fitosanitario representation

#### Scenario: Action button present and functional
- GIVEN any risk card
- WHEN the card renders
- THEN it MUST contain a `<button>` with visible text "Qué hacer"
- AND clicking it SHALL trigger a relevant action (e.g., scroll to related section or show expanded guidance)

### Requirement: Layout Position

MitigationActions MUST render as the 4th row in the IAPredictiva BentoGrid layout when state is PROJECTED.

#### Scenario: Row 4 placement confirmed
- GIVEN IAPredictiva.jsx in PROJECTED state
- WHEN the BentoGrid structure is inspected
- THEN MitigationActions SHALL occupy grid column span 12 in the 4th row position
