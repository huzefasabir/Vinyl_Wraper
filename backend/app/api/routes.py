from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from app.storage.local import storage_service
from app.services.volka_service import analyze_image

import base64
import uuid
import cv2
import numpy as np
from pathlib import Path
from app.core.config import settings
from app.services.vinyl_render import apply_vinyl_wrap

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
    1. Saves original image to storage_data/uploads/
    2. Sends to HF Space for segmentation
    3. Saves returned mask to storage_data/masks/
    Returns annotated_image_b64, description, mask_path, original_path
    """
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {e}")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── Save original image to uploads/ ──────────────────────────────────
    uploads_dir = Path(settings.LOCAL_STORAGE_PATH) / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "image.jpg").suffix.lower() or ".jpg"
    orig_filename = f"{uuid.uuid4().hex}{suffix}"
    orig_path = uploads_dir / orig_filename
    orig_path.write_bytes(image_bytes)

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

    result["original_path"] = str(orig_path)
    return result


@router.post("/projects/wrap")
async def wrap_surface(
    original_path: str = Form(...),
    mask_path: str = Form(...),
    vinyl_image_path: str = Form(...),
):
    """
    Runs apply_vinyl_wrap:
      - original_path    : abs path to the saved original image
      - mask_path        : abs path to the HF mask saved by analyze step
      - vinyl_image_path : relative path from catalogue.json e.g. images/wood/long-wood/LW101.jpg
    """
    # ── Load original ─────────────────────────────────────────────────────
    orig_p = Path(original_path)
    if not orig_p.exists():
        raise HTTPException(status_code=404, detail=f"Original image not found: {original_path}")
    original_bgr = cv2.imread(str(orig_p))
    if original_bgr is None:
        raise HTTPException(status_code=422, detail="Could not decode original image.")

    # ── Load mask ─────────────────────────────────────────────────────────
    mask_p = Path(mask_path)
    if not mask_p.exists():
        raise HTTPException(status_code=404, detail=f"Mask image not found: {mask_path}")
    mask_bgr = cv2.imread(str(mask_p))
    if mask_bgr is None:
        raise HTTPException(status_code=422, detail="Could not decode mask image.")
    mask_gray = cv2.cvtColor(mask_bgr, cv2.COLOR_BGR2GRAY)

    # ── Load vinyl texture directly from disk ─────────────────────────────
    storage_root = Path(settings.LOCAL_STORAGE_PATH)
    vinyl_p = storage_root / vinyl_image_path
    if not vinyl_p.exists():
        # try alternate extensions
        stem = vinyl_p.with_suffix("")
        vinyl_p = next(
            (stem.with_suffix(e) for e in (".jpg", ".jpeg", ".png", ".webp") if stem.with_suffix(e).exists()),
            None,
        )
        if vinyl_p is None:
            raise HTTPException(status_code=404, detail=f"Vinyl image not found: {vinyl_image_path}")

    vinyl_bgr = cv2.imread(str(vinyl_p))
    if vinyl_bgr is None:
        raise HTTPException(status_code=422, detail="Could not decode vinyl texture image.")

    # ── Resize mask to match original if needed ───────────────────────────
    #if mask_gray.shape[:2] != original_bgr.shape[:2]:
     #   mask_gray = cv2.resize(
      #      mask_gray, (original_bgr.shape[1], original_bgr.shape[0]),
       #     interpolation=cv2.INTER_NEAREST,
        #)

    # ── Run renderer ──────────────────────────────────────────────────────
    try:
        rendered_bgr = apply_vinyl_wrap(
            original_img=original_bgr,
            mask_img=mask_gray,
            vinyl_img=vinyl_bgr,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Render failed: {str(e)}")

    # ── Save rendered output ──────────────────────────────────────────────
    renders_dir = Path(settings.LOCAL_STORAGE_PATH) / "renders"
    renders_dir.mkdir(parents=True, exist_ok=True)
    render_filename = f"{uuid.uuid4().hex}.png"
    render_path = renders_dir / render_filename
    cv2.imwrite(str(render_path), rendered_bgr)

    # ── Encode and return ─────────────────────────────────────────────────
    _, buf = cv2.imencode(".png", rendered_bgr)
    rendered_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

    return JSONResponse({
        "rendered_image_b64": rendered_b64,
        "render_path": str(render_path),
        "status": "RENDERED",
    })