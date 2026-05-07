# 📁 Estructura del Proyecto

Organización detallada de los directorios y archivos principales en `src/`.

## 🌳 Árbol de Directorios Principal

```text
src/
├── assets/             # Imágenes, iconos y recursos estáticos
├── components/         # Componentes de UI reutilizables
│   ├── Navbar/         # Barra de navegación principal
│   ├── Footer/         # Pie de página
│   ├── analysis/       # Componentes específicos del flujo de análisis
│   └── ...             # Otros componentes (Cards, Spinners, Toasts)
├── context/            # Gestión de estado (useAppStore.js)
├── pages/              # Vistas completas de la aplicación (Rutas)
│   ├── Acceso/         # Selección de perfil inicial
│   ├── Home/           # Landing informativa
│   ├── Investigador/   # Panel y herramientas para investigadores
│   └── Resultado/      # Visualización de resultados del análisis
├── services/           # Comunicación con API y lógica externa
│   ├── api.js          # Cliente Axios y Mocks
│   └── analysisService.js # Lógica de procesamiento de datos
├── App.jsx             # Raíz de rutas y layouts
└── main.jsx            # Punto de entrada de React
```

## 📄 Archivos Clave en la Raíz

- `index.html`: Plantilla base de la SPA.
- `index.css`: **Core Design System**. Contiene todas las variables de color, fuentes y estilos globales.
- `vite.config.js`: Configuración del bundler Vite.
- `.env`: Variables de entorno para apuntar a diferentes backends.

---

## 🏛️ Convenciones
- **Componentes**: Se organizan en carpetas con su archivo `.jsx` y opcionalmente su `.css` o assets específicos.
- **Nomenclatura**: Se usa `PascalCase` para componentes y carpetas de componentes/páginas, y `camelCase` para funciones y servicios.

---

[[INDEX|⬅️ Volver al Índice]]
