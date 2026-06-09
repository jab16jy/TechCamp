# ML Model: Real-World Validation Plan

## Current Status
- Model: HistGradientBoosting + CalibratedClassifierCV
- Training data: 100% synthetic (NASA POWER climatology + crops_requirements.csv)
- Current accuracy: ~87% (ON SYNTHETIC DATA — not representative of field performance)
- Top-3 accuracy: ~99.4%
- Per-class F1 range: 0.74-0.99 (corrected from previous buggy calculation)

## The Synthetic-to-Real Gap

All current metrics are measured on a held-out synthetic test set from the same distribution as the training data. Real-world accuracy is expected to be significantly lower (estimated 55-65%) due to:

1. **Measurement noise in field data** — satellite NDVI, lab soil tests, and weather station data all carry measurement error that the synthetic data does not model.
2. **Spatial variability within a single climate zone** — a single NASA POWER grid cell (0.5° × 0.5°) covers ~2,500 km², hiding local soil and microclimate variation.
3. **Management practices not captured** — irrigation, fertilization, pest control, and planting density are major yield determinants that the model does not see.
4. **Microclimate effects** — local topography, wind patterns, and water bodies create conditions that differ from the grid-cell average.
5. **Temporal variability** — the model uses climatological averages, but real planting decisions respond to year-to-year weather variation.

## Recommended Validation Steps

### Step 1: Collect Field Data

- **Minimum**: 200-500 labeled samples
- **Requirements per sample**:
  - Latitude/Longitude (GPS accuracy ±5m)
  - Actual crop grown (ground-truth)
  - Planting date
  - Soil pH, organic matter, texture (lab or field test)
  - Growing season precipitation (approximate)
- **Priority regions**: Córdoba (Maíz), Sucre (Yuca), Bolívar (Sorgo), Cesar (Algodón)

### Step 2: Run Inference

- For each field sample, collect satellite data (NDVI) for the location
- Run the model's `predict_crop_recommendations()` pipeline
- Compare predicted crop vs actual crop

### Step 3: Measure Real-World Metrics

- Overall accuracy
- Per-crop precision, recall, F1
- Confusion matrix
- Compare vs synthetic metrics — document the gap

### Step 4: Iterative Improvement

- **If gap > 30pp**: consider model retraining with real data augmentation
- **If gap 15-30pp**: add more agronomic features, adjust scoring factors
- **If gap < 15pp**: model is production-ready with acceptable synthetic-to-real transfer

## Expected Timeline

- Data collection: 2-4 weeks (agronomist + field technicians)
- Validation run: 1 day
- Analysis and reporting: 2-3 days
