import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_db
from app.models.analisis import Analisis
from app.models.sensor import Sensor
from app.models.lectura_sensor import LecturaSensor
from app.schemas.reports import (
    AlertItem, AlertsResponse, CompareRequest, CompareItem,
    CompareResponse, ExportRequest, ExportResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/alerts", response_model=AlertsResponse)
async def get_alerts(db: AsyncSession = Depends(get_db)):
    alerts = []

    try:
        result = await db.execute(
            select(Sensor).where(Sensor.estado.in_(["warn", "critical"]))
        )
        sensores = result.scalars().all()
        for s in sensores:
            latest = await db.execute(
                select(LecturaSensor)
                .where(LecturaSensor.sensor_id == s.id)
                .order_by(LecturaSensor.created_at.desc())
                .limit(1)
            )
            lr = latest.scalars().one_or_none()
            detail = ""
            if lr:
                parts = []
                if lr.ndvi is not None and lr.ndvi < 0.35:
                    parts.append(f"NDVI bajo ({lr.ndvi})")
                if lr.humedad is not None and lr.humedad < 55:
                    parts.append(f"humedad critica ({lr.humedad}%)")
                if lr.temperatura is not None and lr.temperatura > 33:
                    parts.append(f"temperatura elevada ({lr.temperatura}°C)")
                detail = "; ".join(parts) if parts else "sin datos anormales"

            alerts.append(AlertItem(
                severidad="critica" if s.estado == "critical" else "advertencia",
                fuente=f"Sensor {s.nodo_id}",
                mensaje=f"Sensor {s.nodo_id} ({s.nombre}) en estado {s.estado}. {detail}",
                accion="Revisar telemetria y sistema de riego en la zona" if s.estado == "critical" else "Monitorear evolucion del sensor",
                timestamp=datetime.now(timezone.utc).isoformat(),
            ))

        result = await db.execute(
            select(Analisis)
            .where(Analisis.score.isnot(None))
            .order_by(Analisis.created_at.desc())
            .limit(20)
        )
        analyses = result.scalars().all()
        for a in analyses:
            if a.score is not None and a.score < 50:
                alerts.append(AlertItem(
                    severidad="advertencia",
                    fuente="Analisis de cultivo",
                    mensaje=f"Analisis del {a.created_at.strftime('%d/%m/%Y')}: score bajo ({a.score}%) para {a.cultivo_recomendado or 'cultivo no determinado'}",
                    accion="Revisar condiciones de suelo y clima. Considerar cambio de cultivo o mejora de practicas.",
                    timestamp=a.created_at.isoformat() if a.created_at else "",
                ))
    except Exception:
        pass

    total_criticas = sum(1 for a in alerts if a.severidad == "critica")
    total_advertencias = sum(1 for a in alerts if a.severidad == "advertencia")

    return AlertsResponse(alertas=alerts, total_criticas=total_criticas, total_advertencias=total_advertencias)


@router.post("/compare", response_model=CompareResponse)
async def compare_analyses(body: CompareRequest, db: AsyncSession = Depends(get_db)):
    items = []
    for aid in body.analysis_ids[:5]:
        try:
            ana_id = uuid.UUID(aid)
        except ValueError:
            continue
        result = await db.execute(select(Analisis).where(Analisis.id == ana_id))
        ana = result.scalars().one_or_none()
        if ana is None:
            continue
        datos = ana.datos_formulario or {}
        resultado = ana.resultado_completo or {}
        items.append(CompareItem(
            id=str(ana.id)[:8].upper(),
            fecha=ana.created_at.isoformat() if ana.created_at else "",
            municipio=datos.get("municipio", ""),
            cultivo=ana.cultivo_recomendado or "",
            score=ana.score or 0,
            tipo=ana.tipo,
            ndvi=resultado.get("satelite", {}).get("ndvi"),
            ph_suelo=datos.get("ph_suelo"),
            temperatura=resultado.get("clima", {}).get("temperatura"),
            recomendaciones=resultado.get("recomendaciones", []),
        ))
    return CompareResponse(items=items)


@router.post("/export", response_model=ExportResponse)
async def export_report(body: ExportRequest, db: AsyncSession = Depends(get_db)):
    try:
        ana_id = uuid.UUID(body.analysis_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID invalido")

    result = await db.execute(select(Analisis).where(Analisis.id == ana_id))
    ana = result.scalars().one_or_none()
    if ana is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analisis no encontrado")

    datos = ana.datos_formulario or {}
    resultado = ana.resultado_completo or {}
    clima = resultado.get("clima", {})
    satelite = resultado.get("satelite", {})
    recs = resultado.get("recomendaciones", [])

    resumen = (
        f"Analisis realizado en {datos.get('municipio', 'N/D')}, {datos.get('departamento', 'N/D')}. "
        f"Temperatura: {clima.get('temperatura', 'N/D')}C, Precipitacion: {clima.get('precipitacion', 'N/D')}mm. "
        f"NDVI: {satelite.get('ndvi', 'N/D')}, pH: {datos.get('ph_suelo', 'N/D')}. "
        f"Cultivo recomendado: {ana.cultivo_recomendado or 'N/D'} con score {ana.score or 0}%."
    )

    return ExportResponse(
        titulo=f"Reporte de Analisis — {datos.get('municipio', 'Parcela')}",
        fecha=ana.created_at.isoformat() if ana.created_at else "",
        ubicacion={"lat": ana.lat, "lng": ana.lng, "municipio": datos.get("municipio", ""), "departamento": datos.get("departamento", "")},
        clima=clima,
        satelite=satelite,
        suelo={"ph": datos.get("ph_suelo"), "tipo": datos.get("tipo_suelo", ""), "textura": datos.get("textura_suelo", ""), "materia_organica": datos.get("materia_organica")},
        recomendaciones=recs,
        resumen=resumen,
    )
