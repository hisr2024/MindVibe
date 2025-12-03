"""MindVibe FastAPI backend - KIAAN Integration"""

import os
import sys
import traceback
import ssl
from typing import Any, Awaitable, Callable, Dict
from urllib.parse import parse_qs, urlparse

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


def _connect_args_for_ssl(db_url: str) -> Dict[str, Any]:
    """Build asyncpg connect args to honor sslmode/ssl query params.

    Render Postgres instances require TLS by default. When using asyncpg, the
    ``sslmode=require`` query parameter from the connection string is ignored
    unless we translate it into the ``ssl`` flag expected by asyncpg. This
    helper preserves explicit ``sslmode``/``ssl`` values while defaulting to a
    secure connection when SSL is required.
    """

    parsed = urlparse(db_url)
    query_params = parse_qs(parsed.query)

    ssl_pref = os.getenv("DB_SSL_MODE") or query_params.get("sslmode", [None])[0] or query_params.get("ssl", [None])[0]
    if not ssl_pref:
        return {}

    ssl_pref = ssl_pref.lower()
    if ssl_pref in {"require", "required", "verify-ca", "verify-full", "true", "1"}:
        return {"ssl": ssl.create_default_context()}
    if ssl_pref in {"disable", "false", "0"}:
        return {"ssl": False}

    # Fallback to enabling SSL for unrecognized but present values
    return {"ssl": ssl.create_default_context()}


engine = create_async_engine(DATABASE_URL, echo=False, connect_args=_connect_args_for_ssl(DATABASE_URL))
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

print("\n[Chat Rooms] Loading real-time rooms router...")
try:
    from backend.routes.chat_rooms import router as chat_rooms_router
    app.include_router(chat_rooms_router)
    print("✅ [SUCCESS] Chat rooms router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load chat rooms router: {e}")

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

# Load 2FA router
print("\n[2FA] Attempting to import 2FA router...")
try:
    from backend.routes.two_factor_auth import router as tfa_router
    app.include_router(tfa_router)
    print("✅ [SUCCESS] 2FA router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load 2FA router: {e}")

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

# Load Journal router
print("\n[Journal] Attempting to import Journal router...")
try:
    from backend.routes.journal import router as journal_router
    app.include_router(journal_router)
    print("✅ [SUCCESS] Journal router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Journal router: {e}")

# Load Subscriptions router
print("\n[Subscriptions] Attempting to import Subscriptions router...")
try:
    from backend.routes.subscriptions import router as subscriptions_router
    app.include_router(subscriptions_router)
    print("✅ [SUCCESS] Subscriptions router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Subscriptions router: {e}")

# Load Karmic Tree Analytics router
print("\n[Karmic Tree] Attempting to import Karmic Tree Analytics router...")
try:
    from backend.routes.analytics.karmic_tree import router as karmic_tree_router
    app.include_router(karmic_tree_router, prefix="/api/analytics")
    print("✅ [SUCCESS] Karmic Tree Analytics router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Karmic Tree Analytics router: {e}")

# Load Admin routers
print("\n[Admin] Attempting to import Admin routers...")
admin_routers_loaded = []
try:
    from backend.routes.admin.auth import router as admin_auth_router
    app.include_router(admin_auth_router)
    admin_routers_loaded.append("auth")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Auth router: {e}")

try:
    from backend.routes.admin.users import router as admin_users_router
    app.include_router(admin_users_router)
    admin_routers_loaded.append("users")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Users router: {e}")

try:
    from backend.routes.admin.subscriptions import router as admin_subscriptions_router
    app.include_router(admin_subscriptions_router)
    admin_routers_loaded.append("subscriptions")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Subscriptions router: {e}")

try:
    from backend.routes.admin.moderation import router as admin_moderation_router
    app.include_router(admin_moderation_router)
    admin_routers_loaded.append("moderation")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Moderation router: {e}")

try:
    from backend.routes.admin.feature_flags import router as admin_feature_flags_router
    app.include_router(admin_feature_flags_router)
    admin_routers_loaded.append("feature_flags")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Feature Flags router: {e}")

try:
    from backend.routes.admin.announcements import router as admin_announcements_router
    app.include_router(admin_announcements_router)
    admin_routers_loaded.append("announcements")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Announcements router: {e}")

try:
    from backend.routes.admin.ab_tests import router as admin_ab_tests_router
    app.include_router(admin_ab_tests_router)
    admin_routers_loaded.append("ab_tests")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin A/B Tests router: {e}")

try:
    from backend.routes.admin.audit_logs import router as admin_audit_logs_router
    app.include_router(admin_audit_logs_router)
    admin_routers_loaded.append("audit_logs")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Audit Logs router: {e}")

try:
    from backend.routes.admin.export import router as admin_export_router
    app.include_router(admin_export_router)
    admin_routers_loaded.append("export")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Export router: {e}")

try:
    from backend.routes.admin.kiaan_analytics import router as admin_kiaan_analytics_router
    app.include_router(admin_kiaan_analytics_router)
    admin_routers_loaded.append("kiaan_analytics")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin KIAAN Analytics router: {e}")

if admin_routers_loaded:
    print(f"✅ [SUCCESS] Admin routers loaded: {', '.join(admin_routers_loaded)}")
else:
    print("❌ [ERROR] No Admin routers were loaded")

# Load GDPR/Compliance routers
print("\n[Compliance] Attempting to import Compliance routers...")
compliance_routers_loaded = []
try:
    from backend.routes.gdpr import router as gdpr_router
    app.include_router(gdpr_router)
    compliance_routers_loaded.append("gdpr")
except Exception as e:
    print(f"❌ [ERROR] Failed to load GDPR router: {e}")

try:
    from backend.routes.compliance import router as compliance_router
    app.include_router(compliance_router)
    compliance_routers_loaded.append("compliance")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Compliance router: {e}")

if compliance_routers_loaded:
    print(f"✅ [SUCCESS] Compliance routers loaded: {', '.join(compliance_routers_loaded)}")
else:
    print("❌ [ERROR] No Compliance routers were loaded")

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
