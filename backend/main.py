import sys
import os
import uvicorn

# Ensure parent and backend paths are in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    is_prod = bool(os.environ.get("RENDER") or os.environ.get("PORT"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=not is_prod)
