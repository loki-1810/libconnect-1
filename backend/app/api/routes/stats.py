from fastapi import APIRouter

from app.database.mongodb import get_database

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("")
async def public_stats() -> dict:
    db = get_database()
    books = await db.books.count_documents({})
    users = await db.users.count_documents({"role": "student"})
    libraries = await db.libraries.count_documents({"is_approved": True})
    borrows = await db.borrows.count_documents({"status": {"$in": ["borrowed", "returned"]}})
    return {"total_books": books, "total_readers": users, "total_libraries": libraries, "total_borrows": borrows}
