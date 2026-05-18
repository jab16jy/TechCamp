# Troubleshooting y Roadmap

## Problemas Comunes

### Tailwind CSS no aplica
- **Causa:** Servidor de desarrollo no detectó cambios o PostCSS falló
- **Solución:** Reiniciar `npm run dev`, verificar `content` en `tailwind.config.js`, confirmar directivas `@tailwind` en `index.css`

### Página en blanco al navegar
- **Causa:** Error en definición de ruta en `App.jsx` o componente sin `export default`
- **Solución:** Revisar consola del navegador y verificar paths en `<Routes>`

### 404 en despliegue
- **Causa:** Servidor no configurado para SPA
- **Solución:** Configurar SPA fallback en el servidor (referir todo a `/index.html`)

### Siempre muestra datos Mock
- **Causa:** Backend inaccesible o `VITE_API_URL` incorrecta
- **Solución:** Verificar backend en el puerto indicado, revisar `.env` y pestaña Network del navegador

### Error CORS
- **Causa:** Backend no permite el origen del frontend
- **Solución:** Configurar CORS middleware en FastAPI

### Módulo no encontrado
- **Solución:** `npm install` o borrar `node_modules` y reinstalar

### Estilos de página no cargan
- Algunos `.module.css` están huérfanos (no importados por su JSX). Preferir el CSS importado o los inline styles del JSX.

## Estilo vs Documentación

| Lo que dice algún doc antiguo | Realidad del proyecto |
|------------------------------|----------------------|
| Montserrat, Inter, Playfair | **Manrope** únicamente |
| Material Symbols | **lucide-react** únicamente |
| DM Sans, IBM Plex Mono | No usar |

## Futuras Mejoras

### Rendimiento
- Code Splitting con `React.lazy` y `Suspense`
- WebP + lazy loading para assets
- Memoización en gráficos complejos (Radar, Gauges)

### UX
- Service Workers para modo offline en zonas rurales
- Vista mobile simplificada para dashboards
- Auditoría de accesibilidad (a11y)

### Testing
- Vitest + React Testing Library para servicios y store
- Playwright para E2E (mapa → análisis → resultado)

### Datos
- Persistencia del store en `localStorage`
- Exportación PDF con `jspdf`
- Transición completa de Mock a API real
