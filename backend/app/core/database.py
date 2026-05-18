from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

connect_args = {
    "prepared_statement_cache_size": 0,
    "statement_cache_size": 0,
    "timeout": 60,
}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_size=10,
    max_overflow=20,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except SQLAlchemyError:
            await session.rollback()
        finally:
            await session.close()
