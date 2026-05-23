# AgroCaribe AI

React 19 SPA — agricultural analysis platform. Vite 8, Tailwind CSS 3, Zustand 5, React Router 6, Leaflet maps, Lucide icons.

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server on `localhost:5173`, auto-opens browser |
| `npm run build` | Outputs to `dist/` (Cloudflare Pages deploy) |
| `npm run lint` | ESLint only — no formatter configured |
| `npm run preview` | Preview production build locally |

No test suite configured. No typecheck step.

## Architecture — Feature-Based

The codebase follows a **feature-based folder structure** with path aliases.

```
src/
├── main.jsx              → Vite entrypoint
├── App.jsx               → BrowserRouter + Routes
├── assets/               → Images, logos, sprites
├── shared/               → Cross-cutting concerns
│   ├── layout/           → ResearcherLayout, AmbientBackground, FloatingAIButton
│   ├── services/         → api.js, analysisService.js
│   ├── store/            → Zustand slices: analysisSlice, historySlice, uiSlice
│   ├── styles/           → Global CSS (index.css)
│   └── ui/               → Reusable UI primitives (Toast, InfoTip, DataSourcesCard)
└── features/             → Domain modules
    ├── analysis/         → AnalisisCultivos, Resultado, ResultadoAvanzado
    ├── auth/             → Login, Acceso
    ├── chat/             → AgroAsesor (map + chatbot)
    ├── dashboard/        → DashboardInvestigador
    ├── history/          → Historial
    ├── map/              → Mapa
    ├── predictions/      → IAPredictiva
    ├── reports/          → GestionReportes
    └── sensors/          → SensoresIoT
```

### Path Aliases (vite.config.js + jsconfig.json)

| Alias | Points to |
|-------|-----------|
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |
| `@assets/*` | `src/assets/*` |

Example:
```js
import ResearcherLayout from '@shared/layout/ResearcherLayout/ResearcherLayout'
import useAppStore from '@shared/store'
import { AnalysisService } from '@shared/services/analysisService'
```

### State Management

Zustand store at `@shared/store` (was `src/context/useAppStore.js`). Split into slices:
- `analysisSlice` — form data, loading state, results
- `historySlice` — analysis history with localStorage persistence
- `uiSlice` — toasts, UI flags

### API / Services

Axios client at `@shared/services/api.js` targets `localhost:8000`. All endpoints have mock fallback (serverless dev works without backend).
Business logic hooks live inside each feature: `@features/<feature>/hooks/use*.js|jsx`.

## Dashboard Pages (all wrapped in ResearcherLayout)

| Route | Component | File | Description |
|-------|-----------|------|-------------|
| `/investigador/dashboard` | `DashboardInvestigador` | `features/dashboard/pages/DashboardInvestigador.jsx` | Overview. Uses `useDashboard` hook. |
| `/investigador/analisis` | `AnalisisCultivos` | `features/analysis/pages/AnalisisCultivos.jsx` | Crop analysis form + map. Uses `useAnalisisCultivos`. |
| `/investigador/ia` | `IAPredictiva` | `features/predictions/pages/IAPredictiva.jsx` | AI prediction dashboard. Uses `usePredictionSimulator`. |
| `/investigador/mapas` | `AgroAsesor` | `features/chat/pages/AgroAsesor.jsx` | Map + chatbot. Uses `useChat`. |
| `/investigador/reportes` | `GestionReportes` | `features/reports/pages/GestionReportes.jsx` | Reports. Uses `useTaskManager`. |
| `/investigador/sensores` | `SensoresIoT` | `features/sensors/pages/SensoresIoT.jsx` | IoT sensor dashboard. Uses `useSensoresIoT`. |
| `/investigador/historial` | `Historial` | `features/history/pages/Historial.jsx` | Analysis history. Uses `useHistorial`. |
| `/investigador/resultado-avanzado` | `ResultadoAvanzado` | `features/analysis/pages/ResultadoAvanzado.jsx` | Advanced results. Uses `useResultadoAvanzado`. |
| `/resultado` | `Resultado` | `features/analysis/pages/Resultado.jsx` | Shared result page. Uses `useResultado`. |

## Design Conventions

- **Font**: Manrope everywhere. Do NOT use DM Sans, Montserrat, Playfair Display, Syne, Inter, or IBM Plex Mono.
- **Color palette**: Use the M3 tokens from `src/shared/styles/index.css` (`--m3-*`) or the Tailwind colors from `tailwind.config.js` (`primary: #0f5238`, `primary-container: #2d6a4f`, etc.)
- **Glass cards**: Standard pattern is `background: rgba(255,255,255,0.55); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.25); border-radius: 2rem;`
- **Animation**: `@keyframes` can be added in component CSS. Use `0.3s ease` transitions. Entry animations via framer-motion (available in ResearcherLayout for dropdowns).
- **CSS approach**: Each page uses either plain CSS (e.g., `AnalisisCultivos.css`), CSS Modules (e.g., `LoginInvestigador.module.css`), or Tailwind alone. Stay consistent with the file's existing approach.
- **Icons**: `lucide-react` only — do NOT use Material Symbols/`material-symbols-outlined`.

