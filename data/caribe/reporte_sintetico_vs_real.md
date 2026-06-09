# Reporte de Comparación: Perfiles Sintéticos vs. Real Caribe Colombiano

**Fecha:** 2026-06-09  |  **Región:** Caribe Colombiano (7 departamentos)

---

## Resumen Ejecutivo

Se compararon los 10 perfiles sintéticos de cultivos del recomendador (`crops_requirements.csv`) 
contra datos reales del Caribe colombiano extraídos de EVA (producción), Suelos (análisis fisicoquímicos) 
y Foliar (tejido vegetal). El objetivo es identificar qué perfiles son realistas y cuáles necesitan ajuste.

- **pH compatible:** 10/10 cultivos tienen rango sintético que contiene la mediana real Caribe
- **MO realista:** 4/10 cultivos tienen MO mínima sintética alcanzable en el Caribe
- **Rendimiento sobreestimado:** 10/10 cultivos tienen rendimiento sintético mayor al real
- **Drenaje:** 0/10 perfiles sintéticos incluyen información de drenaje — oportunidad de mejora
- **Topografía:** 0/10 perfiles incluyen topografía — oportunidad de mejora
- **Perfil foliar:** 0/10 perfiles sintéticos incluyen valores foliares de N, P, K

### Principales diferencias encontradas

1. **pH — Ñame**: distancia de 0.73 entre pH medio sintético y real
2. **pH — Palma**: distancia de 0.62
3. **MO — Cacao**: mínima sintética (3.5) muy por encima de la mediana real (1.9)
4. **MO — Plátano**: mínima sintética (3.0) por encima de la mediana real (1.69)
5. **Rendimiento**: los sintéticos sobreestiman sistemáticamente vs. real Caribe (especialmente Algodón, Frijol, Arroz)

---

## Tabla Comparativa General

| Cultivo | pH sint | pH real med | pH ok? | MO sint min | MO real med | MO ok? | Rto sint | Rto real | Drenaje Caribe | Topografía Caribe | N foliar | P foliar | K foliar | N registros suelo |
|---------|---------|-------------|--------|-------------|-------------|--------|----------|----------|----------------|-------------------|----------|----------|----------|------------------|
| Maíz            |  5.5-7.5 |         7.0 | ✅ |         2.0 |         1.7 | ❌ |      4.2 |      2.1 | Buen drenaje         | Plano             |      2.8 |     0.34 |      2.5 |              964 |
| Yuca            |  4.5-8.0 |         6.2 | ✅ |         1.0 |         1.6 | ✅ |     12.5 |     10.2 | Buen drenaje         | Plano             |      4.0 |     0.33 |      1.3 |              358 |
| Arroz           |  5.0-7.0 |         6.4 | ✅ |         2.5 |         1.4 | ❌ |      5.8 |      3.7 | Buen drenaje         | Plano             |      1.4 |     0.21 |      1.8 |              292 |
| Frijol          |  5.5-7.0 |         6.1 | ✅ |         1.5 |         2.2 | ✅ |      1.8 |      1.2 | Buen drenaje         | Plano             |      4.7 |     0.39 |      1.9 |               32 |
| Ñame            |  5.5-7.0 |         6.8 | ✅ |         2.5 |         2.2 | ❌ |     12.0 |      9.2 | Buen drenaje         | Plano             |        - |        - |        - |              269 |
| Plátano         |  5.5-7.5 |         6.2 | ✅ |         3.0 |         1.7 | ❌ |     15.0 |      7.4 | Regular drenaje      | Plano             |      2.7 |     0.26 |      2.9 |              704 |
| Cacao           |  5.0-7.0 |         5.8 | ✅ |         3.5 |         1.9 | ❌ |      1.2 |      0.5 | Buen drenaje         | Pendiente         |      1.9 |     0.19 |      1.8 |              908 |
| Algodón         |  5.5-7.5 |         6.7 | ✅ |         1.5 |         2.1 | ✅ |      2.5 |      1.2 | Buen drenaje         | Plano             |        - |        - |        - |               18 |
| Sorgo           |  5.5-7.5 |         6.4 | ✅ |         1.5 |         1.8 | ✅ |      3.5 |      1.7 | Buen drenaje         | Plano             |        - |        - |        - |              247 |
| Palma           |  4.5-7.0 |         6.4 | ✅ |         3.0 |         1.2 | ❌ |     20.0 |      3.1 | Buen drenaje         | Plano             |      2.5 |     0.17 |      1.0 |              131 |

