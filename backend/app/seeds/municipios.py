import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import AsyncSessionLocal, engine
from app.models import Base


async def seed_municipios():
    async with AsyncSessionLocal() as session:
        await session.execute(text("""
            DELETE FROM municipios;
            INSERT INTO municipios (id, nombre, departamento) VALUES
            (1, 'Barranquilla', 'Atlántico'),
            (2, 'Soledad', 'Atlántico'),
            (3, 'Cartagena', 'Bolívar'),
            (4, 'Santa Marta', 'Magdalena'),
            (5, 'Montería', 'Córdoba'),
            (6, 'Valledupar', 'Cesar'),
            (7, 'Sincelejo', 'Sucre'),
            (8, 'Riohacha', 'La Guajira')
        """))
        await session.commit()
    print("Municipios seeded: 8 registros")


async def seed_all():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await seed_municipios()
    print("Seeds completados exitosamente")


if __name__ == "__main__":
    asyncio.run(seed_all())
