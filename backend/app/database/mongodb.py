import re
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings


class InMemoryQuery:
    def __init__(self, collection: "InMemoryCollection", filter_: dict | None = None) -> None:
        self.collection = collection
        self.filter = filter_ or {}
        self.sort_field: str | None = None
        self.sort_direction = 1
        self.skip_count = 0
        self.limit_count: int | None = None

    def sort(self, field: str, direction: int = 1) -> "InMemoryQuery":
        self.sort_field = field
        self.sort_direction = direction
        return self

    def skip(self, count: int) -> "InMemoryQuery":
        self.skip_count = count
        return self

    def limit(self, count: int) -> "InMemoryQuery":
        self.limit_count = count
        return self

    async def to_list(self, length: int | None = None) -> list[dict]:
        items = [deepcopy(document) for document in self.collection._documents if self.collection._matches(document, self.filter)]
        if self.sort_field:
            items.sort(key=lambda item: item.get(self.sort_field) or "", reverse=self.sort_direction < 0)
        if self.skip_count:
            items = items[self.skip_count :]
        if self.limit_count is not None:
            items = items[: self.limit_count]
        elif length is not None:
            items = items[:length]
        return items


class InMemoryCollection:
    def __init__(self, name: str) -> None:
        self.name = name
        self._documents: list[dict] = []

    def _matches(self, document: dict, query: dict | None) -> bool:
        if not query:
            return True
        for key, expected in query.items():
            if key == "$or":
                if not any(self._matches(document, clause) for clause in expected):
                    return False
                continue
            if key == "$and":
                if not all(self._matches(document, clause) for clause in expected):
                    return False
                continue
            value = document.get(key)
            if isinstance(expected, dict):
                for operator, operator_value in expected.items():
                    if operator == "$in" and value not in operator_value:
                        return False
                    elif operator == "$gt" and not (value is not None and value > operator_value):
                        return False
                    elif operator == "$gte" and not (value is not None and value >= operator_value):
                        return False
                    elif operator == "$lt" and not (value is not None and value < operator_value):
                        return False
                    elif operator == "$lte" and not (value is not None and value <= operator_value):
                        return False
                    elif operator == "$ne" and value == operator_value:
                        return False
                    elif operator == "$regex" and not re.search(operator_value, str(value or ""), re.I):
                        return False
            elif value != expected:
                return False
        return True

    def find(self, filter_: dict | None = None) -> InMemoryQuery:
        return InMemoryQuery(self, filter_)

    async def find_one(self, filter_: dict | None = None) -> dict | None:
        for document in self._documents:
            if self._matches(document, filter_):
                return deepcopy(document)
        return None

    async def count_documents(self, filter_: dict | None = None) -> int:
        return sum(1 for document in self._documents if self._matches(document, filter_))

    async def insert_one(self, document: dict) -> Any:
        document = deepcopy(document)
        document.setdefault("_id", str(uuid.uuid4()))
        self._documents.append(document)
        return type("InsertResult", (), {"inserted_id": document["_id"]})()

    async def update_one(self, filter_: dict | None, update: dict) -> Any:
        for index, document in enumerate(self._documents):
            if self._matches(document, filter_):
                if "$set" in update:
                    for key, value in update["$set"].items():
                        document[key] = value
                if "$unset" in update:
                    for key in update["$unset"]:
                        document.pop(key, None)
                if "$inc" in update:
                    for key, value in update["$inc"].items():
                        document[key] = document.get(key, 0) + value
                self._documents[index] = document
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()
        return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

    async def update_many(self, filter_: dict | None, update: dict) -> Any:
        updated = 0
        for index, document in enumerate(self._documents):
            if self._matches(document, filter_):
                if "$set" in update:
                    for key, value in update["$set"].items():
                        document[key] = value
                if "$unset" in update:
                    for key in update["$unset"]:
                        document.pop(key, None)
                if "$inc" in update:
                    for key, value in update["$inc"].items():
                        document[key] = document.get(key, 0) + value
                self._documents[index] = document
                updated += 1
        return type("UpdateResult", (), {"matched_count": updated, "modified_count": updated})()

    async def delete_one(self, filter_: dict | None) -> Any:
        for index, document in enumerate(self._documents):
            if self._matches(document, filter_):
                self._documents.pop(index)
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    async def distinct(self, field: str) -> list[Any]:
        return sorted({document.get(field) for document in self._documents if document.get(field) is not None})

    async def find_one_and_update(self, filter_: dict | None, update: dict, return_document: str = "after") -> dict | None:
        for index, document in enumerate(self._documents):
            if self._matches(document, filter_):
                original = deepcopy(document)
                if "$set" in update:
                    for key, value in update["$set"].items():
                        document[key] = value
                if "$unset" in update:
                    for key in update["$unset"]:
                        document.pop(key, None)
                if "$inc" in update:
                    for key, value in update["$inc"].items():
                        document[key] = document.get(key, 0) + value
                self._documents[index] = document
                return deepcopy(document) if return_document == "after" else original
        return None

    async def create_index(self, *args: Any, **kwargs: Any) -> None:
        return None

    async def aggregate(self, pipeline: list[dict]) -> list[dict]:
        docs = [deepcopy(document) for document in self._documents]
        for stage in pipeline:
            if "$match" in stage:
                docs = [document for document in docs if self._matches(document, stage["$match"])]
            elif "$group" in stage:
                grouped: list[dict] = []
                for document in docs:
                    key = None
                    group_spec = stage["$group"]
                    if "$id" in group_spec:
                        key = group_spec["$id"]
                    elif " _id" in group_spec:
                        key = group_spec[" _id"]
                    if isinstance(key, str) and key.startswith("$"):
                        key_value = document.get(key[1:])
                    else:
                        key_value = key
                    existing = next((item for item in grouped if item.get("_id") == key_value), None)
                    if existing is None:
                        existing = {"_id": key_value}
                        grouped.append(existing)
                    for field, expression in group_spec.items():
                        if field == "_id":
                            continue
                        if isinstance(expression, dict) and "$sum" in expression:
                            existing[field] = existing.get(field, 0) + expression["$sum"]
                docs = grouped
            elif "$sort" in stage:
                sort_fields = stage["$sort"]
                docs.sort(key=lambda item: item.get(next(iter(sort_fields.keys())), ""), reverse=sort_fields.get(next(iter(sort_fields.keys())), 1) < 0)
            elif "$limit" in stage:
                docs = docs[: stage["$limit"]]
        return docs


