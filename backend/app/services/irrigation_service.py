import logging
import math
from datetime import datetime, timezone, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.sensor import Sensor
from app.models.lectura_sensor import LecturaSensor
from app.models.plan_riego import PlanRiego
from app.models.parcela import Parcela
from app.services.prediction_service import project_window
from app.services.prediction_service import fetch_current_climate

logger = logging.getLogger(__name__)

UMBRAL_ESTRES_HIDRICO = {
    "Maíz": 20, "Yuca": 18, "Plátano": 25, "Arroz": 30,
    "Frijol": 22, "Ñame": 20, "Cacao": 28, "Algodón": 18,
    "Sorgo": 18, "Palma Aceitera": 28,
}

ET0_BASE = {
    "Maíz": 5.2, "Yuca": 4.1, "Plátano": 4.8, "Arroz": 6.0,
    "Frijol": 4.5, "Ñame": 4.3, "Cacao": 3.5, "Algodón": 5.8,
    "Sorgo": 5.5, "Palma Aceitera": 4.0,
}

FACTOR_RAIZ = {
    "Maíz": 1.0, "Yuca": 1.2, "Plátano": 0.9, "Arroz": 0.7,
    "Frijol": 0.8, "Ñame": 1.1, "Cacao": 0.7, "Algodón": 1.0,
    "Sorgo": 1.1, "Palma Aceitera": 0.9,
}

FACTOR_TEXTURA = {
    "arenoso": 1.3,
    "franco-arenoso": 1.2,
    "franco": 1.0,
    "franco-limoso": 0.9,
    "limoso": 0.85,
    "franco-arcilloso": 0.8,
    "arcilloso": 0.75,
}

DIAS_SEMANA = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]


def _normalizar_textura(textura: str | None) -> str:
    if not textura:
        return "franco"
    return textura.strip().lower()


def _obtener_factor_textura(textura: str) -> float:
    return FACTOR_TEXTURA.get(_normalizar_textura(textura), 1.0)


def _umbral_cultivo(cultivo: str) -> float:
    for k, v in UMBRAL_ESTRES_HIDRICO.items():
        if k.lower() == cultivo.lower():
            return v
    return 20.0


def _et0_cultivo(cultivo: str) -> float:
    for k, v in ET0_BASE.items():
        if k.lower() == cultivo.lower():
            return v
    return 5.0


def _factor_raiz_cultivo(cultivo: str) -> float:
    for k, v in FACTOR_RAIZ.items():
        if k.lower() == cultivo.lower():
            return v
    return 1.0


