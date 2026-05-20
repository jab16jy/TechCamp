---
titulo: "Modulo de Suelo — SoilGrids v2.0"
proyecto: AgroCaribe IA
tags: [suelo, soilgrids, isric, ph, materia-organica, textura]
---

# Modulo de Suelo — ISRIC SoilGrids v2.0

## Descripcion

Integracion con la API REST de ISRIC SoilGrids v2.0 (`rest.isric.org`) para obtener datos de suelo automaticamente a partir de coordenadas geograficas.

## Parametros obtenidos

| Parametro SoilGrids | Transformacion | Campo en formulario |
|---------------------|---------------|---------------------|
| `phh2o` (0-5cm) | Directo | `ph_suelo` |
| `soc` (carbono organico, 0-5cm) | OM = SOC * 1.724 / 10 | `materia_organica` |
| `sand`, `silt`, `clay` (0-5cm) | Triangulo USDA | `textura_suelo` |

## Endpoint

```
GET /soil/data?lat=10.33&lng=-75.41

Response 200:
{
  "ph": 6.5,
  "materia_organica": 3.2,
  "textura_suelo": "Franco",
  "fuente": "ISRIC SoilGrids v2.0"
}

Response 502 (sin datos):
{
  "detail": "No se pudieron obtener datos de suelo desde ISRIC SoilGrids."
}
```

## Arquitectura

```
Frontend: handleMapChange (useAnalisisCultivos.js)
  -> GET /soil/data?lat=X&lng=Y
  -> Backend: api/soil.py -> services/soil_service.py
    -> POST https://rest.isric.org/soilgrids/v2.0/properties/query
      Body: { lon, lat, property: [phh2o,soc,sand,silt,clay], depth: ["0-5cm"], value: "mean" }
    <- Parse JSON response
    <- _usda_texture_class(sand, silt, clay) -> 12 clases USDA
  -> Response: { ph, materia_organica, textura_suelo, fuente }
  -> Frontend: actualizarFormulario() + toast
```

## Clases texturales USDA soportadas

Arcilloso, Arcillo-Arenoso, Arcillo-Limoso, Franco-Arcilloso, Franco-Arcillo-Limoso, Franco-Arcillo-Arenoso, Franco, Franco-Limoso, Franco-Arenoso, Limoso, Areno-Francoso, Arenoso

## Manejo de errores

- Si la API de ISRIC no responde: retorna `null` (silencioso, el formulario queda vacio)
- Si faltan coordenadas: validacion en el endpoint (lat -90..90, lng -180..180)
- Timeout: 15 segundos (httpx.AsyncClient)
- Sin datos en la ubicacion: retorna 502

## Archivos

| Archivo | Rol |
|---------|-----|
| `backend/app/services/soil_service.py` | Logica de negocio + llamada HTTP a ISRIC |
| `backend/app/api/soil.py` | Endpoint FastAPI |
| `backend/app/schemas/analisis.py` | Schema `SoilGridsResponse` |
| `src/shared/services/api.js` | `getSoilData(lat, lng)` |
| `src/features/analysis/hooks/useAnalisisCultivos.js` | `handleMapChange` async con SoilGrids |

## Referencias

- [[5-implementacion/CHAT_2025-05-19]]
- [[2-backend/ARQUITECTURA_BACKEND]]
- [[4-arquitectura/FLUJO_DATOS]]
