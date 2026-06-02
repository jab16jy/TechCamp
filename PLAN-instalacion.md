# Plan de Instalación — Skills y MCPs

> Proyecto: AgroCaribe AI — Linux (`/home/jabyn/TechCamp`)
> Origen de migración: Windows (`C:\Users\PC\...`)
> Generado: 2026-06-01

---

## Fase 0: Preparación del entorno

| Acción | Comando |
|--------|---------|
| Crear directorios de skills | `mkdir -p ~/.config/opencode/skills ~/.agents/skills ~/.codex/skills/.system` |
| Instalar uvx (para obsidian MCP) | `pip install uv` o `pipx install uv` |
| Verificar npx | `which npx` ✓ disponible |

---

## Fase 1: Skills de opencode (`~/.config/opencode/skills/`)

Skills del SDD orchestrator + utilidades de GitHub. Copiar desde la PC Windows o reinstalar.

### SDD Phase Skills (obligatorias, desde `C:\Users\PC\.config\opencode\skills\`)

| Skill | Ruta destino |
|-------|-------------|
| `sdd-apply` | `~/.config/opencode/skills/sdd-apply/SKILL.md` |
| `sdd-archive` | `~/.config/opencode/skills/sdd-archive/SKILL.md` |
| `sdd-design` | `~/.config/opencode/skills/sdd-design/SKILL.md` |
| `sdd-explore` | `~/.config/opencode/skills/sdd-explore/SKILL.md` |
| `sdd-init` | `~/.config/opencode/skills/sdd-init/SKILL.md` |
| `sdd-onboard` | `~/.config/opencode/skills/sdd-onboard/SKILL.md` |
| `sdd-propose` | `~/.config/opencode/skills/sdd-propose/SKILL.md` |
| `sdd-spec` | `~/.config/opencode/skills/sdd-spec/SKILL.md` |
| `sdd-tasks` | `~/.config/opencode/skills/sdd-tasks/SKILL.md` |
| `sdd-verify` | `~/.config/opencode/skills/sdd-verify/SKILL.md` |

**Instalación:** Copiar carpeta completa desde `C:\Users\PC\.config\opencode\skills\sdd-*/` a `~/.config/opencode/skills/`.

### Skills de utilidad (desde `C:\Users\PC\.config\opencode\skills\`)

| Skill | Ruta destino |
|-------|-------------|
| `branch-pr` | `~/.config/opencode/skills/branch-pr/SKILL.md` |
| `chained-pr` | `~/.config/opencode/skills/chained-pr/SKILL.md` |
| `cognitive-doc-design` | `~/.config/opencode/skills/cognitive-doc-design/SKILL.md` |
| `comment-writer` | `~/.config/opencode/skills/comment-writer/SKILL.md` |
| `go-testing` | `~/.config/opencode/skills/go-testing/SKILL.md` |
| `issue-creation` | `~/.config/opencode/skills/issue-creation/SKILL.md` |
| `judgment-day` | `~/.config/opencode/skills/judgment-day/SKILL.md` |
| `skill-creator` | `~/.config/opencode/skills/skill-creator/SKILL.md` |
| `skill-improver` | `~/.config/opencode/skills/skill-improver/SKILL.md` |
| `work-unit-commits` | `~/.config/opencode/skills/work-unit-commits/SKILL.md` |

**Instalación:** Copiar carpeta desde Windows o clonar desde GitHub si están publicadas.

---

## Fase 2: Skills de agente (`~/.agents/skills/`)

