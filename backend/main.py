import os

from fastapi import FastAPI
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
app = FastAPI(title="MindVibe API", version="1.0.0")


@app.on_event("startup")
async def startup() -> None:
    """Initialize database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Import all routers from backend.routes
from backend.routes.chat import router as chat_router  # type: ignore[attr-defined]
from backend.routes.content import (
    router as content_router,  # type: ignore[attr-defined]
)
from backend.routes.gita_api import router as gita_router  # type: ignore[attr-defined]
from backend.routes.journal import (
    router as journal_router,  # type: ignore[attr-defined]
)
from backend.routes.jwk import router as jwk_router  # type: ignore[attr-defined]
from backend.routes.moods import router as moods_router  # type: ignore[attr-defined]

# from backend.routes.auth import router as auth_router  # ← COMMENT THIS OUT (MISSING DEPENDENCIES)
from backend.routes.wisdom_guide import (
    router as wisdom_router,  # type: ignore[attr-defined]
)

# Register all routers
# app.include_router(auth_router)      # ← COMMENT THIS OUT
app.include_router(jwk_router)  # type: ignore[has-type]  # JWK public key endpoint
app.include_router(moods_router)  # type: ignore[has-type]  # Mood tracking API
app.include_router(content_router)  # type: ignore[has-type]  # Content packs API
app.include_router(journal_router)  # type: ignore[has-type]  # Encrypted journal/blob storage
app.include_router(chat_router)  # type: ignore[has-type]  # AI chatbot conversations
app.include_router(wisdom_router)  # type: ignore[has-type]  # Universal wisdom guide API
app.include_router(gita_router)  # type: ignore[has-type]  # Gita verses API




@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for Render deployment."""
    return {
        "status": "healthy",
        "service": "mindvibe-api",
        "version": "1.0.0",
    }


@app.get("/api/health")
async def api_health() -> dict[str, str]:
    """API health status endpoint."""
    return {
        "status": "operational",
        "service": "MindVibe AI",
        "version": "1.0.0",
        "phases": {
            "phase_1": "response_engine ✅",
            "phase_2": "domain_mapper ✅",
            "phase_3": "safety_validator ✅",
            "phase_4": "psychology_patterns ✅",
            "integration": "chatbot_enhanced ✅"
        }
    }
