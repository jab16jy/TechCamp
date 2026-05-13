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

## Architecture

- **Entrypoint**: `src/main.jsx` → `src/App.jsx` (BrowserRouter + Routes)
- **State**: Single Zustand store at `src/context/useAppStore.js` — holds `formulario`, `resultado`, `cargandoAnalisis`, `toasts`
- **API**: Axios client at `src/services/api.js` targets `localhost:8000`. All endpoints have mock fallback (serverless dev works without backend)
- **Layout**: `ResearcherLayout` wraps all dashboard routes — has a fixed floating sidebar (5 icons) and sticky glass navbar
- **Styling**: Mix of Tailwind utility classes, CSS Modules (`.module.css`), and plain CSS. Design system is **Integrated Organic** glassmorphism: Manrope font, botanical greens (`#0f5238`, `#2d6a4f`), `backdrop-filter` cards with `rgba(255,255,255,0.55)` backgrounds
- **Icons**: `lucide-react` only — do NOT use Material Symbols/`material-symbols-outlined`
- **Routing**: All routes defined in `src/App.jsx`. Key paths: `/`, `/investigador/login`, `/investigador/dashboard`, `/investigador/analisis`, `/investigador/ia`, `/investigador/reportes`

## Dashboard Pages (all wrapped in ResearcherLayout)

| Route | Component | Description |
|-------|-----------|-------------|
| `/investigador/dashboard` | `DashboardInvestigador` | Overview. Tailwind glass classes directly in JSX. |
| `/investigador/analisis` | `AnalisisCultivos` | Crop analysis form + map. Uses `AnalisisCultivos.css` (plain CSS, NOT `.module.css`). |
| `/investigador/ia` | `IAPredictiva` | AI prediction dashboard. Uses `IAPredictiva.css`. |
| `/investigador/mapas` | `AgroAsesor` | Map + chatbot. No CSS file (inline styles with glassmorphism). |
| `/investigador/reportes` | `GestionReportes` | Reports. Uses `GestionReportes.css`. |
| `/investigador/sensores` | `SensoresIoT` | IoT sensor dashboard. Uses `SensoresIoT.css`. |
| `/investigador/resultado-avanzado` | `ResultadoAvanzado` | Advanced results. Uses `ResultadoAvanzado.css`. |

## Design Conventions

- **Font**: Manrope everywhere. Do NOT use DM Sans, Montserrat, Playfair Display, Syne, Inter, or IBM Plex Mono.
- **Color palette**: Use the M3 tokens from `src/index.css` (`--m3-*`) or the Tailwind colors from `tailwind.config.js` (`primary: #0f5238`, `primary-container: #2d6a4f`, etc.)
- **Glass cards**: Standard pattern is `background: rgba(255,255,255,0.55); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.25); border-radius: 2rem;`
- **Animation**: `@keyframes` can be added in component CSS. Use `0.3s ease` transitions. Entry animations via framer-motion (available in ResearcherLayout for dropdowns).
- **CSS approach**: Each page uses either plain CSS (e.g., `AnalisisCultivos.css`), CSS Modules (e.g., `LoginInvestigador.module.css`), or Tailwind alone. Stay consistent with the file's existing approach.

## Skills (installed)

Skills live in `.agents/skills/` and are loaded automatically:
- `frontend-design` — UI design, glassmorphism, typography
- `vercel-react-best-practices` — React optimization rules
- `webapp-testing` — Playwright-based testing scripts
- `tailwind-design-system` — Tailwind v4 patterns (project uses v3)
- `hono` — backend API patterns
- `performance-optimizer` — performance auditing

Browse more skills: `npx skills find <query>`

## Deployment

- Cloudflare Pages via `wrangler.toml` (account: `306aa72430e7ed3ca1ebea392c91aba8`)
- Build output: `./dist`

## Gotchas

- Some pages have orphaned `.module.css` files no longer imported by their JSX (e.g., `GestionReportes.module.css`, `IAPredictiva.module.css`, `ResultadoAvanzado.module.css`, `SensoresIoT.module.css`, `DashboardInvestigador.module.css`). Prefer editing the imported CSS file or the JSX inline styles instead.
- The `ResearcherLayout` wraps pages in an `absolute` positioned `<main>` — content needs `position: relative` if it should be positioned relative to the main area.
- Refresh page to logout: session is in `sessionStorage` (cleared on tab close).
- The `FloatingAIButton` (a persistent floating bot icon) and `Toast` component are rendered at the App level, outside the router/ResearcherLayout.
- Login credentials hint is shown on the login page: `investigador@techcamp.co` / `AgroCaribe2025`.
