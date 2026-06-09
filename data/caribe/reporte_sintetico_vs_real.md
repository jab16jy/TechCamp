# Reporte de Comparación: Perfiles Sintéticos vs. Real Caribe Colombiano

**Fecha:** 2026-06-09  |  **Región:** Caribe Colombiano (7 departamentos)

---

## Resumen Ejecutivo

Se compararon los 10 perfiles sintéticos de cultivos del recomendador (`crops_requirements.csv`) contra datos reales del Caribe colombiano extraídos de EVA (producción), Suelos (análisis fisicoquímicos) y Foliar (tejido vegetal). El objetivo es identificar qué perfiles son realistas y cuáles necesitan ajuste.

- **pH compatible:** 10/10 compatibles
- **MO realista:** 4/10 realistas (mín sintético ≤ mediana real)
- **Rendimiento sobreestimado:** 10/10 sintéticos > real
- **Drenaje:** 0/10 perfiles incluyen drenaje — oportunidad de mejora
- **Topografía:** 0/10 perfiles incluyen topografía — oportunidad de mejora
- **Perfil foliar:** 0/10 perfiles sintéticos incluyen N-P-K foliar

### Principales diferencias encontradas

1. Rendimiento — Maíz: Rendimiento sintético (4.2 t/ha) es MAYOR al real (2.29 t/ha) — +83.4%...
2. Materia Orgánica — Arroz: MO mínima sintética (2.5%) EXCEDE en 1.05pp la mediana real (1.45%)...
3. Materia Orgánica — Plátano: MO mínima sintética (3.0%) EXCEDE en 1.31pp la mediana real (1.69%)...
4. Rendimiento — Plátano: Rendimiento sintético (15.0 t/ha) es MAYOR al real (7.46 t/ha) — +101.1%...
5. Materia Orgánica — Cacao: MO mínima sintética (3.5%) EXCEDE en 1.6pp la mediana real (1.9%)...
6. Rendimiento — Cacao: Rendimiento sintético (1.2 t/ha) es MAYOR al real (0.57 t/ha) — +110.5%...
7. Materia Orgánica — Palma: MO mínima sintética (3.0%) EXCEDE en 1.83pp la mediana real (1.17%)...
8. Rendimiento — Palma: Rendimiento sintético (20.0 t/ha) es MAYOR al real (3.18 t/ha) — +528.9%...
9. Materia Orgánica — Maíz: MO mínima sintética (2.0%) EXCEDE en 0.34pp la mediana real (1.66%)...
10. Textura/Drenaje — Maíz: Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variab...

---

## Tabla Comparativa General

| Cultivo | pH sint | pH real med | pH ok? | MO sint min | MO real med | MO ok? | Rto sint | Rto real | Rto dif% | Drenaje Caribe | Topografía Caribe | N foliar | P foliar | K foliar | N registros suelo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Maíz             |    5.5-7.5 |         7.0 | ✅ |         2.0 |        1.7 | ⚠️ |     4.2 |     2.3 |    +83% |   Buen drenaje |            Plano |    2.8 |   0.34 |    2.5 |              964 |
| Yuca             |    4.5-8.0 |         6.2 | ✅ |         1.0 |        1.6 | ✅ |    12.5 |    11.1 |    +12% |   Buen drenaje |            Plano |    4.0 |   0.33 |    1.3 |              358 |
| Arroz            |    5.0-7.0 |         6.4 | ✅ |         2.5 |        1.4 | ❌ |     5.8 |     4.1 |    +40% |   Buen drenaje |            Plano |    1.4 |   0.21 |    1.8 |              292 |
| Frijol           |    5.5-7.0 |         6.1 | ✅ |         1.5 |        2.2 | ✅ |     1.8 |     1.3 |    +40% |   Buen drenaje |            Plano |    4.7 |   0.39 |    1.9 |               32 |
| Ñame             |    5.5-7.0 |         6.8 | ✅ |         2.5 |        2.2 | ⚠️ |    12.0 |    10.5 |    +15% |   Buen drenaje |            Plano |      - |      - |      - |              269 |
| Plátano          |    5.5-7.5 |         6.2 | ✅ |         3.0 |        1.7 | ❌ |    15.0 |     7.5 |   +101% | Regular drenaje |            Plano |    2.7 |   0.26 |    2.9 |              704 |
| Cacao            |    5.0-7.0 |         5.8 | ✅ |         3.5 |        1.9 | ❌ |     1.2 |     0.6 |   +110% |   Buen drenaje |        Pendiente |    1.9 |   0.19 |    1.8 |              908 |
| Algodón          |    5.5-7.5 |         6.7 | ✅ |         1.5 |        2.1 | ✅ |     2.5 |     1.7 |    +50% |   Buen drenaje |            Plano |      - |      - |      - |               18 |
| Sorgo            |    5.5-7.5 |         6.4 | ✅ |         1.5 |        1.8 | ✅ |     3.5 |     2.0 |    +77% |   Buen drenaje |            Plano |      - |      - |      - |              247 |
| Palma            |    4.5-7.0 |         6.4 | ✅ |         3.0 |        1.2 | ❌ |    20.0 |     3.2 |   +529% |   Buen drenaje |            Plano |    2.5 |   0.17 |    1.0 |              131 |

