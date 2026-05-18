from pydantic import BaseModel
from typing import Optional


class DashboardSummaryResponse(BaseModel):
    total_analisis: int = 0
    total_sensores: int = 0
    sensores_criticos: int = 0
    sensores_advertencias: int = 0
    ultimo_analisis: Optional[dict] = None
    ultimos_analisis: list[dict] = []
