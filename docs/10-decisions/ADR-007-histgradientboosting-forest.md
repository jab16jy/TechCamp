# ADR-007: HistGradientBoosting sobre Random Forest

## Contexto

El modelo de recomendación necesitaba clasificación multiclase (10 cultivos) sobre datos tabulares con 7-10 features numéricas y 1 categórica (textura). Evaluamos dos algoritmos de scikit-learn:

1. **RandomForestClassifier** — Implementado inicialmente (n_estimators=200, max_depth=12). Accuracy: ~62.5%, CV: 62.35% ± 2.38%.
2. **HistGradientBoostingClassifier** — Basado en LightGBM. Ofrece entrenamiento por histogramas (binned features), soporte nativo de valores nulos, y mejor rendimiento en datos tabulares con features numéricas continuas.

Ambos son ensemble methods basados en árboles, pero HGB usa boosting secuencial (cada árbol corrige errores del anterior) vs RF que usa bagging paralelo (promedio de árboles independientes).

El accuracy de 62.5% de RF era bajo para un sistema de recomendación donde el score de probabilidad se muestra directamente al usuario. Necesitábamos mejor calibración y discriminación entre clases.

## Decisión

**HistGradientBoostingClassifier** (max_iter=300, max_depth=6, learning_rate=0.1) envuelto en **CalibratedClassifierCV(method='sigmoid')** para Platt scaling.

El pipeline completo:

```python
base_model = HistGradientBoostingClassifier(
    max_iter=300, max_depth=6, learning_rate=0.1,
    random_state=42, categorical_features=[6]
)
model = CalibratedClassifierCV(estimator=base_model, cv=5, method='sigmoid')
```

Razones:

1. **Mejor rendimiento en datos tabulares** — HGB está específicamente diseñado para dataframes con features numéricas y categóricas. En benchmarks internos con datos sintéticos, HGB superó a RF en ~22 puntos porcentuales.
2. **Entrenamiento más rápido** — HGB usa histogramas (binned features en 256 bins por feature), reduciendo el costo computacional de `O(n_features * n_samples * n_trees)` a `O(n_bins * n_features * n_trees)`. Entrenamiento completo ~8 min (vs ~40 min de RF con 200 árboles).
3. **Soporte nativo de valores nulos** — HGB puede manejar `NaN` en inferencia sin imputación explícita. Las features de suelo a veces faltan y HGB las trata correctamente.
4. **Calibración de probabilidades** — `CalibratedClassifierCV` con Platt scaling ajusta las probabilidades predichas a la frecuencia observada. El accuracy subió de ~62.5% (RF sin calibrar) a ~84.6% (HGB + calibración). La calibración es crítica porque el frontend muestra `probabilidad: 0.86` al usuario.
5. **Features engineering** — HGB se beneficia de features ingenieriles (interacciones). Las 3 features adicionales (`temp_hum_interaction`, `ph_mo_interaction`, `precip_hum_ratio`) mejoraron la discriminación entre cultivos con rangos similares.

## Consecuencias

**Positivas:**
- + 84.6% accuracy en datos sintéticos (vs 62.5% de Random Forest)
- + Entrenamiento ~8 min optimizado (vs ~40 min RF) gracias a histogram binning
- + Mejor calibración de probabilidades con Platt scaling — scores más confiables para el usuario
- + Soporte nativo de NaN en features — robusto ante datos de suelo incompletos
- + `categorical_features=[6]` especifica explícitamente qué feature es categórica (textura)

**Negativas:**
- - Mayor riesgo de sobreajuste que RF si no se controla `max_depth` y `max_iter` — HGB boosting secuencial puede memorizar ruido
- - Dependencia de `CalibratedClassifierCV` que hace CV interna, duplicando el tiempo de entrenamiento (~5-fold para calibración)
- - Hiperparámetros más sensibles: learning_rate, max_iter, max_depth requieren tuning vs RF que es más robusto con defaults
- - Menos interpretable que RF: no hay `feature_importances_` directas de HGB (aunque se puede calcular permutation importance)
- - El nombre del archivo `crop_model_rf.joblib` es engañoso (mantenido por razones históricas)

## Referencias

- [[03-architecture/backend.md]] (secciones 5.2, 9.1 — pipeline ML)
- [[03-architecture/modulo-recomendacion.md]]
- [[08-testing/resultados-validacion.md]]
