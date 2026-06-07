---
titulo: "Modulo de Recomendacion — Motor Hibrido"
proyecto: AgroCaribe IA
tags: [recomendacion, random-forest, reglas-agronomicas, scoring]
---

# Motor de Recomendacion Hibrido

## Arquitectura del Motor

El motor usa un enfoque **hibrido** que combina reglas agronomicas con scoring ponderado:

```
Factores de entrada:
    Temperatura (25% peso)
    Precipitacion (20% peso)
    Humedad (15% peso)
    pH del suelo (15% peso)
    Materia Organica (10% peso)
    Tipo de Suelo (10% peso)
    NDVI (5% peso)
        ↓
CropClassifier.score() → puntuacion 0-98 para cada cultivo
  O
Inference ML → Random Forest → probabilidades por cultivo
        ↓
Sort por score descendente → Top 3 cultivos
        ↓
Retorna: { cultivo, score, riesgo, justificacion, emoji, ciclo_dias, rendimiento, metodo, probabilidad }
```

## Estrategia de Inferencia (Dos Capas)

**Archivo:** `backend/app/ml/inference.py`

El sistema intenta primero el modelo ML; si falla, cae al heuristico:

1. Cargar modelo RF (`crop_model_rf.joblib` + `crop_scaler.joblib`)
2. Si modelo existe → `RF.predict_proba()` → score = int(prob * 100), metodo = "random_forest"
3. Si modelo falla o no existe → fallback a `CropClassifier.score()` (heuristico), metodo = "heuristico"

### Modelo Random Forest

```python
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    random_state=42,
)
```

**Features:** temperatura, humedad, precipitacion, ph_suelo, materia_organica, ndvi
**Metricas reales:** Accuracy: 62.5%, CV: 62.35% ± 2.38%
**Dataset:** Sintetico (200 muestras por cultivo con variacion dentro de rangos optimos)

> **Nota:** El accuracy del 62.5% es bajo porque el dataset es sintetico. El modelo actual esta entrenado con datos generados a partir de `crops_requirements.csv`. Con datos reales de campo se espera mejorar significativamente.

### Modelo LSTM (Experimental)

**Archivo:** `backend/app/ml/lstm_model.py`

Modelo LSTM para prediccion de series temporales climaticas. Actualmente en fase experimental.

## CropClassifier — Reglas Agronomicas

**Archivo:** `backend/app/ml/model.py`

Cada cultivo tiene rangos optimos cargados desde `crops_requirements.csv` (10 cultivos):

```python
CROP_REQUIREMENTS = {
    "Maiz":  { "temp_min": 24, "temp_max": 30, "ph_min": 5.5, ... },
    "Yuca":  { "temp_min": 20, "temp_max": 35, "ph_min": 4.5, ... },
    "Arroz": { "temp_min": 20, "temp_max": 33, "ph_min": 5.0, ... },
    ...
}
```

Cada factor se califica con `_is_in_range()`: valor optimo en el centro del rango → score 1.0, valor en los limites → score cerca 0.5, fuera de rango → 0.0.

## crops_requirements.csv

10 cultivos del Caribe colombiano:

1. Maiz — ciclo 90d, rend. 4.2 t/ha
2. Yuca — ciclo 270d, rend. 12.5 t/ha
3. Arroz — ciclo 120d, rend. 5.8 t/ha
4. Frijol — ciclo 75d, rend. 1.8 t/ha
5. Name — ciclo 210d, rend. 12.0 t/ha
6. Platano — ciclo 365d, rend. 15.0 t/ha
7. Cacao — ciclo 180d, rend. 1.2 t/ha
8. Algodon — ciclo 150d, rend. 2.5 t/ha
9. Sorgo — ciclo 110d, rend. 3.5 t/ha
10. Palma Aceitera — ciclo 365d, rend. 20.0 t/ha

## Justificacion agronomica

Cada recomendacion incluye una justificacion generada dinamicamente:

- Si temperatura fuera de rango → "temperatura fuera del rango optimo (24-30°C)"
- Si precipitacion baja → "precipitacion insuficiente"
- Si pH fuera de rango → "pH fuera del rango optimo (5.5-7.5)"
- Si todo esta en rango → "Las condiciones son favorables para [cultivo]."

## Integracion con el analisis

```
POST /analyze-location
    → climate_service.get_climate_data()       (OpenMeteo)
    → satellite_service.get_satellite_data()    (Nearest NDVI)
    → inference.predict_crop_recommendations()  (RF + fallback heuristico)
    → Guardar en tabla analisis
    → Retornar AnalyzeResponse
```

---

## Referencias

- [[4-arquitectura/VISION_SISTEMA]] — Flujo de procesamiento general
- [[4-arquitectura/MODULO_CLIMA]] — Datos climaticos de entrada
- [[4-arquitectura/MODULO_SATELITAL]] — Datos satelitales de entrada
- [[4-arquitectura/FLUJO_DATOS]] — Mapeo de conexion Frontend-Backend
- [[4-arquitectura/MODULO_SUELO_SOILGRIDS]] — Datos de suelo
