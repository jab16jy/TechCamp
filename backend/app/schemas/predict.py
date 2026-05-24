from pydantic import BaseModel, Field
from typing import Optional


class FactorWeight(BaseModel):
    factor: str = Field(description="Nombre legible del factor")
    peso: float = Field(description="Peso del factor en el modelo (0-1)")
    score_parcial: float = Field(description="Score crudo del factor (0-1)")
    porcentaje_impacto: float = Field(description="Contribucion porcentual normalizada")


class Alert(BaseModel):
    tipo: str = Field(description="fitosanitario | estres_hidrico | estres_termico")
    severidad: str = Field(description="critico | alto | moderado")
    mensaje: str
    cultivo_afectado: Optional[str] = None
    mes: Optional[int] = None
    enfermedad: Optional[str] = None


class PredictRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    analysis_id: Optional[str] = None
    meses: int = Field(default=3, ge=1, le=6, description="Numero de meses a proyectar (1-6)")
    npk_override: Optional[float] = Field(default=None, description="Ajuste de fertilizacion NPK (0-250 kg/ha)")
    riego_override: Optional[float] = Field(default=None, description="Ajuste de riego (0-100%)")
    fecha_inicio: Optional[str] = Field(default=None, description="Fecha ISO de inicio de la proyeccion (ej. 2025-05-01)")
    dias_desde_siembra: Optional[int] = Field(default=None, description="Dias transcurridos desde la siembra")
    ciclo_dias: Optional[int] = Field(default=None, description="Duracion total del ciclo del cultivo en dias")


class OptimalDayRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    analysis_id: Optional[str] = None
    mes_siembra: Optional[str] = None


class OptimalDayResponse(BaseModel):
    ventana_inicio: str
    ventana_fin: str
    confianza: float = Field(ge=0, le=100)
    justificacion: str
    riesgo_minimizado: list[str] = []


class CropScore(BaseModel):
    cultivo: str
    score: int
    riesgo: str
    emoji: str = ""
    metodo: str = "heuristico"
    probabilidad: Optional[float] = None
    factor_weights: list[FactorWeight] = []


class MonthProjection(BaseModel):
    month: str
    year: int
    month_num: int
    temperatura: float
    precipitacion: float
    humedad: float
    ndvi_estimado: float
    radiacion_solar: Optional[float] = None
    etapa_fenologica: Optional[str] = None
    cultivos_recomendados: list[CropScore] = []
    alertas: list[Alert] = []


class PredictResponse(BaseModel):
    ubicacion: dict
    meses: list[MonthProjection]
    mejor_mes: Optional[str] = None
    mejor_cultivo: Optional[str] = None
    fuente: str = "NASA POWER + OpenMeteo"
    alertas_globales: list[Alert] = []
    alertas_patrones: list[Alert] = []
    best_window: Optional[OptimalDayResponse] = None
    analysis_inherited: Optional[dict] = None
