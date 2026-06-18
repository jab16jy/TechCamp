"""Tests for historical climate-events normalization and querying.

All tests use synthetic in-memory data — no dependency on the multi-MB raw
files — so they run anywhere. We exercise the two pure functions directly:
  - normalize_events_frame: raw source DataFrame -> normalized event dicts
  - query_events:           normalized events -> filtered + aggregated result
"""
import pandas as pd
import pytest

from app.ml.data_sources import eventos_historicos as ev

# (lat, lon) near each dept centroid — query_events takes lat first, then lon.
ATLANTICO = (10.39, -75.09)  # dept 8
BOLIVAR = (9.24, -74.90)     # dept 13


def _ungrd_frame():
    """UNGRD-style export: FALLECIDOS / VIVIENDAS DESTRUIDAS / OTROS-AFECTACION."""
    return pd.DataFrame([
        {
            "FECHA": "2024 Jun 15 12:00:00 AM", "DEPARTAMENTO": "ATLANTICO",
            "MUNICIPIO": "BARRANQUILLA", "EVENTO": "INUNDACION", "DIVIPOLA": 8001,
            "FALLECIDOS": 2, "HERIDOS": 0, "DESAPARECIDOS": 0,
            "PERSONAS": 500, "FAMILIAS": 120, "VIVIENDAS DESTRUIDAS": 10,
            "VIVIENDAS AVERIADAS": 40, "HECTAREAS": 35.5, "OTROS-AFECTACION": "Vías afectadas",
        },
        {
            "FECHA": "2023 Mar 02 12:00:00 AM", "DEPARTAMENTO": "ATLANTICO",
            "MUNICIPIO": "SOLEDAD", "EVENTO": "SEQUIA", "DIVIPOLA": 8758,
            "FALLECIDOS": 0, "HERIDOS": 0, "DESAPARECIDOS": 0,
            "PERSONAS": "No registra", "FAMILIAS": "", "VIVIENDAS DESTRUIDAS": 0,
            "VIVIENDAS AVERIADAS": 0, "HECTAREAS": 200, "OTROS-AFECTACION": "No registra",
        },
        {
            # Not a flood/drought → must be dropped
            "FECHA": "2024 Jan 01 12:00:00 AM", "DEPARTAMENTO": "ATLANTICO",
            "MUNICIPIO": "BARRANQUILLA", "EVENTO": "INCENDIO ESTRUCTURAL", "DIVIPOLA": 8001,
            "FALLECIDOS": 1, "PERSONAS": 3, "HECTAREAS": 0, "OTROS-AFECTACION": "x",
        },
    ])


def _hdx_frame():
    """HDX-style export: MUERTOS / VIV.DESTRU. / OTROS, 'DEPT/MUNI' municipio."""
    return pd.DataFrame([
        {
            "FECHA": "10/05/2010", "DEPARTAMENTO": "BOLIVAR",
            "MUNICIPIO": "BOLIVAR/CARTAGENA", "EVENTO": "INUNDACIÓN", "DIVIPOLA": 13001,
            "MUERTOS": 1, "HERIDOS": 4, "DESAPA.": 0,
            "PERSONAS": 800, "FAMILIAS": 200, "VIV.DESTRU.": 5,
            "VIV.AVER.": 30, "HECTAREAS": float("nan"), "OTROS": "NO APLICA",
        },
    ])


# ── Normalization ────────────────────────────────────────────────────────────

class TestNormalizeUngrd:
    def test_maps_impacts_and_drops_non_climate(self):
        events = ev.normalize_events_frame(_ungrd_frame(), "ungrd_test")
        assert len(events) == 2  # incendio dropped

        flood = next(e for e in events if e["tipo"] == "inundacion")
        assert flood["municipio"] == "BARRANQUILLA"
        assert flood["personas_afectadas"] == 500
        assert flood["familias_afectadas"] == 120
        assert flood["viviendas_destruidas"] == 10
        assert flood["viviendas_averiadas"] == 40
        assert flood["hectareas_afectadas"] == 35.5
        assert flood["fallecidos"] == 2
        assert flood["comentarios"] == "Vías afectadas"
        assert flood["fecha"] == "2024-06-15"

    def test_missing_values_become_none_not_zero(self):
        events = ev.normalize_events_frame(_ungrd_frame(), "ungrd_test")
        drought = next(e for e in events if e["tipo"] == "sequia")
        # 'No registra' / '' must normalize to None, never estimated
        assert drought["personas_afectadas"] is None
        assert drought["familias_afectadas"] is None
        assert drought["comentarios"] is None
        # a real reported 0 is preserved
        assert drought["viviendas_destruidas"] == 0
        assert drought["hectareas_afectadas"] == 200


