# Agro-Asesor IA - Interfaz Especializada

Documentación técnica del **Agro-Asesor IA**, el módulo de interacción avanzada y análisis geoespacial de AgroCaribe IA.

## 1. Visión General
El Agro-Asesor es una herramienta de **Análisis Inmersivo** que combina un mapa interactivo de alta resolución con un asistente virtual basado en IA. Está diseñado para que el investigador realice diagnósticos profundos sobre lotes específicos mediante el cruce de datos multiespectrales y telemetría de campo.

## 2. Arquitectura de Componentes

### 2.1. Mapa Interactivo (Capa Base)
Utiliza `react-leaflet` para la visualización geoespacial dinámica.
*   **Capas de Datos (Sentinel-2):** Visualización de capas de satélite (ESRI/OSM) y superposiciones de polígonos NDVI.
*   **Nodos IoT Real-time:** Marcadores interactivos que muestran datos de sensores físicos (Humedad, Temperatura, NDVI local) al hacer clic.
*   **Geofencing Visual:** Círculos de calor y áreas de interés para identificar zonas de estrés hídrico o salud foliar.

### 2.2. Panel de Chat (Glassmorphism Overlay)
Asistente conversacional posicionado sobre el mapa con una estética premium y translúcida.
*   **Motor de IA:** Capacidad para interpretar consultas técnicas y devolver insights basados en los datos visibles en el mapa.
*   **Feedback de Procesamiento:** Indicadores de estado de sincronización con Sentinel-2 y porcentaje de confianza de la IA.
*   **Sugerencias Contextuales:** Botones flotantes para ejecutar análisis comunes (Optimización de fertilización, Proyección climática).

## 3. Especificaciones Técnicas y de Diseño
*   **Estética:** Diseño "Dark Glass" para el panel de chat para resaltar sobre los fondos verdes/satelitales del mapa.
*   **Tecnologías:**
    *   **Mapping:** Leaflet.js con proveedores de teselas de Maxar/Esri.
    *   **UI:** Tailwind CSS para posicionamiento absoluto y Framer Motion para el colapso del panel de chat.
    *   **UX:** Chips superiores informativos con datos en vivo (Ubicación, Promedio NDVI, Clima).

## 4. Casos de Uso
*   **Detección de Anomalías:** Identificar visualmente una zona roja en el mapa y preguntar al chat por las posibles causas basadas en el historial del nodo IoT más cercano.
*   **Prescripción Técnica:** Solicitar recomendaciones de NPK para un lote específico seleccionándolo en la interfaz.
