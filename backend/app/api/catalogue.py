"""
Catalogue API — serves vinyl style data from catalogue.json
Endpoints:
  GET /api/v1/catalogue/categories
  GET /api/v1/catalogue/{category}/subcategories
  GET /api/v1/catalogue/{category}/{subcategory}/items
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.core.config import settings

router = APIRouter(prefix="/catalogue", tags=["catalogue"])

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_catalogue() -> dict:
    """Load and return the raw catalogue dict — cached for the lifetime of the process."""
    path = Path(settings.CATALOGUE_PATH)
    if not path.exists():
        raise RuntimeError(
            f"catalogue.json not found at '{path.resolve()}'. "
            "Mount it into the container or set CATALOGUE_PATH env var."
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _find_key(mapping: dict, name: str) -> str | None:
    """Case-insensitive key lookup."""
    name_lower = name.lower()
    return next((k for k in mapping if k.lower() == name_lower), None)


@lru_cache(maxsize=None)
def _image_url(image_path: str) -> str:
    """Convert a relative image_path to a full HTTP URL.
    No disk check needed — catalogue.json only contains items with valid images."""
    if not image_path:
        return ""
    path = image_path.replace("\\", "/")
    return f"{settings.BASE_URL}/static/{path}"


# ─────────────────────────────────────────────
# Category icons & display names
# ─────────────────────────────────────────────
CATEGORY_META: dict[str, dict] = {
    "wood":            {"icon": "🪵", "label": "Wood"},
    "basic":           {"icon": "🎨", "label": "Basic"},
    "natural surface": {"icon": "🌿", "label": "Natural Surface"},
    "stone_marble":    {"icon": "🪨", "label": "Stone & Marble"},
    "etc":             {"icon": "✨", "label": "ETC"},
}

def _cat_meta(key: str) -> dict:
    return CATEGORY_META.get(key.lower(), {"icon": "🗂", "label": key.title()})


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@router.get("/categories")
def list_categories() -> JSONResponse:
    """Return all top-level categories with display metadata."""
    try:
        cat = _load_catalogue()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    result = []
    for key in cat:
        meta = _cat_meta(key)
        total_items = sum(len(v) for v in cat[key].values())
        result.append({
            "key": key,
            "label": meta["label"],
            "icon": meta["icon"],
            "subcategory_count": len(cat[key]),
            "total_items": total_items,
        })
    return JSONResponse({"categories": result})


@router.get("/{category}/subcategories")
def list_subcategories(category: str) -> JSONResponse:
    """Return all sub-categories for a given main category."""
    try:
        cat = _load_catalogue()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    matched = _find_key(cat, category)
    if matched is None:
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found.")

    subcats = []
    for sub_key, items in cat[matched].items():
        subcats.append({
            "key": sub_key,
            "label": sub_key.replace("-", " ").replace("_", " ").title(),
            "item_count": len(items),
        })

    return JSONResponse({
        "category": matched,
        "subcategories": subcats,
    })


@router.get("/{category}/{subcategory}/items")
def list_items(category: str, subcategory: str) -> JSONResponse:
    """Return all vinyl items (with image URLs) for a category/sub-category."""
    try:
        cat = _load_catalogue()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    matched_cat = _find_key(cat, category)
    if matched_cat is None:
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found.")

    subcats = cat[matched_cat]
    matched_sub = _find_key(subcats, subcategory)
    if matched_sub is None:
        raise HTTPException(status_code=404, detail=f"Sub-category '{subcategory}' not found.")

    raw_items: list[dict[str, Any]] = subcats[matched_sub]
    enriched = []
    for item in raw_items:
        entry = dict(item)
        img_path = entry.get("image_path", "")
        entry["image_url"] = _image_url(img_path) if img_path else None
        # Flatten feature flags into a list of active feature names
        features_raw = entry.get("Features", {})
        entry["active_features"] = [k for k, v in features_raw.items() if v is True]
        enriched.append(entry)

    return JSONResponse({
        "category": matched_cat,
        "subcategory": matched_sub,
        "count": len(enriched),
        "items": enriched,
    })
