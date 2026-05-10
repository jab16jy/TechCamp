# AgroCaribe IA: Gestión y Reportes Consolidados

## 1. Propósito del Módulo
El módulo de Gestión y Reportes centraliza la analítica histórica y proactiva de una parcela específica (ej. Sector Norte - Parcela 4). Su función es proporcionar al administrador de la finca o al investigador un resumen ejecutivo del estado del cultivo y las acciones pendientes sugeridas por la IA.

---

## 2. Indicadores de Gestión

### 2.1 Eficiencia de Parcela (OEE)
Un indicador visual estilo "Gauge" (Velocímetro) que muestra el **Índice OEE** (Overall Equipment Effectiveness / Eficiencia Global de la Parcela).
*   **Significado:** Integra salud foliar, uso de recursos y rendimiento proyectado.
*   **Estado:** Clasifica el rendimiento (ej. "Óptimo", "Bajo Alerta").

### 2.2 Evolución del Vigor (NDVI Histórico)
Visualización secuencial de la salud de la planta a lo largo de los meses (Marzo - Agosto).
*   **Mini-Mapas:** Tarjetas interactivas con capturas satelitales mensuales.
*   **Tendencias:** Indicadores de crecimiento (`trending_up`) o declive (`trending_down`) porcentual del vigor vegetativo.

---

## 3. Inteligencia Proactiva

### 3.1 Acciones Recomendadas por IA
Un listado de tareas prioritarias derivadas del análisis de datos de sensores y satélite:
*   **Prioridad Alta (Roja):** Ajustes críticos inmediatos (ej. saturación de riego).
*   **Prioridad Media (Amarilla):** Ventanas óptimas de fertilización.
*   **Prioridad Baja (Verde):** Mantenimiento preventivo.

### 3.2 Análisis Hidrológico Cruzado
Gráfica combinada que muestra la correlación entre:
1.  **Precipitación (Barras):** Milímetros de lluvia registrados.
2.  **Humedad Retenida (Línea):** Porcentaje de agua que el suelo conserva.
*   **Utilidad:** Identificar deficiencias en el drenaje o la necesidad de aumentar la frecuencia de riego artificial.

---

## 4. Salida de Datos y Exportación
El sistema culmina en la generación del **Reporte Técnico Mensual**:
*   **Contenido:** Documento consolidado (PDF) con métricas, mapas NDVI de alta resolución y el log de acciones sugeridas.
*   **Auditoría:** Diseñado para cumplir con los requisitos de certificación de sostenibilidad (ej. RSPO para palma).

---

## 5. Diseño y UX (Gestión)
*   **Header Dinámico:** Muestra la fecha del reporte y acciones rápidas (Imprimir/Compartir).
*   **Interacción de Mini-Mapas:** Al seleccionar un mes, el sistema resalta el mapa correspondiente, permitiendo un análisis temporal fluido.
*   **Estilo:** Basado en el sistema de diseño "Tropical-Tech" con bordes redondeados y sombras sutiles sobre fondos claros (`surface-container-lowest`).

---
**Documentación de Desarrollo**
*   **Componente:** `GestionReportes.jsx`
*   **Estilos:** `GestionReportes.module.css`
*   **Visualización:** Gráficas Gauge y Gráficos Hidrológicos en SVG.
