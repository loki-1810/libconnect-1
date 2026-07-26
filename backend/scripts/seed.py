"""Seed a local or Atlas database with a usable LibConnect demo dataset.

Run from backend/: python -m scripts.seed
"""
import asyncio
from datetime import datetime, timezone

from app.core.security import hash_password
from app.database.mongodb import close_mongo_connection, connect_to_mongo, get_database


async def seed() -> None:
    await connect_to_mongo()
    db = get_database()
    now = datetime.now(timezone.utc)
    library = await db.libraries.find_one({"name": "Central Learning Library"})
    if not library:
        result = await db.libraries.insert_one({"name": "Central Learning Library", "address": "42 Knowledge Avenue", "city": "Bengaluru", "contact_email": "hello@centrallibrary.example", "contact_phone": "+91 80 5555 0101", "description": "A community library for lifelong learners.", "is_approved": True, "created_at": now, "updated_at": now})
        library_id = str(result.inserted_id)
    else:
        library_id = str(library["_id"])
    accounts = [("System Administrator", "admin@libconnect.com", "admin", None), ("Maya Librarian", "librarian@libconnect.com", "librarian", library_id), ("Aarav Student", "student@libconnect.com", "student", library_id)]
    for name, email, role, assigned_library in accounts:
        await db.users.update_one({"email": email}, {"$setOnInsert": {"name": name, "email": email, "password_hash": hash_password("LibConnect123!"), "role": role, "library_id": assigned_library, "phone": None, "avatar_url": None, "is_active": True, "created_at": now, "updated_at": now}}, upsert=True)
    books = [("9780132350884", "Clean Code", "Robert C. Martin", "Programming", "Prentice Hall", 2008), ("9780062315007", "The Alchemist", "Paulo Coelho", "Fiction", "HarperOne", 2014), ("9780262035613", "Introduction to Algorithms", "Thomas H. Cormen", "Computer Science", "MIT Press", 2009), ("9780140449136", "Meditations", "Marcus Aurelius", "Philosophy", "Penguin Classics", 2006)]
    for isbn, title, author, category, publisher, year in books:
        await db.books.update_one({"library_id": library_id, "isbn": isbn}, {"$setOnInsert": {"library_id": library_id, "isbn": isbn, "title": title, "author": author, "category": category, "publisher": publisher, "language": "English", "edition": None, "published_year": year, "shelf_number": f"A-{isbn[-3:]}", "description": f"{title} is available in the LibConnect sample catalogue.", "cover_image": None, "total_copies": 4, "available_copies": 4, "status": "available", "created_at": now, "updated_at": now}}, upsert=True)
    print("Seed complete. Demo password for all accounts: LibConnect123!")
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(seed())
