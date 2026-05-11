# Calidad del Suelo - Análisis Avanzado

Documentación técnica del módulo de análisis de suelos de alta precisión en **AgroCaribe IA**.

## 1. Visión General
Este módulo permite a los investigadores agrícolas visualizar y contrastar la composición química y física del suelo mediante herramientas gráficas avanzadas. Se enfoca en la comparativa de datos de campo versus objetivos de cultivo.

## 2. Componentes Principales

### 2.1. Radar Nutricional (Spider Chart)
*   **Tecnología:** SVG Polygons dinámicos.
*   **Funcionalidad:** Superpone dos polígonos de datos:
    1.  **Hacienda El Sol (Norte):** Datos actuales del lote.
    2.  **Objetivo Maíz:** Parámetros ideales para el cultivo específico.
*   **Ejes:** Nitrógeno (N), Fósforo (P), Potasio (K), pH, Conductividad Eléctrica (C.E.) y Materia Orgánica.

### 2.2. Isolíneas de Calor (3D Heatmap)
*   **Tecnología:** CSS Grid + Filtros de desenfoque Gaussiano (SVG Filters).
*   **Funcionalidad:** Representación visual de la distribución de Nitrógeno Total en la parcela.
*   **Escala Cromática:** Gradiente de azul (bajo) a rojo profundo (alto), permitiendo identificar zonas de deficiencia o exceso.

### 2.3. Parámetros Químicos de Laboratorio
*   **Interfaz:** Progress bars con código de colores.
*   **Métricas:**
    *   **Nitrógeno (N):** 58 mg/kg (Estado: ALTO).
    *   **Fósforo (P):** 21 mg/kg (Estado: ESTABLE).
    *   **Potasio (K):** 195 mg/kg (Estado: ÓPTIMO).

## 3. Especificaciones Técnicas
*   **Layout:** Diseño de alta densidad (75% zoom aesthetic) optimizado para 1080p.
*   **Tipografía:** Montserrat (Headers) / Inter (Data).
*   **Interactividad:** Tooltips contextuales en los nodos del radar y leyendas interactivas.

## 4. Resultados Generados
*   **Reporte de Fertilidad:** Diagnóstico automático basado en la desviación del polígono actual vs objetivo.
*   **Mapa de Aplicación Variable:** Sugerencias de dosificación basadas en los puntos calientes del heatmap.
