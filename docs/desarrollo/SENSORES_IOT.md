# Monitoreo de Red IoT en Tiempo Real

Documentación técnica del sistema de telemetría y control de actuadores en campo de **AgroCaribe IA**.

## 1. Visión General
Módulo diseñado para el seguimiento en vivo de la red de sensores desplegada en la plantación. Integra visualización geoespacial con datos de salud de hardware y control remoto de sistemas de riego.

## 2. Arquitectura de la Interfaz

### 2.1. Panel de Salud de Nodos (Sidebar Izquierdo)
*   **Métricas por Nodo:**
    *   **RSSI:** Calidad de señal (dBm).
    *   **Batería:** Estado de carga de celdas solares.
    *   **Estado:** Online / Offline.
*   **Agrupación:** Lista vertical compacta con indicadores visuales de alerta.

### 2.2. Mapa Interactivo de Parcelas
*   **Capas (Layer Toggle):**
    *   **Marcadores IoT:** Posición exacta de los nodos numerados.
    *   **Sentinel-2 NDVI Overlay:** Mapa de calor de salud vegetal (gradiente amarillo → verde esmeralda con blur dinámico).
*   **Interactividad:** Al hacer clic en un nodo se actualiza el panel de telemetría detallada.

### 2.3. Control de Actuadores (Válvula de Riego)
*   **Simulación de Control:** Interruptor para apertura/cierre de electro-válvulas.
*   **Feedback Visual:** Animación de "flujo de agua" en la interfaz cuando el riego está activo.

### 2.4. Telemetría Detallada (Panel Derecho)
*   **Gauges Técnicos:** Humedad de suelo (%), Temperatura ambiente (°C), Humedad relativa (%).
*   **Sparklines:** Gráficos de línea miniatura mostrando la tendencia de los últimos 15 minutos.

## 3. Especificaciones Técnicas
*   **Frecuencia de Actualización:** Simulación de datos cada 3 segundos.
*   **Estética:** Layout de alta densidad, bordes redondeados (14px), paleta técnica esmeralda y pizarra.
*   **Tecnología:** SVG para mapas y gráficos, React hooks para manejo de estados de sensores.

## 4. Resultados Generados
*   **Logs de Eventos:** Registro cronológico de cambios de estado (e.g., "Válvula Sector B abierta por IA").
*   **Alertas de Mantenimiento:** Detección de baja señal o batería crítica en nodos específicos.
