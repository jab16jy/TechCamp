# Climate Scenario Panels Specification

## Purpose

Paneles dedicados El Niño y La Niña con umbrales precisos de activación, métricas clave, acciones recomendadas, e indicador de severidad. Aparecen condicionalmente según patrones detectados en la proyección estacional.

## Requirements

### Requirement: Panel El Niño

El sistema DEBE mostrar el panel El Niño cuando la proyección indique temperatura >35°C Y precipitación acumulada <10mm en los próximos 30 días. El panel DEBE incluir: métricas de temperatura y precipitación, alerta de riego crítico, recomendación de mulch, y severidad (moderada/alta/extrema).

#### Scenario: Umbrales El Niño activan el panel

- GIVEN que la proyección estacional devuelve temp_media=37°C y precip_acumulada=5mm
- WHEN el componente NinoPanel evalúa los umbrales
- THEN DEBE renderizarse con alerta "Riego Crítico"
- AND DEBE mostrar acción recomendada "Aplicar mulch en toda la parcela"
- AND la severidad DEBE ser "Alta"

#### Scenario: Umbrales El Niño no se alcanzan

- GIVEN que temp_media=33°C y precip_acumulada=15mm
- WHEN el componente evalúa las condiciones
- THEN el panel NO DEBE renderizarse

### Requirement: Panel La Niña

El sistema DEBE mostrar el panel La Niña cuando humedad relativa >85% Y el sensor de humedad de suelo indique saturación. El panel DEBE incluir: métricas de humedad, alerta de hongos, y severidad.

#### Scenario: Umbrales La Niña activan el panel

- GIVEN que humedad_relativa=90% y humedad_suelo indica "saturado"
- WHEN el componente NinaPanel evalúa los umbrales
- THEN DEBE renderizarse con alerta "Riesgo de Hongos"
- AND DEBE mostrar severidad "Alta"
- AND DEBE incluir tracking NDVI como métrica de referencia

#### Scenario: Solo humedad alta sin saturación de suelo

- GIVEN que humedad_relativa=88% pero humedad_suelo es "normal"
- WHEN se evalúan las condiciones
- THEN el panel NO DEBE activarse
- AND DEBE loguearse como "La Niña parcial — solo humedad elevada"
