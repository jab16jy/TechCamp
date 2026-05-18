
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import engine, AsyncSessionLocal

logger = logging.getLogger(__name__)


SEED_INDICES = [
    (10.9685, -74.7813, 0.42, 0.18, "Media-Alta", 12),
    (10.9174, -74.7647, 0.38, 0.16, "Media", 10),
    (10.3997, -75.5144, 0.34, 0.12, "Baja", 10),
    (11.2408, -74.1990, 0.71, 0.22, "Alta", 6),
    (8.7578, -75.8814, 0.68, 0.25, "Alta", 18),
    (10.4631, -73.2532, 0.55, 0.15, "Media", 5),
    (9.3047, -75.3978, 0.50, 0.17, "Media-Alta", 22),
    (11.5444, -72.9072, 0.28, 0.06, "Baja", 3),
    (10.97, -74.80, 0.41, 0.16, "Media", 15),
    (10.95, -74.77, 0.38, 0.14, "Baja", 8),
    (11.25, -74.20, 0.72, 0.23, "Alta", 6),
    (8.76, -75.89, 0.66, 0.24, "Alta", 20),
    (10.47, -73.25, 0.56, 0.15, "Media", 5),
    (10.40, -75.52, 0.34, 0.12, "Baja", 10),
    (9.31, -75.40, 0.49, 0.16, "Media", 25),
    (11.55, -72.91, 0.29, 0.08, "Baja", 2),
    (8.74, -75.87, 0.63, 0.22, "Alta", 18),
    (10.45, -73.23, 0.52, 0.13, "Media", 3),
]

SEED_SENSORES = [
    ("Norte-01",  "Nodo Norte", 10.50, -74.80, "ok"),
    ("Sur-02",    "Nodo Sur", 10.48, -74.78, "warn"),
    ("Este-03",   "Nodo Este", 10.52, -74.75, "critical"),
    ("Oeste-04",  "Nodo Oeste", 10.49, -74.82, "ok"),
    ("Centro-05", "Nodo Centro", 10.51, -74.77, "ok"),
    ("Sur-06",    "Nodo Sur Profundo", 8.76, -75.88, "warn"),
]


async def seed_indices_satelitales():
    async with AsyncSessionLocal() as session:
        count = await session.scalar(text("SELECT count(*) FROM indices_satelitales"))
        if count and count > 8:
            logger.info(f"Indices ya tienen {count} registros, saltando seed")
            return

        for lat, lng, ndvi, ndwi, calidad, nubes in SEED_INDICES:
            await session.execute(
                text("""
                    INSERT INTO indices_satelitales (lat, lng, ndvi, ndwi, calidad_suelo, cobertura_nube, ubicacion)
                    VALUES (:lat, :lng, :ndvi, :ndwi, :calidad, :nubes,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                    ON CONFLICT DO NOTHING
                """),
                {"lat": lat, "lng": lng, "ndvi": ndvi, "ndwi": ndwi, "calidad": calidad, "nubes": nubes},
            )
        await session.commit()
        logger.info(f"Insertados {len(SEED_INDICES)} indices satelitales")


async def seed_sensores():
    async with AsyncSessionLocal() as session:
        for nodo_id, nombre, lat, lng, estado in SEED_SENSORES:
            await session.execute(
                text("""
                    INSERT INTO sensores (nodo_id, nombre, lat, lng, estado, ubicacion)
                    VALUES (:nodo_id, :nombre, :lat, :lng, :estado,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                    ON CONFLICT (nodo_id) DO NOTHING
                """),
                {"nodo_id": nodo_id, "nombre": nombre, "lat": lat, "lng": lng, "estado": estado},
            )
        await session.commit()

        result = await session.execute(text("SELECT id, nodo_id FROM sensores"))
        sensors = result.fetchall()
        logger.info(f"Sensores: {len(sensors)}")

        count = await session.scalar(text("SELECT count(*) FROM lecturas_sensores"))
        if count and count > 0:
            logger.info(f"Lecturas ya tienen {count} registros, saltando seed")
            return

        now = datetime.now(timezone.utc)
        reading_data = []
        for sensor_id, nodo_id in sensors:
            if nodo_id == "Norte-01":
                base = (0.73, 72, 28.4)
            elif nodo_id == "Sur-02":
                base = (0.61, 61, 29.8)
            elif nodo_id == "Este-03":
                base = (0.54, 55, 31.2)
            elif nodo_id == "Oeste-04":
                base = (0.68, 74, 27.8)
            elif nodo_id == "Centro-05":
                base = (0.65, 68, 28.6)
            elif nodo_id == "Sur-06":
                base = (0.46, 62, 27.2)
            else:
                base = (0.50, 65, 28.0)

            for i, offset in enumerate([10, 240, 720]):
                ndvi = round(base[0] + (i - 1) * 0.01, 2)
                hum = base[1] + (i - 1) * 2
                temp = round(base[2] + (i - 1) * 0.3, 1)
                ts = now - timedelta(minutes=offset)
                reading_data.append((sensor_id, ndvi, hum, temp, ts))

        for sensor_id, ndvi, hum, temp, ts in reading_data:
            await session.execute(
                text("""
                    INSERT INTO lecturas_sensores (sensor_id, ndvi, humedad, temperatura, created_at)
                    VALUES (:sensor_id, :ndvi, :hum, :temp, :created_at)
                """),
                {"sensor_id": sensor_id, "ndvi": ndvi, "hum": hum, "temp": temp, "created_at": ts},
            )
        await session.commit()
        logger.info(f"Insertadas {len(reading_data)} lecturas de sensores")


