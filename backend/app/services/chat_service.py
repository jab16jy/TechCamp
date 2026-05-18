import uuid
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.conversacion import Conversacion
from app.models.mensaje import Mensaje
from app.models.analisis import Analisis
from app.models.sensor import Sensor
from app.models.lectura_sensor import LecturaSensor
from app.services.rag_service import search_rag

logger = logging.getLogger(__name__)


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

    response_text = await _generate_rag_response(db, user_uuid, message)

    ai_msg = Mensaje(
        conversacion_id=uuid.UUID(conversation_id),
        rol="ia",
        contenido=response_text,
        metadata={"source": "rag"},
    )
    db.add(ai_msg)
    await db.flush()

    return {
        "conversation_id": str(conversation_id),
        "message": {"rol": "ia", "contenido": response_text, "metadata": {"source": "rag"}},
    }


async def _generate_rag_response(db: AsyncSession, user_id: uuid.UUID, message: str) -> str:
    db_context = await _gather_db_context(db, user_id)
    rag_chunks = search_rag(message, k=3)
    rag_text = "\n\n".join(rag_chunks) if rag_chunks else ""

    lower = message.lower()

    if any(w in lower for w in ["maiz", "maíz"]):
        knowledge = _extract_knowledge(rag_text, "Maíz", "maiz")
        return _format_response_crop("Maíz", knowledge, db_context)

    if any(w in lower for w in ["yuca"]):
        knowledge = _extract_knowledge(rag_text, "Yuca", "yuca")
        return _format_response_crop("Yuca", knowledge, db_context)

    if any(w in lower for w in ["arroz"]):
        knowledge = _extract_knowledge(rag_text, "Arroz", "arroz")
        return _format_response_crop("Arroz", knowledge, db_context)

    if any(w in lower for w in ["platano", "plátano"]):
        knowledge = _extract_knowledge(rag_text, "Plátano", "platano")
        return _format_response_crop("Plátano", knowledge, db_context)

    if any(w in lower for w in ["cacao"]):
        knowledge = _extract_knowledge(rag_text, "Cacao", "cacao")
        return _format_response_crop("Cacao", knowledge, db_context)

    if any(w in lower for w in ["palma", "aceitera"]):
        knowledge = _extract_knowledge(rag_text, "Palma", "palma")
        return _format_response_crop("Palma aceitera", knowledge, db_context)

    if any(w in lower for w in ["name", "ñame"]):
        knowledge = _extract_knowledge(rag_text, "Ñame", "name")
        return _format_response_crop("Ñame", knowledge, db_context)

    if any(w in lower for w in ["algodon", "algodón"]):
        knowledge = _extract_knowledge(rag_text, "Algodón", "algodon")
        return _format_response_crop("Algodón", knowledge, db_context)

    if any(w in lower for w in ["frijol", "fríjol"]):
        knowledge = _extract_knowledge(rag_text, "Frijol", "frijol")
        return _format_response_crop("Frijol", knowledge, db_context)

    if any(w in lower for w in ["sorgo"]):
        knowledge = _extract_knowledge(rag_text, "Sorgo", "sorgo")
        return _format_response_crop("Sorgo", knowledge, db_context)

    if any(w in lower for w in ["plaga", "plagas", "enfermedad", "enfermedades", "gusano", "hongo"]):
        return _format_response_pests(rag_text, db_context)

    if any(w in lower for w in ["fertiliz", "abono", "nutriente", "npk"]):
        return _format_response_fertilizer(rag_text, db_context)

    if any(w in lower for w in ["riego", "regar", "agua", "sequia", "sequía"]):
        return _format_response_irrigation(rag_text, db_context)

    if any(w in lower for w in ["sensor", "sensores", "iot", "nodo"]):
        return _format_response_sensors(db_context)

    if any(w in lower for w in ["analisis", "ultimo", "resultado"]):
        return _format_response_analysis(db_context)

    if any(w in lower for w in ["recomendar", "recomendacion", "sembrar", "cultivo"]):
        return _format_response_recommend(db_context)

    if any(w in lower for w in ["historial", "historico"]):
        return _format_response_history(db_context)

    if any(w in lower for w in ["clima", "temperatura", "lluvia", "precipitacion"]):
        return _format_response_climate(rag_text, db_context)

    if any(w in lower for w in ["ndvi", "satelite", "satélite"]):
        return _format_response_ndvi(rag_text, db_context)

    if any(w in lower for w in ["suelo", "ph", "tierra"]):
        return _format_response_soil(rag_text, db_context)

    if any(w in lower for w in ["siembra", "sembrar", "epoca", "calendario"]):
        return _format_response_planting(rag_text, db_context)

    if any(w in lower for w in ["cosecha", "cosechar", "postcosecha", "almacenar"]):
        return _format_response_harvest(rag_text, db_context)

    if any(w in lower for w in ["buenas practicas", "bpa", "certificacion"]):
        return _format_response_bpa(rag_text, db_context)

    if rag_text:
        return _format_response_general_rag(rag_text, db_context)

    return _format_response_default()


