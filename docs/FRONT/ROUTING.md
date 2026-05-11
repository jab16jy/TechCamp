# Sistema de Rutas y Navegación

**AgroCaribe IA** utiliza `react-router-dom` para la gestión de navegación, implementando un sistema de rutas declarativas y layouts diferenciados.

## 🛤️ Estructura de Rutas Actual

| Ruta | Página | Acceso | Layout |
| :--- | :--- | :--- | :--- |
| `/` | `Acceso` | Público | Ninguno |
| `/home` | `Home` | Público | `LayoutApp` |
| `/resultado` | `Resultado` | Compartido | Ninguno |
| `/investigador/login` | `LoginInvestigador` | Investigador | Ninguno |
| `/investigador/dashboard` | `DashboardInvestigador` | Investigador | `ResearcherLayout` |
| `/dashboard` | `DashboardInvestigador` | Atajo | `ResearcherLayout` |
| `/investigador/analisis` | `AnalisisCultivos` | Investigador | `ResearcherLayout` |
| `/investigador/resultado-avanzado`| `ResultadoAvanzado` | Investigador | `ResearcherLayout` |
| `/investigador/ia` | `IAPredictiva` | Investigador | `ResearcherLayout` |
| `/investigador/sensores` | `SensoresIoT` | Investigador | `ResearcherLayout` |
| `/investigador/reportes` | `GestionReportes` | Investigador | `ResearcherLayout` |

## 📐 Layouts

### 1. Layout Principal (`LayoutApp`)
Aplica `Navbar` y `Footer` a las páginas informativas y de resultados estándar.
- **Uso:** `/home`.

### 2. Layout del Investigador (`ResearcherLayout`)
Proporciona una barra lateral de navegación técnica (Sidebar) y un área de contenido optimizada para dashboards de alta densidad.
- **Uso:** Todas las rutas bajo `/investigador/*` (excepto login).

## 🖱️ Navegación
La navegación se realiza mediante el hook `useNavigate` de React Router o componentes `<Link>`.
- **Botones de Retroceso:** Muchos dashboards incluyen botones manuales de "Volver" para mejorar la UX en flujos de análisis.
- **404:** Cualquier ruta no definida redirige a una página de error personalizada con un botón de retorno al inicio.

## 🔐 Protección de Rutas (Status)
Actualmente, las rutas están definidas de forma abierta en el frontend. La lógica de autenticación está en proceso de integración profunda con el backend.