---

## Maíz

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.5] (media 6.5)
- Materia orgánica mínima: 2.0%
- Rendimiento promedio: 4.2 t/ha
- Textura óptima: Franco
- Tipo de suelo: Franco;Franco-Arcilloso
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 7.0032 | Mediana: 6.95 | p10: 5.5 | p90: 8.27
- N registros: 964

**Materia Orgánica:**
- Promedio: 1.933% | Mediana: 1.66% | p10: 0.7384% | p90: 3.3114%

**Rendimiento:**
- Promedio real: 2.1135 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 2.77% | P: 0.34% | K: 2.46%
- N registros foliares: 24

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [5.5, 7.5] CONTIENE la mediana real (6.95) | Distancia entre pH medio sintético (6.5) y real (7.0032): 0.5
- **MO:** ⚠️ REVISAR
  - MO mínima sintética (2.0) EXCEDE la mediana real (1.66) → SOBREESTIMADA
- **Rendimiento:** Rendimiento sintético (4.2 t/ha) es MAYOR al real (2.11 t/ha) — diferencia de 99%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: SOBREESTIMADA (sintético min=2.0, real p10=0.7384, mediana=1.66). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Yuca

### Perfil Sintético (usado actualmente)

- pH: [4.5, 8.0] (media 6.25)
- Materia orgánica mínima: 1.0%
- Rendimiento promedio: 12.5 t/ha
- Textura óptima: Franco-Arenoso
- Tipo de suelo: Franco-Arenoso;Franco
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 6.3596 | Mediana: 6.18 | p10: 5.247 | p90: 7.81
- N registros: 358

**Materia Orgánica:**
- Promedio: 1.8888% | Mediana: 1.55% | p10: 0.565% | p90: 3.4994%

**Rendimiento:**
- Promedio real: 10.1543 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 4.0% | P: 0.33% | K: 1.33%
- N registros foliares: 104

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [4.5, 8.0] CONTIENE la mediana real (6.18) | Distancia entre pH medio sintético (6.2) y real (6.3596): 0.11
- **MO:** ✅ REALISTA
  - MO mínima sintética (1.0) ≤ mediana real (1.55) → aceptable
- **Rendimiento:** Rendimiento sintético (12.5 t/ha) es MAYOR al real (10.15 t/ha) — diferencia de 23%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: Realista (sintético min=1.0, real p10=0.565, mediana=1.55). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Arroz

### Perfil Sintético (usado actualmente)

- pH: [5.0, 7.0] (media 6.0)
- Materia orgánica mínima: 2.5%
- Rendimiento promedio: 5.8 t/ha
- Textura óptima: Arcilloso
- Tipo de suelo: Arcilloso;Franco-Arcilloso
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 6.389 | Mediana: 6.425 | p10: 5.157 | p90: 7.379
- N registros: 292

**Materia Orgánica:**
- Promedio: 1.5637% | Mediana: 1.45% | p10: 0.7414% | p90: 2.489%

**Rendimiento:**
- Promedio real: 3.6798 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 1.4% | P: 0.21% | K: 1.76%
- N registros foliares: 183

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [5.0, 7.0] CONTIENE la mediana real (6.425) | Distancia entre pH medio sintético (6.0) y real (6.389): 0.39
- **MO:** ⚠️ REVISAR
  - MO mínima sintética (2.5) EXCEDE la mediana real (1.45) → SOBREESTIMADA
