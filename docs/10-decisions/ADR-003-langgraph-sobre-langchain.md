# ADR-003: LangGraph sobre LangChain simple

## Contexto

El chatbot AgroAsesor necesitaba manejar conversaciones multi-turno con estado persistente, ejecutar herramientas (consultar DB, clima, sensores), y tener branching condicional según la intención del usuario. Las alternativas eran:

1. **LangChain simple** — Chains lineales o `LCEL` (LangChain Expression Language). Bueno para RAG básico, pero sin estado entre turnos ni branching nativo.
2. **LangGraph** — Framework explícito de grafos con estado, nodos y aristas condicionales.
3. **Keyword matching + LLM directo** — Sin framework de agentes, todo orquestado manualmente.

LangChain simple no soporta stateful graphs multi-turno sin workarounds (inyectar historial manualmente como contexto). Para branching condicional (clasificar intent → RAG → consultar DB → generar respuesta), necesitábamos un grafo conectado.

## Decisión

**LangGraph 0.3.x** para el agente conversacional, con 3 nodos en el StateGraph:

- **Nodo Orquestador** — Clasifica intent del usuario (17 categorías: maíz, yuca, riego, plagas, etc.), decide qué herramientas invocar.
- **Nodo de Herramientas** — Ejecuta RAG TF-IDF, consulta DB (último análisis, sensores), clima via OpenMeteo.
- **Nodo Generador** — Llama a Ollama (gemma2:2b) con el contexto recogido para producir la respuesta final.

Razones:

1. **Estado multi-turno explícito** — `AgentState` (TypedDict con `user_message`, `history_text`, `rag_results`, `db_context`, `intent`, `final_response`) se actualiza nodo por nodo y persiste en PostgreSQL (tablas `conversaciones` + `mensajes`).
2. **Branching condicional nativo** — `add_conditional_edges()` permite routing dinámico: si el intent es "riego", inyecta contexto del servicio de irrigación; si es "clima", llama a OpenMeteo.
3. **Herramientas integradas** — Cada tool es una función Python con tipado, invocable desde el grafo. `get_last_analysis`, `get_history_summary`, `get_sensor_status`.
4. **Sistema de 3 capas de respaldo** — LangGraph Agent → LLM Directo (sin herramientas) → Keyword Fallback (17 categorías), garantizando que el chat nunca falle aunque Ollama esté caído.
5. **Persistencia nativa** — LangGraph guarda el estado del grafo en DB entre requests, permitiendo hilos de conversación continuos.

## Consecuencias

**Positivas:**
- + Estado multi-turno con 3 nodos bien definidos y persistenci a en PostgreSQL
- + Branching condicional nativo para 17 intents de cultivos y temas agronómicos
- + Herramientas integradas (DB, clima, sensores, RAG) sin glue code externo
- + Sistema de 3 capas de respaldo: LangGraph → LLM directo → Keyword fallback
- + Depuración visual del grafo con `get_graph().print_ascii()`

**Negativas:**
- - Complejidad inicial: LangGraph 0.3+ tuvo cambios breaking en la API respecto a 0.1/0.2 (StateGraph vs Graph, add_conditional_edges firma)
- - Overhead para casos simples: para un "hola" sin herramientas, el grafo igual pasa por 3 nodos
- - Menos tutoriales y ejemplos en español que LangChain clásico
- - La dependencia `langchain-core` es necesaria pero añade ~50+ dependencias transitivas

## Referencias

- [[backend]] (sección de chatbot)
- [[estrategia]]
