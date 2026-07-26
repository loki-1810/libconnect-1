from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import can_manage_library, get_current_user, require_roles
from app.database.mongodb import get_database
from app.schemas.book import BookCreate, BookOut, BookUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.utils.mongo import object_id, serialize_document

router = APIRouter(prefix="/books", tags=["Books"])


def book_status(available_copies: int) -> str:
    return "available" if available_copies > 0 else "unavailable"


@router.get("", response_model=PaginatedResponse[BookOut])
async def list_books(
    q: str | None = None,
    category: str | None = None,
    author: str | None = None,
    language: str | None = None,
    year: int | None = Query(default=None, ge=1000, le=2100),
    availability: str | None = Query(default=None, pattern="^(available|unavailable)$"),
    library_id: str | None = None,
    sort: str = Query(default="title", pattern="^(title|author|published_year|created_at)$"),
    order: str = Query(default="asc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
) -> PaginatedResponse[BookOut]:
    filters: dict = {}
    if q:
        regex = {"$regex": q.strip(), "$options": "i"}
        filters["$or"] = [{"title": regex}, {"author": regex}, {"isbn": regex}, {"category": regex}, {"publisher": regex}, {"language": regex}]
    for field, value in (("category", category), ("author", author), ("language", language), ("published_year", year), ("library_id", library_id)):
        if value is not None:
            filters[field] = value
    if availability:
        filters["status"] = availability
    db = get_database()
    total = await db.books.count_documents(filters)
    direction = 1 if order == "asc" else -1
    records = await db.books.find(filters).sort(sort, direction).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return PaginatedResponse(items=[BookOut.model_validate(serialize_document(record)) for record in records], total=total, page=page, page_size=page_size, pages=(total + page_size - 1) // page_size)


@router.get("/filters")
async def book_filters() -> dict:
    db = get_database()
    categories = await db.books.distinct("category")
    languages = await db.books.distinct("language")
    authors = await db.books.distinct("author")
    return {"categories": sorted(categories), "languages": sorted(languages), "authors": sorted(authors)}


@router.get("/{book_id}", response_model=BookOut)
async def get_book(book_id: str) -> BookOut:
    book = await get_database().books.find_one({"_id": object_id(book_id, "book_id")})
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return BookOut.model_validate(serialize_document(book))


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
async def create_book(payload: BookCreate, current_user: dict = Depends(require_roles("librarian", "admin"))) -> BookOut:
    library_id = payload.library_id or current_user.get("library_id")
    if not library_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A library_id is required")
    if not can_manage_library(current_user, library_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own library")
    db = get_database()
    if not await db.libraries.find_one({"_id": object_id(library_id, "library_id")}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library not found")
    if await db.books.find_one({"library_id": library_id, "isbn": payload.isbn}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This ISBN already exists in the selected library")
    now = datetime.now(timezone.utc)
    document = {**payload.model_dump(exclude={"library_id"}), "library_id": library_id, "available_copies": payload.total_copies, "status": "available", "created_at": now, "updated_at": now}
    inserted = await db.books.insert_one(document)
    document["_id"] = inserted.inserted_id
    return BookOut.model_validate(serialize_document(document))


@router.patch("/{book_id}", response_model=BookOut)
async def update_book(book_id: str, payload: BookUpdate, current_user: dict = Depends(require_roles("librarian", "admin"))) -> BookOut:
    db = get_database()
    book = await db.books.find_one({"_id": object_id(book_id, "book_id")})
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if not can_manage_library(current_user, book["library_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own library")
    values = payload.model_dump(exclude_unset=True)
    if "total_copies" in values:
        checked_out = book["total_copies"] - book["available_copies"]
        if values["total_copies"] < checked_out:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Total copies cannot be lower than issued copies")
        values["available_copies"] = values["total_copies"] - checked_out
        values["status"] = book_status(values["available_copies"])
    if values:
        values["updated_at"] = datetime.now(timezone.utc)
        await db.books.update_one({"_id": book["_id"]}, {"$set": values})
    updated = await db.books.find_one({"_id": book["_id"]})
    return BookOut.model_validate(serialize_document(updated))


@router.delete("/{book_id}", response_model=MessageResponse)
async def delete_book(book_id: str, current_user: dict = Depends(require_roles("librarian", "admin"))) -> MessageResponse:
    db = get_database()
    book = await db.books.find_one({"_id": object_id(book_id, "book_id")})
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if not can_manage_library(current_user, book["library_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own library")
    active_borrows = await db.borrows.count_documents({"book_id": book_id, "status": {"$in": ["requested", "borrowed", "overdue"]}})
    if active_borrows:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Books with active borrowing records cannot be deleted")
    await db.books.delete_one({"_id": book["_id"]})
    return MessageResponse(message="Book deleted")
