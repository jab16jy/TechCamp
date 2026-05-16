import logging

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage

from app.agent.state import AgentState

logger = logging.getLogger(__name__)


def create_agent_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", _agent_node)
    workflow.add_edge("__start__", "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()


def _agent_node(state: AgentState) -> dict:
    messages = state.get("messages", [])
    if not messages:
        return {"messages": [AIMessage(content="No recibi ningun mensaje.")]}

    last_msg = messages[-1]
    if isinstance(last_msg, HumanMessage):
        content = last_msg.content
    elif isinstance(last_msg, dict):
        content = last_msg.get("content", "")
    else:
        content = str(last_msg)

    if not content:
        return {"messages": [AIMessage(content="No entendi tu mensaje. Intenta de nuevo.")]}

    response = _match_intent(content, state.get("contexto", {}))

    return {"messages": [AIMessage(content=response)]}


def _match_intent(content: str, contexto: dict) -> str:
    lower = content.lower()

    if any(w in lower for w in ["sensor", "sensores", "iot", "nodo", "monitoreo"]):
        return (
            "Para ver el estado de los sensores IoT en tiempo real, "
            "accede a la seccion **Sensores IoT** en el menu lateral. "
            "Alli encontraras telemetria de NDVI, humedad y temperatura por nodo."
        )

    if any(w in lower for w in ["recomendar", "recomendacion", "cultivo", "sembrar"]):
        return (
            "Para obtener una recomendacion de cultivos personalizada, "
            "ve a **Analisis de Cultivos**, completa el formulario con los datos de tu parcela "
            "y el sistema te recomendara los 3 mejores cultivos con su justificacion agronomica."
        )

    if any(w in lower for w in ["historial", "historico", "analisis anteriores"]):
        return (
            "Tu historial de analisis esta disponible en la seccion **Historial** del menu. "
            "Alli puedes ver, filtrar y comparar todos tus diagnosticos anteriores."
        )

    if any(w in lower for w in ["analisis", "ultimo"]):
        return (
            "Tu ultimo analisis se encuentra en la seccion **Historial**. "
            "Tambien puedes generar uno nuevo desde **Analisis de Cultivos**."
        )

    if any(w in lower for w in ["clima", "temperatura", "lluvia", "precipitacion"]):
        return (
            "Los datos climaticos en tiempo real se obtienen de OpenMeteo API "
            "y se muestran al ejecutar un analisis de cultivos. "
            "Ingresa las coordenadas de tu parcela en **Analisis de Cultivos** para ver el clima actual."
        )

    return (
        "Puedo ayudarte con:\n\n"
        "1. **Recomendacion de cultivos** -- di 'recomendar'\n"
        "2. **Estado de sensores IoT** -- di 'sensores'\n"
        "3. **Historial de analisis** -- di 'historial'\n"
        "4. **Datos climaticos** -- di 'clima'\n\n"
        "Tambien puedes ir directamente a las secciones del menu lateral para acciones mas detalladas."
    )
