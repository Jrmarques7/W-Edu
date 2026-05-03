from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/wedu"
    REDIS_URL: str = "redis://localhost:6379/2"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    BEVOX_URL: str = "http://localhost:8001"
    BEVOX_PUBLIC_URL: str | None = None
    WMATRIX_URL: str = "http://localhost:8000"
    WOMNI_URL: str | None = None
    WOMNI_API_TOKEN: str | None = None
    NOTIFICATION_DISPATCH_TIMEOUT_SECONDS: float = 10.0
    NOTIFICATION_WORKER_ENABLED: bool = True
    NOTIFICATION_WORKER_INTERVAL_SECONDS: int = 60
    NOTIFICATION_WORKER_BATCH_SIZE: int = 100
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_USE_TLS: bool = True
    DOCUMENTS_STORAGE_DIR: str = str(Path(__file__).resolve().parents[2] / "storage" / "documents")
    VIDEOS_STORAGE_DIR: str = str(Path(__file__).resolve().parents[2] / "storage" / "videos")

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3002"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
