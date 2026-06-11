---
titulo: "Arquitectura del Frontend — AgroCaribe IA"
proyecto: AgroCaribe IA
tags: [frontend, arquitectura, react, vite, tailwind, zustand]
---

# Arquitectura del Frontend

## 1. Technology Stack

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Framework UI | React | 19.2.5 | Librería de componentes con renderizado declarativo |
| Bundler | Vite | 8.0 | Dev server con HMR, build optimizado para Cloudflare Pages |
| Routing | React Router DOM | 6.30 | 13 rutas públicas y protegidas |
| Estado global | Zustand | 5.0 | Store con slices: análisis, UI, historial |
| Estilos base | Tailwind CSS | 3.4 | Utility classes con paleta M3 personalizada |
| Mapas | Leaflet + react-leaflet | 1.9 / 5.0 | Mapas interactivos con marcadores y dibujo de polígonos |
| Dibujo mapas | leaflet-draw | 1.0 | Plugin para dibujar zonas en el mapa |
| Animaciones | framer-motion | 12.38 | Animaciones de entrada, dropdowns y transiciones |
| Iconos | lucide-react | 1.14 | Conjunto de iconos principal |
| Peticiones HTTP | axios | 1.16 | Cliente HTTP con timeout e interceptores |
| Despliegue | Por definir | — | Build output en `./dist` |

---

## 2. Estructura del Proyecto

```
src/
├── main.jsx                              # Punto de entrada Vite
├── App.jsx                               # BrowserRouter + 13 rutas + componentes globales
│
├── assets/
│   └── images/
│       ├── logo.png                      # Logo AgroCaribe AI
│       ├── login-investigador.jpg        # Imagen fondo login
│       └── nofoto-Usuario.png            # Avatar por defecto
│
├── shared/                               # Capa transversal
│   ├── layout/
│   │   ├── ResearcherLayout/             # Layout principal autenticado
│   │   │   ├── ResearcherLayout.jsx      # Nav pill fijo + content scroll + auth guard
│   │   │   └── ResearcherLayout.css      # Estilos del layout
│   │   ├── AmbientBackground/            # Fondo decorativo animado
│   │   │   ├── AmbientBackground.jsx     # SVG con topo, orbs, partículas, noise
│   │   │   └── AmbientBackground.module.css
│   │   └── FloatingAIButton/             # Botón flotante → AgroAsesor
│   │       └── FloatingAIButton.jsx      # visible solo en /investigador/*
│   │
│   ├── services/
│   │   ├── api.js                        # Axios client + 20+ endpoints + interceptores
│   │   └── analysisService.js            # Capa de negocio: análisis, fallback crops
│   │
│   ├── store/
│   │   ├── index.js                      # useAppStore combinado
│   │   ├── analysisSlice.js              # formulario, resultado, loading
│   │   ├── uiSlice.js                    # toasts con auto-dismiss
│   │   └── historySlice.js               # historial persistido en localStorage
│   │
│   ├── styles/
│   │   └── index.css                     # Variables CSS (M3 tokens) + glass classes + animaciones + bento grid
│   │
│   └── ui/
│       ├── Toast/Toast.jsx + .css        # Sistema de notificaciones global
│       ├── InfoTip/InfoTip.jsx           # Tooltip hover con icono Info
│       ├── DataSourcesCard/DataSourcesCard.jsx  # Card de fuentes de datos
│       └── BentoGrid/                    # Componente BentoGrid + BentoCard reutilizables
│
└── features/                             # 9 módulos de dominio
    ├── analysis/                         # Análisis de cultivos (principal)
    │   ├── pages/                        # AnalisisCultivos, Resultado
    │   ├── hooks/                        # useAnalisisCultivos
    │   └── components/                   # 17 componentes (MapSelector, AnalysisForm, SoilParameters, etc.)
    │
    ├── auth/                             # Autenticación
    │   └── pages/                        # Acceso, LoginInvestigador
    │
    ├── chat/                             # AgroAsesor (chatbot + fuentes de datos)
    │   ├── pages/                        # AgroAsesor
    │   ├── hooks/                        # useChat
    │   └── components/                   # ChatHeader, ChatMessages, ChatInput, etc.
    │
    ├── dashboard/                        # Dashboard principal
    │   ├── pages/                        # DashboardInvestigador
    │   ├── hooks/                        # useDashboard
    │   └── components/                   # 8 componentes (AIMetricsGrid, WeatherWidget, etc.)
    │
    ├── history/                          # Historial de análisis
    │   ├── pages/                        # Historial
    │   ├── hooks/                        # useHistorial
    │   └── components/                   # HistorialDropdown
    │
    ├── predictions/                      # IA Predictiva
    │   ├── pages/                        # IAPredictiva
    │   ├── hooks/                        # usePrediccion, usePlanRiego, useSensores
    │   └── components/                   # 19 componentes (ScenarioSimulator, ClimateRiskPanel, etc.)
    │
    ├── reports/                          # Gestión de reportes
    │   ├── pages/                        # GestionReportes
    │   ├── hooks/                        # useTaskManager
    │   └── components/                   # GaugeChart, HydroChart, NdviMiniMap
    │
    ├── sensors/                          # Sensores IoT
    │   ├── pages/                        # SensoresIoT
    │   ├── hooks/                        # useSensoresIoT
    │   └── components/                   # NodeList, FarmMap, TelemetryPanel, etc.
    │
    └── settings/                         # Ajustes de configuración
        ├── pages/                        # Ajustes
        └── hooks/                        # useSettings
```

