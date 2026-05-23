import uuid
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.conversacion import Conversacion
from app.models.mensaje import Mensaje
from app.models.analisis import Analisis
from app.models.sensor import Sensor
from app.models.lectura_sensor import LecturaSensor
from app.agent import create_agent_graph
from app.services.rag_service import search_rag
from app.services.llm_service import generate_response, is_available as llm_available

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Eres AgroAsesor IA, un asistente agronomico especializado en la region Caribe colombiana (Atlantico, Bolivar, Cesar, Cordoba, La Guajira, Magdalena, Sucre).

BASE DE CONOCIMIENTO AGRICOLA:
{rag_knowledge}

CONTEXTO DEL USUARIO:
{db_context}

INSTRUCCIONES:
- Responde UNICAMENTE con informacion de la base de conocimiento proporcionada arriba.
- Si el usuario pregunta algo que NO esta en la base de conocimiento, dile honestamente que no tienes esa informacion y sugierele consultar fuentes como Agrosavia, ICA o FAO.
- Se conciso y directo. Usa formato Markdown: **negritas** para enfasis, listas con -, tablas si son utiles.
- Incluye datos numericos (dosis kg/ha, temperaturas C, pH, distancias km) cuando esten en la base de conocimiento.
- Adapta la respuesta al CONTEXTO DEL USUARIO: si tiene analisis previos o sensores IoT, menciona esos datos.
- Menciona el departamento o subregion cuando sea relevante (ej: "En La Guajira...", "En los valles del Cesar...").
- Si el usuario pide recomendaciones de cultivo, guialo a la seccion **Analisis de Cultivos** de la plataforma.
- Si pregunta por sensores IoT, historial o analisis, usa los datos del CONTEXTO DEL USUARIO.
- NUNCA inventes datos agronomicos. Si no hay informacion en la base de conocimiento, dilo claramente.
- Responde en espanol, con tono profesional pero accesible para un productor agricola."""


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

    conv_uuid = uuid.UUID(conversation_id)
    response_text, source = await _generate_response(db, user_uuid, message, conv_uuid)

    ai_msg = Mensaje(
        conversacion_id=uuid.UUID(conversation_id),
        rol="ia",
        contenido=response_text,
        metadata={"source": source},
    )
    db.add(ai_msg)
    await db.flush()

    return {
        "conversation_id": str(conversation_id),
        "message": {"rol": "ia", "contenido": response_text, "metadata": {"source": source}},
    }


async def _generate_response(
    db: AsyncSession,
    user_id: uuid.UUID | None,
    message: str,
    conv_id: uuid.UUID,
) -> tuple[str, str]:
    if llm_available():
        try:
            result = await _generate_agent_response(db, user_id, message, conv_id)
            if result:
                return result, "langgraph-agent"
        except Exception as e:
            logger.warning(f"Agent fallo — usando LLM directo: {e}")

        try:
            result = await _generate_llm_response(db, user_id, message, conv_id)
            if result:
                return result, "llm"
        except Exception as e:
            logger.warning(f"LLM fallo — usando fallback keyword: {e}")

    result = _generate_keyword_response(db, user_id, message)
    return result, "keyword-fallback"


async def _generate_agent_response(
    db: AsyncSession,
    user_id: uuid.UUID | None,
    message: str,
    conv_id: uuid.UUID,
) -> str:
    user_id_str = str(user_id) if user_id else None
    history = await _get_conversation_history(db, conv_id)
    history_text = _format_history_for_agent(history)

    graph = create_agent_graph(db, user_id_str, str(conv_id))

    initial_state = {
        "user_message": message,
        "user_id": user_id_str,
        "history_text": history_text,
        "rag_results": [],
        "db_context": "",
        "intent": "",
        "final_response": "",
    }

    result = await graph.ainvoke(initial_state)
    return result.get("final_response", "")


def _format_history_for_agent(history: list[dict]) -> str:
    if not history:
        return ""
    lines = []
    for m in history[-6:]:
        role = "Usuario" if m["role"] == "user" else "Asistente"
        lines.append(f"{role}: {m['content'][:300]}")
    return "\n".join(lines)


async def _generate_llm_response(
    db: AsyncSession,
    user_id: uuid.UUID | None,
    message: str,
    conv_id: uuid.UUID,
) -> str:
    db_context = await _gather_db_context(db, user_id)
    rag_chunks = search_rag(message, k=8)
    rag_knowledge = "\n\n".join(rag_chunks) if rag_chunks else ""
    history = await _get_conversation_history(db, conv_id)

    context_text = _format_db_context_text(db_context)
    system_prompt = SYSTEM_PROMPT.format(
        rag_knowledge=rag_knowledge,
        db_context=context_text,
    )

    return await generate_response(
        message=message,
        system_prompt=system_prompt,
        conversation_history=history,
        temperature=0.3,
        max_tokens=1024,
    )


async def _get_conversation_history(
    db: AsyncSession,
    conv_id: uuid.UUID,
    limit: int = 10,
) -> list[dict]:
    result = await db.execute(
        select(Mensaje)
        .where(Mensaje.conversacion_id == conv_id)
        .order_by(Mensaje.created_at.asc())
        .limit(limit)
    )
    mensajes = result.scalars().all()
    return [
        {"role": "user" if m.rol == "usuario" else "assistant", "content": m.contenido}
        for m in mensajes
    ]


async def _gather_db_context(db: AsyncSession, user_id: uuid.UUID | None) -> dict:
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


def _format_db_context_text(ctx: dict) -> str:
    parts = []

    if ctx.get("last_analysis"):
        la = ctx["last_analysis"]
        parts.append(
            f"Ultimo analisis: cultivo {la['cultivo']}, score {la['score']}%, "
            f"coordenadas ({la['lat']}, {la['lng']}), tipo {la['tipo']}, "
            f"fecha {la.get('fecha', 'N/D')[:10]}"
        )
        parts.append("El usuario YA tiene analisis previos en la plataforma.")

    sensors = ctx.get("sensors", [])
    if sensors:
        parts.append(f"Sensores IoT del usuario ({len(sensors)} nodos):")
        for s in sensors:
            parts.append(
                f"  {s['nodo']} [{s['estado']}] "
                f"NDVI={s.get('ndvi', 'N/D')} "
                f"Humedad={s.get('humedad', 'N/D')}% "
                f"Temp={s.get('temperatura', 'N/D')}C"
            )
        parts.append("El usuario YA tiene sensores IoT configurados.")

    if not ctx.get("has_data"):
        return "Usuario nuevo, sin analisis ni sensores registrados."

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Fallback: keyword matching
# ---------------------------------------------------------------------------

def _generate_keyword_response(
    db: AsyncSession,
    user_id: uuid.UUID | None,
    message: str,
) -> str:
    rag_chunks = search_rag(message, k=5)
    rag_text = "\n\n".join(rag_chunks) if rag_chunks else ""

    lower = message.lower()

    if any(w in lower for w in ["maiz", "maíz", "yuca", "arroz", "platano", "plátano",
                                 "cacao", "palma", "aceitera", "name", "ñame",
                                 "algodon", "algodón", "frijol", "fríjol", "sorgo"]):
        if rag_text:
            return f"**Cultivo consultado**\n\n{rag_text[:1500]}\n\n_Haz un analisis de parcela en **Analisis de Cultivos** para recomendaciones personalizadas._"
        return "No encontre informacion sobre ese cultivo. Prueba con maiz, yuca, arroz o platano."

    if any(w in lower for w in ["plaga", "plagas", "enfermedad", "gusano", "hongo"]):
        return f"**Plagas y Enfermedades**\n\n{rag_text[:1500]}" if rag_text else "Consulta la seccion de plagas y enfermedades en la plataforma."

    if any(w in lower for w in ["fertiliz", "abono", "nutriente", "npk"]):
        return f"**Fertilizacion**\n\n{rag_text[:1500]}" if rag_text else "Realiza un analisis de suelo para recomendaciones de fertilizacion personalizadas."

    if any(w in lower for w in ["riego", "regar", "agua", "sequia", "sequía"]):
        return f"**Riego y Manejo Hidrico**\n\n{rag_text[:1500]}" if rag_text else "El riego por goteo es el mas eficiente en el Caribe. Consulta la seccion de riego."

    if any(w in lower for w in ["sensor", "sensores", "iot", "nodo"]):
        return "Para ver el estado de sensores IoT, accede a la seccion **Sensores IoT** en el menu lateral."

    if any(w in lower for w in ["analisis", "ultimo", "resultado"]):
        return "Consulta tu ultimo analisis en **Historial** o genera uno nuevo en **Analisis de Cultivos**."

    if any(w in lower for w in ["recomendar", "recomendacion", "sembrar", "cultivo"]):
        return "Dirigete a **Analisis de Cultivos** para obtener recomendaciones de cultivos basadas en clima, suelo y NDVI de tu parcela."

    if any(w in lower for w in ["historial", "historico"]):
        return "Tu historial de analisis esta en la seccion **Historial** del menu lateral."

    if any(w in lower for w in ["clima", "temperatura", "lluvia", "precipitacion"]):
        return f"**Clima del Caribe**\n\n{rag_text[:1200]}" if rag_text else "Los datos climaticos se obtienen de OpenMeteo y NASA POWER al ejecutar un analisis en **Analisis de Cultivos**."

    if any(w in lower for w in ["ndvi", "satelite", "satélite"]):
        return f"**Interpretacion NDVI**\n\n{rag_text[:1500]}" if rag_text else "El NDVI mide vigor vegetal (0=sin vegetacion, 1=maximo). Cultivos saludables: 0.5-0.8."

    if any(w in lower for w in ["suelo", "ph", "tierra"]):
        return f"**Manejo de Suelos**\n\n{rag_text[:1500]}" if rag_text else "Suelos del Caribe: franco-arenosos (costa) y franco-arcillosos (valles). Materia organica baja (1-3%)."

    if any(w in lower for w in ["siembra", "sembrar", "epoca", "calendario"]):
        return f"**Calendario de Siembra**\n\n{rag_text[:1500]}" if rag_text else "Epoca optima de siembra en el Caribe: abril-mayo (inicio de lluvias)."

    if any(w in lower for w in ["cosecha", "cosechar", "postcosecha", "almacenar"]):
        return f"**Manejo Postcosecha**\n\n{rag_text[:1500]}" if rag_text else "Granos: secar a 12-14% humedad. Yuca: se deteriora en 24-72h sin tratamiento."

    if any(w in lower for w in ["buenas practicas", "bpa", "certificacion"]):
        return f"**Buenas Practicas Agricolas**\n\n{rag_text[:1500]}" if rag_text else "Las BPA incluyen manejo de agua, suelo, cultivos y registro de actividades."

    if rag_text:
        return f"**Informacion agricola relevante:**\n\n{rag_text[:1500]}\n\n_Preguntame sobre cultivos, plagas, fertilizacion, riego, sensores o NDVI._"

    return (
        "**AgroAsesor IA** — Estoy aqui para ayudarte con:\n\n"
        "**Cultivos**: maiz, yuca, arroz, platano, cacao, palma, name, algodon, frijol, sorgo\n"
        "**Plagas y enfermedades** — **Fertilizacion** — **Riego**\n"
        "**Sensores IoT** — **Analisis de parcela** — **Historial**\n"
        "**NDVI** — **Suelos** — **Siembra y cosecha**\n\n"
        "Escribe el nombre de un cultivo o una pregunta y te respondere con conocimiento agronomico del Caribe colombiano."
    )
