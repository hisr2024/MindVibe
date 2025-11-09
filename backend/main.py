import os
from typing import Dict, Any
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.models import Base

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

app = FastAPI(
    title="MindVibe API",
    version="1.0.0",
    description="AI Mental Wellness Coach Backend",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        return JSONResponse(
            content={"status": "ok"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Max-Age": "3600",
            },
        )
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.on_event("startup")
async def startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ✅ ONLY IMPORT SAFE ROUTES
try:
    from backend.routes.chat import router as chat_router
    app.include_router(chat_router)
except Exception as e:
    print(f"Skipping chat router: {e}")

try:
    from backend.routes.journal import router as journal_router
    app.include_router(journal_router)
except Exception as e:
    print(f"Skipping journal router: {e}")

try:
    from backend.routes.moods import router as moods_router
    app.include_router(moods_router)
except Exception as e:
    print(f"Skipping moods router: {e}")

try:
    from backend.routes.wisdom_guide import router as wisdom_router
    app.include_router(wisdom_router)
except Exception as e:
    print(f"Skipping wisdom router: {e}")

# HEALTH ENDPOINTS (no type issues)
@app.get("/")
async def root():
    return {"message": "MindVibe API is running", "version": "1.0.0", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "mindvibe-api", "version": "1.0.0"}

@app.get("/api/health")
async def api_health():
    return {"status": "operational", "service": "MindVibe AI", "version": "1.0.0", "all_systems": "operational"}

@app.options("/{full_path:path}")
async def preflight(full_path: str):
    return {"status": "ok"}