**Totales:** ~100+ archivos fuente, ~410 KB de código (excluyendo imágenes).

---

## 3. Routing

### 3.1 Árbol de Rutas

```
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <Toast />                          ← Global: esquina inferior derecha
  <FloatingAIButton />               ← Global: botón flotante

  <Routes>
    /                                → Acceso                (Selección: Productor / Investigador)
    /investigador/login              → LoginInvestigador     (Credenciales demo)
    /investigador                    → DashboardInvestigador
    /investigador/dashboard          → DashboardInvestigador
    /dashboard                       → DashboardInvestigador
    /investigador/mapas              → AgroAsesor            (Chat + mapa)
    /investigador/historial          → Historial             (Historial de análisis)
    /investigador/ajustes            → Ajustes               (Configuración)
    /investigador/analisis           → AnalisisCultivos      (Análisis estilo Copernicus)
    /investigador/ia                 → IAPredictiva          (Riesgos y mitigación)
    /investigador/sensores           → SensoresIoT           (Monitoreo sensores)
    /investigador/reportes           → GestionReportes       (Reportes)
    /resultado                       → Resultado             (Resultado compartido)
    *                                → 404 "Página no encontrada"
  </Routes>
</BrowserRouter>
```

**Rutas eliminadas:**
- `/investigador/mapa` — La página de mapa independiente fue removida. La funcionalidad de mapa ahora vive dentro de [[AnalisisCultivos]] (MapSelector) y [[AgroAsesor]].
- `/investigador/resultado-avanzado` — ResultadoAvanzado fue eliminado. Solo existe el resultado compartido en `/resultado`.

### 3.2 Componentes Globales (fuera del Router)

Renderizados en `App.jsx` por fuera de `<Routes>` para estar disponibles en todas las páginas:

- **`<Toast />`** — lee el array `toasts` del store Zustand (`uiSlice`). Posicionado fixed bottom-right. Auto-dismiss a los 4 segundos con barra de progreso animada.
- **`<FloatingAIButton />`** — navega a `/investigador/mapas`. Solo visible en rutas `/investigador/*` excepto `/investigador/login`.

### 3.3 Auth Guard (en ResearcherLayout)

El layout `ResearcherLayout` verifica `sessionStorage.getItem('rol')`. Si no existe, redirige a `/investigador/login`. La sesión se pierde al cerrar la pestaña (sessionStorage).

**Flujo de login:**
1. `Acceso.jsx` en `/` → botón "Soy Investigador" navega a `/investigador/login`
2. `LoginInvestigador.jsx` valida contra credenciales hardcodeadas: `investigador@techcamp.co` / `AgroCaribe2025`
3. Setea `sessionStorage.setItem('rol', 'investigador')` → navega a `/investigador/dashboard`
4. `ResearcherLayout` detecta `rol` en sessionStorage → renderiza contenido

---

## 4. Estado Global (Zustand)

### 4.1 Estructura del Store

