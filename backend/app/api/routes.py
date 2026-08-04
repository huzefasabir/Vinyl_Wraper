from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.storage.local import storage_service
from app.models.project import Project

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "storage": "local_disk"}

@router.post("/projects/upload")
async def upload_room_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    upload_result = await storage_service.save_file(file, subfolder="uploads/raw")
    
    new_project = Project(
        raw_image_url=upload_result["url"],
        status="UPLOADED",
        metadata_json={"original_filename": file.filename}
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    return {
        "project_id": str(new_project.id),
        "status": new_project.status,
        "image_url": new_project.raw_image_url,
        "message": "File uploaded successfully to local storage."
    }