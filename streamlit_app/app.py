"""
Vinyl Wrapper AI — Streamlit Frontend
Connects to FastAPI backend at http://localhost:8000
Catalogue is loaded entirely from the backend API.
"""

import streamlit as st
import requests
from pathlib import Path
import os
from urllib.parse import quote

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")

BASE_DIR   = Path(__file__).parent.parent
STORAGE    = BASE_DIR / "storage_data"

UPLOAD_DIR = STORAGE / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

st.set_page_config(
    page_title="Vinyl Wrapper AI",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────
# CUSTOM CSS
# ─────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

.stApp {
    background: linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e);
    color: #e0e0e0;
}
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #12112a 0%, #1c1b3a 100%);
    border-right: 1px solid rgba(255,255,255,0.06);
}

/* Hero */
.hero-banner {
    background: linear-gradient(135deg, #6c3fc7 0%, #a855f7 50%, #ec4899 100%);
    border-radius: 18px; padding: 2.2rem 2.5rem; margin-bottom: 1.8rem;
    box-shadow: 0 8px 32px rgba(108,63,199,0.45);
    position: relative; overflow: hidden;
}
.hero-banner::before {
    content: ""; position: absolute; top: -40%; right: -10%;
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
    border-radius: 50%;
}
.hero-title  { font-size: 2.1rem; font-weight: 800; color: #fff; margin: 0; letter-spacing: -0.5px; }
.hero-subtitle { font-size: 1rem; color: rgba(255,255,255,0.82); margin-top: 0.4rem; }

/* Glass card */
.glass-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 16px; padding: 1.6rem; margin-bottom: 1.2rem;
    backdrop-filter: blur(12px); transition: box-shadow 0.25s ease;
}
.glass-card:hover { box-shadow: 0 0 22px rgba(168,85,247,0.22); }

/* Section heading */
.section-heading {
    font-size: 1.15rem; font-weight: 700; color: #c084fc; margin-bottom: 0.6rem;
    letter-spacing: 0.4px; text-transform: uppercase;
}

/* Pills */
.pill { display:inline-block; padding:3px 12px; border-radius:999px; font-size:0.78rem; font-weight:600; letter-spacing:0.3px; }
.pill-uploaded  { background:rgba(168,85,247,0.25); color:#d8b4fe; border:1px solid rgba(168,85,247,0.5); }
.pill-processed { background:rgba(34,197,94,0.2);  color:#86efac; border:1px solid rgba(34,197,94,0.4); }
.pill-error     { background:rgba(239,68,68,0.2);  color:#fca5a5; border:1px solid rgba(239,68,68,0.4); }

/* Upload zone */
[data-testid="stFileUploader"] {
    background: rgba(255,255,255,0.03) !important;
    border: 2px dashed rgba(168,85,247,0.45) !important;
    border-radius: 14px !important; padding: 0.5rem !important;
}

/* Metrics */
[data-testid="stMetricLabel"] { color: #a78bfa !important; }
[data-testid="stMetricValue"] { color: #f0abfc !important; font-weight: 700 !important; }
hr { border-color: rgba(255,255,255,0.08) !important; }

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #7c3aed, #a855f7) !important;
    color: white !important; border: none !important; border-radius: 10px !important;
    font-weight: 600 !important; padding: 0.55rem 1.4rem !important;
    transition: all 0.2s ease !important; box-shadow: 0 4px 14px rgba(124,58,237,0.4) !important;
}
.stButton > button:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(168,85,247,0.55) !important; }

/* Image labels */
.cat-label { font-size: 0.82rem; color: #c4b5fd; margin-top: 0.3rem; text-align: center; }
.cat-code  { font-size: 0.7rem;  color: #7c6fa0; text-align: center; }

/* Category nav cards */
.cat-nav-card {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(168,85,247,0.25);
    border-radius: 14px; padding: 1.4rem 1rem; text-align: center;
    margin-bottom: 0.5rem; transition: all 0.2s ease; cursor: pointer; min-height: 130px;
}
.cat-nav-card:hover { background: rgba(168,85,247,0.12); border-color: rgba(168,85,247,0.55); transform: translateY(-2px); }
.cat-nav-icon  { font-size: 2.4rem; margin-bottom: 0.4rem; }
.cat-nav-title { font-size: 1.05rem; font-weight: 700; color: #e9d5ff; margin-bottom: 0.25rem; }
.cat-nav-meta  { font-size: 0.75rem; color: rgba(255,255,255,0.45); }

/* Sub-category cards (smaller) */
.sub-nav-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(168,85,247,0.18);
    border-radius: 12px; padding: 1rem 0.8rem; text-align: center;
    margin-bottom: 0.4rem; transition: all 0.2s ease; cursor: pointer;
}
.sub-nav-card:hover { background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.45); transform: translateY(-1px); }
.sub-nav-title { font-size: 0.9rem; font-weight: 600; color: #ddd6fe; margin-bottom: 0.2rem; }
.sub-nav-count { font-size: 0.72rem; color: rgba(255,255,255,0.4); }

/* Item cards */
.item-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 0.7rem 0.6rem; margin-bottom: 0.6rem;
    transition: all 0.2s ease;
}
.item-card:hover { border-color: rgba(168,85,247,0.4); box-shadow: 0 4px 16px rgba(168,85,247,0.15); }

/* Breadcrumb */
.breadcrumb {
    font-size: 0.85rem; color: #a78bfa; margin-bottom: 1rem;
    display: flex; align-items: center; gap: 0.4rem;
}
.breadcrumb-sep { color: rgba(255,255,255,0.25); }

/* Feature badge */
.feat-badge {
    display: inline-block; font-size: 0.6rem;
    background: rgba(168,85,247,0.2); color: #d8b4fe;
    border-radius: 4px; padding: 1px 5px; margin: 1px 1px 0 0;
}
.feat-badge-new  { background: rgba(236,72,153,0.25); color: #f9a8d4; }
.feat-badge-fire { background: rgba(239,68,68,0.2);   color: #fca5a5; }

/* Back button override — make it look secondary */
.back-btn > button {
    background: rgba(255,255,255,0.06) !important;
    box-shadow: none !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    font-size: 0.85rem !important; padding: 0.35rem 1rem !important;
}
.back-btn > button:hover { background: rgba(255,255,255,0.1) !important; transform: none !important; }

/* Stale image placeholder */
.img-placeholder {
    height: 130px; background: rgba(255,255,255,0.04);
    border-radius: 10px; display: flex; align-items: center;
    justify-content: center; font-size: 2.2rem; color: rgba(255,255,255,0.15);
}
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# CATEGORY META
# ─────────────────────────────────────────────
CATEGORY_META: dict[str, dict] = {
    "wood":            {"icon": "🪵", "label": "Wood",           "desc": "Natural & engineered wood grain films"},
    "basic":           {"icon": "🎨", "label": "Basic",          "desc": "Solid colours, painted & textured finishes"},
    "natural surface": {"icon": "🌿", "label": "Natural Surface", "desc": "Fabric, leather, metal & luxury materials"},
    "stone_marble":    {"icon": "🪨", "label": "Stone & Marble",  "desc": "Marble, stone and premium mineral surfaces"},
    "etc":             {"icon": "✨", "label": "ETC",             "desc": "Exterior & specialty protective films"},
}

def _cat_meta(key: str) -> dict:
    k = key.lower().replace(" ", "_")
    return CATEGORY_META.get(k, CATEGORY_META.get(key.lower(), {"icon": "🗂", "label": key.title(), "desc": ""}))

FEATURE_LABELS: dict[str, tuple[str, str]] = {
    "is_new":         ("🆕", "New"),
    "fire_retardant": ("🔥", "Fire Retardant"),
    "Vertical":       ("↕", "Vertical"),
    "Half-grain":     ("½", "Half Grain"),
    "wood-grain":     ("🌲", "Wood Grain"),
}

# ─────────────────────────────────────────────
# BACKEND CATALOGUE API CALLS
# ─────────────────────────────────────────────
@st.cache_data(show_spinner=False, ttl=300)
def fetch_categories() -> list[dict]:
    """GET /api/v1/catalogue/categories"""
    resp = requests.get(f"{API_BASE}/api/v1/catalogue/categories", timeout=10)
    resp.raise_for_status()
    return resp.json().get("categories", [])


@st.cache_data(show_spinner=False, ttl=300)
def fetch_subcategories(category_key: str) -> list[dict]:
    """GET /api/v1/catalogue/{category}/subcategories"""
    url = f"{API_BASE}/api/v1/catalogue/{quote(category_key, safe='')}/subcategories"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return resp.json().get("subcategories", [])


@st.cache_data(show_spinner=False, ttl=300)
def fetch_items(category_key: str, subcategory_key: str) -> list[dict]:
    """GET /api/v1/catalogue/{category}/{subcategory}/items"""
    url = (
        f"{API_BASE}/api/v1/catalogue/"
        f"{quote(category_key, safe='')}/{quote(subcategory_key, safe='')}/items"
    )
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json().get("items", [])

# ─────────────────────────────────────────────
# BACKEND HELPERS (optional — used for upload page)
# ─────────────────────────────────────────────
def api_health() -> bool:
    try:
        r = requests.get(f"{API_BASE}/api/v1/health", timeout=3)
        return r.status_code == 200
    except Exception:
        return False


def save_locally(file_bytes: bytes, filename: str) -> Path:
    import uuid as _uuid
    ext = Path(filename).suffix.lower() or ".jpg"
    unique_name = f"{_uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / unique_name
    dest.write_bytes(file_bytes)
    return dest


def upload_image(file_bytes: bytes, filename: str, local_path: Path) -> dict | None:
    try:
        resp = requests.post(
            f"{API_BASE}/api/v1/projects/upload",
            files={"file": (filename, file_bytes, "image/jpeg")},
            timeout=30,
        )
        if resp.status_code == 200:
            data = resp.json()
            data["local_path"] = str(local_path)
            return data
        return {
            "error": resp.json().get("detail", "Upload failed"),
            "status_code": resp.status_code,
            "local_path": str(local_path),
        }
    except requests.exceptions.ConnectionError:
        return {
            "project_id": local_path.stem,
            "status": "SAVED_LOCALLY",
            "image_url": local_path.as_uri(),
            "local_path": str(local_path),
            "warning": "Backend offline. File saved locally only.",
        }


def pill_html(status: str) -> str:
    cls_map = {"UPLOADED": "pill-uploaded", "PROCESSED": "pill-processed", "ERROR": "pill-error"}
    cls = cls_map.get(status.upper(), "pill-uploaded")
    return f'<span class="pill {cls}">{status}</span>'


def feature_badges_html(active_features: list[str]) -> str:
    parts = []
    for feat in active_features:
        icon, label = FEATURE_LABELS.get(feat, ("·", feat.replace("_", " ")))
        extra = ""
        if feat == "is_new":
            extra = " feat-badge-new"
        elif feat == "fire_retardant":
            extra = " feat-badge-fire"
        parts.append(f'<span class="feat-badge{extra}">{icon} {label}</span>')
    return "".join(parts)

# ─────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style='text-align:center; padding: 1rem 0 0.5rem;'>
        <span style='font-size:2.5rem;'>🎨</span>
        <h2 style='color:#c084fc; margin:0.2rem 0 0;'>Vinyl AI</h2>
        <p style='color:#7c6fa0; font-size:0.82rem; margin:0;'>AI-Powered Vinyl Wrapping</p>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    is_alive = api_health()
    if is_alive:
        pass
    else:
        st.error("⚠️ Backend Offline", icon="🔴")
        st.caption(f"Expected at: `{API_BASE}`")

    st.divider()

    page = st.radio(
        "Navigate",
        ["📤 Upload Image", "🗂 Catalogue", "📋 My Projects"],
        label_visibility="collapsed",
    )

    st.divider()

    if is_alive:
        try:
            cats = fetch_categories()
            total_styles = sum(c.get("total_items", 0) for c in cats)
            st.metric("Vinyl Styles", total_styles)
            st.metric("Categories", len(cats))
        except Exception:
            st.metric("Vinyl Styles", "—")
            st.metric("Categories", "—")
    else:
        st.metric("Vinyl Styles", "—")
        st.metric("Categories", "—")

# ─────────────────────────────────────────────
# HERO BANNER
# ─────────────────────────────────────────────
st.markdown("""
<div class="hero-banner">
    <div class="hero-title">🎨 Vinyl Wrapper AI</div>
    <div class="hero-subtitle">
        Upload your room or floor photo &mdash; let AI match the perfect vinyl wrap style for you.
    </div>
</div>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# PAGE: UPLOAD IMAGE
# ─────────────────────────────────────────────
if "📤 Upload Image" in page:

    col_upload, col_preview = st.columns([1.1, 1], gap="large")

    with col_upload:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown('<div class="section-heading">📤 Upload Room / Floor Image</div>', unsafe_allow_html=True)

        uploaded_file = st.file_uploader(
            "Drag & drop or click to browse",
            type=["jpg", "jpeg", "png", "webp"],
            label_visibility="visible",
        )
        st.caption("Supported formats: JPG · PNG · WEBP  |  Max size: 50 MB")

        if uploaded_file:
            st.markdown("**File details**")
            info_cols = st.columns(3)
            name_trunc = uploaded_file.name[:18] + "…" if len(uploaded_file.name) > 18 else uploaded_file.name
            info_cols[0].metric("Name", name_trunc)
            info_cols[1].metric("Size", f"{uploaded_file.size / 1024:.1f} KB")
            info_cols[2].metric("Type", uploaded_file.type.split("/")[-1].upper())

            st.divider()

            col_btn_a, col_btn_b = st.columns(2)
            upload_clicked = col_btn_a.button("🚀 Upload to Backend", use_container_width=True)
            clear_clicked  = col_btn_b.button("🗑 Clear", use_container_width=True)

            if clear_clicked:
                st.rerun()

            if upload_clicked:
                file_bytes = uploaded_file.getvalue()
                with st.spinner("Saving to storage_data/uploads/ …"):
                    local_path = save_locally(file_bytes, uploaded_file.name)
                st.success(f"✅ Saved locally → `{local_path.relative_to(BASE_DIR)}`")

                with st.spinner("Syncing with backend…"):
                    result = upload_image(file_bytes, uploaded_file.name, local_path)

                if result and "error" not in result:
                    if "warning" in result:
                        st.warning(f"⚠️ {result['warning']}")
                    else:
                        st.info("☁️ Also synced with backend.")

                    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
                    st.markdown(f"**Project ID:** `{result.get('project_id', local_path.stem)}`")
                    st.markdown(f"**Status:** {pill_html(result.get('status', 'SAVED_LOCALLY'))}", unsafe_allow_html=True)
                    st.markdown("**Local path:**")
                    st.code(result.get("local_path", str(local_path)), language="text")
                    if result.get("image_url") and not result["image_url"].startswith("file://"):
                        st.markdown("**Backend URL:**")
                        st.code(result.get("image_url", "—"), language="text")
                    st.markdown("</div>", unsafe_allow_html=True)

                    if "projects" not in st.session_state:
                        st.session_state["projects"] = []
                    st.session_state["projects"].append({
                        "project_id": result.get("project_id", local_path.stem),
                        "filename": uploaded_file.name,
                        "status": result.get("status", "SAVED_LOCALLY"),
                        "image_url": result.get("image_url", local_path.as_uri()),
                        "local_path": str(local_path),
                    })
                else:
                    err = result.get("error", "Unknown error") if result else "No response from server"
                    st.warning(f"⚠️ Backend sync failed: {err}\nFile is still saved locally at `{local_path}`")

        st.markdown("</div>", unsafe_allow_html=True)

    with col_preview:
        st.markdown('<div class="glass-card" style="min-height:360px;">', unsafe_allow_html=True)
        st.markdown('<div class="section-heading">🖼 Image Preview</div>', unsafe_allow_html=True)
        if uploaded_file:
            st.image(uploaded_file, caption=uploaded_file.name, use_container_width=True)
        else:
            st.markdown("""
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                        height:260px;color:rgba(255,255,255,0.2);font-size:4rem;">
                🏠
                <p style="font-size:0.9rem;color:rgba(255,255,255,0.3);margin-top:0.8rem;">
                    Your image will appear here
                </p>
            </div>""", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    st.divider()
    st.markdown('<div class="section-heading">💡 Tips for Best Results</div>', unsafe_allow_html=True)
    tip_cols = st.columns(3)
    tips = [
        ("📸", "Good Lighting",  "Ensure the room is well-lit with natural or bright ambient light."),
        ("📐", "Full Coverage",  "Capture the full floor/wall area you want to wrap in the frame."),
        ("🚫", "Avoid Blur",     "Use a steady hand or tripod to avoid motion blur in the photo."),
    ]
    for col, (icon, title, desc) in zip(tip_cols, tips):
        col.markdown(f"""
        <div class="glass-card" style="text-align:center;padding:1.1rem;">
            <div style="font-size:1.9rem;">{icon}</div>
            <div style="font-weight:700;color:#c084fc;margin:0.4rem 0 0.25rem;">{title}</div>
            <div style="font-size:0.83rem;color:rgba(255,255,255,0.6);">{desc}</div>
        </div>""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# PAGE: CATALOGUE
# ─────────────────────────────────────────────
elif "🗂 Catalogue" in page:

    if not api_health():
        st.error(f"⚠️ Backend is offline. Start the API at `{API_BASE}` to browse the catalogue.")
        st.stop()

    # ── Session state init ──
    if "cat_view" not in st.session_state:
        st.session_state.cat_view = "categories"
    if "cat_selected_category" not in st.session_state:
        st.session_state.cat_selected_category = None
    if "cat_selected_subcategory" not in st.session_state:
        st.session_state.cat_selected_subcategory = None

    # ── Navigation helpers ──
    def go_categories():
        st.session_state.cat_view = "categories"
        st.session_state.cat_selected_category = None
        st.session_state.cat_selected_subcategory = None

    def go_subcategories(category: dict):
        st.session_state.cat_view = "subcategories"
        st.session_state.cat_selected_category = category
        st.session_state.cat_selected_subcategory = None

    def go_items(subcategory: dict):
        st.session_state.cat_view = "items"
        st.session_state.cat_selected_subcategory = subcategory

    # ─────────────────────────────────────────
    # LEVEL 1 — CATEGORIES
    # ─────────────────────────────────────────
    if st.session_state.cat_view == "categories":

        st.markdown("""
        <div class="section-heading">🗂 Vinyl Style Catalogue</div>
        <p style="color:rgba(255,255,255,0.5);font-size:0.9rem;margin-bottom:1.4rem;">
            Browse all vinyl wrap styles by category. Click any category to explore sub-collections.
        </p>
        """, unsafe_allow_html=True)

        try:
            categories = fetch_categories()
        except Exception as e:
            st.error(f"Failed to load categories from backend: {e}")
            st.stop()

        COLS = 3
        for row_start in range(0, len(categories), COLS):
            row = categories[row_start : row_start + COLS]
            cols = st.columns(COLS, gap="medium")
            for col, cat in zip(cols, row):
                with col:
                    st.markdown(f"""
                    <div class="cat-nav-card">
                        <div class="cat-nav-icon">{cat.get("icon","🗂")}</div>
                        <div class="cat-nav-title">{cat.get("label", cat["key"])}</div>
                        <div class="cat-nav-meta" style="margin-bottom:0.35rem;">
                            {CATEGORY_META.get(cat["key"].lower(), {}).get("desc", "")}
                        </div>
                        <div class="cat-nav-meta">
                            <span style="color:#a78bfa;font-weight:600;">{cat.get("subcategory_count",0)}</span>
                            sub-collections &nbsp;·&nbsp;
                            <span style="color:#a78bfa;font-weight:600;">{cat.get("total_items",0)}</span>
                            styles
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    if st.button(
                        f"Browse {cat.get('label', cat['key'])} →",
                        key=f"cat_{cat['key']}",
                        use_container_width=True,
                    ):
                        go_subcategories(cat)
                        st.rerun()

        st.divider()
        m1, m2, m3 = st.columns(3)
        m1.metric("Total Styles",     sum(c.get("total_items", 0) for c in categories))
        m2.metric("Categories",       len(categories))
        m3.metric("Sub-Collections",  sum(c.get("subcategory_count", 0) for c in categories))

    # ─────────────────────────────────────────
    # LEVEL 2 — SUBCATEGORIES
    # ─────────────────────────────────────────
    elif st.session_state.cat_view == "subcategories":
        category = st.session_state.cat_selected_category
        if not category:
            go_categories(); st.rerun()

        # Breadcrumb + back button
        bc_col, back_col = st.columns([5, 1])
        with bc_col:
            st.markdown(
                f'<div class="breadcrumb">'
                f'<span style="color:rgba(255,255,255,0.35);cursor:pointer;">Catalogue</span>'
                f'<span class="breadcrumb-sep">›</span>'
                f'<span>{category["icon"]} {category["label"]}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
        with back_col:
            st.markdown('<div class="back-btn">', unsafe_allow_html=True)
            if st.button("← All Categories", key="back_to_cats"):
                go_categories(); st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)

        st.markdown(f"""
        <div style="margin-bottom:1.4rem;">
            <span style="font-size:1.6rem;">{category["icon"]}</span>
            <span style="font-size:1.4rem;font-weight:700;color:#e9d5ff;margin-left:0.5rem;">
                {category["label"]}
            </span>
            <div style="font-size:0.88rem;color:rgba(255,255,255,0.45);margin-top:0.3rem;">
                {CATEGORY_META.get(category["key"].lower(), {}).get("desc", "")}
            </div>
        </div>
        """, unsafe_allow_html=True)

        try:
            subcategories = fetch_subcategories(category["key"])
        except Exception as e:
            st.error(f"Failed to load sub-categories from backend: {e}")
            st.stop()
        else:
            st.markdown(
                f'<p style="color:rgba(255,255,255,0.45);font-size:0.85rem;margin-bottom:1rem;">'
                f'Choose a sub-collection to browse its vinyl styles</p>',
                unsafe_allow_html=True,
            )
            COLS = 4
            for row_start in range(0, len(subcategories), COLS):
                row = subcategories[row_start : row_start + COLS]
                cols = st.columns(COLS, gap="small")
                for col, sub in zip(cols, row):
                    with col:
                        st.markdown(f"""
                        <div class="sub-nav-card">
                            <div style="font-size:1.6rem;margin-bottom:0.35rem;">📂</div>
                            <div class="sub-nav-title">{sub["label"]}</div>
                            <div class="sub-nav-count">{sub["item_count"]} styles</div>
                        </div>
                        """, unsafe_allow_html=True)
                        if st.button(
                            f"View →",
                            key=f"sub_{category['key']}_{sub['key']}",
                            use_container_width=True,
                        ):
                            go_items(sub); st.rerun()

    # ─────────────────────────────────────────
    # LEVEL 3 — ITEMS GRID
    # ─────────────────────────────────────────
    elif st.session_state.cat_view == "items":
        category   = st.session_state.cat_selected_category
        subcategory = st.session_state.cat_selected_subcategory
        if not category or not subcategory:
            go_categories(); st.rerun()

        # Breadcrumb + back buttons
        bc_col, back_col = st.columns([5, 1])
        with bc_col:
            st.markdown(
                f'<div class="breadcrumb">'
                f'<span style="color:rgba(255,255,255,0.35);">Catalogue</span>'
                f'<span class="breadcrumb-sep">›</span>'
                f'<span style="color:rgba(255,255,255,0.55);">{category["icon"]} {category["label"]}</span>'
                f'<span class="breadcrumb-sep">›</span>'
                f'<span>{subcategory["label"]}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
        with back_col:
            st.markdown('<div class="back-btn">', unsafe_allow_html=True)
            if st.button("← Back", key="back_to_subs"):
                st.session_state.cat_view = "subcategories"
                st.session_state.cat_selected_subcategory = None
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)

        # Sub-category header
        st.markdown(f"""
        <div style="margin-bottom:1rem;">
            <span style="font-size:1.3rem;font-weight:700;color:#e9d5ff;">
                {category["icon"]} {category["label"]} — {subcategory["label"]}
            </span>
            <div style="font-size:0.82rem;color:rgba(255,255,255,0.4);margin-top:0.2rem;">
                {subcategory["item_count"]} vinyl styles
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Load items from backend
        try:
            items = fetch_items(category["key"], subcategory["key"])
        except Exception as e:
            st.error(f"Failed to load items from backend: {e}")
            st.stop()

        if not items:
            st.info("No vinyl styles found in this sub-collection.")
        else:
            # ── Filters ──
            filter_col, search_col = st.columns([2, 1], gap="medium")

            all_features = sorted({feat for item in items for feat in item.get("active_features", [])})
            with filter_col:
                selected_features = st.multiselect(
                    "🔍 Filter by feature",
                    options=all_features,
                    default=[],
                    placeholder="Show all features…",
                )
            with search_col:
                search_query = st.text_input("🔎 Search by name or code", placeholder="e.g. Oak, LW101…")

            # Apply filters
            def item_matches(item: dict) -> bool:
                if selected_features:
                    active = set(item.get("active_features", []))
                    if not all(f in active for f in selected_features):
                        return False
                if search_query:
                    q = search_query.lower()
                    if q not in item.get("name", "").lower() and q not in item.get("code", "").lower():
                        return False
                return True

            filtered = [i for i in items if item_matches(i)]

            # Stats row
            st.markdown(
                f'<p style="font-size:0.82rem;color:rgba(255,255,255,0.4);margin-bottom:0.8rem;">'
                f'Showing <strong style="color:#c084fc;">{len(filtered)}</strong> '
                f'of <strong style="color:#c084fc;">{len(items)}</strong> styles</p>',
                unsafe_allow_html=True,
            )

            if not filtered:
                st.info("No styles match the selected filters.")
            else:
                COLS = 4
                for row_start in range(0, len(filtered), COLS):
                    row_items = filtered[row_start : row_start + COLS]
                    cols = st.columns(COLS, gap="small")
                    for col, item in zip(cols, row_items):
                        with col:
                            st.markdown('<div class="item-card">', unsafe_allow_html=True)

                            # Image — served by backend /static/
                            image_url = item.get("image_url")
                            if image_url:
                                st.image(image_url, use_container_width=True)
                            else:
                                st.markdown(
                                    '<div class="img-placeholder">🖼</div>',
                                    unsafe_allow_html=True,
                                )

                            # Name + code + page
                            st.markdown(
                                f'<div class="cat-label">{item.get("name", "—")}</div>'
                                f'<div class="cat-code">'
                                f'<strong>{item.get("code", "")}</strong>'
                                f'{"&nbsp;·&nbsp;p." + str(item["page"]) if "page" in item else ""}'
                                f'</div>',
                                unsafe_allow_html=True,
                            )

                            # Feature badges
                            badges = item.get("active_features", [])
                            if badges:
                                st.markdown(feature_badges_html(badges), unsafe_allow_html=True)

                            st.markdown('</div>', unsafe_allow_html=True)

# ─────────────────────────────────────────────
# PAGE: MY PROJECTS
# ─────────────────────────────────────────────
elif "📋 My Projects" in page:

    st.markdown('<div class="section-heading">📋 My Projects (This Session)</div>', unsafe_allow_html=True)

    projects = st.session_state.get("projects", [])

    if not projects:
        st.markdown("""
        <div class="glass-card" style="text-align:center;padding:2rem;">
            <div style="font-size:3rem;">📂</div>
            <div style="color:rgba(255,255,255,0.4);margin-top:0.6rem;">
                No projects yet. Upload a room image to get started!
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        for proj in reversed(projects):
            with st.expander(f"🗂 {proj['filename']}  ·  `{proj['project_id']}`", expanded=False):
                c1, c2 = st.columns([2, 1])
                c1.markdown(f"**Project ID:** `{proj['project_id']}`")
                c1.markdown(f"**Status:** {pill_html(proj['status'])}", unsafe_allow_html=True)
                c1.markdown("**Backend URL:**")
                c1.code(proj.get("image_url", "—"), language="text")
                c2.markdown("**Preview via API:**")
                c2.image(proj["image_url"], width=180)
