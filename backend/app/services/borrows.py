from datetime import datetime, timezone

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
    return [{**record, "book_title": book_names.get(record["book_id"]), "student_name": student_names.get(record["student_id"])} for record in records]


async def mark_overdue_borrows(student_id: str | None = None, library_id: str | None = None) -> None:
    filters: dict = {"status": "borrowed", "due_date": {"$lt": datetime.now(timezone.utc)}}
    if student_id:
        filters["student_id"] = student_id
    if library_id:
        filters["library_id"] = library_id
    await get_database().borrows.update_many(filters, {"$set": {"status": "overdue"}})
