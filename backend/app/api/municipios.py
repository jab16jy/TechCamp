from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_db
from app.models.municipio import Municipio
from app.schemas.analisis import MunicipioResponse

router = APIRouter(prefix="/municipalities", tags=["municipios"])

MOCK_MUNICIPIOS = [
    {"id": 1, "nombre": "Barranquilla", "departamento": "Atlántico", "lat": 10.9685, "lng": -74.7813},
    {"id": 2, "nombre": "Soledad", "departamento": "Atlántico", "lat": 10.9174, "lng": -74.7647},
    {"id": 3, "nombre": "Cartagena", "departamento": "Bolívar", "lat": 10.3997, "lng": -75.5144},
    {"id": 4, "nombre": "Santa Marta", "departamento": "Magdalena", "lat": 11.2408, "lng": -74.1990},
    {"id": 5, "nombre": "Montería", "departamento": "Córdoba", "lat": 8.7578, "lng": -75.8814},
    {"id": 6, "nombre": "Valledupar", "departamento": "Cesar", "lat": 10.4631, "lng": -73.2532},
    {"id": 7, "nombre": "Sincelejo", "departamento": "Sucre", "lat": 9.3047, "lng": -75.3978},
    {"id": 8, "nombre": "Riohacha", "departamento": "La Guajira", "lat": 11.5444, "lng": -72.9072},
]


@router.get("", response_model=list[MunicipioResponse])
async def get_municipios(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Municipio).order_by(Municipio.nombre))
        municipios = result.scalars().all()
        if municipios:
            return [
                MunicipioResponse(
                    id=m.id,
                    nombre=m.nombre,
                    departamento=m.departamento,
                )
                for m in municipios
            ]
    except Exception:
        pass

    return [MunicipioResponse(**m) for m in MOCK_MUNICIPIOS]
