"""Schemas for the historical climate-events endpoint (contextual evidence).

Impact fields are Optional on purpose: a value is present only when the source
reported it. The frontend must treat ``None`` as 'not recorded', never as 0.
"""
from typing import Optional

from pydantic import BaseModel, Field


class EventoHistorico(BaseModel):
    fecha: str = Field(..., description="ISO date (YYYY-MM-DD) of the event")
    departamento: Optional[str] = None
    municipio: Optional[str] = None
    tipo: str = Field(..., description="inundacion | sequia")
    fuente: str = Field(..., description="Origin dataset (ungrd_* | hdx_1990_2020)")

    personas_afectadas: Optional[float] = None
    familias_afectadas: Optional[float] = None
    viviendas_destruidas: Optional[float] = None
    viviendas_averiadas: Optional[float] = None
    hectareas_afectadas: Optional[float] = None
    fallecidos: Optional[float] = None
    heridos: Optional[float] = None
    desaparecidos: Optional[float] = None
    comentarios: Optional[str] = None


class RangoFechas(BaseModel):
    desde: str
    hasta: str


class ResumenAgregado(BaseModel):
    total_eventos: int
    inundaciones: int
    sequias: int
    personas_afectadas: Optional[float] = None
    familias_afectadas: Optional[float] = None
    hectareas_afectadas: Optional[float] = None
    viviendas_destruidas: Optional[float] = None
    viviendas_averiadas: Optional[float] = None
    fallecidos: Optional[float] = None
    rango_fechas: Optional[RangoFechas] = None


class HistorialEventosResponse(BaseModel):
    departamento: Optional[str] = None
    municipio: Optional[str] = None
    event_type: Optional[str] = None
    total_disponibles: int = 0
    eventos: list[EventoHistorico] = []
    resumen: ResumenAgregado
    mensaje: Optional[str] = None
