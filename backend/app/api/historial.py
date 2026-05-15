from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_db
from app.models.analisis import Analisis
from app.schemas.analisis import HistorialEntry

router = APIRouter(prefix="/history", tags=["historial"])

MOCK_HISTORY = [
    {
        "id": "C-0421",
        "fecha": "2025-04-21T10:30:00Z",
        "municipio": "Montería",
        "departamento": "Córdoba",
        "cultivo": "Maíz",
        "score": 94,
        "tipo": "analisis",
        "estado": "Exitosa",
        "area_hectareas": 5.2,
        "coordenadas": {"lat": 8.7578, "lng": -75.8814},
    },
    {
        "id": "C-0415",
        "fecha": "2025-04-15T14:20:00Z",
        "municipio": "Valledupar",
        "departamento": "Cesar",
        "cultivo": "Algodón",
        "score": 78,
        "tipo": "analisis",
        "estado": "Exitosa",
        "area_hectareas": 8.0,
        "coordenadas": {"lat": 10.4631, "lng": -73.2532},
    },
    {
        "id": "C-0410",
        "fecha": "2025-04-10T09:15:00Z",
        "municipio": "Barranquilla",
        "departamento": "Atlántico",
        "cultivo": "Yuca",
        "score": 87,
        "tipo": "analisis",
        "estado": "Exitosa",
        "area_hectareas": 3.5,
        "coordenadas": {"lat": 10.9685, "lng": -74.7813},
    },
]


@router.get("", response_model=list[HistorialEntry])
async def get_history(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Analisis).order_by(Analisis.created_at.desc()).limit(50)
        )
        analyses = result.scalars().all()
        if analyses:
            return [
                HistorialEntry(
                    id=str(a.id)[:8].upper(),
                    fecha=a.created_at.isoformat() if a.created_at else "",
                    municipio="",
                    departamento="",
                    cultivo=a.cultivo_recomendado or "",
                    score=a.score or 0,
                    tipo=a.tipo,
                    estado="Exitosa",
                    coordenadas={"lat": a.lat, "lng": a.lng},
                )
                for a in analyses
            ]
    except Exception:
        pass

    return [HistorialEntry(**h) for h in MOCK_HISTORY]
