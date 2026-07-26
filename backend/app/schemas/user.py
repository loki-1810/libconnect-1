from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.common import APIModel

Role = Literal["student", "librarian", "admin"]


class UserRegister(APIModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["student", "librarian"] = "student"
    library_id: str | None = None


class UserLogin(APIModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserUpdate(APIModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    avatar_url: str | None = Field(default=None, max_length=500)


class UserOut(APIModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    library_id: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime


class TokenResponse(APIModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(APIModel):
    email: EmailStr


class ResetPasswordRequest(APIModel):
    token: str = Field(min_length=1)
    password: str = Field(min_length=8, max_length=128)
