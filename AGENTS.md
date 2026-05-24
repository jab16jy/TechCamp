# AgroCaribe AI

React 19 SPA — agricultural analysis platform. Vite 8, Tailwind CSS 3, Zustand 5, React Router 6, Leaflet maps, Lucide icons.

## Quick Reference

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server on `localhost:5173` |
| `npm run build` | Outputs to `dist/` |
| `npm run lint` | ESLint only |
| `npm run preview` | Preview production build |

No tests. No typecheck.

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

| Skill | Purpose |
|-------|---------|
| `frontend-design` | UI design, glassmorphism, typography |
| `vercel-react-best-practices` | React optimization rules |
| `webapp-testing` | Playwright testing |
| `tailwind-design-system` | Tailwind patterns (v4 — project uses v3) |
| `langgraph-fundamentals` | LangGraph StateGraph, streaming |
| `embedding-strategies` | Embedding models, chunking, RAG |
| `hybrid-search-implementation` | Vector + keyword search |
| `fastapi-python` | FastAPI backend patterns |
| `docker-compose-orchestration` | Docker Compose orchestration |
| `docker-expert` | Container optimization |
| `sqlalchemy-alembic-expert-best-practices-code-review` | SQLAlchemy/Alembic best practices |
| `supabase` | Supabase integration |
| `supabase-postgres-best-practices` | Postgres optimization |

Browse more: `npx skills find <query>`

## Deployment

- Build output: `./dist`
- Platform: TBD
