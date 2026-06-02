# AgroCaribe AI

React 19 SPA — agricultural analysis platform. Vite 8, Tailwind CSS 3, Zustand 5, React Router 6, Leaflet maps, Lucide icons.

## Quick Reference

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server on `localhost:5173` |
| `npm run build` | Outputs to `dist/` |
| `npm run lint` | ESLint only |
| `npm run preview` | Preview production build |
| `gentle-ai doctor` | Run gentle-ai ecosystem health diagnostics |
| `engram doctor` | Check engram MCP health |
| `gentle-ai skill-registry refresh` | Regenerate skill-registry.md |

No tests. No typecheck.

## Configuration Stack

- **Default agent**: `build` (opencode default, no SDD overhead)
- **Optional agent**: `gentle-orchestrator` — switch with `Tab` in TUI when you need SDD workflow
- **SDD phase agents**: 10 hidden sub-agents (sdd-init, sdd-explore, sdd-propose, sdd-spec, sdd-design, sdd-tasks, sdd-apply, sdd-verify, sdd-archive, sdd-onboard) — only invoked by `gentle-orchestrator`
- **Model**: chosen per-session in the opencode TUI (not pinned in config)
- **Memory**: engram (default artifact store for SDD when using orchestrator)
- **TDD**: not enforced
- **Shell**: `/usr/bin/zsh`

## MCP Servers

| MCP | Status | Purpose |
|-----|--------|---------|
| `engram` | ✅ enabled | Persistent memory for SDD artifacts |
| `context7` | ✅ enabled | Up-to-date library documentation |
| `filesystem` | ✅ enabled | Direct access to project files at `/home/jabyn/TechCamp` |
| `obsidian` | ✅ enabled | Vault at `/home/jabyn/Documents/Obsidian Vault` (via `@fazer-ai/mcp-obsidian`) |
| `supabase` | ⏸️ disabled | Requires Supabase CLI install: `npm install -g supabase` + `supabase login` |

## Skills Index

Skills live in `.agents/skills/` and `$HOME/.agents/skills/`. The agent loads them on demand by trigger.

### Project-Specific Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| `agrocaribe-conventions` | UI task, component, styling, theming | Design system: fonts, colors, glass cards, animation, icons |
| `agrocaribe-architecture` | routing, store, API, new page | Folder structure, path aliases, routes, Zustand store, API services |
| `agrocaribe-backend` | backend, Docker, DB, chatbot | FastAPI rules, chatbot architecture, Docker services, RAG |
| `agrocaribe-git` | commit, push, PR, branch | Branch naming, git flow, PR creation |
| `agrocaribe-gotchas` | layout bugs, auth, login | ResearcherLayout positioning, session storage, credentials |

### Installed Generic Skills

| Skill | Source | Purpose |
|-------|--------|---------|
| `frontend-design` | anthropics/skills | UI design, glassmorphism, typography |
| `webapp-testing` | anthropics/skills | Playwright testing |
| `skill-creator` | anthropics/skills | LLM-first skill creation |
| `claude-api` | anthropics/skills | Claude API patterns |
| `mcp-builder` | anthropics/skills | MCP server building |
| `find-skills` | vercel-labs/skills | Skill discovery |
| `supabase` | supabase/agent-skills | Supabase integration |
| `supabase-postgres-best-practices` | supabase/agent-skills | Postgres optimization |

### SDD Executor Skills

| Skill | Location |
|-------|----------|
| `sdd-apply` | `~/.config/opencode/skills/sdd-apply/` |
| `sdd-archive` | `~/.config/opencode/skills/sdd-archive/` |
| `sdd-design` | `~/.config/opencode/skills/sdd-design/` |
| `sdd-explore` | `~/.config/opencode/skills/sdd-explore/` |
| `sdd-init` | `~/.config/opencode/skills/sdd-init/` |
| `sdd-onboard` | `~/.config/opencode/skills/sdd-onboard/` |
| `sdd-propose` | `~/.config/opencode/skills/sdd-propose/` |
| `sdd-spec` | `~/.config/opencode/skills/sdd-spec/` |
| `sdd-tasks` | `~/.config/opencode/skills/sdd-tasks/` |
| `sdd-verify` | `~/.config/opencode/skills/sdd-verify/` |

### Pending Transfer from Windows

These skills exist on the Windows PC at `C:\Users\PC\.agents\skills\` and need to be copied to `~/.agents/skills/`:

| Skill | Purpose |
|-------|---------|
| `vercel-react-best-practices` | React optimization rules |
| `tailwind-design-system` | Tailwind patterns (v4 — project uses v3) |
| `langgraph-fundamentals` | LangGraph StateGraph, streaming |
| `embedding-strategies` | Embedding models, chunking, RAG |
| `hybrid-search-implementation` | Vector + keyword search |
| `fastapi-python` | FastAPI backend patterns |
| `fastapi-templates` | FastAPI templates |
| `docker-compose-orchestration` | Docker Compose orchestration |
| `docker-expert` | Container optimization |
| `sqlalchemy-alembic-expert-best-practices-code-review` | SQLAlchemy/Alembic best practices |
| `documentation-writer` | Diátaxis documentation |
| `chart-visualization` | Chart/graph visualization |
| `enhance-prompt` | Prompt engineering |
| `farming-expert` | Agricultural domain expertise |
| `obsidian-cli` | Obsidian CLI integration |
| `obsidian-markdown` | Obsidian markdown formatting |
| `pdf-generator` | PDF generation |
| `postgresql-table-design` | PostgreSQL table design |
| `backend-api` | FastAPI backend API patterns |
| `frontend-spa` | React SPA patterns |
| `infra-docker` | Docker infrastructure |
| `branch-pr` | PR branch management |
| `chained-pr` | Chained/stacked PR workflow |
| `cognitive-doc-design` | Cognitive load documentation |
| `comment-writer` | Collaboration comments |
| `issue-creation` | GitHub issue creation |
| `judgment-day` | Dual review workflow |
| `skill-improver` | Skill auditing/upgrading |
| `work-unit-commits` | Work unit commit planning |

Browse more: `npx skills find <query>`

## Deployment

- Build output: `./dist`
- Platform: TBD