```mermaid
graph TD
    A[useAppStore] --> B[analysisSlice]
    A --> C[uiSlice]
    A --> D[historySlice]

    B --> E[formulario: 14 campos]
    B --> F[resultado: object | null]
    B --> G[cargandoAnalisis: bool]
    B --> H[errorAnalisis: string | null]

    C --> I[toasts: array]
    C --> J[agregarToast / eliminarToast]

    D --> K[historial: array]
    D --> L[agregarAlHistorial / limpiarHistorial]
    L --> M[localStorage key: agrocaribe_historial]
```

### 4.2 analysisSlice — Formulario y Resultados

```javascript
// Estado inicial
formulario = {
  departamento: '', municipio: '', lat: 10.5, lng: -74.8,
  tipo_suelo: '', acceso_riego: false, mes_siembra: '',
  area_hectareas: '', ph_suelo: '', textura_suelo: '', materia_organica: '',
}

// Acciones
actualizarFormulario(campos)    // Merge parcial
resetearFormulario()            // Valores iniciales
setResultado(data)              // Guarda resultado del análisis
setCargandoAnalisis(bool)
setErrorAnalisis(error)
resetearResultado()
```

### 4.3 uiSlice — Notificaciones

```javascript
toasts: []  // { id: timestamp, mensaje: string, tipo: 'exito'|'error'|'advertencia'|'info' }
agregarToast(mensaje, tipo = 'info')  // Auto-dismiss 4s
eliminarToast(id)
```

### 4.4 historySlice — Persistencia localStorage

```javascript
historial: []  // Cargado de localStorage('agrocaribe_historial')
agregarAlHistorial(registro)  // Genera ID (C-XXX, S-XXX o P-XXX), timestamp, guarda
limpiarHistorial()

// Migración automática de tipos antiguos:
// 'simple' → 'analisis', 'advanced' → 'suelo'
```

### 4.5 Patrón de uso

```javascript
import useAppStore from '@shared/store';

function MiComponente() {
  const { formulario, actualizarFormulario, resultado } = useAppStore();
  // ...
}
```

---

## 5. API y Servicios

### 5.1 Arquitectura de Capas

```
Page Component → Hook → AnalysisService → api.js (Axios) → Backend
                    ↓
                useAppStore
```

**Importante:** `MOCK_DATA` fue eliminado completamente. Ya no existe un mecanismo de mock de datos en `api.js`. Si la API no responde, las funciones retornan `null`, `[]`, o valores por defecto explícitos, y los componentes muestran estados vacíos o de error. Los fallbacks locales mínimos existen para ciertas funciones (ej. `getUmbralesCultivos` retorna defaults, `geoDecode` hace búsqueda local por cercanía de coordenadas).

### 5.2 api.js — Cliente HTTP

```javascript
BASE_URL = localStorage.getItem('agrocaribe_api_url') || import.meta.env.VITE_API_URL || ''
timeout: 15000ms (300000ms para /chat)
```

La URL base es configurable desde la página de [[Ajustes]] (`/investigador/ajustes`) y se persiste en `localStorage` bajo la clave `agrocaribe_api_url`.

**Endpoints:**

| Función | Método | Ruta | Comportamiento en fallo |
|---------|--------|------|------------------------|
| `getMunicipios()` | GET | `/municipalities` | Retorna `[]` |
| `analizarUbicacion(payload)` | POST | `/analyze-location` | Fallback: compose desde APIs individuales (clima + satélite) |
| `getClima(lat, lng)` | GET | `/climate` | Retorna `null` |
| `getIndicadoresSatelite(lat, lng)` | GET | `/satellite-indicators` | Retorna `null` |
| `getHistorial()` | GET | `/history` | Retorna `[]` |
| `deleteHistory(id)` | DELETE | `/history/{id}` | Retorna `false` |
| `getAnalysis(id)` | GET | `/analysis/{id}` | Retorna `null` |
| `login(email, password)` | POST | `/auth/login` | Error propaga |
| `enviarMensajeChat(msg, convId, userId)` | POST | `/chat` | Timeout 5 min |
| `getSensores()` | GET | `/sensors` | Retorna `[]` |
| `getLecturasSensor(sensorId, limit)` | GET | `/sensors/{id}/readings` | Retorna `[]` |
| `crearLecturaSensor(...)` | POST | `/sensors/readings` | Retorna `null` |
| `geoDecode(lat, lng)` | POST | `/geo/decode` | Fallback local por cercanía de coordenadas |
| `getSoilData(lat, lng)` | GET | `/soil/data` | Retorna `null` |
| `getPrediccion(lat, lng, ...)` | POST | `/predict` | Retorna `null` |
| `postScenario(lat, lng, ...)` | POST | `/predict/scenario` | Retorna `null` |
| `getAlertas()` | GET | `/reports/alerts` | Retorna `{ alertas: [], ... }` |
| `compararAnalisis(ids)` | POST | `/reports/compare` | Retorna `{ items: [] }` |
| `exportarReporte(analysisId)` | POST | `/reports/export` | Retorna `null` |
| `getDashboardSummary()` | GET | `/dashboard/summary` | Retorna `null` |
| `generarPlanRiego(sensorId, ...)` | POST | `/irrigation-plans` | Retorna `null` |
| `exportarPlanATareas(plan)` | POST | `/tasks` | Retorna fallback local con ID generado |
| `getUmbralesCultivos()` | GET | `/irrigation-plans/thresholds` | Retorna datos fijos locales |

