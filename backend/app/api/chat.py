import logging
import traceback
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.usuario import Usuario
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage
from app.services.chat_service import process_chat_message
from app.services.llm_service import is_available, generate_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/test-llm")
async def test_llm():
    if not is_available():
        return {"status": "error", "message": "OLLAMA_BASE_URL not configured"}

    test_msg = "Responde solo 'OK' si funcionas correctamente"

    result = await generate_response(test_msg, temperature=0, max_tokens=10)
    if result:
        return {"status": "ok", "provider": "llm", "response": result}

    return {"status": "error", "message": "All providers failed — check logs"}


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

    user_id = body.user_id
    if not user_id:
        result = await db.execute(select(Usuario.id).limit(1))
        user_row = result.scalars().one_or_none()
        if user_row:
            user_id = str(user_row)

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
        logger.warning(f"Chat endpoint error: {e}")
        logger.warning(f"Traceback: {traceback.format_exc()}")
        fallback_id = body.conversation_id or str(_uuid.uuid4())
        fallback_msg = ChatMessage(
            rol="ia",
            contenido=(
                "Procese tu mensaje, pero ocurrio un error interno. "
                "Algunas funciones avanzadas (consulta de historial, sensores) no estan activas. "
                "Puedes seguir usando el chat para obtener orientacion general sobre cultivos, clima y uso de la plataforma."
            ),
        )
        return ChatResponse(conversation_id=fallback_id, message=fallback_msg)
