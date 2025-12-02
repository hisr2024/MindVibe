"""MindVibe FastAPI backend - KIAAN Integration"""

import os
import sys
import traceback
from typing import Any, Awaitable, Callable, Dict

# CRITICAL: Load environment variables BEFORE anything else
from dotenv import load_dotenv
load_dotenv()

print("\n" + "="*80)
print("🕉️  MINDVIBE - STARTUP SEQUENCE")
print("="*80)

# Set API key explicitly for this module
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
print(f"✅ OPENAI_API_KEY found: {bool(OPENAI_API_KEY)}")
print(f"   Length: {len(OPENAI_API_KEY) if OPENAI_API_KEY else 0}")

# Pass to OpenAI before import
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.core.migrations import apply_sql_migrations, get_migration_status
from backend.middleware.security import SecurityHeadersMiddleware
from backend.middleware.rate_limiter import limiter
from backend.models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")
RUN_MIGRATIONS_ON_STARTUP = os.getenv("RUN_MIGRATIONS_ON_STARTUP", "true").lower() in {
    "1",
    "true",
    "yes",
    "on",
}

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

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
async def add_cors(request: Request, call_next: Callable[[Request], Awaitable[JSONResponse]]) -> JSONResponse:
    if request.method == "OPTIONS":
        return JSONResponse(
            content={"status": "ok"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            },
        )
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        if RUN_MIGRATIONS_ON_STARTUP:
            migration_result = await apply_sql_migrations(engine)
            if migration_result.applied:
                print(f"✅ Applied SQL migrations: {', '.join(migration_result.applied)}")
            else:
                print("ℹ️ No new SQL migrations to apply")
        else:
            migration_result = await get_migration_status(engine)
            if migration_result.pending:
                print("⚠️ RUN_MIGRATIONS_ON_STARTUP disabled; pending migrations detected")
                print(f"   Pending: {', '.join(migration_result.pending)}")
            else:
                print("ℹ️ RUN_MIGRATIONS_ON_STARTUP disabled; no pending migrations")
    except Exception as exc:
        print(f"❌ [MIGRATIONS] Failed to apply SQL migrations: {exc}")
        raise

print("\n[1/3] Attempting to import KIAAN chat router...")
kiaan_router_loaded = False

try:
    from backend.routes.chat import router as chat_router
    print("✅ [SUCCESS] Chat router imported successfully")
    
    print("[2/3] Attempting to include router in FastAPI app...")
    app.include_router(chat_router)
    print("✅ [SUCCESS] Chat router included in FastAPI app")
    
    kiaan_router_loaded = True
    print("[3/3] KIAAN Router Status: ✅ OPERATIONAL")
    print("✅ Endpoints now available:")
    print("   • POST   /api/chat/message - KIAAN chat endpoint")
    print("   • GET    /api/chat/health - Health check")
    print("   • GET    /api/chat/about - KIAAN information")
    
except ImportError as e:
    print(f"❌ [IMPORT ERROR] Failed to import chat router:")
    print(f"   Error: {e}")
    traceback.print_exc(file=sys.stdout)
    
except Exception as e:
    print(f"❌ [ERROR] Unexpected error loading chat router:")
    print(f"   Error Type: {type(e).__name__}")
    print(f"   Error Message: {e}")
    traceback.print_exc(file=sys.stdout)

# Load Gita API router
print("\n[Gita API] Attempting to import Gita API router...")
try:
    from backend.routes.gita_api import router as gita_router
    app.include_router(gita_router)
    print("✅ [SUCCESS] Gita API router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Gita API router: {e}")

# Load Auth router
print("\n[Auth] Attempting to import Auth router...")
try:
    from backend.routes.auth import router as auth_router
    app.include_router(auth_router)
    print("✅ [SUCCESS] Auth router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Auth router: {e}")

# Load Profile router
print("\n[Profile] Attempting to import Profile router...")
try:
    from backend.routes.profile import router as profile_router
    app.include_router(profile_router)
    print("✅ [SUCCESS] Profile router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Profile router: {e}")

# Load Karma Footprint router
print("\n[Karma Footprint] Attempting to import Karma Footprint router...")
try:
    from backend.routes.karma_footprint import router as karma_router
    app.include_router(karma_router)
    print("✅ [SUCCESS] Karma Footprint router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Karma Footprint router: {e}")

# Load Guidance Engines router
print("\n[Guidance Engines] Attempting to import Guidance router...")
try:
    from backend.routes.guidance import router as guidance_router
    app.include_router(guidance_router)
    print("✅ [SUCCESS] Guidance router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Guidance router: {e}")

# Load Subscriptions router
print("\n[Subscriptions] Attempting to import Subscriptions router...")
try:
    from backend.routes.subscriptions import router as subscriptions_router
    app.include_router(subscriptions_router)
    print("✅ [SUCCESS] Subscriptions router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Subscriptions router: {e}")

print("="*80)
print(f"KIAAN Router Status: {'✅ LOADED' if kiaan_router_loaded else '❌ FAILED'}")
print("="*80 + "\n")


async def _assert_migrations_healthy() -> dict[str, Any]:
    """Ensure migrations are applied; raise HTTP 503 if not."""

    migration_status = await get_migration_status(engine)
    if migration_status.error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "reason": "migration_failed",
                "message": migration_status.error,
                "failed_file": migration_status.failed_file,
                "failed_statement": migration_status.failed_statement,
                "current_revision": migration_status.current_revision,
            },
        )

    if migration_status.pending:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "reason": "migrations_pending",
                "message": "Pending migrations detected; service unavailable until applied.",
                "pending": migration_status.pending,
                "current_revision": migration_status.current_revision,
                "run_on_startup": RUN_MIGRATIONS_ON_STARTUP,
            },
        )

    return {
        "current_revision": migration_status.current_revision,
        "run_on_startup": RUN_MIGRATIONS_ON_STARTUP,
    }


@app.get("/")
async def root() -> Dict[str, Any]:
    return {
        "message": "MindVibe API is running",
        "version": "1.0.0",
        "status": "healthy",
        "kiaan_loaded": kiaan_router_loaded
    }

@app.get("/health")
async def health() -> Dict[str, Any]:
    migration_state = await _assert_migrations_healthy()
    return {
        "status": "healthy",
        "service": "mindvibe-api",
        "version": "1.0.0",
        "kiaan_ready": kiaan_router_loaded,
        "migration": migration_state,
    }

@app.get("/api/health")
async def api_health() -> Dict[str, Any]:
    migration_state = await _assert_migrations_healthy()
    return {
        "status": "operational" if kiaan_router_loaded else "degraded",
        "service": "MindVibe AI - KIAAN",
        "version": "1.0.0",
        "chat_ready": kiaan_router_loaded,
        "openai_key_present": bool(OPENAI_API_KEY),
        "migration": migration_state,
    }

@app.options("/{full_path:path}")
async def preflight(full_path: str) -> dict[str, str]:
    return {"status": "ok"}
