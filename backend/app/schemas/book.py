from datetime import datetime

from pydantic import Field, field_validator

from app.schemas.common import APIModel


class BookBase(APIModel):
    isbn: str = Field(min_length=10, max_length=20)
    title: str = Field(min_length=1, max_length=300)
    author: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    publisher: str | None = Field(default=None, max_length=150)
    language: str = Field(default="English", min_length=2, max_length=50)
    edition: str | None = Field(default=None, max_length=50)
    published_year: int | None = Field(default=None, ge=1000, le=2100)
    shelf_number: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=5000)
    cover_image: str | None = Field(default=None, max_length=500)
    total_copies: int = Field(ge=1, le=100000)

    @field_validator("isbn")
    @classmethod
    def normalize_isbn(cls, value: str) -> str:
        return value.replace("-", "").replace(" ", "").upper()


class BookCreate(BookBase):
    library_id: str | None = None


class BookUpdate(APIModel):
    isbn: str | None = Field(default=None, min_length=10, max_length=20)
    title: str | None = Field(default=None, min_length=1, max_length=300)
    author: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    publisher: str | None = Field(default=None, max_length=150)
    language: str | None = Field(default=None, min_length=2, max_length=50)
    edition: str | None = Field(default=None, max_length=50)
    published_year: int | None = Field(default=None, ge=1000, le=2100)
    shelf_number: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=5000)
    cover_image: str | None = Field(default=None, max_length=500)
    total_copies: int | None = Field(default=None, ge=1, le=100000)


class BookOut(BookBase):
    id: str
    library_id: str
    available_copies: int
    status: str
    created_at: datetime
    updated_at: datetime
