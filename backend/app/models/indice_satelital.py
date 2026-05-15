from geoalchemy2 import Geometry
from sqlalchemy import Column, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime

from app.models.base import Base


class IndiceSatelital(Base):
    __tablename__ = "indices_satelitales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    ubicacion = Column(Geometry("POINT", srid=4326), nullable=True)
    ndvi: Mapped[float] = mapped_column(Float, nullable=True)
    ndwi: Mapped[float] = mapped_column(Float, nullable=True)
    calidad_suelo: Mapped[str] = mapped_column(String(50), nullable=True)
    cobertura_nube: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    def __repr__(self):
        return f"<IndiceSatelital(id={self.id}, ndvi={self.ndvi}, lat={self.lat})>"
