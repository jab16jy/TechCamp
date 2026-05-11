# Servicios e Integración de Datos

La capa de servicios abstrae la complejidad de las comunicaciones externas y asegura que la aplicación siga siendo funcional incluso sin conexión al backend.

## 📡 Cliente API: `api.js`

Utiliza **Axios** para configurar una instancia base (`apiClient`) con:
- **Base URL:** configurable via `.env`.
- **Timeout:** 15 segundos para procesos pesados de IA.
- **Interceptores:** Monitoreo del estado de conexión global (`apiDisponible`).

### 🛠️ Estrategia de "Mock Fallback"
Cada función de servicio está envuelta en un bloque `try/catch`. Si la petición falla (debido a que el servidor FastAPI está apagado), el servicio retorna datos simulados de `MOCK_DATA`.

## 📂 Funciones Disponibles

| Función | Endpoint | Propósito |
| :--- | :--- | :--- |
| `getMunicipios` | `/municipalities` | Lista de municipios del Caribe colombiano. |
| `analizarUbicacion` | `/analyze-location` | Envía coordenadas y datos para obtener recomendaciones de IA. |
| `getClima` | `/climate` | Datos meteorológicos actuales (NASA POWER / Open-Meteo). |
| `getIndicadoresSatelite` | `/satellite-indicators`| Índices NDVI, NDWI y nubosidad de Sentinel-2. |
| `getHistorial` | `/history` | Lista de análisis previos del usuario. |

## 🧪 Datos Simulados (`MOCK_DATA`)
El objeto `MOCK_DATA` en `api.js` contiene estructuras de datos idénticas a las esperadas del backend para:
- Clima (Temperatura, Precipitación, etc.).
- Recomendaciones (Maíz, Yuca, Frijol, Ñame).
- Indicadores satelitales detallados.
- Historial de consultas.

## 🏗️ Lógica de Negocio: `analysisService.js`
Este servicio actúa como una capa superior que:
1.  Inicia el estado de carga en el store.
2.  Llama a la función de `api.js`.
3.  Procesa la respuesta (formateo, validación).
4.  Actualiza el estado global del store (`setResultado`).
5.  Maneja errores con notificaciones `Toast`.
