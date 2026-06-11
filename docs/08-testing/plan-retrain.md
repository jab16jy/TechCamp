# Plan de Reentreno del Modelo ML

**Estado:** Aprobado (derivado del SDD Change Proposal `real-data-retrain`)  
**Fecha:** 2026-06-11  
**Documentos relacionados:** [[08-testing/resultados-validacion]] · [[08-testing/estrategia]] · [[03-architecture/modulo-recomendacion]]  
**Decisión arquitectónica:** [[10-decisions/ADR-008]] (Reentreno con datos reales EVA Caribe)  
**Change ID:** `real-data-retrain`

---

## 1. Problema

### Bug Crítico en `training.py:357`

```python
# Línea 357 actual — COLUMNA NO EXISTE
width_bucket(precipitacion, 0, 400, 10)
```

La tabla `indices_satelitales` **no tiene una columna `precipitacion`**. Esto causa que cada vez que se ejecuta el retrain:

1. La consulta SQL falla silenciosamente.
2. El `_fetch_ndvi_by_precip_decile()` cae en el bloque `except` y retorna estadísticas sintéticas.
3. El NDVI nunca se muestrea desde distribuciones empíricas — **siempre se genera sintéticamente**.

**Solución:** Reemplazar la consulta con un bucketing directo por niveles de NDVI:

```python
width_bucket(ndvi, 0, 1, 10)
```

Esto condiciona el muestreo de NDVI en sus propios deciles observados, eliminando la dependencia de una columna que no existe.

### Sobreestimación Sintética

Como se documenta en [[08-testing/resultados-validacion]], los perfiles sintéticos sobreestiman sistemáticamente:

| Variable | Diagnóstico |
|----------|-------------|
| pH | ✅ 10/10 compatibles — sin cambios necesarios |
| Materia Orgánica | ❌ 6/10 sobreestimados — ajustar con percentiles reales |
| Rendimiento | ❌ 10/10 sobreestimados — ajustar con percentiles reales |
| Palma Aceitera | ❌ +529 % de sobreestimación — el peor caso |

### Oportunidad: NDWI como 11.ª Feature

La columna `ndwi` ya existe en `indices_satelitales` pero nunca se usa. NDWI (Normalized Difference Water Index) mide contenido de agua en la vegetación y puede mejorar la discriminación entre cultivos con requerimientos hídricos diferentes (ej. Arroz vs. Yuca).

---

## 2. Datos Disponibles para Reentreno

| Fuente | Registros | Procedencia |
|--------|-----------|-------------|
| **EVA Caribe** (producción) | 26 000+ | Evaluaciones Agropecuarias — cultivo real por parcela |
| **Suelos AGROSAVIA** (fisicoquímicos) | 12 000+ | Análisis de pH, MO, textura por ubicación |
| **Foliar AGROSAVIA** (tejido vegetal) | 1 700+ | Perfil N-P-K foliar por cultivo |
| **Sintético actual** (con rangos ajustados) | ~64 000 | Generado con percentiles reales pH/MO |

### Estrategia de Fusión

1. Los **perfiles sintéticos** se regeneran usando percentiles reales p10/p50/p90 de pH y MO para cada cultivo, en vez de rangos genéricos de literatura global.
2. Los **registros reales de EVA** se filtran por cultivo en el mapa de 10 clases, se enriquecen con clima NASA POWER y NDVI/NDWI satelital, y se **añaden al set de entrenamiento**.
3. Los registros reales reciben un **`sample_weight` de 10.0** frente a 1.0 para los sintéticos, forzando al modelo a prestar más atención a las observaciones reales.

---

## 3. Solución Técnica

### 3.1 Corrección del Bug

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `backend/app/ml/training.py` | 357 | `width_bucket(precipitacion, ...)` → `width_bucket(ndvi, 0, 1, 10)` |
| `backend/app/ml/training.py` | función `_fetch_ndvi_by_precip_decile` | Renombrar a `_fetch_ndvi_deciles` y simplificar |

### 3.2 Nueva Feature: NDWI

| Archivo | Cambio |
|---------|--------|
| `backend/app/ml/training.py` — `FEATURE_COLS` | Añadir `"ndwi"` |
| `backend/app/ml/training.py` — `generate_synthetic_dataset()` | Añadir lógica de muestreo de NDWI con deciles condicionales |
| `backend/app/ml/inference.py` — `predict_crop_recommendations()` | Aceptar y pasar `ndwi` |
| `backend/app/ml/model.py` — `SCORING_FACTORS` | Añadir entrada para NDWI |