---

## Maíz

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.5] (media 6.5)
- Materia orgánica mínima: 2.0%
- Rendimiento promedio: 4.2 t/ha
- Textura óptima: Franco
- Tipo de suelo: Franco;Franco-Arcilloso

### Real Caribe

**pH:**
- Promedio: 7.0000 | Mediana: 6.95 | p10: 5.5000 | p90: 8.2700
- N registros suelos: 964

**Materia Orgánica:**
- Promedio: 1.9300% | Mediana: 1.66% | p10: 0.7400% | p90: 3.3100%

**Rendimiento:**
- Promedio real: 2.2900 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 2.78% | P: 0.34% | K: 2.46%
- N registros foliares: 24

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [5.5, 7.5] contiene la mediana real (6.95)
  - Diferencia absoluta: 0.45

- **Materia Orgánica:** ⚠️ REVISAR
  - MO mínima sintética (2.0%) EXCEDE en 0.34pp la mediana real (1.66%)
  - Diferencia absoluta: 0.34
  - Diferencia porcentual: 20.5%

- **Rendimiento:** ❌ INCOMPATIBLE
  - Rendimiento sintético (4.2 t/ha) es MAYOR al real (2.29 t/ha) — +83.4%
  - Diferencia absoluta: 1.91
  - Diferencia porcentual: 83.4%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=2.78%, P=0.34%, K=2.46%

**Conclusión:** pH: ✅ COMPATIBLE. MO: ⚠️ REVISAR. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Yuca

### Perfil Sintético (usado actualmente)

- pH: [4.5, 8.0] (media 6.25)
- Materia orgánica mínima: 1.0%
- Rendimiento promedio: 12.5 t/ha
- Textura óptima: Franco-Arenoso
- Tipo de suelo: Franco-Arenoso;Franco

### Real Caribe

**pH:**
- Promedio: 6.3600 | Mediana: 6.18 | p10: 5.2500 | p90: 7.8100
- N registros suelos: 358

**Materia Orgánica:**
- Promedio: 1.8900% | Mediana: 1.55% | p10: 0.5600% | p90: 3.5000%

**Rendimiento:**
- Promedio real: 11.1200 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 4.00% | P: 0.33% | K: 1.33%
- N registros foliares: 104

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [4.5, 8.0] contiene la mediana real (6.18)
  - Diferencia absoluta: 0.07

- **Materia Orgánica:** ✅ COMPATIBLE
  - MO mínima sintética (1.0%) ≤ la mediana real (1.55%)
  - Diferencia absoluta: -0.55
  - Diferencia porcentual: -35.5%

- **Rendimiento:** ✅ COMPATIBLE
  - Rendimiento sintético (12.5 t/ha) es MAYOR al real (11.12 t/ha) — +12.4%
  - Diferencia absoluta: 1.38
  - Diferencia porcentual: 12.4%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=4.0%, P=0.33%, K=1.33%

**Conclusión:** pH: ✅ COMPATIBLE. MO: ✅ COMPATIBLE. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Arroz

### Perfil Sintético (usado actualmente)