async def _gather_db_context(db: AsyncSession, user_id: uuid.UUID) -> dict:
    ctx = {"has_data": False}

    if user_id:
        result = await db.execute(
            select(Analisis)
            .where(Analisis.usuario_id == user_id)
            .order_by(Analisis.created_at.desc())
            .limit(1)
        )
        ana = result.scalars().one_or_none()
        if ana:
            ctx["last_analysis"] = {
                "cultivo": ana.cultivo_recomendado,
                "score": ana.score,
                "lat": ana.lat,
                "lng": ana.lng,
                "tipo": ana.tipo,
                "fecha": ana.created_at.isoformat() if ana.created_at else None,
            }
            ctx["has_data"] = True

    result = await db.execute(select(Sensor).order_by(Sensor.nodo_id))
    sensores = result.scalars().all()
    if sensores:
        sensor_list = []
        for s in sensores[:5]:
            latest = await db.execute(
                select(LecturaSensor)
                .where(LecturaSensor.sensor_id == s.id)
                .order_by(LecturaSensor.created_at.desc())
                .limit(1)
            )
            lr = latest.scalars().one_or_none()
            sensor_list.append({
                "nodo": s.nodo_id,
                "estado": s.estado,
                "ndvi": lr.ndvi if lr else None,
                "humedad": lr.humedad if lr else None,
                "temperatura": lr.temperatura if lr else None,
            })
        ctx["sensors"] = sensor_list
        ctx["has_data"] = True

    return ctx


def _extract_knowledge(rag_text: str, crop_name: str, key: str) -> str:
    lines = rag_text.split("\n")
    relevant = [l for l in lines if crop_name.lower() in l.lower() or key.lower() in l.lower()]
    if relevant:
        return "\n".join(relevant[:20])
    if rag_text:
        return rag_text[:1500]
    return ""


def _format_response_crop(crop: str, knowledge: str, ctx: dict) -> str:
    head = f"**{crop}** — Informacion agricola para el Caribe colombiano:\n\n"
    if knowledge:
        cleaned = knowledge.replace("#", "").strip()
        head += cleaned[:1200]
        if len(cleaned) > 1200:
            head += "\n\n_Consulta mas detalles en la seccion de Analisis de Cultivos._"
    else:
        head += f"No tengo suficiente informacion sobre {crop} en este momento. "
        head += "Prueba preguntando sobre otro cultivo como maiz, yuca, platano o cacao."
    return head


def _format_response_pests(rag_text: str, ctx: dict) -> str:
    if rag_text:
        return f"**Plagas y Enfermedades en el Caribe Colombiano**\n\n{rag_text[:1500]}"
    return "No tengo informacion detallada sobre plagas en este momento. Revisa la guia de plagas y enfermedades."


def _format_response_fertilizer(rag_text: str, ctx: dict) -> str:
    if rag_text:
        return f"**Guia de Fertilizacion**\n\n{rag_text[:1500]}"
    return "La fertilizacion depende del cultivo y del analisis de suelo. Realiza un analisis de parcela para recomendaciones personalizadas."


def _format_response_irrigation(rag_text: str, ctx: dict) -> str:
    if rag_text:
        base = rag_text[:1200]
    else:
        base = "En el Caribe, el riego por goteo es el mas eficiente (90-95%). En epoca seca (dic-abr), cultivos como maiz necesitan riego cada 5-7 dias."
    if ctx.get("last_analysis"):
        la = ctx["last_analysis"]
        base += f"\n\nTu ultimo analisis fue en lat {la['lat']}, lng {la['lng']}. "
        base += "Genera un analisis de parcela para recomendaciones de riego personalizadas."
    return f"**Sistemas de Riego y Manejo Hidrico**\n\n{base}"


def _format_response_sensors(ctx: dict) -> str:
    sensors = ctx.get("sensors", [])
    if sensors:
        lines = ["**Estado de tus sensores IoT:**\n"]
        for s in sensors:
            icon = {"ok": "OK", "warn": "WARN", "critical": "CRIT"}
            line = f"• {s['nodo']} [{icon.get(s['estado'], '?')}]"
            if s.get("ndvi"):
                line += f" NDVI:{s['ndvi']}"
            if s.get("humedad"):
                line += f" Hum:{s['humedad']}%"
            if s.get("temperatura"):
                line += f" Temp:{s['temperatura']}C"
            lines.append(line)
        return "\n".join(lines)
    return "No hay sensores IoT configurados. Ve a la seccion de Sensores IoT para agregar nodos de monitoreo."


def _format_response_analysis(ctx: dict) -> str:
    la = ctx.get("last_analysis")
    if la:
        cultivo = la.get("cultivo") or "No determinado"
        score = la.get("score") or 0
        return (
            f"**Tu ultimo analisis:**\n\n"
            f"• Cultivo recomendado: **{cultivo}**\n"
            f"• Score: **{score}%**\n"
            f"• Fecha: {la.get('fecha', 'N/D')[:10]}\n"
            f"• Tipo: {la.get('tipo', 'simple')}\n\n"
            "Ve a la seccion **Historial** para ver todos tus analisis."
        )
    return "No tienes analisis registrados. Ve a **Analisis de Cultivos** para generar tu primer diagnostico."


