---
titulo: "Troubleshooting y Roadmap"
proyecto: AgroCaribe IA
tags: [troubleshooting, errores, soluciones, roadmap]
---

# Troubleshooting y Roadmap

## Problemas Comunes

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