- pH: [5.0, 7.0] (media 6.0)
- Materia orgánica mínima: 2.5%
- Rendimiento promedio: 5.8 t/ha
- Textura óptima: Arcilloso
- Tipo de suelo: Arcilloso;Franco-Arcilloso

### Real Caribe

**pH:**
- Promedio: 6.3900 | Mediana: 6.42 | p10: 5.1600 | p90: 7.3800
- N registros suelos: 292

**Materia Orgánica:**
- Promedio: 1.5600% | Mediana: 1.45% | p10: 0.7400% | p90: 2.4900%

**Rendimiento:**
- Promedio real: 4.1300 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 1.40% | P: 0.21% | K: 1.76%
- N registros foliares: 183

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [5.0, 7.0] contiene la mediana real (6.42)
  - Diferencia absoluta: 0.42

- **Materia Orgánica:** ❌ INCOMPATIBLE
  - MO mínima sintética (2.5%) EXCEDE en 1.05pp la mediana real (1.45%)
  - Diferencia absoluta: 1.05
  - Diferencia porcentual: 72.4%

- **Rendimiento:** ⚠️ REVISAR
  - Rendimiento sintético (5.8 t/ha) es MAYOR al real (4.13 t/ha) — +40.4%
  - Diferencia absoluta: 1.67
  - Diferencia porcentual: 40.4%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=1.4%, P=0.21%, K=1.76%

**Conclusión:** pH: ✅ COMPATIBLE. MO: ❌ INCOMPATIBLE. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Frijol

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.0] (media 6.25)
- Materia orgánica mínima: 1.5%
- Rendimiento promedio: 1.8 t/ha
- Textura óptima: Franco
- Tipo de suelo: Franco;Franco-Arenoso

### Real Caribe

**pH:**
- Promedio: 6.2200 | Mediana: 6.12 | p10: 5.0500 | p90: 7.4400
- N registros suelos: 32

**Materia Orgánica:**
- Promedio: 2.2600% | Mediana: 2.19% | p10: 1.0200% | p90: 3.0600%

**Rendimiento:**
- Promedio real: 1.2900 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 4.65% | P: 0.39% | K: 1.90%
- N registros foliares: 297

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [5.5, 7.0] contiene la mediana real (6.12)
  - Diferencia absoluta: 0.13

- **Materia Orgánica:** ✅ COMPATIBLE
  - MO mínima sintética (1.5%) ≤ la mediana real (2.19%)
  - Diferencia absoluta: -0.69
  - Diferencia porcentual: -31.5%

- **Rendimiento:** ⚠️ REVISAR
  - Rendimiento sintético (1.8 t/ha) es MAYOR al real (1.29 t/ha) — +39.5%
  - Diferencia absoluta: 0.51
  - Diferencia porcentual: 39.5%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=4.65%, P=0.39%, K=1.9%

**Conclusión:** pH: ✅ COMPATIBLE. MO: ✅ COMPATIBLE. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Ñame

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.0] (media 6.25)
- Materia orgánica mínima: 2.5%
- Rendimiento promedio: 12.0 t/ha
- Textura óptima: Franco-Arcilloso
- Tipo de suelo: Franco-Arcilloso;Franco

### Real Caribe

**pH:**
- Promedio: 6.9800 | Mediana: 6.85 | p10: 6.0500 | p90: 8.2700
- N registros suelos: 269

**Materia Orgánica:**
- Promedio: 2.4500% | Mediana: 2.22% | p10: 1.4100% | p90: 3.5300%

**Rendimiento:**
- Promedio real: 10.4700 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar:** Sin datos foliares disponibles para este cultivo

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [5.5, 7.0] contiene la mediana real (6.85)
  - Diferencia absoluta: 0.6

- **Materia Orgánica:** ⚠️ REVISAR
  - MO mínima sintética (2.5%) EXCEDE en 0.28pp la mediana real (2.22%)
  - Diferencia absoluta: 0.28
  - Diferencia porcentual: 12.6%

- **Rendimiento:** ✅ COMPATIBLE
  - Rendimiento sintético (12.0 t/ha) es MAYOR al real (10.47 t/ha) — +14.6%
  - Diferencia absoluta: 1.53
  - Diferencia porcentual: 14.6%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Sin datos foliares reales disponibles

