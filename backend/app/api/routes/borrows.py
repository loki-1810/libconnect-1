from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument

from app.api.dependencies import can_manage_library, get_current_user, require_roles
from app.core.config import get_settings
from app.database.mongodb import get_database
from app.schemas.borrow import BorrowCreate, BorrowDecision, BorrowOut, PickupSchedule
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.borrows import enrich_borrows, mark_overdue_borrows
from app.services.notifications import create_notification
from app.utils.mongo import object_id, serialize_document

router = APIRouter(prefix="/borrows", tags=["Borrowing"])


def page_response(records: list[dict], total: int, page: int, page_size: int) -> PaginatedResponse[BorrowOut]:
    return PaginatedResponse(items=[BorrowOut.model_validate(serialize_document(record)) for record in records], total=total, page=page, page_size=page_size, pages=(total + page_size - 1) // page_size)


@router.post("", response_model=BorrowOut, status_code=status.HTTP_201_CREATED)
async def request_borrow(payload: BorrowCreate, current_user: dict = Depends(require_roles("student"))) -> BorrowOut:
    db = get_database()
    book = await db.books.find_one({"_id": object_id(payload.book_id, "book_id")})
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book["available_copies"] < 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This book is not available. You can reserve it instead.")
    held_reservation = await db.reservations.find_one({"book_id": payload.book_id, "status": "available"})
    if held_reservation and held_reservation["student_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The available copy is currently held for a reservation")
    active = await db.borrows.count_documents({"student_id": current_user["id"], "status": {"$in": ["requested", "approved", "borrowed", "overdue"]}})
    if active >= get_settings().max_borrow_limit:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"You have reached the {get_settings().max_borrow_limit}-book borrowing limit")
    already_requested = await db.borrows.find_one({"student_id": current_user["id"], "book_id": payload.book_id, "status": {"$in": ["requested", "approved", "borrowed", "overdue"]}})
    if already_requested:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have an active request or loan for this book")
    document = {"book_id": payload.book_id, "student_id": current_user["id"], "library_id": book["library_id"], "status": "requested", "requested_at": datetime.now(timezone.utc), "approved_at": None, "issued_at": None, "due_date": None, "returned_at": None, "fine_amount": 0.0, "note": None}
    inserted = await db.borrows.insert_one(document)
    document["_id"] = inserted.inserted_id
    enriched = (await enrich_borrows([document]))[0]
    return BorrowOut.model_validate(serialize_document(enriched))


