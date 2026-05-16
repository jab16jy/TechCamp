import uuid
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.conversacion import Conversacion
from app.models.mensaje import Mensaje
from app.models.analisis import Analisis
from app.models.sensor import Sensor
from app.models.lectura_sensor import LecturaSensor

logger = logging.getLogger(__name__)

CHAT_ACTIONS = {
    "ultimo": "get_last_analysis",
    "historial": "get_history_summary",
    "recomendar": "get_crop_recommendation",
    "sensores": "get_sensor_status",
}


async def process_chat_message(
    db: AsyncSession,
    user_id: str,
    message: str,
    conversation_id: str | None = None,
) -> dict:
    user_uuid = uuid.UUID(user_id) if user_id else None

    if not conversation_id:
        conv = Conversacion(usuario_id=user_uuid)
        db.add(conv)
        await db.flush()
        conversation_id = str(conv.id)
    else:
        conv_uuid = uuid.UUID(conversation_id)
        result = await db.execute(
            select(Conversacion).where(Conversacion.id == conv_uuid)
        )
        conv = result.scalars().one_or_none()
        if conv is None:
            conv = Conversacion(id=conv_uuid, usuario_id=user_uuid)
            db.add(conv)
            await db.flush()

    user_msg = Mensaje(
        conversacion_id=uuid.UUID(conversation_id),
        rol="usuario",
        contenido=message,
    )
    db.add(user_msg)
    await db.flush()

    response_text, response_meta = await _generate_response(db, user_uuid, message)

    ai_msg = Mensaje(
        conversacion_id=uuid.UUID(conversation_id),
        rol="ia",
        contenido=response_text,
        metadata=response_meta,
    )
    db.add(ai_msg)
    await db.flush()

    return {
        "conversation_id": str(conversation_id),
        "message": {
            "rol": "ia",
            "contenido": response_text,
            "metadata": response_meta,
        },
    }


async def _generate_response(
    db: AsyncSession,
    user_id: uuid.UUID,
    message: str,
) -> tuple[str, dict]:
    message_lower = message.lower()
    meta = {"action": "default"}

    if any(w in message_lower for w in ["analisis", "ultimo", "ultimo"]):
        return await _get_last_analysis(db, user_id), {"action": "get_last_analysis"}

    if any(w in message_lower for w in ["historial", "histerico", "historico"]):
        return await _get_history_summary(db, user_id), {"action": "get_history_summary"}

    if any(w in message_lower for w in ["recomendar", "recomendacion", "cultivo", "sembrar", "siembra"]):
        return await _get_crop_recommendation(db, user_id), {"action": "get_crop_recommendation"}

    if any(w in message_lower for w in ["sensor", "sensores", "iot", "nodo", "monitoreo"]):
        return await _get_sensor_status(db, user_id), {"action": "get_sensor_status"}

    default = (
        "Entiendo tu consulta. Puedo ayudarte con:\n\n"
        "1. **Ver tu ultimo analisis** — di 'ultimo analisis'\n"
        "2. **Comparar historicos** — di 'historial'\n"
        "3. **Recomendar cultivos** — di 'recomendar'\n"
        "4. **Estado de sensores** — di 'sensores'\n\n"
        "Tambien puedes preguntarme sobre condiciones climaticas, interpretacion de NDVI o cualquier duda agricola."
    )
    return default, {"action": "default"}


