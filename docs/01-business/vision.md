# Visión del Proyecto

## Problema

Los pequeños y medianos productores del Caribe colombiano enfrentan una toma de decisiones agrícola basada principalmente en tradición y experiencia empírica, sin acceso a herramientas cuantitativas que integren datos climáticos, edáficos y satelitales. Esto genera:

- **Baja productividad** por siembra de cultivos no aptos para las condiciones específicas de cada parcela.
- **Pérdidas económicas** por eventos climáticos no anticipados (sequías, lluvias extremas).
- **Subutilización de datos públicos** como NASA POWER, Sentinel-2 y SoilGrids que podrían informar decisiones agronómicas.
- **Brecha tecnológica** entre la investigación agropecuaria (AGROSAVIA, EVA Caribe) y el productor en campo.

## Solución propuesta

**AgroCaribe AI** es una plataforma web de análisis agrícola que integra inteligencia artificial, datos satelitales, climáticos y de suelo para generar recomendaciones de cultivo precisas para la región Caribe colombiana.

El sistema permite a investigadores y productores:

1. **Seleccionar una parcela** en un mapa interactivo.
2. **Obtener datos automáticos** de suelo (ISRIC SoilGrids), clima (OpenMeteo + NASA POWER) e índices satelitales (NDVI/NDWI de Sentinel-2).
3. **Recibir recomendaciones** de los 10 cultivos más aptos para esa ubicación, con puntuación y justificación agronómica.
4. **Proyectar rendimiento** a 6 meses bajo diferentes escenarios de riego y fertilización.
5. **Consultar al AgroAsesor**, un chatbot con RAG sobre 40+ documentos agronómicos del Caribe colombiano.

## Objetivos específicos

1. Analizar variables agrícolas, climáticas y de suelo relevantes para la recomendación de cultivos en el Caribe colombiano.
2. Diseñar e implementar una arquitectura web escalable (React + FastAPI + PostGIS).
3. Desarrollar un modelo híbrido de recomendación (reglas agronómicas + HistGradientBoosting) con precisión superior al 80% en datos sintéticos.
4. Validar el modelo contra datos reales de campo (EVA Caribe) y documentar la brecha sintético-real.
5. Integrar un asistente conversacional con RAG sobre documentación agronómica del Caribe.

## Usuarios objetivo

| Perfil | Necesidad |
|--------|-----------|
| **Investigador agrícola** | Validar hipótesis, acceder a datos integrados, generar reportes técnicos |
| **Productor tecnificado** | Decidir qué cultivar, cuándo sembrar, cómo regar |
| **Extensionista rural** | Llevar recomendaciones basadas en datos a pequeños productores |

## Alcance geográfico

Región Caribe colombiana: Atlántico, Bolívar, Cesar, Córdoba, La Guajira, Magdalena, Sucre.

---

**Documentación relacionada:** [[requisitos]] — [[vision-general]]
**Referencia histórica:** [[PLAN_DESARROLLO]] — [[DOCUMENTACION_INICIAL]]
