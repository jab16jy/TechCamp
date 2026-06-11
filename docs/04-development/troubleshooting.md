---
titulo: "Troubleshooting — Problemas comunes y soluciones"
proyecto: AgroCaribe IA
tags: [troubleshooting, errores, soluciones, debug]
---

# Troubleshooting — Problemas comunes y soluciones

> **Nota:** Este documento cubre problemas del sistema actual con APIs reales.
> Ya no existe MOCK_DATA — los datos vienen de PostgreSQL, OpenMeteo, SoilGrids, NASA POWER.
> El único fallback son 3 recomendaciones estáticas en `analysisService.js`.

---

## Problemas comunes

### MapSelector: No carga el mapa o las herramientas de dibujo

- **Causa:** Leaflet CSS no importado o conflictos de versiones
- **Solución:** Verificar que `leaflet/dist/leaflet.css` y `leaflet-draw/dist/leaflet.draw.css` estén importados
- **Alternativa:** `npm install leaflet@1.9.4 leaflet-draw@1.0.4`

### AnalisisCultivos: No aparecen los nombres de ciudades en el mapa

- **Causa:** Los municipios se cargan desde el backend via `GET /municipalities`
- **Solución:** Verificar que el backend esté corriendo en `localhost:8000`
- **Nota:** Los marcadores de ciudades se agregaron en el mapa para orientación

### AnalisisCultivos: Datos de suelo (SoilGrids) no se autorellenan

- **Causa 1:** `GET /soil/data` falla porque ISRIC SoilGrids no tiene datos para la región Caribe
- **Causa 2:** Timeout de 15s en la llamada HTTP
- **Solución:** Si SoilGrids devuelve 502, los campos quedan editables manualmente
- **Nota:** SoilGrids tiene cobertura limitada para la región. Los datos se pueden ingresar manualmente

### AnalisisCultivos: Error al delimitar zonas automáticamente

- **Causa:** `POST /geo/decode` usa PostGIS `ST_Contains` y falla si el polígono está fuera del área de municipios cargados
- **Solución:** Asegurarse de dibujar dentro del área del Caribe colombiano
- **Nota:** La geo-detección funciona mejor con clic directo en el mapa (click-to-select) que con dibujo

### IA Predictiva: Botón "Generar Proyección" deshabilitado

- **Causa:** No se han ingresado coordenadas o no se ha seleccionado un análisis del historial
- **Solución:** Seleccionar un item del dropdown de historial o ingresar coordenadas manualmente
- **Nota:** El botón requiere coordenadas válidas + al menos un slider ajustado

### IA Predictiva: Proyección no muestra datos climáticos

- **Causa:** `POST /predict` falla o el backend no tiene conexión a NASA POWER / OpenMeteo
- **Solución:** Verificar que el backend tenga acceso a internet y que las APIs externas respondan
- **Nota:** La proyección de 6 meses requiere NASA POWER (climatología histórica) + OpenMeteo (datos actuales)

### AgroAsesor (Chat): No responde o respuestas genéricas

- **Causa:** El backend RAG no encuentra documentos relevantes o el LLM no está configurado
- **Solución:** Revisar `backend/app/data/rag/` para confirmar que haya documentos .md
- **Nota:** El RAG funciona con keyword-matching + TF-IDF sobre ~20 documentos. Para LLM real se necesita `OPENAI_API_KEY` o `OLLAMA_BASE_URL`

### Docker: BD no tiene tablas o columnas faltantes

- **Causa:** Migraciones de Alembic no ejecutadas o volumen corrupto
- **Solución:** `docker compose exec backend alembic upgrade head`
- **Alternativa:** `docker compose down -v && docker compose up -d && docker compose exec backend alembic upgrade head`

### Docker: "Cannot drop spatial_ref_sys" en migración

- **Causa:** Alembic generó `op.drop_table('spatial_ref_sys')` que es parte de PostGIS
- **Solución:** Eliminar esa línea de la migración generada, es parte de la extensión

### Docker: Backend no arranca por módulo faltante

- **Causa:** `requirements.txt` no tiene todas las dependencias
- **Solución:** Agregar módulo faltante a `requirements.txt` y reconstruir

### Backend: columna no existe

- **Causa:** Seed SQL creó la tabla sin todas las columnas
- **Solución:** Ejecutar migraciones de Alembic o agregar columna manualmente

### Página en blanco al navegar

- **Causa:** Error en definición de ruta en `App.jsx` o componente sin `export default`
- **Solución:** Revisar consola del navegador y verificar paths en `<Routes>`

### Error CORS

- **Causa:** Backend no permite el origen del frontend
- **Solución:** Verificar `CORS_ORIGINS` en `.env` del backend

### Módulo no encontrado

- **Solución Frontend:** `npm install` o borrar `node_modules` y reinstalar
- **Solución Backend:** `pip install -r requirements.txt`

### Siempre muestra datos de respaldo (fallback analysisService.js)

- **Causa:** Backend inaccesible o `VITE_API_URL` incorrecta
- **Solución:** Verificar backend en el puerto indicado (`localhost:8000`), revisar `.env` y la pestaña Network del navegador
- **Nota:** El único fallback que queda son 3 recomendaciones estáticas en `analysisService.js` (Plátano, Maíz, Cacao) más Canavalia como cultivo de cobertura si NDVI < 0.3. Cuando el backend responde, se usan las recomendaciones reales del motor de análisis.

---

## Referencias

- [[04-development/setup]] — Instalación y configuración local
- [[07-deployment/docker]] — Docker y producción
- [[03-architecture/modulo-suelo]] — Datos de suelo automáticos
- [[03-architecture/frontend]] — Frontend y página de Ajustes
- [[03-architecture/backend]] — Arquitectura del backend
