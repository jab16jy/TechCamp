import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.predict import PredictRequest, PredictResponse, MonthProjection, CropScore
from app.services.prediction_service import project_6_months

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("", response_model=PredictResponse)
async def predict_crops(body: PredictRequest):
    if not (-90 <= body.lat <= 90) or not (-180 <= body.lng <= 180):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordenadas fuera de rango valido",
        )

    try:
        result = await project_6_months(
            lat=body.lat,
            lng=body.lng,
        )
        return PredictResponse(
            ubicacion=result["ubicacion"],
            meses=[MonthProjection(**m) for m in result["meses"]],
            mejor_mes=result.get("mejor_mes"),
            mejor_cultivo=result.get("mejor_cultivo"),
            fuente=result["fuente"],
        )
    except Exception as e:
        logger.exception("Prediction error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando la prediccion: {e}",
        )