- **Rendimiento:** Rendimiento sintético (5.8 t/ha) es MAYOR al real (3.68 t/ha) — diferencia de 58%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: SOBREESTIMADA (sintético min=2.5, real p10=0.7414, mediana=1.45). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Frijol

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.0] (media 6.25)
- Materia orgánica mínima: 1.5%
- Rendimiento promedio: 1.8 t/ha
- Textura óptima: Franco
- Tipo de suelo: Franco;Franco-Arenoso
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 6.2187 | Mediana: 6.12 | p10: 5.052 | p90: 7.437
- N registros: 32

**Materia Orgánica:**
- Promedio: 2.2582% | Mediana: 2.1945% | p10: 1.0151% | p90: 3.063%

**Rendimiento:**
- Promedio real: 1.1923 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 4.65% | P: 0.39% | K: 1.9%
- N registros foliares: 297

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [5.5, 7.0] CONTIENE la mediana real (6.12) | Distancia entre pH medio sintético (6.2) y real (6.2187): 0.03
- **MO:** ✅ REALISTA
  - MO mínima sintética (1.5) ≤ mediana real (2.1945) → aceptable
- **Rendimiento:** Rendimiento sintético (1.8 t/ha) es MAYOR al real (1.19 t/ha) — diferencia de 51%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: Realista (sintético min=1.5, real p10=1.0151, mediana=2.1945). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Ñame

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.0] (media 6.25)
- Materia orgánica mínima: 2.5%
- Rendimiento promedio: 12.0 t/ha
- Textura óptima: Franco-Arcilloso
- Tipo de suelo: Franco-Arcilloso;Franco
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 6.9805 | Mediana: 6.85 | p10: 6.05 | p90: 8.272
- N registros: 269

**Materia Orgánica:**
- Promedio: 2.4482% | Mediana: 2.22% | p10: 1.4088% | p90: 3.5254%

**Rendimiento:**
- Promedio real: 9.2145 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar:** Sin datos foliares disponibles para este cultivo

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [5.5, 7.0] CONTIENE la mediana real (6.85) | Distancia entre pH medio sintético (6.2) y real (6.9805): 0.73
- **MO:** ⚠️ REVISAR
  - MO mínima sintética (2.5) EXCEDE la mediana real (2.22) → SOBREESTIMADA
- **Rendimiento:** Rendimiento sintético (12.0 t/ha) es MAYOR al real (9.21 t/ha) — diferencia de 30%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: SOBREESTIMADA (sintético min=2.5, real p10=1.4088, mediana=2.22). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Plátano

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.5] (media 6.5)
- Materia orgánica mínima: 3.0%
- Rendimiento promedio: 15.0 t/ha
- Textura óptima: Franco
- Tipo de suelo: Franco;Franco-Arcilloso
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 6.1213 | Mediana: 6.22 | p10: 4.6 | p90: 7.637
- N registros: 704

**Materia Orgánica:**
- Promedio: 1.8094% | Mediana: 1.69% | p10: 0.9% | p90: 2.787%

**Rendimiento:**
- Promedio real: 7.3715 t/ha

**Drenaje predominante:** Regular drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 2.7% | P: 0.26% | K: 2.89%
- N registros foliares: 74

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [5.5, 7.5] CONTIENE la mediana real (6.22) | Distancia entre pH medio sintético (6.5) y real (6.1213): 0.38
- **MO:** ⚠️ REVISAR
  - MO mínima sintética (3.0) EXCEDE la mediana real (1.69) → SOBREESTIMADA
- **Rendimiento:** Rendimiento sintético (15.0 t/ha) es MAYOR al real (7.37 t/ha) — diferencia de 103%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: SOBREESTIMADA (sintético min=3.0, real p10=0.9, mediana=1.69). Rendimiento sintético > real. Drenaje predominante: Regular drenaje. Topografía: Plano.

