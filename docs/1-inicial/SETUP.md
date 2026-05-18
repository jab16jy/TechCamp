---
titulo: "Instalacion y Configuracion"
proyecto: AgroCaribe IA
tags: [setup, instalacion, configuracion, desarrollo]
---

# Instalacion y Configuracion

## Requisitos Previos

- Node.js 18+
- npm 9+
- Python 3.12+
- Docker Desktop (opcional, para backend containerizado)

## Instalacion Frontend

```powershell
npm install
```

## Instalacion Backend

```powershell
cd backend
pip install -r requirements.txt
```

## Variables de Entorno

Crear `.env` en la raiz del proyecto (backend Docker) o `backend/.env` (local):

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Conexion PostgreSQL (Supabase pooler) | — |
| `SUPABASE_URL` | URL del proyecto Supabase | — |
| `SUPABASE_ANON_KEY` | Anon key de Supabase | — |
| `VITE_API_URL` | URL del backend para el frontend | `http://localhost:8000` |
| `OPENMETEO_BASE_URL` | API de clima | `https://api.open-meteo.com/v1` |

Si la API no esta disponible, el sistema activa automaticamente el modo Mock.

## Scripts

### Frontend

| Comando | Accion |
|---------|--------|
| `npm run dev` | Servidor de desarrollo en `localhost:5173` |
| `npm run build` | Build para produccion en `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Previsualizar build de produccion |

### Backend

| Comando | Accion |
|---------|--------|
| `cd backend && uvicorn app.main:app --reload` | Servidor de desarrollo en `localhost:8000` |
| `cd backend && python -m pytest tests/ -v` | Ejecutar 16 tests |
| `docker compose up -d` | Backend containerizado en `:8000` |

## Desarrollo Local (2 terminales)

```powershell
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
npm run dev
```

Abrir `http://localhost:5173` en el navegador.

## Credenciales de Prueba (Login Investigador)

- Email: `investigador@techcamp.co`
- Contrasena: `AgroCaribe2025`

La sesion se guarda en `sessionStorage` y se limpia al cerrar la pestana.

## Notas

- 16 tests backend (pytest + httpx.AsyncClient)
- No hay test suite frontend configurada
- No hay typecheck step
- ESLint como unico linter frontend
- Backend usa Ruff/Pylint (no configurado automaticamente)

---

## Referencias

- [[4-arquitectura/DESPLIEGUE]] — Despliegue con Docker + Vercel
- [[2-backend/ARQUITECTURA_BACKEND]] — Arquitectura del backend y endpoints
- [[4-arquitectura/VISION_SISTEMA]] — Stack tecnologico completo y versiones

