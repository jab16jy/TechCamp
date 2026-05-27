# Scenario Simulator Specification

## Purpose

Simulador interactivo what-if con 4 sliders, 3 presets climáticos, endpoint dedicado `/predict/scenario`, y gráfico reactivo de crecimiento vs estrés (hídrico + térmico).

## Requirements

### Requirement: Controles del Simulador

El simulador DEBE ofrecer 4 sliders: riego (%), NPK (kg/ha), precipitación (Δ%), y temperatura (Δ°C). Cada slider DEBE tener rango etiquetado, valor numérico visible, y paso fino. Adicionalmente DEBE incluir 3 presets: El Niño, La Niña, y Normal.

#### Scenario: Usuario ajusta sliders manualmente

- GIVEN que el simulador está montado con valores defaults
- WHEN el usuario mueve el slider de temperatura a +3°C y el de riego a 120%
- THEN los valores numéricos DEBEN actualizarse en tiempo real
- AND al presionar "Aplicar Escenario", DEBE llamarse `POST /predict/scenario` con los 4 parámetros

#### Scenario: Usuario selecciona un preset

- GIVEN que el usuario selecciona el preset "El Niño" desde el selector de presets
- WHEN se aplica el preset
- THEN los 4 sliders DEBEN ajustarse a los valores predefinidos de El Niño
- AND DEBE dispararse automáticamente la llamada `POST /predict/scenario`

### Requirement: Gráfico Crecimiento vs Estrés

El simulador DEBE incluir un gráfico de dos métricas: proyección de crecimiento (%) y estrés compuesto (hídrico + térmico en escala 0–100). El gráfico DEBE actualizarse reactivamente al recibir respuesta del endpoint.

#### Scenario: Gráfico se actualiza con nueva predicción

- GIVEN que se aplicó un escenario de sequía severa (precip -50%, temp +4°C)
- WHEN el endpoint `POST /predict/scenario` responde
- THEN el gráfico DEBE mostrar crecimiento proyectado reducido
- AND el estrés compuesto DEBE ser alto (>75)
- AND la transición entre escenarios DEBE animarse con interpolación

#### Scenario: Endpoint de escenario falla

- GIVEN que `POST /predict/scenario` retorna error 500
- WHEN el simulador recibe la respuesta de error
- THEN DEBE mostrar un mensaje de error amigable "No se pudo calcular el escenario"
- AND los sliders DEBEN mantener sus valores actuales (no resetear)
