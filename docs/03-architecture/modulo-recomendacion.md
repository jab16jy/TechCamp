---
titulo: "Modulo de Recomendacion — Motor Hibrido"
proyecto: AgroCaribe IA
tags: [recomendacion, histgradientboosting, reglas-agronomicas, scoring]
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
Inference ML → HistGradientBoosting → probabilidades por cultivo
        ↓
Sort por score descendente → Top 3 cultivos
        ↓
Retorna: { cultivo, score, riesgo, justificacion, emoji, ciclo_dias, rendimiento, metodo, probabilidad }
```

## Estrategia de Inferencia (Dos Capas)

**Archivo:** `backend/app/ml/inference.py`

El sistema intenta primero el modelo ML; si falla, cae al heuristico:

1. Cargar modelo HGB (`crop_model_rf.joblib` + `crop_scaler.joblib`)
2. Si modelo existe → `HGB.predict_proba()` → score = int(prob * 100), metodo = "random_forest"
3. Si modelo falla o no existe → fallback a `CropClassifier.score()` (heuristico), metodo = "heuristico"

> El modelo se guarda como `crop_model_rf.joblib` por razones historicas, aunque el algoritmo real es HistGradientBoosting.

### Modelo HistGradientBoosting

```python
from sklearn.ensemble import HistGradientBoostingClassifier

model = HistGradientBoostingClassifier(
    max_iter=300,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
)
```

**Features (10):** temperatura, humedad, precipitacion, ph_suelo, materia_organica, ndvi, textura_encoded + 3 features ingenieriles (temp_hum_interaction, ph_mo_interaction, precip_hum_ratio)

**Metricas reales:** Accuracy: 84.6% (validacion cruzada 5-fold + CalibratedClassifierCV)

**Dataset:** Sintetico (1000 muestras por cultivo con distribucion triangular + ruido gaussiano)

> **Nota:** El pipeline se envuelve en `CalibratedClassifierCV` (Platt scaling) para calibrar las probabilidades predichas, lo que mejora la precision respecto al `HistGradientBoosting` sin calibrar (~62.5%). El modelo se entrena con datos generados a partir de `crops_requirements.csv`. Con datos reales de campo se espera mejorar aun mas.

### Modelo LSTM (Condicional)

**Archivo:** `backend/app/ml/lstm_model.py`

Modelo LSTM para prediccion de series temporales climaticas. **Activado solo cuando hay datos de anomalia climatica** — no es el metodo principal de recomendacion. Se activa unicamente si `climate_service` detecta anomalias significativas en temperatura, precipitacion o humedad. En ese caso, sus salidas influyen en el ensemble 60/40 (ML + LSTM) dentro del motor hibrido. Sin datos de anomalia, el LSTM se omite y la recomendacion opera con HistGradientBoosting + reglas agronomicas puras.

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
    → inference.predict_crop_recommendations()  (HistGradientBoosting + fallback heuristico)
    → Guardar en tabla analisis
    → Retornar AnalyzeResponse
```

---

## Referencias

- [[03-architecture/vision-sistema]] — Flujo de procesamiento general
- [[modulo-clima]] — Datos climaticos de entrada
- [[modulo-satelital]] — Datos satelitales de entrada
- [[03-architecture/flujo-datos]] — Mapeo de conexion Frontend-Backend
- [[modulo-suelo]] — Datos de suelo
