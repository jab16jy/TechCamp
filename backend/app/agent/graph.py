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

SYSTEM_PROMPT = (
    "Eres AgroAsesor IA, un asistente agronomico especializado en la region "
    "Caribe colombiana (Atlantico, Bolivar, Cesar, Cordoba, La Guajira, "
    "Magdalena, Sucre).\n\n"
    "CONOCIMIENTO AGRICOLA (RAG):\n"
    "{rag_knowledge}\n\n"
    "DATOS DEL USUARIO (DB):\n"
    "{db_context}\n\n"
    "HISTORIAL DE CONVERSACION:\n"
    "{history}\n\n"
    "INSTRUCCIONES:\n"
    "- Responde con informacion de la base de conocimiento proporcionada.\n"
    "- Si algo no esta en la base, dilo claramente y sugiere fuentes como "
    "Agrosavia, ICA o FAO.\n"
    "- Se conciso y directo. Usa formato Markdown.\n"
    "- Incluye datos numericos (dosis kg/ha, temperaturas C, pH) cuando "
    "esten en la base de conocimiento.\n"
    "- Adapta la respuesta a los datos del usuario si existen.\n"
    "- NUNCA inventes datos agronomicos.\n"
    "- Responde en espanol, tono profesional pero accesible."
)


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

        intent = _classify_intent(message)
        rag_results = search_rag(message, k=6)
        db_context = ""
        history_text = state.get("history_text", "")

        try:
            if intent == "db_sensors":
                db_context = await get_sensor_status(db)
            elif intent == "db_analysis":
                if user_id:
                    db_context = await get_last_analysis(db, user_id)
            elif intent == "db_history":
                if user_id:
                    db_context = await get_history_summary(db, user_id)
            elif intent == "db_all":
                parts = []
                if user_id:
                    parts.append(await get_last_analysis(db, user_id))
                    parts.append(await get_history_summary(db, user_id))
                parts.append(await get_sensor_status(db))
                db_context = "\n\n".join(p for p in parts if p and "Error" not in p)
        except Exception as e:
            logger.warning(f"Tool execution error: {e}")

        return {
            "intent": intent,
            "rag_results": rag_results,
            "db_context": db_context,
            "history_text": history_text,
        }

    return orchestrate


def _make_generate_node():
    async def generate(state: AgentState) -> dict:
        rag = "\n\n".join(state.get("rag_results", []))
        db_ctx = state.get("db_context", "")
        history = state.get("history_text", "")

        system_prompt = SYSTEM_PROMPT.format(
            rag_knowledge=rag or "(sin resultados RAG para esta consulta)",
            db_context=db_ctx or "(sin datos de usuario disponibles)",
            history=history or "(nueva conversacion)",
        )

        response = await ollama_generate(
            message=state["user_message"],
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=1024,
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
    if any(w in lower for w in ["ultimo analisis", "mis analisis", "mi analisis",
                                 "mi ultimo", "analisis anterior"]):
        return "db_analysis"
    if any(w in lower for w in ["mis analisis", "mis datos", "mi historial",
                                 "mis sensores", "todo", "resumen"]):
        return "db_all"

    return "rag_query"
