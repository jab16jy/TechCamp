from typing import Optional
from pydantic import BaseModel, Field


class ClimateRiskRequest(BaseModel):
    lat: float = Field(..., ge=-4.5, le=12.5, description="Latitud WGS84")
    lon: float = Field(..., ge=-79.0, le=-66.0, description="Longitud WGS84")
    # year is optional: when omitted the backend resolves the most recent year
    # that has CHIRPS data for `month`.
    year: Optional[int] = Field(None, ge=1990, le=2030, description="Año (opcional)")
    month: int = Field(..., ge=1, le=12, description="Mes a evaluar")

    # ── Climate scenario (optional) — the model's real, user-meaningful inputs ──
    # (Soil/elevation are NOT features of the trained model, so they are not here.)
    precip_delta_pct: float = Field(0.0, ge=-100, le=300, description="Δ precipitación %")
    temp_delta_c: float = Field(0.0, ge=-10, le=10, description="Δ temperatura °C")


class RegistroPrediccionRequest(BaseModel):
    """Payload to persist one IAPredictiva run as a prediction history record."""
    lat: float
    lon: float
    municipio: Optional[str] = None
    departamento: Optional[str] = None
    datos_formulario: dict = {}      # inputs + simulation overrides
    resultado_completo: dict = {}    # riesgos + meta echoed back
    score: Optional[int] = None      # dominant risk as a 0-100 integer
    riesgo_dominante: Optional[str] = None


class FactorContribucion(BaseModel):
    factor: str
    importancia: float


class RiesgoScore(BaseModel):
    tipo: str
    probabilidad: float = Field(..., ge=0.0, le=1.0)
    severidad: str
    # Transparency fields — let the UI show HOW the number was produced.
    modelo_usado: str = "heuristico"          # "RiskClassifier" | "heuristico"
    fallback_heuristico: bool = False
    confianza_modelo: Optional[float] = None  # calibration-based, ~ 1 - Brier
    calibracion: Optional[str] = None         # "isotonic" | "sigmoid"
    supera_baseline: Optional[bool] = None    # vs the rule-based heuristic
    advertencia: Optional[str] = None         # set when model does NOT beat baseline


class ClimateRiskResponse(BaseModel):
    lat: float
    lon: float
    year: int
    month: int
    riesgos: list[RiesgoScore]
    factores_principales: list[FactorContribucion] = []
    modelo_disponible: bool
    mensaje: Optional[str] = None
    # Echo of the climate scenario applied, so the UI can flag a simulation.
    escenario: Optional[dict] = None
    simulacion: bool = False
