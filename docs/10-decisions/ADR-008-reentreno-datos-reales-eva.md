# ADR-008: Reentreno con datos reales EVA Caribe

## Contexto

La validación del modelo contra datos reales del **EVA Caribe** (Evaluación de Vocación de Uso del Suelo — AGROSAVIA) reveló una discrepancia crítica: el modelo entrenado con datos sintéticos mostraba **84.6% accuracy en validación cruzada**, pero solo **7.08% de accuracy** al predecir cultivos reales en el dataset EVA.

El gap sintético-real de ~77 puntos porcentuales indicaba que el modelo aprendió distribuciones ideales que no reflejan las condiciones reales del Caribe colombiano. Los datos reales mostraban:

- pH del suelo más ácido (p50=5.3) de lo que los rangos sintéticos asumían (5.5-7.5 para maíz)
- Materia orgánica mucho más baja (p50=1.2% vs rangos sintéticos 2-5%)
- Correlaciones no capturadas: suelos ácidos y baja MO tienden a co-ocurrir

Además, se descubrió un bug en `training.py:357` que consultaba `indices_satelitales.precipitacion` — una columna inexistente — causando que el muestreo de NDVI cayera silenciosamente a un fallback en lugar de usar datos empíricos.

## Decisión

**Reentrenar el modelo usando 26,000+ registros reales EVA Caribe** con las siguientes modificaciones:

1. **Nueva tabla `datos_campo`** — Modelo SQLAlchemy + migración Alembic para almacenar registros EVA, AGROSAVIA suelos y foliares.
2. **Ingestión CSV→DB** — Script CLI que carga los CSVs con dedup (`ON CONFLICT DO NOTHING`).
3. **Ajuste de rangos sintéticos con percentiles reales** — Usar `perfiles_cultivo_reales.csv` (pH p10/p50/p90, MO p10/p50/p90) para centrar la distribución triangular de muestreo en valores reales observados. Los rangos externos (`crops_requirements.csv`) se mantienen como límites absolutos.
4. **NDWI como 11° feature** — La columna `ndwi` ya existe en `indices_satelitales` pero no se usaba. Se agrega al pipeline completo (FEATURE_COLS, synthetic NDWI generation con decile-conditional sampling, inference).
5. **Sample_weight 10× para datos reales** — Los registros EVA reales se concatenan al set sintético con peso 10.0 vs 1.0 para sintéticos. Forza al modelo a priorizar patrones reales sobre ideales.
6. **Optimización de velocidad** — Reducir `CalibratedClassifierCV cv=5→3`, eliminar `cross_val_score` redundante (la calibración ya hace CV), reducir `permutation_importance n_repeats=10→3`, cachear climatología NASA POWER a JSON y dataset sintético a Parquet. Tiempo estimado: ~6-8 min (vs ~40 min original).
7. **Bugfix línea 357** — Reemplazar `width_bucket(precipitacion, ...)` con `width_bucket(ndvi, 0, 1, 10)` para obtener deciles de NDVI directamente desde la columna existente.

## Consecuencias

**Positivas:**
- + Modelo entrenado con datos reales de campo (26K+ registros EVA) — decisiones basadas en patrones observados, no ideales
- + Reducción del gap sintético-real: accuracy real proyectada a 88-92% con la mezcla sintético+real
- + Rangos sintéticos ahora reflejan la realidad del Caribe (pH más ácido, MO más baja)
- + NDWI como feature aprovecha datos satelitales existentes sin nuevo almacenamiento
- + Bug de columna `precipitacion` corregido — el muestreo de NDVI ahora usa datos reales
- + Retrain optimizado de ~40 min a ~6-8 min permite reentrenamiento frecuente
- + Ingestión idempotente: se puede re-ejecutar sin duplicar datos

**Negativas:**
- - Requiere mantenimiento de tabla `datos_campo` — nuevas campañas EVA deben ser ingestadas periódicamente
- - Los datos EVA tienen cobertura geográfica limitada (costa Caribe colombiana) — el modelo no generaliza bien a otras regiones (Orinoquía, Amazonía)
- - El mapeo de nombres de cultivos EVA a los 10 cultivos del modelo requiere normalización manual (ej. "Palma aceitera" → "Palma_Aceitera")
- - `CalibratedClassifierCV` con pre-fit + sample_weight es un patrón no estándar en sklearn — puede fallar en versiones futuras
- - Sin rollback automático: si el retrain empeora el accuracy, hay que restaurar manualmente los artifacts `.joblib` desde git
- - La ingestión de datos requiere acceso a los CSVs EVA que no están en el repositorio (archivos grandes, no versionados)

## Referencias

- [[backend]] (sección 9 — pipeline ML)
- [[modulo-recomendacion]]
- [[plan-retrain]]
- [[resultados-validacion]]
