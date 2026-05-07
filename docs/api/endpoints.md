# 🔌 API Endpoints

This document describes the contract between the Frontend and the Backend.

**Base URL**: `http://localhost:8000` (Configurable via `VITE_API_URL`)

## 📍 Municipalities
### `GET /municipalities`
Returns a list of available municipalities in the Caribbean region.

**Response Example**:
```json
[
  { "id": 1, "nombre": "Barranquilla", "departamento": "Atlántico" },
  { "id": 2, "nombre": "Santa Marta", "departamento": "Magdalena" }
]
```

---

## 🧪 Simulation
### `POST /analyze-location`
The core endpoint for the simulation.

**Request Body**:
```json
{
  "municipio": "Barranquilla",
  "coordenadas": { "lat": 10.9685, "lng": -74.7813 },
  "parametros_suelo": { "ph": 6.5, "n": 40, "p": 20, "k": 30 }
}
```

**Response Example**:
```json
{
  "clima": { "temperatura": 29.1, "precipitacion": 74.5, "humedad": 77 },
  "indicadores_satelite": { "ndvi": 0.42, "ndwi": 0.18 },
  "recomendaciones": [
    {
      "cultivo": "Maíz",
      "score": 86,
      "riesgo": "bajo",
      "justificacion": "Condiciones óptimas detectadas."
    }
  ]
}
```

---

## ☁️ Climate
### `GET /climate`
Fetch historical or real-time climate data for a specific point.

**Params**: `lat`, `lng`

---

## 🛰️ Satellite Indicators
### `GET /satellite-indicators`
Fetch NDVI, NDWI, and other indices.

**Params**: `lat`, `lng`

---

## 📜 History
### `GET /history`
Returns the global history of simulations (for Investigator access).

---

## ⚠️ Error Handling
The API should return standard HTTP status codes:
*   `200`: Success.
*   `400`: Invalid parameters.
*   `404`: Location data not available.
*   `500`: Simulation engine error.

---

[🏠 Back to Home](../README.md)
