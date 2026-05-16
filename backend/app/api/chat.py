import logging
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage
from app.services.chat_service import process_chat_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    if not body.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El mensaje no puede estar vacio",
        )

    user_id = body.user_id or "00000000-0000-0000-0000-000000000000"

    try:
        resp = await process_chat_message(
            db=db,
            user_id=user_id,
            message=body.message.strip(),
            conversation_id=body.conversation_id,
        )
        return ChatResponse(
            conversation_id=resp["conversation_id"],
            message=ChatMessage(**resp["message"]),
        )
    except Exception as e:
        logger.warning(f"Chat fallback mode (DB no disponible): {e}")
        fallback_id = body.conversation_id or str(_uuid.uuid4())
        fallback_msg = ChatMessage(
            rol="ia",
            contenido=(
                "Procese tu mensaje, pero la base de datos no esta disponible en este momento. "
                "Algunas funciones avanzadas (consulta de historial, sensores) no estan activas. "
                "Puedes seguir usando el chat para obtener orientacion general sobre cultivos, clima y uso de la plataforma."
            ),
        )
        return ChatResponse(conversation_id=fallback_id, message=fallback_msg)