**Conclusión:** pH: ✅ COMPATIBLE. MO: ⚠️ REVISAR. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Plátano

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.5] (media 6.5)
- Materia orgánica mínima: 3.0%
- Rendimiento promedio: 15.0 t/ha
- Textura óptima: Franco
- Tipo de suelo: Franco;Franco-Arcilloso

### Real Caribe

**pH:**
- Promedio: 6.1200 | Mediana: 6.22 | p10: 4.6000 | p90: 7.6400
- N registros suelos: 704

**Materia Orgánica:**
- Promedio: 1.8100% | Mediana: 1.69% | p10: 0.9000% | p90: 2.7900%

**Rendimiento:**
- Promedio real: 7.4600 t/ha

**Drenaje predominante:** Regular drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 2.70% | P: 0.26% | K: 2.89%
- N registros foliares: 74

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [5.5, 7.5] contiene la mediana real (6.22)
  - Diferencia absoluta: 0.28

- **Materia Orgánica:** ❌ INCOMPATIBLE
  - MO mínima sintética (3.0%) EXCEDE en 1.31pp la mediana real (1.69%)
  - Diferencia absoluta: 1.31
  - Diferencia porcentual: 77.5%

- **Rendimiento:** ❌ INCOMPATIBLE
  - Rendimiento sintético (15.0 t/ha) es MAYOR al real (7.46 t/ha) — +101.1%
  - Diferencia absoluta: 7.54
  - Diferencia porcentual: 101.1%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=2.7%, P=0.26%, K=2.89%

**Conclusión:** pH: ✅ COMPATIBLE. MO: ❌ INCOMPATIBLE. Rendimiento sintético MAYOR que real. Drenaje predominante: Regular drenaje. Topografía: Plano.

---

## Cacao

### Perfil Sintético (usado actualmente)

- pH: [5.0, 7.0] (media 6.0)
- Materia orgánica mínima: 3.5%
- Rendimiento promedio: 1.2 t/ha
- Textura óptima: Franco-Arcilloso
- Tipo de suelo: Franco-Arcilloso

### Real Caribe

**pH:**
- Promedio: 5.8100 | Mediana: 5.80 | p10: 4.7200 | p90: 6.8600
- N registros suelos: 908

**Materia Orgánica:**
- Promedio: 2.1300% | Mediana: 1.90% | p10: 1.1000% | p90: 3.4700%

**Rendimiento:**
- Promedio real: 0.5700 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Pendiente

**Perfil Foliar (N-P-K):**
- N: 1.85% | P: 0.19% | K: 1.81%
- N registros foliares: 172

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [5.0, 7.0] contiene la mediana real (5.8)
  - Diferencia absoluta: 0.2

- **Materia Orgánica:** ❌ INCOMPATIBLE
  - MO mínima sintética (3.5%) EXCEDE en 1.6pp la mediana real (1.9%)
  - Diferencia absoluta: 1.6
  - Diferencia porcentual: 84.2%

- **Rendimiento:** ❌ INCOMPATIBLE
  - Rendimiento sintético (1.2 t/ha) es MAYOR al real (0.57 t/ha) — +110.5%
  - Diferencia absoluta: 0.63
  - Diferencia porcentual: 110.5%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=1.85%, P=0.19%, K=1.81%

**Conclusión:** pH: ✅ COMPATIBLE. MO: ❌ INCOMPATIBLE. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Pendiente.

---

## Algodón

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.5] (media 6.5)
- Materia orgánica mínima: 1.5%
- Rendimiento promedio: 2.5 t/ha
- Textura óptima: Franco
- Tipo de suelo: Franco;Franco-Arenoso

### Real Caribe

**pH:**
- Promedio: 6.8000 | Mediana: 6.71 | p10: 5.8000 | p90: 8.0000
- N registros suelos: 18

**Materia Orgánica:**
- Promedio: 2.1600% | Mediana: 2.08% | p10: 1.2600% | p90: 3.0200%

**Rendimiento:**
- Promedio real: 1.6700 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar:** Sin datos foliares disponibles para este cultivo

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [5.5, 7.5] contiene la mediana real (6.71)
  - Diferencia absoluta: 0.21

