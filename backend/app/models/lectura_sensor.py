import uuid

from sqlalchemy import Column, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class LecturaSensor(Base):
    __tablename__ = "lecturas_sensores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    sensor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sensores.id", ondelete="CASCADE"),
        nullable=False,
    )
    ndvi: Mapped[float] = mapped_column(Float, nullable=True)
    humedad: Mapped[float] = mapped_column(Float, nullable=True)
    temperatura: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    sensor = relationship("Sensor", back_populates="lecturas")

    def __repr__(self):
        return f"<LecturaSensor(id={self.id}, sensor={self.sensor_id}, ndvi={self.ndvi})>"
