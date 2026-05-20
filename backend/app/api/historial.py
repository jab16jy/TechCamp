from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_db, get_current_user
from app.models.analisis import Analisis
from app.models.municipio import Municipio
from app.schemas.analisis import HistorialEntry

router = APIRouter(prefix="/history", tags=["historial"])


@router.get("", response_model=list[HistorialEntry])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: dict | None = Depends(get_current_user),
    tipo: str | None = Query(None, description="Filtrar: simple, advanced, prediccion"),
    limit: int = Query(50, ge=1, le=200),
):
    try:
        query = select(Analisis).order_by(Analisis.created_at.desc()).limit(limit)
        if tipo:
            query = query.where(Analisis.tipo == tipo)
        result = await db.execute(query)
        analyses = result.scalars().all()

        if analyses:
            municipio_ids = [a.municipio_id for a in analyses if a.municipio_id]
            municipio_map = {}
            if municipio_ids:
                muni_result = await db.execute(
                    select(Municipio).where(Municipio.id.in_(municipio_ids))
                )
                municipio_map = {m.id: m for m in muni_result.scalars().all()}

            entries = []
            for a in analyses:
                muni = municipio_map.get(a.municipio_id) if a.municipio_id else None
                datos = a.datos_formulario or {}
                entries.append(HistorialEntry(
                    id=str(a.id)[:8].upper(),
                    fecha=a.created_at.isoformat() if a.created_at else "",
                    municipio=muni.nombre if muni else datos.get("municipio", ""),
                    departamento=muni.departamento if muni else datos.get("departamento", ""),
                    cultivo=a.cultivo_recomendado or "",
                    score=a.score or 0,
                    tipo=a.tipo,
                    estado="Exitosa",
                    area_hectareas=datos.get("area_hectareas", a.lat and 1.0),
                    coordenadas={"lat": a.lat, "lng": a.lng},
                    ph_suelo=datos.get("ph_suelo"),
                    textura_suelo=datos.get("textura_suelo"),
                    materia_organica=datos.get("materia_organica"),
                    mes_siembra=datos.get("mes_siembra"),
                    recomendaciones=a.resultado_completo.get("recomendaciones") if a.resultado_completo else None,
                ))
            return entries
    except Exception:
        pass

    return []
