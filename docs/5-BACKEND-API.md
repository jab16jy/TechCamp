# API Backend

## Endpoints

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/analyze-location` | Envía coordenadas y datos de suelo; devuelve análisis completo |
| GET | `/climate` | Datos climáticos históricos (NASA POWER / Open-Meteo) |
| GET | `/satellite-indicators` | Índices NDVI, NDWI y nubosidad (Sentinel-2) |
| GET | `/municipalities` | Lista de municipios del Caribe colombiano |
| GET | `/history` | Historial de análisis previos del usuario |

## Cliente API

Configuración desde `src/services/api.js`:

- **Base URL:** Configurable via `VITE_API_URL`
- **Timeout:** 15s
- **Interceptores:** Monitoreo de estado de conexión (`apiDisponible`)

## Estrategia Mock Fallback

Cada función de servicio está envuelta en `try/catch`. Si la petición falla (backend no disponible), retorna datos simulados de `MOCK_DATA` con estructura idéntica a la respuesta real del backend.

## Estructura de Mock Data

```javascript
// Clima
{
  temperatura: { actual: 28.5, min: 22, max: 34 },
  precipitacion: 45, // mm
  humedad: 72, // %
  radiacion_solar: 520 // W/m²
}

// Recomendación de cultivo
{
  cultivo: "Maíz",
  score_afinidad: 87, // %
  nivel_riesgo: "Bajo",
  justificacion: "string"
}

// Indicadores satelitales
{
  ndvi: 0.72,
  ndwi: 0.15,
  calidad_suelo: "Buena",
  nubosidad: 12 // %
}
```

## AnalysisService

Capa superior en `src/services/analysisService.js` que:

1. Inicia estado de carga en el store
2. Llama a función de `api.js`
3. Procesa y formatea la respuesta
4. Actualiza el store (`setResultado`)
5. Maneja errores con notificaciones Toast
