import uuid

from sqlalchemy import Column, ForeignKey, String, Float, Integer, Boolean, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class Analisis(Base):
    __tablename__ = "analisis"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=True,
    )
    municipio_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("municipios.id", ondelete="SET NULL"),
        nullable=True,
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="simple")
    datos_formulario = Column(JSONB, nullable=False, default=dict)
    resultado_completo = Column(JSONB, nullable=False, default=dict)
    lat: Mapped[float] = mapped_column(Float, nullable=True)
    lng: Mapped[float] = mapped_column(Float, nullable=True)
    cultivo_recomendado: Mapped[str] = mapped_column(String(100), nullable=True)
    score: Mapped[int] = mapped_column(Integer, nullable=True)
    exito: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    rendimiento_real: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
    )

    def __repr__(self):
        return f"<Analisis(id={self.id}, tipo={self.tipo}, cultivo={self.cultivo_recomendado}, score={self.score})>"
