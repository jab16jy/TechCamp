from typing import Optional
from pydantic import BaseModel, Field


class ClimateRiskRequest(BaseModel):
    lat: float = Field(..., ge=-4.5, le=12.5, description="Latitud WGS84")
    lon: float = Field(..., ge=-79.0, le=-66.0, description="Longitud WGS84")
    year: int = Field(..., ge=1990, le=2030, description="Año de predicción")
    month: int = Field(..., ge=1, le=12, description="Mes de predicción")


class FactorContribucion(BaseModel):
    factor: str
    importancia: float


class RiesgoScore(BaseModel):
    tipo: str
    probabilidad: float = Field(..., ge=0.0, le=1.0)
    severidad: str
    confianza_modelo: Optional[float] = None
    fallback_heuristico: bool = False


class ClimateRiskResponse(BaseModel):
    lat: float
    lon: float
    year: int
    month: int
    riesgos: list[RiesgoScore]
    factores_principales: list[FactorContribucion] = []
    modelo_disponible: bool
    mensaje: Optional[str] = None
