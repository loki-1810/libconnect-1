from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import require_roles
from app.database.mongodb import get_database
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.library import LibraryCreate, LibraryOut, LibraryUpdate
from app.utils.mongo import object_id, serialize_document

router = APIRouter(prefix="/libraries", tags=["Libraries"])


@router.get("", response_model=PaginatedResponse[LibraryOut])
async def list_libraries(
    q: str | None = None,
    approved_only: bool = True,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
) -> PaginatedResponse[LibraryOut]:
    filters: dict = {"is_approved": True} if approved_only else {}
    if q:
        filters["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"city": {"$regex": q, "$options": "i"}}]
    db = get_database()
    total = await db.libraries.count_documents(filters)
    records = await db.libraries.find(filters).sort("name", 1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return PaginatedResponse(items=[LibraryOut.model_validate(serialize_document(record)) for record in records], total=total, page=page, page_size=page_size, pages=(total + page_size - 1) // page_size)


@router.get("/{library_id}", response_model=LibraryOut)
async def get_library(library_id: str) -> LibraryOut:
    library = await get_database().libraries.find_one({"_id": object_id(library_id, "library_id")})
    if library is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library not found")
    return LibraryOut.model_validate(serialize_document(library))


@router.post("", response_model=LibraryOut, status_code=status.HTTP_201_CREATED)
async def create_library(payload: LibraryCreate, _: dict = Depends(require_roles("admin"))) -> LibraryOut:
    now = datetime.now(timezone.utc)
    document = {**payload.model_dump(), "is_approved": False, "created_at": now, "updated_at": now}
    inserted = await get_database().libraries.insert_one(document)
    document["_id"] = inserted.inserted_id
    return LibraryOut.model_validate(serialize_document(document))


@router.post("/apply", response_model=LibraryOut, status_code=status.HTTP_201_CREATED)
async def apply_for_library(payload: LibraryCreate) -> LibraryOut:
    """Accept a library registration for later review by an administrator."""
    now = datetime.now(timezone.utc)
    document = {**payload.model_dump(), "is_approved": False, "created_at": now, "updated_at": now}
    inserted = await get_database().libraries.insert_one(document)
    document["_id"] = inserted.inserted_id
    return LibraryOut.model_validate(serialize_document(document))


@router.patch("/{library_id}", response_model=LibraryOut)
async def update_library(library_id: str, payload: LibraryUpdate, _: dict = Depends(require_roles("admin"))) -> LibraryOut:
    values = payload.model_dump(exclude_unset=True)
    if values:
        values["updated_at"] = datetime.now(timezone.utc)
        result = await get_database().libraries.update_one({"_id": object_id(library_id, "library_id")}, {"$set": values})
        if not result.matched_count:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library not found")
    library = await get_database().libraries.find_one({"_id": object_id(library_id, "library_id")})
    return LibraryOut.model_validate(serialize_document(library))


@router.delete("/{library_id}", response_model=MessageResponse)
async def delete_library(library_id: str, _: dict = Depends(require_roles("admin"))) -> MessageResponse:
    db = get_database()
    reference_count = await db.books.count_documents({"library_id": library_id})
    if reference_count:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A library with books cannot be deleted")
    result = await db.libraries.delete_one({"_id": object_id(library_id, "library_id")})
    if not result.deleted_count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library not found")
    return MessageResponse(message="Library deleted")
