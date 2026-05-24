import uuid

from sqlalchemy import Column, ForeignKey, Float, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class PlanRiego(Base):
    __tablename__ = "planes_riego"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    sensor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sensores.id", ondelete="SET NULL"),
        nullable=True,
    )
    parcela_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("parcelas.id", ondelete="SET NULL"),
        nullable=True,
    )
    cultivo: Mapped[str] = mapped_column(String(100), nullable=False)
    umbral_humedad: Mapped[float] = mapped_column(Float, nullable=False)
    humedad_actual: Mapped[float] = mapped_column(Float, nullable=False)
    prob_lluvia_7d: Mapped[float] = mapped_column(Float, default=0.0)
    prob_lluvia_14d: Mapped[float] = mapped_column(Float, default=0.0)
    volumen_agua_m3_ha: Mapped[float] = mapped_column(Float, nullable=False)
    frecuencia_dias: Mapped[int] = mapped_column(Integer, default=3)
    horario_optimo: Mapped[str] = mapped_column(String(50), default="05:00 - 07:00")
    ventana_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ventana_fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    justificacion_xai: Mapped[str] = mapped_column(Text, nullable=False)
    textura_suelo: Mapped[str] = mapped_column(String(50), default="Franco")
    et0_mm_dia: Mapped[float] = mapped_column(Float, default=0.0)
    temperatura_media: Mapped[float] = mapped_column(Float, default=0.0)
    estado: Mapped[str] = mapped_column(String(20), default="generado")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    sensor = relationship("Sensor", backref="planes_riego", lazy="selectin")
    parcela = relationship("Parcela", backref="planes_riego", lazy="selectin")

    def __repr__(self):
        return f"<PlanRiego(id={self.id}, cultivo={self.cultivo}, estado={self.estado})>"
