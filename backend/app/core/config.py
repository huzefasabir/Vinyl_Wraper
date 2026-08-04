from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Vinyl Wrapping System"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    
    BASE_URL: str = "http://localhost:8000"
    STORAGE_TYPE: str = "local"
    LOCAL_STORAGE_PATH: str = "storage_data"
    
    DATABASE_URL: str = "postgresql+asyncpg://vinyl_user:vinyl_pass@localhost:5432/vinyl_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()