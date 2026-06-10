# Change Proposal: `real-data-retrain`

**Status:** Draft  
**Author:** SDD Proposal Sub-agent  
**Date:** 2026-06-09  
**Change ID:** `real-data-retrain`  

---

## 1. Intent

Retrain the AgroCaribe ML model with real EVA Caribe and AGROSAVIA soil/foliar data instead of purely synthetic ranges. The current model shows 87.01% accuracy but was trained on the OLD 12-feature set (pre-audit) and has never been retrained after the audit fixed the feature list to 10. A critical bug in `training.py:357` queries `indices_satelitales.precipitacion` — a column that does not exist — causing every retrain to silently fall back to synthetic NDVI instead of using empirical decile-conditional sampling. This change fixes that bug, adds NDWI as an 11th feature (column already exists in the DB but is unused), adjusts synthetic training ranges using real AGROSAVIA profile percentiles (pH p10/p50/p90, MO p10/p50/p90), ingests 26K+ real EVA records into a new `datos_campo` table with Alembic migration, appends real samples to training with `sample_weight` boost, optimizes retrain speed from ~40 min to ~6-8 min, and reconnects the AnalisisCultivo frontend to the freshly retrained model.

---

## 2. Scope

### In Scope

| # | Item | Description |
|---|------|-------------|
| 1 | **Fix `precipitacion` column bug** | `training.py:357` queries `indices_satelitales.precipitacion` — column doesn't exist. Replace with NDVI-only query or add precip from NASA POWER climatology join. |
| 2 | **Create `datos_campo` DB table** | New SQLAlchemy model + Alembic migration for real field data storage. |
| 3 | **CSV→DB ingestion** | Load `eva_caribe.csv` (26K+ records), `suelos_caribe.csv` (12K), `foliar_caribe.csv` (1.7K) into `datos_campo` via a CLI script. |
| 4 | **Adjust synthetic ranges with real profiles** | Use `perfiles_cultivo_reales.csv` pH p10/p50/p90 and MO p10/p50/p90 to narrow synthetic generation ranges in `training.py:generate_synthetic_dataset()`. |
| 5 | **Add NDWI as 11th feature** | Column `ndwi` already exists in `indices_satelitales` table. Add to `FEATURE_COLS`, `ALL_FEATURE_COLS`, and update synthetic NDWI generation using same decile-conditional approach. |
| 6 | **Fast retrain optimizations** | Remove redundant `cross_val_score` (lines 743-761), reduce `CalibratedClassifierCV cv=5→3`, reduce `permutation_importance n_repeats=10→3`, cache NASA POWER climatology to JSON, cache synthetic dataset to Parquet. |
| 7 | **Real data sample_weight training** | Append matching real EVA samples to the training set with `sample_weight` multiplier (e.g., 10x real vs synthetic) in `train_model()`. |
| 8 | **Reconnect AnalisisCultivo** | After retrain, the new `crop_model_rf.joblib` automatically serves predictions via `inference.py:predict_crop_recommendations()`. The frontend `GET /model/metrics` reads the fresh `model_metrics.json`. No frontend changes needed beyond ensuring the endpoint displays the new accuracy. |
| 9 | **Update model_metrics.json** | After retrain, metrics reflect real-data-augmented training with NDWI feature. |

### Out of Scope

- LSTM model retrain or architecture changes
- Adding new crops beyond the existing 10
- Frontend redesign or new UI components
- Adding drenaje/topografía as training features (requires more feature engineering)
- Foliar N-P-K as training features (data too sparse for most crops)
- Adding `temp_hum_interaction`, `ph_mo_interaction` (removed in audit — not re-adding)
- Containerization changes or deployment pipeline
- Unit/integration test suite (no tests exist in project)

---

## 3. Capabilities

### New Capabilities

