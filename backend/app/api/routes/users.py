from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import ReturnDocument

from app.api.dependencies import require_roles
from app.core.security import hash_password
from app.database.mongodb import get_database
from app.schemas.admin import AdminUserUpdate, CreateLibrarian
from app.schemas.common import MessageResponse, PaginatedResponse
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


@router.post("/create-librarian", response_model=UserOut, status_code=201)
async def create_librarian(payload: CreateLibrarian, current_user: dict = Depends(require_roles("admin"))) -> UserOut:
    db = get_database()
    if await db.users.find_one({"email": payload.email.lower()}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    now = datetime.now(timezone.utc)
    document = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "role": "librarian",
        "library_id": None,
        "phone": None,
        "avatar_url": None,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    inserted = await db.users.insert_one(document)
    user = await db.users.find_one({"_id": inserted.inserted_id})
    user.pop("password_hash", None)
    return UserOut.model_validate(serialize_document(user))


@router.post("/{user_id}/assign-library", response_model=UserOut)
async def assign_library(user_id: str, payload: dict, current_user: dict = Depends(require_roles("admin"))) -> UserOut:
    db = get_database()
    library_id = payload.get("library_id")
    if library_id and not await db.libraries.find_one({"_id": object_id(library_id, "library_id")}):
        raise HTTPException(status_code=404, detail="Library not found")
    updated = await db.users.find_one_and_update(
        {"_id": object_id(user_id, "user_id")},
        {"$set": {"library_id": library_id, "updated_at": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    updated.pop("password_hash", None)
    return UserOut.model_validate(serialize_document(updated))


@router.post("/{user_id}/toggle-active", response_model=UserOut)
async def toggle_active(user_id: str, current_user: dict = Depends(require_roles("admin"))) -> UserOut:
    db = get_database()
    user = await db.users.find_one({"_id": object_id(user_id, "user_id")})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user["role"] == "admin" and user["id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You cannot deactivate another admin")
    updated = await db.users.find_one_and_update({"_id": user["_id"]}, {"$set": {"is_active": not user.get("is_active", True), "updated_at": datetime.now(timezone.utc)}}, return_document=ReturnDocument.AFTER)
    updated.pop("password_hash", None)
    return UserOut.model_validate(serialize_document(updated))


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: AdminUserUpdate, _: dict = Depends(require_roles("admin"))) -> UserOut:
    db = get_database()
    values = payload.model_dump(exclude_unset=True)
    target = await db.users.find_one({"_id": object_id(user_id, "user_id")})
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target["role"] == "admin" and values.get("role") and values["role"] != "admin":
        raise HTTPException(status_code=403, detail="Cannot change the role of an admin")
    if values.get("role") == "admin":
        existing_admin = await db.users.find_one({"role": "admin", "_id": {"$ne": object_id(user_id, "user_id")}})
        if existing_admin:
            raise HTTPException(status_code=409, detail="Only one admin is allowed")
    if "library_id" in values and values["library_id"] is not None:
        if not await db.libraries.find_one({"_id": object_id(values["library_id"], "library_id")}):
            raise HTTPException(status_code=404, detail="Library not found")
    values["updated_at"] = datetime.now(timezone.utc)
    updated = await db.users.find_one_and_update({"_id": object_id(user_id, "user_id")}, {"$set": values}, return_document=ReturnDocument.AFTER)
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    updated.pop("password_hash", None)
    return UserOut.model_validate(serialize_document(updated))
