# Approach 1 — Classical CV Rendering Pipeline
### Full implementation, step by step

This is the complete, runnable code for every step of Approach 1, organized exactly as laid out in `app/ai/rendering/`. Every function is pure — arrays and dataclasses in, arrays out — with no FastAPI, database, or Redis imports anywhere in this layer, per the project's architecture rules.

```
app/ai/rendering/
    __init__.py
    schemas.py
    mask_utils.py
    texture_utils.py
    lighting.py
    compositor.py
    approach1_classical_cv.py
```

---

## 0. `schemas.py` — shared data contracts

Defines the typed objects every other module passes around, so nothing downstream has to guess field names or shapes.

```python
"""
app/ai/rendering/schemas.py

Typed data contracts shared across the rendering pipeline.
Kept dependency-free (dataclasses only) so this module can be
imported by any layer without pulling in Pydantic/FastAPI.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import numpy as np


@dataclass(frozen=True)
class Quad:
    """Four corner points of a fitted planar surface, in image pixel coords.

    Order is fixed: top-left, top-right, bottom-right, bottom-left.
    This ordering must be respected everywhere a Quad is consumed,
    since it is matched 1:1 against the texture's own corner order.
    """
    top_left: tuple[float, float]
    top_right: tuple[float, float]
    bottom_right: tuple[float, float]
    bottom_left: tuple[float, float]

    def as_array(self) -> np.ndarray:
        return np.array(
            [self.top_left, self.top_right, self.bottom_right, self.bottom_left],
            dtype=np.float32,
        )


@dataclass
class InstanceMask:
    """A single detected surface instance (e.g. one cabinet door)."""
    instance_id: int
    binary_mask: np.ndarray        # uint8, shape (H, W), values {0, 255}
    label: str = ""                # e.g. "cabinet_door" from Grounded-SAM
    quad: Quad | None = None       # populated by fit_quad()


@dataclass
class RenderParams:
    """Mirrors the `render_params` JSON stored per vinyl_products row."""
    grain_direction: str = "none"
    repeat_seamless: bool = True
    scale_factor: float = 1.0
    roughness: float = 0.5
    reflectivity: float = 0.15
    bump_intensity: float = 3.0


@dataclass
class VinylCatalogueEntry:
    """Everything the renderer needs about the selected vinyl SKU."""
    code: str
    diffuse_map: np.ndarray        # BGR, uint8 — loaded from diffuse_map_path
    bump_map: np.ndarray | None    # single-channel uint8 — loaded from bump_map_path
    normal_map: np.ndarray | None  # reserved for Approach 2, unused here
    base_color_hex: str
    render_params: RenderParams = field(default_factory=RenderParams)


@dataclass
class RenderResult:
    """Output of rendering a single instance."""
    instance_id: int
    final_bgr: np.ndarray           # full-frame image with this instance wrapped
    warped_diffuse_debug: np.ndarray | None = None   # optional QA intermediate
    relit_debug: np.ndarray | None = None             # optional QA intermediate
```

---

## Step 1 — `mask_utils.py`: instance extraction + quad fitting

Turns the raw, possibly-noisy SAM2 mask output into (a) clean per-instance binary masks and (b) a geometrically clean quad per instance, used for the perspective warp. This is the convex-hull fix that resolved the earlier torn/striped output.