**Interceptores:**
- **Response:** monitorea `apiDisponible` global (boolean). Si falla, marca como no disponible.
- **Request:** agrega header `Authorization: Bearer <token>` desde `sessionStorage.getItem('token')` si existe.

### 5.3 analysisService.js — Lógica de Negocio

Métodos principales:

| Método | Función |
|--------|---------|
| `performAnalysis(formData)` | Llama a `POST /analyze-location`, enriquece con `structuredRecommendation` |
| `getAvailableLocations()` | Proxy a `getMunicipios()` |
| `getClimateData(lat, lng)` | Proxy a `getClima()` |
| `getSatelliteIndicators(lat, lng)` | Proxy a `getIndicadoresSatelite()` |
| `getHistory()` | Proxy a `getHistorial()` |
| `createStructuredAnalysisPayload(raw, formData)` | Construye thought, KPIs (NDVI, humedad, nitrógeno), ranking, nota técnica |

**Heurísticas internas:**
- NDVI < 0.3 → prioriza cultivo de cobertura (Canavalia)
- Estimación de nitrógeno desde materia orgánica + área
- Score clamp entre 70-97
- Ranking top 3 con justificación agronómica templada
- Fallback de cultivos (`FALLBACK_CROPS`) si la API no retorna recomendaciones: Platano (95), Maiz (88), Cacao (84)

---

## 6. Sistema de Diseño

### 6.1 Paleta de Colores (Tailwind + CSS Variables)

Definida en `tailwind.config.js` (50+ tokens) y `src/shared/styles/index.css` (CSS custom properties):

```
primary:           #2D5A27   (verde oscuro)
primary-container: #2d6a4f   (verde medio)
secondary:         #5a4a42   (marrón oscuro)
tertiary:          #005236   (verde profundo)
error:             #ba1a1a   (rojo)
surface:           #F9FAF9   (fondo)
on-surface:        #1A1C1A   (texto)
```

La paleta M3 completa está disponible como variables `--m3-*` en `index.css`, con ~30 tokens de color incluyendo variantes surface-container, inverse, outline, etc.

### 6.2 Tipografía

- **Fuente única:** Manrope (importada vía `@import` en `index.css`)
- **Escala:** `display-lg` (48px), `headline-lg` (32px), `headline-md` (24px), `body-lg` (18px), `body-md` (16px), `label-sm` (12px)
- Definiciones completas en `tailwind.config.js` con lineHeight, letterSpacing y fontWeight explícitos

### 6.3 Glassmorphism (clases globales en `index.css`)

| Clase | Uso |
|-------|-----|
| `.glass-card` | Fondo blanco 70%, blur(12px), radius 2rem, hover lift |
| `.glass-panel` | Mismo efecto sin hover |
| `.glass-card-solid` | Fondo blanco opaco, hover lift |
| `.glass-input` / `.glass-select` | Inputs/selects con estilo glass |
| `.glass-input-underline` | Input tipo underline |
| `.btn-primary-pill` | Botón verde pill con sombra |
| `.btn-ghost-pill` | Botón outline ghost |
| `.btn-gradient-pill` | Botón con gradiente verde |
| `.bento-card` | Card bento-grid estándar (también como componente `BentoCard`) |

### 6.4 Sistema BentoGrid

