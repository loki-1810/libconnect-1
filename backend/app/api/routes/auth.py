from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.database.mongodb import get_database
from app.schemas.common import MessageResponse
from app.schemas.user import ForgotPasswordRequest, ResetPasswordRequest, TokenResponse, UserLogin, UserOut, UserRegister, UserUpdate
from app.utils.mongo import object_id, serialize_document

router = APIRouter(prefix="/auth", tags=["Authentication"])


def user_out(user: dict) -> UserOut:
    user.pop("password_hash", None)
    return UserOut.model_validate(serialize_document(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister) -> TokenResponse:
    db = get_database()
    if await db.users.find_one({"email": payload.email.lower()}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    if payload.library_id and not await db.libraries.find_one({"_id": object_id(payload.library_id, "library_id")}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library not found")
    now = datetime.now(timezone.utc)
    document = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "library_id": payload.library_id,
        "phone": None,
        "avatar_url": None,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    inserted = await db.users.insert_one(document)
    user = await db.users.find_one({"_id": inserted.inserted_id})
    safe_user = user_out(user)
    return TokenResponse(access_token=create_access_token(safe_user.id, safe_user.role), user=safe_user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin) -> TokenResponse:
    user = await get_database().users.find_one({"email": payload.email.lower()})
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated")
    safe_user = user_out(user)
    return TokenResponse(access_token=create_access_token(safe_user.id, safe_user.role), user=safe_user)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(payload: UserUpdate, current_user: dict = Depends(get_current_user)) -> UserOut:
    values = payload.model_dump(exclude_unset=True)
    if not values:
        return UserOut.model_validate(current_user)
    values["updated_at"] = datetime.now(timezone.utc)
    db = get_database()
    await db.users.update_one({"_id": object_id(current_user["id"])}, {"$set": values})
    user = await db.users.find_one({"_id": object_id(current_user["id"])})
    return user_out(user)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest) -> MessageResponse:
    """Generates a short-lived reset token. Connect an email provider in deployment to deliver it."""
    user = await get_database().users.find_one({"email": payload.email.lower()})
    if user:
        settings = get_settings()
        token = jwt.encode(
            {"sub": str(user["_id"]), "purpose": "password_reset", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
        await get_database().users.update_one({"_id": user["_id"]}, {"$set": {"password_reset_token": token, "password_reset_expires_at": datetime.now(timezone.utc) + timedelta(minutes=30)}})
    return MessageResponse(message="If an account exists for that email, password reset instructions have been sent.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest) -> MessageResponse:
    settings = get_settings()
    try:
        claims = jwt.decode(payload.token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if claims.get("purpose") != "password_reset":
            raise JWTError("Incorrect token purpose")
    except JWTError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token") from error
    db = get_database()
    result = await db.users.update_one(
        {"_id": object_id(claims["sub"]), "password_reset_token": payload.token},
        {"$set": {"password_hash": hash_password(payload.password), "updated_at": datetime.now(timezone.utc)}, "$unset": {"password_reset_token": "", "password_reset_expires_at": ""}},
    )
    if not result.modified_count:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or used reset token")
    return MessageResponse(message="Your password has been reset. You can now sign in.")