```python
"""
app/ai/rendering/mask_utils.py

Step 1 of the classical CV pipeline:
- Split a flat/multi-colour mask into separate per-surface instances.
- Fit a clean 4-point quad to each instance's convex hull, used later
  for the perspective warp (NOT the raw noisy contour).
"""

from __future__ import annotations

import cv2
import numpy as np

from app.ai.rendering.schemas import InstanceMask, Quad

MIN_INSTANCE_AREA_PX = 400  # discard specks/noise smaller than this


def extract_instances(mask_input: np.ndarray) -> list[InstanceMask]:
    """Split a mask into per-instance binary masks.

    Accepts either:
    - a flat binary mask (H, W) with a single surface, or
    - a multi-colour instance mask (H, W, 3) or (H, W, 4) where each
      detected surface has a distinct flat colour (SAM2/Grounded-SAM
      output format), transparent/black background.

    Returns one InstanceMask per connected region above the area
    threshold, largest first.
    """
    if mask_input.ndim == 2:
        binary = (mask_input > 0).astype(np.uint8) * 255
        return _connected_components_to_instances(binary)

    # Multi-colour mask: separate by unique colour, then split each
    # colour's region into connected components (two same-coloured but
    # spatially separate surfaces should still become two instances).
    if mask_input.shape[2] == 4:
        rgb = mask_input[:, :, :3]
        alpha = mask_input[:, :, 3]
        rgb = np.where(alpha[..., None] > 0, rgb, 0)
    else:
        rgb = mask_input

    flat = rgb.reshape(-1, 3)
    non_black = flat[np.any(flat > 0, axis=1)]
    if non_black.size == 0:
        return []

    unique_colours = np.unique(non_black, axis=0)

    instances: list[InstanceMask] = []
    for colour in unique_colours:
        colour_mask = np.all(rgb == colour, axis=-1).astype(np.uint8) * 255
        instances.extend(_connected_components_to_instances(colour_mask))

    return deduplicate_instances(instances)


def _connected_components_to_instances(binary_mask: np.ndarray) -> list[InstanceMask]:
    """Run connectedComponentsWithStats on a single binary mask and
    return one InstanceMask per component above the area threshold.
    """
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        binary_mask, connectivity=8
    )

    instances: list[InstanceMask] = []
    for label_id in range(1, num_labels):  # skip 0 = background
        area = stats[label_id, cv2.CC_STAT_AREA]
        if area < MIN_INSTANCE_AREA_PX:
            continue
        component_mask = np.where(labels == label_id, 255, 0).astype(np.uint8)
        instances.append(InstanceMask(instance_id=label_id, binary_mask=component_mask))

    instances.sort(
        key=lambda inst: int(np.count_nonzero(inst.binary_mask)), reverse=True
    )
    # Re-number sequentially after sorting so IDs are stable and dense.
    for new_id, inst in enumerate(instances):
        inst.instance_id = new_id
    return instances


def deduplicate_instances(
    instances: list[InstanceMask], iou_threshold: float = 0.85
) -> list[InstanceMask]:
    """Drop near-duplicate instances (overlapping detections of the
    same physical surface, e.g. from two overlapping SAM2 proposals).

    Keeps the larger mask of any pair whose IoU exceeds the threshold.
    """
    kept: list[InstanceMask] = []
    for candidate in sorted(
        instances, key=lambda i: int(np.count_nonzero(i.binary_mask)), reverse=True
    ):
        is_duplicate = False
        for existing in kept:
            if _iou(candidate.binary_mask, existing.binary_mask) > iou_threshold:
                is_duplicate = True
                break
        if not is_duplicate:
            kept.append(candidate)

    for new_id, inst in enumerate(kept):
        inst.instance_id = new_id
    return kept


def _iou(mask_a: np.ndarray, mask_b: np.ndarray) -> float:
    intersection = np.count_nonzero((mask_a > 0) & (mask_b > 0))
    union = np.count_nonzero((mask_a > 0) | (mask_b > 0))
    return intersection / union if union else 0.0


def fit_quad(binary_mask: np.ndarray) -> Quad | None:
    """Fit a clean 4-point quadrilateral to a binary mask's convex hull.

    This deliberately does NOT use the raw contour — SAM2 edges are
    pixel-noisy, and warping a texture into a wiggly outline produces
    torn/striped output. The convex hull + min-area quad gives a clean
    geometric target for the perspective warp; the original mask is
    still used later, untouched, as the final alpha cutout.

    Returns None if no usable contour is found.
    """
    contours, _ = cv2.findContours(
        binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        return None

    largest_contour = max(contours, key=cv2.contourArea)
    hull = cv2.convexHull(largest_contour)

    rect = cv2.minAreaRect(hull)
    box_points = cv2.boxPoints(rect)  # 4 x 2, unordered

    ordered = _order_quad_points(box_points)
    return Quad(
        top_left=tuple(ordered[0]),
        top_right=tuple(ordered[1]),
        bottom_right=tuple(ordered[2]),
        bottom_left=tuple(ordered[3]),
    )


def _order_quad_points(points: np.ndarray) -> np.ndarray:
    """Order 4 unordered points as top-left, top-right, bottom-right,
    bottom-left, using the standard sum/diff trick.
    """
    ordered = np.zeros((4, 2), dtype=np.float32)
    s = points.sum(axis=1)
    diff = np.diff(points, axis=1).flatten()

    ordered[0] = points[np.argmin(s)]        # top-left: smallest x+y
    ordered[2] = points[np.argmax(s)]        # bottom-right: largest x+y
    ordered[1] = points[np.argmin(diff)]     # top-right: smallest y-x
    ordered[3] = points[np.argmax(diff)]     # bottom-left: largest y-x
    return ordered
```

