import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_settings = get_settings()

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=600.0)
    return _client


def is_available() -> bool:
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

    model_name = model or _settings.OLLAMA_MODEL
    prompt = _build_prompt(system_prompt, conversation_history, message)

    payload = {
        "model": model_name,
        "prompt": prompt,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    try:
        client = get_client()
        resp = await client.post(
            f"{_settings.OLLAMA_BASE_URL}/api/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
        text = data.get("response", "")
        if text:
            logger.info(f"Ollama response ({model_name}): {len(text)} chars")
            return text
    except Exception as e:
        logger.warning(f"Ollama failed: {e}", exc_info=True)

    return ""


def _build_prompt(
    system_prompt: str | None,
    conversation_history: list[dict] | None,
    message: str,
) -> str:
    parts = []
    if system_prompt:
        parts.append(system_prompt)
    if conversation_history:
        for m in conversation_history:
            role = "Usuario" if m.get("role") == "user" else "Asistente"
            parts.append(f"{role}: {m.get('content', '')}")
    parts.append(f"Usuario: {message}")
    parts.append("Asistente:")
    return "\n\n".join(parts)