def _format_response_recommend(ctx: dict) -> str:
    text = "Para una recomendacion de cultivos personalizada, dirijete a **Analisis de Cultivos** y completa el formulario con los datos de tu parcela.\n\n"
    text += "El sistema evaluara clima (NASA POWER), suelo y NDVI para recomendarte los 3 mejores cultivos con su puntuacion y justificacion."
    if ctx.get("last_analysis"):
        la = ctx["last_analysis"]
        text += f"\n\nTu ultimo analisis recomendo **{la.get('cultivo', 'N/D')}** con score de **{la.get('score', '?')}%**."
    return text


def _format_response_history(ctx: dict) -> str:
    if ctx.get("last_analysis"):
        return (
            "Tu historial de analisis esta disponible en la seccion **Historial** del menu lateral. "
            "Alli puedes ver todos tus diagnosticos de cultivos y calidad de suelo, filtrar por tipo y comparar resultados."
        )
    return "Aun no tienes analisis en tu historial. Realiza tu primer analisis de parcela en **Analisis de Cultivos**."


def _format_response_climate(rag_text: str, ctx: dict) -> str:
    text = "Los datos climaticos se obtienen de OpenMeteo y NASA POWER al ejecutar un analisis de parcela en **Analisis de Cultivos**.\n\n"
    if rag_text:
        text += rag_text[:1000]
    else:
        text += (
            "El Caribe colombiano tiene clima calido (26-30C), temporada seca dic-abr y lluvias may-nov. "
            "La precipitacion varia entre 500mm (Guajira) y 2500mm (Uraba)."
        )
    return text


def _format_response_ndvi(rag_text: str, ctx: dict) -> str:
    if rag_text:
        return f"**Interpretacion del NDVI**\n\n{rag_text[:1500]}"
    return (
        "El NDVI mide el vigor de la vegetacion (0=sin vegetacion, 1=verdor maximo). "
        "En el Caribe, cultivos saludables muestran NDVI entre 0.5 y 0.8. "
        "Valores por debajo de 0.3 indican estres (sequia, plagas o deficiencia nutricional)."
    )


def _format_response_soil(rag_text: str, ctx: dict) -> str:
    if rag_text:
        return f"**Manejo de Suelos**\n\n{rag_text[:1200]}"
    return (
        "Los suelos del Caribe colombiano son franco-arenosos (costa) y franco-arcillosos (valles). "
        "La materia organica suele ser baja (1-3%). Se recomienda aplicar compost o gallinaza (5-10 t/ha) "
        "y encalar si el pH es menor a 5.5."
    )


def _format_response_planting(rag_text: str, ctx: dict) -> str:
    if rag_text:
        return f"**Calendario de Siembra**\n\n{rag_text[:1200]}"
    return "La epoca de siembra optima en el Caribe es abril-mayo (inicio de lluvias). Cultivos de ciclo corto (frijol, maiz) pueden sembrarse tambien en agosto-septiembre."


def _format_response_harvest(rag_text: str, ctx: dict) -> str:
    if rag_text:
        return f"**Manejo de Cosecha y Postcosecha**\n\n{rag_text[:1200]}"
    return "La postcosecha es critica. Granos deben secarse a 12-14% humedad. Yuca se deteriora en 24-72h sin tratamiento. El platano se almacena a 12-14C."


def _format_response_bpa(rag_text: str, ctx: dict) -> str:
    if rag_text:
        return f"**Buenas Practicas Agricolas**\n\n{rag_text[:1500]}"
    return "Las BPA incluyen manejo adecuado de agua, suelo, cultivos y registro de actividades. Son requeridas para certificaciones como GlobalG.A.P."


def _format_response_general_rag(rag_text: str, ctx: dict) -> str:
    return f"**Informacion agricola relevante:**\n\n{rag_text[:1500]}\n\n_¿Tienes una pregunta mas especifica? Puedo ayudarte con cultivos, plagas, fertilizacion, riego, sensores o interpretacion de NDVI._"


def _format_response_default() -> str:
    return (
        "**AgroAsesor IA** — Estoy aqui para ayudarte con:\n\n"
        "• **Cultivos**: Preguntame sobre maiz, yuca, arroz, platano, cacao, palma, name, algodon, frijol o sorgo\n"
        "• **Plagas y enfermedades**: Identificacion y control para el Caribe\n"
        "• **Fertilizacion**: Dosis recomendadas por cultivo\n"
        "• **Riego**: Sistemas y frecuencias para epoca seca\n"
        "• **Sensores IoT**: Estado actual de tus nodos\n"
        "• **Analisis**: Tu ultimo resultado\n"
        "• **Historial**: Comparativa de diagnosticos\n"
        "• **NDVI**: Interpretacion de indices de vegetacion\n"
        "• **Suelos**: Manejo de suelos tropicales\n"
        "• **Siembra y cosecha**: Calendario agricola del Caribe\n\n"
        "Escribe el nombre de un cultivo o una pregunta y te respondere con conocimiento agronomico de la region Caribe colombiana."
    )
