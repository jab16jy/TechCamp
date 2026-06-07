from pydantic import BaseModel, Field
from typing import Optional


class AlertItem(BaseModel):
    severidad: str
    fuente: str
    mensaje: str
    accion: str = ""
    timestamp: str = ""


class AlertsResponse(BaseModel):
    alertas: list[AlertItem]
    total_criticas: int = 0
    total_advertencias: int = 0


class CompareRequest(BaseModel):
    analysis_ids: list[str]


class CompareItem(BaseModel):
    id: str
    fecha: str
    municipio: str = ""
    cultivo: str = ""
    score: int = 0
    tipo: str = ""
    ndvi: float | None = None
    ph_suelo: float | None = None
    temperatura: float | None = None
    recomendaciones: list = []


class CompareResponse(BaseModel):
    items: list[CompareItem]


class ExportRequest(BaseModel):
    analysis_id: str


class ExportResponse(BaseModel):
    titulo: str
    fecha: str
    ubicacion: dict
    clima: dict
    satelite: dict
    suelo: dict
    recomendaciones: list
    resumen: str


class CompareScenarioRequest(BaseModel):
    lat: float = Field(default=10.97)
    lng: float = Field(default=-74.78)
    meses: int = Field(default=6, ge=1, le=6)
    cultivo: Optional[str] = None


class CompareScenarioResponse(BaseModel):
    nino: dict
    normal: dict
