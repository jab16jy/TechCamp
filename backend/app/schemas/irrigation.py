from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class IrrigationPlanRequest(BaseModel):
    sensor_id: str
    analysis_id: Optional[str] = None
    cultivo: Optional[str] = None
    dias_proyeccion: int = Field(default=14, ge=7, le=30, description="Dias de proyeccion climatica (7-30)")


class RiegoEvento(BaseModel):
    dia: str
    fecha: str
    hora: str
    litros_ha: float
    motivo: str


class IrrigationPlanResponse(BaseModel):
    plan_id: str
    sensor_id: str
    sensor_nodo: str = ""
    cultivo: str
    humedad_actual: float
    umbral_cultivo: float
    prob_lluvia_7d: float
    prob_lluvia_14d: float
    riesgo: str
    volumen_total_m3_ha: float
    frecuencia_dias: int
    horario_optimo: str
    ventana_inicio: str
    ventana_fin: str
    eventos: list[RiegoEvento] = []
    justificacion_xai: str
    textura_suelo: str
    et0_mm_dia: float = 0.0
    temperatura_media: float = 0.0
    coordenadas: Optional[dict] = None
    es_mock: bool = False


class TaskCreateRequest(BaseModel):
    plan_id: str
    usuario_id: Optional[str] = None


class TaskResponse(BaseModel):
    task_id: str
    titulo: str
    estado: str
    prioridad: str
    plan_id: str


class CropThreshold(BaseModel):
    cultivo: str
    umbral_estres_hidrico_pct: float
    et0_mm_dia: float
    factor_raiz: float


class ThresholdsResponse(BaseModel):
    cultivos: list[CropThreshold]
