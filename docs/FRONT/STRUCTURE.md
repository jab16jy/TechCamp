# Estructura del Proyecto

El proyecto sigue una organización modular diseñada para escalar y facilitar el mantenimiento de componentes de UI y lógica de IA.

## 📂 Directorio Raíz

| Carpeta / Archivo | Propósito |
| :--- | :--- |
| `src/` | Código fuente principal de la aplicación. |
| `public/` | Assets estáticos (íconos, fuentes, imágenes públicas). |
| `docs/` | Documentación técnica del proyecto (Markdown). |
| `package.json` | Definición de dependencias y scripts de npm. |
| `tailwind.config.js` | Configuración de temas, colores y fuentes de Tailwind. |
| `vite.config.js` | Configuración del bundler Vite. |
| `.env` | Variables de entorno (URL de la API, etc.). |

## 📂 Directorio `src/`

| Carpeta | Contenido |
| :--- | :--- |
| `assets/` | Imágenes, logotipos y recursos multimedia locales. |
| `components/` | Componentes de React reutilizables (Botones, Cards, Modals). |
| `context/` | Estado global gestionado con **Zustand** (`useAppStore.js`). |
| `pages/` | Vistas principales de la aplicación (Home, Dashboard, Resultados). |
| `services/` | Lógica de peticiones API y manejo de datos (Axios). |
| `index.css` | Estilos globales y configuración base de Tailwind. |
| `App.jsx` | Configuración de rutas y estructura base. |
| `main.jsx` | Punto de entrada de la aplicación. |

## 📂 Directorio `src/components/`

Los componentes se organizan en subcarpetas para mayor orden:
- `AIInsightCard/`: Tarjetas de observaciones proactivas de la IA.
- `Navbar/` & `Footer/`: Navegación y pie de página persistentes.
- `ResearcherLayout/`: Layout específico para el panel de investigador.
- `analysis/`: Componentes atómicos para formularios de consulta.
- `Toast/`: Sistema de notificaciones flotantes.

## 📂 Directorio `src/pages/`

- `Acceso/`: Pantalla inicial de selección de perfil.
- `Home/`: Landing informativa para el público general.
- `Investigador/`: Dashboards avanzados, login y herramientas de IA Predictiva.
- `Resultado/`: Vista de resultados estándar para productores.

## 🛠️ Convenciones
- **Componentes:** `NombreComponente.jsx` y `NombreComponente.css` (o `.module.css`).
- **Páginas:** Se agrupan en carpetas por funcionalidad.
- **Zustand Store:** Prefijo `use` (ej. `useAppStore.js`).
