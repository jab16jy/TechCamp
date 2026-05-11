# Gestión y Reportes Consolidados

Documentación técnica del módulo de reportería técnica y auditoría de **AgroCaribe IA**.

## 1. Visión General
Centro de mando para la revisión mensual de métricas de eficiencia, seguimiento de tareas recomendadas por IA y exportación de informes técnicos de alta resolución.

## 2. Componentes Visuales

### 2.1. Gauge de Eficiencia de Parcela (OEE)
*   **Diseño:** Gráfico circular de 240° con gradiente dinámico.
*   **Métrica:** Índice de eficiencia operativa (82% actual).
*   **Contexto:** Compara el rendimiento actual contra el potencial histórico y metas de sostenibilidad.

### 2.2. Grid de Evolución NDVI
*   **Estructura:** Cuadrícula de 6 micro-mapas interactivos.
*   **Detalle:** Cada celda muestra un mini-heatmap del vigor vegetal del mes correspondiente, permitiendo ver la tendencia semestral de un vistazo.
*   **Trend Labels:** Indicadores de delta porcentual mensual (`+5% vs mes anterior`).

### 2.3. Gestor de Tareas IA (Actionable Insights)
*   **Funcionalidad:** Lista de tareas críticas generadas por el motor predictivo.
*   **Atributos:**
    *   Prioridad con código de colores (Rojo: Alta, Amarillo: Media, Verde: Baja).
    *   Checkboxes para seguimiento de cumplimiento en campo.
    *   Barra de progreso general de ejecución.

### 2.4. Análisis Hidrológico Cruzado
*   **Gráfico:** Combo Chart (Barras + Línea).
*   **Datos:** 
    *   **Barras:** Precipitación capturada (NASA POWER).
    *   **Línea:** Humedad de suelo detectada por NDWI.
*   **Objetivo:** Identificar correlaciones entre clima y retención hídrica del suelo.

## 3. Sistema de Exportación
*   **Formato:** PDF Técnico optimizado para auditoría crediticia y RSPO.
*   **Contenido:** Incluye mapas de alta resolución, métricas de laboratorio y registro de acciones tomadas.

## 4. Estética y Diseño
*   **Paleta:** Fondo `slate-100` con tarjetas blancas bordeadas en `slate-200`.
*   **Tipografía de Títulos:** Playfair Display (Estilo Serif Premium).
*   **Alta Densidad:** Elementos optimizados para visibilidad máxima sin scroll excesivo.