---

## Step 2 — `texture_utils.py`: tiling + perspective warp

Prepares the catalogue diffuse map at the correct scale/repeat, then warps it to match the quad found in Step 1.

```python
"""
app/ai/rendering/texture_utils.py

Step 2 of the classical CV pipeline:
- Tile the catalogue diffuse map according to render_params
  (scale_factor, repeat_seamless).
- Perspective-warp the tiled texture onto the fitted quad.
"""

from __future__ import annotations

import cv2
import numpy as np

from app.ai.rendering.schemas import Quad, RenderParams

BASE_TILE_PX = 512  # reference tile size at scale_factor == 1.0


def tile_texture(
    diffuse_map: np.ndarray,
    render_params: RenderParams,
    canvas_size: tuple[int, int],
) -> np.ndarray:
    """Produce a texture canvas of `canvas_size` (W, H), tiled from the
    catalogue diffuse map according to render_params.

    If repeat_seamless is False, the texture is instead stretched once
    to fill the canvas (used for large single-panel prints that aren't
    meant to repeat, e.g. a full-slab stone pattern).
    """
    canvas_w, canvas_h = canvas_size

    if not render_params.repeat_seamless:
        return cv2.resize(diffuse_map, (canvas_w, canvas_h), interpolation=cv2.INTER_LINEAR)

    tile_px = max(8, int(BASE_TILE_PX * render_params.scale_factor))
    tile = cv2.resize(diffuse_map, (tile_px, tile_px), interpolation=cv2.INTER_AREA)

    reps_x = int(np.ceil(canvas_w / tile_px)) + 1
    reps_y = int(np.ceil(canvas_h / tile_px)) + 1
    tiled = np.tile(tile, (reps_y, reps_x, 1))

    return tiled[:canvas_h, :canvas_w]


def warp_to_quad(
    tiled_texture: np.ndarray,
    quad: Quad,
    output_shape: tuple[int, int],
) -> np.ndarray:
    """Perspective-warp a flat tiled texture onto `quad`'s position and
    angle within a frame of `output_shape` (H, W).

    The full output frame is returned (same size as the original photo),
    with the warped texture placed correctly and everything outside the
    quad left black — the caller composites using the instance's alpha
    mask, not this function's implicit background.
    """
    out_h, out_w = output_shape
    tex_h, tex_w = tiled_texture.shape[:2]

    src_points = np.array(
        [[0, 0], [tex_w - 1, 0], [tex_w - 1, tex_h - 1], [0, tex_h - 1]],
        dtype=np.float32,
    )
    dst_points = quad.as_array()

    transform_matrix = cv2.getPerspectiveTransform(src_points, dst_points)
    warped = cv2.warpPerspective(
        tiled_texture,
        transform_matrix,
        (out_w, out_h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0),
    )
    return warped
```

---

## Step 3 & 4 — `lighting.py`: LAB lighting transfer + bump micro-shading

The accuracy-critical step. Colour comes only from the catalogue texture (A/B channels); brightness comes only from the real photo (L channel). Bump shading adds grain-level relief on top.

