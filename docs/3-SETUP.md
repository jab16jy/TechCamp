# Instalación y Configuración

## Requisitos Previos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Variables de Entorno

Crear `.env` en la raíz del proyecto:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend FastAPI | `http://localhost:8000` |

Si la API no está disponible, el sistema activa automáticamente el modo Mock.

## Scripts

| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor de desarrollo en `localhost:5173` |
| `npm run build` | Build para producción en `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Previsualizar build de producción |

## Despliegue (Cloudflare Pages)

```bash
npx wrangler pages deploy dist
```

Configuración en `wrangler.toml` (account: `306aa72430e7ed3ca1ebea392c91aba8`).

## Credenciales de Prueba (Login Investigador)

- Email: `investigador@techcamp.co`
- Contraseña: `AgroCaribe2025`

La sesión se guarda en `sessionStorage` y se limpia al cerrar la pestaña.

## Notas

- No hay test suite configurada
- No hay typecheck step
- El proyecto usa ESLint como único linter
