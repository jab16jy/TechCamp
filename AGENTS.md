# AGENTS.md — AgroCaribe AI

## Project summary
React 19 SPA built with Vite 8. No TypeScript, no tests, no CI.

## Commands
- `npm run dev` — start dev server (port 5173, auto-opens browser)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, no Prettier)
- `npm run preview` — preview production build

## Architecture
- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Routing**: react-router-dom v6, routes defined in `App.jsx`
- **State**: single Zustand store at `src/context/useAppStore.js` (form, results, toasts, API status)
- **API**: `src/services/api.js` — axios client with mock data fallback when backend is unreachable
- **Maps**: leaflet + react-leaflet

## Routes
| Path | Page | Layout |
|---|---|---|
| `/` | Acceso (profile selection) | bare |
| `/home` | Home (landing) | Navbar + Footer |
| `/consulta` | Consulta (map + form) | Navbar + Footer |
| `/resultado` | Resultado (analysis) | Navbar + Footer |
| `/historial` | Historial | Navbar + Footer |
| `/investigador/login` | LoginInvestigador | bare |
| `/investigador/dashboard` | DashboardInvestigador | bare |

Investigador routes do NOT use the `LayoutApp` wrapper (they have their own layout).

## Backend
- Expects a FastAPI backend at `http://localhost:8000`
- Configured via `.env` key `VITE_API_URL`
- API endpoints: `GET /municipalities`, `POST /analyze-location`, `GET /climate`, `GET /satellite-indicators`, `GET /history`
- All API calls silently fall back to mock data on failure — the app works standalone

## Directory structure
```
src/
  components/   — shared UI (each component is its own folder: Component/Component.jsx + optional styles)
  pages/        — route-level pages (same folder-per-page pattern)
  context/      — Zustand store (useAppStore.js)
  services/     — API client (api.js)
  assets/       — static assets
  index.css     — global styles + CSS custom properties (design tokens, fonts)
```

## Conventions
- Files use `.jsx` extension (no TypeScript)
- Component/page folders: `Name/Name.jsx` pattern
- Global CSS variables defined in `index.css` (design tokens, fonts, spacing) — use them instead of hardcoded values
- Fonts: Fraunces (titles), DM Sans (body) — loaded via `index.css`
- No test framework configured — do not assume tests exist
