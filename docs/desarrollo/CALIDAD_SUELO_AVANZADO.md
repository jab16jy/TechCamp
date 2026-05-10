## 1. Visión Técnica (Resultados de Laboratorio)
El módulo de Calidad del Suelo Avanzado es la página de **Resultados** para investigadores que requieren un análisis químico y nutricional profundo. Este componente traduce datos de laboratorio y sensores IoT en una representación visual intuitiva pero técnicamente precisa para la toma de decisiones críticas.

---

## 2. Estructura de la Interfaz de Resultados

### 2.1 Navegación y Contexto
*   **Breadcrumbs:** Facilita el retorno a reportes previos (`Reportes > Análisis Avanzado`).
*   **Identificación Única:** Cada reporte genera un código de referencia (`REF: #SOIL-ADV-2024-X1`) para trazabilidad.
*   **Geolocalización:** Muestra coordenadas exactas (Lat/Long) y el nombre del sector (ej. Hacienda El Sol).

### 2.2 Acciones de Informe
*   **Exportar CSV:** Descarga de los datos crudos para software estadístico.
*   **Informe Técnico:** Generación de PDF formal con membrete del laboratorio.

---

## 3. Parámetros Químicos de Laboratorio
El sistema visualiza los macronutrientes y propiedades físicas mediante tarjetas orgánicas interactivas:

*   **Nitrógeno (N), Fósforo (P) y Potasio (K):** Medidos en mg/kg, con barras de progreso codificadas por colores (Material Design 3) que indican si el nivel es Bajo, Estable, Óptimo o Alto.
*   **Acidez (pH):** Factor crítico para la disponibilidad de nutrientes.
*   **Conductividad Eléctrica (dS/m):** Indicador de salinidad y retención de humedad.
*   **Materia Orgánica (%):** Salud estructural del suelo.

---

## 3. Visualizaciones Científicas Avanzadas

### 3.1 Radar Nutricional (Spider Chart)
Un gráfico radial que compara el estado **Actual** de la parcela contra el **Objetivo** ideal para el cultivo seleccionado. 
*   **Utilidad:** Identifica rápidamente qué nutriente es el "cuello de botella" de la producción.
*   **Diseño:** Renderizado mediante SVG dinámico con ejes y polígonos de transparencia solapada.

### 3.2 Mapa de Calor de Nutrientes (Isolíneas)
Representación de la distribución espacial de los nutrientes en el terreno.
*   **Capa Técnica:** Utiliza isolíneas para marcar gradientes de concentración (ej. Nitrógeno total).
*   **Interacción:** Permite visualizar áreas específicas de la parcela que requieren intervención focalizada.

---

## 4. Recomendaciones Especializadas del Laboratorio
El motor de IA genera tres protocolos específicos basados en el análisis químico:

| Protocolo | Tipo de Ajuste | Objetivo Técnico |
| :--- | :--- | :--- |
| **Hidro-Analítica** | Riego Diferenciado | Optimizar balance hídrico (VPD) y lixiviación de sales. |
| **Alerta Patógena** | Bio-Control | Intervención preventiva contra estresores abióticos (ej. Broca, PC). |
| **Ajuste Químico** | Balance NPK | Cálculo exacto de dosis de fertilizantes quelatados y reducción de urea. |

---

## 5. Motor de Simulación Estocástica
Al final del reporte, el usuario puede acceder al **Motor de Simulación**. Este permite proyectar el rendimiento futuro bajo diferentes escenarios de precipitación y planes de fertilización, cerrando el ciclo entre el diagnóstico actual y la proyección futura.

---
**Documentación de Desarrollo**
*   **Componente:** `ResultadoAvanzado.jsx`
*   **Estilos:** `ResultadoAvanzado.module.css`
*   **Lógica Visual:** Radar SVG y Mapas de Calor con gradientes radiales.
