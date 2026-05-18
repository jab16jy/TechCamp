from fastapi import APIRouter

from app.api import municipios, analisis, clima, satelite, historial, auth, chat, sensores, geo, predict, reports

router = APIRouter()

router.include_router(municipios.router, tags=["municipios"])
router.include_router(analisis.router, tags=["analisis"])
router.include_router(clima.router, tags=["clima"])
router.include_router(satelite.router, tags=["satelite"])
router.include_router(historial.router, tags=["historial"])
router.include_router(auth.router, tags=["auth"])
router.include_router(chat.router, tags=["chat"])
router.include_router(sensores.router, tags=["sensores"])
router.include_router(geo.router, tags=["geo"])
router.include_router(predict.router, tags=["predict"])
router.include_router(reports.router, tags=["reports"])
