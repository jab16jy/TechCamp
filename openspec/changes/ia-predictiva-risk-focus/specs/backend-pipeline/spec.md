# Backend Pipeline Specification

## Purpose

Verify that POST /predict and POST /predict/scenario endpoints work end-to-end, handle edge cases (NASA POWER timeout, missing ISRIC soil data, invalid coordinates, empty indices_satelitales table), and return correct PredictResponse schemas.

## Requirements

### Requirement: POST /predict Coordinate Validation

The endpoint MUST validate latitude and longitude before processing.

#### Scenario: Valid coordinates succeed
- GIVEN a POST /predict request with `lat=10.97` and `lng=-74.78`
- WHEN the endpoint processes
- THEN it MUST return HTTP 200
- AND the response body SHALL contain a non-empty `meses` array

#### Scenario: Invalid latitude rejected
- GIVEN a POST /predict request with `lat=100` and `lng=-74.78`
- WHEN the endpoint validates
- THEN it MUST return HTTP 400 with a descriptive error message

#### Scenario: Missing coordinates with no analysis_id
- GIVEN a POST /predict request with no `lat`, no `lng`, and no `analysis_id`
- WHEN the endpoint validates
- THEN it MUST return HTTP 400

#### Scenario: Invalid analysis_id falls back
- GIVEN a POST /predict request with `analysis_id="not-a-uuid"` and valid `lat`/`lng`
- WHEN the endpoint resolves
- THEN it MUST log a warning and fall back to provided coordinates
- AND return HTTP 200 with projection data

### Requirement: NASA POWER Timeout Resilience

The prediction service MUST fall back to historical Caribbean data when NASA POWER API is unavailable.

#### Scenario: NASA POWER unavailable
- GIVEN `fetch_nasa_climatology` raises or times out
- WHEN `project_window` is called
- THEN the service MUST use default historical data
- AND `fuente` in the response MUST contain "Datos historicos del Caribe"
- AND valid projection data MUST be returned

### Requirement: ISRIC SoilGrids Missing Data Resilience

The prediction service MUST use default soil values when ISRIC SoilGrids returns no data.

#### Scenario: No soil data available
- GIVEN `get_soil_data` returns None (no data or timeout)
- WHEN POST /predict processes without an analysis_id
- THEN the service MUST use `ph_suelo=6.5`, `materia_organica=3.0`, `textura_suelo="Franco"`
- AND return HTTP 200

### Requirement: NDVI Fallback for Empty Satellite Table

The service MUST use `base_ndvi=0.42` when `indices_satelitales` table has no nearby data.

#### Scenario: No satellite records found
- GIVEN `indices_satelitales` has no rows near the requested coordinates
- WHEN `get_satellite_data` returns mock data with `ndvi=0.42`
- THEN the prediction SHALL use `base_ndvi=0.42`
- AND the `ndvi_estimado` values in projection months SHALL be calculated from this baseline
- AND the response SHALL succeed with HTTP 200

### Requirement: POST /predict/scenario Presets

The endpoint MUST apply correct deltas for predefined presets (nino, nina, normal).

#### Scenario: El Niño preset
- GIVEN a POST /predict/scenario request with `preset="nino"`
- WHEN the endpoint processes
- THEN it SHALL apply `precip_delta_pct=-30` and `temp_delta_c=3.0`
- AND return HTTP 200 with a PredictResponse body

#### Scenario: La Niña preset
- GIVEN a POST /predict/scenario request with `preset="nina"`
- WHEN the endpoint processes
- THEN it SHALL apply `precip_delta_pct=40` and `temp_delta_c=-1.5`
- AND return HTTP 200

#### Scenario: Invalid preset value
- GIVEN a POST /predict/scenario request with `preset="invalid_value"`
- WHEN the endpoint validates
- THEN it MUST return HTTP 422

### Requirement: Scenario Delta Bounds

The endpoint MUST enforce bounds on delta values.

#### Scenario: Out-of-bounds precip delta
- GIVEN a POST /predict/scenario request with `precip_delta_pct=200`
- WHEN the endpoint validates
- THEN it MUST return HTTP 422

#### Scenario: Out-of-bounds temp delta
- GIVEN a POST /predict/scenario request with `temp_delta_c=20`
- WHEN the endpoint validates
- THEN it MUST return HTTP 422

### Requirement: PredictResponse Schema Consistency

Both POST /predict and POST /predict/scenario MUST return responses conforming to the PredictResponse schema.

#### Scenario: Full PredictResponse shape
- GIVEN a successful response from either endpoint
- WHEN the body is deserialized
- THEN it MUST contain `meses` (list of MonthProjection), `alertas_globales` (list of Alert), `alertas_patrones` (list of Alert), `ubicacion` (dict with lat/lng), `fuente` (string)
- AND each MonthProjection MUST have `month`, `year`, `month_num`, `temperatura`, `precipitacion`, `humedad`, `ndvi_estimado`
