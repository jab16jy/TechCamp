import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Column, Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.models.base import Base


class Sensor(Base):
    __tablename__ = "sensores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    nodo_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    estado: Mapped[str] = mapped_column(
        String(20), default="ok", nullable=False
    )
    ubicacion = Column(Geometry("POINT", srid=4326), nullable=True)

    lecturas = relationship("LecturaSensor", back_populates="sensor", lazy="selectin")

    def __repr__(self):
        return f"<Sensor(id={self.id}, nodo={self.nodo_id}, estado={self.estado})>"
