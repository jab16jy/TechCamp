---
titulo: "Workflow — Flujo de trabajo con OpenCode"
proyecto: AgroCaribe IA
tags: [workflow, opencode, git, branching, sdd, mcp]
---

# Workflow — Flujo de trabajo con OpenCode

---

## Estrategia de branching

El proyecto se desarrolla usando branches por tarea, todos desde `main`:

| Prefijo | Propósito |
|---------|-----------|
| `feature/*` | Nuevas funcionalidades |
| `fix/*` | Corrección de bugs |
| `refactor/*` | Refactorización de código |
| `docs/*` | Documentación |
| `infra/*` | Infraestructura y CI/CD |

Los cambios se hacen en branches aislados y se integran a `main` mediante Pull Request.

---

## Comandos comunes

### Frontend

| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor de desarrollo en `localhost:5173` |
| `npm run build` | Build producción en `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Previsualizar build producción |

### OpenCode / gentle-ai

| Comando | Acción |
|---------|--------|
| `gentle-ai doctor` | Diagnóstico del ecosistema gentle-ai |
| `engram doctor` | Verificar salud de MCP Engram |
| `gentle-ai skill-registry refresh` | Regenerar skill-registry.md |

### Backend

| Comando | Acción |
|---------|--------|
| `cd backend && uvicorn app.main:app --reload` | Servidor desarrollo backend |
| `cd backend && python -m pytest tests/ -v` | Tests (16 tests) |
| `docker compose up -d` | Iniciar servicios Docker |
| `docker compose exec backend alembic upgrade head` | Ejecutar migraciones |
| `docker compose logs -f backend` | Logs del backend |

---

## Workflow con OpenCode y SDD

### Agentes disponibles

| Agente | Uso |
|--------|-----|
| `build` (default) | Tareas rápidas sin SDD, desarrollo directo |
| `gentle-orchestrator` | Flujo SDD completo (init → explore → propose → spec → design → tasks → apply → verify → archive) |

Cambiar de agente con `Tab` en la TUI de OpenCode.

### Fases SDD (orquestador)

1. **sdd-init** — Inicializar contexto SDD
2. **sdd-explore** — Explorar requerimientos
3. **sdd-propose** — Propuesta de cambio
4. **sdd-spec** — Especificación detallada
5. **sdd-design** — Diseño técnico
6. **sdd-tasks** — Descomposición en tareas
7. **sdd-apply** — Implementación
8. **sdd-verify** — Verificación contra spec
9. **sdd-archive** — Archivar y persistir

### Configuración del proyecto

- **Modelo:** Elegido por sesión en la TUI (no fijo en configuración)
- **Memoria:** Engram (almacén de artefactos SDD por defecto)
- **TDD:** No exigido
- **Shell:** `/usr/bin/zsh`
- **No hay typecheck** — Solo ESLint para frontend

---

## MCP Servers disponibles

| MCP | Estado | Propósito |
|-----|--------|-----------|
| `engram` | ✅ Habilitado | Memoria persistente para artefactos SDD |
| `context7` | ✅ Habilitado | Documentación actualizada de librerías |
| `filesystem` | ✅ Habilitado | Acceso directo a archivos del proyecto |
| `obsidian` | ✅ Habilitado | Vault en `/home/jabyn/Documents/Obsidian Vault` |
| `supabase` | ⏸️ Deshabilitado | Requiere `npm install -g supabase && supabase login` |

### Skills del proyecto

| Skill | Trigger | Propósito |
|-------|---------|-----------|
| `agrocaribe-conventions` | UI, componente, estilos | Sistema de diseño: fuentes, colores, glass cards, animación |
| `agrocaribe-architecture` | routing, store, API, página nueva | Estructura de carpetas, alias, rutas, stores Zustand, API services |
| `agrocaribe-backend` | backend, Docker, DB, chatbot | Reglas FastAPI, arquitectura chatbot, servicios Docker, RAG |
| `agrocaribe-git` | commit, push, PR, branch | Nomenclatura branches, git flow, creación PR |
| `agrocaribe-gotchas` | layout bugs, auth, login | ResearcherLayout, session storage, credenciales |

---

## Referencias

- [[Proyectos/docs techcamp/04-development/setup]] — Instalación y configuración local
- [[Proyectos/docs techcamp/04-development/troubleshooting]] — Problemas comunes
- [[backend]] — Arquitectura del backend
- [[frontend]] — Arquitectura del frontend
