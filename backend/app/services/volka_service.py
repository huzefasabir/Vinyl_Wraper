"""
volka_service.py
~~~~~~~~~~~~~~~~
Wraps the Hugging Face Space `Volkopat/SegmentAnythingxGroundingDINO`
via gradio_client.

API (discovered via client.view_api()):
  predict(image_path, prompt, show_masks=True, show_boxes=True,
          crop_option='None', api_name='/detect_objects')
  -> (result_filepath, description_markdown)
"""

import asyncio
import base64
import tempfile
import os
from pathlib import Path
from typing import Optional

from gradio_client import Client, handle_file

from app.core.config import settings

# Re-use a single client instance across requests (thread-safe for reads)
_client: Optional[Client] = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(settings.HF_SPACE_ID)
    return _client


def _run_predict(image_path: str, prompt: str, show_masks: bool, show_boxes: bool) -> tuple[str, str]:
    """
    Blocking call to the HF Space.
    Returns (annotated_image_filepath, description_markdown).
    """
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
    Async wrapper:
    1. Saves image bytes to a temp file
    2. Calls the HF Space in a thread pool (blocking I/O)
    3. Reads the returned annotated image, encodes it as base64
    4. Returns a dict with annotated_image_b64 and description

    Returns:
        {
            "annotated_image_b64": str,   # base64-encoded PNG/JPEG
            "description": str,           # markdown from the space
            "status": "ANALYZED"
        }
    """
    # Determine a safe suffix from the original filename
    suffix = Path(filename).suffix.lower() or ".jpg"

    # Write uploaded bytes to a named temp file that gradio_client can read
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        loop = asyncio.get_event_loop()
        result_path, description = await loop.run_in_executor(
            None, _run_predict, tmp_path, prompt, show_masks, show_boxes
        )

        # result_path is a local file path returned by gradio_client
        with open(result_path, "rb") as f:
            annotated_bytes = f.read()

        annotated_b64 = base64.b64encode(annotated_bytes).decode("utf-8")

        return {
            "annotated_image_b64": annotated_b64,
            "description": description or "",
            "status": "ANALYZED",
        }

    finally:
        # Clean up the temp input file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
