from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    user_id: str | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    message: "ChatMessage"


class ChatMessage(BaseModel):
    rol: str = Field(..., pattern="^(usuario|ia)$")
    contenido: str
    metadata: dict | None = None