```python
"""
app/ai/rendering/lighting.py

Steps 3 and 4 of the classical CV pipeline:
- transfer_lighting: recombine LAB channels so colour comes only from
  the catalogue diffuse map and brightness comes only from the real
  photo. This is what keeps colour accurate to the SKU while still
  looking physically lit.
- apply_bump_shading: cheap Sobel-based directional shading from the
  catalogue's bump map, for grain-level micro-relief.
"""

from __future__ import annotations

import cv2
import numpy as np

# Fixed light direction for the bump pass (top-left), matching typical
# overhead/window lighting in interior photos. Replaced by a real
# estimated direction in Approach 2 (Depth Anything V2 normals).
_LIGHT_DIRECTION = np.array([-0.6, -0.6, 0.53], dtype=np.float32)
_LIGHT_DIRECTION /= np.linalg.norm(_LIGHT_DIRECTION)


def transfer_lighting(
    original_bgr: np.ndarray,
    warped_diffuse_bgr: np.ndarray,
    region_mask: np.ndarray,
) -> np.ndarray:
    """Recombine LAB channels: L from the original photo, A/B from the
    warped catalogue texture. Only pixels inside `region_mask` are
    touched; everything else is returned unchanged from original_bgr.

    region_mask: uint8, values {0, 255}, same shape as original_bgr[:, :, 0].
    """
    original_lab = cv2.cvtColor(original_bgr, cv2.COLOR_BGR2LAB)
    texture_lab = cv2.cvtColor(warped_diffuse_bgr, cv2.COLOR_BGR2LAB)

    original_l, _, _ = cv2.split(original_lab)
    _, texture_a, texture_b = cv2.split(texture_lab)

    relit_lab = cv2.merge([original_l, texture_a, texture_b])
    relit_bgr = cv2.cvtColor(relit_lab, cv2.COLOR_LAB2BGR)

    mask_bool = region_mask.astype(bool)
    result = original_bgr.copy()
    result[mask_bool] = relit_bgr[mask_bool]
    return result


def apply_bump_shading(
    relit_bgr: np.ndarray,
    bump_map: np.ndarray | None,
    region_mask: np.ndarray,
    quad_warp_matrix: np.ndarray,
    output_shape: tuple[int, int],
    bump_intensity: float,
) -> np.ndarray:
    """Add subtle directional micro-shading from the catalogue bump map.
    If bump_map is None, returns relit_bgr unchanged (bump shading is
    an enhancement, not a required step).
    """
    if bump_map is None:
        return relit_bgr

    out_h, out_w = output_shape

    # Tile the bump map to the same canvas size the diffuse texture was
    # tiled to, then warp it through the same transform so grain
    # direction lines up exactly with the diffuse texture.
    bump_tiled = _tile_grayscale_to_canvas(bump_map, quad_warp_matrix, output_shape)
    warped_bump = cv2.warpPerspective(
        bump_tiled,
        quad_warp_matrix,
        (out_w, out_h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=0,
    )

    height_map = warped_bump.astype(np.float32) / 255.0
    grad_x = cv2.Sobel(height_map, cv2.CV_32F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(height_map, cv2.CV_32F, 0, 1, ksize=3)

    # Build per-pixel surface normals from the gradients.
    normal_z = np.ones_like(grad_x)
    normal = np.stack([-grad_x, -grad_y, normal_z], axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True) + 1e-6

    shading = np.clip(normal @ _LIGHT_DIRECTION, 0.0, 1.0)
    shading = 1.0 + bump_intensity * 0.05 * (shading - 0.5)  # subtle multiplier around 1.0
    shading = np.clip(shading, 0.7, 1.3)

    mask_bool = region_mask.astype(bool)
    shaded = relit_bgr.astype(np.float32)
    shaded[mask_bool] *= shading[mask_bool, None]
    return np.clip(shaded, 0, 255).astype(np.uint8)


def _tile_grayscale_to_canvas(
    bump_map: np.ndarray, warp_matrix: np.ndarray, output_shape: tuple[int, int]
) -> np.ndarray:
    """Tile a single-channel bump map to roughly cover the pre-warp
    texture canvas size implied by output_shape. Kept simple: reuses
    the same base tile size as tile_texture() for visual consistency.
    """
    from app.ai.rendering.texture_utils import BASE_TILE_PX

    out_h, out_w = output_shape
    tile = cv2.resize(bump_map, (BASE_TILE_PX, BASE_TILE_PX), interpolation=cv2.INTER_AREA)
    reps_x = int(np.ceil(out_w / BASE_TILE_PX)) + 1
    reps_y = int(np.ceil(out_h / BASE_TILE_PX)) + 1
    tiled = np.tile(tile, (reps_y, reps_x))
    return tiled[:out_h, :out_w]
```

---

## Step 5 & 6 — `compositor.py`: feathering + final blend

