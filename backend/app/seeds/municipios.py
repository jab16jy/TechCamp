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


async def seed_indices_satelitales():
    async with AsyncSessionLocal() as session:
        await session.execute(text("""
            DELETE FROM indices_satelitales;
            INSERT INTO indices_satelitales (id, lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube) VALUES
            (1, 10.97, -74.78, 0.45, 0.20, 'Media-Alta', 10),
            (2, 10.92, -74.76, 0.38, 0.15, 'Media', 15),
            (3, 10.40, -75.51, 0.52, 0.25, 'Alta', 8),
            (4, 11.24, -74.20, 0.48, 0.22, 'Media-Alta', 12),
            (5, 8.76,  -75.88, 0.55, 0.30, 'Alta', 5),
            (6, 10.46, -73.25, 0.41, 0.18, 'Media', 18),
            (7, 9.30,  -75.40, 0.47, 0.21, 'Media-Alta', 10),
            (8, 11.54, -72.91, 0.33, 0.12, 'Media-Baja', 22)
        """))
        await session.commit()
    print("Indices satelitales seeded: 8 registros")


async def seed_all():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await seed_municipios()
    await seed_indices_satelitales()
    print("Seeds completados exitosamente")


if __name__ == "__main__":
    asyncio.run(seed_all())
