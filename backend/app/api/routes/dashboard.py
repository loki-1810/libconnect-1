from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.database.mongodb import get_database
from app.services.borrows import mark_overdue_borrows

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])


@router.get("")
async def dashboard(current_user: dict = Depends(get_current_user)) -> dict:
    db = get_database()
    await mark_overdue_borrows(student_id=current_user["id"] if current_user["role"] == "student" else None, library_id=current_user.get("library_id") if current_user["role"] == "librarian" else None)
    if current_user["role"] == "student":
        borrow_filter = {"student_id": current_user["id"]}
        active = await db.borrows.count_documents({**borrow_filter, "status": {"$in": ["borrowed", "overdue"]}})
        pending = await db.borrows.count_documents({**borrow_filter, "status": "requested"})
        reservations = await db.reservations.count_documents({"student_id": current_user["id"], "status": {"$in": ["queued", "available"]}})
        recent = await db.borrows.find(borrow_filter).sort("requested_at", -1).limit(5).to_list(5)
        return {"role": "student", "cards": {"active_borrows": active, "pending_requests": pending, "active_reservations": reservations}, "recent_activity": [{"type": item["status"], "at": item["requested_at"], "book_id": item["book_id"]} for item in recent]}
    if current_user["role"] == "librarian":
        library_filter = {"library_id": current_user.get("library_id")}
        books = await db.books.count_documents(library_filter)
        available = await db.books.count_documents({**library_filter, "available_copies": {"$gt": 0}})
        pending = await db.borrows.count_documents({**library_filter, "status": "requested"})
        issued = await db.borrows.count_documents({**library_filter, "status": {"$in": ["borrowed", "overdue"]}})
        popular = await db.borrows.aggregate([{"$match": library_filter}, {"$group": {"_id": "$book_id", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 5}]).to_list(5)
        return {"role": "librarian", "cards": {"total_books": books, "available_books": available, "pending_requests": pending, "issued_books": issued}, "popular_books": [{"book_id": item["_id"], "borrow_count": item["count"]} for item in popular]}
    users = await db.users.count_documents({})
    libraries = await db.libraries.count_documents({})
    books = await db.books.count_documents({})
    pending_libraries = await db.libraries.count_documents({"is_approved": False})
    recent_users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {"role": "admin", "cards": {"total_users": users, "total_libraries": libraries, "total_books": books, "pending_libraries": pending_libraries}, "recent_users": [{"id": str(item["_id"]), "name": item["name"], "email": item["email"], "role": item["role"], "created_at": item["created_at"]} for item in recent_users]}


@router.get("/reports/borrows")
async def borrow_report(current_user: dict = Depends(get_current_user)) -> dict:
    db = get_database()
    match = {} if current_user["role"] == "admin" else {"library_id": current_user.get("library_id")} if current_user["role"] == "librarian" else {"student_id": current_user["id"]}
    since = datetime.now(timezone.utc) - timedelta(days=30)
    records = await db.borrows.aggregate([{"$match": {**match, "requested_at": {"$gte": since}}}, {"$group": {"_id": "$status", "count": {"$sum": 1}}}]).to_list(None)
    return {"period_days": 30, "series": [{"status": record["_id"], "count": record["count"]} for record in records]}
