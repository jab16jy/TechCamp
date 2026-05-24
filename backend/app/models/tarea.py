import uuid

from sqlalchemy import Column, ForeignKey, Float, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class Tarea(Base):
    __tablename__ = "tareas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    plan_riego_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("planes_riego.id", ondelete="SET NULL"),
        nullable=True,
    )
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, default="")
    tipo: Mapped[str] = mapped_column(String(30), default="riego")
    prioridad: Mapped[str] = mapped_column(String(20), default="alta")
    estado: Mapped[str] = mapped_column(String(20), default="pendiente")
    litros_ha_total: Mapped[float] = mapped_column(Float, default=0.0)
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    usuario = relationship("Usuario", backref="tareas", lazy="selectin")
    plan_riego = relationship("PlanRiego", backref="tarea", lazy="selectin")

    def __repr__(self):
        return f"<Tarea(id={self.id}, titulo={self.titulo}, estado={self.estado})>"