class InMemoryDatabase:
    def __init__(self) -> None:
        self.users = InMemoryCollection("users")
        self.libraries = InMemoryCollection("libraries")
        self.books = InMemoryCollection("books")
        self.borrows = InMemoryCollection("borrows")
        self.reservations = InMemoryCollection("reservations")
        self.notifications = InMemoryCollection("notifications")


class InMemoryClient:
    def __init__(self) -> None:
        self._database = InMemoryDatabase()
        self.admin = type("AdminProxy", (), {"command": staticmethod(lambda *_args, **_kwargs: None)})()

    def __getitem__(self, name: str) -> InMemoryDatabase:
        return self._database

    def close(self) -> None:
        return None


client: AsyncIOMotorClient | InMemoryClient | None = None


async def _seed_demo_data() -> None:
    db = get_database()
    if await db.users.count_documents({}) > 0:
        return
    now = datetime.now(timezone.utc)
    library = {
        "_id": "library-001",
        "name": "Central Learning Library",
        "address": "42 Knowledge Avenue",
        "city": "Bengaluru",
        "contact_email": "hello@centrallibrary.example",
        "contact_phone": "+91 80 5555 0101",
        "description": "A community library for lifelong learners.",
        "is_approved": True,
        "created_at": now,
        "updated_at": now,
    }
    await db.libraries.insert_one(library)
    await db.users.insert_one({"_id": "user-admin", "name": "System Administrator", "email": "admin@libconnect.com", "password_hash": "$2b$12$6d9s8VQwTg1x8m7s5yH5P.r4/6kJ87nTxKeVhT6uX9n3P6g2p6o2", "role": "admin", "library_id": None, "phone": None, "avatar_url": None, "is_active": True, "created_at": now, "updated_at": now})
    await db.users.insert_one({"_id": "user-librarian", "name": "Maya Librarian", "email": "librarian@libconnect.com", "password_hash": "$2b$12$6d9s8VQwTg1x8m7s5yH5P.r4/6kJ87nTxKeVhT6uX9n3P6g2p6o2", "role": "librarian", "library_id": "library-001", "phone": None, "avatar_url": None, "is_active": True, "created_at": now, "updated_at": now})
    await db.users.insert_one({"_id": "user-student", "name": "Aarav Student", "email": "student@libconnect.com", "password_hash": "$2b$12$6d9s8VQwTg1x8m7s5yH5P.r4/6kJ87nTxKeVhT6uX9n3P6g2p6o2", "role": "student", "library_id": "library-001", "phone": None, "avatar_url": None, "is_active": True, "created_at": now, "updated_at": now})
    await db.books.insert_one({"_id": "book-001", "library_id": "library-001", "isbn": "9780132350884", "title": "Clean Code", "author": "Robert C. Martin", "category": "Programming", "publisher": "Prentice Hall", "language": "English", "edition": None, "published_year": 2008, "shelf_number": "A-884", "description": "Clean Code is available in the sample catalogue.", "cover_image": None, "total_copies": 4, "available_copies": 4, "status": "available", "created_at": now, "updated_at": now})
    await db.books.insert_one({"_id": "book-002", "library_id": "library-001", "isbn": "9780062315007", "title": "The Alchemist", "author": "Paulo Coelho", "category": "Fiction", "publisher": "HarperOne", "language": "English", "edition": None, "published_year": 2014, "shelf_number": "A-007", "description": "The Alchemist is available in the sample catalogue.", "cover_image": None, "total_copies": 3, "available_copies": 3, "status": "available", "created_at": now, "updated_at": now})


async def connect_to_mongo() -> None:
    global client
    settings = get_settings()
    try:
        client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        db = get_database()
        await db.users.create_index("email", unique=True)
        await db.books.create_index([("title", "text"), ("author", "text"), ("isbn", "text"), ("category", "text")])
        await db.books.create_index([("library_id", 1), ("title", 1)])
        await db.borrows.create_index([("student_id", 1), ("status", 1)])
        await db.reservations.create_index([("book_id", 1), ("status", 1), ("created_at", 1)])
        await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    except Exception:
        client = InMemoryClient()
        await _seed_demo_data()


async def close_mongo_connection() -> None:
    if client is not None and hasattr(client, "close"):
        client.close()


def get_database() -> AsyncIOMotorDatabase | InMemoryDatabase:
    if client is None:
        raise RuntimeError("Database is not connected")
    return client[get_settings().mongodb_db]
