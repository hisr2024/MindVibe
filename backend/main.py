import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.models import Base

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

# Fix Render.com DATABASE_URL to use asyncpg instead of psycopg2
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# FastAPI app initialization
app = FastAPI(
    title="MindVibe API",
    version="1.0.0",
    description="AI Mental Wellness Coach Backend",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ✅ CRITICAL: Add CORS middleware BEFORE routes
# This handles OPTIONS preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mindvibe.vercel.app",
        "https://mindvibe-web.vercel.app",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

@app.on_event("startup")
async def startup() -> None:
    """Initialize database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ✅ Import all routers AFTER CORS middleware
from backend.routes.chat import router as chat_router
from backend.routes.content import router as content_router
from backend.routes.journal import router as journal_router
from backend.routes.jwk import router as jwk_router
from backend.routes.moods import router as moods_router
from backend.routes.wisdom_guide import router as wisdom_router
from backend.routes.analytics import router as analytics_router
from backend.routes.monitoring import router as monitoring_router
from backend.routes.feedback import router as feedback_router

# ✅ Register all routers
app.include_router(chat_router)
app.include_router(content_router)
app.include_router(journal_router)
app.include_router(jwk_router)
app.include_router(moods_router)
app.include_router(wisdom_router)
app.include_router(analytics_router)
app.include_router(monitoring_router)
app.include_router(feedback_router)

# ✅ Root endpoints
@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint - API health check."""
    return {
        "message": "MindVibe API is running",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": 60
    }

@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for Render deployment."""
    return {
        "status": "healthy",
        "service": "mindvibe-api",
        "version": "1.0.0",
    }

@app.get("/api/health")
async def api_health() -> dict[str, any]:
    """API health status endpoint."""
    return {
        "status": "operational",
        "service": "MindVibe AI",
        "version": "1.0.0",
        "phases": {
            "phase_1": "response_engine ✅",
            "phase_2": "domain_mapper ✅",
            "phase_3": "safety_validator ✅",
            "phase_4": "psychology_patterns ✅"
        },
        "all_systems": "operational"
    }

# ✅ OPTIONS handler for all routes
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str) -> dict:
    """Handle CORS preflight requests."""
    return {"status": "ok"}
