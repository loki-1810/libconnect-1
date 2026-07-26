from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import APIModel

BorrowStatus = Literal["requested", "approved", "rejected", "cancelled", "borrowed", "returned", "overdue"]


class BorrowCreate(APIModel):
    book_id: str


class BorrowDecision(APIModel):
    note: str | None = Field(default=None, max_length=500)


class PickupSchedule(APIModel):
    pickup_date: str = Field(..., max_length=10)
    pickup_time: str = Field(..., max_length=10)


class BorrowOut(APIModel):
    id: str
    book_id: str
    student_id: str
    library_id: str
    status: BorrowStatus
    requested_at: datetime
    approved_at: datetime | None = None
    issued_at: datetime | None = None
    due_date: datetime | None = None
    returned_at: datetime | None = None
    fine_amount: float
    note: str | None = None
    pickup_date: str | None = None
    pickup_time: str | None = None
    book_title: str | None = None
    student_name: str | None = None
    student_email: str | None = None
    live_fine: float | None = None
