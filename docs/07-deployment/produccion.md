---
title: "Despliegue en Producción — Frontend + Backend"
proyecto: AgroCaribe IA
tags: [despliegue, produccion, vercel, cloudflare-pages, CORS, seguridad]
---

# Despliegue en Producción

## Arquitectura General

```
                          Internet
                             │
                      ┌──────┴──────┐
                      │  Vercel o   │  ← Frontend React (SPA estático)
                      │ Cloudflare  │     dist/ generado con `npm run build`
                      │ Pages       │
                      └──────┬──────┘
                             │ HTTPS
                             ▼
                  ┌──────────────────────┐
                  │ Backend FastAPI      │  ← Docker en VPS / Railway / Fly.io
                  │ :8000                │     app/main.py
                  │                      │
                  │ OLLAMA_BASE_URL      │  ← LLM local (gemma2:2b)
                  │ DATABASE_URL         │  ← PostgreSQL + PostGIS
                  └──────────────────────┘
```

El frontend es una **SPA estática** (React 19 + Vite 8) que se despliega en plataformas serverless. El backend corre en contenedores Docker con PostGIS para datos geoespaciales y Ollama para el LLM local.

> **Supabase** se usa únicamente para **Auth** (autenticación), no para datos. La base de datos principal es PostgreSQL + PostGIS corriendo en el mismo VPS.

---

## 1. Deploy Frontend en Vercel

### Prerrequisitos