```python
"""
app/ai/rendering/compositor.py

Steps 5 and 6 of the classical CV pipeline:
- feather_alpha: soften the mask edge so the composite doesn't show a
  hard cutout line.
- composite: alpha-blend the shaded texture back into the original photo.
"""

from __future__ import annotations

import cv2
import numpy as np

FEATHER_KERNEL_SIZE = (11, 11)  # tuned empirically, do not shrink below ~7x7


def feather_alpha(binary_mask: np.ndarray, kernel_size: tuple[int, int] = FEATHER_KERNEL_SIZE) -> np.ndarray:
    """Gaussian-blur a binary mask into a soft float alpha in [0, 1]."""
    blurred = cv2.GaussianBlur(binary_mask.astype(np.float32), kernel_size, 0)
    return np.clip(blurred / 255.0, 0.0, 1.0)


def composite(original_bgr: np.ndarray, shaded_bgr: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Alpha-blend shaded_bgr into original_bgr using a per-pixel float
    alpha in [0, 1] (H, W).
    """
    alpha_3ch = alpha[..., None]
    blended = original_bgr.astype(np.float32) * (1 - alpha_3ch) + shaded_bgr.astype(np.float32) * alpha_3ch
    return np.clip(blended, 0, 255).astype(np.uint8)
```

---

## Top-level orchestrator — `approach1_classical_cv.py`

Wires Steps 1–6 together per instance, and exposes the dispatcher that consumes the Grounded-SAM output format directly.

```python
"""
app/ai/rendering/approach1_classical_cv.py

Top-level entry point for Approach 1. Wires together every step:
mask_utils -> texture_utils -> lighting -> compositor.

This module is the only one that should be imported by
app/services/render_service.py — everything else in this package
is an implementation detail.
"""

from __future__ import annotations

import base64
import logging

import cv2
import numpy as np

from app.ai.rendering.compositor import composite, feather_alpha
from app.ai.rendering.lighting import apply_bump_shading, transfer_lighting
from app.ai.rendering.mask_utils import extract_instances, fit_quad
from app.ai.rendering.schemas import (
    InstanceMask,
    RenderResult,
    VinylCatalogueEntry,
)
from app.ai.rendering.texture_utils import tile_texture, warp_to_quad

logger = logging.getLogger(__name__)


def render_instance(
    original_bgr: np.ndarray,
    instance: InstanceMask,
    vinyl: VinylCatalogueEntry,
    *,
    keep_debug: bool = False,
) -> RenderResult | None:
    """Render one instance (one detected surface) with the given vinyl.

    Returns None if the instance's mask doesn't yield a usable quad
    (e.g. too small, too irregular) — caller should skip it and log,
    not crash the whole job over one bad detection.
    """
    quad = fit_quad(instance.binary_mask)
    if quad is None:
        logger.warning("No usable quad for instance %s, skipping", instance.instance_id)
        return None

    output_shape = original_bgr.shape[:2]  # (H, W)

    # Step 2: tile + warp diffuse texture
    canvas_size = (output_shape[1], output_shape[0])  # (W, H)
    tiled_diffuse = tile_texture(vinyl.diffuse_map, vinyl.render_params, canvas_size)
    warped_diffuse = warp_to_quad(tiled_diffuse, quad, output_shape)

    # Step 3: LAB lighting transfer, restricted to this instance's mask
    relit = transfer_lighting(original_bgr, warped_diffuse, instance.binary_mask)

    # Step 4: bump micro-shading (optional, skipped gracefully if no bump map)
    src_points = np.array(
        [[0, 0], [tiled_diffuse.shape[1] - 1, 0],
         [tiled_diffuse.shape[1] - 1, tiled_diffuse.shape[0] - 1],
         [0, tiled_diffuse.shape[0] - 1]],
        dtype=np.float32,
    )
    warp_matrix = cv2.getPerspectiveTransform(src_points, quad.as_array())
    shaded = apply_bump_shading(
        relit,
        vinyl.bump_map,
        instance.binary_mask,
        warp_matrix,
        output_shape,
        vinyl.render_params.bump_intensity,
    )

    # Step 5 + 6: feather edge, composite back into the full frame
    alpha = feather_alpha(instance.binary_mask)
    final = composite(original_bgr, shaded, alpha)

    return RenderResult(
        instance_id=instance.instance_id,
        final_bgr=final,
        warped_diffuse_debug=warped_diffuse if keep_debug else None,
        relit_debug=relit if keep_debug else None,
    )


def render_all_selected(
    original_bgr: np.ndarray,
    instances: list[InstanceMask],
    selected_instance_ids: list[int],
    vinyl: VinylCatalogueEntry,
    *,
    keep_debug: bool = False,
) -> np.ndarray:
    """Render every selected instance, applying them sequentially onto
    the same working frame so multiple wrapped surfaces (e.g. a
    6-door cabinet run) all appear in one final image.
    """
    working_frame = original_bgr.copy()

    for instance in instances:
        if instance.instance_id not in selected_instance_ids:
            continue

        result = render_instance(working_frame, instance, vinyl, keep_debug=keep_debug)
        if result is None:
            continue

        working_frame = result.final_bgr

    return working_frame


def apply_vinyl_wrap_from_grounded_sam_output(
    original_bgr: np.ndarray,
    grounded_sam_response: dict,
    selected_instance_ids: list[int],
    vinyl: VinylCatalogueEntry,
) -> np.ndarray:
    """Dispatcher matching the exact Grounded-SAM HF Space return format:
    {
        "annotated_image_b64": "...",   # not used here, for debugging only
        "description": "...",
        "status": "success" | "error",
        "mask_path": "..." | None,
        "mask_b64": "..."               # multi-instance colour mask, base64 PNG
    }

    Loads the mask, extracts instances, and renders every selected one.
    """
    if grounded_sam_response.get("status") != "success":
        raise ValueError(
            f"Grounded-SAM did not return success: {grounded_sam_response.get('description')}"
        )

    mask_b64 = grounded_sam_response["mask_b64"]
    mask_bytes = base64.b64decode(mask_b64)
    mask_array = cv2.imdecode(np.frombuffer(mask_bytes, np.uint8), cv2.IMREAD_UNCHANGED)

    instances = extract_instances(mask_array)
    if not instances:
        raise ValueError("No usable instances found in Grounded-SAM mask output")

    return render_all_selected(
        original_bgr, instances, selected_instance_ids, vinyl, keep_debug=False
    )
```

