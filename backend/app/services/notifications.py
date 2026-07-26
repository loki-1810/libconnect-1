from datetime import datetime, timezone

from app.database.mongodb import get_database


async def create_notification(user_id: str, title: str, message: str, notification_type: str) -> None:
    await get_database().notifications.insert_one(
        {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "is_read": False,
            "created_at": datetime.now(timezone.utc),
        }
    )
