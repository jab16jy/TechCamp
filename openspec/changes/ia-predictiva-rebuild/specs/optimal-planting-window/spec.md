# Optimal Planting Window Specification

## Purpose

Visualización de la ventana óptima de siembra de 7 días integrada en la sección de proyección estacional. Muestra fecha de inicio, fecha de fin, nivel de confianza, y justificación agronómica.

## Requirements

### Requirement: Visualización de Ventana de Siembra

El componente DEBE calcular y mostrar una ventana óptima de siembra de 7 días basada en los datos de proyección estacional. DEBE incluir: fecha de inicio, fecha de fin, porcentaje de confianza, y texto de justificación.

#### Scenario: Proyección indica ventana favorable

- GIVEN que la proyección estacional retorna condiciones favorables para siembra (temp 24–30°C, precip moderada, humedad suelo adecuada)
- WHEN el componente OptimalWindowCard procesa la proyección
- THEN DEBE mostrar "15 Jun 2026 – 22 Jun 2026" como ventana
- AND la confianza DEBE ser ≥70%
- AND la justificación DEBE mencionar los factores determinantes (temperatura, humedad del suelo)

#### Scenario: Proyección no encuentra ventana óptima

- GIVEN que ninguna ventana de 7 días en los próximos 60 días cumple los criterios mínimos
- WHEN el componente evalúa las proyecciones
- THEN DEBE mostrar "Sin ventana óptima detectada"
- AND DEBE sugerir la ventana más cercana con confianza reducida (<50%)
- AND DEBE listar los factores limitantes

### Requirement: Integración en Proyección Estacional

La tarjeta de ventana de siembra DEBE integrarse dentro de la sección de proyección estacional de IAPredictiva, renderizándose inmediatamente después de los paneles Niño/Niña cuando exista una proyección cargada.

#### Scenario: Carga inicial con proyección disponible

- GIVEN que el usuario navega a la página IA Predictiva y la proyección estacional ya está cargada
- WHEN los paneles climáticos terminan de renderizarse
- THEN la OptimalWindowCard DEBE aparecer debajo con la ventana calculada
- AND DEBE tener animación de entrada fade-in
