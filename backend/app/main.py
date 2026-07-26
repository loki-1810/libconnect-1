from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.database.mongodb import close_mongo_connection, connect_to_mongo


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0", description="REST API for the LibConnect library management platform.", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type"])
app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    return {"status": "ok", "service": settings.app_name, "environment": settings.environment}


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, error: Exception):
    if settings.environment == "production":
        return JSONResponse(status_code=500, content={"detail": "An unexpected server error occurred"})
    return JSONResponse(status_code=500, content={"detail": str(error)})
