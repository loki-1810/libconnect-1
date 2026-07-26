from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.common import APIModel


class AdminUserUpdate(APIModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    role: Literal["student", "librarian", "admin"] | None = None
    library_id: str | None = None
    is_active: bool | None = None


class CreateLibrarian(APIModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
