from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Polymorphix"
    SUPABASE_URL: str
    SUPABASE_KEY: str  
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str
    
    DATABASE_URL: str
    
    REDIS_URL: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"

settings = Settings()