- **Materia Orgánica:** ✅ COMPATIBLE
  - MO mínima sintética (1.5%) ≤ la mediana real (2.08%)
  - Diferencia absoluta: -0.58
  - Diferencia porcentual: -27.9%

- **Rendimiento:** ⚠️ REVISAR
  - Rendimiento sintético (2.5 t/ha) es MAYOR al real (1.67 t/ha) — +49.7%
  - Diferencia absoluta: 0.83
  - Diferencia porcentual: 49.7%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Sin datos foliares reales disponibles

**Conclusión:** pH: ✅ COMPATIBLE. MO: ✅ COMPATIBLE. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Sorgo

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.5] (media 6.5)
- Materia orgánica mínima: 1.5%
- Rendimiento promedio: 3.5 t/ha
- Textura óptima: Franco-Arenoso
- Tipo de suelo: Franco;Franco-Arenoso

### Real Caribe

**pH:**
- Promedio: 6.5100 | Mediana: 6.39 | p10: 5.4900 | p90: 7.7800
- N registros suelos: 247

**Materia Orgánica:**
- Promedio: 2.0400% | Mediana: 1.81% | p10: 0.8300% | p90: 3.3700%

**Rendimiento:**
- Promedio real: 1.9800 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar:** Sin datos foliares disponibles para este cultivo

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [5.5, 7.5] contiene la mediana real (6.39)
  - Diferencia absoluta: 0.11

- **Materia Orgánica:** ✅ COMPATIBLE
  - MO mínima sintética (1.5%) ≤ la mediana real (1.81%)
  - Diferencia absoluta: -0.31
  - Diferencia porcentual: -17.1%

- **Rendimiento:** ⚠️ REVISAR
  - Rendimiento sintético (3.5 t/ha) es MAYOR al real (1.98 t/ha) — +76.8%
  - Diferencia absoluta: 1.52
  - Diferencia porcentual: 76.8%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Sin datos foliares reales disponibles

**Conclusión:** pH: ✅ COMPATIBLE. MO: ✅ COMPATIBLE. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Palma

### Perfil Sintético (usado actualmente)

- pH: [4.5, 7.0] (media 5.75)
- Materia orgánica mínima: 3.0%
- Rendimiento promedio: 20.0 t/ha
- Textura óptima: Franco-Arcilloso
- Tipo de suelo: Franco-Arcilloso;Arcilloso

### Real Caribe

**pH:**
- Promedio: 6.3700 | Mediana: 6.42 | p10: 5.2000 | p90: 7.5900
- N registros suelos: 131

**Materia Orgánica:**
- Promedio: 1.3900% | Mediana: 1.17% | p10: 0.5600% | p90: 2.3300%

**Rendimiento:**
- Promedio real: 3.1800 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 2.47% | P: 0.17% | K: 1.02%
- N registros foliares: 100

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - Rango sintético [4.5, 7.0] contiene la mediana real (6.42)
  - Diferencia absoluta: 0.67

- **Materia Orgánica:** ❌ INCOMPATIBLE
  - MO mínima sintética (3.0%) EXCEDE en 1.83pp la mediana real (1.17%)
  - Diferencia absoluta: 1.83
  - Diferencia porcentual: 156.4%

- **Rendimiento:** ❌ INCOMPATIBLE
  - Rendimiento sintético (20.0 t/ha) es MAYOR al real (3.18 t/ha) — +528.9%
  - Diferencia absoluta: 16.82
  - Diferencia porcentual: 528.9%

- **Textura/Drenaje:** ⚠️ REVISAR
  - Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

- **Perfil Foliar:** ⚠️ REVISAR
  - Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=2.47%, P=0.17%, K=1.02%

**Conclusión:** pH: ✅ COMPATIBLE. MO: ❌ INCOMPATIBLE. Rendimiento sintético MAYOR que real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Recomendaciones Priorizadas

### Prioridad Alta — Ajustar inmediatamente

1. **Rendimiento — Maíz:** Rendimiento sintético (4.2 t/ha) es MAYOR al real (2.29 t/ha) — +83.4%
   - Diferencia: 1.91
   - Diferencia %: 83.4%

