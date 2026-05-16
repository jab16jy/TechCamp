import uuid
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.analisis import Analisis
from app.models.sensor import Sensor
from app.models.lectura_sensor import LecturaSensor
from app.services.climate_service import get_climate_data
from app.ml.model import get_crop_classifier

logger = logging.getLogger(__name__)


async def get_last_analysis(db: AsyncSession, user_id: str) -> str:
    try:
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(
            select(Analisis)
            .where(Analisis.usuario_id == user_uuid)
            .order_by(Analisis.created_at.desc())
            .limit(1)
        )
        ana = result.scalars().one_or_none()
        if ana is None:
            return "No tienes analisis registrados. Ve a Analisis de Cultivos para generar tu primer diagnostico."
        return (
            f"Ultimo analisis ({ana.created_at.strftime('%d/%m/%Y')}):\n"
            f"Cultivo recomendado: {ana.cultivo_recomendado} (Score: {ana.score}%)\n"
            f"Tipo: {ana.tipo}"
        )
    except Exception:
        return "Error al consultar el ultimo analisis."


async def get_history_summary(db: AsyncSession, user_id: str) -> str:
    try:
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(
            select(Analisis)
            .where(Analisis.usuario_id == user_uuid)
            .order_by(Analisis.created_at.desc())
            .limit(5)
        )
        analyses = result.scalars().all()
        if not analyses:
            return "No hay analisis en el historial."
        lines = [f"{len(analyses)} analisis encontrados:"]
        for a in analyses:
            date_str = a.created_at.strftime("%d/%m") if a.created_at else "?"
            lines.append(
                f"- {a.cultivo_recomendado or 'N/D'} (Score: {a.score}%) - {date_str}"
            )
        return "\n".join(lines)
    except Exception:
        return "Error al consultar el historial."


async def get_crop_recommendation(
    db: AsyncSession, user_id: str, lat: float, lng: float
) -> str:
    try:
        climate = await get_climate_data(lat, lng)
        classifier = get_crop_classifier()
        scores = classifier.score(
            temperatura=climate.temperatura,
            humedad=climate.humedad,
            precipitacion=climate.precipitacion,
            ph_suelo=6.5,
            materia_organica=3.0,
            ndvi=0.42,
        )
        lines = ["Recomendaciones para las coordenadas consultadas:"]
        for s in scores:
            lines.append(
                f"{s['emoji']} {s['cultivo']}: Score {s['score']}% ({s['riesgo']})"
            )
        return "\n".join(lines)
    except Exception:
        return "No se pudo generar la recomendacion en este momento."


async def get_sensor_status(db: AsyncSession) -> str:
    try:
        result = await db.execute(select(Sensor).order_by(Sensor.nodo_id))
        sensores = result.scalars().all()

        if not sensores:
            return "No hay sensores IoT registrados en el sistema."

        lines = ["Estado de sensores IoT:"]
        for s in sensores:
            icon = {"ok": "OK", "warn": "WARN", "critical": "CRIT"}
            line_icon = icon.get(s.estado, "?")

            latest = await db.execute(
                select(LecturaSensor)
                .where(LecturaSensor.sensor_id == s.id)
                .order_by(LecturaSensor.created_at.desc())
                .limit(1)
            )
            latest_reading = latest.scalars().one_or_none()

            lectura_str = ""
            if latest_reading:
                lectura_str = (
                    f" NDVI:{latest_reading.ndvi or '?'} "
                    f"Hum:{latest_reading.humedad or '?'}% "
                    f"Temp:{latest_reading.temperatura or '?'}C"
                )
            lines.append(f"- {s.nodo_id} ({s.nombre}): [{line_icon}]{lectura_str}")

        return "\n".join(lines)
    except Exception as e:
        logger.exception("Error querying sensors")
        return "Error al consultar el estado de sensores."
