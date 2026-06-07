---
titulo: "Diseno Original de Modulos"
proyecto: AgroCaribe IA
tags: [diseno, modulos, original, referencia-historica]
---

> **📌 NOTA: DOCUMENTACION HISTORICA**
> Este documento describe el diseno original de los modulos (fase de prototipado).
> La implementacion actual difiere EN CASI TODOS LOS ASPECTOS. Cambios principales:
> - **AnalisisCultivos**: Redisenado completamente (layout Copernicus: panel izquierdo + mapa completo)
> - **ResultadoAvanzado**: Eliminado — el analisis de suelo se unifico con el analisis de cultivo principal
> - **IAPredictiva**: Refactorizada de 500+ lineas ("DSS Integral") a ~290 lineas (enfoque riesgo climatico)
> - **SensoresIoT**: Datos reales desde PostgreSQL, no mock
> - **Dashboard**: Metricas reales desde backend, no mock
> - **GestionReportes**: Alertas reales, comparativa, exportacion funcional
> - **AgroAsesor**: Chatbot real con RAG + LangChain (no mock)
>
> Ver `docs/4-arquitectura/` para la documentacion actualizada del sistema.

# Módulos de Desarrollo

Este documento cubre los módulos de IA, sensores, dashboard, análisis y reportes del ecosistema AgroCaribe.

## IA Predictiva

**Ruta:** `/investigador/ia` · **Componente:** `IAPredictiva.jsx`

Motor de predicción basado en Machine Learning (Random Forest + LSTM) para simular el impacto de decisiones agronómicas.

### Herramientas

- **XAI - Factores de Influencia:** Barras horizontales que muestran qué variables (precipitación, nitrógeno, pH) impulsan la predicción actual
- **Simulador de Rendimiento:** Sliders para ajustar riego y fertilización NPK; el gráfico se actualiza reactivamente
- **Proyección Crecimiento vs Estrés:** Línea dual con crecimiento (biomasa) y estrés (riesgo hídrico/térmico)
- **Mapa de Productividad:** Time slider para previsualizar rendimiento en T+1, T+2, T+3

### Métricas

Precisión algorítmica: 94.2%

## Sensores IoT

**Ruta:** `/investigador/sensores` · **Componente:** `SensoresIoT.jsx`

Monitoreo en vivo de la red de sensores desplegada en campo.

### Componentes

- **Panel de Salud de Nodos:** Métricas RSSI, batería y estado online/offline
- **Mapa Interactivo:** Capas toggle con marcadores IoT y overlay NDVI (Sentinel-2)
- **Control de Actuadores:** Interruptor simulado para electro-válvulas de riego con feedback visual
- **Telemetría Detallada:** Gauges de humedad de suelo, temperatura, humedad relativa + sparklines de tendencia

### Especificaciones

- Frecuencia de simulación: cada 3 segundos
- Logs cronológicos de eventos (ej. "Válvula Sector B abierta por IA")

## Dashboard del Investigador

**Ruta:** `/investigador/dashboard` · **Componente:** `DashboardInvestigador.jsx`

Hub central con vista de 360 grados sobre la operación agrícola.

### Paneles

- **Métricas de Modelos IA:** Tabla con precisión, F1-Score, MAE y confianza por cultivo:
  - Yuca: 95.8% / F1: 0.94
  - Ñame: 93.2% / F1: 0.91
  - Guineo: 91.5% / F1: 0.89
  - Papa: 89.1% / F1: 0.87
- **Bento-Grid de Monitoreo:** Actualizaciones de campo, sensores locales, accesos directos y exportación
- **Fondo:** Mapa satelital interactivo con `mix-blend-overlay`

## Análisis de Cultivos

**Ruta:** `/investigador/analisis` · **Componente:** `AnalisisCultivos.jsx`

Interfaz principal de entrada de datos para el motor de predicción.

### Modos

- **Simple (Productor):** Geolocalización + parámetros básicos. Redirige a `/resultado`
- **Avanzado (Investigador):** Panel de calidad de suelo con pH, N, P, K + sliders climáticos. Redirige a `/investigador/resultado-avanzado`

### Parámetros Agronómicos

- Ubicación (departamento, municipio con filtrado dinámico)
- Tipo de suelo (arcilloso, arenoso, franco)
- Área en hectáreas, mes de siembra, acceso a riego

## Resultado Avanzado (Calidad de Suelo)

**Ruta:** `/investigador/resultado-avanzado` · **Componente:** `ResultadoAvanzado.jsx`

Análisis técnico profundo de suelos con visualizaciones avanzadas.

### Visualizaciones

- **Radar Nutricional (SVG Spider Chart):** Superpone datos actuales del lote vs objetivo del cultivo. Ejes: N, P, K, pH, Conductividad Eléctrica, Materia Orgánica
- **Isolíneas de Calor (3D Heatmap):** Distribución de Nitrógeno total en la parcela (gradiente azul → rojo)
- **Parámetros Químicos:** Progress bars con código de colores (N: 58 mg/kg ALTO, P: 21 mg/kg ESTABLE, K: 195 mg/kg OPTIMO)

### Reportes Generados

- Diagnóstico automático de fertilidad
- Mapa de aplicación variable con sugerencias de dosificación

## AgroAsesor

**Ruta:** `/investigador/mapas` · **Componente:** `AgroAsesor.jsx`

Herramienta de análisis inmersivo que combina mapa interactivo con asistente virtual.

### Componentes

- **Mapa Interactivo:** Capas Sentinel-2 con polígonos NDVI, nodos IoT en tiempo real, geofencing visual con círculos de calor
- **Panel de Chat (Dark Glass):** Asistente conversacional sobre el mapa con interpretación de consultas técnicas, indicadores de confianza y sugerencias contextuales

### Stack

- Mapping: Leaflet.js (proveedores Maxar/Esri)
- UI: Tailwind (posicionamiento absoluto) + Framer Motion (colapso de panel)

---

## Referencias

- [[3-frontend/ARQUITECTURA_FRONTEND]] — Arquitectura actual del frontend
- [[4-arquitectura/VISION_SISTEMA]] — Vision general del sistema implementado
- [[4-arquitectura/FLUJO_DATOS]] — Flujo de datos Frontend-Backend actual
- [[2-backend/ARQUITECTURA_BACKEND]] — Endpoints y servicios backend implementados

## Gestión de Reportes

**Ruta:** `/investigador/reportes` · **Componente:** `GestionReportes.jsx`

Centro de reportería técnica y auditoría.

### Visualizaciones

- **Gauge OEE:** Eficiencia operativa (82%) con gradiente dinámico de 240°
- **Grid Evolución NDVI:** 6 mini-heatmaps mensuales con delta porcentual
- **Gestor de Tareas IA:** Lista de tareas críticas con prioridad (rojo/amarillo/verde) y barra de progreso
- **Análisis Hidrológico:** Combo chart (barras de precipitación + línea de humedad NDWI)

### Exportación

PDF técnico optimizado para auditoría crediticia y RSPO, incluyendo mapas, métricas y registro de acciones.
