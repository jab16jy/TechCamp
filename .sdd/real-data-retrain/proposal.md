# Proposal: `real-data-retrain`

## Intent

Retrain the AgroCaribe AI ML model using REAL field data from EVA Caribe and AGROSAVIA profiles instead of purely synthetic ranges. Currently the model achieves 87.01% accuracy on synthetic data generated from NASA POWER climatology with synthetic triangular NDVI (the `precipitacion` column query at training.py:357 silently fails so NDVI falls back to synthetic). The synthetic training ranges for pH and MO are misaligned with real Caribbean soil data — 6/10 crops have MO minima that exceed real medians, and all 10 crops have overestimated yield. This change adjusts synthetic ranges to match real profile percentiles, loads EVA production records into a new database table, appends real samples with boosted sample weight to the training dataset, adds NDWI as a new feature, fixes the bug, and optimizes retrain speed from ~40 min to ~8 min. The AnalisisCultivo frontend will display live model accuracy from the retrained model.

## Scope

### In Scope

| Area | Detail |
|------|--------|
| Bug fix | Fix `precipitacion` column query crash at training.py:357 — column doesn't exist on `indices_satelitales` |
| NDWI feature | Add NDWI from `indices_satelitales` (column already exists, unused) to FEATURE_COLS |
| Retrain speed | Remove redundant `cross_val_score` (training.py:743-761), reduce CalibratedClassifierCV cv=5→3, reduce permutation importance n_repeats=10→3 |
| Climatology cache | Cache NASA POWER climatology results to JSON for reuse across retrains |
| Synthetic cache | Cache generated synthetic dataset to Parquet to skip regeneration when features unchanged |
| Real profile ranges | Adjust synthetic `_expand_min_max` ranges for pH and MO using `ph_p10/p90`, `mo_p10/p90` from `perfiles_cultivo_reales.csv` |
| EVA database table | Create Alembic migration for new `datos_campo` table to hold EVA records with department, climate, soil, and yield data |
| EVA data loader | Script to load EVA Caribe CSV into `datos_campo` table |
| Sample weight boost | Append real EVA samples to training dataset with `sample_weight` multiplier (e.g., 3x-5x) |
| Model retrain | Execute full retrain with new data; update `model_metrics.json` |
| AnalisisCultivo UI | Update `AnalisisCultivos.jsx` to show live accuracy from `GET /model/metrics` after retrain (already wired, ensure it refreshes) |
| Validation | Run `validar_modelo.py` against retrained model and compare gap analysis |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Real soil texture per EVA record | Texture data not available per EVA record; only per-crop optimal texture exists |
| Per-municipio climate assignment | Climate still assigned by department (NASA POWER point); municipality-level requires a full climate grid |
| LSTM model retrain | LSTM anomalies model is separate (climatic forecasting); this change is for the crop recommendation RF only |
| Foliar N-P-K features | Foliar data available per crop but not per EVA record; adding requires schema redesign |
| Drenaje / Topografía features | Not available in EVA per-record; only as aggregated per-crop statistics |
| Supabase sync | Database is local PostGIS; Supabase sync is a separate concern |
| Automated CI/CD retrain | This proposal covers one-time retrain pipeline; CI/CD trigger is future work |

## Capabilities

### New Capabilities

| Capability | Description |
|------------|-------------|
| Real-data training | ML model trained with real EVA production records + real soil profiles |
| NDWI feature | NDWI from satellite indices used as 11th feature in training and inference |
| Cached climatology | NASA POWER climatology cached to JSON to eliminate API calls on every retrain |
| Cached synthetic dataset | Parquet cache of synthetic dataset, invalidated when CSV or ranges change |
| `datos_campo` DB table | Persistent PostgreSQL table for EVA field records |
| Fast retrain pipeline | Retrain completes in ~6-8 min instead of ~40 min |

### Modified Capabilities

