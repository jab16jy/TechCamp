from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None
    expires_in: int | None = None
    user: "UserInfo"


class UserInfo(BaseModel):
    id: str
    email: str
    rol: str | None = "investigador"

    model_config = {"from_attributes": True}