async def seed_analisis_demo(usuario_id: str):
    async with AsyncSessionLocal() as session:
        count = await session.scalar(text("SELECT count(*) FROM analisis"))
        if count and count > 0:
            logger.info(f"Analisis ya tienen {count} registros, saltando seed")
            return

        analisis_data = [
            (1, "Barranquilla", 10.9685, -74.7813, "simple", "Maiz", 86,
             '{"departamento":"Atlantico","municipio":"Barranquilla","tipo_suelo":"Franco-Arcilloso","acceso_riego":"goteo","mes_siembra":"Mayo","area_hectareas":5.2,"ph_suelo":6.5,"materia_organica":3.2,"textura_suelo":"Franco"}',
             3),
            (5, "Monteria", 8.7578, -75.8814, "simple", "Platano", 94,
             '{"departamento":"Cordoba","municipio":"Monteria","tipo_suelo":"Franco","acceso_riego":"goteo","mes_siembra":"Abril","area_hectareas":8.0,"ph_suelo":6.2,"materia_organica":3.8,"textura_suelo":"Franco"}',
             7),
            (4, "Santa Marta", 11.2408, -74.1990, "simple", "Cacao", 88,
             '{"departamento":"Magdalena","municipio":"Santa Marta","tipo_suelo":"Franco-Arcilloso","acceso_riego":"goteo","mes_siembra":"Mayo","area_hectareas":3.0,"ph_suelo":6.0,"materia_organica":4.1,"textura_suelo":"Franco-Arcilloso"}',
             10),
            (6, "Valledupar", 10.4631, -73.2532, "advanced", "Algodon", 76,
             '{"departamento":"Cesar","municipio":"Valledupar","tipo_suelo":"Franco-Arenoso","acceso_riego":"gravedad","mes_siembra":"Marzo","area_hectareas":15.0,"ph_suelo":6.8,"materia_organica":2.5,"textura_suelo":"Franco-Arenoso"}',
             14),
            (7, "Sincelejo", 9.3047, -75.3978, "simple", "Yuca", 82,
             '{"departamento":"Sucre","municipio":"Sincelejo","tipo_suelo":"Franco","acceso_riego":"no","mes_siembra":"Agosto","area_hectareas":6.5,"ph_suelo":6.3,"materia_organica":2.8,"textura_suelo":"Franco"}',
             21),
        ]

        now = datetime.now(timezone.utc)
        for muni_id, muni_nombre, lat, lng, tipo, cultivo, score, datos_json, days_ago in analisis_data:
            ts = now - timedelta(days=days_ago)
            await session.execute(
                text("""
                    INSERT INTO analisis (usuario_id, municipio_id, tipo, lat, lng, cultivo_recomendado, score, datos_formulario, created_at)
                    VALUES (:uid, :mid, :tipo, :lat, :lng, :cultivo, :score, :datos::jsonb, :ts)
                """),
                {"uid": usuario_id, "mid": muni_id, "tipo": tipo, "lat": lat, "lng": lng,
                 "cultivo": cultivo, "score": score, "datos": datos_json, "ts": ts},
            )
        await session.commit()
        logger.info(f"Insertados {len(analisis_data)} analisis demo")


async def run_all(usuario_id: str | None = None):
    await seed_indices_satelitales()
    await seed_sensores()
    if usuario_id:
        await seed_analisis_demo(usuario_id)
    logger.info("Seed completo")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import asyncio
    uid = input("Usuario ID (enter para saltar analisis): ").strip() or None
    asyncio.run(run_all(uid))
