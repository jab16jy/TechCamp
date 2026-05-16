import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Column, ForeignKey, Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class Parcela(Base):
    __tablename__ = "parcelas"

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
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    area_hectareas: Mapped[float] = mapped_column(Float, nullable=True)
    poligono = Column(Geometry("POLYGON", srid=4326), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    def __repr__(self):
        return f"<Parcela(id={self.id}, nombre={self.nombre}, area={self.area_hectareas}ha)>"