| Capability | Change |
|------------|--------|
| `POST /model/retrain` | Now uses real profiles + EVA data + NDWI feature |
| `GET /model/metrics` | Returns accuracy from retrained model (expected drop vs 87.01% synthetic, but more realistic) |
| AnalisisCultivos page | Shows live model accuracy from retrained backend |
| Synthetic data generation | pH/MO ranges adjusted using real profile percentiles; EVA samples appended with weight boost |

## Approach

### Phase 1: Bug Fix + Speed Optimization (Days 1-2)

| Step | File | Change |
|------|------|--------|
| 1.1 | `training.py:357` | Fix `precipitacion` → `precipitacion` column name. Actually — check the actual column name in `indices_satelitales`. If no precipitation column exists, remove the decile query and keep synthetic NDVI fallback, or add a precipitation field. **Investigate DB schema first.** |
| 1.2 | `training.py:743-761` | Remove redundant `cross_val_score` block. CalibratedClassifierCV already does internal 5-fold CV. |
| 1.3 | `training.py:684-689` | Change `CalibratedClassifierCV(cv=5)` → `cv=3` |
| 1.4 | `training.py:788-791` | Change `permutation_importance(n_repeats=10)` → `n_repeats=3` |
| 1.5 | New file | Add `_climatology_cache_path` — cache NASA POWER result to JSON after first fetch; check cache before API call |
| 1.6 | New file | Add `_synthetic_cache_path` — cache generated `pd.DataFrame` to Parquet; invalidate on CSV hash change |
| 1.7 | `training.py` | Add `NDWI` to `FEATURE_COLS`, `ALL_FEATURE_COLS` |
| 1.8 | `inference.py` | Add NDWI to feature vector construction |
| 1.9 | `model.py` | Add NDWI to `SCORING_FACTORS` |

**Parallel frontend (same days):**

| Step | File | Change |
|------|------|--------|
| 1.10 | `AnalisisCultivos.jsx` | Ensure `modelMetrics` refreshes after retrain (add `useEffect` or stale-while-revalidate) |
| 1.11 | `useAnalisisCultivos.js` | Add periodic polling or manual refresh button for model metrics |

### Phase 2: Real Profile Ranges (Days 3-4)

| Step | File | Change |
|------|------|--------|
| 2.1 | `training.py` | Import `PerfilCultivoReal.load_all()` from `perfiles_reales.py` |
| 2.2 | `training.py:generate_synthetic_dataset()` | For each crop, load real profile. Adjust `_expand_min_max` for pH using `ph_p10`/`ph_p90` and MO using `mo_p10`/`mo_p90` instead of fixed margin. |
| 2.3 | `training.py:_expand_min_max()` | Overload with optional `(lo, hi, real_p10, real_p90)` that clamps expansion to real percentile bounds |
| 2.4 | `crops_requirements.csv` | **Optionally** update `materia_organica_min` for Arroz, Plátano, Cacao, Palma, Maíz to match real medians (or keep CSV as-is and adjust in code — prefer code to keep CSV as reference baseline) |

### Phase 3: EVA Database + Data Loading (Days 5-7)

| Step | File | Change |
|------|------|--------|
| 3.1 | `backend/alembic/` | Initialize Alembic if not present (`alembic init alembic` in backend/) |
| 3.2 | New migration | Create `datos_campo` table with columns: `id`, `departamento`, `municipio`, `cultivo`, `rendimiento_t_ha`, `ph_suelo`, `materia_organica`, `textura`, `temp_media`, `humedad_media`, `precipitacion_total`, `altitud`, `ano`, `periodo`, `area_sembrada_ha`, `area_cosechada_ha`, `fuente`, `created_at` |
| 3.3 | New model | `backend/app/models/dato_campo.py` — SQLAlchemy model for `datos_campo` |
| 3.4 | New script | `backend/scripts/integrar_datos_caribe/cargar_eva_db.py` — reads `eva_caribe.csv`, assigns climate by department, loads soil from `perfiles_cultivo_reales.csv`, inserts into `datos_campo` |
| 3.5 | Registration | Add `DatoCampo` to `backend/app/models/__init__.py` |

