from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument

from app.api.dependencies import can_manage_library, require_roles
from app.database.mongodb import get_database
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.services.notifications import create_notification
from app.utils.mongo import object_id, serialize_document

router = APIRouter(prefix="/reservations", tags=["Reservations"])


async def enrich_reservations(records: list[dict]) -> list[dict]:
    db = get_database()
    book_ids = list({record["book_id"] for record in records})
    books = await db.books.find({"_id": {"$in": [object_id(value, "book_id") for value in book_ids]}}).to_list(None) if book_ids else []
    titles = {str(book["_id"]): book["title"] for book in books}
    return [{**record, "book_title": titles.get(record["book_id"])} for record in records]


def paginated(records: list[dict], total: int, page: int, page_size: int) -> PaginatedResponse[ReservationOut]:
    return PaginatedResponse(items=[ReservationOut.model_validate(serialize_document(record)) for record in records], total=total, page=page, page_size=page_size, pages=(total + page_size - 1) // page_size)


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def create_reservation(payload: ReservationCreate, current_user: dict = Depends(require_roles("student"))) -> ReservationOut:
    db = get_database()
    book = await db.books.find_one({"_id": object_id(payload.book_id, "book_id")})
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book["available_copies"] > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This book is available to borrow now; a reservation is not needed")
    existing = await db.reservations.find_one({"book_id": payload.book_id, "student_id": current_user["id"], "status": {"$in": ["queued", "available"]}})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have an active reservation for this book")
    position = await db.reservations.count_documents({"book_id": payload.book_id, "status": "queued"}) + 1
    document = {"book_id": payload.book_id, "student_id": current_user["id"], "library_id": book["library_id"], "status": "queued", "queue_position": position, "created_at": datetime.now(timezone.utc), "available_until": None}
    inserted = await db.reservations.insert_one(document)
    document["_id"] = inserted.inserted_id
    return ReservationOut.model_validate(serialize_document((await enrich_reservations([document]))[0]))


@router.get("/mine", response_model=PaginatedResponse[ReservationOut])
async def my_reservations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    current_user: dict = Depends(require_roles("student")),
) -> PaginatedResponse[ReservationOut]:
    db = get_database()
    filters = {"student_id": current_user["id"]}
    total = await db.reservations.count_documents(filters)
    records = await db.reservations.find(filters).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return paginated(await enrich_reservations(records), total, page, page_size)


@router.get("/library", response_model=PaginatedResponse[ReservationOut])
async def library_reservations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_roles("librarian", "admin")),
) -> PaginatedResponse[ReservationOut]:
    filters = {} if current_user["role"] == "admin" else {"library_id": current_user.get("library_id")}
    if current_user["role"] != "admin" and not current_user.get("library_id"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Your librarian account is not assigned to a library")
    db = get_database()
    total = await db.reservations.count_documents(filters)
    records = await db.reservations.find(filters).sort("created_at", 1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return paginated(await enrich_reservations(records), total, page, page_size)


@router.post("/{reservation_id}/cancel", response_model=MessageResponse)
async def cancel_reservation(reservation_id: str, current_user: dict = Depends(require_roles("student"))) -> MessageResponse:
    db = get_database()
    reservation = await db.reservations.find_one({"_id": object_id(reservation_id, "reservation_id")})
    if reservation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    if reservation["student_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot cancel this reservation")
    if reservation["status"] not in {"queued", "available"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This reservation can no longer be cancelled")
    await db.reservations.update_one({"_id": reservation["_id"]}, {"$set": {"status": "cancelled"}})
    remaining = await db.reservations.find({"book_id": reservation["book_id"], "status": "queued"}).sort("created_at", 1).to_list(None)
    for index, item in enumerate(remaining, 1):
        await db.reservations.update_one({"_id": item["_id"]}, {"$set": {"queue_position": index}})
    return MessageResponse(message="Reservation cancelled")


@router.post("/{reservation_id}/fulfill", response_model=ReservationOut)
async def fulfill_reservation(reservation_id: str, current_user: dict = Depends(require_roles("librarian", "admin"))) -> ReservationOut:
    db = get_database()
    reservation = await db.reservations.find_one({"_id": object_id(reservation_id, "reservation_id")})
    if reservation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    if not can_manage_library(current_user, reservation["library_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage reservations for your own library")
    if reservation["status"] != "available":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only available reservations can be fulfilled")
    updated = await db.reservations.find_one_and_update({"_id": reservation["_id"], "status": "available"}, {"$set": {"status": "fulfilled"}}, return_document=ReturnDocument.AFTER)
    return ReservationOut.model_validate(serialize_document((await enrich_reservations([updated]))[0]))
