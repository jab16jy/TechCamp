import uuid
import logging
import random

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.dependencies import get_db
from app.models.sensor import Sensor
from app.models.lectura_sensor import LecturaSensor
from app.schemas.sensor import (
    SensorResponse,
    LecturaResponse,
    CreateLecturaRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sensors", tags=["sensores"])


def _generate_mock_sensor_readings(
    n_readings: int = 4,
    seed: int | None = None,
) -> list[dict]:
    """Genera lecturas de sensor mock con valores realistas del Caribe.

    Incluye los 6 tipos de sensor: viento, pluviometria, humedad suelo,
    humectacion hoja, temperatura, y NDVI. Los valores se generan con
    distribuciones realistas para el contexto agricola caribeño.

    Args:
        n_readings: Numero de lecturas a generar (default 4).
        seed: Semilla aleatoria para reproducibilidad.

    Returns:
        Lista de diccionarios con datos de sensor.
    """
    rng = random.Random(seed)

    sensor_types = [
        {
            "tipo": "viento",
            "viento_kmh": lambda: round(rng.uniform(5, 45) + rng.gauss(0, 8), 1),
            "pluviometria_mm": lambda: 0.0,
            "humectacion_hoja_pct": lambda: round(rng.uniform(30, 70), 1),
            "ndvi": lambda: round(rng.uniform(0.35, 0.75), 2),
            "humedad": lambda: round(rng.uniform(55, 85), 1),
            "temperatura": lambda: round(rng.uniform(24, 33), 1),
        },
        {
            "tipo": "pluviometro",
            "viento_kmh": lambda: round(rng.uniform(2, 20), 1),
            "pluviometria_mm": lambda: round(max(0, rng.uniform(0, 80) + rng.gauss(0, 15)), 1),
            "humectacion_hoja_pct": lambda: round(rng.uniform(60, 100), 1),
            "ndvi": lambda: round(rng.uniform(0.4, 0.85), 2),
            "humedad": lambda: round(rng.uniform(70, 95), 1),
            "temperatura": lambda: round(rng.uniform(22, 30), 1),
        },
        {
            "tipo": "humedad_suelo",
            "viento_kmh": lambda: round(rng.uniform(0, 10), 1),
            "pluviometria_mm": lambda: round(rng.uniform(0, 5), 1),
            "humectacion_hoja_pct": lambda: round(rng.uniform(40, 90), 1),
            "ndvi": lambda: round(rng.uniform(0.3, 0.8), 2),
            "humedad": lambda: round(rng.uniform(20, 90), 1),
            "temperatura": lambda: round(rng.uniform(20, 35), 1),
        },
        {
            "tipo": "humectacion_hoja",
            "viento_kmh": lambda: round(rng.uniform(0, 15), 1),
            "pluviometria_mm": lambda: round(rng.uniform(0, 10), 1),
            "humectacion_hoja_pct": lambda: round(rng.uniform(0, 100), 1),
            "ndvi": lambda: round(rng.uniform(0.3, 0.7), 2),
            "humedad": lambda: round(rng.uniform(50, 98), 1),
            "temperatura": lambda: round(rng.uniform(22, 34), 1),
        },
    ]

    # Seleccionar n_readings tipos (con repeticion si es necesario)
    selected = [sensor_types[i % len(sensor_types)] for i in range(n_readings)]
    rng.shuffle(selected)

    return [
        {
            "viento_kmh": max(0, min(120, st["viento_kmh"]())),
            "pluviometria_mm": max(0, min(200, st["pluviometria_mm"]())),
            "humectacion_hoja_pct": max(0, min(100, st["humectacion_hoja_pct"]())),
            "ndvi": round(max(0.1, min(0.95, st["ndvi"]())), 2),
            "humedad": round(max(10, min(100, st["humedad"]())), 1),
            "temperatura": round(max(18, min(40, st["temperatura"]())), 1),
        }
        for st in selected
    ]


@router.get("", response_model=list[SensorResponse])
async def get_sensors(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Sensor).order_by(Sensor.nodo_id))
        sensores = result.scalars().all()

        if not sensores:
            return []

        sensor_ids = [s.id for s in sensores]

        latest_subq = (
            select(
                LecturaSensor.sensor_id,
                func.max(LecturaSensor.created_at).label("max_ts"),
            )
            .where(LecturaSensor.sensor_id.in_(sensor_ids))
            .group_by(LecturaSensor.sensor_id)
            .subquery()
        )

        lecturas_result = await db.execute(
            select(LecturaSensor).join(
                latest_subq,
                (LecturaSensor.sensor_id == latest_subq.c.sensor_id)
                & (LecturaSensor.created_at == latest_subq.c.max_ts),
            )
        )
        lecturas_map = {l.sensor_id: l for l in lecturas_result.scalars().all()}

        return [
            SensorResponse(
                id=str(s.id),
                nodo_id=s.nodo_id,
                nombre=s.nombre,
                lat=s.lat,
                lng=s.lng,
                estado=s.estado,
                ultima_lectura=LecturaResponse(
                    id=str(lecturas_map[s.id].id),
                    sensor_id=str(lecturas_map[s.id].sensor_id),
                    ndvi=lecturas_map[s.id].ndvi,
                    humedad=lecturas_map[s.id].humedad,
                    temperatura=lecturas_map[s.id].temperatura,
                    viento_kmh=getattr(lecturas_map[s.id], "viento_kmh", None),
                    pluviometria_mm=getattr(lecturas_map[s.id], "pluviometria_mm", None),
                    humectacion_hoja_pct=getattr(lecturas_map[s.id], "humectacion_hoja_pct", None),
                    created_at=lecturas_map[s.id].created_at.isoformat() if lecturas_map[s.id].created_at else None,
                ) if s.id in lecturas_map else None,
            )
            for s in sensores
        ]
    except Exception as e:
        logger.exception("Error fetching sensors")
        return []


