# Weather Station Dashboard Specification

## Purpose

Grid de sensores IoT meteorológicos con 4 tipos de sensor, cálculo de riesgo por tipo, y visualización de valores actuales con badges de estado. Backend devuelve datos mock realistas con los nuevos campos extendidos.

## Requirements

### Requirement: Visualización de Sensores Meteorológicos

El dashboard DEBE mostrar una grilla de sensores con 4 tipos: anemómetro (viento_kmh), pluviómetro (pluviometria_mm), sensor de humedad de suelo, y sensor de humectación de hoja (humectacion_hoja_pct). Cada tarjeta DEBE mostrar valor actual, umbral configurado, y badge de riesgo.

#### Scenario: Todos los sensores reportan valores normales

- GIVEN que el backend devuelve datos mock con todos los sensores dentro de umbrales normales
- WHEN el componente SensorDashboard se monta
- THEN DEBE renderizar 4 tarjetas de sensor
- AND cada tarjeta DEBE mostrar un badge verde con estado "OK"
- AND los valores DEBEN actualizarse al recibir nuevos datos del endpoint

#### Scenario: Sensor en estado crítico

- GIVEN que el anemómetro reporta viento_kmh = 65 y su umbral crítico es 60
- WHEN el dashboard recibe los datos
- THEN la tarjeta del anemómetro DEBE mostrar badge rojo "Crítico"
- AND DEBE aplicar animación de alerta (pulso) al badge

### Requirement: Endpoint de Sensores Extendido

El endpoint de sensores DEBE devolver los campos `viento_kmh`, `pluviometria_mm`, y `humectacion_hoja_pct` además de los campos existentes `temperatura` y `humedad_suelo`. Los valores DEBEN ser datos mock realistas para el contexto agrícola caribeño.

#### Scenario: Consulta de sensores retorna todos los campos

- GIVEN que el endpoint `GET /api/sensores` está operativo
- WHEN un cliente autorizado consulta con `lote_id` válido
- THEN la respuesta DEBE incluir los 5 campos de sensor
- AND cada valor DEBE estar dentro de rangos realistas: viento 0–120 kmh, pluviometría 0–200 mm, humectación hoja 0–100%
