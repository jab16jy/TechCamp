---
titulo: "Troubleshooting y Notas"
proyecto: AgroCaribe IA
tags: [troubleshooting, errores, soluciones, notas]
---

> **📌 NOTA HISTORICA:** Este documento original cubria problemas del prototipo con MOCK_DATA.
> Se ha actualizado para reflejar problemas actuales del sistema con APIs reales.

# Troubleshooting y Notas

## Problemas Comunes

### MapSelector: No carga el mapa o las herramientas de dibujo
- **Causa:** Leaflet CSS no importado o conflictos con versiones
- **Solucion:** Verificar que `leaflet/dist/leaflet.css` y `leaflet-draw/dist/leaflet.draw.css` esten en el HTML
- **Alternativa:** `npm install leaflet@1.9.4 leaflet-draw@1.0.4`

### AnalisisCultivos: No aparecen los nombres de ciudades en el mapa
- **Causa:** Los municipios ahora se cargan desde el backend via `GET /municipalities`
- **Solucion:** Verificar que el backend este corriendo en `localhost:8000`
- **Nota:** Los marcadores de ciudades se agregaron esta vez en el mapa para orientacion

### AnalisisCultivos: Datos de suelo (SoilGrids) no se autorellenan
- **Causa 1:** `GET /soil/data` falla porque ISRIC SoilGrids no tiene datos para la region Caribe
- **Causa 2:** Timeout de 15s en la llamada HTTP
- **Solucion:** Si SoilGrids devuelve 502, los campos quedan editables manualmente
- **Nota:** SoilGrids tiene cobertura limitada para la region. Los datos se pueden ingresar manualmente

### AnalisisCultivos: Error al delimitar zonas automaticamente
- **Causa:** `POST /geo/decode` usa PostGIS `ST_Contains` y puede fallar si el poligono esta fuera del area de municipios cargados
- **Solucion:** Asegurarse de dibujar dentro del area del Caribe colombiano
- **Nota:** La geo-deteccion funciona mejor con clic directo en el mapa (click-to-select) que con dibujo

### IA Predictiva: "Generar Proyeccion" deshabilitado
- **Causa:** No se han ingresado coordenadas o no se ha seleccionado un analisis del historial
- **Solucion:** Seleccionar un item del dropdown historial o ingresar coordenadas manualmente
- **Nota:** El boton requiere coordenadas validas + al menos un slider ajustado

### IA Predictiva: Proyeccion no muestra datos climaticos
- **Causa:** `POST /predict` falla o el backend no tiene conexion a NASA POWER/OpenMeteo
- **Solucion:** Verificar que el backend tenga acceso a internet y que las APIs externas respondan
- **Nota:** La proyeccion de 6 meses requiere NASA POWER (climatologia historica) + OpenMeteo (datos actuales)

### AgroAsesor (Chat): No responde o respuestas genericas
- **Causa:** El backend RAG no encuentra documentos relevantes o el LLM no esta configurado
- **Solucion:** Revisar `backend/app/data/rag/` para confirmar que haya documentos .md
- **Nota:** El RAG funciona con keyword-matching + TF-IDF sobre ~20 documentos. Para LLM real se necesita `OPENAI_API_KEY`

### Docker: BD no tiene tablas o columnas faltantes
- **Causa:** Migraciones de Alembic no ejecutadas o volumen corrupto
- **Solucion:** `docker compose exec backend alembic upgrade head`
- Si persiste: `docker compose down -v && docker compose up -d && docker compose exec backend alembic upgrade head`

### Docker: "Cannot drop spatial_ref_sys" en migracion
- **Causa:** Alembic genero `op.drop_table('spatial_ref_sys')` que es parte de PostGIS
- **Solucion:** Eliminar esa linea de la migracion generada, es parte de la extension

### Docker: backend no arranca por modulo faltante
- **Causa:** `requirements.txt` no tiene todas las dependencias
- **Solucion:** Agregar modulo faltante a `requirements.txt` y reconstruir

### Backend: columna no existe
- **Causa:** Seed SQL creo la tabla sin todas las columnas
- **Solucion:** Ejecutar migraciones de Alembic o agregar columna manualmente

### Pagina en blanco al navegar
- **Causa:** Error en definicion de ruta en `App.jsx` o componente sin `export default`
- **Solucion:** Revisar consola del navegador y verificar paths en `<Routes>`

### Error CORS
- **Causa:** Backend no permite el origen del frontend
- **Solucion:** Verificar `CORS_ORIGINS` en `.env` del backend

### Modulo no encontrado
- **Solucion:** `npm install` o borrar `node_modules` y reinstalar. Para backend: `pip install -r requirements.txt`

### Siempre muestra datos de respaldo (analysisService)
- **Causa:** Backend inaccesible o `VITE_API_URL` incorrecta
- **Solucion:** Verificar backend en el puerto indicado (`localhost:8000`), revisar `.env` y pestana Network del navegador
- **Nota:** El unico fallback que queda son 3 recomendaciones estaticas en `analysisService.js`

---

## Referencias

- [[Proyectos/docs techcamp/_archive/1-inicial/SETUP]] — Instalacion y configuracion
- [[4-arquitectura/DESPLIEGUE]] — Docker y produccion
- [[4-arquitectura/MODULO_SUELO_SOILGRIDS]] — Datos de suelo automaticos
- [[3-frontend/ARQUITECTURA_FRONTEND]] — Pagina de Ajustes
