import asyncio

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

url = "postgresql+asyncpg://postgres.hpmjbgqjwopxlgurczna:OmP3U2rXaUey9LvO@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
print(f"URL: {url[:80]}...")

async def main():
    engine = create_async_engine(
        url,
        connect_args={
            "statement_cache_size": 0,
            "ssl": "require",
            "timeout": 10,
        },
    )
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))
        print(f"Result: {result.fetchone()}")

    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT COUNT(*) FROM conversaciones"))
        print(f"Conversaciones: {result.fetchone()}")

    await engine.dispose()
    print("Connection OK!")

asyncio.run(main())
