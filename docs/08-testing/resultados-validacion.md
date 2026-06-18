# Resultados de Validación: Modelo ML vs. Datos Reales Caribe

**Fecha:** 2026-06-11  
**Región:** Caribe colombiano (7 departamentos)  
**Documentos relacionados:** [[estrategia]] · [[plan-retrain]] · [[modulo-recomendacion]]  
**Fuentes de datos:** EVA (producción), Suelos AGROSAVIA (fisicoquímicos), Foliar AGROSAVIA (tejido vegetal)

---

## Resumen Ejecutivo

La validación del modelo ML contra **13 125 registros reales del Caribe colombiano** (EVA) revela una **brecha de ~77 puntos porcentuales** entre la accuracy sintética (84.6 %) y la real (7.08 %). Ningún cultivo supera el 52 % de acierto; 5 de 10 cultivos tienen 0 % de accuracy real en Top-1.

**Causa raíz:** Los perfiles sintéticos (`crops_requirements.csv`) sobreestiman sistemáticamente la materia orgánica y el rendimiento de los cultivos. Los rangos de pH son compatibles (10/10), pero la MO solo es realista en 4/10 cultivos y el rendimiento está sobreestimado en los 10 cultivos.

**Decisión:** Proceder con el reentreno del modelo usando datos reales (ver [[plan-retrain]]).

---

## Tabla Comparativa: Sintético vs. Real

| Métrica | Sintético | Real (EVA Caribe) | Diferencia |
|---------|-----------|-------------------|------------|
| **Top-1 Accuracy** | **84.60 %** | **7.08 %** | **−77.52 pp** |
| **Top-3 Accuracy** | **99.40 %** | **21.52 %** | −77.88 pp |
| Registros evaluados | 63 778 | 13 125 | — |
| Registros excluidos (rend = 0) | — | 1 141 | — |
| Macro Precision | 0.8761 | 0.0900 | −0.7861 |
| Macro Recall | 0.8824 | 0.1045 | −0.7779 |
| Macro F1 | 0.8779 | 0.0594 | −0.8185 |

---

## Accuracy por Cultivo (Top-1 y Top-3)

| Cultivo | Top-1 Real | Top-3 Real | N registros | Precisión | Recall | F1 |
|---------|-----------|-----------|-------------|-----------|--------|-----|
| Algodón | 0.00 % | 19.05 % | 105 | 0.00 % | 0.00 % | 0.0000 |
| Arroz | 22.87 % | 24.48 % | 1 622 | 73.32 % | 22.87 % | 0.3487 |
| Cacao | 51.12 % | 51.12 % | 489 | 3.34 % | 51.12 % | 0.0627 |
| Frijol | 0.00 % | 0.00 % | 1 498 | 0.00 % | 0.00 % | 0.0000 |
| Maíz | 0.00 % | 0.00 % | 4 405 | 0.00 % | 0.00 % | 0.0000 |
| Palma Aceitera | 0.00 % | 8.86 % | 519 | 0.00 % | 0.00 % | 0.0000 |
| Plátano | 17.09 % | 85.46 % | 1 018 | 9.19 % | 17.09 % | 0.1195 |
| Sorgo | 0.00 % | 58.43 % | 89 | 0.00 % | 0.00 % | 0.0000 |
| Yuca | 0.00 % | 19.09 % | 2 378 | 0.00 % | 0.00 % | 0.0000 |
| Ñame | 13.37 % | 73.35 % | 1 002 | 4.13 % | 13.37 % | 0.0631 |

**Observaciones clave:**
- **Cacao** tiene la accuracy real más alta (51.12 %), pero una precisión muy baja (3.34 %): predice cacao para casi todo.
- **Arroz** destaca con F1 de 0.3487 (el más alto), consistencia entre Top-1 y Top-3.
- **Maíz** (4 405 registros, el cultivo más sembrado en el Caribe) tiene **0 % de acierto**.
- **Plátano** y **Ñame** tienen Top-3 alto (>73 %) pero Top-1 bajo (~15 %): el modelo acierta dentro del top 3 pero no en el primer lugar.

---

## Matriz de Confusión (10×10)

