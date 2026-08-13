"""
Vinyl Wrapper AI — Streamlit Frontend
Connects to FastAPI backend at http://localhost:8000
Catalogue is loaded entirely from the backend API.
"""
#uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
#uv run streamlit run streamlit_app/app.py


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

UPLOAD_DIR = STORAGE / "uploads/raw"
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

/* Sidebar nav radio */
div[data-testid="stSidebar"] .stRadio > label {
    display: none;
}
div[data-testid="stSidebar"] .stRadio div[role="radiogroup"] {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
div[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
    display: flex !important;
    align-items: center !important;
    gap: 0.6rem !important;
    padding: 0.7rem 1rem !important;
    border-radius: 10px !important;
    font-size: 0.97rem !important;
    font-weight: 600 !important;
    color: rgba(255,255,255,0.75) !important;
    background: transparent !important;
    border: 1px solid transparent !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}
div[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover {
    background: rgba(168,85,247,0.12) !important;
    color: #e9d5ff !important;
    border-color: rgba(168,85,247,0.3) !important;
}
div[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:has(input:checked) {
    background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(168,85,247,0.25)) !important;
    color: #ffffff !important;
    border-color: rgba(168,85,247,0.6) !important;
    box-shadow: 0 2px 12px rgba(168,85,247,0.25) !important;
}
div[data-testid="stSidebar"] .stRadio input[type="radio"] {
    display: none !important;
}
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
            f"{API_BASE}/api/v1/projects/upload/",
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
            "project_id": local_path,
            "status": "SAVED_LOCALLY",
            "image_url": local_path.as_uri(),
            "local_path": str(local_path),
            "warning": "Backend offline. File saved locally only.",
        }


def analyze_image_hf(
    file_bytes: bytes,
    filename: str,
    prompt: str,
    show_masks: bool = True,
    show_boxes: bool = True,
) -> dict | None:
    """
    POST /api/v1/projects/analyze
    Returns dict with 'annotated_image_b64', 'description', 'status'
    or dict with 'error' key on failure.
    """
    try:
        resp = requests.post(
            f"{API_BASE}/api/v1/projects/analyze",
            files={"file": (filename, file_bytes, "image/jpeg")},
            data={"prompt": prompt, "show_masks": str(show_masks).lower(), "show_boxes": str(show_boxes).lower()},
            timeout=120,  # HF Space can be slow on cold start
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": resp.json().get("detail", "Analysis failed"), "status_code": resp.status_code}
    except requests.exceptions.ConnectionError:
        return {"error": "Backend offline. Cannot reach analysis endpoint."}
    except requests.exceptions.Timeout:
        return {"error": "Request timed out. The HF Space may be loading — please try again."}


def wrap_surface(original_path: str, mask_path: str, vinyl_image_path: str) -> dict | None:
    """POST /api/v1/projects/wrap — runs the vinyl renderer on the backend."""
    try:
        resp = requests.post(
            f"{API_BASE}/api/v1/projects/wrap",
            data={
                "original_path": original_path,
                "mask_path": mask_path,
                "vinyl_image_path": vinyl_image_path,
            },
            timeout=120,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": resp.json().get("detail", "Wrap failed"), "status_code": resp.status_code}
    except requests.exceptions.ConnectionError:
        return {"error": "Backend offline."}
    except requests.exceptions.Timeout:
        return {"error": "Render timed out — please try again."}

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
    
    st.divider()

    st.markdown('<p style="color:#a78bfa;font-size:0.75rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:0.6rem;">Navigation</p>', unsafe_allow_html=True)

    page = st.radio(
        "Navigation",
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

    # Session state
    for _k, _v in {
        "ai_analysis": None, "ai_analyzing": False,
        "original_path": None, "mask_path": None,
        "rendered_result": None,
        "show_style_picker": False, "selected_style": None,
        "picker_cat": None, "picker_sub": None, "picker_view": "categories",
    }.items():
        if _k not in st.session_state:
            st.session_state[_k] = _v

    col_upload, col_preview = st.columns([1.1, 1], gap="large")

    with col_upload:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown('<div class="section-heading">📤 Upload Room / Floor Image</div>', unsafe_allow_html=True)

        uploaded_file = st.file_uploader(
            "Drag & drop or click to browse",
            type=["jpg", "jpeg", "png", "webp"],
            label_visibility="visible",
            accept_multiple_files=False,
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

            # ── AI Analysis Settings ───────────────────
            st.markdown('<div class="section-heading" style="font-size:0.9rem;">🤖 AI Analysis Settings</div>', unsafe_allow_html=True)
            ai_prompt = st.text_input(
                "Detection Prompt",
                value="",
                placeholder="e.g. floor, wall, furniture…",
                help="Describe what to detect/segment in the image.",
            )
            tog_col1, tog_col2 = st.columns(2)
            show_masks = tog_col1.checkbox("Show Masks", value=True)
            show_boxes = tog_col2.checkbox("Show Boxes", value=True)

            st.divider()

            col_btn_a, col_btn_b = st.columns(2)
            analyze_clicked = col_btn_a.button("🔍 Analyze with AI", use_container_width=True)
            clear_clicked   = col_btn_b.button("🗑 Clear", use_container_width=True)

            if clear_clicked:
                st.session_state["ai_analysis"]   = None
                st.session_state["original_path"] = None
                st.session_state["mask_path"]     = None
                st.session_state["rendered_result"] = None
                st.session_state["selected_style"] = None
                st.session_state["show_style_picker"] = False
                st.rerun()

            # ── Analyze with AI flow ──────────────────
            if analyze_clicked:
                if not ai_prompt.strip():
                    st.warning("⚠️ Please enter a detection prompt before analyzing.")
                elif not api_health():
                    st.error("⚠️ Backend is offline. Start the FastAPI server first.")
                else:
                    st.session_state["ai_analysis"]    = None
                    st.session_state["rendered_result"] = None
                    file_bytes = uploaded_file.getvalue()
                    with st.spinner("🤖 Sending to Hugging Face AI — this may take 20-60 seconds on first run…"):
                        analysis = analyze_image_hf(
                            file_bytes=file_bytes,
                            filename=uploaded_file.name,
                            prompt=ai_prompt.strip(),
                            show_masks=show_masks,
                            show_boxes=show_boxes,
                        )
                    if analysis and "error" not in analysis:
                        st.session_state["ai_analysis"]    = analysis
                        st.session_state["original_path"]  = analysis.get("original_path")
                        st.session_state["mask_path"]      = analysis.get("mask_path")
                        st.success("✅ AI analysis complete! Select a vinyl style and click Wrap It →")
                    else:
                        err = analysis.get("error", "Unknown error") if analysis else "No response"
                        st.error(f"❌ Analysis failed: {err}")
                        st.session_state["ai_analysis"] = None

        st.markdown("</div>", unsafe_allow_html=True)

    # ── RIGHT COLUMN: Preview (raw or annotated) ──────────────────────────────
    with col_preview:
        analysis_result = st.session_state.get("ai_analysis")

        if analysis_result:
            # ── Show AI-annotated result ──────────────
            st.markdown(
                '<div class="section-heading">🤖 AI Analysis Result</div>',
                unsafe_allow_html=True,
            )
            st.markdown('<div class="glass-card" style="min-height:360px;">', unsafe_allow_html=True)

            import base64 as _b64
            from PIL import Image as PILImage
            import io as _io

            annotated_bytes = _b64.b64decode(analysis_result["annotated_image_b64"])
            annotated_img   = PILImage.open(_io.BytesIO(annotated_bytes))
            st.image(annotated_img, caption="AI Annotated Result", use_container_width=True)

            description = analysis_result.get("description", "")
            if description:
                with st.expander("📋 AI Description", expanded=True):
                    st.markdown(
                        f'<div style="font-size:0.88rem;color:rgba(255,255,255,0.82);line-height:1.6;">'
                        f'{description}</div>',
                        unsafe_allow_html=True,
                    )

            st.markdown("<br>", unsafe_allow_html=True)

            # ── Selected style + Wrap It ──────────────
            selected_style = st.session_state.get("selected_style")
            rendered       = st.session_state.get("rendered_result")

            if selected_style:
                st.markdown(f"""
                <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.4);
                            border-radius:12px;padding:0.9rem;margin-bottom:0.8rem;">
                    <div style="font-size:0.72rem;color:#a78bfa;font-weight:700;text-transform:uppercase;
                                letter-spacing:1px;margin-bottom:0.4rem;">✅ Selected Style</div>
                    <div style="display:flex;align-items:center;gap:0.8rem;">
                        <img src="{selected_style['image_url']}" style="width:60px;height:60px;
                             object-fit:cover;border-radius:8px;" />
                        <div>
                            <div style="font-weight:700;color:#e9d5ff;font-size:0.95rem;">
                                {selected_style['name']}</div>
                            <div style="font-size:0.75rem;color:rgba(255,255,255,0.45);">
                                {selected_style['code']} · {selected_style['category']} › {selected_style['subcategory']}
                            </div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                w_col, c_col = st.columns(2)
                with w_col:
                    wrap_clicked = st.button("🎨 Wrap It!", use_container_width=True, key="wrap_it")
                with c_col:
                    if st.button("🔄 Change Style", use_container_width=True, key="change_style"):
                        st.session_state["selected_style"]    = None
                        st.session_state["rendered_result"]   = None
                        st.session_state["show_style_picker"] = True
                        st.session_state["picker_view"]       = "categories"
                        st.rerun()

                if wrap_clicked:
                    orig = st.session_state.get("original_path")
                    mask = st.session_state.get("mask_path")
                    if not orig or not mask:
                        st.error("⚠️ Run Analyze with AI first to generate the mask.")
                    else:
                        with st.spinner("🎨 Rendering vinyl wrap — please wait…"):
                            wrap_result = wrap_surface(
                                original_path=orig,
                                mask_path=mask,
                                vinyl_image_path=selected_style["image_path"],
                            )
                        if wrap_result and "error" not in wrap_result:
                            st.session_state["rendered_result"] = wrap_result
                            st.rerun()
                        else:
                            err = wrap_result.get("error", "Unknown error") if wrap_result else "No response"
                            st.error(f"❌ Wrap failed: {err}")

            else:
                if st.button("🎨 Select a Vinyl Style", use_container_width=True, key="open_picker"):
                    st.session_state["show_style_picker"] = True
                    st.session_state["picker_view"]       = "categories"
                    st.rerun()

            # ── Rendered result ────────────────────────
            if rendered and "rendered_image_b64" in rendered:
                st.divider()
                st.markdown(
                    '<div style="font-size:0.8rem;color:#a78bfa;font-weight:700;'
                    'text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem;">'
                    '✨ Rendered Result</div>',
                    unsafe_allow_html=True,
                )
                import base64 as _b64
                import io as _io
                from PIL import Image as PILImage
                rendered_bytes = _b64.b64decode(rendered["rendered_image_b64"])
                rendered_img   = PILImage.open(_io.BytesIO(rendered_bytes))
                st.image(rendered_img, caption="Vinyl Wrapped", use_container_width=True)

            if st.button("↩ Start Over", use_container_width=True, key="reset_preview"):
                for _k in ["ai_analysis", "original_path", "mask_path",
                           "rendered_result", "selected_style", "show_style_picker"]:
                    st.session_state[_k] = None if _k != "show_style_picker" else False
                st.rerun()

            st.markdown("</div>", unsafe_allow_html=True)

        else:
            # ── Show raw uploaded image or placeholder ──
            st.markdown('<div class="section-heading">🖼 Image Preview</div>', unsafe_allow_html=True)
            st.markdown('<div class="glass-card" style="min-height:360px;"', unsafe_allow_html=True)

            if uploaded_file:
                from PIL import Image as PILImage
                import io
                img_bytes = uploaded_file.getvalue()
                img = PILImage.open(io.BytesIO(img_bytes))
                st.image(img, caption=uploaded_file.name, use_container_width=True)
                st.markdown(
                    '<p style="text-align:center;font-size:0.8rem;color:rgba(255,255,255,0.35);margin-top:0.5rem;">'
                    'Click <strong>🔍 Analyze with AI</strong> to get the annotated result</p>',
                    unsafe_allow_html=True,
                )
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
    # INLINE STYLE PICKER (shown after AI analysis)
    # ─────────────────────────────────────────────
    if st.session_state.get("show_style_picker") and st.session_state.get("ai_analysis"):

        st.divider()
        st.markdown('<div class="section-heading">🎨 Pick a Vinyl Style</div>', unsafe_allow_html=True)

        if not api_health():
            st.error("Backend offline — cannot load catalogue.")
        else:
            picker_view = st.session_state.get("picker_view", "categories")

            # ── helpers ──────────────────────────────
            def picker_go_cats():
                st.session_state["picker_view"] = "categories"
                st.session_state["picker_cat"] = None
                st.session_state["picker_sub"] = None

            def picker_go_subs(cat):
                st.session_state["picker_view"] = "subcategories"
                st.session_state["picker_cat"] = cat

            def picker_go_items(sub):
                st.session_state["picker_view"] = "items"
                st.session_state["picker_sub"] = sub

            # ── LEVEL 1: Categories ──────────────────
            if picker_view == "categories":
                st.markdown(
                    '<p style="color:rgba(255,255,255,0.45);font-size:0.88rem;margin-bottom:1rem;">'
                    'Select a category to browse styles</p>',
                    unsafe_allow_html=True,
                )
                try:
                    cats = fetch_categories()
                except Exception as e:
                    st.error(f"Failed to load categories: {e}")
                    cats = []

                COLS = 3
                for row_start in range(0, len(cats), COLS):
                    row = cats[row_start: row_start + COLS]
                    cols = st.columns(COLS, gap="small")
                    for col, cat in zip(cols, row):
                        with col:
                            st.markdown(f"""
                            <div class="cat-nav-card">
                                <div class="cat-nav-icon">{cat.get("icon","🗂")}</div>
                                <div class="cat-nav-title">{cat.get("label", cat["key"])}</div>
                                <div class="cat-nav-meta">
                                    <span style="color:#a78bfa;font-weight:600;">{cat.get("subcategory_count",0)}</span>
                                    sub-collections ·
                                    <span style="color:#a78bfa;font-weight:600;">{cat.get("total_items",0)}</span>
                                    styles
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                            if st.button(
                                f"{cat.get('label', cat['key'])} →",
                                key=f"picker_cat_{cat['key']}",
                                use_container_width=True,
                            ):
                                picker_go_subs(cat)
                                st.rerun()

            # ── LEVEL 2: Subcategories ───────────────
            elif picker_view == "subcategories":
                picker_cat = st.session_state["picker_cat"]
                bc_col, back_col = st.columns([4, 1])
                with bc_col:
                    st.markdown(
                        f'<div class="breadcrumb">Catalogue'
                        f'<span class="breadcrumb-sep">›</span>'
                        f'{picker_cat.get("icon","")} {picker_cat.get("label","")}</div>',
                        unsafe_allow_html=True,
                    )
                with back_col:
                    st.markdown('<div class="back-btn">', unsafe_allow_html=True)
                    if st.button("← Back", key="picker_back_cats"):
                        picker_go_cats(); st.rerun()
                    st.markdown('</div>', unsafe_allow_html=True)

                try:
                    subs = fetch_subcategories(picker_cat["key"])
                except Exception as e:
                    st.error(f"Failed to load sub-categories: {e}")
                    subs = []

                COLS = 4
                for row_start in range(0, len(subs), COLS):
                    row = subs[row_start: row_start + COLS]
                    cols = st.columns(COLS, gap="small")
                    for col, sub in zip(cols, row):
                        with col:
                            st.markdown(f"""
                            <div class="sub-nav-card">
                                <div style="font-size:1.5rem;">📂</div>
                                <div class="sub-nav-title">{sub["label"]}</div>
                                <div class="sub-nav-count">{sub["item_count"]} styles</div>
                            </div>
                            """, unsafe_allow_html=True)
                            if st.button(
                                "View →",
                                key=f"picker_sub_{picker_cat['key']}_{sub['key']}",
                                use_container_width=True,
                            ):
                                picker_go_items(sub); st.rerun()

            # ── LEVEL 3: Items grid ──────────────────
            elif picker_view == "items":
                picker_cat = st.session_state["picker_cat"]
                picker_sub = st.session_state["picker_sub"]

                bc_col, back_col = st.columns([4, 1])
                with bc_col:
                    st.markdown(
                        f'<div class="breadcrumb">Catalogue'
                        f'<span class="breadcrumb-sep">›</span>'
                        f'{picker_cat.get("icon","")} {picker_cat.get("label","")}'
                        f'<span class="breadcrumb-sep">›</span>'
                        f'{picker_sub.get("label","")}</div>',
                        unsafe_allow_html=True,
                    )
                with back_col:
                    st.markdown('<div class="back-btn">', unsafe_allow_html=True)
                    if st.button("← Back", key="picker_back_subs"):
                        st.session_state["picker_view"] = "subcategories"
                        st.rerun()
                    st.markdown('</div>', unsafe_allow_html=True)

                try:
                    items = fetch_items(picker_cat["key"], picker_sub["key"])
                except Exception as e:
                    st.error(f"Failed to load items: {e}")
                    items = []

                if not items:
                    st.info("No styles found.")
                else:
                    search = st.text_input(
                        "🔎 Search", placeholder="e.g. Oak, LW101…",
                        key="picker_search",
                    )
                    if search:
                        items = [i for i in items if
                                 search.lower() in i.get("name","").lower() or
                                 search.lower() in i.get("code","").lower()]

                    st.caption(f"{len(items)} styles")
                    COLS = 4
                    for row_start in range(0, len(items), COLS):
                        row_items = items[row_start: row_start + COLS]
                        cols = st.columns(COLS, gap="small")
                        for col, item in zip(cols, row_items):
                            with col:
                                st.markdown('<div class="item-card">', unsafe_allow_html=True)
                                if item.get("image_url"):
                                    st.image(item["image_url"], use_container_width=True)
                                else:
                                    st.markdown('<div class="img-placeholder">🖼</div>', unsafe_allow_html=True)

                                st.markdown(
                                    f'<div class="cat-label">{item.get("name","—")}</div>'
                                    f'<div class="cat-code"><strong>{item.get("code","")}</strong></div>',
                                    unsafe_allow_html=True,
                                )
                                if st.button(
                                    "✅ Select",
                                    key=f"pick_{item.get('code','')}__{row_start}",
                                    use_container_width=True,
                                ):
                                    st.session_state["selected_style"] = {
                                        "name": item.get("name", "—"),
                                        "code": item.get("code", ""),
                                        "image_url": item.get("image_url", ""),
                                        "image_path": item.get("image_path", ""),
                                        "category": picker_cat.get("label", picker_cat["key"]),
                                        "subcategory": picker_sub.get("label", picker_sub["key"]),
                                        "page": item.get("page", ""),
                                        "features": item.get("active_features", []),
                                    }
                                    st.session_state["show_style_picker"] = False
                                    st.rerun()
                                st.markdown('</div>', unsafe_allow_html=True)

            # Close picker button
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("✖ Close Style Picker", key="close_picker"):
                st.session_state["show_style_picker"] = False
                st.rerun()


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
        st.session_state.cat_page = 0
        st.session_state["_last_filter"] = ""

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
                PAGE_SIZE = 20
                total_pages = max(1, (len(filtered) + PAGE_SIZE - 1) // PAGE_SIZE)

                # Reset page when filters/search change
                filter_key = str(selected_features) + search_query
                if st.session_state.get("_last_filter") != filter_key:
                    st.session_state.cat_page = 0
                    st.session_state["_last_filter"] = filter_key
                if "cat_page" not in st.session_state:
                    st.session_state.cat_page = 0

                page_items = filtered[
                    st.session_state.cat_page * PAGE_SIZE :
                    (st.session_state.cat_page + 1) * PAGE_SIZE
                ]

                COLS = 4
                for row_start in range(0, len(page_items), COLS):
                    row_items = page_items[row_start : row_start + COLS]
                    cols = st.columns(COLS, gap="small")
                    for col, item in zip(cols, row_items):
                        with col:
                            st.markdown('<div class="item-card">', unsafe_allow_html=True)

                            # Thumbnail served by backend
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

                # Pagination controls
                if total_pages > 1:
                    st.divider()
                    p_left, p_mid, p_right = st.columns([1, 2, 1])
                    with p_left:
                        if st.session_state.cat_page > 0:
                            if st.button("← Prev", use_container_width=True, key="pg_prev"):
                                st.session_state.cat_page -= 1
                                st.rerun()
                    with p_mid:
                        st.markdown(
                            f'<p style="text-align:center;color:rgba(255,255,255,0.5);'
                            f'font-size:0.85rem;margin-top:0.5rem;">'
                            f'Page {st.session_state.cat_page + 1} / {total_pages} '
                            f'({len(filtered)} styles)</p>',
                            unsafe_allow_html=True,
                        )
                    with p_right:
                        if st.session_state.cat_page < total_pages - 1:
                            if st.button("Next →", use_container_width=True, key="pg_next"):
                                st.session_state.cat_page += 1
                                st.rerun()

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
