import logging

from langgraph.graph import StateGraph, START, END
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.state import AgentState
from app.agent.tools import (
    get_last_analysis,
    get_history_summary,
    get_sensor_status,
    get_foliar_profile_text,
    get_harvest_forecast_text,
    get_analysis_with_forecast,
)
from app.services.rag_service import search_rag
from app.services.llm_service import generate_response as ollama_generate

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "Eres AgroAsesor IA, un asistente agronomico especializado en la region "
    "Caribe colombiana.\n\n"
    "CONOCIMIENTO BASE:\n{rag_knowledge}\n\n"
    "DATOS DE USUARIO Y CULTIVO:\n{db_context}\n\n"
    "INSTRUCCIONES: Responde con la info proporcionada usando un tono "
    "calido y natural, como un ingeniero agronomo que conversa con un "
    "productor. Nada de respuestas cortantes. Usa Markdown. "
    "NUNCA inventes datos numericos. Cuando cites rendimientos o nutrientes, "
    "usa SOLO los datos del contexto. Responde en espanol."
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

_FOLIAR_TERMS = [
    "foliar", "hoja", "tejido", "nutriente foliar", "analisis foliar",
    "deficiencia", "n foliar", "nitrogeno foliar", "p foliar", "k foliar",
]
_HARVEST_TERMS = [
    "cosecha", "rendimiento", "produccion", "toneladas", "t/ha",
    "cuanto produce", "cuanto rinde", "prediccion cosecha", "estimacion cosecha",
    "pronostico", "pronóstico",
]
_NUTRIENT_MAP_TERMS = [
    "mapa nutriente", "mapa de nutrientes", "nutrientes por zona",
    "distribucion nutrientes", "niveles de nutrientes",
]


def _extract_keywords(message: str) -> str:
    lower = message.lower()
    matched = []
    for category, terms in _KEYWORD_CATEGORIES.items():
        if any(t in lower for t in terms):
            matched.append(category)
    if matched:
        return " ".join(matched[:3])
    return message.strip()


def _extract_crop_depto(message: str) -> tuple[str | None, str | None]:
    """Best-effort crop and department extraction from message text."""
    lower = message.lower()
    crop_map = {
        "maiz": "Maíz", "maíz": "Maíz", "yuca": "Yuca", "arroz": "Arroz",
        "platano": "Plátano", "plátano": "Plátano", "cacao": "Cacao",
        "palma": "Palma", "frijol": "Frijol", "fríjol": "Frijol",
        "name": "Ñame", "ñame": "Ñame", "algodon": "Algodón", "algodón": "Algodón",
        "sorgo": "Sorgo", "mango": "Mango",
    }
    depto_map = {
        "atlantico": "ATLANTICO", "atlántico": "ATLANTICO",
        "bolivar": "BOLIVAR", "bolívar": "BOLIVAR",
        "cesar": "CESAR", "cordoba": "CORDOBA", "córdoba": "CORDOBA",
        "guajira": "LA GUAJIRA", "magdalena": "MAGDALENA", "sucre": "SUCRE",
    }
    found_crop = next((v for k, v in crop_map.items() if k in lower), None)
    found_depto = next((v for k, v in depto_map.items() if k in lower), None)
    return found_crop, found_depto


def _classify_intent(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in _FOLIAR_TERMS):
        return "foliar_diagnosis"
    if any(w in lower for w in _HARVEST_TERMS):
        return "harvest_forecast"
    if any(w in lower for w in _NUTRIENT_MAP_TERMS):
        return "nutrient_map"
    if any(w in lower for w in ["sensor", "sensores", "iot", "nodo"]):
        return "db_sensors"
    if any(w in lower for w in ["historial", "historico"]):
        return "db_history"
    if any(w in lower for w in ["mi cosecha", "mi cultivo", "mi analisis", "mi ultimo"]):
        return "db_analysis_forecast"
    if any(w in lower for w in ["ultimo analisis", "mis analisis"]):
        return "db_analysis"
    return "rag_query"


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
        logger.info("Agent orchestrating: %s...", message[:80])

        keywords = _extract_keywords(message)
        intent = _classify_intent(message)
        crop, depto = _extract_crop_depto(message)

        logger.info("Intent: %s | Crop: %s | Depto: %s", intent, crop, depto)

        rag_results = search_rag(keywords, k=3)
        db_context = ""

        try:
            if intent == "db_sensors":
                db_context = await get_sensor_status(db)

            elif intent == "db_history" and user_id:
                db_context = await get_history_summary(db, user_id)

            elif intent == "db_analysis_forecast" and user_id:
                db_context = await get_analysis_with_forecast(db, user_id)

            elif intent == "db_analysis" and user_id:
                db_context = await get_last_analysis(db, user_id)

            elif intent == "foliar_diagnosis":
                if crop:
                    db_context = get_foliar_profile_text(crop, depto)
                elif user_id:
                    db_context = await get_analysis_with_forecast(db, user_id)
                else:
                    db_context = "Especifica el cultivo (ej: 'perfil foliar de maíz en Atlántico')."

            elif intent == "harvest_forecast":
                area_ha: float | None = None
                for token in message.split():
                    try:
                        val = float(token.replace(",", "."))
                        if 0.1 < val < 10000:
                            area_ha = val
                            break
                    except ValueError:
                        pass

                if crop:
                    db_context = get_harvest_forecast_text(crop, depto, area_ha)
                elif user_id:
                    db_context = await get_analysis_with_forecast(db, user_id)
                else:
                    db_context = "Especifica el cultivo (ej: 'rendimiento de yuca en Magdalena')."

            elif intent == "nutrient_map":
                if crop:
                    db_context = get_foliar_profile_text(crop, depto)
                    if user_id:
                        analysis_ctx = await get_last_analysis(db, user_id)
                        db_context = f"{analysis_ctx}\n\n{db_context}"
                elif user_id:
                    db_context = await get_analysis_with_forecast(db, user_id)
                else:
                    db_context = "Indica el cultivo para ver su perfil de nutrientes foliares."

        except Exception as e:
            logger.warning("Tool error (intent=%s): %s", intent, e)

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
            temperature=0.6,
            max_tokens=600,
        )

        if not response:
            response = (
                "No pude generar una respuesta en este momento. "
                "Puedes preguntarme sobre rendimiento de cultivos, perfil foliar, "
                "plagas, fertilización, sensores IoT o análisis de suelo."
            )

        return {"final_response": response}

    return generate
