from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from backend.app.api.route import router

load_dotenv()

app = FastAPI(
    title="Vinyl Wrap Architectural Catalogue & AI Studio API",
    version="2.5.0",
    description="FastAPI backend serving Bodaq vinyl wrap styles catalogue, high-res textures, and wrap simulation"
)

# Enable CORS for Vite dev server and local clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes from backend/app/api/route.py
app.include_router(router)