---

## Cacao

### Perfil Sintético (usado actualmente)

- pH: [5.0, 7.0] (media 6.0)
- Materia orgánica mínima: 3.5%
- Rendimiento promedio: 1.2 t/ha
- Textura óptima: Franco-Arcilloso
- Tipo de suelo: Franco-Arcilloso
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 5.8078 | Mediana: 5.8 | p10: 4.72 | p90: 6.86
- N registros: 908

**Materia Orgánica:**
- Promedio: 2.1313% | Mediana: 1.9% | p10: 1.099% | p90: 3.4733%

**Rendimiento:**
- Promedio real: 0.5498 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Pendiente

**Perfil Foliar (N-P-K):**
- N: 1.85% | P: 0.19% | K: 1.81%
- N registros foliares: 172

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [5.0, 7.0] CONTIENE la mediana real (5.8) | Distancia entre pH medio sintético (6.0) y real (5.8078): 0.19
- **MO:** ⚠️ REVISAR
  - MO mínima sintética (3.5) EXCEDE la mediana real (1.9) → SOBREESTIMADA
- **Rendimiento:** Rendimiento sintético (1.2 t/ha) es MAYOR al real (0.55 t/ha) — diferencia de 118%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: SOBREESTIMADA (sintético min=3.5, real p10=1.099, mediana=1.9). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Pendiente.

---

## Algodón

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.5] (media 6.5)
- Materia orgánica mínima: 1.5%
- Rendimiento promedio: 2.5 t/ha
- Textura óptima: Franco
- Tipo de suelo: Franco;Franco-Arenoso
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 6.7983 | Mediana: 6.71 | p10: 5.8 | p90: 7.995
- N registros: 18

**Materia Orgánica:**
- Promedio: 2.1565% | Mediana: 2.085% | p10: 1.2617% | p90: 3.0172%

**Rendimiento:**
- Promedio real: 1.1566 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar:** Sin datos foliares disponibles para este cultivo

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [5.5, 7.5] CONTIENE la mediana real (6.71) | Distancia entre pH medio sintético (6.5) y real (6.7983): 0.3
- **MO:** ✅ REALISTA
  - MO mínima sintética (1.5) ≤ mediana real (2.085) → aceptable
- **Rendimiento:** Rendimiento sintético (2.5 t/ha) es MAYOR al real (1.16 t/ha) — diferencia de 116%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: Realista (sintético min=1.5, real p10=1.2617, mediana=2.085). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Sorgo

### Perfil Sintético (usado actualmente)

- pH: [5.5, 7.5] (media 6.5)
- Materia orgánica mínima: 1.5%
- Rendimiento promedio: 3.5 t/ha
- Textura óptima: Franco-Arenoso
- Tipo de suelo: Franco;Franco-Arenoso
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 6.5102 | Mediana: 6.39 | p10: 5.486 | p90: 7.78
- N registros: 247

**Materia Orgánica:**
- Promedio: 2.0373% | Mediana: 1.81% | p10: 0.826% | p90: 3.3734%

**Rendimiento:**
- Promedio real: 1.7483 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar:** Sin datos foliares disponibles para este cultivo

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [5.5, 7.5] CONTIENE la mediana real (6.39) | Distancia entre pH medio sintético (6.5) y real (6.5102): 0.01
- **MO:** ✅ REALISTA
  - MO mínima sintética (1.5) ≤ mediana real (1.81) → aceptable
- **Rendimiento:** Rendimiento sintético (3.5 t/ha) es MAYOR al real (1.75 t/ha) — diferencia de 100%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: Realista (sintético min=1.5, real p10=0.826, mediana=1.81). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Palma

### Perfil Sintético (usado actualmente)