async def _ultima_lectura(db: AsyncSession, sensor_uuid: UUID) -> LecturaSensor | None:
    result = await db.execute(
        select(LecturaSensor)
        .where(LecturaSensor.sensor_id == sensor_uuid)
        .order_by(LecturaSensor.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _parcela_cercana(db: AsyncSession, lat: float, lng: float) -> Parcela | None:
    try:
        from geoalchemy2 import functions as gfunc
        result = await db.execute(
            select(Parcela)
            .where(
                gfunc.ST_DWithin(
                    Parcela.poligono,
                    gfunc.ST_SetSRID(gfunc.ST_MakePoint(lng, lat), 4326),
                    500,
                )
            )
            .limit(1)
        )
        return result.scalar_one_or_none()
    except Exception:
        return None


def _calcular_prob_lluvia(months_projected: list[dict], n_days: int = 7) -> float:
    if not months_projected:
        return 1.0
    first = months_projected[0]
    prec = first.get("precipitacion", 0)
    days = min(n_days, 30)
    daily = prec / max(30, 1) * days
    return round(max(0.0, min(1.0, daily / 20.0)), 3)


def _generar_eventos_riego(
    plan_id: str,
    ventana_inicio: datetime,
    ventana_fin: datetime,
    volumen_total: float,
    frecuencia_dias: int,
    horario: str,
    textura: str,
) -> list[dict]:
    eventos = []
    current = ventana_inicio
    dias_total = max(1, (ventana_fin - ventana_inicio).days)
    num_eventos = max(1, dias_total // max(frecuencia_dias, 1))
    litros_por_evento = round(volumen_total / max(num_eventos, 1), 1)
    textura_norm = _normalizar_textura(textura)

    for i in range(num_eventos):
        dia_evento = ventana_inicio + timedelta(days=i * frecuencia_dias)
        if dia_evento > ventana_fin:
            break
        dia_label = DIAS_SEMANA[dia_evento.weekday()]
        eventos.append({
            "dia": dia_label,
            "fecha": dia_evento.strftime("%d %b %Y"),
            "hora": horario,
            "litros_ha": litros_por_evento,
            "motivo": (
                "Aplicacion para compensar deficit hidrico"
                if i == 0
                else f"Riego de mantenimiento en suelo {textura_norm}"
            ),
        })
    return eventos


def _construir_xai(
    cultivo: str,
    textura: str,
    dias_sequia: int,
    radiacion: float,
    humedad_actual: float,
    umbral: float,
    prob_lluvia: float,
) -> str:
    textura_norm = _normalizar_textura(textura)
    factor = _obtener_factor_textura(textura)
    if factor > 1.0:
        rec_textura = "tiene alta capacidad de drenaje, requiriendo riego mas frecuente"
    elif factor < 0.9:
        rec_textura = "retiene bien la humedad, permitiendo riegos mas espaciados"
    else:
        rec_textura = "tiene una capacidad de retencion de humedad balanceada"

    return (
        f"Plan sugerido para compensar {dias_sequia} dias de ausencia de lluvias "
        f"(probabilidad estimada: {int(prob_lluvia * 100)}%) y radiacion solar extrema "
        f"({radiacion} MJ/m2/dia). La humedad del suelo actual ({humedad_actual}%) "
        f"esta por debajo del umbral critico para {cultivo} ({umbral}%). "
        f"El suelo {textura_norm} {rec_textura}. "
        f"Se recomienda aplicar en horario de menor evaporacion ({'05:00 - 07:00'}) "
        f"para maximizar la eficiencia hidrica."
    )


async def evaluar_trigger(
    sensor_uuid: UUID,
    db: AsyncSession,
) -> dict:
    lectura = await _ultima_lectura(db, sensor_uuid)
    if not lectura or lectura.humedad is None:
        return {"activado": False, "razon": "sin_lectura"}

    sensor = await db.get(Sensor, sensor_uuid)
    if not sensor:
        return {"activado": False, "razon": "sensor_no_encontrado"}

    cultivo = getattr(sensor, "cultivo", None) or "Maíz"
    umbral = _umbral_cultivo(cultivo)
    humedad_actual = lectura.humedad

    if humedad_actual >= umbral:
        return {
            "activado": False,
            "razon": "humedad_sobre_umbral",
            "humedad_actual": humedad_actual,
            "umbral": umbral,
            "cultivo": cultivo,
        }

    try:
        proyeccion = await project_window(
            lat=sensor.lat,
            lng=sensor.lng,
            n_months=1,
        )
    except Exception:
        proyeccion = None

    prob_7d = _calcular_prob_lluvia(proyeccion.get("meses", []) if proyeccion else [], 7)
    prob_14d = _calcular_prob_lluvia(proyeccion.get("meses", []) if proyeccion else [], 14)

    if prob_7d >= 0.15:
        return {
            "activado": False,
            "razon": "lluvia_probable",
            "humedad_actual": humedad_actual,
            "umbral": umbral,
            "prob_lluvia_7d": prob_7d,
            "cultivo": cultivo,
        }

    return {
        "activado": True,
        "razon": "riesgo_deficit_critico",
        "humedad_actual": humedad_actual,
        "umbral": umbral,
        "cultivo": cultivo,
        "prob_lluvia_7d": prob_7d,
        "prob_lluvia_14d": prob_14d,
    }


async def generar_plan(
    sensor_uuid: UUID,
    db: AsyncSession,
    cultivo: str | None = None,
    analysis_id: str | None = None,
) -> dict:
    lectura = await _ultima_lectura(db, sensor_uuid)
    if not lectura:
        return {"error": "Sin lecturas disponibles para este sensor"}

    sensor = await db.get(Sensor, sensor_uuid)
    if not sensor:
        return {"error": "Sensor no encontrado"}

    if not cultivo:
        cultivo = "Maíz"

    humedad_actual = lectura.humedad or 50.0
    umbral = _umbral_cultivo(cultivo)

    result_trigger = await evaluar_trigger(sensor_uuid, db)

    try:
        proyeccion = await project_window(
            lat=sensor.lat,
            lng=sensor.lng,
            n_months=1,
        )
    except Exception:
        proyeccion = None

    prob_7d = result_trigger.get("prob_lluvia_7d", 0.0)
    prob_14d = result_trigger.get("prob_lluvia_14d", 0.0)

    if proyeccion and proyeccion.get("meses"):
        prob_7d = _calcular_prob_lluvia(proyeccion["meses"], 7)
        prob_14d = _calcular_prob_lluvia(proyeccion["meses"], 14)

    riesgo = "critico" if result_trigger.get("activado") else "moderado"

    try:
        clima = await fetch_current_climate(sensor.lat, sensor.lng)
    except Exception:
        clima = {"temperatura": 28.0, "radiacion_solar": 18.0}

    temp_media = clima.get("temperatura", 28.0)
    radiacion = clima.get("radiacion_solar", 18.0)

    parcela = await _parcela_cercana(db, sensor.lat, sensor.lng)

    textura_suelo = "Franco"
    try:
        from app.services.soil_service import get_soil_data
        soil_data = await get_soil_data(sensor.lat, sensor.lng)
        if soil_data:
            textura_suelo = soil_data.get("textura_suelo", "Franco")
    except Exception:
        pass

    textura_norm = _normalizar_textura(textura_suelo)
    factor_textura = _obtener_factor_textura(textura_suelo)
    factor_raiz = _factor_raiz_cultivo(cultivo)
    et0 = _et0_cultivo(cultivo)

    temp_factor = 1.0 + max(0, (temp_media - 25) * 0.05)
    et0_ajustada = et0 * temp_factor

    now = datetime.now(timezone.utc)
    ventana_dias = 7
    frecuencia_dias = max(1, int(3 / factor_textura))

    if "arenoso" in textura_norm:
        frecuencia_dias = 2
    elif "arcilloso" in textura_norm:
        frecuencia_dias = 4
    else:
        frecuencia_dias = 3

    volumen_total = et0_ajustada * factor_textura * factor_raiz * ventana_dias
    volumen_total = round(volumen_total, 1)

    horario_optimo = "05:00 - 07:00"
    ventana_inicio = now + timedelta(days=1)
    ventana_inicio = ventana_inicio.replace(hour=5, minute=0, second=0, microsecond=0)
    ventana_fin = ventana_inicio + timedelta(days=ventana_dias)
    ventana_fin = ventana_fin.replace(hour=7, minute=0, second=0, microsecond=0)

    dias_sequia = max(7, int(14 * (1 - prob_14d)))
    justificacion = _construir_xai(
        cultivo=cultivo,
        textura=textura_suelo,
        dias_sequia=dias_sequia,
        radiacion=radiacion,
        humedad_actual=humedad_actual,
        umbral=umbral,
        prob_lluvia=prob_14d,
    )

    plan = PlanRiego(
        sensor_id=sensor_uuid,
        parcela_id=parcela.id if parcela else None,
        cultivo=cultivo,
        umbral_humedad=umbral,
        humedad_actual=humedad_actual,
        prob_lluvia_7d=prob_7d,
        prob_lluvia_14d=prob_14d,
        volumen_agua_m3_ha=volumen_total / 10.0,
        frecuencia_dias=frecuencia_dias,
        horario_optimo=horario_optimo,
        ventana_inicio=ventana_inicio,
        ventana_fin=ventana_fin,
        justificacion_xai=justificacion,
        textura_suelo=textura_suelo,
        et0_mm_dia=et0_ajustada,
        temperatura_media=temp_media,
        estado="generado",
    )
    db.add(plan)
    await db.flush()

    eventos = _generar_eventos_riego(
        plan_id=str(plan.id),
        ventana_inicio=ventana_inicio,
        ventana_fin=ventana_fin,
        volumen_total=volumen_total * 10,
        frecuencia_dias=frecuencia_dias,
        horario=horario_optimo,
        textura=textura_suelo,
    )

    return {
        "plan_id": str(plan.id),
        "sensor_id": str(sensor.id),
        "sensor_nodo": sensor.nodo_id,
        "cultivo": cultivo,
        "humedad_actual": humedad_actual,
        "umbral_cultivo": umbral,
        "prob_lluvia_7d": prob_7d,
        "prob_lluvia_14d": prob_14d,
        "riesgo": riesgo,
        "volumen_total_m3_ha": round(volumen_total, 1),
        "frecuencia_dias": frecuencia_dias,
        "horario_optimo": horario_optimo,
        "ventana_inicio": ventana_inicio.strftime("%d %b %Y"),
        "ventana_fin": ventana_fin.strftime("%d %b %Y"),
        "eventos": eventos,
        "justificacion_xai": justificacion,
        "textura_suelo": textura_suelo,
        "et0_mm_dia": round(et0_ajustada, 1),
        "temperatura_media": temp_media,
        "coordenadas": {"lat": sensor.lat, "lng": sensor.lng},
    }


async def get_umbrales() -> list[dict]:
    return [
        {"cultivo": k, "umbral_estres_hidrico_pct": v,
         "et0_mm_dia": ET0_BASE.get(k, 5.0),
         "factor_raiz": FACTOR_RAIZ.get(k, 1.0)}
        for k, v in UMBRAL_ESTRES_HIDRICO.items()
    ]
