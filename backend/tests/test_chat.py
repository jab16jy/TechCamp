import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_chat_with_message_returns_200():
    transport = ASGITransport(app=app)
    payload = {"message": "Dame una recomendacion de cultivo"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/chat", json=payload, timeout=15)

    assert response.status_code == 200
    body = response.json()
    assert "conversation_id" in body
    assert "message" in body
    msg = body["message"]
    assert "rol" in msg
    assert msg["rol"] == "ia"
    assert "contenido" in msg
    assert len(msg["contenido"]) > 10


@pytest.mark.asyncio
async def test_chat_empty_message_returns_422():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/chat", json={"message": ""}, timeout=15)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_with_conversation_id_continues():
    transport = ASGITransport(app=app)
    payload1 = {
        "message": "ultimo analisis",
        "user_id": "00000000-0000-0000-0000-000000000001",
    }
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response1 = await client.post("/chat", json=payload1, timeout=15)
        assert response1.status_code == 200
        conv_id = response1.json()["conversation_id"]
        assert conv_id is not None

        payload2 = {
            "message": "recomendar",
            "conversation_id": conv_id,
            "user_id": "00000000-0000-0000-0000-000000000001",
        }
        response2 = await client.post("/chat", json=payload2, timeout=15)
        assert response2.status_code == 200
        assert response2.json()["conversation_id"] == conv_id
        assert "contenido" in response2.json()["message"]


@pytest.mark.asyncio
async def test_chat_sensors_intent():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/chat", json={"message": "como estan los sensores?"}, timeout=15)

    assert response.status_code == 200
    body = response.json()["message"]
    assert "rol" in body and body["rol"] == "ia"


@pytest.mark.asyncio
async def test_chat_historial_intent():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/chat", json={"message": "quiero ver mi historial"}, timeout=15)

    assert response.status_code == 200
    body = response.json()["message"]
    assert body["rol"] == "ia"


@pytest.mark.asyncio
async def test_chat_default_intent():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/chat", json={"message": "hola"}, timeout=15)

    assert response.status_code == 200
    body = response.json()["message"]
    assert body["rol"] == "ia"
