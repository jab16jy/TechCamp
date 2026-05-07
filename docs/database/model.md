# 💾 Database & Data Models

AgroCaribe AI uses a mix of static data (JSON), transient state (Zustand), and persistent data (expected in Backend DB).

## 📊 Data Entities

### 🏛️ Municipality (Static/Read-only)
Defines the administrative boundaries of the analysis area.
*   `id`: Primary Key
*   `nombre`: Name of the town.
*   `departamento`: State/Department.

### 📍 Query/Simulation (Persistent)
Represents a user-initiated analysis.
*   `id`: Primary Key.
*   `fecha`: ISO Timestamp.
*   `municipio`: Foreign Key.
*   `lat`, `lng`: Exact location selected.
*   `cultivo_top`: The highest scoring crop.
*   `score_top`: The score of that crop.

### 🛰️ Environment Snapshot
Linked to a Query, stores the environmental variables at that moment.
*   `temperatura`: Celsius.
*   `precipitacion`: mm.
*   `ndvi`: Normalized Difference Vegetation Index.
*   `ndwi`: Normalized Difference Water Index.

## 🧠 Application State (Zustand)
The `src/context/useAppStore.js` manages the "Live" state:

```javascript
{
  municipioSeleccionado: null,
  coordenadas: { lat: 10.9, lng: -74.7 },
  resultadoConsulta: null,
  isCargando: false,
  error: null,
  toasts: []
}
```

## 📂 Mock Data Source
Located in `src/services/api.js` under the `MOCK_DATA` constant. This is used for all fallback scenarios and defines the standard JSON schema for recommendations and history.

---

[🏠 Back to Home](../README.md)
