# Documentación de Páginas y Vistas

Esta sección describe el propósito y la funcionalidad de cada vista principal del sistema **AgroCaribe IA**.

## 🏠 Home / Acceso

### `Acceso.jsx` (Ruta: `/`)
- **Propósito:** Puerta de entrada principal. Permite al usuario identificarse como "Productor" o "Investigador".
- **UX:** Diseño minimalista con dos tarjetas de gran formato para bifurcar la experiencia del usuario.

### `Home.jsx` (Ruta: `/home`)
- **Propósito:** Landing page informativa.
- **Contenido:** Propuesta de valor, descripción de tecnologías y contacto.

## 🌾 Flujo Productor (Estándar)

### `AnalisisCultivos.jsx` (Ruta: `/investigador/analisis`)
*Nota: Este componente se comparte pero tiene variantes de interfaz.*
- **Propósito:** Configuración de la parcela y captura de datos.
- **Componentes Clave:** `AnalysisMap` (Leaflet) y formulario dinámico.

### `Resultado.jsx` (Ruta: `/resultado`)
- **Propósito:** Visualización de la recomendación de cultivo ganadora.
- **Métricas:** Temperatura, Humedad, Score de afinidad y resumen satelital simplificado.

## 🔬 Flujo Investigador (Avanzado)

### `DashboardInvestigador.jsx` (Ruta: `/investigador/dashboard`)
- **Propósito:** Centro de control principal con el **Agro-Asesor Inteligente** (Chat IA).
- **Funciones:** Monitoreo de salud del modelo y exportación de reportes técnicos.

### `ResultadoAvanzado.jsx` (Ruta: `/investigador/resultado-avanzado`)
- **Propósito:** Análisis técnico profundo de suelos.
- **Visuales:** Radar Nutricional (N-P-K-pH) y Mapa de calor de Nitrógeno.

### `IAPredictiva.jsx` (Ruta: `/investigador/ia`)
- **Propósito:** Simulación y proyección futura.
- **Visuales:** Gráfico XAI (Explainable IA) y simulador de fertilización NPK.

### `SensoresIoT.jsx` (Ruta: `/investigador/sensores`)
- **Propósito:** Monitoreo de hardware en campo.
- **Visuales:** Salud de nodos (RSSI, Batería) y telemetría en tiempo real.

### `GestionReportes.jsx` (Ruta: `/investigador/reportes`)
- **Propósito:** Gestión administrativa y auditoría.
- **Visuales:** Gauge de eficiencia OEE, histórico NDVI y exportación masiva.