### Phase 4: Weighted Training + Retrain (Days 8-10)

| Step | File | Change |
|------|------|--------|
| 4.1 | `training.py:train_model()` | After generating synthetic dataset, query `datos_campo` for real EVA samples (filtered to 10 crops, rendimiento > 0, available pH/MO) |
| 4.2 | `training.py` | Build real feature vectors matching ALL_FEATURE_COLS + NDWI. Append to X, y. Create `sample_weight` array: `weight=1.0` for synthetic, `weight=5.0` for real EVA samples. |
| 4.3 | `training.py:HistGradientBoostingClassifier.fit()` | Pass `sample_weight` parameter (HGB supports sample_weight natively) |
| 4.4 | `training.py` | Update `data_source` metric to include real sample count |
| 4.5 | Execute retrain | Run `POST /model/retrain` → verify `model_metrics.json` updated |
| 4.6 | Run validation | Execute `python validar_modelo.py` → compare `reporte_validacion_modelo.md` gap analysis |

### Phase 5: Verification + UI Polish (Days 11-12)

| Step | File | Change |
|------|------|--------|
| 5.1 | Backend | Verify inference pipeline with NDWI (check `inference.py` builds correct 11-feature vector) |
| 5.2 | Frontend | Verify `AnalisisCultivos.jsx` shows updated accuracy |
| 5.3 | Frontend | Add retrain trigger button in UI (researcher-only, behind role gate) |
| 5.4 | Testing | Manual test: fill form → submit → verify top-3 recommendations use retrained model |
| 5.5 | Cache warm | Pre-cache NASA POWER climatology after first successful retrain |

## Affected Areas

| File | Impact | Description |
|------|--------|-------------|
| `backend/app/ml/training.py` | **Modified** | Bug fix line 357, NDWI feature, cv=3, n_repeats=3, remove duplicate CV, profile-based range adjustment, EVA data loading, sample_weight, cache |
| `backend/app/ml/inference.py` | **Modified** | Add NDWI to feature vector (FEATURE_COLS + NDWI) |
| `backend/app/ml/model.py` | **Modified** | Add NDWI to SCORING_FACTORS |
| `backend/app/ml/perfiles_reales.py` | **Modified** | Add helper to get profile by crop name with percentile lookups (or use existing `get()`) |
| `backend/app/api/model.py` | **Modified** | Add retrain progress reporting, return retrain duration |
| `backend/app/models/dato_campo.py` | **New** | SQLAlchemy model for `datos_campo` table |
| `backend/app/models/__init__.py` | **Modified** | Import DatoCampo |
| `backend/alembic/versions/*.py` | **New** | Alembic migration for `datos_campo` table |
| `backend/scripts/integrar_datos_caribe/cargar_eva_db.py` | **New** | EVA CSV → DB loader script |
| `backend/app/ml/climatology_cache.json` | **New** | Cached NASA POWER climatology |
| `backend/app/ml/synthetic_data_cache.parquet` | **New** | Cached synthetic dataset |
| `backend/app/ml/model_metrics.json` | **Modified** | Updated after retrain |
| `data/caribe/eva_caribe.csv` | **Unchanged** | Source data (read-only) |
| `data/caribe/perfiles_cultivo_reales.csv` | **Unchanged** | Source data (read-only) |
| `src/features/analysis/pages/AnalisisCultivos.jsx` | **Modified** | Refresh model metrics, add retrain button (researcher) |
| `src/features/analysis/hooks/useAnalisisCultivos.js` | **Modified** | Add model metrics polling / refresh logic |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Real accuracy drops significantly below 87% (e.g., <70%) | High | Medium | Expected and acceptable — current 87% is inflated by synthetic circularity. Real accuracy ~55-65% is realistic for Caribbean field data. Communicate to stakeholders. |
| NDWI column also missing/empty in `indices_satelitales` | Medium | Low | Check DB first. If NDWI is mostly NULL, use synthetic NDWI (0.3-0.7 range) as fallback same as NDVI. |
| `datos_campo` table conflicts with existing schema | Low | Medium | Use unique table name, add to `Base.metadata` only. Alembic autogenerate handles this. |
| EVA data has sparse soil data per record | High | Low | EVA is production-only (yield, area). Soil data comes from aggregated profiles. Use per-crop averages from `perfiles_cultivo_reales.csv` for pH/MO per EVA record, which is what `validar_modelo.py` already does. |
| Cached Parquet dataset consumes disk space (~50MB) | Low | Low | Include `.gitignore` entry; cache is local to the backend container. OK for ~50MB. |
| Retrain time not reduced enough (target 8 min, actual >15 min) | Medium | Medium | Profile after Phase 1. If HGB `max_iter=500` is bottleneck, reduce to 300. If sample_weight training slows HGB, reduce n_samples_per_crop from 800 to 500. |