- Proyecto subido a GitHub
- Cuenta en [vercel.com](https://vercel.com) conectada a GitHub
- `VITE_API_URL` definida con la URL del backend en producción

### Paso a paso

#### Opción A: Importar desde GitHub (recomendado)

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el repositorio de AgroCaribe
3. Configurar:

   | Campo | Valor |
   |-------|-------|
   | **Framework Preset** | Vite |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
   | **Node Version** | 22.x (o la que uses localmente) |

4. Añadir variable de entorno:

   ```
   VITE_API_URL=https://api.agrocaribe.com
   ```

5. Deploy — Vercel detecta automáticamente pushes a `main` y redeploya.

#### Opción B: Vercel CLI

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy desde la raíz del proyecto
vercel --prod

# La primera vez pide configuración interactiva:
# ? Set up and deploy — Y
# ? Which scope — tu-usuario
# ? Link to existing project? — N
# ? Project name — agrocaribe-ia
# ? Directory — ./
# ? Override settings? — Y
#   Build: npm run build
#   Output: dist
```

### Post-deploy

- Vercel asigna un dominio `*.vercel.app` automático
- Configurar dominio personalizado en Settings → Domains
- Verificar que `VITE_API_URL` apunte al backend correcto
- Revisar logs en Vercel Dashboard → Deployments → último deploy → Function Logs

### `vercel.json` (opcional)

Si necesitas headers de seguridad o rewrites específicos:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, immutable, max-age=31536000" }
      ]
    }
  ]
}
```

> **Nota**: Vercel ya maneja el SPA fallback automáticamente para frameworks Vite. El `vercel.json` es opcional si solo necesitas lo básico.

---

## 2. Deploy Frontend en Cloudflare Pages

### Prerrequisitos

- Proyecto subido a GitHub
- Cuenta en [Cloudflare Pages](https://pages.cloudflare.com)
- Wrangler CLI instalado

### Instalación de Wrangler

```bash
npm install -g wrangler
# o
npm install --save-dev wrangler
```

### Paso a paso

#### Opción A: Directa desde GitHub

1. Ir a Cloudflare Dashboard → Pages → Create a project
2. Conectar repositorio de GitHub
3. Configurar:

   | Campo | Valor |
   |-------|-------|
   | **Framework preset** | Vite |
   | **Build command** | `npm run build` |
   | **Build output** | `dist` |
   | **Root directory** | (vacío — raíz del proyecto) |

4. Añadir variable de entorno:

   ```
   VITE_API_URL=https://api.agrocaribe.com
   ```

5. Deploy. Cloudflare Pages redeploya automáticamente en cada push a `main`.

#### Opción B: Wrangler CLI

```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name agrocaribe-ia

# Si es primera vez, wrangler pide login
# Se puede pasar --branch para especificar rama
npx wrangler pages deploy dist --project-name agrocaribe-ia --branch main
```

### SPA Fallback en Cloudflare Pages

Cloudflare Pages **no** maneja SPA fallback automáticamente. Hay que crearlo:

1. Ir a Cloudflare Dashboard → tu proyecto → **Routing**
2. Agregar regla:

   ```
   # Si el recurso no existe, servir index.html
   / * /index.html 200
   ```

O crear un archivo `_routes.json`:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*"],
  "fallback": "/index.html"
}
```

### `wrangler.toml`

Archivo de configuración para Cloudflare Pages:

```toml
name = "agrocaribe-ia"
pages_build_output_dir = "./dist"
compatibility_date = "2026-06-01"

[env.production]
vars = { VITE_API_URL = "https://api.agrocaribe.com" }

[[redirects]]
from = "/"
to = "/index.html"
status = 200
```

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre del proyecto en Cloudflare |
| `pages_build_output_dir` | Directorio de salida del build |
| `compatibility_date` | Fecha de compatibilidad de Workers runtime |
| `[env.production].vars` | Variables de entorno para producción |
| `[[redirects]]` | Reglas de redirección (SPA fallback) |

---

## 3. Variables de Entorno de Producción

### Backend (VPS / Docker)

```env
# ── Base de datos ──
DATABASE_URL=postgresql+asyncpg://agrocaribe:[PASSWORD]@db:5432/agrocaribe

# ── Supabase (solo Auth) ──
SUPABASE_URL=https://hpmjbgqjwopxlgurczna.supabase.co
SUPABASE_ANON_KEY=eyJ...

# ── Entorno ──
ENVIRONMENT=production
LOG_LEVEL=INFO

# ── API externa ──
OPENMETEO_BASE_URL=https://api.open-meteo.com/v1

# ── Ollama ──
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=gemma2:2b

# ── ML ──
MODEL_ARTIFACT_DIR=/app/model_artifacts

# ── CORS ──
CORS_ORIGINS=https://agrocaribe.vercel.app,https://agrocaribe.pages.dev
```

### Frontend (Vercel / Cloudflare)

```env
VITE_API_URL=https://api.agrocaribe.com
```

---

## 4. CORS y Seguridad

### Configuración CORS en FastAPI

El backend valida `CORS_ORIGINS` desde variable de entorno:

```python
# app/core/config.py
import os

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

En producción no usar `allow_origins=["*"]` — listar explícitamente los dominios autorizados.

### Headers de Seguridad Recomendados

Aplicar desde el reverse proxy (nginx) o desde la plataforma (Vercel/Cloudflare):

| Header | Valor | Efecto |
|--------|-------|--------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forzar HTTPS |
| `X-Content-Type-Options` | `nosniff` | Evitar MIME sniffing |
| `X-Frame-Options` | `DENY` | Evitar clickjacking |
| `Content-Security-Policy` | `default-src 'self'` | Mitigar XSS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controlar referrer |

Ejemplo para nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://api.agrocaribe.com; img-src 'self' data: https://*.tile.openstreetmap.org; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
```

### HTTPS

No exponer el backend directamente al internet. Siempre usar:

1. **Nginx reverse proxy** (en VPS) con certificado SSL via Let's Encrypt / Certbot
2. O plataforma como **Railway / Fly.io** que maneja SSL automáticamente

```bash
# En VPS con nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.agrocaribe.com
```

### Reglas de Firewall (VPS)

```bash
# Solo puertos necesarios
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 443/tcp      # HTTPS
sudo ufw enable
```

No exponer puertos 5432 (PostgreSQL), 11434 (Ollama) ni 8000 (FastAPI) al exterior.

---

## 5. Pipeline Completo de Deploy

```
Desarrollador
    │
    ├── git push (frontend changes)
    │       │
    │       ├── Vercel / Cloudflare Pages
    │       │   ├── npm install
    │       │   ├── npm run build
    │       │   └── deploy dist/
    │       │
    │       └── Resultado: Frontend actualizado en CDN
    │
    └── git push (backend changes)
            │
            └── GitHub Actions / manual
                ├── docker build -t backend:tag
                ├── docker push a registry
                └── SSH a VPS → docker compose pull && docker compose up -d
```

---

## 6. Verificación Post-Deploy

```bash
# Healthcheck del backend
curl https://api.agrocaribe.com/health

# Respuesta esperada:
# {"status": "ok", "database": "connected", "ollama": "connected", "environment": "production"}

# Verificar CORS
curl -H "Origin: https://agrocaribe.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     -v https://api.agrocaribe.com/health
# Debe responder con Access-Control-Allow-Origin: https://agrocaribe.vercel.app
```

---

## Referencias

- [[../04-development/setup|04-development/setup]] — configuración local del entorno
- [[../05-database/esquema|05-database/esquema]] — esquema de base de datos y tablas
- [[./docker|docker]] — despliegue Docker del backend
- [Documentación Vite Deploy](https://vite.dev/guide/static-deploy)
- [Cloudflare Pages SPA Fallback](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering)
