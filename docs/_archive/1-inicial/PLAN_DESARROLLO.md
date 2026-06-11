---
titulo: "Tecnificación del campo mediante inteligencia artificial para la predicción climática y recomendación de cultivos"
objetivo_general: "Desarrollar un sistema web de apoyo a la toma de decisiones agrícolas que utilice técnicas de inteligencia artificial y datos climáticos para generar recomendaciones de cultivos orientadas a pequeños productores de la región Caribe colombiana."
proyecto: AgroCaribe IA
fecha: Mayo 2026
tags: [plan, cronograma, desarrollo, tesis]
---

## Objetivos Específicos

1. Analizar variables agrícolas, climáticas y de suelo relevantes para la construcción de un sistema de recomendación de cultivos.
2. Diseñar la arquitectura funcional y técnica de la plataforma web para el procesamiento de datos y la generación de recomendaciones.
3. Desarrollar un modelo basado en inteligencia artificial para la recomendación de cultivos a partir de condiciones climáticas y características básicas del terreno.
4. Validar el funcionamiento del sistema mediante pruebas con escenarios representativos de la zona de estudio.

---

## Fase 1: Exploración

| # | Actividad | Semanas |
|:-:|:---|:---:|
| 1 | Revisión de antecedentes sobre sistemas de recomendación agrícola basados en clima, suelo e IA. | 1-2 |
| 2 | Identificación de variables agrícolas, climáticas y de suelo relevantes para la recomendación de cultivos. | 2-3 |
| 3 | Análisis comparativo de fuentes de datos climáticos y evaluación de OpenMeteo como fuente principal. | 3-4 |
| 4 | Revisión de técnicas de modelado predictivo y clasificación aplicables al problema. | 4-5 |
| 5 | Definición de criterios para seleccionar el stack tecnológico y las herramientas de desarrollo. | 5-6 |
| 6 | Selección del stack tecnológico y herramientas de desarrollo. | 6 |
| 7 | **Entregable:** Informe de exploración tecnológica | 6 |

### Cronograma — Exploración

| Actividad | S1 | S2 | S3 | S4 | S5 | S6 |
|:---|---:|:---:|:---:|:---:|:---:|:---:|
| Revisión de antecedentes | █ | █ | | | | |
| Identificación de variables | | █ | █ | | | |
| Análisis fuentes de datos | | | █ | █ | | |
| Revisión técnicas modelado | | | | █ | █ | |
| Definición criterios stack | | | | | █ | █ |
| Selección stack tecnológico | | | | | | █ |
| Entregable | | | | | | ◆ |

---

## Fase 2: Diseño

| # | Actividad | Semanas |
|:-:|:---|:---:|
| 1 | Levantamiento de requerimientos funcionales y no funcionales del sistema. | 7 |
| 2 | Definición de la arquitectura funcional y técnica de la plataforma. | 7-8 |
| 3 | Diseño del flujo lógico de recomendación de cultivos según clima, suelo y reglas de decisión. | 8-9 |
| 4 | Definición de la estructura, fuentes y criterios de depuración del dataset de entrenamiento. | 9-10 |
| 5 | Diseño del protocolo de pruebas y métricas de evaluación del sistema. | 10 |
| 6 | **Entregable:** Diseño del sistema | 10 |

### Cronograma — Diseño

| Actividad | S7 | S8 | S9 | S10 |
|:---|---:|:---:|:---:|:---:|
| Levantamiento de requerimientos | █ | | | |
| Definición arquitectura | █ | █ | | |
| Flujo lógico de recomendación | | █ | █ | |
| Estructura y depuración dataset | | | █ | █ |
| Protocolo de pruebas | | | | █ |
| Entregable | | | | ◆ |

---

## Fase 3: Desarrollo

| # | Actividad | Semanas |
|:-:|:---|:---:|
| 1 | Implementación del backend y servicios de consulta, almacenamiento y procesamiento de datos. | 11-12 |
| 2 | Construcción del pipeline de ingestión de datos climáticos desde OpenMeteo. | 12-13 |
| 3 | Entrenamiento e integración del modelo predictivo climático. | 13-14 |
| 4 | Entrenamiento e integración del modelo de recomendación de cultivos. | 14-15 |
| 5 | Desarrollo de la interfaz web para captura de datos, visualización geográfica y consulta de recomendaciones. | 15-16 |
| 6 | Integración completa de backend, base de datos, modelos y sistema de alertas. | 16-17 |
| 7 | **Entregable:** Prototipo funcional desplegado con Docker Compose | 17 |