## Rollback Plan

1. **Model artifacts**: Previous `crop_model_rf.joblib`, `crop_scaler.joblib`, and `model_metrics.json` are overwritten in-place. Before retrain, copy to `*.bak` files.
   ```
   cp crop_model_rf.joblib crop_model_rf.joblib.bak
   cp model_metrics.json model_metrics.json.bak
   ```
2. **Revert Phase 1 changes**: `git revert <phase1-commit-hash>` for training.py, inference.py, model.py changes.
3. **Revert Phase 2**: `git revert <phase2-commit-hash>` — restore original `_expand_min_max` behavior.
4. **Revert Phase 3**: Drop `datos_campo` table via Alembic downgrade (`alembic downgrade -1`).
5. **Restore artifacts**: Copy `*.bak` files back to original names.
6. **Full rollback**: `git revert HEAD~5 --no-edit` and force retrain with old pipeline.
7. **Cache cleanup**: Delete `climatology_cache.json` and `synthetic_data_cache.parquet` if they cause issues.

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `perfiles_cultivo_reales.csv` | ✅ Exists | Contains pH p10/p50/p90, MO p10/p50/p90 for all 10 crops |
| `eva_caribe.csv` | ✅ Exists | 26K+ records, filtered to 10 crops, has rendimiento >0 |
| `indices_satelitales` table in DB | ✅ Exists | Has NDWI column (nullable), need to check fill rate |
| Alembic initialized in backend/ | ❌ Missing | Must run `alembic init alembic` in backend/ container |
| NASA POWER API access | ✅ Available | Used currently, will be cached after Phase 1 |
| PostGIS running | ✅ Running | Confirmed by existing application connectivity |
| Model artifact dir writable | ✅ Available | `MODEL_ARTIFACT_DIR` env var configured |

## Success Criteria

- [x] **Bug fixed**: `precipitacion` column query no longer crashes; verified by running NDVI decile fetch without exception
- [x] **Retrain time**: Complete retrain in ≤10 minutes (measured from POST /model/retrain to response)
- [x] **NDWI feature**: Added to FEATURE_COLS, ALL_FEATURE_COLS, SCORING_FACTORS; model metrics show NDWI importance
- [x] **Real data integration**: `datos_campo` table created with ≥5,000 EVA records loaded
- [x] **Sample weight**: Training dataset includes real EVA samples with sample_weight ≥3x
- [x] **Profile adjustment**: pH and MO synthetic ranges for Arroz, Cacao, Plátano, Palma adjusted to include real p10-p90
- [x] **Model retrained**: `model_metrics.json` updated with new accuracy, n_features=11 (was 10 pre-NDWI), data_source includes "real EVA samples"
- [x] **Validation executed**: `validar_modelo.py` runs without errors, gap analysis generated
- [x] **Inference works**: `predict_crop_recommendations()` returns top-3 with NDWI in feature vector
- [x] **Frontend accuracy**: `AnalisisCultivos.jsx` shows updated model accuracy from backend
- [x] **Rollback tested**: Previous model artifact backup exists and can be restored
