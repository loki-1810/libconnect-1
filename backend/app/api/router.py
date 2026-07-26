from fastapi import APIRouter

from app.api.routes import auth, books, borrows, dashboard, libraries, notifications, reservations, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(libraries.router)
api_router.include_router(books.router)
api_router.include_router(borrows.router)
api_router.include_router(reservations.router)
api_router.include_router(notifications.router)
api_router.include_router(users.router)
api_router.include_router(dashboard.router)
