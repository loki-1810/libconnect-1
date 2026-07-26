from datetime import datetime
from typing import Literal

from app.schemas.common import APIModel

ReservationStatus = Literal["queued", "available", "fulfilled", "cancelled", "expired"]


class ReservationCreate(APIModel):
    book_id: str


class ReservationOut(APIModel):
    id: str
    book_id: str
    student_id: str
    library_id: str
    status: ReservationStatus
    queue_position: int
    created_at: datetime
    available_until: datetime | None = None
    book_title: str | None = None
