import sys
import os
from pathlib import Path

# Ensure backend and root paths are in sys.path
file_path = Path(__file__).resolve()
backend_dir = file_path.parent.parent
root_dir = backend_dir.parent

for path_str in [str(backend_dir), str(root_dir)]:
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

try:
    from app.api.route import router
except ImportError:
    from backend.app.api.route import router 

load_dotenv()

app = FastAPI(
    title="Vinyl Wrap Architectural Catalogue & AI Studio API",
    version="2.5.0",
    description="FastAPI backend serving Bodaq vinyl wrap styles catalogue, high-res textures, and wrap simulation"
)

cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
if cors_origins_env == "*":
    allow_origins = ["*"]
else:
    allow_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# Enable CORS for Vite dev server, local clients, and deployed frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Vinyl Wrap Architectural Catalogue & AI Studio API",
        "version": "2.5.0",
        "docs": "/docs",
        "health": "/api/health"
    }

# Include all API routes from backend/app/api/route.py
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    is_prod = bool(os.environ.get("RENDER") or os.environ.get("PORT"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=not is_prod)

