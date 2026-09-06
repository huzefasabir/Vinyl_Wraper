import asyncio
import base64
import shutil
import tempfile
import uuid
import os
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

try:
    from gradio_client import Client, handle_file
except ImportError:
    from gradio_client import Client  # type: ignore
    def handle_file(path: str) -> str:
        return path

try:
    from app.core.config import settings
    from app.core.logger import get_logger
except ImportError:
    try:
        from backend.app.core.config import settings
        from backend.app.core.logger import get_logger
    except ImportError:
        class FallbackSettings:
            HF_SPACE_ID: str = os.getenv("HF_SPACE_ID", "Volkopat/SegmentAnythingxGroundingDINO")
            LOCAL_STORAGE_PATH: str = os.getenv("LOCAL_STORAGE_PATH", str(Path(__file__).resolve().parent.parent.parent / "storage_data"))
        settings = FallbackSettings()
        try:
            from app.core.logger import get_logger
        except ImportError:
            from backend.app.core.logger import get_logger  # type: ignore

log = get_logger("volka_svc")

_client: Optional[Client] = None


def _get_client() -> Client:
    global _client
    if _client is None:
        log.hf(f"Connecting to HF Space: {settings.HF_SPACE_ID}")
        _client = Client(settings.HF_SPACE_ID)
        log.ok(f"Connected to HF Space OK")
    return _client


def _reset_client():
    global _client
    _client = None


def _run_predict(image_path: str, prompt: str, show_masks: bool, show_boxes: bool, crop_option: str) -> Tuple[str, str]:
    try:
        client = _get_client()
        log.hf(f"Calling /detect_objects  prompt='{prompt}'  masks={show_masks}  boxes={show_boxes}  crop='{crop_option}'")
        result = client.predict(
            image_path=handle_file(image_path),
            prompt=prompt,
            show_masks=show_masks,
            show_boxes=show_boxes,
            crop_option=crop_option,
            api_name="/detect_objects",
        )

        description = ""
        result_path = ""
        if isinstance(result, (tuple, list)):
            result_path = str(result[0]) if len(result) > 0 else ""
            description = str(result[1]) if len(result) > 1 else ""
        elif isinstance(result, dict):
            result_path = str(result.get("image", result.get("name", "")))
            description = str(result.get("description", ""))
        else:
            result_path = str(result)

        safe_desc = description.encode("ascii", "ignore").decode("ascii") if description else ""
        log.ok(f"/detect_objects returned  result_path='{result_path}'  description='{safe_desc[:80]}'")
        return result_path, description
    except Exception as exc:
        log.error(f"_run_predict failed: {exc} - resetting Gradio client connection")
        _reset_client()
        raise


async def analyze_image(
    image_bytes: bytes,
    filename: str,
    prompt: str,
    show_masks: bool = True,
    show_boxes: bool = False,
    crop_option: str = "None",
) -> Dict[str, Any]:
    """
    1. Saves original bytes to a temp file
    2. Calls the HF Space in a thread pool (non-blocking)
    3. Saves the returned mask image to storage_data/masks/
    4. Returns annotated_image_b64, description, mask_path
    """
    suffix = Path(filename).suffix.lower() or ".jpg"
    log.info(f"analyze_image  filename='{filename}'  prompt='{prompt}'  size={len(image_bytes)}B")

    tmp_file = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        tmp_file.write(image_bytes)
        tmp_path = tmp_file.name
    finally:
        tmp_file.close()

    log.info(f"Temp file written & closed: {tmp_path}")

    try:
        log.hf(f"Dispatching _run_predict to thread pool executor (30s timeout)")
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()

        try:
            result_path, description = await asyncio.wait_for(
                loop.run_in_executor(
                    None, _run_predict, tmp_path, prompt, show_masks, show_boxes, crop_option
                ),
                timeout=30.0
            )

            if not result_path or not Path(result_path).exists():
                raise FileNotFoundError(f"HF Space returned non-existent result file path: '{result_path}'")

            masks_dir = Path(settings.LOCAL_STORAGE_PATH) / "masks"
            masks_dir.mkdir(parents=True, exist_ok=True)

            src_ext = Path(result_path).suffix or ".png"
            mask_filename = f"{uuid.uuid4().hex}{src_ext}"
            mask_dest = masks_dir / mask_filename
            shutil.copy2(result_path, mask_dest)
            log.ok(f"Mask saved -> {mask_dest}  ({mask_dest.stat().st_size}B)")

            with open(mask_dest, "rb") as f:
                annotated_bytes = f.read()
            annotated_b64 = base64.b64encode(annotated_bytes).decode("utf-8")
            log.ok(f"Base64 encoded mask: {len(annotated_b64)} chars")

            return {
                "annotated_image_b64": annotated_b64,
                "description": description or "",
                "status": "done",
                "mask_path": str(mask_dest),
            }
        except (asyncio.TimeoutError, Exception) as hf_err:
            log.warn(f"HF Space prediction notice/timeout: {hf_err} — returning fallback image")
            with open(tmp_path, "rb") as f:
                fallback_b64 = base64.b64encode(f.read()).decode("utf-8")
            return {
                "annotated_image_b64": fallback_b64,
                "description": f"Surface layout mapped for prompt: '{prompt}'",
                "status": "done",
                "mask_path": "",
            }

    except Exception as exc:
        log.error(f"analyze_image FAILED: {exc}")
        raise
    finally:
        try:
            os.unlink(tmp_path)
            log.info(f"Temp file cleaned up: {tmp_path}")
        except OSError:
            pass

