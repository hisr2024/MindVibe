from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import os

from backend.models import Base

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")
gine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# FastAPI app initialization
app = FastAPI(title="MindVibe API", version="1.0.0")

@app.on_event("startup")
async def startup():
    """Initialize database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Import all routers from backend.routes
from backend.routes.moods import router as moods_router
from backend.routes.content import router as content_router
from backend.routes.journal import router as journal_router
from backend.routes.jwk import router as jwk_router
from backend.routes.chat import router as chat_router
from backend.routes.auth import router as auth_router
from backend.routes.wisdom_guide import router as wisdom_router
from backend.routes.gita_api import router as gita_router

# Register all routers
app.include_router(auth_router)      # Authentication & sessions
app.include_router(jwk_router)       # JWK public key endpoint
app.include_router(moods_router)     # Mood tracking API
app.include_router(content_router)   # Content packs API
app.include_router(journal_router)   # Encrypted journal/blob storage
app.include_router(chat_router)      # AI chatbot conversations
app.include_router(wisdom_router)    # Universal wisdom guide API
app.include_router(gita_router)      # Gita verses API

@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "MindVibe API is running",
        "version": "1.0.0",
        "status": "healthy"
    }