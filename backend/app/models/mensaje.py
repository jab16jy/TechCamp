import uuid

from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class Mensaje(Base):
    __tablename__ = "mensajes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    conversacion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversaciones.id", ondelete="CASCADE"),
        nullable=False,
    )
    rol: Mapped[str] = mapped_column(String(20), nullable=False)
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    extra_meta = Column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    conversacion = relationship("Conversacion", back_populates="mensajes")

    def __repr__(self):
        return f"<Mensaje(id={self.id}, rol={self.rol}, conversacion_id={self.conversacion_id})>"
