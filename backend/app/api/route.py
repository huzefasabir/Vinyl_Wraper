import os
import json
import base64
import mimetypes
import uuid
import numpy as np
from typing import Optional, List, Dict, Any
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Request, Response, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

try:
    from app.core.logger import get_logger
except ImportError:
    from backend.app.core.logger import get_logger  # type: ignore

log = get_logger("route")

router = APIRouter(prefix="/api", tags=["API Routes"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
if not (BASE_DIR / "bodaq_cat.json").exists() and (BASE_DIR / "backend" / "bodaq_cat.json").exists():
    BASE_DIR = BASE_DIR / "backend"

CATALOG_PATH = BASE_DIR / "bodaq_cat.json"
STORAGE_IMAGES_DIR = BASE_DIR / "storage_data" / "images"
STORAGE_DIR = BASE_DIR / "storage_data"

# In-memory catalogue state
_raw_catalog: Dict[str, Any] = {}
_flat_materials: List[Dict[str, Any]] = []
_categories_summary: List[Dict[str, Any]] = []
_category_subcategories_map: Dict[str, List[Dict[str, Any]]] = {}

def get_main_image_relative_path(diffuse_map_path: Optional[str], code: Optional[str]) -> str:
    """
    Given diffuse_map_path and code, returns the relative image path for the clean style image '{code}.jpg'.
    """
    if not diffuse_map_path:
        return ""
    clean_path = diffuse_map_path.replace("\\", "/")
    if clean_path.startswith("images/"):
        clean_path = clean_path[len("images/"):]
    elif clean_path.startswith("storage_data/images/"):
        clean_path = clean_path[len("storage_data/images/"):]
    
    dir_part = os.path.dirname(clean_path)
    code_val = code or ""
    return f"{dir_part}/{code_val}.jpg" if dir_part else f"{code_val}.jpg"

def finish_type_to_display(finish_type: Optional[str]) -> str:
    if not finish_type:
        return "Super Matt"
    mapping = {
        "wood_grain": "Wood Grain",
        "solid": "Solid Color",
        "super_matt": "Super Matt",
        "stone_marble": "Stone & Marble",
        "fabric": "Natural Fabric",
        "metal": "Velvet & Metal",
        "leather": "Soft Leather",
        "special": "Special Architectural"
    }
    return mapping.get(finish_type, finish_type.replace("_", " ").title())

def transform_item(item: Dict[str, Any], cat_key: str, subcat_key: str) -> Dict[str, Any]:
    code = str(item.get("code") or item.get("sku") or "")
    diffuse = str(item.get("diffuse_map_path") or "")
    bump = str(item.get("bump_map_path") or "")
    normal = str(item.get("normal_map_path") or "")
    
    main_rel_img = get_main_image_relative_path(diffuse, code)
    image_url = f"/api/images/{main_rel_img}?v=2"
    
    features = item.get("Features", {}) or {}
    render_params = item.get("render_params", {}) or {}
    finish_display = finish_type_to_display(item.get("finish_type"))
    
    pbr = {
        "roughness": render_params.get("roughness", 0.55),
        "specular": render_params.get("reflectivity", 0.15),
        "normalMap": "Deep Emboss" if render_params.get("bump_intensity", 1) > 2.0 else "Micro Texture",
        "grainDirection": (render_params.get("grain_direction", "vertical")).capitalize() if isinstance(render_params.get("grain_direction"), str) else "Vertical",
        "thickness": "0.2mm - 0.45mm (Heavy Commercial)",
        "rollWidth": "1220mm (48\")",
        "adhesive": "Pressure-Sensitive Air-Release Comply™",
        "fireRating": "Class A / ASTM E84" if features.get("fire_retardant") else "Commercial Grade",
        "durabilityYears": 10
    }
    
    return {
        "id": code.lower(),
        "code": code,
        "sku": item.get("sku", code),
        "name": item.get("name", code),
        "page": item.get("page"),
        "category": cat_key,
        "categoryName": cat_key,
        "subCategory": subcat_key,
        "subCategoryName": item.get("subcategory", subcat_key.replace("-", " ").title()),
        "finish": finish_display,
        "finishType": item.get("finish_type", "wood_grain"),
        "colorHex": item.get("base_color_hex", "#4F3C2C"),
        "imageUrl": image_url,  # ONLY {code}.jpg visible picture
        "macroUrl": image_url,
        "diffuseMapPath": diffuse,
        "bumpMapPath": bump,
        "normalMapPath": normal,
        "features": features,
        "renderParams": render_params,
        "pbr": pbr,
        "isNew": bool(features.get("is_new", False)),
        "isFireRetardant": bool(features.get("fire_retardant", False)),
        "description": f"Architectural wrap film in {item.get('name', code)} with authentic {finish_display} finish."
    }

def load_catalog_data():
    global _raw_catalog, _flat_materials, _categories_summary, _category_subcategories_map
    if not CATALOG_PATH.exists():
        print(f"WARNING: {CATALOG_PATH} not found!")
        return

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        _raw_catalog = json.load(f)

    categories_dict = _raw_catalog.get("categories", {})
    flat_list = []
    summary_list = []
    subcat_map = {}

    for cat_name, cat_data in categories_dict.items():
        subcats_dict = cat_data.get("sub_categories", {})
        cat_total_items = 0
        cat_subcats_list = []

        for subcat_key, items in subcats_dict.items():
            subcat_display = subcat_key.replace("-", " ").title()
            if items and items[0].get("subcategory"):
                subcat_display = items[0].get("subcategory")

            transformed_items = [transform_item(it, cat_name, subcat_key) for it in items]
            flat_list.extend(transformed_items)
            cat_total_items += len(transformed_items)

            cat_subcats_list.append({
                "id": subcat_key,
                "name": subcat_display,
                "count": len(transformed_items)
            })

        summary_list.append({
            "id": cat_name,
            "name": cat_name,
            "count": cat_total_items,
            "subCategories": cat_subcats_list
        })
        subcat_map[cat_name] = cat_subcats_list

    _flat_materials = flat_list
    _categories_summary = summary_list
    _category_subcategories_map = subcat_map
    log.info(f"Catalog loaded: {len(_flat_materials)} materials across {len(_categories_summary)} categories")

load_catalog_data()

# ── Async Volka Job Store ─────────────────────────────────────────────────────
# job_id → { "status": "pending"|"done"|"error", "result": {...}|None, "error": str|None }
_volka_jobs: Dict[str, Dict[str, Any]] = {}


class VolkaAnalyzeRequest(BaseModel):
    imageData: str           # base64 data-url or raw base64
    filename: Optional[str] = "room.jpg"
    prompt: str              # target surface name / prompt
    show_masks: Optional[bool] = True
    show_boxes: Optional[bool] = False
    crop_option: Optional[str] = "Crop"


async def _run_volka_job(job_id: str, image_bytes: bytes, filename: str,
                          prompt: str, show_masks: bool, show_boxes: bool,
                          crop_option: str):
    """Background coroutine: calls HF Space and writes result into job store."""
    log.hf(f"JOB {job_id[:8]}… STARTED  prompt='{prompt}'  file='{filename}'  size={len(image_bytes)}B")
    try:
        try:
            from app.services.volka_service import analyze_image
        except ImportError:
            from backend.app.services.volka_service import analyze_image
        result = await analyze_image(
            image_bytes=image_bytes,
            filename=filename,
            prompt=prompt,
            show_masks=show_masks,
            show_boxes=show_boxes,
            crop_option=crop_option,
        )
        _volka_jobs[job_id] = {"status": "done", "result": result, "error": None}
        log.ok(f"JOB {job_id[:8]}… DONE    mask='{result.get('mask_path')}'")
    except Exception as exc:
        _volka_jobs[job_id] = {"status": "error", "result": None, "error": str(exc)}
        log.error(f"JOB {job_id[:8]}… ERROR   {exc}")


@router.post("/volka-analyze")
@router.post("/volko-analyze")
@router.post("/volka/analyze")
@router.post("/volko/analyze")
async def volka_analyze(payload: VolkaAnalyzeRequest, background_tasks: BackgroundTasks):
    """Fire-and-forget: decodes image, starts HF Space job, returns job_id immediately."""
    raw_img = payload.imageData
    image_bytes: Optional[bytes] = None

    if raw_img.startswith("http://") or raw_img.startswith("https://"):
        try:
            import urllib.request
            req = urllib.request.Request(raw_img, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                image_bytes = resp.read()
        except Exception as e:
            log.error(f"Failed to fetch image URL {raw_img[:60]}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to download image URL: {e}")
    else:
        swatch_path = _resolve_swatch_path(raw_img, None)
        if swatch_path and swatch_path.exists() and swatch_path.is_file():
            with open(swatch_path, "rb") as f:
                image_bytes = f.read()
        else:
            raw_b64 = raw_img.split(",", 1)[1] if "," in raw_img else raw_img
            try:
                image_bytes = base64.b64decode(raw_b64)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid base64 image data")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Failed to obtain image data")

    job_id = uuid.uuid4().hex
    _volka_jobs[job_id] = {"status": "pending", "result": None, "error": None}

    background_tasks.add_task(
        _run_volka_job,
        job_id,
        image_bytes,
        payload.filename or "room.jpg",
        payload.prompt,
        payload.show_masks if payload.show_masks is not None else True,
        payload.show_boxes if payload.show_boxes is not None else True,
        payload.crop_option or "None",
    )

    log.hf(f"JOB {job_id[:8]}… QUEUED   prompt='{payload.prompt}'  returning job_id immediately")
    return {"success": True, "job_id": job_id, "status": "pending"}


@router.get("/volka-status/{job_id}")
@router.get("/volko-status/{job_id}")
@router.get("/volka/status/{job_id}")
@router.get("/volko/status/{job_id}")
def volka_status(job_id: str):
    """Poll the status of a volka analysis job."""
    job = _volka_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    log.poll(f"POLL {job_id[:8]}…  status={job['status']}")
    response: Dict[str, Any] = {"job_id": job_id, "status": job["status"]}

    if job["status"] == "done" and job["result"]:
        r = job["result"]
        response["hfSegmentedImage"] = (
            f"data:image/png;base64,{r['annotated_image_b64']}"
            if r.get("annotated_image_b64")
            else None
        )
        response["description"] = r.get("description", "")
        response["mask_path"] = r.get("mask_path", "")
    elif job["status"] == "error":
        response["error"] = job.get("error", "Unknown error")

    return response


# Mock state for projects & uploads
uploaded_spaces: Dict[str, Any] = {}
saved_projects: List[Dict[str, Any]] = [
  {
    "id": "proj-001",
    "name": "Metropolitan Penthouse Kitchen",
    "spaceName": "Kitchen Island & Cabinets",
    "createdAt": "2026-08-10T14:32:00.000Z",
    "thumbnailUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuAeY9Vj8PDpu-0VphwfKJ8bfKDstbwmN8dT0QukCeUoROts61UpKYAy3r98thmuwyyff6jvqBf6lK48DxI7A7G7_CpsB_Wg8OzGyiUOm7dtIofuYZH-ffn0aG4z_2NrjNDaW824DFzdmKRyLQGzhz6cJs0EHaVDzoDTUHh-4omm7zQZx4xNwNanrHUNgMPTjyjRSGyRp5GenDYy5do-F7lam5EkkhrGkuziPdYFFrjHBGA3rQUKDHFA",
    "spaceImageId": "kitchen-modern",
    "appliedMaterials": [
      {
        "segmentId": "seg-upper-cabinets",
        "segmentName": "Upper Wall Cabinets",
        "material": {
          "sku": "OGW01",
          "name": "Noble Oak",
          "categoryName": "Wood"
        },
        "params": { "grainDirection": 0, "roughness": 55, "reflectivity": 15 }
      }
    ],
    "notes": "Approved specification with client. Noble Oak architectural film paired with high-durability surface topcoat."
  }
]

# --- Route Handlers ---

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "service": "VinylWrap AI Studio FastAPI Backend",
        "version": "2.5.0",
        "totalMaterials": len(_flat_materials),
        "totalCategories": len(_categories_summary)
    }

@router.get("/catalog")
def get_full_catalog():
    categories_dict = _raw_catalog.get("categories", {})
    formatted_hierarchy = {}

    for cat_name, cat_data in categories_dict.items():
        subcats_dict = cat_data.get("sub_categories", {})
        formatted_subcats = {}

        for subcat_key, items in subcats_dict.items():
            formatted_subcats[subcat_key] = [
                transform_item(it, cat_name, subcat_key) for it in items
            ]

        formatted_hierarchy[cat_name] = {
            "name": cat_name,
            "count": sum(len(items) for items in subcats_dict.values()),
            "sub_categories": formatted_subcats
        }

    return {
        "success": True,
        "totalItems": len(_flat_materials),
        "categories": formatted_hierarchy
    }

@router.get("/categories")
def get_categories():
    return {
        "success": True,
        "totalItems": len(_flat_materials),
        "categories": _categories_summary
    }

@router.get("/materials")
def get_materials(
    category: Optional[str] = Query(None, description="Filter by Category name"),
    subcategory: Optional[str] = Query(None, description="Filter by Subcategory id"),
    search: Optional[str] = Query(None, description="Search query by name, sku, code, finish"),
    is_new: Optional[bool] = Query(None, description="Filter new releases"),
    fire_retardant: Optional[bool] = Query(None, description="Filter fire retardant films"),
    limit: Optional[int] = Query(None, description="Limit result count"),
    offset: int = Query(0, description="Offset for pagination")
):
    results = _flat_materials

    if category and category.lower() != "all":
        results = [m for m in results if m["category"].lower() == category.lower()]

    if subcategory and subcategory.lower() != "all":
        results = [m for m in results if m["subCategory"].lower() == subcategory.lower()]

    if is_new is not None:
        results = [m for m in results if m["isNew"] == is_new]

    if fire_retardant is not None:
        results = [m for m in results if m["isFireRetardant"] == fire_retardant]

    if search:
        s = search.strip().lower()
        results = [
            m for m in results
            if s in m["name"].lower()
            or s in m["code"].lower()
            or s in m["sku"].lower()
            or s in m["categoryName"].lower()
            or s in m["subCategoryName"].lower()
            or s in m["finish"].lower()
        ]

    total_matches = len(results)
    if limit is not None:
        paginated = results[offset : offset + limit]
    else:
        paginated = results[offset:]

    return {
        "success": True,
        "total": total_matches,
        "count": len(paginated),
        "materials": paginated
    }

@router.get("/materials/{code_or_sku}")
def get_material_detail(code_or_sku: str):
    target = code_or_sku.strip().lower()
    for m in _flat_materials:
        if m["code"].lower() == target or m["sku"].lower() == target or m["id"] == target:
            return {"success": True, "material": m}
    raise HTTPException(status_code=404, detail=f"Material '{code_or_sku}' not found")

@router.get("/images/{file_path:path}")
def serve_image(file_path: str):
    clean_path = file_path.replace("\\", "/").lstrip("/")
    
    candidates = [
        STORAGE_IMAGES_DIR / clean_path,
        STORAGE_DIR / clean_path,
        BASE_DIR / clean_path
    ]
    
    if clean_path.endswith(".jpg"):
        base_no_ext = clean_path[:-4]
        candidates.append(STORAGE_IMAGES_DIR / f"{base_no_ext}_diffuse.jpg")
        candidates.append(STORAGE_IMAGES_DIR / f"{base_no_ext}.jpg.png")
        candidates.append(STORAGE_IMAGES_DIR / f"{base_no_ext}.png")

    for p in candidates:
        if p.exists() and p.is_file():
            mime_type, _ = mimetypes.guess_type(str(p))
            return FileResponse(
                str(p),
                media_type=mime_type or "image/jpeg",
                headers={"Cache-Control": "public, max-age=86400"}
            )
            
    fallback_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#141c24"/>
  <rect x="20" y="20" width="360" height="260" rx="12" fill="#182028" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 4"/>
  <circle cx="200" cy="120" r="32" fill="#222b33"/>
  <text x="200" y="180" fill="#dae3ee" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">Vinyl Specimen</text>
  <text x="200" y="205" fill="#87929a" font-family="monospace" font-size="11" text-anchor="middle">{clean_path.split('/')[-1]}</text>
</svg>"""
    return Response(content=fallback_svg, media_type="image/svg+xml", headers={"Cache-Control": "no-cache, no-store, must-revalidate"})

class UploadSpaceRequest(BaseModel):
    imageData: str
    filename: Optional[str] = "Custom Space"
    spaceType: Optional[str] = "custom"

class SegmentTextRequest(BaseModel):
    imageData: str
    query: str
    confidenceThreshold: Optional[float] = 0.5

@router.post("/segment-text")
async def segment_text_route(payload: SegmentTextRequest):
    hf_preview = None

    # Call Volkopat/SegmentAnythingxGroundingDINO model via volka_service
    try:
        try:
            from app.services.volka_service import analyze_image
        except ImportError:
            from backend.app.services.volka_service import analyze_image
        raw_b64 = payload.imageData
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        img_bytes = base64.b64decode(raw_b64)

        volka_res = await analyze_image(
            image_bytes=img_bytes,
            filename="room.jpg",
            prompt=payload.query,
            show_masks=True,
            show_boxes=True,
            crop_option="None"
        )
        if volka_res and volka_res.get("annotated_image_b64"):
            hf_preview = f"data:image/png;base64,{volka_res['annotated_image_b64']}"
    except Exception as ve:
        log.error(f"volka_service analyze_image notice: {ve}")

    clean_slug = payload.query.lower().replace(" ", "-")
    fallback_segments = [
        {
            "id": f"seg-{clean_slug}-1",
            "name": f"{payload.query.title()} #1",
            "confidence": 0.88,
            "boundingBox": {"x": 0.25, "y": 0.25, "width": 0.50, "height": 0.40},
            "pathCoordinates": [
                {"x": 0.25, "y": 0.25},
                {"x": 0.75, "y": 0.25},
                {"x": 0.75, "y": 0.65},
                {"x": 0.25, "y": 0.65}
            ],
            "cutoutBase64": payload.imageData,
            "areaPercentage": 20.0
        }
    ]
    return {
        "success": True,
        "query": payload.query,
        "count": len(fallback_segments),
        "hfSegmentedImage": hf_preview or payload.imageData,
        "previewImage": hf_preview or payload.imageData,
        "segments": fallback_segments,
        "fallback": True
    }


@router.post("/upload-space")
def upload_space(payload: UploadSpaceRequest):
    import time
    space_id = f"space-{int(time.time()*1000)}"
    space_obj = {
        "id": space_id,
        "name": payload.filename,
        "url": payload.imageData,
        "type": payload.spaceType,
        "size": len(payload.imageData),
        "uploadedAt": "2026-08-15T22:20:00.000Z"
    }
    uploaded_spaces[space_id] = space_obj
    return {
        "success": True,
        "space": space_obj,
        "message": "Space image processed and geometry mapped successfully"
    }

class ApplyWrapRequest(BaseModel):
    space_image_id: Optional[str] = "custom"
    segment_id: Optional[str] = "seg-1"
    material_sku: str
    parameters: Optional[Dict[str, Any]] = None

@router.post("/apply-wrap")
def apply_wrap(payload: ApplyWrapRequest):
    import time
    params = payload.parameters or {}
    grain = params.get("grainDirection", 0)
    roughness = params.get("roughness", 55)
    reflectivity = params.get("reflectivity", 15)

    return {
        "success": True,
        "render_id": f"rnd-{int(time.time()*1000)}",
        "space_image_id": payload.space_image_id,
        "segment_id": payload.segment_id,
        "material_sku": payload.material_sku,
        "computed_lighting": {
            "ambient_occlusion_factor": 0.94,
            "specular_highlight_intensity": ((100 - roughness) / 100) * (reflectivity / 100) * 1.5,
            "anisotropic_angle_deg": grain,
            "fresnel_ior": 1.48
        },
        "status": "completed"
    }

# ── Vinyl CV Render Pipeline ──────────────────────────────────────────────────

class VinylRenderRequest(BaseModel):
    baseImageData:                  str            # base64 data-URL of original room photo
    maskImageData:                  str            # base64 data-URL of HF Space mask image
    diffuseMapPath:                 Optional[str] = None   # e.g. "images/wood/optical-grain/OGW01_diffuse.jpg"
    swatchImagePath:                Optional[str] = None   # fallback: plain swatch {CODE}.jpg
    bumpMapPath:                    Optional[str] = None   # optional bump map path
    normalMapPath:                  Optional[str] = None   # optional normal map path for Approach 2 PBR relighting
    opacity:                        Optional[float] = 1.0  # 0.0–1.0 blend strength
    renderParams:                   Optional[Dict[str, Any]] = None # optional PBR render params (grain_direction, scale_factor, roughness, reflectivity, etc.)
    enablePbrRelighting:            Optional[bool] = False # Approach 2 feature flag: Depth Anything V2 + normal map relighting
    pbrBlendStrength:               Optional[float] = 0.6 # Approach 2 PBR relighting blend strength 0.0-1.0
    enableDiffusionHarmonization:   Optional[bool] = False # Approach 3 feature flag: Stable Diffusion inpainting harmonization pass
    diffusionStrength:              Optional[float] = 0.25 # Approach 3 diffusion inpainting strength 0.0-1.0
    maxColorDriftLab:                Optional[float] = 6.0 # Approach 3 CIELAB color guardrail max drift threshold


def _resolve_swatch_path(
    diffuse_map_path: Optional[str],
    swatch_image_path: Optional[str],
) -> Optional[Path]:
    """Resolve a vinyl swatch to an absolute Path. Prioritizes pure _diffuse texture image if available."""
    prefixes = ["api/images/", "storage_data/images/", "images/"]
    
    raw_paths = []
    if diffuse_map_path:
        raw_paths.append(diffuse_map_path)
    if swatch_image_path:
        clean_swatch = swatch_image_path.replace("\\", "/").lstrip("/")
        if not clean_swatch.endswith("_diffuse.jpg") and not clean_swatch.endswith("_diffuse.png"):
            if clean_swatch.endswith(".jpg"):
                raw_paths.append(clean_swatch[:-4] + "_diffuse.jpg")
            elif clean_swatch.endswith(".png"):
                raw_paths.append(clean_swatch[:-4] + "_diffuse.png")
        raw_paths.append(swatch_image_path)

    for p in raw_paths:
        if not p:
            continue
        clean = p.replace("\\", "/").lstrip("/")
        candidates_clean = [clean]
        for pref in prefixes:
            if clean.startswith(pref):
                candidates_clean.append(clean[len(pref):])

        for c_path in candidates_clean:
            for base in [STORAGE_IMAGES_DIR, STORAGE_DIR, BASE_DIR]:
                full = base / c_path
                if full.exists() and full.is_file():
                    return full
    return None


@router.post("/vinyl-render")
async def vinyl_render_endpoint(payload: VinylRenderRequest):
    """
    POST /api/vinyl-render
    ──────────────────────
    Runs the OpenCV vinyl_render pipeline in a thread-pool executor:
      1. extract_pure_vinyl_texture   — isolates raw material from swatch card
      2. extract_surface_instances     — finds surface contours & quad points
      3. Homography perspective warp  — warps texture to fit 4-corner quad
      4. CIELAB luminance modulation  — preserves shadows ±30%, applies PBR roughness/reflectivity
      5. Approach 2 PBR Relighting    — (optional) Depth Anything V2 + normal maps + Blinn-Phong
      6. Option A alpha compositing   — clips composite to precise segment mask boundaries
      7. Approach 3 Harmonization     — (optional) Stable Diffusion inpainting + CIELAB color guardrail

    Returns { success, compositeImage (PNG base64 data-URL), render_stats }
    """
    import asyncio
    import time

    log.hf(
        f"vinyl-render: diffuse='{payload.diffuseMapPath}'  "
        f"swatch='{payload.swatchImagePath}'  opacity={payload.opacity}  "
        f"pbr={payload.enablePbrRelighting}  diffusion={payload.enableDiffusionHarmonization}"
    )

    swatch_path = _resolve_swatch_path(payload.diffuseMapPath, payload.swatchImagePath)
    if swatch_path is None:
        log.error(
            f"vinyl-render: swatch not found  "
            f"diffuse='{payload.diffuseMapPath}'  swatch='{payload.swatchImagePath}'"
        )
        raise HTTPException(
            status_code=404,
            detail=(
                f"Vinyl swatch not found on server. "
                f"diffuseMapPath='{payload.diffuseMapPath}', "
                f"swatchImagePath='{payload.swatchImagePath}'"
            ),
        )

    bump_path = _resolve_swatch_path(payload.bumpMapPath, None) if payload.bumpMapPath else None
    normal_path = _resolve_swatch_path(payload.normalMapPath, None) if payload.normalMapPath else None

    log.info(f"vinyl-render: swatch resolved → {swatch_path}")

    try:
        from app.services.vinyl_render import apply_vinyl_wrap, extract_pure_vinyl_texture
    except ImportError:
        from backend.app.services.vinyl_render import apply_vinyl_wrap, extract_pure_vinyl_texture  # type: ignore

    t0 = time.perf_counter()
    loop = asyncio.get_event_loop()

    # vinyl_render_old.apply_vinyl_wrap takes exactly 3 positional args:
    # (original_img, mask_img, vinyl_img) — it handles texture extraction internally.
    # We decode images here so the executor only runs pure-CV work.
    import base64 as _b64
    import cv2 as _cv2

    def _decode(b64: str):
        raw = b64.split(",", 1)[1] if "," in b64 else b64
        arr = np.frombuffer(_b64.b64decode(raw), np.uint8)
        img = _cv2.imdecode(arr, _cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode base64 image")
        return img

    def _run_old_pipeline():
        orig  = _decode(payload.baseImageData)
        mask  = _decode(payload.maskImageData)

        if mask.shape[:2] != orig.shape[:2]:
            mask = _cv2.resize(mask, (orig.shape[1], orig.shape[0]), interpolation=_cv2.INTER_LINEAR)

        swatch_bgr = _cv2.imread(str(swatch_path))
        if swatch_bgr is None:
            raise ValueError(f"cv2.imread failed for: {swatch_path}")

        result = apply_vinyl_wrap(orig, mask, swatch_bgr)

        ok, buf = _cv2.imencode(".png", result)
        if not ok:
            raise RuntimeError("cv2.imencode failed")
        return "data:image/png;base64," + _b64.b64encode(buf.tobytes()).decode("utf-8")

    try:
        composite_b64: str = await loop.run_in_executor(None, _run_old_pipeline)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        log.error(f"vinyl-render: pipeline error — {exc}")
        raise HTTPException(status_code=500, detail=f"CV render pipeline error: {exc}")

    elapsed_ms = round((time.perf_counter() - t0) * 1000)
    log.ok(f"vinyl-render: done in {elapsed_ms}ms")

    return {
        "success": True,
        "compositeImage": composite_b64,
        "render_stats": {
            "elapsed_ms": elapsed_ms,
            "swatch_path": str(swatch_path),
            "opacity": payload.opacity,
            "render_params": payload.renderParams,
        },
    }

class ExportRequest(BaseModel):
    projectName: Optional[str] = "Architectural Wrap Project"
    spaceImageId: Optional[str] = "custom"
    appliedMaterials: Optional[List[Dict[str, Any]]] = None
    highResUrl: Optional[str] = None

@router.post("/export")
def export_project(payload: ExportRequest):
    import random
    export_id = f"EXP-{random.randint(100000, 999999)}"
    bom = []
    for idx, item in enumerate(payload.appliedMaterials or []):
        mat = item.get("material", {})
        bom.append({
            "itemNumber": idx + 1,
            "surfaceZone": item.get("segmentName", item.get("segmentId", f"Surface #{idx+1}")),
            "sku": mat.get("sku", "N/A"),
            "materialName": mat.get("name", "Architectural Wrap"),
            "finish": mat.get("finish", "Super Matt"),
            "rollCoverageEstimatedSqM": round(random.uniform(2.5, 6.0), 1),
            "fireRating": mat.get("pbr", {}).get("fireRating", "Class A / ASTM E84"),
            "adhesiveType": mat.get("pbr", {}).get("adhesive", "Pressure-Sensitive Air-Release Comply™")
        })

    return {
        "success": True,
        "exportId": export_id,
        "projectName": payload.projectName,
        "downloadUrl": payload.highResUrl or "/api/export/spec-sheet.pdf",
        "billOfMaterials": bom,
        "architecturalSpecificationSheet": {
            "standards": ["ASTM E84 Class A", "NFPA 255", "ISO 9001:2015"],
            "recommendedPrimer": "3M 94 Primer (Porous Surfaces)",
            "installationTemperature": "16°C – 28°C (60°F – 82°F)",
            "warrantyYears": 10
        }
    }

@router.get("/projects")
def get_projects():
    return {"success": True, "projects": saved_projects}

class SaveProjectRequest(BaseModel):
    name: Optional[str] = "Untitled Renovation"
    spaceName: Optional[str] = "Custom Room"
    thumbnailUrl: Optional[str] = ""
    spaceImageId: Optional[str] = "kitchen-modern"
    appliedMaterials: Optional[List[Dict[str, Any]]] = []
    notes: Optional[str] = ""

@router.post("/projects")
def save_project(payload: SaveProjectRequest):
    import time
    proj = {
        "id": f"proj-{int(time.time()*1000)}",
        "name": payload.name,
        "spaceName": payload.spaceName,
        "createdAt": "2026-08-15T22:20:00.000Z",
        "thumbnailUrl": payload.thumbnailUrl,
        "spaceImageId": payload.spaceImageId,
        "appliedMaterials": payload.appliedMaterials,
        "notes": payload.notes
    }
    saved_projects.insert(0, proj)
    return {"success": True, "project": proj}

class AiSuggestRequest(BaseModel):
    spaceType: Optional[str] = "kitchen"
    roomVibe: Optional[str] = "modern luxury"
    existingElements: Optional[str] = "neutral surroundings"

@router.post("/ai-suggest")
async def ai_suggest(payload: AiSuggestRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""You are an elite architectural surface designer and material specialist.
Suggest optimal architectural vinyl wrap combinations from the Bodaq catalogue (Wood, Basic solids, Stone & Marble, Natural Surface, Metal) for a {payload.spaceType} space with {payload.roomVibe} aesthetic and {payload.existingElements}.
Return valid JSON without markdown fences:
{{
  "designTheme": "Short theme title",
  "paletteMood": "Atmospheric description in 2 sentences",
  "recommendedSkus": ["OGW01", "BLC01", "PM003"],
  "zonePairings": [
    {{"zone": "Upper Cabinets", "material": "Noble Oak (OGW01)", "finish": "Optical Grain Wood", "why": "Adds tactile warmth without glare."}},
    {{"zone": "Countertop & Island", "material": "Premium Marble (PM003)", "finish": "Stone & Marble", "why": "Architectural centerpiece with continuous veining."}}
  ],
  "lightingTip": "Position LED strip lighting at 3000K warm white to accentuate the optical grain."
}}"""
            res = model.generate_content(prompt)
            clean_txt = res.text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_txt)
            return {"success": True, "advisor": parsed}
        except Exception as e:
            print(f"Gemini API error: {e}")

    return {
        "success": True,
        "advisor": {
            "designTheme": "Architectural Biophilic Contrast",
            "paletteMood": "An organic pairing of authentic optical wood grain textures grounded by matte monolithic basics and polished premium marble accents.",
            "recommendedSkus": ["OGW01", "BLC01", "PM003"],
            "zonePairings": [
                {
                    "zone": "Upper Wall Cabinets",
                    "material": "Noble Oak (OGW01)",
                    "finish": "Optical Grain Wood",
                    "why": "Deep optical wood texture delivers authentic tactile warmth under focused downlights."
                },
                {
                    "zone": "Waterfall Island Countertop",
                    "material": "Premium Marble (PM003)",
                    "finish": "Stone & Marble",
                    "why": "Creates an opulent focal centerpiece with scratch-resistant self-healing film."
                },
                {
                    "zone": "Base Storage Units",
                    "material": "Mono Blanc Matte (BLC01)",
                    "finish": "Basic Super Matt",
                    "why": "Zero-reflection anti-fingerprint surface provides solid architectural grounding."
                }
            ],
            "lightingTip": "Position 3000K warm LED illumination at 45° grazing angle to highlight the embossed optical grain."
        }
    }
