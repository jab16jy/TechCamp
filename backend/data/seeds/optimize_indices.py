"""Create spatial indexes and VACUUM ANALYZE for indices_satelitales"""
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        "postgresql://agrocaribe:agrocaribe_secret@localhost:5432/agrocaribe",
        statement_cache_size=0,
    )

    r = await conn.fetch("SELECT COUNT(*) AS c FROM indices_satelitales")
    print(f"Registros totales: {r[0]['c']}")

    size = await conn.fetchval(
        "SELECT pg_size_pretty(pg_total_relation_size('indices_satelitales'))"
    )
    print(f"Tamano tabla: {size}")

    print("Creando indices espaciales...")
    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_indices_satelitales_ubicacion "
        "ON indices_satelitales USING GIST (ubicacion)"
    )
    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_indices_satelitales_coords "
        "ON indices_satelitales (lat, lng)"
    )

    print("Ejecutando VACUUM ANALYZE...")
    try:
        await conn.execute("VACUUM ANALYZE indices_satelitales")
    except Exception as e:
        print(f"  VACUUM fallo: {e}")
        await conn.execute("ANALYZE indices_satelitales")

    await conn.close()
    print("Optimizacion completada.")

if __name__ == "__main__":
    asyncio.run(main())
