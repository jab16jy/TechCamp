# Dashboard del Investigador - Hub de Monitoreo

Documentación técnica del **Dashboard Hub** de AgroCaribe IA. Esta interfaz centraliza el estado global de la operación agrícola y el rendimiento de los modelos de IA, adoptando el sistema de diseño "Integrated Organic" con estética Ultra-Minimalist Glassmorphism.

## 1. Visión General
El Dashboard es el punto de entrada principal para el investigador. Su objetivo es proporcionar una **vista de 360 grados** sobre la salud de los cultivos, el rendimiento detallado de los modelos predictivos de IA y el acceso rápido a reportes técnicos, integrado sobre un mapa satelital de fondo.

## 2. Arquitectura de Componentes (Layout Hub)

El componente principal es `DashboardInvestigador.jsx`, el cual opera dentro del contenedor global `ResearcherLayout.jsx`. 

### 2.1. Fondo Dinámico (Background Map)
Se integra un mapa interactivo (o imagen estática de satélite) de fondo utilizando propiedades `mix-blend-overlay` para mantener consistencia con la identidad visual botánica de AgroCaribe.

### 2.2. Panel Principal (Métricas de Modelos IA)
Anteriormente alojado en un módulo separado (`IAPredictiva`) o mostrando una recomendación hero estática, ahora el Dashboard presenta una tabla detallada con el desempeño de los modelos por cultivo:

| Cultivo | Precisión (Accuracy) | F1-Score | Error Medio (MAE) | Confianza del Modelo |
| :--- | :--- | :--- | :--- | :--- |
| Yuca | 95.8% | 0.94 | 2.1% | Alta (Ideal para suelos francos) |
| Ñame | 93.2% | 0.91 | 3.5% | Alta (Sensible a humedad/NDWI) |
| Guineo | 91.5% | 0.89 | 4.2% | Media (Depende de vientos/clima) |
| Papa | 89.1% | 0.87 | 5.8% | Moderada (Afinidad baja en Caribe) |

### 2.3. Bento-Grid de Monitoreo (Actualizaciones)
Paneles modulares para la supervisión en tiempo real:
*   **Actualizaciones de Campo:** Novedades sobre salud y riesgos (Ej: "Alerta de plaga temprana", "Humedad óptima").
*   **Sensores Locales y Clima:** Integración de datos meteorológicos y lecturas del terreno.
*   **Accesos Directos y Exportación:** Herramientas para "Generar Reporte" (integrado vía `triggerReport` en el Layout).

## 3. Especificaciones de Diseño (Integrated Organic)
*   **Estética:** "Ultra-Minimalist Glassmorphism". Las tarjetas (`glassPanel`) no utilizan fondos sólidos sino efectos `backdrop-filter: blur()`, sombras sutiles y transparencias.
*   **Tipografía:** Uso estandarizado de la fuente **Manrope** en toda la interfaz.
*   **Colores:** Paleta botánica priorizando tokens como verde bosque (`#0f5238`) y fondos claros (`#edeeef`).
*   **Layout:** Sistema grid de 12 columnas ("Floating" aesthetic) con márgenes y espaciados generosos (40px) para respiración de los elementos.

## 4. Fuentes de Datos (Integración Futura)
Actualmente el dashboard consume data estructurada estática (`MODEL_METRICS`, `FIELD_UPDATES`). Las próximas iteraciones conectarán:
*   **API NASA POWER / Sentinel-2:** Para variables agroclimáticas y mapas NDVI.
*   **Endpoints ML Internos:** Para la actualización en tiempo real de métricas de desempeño.
