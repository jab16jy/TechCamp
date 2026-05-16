from pydantic import BaseModel, Field


class SatelliteData(BaseModel):
    ndvi: float
    ndwi: float
    calidad_suelo: str
    cobertura_nube: int


class SatelliteQuery(BaseModel):
    lat: float
    lng: float