class TestNormalizeHdx:
    def test_resolves_alternate_column_names(self):
        events = ev.normalize_events_frame(_hdx_frame(), "hdx_1990_2020")
        assert len(events) == 1
        e = events[0]
        assert e["tipo"] == "inundacion"
        assert e["municipio"] == "CARTAGENA"  # 'BOLIVAR/CARTAGENA' → last segment
        assert e["fallecidos"] == 1           # MUERTOS → fallecidos
        assert e["desaparecidos"] == 0        # DESAPA. → desaparecidos
        assert e["viviendas_destruidas"] == 5  # VIV.DESTRU.
        assert e["hectareas_afectadas"] is None  # NaN → None
        assert e["comentarios"] is None          # 'NO APLICA' → None
        assert e["fecha"] == "2010-05-10"

    def test_empty_frame_returns_empty(self):
        assert ev.normalize_events_frame(pd.DataFrame(), "x") == []


# ── Querying ──────────────────────────────────────────────────────────────────

@pytest.fixture
def events():
    return ev.normalize_events_frame(_ungrd_frame(), "ungrd_test") + \
        ev.normalize_events_frame(_hdx_frame(), "hdx_1990_2020")


class TestQuery:
    def test_filters_to_nearest_department(self, events):
        res = ev.query_events(events, *ATLANTICO)
        assert res["total_disponibles"] == 2  # only Atlántico events
        assert all(e["departamento"] == "ATLANTICO" for e in res["eventos"])

    def test_filter_by_event_type_accepts_flood_and_spanish(self, events):
        flood = ev.query_events(events, *ATLANTICO, event_type="flood")
        assert flood["total_disponibles"] == 1
        assert flood["eventos"][0]["tipo"] == "inundacion"

        drought = ev.query_events(events, *ATLANTICO, event_type="sequia")
        assert drought["total_disponibles"] == 1
        assert drought["eventos"][0]["tipo"] == "sequia"

    def test_municipio_filter(self, events):
        res = ev.query_events(events, *ATLANTICO, municipio="Barranquilla")
        assert res["total_disponibles"] == 1
        assert res["eventos"][0]["municipio"] == "BARRANQUILLA"

    def test_order_desc_and_limit(self, events):
        res = ev.query_events(events, *ATLANTICO, limit=1)
        assert len(res["eventos"]) == 1
        # newest first: 2024-06-15 beats 2023-03-02
        assert res["eventos"][0]["fecha"] == "2024-06-15"
        # aggregate still counts the full filtered set, not just the limited page
        assert res["resumen"]["total_eventos"] == 2

    def test_aggregate_sums_only_present_values(self, events):
        res = ev.query_events(events, *ATLANTICO)
        r = res["resumen"]
        assert r["total_eventos"] == 2
        assert r["inundaciones"] == 1 and r["sequias"] == 1
        assert r["personas_afectadas"] == 500   # 500 + None(drought) → 500
        assert r["hectareas_afectadas"] == 235.5  # 35.5 + 200
        assert r["rango_fechas"] == {"desde": "2023-03-02", "hasta": "2024-06-15"}

    def test_empty_when_no_events_in_region(self, events):
        # Amazonas (dept 91) — no synthetic events there
        res = ev.query_events(events, -0.85, -72.32)
        assert res["total_disponibles"] == 0
        assert res["eventos"] == []
        assert res["resumen"]["total_eventos"] == 0
        assert res["resumen"]["rango_fechas"] is None