@router.get("/{sensor_id}/readings", response_model=list[LecturaResponse])
async def get_sensor_readings(
    sensor_id: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    try:
        sensor_uuid = uuid.UUID(sensor_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de sensor invalido",
        )

    try:
        result = await db.execute(
            select(LecturaSensor)
            .where(LecturaSensor.sensor_id == sensor_uuid)
            .order_by(LecturaSensor.created_at.desc())
            .limit(limit)
        )
        lecturas = result.scalars().all()
        return [
            LecturaResponse(
                id=str(l.id),
                sensor_id=str(l.sensor_id),
                ndvi=l.ndvi,
                humedad=l.humedad,
                temperatura=l.temperatura,
                viento_kmh=getattr(l, "viento_kmh", None),
                pluviometria_mm=getattr(l, "pluviometria_mm", None),
                humectacion_hoja_pct=getattr(l, "humectacion_hoja_pct", None),
                created_at=l.created_at.isoformat() if l.created_at else None,
            )
            for l in lecturas
        ]
    except Exception as e:
        logger.exception("Error fetching readings")
        return []


@router.post("/readings", response_model=LecturaResponse, status_code=status.HTTP_201_CREATED)
async def create_reading(
    body: CreateLecturaRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        sensor_uuid = uuid.UUID(body.sensor_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de sensor invalido",
        )

    sensor = await db.get(Sensor, sensor_uuid)
    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor no encontrado",
        )

    lectura = LecturaSensor(
        sensor_id=sensor_uuid,
        ndvi=body.ndvi,
        humedad=body.humedad,
        temperatura=body.temperatura,
        viento_kmh=body.viento_kmh,
        pluviometria_mm=body.pluviometria_mm,
        humectacion_hoja_pct=body.humectacion_hoja_pct,
    )
    db.add(lectura)
    await db.flush()

    return LecturaResponse(
        id=str(lectura.id),
        sensor_id=str(lectura.sensor_id),
        ndvi=lectura.ndvi,
        humedad=lectura.humedad,
        temperatura=lectura.temperatura,
        viento_kmh=lectura.viento_kmh,
        pluviometria_mm=lectura.pluviometria_mm,
        humectacion_hoja_pct=lectura.humectacion_hoja_pct,
        created_at=lectura.created_at.isoformat() if lectura.created_at else None,
    )
