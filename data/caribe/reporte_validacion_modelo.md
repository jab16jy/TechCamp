# Reporte de Validación: Modelo ML vs EVA Caribe

## Resumen

| Métrica | Valor real | Referencia sintética (87.01%) | Diferencia |
|---------|------------|------|
| **Top-1 Accuracy** | **7.08%** | 87.01% | -79.93% |
| **Top-3 Accuracy** | **21.52%** | 99.40% | -77.88% |
| Registros evaluados | 13,125 | 63,778 (sintéticos) | — |
| Registros excluidos (rend=0) | 1,141 | — | — |
| Macro Precision | 0.0900 | 0.8761 | -0.7861 |
| Macro Recall | 0.1045 | 0.8824 | -0.7779 |
| Macro F1 | 0.0594 | 0.8779 | -0.8185 |

## Accuracy por Cultivo

| Cultivo | Top-1 | Top-3 | N registros | Precisión | Recall | F1 |
|---------|-------|-------|-------------|-----------|--------|-----|
| Algodón | 0.00% | 19.05% | 105 | 0.00% | 0.00% | 0.0000 |
| Arroz | 22.87% | 24.48% | 1,622 | 73.32% | 22.87% | 0.3487 |
| Cacao | 51.12% | 51.12% | 489 | 3.34% | 51.12% | 0.0627 |
| Frijol | 0.00% | 0.00% | 1,498 | 0.00% | 0.00% | 0.0000 |
| Maíz | 0.00% | 0.00% | 4,405 | 0.00% | 0.00% | 0.0000 |
| Palma_Aceitera | 0.00% | 8.86% | 519 | 0.00% | 0.00% | 0.0000 |
| Plátano | 17.09% | 85.46% | 1,018 | 9.19% | 17.09% | 0.1195 |
| Sorgo | 0.00% | 58.43% | 89 | 0.00% | 0.00% | 0.0000 |
| Yuca | 0.00% | 19.09% | 2,378 | 0.00% | 0.00% | 0.0000 |
| Ñame | 13.37% | 73.35% | 1,002 | 4.13% | 13.37% | 0.0631 |

## Matriz de Confusión (10×10)

| Real \ Pred | Algodón | Arroz | Cacao | Frijol | Maíz | Palma_Aceitera | Plátano | Sorgo | Yuca | Ñame |
|---|---|---|---|---|---|---|---|---|---|---|
| **Algodón** | 0 | 0 | 56 | 0 | 0 | 0 | 29 | 0 | 0 | 20 |
| **Arroz** | 0 | 371 | 1225 | 0 | 0 | 0 | 26 | 0 | 0 | 0 |
| **Cacao** | 0 | 135 | 250 | 0 | 0 | 0 | 62 | 0 | 0 | 42 |
| **Frijol** | 0 | 0 | 555 | 0 | 0 | 0 | 358 | 0 | 0 | 585 |
| **Maíz** | 0 | 0 | 2446 | 0 | 0 | 0 | 667 | 0 | 0 | 1292 |
| **Palma_Aceitera** | 0 | 0 | 217 | 0 | 0 | 0 | 56 | 0 | 0 | 246 |
| **Plátano** | 0 | 0 | 624 | 0 | 0 | 0 | 174 | 0 | 0 | 220 |
| **Sorgo** | 0 | 0 | 13 | 0 | 0 | 0 | 53 | 0 | 0 | 23 |
| **Yuca** | 0 | 0 | 1298 | 0 | 0 | 0 | 397 | 0 | 0 | 683 |
| **Ñame** | 0 | 0 | 796 | 0 | 0 | 0 | 72 | 0 | 0 | 134 |

## Accuracy por Departamento

| Departamento | Top-1 | Top-3 | N registros |
|-------------|-------|-------|-------------|
| ATLANTICO | 9.23% | 20.83% | 1,008 |
| BOLIVAR | 4.23% | 20.48% | 3,027 |
| CESAR | 13.75% | 29.23% | 2,008 |
| CORDOBA | 2.82% | 23.74% | 2,372 |
| LA GUAJIRA | 14.36% | 35.21% | 940 |
| MAGDALENA | 10.36% | 14.62% | 1,689 |
| SUCRE | 2.64% | 12.78% | 2,081 |

## Análisis de Brecha: Sintético vs Real

| Cultivo | Sintético (%) | Real (%) | Brecha (pp) | Diagnóstico |
|---------|--------------|----------|-------------|-------------|
| Algodón | 96.26% | 0.00% | -96.26 | ❌ Pérdida severa |
| Arroz | 84.10% | 22.87% | -61.23 | ❌ Pérdida severa |
| Cacao | 98.18% | 51.12% | -47.06 | ❌ Pérdida severa |
| Frijol | 87.83% | 0.00% | -87.83 | ❌ Pérdida severa |
| Maíz | 69.36% | 0.00% | -69.36 | ❌ Pérdida severa |
| Palma_Aceitera | 99.92% | 0.00% | -99.92 | ❌ Pérdida severa |
| Plátano | 99.15% | 17.09% | -82.06 | ❌ Pérdida severa |
| Sorgo | 77.99% | 0.00% | -77.99 | ❌ Pérdida severa |
| Yuca | 78.06% | 0.00% | -78.06 | ❌ Pérdida severa |
| Ñame | 91.55% | 13.37% | -78.18 | ❌ Pérdida severa |

## Problemas Detectados

| Cultivo | Problema | Impacto |
|---------|----------|---------|
| Algodón | Bajo Top-1 (0.00%) | Baja confiabilidad del modelo para este cultivo en condiciones Caribe |
| Frijol | Bajo Top-1 (0.00%) | Baja confiabilidad del modelo para este cultivo en condiciones Caribe |
| Maíz | Bajo Top-1 (0.00%) | Baja confiabilidad del modelo para este cultivo en condiciones Caribe |
| Cacao | MO sintética muy superior a real | Sobreestimación de viabilidad en suelos Caribe |
| Plátano | MO sintética muy superior a real | Sobreestimación de viabilidad en suelos Caribe |
| Palma_Aceitera | MO sintética muy superior a real | Sobreestimación de viabilidad en suelos Caribe |

## Conclusión

La Top-1 Accuracy real (7.08%) es < 70%. Se recomienda reentrenar el modelo con perfiles ajustados a datos reales del Caribe.

## Limitaciones (documentadas)

- pH/MO assigned as per-crop averages from aggregated real profiles (partial circularity)
- NDVI fixed at 0.5 (no spectral data in EVA)
- Climate assigned by department, not by municipality
- Texture from synthetic optimal profile (crops_requirements.csv), not real texture data
- Altitude as department point elevation, not per-record topography
- Annual total precipitation, not intra-annual distribution