| Real \ Pred | Algodón | Arroz | Cacao | Frijol | Maíz | Palma_Ac. | Plátano | Sorgo | Yuca | Ñame |
|-------------|---------|-------|-------|--------|------|-----------|---------|-------|------|------|
| **Algodón** | 0 | 0 | 56 | 0 | 0 | 0 | 29 | 0 | 0 | 20 |
| **Arroz** | 0 | 371 | 1 225 | 0 | 0 | 0 | 26 | 0 | 0 | 0 |
| **Cacao** | 0 | 135 | 250 | 0 | 0 | 0 | 62 | 0 | 0 | 42 |
| **Frijol** | 0 | 0 | 555 | 0 | 0 | 0 | 358 | 0 | 0 | 585 |
| **Maíz** | 0 | 0 | 2 446 | 0 | 0 | 0 | 667 | 0 | 0 | 1 292 |
| **Palma Ac.** | 0 | 0 | 217 | 0 | 0 | 0 | 56 | 0 | 0 | 246 |
| **Plátano** | 0 | 0 | 624 | 0 | 0 | 0 | 174 | 0 | 0 | 220 |
| **Sorgo** | 0 | 0 | 13 | 0 | 0 | 0 | 53 | 0 | 0 | 23 |
| **Yuca** | 0 | 0 | 1 298 | 0 | 0 | 0 | 397 | 0 | 0 | 683 |
| **Ñame** | 0 | 0 | 796 | 0 | 0 | 0 | 72 | 0 | 0 | 134 |

**Patrón dominante:** El modelo predice **Cacao, Plátano o Ñame** para la gran mayoría de los casos. Las columnas de Algodón, Frijol, Maíz, Palma, Sorgo y Yuca están completamente vacías — el modelo nunca predice esos cultivos como primera opción.

**Interpretación:** Esto sugiere que los rangos sintéticos de Cacao (pH 5.0–7.0, MO ≥ 3.5 %) son lo suficientemente amplios como para «absorber» casi todas las combinaciones de pH/MO reales del Caribe. El modelo no encuentra suficiente señal discriminante.

---

## Accuracy por Departamento

| Departamento | Top-1 | Top-3 | N registros |
|-------------|-------|-------|-------------|
| ATLÁNTICO | 9.23 % | 20.83 % | 1 008 |
| BOLÍVAR | 4.23 % | 20.48 % | 3 027 |
| CESAR | 13.75 % | 29.23 % | 2 008 |
| CÓRDOBA | 2.82 % | 23.74 % | 2 372 |
| LA GUAJIRA | 14.36 % | 35.21 % | 940 |
| MAGDALENA | 10.36 % | 14.62 % | 1 689 |
| SUCRE | 2.64 % | 12.78 % | 2 081 |

**Observaciones:**
- **La Guajira** tiene la accuracy más alta (14.36 %), posiblemente por condiciones edafoclimáticas más distintivas.
- **Sucre** y **Córdoba** tienen la accuracy más baja (~2.7 %) — zonas agrícolas intensivas con alta variabilidad de cultivos.
- Ningún departamento supera el 15 % de accuracy real.

---

## Gap Analysis: pH, Materia Orgánica y Rendimiento

### pH — 10/10 Compatibles

| Cultivo | Rango sintético | Mediana real | Compatible? |
|---------|----------------|-------------|-------------|
| Maíz | 5.5–7.5 | 6.95 | ✅ |
| Yuca | 4.5–8.0 | 6.18 | ✅ |
| Arroz | 5.0–7.0 | 6.42 | ✅ |
| Frijol | 5.5–7.0 | 6.12 | ✅ |
| Ñame | 5.5–7.0 | 6.85 | ✅ |
| Plátano | 5.5–7.5 | 6.22 | ✅ |
| Cacao | 5.0–7.0 | 5.80 | ✅ |
| Algodón | 5.5–7.5 | 6.71 | ✅ |
| Sorgo | 5.5–7.5 | 6.39 | ✅ |
| Palma | 4.5–7.0 | 6.42 | ✅ |

**Conclusión:** El pH está bien calibrado. No requiere ajuste urgente.

### Materia Orgánica — 4/10 Realistas

| Cultivo | MO mín sintética | Mediana real | Diferencia (pp) | Diagnóstico |
|---------|-----------------|-------------|-----------------|-------------|
| Palma | 3.0 % | 1.17 % | +1.83 | ❌ Severa |
| Cacao | 3.5 % | 1.90 % | +1.60 | ❌ Severa |
| Plátano | 3.0 % | 1.69 % | +1.31 | ❌ Severa |
| Arroz | 2.5 % | 1.45 % | +1.05 | ❌ Severa |
| Maíz | 2.0 % | 1.66 % | +0.34 | ⚠️ Revisar |
| Ñame | 2.5 % | 2.22 % | +0.28 | ⚠️ Revisar |
| Yuca | 1.0 % | 1.55 % | −0.55 | ✅ Realista |
| Frijol | 1.5 % | 2.19 % | −0.69 | ✅ Realista |
| Algodón | 1.5 % | 2.08 % | −0.58 | ✅ Realista |
| Sorgo | 1.5 % | 1.81 % | −0.31 | ✅ Realista |

**Conclusión:** La MO sintética es demasiado alta para la mayoría de los suelos del Caribe. Esto sesga al modelo a favor de cultivos que requieren alta MO (Cacao, Plátano, Palma).