| Capability | Description |
|------------|-------------|
| `real-data-training-pipeline` | Ingests real EVA/AGROSAVIA records from `datos_campo` DB, filters by matching crops, appends to training set with `sample_weight` boost. |
| `ndwi-feature` | Adds NDWI (Normalized Difference Water Index) as 11th feature. Includes synthetic NDWI generation with decile-conditional sampling based on precipitation ranges. |
| `fast-retrain-engine` | Optimizations reducing retrain time from ~40 min to ~6-8 min: removed redundant cross-validation, reduced CV folds, reduced permutation repeats, disk caching. |
| `datos-campo-ingestion` | CLI script to load CSVs into the new `datos_campo` PostgreSQL table. Idempotent (dedup by composite key). |

### Modified Capabilities

| Capability | Change |
|------------|--------|
| `crop-recommendation-inference` | Now uses 11 features (was 10). Inference automatically picks up the new model after retrain. No signature change — `predict_crop_recommendations()` already passes `ALL_FEATURE_COLS` dynamically. |
| `model-metrics-endpoint` | `GET /model/metrics` returns updated accuracy reflecting real-data training. No API contract change. |

---

## 4. Approach — Phased Plan

### Phase 1: Fix Bug + Database Foundation

**Objective:** Fix the silent NDVI fallback bug and create the storage for real data.

| Step | File | What |
|------|------|------|
| 1.1 | `backend/app/models/dato_campo.py` | New SQLAlchemy model: `DatoCampo` with columns for departamento, municipio, cultivo, ph, materia_organica, rendimiento, fuente (EVA/suelos/foliar), lat, lng, año, and raw JSON metadata. |
| 1.2 | `backend/app/models/__init__.py` | Add `DatoCampo` import. |
| 1.3 | `backend/data/migrations/versions/` | New Alembic migration: create `datos_campo` table. |
| 1.4 | `backend/app/ml/training.py:357` | **Bugfix:** `width_bucket(precipitacion, 0, 400, 10)` — `indices_satelitales` has no `precipitacion` column. Replace with `width_bucket(ndvi, 0, 1, 10)` to bucket by NDVI levels directly, or remove the decile-conditional query entirely and fall back to the simpler distribution fetch. **Decision:** Replace with NDVI-bucket approach: bucket NDVI values directly into deciles and return mean/std per decile. This avoids the phantom column entirely and conditions NDVI sampling on observed NDVI distributions — more correct than conditioning on a column that doesn't exist. |
| 1.5 | `backend/scripts/ingest_datos_campo.py` | CLI script: read `eva_caribe.csv`, `suelos_caribe.csv`, `foliar_caribe.csv`, transform to `DatoCampo` schema, bulk insert with dedup. Use raw asyncpg for speed. |
| 1.6 | `backend/app/ml/perfiles_reales.py` | No changes needed — this module already loads `perfiles_cultivo_reales.csv` correctly. |

### Phase 2: Real Profile Ranges + NDWI Feature

**Objective:** Make synthetic data reflect real Caribbean soil conditions. Add NDWI as 11th feature.

| Step | File | What |
|------|------|------|
| 2.1 | `backend/app/ml/training.py:FEATURE_COLS` | Add `"ndwi"` to the list. |
| 2.2 | `backend/app/ml/training.py:ALL_FEATURE_COLS` | Auto-derived from `FEATURE_COLS + ENGINEERED_COLS` — no change needed. |
| 2.3 | `backend/app/ml/training.py:_NdviSampler` | Add `_NdwiSampler` class with same decile-conditional pattern (or rename to `_IndexSampler` to handle both NDVI and NDWI). |
| 2.4 | `backend/app/ml/training.py:generate_synthetic_dataset()` | Add NDWI sampling logic after line 475 (after `ndvi = ndvi_sampler.sample(prec)`). |
| 2.5 | `backend/app/ml/training.py:generate_synthetic_dataset()` | **Real profile range adjustment:** Load `perfiles_cultivo_reales.csv` at top of function. For each crop, narrow `_expand_min_max()` ranges for pH and MO using the real p10/p90 percentiles. E.g., the existing `crop["ph_min"]` / `crop["ph_max"]` remains the outer bound, but the sampling center shifts toward the real p50. Implementation: pass `crop_target_ph_center` and `crop_target_mo_center` to adjust triangular sampling mode. |
| 2.6 | `backend/app/ml/training.py:rows.append()` | Add `"ndwi"` key to each row dict. |
| 2.7 | `backend/app/ml/inference.py` | Update `predict_crop_recommendations()` to accept and pass `ndwi` parameter. |
| 2.8 | `backend/app/ml/model.py:SCORING_FACTORS` | Add NDWI scoring factor entry. |