Existe un sistema de grid reutilizable en `src/shared/ui/BentoGrid/` con dos componentes:

- **`BentoGrid`** — contenedor grid de 12 columnas con responsive breakpoints (12 → 8 → 1 columna)
- **`BentoCard`** — wrapper con `span` configurable (`col`, `row`), variants (`default`, `primary`), título e icono opcionales

Usado extensivamente en [[IAPredictiva]] y disponible para cualquier página.

### 6.5 Enfoques de CSS (3 coexisten)

| Enfoque | Dónde se usa | Ejemplo |
|---------|-------------|---------|
| **Tailwind utility classes** | App.jsx, componentes varios | `className="flex gap-4 lg:col-span-8"` |
| **CSS Modules** | auth/, AmbientBackground, AnalysisForm, MapSelector, AnalysisResults | `import styles from './X.module.css'` |
| **Plain CSS files** | ResearcherLayout, AgroAsesor, Dashboard, Historial, AnalisisCultivos, IAPredictiva, etc. | `import './X.css'` |

### 6.6 Animaciones

- **framer-motion**: Dropdowns en ResearcherLayout, entrada de mensajes en chat, cards del dashboard, animaciones en Historial
- **CSS @keyframes**: `dropIn`, `pulse`, `ac-pulse-anim`, `toast-enter`, `toast-countdown`
- **Transiciones**: `0.3s cubic-bezier(0.4, 0, 0.2, 1)` standard en hover de cards y botones

---

## 7. Features por Módulo

### 7.1 Analysis (Análisis de Cultivos) — `src/features/analysis/`

**Rutas:** `/investigador/analisis`, `/resultado`

El módulo principal. Fue rediseñado completamente con un layout estilo **Copernicus Browser**:

- **Layout:** Panel izquierdo (280px, fondo blanco) + mapa a altura completa
- **No más bento-grid de 12 columnas** — el formulario y el mapa conviven en un layout de dos paneles
- **No más toggle "modo simple" vs "modo avanzado"** — siempre muestra mapa + formulario juntos
- **Top bar** con botón de retroceso + título (sin header dentro de la página)
- **MetricCardsGrid** debajo del mapa con indicadores NDVI, humedad, precipitación, etc.
- **Tabs** para alternar entre formulario de análisis e historial (`HistorialTab`)

**Componentes de mapa:**
- `MapSelector` — mapa Leaflet con detección de clics y dibujo de polígonos/rectángulos/círculos
- `MapDrawingToolbar` — simplificado, solo herramientas círculo + cuadrado
- **Geo-detección:** `POST /geo/decode` via PostGIS `ST_Contains` — al hacer clic se detecta departamento/municipio
- **SoilGrids:** auto-completa pH, materia orgánica y textura del suelo al hacer clic en el mapa via `GET /soil/data`

**17 componentes:** MapSelector, AnalysisForm, AnalysisResults, SoilParameters, RadarChart, HeatMap, RecommendationsList, SimulationEngine, AdvancedResultHeader, MetricCardsGrid, ClimateDataCards, AlgorithmHealthCard, HistorialTab, MapDrawingToolbar, y otros.

**Flujo de submit:**
1. Usuario completa formulario + selecciona ubicación en mapa (clic o dibujo)
2. Submit → `useAnalisisCultivos.handleSubmit()`
3. → `AnalysisService.performAnalysis(formulario)`
4. → `POST /analyze-location` (fallback composición desde APIs clima + satélite)
5. → Store `setResultado`
6. → `agregarAlHistorial`
7. → Navega a `/resultado`

### 7.2 Auth (Autenticación) — `src/features/auth/`

**Rutas:** `/`, `/investigador/login`

Sin cambios respecto a la versión anterior.

**Página de acceso (`/`):**
- Dos bento cards: "Soy Productor" (rol=productor → `/investigador/analisis`) y "Soy Investigador" → `/investigador/login`
- CSS Modules con glassmorphism, grid 2 columnas

**Login (`/investigador/login`):**
- Split layout: formulario (55%) + imagen de fondo
- Validación contra credenciales demo
- Show/hide password, simulación de carga (1.2s)
- `sessionStorage.setItem('rol', 'investigador')` → redirect a dashboard

### 7.3 Chat (AgroAsesor) — `src/features/chat/`

**Ruta:** `/investigador/mapas`

