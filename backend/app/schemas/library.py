from datetime import datetime

from pydantic import Field

from app.schemas.common import APIModel


class LibraryCreate(APIModel):
    name: str = Field(min_length=2, max_length=150)
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=100)
    contact_email: str | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    description: str | None = Field(default=None, max_length=2000)


class LibraryUpdate(APIModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    address: str | None = Field(default=None, min_length=5, max_length=500)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    contact_email: str | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    description: str | None = Field(default=None, max_length=2000)
    is_approved: bool | None = None


class LibraryOut(APIModel):
    id: str
    name: str
    address: str
    city: str
    contact_email: str | None = None
    contact_phone: str | None = None
    description: str | None = None
    is_approved: bool
    created_at: datetime