### Phase 3: Fast Retrain Optimizations

**Objective:** Reduce retrain time from ~40 min to ~6-8 min.

| Step | File | What |
|------|------|------|
| 3.1 | `backend/app/ml/training.py:743-761` | **Remove redundant cross_val_score.** `CalibratedClassifierCV` already does internal 5-fold CV. Remove the entire Step 6 block (lines 743-761). The calibrated model's internal CV metrics are not exposed directly, but we keep the holdout test set as the primary accuracy metric. |
| 3.2 | `backend/app/ml/training.py:684-689` | Change `CalibratedClassifierCV(cv=5)` → `CalibratedClassifierCV(cv=3)`. |
| 3.3 | `backend/app/ml/training.py:788-790` | Change `permutation_importance(n_repeats=10)` → `permutation_importance(n_repeats=3)`. |
| 3.4 | `backend/app/ml/training.py:fetch_caribbean_climatology` | Add JSON disk cache at `ARTIFACT_DIR / "nasa_climatology.json"`. On first call, fetch from NASA POWER and cache. On subsequent calls within TTL (24h), read from cache. |
| 3.5 | `backend/app/ml/training.py:generate_synthetic_dataset()` | Add Parquet cache at `ARTIFACT_DIR / "synthetic_dataset.parquet"`. Keyed by hash of `(n_samples_per_crop, climate_zones_names, random_state)`. Only regenerate if cache miss. |

### Phase 4: Real Data Sample-Weight Training

**Objective:** Append real EVA samples to the training set with boosted weight.

| Step | File | What |
|------|------|------|
| 4.1 | `backend/app/ml/training.py:train_model()` | Add new Phase 2.5: query `datos_campo` for records where `cultivo` matches one of the 10 crops with `ph` and `rendimiento` not null. Filter to Caribbean region departments. Map each record's `ph` → `ph_suelo`, `materia_organica` → `materia_organica`, estimate clima from NASA POWER monthly averages for the municipio lat/lng, compute NDVI/NDWI from `indices_satelitales` nearest-neighbor, set `textura_encoded` from `TEXTURE_MAP` (fallback to Franco median). |
| 4.2 | `backend/app/ml/training.py:train_model()` | Concatenate real samples to the synthetic `X_train`, `y_train`. Create `sample_weight` array: real samples get weight 10.0, synthetic samples get weight 1.0. Pass to `HistGradientBoostingClassifier.fit(X, y, sample_weight=sample_weights)` (only on training split, not on calibrated wrapper). |
| 4.3 | `backend/app/ml/training.py:train_model()` | Ensure `CalibratedClassifierCV` receives the base model already fitted with sample weights. `CalibratedClassifierCV` doesn't accept `sample_weight` directly — the base estimator must be pre-fit. **Design decision:** Fit the base `HistGradientBoostingClassifier` with sample weights first, then wrap with `CalibratedClassifierCV(estimator=base_model, cv=3, method='sigmoid')` and call `.fit()` on the full training set without additional sample_weight (calibration uses CV internally). |

### Phase 5: Retrain + Validate

**Objective:** Execute the retrain and verify everything works end-to-end.

| Step | Action |
|------|--------|
| 5.1 | Run Alembic migration: `alembic upgrade head` |
| 5.2 | Run ingestion script: `python scripts/ingest_datos_campo.py` |
| 5.3 | Run retrain: `python -m app.ml.training` (or POST /model/retrain) |
| 5.4 | Verify `model_metrics.json`: expected accuracy 88-92% with real data boost |
| 5.5 | Run inference test against AnalisisCultivo form inputs |
| 5.6 | Verify GET /model/metrics returns updated numbers in frontend |