### 3.3 Ajuste de Rangos Sintéticos

| Archivo | Cambio |
|---------|--------|
| `backend/app/ml/training.py` — `generate_synthetic_dataset()` | Cargar `perfiles_cultivo_reales.csv`, centrar muestreo triangular en p50 real, limitar extensión a p10–p90 |

En vez de muestra uniforme entre `ph_min` y `ph_max` de la literatura:
- `ph_center` = mediana real del cultivo
- `ph_low` = p10 real
- `ph_high` = p90 real
- Misma lógica para materia orgánica

### 3.4 Sample Weight para Datos Reales

| Componente | Peso |
|------------|------|
| Sample sintético | 1.0 |
| Sample real (EVA Caribe) | 10.0 |

Flujo:
1. Fit `HistGradientBoostingClassifier` con `sample_weight` sobre train + real.
2. Envolver con `CalibratedClassifierCV(estimator=base_model, cv=3, method='sigmoid')`.
3. `CalibratedClassifierCV` no acepta `sample_weight` directamente — el base estimator se pre-fita con pesos, luego el calibrator refite con CV interno.

### 3.5 Optimización de Velocidad

| Optimización | Antes | Después | Ahorro |
|-------------|-------|---------|--------|
| Eliminar `cross_val_score` redundante (líneas 743–761) | ~12 min | 0 | −12 min |
| `CalibratedClassifierCV` cv=5 → cv=3 | ~15 min | ~5 min | −10 min |
| `permutation_importance` n_repeats=10 → 3 | ~10 min | ~1.5 min | −8.5 min |
| Cache de climatología NASA POWER (JSON, TTL 24h) | ~2 min | ~0.1 min | −1.9 min |
| Cache de dataset sintético (Parquet) | ~8 min | ~0.2 min | −7.8 min |
| **Total estimado** | **~40 min** | **~6–8 min** | **−32 min** |

---

## 4. Base de Datos: Nueva Tabla `datos_campo`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `departamento` | VARCHAR | Departamento del Caribe |
| `municipio` | VARCHAR | Municipio |
| `cultivo` | VARCHAR | Cultivo real (normalizado) |
| `ph` | FLOAT | pH del suelo |
| `materia_organica` | FLOAT | % de materia orgánica |
| `rendimiento` | FLOAT | Rendimiento en t/ha |
| `fuente` | VARCHAR | Origen: EVA, AGROSAVIA_Suelos, AGROSAVIA_Foliar |
| `lat` | FLOAT | Latitud |
| `lng` | FLOAT | Longitud |
| `anio` | INTEGER | Año del registro |
| `metadata_raw` | JSONB | Datos originales completos |

**Unique constraint:** `(cultivo, departamento, municipio, fuente, anio)` para ingestión idempotente.

**Migración:** Nueva migración Alembic + script CLI `ingest_datos_campo.py` para carga desde CSV.

---

## 5. Alcance

### In Scope

| # | Ítem |
|---|------|
| 1 | Corregir bug de columna `precipitacion` en `training.py:357` |
| 2 | Crear tabla `datos_campo` con modelo SQLAlchemy + migración Alembic |
| 3 | Ingestar CSVs reales (EVA, Suelos, Foliar) en BD |
| 4 | Ajustar rangos sintéticos con percentiles reales (pH, MO) |
| 5 | Agregar NDWI como 11.ª feature |
| 6 | Reducir tiempo de retrain de ~40 min a ~6–8 min |
| 7 | Entrenar con `sample_weight` (10× para datos reales) |
| 8 | Reconectar AnalisisCultivo al modelo retrained |

### Out of Scope

- ❌ Cambios de arquitectura (LSTM, otros modelos)
- ❌ Nuevos cultivos fuera de los 10 existentes
- ❌ Rediseño del frontend
- ❌ Features de drenaje/topografía (requieren más ingeniería)
- ❌ Features foliares N-P-K (datos demasiado dispersos)
- ❌ Features de interacción (`temp_hum_interaction`, etc.)
- ❌ Pipeline de CI/CD o tests unitarios

---

## 6. Criterios de Éxito

