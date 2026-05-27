"""
Tests para el generador de datos mock de sensores (Task 1.6).
Verifica generacion de datos realistas del Caribe para
nuevos tipos de sensor: viento, pluviometria, humectacion hoja.
"""
import pytest


class TestMockSensorData:
    """Verifica la generacion de datos mock realistas para sensores."""

    def test_mock_generator_function_exists(self):
        """La funcion generadora de mock debe existir en sensores.py."""
        from app.api.sensores import _generate_mock_sensor_readings
        assert callable(_generate_mock_sensor_readings)

    def test_mock_data_has_new_sensor_types(self):
        """Los datos mock deben incluir los nuevos campos de sensor."""
        from app.api.sensores import _generate_mock_sensor_readings

        data = _generate_mock_sensor_readings()
        assert len(data) > 0
        first = data[0]
        assert "viento_kmh" in first, "Falta campo viento_kmh en mock"
        assert "pluviometria_mm" in first, "Falta campo pluviometria_mm en mock"
        assert "humectacion_hoja_pct" in first, "Falta campo humectacion_hoja_pct en mock"

    def test_mock_viento_in_realistic_range(self):
        """Viento debe estar en rango realista Caribe (0-120 km/h)."""
        from app.api.sensores import _generate_mock_sensor_readings

        for _ in range(10):
            data = _generate_mock_sensor_readings()
            for reading in data:
                v = reading["viento_kmh"]
                assert 0 <= v <= 120, f"Viento fuera de rango: {v} km/h"

    def test_mock_pluviometria_in_realistic_range(self):
        """Pluviometria debe estar en rango 0-200 mm."""
        from app.api.sensores import _generate_mock_sensor_readings

        for _ in range(10):
            data = _generate_mock_sensor_readings()
            for reading in data:
                p = reading["pluviometria_mm"]
                assert 0 <= p <= 200, f"Pluviometria fuera de rango: {p} mm"

    def test_mock_humectacion_in_realistic_range(self):
        """Humectacion de hoja debe estar en rango 0-100%."""
        from app.api.sensores import _generate_mock_sensor_readings

        for _ in range(10):
            data = _generate_mock_sensor_readings()
            for reading in data:
                h = reading["humectacion_hoja_pct"]
                assert 0 <= h <= 100, f"Humectacion fuera de rango: {h}%"

    def test_mock_data_includes_existing_fields(self):
        """Los datos mock deben mantener los campos existentes (ndvi, humedad, temp)."""
        from app.api.sensores import _generate_mock_sensor_readings

        data = _generate_mock_sensor_readings()
        for reading in data:
            assert "ndvi" in reading
            assert "humedad" in reading
            assert "temperatura" in reading
