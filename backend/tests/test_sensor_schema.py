"""
Tests para la extension del esquema de sensor (Task 1.5).
Verifica que LecturaResponse incluya los nuevos campos
viento_kmh, pluviometria_mm, humectacion_hoja_pct.
"""
import pytest


class TestSensorSchemaExtension:
    """Verifica los nuevos campos en LecturaResponse (Task 1.5)."""

    def test_lectura_response_has_new_fields(self):
        """LecturaResponse debe exponer viento_kmh, pluviometria_mm, humectacion_hoja_pct."""
        from app.schemas.sensor import LecturaResponse

        # Verificar que los campos existen en el modelo
        fields = LecturaResponse.model_fields
        assert "viento_kmh" in fields, "Falta campo viento_kmh"
        assert "pluviometria_mm" in fields, "Falta campo pluviometria_mm"
        assert "humectacion_hoja_pct" in fields, "Falta campo humectacion_hoja_pct"

    def test_lectura_response_new_fields_are_optional(self):
        """Los nuevos campos deben ser Optional (None por defecto)."""
        from app.schemas.sensor import LecturaResponse
        from typing import Optional

        fields = LecturaResponse.model_fields

        # Verificar que aceptan None
        lectura = LecturaResponse(
            id="test-1",
            sensor_id="sensor-1",
            ndvi=0.5,
            humedad=75.0,
            temperatura=28.0,
        )
        assert lectura.viento_kmh is None
        assert lectura.pluviometria_mm is None
        assert lectura.humectacion_hoja_pct is None

    def test_lectura_response_accepts_new_field_values(self):
        """LecturaResponse debe aceptar valores en los nuevos campos."""
        from app.schemas.sensor import LecturaResponse

        lectura = LecturaResponse(
            id="test-2",
            sensor_id="sensor-2",
            ndvi=0.6,
            humedad=80.0,
            temperatura=30.0,
            viento_kmh=25.5,
            pluviometria_mm=45.0,
            humectacion_hoja_pct=85.0,
        )
        assert lectura.viento_kmh == 25.5
        assert lectura.pluviometria_mm == 45.0
        assert lectura.humectacion_hoja_pct == 85.0

    def test_create_lectura_request_has_new_fields(self):
        """CreateLecturaRequest tambien debe incluir los nuevos campos."""
        from app.schemas.sensor import CreateLecturaRequest

        fields = CreateLecturaRequest.model_fields
        assert "viento_kmh" in fields, "CreateLecturaRequest debe tener viento_kmh"
        assert "pluviometria_mm" in fields, "CreateLecturaRequest debe tener pluviometria_mm"
        assert "humectacion_hoja_pct" in fields, "CreateLecturaRequest debe tener humectacion_hoja_pct"