**Layout:** 3 columnas (260px | center 480-720px | 280px)

| Panel | Contenido |
|-------|-----------|
| Izquierdo (`DataSources`) | Fuentes conectadas (suelo, satélite, clima), parcelas, sensores IoT |
| Centro | `ChatHeader`, `ChatMessages`, `QuickActions`, `ChatInput` |
| Derecho (`StudioPanel`) | Atajos a reportes, mapa nutrientes, predicción, etc. |

El chat ahora usa `POST /chat` con timeout de 5 minutos para respuestas del backend, enviando `conversation_id` y `user_id`.

### 7.4 Dashboard — `src/features/dashboard/`

**Rutas:** `/investigador/dashboard`, `/investigador`, `/dashboard`

**Layout:** Bento grid con framer-motion (staggered entry):

1. `DashboardHeader` — título + timestamp + refresh
2. `AIMetricsGrid` — 4 cards con datos desde `GET /dashboard/summary`
3. `ModelMetricsTable` — tabla de rendimiento por cultivo
4. `WeatherWidget` — clima desde `GET /climate`
5. `FieldUpdatesFeed` — feed de actualizaciones de campo
6. `WeeklySummary` — resumen semanal
7. `ModuleShortcuts` — accesos directos a módulos

**Ya no usa datos mock** — consume `GET /dashboard/summary` y `GET /climate` de la API real, con manejo de estados vacío/carga.

### 7.5 History (Historial) — `src/features/history/`

**Ruta:** `/investigador/historial`

**Características:**
- Datos reales desde `GET /history` (backend JOIN con tabla municipios)
- Búsqueda por texto
- Filtros por tipo (tabs: todos/análisis/suelo/predicción) y estado (todos/Exitosa/Pendiente/Error)
- Contadores de estadísticas
- Lista de glass cards con framer-motion animations
- Vista detalle expandible y eliminar (`DELETE /history/{id}`)
- `HistorialDropdown` en el navbar (últimos 5, con framer-motion)

### 7.6 Predictions (IA Predictiva) — `src/features/predictions/`

**Ruta:** `/investigador/ia`

**Rol del módulo:** planificación estacional con proyección climática, simulación de escenarios what-if, detección de riesgos y mitigación.

**Arquitectura:** ~343 líneas en `IAPredictiva.jsx`. Usa el hook `usePrediccion` (no `usePredictionSimulator`).

**State machine del hook:**
```
IDLE → CONFIGURING → LOADING → PROJECTED
PROJECTED → SIMULATING → PROJECTED → PLAN_READY
```

**Endpoints reales:**
- `POST /predict` — proyección climática (parámetros: lat, lng, cultivo, meses, NPK, riego, fechas)
- `POST /predict/scenario` — simulación what-if con delta de precipitación y temperatura
- `POST /predict/optimal-day` — cálculo de ventana óptima de siembra

**Componentes del dashboard (cuando hay proyección):**

| Fila | Componente | Descripción |
|------|-----------|-------------|
| 1 | `MonthlyProjectionTabs` + `ClimateRiskPanel` | Proyección mensual + panel de riesgos |
| 2 | `SimulationSection` | Simulación de fenómenos: inundación, sequía, granizo/rayo, Niño |
| 3 | `ScenarioSimulator` | Sliders de NPK, riego, delta temp/precip + botón "Simular" |
| 4 | `GrowthStressChart` + `FeatureChart` | Área chart crecimiento vs estrés + factores de importancia |
| 5 | `MitigationActions` | Recomendaciones de mitigación para cada riesgo detectado |

**Componentes eliminados de la UI** (aunque algunos archivos aún existen en el directorio):
- `SensorDashboard` — eliminado
- `NinoPanel` — eliminado
- `NinaPanel` — eliminado
- `OptimalWindowCard` — eliminado
- `FenologiaTimeline` — eliminado
- `PlanVisualizationCard` — eliminado
- `FieldMap` — ya no se usa en la página principal

**Configuración de consulta:** modal `QueryConfigModal` que permite seleccionar un análisis previo del historial (hereda coordenadas y contexto) o ingresar coordenadas manuales con cultivo y fecha de siembra.

### 7.7 Reports (Reportes) — `src/features/reports/`

**Ruta:** `/investigador/reportes`