Desde `C:\Users\PC\.agents\skills\`. Skills técnicos y de dominio.

| Skill | Categoría |
|-------|-----------|
| `chart-visualization` | Visualización |
| `docker-compose-orchestration` | Infraestructura |
| `docker-expert` | Infraestructura |
| `documentation-writer` | Documentación (Diátaxis) |
| `embedding-strategies` | RAG / NLP |
| `enhance-prompt` | Utilidad |
| `farming-expert` | Dominio agrícola |
| `fastapi-python` | Backend |
| `fastapi-templates` | Backend |
| `find-skills` | Utilidad (instalado vía GitHub) |
| `hybrid-search-implementation` | Búsqueda |
| `langgraph-fundamentals` | Agentes / LangGraph |
| `obsidian-cli` | Knowledge management |
| `obsidian-markdown` | Knowledge management |
| `pdf-generator` | Utilidad |
| `postgresql-table-design` | Base de datos |
| `sqlalchemy-alembic-expert-best-practices-code-review` | Base de datos |
| `tailwind-design-system` | Frontend |
| `vercel-react-best-practices` | Frontend (React/Next.js) |
| `webapp-testing` | Testing (Playwright) |

**Ya instalados vía GitHub (skills-lock.json):**
- `find-skills` → `vercel-labs/skills`
- `frontend-design` → `anthropics/skills`
- `supabase` → `supabase/agent-skills`
- `supabase-postgres-best-practices` → `supabase/agent-skills`

**Instalación:**
- GitHub: `npx skills install <org>/<repo>/skills/<name>`
- Locales: copiar carpeta desde `C:\Users\PC\.agents\skills\`

---

## Fase 3: Skills de codex (`~/.codex/skills/`)

Desde `C:\Users\PC\.codex\skills\`. Skills del ecosistema Codex/Gentle AI.

### Skills de usuario

| Skill | Ruta destino |
|-------|-------------|
| `backend-api` | `~/.codex/skills/backend-api/SKILL.md` |
| `frontend-spa` | `~/.codex/skills/frontend-spa/SKILL.md` |
| `infra-docker` | `~/.codex/skills/infra-docker/SKILL.md` |

### Skills del sistema

| Skill | Ruta destino |
|-------|-------------|
| `imagegen` | `~/.codex/skills/.system/imagegen/SKILL.md` |
| `openai-docs` | `~/.codex/skills/.system/openai-docs/SKILL.md` |
| `plugin-creator` | `~/.codex/skills/.system/plugin-creator/SKILL.md` |
| `skill-installer` | `~/.codex/skills/.system/skill-installer/SKILL.md` |

**Instalación:** Copiar carpeta completa desde `C:\Users\PC\.codex\skills\` a `~/.codex/skills/`.

---

## Fase 4: Configuración de MCPs

MCPs definidos en `opencode.json`. Adaptar rutas de Windows → Linux.

| MCP | Estado | Acción |
|-----|--------|--------|
| `context7` | Remote, sin cambios | Ya funciona |
| `supabase` | Remote, disabled | Sin cambios |
| `TestSprite` | Local, disabled | `npx` funciona, mantener disabled |
| `engram` | Local | Requiere instalar `engram` CLI: `npm install -g engram` o `pip install engram` |
| `filesystem` | Local | Cambiar ruta: `D:/PROYECTOS/TechCamp` → `/home/jabyn/TechCamp` |
| `obsidian` | Local | Cambiar `cmd /c set ...` → sintaxis bash. Requiere `uvx` |
| `excel-server` | Local | `npx -y @negokaz/excel-mcp-server` funciona sin cambios |

### Detalle de conversión

#### filesystem (hecho en opencode.json)
```
Windows: npx -y @modelcontextprotocol/server-filesystem D:/PROYECTOS/TechCamp
Linux:   npx -y @modelcontextprotocol/server-filesystem /home/jabyn/TechCamp
```

#### obsidian
```
Windows: cmd /c "set OBSIDIAN_API_KEY=... && set ... && uvx --python 3.12 mcp-obsidian"
Linux:   zsh -c "export OBSIDIAN_API_KEY=... && export ... && uvx --python 3.12 mcp-obsidian"
```

#### engram
Requiere instalar el paquete:
```
npm install -g engram
# o
pip install engram
```

---

## Fase 5: Registrar en skill-registry

Una vez instalados todos los skills, generar el registro:

```bash
# Si gentle-ai está disponible:
npx gentle-ai skill-registry refresh --force --output skill-registry.md
# O manual: editar skill-registry.md con los paths locales
```

El `skill-registry.md` ya existe como referencia, pero debe apuntar a los paths de Linux:
- `~/.config/opencode/skills/...`
- `~/.agents/skills/...`
- `~/.codex/skills/...`

---

## Resumen de comandos de instalación

```bash
# 1. Dependencias
pip install uv          # para uvx (obsidian MCP)
npm install -g engram   # para engram MCP

# 2. Skills vía GitHub (ya en skills-lock)
npx skills install anthropics/skills/skills/frontend-design
npx skills install vercel-labs/skills/skills/find-skills
npx skills install supabase/agent-skills/skills/supabase
npx skills install supabase/agent-skills/skills/supabase-postgres-best-practices

# 3. Skills locales — copiar desde USB/red desde C:\Users\PC\
#    a ~/.config/opencode/skills/
#    a ~/.agents/skills/
#    a ~/.codex/skills/

# 4. Colocar opencode.json en /home/jabyn/TechCamp/opencode.json
```

---

## Checklist de verificación

- [ ] `~/.config/opencode/skills/` tiene los 10 SDD + 10 utilidades
- [ ] `~/.agents/skills/` tiene los skills técnicos
- [ ] `~/.codex/skills/` tiene backend-api, frontend-spa, infra-docker + system skills
- [ ] `engram` CLI instalado y funcionando
- [ ] `uvx` disponible para obsidian MCP
- [ ] `opencode.json` colocado en el proyecto
- [ ] `skill-registry.md` actualizado con paths Linux
- [ ] `AGENTS.md` actualizado con los nuevos skills
