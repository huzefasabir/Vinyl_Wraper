import os
from pathlib import Path

class Settings:
    HF_SPACE_ID: str = os.getenv("HF_SPACE_ID", "Volkopat/SegmentAnythingxGroundingDINO")
    LOCAL_STORAGE_PATH: str = os.getenv("LOCAL_STORAGE_PATH", str(Path(__file__).resolve().parent.parent.parent.parent / "storage_data"))

settings = Settings()
