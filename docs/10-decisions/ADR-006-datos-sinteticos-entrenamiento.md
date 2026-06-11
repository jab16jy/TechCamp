# ADR-006: Datos sintéticos para entrenamiento inicial

## Contexto

Al inicio del proyecto no existían datos reales de campo etiquetados para entrenar el modelo de recomendación de cultivos. Necesitábamos un MVP funcional que recomendara entre 10 cultivos (maíz, yuca, plátano, arroz, cacao, palma aceitera, ñame, frijol, algodón, sorgo) basado en 7 features del suelo y clima.

Sin datos reales, las opciones eran:

1. **Modelo heurístico puro** — Reglas agronómicas fijas (CropClassifier). Funcional pero sin generalización ni probabilidades calibradas.
2. **Datos sintéticos** — Generar muestras artificiales dentro de rangos agronómicos válidos para entrenar un modelo ML.
3. **Datos de terceros / papers** — Usar datasets públicos de otras regiones (riesgo de no representar el Caribe colombiano).
4. **Esperar a tener datos reales** — Bloquear el MVP por meses.

Los datos sintéticos eran la única opción que permitía un modelo ML entrenado con features agronómicos del Caribe sin depender de fuentes externas.

## Decisión

**Generar dataset sintético con 1000 muestras por cultivo** (10,000 total) a partir de `crops_requirements.csv`, usando distribución triangular centrada en rangos óptimos con ruido gaussiano.

Mecanismo:

- Cada cultivo tiene rangos óptimos definidos en `CROP_REQUIREMENTS` (temp, pH, humedad, precipitación, MO, NDVI).
- Se muestrea con `numpy.random.triangular(left, mode, right)` donde `mode` = centro del rango óptimo.
- Se añade ruido gaussiano (`sigma ~ 5-10% del rango`) para evitar que el modelo memorice rangos exactos.
- Features: temperatura, humedad, precipitación, pH, materia orgánica, NDVI, textura_encoded.
- Se agregaron 3 features ingenieriles: `temp_hum_interaction`, `ph_mo_interaction`, `precip_hum_ratio`.
- Target: 10 clases de cultivo, balanceadas (1000 muestras cada una).

## Consecuencias

**Positivas:**
- + MVP funcional en semanas, no meses — sin esperar recolección de datos de campo
- + Pipeline de entrenamiento validado — todo el flujo (generación → entrenamiento → evaluación → serialización) probado y funcional
- + Control completo sobre la distribución — podemos inyectar casos edge (suelos muy ácidos, sequía extrema) que serían raros en datos reales
- + Modelo ML entrenado desde el día 1 — permitió integrar probabilidades calibradas en el frontend antes de tener datos reales
- + Base para comparación — el gap sintético-real (77% de diferencia en accuracy) es medible y sirve como KPI de mejora

**Negativas:**
- - Gap sintético-real de ~77%: accuracy 84.6% en sintéticos vs 7.08% en validación con datos reales EVA Caribe
- - Riesgo de sobreajuste a rangos ideales — el modelo aprende que "todo está en rangos óptimos" porque los datos sintéticos siempre caen dentro
- - No captura correlaciones reales del mundo — ej., suelos ácidos en la región Caribe suelen tener baja MO, pero el sintético las genera independientemente
- - Los rangos sintéticos originales eran demasiado amplios — pH óptimo para maíz 5.5-7.5 pero datos reales muestran pH 5.0-6.5 en campo
- - Los datos sintéticos no representan la variabilidad climática real del Caribe (patrones de lluvia bimensuales, microclimas)

## Referencias

- [[03-architecture/backend.md]] (sección 9, pipeline de entrenamiento)
- [[03-architecture/modulo-recomendacion.md]]
- [[08-testing/resultados-validacion.md]]
