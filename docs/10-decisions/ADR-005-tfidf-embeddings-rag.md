# ADR-005: TF-IDF sobre embeddings densos para RAG

## Contexto

El sistema RAG del chatbot AgroAsesor necesita indexar y recuperar contenido de 40+ documentos agronómicos (cultivos, plagas, fertilización, BPA, clima, NDVI, suelos, postcosecha). Los documentos están en Markdown en `backend/data/rag/`, cada uno con múltiples secciones.

Consideramos tres enfoques:

1. **Embeddings densos (OpenAI text-embedding-ada-002 / sentence-transformers all-MiniLM-L6-v2)** — Búsqueda semántica, captura significado, costo por API o GPU para generar embeddings.
2. **TF-IDF con scikit-learn** — Representación vectorial basada en frecuencia de términos, 0 dependencias externas, corre en CPU.
3. **Keyword search puro** — Regex/match de términos. Rápido pero sin ranking semántico ni tolerancia a errores ortográficos.

Los embeddings densos ofrecen mejor captura semántica ("riego por goteo" y "sistema de irrigación" se relacionan aunque no compartan términos), pero introducen dependencias externas (OpenAI API con costo por token, o modelo local como all-MiniLM que requiere ~250 MB de descarga y no es trivial en Docker sin GPU).

## Decisión

**TF-IDF (scikit-learn 1.6+)** con cosine similarity para recuperación de documentos, y keyword search como fallback.

Parámetros del vectorizer: `ngram_range=(1,2)`, `max_features=5000`, `stop_words` personalizadas (términos vacíos en español como artículos, preposiciones).

Razones:

1. **0 dependencias externas** — scikit-learn ya está en `requirements.txt` para el modelo ML. No se necesitan APIs cloud ni modelos adicionales.
2. **Funciona sin GPU** — TF-IDF es puramente CPU. El pipeline completo (vectorizar 40+ docs + cosine similarity) toma <100 ms en un núcleo.
3. **Resultados interpretables** — Los términos con mayor peso TF-IDF son inspeccionables: podemos mostrar al usuario "Documentos encontrados por: maíz, rendimiento, fertilización".
4. **Determinista y reproducible** — Mismo corpus → mismos vectores. Sin sorpresas de modelo semántico. Fácil de debuggear.
5. **Suficiente para el dominio** — El vocabulario agronómico es especializado pero no enorme (~2000-3000 términos relevantes en 40+ docs). La superposición de términos entre consulta y documento es un buen proxy de relevancia.
6. **Fallback integrado** — Cuando TF-IDF no encuentra coincidencias (cosine similarity < threshold), se activa keyword search con scoring por término. Esto cubre consultas muy específicas o jargon local.

## Consecuencias

**Positivas:**
- + Sin dependencias externas: ni APIs cloud (OpenAI), ni modelos locales (sentence-transformers)
- + Sin GPU requerida — corre en CPU con ~100 ms de latencia
- + Resultados interpretables y debuggeables — sabemos exactamente qué términos matchearon
- + Integración trivial con FastAPI — scikit-learn ya importado para HistGradientBoosting
- + Costo cero de inferencia (a diferencia de embeddings via API)
- + Keyword fallback para consultas no capturadas por TF-IDF

**Negativas:**
- - Menor precisión semántica: "riego por goteo" y "sistema de microaspersión" no se relacionan vectorialmente aunque sean conceptos cercanos
- - No captura sinónimos: "abono" y "fertilizante" no matchean automáticamente (se requiere incluir ambos en el doc o en la consulta)
- - Vocabulario controlado: si el usuario escribe "mataburros" (jerga local para herbicida), TF-IDF no lo encontrará a menos que exista en algún documento
- - Sin expansión semántica: no hay embedding que entienda contexto ("lluvia" ≠ "riego" aunque ambos sean agua)
- - Escalabilidad: a 500+ documentos, TF-IDF empieza a degradarse en precisión vs embeddings densos

## Referencias

- [[backend]] (sección RAG en chatbot)
- [[plan-retrain]]