- pH: [4.5, 7.0] (media 5.75)
- Materia orgánica mínima: 3.0%
- Rendimiento promedio: 20.0 t/ha
- Textura óptima: Franco-Arcilloso
- Tipo de suelo: Franco-Arcilloso;Arcilloso
- Temperatura: ? – ?°C
- Precipitación: ? – ? mm

### Real Caribe

**pH:**
- Promedio: 6.3735 | Mediana: 6.42 | p10: 5.2 | p90: 7.59
- N registros: 131

**Materia Orgánica:**
- Promedio: 1.3945% | Mediana: 1.1745% | p10: 0.5618% | p90: 2.3305%

**Rendimiento:**
- Promedio real: 3.1143 t/ha

**Drenaje predominante:** Buen drenaje
**Topografía predominante:** Plano

**Perfil Foliar (N-P-K):**
- N: 2.47% | P: 0.17% | K: 1.02%
- N registros foliares: 100

### Diagnóstico

- **pH:** ✅ COMPATIBLE
  - El rango sintético [4.5, 7.0] CONTIENE la mediana real (6.42) | Distancia entre pH medio sintético (5.8) y real (6.3735): 0.62
- **MO:** ⚠️ REVISAR
  - MO mínima sintética (3.0) EXCEDE la mediana real (1.1745) → SOBREESTIMADA
- **Rendimiento:** Rendimiento sintético (20.0 t/ha) es MAYOR al real (3.11 t/ha) — diferencia de 542%
- **Conclusión:** pH: Compatible con rango real Caribe. MO: SOBREESTIMADA (sintético min=3.0, real p10=0.5618, mediana=1.1745). Rendimiento sintético > real. Drenaje predominante: Buen drenaje. Topografía: Plano.

---

## Recomendaciones

### Prioridad Alta — Ajustar inmediatamente

1. **Materia Orgánica — Cacao (3.5%) y Plátano (3.0%):** La MO mínima sintética está muy por encima de la mediana real caribe. 
   Se sugiere reducir a 1.5% y 1.0% respectivamente, o mejor aún, usar un rango en lugar de solo mínimo.

2. **Rendimientos:** Todos los cultivos excepto Plátano y Ñame tienen rendimiento sintético mayor al real Caribe. 
   El caso más crítico es Algodón (sintético 2.5 vs real 1.16 t/ha, +116%). Ajustar con promedios reales regionales.

3. **Agregar drenaje y topografía a los perfiles:** Ningún perfil sintético incluye estas variables, y los datos reales 
   muestran patrones claros (p.ej. Arroz en plano/regular drenaje, Cacao en pendiente/buen drenaje).

### Prioridad Media

4. **pH — Ñame y Arroz:** El rango sintético de Ñame (5.5-7.0) no cubre bien el p90 real (8.27 — suelos costeros 
   del Caribe tienden a ser alcalinos). Arroz sintético es más ácido (5.0-7.0) que la mediana real (6.43).

5. **Agregar perfil foliar de referencia:** Los perfiles sintéticos no tienen N, P, K foliares. Los datos Caribe 
   muestran diferencias importantes entre cultivos (p.ej. Yuca tiene N foliar ~4.0%, Arroz ~1.4%).

### Prioridad Baja

6. **Suelo y textura:** Los datos de textura real en suelos están mayormente "Por establecer", por lo que la 
   textura óptima sintética es aceptable como referencia general hasta obtener mejor data de campo.

7. **Rangos de pH para Yuca y Cacao:** Son compatibles con la realidad caribe. Ajustes menores.

---

## Metodología

- **Perfiles sintéticos:** `backend/app/ml/crops_requirements.csv` — rangos basados en literatura agronómica global + NASA POWER
- **Datos reales Caribe:** Procesados del EVA (producción), Suelos (fisicoquímicos) y Foliar (tejido) para 7 departamentos del Caribe colombiano
- **Indicadores:** pH, materia orgánica, rendimiento, drenaje, topografía, perfil foliar N-P-K
- **Fecha de análisis:** 2026-06-09