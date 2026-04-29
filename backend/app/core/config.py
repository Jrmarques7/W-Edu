from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/wedu"
    REDIS_URL: str = "redis://localhost:6379/2"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    BEVOX_URL: str = "http://localhost:8001"
    WMATRIX_URL: str = "http://localhost:8000"

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3002"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