---

## 5. Affected Areas

### Files

| File | Status | Change |
|------|--------|--------|
| `backend/app/models/dato_campo.py` | **New** | SQLAlchemy model for `datos_campo` table |
| `backend/app/models/__init__.py` | **Modified** | Add `DatoCampo` import |
| `backend/data/migrations/versions/XXXXXXXXXXXX_create_datos_campo.py` | **New** | Alembic migration for `datos_campo` |
| `backend/scripts/ingest_datos_campo.py` | **New** | CLI script to load CSVs into DB |
| `backend/app/ml/training.py` | **Modified** | Bugfix line 357, add NDWI, add real profiles ranges, add sample_weight training, remove redundant CV, reduce cv/repeats, add disk caching |
| `backend/app/ml/inference.py` | **Modified** | Accept `ndwi` parameter, pass through to features |
| `backend/app/ml/model.py` | **Modified** | Add NDWI to `SCORING_FACTORS` |
| `backend/app/ml/perfiles_reales.py` | **Unchanged** | Already correctly loads profiles |
| `backend/app/api/model.py` | **Unchanged** | No API contract changes needed |
| `backend/app/ml/model_metrics.json` | **Modified** (auto) | Regenerated by retrain |
| `backend/app/ml/crop_model_rf.joblib` | **Modified** (auto) | Regenerated by retrain |
| `backend/app/ml/crop_scaler.joblib` | **Modified** (auto) | Regenerated by retrain |
| `src/features/analysis/hooks/useAnalisisCultivos.js` | **Unchanged** | Already calls `getModelMetrics()` |
| `src/features/analysis/pages/AnalisisCultivos.jsx` | **Unchanged** | Already displays `modelMetrics.accuracy` |
| `backend/app/ml/crops_requirements.csv` | **Unchanged** | Outer bounds are kept; ranges are adjusted dynamically in code using real profiles |

### Database

| Object | Change |
|--------|--------|
| `datos_campo` table | New table |
| `indices_satelitales` | Unchanged (NDWI column already exists) |

---

## 6. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Real EVA records don't match crop names in `crops_requirements.csv` (e.g., "Palma" vs "Palma_Aceitera") | **High** | Medium | Add mapping dict in ingestion script. EVA has `_cultivo_norm` field. Already handled in existing analysis with crop name normalization. |
| `datos_campo` table ingest fails on encoding or null values | **Medium** | Low | Use pandas with `dtype` specs and `na_values`. Each CSV has different columns. |
| Sample-weight training doesn't improve accuracy (real data is noisy) | **Medium** | Low | The real data adjusts the decision boundaries toward observed conditions. Even if accuracy doesn't rise, the model reflects reality better. Rollback: remove sample_weight and keep synthetic-only with adjusted ranges. |
| Cache invalidation bugs (stale climatology, stale dataset) | **Low** | Medium | Cache key includes timestamp/params. Add `force_retrain` parameter to bypass cache. |
| NDWI feature reduces accuracy (noisy or uncorrelated) | **Low** | Low | Feature importance will show if NDWI contributes. Can be dropped post-hoc. |
| CalibratedClassifierCV with pre-fit + sample_weights doesn't calibrate correctly | **Medium** | Medium | Tested pattern: fit base model with class_weight and sample_weight, then wrap with CalibratedClassifierCV(cv=3). The CV inside calibration refits on subsets — this is standard sklearn practice. Alternative: use `CalibratedClassifierCV` without pre-fit and pass `sample_weight` via `fit_params` — but CCV doesn't support that. Pre-fit is the correct approach. |
| Alembic migration conflicts with existing branch DB state | **Low** | Medium | Create migration after current HEAD. Use `alembic check` before. |

---

## 7. Rollback Plan

### If retrain produces worse accuracy:

