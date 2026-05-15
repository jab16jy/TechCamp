from fastapi import APIRouter

from app.api import municipios, analisis, clima, satelite, historial

router = APIRouter()

router.include_router(municipios.router, tags=["municipios"])
router.include_router(analisis.router, tags=["analisis"])
router.include_router(clima.router, tags=["clima"])
router.include_router(satelite.router, tags=["satelite"])
router.include_router(historial.router, tags=["historial"])
