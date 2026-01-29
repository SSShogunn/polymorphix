from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Polymorphix"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "pyamqp://guest:guest@rabbitmq:5672//"

    class Config:
        env_file = ".env"


settings = Settings()