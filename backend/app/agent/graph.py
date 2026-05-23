import logging

from langgraph.graph import StateGraph, START, END
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.state import AgentState
from app.agent.tools import (
    get_last_analysis,
    get_history_summary,
    get_sensor_status,
)
from app.services.rag_service import search_rag
from app.services.llm_service import generate_response as ollama_generate

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "Eres AgroAsesor IA, un asistente agronomico especializado en la region "
    "Caribe colombiana.\n\n"
    "CONOCIMIENTO:\n{rag_knowledge}\n\n"
    "DATOS USUARIO:\n{db_context}\n\n"
    "INSTRUCCIONES: Responde con la info proporcionada. Se conciso. "
    "Usa Markdown. NUNCA inventes datos. Responde en espanol."
)

_KEYWORD_CATEGORIES = {
    "maiz": ["maiz", "maíz", "cereal"],
    "yuca": ["yuca", "mandioca", "casabe"],
    "platano": ["platano", "plátano", "banano"],
    "arroz": ["arroz", "paddy"],
    "cacao": ["cacao", "chocolate"],
    "palma": ["palma", "aceite", "palma aceitera"],
    "name": ["name", "ñame"],
    "frijol": ["frijol", "fríjol", "leguminosa"],
    "algodon": ["algodon", "algodón"],
    "sorgo": ["sorgo"],
    "plagas": ["plaga", "plagas", "enfermedad", "hongo", "insecto", "gusano"],
    "fertilizacion": ["fertiliz", "abono", "nutriente", "npk", "compost"],
    "riego": ["riego", "regar", "agua", "sequia", "sequía", "drenaje"],
    "suelo": ["suelo", "ph", "tierra", "materia organica", "textura"],
    "clima": ["clima", "temperatura", "lluvia", "precipitacion", "humedad"],
    "ndvi": ["ndvi", "satelite", "satélite", "indice vegetacion"],
    "siembra": ["siembra", "sembrar", "epoca", "calendario", "cosecha"],
}


def _extract_keywords(message: str) -> str:
    lower = message.lower()
    matched = []
    for category, terms in _KEYWORD_CATEGORIES.items():
        if any(t in lower for t in terms):
            matched.append(category)
    if matched:
        return " ".join(matched[:3])
    return message.strip()


def create_agent_graph(
    db: AsyncSession,
    user_id: str | None,
    conv_id: str | None = None,
) -> StateGraph:
    workflow = StateGraph(AgentState)

    orchestrator = _make_orchestrator(db, user_id)
    generate = _make_generate_node()

    workflow.add_node("orchestrator", orchestrator)
    workflow.add_node("generate", generate)

    workflow.add_edge(START, "orchestrator")
    workflow.add_edge("orchestrator", "generate")
    workflow.add_edge("generate", END)

    return workflow.compile()


def _make_orchestrator(db: AsyncSession, user_id: str | None):
    async def orchestrate(state: AgentState) -> dict:
        message = state.get("user_message", "")
        logger.info(f"Agent orchestrating: {message[:80]}...")

        keywords = _extract_keywords(message)
        logger.info(f"Keywords: {keywords[:80]}")

        intent = _classify_intent(message)
        rag_results = search_rag(keywords, k=2)

        db_context = ""
        try:
            if intent == "db_sensors":
                db_context = await get_sensor_status(db)
            elif intent == "db_analysis" and user_id:
                db_context = await get_last_analysis(db, user_id)
            elif intent == "db_history" and user_id:
                db_context = await get_history_summary(db, user_id)
        except Exception as e:
            logger.warning(f"Tool error: {e}")

        return {
            "intent": intent,
            "search_keywords": keywords,
            "rag_results": rag_results,
            "db_context": db_context,
        }

    return orchestrate


def _make_generate_node():
    async def generate(state: AgentState) -> dict:
        rag = "\n\n".join(state.get("rag_results", []))[:2000] or "(sin resultados)"
        db_ctx = state.get("db_context", "") or "(sin datos de usuario)"

        prompt = _SYSTEM_PROMPT.format(rag_knowledge=rag, db_context=db_ctx)

        response = await ollama_generate(
            message=state["user_message"],
            system_prompt=prompt,
            temperature=0.3,
            max_tokens=150,
        )

        if not response:
            response = (
                "No pude generar una respuesta en este momento. "
                "Intenta preguntar sobre cultivos, plagas, fertilizacion, "
                "sensores IoT, NDVI, suelos o riego en la region Caribe."
            )

        return {"final_response": response}

    return generate


def _classify_intent(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in ["sensor", "sensores", "iot", "nodo"]):
        return "db_sensors"
    if any(w in lower for w in ["historial", "historico"]):
        return "db_history"
    if any(w in lower for w in ["ultimo analisis", "mis analisis", "mi ultimo"]):
        return "db_analysis"
    return "rag_query"
