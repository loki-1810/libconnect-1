from datetime import datetime, timezone

from app.core.config import get_settings
from app.database.mongodb import get_database


async def enrich_borrows(records: list[dict]) -> list[dict]:
    db = get_database()
    book_ids = list({record["book_id"] for record in records})
    student_ids = list({record["student_id"] for record in records})
    from app.utils.mongo import object_id

    books = await db.books.find({"_id": {"$in": [object_id(value, "book_id") for value in book_ids]}}).to_list(None) if book_ids else []
    students = await db.users.find({"_id": {"$in": [object_id(value, "student_id") for value in student_ids]}}).to_list(None) if student_ids else []
    book_names = {str(book["_id"]): book["title"] for book in books}
    student_names = {str(user["_id"]): user["name"] for user in students}
    student_emails = {str(user["_id"]): user.get("email") for user in students}
    now = datetime.now(timezone.utc)
    result = []
    for record in records:
        live_fine = None
        if record["status"] in ("borrowed", "overdue") and record.get("due_date"):
            days_late = max(0, (now.date() - record["due_date"].date()).days)
            live_fine = round(days_late * get_settings().fine_per_day, 2) if days_late > 0 else 0.0
        result.append({
            **record,
            "book_title": book_names.get(record["book_id"]),
            "student_name": student_names.get(record["student_id"]),
            "student_email": student_emails.get(record["student_id"]),
            "live_fine": live_fine,
        })
    return result


async def mark_overdue_borrows(student_id: str | None = None, library_id: str | None = None) -> None:
    filters: dict = {"status": "borrowed", "due_date": {"$lt": datetime.now(timezone.utc)}}
    if student_id:
        filters["student_id"] = student_id
    if library_id:
        filters["library_id"] = library_id
    await get_database().borrows.update_many(filters, {"$set": {"status": "overdue"}})