---

## Minimal usage example

```python
"""
Example: run the full Approach 1 pipeline end to end on local files,
outside of the FastAPI/Redis layers entirely — this is the shape a
unit test or a quick manual check would take.
"""

import cv2

from app.ai.rendering.approach1_classical_cv import render_all_selected
from app.ai.rendering.mask_utils import extract_instances
from app.ai.rendering.schemas import RenderParams, VinylCatalogueEntry

original = cv2.imread("user_upload.jpg")
mask = cv2.imread("masked_image.png", cv2.IMREAD_UNCHANGED)
diffuse = cv2.imread("SPW10_diffuse.jpg")
bump = cv2.imread("SPW10_bump.jpg", cv2.IMREAD_GRAYSCALE)

instances = extract_instances(mask)

vinyl = VinylCatalogueEntry(
    code="SPW10",
    diffuse_map=diffuse,
    bump_map=bump,
    normal_map=None,
    base_color_hex="#5F3E20",
    render_params=RenderParams(
        grain_direction="none",
        repeat_seamless=True,
        scale_factor=1.0,
        roughness=0.55,
        reflectivity=0.15,
        bump_intensity=3.0,
    ),
)

selected_ids = [inst.instance_id for inst in instances]  # wrap everything detected
result = render_all_selected(original, instances, selected_ids, vinyl)

cv2.imwrite("final_visualization.jpg", result)
```

---

## Notes on wiring this into the service layer

`render_service.py` should do nothing more than: load the three inputs (original image, SAM2 mask, catalogue entry) from storage/DB, call `apply_vinyl_wrap_from_grounded_sam_output` or `render_all_selected`, then save the result and update the job record. All actual image logic stays inside `app/ai/rendering/` so it stays swappable when Approach 2 (PBR-lite) is layered on — that version will import the same `schemas.py` and reuse `mask_utils.py` unchanged, only replacing `lighting.py`'s fixed light direction with a real one estimated from Depth Anything V2.
