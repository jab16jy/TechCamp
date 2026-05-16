from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://agrocaribe:agrocaribe_secret@localhost:5432/agrocaribe"
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "DEBUG"
    OPENMETEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
