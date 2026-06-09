from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://agrocaribe:agrocaribe_secret@localhost:5432/agrocaribe"
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma2:2b"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "DEBUG"
    OPENMETEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    ELEVATION_API_URL: str = "https://api.open-meteo.com/v1/elevation"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
