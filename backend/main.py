import os
from typing import Dict, Any
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
)

# ✅ CRITICAL FIX: Proper CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mind-vibe-universal.vercel.app",
        "https://mindvibe.vercel.app",
        "https://mindvibe-web.vercel.app",
        "https://mindvibe-api.onrender.com",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ✅ Custom middleware to ensure CORS headers are always present
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Ensure CORS headers are present in all responses."""
    
    # Handle OPTIONS requests
    if request.method == "OPTIONS":
        return JSONResponse(
            content={"status": "ok"},
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": request.headers.get("access-control-request-headers", "*"),
                "Access-Control-Max-Age": "3600",
                "Access-Control-Allow-Credentials": "true",
            },
        )
    
    # Process request
    response = await call_next(request)
    
    # Add CORS headers to response
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("origin", "*")
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

@app.on_event("startup")
async def startup() -> None:
    """Initialize database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ✅ Import all routers - AFTER middleware setup
try:
    from backend.routes.chat import router as chat_router
except ImportError as e:
    print(f"Warning: Could not import chat router: {e}")
    chat_router = None

try:
    from backend.routes.content import router as content_router
except ImportError as e:
    print(f"Warning: Could not import content router: {e}")
    content_router = None

try:
    from backend.routes.journal import router as journal_router
except ImportError as e:
    print(f"Warning: Could not import journal router: {e}")
    journal_router = None

try:
    from backend.routes.jwk import router as jwk_router
except ImportError as e:
    print(f"Warning: Could not import jwk router: {e}")
    jwk_router = None

try:
    from backend.routes.moods import router as moods_router
except ImportError as e:
    print(f"Warning: Could not import moods router: {e}")
    moods_router = None

try:
    from backend.routes.wisdom_guide import router as wisdom_router
except ImportError as e:
    print(f"Warning: Could not import wisdom_guide router: {e}")
    wisdom_router = None

try:
    from backend.routes.analytics import router as analytics_router
except ImportError as e:
    print(f"Warning: Could not import analytics router: {e}")
    analytics_router = None

try:
    from backend.routes.monitoring import router as monitoring_router
except ImportError as e:
    print(f"Warning: Could not import monitoring router: {e}")
    monitoring_router = None

try:
    from backend.routes.feedback import router as feedback_router
except ImportError as e:
    print(f"Warning: Could not import feedback router: {e}")
    feedback_router = None

# ✅ Register only routers that loaded successfully
routers = [
    chat_router,
    content_router,
    journal_router,
    jwk_router,
    moods_router,
    wisdom_router,
    analytics_router,
    monitoring_router,
    feedback_router,
]

for router in routers:
    if router is not None:
        app.include_router(router)

# ✅ Root endpoints - WITH PROPER TYPE HINTS
@app.get("/", response_model=None)
async def root() -> Dict[str, Any]:
    """Root endpoint."""
    return {
        "message": "MindVibe API is running",
        "version": "1.0.0",
        "status": "healthy",
    }

@app.get("/health", response_model=None)
async def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "mindvibe-api",
        "version": "1.0.0",
    }

@app.get("/api/health", response_model=None)
async def api_health() -> Dict[str, Any]:
    """API health status endpoint."""
    return {
        "status": "operational",
        "service": "MindVibe AI",
        "version": "1.0.0",
        "all_systems": "operational"
    }
