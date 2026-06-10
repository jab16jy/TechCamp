import unicodedata
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class ScenarioPreset(str, Enum):
    """Presets climaticos predefinidos para el simulador de escenarios."""
    nino = "nino"
    nina = "nina"
    normal = "normal"


class ScenarioRequest(BaseModel):
    """Solicitud de proyeccion con escenario what-if.

    Permite simular condiciones climaticas alteradas (deltas)
    y ajustes de insumos para evaluar su impacto en los cultivos.
    """
    lat: Optional[float] = None
    lng: Optional[float] = None
    meses: int = Field(default=6, ge=1, le=6, description="Meses a proyectar")
    precip_delta_pct: float = Field(
        default=0, ge=-80, le=80,
        description="Delta porcentual de precipitacion (-80 a +80)"
    )
    temp_delta_c: float = Field(
        default=0, ge=-5, le=5,
        description="Delta de temperatura en °C (-5 a +5)"
    )
    npk_override: Optional[float] = Field(
        default=None, description="Ajuste de fertilizacion NPK (kg/ha)"
    )
    riego_override: Optional[float] = Field(
        default=None, description="Ajuste de riego (%)"
    )
    preset: Optional[ScenarioPreset] = Field(
        default=None, description="Preset climatico predefinido"
    )


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
    cultivo: Optional[str] = Field(default=None, description="Cultivo seleccionado para la proyeccion")
    meses: int = Field(default=3, ge=1, le=6, description="Numero de meses a proyectar (1-6)")
    npk_override: Optional[float] = Field(default=None, description="Ajuste de fertilizacion NPK (0-250 kg/ha)")
    riego_override: Optional[float] = Field(default=None, description="Ajuste de riego (0-100%)")
    fecha_inicio: Optional[str] = Field(default=None, description="Fecha ISO de inicio de la proyeccion (ej. 2025-05-01)")
    fecha_siembra: Optional[str] = Field(default=None, description="Fecha ISO de siembra (ej. 2025-04-01)")
    dias_desde_siembra: Optional[int] = Field(default=None, description="Dias transcurridos desde la siembra")
    ciclo_dias: Optional[int] = Field(default=None, description="Duracion total del ciclo del cultivo en dias")


def _normalize_cultivo(name: str) -> str:
    """Normalize cultivar names: strip accents, replace Ñ→N, spaces→underscores, and map known aliases.
    Added support for Mango ("Mango" → "Mango"), Ají ("Ají" → "Ají"),
    and Palma_Aceitera ("Palma Aceitera" / "Palma_de_aceitera" → "Palma_Aceitera")."""
    nfkd = unicodedata.normalize('NFD', name)
    ascii_str = nfkd.encode('ascii', 'ignore').decode('ascii')
    ascii_str = ascii_str.replace(' ', '_')
    # Aliases mapping
    aliases = {
        "MANGO": "Mango",
        "AJI": "Ají",
        "PALMA_ACEITERA": "Palma_Aceitera",
        "PALMA_DE_ACEITERA": "Palma_Aceitera",
    }
    key = ascii_str.upper()
    if key in aliases:
        return aliases[key]
    return ascii_str


def _ciclo_dias_for(cultivo: str, default: int = 90) -> int:
    """Resolve ciclo_dias from CropClassifier by cultivo name."""
    from app.ml.model import get_crop_classifier
    classifier = get_crop_classifier()
    normalized = _normalize_cultivo(cultivo)
    for crop in classifier.crops:
        if _normalize_cultivo(crop["cultivo"]) == normalized:
            return crop["ciclo_dias"]
    return default


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
    ndwi_real: Optional[float] = None
    radiacion_solar: Optional[float] = None
    etapa_fenologica: Optional[str] = None
    cultivos_recomendados: list[CropScore] = []
    alertas: list[Alert] = []
    riesgo_inundacion: Optional[dict] = None
    riesgo_sequia: Optional[dict] = None
    xai_justificacion: Optional[str] = None


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
    acciones_mitigacion: list = Field(default_factory=list)
