# Dashboard del Investigador - Agro-Asesor IA

Documentación técnica del centro de mando principal de **AgroCaribe IA**.

## 1. Visión General
El Dashboard del Investigador es la interfaz de entrada que combina capacidades de procesamiento de lenguaje natural (Agro-Asesor) con un panel técnico de monitoreo de modelos y acceso rápido a herramientas de datos.

## 2. Arquitectura de Componentes

### 2.1. Centro de Mando (Agro-Asesor Inteligente)
Interfaz de chat de pantalla completa que actúa como el núcleo interactivo del sistema.
*   **Capacidades:** Procesamiento de datos satelitales (Sentinel-2) y telemetría de suelo en tiempo real.
*   **Feedback de Estado:** Indicador animado de "Análisis Activo" y badges de procesamiento por IA.
*   **Sugerencias Rápidas:** Botones contextuales para consultas frecuentes (Riesgos climáticos, Mapas NDVI, Optimización).

### 2.2. Panel Técnico (Sidebar Derecha)
Panel de alta densidad diseñado para el monitoreo de la infraestructura de IA y exportación selectiva.

#### A. Salud del Modelo IA (Métricas Críticas)
Visualización rápida del rendimiento del motor de inferencia:
*   **Precisión (Accuracy):** 94.2% (Objetivo: >90%).
*   **Latencia:** Tiempo de respuesta del modelo (124ms promedio).
*   **Muestras:** Volumen de datos procesados para el entrenamiento y validación (4.2k).

#### B. Herramientas de Datos (Exportación)
Acciones directas para la descarga de información técnica:
*   **CSV Consultas:** Exportación tabular del histórico de interacciones y datos crudos.
*   **Reporte PDF:** Resumen ejecutivo de la salud del modelo y estado de parcelas.

#### C. Vista Previa de Campo (Field Preview)
*   **Mapa Contextual:** Imagen satelital del sector bajo monitoreo activo (Sector Norte, Turbaco).
*   **Overlay Informativo:** Ubicación y estado general de la zona.

## 3. Especificaciones de Diseño
*   **Layout:** Estructura de sidebar colapsable con transición suave (300ms).
*   **Estética:** Uso de `slate-50` para fondos, acentos en `emerald-600` para identidad de marca agrícola y tipografía `sans-serif` moderna.
*   **Interactividad:** Toasts informativos para acciones de exportación y scroll-smooth en el historial de chat.

## 4. Resultados Generados
*   **Recomendaciones Agronómicas:** Insights accionables basados en anomalías térmicas y niveles de humedad.
*   **Auditoría de IA:** Registro transparente de la confianza del modelo y latencia para control de calidad.
