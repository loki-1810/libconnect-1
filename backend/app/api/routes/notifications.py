from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import get_current_user
from app.database.mongodb import get_database
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.notification import NotificationOut
from app.utils.mongo import object_id, serialize_document

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=PaginatedResponse[NotificationOut])
async def list_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
) -> PaginatedResponse[NotificationOut]:
    db = get_database()
    filters = {"user_id": current_user["id"]}
    total = await db.notifications.count_documents(filters)
    records = await db.notifications.find(filters).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return PaginatedResponse(items=[NotificationOut.model_validate(serialize_document(record)) for record in records], total=total, page=page, page_size=page_size, pages=(total + page_size - 1) // page_size)


@router.post("/{notification_id}/read", response_model=MessageResponse)
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)) -> MessageResponse:
    result = await get_database().notifications.update_one({"_id": object_id(notification_id, "notification_id"), "user_id": current_user["id"]}, {"$set": {"is_read": True}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Notification not found")
    return MessageResponse(message="Notification marked as read")


@router.post("/read-all", response_model=MessageResponse)
async def mark_all_read(current_user: dict = Depends(get_current_user)) -> MessageResponse:
    await get_database().notifications.update_many({"user_id": current_user["id"], "is_read": False}, {"$set": {"is_read": True}})
    return MessageResponse(message="Notifications marked as read")
