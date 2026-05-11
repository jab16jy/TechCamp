# Inteligencia Artificial Predictiva

Documentación del motor de predicción y simulación de escenarios de **AgroCaribe IA**.

## 1. Visión General
Este módulo utiliza algoritmos de Machine Learning (Random Forest y LSTM) para predecir el rendimiento del cultivo y simular el impacto de decisiones agronómicas en tiempo real.

## 2. Herramientas de Análisis

### 2.1. Explainable IA (XAI) - Factores de Influencia
*   **Gráfico:** Barras horizontales de importancia de variables.
*   **Propósito:** Mostrar qué datos (Precipitación, Nitrógeno, pH) están impulsando la predicción actual.
*   **Interpretación:** Permite al investigador validar la lógica del modelo "Caja Negra".

### 2.2. Simulador de Rendimiento
*   **Controles:** Sliders de precisión para "Ajuste de Riego" y "Fertilización NPK".
*   **Lógica:** Al modificar los parámetros, el gráfico de proyección se actualiza reactivamente para mostrar el rendimiento estimado (ton/ha).

### 2.3. Proyección de Crecimiento vs Estrés
*   **Gráfico:** Línea dual con marcadores mensuales.
*   **Métricas:** 
    *   **Crecimiento:** Índice de biomasa proyectado.
    *   **Estrés:** Nivel de riesgo hídrico o térmico.
*   **Propósito:** Identificar ventanas críticas de intervención.

### 2.4. Mapa de Productividad con Time Slider
*   **Funcionalidad:** Visualización 3D del campo con overlay de rendimiento esperado.
*   **Time Slider:** Barra inferior para previsualizar la evolución del mapa en meses futuros (T+1, T+2, T+3).

## 3. Especificaciones Técnicas
*   **Precisión Algorítmica:** 94.2% (Badge de salud de IA).
*   **Estética:** Diseño científico con sombras suaves, gradientes en líneas de gráficos y tipografía Montserrat para métricas clave.

## 4. Resultados Generados
*   **Predicción de Cosecha:** Volumen estimado en toneladas para el final del ciclo.
*   **Análisis de Escenarios:** Comparativa visual de resultados basados en diferentes niveles de fertilización.
