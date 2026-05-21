# 🌾 AgroCaribe AI

**AgroCaribe AI** es una plataforma avanzada de análisis agrícola impulsada por inteligencia artificial, diseñada específicamente para optimizar la producción de cultivos en la región del Caribe colombiano.

---

## 🚀 Inicio Rápido

Para ejecutar el proyecto localmente:

```bash
npm install
npm run dev
```

---

## 📚 Documentación Técnica

La documentación del proyecto está organizada bajo el framework Diátaxis en `docs/`.

### [👉 Ir a la Documentación](docs/README.md)

| Documento | Tipo | Descripción |
|-----------|------|-------------|
| [Introducción](docs/1-INTRODUCTION.md) | Explicación | Visión general, stack y propósito |
| [Arquitectura](docs/2-ARCHITECTURE.md) | Explicación | Arquitectura y flujo de datos |
| [Setup](docs/3-SETUP.md) | Guía práctica | Instalación, configuración y scripts |
| [Frontend Reference](docs/4-FRONTEND-REFERENCE.md) | Referencia | Componentes, rutas, estado y servicios |
| [Backend API](docs/5-BACKEND-API.md) | Referencia | Endpoints, schemas y mock data |
| [Módulos de Desarrollo](docs/6-DEVELOPMENT.md) | Explicación | IA, sensores, dashboard y reportes |
| [Troubleshooting](docs/7-TROUBLESHOOTING.md) | Guía práctica | Problemas comunes y roadmap |

---

## 🛠️ Stack Tecnológico
- **Frontend**: React 19 + Vite 8
- **Estado**: Zustand 5
- **Estilos**: Tailwind CSS 3 + Glassmorphism
- **Integración**: API FastAPI (Mock fallback incluido)

---

## 🧪 Estado del Proyecto
Actualmente el proyecto se encuentra en fase de **Prototipo de Alta Fidelidad (Frontend)**. Todas las interacciones están implementadas y consumen servicios que simulan la respuesta de una IA mediante datos mock cuando el servidor no está presente.

## 🌿 Workflow con OpenCode

Este proyecto se desarrolla usando OpenCode con branches por tarea:

- `feature/*` — nuevas funcionalidades
- `fix/*` — corrección de bugs
- `refactor/*` — refactorización de código
- `docs/*` — documentación
- `infra/*` — infraestructura y CI/CD

Los cambios se hacen en branches aislados y se integran a `main` via Pull Request.