**Características:**
- Datos reales desde `GET /reports/alerts`, `POST /reports/compare`, `POST /reports/export`
- No más datos mock
- `GaugeChart` — donut SVG (rendimiento)
- `NdviMiniMap` — timeline NDVI con flechas de tendencia
- `HydroChart` — balance hídrico: precipitación vs evapotranspiración
- Task manager — checklist de tareas toggleables + barra de progreso

### 7.8 Sensors (Sensores IoT) — `src/features/sensors/`

**Ruta:** `/investigador/sensores`

**Características:**
- Datos reales desde `GET /sensors` y `GET /sensors/{id}/readings`
- `NodeList` — nodos IoT con estado online/offline
- `FarmMap` — SVG del layout de la finca con indicadores de nodos
- `TelemetryPanel` — telemetría del nodo seleccionado + control de válvula
- `EventLog` — feed de eventos cronológicos
- `RssiBar` y `Spark` — componentes micro SVG

### 7.9 Settings (Ajustes) — `src/features/settings/`

**Ruta:** `/investigador/ajustes`

**Rol del módulo:** configuración de la aplicación por parte del usuario.

**Secciones:**
1. **Mi Finca** — nombre, latitud y longitud de la finca por defecto (persiste en localStorage)
2. **Servidor API** — URL del backend FastAPI configurable (persiste en localStorage como `agrocaribe_api_url`), con botón "Probar conexión" que muestra estado y versión
3. **Datos** — Exportar historial y configuración como JSON / Importar backup desde archivo
4. **Sistema** — Limpiar cache, historial y todos los datos locales. Muestra versión y runtime info.

**Hook:** `useSettings` maneja la lógica de persistencia, test de backend, export/import JSON y limpieza de cache.

---

## 8. Data Flow Completo

```mermaid
graph TD
    U[Usuario] -->|Interactúa| P[Page Component]
    P -->|Usa| H[Hook personalizado]
    H -->|Lee/escribe| S[Zustand Store]
    H -->|Llama| AS[AnalysisService]
    AS -->|HTTP| API[api.js - Axios]
    API -->|Éxito| BK[Backend FastAPI]
    API -->|Fallo| FB[Fallback mínimo: null / [] / defaults locales]
    AS -->|Enriquece| P
    S -->|Re-renderiza| P

    subgraph Store
        A[analysisSlice]
        UIS[uiSlice]
        HST[historySlice]
    end

    HST -->|Persiste| LS[localStorage]

    subgraph Componentes Globales
        T[Toast]
        FAB[FloatingAIButton]
        SET[localStorage: agrocaribe_api_url]
    end

    S -->|toasts| T
    UIS --> T
```

**Flujo típico de análisis:**
1. Usuario llena formulario en `AnalisisCultivos`
2. `useAnalisisCultivos` actualiza `formulario` en store
3. Submit → `AnalysisService.performAnalysis()`
4. `api.js` intenta `POST /analyze-location`
5. Si backend responde → datos reales
6. Si falla → fallback composición desde APIs individuales (`/climate` + `/satellite-indicators`), sin `MOCK_DATA`
7. `analysisService.js` construye `structuredRecommendation` (KPIs, ranking, nota técnica)
8. Store `setResultado` + `agregarAlHistorial`
9. Navega a `/resultado`
10. `Resultado.jsx` lee `resultado` del store y renderiza `AnalysisResults`

**Flujo de IA Predictiva:**
1. Usuario abre modal `QueryConfigModal` y selecciona/lote o ingresa coordenadas
2. `usePrediccion.fetchProyeccion()` → `POST /predict`
3. Store recibe proyección → estado `PROJECTED`
4. Usuario modifica sliders (NPK, riego, delta temp/precip) → `POST /predict/scenario`
5. Resultados se renderizan en bento grid: proyección, riesgos, simulación de fenómenos, mitigación

---

## 9. Convenciones de Código

### 9.1 Imports (path aliases)

```javascript
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout';
import useAppStore from '@shared/store';
import AnalysisService from '@shared/services/analysisService';
import MapSelector from '@features/analysis/components/MapSelector';
```

### 9.2 Estructura de Feature

```
features/<nombre>/
├── pages/             ← Componentes de página (conectados a rutas)
├── hooks/             ← Lógica reutilizable (separación de concerns)
└── components/        ← Componentes de UI (props + callbacks)
```

