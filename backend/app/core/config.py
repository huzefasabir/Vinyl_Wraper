from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


def _resolve_catalogue_path() -> str:
    """Find catalogue.json in backend dir or project root."""
    here = Path(__file__).resolve()
    candidates = [
        here.parent.parent.parent / "catalogue.json",
        here.parent.parent.parent.parent / "catalogue.json",
        Path("catalogue.json"),
    ]
    for path in candidates:
        if path.exists():
            return str(path)
    return str(candidates[1])


def _resolve_storage_path() -> str:
    """Find storage_data in cwd or project root."""
    here = Path(__file__).resolve()
    candidates = [
        here.parent.parent.parent.parent / "storage_data",
        here.parent.parent.parent / "storage_data",
        Path("storage_data"),
    ]
    for path in candidates:
        if path.exists():
            return str(path)
    return str(candidates[0])


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Vinyl Wrapping System"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    
    BASE_URL: str = "http://localhost:8000"
    STORAGE_TYPE: str = "local"
    LOCAL_STORAGE_PATH: str = _resolve_storage_path()
    CATALOGUE_PATH: str = _resolve_catalogue_path()
    
    DATABASE_URL: str = "postgresql+asyncpg://vinyl_user:vinyl_pass@localhost:5432/vinyl_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Hugging Face Space for Grounded SAM-2 + GroundingDINO analysis
    HF_SPACE_ID: str = "Volkopat/SegmentAnythingxGroundingDINO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()