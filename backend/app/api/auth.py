import logging

import httpx
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.core.dependencies import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse, UserInfo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de autenticacion no configurado",
        )

    url = f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "X-Supabase-Auth-Test": "true",
    }
    payload = {"email": body.email, "password": body.password}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code >= 400:
                error_detail = "Credenciales invalidas"
                try:
                    error_body = resp.json()
                    error_detail = error_body.get("msg", error_body.get("error_description", error_detail))
                except Exception:
                    if resp.status_code == 400:
                        error_detail = "Correo o contrasena incorrectos"
                status_map = {400: 401, 401: 401, 429: 429}
                http_code = status_map.get(resp.status_code, 502)
                raise HTTPException(status_code=http_code, detail=error_detail)

            data = resp.json()
            user = data.get("user", {})
            session = data.get("session", {})

            return TokenResponse(
                access_token=data.get("access_token", ""),
                token_type=data.get("token_type", "bearer"),
                refresh_token=data.get("refresh_token"),
                expires_in=data.get("expires_in", 3600),
                user=UserInfo(
                    id=user.get("id", ""),
                    email=user.get("email", body.email),
                    rol=user.get("user_metadata", {}).get("rol", "investigador"),
                ),
            )
        except HTTPException:
            raise
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="El servidor de autenticacion no responde",
            )
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Error de comunicacion con el servidor de autenticacion",
            )
