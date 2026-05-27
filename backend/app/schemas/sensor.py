from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class SensorResponse(BaseModel):
    id: str
    nodo_id: str
    nombre: str
    lat: float
    lng: float
    estado: str
    ultima_lectura: Optional["LecturaResponse"] = None

    model_config = {"from_attributes": True}


class LecturaResponse(BaseModel):
    id: str
    sensor_id: str
    ndvi: Optional[float] = None
    humedad: Optional[float] = None
    temperatura: Optional[float] = None
    viento_kmh: Optional[float] = None
    pluviometria_mm: Optional[float] = None
    humectacion_hoja_pct: Optional[float] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class ParcelaResponse(BaseModel):
    id: str
    usuario_id: str
    nombre: str
    area_hectareas: Optional[float] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class CreateParcelaRequest(BaseModel):
    usuario_id: str
    nombre: str
    area_hectareas: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class CreateLecturaRequest(BaseModel):
    sensor_id: str
    ndvi: Optional[float] = None
    humedad: Optional[float] = None
    temperatura: Optional[float] = None
    viento_kmh: Optional[float] = None
    pluviometria_mm: Optional[float] = None
    humectacion_hoja_pct: Optional[float] = None
