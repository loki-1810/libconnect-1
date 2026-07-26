from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LibConnect API"
    environment: Literal["development", "test", "production"] = "development"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "libconnect"
    jwt_secret_key: str = "change-this-development-secret-before-deployment"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    frontend_origins: str = "http://localhost:5173"
    default_borrow_days: int = 14
    max_borrow_limit: int = 5
    fine_per_day: float = 1.0

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
