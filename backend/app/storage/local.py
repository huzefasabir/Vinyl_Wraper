import os
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
import uuid

class LocalStorageService:
    def __init__(self, base_dir: str = "storage_data", base_url: str = "http://localhost:8000"):
        self.base_dir = Path(base_dir)
        self.base_url = base_url.rstrip("/")
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(self, file: UploadFile, subfolder: str) -> dict:
        target_dir = self.base_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        filename = file.filename
        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is missing."
            )

        ext = Path(filename).suffix.lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image format. Allowed formats: JPG, PNG, WEBP."
            )

        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = target_dir / unique_filename

        async with aiofiles.open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                await buffer.write(chunk)

        relative_path = f"static/{subfolder}/{unique_filename}"
        public_url = f"{self.base_url}/{relative_path}"

        return {
            "filename": unique_filename,
            "relative_path": relative_path,
            "absolute_path": str(file_path.absolute()),
            "url": public_url
        }

storage_service = LocalStorageService()