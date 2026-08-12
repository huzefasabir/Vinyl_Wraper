from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.storage.local import storage_service
from app.services.volka_service import analyze_image

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "storage": "local_disk"}

@router.post("/projects/upload")
async def upload_room_image(file: UploadFile = File(...)):
    try:
        upload_result = await storage_service.save_file(file, subfolder="uploads")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save failed: {str(e)}")

    return {
        "project_id": upload_result.get("filename", file.filename),
        "status": "UPLOADED",
        "image_url": upload_result["url"],
        "message": "File uploaded successfully to local storage.",
    }


@router.post("/projects/analyze")
async def analyze_room_image(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    show_masks: bool = Form(True),
    show_boxes: bool = Form(True),
):
    """
    Send the uploaded image to the HF Space (Volkopat/SegmentAnythingxGroundingDINO)
    and return the annotated image (base64) + description markdown.
    """
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {e}")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = await analyze_image(
            image_bytes=image_bytes,
            filename=file.filename or "image.jpg",
            prompt=prompt,
            show_masks=show_masks,
            show_boxes=show_boxes,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"HF Space analysis failed: {str(e)}")

    return result