## Skills (installed)

Skills live in `.agents/skills/` and are loaded automatically:
- `frontend-design` — UI design, glassmorphism, typography
- `vercel-react-best-practices` — React optimization rules
- `webapp-testing` — Playwright-based testing scripts
- `tailwind-design-system` — Tailwind v4 patterns (project uses v3)
- `hono` — backend API patterns
- `performance-optimizer` — performance auditing
- `langgraph-fundamentals` — LangGraph StateGraph, nodes, edges, streaming (v0.3.x)
- `embedding-strategies` — Embedding model selection, chunking, RAG optimization
- `hybrid-search-implementation` — Combine vector + keyword search for retrieval

Browse more skills: `npx skills find <query>`

## Backend Rules (FastAPI + PostgreSQL/PostGIS)

- **Framework**: FastAPI async only, SQLAlchemy 2.0 async session, asyncpg driver
- **Pattern**: Repository pattern — services → models, never raw SQL in routes
- **Schemas**: Pydantic v2 with `from_attributes=True`
- **Migrations**: Alembic only, never `Base.metadata.create_all()`
- **Tests**: pytest + httpx.AsyncClient
- **ML**: scikit-learn models in `backend/app/ml/`
- **Agent**: LangGraph workflow in `backend/app/agent/`
- **Docker**: Backend runs in container (see `backend/Dockerfile`), PostGIS in `docker-compose.yml`
- **Style**: Type hints mandatory on all functions, async def for all endpoints

### Chatbot Architecture (Gemma 2:2b + LangGraph + RAG)

```
POST /chat → chat.py
  ↓
chat_service.py → process_chat_message()
  ↓
  ├─ (1) LangGraph Agent → source "langgraph-agent"
  │   ├─ [orchestrator] → classify intent + search_rag(TF-IDF) + execute DB tools
  │   └─ [generate] → format prompt + ollama_generate(gemma2:2b)
  ├─ (2) Direct LLM → source "llm" (fallback)
  └─ (3) Keyword match → source "keyword-fallback"
```

**Agent tools** (`agent/tools.py`): `get_last_analysis`, `get_history_summary`, `get_sensor_status`

**RAG**: 40 Markdown docs in `data/rag/`, TF-IDF vectorized with sklearn, chunking by `##` sections

**LLM**: Ollama container in docker-compose, `gemma2:2b` model, OpenAI-compatible endpoint at `http://ollama:11434/v1`

### Docker Services

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `db` | postgis/postgis:16-3.4 | 5432 | Local PG for dev |
| `ollama` | ollama/ollama:latest | 11434 | Auto-pull gemma2:2b on start |
| `backend` | Dockerfile | 8000 | FastAPI + uvicorn, depends on db[healthy] + ollama[started] |

## Git Branch Workflow

OpenCode corre en un **sandbox aislado** que comparte el `.git` con el proyecto. Cada tarea que implique cambios debe crear un **branch** para proteger `main`. Los comandos se ejecutan dentro del sandbox (sin `-C`).

### Flujo obligatorio

```powershell
git checkout -b feature/mi-feature origin/main
# editar archivos
git add -A
git commit -m "feat: descripcion"
git push origin feature/mi-feature
gh pr create --fill
git checkout main
```

### Naming Convention

| Prefix | Uso |
|--------|-----|
| `feature/*` | Nuevas funcionalidades |
| `fix/*` | Bug fixes |
| `refactor/*` | Refactorización |
| `infra/*` | Docker, CI/CD, scripts |
| `experiment/*` | Pruebas temporales |

### Notas

- Solo crear branch si vas a editar archivos. Tareas de lectura no necesitan branch.
- Cada sandbox puede trabajar en branches distintos sin colisionar porque cada uno tiene su propio working tree y HEAD.
- El `git push` sube el branch a GitHub donde puedes crear el PR.
- Para volver al estado inicial del sandbox: `git checkout main`.

## Deployment

- Build output: `./dist`
- Plataforma por definir (pendiente decisión)

## Gotchas

- The `ResearcherLayout` wraps pages in an `absolute` positioned `<main>` — content needs `position: relative` if it should be positioned relative to the main area.
- Refresh page to logout: session is in `sessionStorage` (cleared on tab close).
- The `FloatingAIButton` (a persistent floating bot icon) and `Toast` component are rendered at the App level, outside the router/ResearcherLayout.
- Login credentials hint is shown on the login page: `investigador@techcamp.co` / `AgroCaribe2025`.
