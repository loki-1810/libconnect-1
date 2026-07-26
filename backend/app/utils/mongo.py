from bson import ObjectId
from fastapi import HTTPException, status


def object_id(value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid {field_name}")
    return ObjectId(value)


def serialize_document(document: dict | None) -> dict | None:
    if document is None:
        return None
    result = dict(document)
    result["id"] = str(result.pop("_id"))
    return result
