import uuid
from datetime import datetime

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    rol: Mapped[str] = mapped_column(
        String(50), nullable=False, default="investigador"
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
    )

    def __repr__(self):
        return f"<Usuario(id={self.id}, email={self.email}, rol={self.rol})>"
