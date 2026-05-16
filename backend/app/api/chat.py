import logging

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
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error procesando el mensaje del chat",
        )
