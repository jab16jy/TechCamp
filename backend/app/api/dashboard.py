import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.dependencies import get_db
from app.models.analisis import Analisis
from app.models.sensor import Sensor
from app.schemas.dashboard import DashboardSummaryResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    total_analisis = 0
    ultimo = None
    ultimos = []

    try:
        total_analisis = await db.scalar(
            select(func.count(Analisis.id))
        ) or 0

        result = await db.execute(
            select(Analisis).order_by(Analisis.created_at.desc()).limit(6)
        )
        analyses = result.scalars().all()

        if analyses:
            first = analyses[0]
            datos = first.datos_formulario or {}
            ultimo = {
                "id": str(first.id)[:8].upper(),
                "cultivo": first.cultivo_recomendado or "—",
                "score": first.score or 0,
                "tipo": first.tipo,
                "municipio": datos.get("municipio", "—"),
                "fecha": first.created_at.isoformat() if first.created_at else None,
            }

        for a in analyses[1:6]:
            d = a.datos_formulario or {}
            ultimos.append({
                "id": str(a.id)[:8].upper(),
                "cultivo": a.cultivo_recomendado or "—",
                "score": a.score or 0,
                "tipo": a.tipo,
                "municipio": d.get("municipio", "—"),
                "fecha": a.created_at.isoformat() if a.created_at else None,
            })
    except Exception:
        pass

    total_sensores = 0
    sensores_criticos = 0
    sensores_advertencias = 0

    try:
        result = await db.execute(select(Sensor))
        sensores = result.scalars().all()
        total_sensores = len(sensores)
        sensores_criticos = sum(1 for s in sensores if s.estado == "critical")
        sensores_advertencias = sum(1 for s in sensores if s.estado == "warn")
    except Exception:
        pass

    return DashboardSummaryResponse(
        total_analisis=total_analisis,
        total_sensores=total_sensores,
        sensores_criticos=sensores_criticos,
        sensores_advertencias=sensores_advertencias,
        ultimo_analisis=ultimo,
        ultimos_analisis=ultimos,
    )
