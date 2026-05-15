from geoalchemy2 import Geometry
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Municipio(Base):
    __tablename__ = "municipios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    departamento: Mapped[str] = mapped_column(String(100), nullable=False)
    geometry = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)

    def __repr__(self):
        return f"<Municipio(id={self.id}, nombre={self.nombre}, departamento={self.departamento})>"
