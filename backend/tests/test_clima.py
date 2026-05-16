import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_get_climate_returns_200_with_valid_coords():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/climate?lat=10.9685&lng=-74.7813", timeout=15)

    assert response.status_code == 200
    body = response.json()
    assert "temperatura" in body
    assert "precipitacion" in body
    assert "humedad" in body
    assert isinstance(body["temperatura"], (int, float))
    assert isinstance(body["precipitacion"], (int, float))
    assert isinstance(body["humedad"], (int, float))


@pytest.mark.asyncio
async def test_get_climate_missing_params_returns_422():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/climate", timeout=15)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_climate_out_of_range_no_crash():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/climate?lat=0&lng=0", timeout=15)

    assert response.status_code == 200
    body = response.json()
    assert "temperatura" in body


@pytest.mark.asyncio
async def test_get_climate_negative_coords():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/climate?lat=-33&lng=-70", timeout=15)

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["temperatura"], (int, float))