1. **Restore model artifacts:** The previous `crop_model_rf.joblib`, `crop_scaler.joblib`, and `model_metrics.json` are preserved in git. Checkout from last commit:
   ```bash
   git checkout HEAD -- backend/app/ml/crop_model_rf.joblib \
                        backend/app/ml/crop_scaler.joblib \
                        backend/app/ml/model_metrics.json
   ```

2. **Downgrade database:** If `datos_campo` table needs to be removed:
   ```bash
   alembic downgrade -1
   ```

3. **Revert code changes:**
   ```bash
   git revert <merge-commit>  # if merged, or
   git checkout -- backend/app/ml/training.py backend/app/ml/inference.py backend/app/ml/model.py
   ```

4. **Verify:** GET /model/metrics returns previous 87.01% accuracy.

### If ingestion fails mid-way:
- The ingestion script must be **idempotent**: use `INSERT ... ON CONFLICT DO NOTHING` with a unique constraint on `(cultivo, departamento, municipio, fuente, año)`.

---

## 8. Dependencies

| Dependency | Version | Used For |
|------------|---------|----------|
| PostgreSQL 16 | Current | Database for `datos_campo` table |
| Alembic | 1.14.0 | Migration management |
| SQLAlchemy | 2.0.x | Model definition |
| asyncpg | Current | Async DB access (already used in training.py) |
| scikit-learn | Current | ML pipeline (HistGradientBoosting, CalibratedClassifierCV) |
| pandas | Current | CSV ingestion, data manipulation |
| numpy | Current | Numerical operations |
| joblib | Current | Model serialization |
| httpx | Current | NASA POWER API calls |
| pyarrow (or fastparquet) | New dependency | Parquet caching of synthetic dataset |

### No new infrastructure dependencies:
- No new Docker services
- No new external APIs
- No cloud services

---

## 9. Success Criteria

### Verification Checklist

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | `datos_campo` table exists | `\dt datos_campo` in psql |
| 2 | EVA records ingested | `SELECT COUNT(*) FROM datos_campo WHERE fuente = 'EVA'` → > 26,000 |
| 3 | Suelos records ingested | `SELECT COUNT(*) FROM datos_campo WHERE fuente = 'AGROSAVIA_Suelos'` → > 12,000 |
| 4 | `precipitacion` bug fixed | `training.py:357` no longer queries `indices_satelitales.precipitacion`. `_fetch_ndvi_by_precip_decile()` renamed/rewritten to use NDVI buckets only. |
| 5 | NDWI appears in `ALL_FEATURE_COLS` | `ALL_FEATURE_COLS` has 11 features including `"ndwi"` |
| 6 | Real profile ranges applied | Training log shows: "Rangos ajustados con perfiles reales: X/Y cultivos" and the synthetic pH/MO ranges are narrower than before |
| 7 | Retrain completes in <10 min | Time from `POST /model/retrain` to response |
| 8 | Model accuracy does not regress | New `model_metrics.json` accuracy ≥ 87.01% (previous) |
| 9 | Sample_weight training executed | Training log shows "Real samples appended: X registros, weight multiplier: 10.0" |
| 10 | NDVI decile source shows "empirical" | `model_metrics.json` `ndvi_source` = `"empirical"` |
| 11 | AnalisisCultivo shows new accuracy | Frontend displays `(modelMetrics.accuracy * 100).toFixed(1)` from new metrics |
| 12 | Inference works with NDWI | `predict_crop_recommendations(ndwi=0.3)` returns valid top-3 |

---

## 10. Open Questions

1. **Name normalization mapping:** The `perfiles_cultivo_reales.csv` uses "Palma", but `crops_requirements.csv` uses "Palma_Aceitera". EVA CSV uses "Palma aceitera". We need a definitive mapping. The existing `perfiles_reales.py` already handles this — confirm the exact mapping.
2. **Precipitation data source for NDWI deciles:** Since `indices_satelitales` has no precipitation column, NDWI decile conditioning must use a different proxy or use the same NDVI-bucket approach.
3. **Sample weight value:** 10x for real samples is a starting heuristic. May need tuning based on validation accuracy.

---

*End of proposal.*
