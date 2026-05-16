from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

from app.schemas.clima import ClimateData
from app.schemas.satelite import SatelliteData


class AnalyzeRequest(BaseModel):
    departamento: str
    municipio: str
    lat: float
    lng: float
    tipo_suelo: str
    acceso_riego: bool = False
    mes_siembra: str
    area_hectareas: float
    ph_suelo: float
    materia_organica: float
    textura_suelo: str


class RecomendacionCultivo(BaseModel):
    cultivo: str
    score: int
    riesgo: str
    justificacion: str
    emoji: str = ""
    ciclo_dias: Optional[int] = None
    rendimiento_estimado: Optional[str] = None


class AnalyzeResponse(BaseModel):
    clima: ClimateData
    indicadores_satelite: SatelliteData
    recomendaciones: list[RecomendacionCultivo]
    ubicacion: dict
    es_mock: bool = True


class HistorialEntry(BaseModel):
    id: str
    fecha: str
    municipio: str
    departamento: str
    cultivo: str
    score: int
    tipo: str
    estado: str
    area_hectareas: Optional[float] = None
    coordenadas: Optional[dict] = None


class MunicipioResponse(BaseModel):
    id: int
    nombre: str
    departamento: str
    lat: Optional[float] = None
    lng: Optional[float] = None
