# Inventario de Componentes

Los componentes de **AgroCaribe IA** están diseñados bajo una arquitectura atómica y modular, priorizando la reutilización y el diseño de alta densidad.

## 🏗️ Layouts y Estructura

### `ResearcherLayout`
Layout principal para las vistas de investigador.
- **Props:** `children`, `activeTab`.
- **Elementos:** Sidebar lateral con navegación técnica y área de scroll optimizada.

### `Navbar` & `Footer`
Componentes de navegación global para el flujo estándar y landing pages.

## 📊 Visualización de Datos (UI)

### `MetricCard`
Tarjeta compacta para mostrar métricas individuales (Humedad, Temperatura, etc.).
- **Props:** `icono`, `valor`, `label`, `color`, `info` (tooltip).

### `AIInsightCard`
Panel lateral que muestra observaciones proactivas generadas por la IA ("IA Insight").

### `LoadingSpinner`
Pantalla de carga personalizada con animaciones de branding y mensajes dinámicos de procesamiento.

### `Toast`
Componente persistente en `App.jsx` que consume la cola de notificaciones de `useAppStore`.

## 🗺️ Geoespacial (Maps)

### `AnalysisMap`
Integración de Leaflet para la selección de coordenadas.
- **Funciones:** Marcadores dinámicos y captura automática de Lat/Lng para el store global.

### `SatelliteAnalysis`
Componente avanzado que renderiza capas satelitales (NDVI/NDWI) y gauges de salud vegetal.

## 🧬 Componentes Específicos de IA

### `CropRecommendation`
Tarjeta de gran formato que destaca el cultivo sugerido, su score de afinidad y la justificación técnica.

### `RadarNutricional` (SVG)
Gráfico de araña dinámico usado en `ResultadoAvanzado` para comparar NPK actual vs objetivos.

## 🎨 Estilos y Temas
- **Tailwind CSS:** Se utilizan clases utilitarias para el 90% del estilo.
- **CSS Modules:** Usados en componentes complejos (`.module.css`) para evitar colisiones de nombres y manejar animaciones específicas.
- **Material Symbols:** Iconografía estandarizada mediante Google Fonts.
