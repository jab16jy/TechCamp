# 🧩 Catálogo de Componentes

Componentes reutilizables que forman la interfaz de **AgroCaribe AI**.

## 🏗️ Estructura y Navegación

### `Navbar`
- **Ubicación**: `src/components/Navbar`
- **Propósito**: Navegación principal, logo y estado de conexión de la API.
- **Props**: N/A (usa `useAppStore` para el estado del API).

### `Footer`
- **Ubicación**: `src/components/Footer`
- **Propósito**: Enlaces informativos y créditos de la aplicación.

### `ResearcherLayout`
- **Ubicación**: `src/components/ResearcherLayout`
- **Propósito**: Wrapper para las páginas del investigador, proporcionando una barra lateral de navegación y estilo de dashboard.

## 📊 Visualización de Datos

### `MetricCard`
- **Propósito**: Tarjeta pequeña para mostrar indicadores rápidos (Temperatura, pH, Humedad).
- **Props**: `icon`, `label`, `value`, `unit`, `color`.

### `AIInsightCard`
- **Propósito**: Presenta una recomendación generada por la IA con un diseño premium.
- **Props**: `title`, `description`, `score`, `emoji`.

### `AnalysisMap`
- **Propósito**: Mapa interactivo para selección de coordenadas y visualización de polígonos.
- **Tecnología**: Integra Leaflet o similar (según implementación).

### `SatelliteAnalysis`
- **Propósito**: Visualización de capas satelitales (NDVI, Humedad de suelo) con controles deslizantes.

## 🛠️ Utilidades

### `LoadingSpinner`
- **Propósito**: Feedback visual durante llamadas asíncronas o procesamiento de IA.

### `Toast`
- **Propósito**: Sistema de notificaciones flotantes para errores, éxitos o avisos informativos.
- **Estado**: Controlado globalmente por `useAppStore`.

### `ParticleCanvas`
- **Propósito**: Fondo animado sutil usado en pantallas de acceso para el efecto visual "premium".

---

[[INDEX|⬅️ Volver al Índice]]
