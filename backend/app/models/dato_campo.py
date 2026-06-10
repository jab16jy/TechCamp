"""DatoCampo model — real field data from EVA, Suelos, and Foliar datasets."""

from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base


class DatoCampo(Base):
    __tablename__ = "datos_campo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cultivo: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    departamento: Mapped[str] = mapped_column(String(100), nullable=True)
    municipio: Mapped[str] = mapped_column(String(100), nullable=True)
    lat: Mapped[float] = mapped_column(Float, nullable=True)
    lng: Mapped[float] = mapped_column(Float, nullable=True)
    ph: Mapped[float] = mapped_column(Float, nullable=True)
    mo: Mapped[float] = mapped_column(Float, nullable=True)  # materia orgánica
    textura: Mapped[str] = mapped_column(String(50), nullable=True)
    ndvi: Mapped[float] = mapped_column(Float, nullable=True)
    ndwi: Mapped[float] = mapped_column(Float, nullable=True)
    rendimiento: Mapped[float] = mapped_column(Float, nullable=True)  # t/ha
    fuente: Mapped[str] = mapped_column(String(20), nullable=True)  # 'EVA', 'SUELOS', 'FOLIAR'
    anio: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_datos_campo_cultivo_fuente", "cultivo", "fuente"),
    )

    def __repr__(self):
        return f"<DatoCampo(id={self.id}, cultivo={self.cultivo}, fuente={self.fuente})>"
