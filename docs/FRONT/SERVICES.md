# ⚙️ Servicios y API

Capa encargada de la lógica de negocio y la comunicación con el exterior.

## 🔌 `api.js`

Este archivo configura la instancia de **Axios** para las peticiones HTTP.

- **Base URL**: Definida en `.env` como `VITE_API_URL` (default: `http://localhost:8000`).
- **Interceptores**: Monitorizan la respuesta para actualizar el estado `apiConectada` globalmente.
- **Manejo de Errores**: Si el servidor no responde, el servicio lanza un `warn` en consola y devuelve datos de respaldo (mocks).

### <a name="mocks"></a>📦 Datos Mock (Fallback)
Para permitir el desarrollo frontend sin dependencia del backend, se incluye un objeto `MOCK_DATA` con:
- Lista de municipios de la Costa Caribe.
- Datos climáticos realistas.
- Recomendaciones de cultivos (Maíz, Yuca, Frijol, Ñame) con scores y emojis.
- Historial de consultas ficticio.

## 🧠 `analysisService.js`

Actúa como un controlador de lógica de negocio para las páginas.

- **`performAnalysis(formData)`**: Limpia y valida los datos del formulario antes de enviarlos al API. Convierte tipos de datos (ej. String a Number) para asegurar compatibilidad con el backend.
- **`getNdviStatus(ndvi)`**: Traduce valores numéricos de NDVI a etiquetas legibles por humanos y colores de estado (Bajo/Medio/Alto).
- **`getAvailableLocations()`**: Obtiene la jerarquía geográfica para los selectores de la UI.

---

## 📡 Endpoints Consumidos (Principales)

| Método | Endpoint | Propósito |
| :--- | :--- | :--- |
| `GET` | `/municipalities` | Cargar regiones disponibles. |
| `POST` | `/analyze-location`| Motor de análisis principal. |
| `GET` | `/history` | Consultas previas del usuario. |
| `GET` | `/climate` | Datos climáticos en tiempo real. |

---

[[INDEX|⬅️ Volver al Índice]]