### Rendimiento — 0/10 Realistas (Todos Sobreestimados)

| Cultivo | Rto sintético (t/ha) | Rto real (t/ha) | Diferencia | Diagnóstico |
|---------|---------------------|----------------|------------|-------------|
| **Palma** | 20.00 | 3.18 | **+528.9 %** | ❌ Severa |
| Cacao | 1.20 | 0.57 | +110.5 % | ❌ Severa |
| Plátano | 15.00 | 7.46 | +101.1 % | ❌ Severa |
| Maíz | 4.20 | 2.29 | +83.4 % | ❌ Severa |
| Sorgo | 3.50 | 1.98 | +76.8 % | ❌ Severa |
| Algodón | 2.50 | 1.67 | +49.7 % | ❌ Severa |
| Arroz | 5.80 | 4.13 | +40.4 % | ❌ Severa |
| Frijol | 1.80 | 1.29 | +39.5 % | ❌ Severa |
| Ñame | 12.00 | 10.47 | +14.6 % | ⚠️ Revisar |
| Yuca | 12.50 | 11.12 | +12.4 % | ✅ Aceptable |

**Caso crítico — Palma:** El rendimiento sintético (20 t/ha) supera en **529 %** al real (3.18 t/ha). Esta sobreestimación masiva distorsiona por completo la recomendación para este cultivo.

---

## Análisis por Cultivo: Sobreestimación Destacada

### Palma Aceitera — +529 % de Sobreestimación

El caso más extremo. El perfil sintético asume un rendimiento de 20 t/ha basado en literatura internacional de plantaciones tecnificadas en el Sudeste Asiático. En el Caribe colombiano, el rendimiento real promedio es de **3.18 t/ha**.

**Impacto en el modelo:** La combinación de MO mínima 3.0 % (vs. mediana real 1.17 %) crea un perfil irrealista que hace que el modelo descarte Palma para casi cualquier parcela caribeña, o la recomiende solo en condiciones que no existen en la región.

**Acción requerida:** Ajustar el rendimiento sintético al percentil 75 real (~4.5 t/ha) y la MO mínima al percentil 10 real (~0.56 %).

---

## Limitaciones Documentadas de la Validación

| Limitación | Impacto |
|------------|---------|
| pH/MO asignados como promedios por cultivo desde perfiles agregados reales | Circularidad parcial — los datos de validación no son completamente independientes |
| NDVI fijo en 0.5 (EVA no incluye datos espectrales) | Subestima la varianza real de NDVI |
| Clima asignado por departamento, no por municipio | Oculta variabilidad climática intra-departamental |
| Textura desde perfil sintético óptimo (`crops_requirements.csv`), no desde datos reales | No refleja la textura real de los suelos caribeños |
| Altitud como elevación puntual del departamento | No captura microtopografía |
| Precipitación total anual, no distribución intra-anual | Ignora estacionalidad crítica para cultivos como Arroz |
| No se realizaron joins entre datasets EVA-Suelos-Foliar | Toda comparación es a nivel agregado por cultivo |

---

## Conclusiones

1. **El modelo no es apto para producción** con los datos sintéticos actuales. La accuracy real de 7.08 % está muy por debajo del umbral mínimo aceptable (~60 %).

2. **La causa principal es la sobreestimación sintética** de MO y rendimiento. El pH es compatible en todos los cultivos.

3. **Palma Aceitera es el caso más crítico** con +529 % de sobreestimación de rendimiento.

4. **El modelo colapsa a 3 cultivos** (Cacao, Plátano, Ñame) en sus predicciones, ignorando completamente los otros 7.

5. **Hay suficiente datos reales** (EVA: 26K+, Suelos: 12K, Foliare: 1.7K) para un reentreno informado.

## Próximos Pasos

| # | Acción | Prioridad |
|---|--------|-----------|
| 1 | Ejecutar reentreno con datos reales (ver [[plan-retrain]]) | 🔴 Crítica |
| 2 | Ajustar rangos sintéticos de MO y rendimiento con percentiles reales | 🔴 Crítica |
| 3 | Agregar NDWI como 11.ª feature | 🟡 Alta |
| 4 | Corregir bug de `precipitacion` en `training.py:357` | 🔴 Crítica |
| 5 | Recolectar datos de campo frescos (200–500 muestras) para validación independiente | 🟡 Alta |
| 6 | Agregar drenaje y topografía como features en siguiente iteración | 🟢 Media |
| 7 | Explorar datos foliares N-P-K como features adicionales | 🟢 Media |

---

*Los datos completos de perfiles sintéticos vs. reales están disponibles en `data/caribe/reporte_sintetico_vs_real.md`. La estrategia de validación general está en [[estrategia]].*
