---
titulo: "Modulo Climatico — NASA POWER + OpenMeteo"
proyecto: AgroCaribe IA
tags: [clima, nasa-power, openmeteo, api]
---

# Modulo Climatico

## Fuentes de datos

### OpenMeteo (Tiempo actual)
Usado para obtener datos climaticos en tiempo real durante un analisis de parcela.

**Endpoint:** `https://api.open-meteo.com/v1/forecast`
**Parametros:** `temperature_2m`, `relative_humidity_2m`, `precipitation`, `shortwave_radiation`

**Implementacion:** `backend/app/services/climate_service.py`

```python
async def get_climate_data(lat: float, lng: float) -> ClimateData:
    url = f"{settings.OPENMETEO_BASE_URL}/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation,shortwave_radiation",
        "timezone": "America/Bogota",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        current = response.json()["current"]
        return ClimateData(temperatura=..., precipitacion=..., humedad=..., radiacion_solar=...)
```

### NASA POWER (Climatologia historica)
Usado para obtener promedios historicos mensuales para la proyeccion a 6 meses.

**Endpoint:** `https://power.larc.nasa.gov/api/temporal/climatology/point`
**Parametros:** `T2M`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN`

**Implementacion:** `backend/app/services/prediction_service.py`

## Flujo de proyeccion a 6 meses

1. Obtener climatologia historica de NASA POWER (promedios mensuales)
2. Obtener clima actual de OpenMeteo
3. Calcular anomalia: `current - historical`
4. Proyectar 6 meses: `historical_month + anomaly * decay_factor`
5. Para cada mes: ejecutar CropClassifier
6. Identificar mejor mes y mejor cultivo

## Esquema Pydantic

```python
class ClimateData(BaseModel):
    temperatura: float
    precipitacion: float
    humedad: float
    evapotranspiracion: float | None = None
    radiacion_solar: float | None = None
```

## Variables climaticas utilizadas

| Variable | Unidad | Fuente | Uso |
|----------|--------|--------|-----|
| Temperatura | °C | OpenMeteo | Scoring (25% peso) |
| Precipitacion | mm | OpenMeteo | Scoring (20% peso) |
| Humedad | % | OpenMeteo | Scoring (15% peso) |
| pH del suelo | - | ISRIC SoilGrids | Scoring (15% peso) |
| Materia Organica | % | ISRIC SoilGrids | Scoring (10% peso) |
| Textura del suelo | USDA | ISRIC SoilGrids | Scoring (10% peso) |
| NDVI | 0-1 | Sentinel-2 / QGIS | Scoring (5% peso) |
| Radiacion solar | W/m² | OpenMeteo | Visualizacion |
| Evapotranspiracion | mm | Calculada | Reporte |

---

## Referencias

- [[03-architecture/vision-sistema]] — Vision general del sistema
- [[modulo-recomendacion]] — Motor hibrido que usa los datos climaticos
- [[03-architecture/flujo-datos]] — Flujo de datos: como se conecta el clima al frontend
- [[06-api/backend-architecture]] — Endpoints y servicios del backend
