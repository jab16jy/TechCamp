# Estrategia de Validación del Modelo ML

**Estado:** Definitivo  
**Fecha:** 2026-06-11  
**Documentos relacionados:** [[08-testing/resultados-validacion]] · [[08-testing/plan-retrain]]  
**Referencia histórica:** [[ml-model-validation-plan]] (versión original en inglés)

---

## Estado Actual del Modelo

| Componente | Detalle |
|---|---|
| **Algoritmo** | HistGradientBoosting + CalibratedClassifierCV |
| **Datos de entrenamiento** | 100 % sintéticos (climatología NASA POWER + `crops_requirements.csv`) |
| **Features** | 10 originales (previo a auditoría: se redujo de 12); se planea añadir NDWI como 11.ª |
| **Accuracy sintética (Top-1)** | ~84.6 % |
| **Accuracy sintética (Top-3)** | ~99.4 % |
| **Accuracy real (Top-1 vs EVA Caribe)** | **7.08 %** |
| **Rango F1 por clase (sintético)** | 0.74–0.99 |

> **Nota:** El valor de accuracy sintética reportado originalmente (~87 %) fue medido sobre un conjunto de test sintético con la misma distribución que el entrenamiento. Tras revisión el valor real sobre datos sintéticos es ~84.6 %.

---

## La Brecha Sintético-Real

### Magnitud del Gap

| Métrica | Sintético | Real (EVA Caribe) | Brecha (pp) |
|---------|-----------|-------------------|-------------|
| Top-1 Accuracy | 84.6 % | 7.08 % | **−77.52 pp** |
| Top-3 Accuracy | 99.4 % | 21.52 % | −77.88 pp |
| Macro F1 | 0.8779 | 0.0594 | −0.8185 |

La brecha observada (~77 puntos porcentuales) supera ampliamente la estimación inicial de 55–65 %. **Ningún cultivo supera el 52 % de accuracy real** (Cacao: 51.12 %; el resto está por debajo del 23 %).

### Causas Identificadas

1. **Ruido de medición en datos de campo** — NDVI satelital, análisis de suelo en laboratorio y datos de estaciones meteorológicas arrastran errores que el dato sintético no modela.

2. **Variabilidad espacial dentro de una misma zona climática** — Una celda de NASA POWER (0.5° × 0.5°) cubre ~2500 km², ocultando variación local de suelo y microclima.

3. **Prácticas de manejo no capturadas** — Riego, fertilización, control de plagas y densidad de siembra son determinantes del rendimiento que el modelo no observa.

4. **Microclima** — Topografía local, patrones de viento y cuerpos de agua generan condiciones que difieren del promedio de la celda.

5. **Variabilidad temporal** — El modelo usa promedios climatológicos, pero las decisiones de siembra responden a la variación interanual del clima.

### Sobreestimación por Cultivo

| Cultivo | Gap (pp) | Diagnóstico |
|---------|----------|-------------|
| Palma Aceitera | −99.92 | Sobreestimación masiva de rendimiento (+529 %) |
| Algodón | −96.26 | Accuracy real 0 % — el modelo no logra predecirlo |
| Frijol | −87.83 | Accuracy real 0 % |
| Plátano | −82.06 | MO sintética muy superior a la real |
| Yuca | −78.06 | Rendimiento real ~11 t/ha vs sintético 12.5 t/ha |
| Sorgo | −77.99 | Accuracy real 0 % en Top-1 |
| Maíz | −69.36 | Accuracy real 0 % — el cultivo más sembrado en Caribe |
| Arroz | −61.23 | El mejor desempeño relativo: 22.87 % real |
| Cacao | −47.06 | Accuracy real más alta: 51.12 % |
| Ñame | −78.18 | Top-3 de 73.35 % sugiere que el modelo «cerca» pero no acierta |

---

## Pasos de Validación Recomendados

### Fase 1: Recolectar Datos de Campo (2–4 semanas)

**Mínimo requerido:** 200–500 muestras etiquetadas por un agrónomo.

**Requisitos por muestra:**
- Latitud/Longitud (GPS con precisión ±5 m)
- Cultivo real sembrado (ground-truth verificado)
- Fecha de siembra
- pH del suelo, materia orgánica, textura (análisis de laboratorio o prueba de campo)
- Precipitación aproximada de la temporada de crecimiento

**Departamentos prioritarios:**
- Córdoba (Maíz)
- Sucre (Yuca)
- Bolívar (Sorgo)
- Cesar (Algodón)
- Magdalena (Plátano)

### Fase 2: Ejecutar Inferencia (1 día)

1. Para cada muestra de campo, obtener datos satelitales (NDVI, NDWI) de la ubicación.
2. Ejecutar `predict_crop_recommendations()` del pipeline de inferencia.
3. Comparar cultivo predicho vs. cultivo real.
4. Documentar hits, misses y patrones de error.

### Fase 3: Medir Métricas Reales (2–3 días)

Calcular y documentar:
- Accuracy global (Top-1 y Top-3)
- Precisión, recall y F1 por cultivo
- Matriz de confusión
- Accuracy por departamento
- Comparación formal contra métricas sintéticas (documentar el gap)

### Fase 4: Mejora Iterativa

| Condición | Acción |
|-----------|--------|
| **Gap > 30 pp** (✓ actual) | Reentrenar con aumento de datos reales |
| **Gap 15–30 pp** | Agregar más features agronómicos, ajustar factores de scoring |
| **Gap < 15 pp** | Modelo listo para producción |

---

## Timeline Esperado

| Hito | Duración | Dependencias |
|------|----------|-------------|
| Campaña de recolección de campo | 2–4 semanas | Agrónomo + técnicos de campo, GPS, kits de análisis de suelo |
| Ejecución de validación | 1 día | Muestras recolectadas, pipeline de inferencia operativo |
| Análisis y reporte | 2–3 días | Resultados de inferencia, scripts de métricas |
| Reentreno (si aplica) | 1 día | Ver [[08-testing/plan-retrain]] |
| Iteración y ajuste fino | 1–2 semanas | Según resultados del reentreno |

---

## Lecciones Aprendidas

1. **El dato sintético no reemplaza al real.** La diferencia de ~77 pp demuestra que los rangos de la literatura global no representan las condiciones del Caribe colombiano.
2. **El pH es consistente** (10/10 perfiles compatibles), pero la **materia orgánica** (4/10 realistas) y el **rendimiento** (0/10 realistas) están sistemáticamente sobreestimados.
3. **Se necesita un pipeline de reentreno rápido.** El entrenamiento actual toma ~40 min; el plan de reentreno ([[08-testing/plan-retrain]]) lo reduce a 6–8 min con caching y optimizaciones.
4. **La validación reveló un bug crítico:** `training.py:357` consulta una columna `precipitacion` que no existe en `indices_satelitales`. Esto causa que el NDVI siempre se genere sintéticamente en vez de usar distribuciones empíricas.
5. **Incluir NDWI como feature adicional** puede ayudar al modelo a distinguir cultivos con requerimientos hídricos diferentes.

---

*Este documento actualiza y reemplaza la versión en inglés [[ml-model-validation-plan]]. Los hallazgos de validación detallados están en [[08-testing/resultados-validacion]].*
