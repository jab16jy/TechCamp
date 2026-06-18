import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.api.router import router as api_router

settings = get_settings()
logger = logging.getLogger(__name__)


async def _warm_events_cache() -> None:
    """Pre-load the historical-events cache so the first user request is fast.

    Runs in a worker thread; failures are non-fatal (the endpoint reloads lazily).
    """
    try:
        from app.ml.data_sources.eventos_historicos import load_all_events
        await asyncio.to_thread(load_all_events)
        logger.info("Historical events cache warmed at startup")
    except Exception as e:  # pragma: no cover - best-effort warm-up
        logger.warning("Historical events cache warm-up failed: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fire-and-forget: don't block startup; the cache fills in the background.
    warm_task = asyncio.create_task(_warm_events_cache())
    yield
    warm_task.cancel()


app = FastAPI(
    title="AgroCaribe IA API",
    description="Sistema inteligente de recomendacion de cultivos para la region Caribe colombiana",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="")


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
