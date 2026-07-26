from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import ReturnDocument

from app.api.dependencies import require_roles
from app.database.mongodb import get_database
from app.schemas.admin import AdminUserUpdate
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserOut
from app.utils.mongo import object_id, serialize_document

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserOut])
async def list_users(
    role: str | None = None,
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: dict = Depends(require_roles("admin")),
) -> PaginatedResponse[UserOut]:
    filters: dict = {}
    if role:
        filters["role"] = role
    if q:
        filters["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]
    db = get_database()
    total = await db.users.count_documents(filters)
    records = await db.users.find(filters, {"password_hash": 0, "password_reset_token": 0}).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return PaginatedResponse(items=[UserOut.model_validate(serialize_document(record)) for record in records], total=total, page=page, page_size=page_size, pages=(total + page_size - 1) // page_size)


@router.post("/{user_id}/toggle-active", response_model=UserOut)
async def toggle_active(user_id: str, _: dict = Depends(require_roles("admin"))) -> UserOut:
    db = get_database()
    user = await db.users.find_one({"_id": object_id(user_id, "user_id")})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    updated = await db.users.find_one_and_update({"_id": user["_id"]}, {"$set": {"is_active": not user.get("is_active", True), "updated_at": datetime.now(timezone.utc)}}, return_document=ReturnDocument.AFTER)
    updated.pop("password_hash", None)
    return UserOut.model_validate(serialize_document(updated))


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: AdminUserUpdate, _: dict = Depends(require_roles("admin"))) -> UserOut:
    values = payload.model_dump(exclude_unset=True)
    if "library_id" in values and values["library_id"] is not None:
        if not await get_database().libraries.find_one({"_id": object_id(values["library_id"], "library_id")}):
            raise HTTPException(status_code=404, detail="Library not found")
    values["updated_at"] = datetime.now(timezone.utc)
    updated = await get_database().users.find_one_and_update({"_id": object_id(user_id, "user_id")}, {"$set": values}, return_document=ReturnDocument.AFTER)
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    updated.pop("password_hash", None)
    return UserOut.model_validate(serialize_document(updated))
