import logging

from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_settings = get_settings()

_ollama_client: AsyncOpenAI | None = None


def _get_ollama_client() -> AsyncOpenAI | None:
    global _ollama_client
    if _ollama_client is None and _settings.OLLAMA_BASE_URL:
        try:
            _ollama_client = AsyncOpenAI(
                base_url=f"{_settings.OLLAMA_BASE_URL}/v1",
                api_key="ollama",
                timeout=120.0,
                max_retries=1,
            )
        except Exception as e:
            logger.warning(f"Failed to init Ollama client: {e}")
    return _ollama_client


def is_available() -> bool:
    """True si Ollama esta configurado."""
    return bool(_settings.OLLAMA_BASE_URL)


async def generate_response(
    message: str,
    system_prompt: str | None = None,
    conversation_history: list[dict] | None = None,
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 2048,
) -> str:
    if not is_available():
        logger.warning("OLLAMA_BASE_URL no configurada")
        return ""

    client = _get_ollama_client()
    if not client:
        return ""

    messages = _build_messages(system_prompt, conversation_history, message)

    try:
        model_name = model or _settings.OLLAMA_MODEL
        response = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        text = response.choices[0].message.content
        if text:
            logger.info(f"Ollama response ({model_name}): {len(text)} chars")
            return text
    except Exception as e:
        logger.warning(f"Ollama failed: {e}")

    return ""


def _build_messages(
    system_prompt: str | None,
    conversation_history: list[dict] | None,
    message: str,
) -> list[dict]:
    messages: list[dict] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": message})
    return messages
