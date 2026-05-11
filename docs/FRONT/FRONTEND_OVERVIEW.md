# Visión General del Frontend

**AgroCaribe IA** es una plataforma avanzada de análisis agrícola que utiliza inteligencia artificial y datos satelitales para optimizar la toma de decisiones en el Caribe colombiano.

## 🚀 Stack Tecnológico

El frontend está construido con tecnologías modernas que priorizan el rendimiento y la experiencia de desarrollo.

| Tecnología | Propósito |
| :--- | :--- |
| **React 19** | Biblioteca principal para la interfaz de usuario. |
| **Vite 8** | Herramienta de construcción y servidor de desarrollo ultra-rápido. |
| **Tailwind CSS 3** | Framework de estilos utility-first para diseño responsivo. |
| **Zustand 5** | Gestión de estado global ligera y eficiente. |
| **React Router 6** | Manejo de navegación y rutas dinámicas. |
| **Leaflet** | Visualización de mapas e indicadores geoespaciales. |
| **Axios** | Cliente HTTP para comunicación con servicios externos. |

## 🏗️ Arquitectura General

El proyecto sigue un patrón **Modular y Basado en Componentes**, con una separación clara entre lógica de negocio y presentación.

1.  **Capa de Presentación (Components/Pages):** JSX y Tailwind para la interfaz.
2.  **Capa de Estado (Context/Zustand):** Almacén centralizado para datos de usuario y resultados.
3.  **Capa de Servicios (Services):** Abstracción de llamadas API con lógica de "Fallback" a datos simulados (Mock).
4.  **Capa de Navegación (Router):** Orquestación de vistas mediante layouts específicos.

## 🎯 Propósito del Proyecto

Facilitar a productores e investigadores agrícolas el acceso a:
- Recomendaciones de cultivos basadas en IA.
- Monitoreo satelital (NDVI, NDWI, Calidad de suelo).
- Análisis técnico detallado de parcelas.
- Simulación de escenarios climáticos y de fertilización.
