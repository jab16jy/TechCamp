from typing import TypedDict


class AgentState(TypedDict):
    user_message: str
    user_id: str | None
    history_text: str
    rag_results: list[str]
    db_context: str
    intent: str
    final_response: str
