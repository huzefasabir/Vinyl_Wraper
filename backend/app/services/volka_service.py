import asyncio
import base64
import shutil
import uuid
import os
from pathlib import Path
from typing import Optional

from gradio_client import Client, handle_file

from app.core.config import settings

_client: Optional[Client] = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(settings.HF_SPACE_ID)
    return _client


def _run_predict(image_path: str, prompt: str, show_masks: bool, show_boxes: bool) -> tuple[str, str]:
    client = _get_client()
    result, description = client.predict(
        image_path=handle_file(image_path),
        prompt=prompt,
        show_masks=show_masks,
        show_boxes=show_boxes,
        crop_option="Crop",
        api_name="/detect_objects",
    )
    return result, description


async def analyze_image(
    image_bytes: bytes,
    filename: str,
    prompt: str,
    show_masks: bool = True,
    show_boxes: bool = True,
) -> dict:
    """
    1. Saves original bytes to a temp file
    2. Calls the HF Space in a thread pool
    3. Saves the returned mask/annotated image to storage_data/masks/
    4. Returns annotated_image_b64, description, mask_path (server-side abs path)
    """
    suffix = Path(filename).suffix.lower() or ".jpg"

    # ── temp file for the upload ──────────────────────────────────────────
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        loop = asyncio.get_event_loop()
        result_path, description = await loop.run_in_executor(
            None, _run_predict, tmp_path, prompt, show_masks, show_boxes
        )

        # ── persist the mask returned by HF Space ────────────────────────
        masks_dir = Path(settings.LOCAL_STORAGE_PATH) / "masks"
        masks_dir.mkdir(parents=True, exist_ok=True)

        src_ext = Path(result_path).suffix or ".png"
        mask_filename = f"{uuid.uuid4().hex}{src_ext}"
        mask_dest = masks_dir / mask_filename
        shutil.copy2(result_path, mask_dest)

        # ── encode for the frontend ───────────────────────────────────────
        with open(mask_dest, "rb") as f:
            annotated_bytes = f.read()

        annotated_b64 = base64.b64encode(annotated_bytes).decode("utf-8")

        return {
            "annotated_image_b64": annotated_b64,
            "description": description or "",
            "status": "ANALYZED",
            "mask_path": str(mask_dest),   # absolute path on the server
        }

    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
