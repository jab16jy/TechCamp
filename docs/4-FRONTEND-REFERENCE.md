# Referencia del Frontend

## Estructura del Proyecto

```
src/
├── assets/           Recursos multimedia
├── components/       Componentes React reutilizables
│   ├── AIInsightCard/
│   ├── Navbar/ & Footer/
│   ├── ResearcherLayout/
│   ├── analysis/
│   └── Toast/
├── context/          Estado global (Zustand)
├── pages/            Vistas principales
│   ├── Acceso/
│   ├── Home/
│   ├── Investigador/
│   └── Resultado/
├── services/         API y lógica de datos
├── App.jsx           Rutas y estructura base
├── main.jsx          Punto de entrada
└── index.css         Estilos globales Tailwind
```

## Sistema de Rutas

### Panel Superior (Top Nav)

| Link | Ruta |
|------|------|
| Dashboard | `/investigador/dashboard` |
| AgroAsesor | `/investigador/mapas` |
| Mapa | `/investigador/mapa` |
| Historial | `/investigador/historial` |

### Sidebar Flotante

| Icono | Ruta | Componente |
|-------|------|-----------|
| LayoutDashboard | `/investigador/dashboard` | DashboardInvestigador |
| Sprout | `/investigador/analisis` | AnalisisCultivos |
| Wifi | `/investigador/sensores` | SensoresIoT |
| Brain | `/investigador/ia` | IAPredictiva |
| BarChart3 | `/investigador/reportes` | GestionReportes |

### Rutas Completas

| Ruta | Componente | Layout |
|------|-----------|--------|
| `/` | Acceso | Ninguno |
| `/home` | Home | LayoutApp |
| `/resultado` | Resultado | Ninguno |
| `/investigador/login` | LoginInvestigador | Ninguno |
| `/investigador/dashboard` | DashboardInvestigador | ResearcherLayout |
| `/dashboard` | DashboardInvestigador | ResearcherLayout |
| `/investigador/analisis` | AnalisisCultivos | ResearcherLayout |
| `/investigador/resultado-avanzado` | ResultadoAvanzado | ResearcherLayout |
| `/investigador/ia` | IAPredictiva | ResearcherLayout |
| `/investigador/sensores` | SensoresIoT | ResearcherLayout |
| `/investigador/reportes` | GestionReportes | ResearcherLayout |
| `/investigador/mapas` | AgroAsesor | ResearcherLayout |
| `/investigador/mapa` | Mapa (pendiente) | ResearcherLayout |
| `/investigador/historial` | Historial (pendiente) | ResearcherLayout |

### Layouts

**LayoutApp:** Navbar + Footer para páginas públicas (`/home`).

**ResearcherLayout:** Sidebar flotante con 5 íconos + Navbar glass. Todas las rutas de investigador excepto login. El `<main>` tiene posicionamiento `absolute`. Framer Motion para animaciones de dropdown.

## Estado Global (Zustand)

Store en `src/context/useAppStore.js`:

```javascript
{
  formulario: {
    departamento, municipio, lat, lng,
    tipo_suelo, acceso_riego, mes_siembra, area_hectareas
  },
  resultado: { /* respuesta del motor IA */ },
  cargandoAnalisis: false,
  errorAnalisis: null,
  toasts: [],   // { id, mensaje, tipo }
  apiConectada: true
}
```

**Acciones:** `actualizarFormulario`, `resetearFormulario`, `setResultado`, `setCargandoAnalisis`, `setErrorAnalisis`, `agregarToast`, `eliminarToast`.

Los Toasts se auto-eliminan después de 4 segundos. El componente `Toast` se renderiza en `App.jsx` fuera del router.

## Catálogo de Componentes

### Layout
- **ResearcherLayout:** Sidebar + navbar glass para dashboards
- **Navbar:** Navegación global (flujo estándar / landing)
- **Footer:** Pie de página global

### Visualización de Datos
- **MetricCard:** Tarjeta compacta con icono, valor, label, color y tooltip
- **AIInsightCard:** Panel con observaciones proactivas de la IA
- **LoadingSpinner:** Pantalla de carga con animaciones de branding
- **Toast:** Notificaciones flotantes desde el store de Zustand

### Geoespacial
- **AnalysisMap:** Leaflet para selección de coordenadas con marcadores dinámicos
- **SatelliteAnalysis:** Capas satelitales NDVI/NDWI y gauges de salud vegetal

### IA
- **CropRecommendation:** Tarjeta de cultivo sugerido con score y justificación
- **RadarNutricional:** SVG Spider Chart para comparar NPK (usado en ResultadoAvanzado)

## Convenciones de Diseño

### Glassmorphism (patrón estándar)
```css
background: rgba(255, 255, 255, 0.55);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.25);
border-radius: 2rem;
```

### Paleta de Colores
| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#0f5238` | Verde bosque, botones principales |
| `primary-container` | `#2d6a4f` | Fondos de contenedores |
| Fondos claros | `#edeeef` | Backgrounds generales |

### Tipografía
- **Manrope** en toda la interfaz (no usar Montserrat, Inter, Playfair Display ni DM Sans)
- Configurado via Google Fonts en `index.html`

### Animación
- Transiciones de `0.3s ease`
- `@keyframes` en CSS de componentes cuando sea necesario
- Framer Motion solo en ResearcherLayout para dropdowns

### Iconos
- **lucide-react** exclusivamente (no usar Material Symbols)

## Servicios

Funciones disponibles en `src/services/api.js`:

| Función | Endpoint | Propósito |
|---------|----------|-----------|
| `getMunicipios` | `/municipalities` | Lista de municipios |
| `analizarUbicacion` | `/analyze-location` | Análisis y recomendación IA |
| `getClima` | `/climate` | Datos meteorológicos |
| `getIndicadoresSatelite` | `/satellite-indicators` | Índices NDVI/NDWI |
| `getHistorial` | `/history` | Análisis previos |

Cada función implementa Mock Fallback: si la API no responde, retorna datos simulados.