### Cronograma — Desarrollo

| Actividad | S11 | S12 | S13 | S14 | S15 | S16 | S17 |
|:---|---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Implementación backend | █ | █ | | | | | |
| Pipeline datos OpenMeteo | | █ | █ | | | | |
| Modelo predictivo climático | | | █ | █ | | | |
| Modelo recomendación cultivos | | | | █ | █ | | |
| Desarrollo interfaz web | | | | | █ | █ | |
| Integración completa | | | | | | █ | █ |
| Entregable | | | | | | | ◆ |

---

## Fase 4: Refinamiento

| # | Actividad | Semanas |
|:-:|:---|:---:|
| 1 | Evaluación del desempeño del modelo predictivo usando datos históricos reales. | 18-19 |
| 2 | Evaluación del modelo de recomendación mediante métricas de clasificación y comparación con escenarios esperados. | 19 |
| 3 | Ajuste final de parámetros, corrección de errores y consolidación de resultados. | 19-20 |
| 4 | Validación de consistencia de las recomendaciones en casos representativos de la región Caribe. | 20 |
| 5 | Ejecución de pruebas funcionales integrales sobre el sistema web. | 20-21 |
| 6 | **Entregable:** Informe de pruebas, métricas y ajustes finales | 21 |

### Cronograma — Refinamiento

| Actividad | S18 | S19 | S20 | S21 |
|:---|---:|:---:|:---:|:---:|
| Evaluación modelo predictivo | █ | █ | | |
| Evaluación modelo recomendación | | █ | | |
| Ajuste parámetros y correcciones | | █ | █ | |
| Validación región Caribe | | | █ | |
| Pruebas funcionales integrales | | | █ | █ |
| Entregable | | | | ◆ |

---

## Línea de Tiempo Consolidada

| Fase | Semanas | Duración |
|:---|---:|:---:|
| **Exploración** | 1 – 6 | 6 semanas |
| **Diseño** | 7 – 10 | 4 semanas |
| **Desarrollo** | 11 – 17 | 7 semanas |
| **Refinamiento** | 18 – 21 | 4 semanas |
| **Total** | 1 – 21 | **21 semanas** |

### Diagrama de Gantt

```mermaid
gantt
    title Cronograma AgroCaribe IA
    dateFormat  YYYY-MM-DD
    axisFormat  %b

    section Exploración
    Revisión antecedentes           :a1, 2026-01-05, 14d
    Identificación variables        :a2, 14d
    Análisis fuentes datos          :a3, 14d
    Técnicas modelado               :a4, 14d
    Definición stack                :a5, 14d
    Entregable                      :milestone, 2026-02-15, 0d

    section Diseño
    Requerimientos                  :b1, 2026-02-16, 7d
    Arquitectura                    :b2, 14d
    Flujo recomendación             :b3, 14d
    Dataset                         :b4, 14d
    Protocolo pruebas               :b5, 7d
    Entregable                      :milestone, 2026-03-15, 0d

    section Desarrollo
    Backend                         :c1, 2026-03-16, 14d
    Pipeline OpenMeteo              :c2, 14d
    Modelo climático                :c3, 14d
    Modelo recomendación            :c4, 14d
    Interfaz web                    :c5, 14d
    Integración                     :c6, 14d
    Entregable                      :milestone, 2026-05-03, 0d

    section Refinamiento
    Evaluación predictivo           :d1, 2026-05-04, 14d
    Evaluación recomendación        :d2, 7d
    Ajustes                         :d3, 14d
    Validación Caribe               :d4, 7d
    Pruebas integrales              :d5, 14d
    Entregable                      :milestone, 2026-05-31, 0d

---

## Referencias

- [[1-inicial/DOCUMENTACION_INICIAL]] — Vision general y fuentes de datos
- [[1-inicial/VALIDACION_SISTEMA]] — Metricas de prueba y validacion
- [[2-backend/TASKS]] — Seguimiento de implementacion por fases
- [[4-arquitectura/VISION_SISTEMA]] — Estado final de la arquitectura
```
