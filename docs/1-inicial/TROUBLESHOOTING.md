---
titulo: "Troubleshooting y Roadmap"
proyecto: AgroCaribe IA
tags: [troubleshooting, errores, soluciones, roadmap]
---

# Troubleshooting y Roadmap

## Problemas Comunes

### IA Predictiva: dropdown vacio o no deja seleccionar
- **Causa 1:** Backend devuelve `[]` y no se mergea con MOCK_DATA
- **Solucion:** Verificar que `getHistorial()` en `api.js` tenga el merge con `MOCK_DATA.historial`
- **Causa 2:** Popover tapado por el `<div class="ia-empty">`
- **Solucion:** Verificar que `.ia-input-card` tenga `position: relative; z-index: 10;` en CSS

### IA Predictiva: "Generar Proyeccion" deshabilitado
- **Causa:** `analysisId` es null (no se ha seleccionado ningun analisis)
- **Solucion:** Seleccionar un item del dropdown historial primero
- **Nota:** El boton requiere `analysisId` para habilitarse

### IA Predictiva: loading infinito al seleccionar historial
- **Causa:** `getAnalysis(id)` falla para IDs no-UUID (ej. "C-0421")
- **Solucion:** `handleSelectAnalysis` debe tener fallback local al historial combinado

### Docker: BD no tiene tablas o columnas faltantes
- **Causa:** Migraciones de Alembic no ejecutadas o volumen corrupto
- **Solucion:** `docker compose exec backend alembic upgrade head`
- Si persiste: `docker compose down -v && docker compose up -d && docker compose exec backend alembic upgrade head`

### Docker: "Cannot drop spatial_ref_sys" en migracion
- **Causa:** Alembic genero `op.drop_table('spatial_ref_sys')` que es parte de PostGIS
- **Solucion:** Eliminar esa linea de la migracion generada, es parte de la extension

### Docker: backend no arranca por modulo faltante
- **Causa:** `requirements.txt` no tiene todas las dependencias (ej. `cachetools`)
- **Solucion:** Agregar modulo faltante a `requirements.txt` y reconstruir

### Backend: columna `municipios.geometry` no existe
- **Causa:** Seed SQL creo la tabla sin la columna PostGIS
- **Solucion:** `ALTER TABLE municipios ADD COLUMN IF NOT EXISTS geometry geometry(MultiPolygon, 4326);`

### Tailwind CSS no aplica
- **Causa:** Servidor de desarrollo no detecto cambios o PostCSS fallo
- **Solucion:** Reiniciar `npm run dev`, verificar `content` en `tailwind.config.js`, confirmar directivas `@tailwind` en `index.css`

### Pagina en blanco al navegar
- **Causa:** Error en definicion de ruta en `App.jsx` o componente sin `export default`
- **Solucion:** Revisar consola del navegador y verificar paths en `<Routes>`

### 404 en despliegue
- **Causa:** Servidor no configurado para SPA
- **Solucion:** Configurar SPA fallback en el servidor (referir todo a `/index.html`)

### Siempre muestra datos Mock
- **Causa:** Backend inaccesible o `VITE_API_URL` incorrecta
- **Solucion:** Verificar backend en el puerto indicado (`localhost:8000`), revisar `.env` y pestana Network del navegador

### Error CORS
- **Causa:** Backend no permite el origen del frontend
- **Solucion:** Verificar `CORS_ORIGINS` en `backend/.env` o variables del contenedor Docker

### Modulo no encontrado
- **Solucion:** `npm install` o borrar `node_modules` y reinstalar. Para backend: `pip install -r requirements.txt`

### Docker no conecta a Supabase
- **Causa:** DNS del contenedor no resuelve `*.pooler.supabase.com`
- **Solucion:** Verificar red Docker Desktop, agregar DNS `8.8.8.8` en `docker-compose.yml` o usar `network_mode: "host"`

### Error "Tenant or user not found" en Supabase
- **Causa:** Region del pooler incorrecta o password erronea
- **Solucion:** Verificar region en dashboard de Supabase (tu proyecto: `us-west-1`), el host correcto es `aws-1-us-west-1.pooler.supabase.com`

## Futuras Mejoras

### Rendimiento Frontend
- Code Splitting con `React.lazy` y `Suspense`
- WebP + lazy loading para assets
- Memoizacion en graficos complejos

### UX
- Service Workers para modo offline en zonas rurales
- Vista mobile simplificada para dashboards
- Auditoria de accesibilidad (a11y)

### Testing
- Vitest + React Testing Library para servicios y store
- Playwright para E2E (mapa → analisis → resultado)

### Datos
- Persistencia del store en `localStorage` (ya implementada para historial)
- Exportacion PDF con `jspdf`
- Transicion completa de Mock a API real (backend ya implementado, frontend parcial)

---

## Referencias

- [[1-inicial/SETUP]] — Instalacion y configuracion
- [[4-arquitectura/DESPLIEGUE]] — Docker y produccion
- [[4-arquitectura/ARQUITECTURA_DB]] — Conexion a Supabase y errores de pooler
