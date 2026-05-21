from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

from app.schemas.clima import ClimateData, AnomaliaClimatica
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
    metodo: str = "heuristico"
    probabilidad: Optional[float] = None


class AnalyzeResponse(BaseModel):
    clima: ClimateData
    indicadores_satelite: SatelliteData
    recomendaciones: list[RecomendacionCultivo]
    anomalia: AnomaliaClimatica | None = None
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
    ph_suelo: Optional[float] = None
    textura_suelo: Optional[str] = None
    materia_organica: Optional[float] = None
    mes_siembra: Optional[str] = None
    recomendaciones: Optional[list] = None


class SoilGridsResponse(BaseModel):
    ph: Optional[float] = None
    materia_organica: Optional[float] = None
    textura_suelo: Optional[str] = None
    fuente: str = "ISRIC SoilGrids v2.0"


class AnalysisDetailResponse(BaseModel):
    id: str
    tipo: str
    lat: float
    lng: float
    cultivo_recomendado: Optional[str] = None
    score: Optional[int] = None
    datos_formulario: dict = {}
    resultado_completo: dict = {}
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class MunicipioResponse(BaseModel):
    id: int
    nombre: str
    departamento: str
    lat: Optional[float] = None
    lng: Optional[float] = None
