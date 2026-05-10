# AgroCaribe IA: Panel de Control del Investigador (Dashboard)

## 1. Visión del Dashboard
El Dashboard es el centro neurálgico de AgroCaribe IA para el perfil de investigador. Su propósito es proporcionar una visión consolidada y de alto nivel sobre el rendimiento del motor de IA, la actividad de los usuarios en el territorio y facilitar la exportación de datos críticos para la investigación académica y técnica.

---

## 2. Componentes y Métricas Clave

### 2.1 KPIs de Rendimiento del Modelo
El sistema monitorea en tiempo real la salud del algoritmo predictivo:
*   **Accuracy Global:** Porcentaje de acierto del modelo en todas las predicciones de la región (objetivo: >90%).
*   **F1-Score Macro:** Balance entre precisión y recall, crucial para manejar clases de cultivos desbalanceadas.
*   **Latencia Media:** Tiempo de respuesta del motor de inferencia (optimizado para < 1.5s).
*   **Consultas Totales:** Volumen de actividad histórica y mensual acumulada.

### 2.2 Centro de Mando (Agro-Asesor Inteligente)
El panel principal al que accede el usuario. Integra de manera fluida:
*   **Agro-Asesor Inteligente:** Un asistente conversacional (Chatbot) que resume y analiza datos en tiempo real (ej. humedad del suelo, datos de Sentinel-2).
*   **Salud del Modelo IA:** Un medidor visual (Gauge SVG) que muestra el rendimiento global del modelo de Machine Learning junto a métricas rápidas de latencia y nivel de confianza.
*   **Acciones Rápidas:** Enlaces directos hacia las secciones de "Exportación de Datos" y "Métricas de Entrenamiento".
*   **Vista de Campo (Field Preview):** Tarjeta visual del sector monitoreado con un indicador dinámico de estado (ej. 28% de humedad).

### 2.3 Analítica por Cultivo
Visualización detallada del rendimiento segmentado por tipo de plantación (Maíz, Yuca, Plátano, etc.):
*   **Precisión vs. Recall:** Barras comparativas que identifican en qué cultivos el modelo es más fiable.
*   **AI Optimization Insight:** Un panel dinámico que utiliza IA para sugerir recalibraciones del dataset basadas en la estabilidad observada por cultivo.

---

## 3. Centro de Exportación y Datos Crudos
Diseñado para la interoperabilidad con herramientas externas (Python, R, PowerBI):

*   **Tabular (CSV):** Historial completo de predicciones y variables de entrada.
*   **Resumen Ejecutivo (PDF):** Reporte visual con gráficas de tendencias y métricas de salud foliar.
*   **Dataset (JSON):** Estructura ideal para procesos de re-entrenamiento de modelos (*Fine-tuning*).

### 3.1 Filtros Avanzados (Segmentación Territorial)
Permite extraer datos con granularidad específica por:
*   Rango de fechas.
*   Departamento y Municipio (Antioquia, Bolívar, Magdalena, etc.).
*   Variedad específica de cultivo (ej. Aguacate Hass vs. Criollo).

---

## 4. Tecnologías y Diseño (UX/UI)

### 4.1 Arquitectura de Interfaz
*   **Bento Grid Layout:** Organización modular de la información para una lectura jerárquica.
*   **Eco-Glassmorphism:** Uso de efectos de transparencia y grano sutil (`ecoGrain`, `topographicBg`) que evocan texturas orgánicas y cartografía técnica.
*   **Material Symbols:** Iconografía estandarizada para identificar rápidamente conceptos como `insights`, `query_stats` y `database`.

### 4.2 Proactividad (FAB)
El **Floating Action Button (FAB)** permite al investigador iniciar una "Nueva Analítica" desde cualquier punto del dashboard, agilizando el flujo de trabajo en laboratorio.

---
**Documentación de Desarrollo**
*   **Componente:** `DashboardInvestigador.jsx`
*   **Estilos:** `DashboardInvestigador.module.css`
*   **Layout:** `ResearcherLayout`
