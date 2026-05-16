from pydantic import BaseModel, Field
from typing import Optional


class ClimateData(BaseModel):
    temperatura: float
    precipitacion: float
    humedad: float
    evapotranspiracion: Optional[float] = None
    radiacion_solar: Optional[float] = None


class ClimateQuery(BaseModel):
    lat: float
    lng: float
