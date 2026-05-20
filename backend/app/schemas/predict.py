from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PredictRequest(BaseModel):
    lat: float
    lng: float
    analysis_id: Optional[str] = None


class MonthProjection(BaseModel):
    month: str
    year: int
    month_num: int
    temperatura: float
    precipitacion: float
    humedad: float
    ndvi_estimado: float
    radiacion_solar: Optional[float] = None
    cultivos_recomendados: list["CropScore"] = []


class CropScore(BaseModel):
    cultivo: str
    score: int
    riesgo: str
    emoji: str = ""
    metodo: str = "heuristico"
    probabilidad: Optional[float] = None


class PredictResponse(BaseModel):
    ubicacion: dict
    meses: list[MonthProjection]
    mejor_mes: Optional[str] = None
    mejor_cultivo: Optional[str] = None
    fuente: str = "NASA POWER + OpenMeteo"
