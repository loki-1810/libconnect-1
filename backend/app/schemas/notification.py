from datetime import datetime

from app.schemas.common import APIModel


class NotificationOut(APIModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
