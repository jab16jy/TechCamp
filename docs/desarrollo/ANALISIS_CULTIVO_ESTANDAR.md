# AgroCaribe IA: Análisis de Cultivos Estándar

## 1. Propósito del Módulo
Este módulo es la interfaz principal de entrada de datos para el motor de predicción. Permite a productores e investigadores configurar las variables agronómicas básicas y geolocalizar la parcela para obtener una recomendación de cultivo optimizada para el Caribe colombiano.

---

## 2. Flujo de Trabajo y Funcionalidades

### 2.1 Geolocalización de Precisión (MapSelector)
Integración con mapas interactivos para la selección del área de estudio:
*   **Selección Manual:** El usuario marca el punto exacto de la parcela.
*   **IA-Mapping Insight:** Al seleccionar el área, el sistema consulta automáticamente capas de **Sentinel-2** para mostrar la humedad del suelo detectada satelitalmente antes de iniciar el análisis.

### 2.2 Configuración de Parámetros Agronómicos
Formulario estructurado que recopila variables críticas:
*   **Ubicación:** Departamento y Municipio (Filtrado dinámico).
*   **Características del Terreno:** Tipo de suelo (Arcilloso, Arenoso, Francos) y Área en hectáreas.
*   **Temporalidad:** Mes de siembra (crucial para el cruce con calendarios climáticos de la región).

---

## 3. Modos de Operación

### 3.1 Modo Simple (Productor)
Enfocado en la facilidad de uso. Requiere datos mínimos y devuelve una recomendación rápida basada en el perfil regional y satelital.

### 3.2 Modo Avanzado (Investigador)
Habilita el panel de **Calidad del Suelo**, permitiendo:
*   Ingreso manual de valores químicos (pH, N, P, K).
*   Ajuste de sliders climáticos (Temperatura, Humedad, Precipitación) para simular microclimas específicos.
*   Recuperación de datos históricos de parcelas guardadas (Hacienda El Sol, Lote Norte).

---

## 4. Validación y Ejecución del Análisis
El proceso de envío (`handleSubmit`) incluye:
1.  **Validación Robusta:** Asegura que todos los parámetros obligatorios y la ubicación en el mapa estén definidos.
2.  **Procesamiento IA:** Una llamada al `AnalysisService` que procesa 24 variables agroclimáticas.
3.  **Redirección Dinámica:** 
    *   Simple -> `/resultado` (Visualización estándar).
    *   Avanzado -> `/investigador/resultado-avanzado` (Análisis de laboratorio).

---

## 5. Elementos de Diseño Premium
*   **CTA Experience:** La sección de ejecución utiliza un diseño de alto impacto visual con íconos de "Auto Awesome" y un resumen del procesamiento ("Analizar con IA").
*   **Algorithmic Health Badge:** Un monitor de precisión en tiempo real (94.2%) que informa al usuario sobre la versión y confiabilidad del modelo estable (v4.2.0).
*   **Pulse Status:** Indicador visual de conexión activa a la "Red de Sensores", reforzando la percepción de datos en tiempo real.

---

## 5. Visualización de Resultados Estándar
Una vez procesado el análisis, el usuario es redirigido a la página de **Resultados**, la cual proporciona una visión 360° de la recomendación:

### 5.1 Hero Header y Acciones
*   **Resumen de Ubicación:** Confirmación del municipio y departamento analizado.
*   **Exportación Directa:** Botón para generar el reporte en PDF y opción para iniciar una "Nueva Consulta" reseteando los estados.

### 5.2 Dashboard de Métricas Críticas
Visualización de 4 variables climáticas en tiempo real:
*   **Temperatura:** Clasificada como Óptima/Alerta.
*   **Precipitación:** Medición en milímetros (mm).
*   **Humedad Relativa:** Porcentaje de saturación.
*   **Radiación Solar:** Energía recibida en W/m².

### 5.3 Tarjeta de Recomendación de Cultivo
El componente central que destaca:
*   **Nombre del Cultivo:** (ej. Maíz, Yuca).
*   **Afinidad (Score):** Un anillo de progreso que indica el porcentaje de compatibilidad de la parcela.
*   **Nivel de Riesgo:** Badge dinámico (Bajo, Medio, Alto).
*   **Justificación de la IA:** Texto narrativo que explica por qué se recomienda dicho cultivo basándose en los datos analizados.

### 5.4 Panel Satelital e Índices
*   **Mapa Interactivo:** Visualización en capas (Satélite/Terreno) con marcadores de salud vegetal (Emerald para alta, Amber para moderada).
*   **Indicador NDVI (Salud Foliar):** Un medidor tipo gauge que muestra el vigor de la vegetación actual.
*   **Datos Satelitales Secundarios:** NDWI (Agua en hoja), Calidad del Suelo y Nubosidad actual.

### 5.5 IA Insight Proactivo
Una tarjeta flotante que ofrece una observación "humana" de la IA: *"Se detecta una ventana de siembra óptima en los próximos 12 días basada en patrones de la Niña."*

---
**Documentación de Desarrollo**
*   **Página:** `Resultado.jsx`
*   **Componente Base:** `AnalysisResults.jsx`
*   **Estilos:** `AnalysisResults.module.css`
