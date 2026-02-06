from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Polymorphix"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "pyamqp://guest:guest@rabbitmq:5672//"

    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY: str
    R2_SECRET_KEY: str
    R2_BUCKET_NAME: str
    R2_PUBLIC_URL: str  # e.g., https://pub-abc123.r2.dev

    class Config:
        env_file = ".env"


settings = Settings()
