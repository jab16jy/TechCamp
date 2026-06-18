# ADR-004: Ollama local sobre APIs externas

## Contexto

El chatbot AgroAsesor necesitaba un LLM para generar respuestas en lenguaje natural a partir de contexto agronómico (RAG + DB + herramientas). Las opciones consideradas:

1. **OpenAI API (GPT-4o / GPT-4o-mini)** — Mejor calidad de respuesta, pero costo recurrente por token, dependencia de internet, datos enviados a servidores externos.
2. **Claude API (Anthropic)** — Similar a OpenAI: excelente calidad, costos recurrentes, datos viajan a EE.UU.
3. **Ollama local** — Modelo pequeño (gemma2:2b) corriendo en Docker en el mismo servidor. Sin costos, sin dependencia externa, datos nunca salen del servidor.
4. **Sin LLM** — Solo keyword matching. Probado, funcional, pero respuestas rígidas y pobre experiencia de usuario.

El proyecto opera en el Caribe colombiano, donde la conectividad a internet puede ser intermitente. Además, los datos de análisis agrícola (ubicación de parcelas, rendimiento de cultivos) son sensibles para productores locales.

## Decisión

**Ollama (gemma2:2b)** en contenedor Docker local, expuesto en `http://ollama:11434`.

Razones:

1. **Costo cero de inferencia** — Sin costo por token, sin suscripción mensual. El único recurso es CPU/RAM local (~2-4 GB RAM para gemma2:2b).
2. **Funcionamiento offline** — Una vez descargado el modelo (~1.6 GB), el chatbot funciona sin conexión a internet. Crítico para zonas rurales del Caribe.
3. **Privacidad de datos** — Los datos de análisis, ubicaciones de parcelas, y conversaciones nunca salen del servidor Docker. Los productores no firman acuerdos con OpenAI/Anthropic.
4. **Integración simple** — Cliente HTTP vía `httpx` a `http://ollama:11434/api/generate`. Sin SDK complejo, sin API keys, sin autenticación.
5. **Modelo adecuado para el dominio** — gemma2:2b es suficiente para generar respuestas agronómicas con RAG bien poblado (40+ documentos). El LLM no necesita razonamiento complejo; la información factual viene del RAG.
6. **Sistema de 3 capas de respaldo** — Si Ollama no responde (timeout, error), el sistema cae a keyword fallback con 17 categorías. Nunca se rompe la UX.

## Consecuencias

**Positivas:**
- + Sin costos recurrentes de inferencia — el LLM corre en hardware local
- + Privacidad total de datos — ninguna conversación o dato agrícola sale del servidor
- + Offline nativo — funciona sin internet después de la descarga inicial del modelo
- + Integración trivial con Docker Compose (`docker compose up -d` y ya corre)
- + Modelo reemplazable: cambiar `OLLAMA_MODEL` env var para usar llama3, mistral, o modelos futuros

**Negativas:**
- - Calidad de respuesta menor que GPT-4o o Claude Opus — gemma2:2b tiene 2B parámetros vs cientos de miles de millones
- - Requiere ~2-4 GB de RAM dedicada en el servidor para el contenedor Ollama
- - Sin fine-tuning posible con los recursos actuales (se necesitaría GPU para entrenar)
- - Inferencia lenta en CPU: ~5-10 segundos por respuesta vs <1 segundo en APIs cloud
- - gemma2:2b tiene contexto limitado (8192 tokens) — conversaciones muy largas requieren resumen o truncamiento

## Referencias

- [[backend]] (secciones de chatbot y Docker Compose)
- [[07-deployment/]] (servicio ollama en docker-compose.yml)