1. **Materia Orgánica — Arroz:** MO mínima sintética (2.5%) EXCEDE en 1.05pp la mediana real (1.45%)
   - Diferencia: 1.05
   - Diferencia %: 72.4%

1. **Materia Orgánica — Plátano:** MO mínima sintética (3.0%) EXCEDE en 1.31pp la mediana real (1.69%)
   - Diferencia: 1.31
   - Diferencia %: 77.5%

1. **Rendimiento — Plátano:** Rendimiento sintético (15.0 t/ha) es MAYOR al real (7.46 t/ha) — +101.1%
   - Diferencia: 7.54
   - Diferencia %: 101.1%

1. **Materia Orgánica — Cacao:** MO mínima sintética (3.5%) EXCEDE en 1.6pp la mediana real (1.9%)
   - Diferencia: 1.6
   - Diferencia %: 84.2%

1. **Rendimiento — Cacao:** Rendimiento sintético (1.2 t/ha) es MAYOR al real (0.57 t/ha) — +110.5%
   - Diferencia: 0.63
   - Diferencia %: 110.5%

1. **Materia Orgánica — Palma:** MO mínima sintética (3.0%) EXCEDE en 1.83pp la mediana real (1.17%)
   - Diferencia: 1.83
   - Diferencia %: 156.4%

1. **Rendimiento — Palma:** Rendimiento sintético (20.0 t/ha) es MAYOR al real (3.18 t/ha) — +528.9%
   - Diferencia: 16.82
   - Diferencia %: 528.9%

### Prioridad Media

1. **Materia Orgánica — Maíz:** MO mínima sintética (2.0%) EXCEDE en 0.34pp la mediana real (1.66%)

1. **Textura/Drenaje — Maíz:** Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

1. **Perfil Foliar — Maíz:** Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=2.78%, P=0.34%, K=2.46%

1. **Textura/Drenaje — Yuca:** Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

1. **Perfil Foliar — Yuca:** Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=4.0%, P=0.33%, K=1.33%

1. **Rendimiento — Arroz:** Rendimiento sintético (5.8 t/ha) es MAYOR al real (4.13 t/ha) — +40.4%

1. **Textura/Drenaje — Arroz:** Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

1. **Perfil Foliar — Arroz:** Perfil sintético no incluye N-P-K foliar. Datos reales disponibles: N=1.4%, P=0.21%, K=1.76%

1. **Rendimiento — Frijol:** Rendimiento sintético (1.8 t/ha) es MAYOR al real (1.29 t/ha) — +39.5%

1. **Textura/Drenaje — Frijol:** Perfil sintético no incluye drenaje ni topografía. Real: drenaje=N/A, topografía=N/A. Se recomienda agregar estas variables.

### Prioridad Baja

1. **pH — Maíz:** Rango sintético [5.5, 7.5] contiene la mediana real (6.95)

1. **pH — Yuca:** Rango sintético [4.5, 8.0] contiene la mediana real (6.18)

1. **Materia Orgánica — Yuca:** MO mínima sintética (1.0%) ≤ la mediana real (1.55%)

1. **Rendimiento — Yuca:** Rendimiento sintético (12.5 t/ha) es MAYOR al real (11.12 t/ha) — +12.4%

1. **pH — Arroz:** Rango sintético [5.0, 7.0] contiene la mediana real (6.42)

## Metodología

- **Perfiles sintéticos:** `backend/app/ml/crops_requirements.csv` — rangos basados en literatura agronómica global + NASA POWER
- **Datos reales Caribe:** Procesados del EVA (producción), Suelos (fisicoquímicos) y Foliar (tejido) para 7 departamentos del Caribe colombiano
- **Indicadores:** pH, materia orgánica, rendimiento, drenaje, topografía, perfil foliar N-P-K
- **Criterios de clasificación:**
  - COMPATIBLE: rango sintético contiene mediana real o mínimo ≤ mediana real
  - REVISAR: diferencia moderada > 0.5 unidades o falta variable
  - INCOMPATIBLE: diferencia severa o sobreestimación > 80%
- **No se realizaron joins entre datasets** — toda comparación es a nivel agregado por cultivo
- **Fecha de análisis:** 2026-06-09