| # | Criterio | Verificación |
|---|----------|-------------|
| 1 | Tabla `datos_campo` existe | `\dt datos_campo` en psql |
| 2 | >26 000 registros EVA ingestados | `SELECT COUNT(*) FROM datos_campo WHERE fuente = 'EVA'` |
| 3 | >12 000 registros Suelos ingestados | `SELECT COUNT(*) FROM datos_campo WHERE fuente = 'AGROSAVIA_Suelos'` |
| 4 | Bug `precipitacion` eliminado | `grep precipitacion training.py` → sin resultados |
| 5 | NDWI en `ALL_FEATURE_COLS` | 11 features listadas |
| 6 | Rangos ajustados en log de entrenamiento | Mensaje: "Rangos ajustados con perfiles reales: X/Y cultivos" |
| 7 | Retrain completo en <10 min | Timestamp de inicio a fin |
| 8 | Accuracy no regresa vs. 84.6 % anterior | `model_metrics.json` accuracy ≥ 84.6 % |
| 9 | Sample weight aplicado | Log: "Real samples appended: X registros, weight multiplier: 10.0" |
| 10 | NDVI fuente = "empirical" | `model_metrics.json` → `ndvi_source = "empirical"` |
| 11 | Frontend muestra nueva accuracy | AnalisisCultivo → `modelMetrics.accuracy` |
| 12 | Inferencia con NDWI funciona | `predict_crop_recommendations(ndwi=0.3)` → top-3 válido |

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Nombres de cultivo no coinciden entre fuentes (Palma vs. Palma_Aceitera) | Alta | Medio | Map de normalización en script de ingesta |
| Error de codificación en CSVs | Media | Bajo | Pandas con `dtype` y `na_values` |
| Sample-weight no mejora accuracy (datos ruidosos) | Media | Bajo | Incluso sin mejora, el modelo refleja mejor la realidad. Rollback simple. |
| Cache desactualizado | Baja | Medio | Cache key con timestamp. Parámetro `force_retrain` para bypass. |
| NDWI empeora la accuracy | Baja | Bajo | Feature importance mostrará contribución. Se puede descartar. |
| `CalibratedClassifierCV` + pre-fit no calibra correctamente | Media | Medio | Patrón probado: fit base con `sample_weight`, luego CCV sin pesos extras. Alternativa documentada. |

---

## 8. Plan de Rollback

```bash
# Restaurar artefactos del modelo (preservados en git)
git checkout HEAD -- backend/app/ml/crop_model_rf.joblib \
                     backend/app/ml/crop_scaler.joblib \
                     backend/app/ml/model_metrics.json

# Revertir migración de BD (si es necesario)
alembic downgrade -1

# Revertir cambios de código
git checkout -- backend/app/ml/training.py \
                 backend/app/ml/inference.py \
                 backend/app/ml/model.py
```

El script de ingesta es **idempotente** (`INSERT ... ON CONFLICT DO NOTHING`), por lo que re-ejecutarlo no duplica datos.

---

## 9. Dependencias

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| PostgreSQL 16 | Actual | BD para `datos_campo` |
| Alembic | 1.14.0 | Gestión de migraciones |
| SQLAlchemy | 2.0.x | Modelo `DatoCampo` |
| asyncpg | Actual | Conexión asíncrona a BD |
| scikit-learn | 1.6+ | Pipeline ML |
| pandas | Actual | Ingesta de CSVs |
| joblib | Actual | Serialización del modelo |
| httpx | Actual | API NASA POWER |
| pyarrow / fastparquet | **Nueva** | Caching Parquet |

**Sin nuevas dependencias de infraestructura:** No se requieren servicios Docker, APIs externas ni cloud services adicionales.

---

## 10. Fases de Implementación

| Fase | Duración estimada | Descripción |
|------|-------------------|-------------|
| **Fase 1:** Bugfix + BD | 1 día | Corregir `training.py:357`, crear modelo `DatoCampo`, migración Alembic, script de ingesta |
| **Fase 2:** Rangos reales + NDWI | 1 día | Ajustar generación sintética con percentiles reales, añadir NDWI como feature |
| **Fase 3:** Optimización de velocidad | 0.5 día | Cache de climatología y dataset, reducir CV/repeats |
| **Fase 4:** Sample-weight training | 0.5 día | Conectar datos reales con peso 10× |
| **Fase 5:** Retrain + validación | 0.5 día | Ejecutar retrain, verificar métricas, probar inferencia |
| **Total** | **~3.5 días** | |

---

*Para resultados detallados de validación, ver [[08-testing/resultados-validacion]]. Para la estrategia general de testing, ver [[08-testing/estrategia]]. La decisión arquitectónica completa está en [[10-decisions/ADR-008]].*
