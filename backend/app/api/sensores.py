import uuid
import logging

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
    )
    db.add(lectura)
    await db.flush()

    return LecturaResponse(
        id=str(lectura.id),
        sensor_id=str(lectura.sensor_id),
        ndvi=lectura.ndvi,
        humedad=lectura.humedad,
        temperatura=lectura.temperatura,
        created_at=lectura.created_at.isoformat() if lectura.created_at else None,
    )