Excepción: `settings/` no tiene directorio `components/` (solo pages + hooks).

### 9.3 Patrón de Hook

```javascript
export default function useMiFeature() {
  const storeValue = useAppStore(...);
  const [localState, setLocalState] = useState(...);

  const handleAction = useCallback((...args) => {
    // lógica
  }, [deps]);

  return { storeValue, localState, handleAction };
}
```

### 9.4 Estilos

- **CSS Module** para componentes reutilizables o con estilos complejos
- **Plain CSS** para páginas enteras con estilos específicos
- **Tailwind** para layouts rápidos y spacing
- **BentoGrid** (componente reusable) para layouts de dashboard

### 9.5 Iconos

Usar exclusivamente `lucide-react`. Excepciones existentes por migrar:
- `RecommendationsList.jsx` usa `<span className="material-symbols-outlined">`
- `SimulationEngine.jsx` usa `<span className="material-symbols-outlined">`
- `SoilParameters.jsx` usa `<span className="material-symbols-outlined">`
- `AdvancedResultHeader.jsx` usa `<span className="material-symbols-outlined">`
- `Acceso.jsx` usa `<span className="material-symbols-outlined">`

---

## 10. Despliegue

### 10.1 Comandos

| Comando | Acción |
|---------|--------|
| `npm run dev` | Dev server en `localhost:5173` |
| `npm run build` | Build → `./dist` |
| `npm run preview` | Preview build local |
| `npm run lint` | ESLint |

### 10.2 Build

```bash
npm run build  # → ./dist
```

### 10.3 Variables de Entorno

```bash
VITE_API_URL=http://localhost:8000  # Backend URL (opcional, default)
```

La URL también puede configurarse desde la UI en [[Ajustes]] → Servidor API. El valor en localStorage (`agrocaribe_api_url`) tiene prioridad sobre `VITE_API_URL`.

---

## 11. Dependencias

### Producción

| Paquete | Versión | Tamaño aprox. |
|---------|---------|---------------|
| react + react-dom | ^19.2.5 | 144 KB |
| react-router-dom | ^6.30.3 | 65 KB |
| zustand | ^5.0.12 | 5 KB |
| axios | ^1.16.0 | 15 KB |
| leaflet + react-leaflet | ^1.9 / ^5.0 | 145 KB |
| leaflet-draw | ^1.0.4 | 60 KB |
| lucide-react | ^1.14.0 | 120 KB |
| framer-motion | ^12.38.0 | 145 KB |

### Desarrollo

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| vite | ^8.0 | Bundler + dev server |
| @vitejs/plugin-react | ^6.0 | Fast Refresh + SWC |
| tailwindcss | ^3.4 | Utility CSS |
| eslint | ^9.39 | Linting |
| autoprefixer | ^10.5 | CSS vendor prefixes |
| postcss | ^8.5 | CSS transformations |

---

## 12. Deuda Técnica y Mejoras Potenciales

| Ítem | Prioridad | Descripción |
|------|-----------|-------------|
| Migrar Material Symbols a lucide-react | Media | `RecommendationsList`, `SimulationEngine`, `SoilParameters`, `AdvancedResultHeader` y `Acceso` aún usan `<span class="material-symbols-outlined">` |
| Unificar approach de CSS | Baja | 3 enfoques coexisten (Tailwind, CSS Modules, plain CSS) |
| TypeScript | Baja | Proyecto 100% JSX, migración voluntaria |
| Autenticación real | Media | Hoy es sessionStorage + credenciales hardcodeadas |
| Tests | Alta | No existe suite de pruebas configurada |
| Limpiar fuentes en index.html | Baja | Se cargan fuentes adicionales que ya no se usan (verificar) |
| Componentes muertos en predictions/ | Baja | Archivos como `NinoPanel`, `NinaPanel`, `OptimalWindowCard`, `FenologiaTimeline`, `PlanVisualizationCard`, `SensorDashboard`, `SensorCard` existen en el directorio pero ya no se importan en `IAPredictiva` |

---

## Referencias

- [[06-api/backend]] — Arquitectura del backend y endpoints
- [[03-architecture/flujo-datos]] — Mapa de conexión Frontend-Backend completo
- [[03-architecture/vision-sistema]] — Stack tecnológico y flujo de procesamiento