@router.get("/mine", response_model=PaginatedResponse[BorrowOut])
async def my_borrows(
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    current_user: dict = Depends(require_roles("student")),
) -> PaginatedResponse[BorrowOut]:
    await mark_overdue_borrows(student_id=current_user["id"])
    filters: dict = {"student_id": current_user["id"]}
    if status_filter:
        filters["status"] = status_filter
    db = get_database()
    total = await db.borrows.count_documents(filters)
    records = await db.borrows.find(filters).sort("requested_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return page_response(await enrich_borrows(records), total, page, page_size)


@router.get("/library", response_model=PaginatedResponse[BorrowOut])
async def library_borrows(
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_roles("librarian", "admin")),
) -> PaginatedResponse[BorrowOut]:
    await mark_overdue_borrows(library_id=current_user.get("library_id"))
    filters: dict = {}
    if current_user["role"] != "admin":
        if not current_user.get("library_id"):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Your librarian account is not assigned to a library")
        filters["library_id"] = current_user["library_id"]
    if status_filter:
        filters["status"] = status_filter
    db = get_database()
    total = await db.borrows.count_documents(filters)
    records = await db.borrows.find(filters).sort("requested_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return page_response(await enrich_borrows(records), total, page, page_size)


@router.post("/{borrow_id}/approve", response_model=BorrowOut)
async def approve_borrow(borrow_id: str, payload: BorrowDecision, current_user: dict = Depends(require_roles("librarian", "admin"))) -> BorrowOut:
    db = get_database()
    borrow = await db.borrows.find_one({"_id": object_id(borrow_id, "borrow_id")})
    if borrow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow request not found")
    if not can_manage_library(current_user, borrow["library_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage requests for your own library")
    if borrow["status"] != "requested":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending requests can be approved")
    book = await db.books.find_one_and_update({"_id": object_id(borrow["book_id"], "book_id"), "available_copies": {"$gt": 0}}, {"$inc": {"available_copies": -1}, "$set": {"updated_at": datetime.now(timezone.utc)}}, return_document=ReturnDocument.AFTER)
    if book is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The book is no longer available")
    await db.books.update_one({"_id": book["_id"]}, {"$set": {"status": "available" if book["available_copies"] else "unavailable"}})
    now = datetime.now(timezone.utc)
    updated = await db.borrows.find_one_and_update({"_id": borrow["_id"], "status": "requested"}, {"$set": {"status": "approved", "approved_at": now, "note": payload.note}}, return_document=ReturnDocument.AFTER)
    if updated is None:
        await db.books.update_one({"_id": book["_id"]}, {"$inc": {"available_copies": 1}, "$set": {"status": "available", "updated_at": datetime.now(timezone.utc)}})
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Borrow request was already processed")
    await db.reservations.update_one({"book_id": updated["book_id"], "student_id": updated["student_id"], "status": "available"}, {"$set": {"status": "fulfilled"}})
    await create_notification(updated["student_id"], "Borrow request approved", f"Your request for {book['title']} was approved. Please choose a pickup time.", "borrow_approved")
    return BorrowOut.model_validate(serialize_document((await enrich_borrows([updated]))[0]))


@router.post("/{borrow_id}/reject", response_model=BorrowOut)
async def reject_borrow(borrow_id: str, payload: BorrowDecision, current_user: dict = Depends(require_roles("librarian", "admin"))) -> BorrowOut:
    db = get_database()
    borrow = await db.borrows.find_one({"_id": object_id(borrow_id, "borrow_id")})
    if borrow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow request not found")
    if not can_manage_library(current_user, borrow["library_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage requests for your own library")
    updated = await db.borrows.find_one_and_update({"_id": borrow["_id"], "status": "requested"}, {"$set": {"status": "rejected", "note": payload.note}}, return_document=ReturnDocument.AFTER)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending requests can be rejected")
    book = await db.books.find_one({"_id": object_id(updated["book_id"], "book_id")})
    await create_notification(updated["student_id"], "Borrow request declined", f"Your request for {book['title'] if book else 'a book'} was declined.", "borrow_rejected")
    return BorrowOut.model_validate(serialize_document((await enrich_borrows([updated]))[0]))


@router.post("/{borrow_id}/return", response_model=BorrowOut)
async def return_book(borrow_id: str, payload: BorrowDecision, current_user: dict = Depends(get_current_user)) -> BorrowOut:
    db = get_database()
    borrow = await db.borrows.find_one({"_id": object_id(borrow_id, "borrow_id")})
    if borrow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow record not found")
    is_owner = current_user["id"] == borrow["student_id"]
    if not is_owner and not (current_user["role"] in {"librarian", "admin"} and can_manage_library(current_user, borrow["library_id"])):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot return this book")
    if borrow["status"] not in {"borrowed", "overdue"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only issued books can be returned")
    now = datetime.now(timezone.utc)
    days_late = max(0, (now.date() - borrow["due_date"].date()).days) if borrow.get("due_date") else 0
    fine = round(days_late * get_settings().fine_per_day, 2)
    updated = await db.borrows.find_one_and_update({"_id": borrow["_id"], "status": {"$in": ["borrowed", "overdue"]}}, {"$set": {"status": "returned", "returned_at": now, "fine_amount": fine, "note": payload.note or borrow.get("note")}}, return_document=ReturnDocument.AFTER)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This loan has already been returned")
    book = await db.books.find_one_and_update({"_id": object_id(borrow["book_id"], "book_id")}, {"$inc": {"available_copies": 1}, "$set": {"status": "available", "updated_at": now}}, return_document=ReturnDocument.AFTER)
    queued_reservation = await db.reservations.find_one_and_update({"book_id": borrow["book_id"], "status": "queued"}, {"$set": {"status": "available", "available_until": now + timedelta(days=2)}}, sort=[("created_at", 1)], return_document=ReturnDocument.AFTER)
    if queued_reservation:
        await create_notification(queued_reservation["student_id"], "Reserved book is available", f"{book['title'] if book else 'Your reserved book'} is now available. Please collect it within 2 days.", "reservation_available")
    return BorrowOut.model_validate(serialize_document((await enrich_borrows([updated]))[0]))


@router.post("/{borrow_id}/cancel-request", response_model=BorrowOut)
async def cancel_request(borrow_id: str, current_user: dict = Depends(require_roles("student"))) -> BorrowOut:
    db = get_database()
    borrow = await db.borrows.find_one({"_id": object_id(borrow_id, "borrow_id")})
    if borrow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow request not found")
    if borrow["student_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own requests")
    if borrow["status"] != "requested":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending requests can be cancelled")
    updated = await db.borrows.find_one_and_update(
        {"_id": borrow["_id"], "status": "requested"},
        {"$set": {"status": "cancelled"}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request was already processed")
    return BorrowOut.model_validate(serialize_document((await enrich_borrows([updated]))[0]))


@router.post("/{borrow_id}/cancel-pickup", response_model=BorrowOut)
async def cancel_pickup(borrow_id: str, current_user: dict = Depends(require_roles("student"))) -> BorrowOut:
    db = get_database()
    borrow = await db.borrows.find_one({"_id": object_id(borrow_id, "borrow_id")})
    if borrow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow request not found")
    if borrow["student_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own requests")
    if borrow["status"] != "approved":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only approved requests with scheduled pickup can be cancelled")
    updated = await db.borrows.find_one_and_update(
        {"_id": borrow["_id"], "status": "approved"},
        {"$set": {"status": "cancelled"}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request was already processed")
    await db.books.update_one(
        {"_id": object_id(borrow["book_id"], "book_id")},
        {"$inc": {"available_copies": 1}, "$set": {"status": "available", "updated_at": datetime.now(timezone.utc)}},
    )
    return BorrowOut.model_validate(serialize_document((await enrich_borrows([updated]))[0]))


@router.post("/{borrow_id}/schedule-pickup", response_model=BorrowOut)
async def schedule_pickup(borrow_id: str, payload: PickupSchedule, current_user: dict = Depends(require_roles("student"))) -> BorrowOut:
    db = get_database()
    borrow = await db.borrows.find_one({"_id": object_id(borrow_id, "borrow_id")})
    if borrow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow request not found")
    if borrow["student_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own borrows")
    if borrow["status"] != "approved":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only approved requests can be scheduled for pickup")
    updated = await db.borrows.find_one_and_update(
        {"_id": borrow["_id"], "status": "approved"},
        {"$set": {"pickup_date": payload.pickup_date, "pickup_time": payload.pickup_time}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request is no longer in approved state")
    book = await db.books.find_one({"_id": object_id(borrow["book_id"], "book_id")})
    await create_notification(
        updated["student_id"],
        "Pickup scheduled",
        f"You are scheduled to collect {book['title'] if book else 'your book'} on {payload.pickup_date} at {payload.pickup_time}.",
        "pickup_scheduled",
    )
    librarian = await db.users.find_one({"library_id": borrow["library_id"], "role": "librarian"})
    if librarian:
        await create_notification(
            librarian["id"],
            "Student scheduled pickup",
            f"A student scheduled pickup for {book['title'] if book else 'a book'} on {payload.pickup_date} at {payload.pickup_time}.",
            "pickup_scheduled",
        )
    return BorrowOut.model_validate(serialize_document((await enrich_borrows([updated]))[0]))


@router.post("/{borrow_id}/collect", response_model=BorrowOut)
async def collect_book(borrow_id: str, payload: BorrowDecision, current_user: dict = Depends(require_roles("librarian", "admin"))) -> BorrowOut:
    db = get_database()
    borrow = await db.borrows.find_one({"_id": object_id(borrow_id, "borrow_id")})
    if borrow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow request not found")
    if not can_manage_library(current_user, borrow["library_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage requests for your own library")
    if borrow["status"] != "approved":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only approved requests can be collected")
    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=get_settings().default_borrow_days)
    updated = await db.borrows.find_one_and_update(
        {"_id": borrow["_id"], "status": "approved"},
        {"$set": {"status": "borrowed", "issued_at": now, "due_date": due_date, "note": payload.note or borrow.get("note")}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request was already processed")
    book = await db.books.find_one({"_id": object_id(borrow["book_id"], "book_id")})
    await create_notification(
        updated["student_id"],
        "Book collected",
        f"You have collected {book['title'] if book else 'your book'}. It is due on {due_date.date().isoformat()}.",
        "book_collected",
    )
    return BorrowOut.model_validate(serialize_document((await enrich_borrows([updated]))[0]))


@router.get("/fine-status/me")
async def fine_status(current_user: dict = Depends(require_roles("student"))) -> dict:
    await mark_overdue_borrows(student_id=current_user["id"])
    records = await get_database().borrows.find({"student_id": current_user["id"], "status": {"$in": ["borrowed", "overdue", "returned"]}}).to_list(None)
    now = datetime.now(timezone.utc)
    outstanding = 0.0
    for record in records:
        if record["status"] == "overdue" and record.get("due_date"):
            outstanding += max(0, (now.date() - record["due_date"].date()).days) * get_settings().fine_per_day
        elif record["status"] == "returned":
            outstanding += record.get("fine_amount", 0)
    return {"fine_amount": round(outstanding, 2), "currency": "INR"}
