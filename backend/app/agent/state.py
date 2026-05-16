from langgraph.graph.message import add_messages
from typing import TypedDict, Annotated, Sequence


class AgentState(TypedDict):
    messages: Annotated[Sequence[dict], add_messages]
    user_id: str
    contexto: dict
