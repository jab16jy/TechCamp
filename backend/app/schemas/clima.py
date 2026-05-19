from pydantic import BaseModel, Field
from typing import Optional


class ClimateData(BaseModel):
    temperatura: float
    precipitacion: float
    humedad: float
    evapotranspiracion: Optional[float] = None
    radiacion_solar: Optional[float] = None


class AnomaliaClimatica(BaseModel):
    temperatura_actual: float
    temperatura_historica: float
    anomalia_temperatura: float
    precipitacion_actual: float
    precipitacion_historica: float
    anomalia_precipitacion: float
    humedad_actual: float
    humedad_historica: float
    anomalia_humedad: float
    fuente: str = "NASA POWER"


class ClimateQuery(BaseModel):
    lat: float
    lng: float
