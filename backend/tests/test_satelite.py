import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_get_satellite_indicators_returns_200():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/satellite-indicators?lat=10.9685&lng=-74.7813", timeout=15)

    assert response.status_code == 200
    body = response.json()
    assert "ndvi" in body
    assert "ndwi" in body
    assert "calidad_suelo" in body
    assert "cobertura_nube" in body

    if body["ndvi"] is not None:
        assert 0 <= body["ndvi"] <= 1
    assert isinstance(body["calidad_suelo"], str)
    assert isinstance(body["cobertura_nube"], int)


@pytest.mark.asyncio
async def test_get_satellite_missing_params_returns_422():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/satellite-indicators", timeout=15)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_satellite_mock_fallback():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/satellite-indicators?lat=0&lng=0", timeout=15)

    assert response.status_code == 200
    body = response.json()
    assert body["ndvi"] >= 0
    assert body["calidad_suelo"] != ""
