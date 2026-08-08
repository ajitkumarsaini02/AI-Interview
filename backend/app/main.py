import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from datetime import datetime, timezone
from dotenv import load_dotenv

# Load .env file
root_env = os.path.abspath(os.path.join(os.getcwd(), "..", ".env"))
if os.path.exists(root_env):
    load_dotenv(root_env)
load_dotenv()


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.routes.interview import router as interview_router

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as err:
    print(f"Warning: Database initialization error: {err}")

app = FastAPI(
    title="AI Technical Interview Agent Backend",
    description="Python FastAPI backend powering multi-turn adaptive AI interviews.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router, prefix="/api")


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "AI Technical Interview Agent Backend API is running.",
        "health": "/health",
        "endpoints": {
            "candidates": "/api/candidates",
            "curriculum": "/api/curriculum",
            "interview": "/api/interview",
        },
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "backend": "Python FastAPI",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "4000"))
    print(f"🚀 Starting FastAPI backend on http://localhost:{port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