async def _get_last_analysis(db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(
        select(Analisis)
        .where(Analisis.usuario_id == user_id)
        .order_by(Analisis.created_at.desc())
        .limit(1)
    )
    ana = result.scalars().one_or_none()

    if ana is None:
        return "Aun no tienes analisis registrados. Dirigete a la seccion **Analisis de Cultivos** para generar tu primer diagnostico."

    return (
        f"Tu ultimo analisis fue generado el {ana.created_at.strftime('%d de %B de %Y') if ana.created_at else 'recientemente'}.\n\n"
        f"**Resumen del analisis:**\n"
        f"• Cultivo recomendado: **{ana.cultivo_recomendado or 'N/D'}**\n"
        f"• Score: **{ana.score or 0}%**\n"
        f"• Tipo: **{ana.tipo}**\n\n"
        "¿Quieres que profundice en algun parametro especifico o comparar con otros resultados?"
    )


async def _get_history_summary(db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(
        select(Analisis)
        .where(Analisis.usuario_id == user_id)
        .order_by(Analisis.created_at.desc())
        .limit(5)
    )
    analyses = result.scalars().all()

    if not analyses:
        return "No tienes analisis en tu historial. Realiza tu primer analisis desde la seccion **Analisis de Cultivos**."

    lines = [f"Tienes **{len(analyses)} analisis** en tu historial:\n"]
    for i, a in enumerate(analyses, 1):
        date_str = a.created_at.strftime("%d %b %Y") if a.created_at else "N/D"
        cultivo = a.cultivo_recomendado or "N/D"
        lines.append(f"**{i}.** {cultivo} — Score: {a.score or 0}% — {date_str}")

    lines.append("\n¿Quieres que compare los NDVI o los rankings de cultivos?")
    return "\n".join(lines)


async def _get_crop_recommendation(db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(
        select(Analisis)
        .where(Analisis.usuario_id == user_id)
        .order_by(Analisis.created_at.desc())
        .limit(1)
    )
    ana = result.scalars().one_or_none()

    if ana and ana.resultado_completo:
        recs = ana.resultado_completo.get("recomendaciones", [])
        if recs:
            lines = ["**Recomendaciones de cultivo basadas en tu ultimo analisis:**\n"]
            for r in recs[:3]:
                emoji = r.get("emoji", "")
                cultivo = r.get("cultivo", "")
                score = r.get("score", 0)
                riesgo = r.get("riesgo", "")
                lines.append(f"• {emoji} **{cultivo}** — Score: {score}% · Riesgo: {riesgo}")
            return "\n".join(lines)

    return (
        "Basado en las condiciones tipicas del Caribe colombiano, te recomiendo:\n\n"
        "• 🌽 **Maiz** — Excelente adaptacion a suelos franco-arcillosos\n"
        "• 🥔 **Yuca** — Alta tolerancia a sequia y suelos pobres\n"
        "• 🌿 **Algodon** — Buen rendimiento con riego complementario\n\n"
        "Realiza un analisis especifico de tu parcela para recomendaciones personalizadas."
    )


async def _get_sensor_status(db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(select(Sensor).order_by(Sensor.nodo_id))
    sensores = result.scalars().all()

    if not sensores:
        return "No hay sensores IoT registrados en el sistema. Ve a la seccion **Sensores IoT** para configurar nodos de monitoreo."

    lines = ["**Estado de sensores IoT:**\n"]
    for s in sensores:
        icon = {"ok": "✅ OK", "warn": "⚠️ Alerta", "critical": "🔴 Critico"}
        line_icon = icon.get(s.estado, "❓")
        latest = await db.execute(
            select(LecturaSensor)
            .where(LecturaSensor.sensor_id == s.id)
            .order_by(LecturaSensor.created_at.desc())
            .limit(1)
        )
        lr = latest.scalars().one_or_none()
        lectura_str = ""
        if lr:
            lectura_str = (
                f" NDVI: {lr.ndvi or '?'} · Hum: {lr.humedad or '?'}% · "
                f"Temp: {lr.temperatura or '?'}C"
            )
        lines.append(f"• **{s.nodo_id}** ({s.nombre}): {line_icon}{lectura_str}")

    critical_nodes = [s for s in sensores if s.estado == "critical"]
    if critical_nodes:
        lines.append(f"\n⚠️ {len(critical_nodes)} nodo(s) en estado critico. Recomiendo revision del sistema de riego y telemetria en esas zonas.")

    return "\n".join(lines)
