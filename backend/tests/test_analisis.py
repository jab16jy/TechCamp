import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.schemas.analisis import AnalyzeResponse, ClimateData, SatelliteData, RecomendacionCultivo


@pytest.fixture
def valid_payload():
    return {
        "departamento": "Atlantico",
        "municipio": "Barranquilla",
        "lat": 10.9685,
        "lng": -74.7813,
        "tipo_suelo": "Franco-Arcilloso",
        "acceso_riego": True,
        "mes_siembra": "Mayo",
        "area_hectareas": 5.0,
        "ph_suelo": 6.5,
        "materia_organica": 3.2,
        "textura_suelo": "Franco",
    }


@pytest.mark.asyncio
async def test_analyze_location_returns_200_and_valid_structure(valid_payload):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/analyze-location", json=valid_payload, timeout=15)

    assert response.status_code == 200
    body = response.json()

    assert "clima" in body
    assert "indicadores_satelite" in body
    assert "recomendaciones" in body
    assert "ubicacion" in body
    assert "es_mock" in body

    recommendations = body["recomendaciones"]
    assert isinstance(recommendations, list)
    assert len(recommendations) >= 1
    for rec in recommendations:
        assert "cultivo" in rec
        assert "score" in rec
        assert "riesgo" in rec
        assert "justificacion" in rec
        assert rec["score"] >= 10
        assert rec["score"] <= 98


@pytest.mark.asyncio
async def test_analyze_location_invalid_payload_returns_422():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/analyze-location", json={"lat": 0}, timeout=15)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_analyze_location_recommendations_scored_descending(valid_payload):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/analyze-location", json=valid_payload, timeout=15)

    assert response.status_code == 200
    recommendations = response.json()["recomendaciones"]
    scores = [rec["score"] for rec in recommendations]
    assert scores == sorted(scores, reverse=True)
