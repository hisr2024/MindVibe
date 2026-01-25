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
from sqlalchemy import text

from backend.core import migrations as migrations_module
from backend.core.migrations import apply_sql_migrations, get_migration_status
from backend.middleware.security import SecurityHeadersMiddleware
from backend.middleware.rate_limiter import limiter
from backend.middleware.logging_middleware import RequestLoggingMiddleware
from backend.middleware.ddos_protection import DDoSProtectionMiddleware
from backend.models import Base

# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "https://mind-vibe-universal.vercel.app,http://localhost:3000,http://localhost:3001"
    ).split(",")
]

# Explicitly list allowed headers (wildcards don't work with credentials: 'include')
ALLOWED_HEADERS = [
    "content-type",
    "authorization",
    "accept",
    "origin",
    "user-agent",
    "x-requested-with",
    "x-csrf-token",
    "cache-control",
]

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

    Render Postgres instances require TLS by default.  When using asyncpg, the
    ``sslmode=require`` query parameter from the connection string is ignored
    unless we translate it into the ``ssl`` flag expected by asyncpg.  This
    helper preserves explicit ``sslmode``/``ssl`` values while defaulting to a
    secure connection with full certificate verification.

    Security Note: By default, this uses verify-full mode with certificate
    verification enabled. Only use require-no-verify for development or when
    connecting to databases with self-signed certificates.
    """
    import ssl as ssl_module
    from urllib.parse import parse_qs, urlparse
    import logging

    logger = logging.getLogger(__name__)
    parsed = urlparse(db_url)
    query_params = parse_qs(parsed.query)

    ssl_pref = os.getenv("DB_SSL_MODE") or query_params.get("sslmode", [None])[0] or query_params.get("ssl", [None])[0]

    # Default to verify-full for maximum security
    if not ssl_pref:
        ssl_pref = "verify-full"

    ssl_pref = ssl_pref.lower()

    # Full verification (RECOMMENDED for production)
    if ssl_pref in {"verify-ca", "verify-full", "true", "1"}:
        return {"ssl": ssl_module.create_default_context()}

    # Require SSL but don't verify certificates (INSECURE - use only if needed)
    if ssl_pref in {"require-no-verify", "require", "required"}:
        logger.warning(
            "Database SSL certificate verification is DISABLED. "
            "This is insecure and should only be used for development. "
            "For production, use DB_SSL_MODE=verify-full"
        )
        ssl_context = ssl_module.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl_module.CERT_NONE
        return {"ssl": ssl_context}

    # Disable SSL (NOT RECOMMENDED)
    if ssl_pref in {"disable", "false", "0"}:
        logger.warning("Database SSL is DISABLED. This is not recommended for production.")
        return {"ssl": False}

    # Fallback to full verification
    return {"ssl": ssl_module.create_default_context()}


engine = create_async_engine(DATABASE_URL, echo=False, connect_args=_connect_args_for_ssl(DATABASE_URL))
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

app = FastAPI(
    title="MindVibe API",
    version="1.0.0",
    description="AI Mental Wellness Coach Backend",
)

# Add DDoS protection middleware (first line of defense)
app.add_middleware(
    DDoSProtectionMiddleware,
    enabled=True,
    max_requests=100,  # 100 requests per minute
    time_window=60,
    max_connections=10,  # 10 concurrent connections per IP
    max_request_size=10 * 1024 * 1024,  # 10MB
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Global exception handler to prevent unhandled 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch all unhandled exceptions and return a proper JSON response.
    This ensures no raw 500 errors leak to clients.
    """
    import logging
    logger = logging.getLogger(__name__)

    # Log the full exception for debugging
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)

    # For wisdom-journey endpoints, return a more graceful response
    if "/wisdom-journey/" in request.url.path:
        return JSONResponse(
            status_code=200,  # Return 200 to allow frontend fallback
            content={
                "error": "server_error",
                "message": "Service temporarily unavailable. Please try again.",
                "_offline": True,
            },
        )

    # For other endpoints, return standard 500 with details
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An unexpected error occurred",
        },
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=ALLOWED_HEADERS,
    # Explicitly list headers instead of wildcard (required with credentials)
    expose_headers=[
        "content-type",
        "content-length",
        "x-csrf-token",
        "x-request-id",
        "x-ratelimit-limit",
        "x-ratelimit-remaining",
        "x-ratelimit-reset",
    ],
    max_age=3600,
)

@app.middleware("http")
async def add_cors(request: Request, call_next: Callable[[Request], Awaitable[JSONResponse]]) -> JSONResponse:
    origin = request.headers.get("origin")

    # Check if origin is allowed
    if origin and origin in ALLOWED_ORIGINS:
        allowed_origin = origin
    else:
        # Fallback to first allowed origin (for non-browser clients)
        allowed_origin = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "*"

    if request.method == "OPTIONS":
        return JSONResponse(
            content={"status": "ok"},
            headers={
                "Access-Control-Allow-Origin": allowed_origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": ", ".join(ALLOWED_HEADERS),
            },
        )

    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = allowed_origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = ", ".join(ALLOWED_HEADERS)
    return response

@app.on_event("startup")
async def startup():
    try:
        # Step 1: Run SQL migrations
        if RUN_MIGRATIONS_ON_STARTUP:
            migration_result = await apply_sql_migrations(engine)
            if migration_result. applied:
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

        # Step 2: Run manual Python migrations
        print("\n🔧 Running manual migrations...")
        try:
            from backend.core.manual_migrations import run_manual_migrations
            manual_results = await run_manual_migrations(engine)
            for migration_name, result in manual_results.items():
                status_icon = "✅" if result['success'] else "⚠️"
                print(f"{status_icon} {migration_name}: {result['message']}")
        except Exception as manual_error:
            print(f"⚠️ Manual migrations had issues: {manual_error}")
            # Don't fail startup - manual migrations are supplementary

        # Step 3: Ensure ORM tables exist (standard SQLAlchemy approach)
        print("\n🔧 Ensuring ORM tables exist...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        print("✅ Database schema ready")
        
    except Exception as exc:
        failed_meta = migrations_module. LATEST_MIGRATION_RESULT
        if failed_meta and failed_meta.failed_file:
            print("❌ [MIGRATIONS] Context for the failure:")
            print(f"   File: {failed_meta.failed_file}")
            if failed_meta. failed_statement:
                print(f"   Statement: {failed_meta.failed_statement}")
        print(f"❌ [MIGRATIONS] Failed to apply migrations: {exc}")
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

# Load Monitoring router
print("\n[Monitoring] Loading monitoring and observability router...")
try:
    from backend.monitoring.health import router as monitoring_router
    app.include_router(monitoring_router)
    print("✅ [SUCCESS] Monitoring router loaded")
    print("   • GET    /api/monitoring/health/detailed - Detailed health check")
    print("   • GET    /api/monitoring/metrics - Application metrics")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Monitoring router: {e}")

# Load Gita API router
print("\n[Gita API] Attempting to import Gita API router...")
try:
    from backend.routes.gita_api import router as gita_router
    app.include_router(gita_router)
    print("✅ [SUCCESS] Gita API router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Gita API router: {e}")

# Load Indian Gita Sources router (authentic Indian data sources)
print("\n[Indian Gita Sources] Attempting to import Indian Gita Sources router...")
try:
    from backend.routes.indian_gita_sources import router as indian_gita_sources_router
    app.include_router(indian_gita_sources_router)
    print("✅ [SUCCESS] Indian Gita Sources router loaded")
    print("   • GET    /api/gita-sources/teachings - Gita teachings for mental health")
    print("   • GET    /api/gita-sources/yoga-paths - Four yoga paths from Gita")
    print("   • GET    /api/gita-sources/meditation - Chapter 6 meditation techniques")
    print("   • GET    /api/gita-sources/sthitaprajna - Qualities of steady wisdom (2.54-72)")
    print("   • GET    /api/gita-sources/karma-yoga - Karma Yoga principles")
    print("   • GET    /api/gita-sources/wisdom/{mood} - Quick wisdom for mood")
    print("   • POST   /api/gita-sources/practice - Practice recommendation")
    print("   • POST   /api/gita-sources/kiaan-wisdom - KIAAN integration endpoint")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Indian Gita Sources router: {e}")

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

# Load Karmic Tree gamification router
print("\n[Karmic Tree] Attempting to import Karmic Tree router...")
try:
    from backend.routes.karmic_tree import router as karmic_tree_router

    app.include_router(karmic_tree_router, prefix="/api")
    print("✅ [SUCCESS] Karmic Tree router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Karmic Tree router: {e}")

# Load Subscriptions router
print("\n[Subscriptions] Attempting to import Subscriptions router...")
try:
    from backend.routes.subscriptions import router as subscriptions_router
    app.include_router(subscriptions_router)
    print("✅ [SUCCESS] Subscriptions router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Subscriptions router: {e}")

# Load Emotional Reset router
print("\n[Emotional Reset] Attempting to import Emotional Reset router...")
try:
    from backend.routes.emotional_reset import router as emotional_reset_router
    app.include_router(emotional_reset_router)
    print("✅ [SUCCESS] Emotional Reset router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Emotional Reset router: {e}")

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

try:
    from backend.routes.admin.voice_analytics import router as admin_voice_analytics_router
    app.include_router(admin_voice_analytics_router)
    admin_routers_loaded.append("voice_analytics")
    print("   • GET    /api/admin/voice/overview - Voice analytics overview")
    print("   • GET    /api/admin/voice/trends - Voice usage trends")
    print("   • GET    /api/admin/voice/quality - Voice quality metrics")
    print("   • GET    /api/admin/voice/enhancements - Enhancement stats")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Admin Voice Analytics router: {e}")

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

# Load Karma Reset router (Viyog, Relationship Compass, Ardha use KIAAN's wisdom system)
print("\n[Karma Reset] Attempting to import Karma Reset router...")
try:
    from backend.routes.karma_reset import router as karma_reset_router
    app.include_router(karma_reset_router)
    print("✅ [SUCCESS] Karma Reset router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Karma Reset router: {e}")

# Load Karma Reset KIAAN Integration router (NEW - enhanced with KIAAN ecosystem)
print("\n[Karma Reset KIAAN] Attempting to import Karma Reset KIAAN router...")
try:
    from backend.routes.karma_reset_kiaan import router as karma_reset_kiaan_router
    app.include_router(karma_reset_kiaan_router)
    print("✅ [SUCCESS] Karma Reset KIAAN router loaded (ecosystem enhanced)")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Karma Reset KIAAN router: {e}")

# Load Progress Reset router (User data reset with comprehensive error handling)
print("\n[Progress Reset] Attempting to import Progress Reset router...")
try:
    from backend.routes.progress_reset import router as progress_reset_router
    app.include_router(progress_reset_router, prefix="/api")
    print("✅ [SUCCESS] Progress Reset router loaded (with transaction rollback)")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Progress Reset router: {e}")

# Load Ardha router
print("\n[Ardha] Attempting to import Ardha router...")
try:
    from backend.routes.ardha import router as ardha_router
    app.include_router(ardha_router)
    print("✅ [SUCCESS] Ardha router loaded with Gita integration")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Ardha router: {e}")

# Load Viyoga router
print("\n[Viyoga] Attempting to import Viyoga router...")
try:
    from backend.routes.viyoga import router as viyoga_router
    app.include_router(viyoga_router)
    print("✅ [SUCCESS] Viyoga router loaded with Gita integration")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Viyoga router: {e}")

# Load Daily Analysis router
print("\n[Daily Analysis] Attempting to import Daily Analysis router...")
try:
    from backend.routes.daily_analysis import router as daily_analysis_router
    app.include_router(daily_analysis_router)
    print("✅ [SUCCESS] Daily Analysis router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Daily Analysis router: {e}")

# Load Sacred Reflections router
print("\n[Sacred Reflections] Attempting to import Sacred Reflections router...")
try:
    from backend.routes.sacred_reflections import router as sacred_reflections_router
    app.include_router(sacred_reflections_router)
    print("✅ [SUCCESS] Sacred Reflections router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Sacred Reflections router: {e}")

# Load Quantum Dive router
print("\n[Quantum Dive] Attempting to import Quantum Dive router...")
try:
    from backend.routes.quantum_dive import router as quantum_dive_router
    app.include_router(quantum_dive_router)
    print("✅ [SUCCESS] Quantum Dive router loaded (Multi-dimensional consciousness analysis)")
    print("   • POST   /api/kiaan/quantum-dive/analyze - Full quantum dive analysis")
    print("   • GET    /api/kiaan/quantum-dive/quick - Quick quantum dive")
    print("   • POST   /api/kiaan/quantum-dive/layer/{layer} - Deep dive into specific layer")
    print("   • GET    /api/kiaan/quantum-dive/voice-summary - Voice-optimized summary")
    print("   • GET    /api/kiaan/quantum-dive/history - Analysis history")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Quantum Dive router: {e}")

# Load Weekly Assessment router
print("\n[Weekly Assessment] Attempting to import Weekly Assessment router...")
try:
    from backend.routes.weekly_assessment import router as weekly_assessment_router
    app.include_router(weekly_assessment_router)
    print("✅ [SUCCESS] Weekly Assessment router loaded")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Weekly Assessment router: {e}")

# Load Translation router
print("\n[Translation] Attempting to import Translation router...")
try:
    from backend.routes.translation import router as translation_router
    app.include_router(translation_router)
    print("✅ [SUCCESS] Translation router loaded")
    print("   • POST   /api/translation/translate - Translate text")
    print("   • POST   /api/translation/preferences - Update language preferences")
    print("   • GET    /api/translation/preferences - Get language preferences")
    print("   • GET    /api/translation/languages - Get supported languages")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Translation router: {e}")

# Load Wisdom Journey router (Quantum Enhancement #1)
print("\n[Wisdom Journey] Attempting to import Wisdom Journey router...")
try:
    from backend.routes.wisdom_journey import router as wisdom_journey_router
    app.include_router(wisdom_journey_router)
    print("✅ [SUCCESS] Wisdom Journey router loaded (Quantum Enhancement)")
    print("   • POST   /api/wisdom-journey/generate - Generate personalized journey")
    print("   • GET    /api/wisdom-journey/active - Get active journey")
    print("   • GET    /api/wisdom-journey/{id} - Get journey details")
    print("   • POST   /api/wisdom-journey/{id}/progress - Mark step complete")
    print("   • PUT    /api/wisdom-journey/{id}/pause - Pause journey")
    print("   • PUT    /api/wisdom-journey/{id}/resume - Resume journey")
    print("   • DELETE /api/wisdom-journey/{id} - Delete journey")
    print("   • GET    /api/wisdom-journey/recommendations/list - Get recommendations")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Wisdom Journey router: {e}")

# Load Enhanced Journeys router (Ṣaḍ-Ripu / Six Inner Enemies)
print("\n[Enhanced Journeys] Attempting to import Enhanced Journeys router...")
try:
    from backend.routes.journeys_enhanced import router as journeys_enhanced_router
    from backend.routes.journeys_enhanced import admin_router as journeys_admin_router
    app.include_router(journeys_enhanced_router)
    app.include_router(journeys_admin_router)
    print("✅ [SUCCESS] Enhanced Journeys router loaded (Ṣaḍ-Ripu)")
    print("   • GET    /api/journeys/catalog - Journey templates catalog")
    print("   • POST   /api/journeys/start - Start multiple journeys")
    print("   • GET    /api/journeys/active - Get active journeys")
    print("   • GET    /api/journeys/today - Today's agenda (all journeys)")
    print("   • POST   /api/journeys/{id}/today - Get/generate today's step")
    print("   • POST   /api/journeys/{id}/steps/{day}/complete - Complete step")
    print("   • POST   /api/journeys/{id}/pause - Pause journey")
    print("   • POST   /api/journeys/{id}/resume - Resume journey")
    print("   • POST   /api/journeys/{id}/abandon - Abandon journey")
    print("   • GET    /api/journeys/{id}/history - Journey history")
    print("   • GET    /api/admin/ai/providers/status - Provider health (admin)")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Enhanced Journeys router: {e}")

# Load Sync router (Quantum Enhancement #2)
print("\n[Sync] Attempting to import Sync router...")
try:
    from backend.routes.sync import router as sync_router
    app.include_router(sync_router)
    print("✅ [SUCCESS] Sync router loaded (Quantum Enhancement #2 - Offline-First)")
    print("   • POST   /api/sync/batch - Batch sync offline operations")
    print("   • POST   /api/sync/pull - Pull server-side changes")
    print("   • GET    /api/sync/status - Sync status and health check")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Sync router: {e}")

# Load Voice router (Quantum Enhancement #3)
print("\n[Voice] Attempting to import Voice router...")
try:
    from backend.routes.voice import router as voice_router
    app.include_router(voice_router, prefix="/api")
    print("✅ [SUCCESS] Voice router loaded (Quantum Enhancement #3 - Multilingual Voice)")
    print("   • POST   /api/voice/synthesize - Synthesize text to speech")
    print("   • POST   /api/voice/verse/{id} - Get verse audio")
    print("   • POST   /api/voice/message - Synthesize KIAAN message")
    print("   • POST   /api/voice/meditation - Synthesize meditation audio")
    print("   • POST   /api/voice/batch-download - Batch download verses")
    print("   • GET    /api/voice/settings - Get voice preferences")
    print("   • PUT    /api/voice/settings - Update voice preferences")
    print("   • GET    /api/voice/supported-languages - List supported languages")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Voice router: {e}")

# Load Divine Consciousness router (Sacred Atmosphere Enhancement)
print("\n[Divine Consciousness] Attempting to import Divine Consciousness router...")
try:
    from backend.routes.divine_consciousness import router as divine_consciousness_router
    app.include_router(divine_consciousness_router, prefix="/api")
    print("✅ [SUCCESS] Divine Consciousness router loaded (Sacred Atmosphere)")
    print("   • GET    /api/divine/atmosphere - Get sacred atmosphere")
    print("   • GET    /api/divine/breathing/{pattern} - Get breathing exercise")
    print("   • GET    /api/divine/meditation/{type} - Get micro-meditation")
    print("   • POST   /api/divine/mood-response - Get sacred mood response")
    print("   • GET    /api/divine/reminder - Get divine reminder")
    print("   • GET    /api/divine/affirmation - Get divine affirmation")
    print("   • GET    /api/divine/greeting - Get time-appropriate greeting")
    print("   • GET    /api/divine/sacred-pause - Get sacred pause")
    print("   • GET    /api/divine/check-in - Get divine check-in")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Divine Consciousness router: {e}")

# Load Journal router
print("\n[Journal] Attempting to import Journal router...")
try:
    from backend.routes.journal import router as journal_router
    app.include_router(journal_router, prefix="/api")
    print("✅ [SUCCESS] Journal router loaded")
    print("   • GET    /api/journal/entries - List journal entries")
    print("   • POST   /api/journal/entries - Create journal entry")
    print("   • POST   /api/journal/quick-save - Quick save content")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Journal router: {e}")

# Load Community router
print("\n[Community] Attempting to import Community router...")
try:
    from backend.routes.community import router as community_router
    app.include_router(community_router)
    print("✅ [SUCCESS] Community router loaded")
    print("   • GET    /api/community/circles - List wisdom circles")
    print("   • POST   /api/community/circles/{id}/join - Join circle")
    print("   • POST   /api/community/posts - Create post")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Community router: {e}")

# Load Analytics router
print("\n[Analytics] Attempting to import Analytics router...")
try:
    from backend.routes.analytics import router as analytics_router
    app.include_router(analytics_router, prefix="/api")
    print("✅ [SUCCESS] Analytics router loaded")
    print("   • GET    /api/analytics/dashboard - Get dashboard data")
    print("   • GET    /api/analytics/overview - Get overview metrics")
    print("   • GET    /api/analytics/mood-trends - Get mood trends")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Analytics router: {e}")

# Load Moods router
print("\n[Moods] Attempting to import Moods router...")
try:
    from backend.routes.moods import router as moods_router
    app.include_router(moods_router, prefix="/api")
    print("✅ [SUCCESS] Moods router loaded")
    print("   • POST   /api/moods - Submit mood entry")
    print("   • GET    /api/moods/micro-response - Get mood analysis")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Moods router: {e}")

# Load Feedback router
print("\n[Feedback] Attempting to import Feedback router...")
try:
    from backend.routes.feedback import router as feedback_router
    app.include_router(feedback_router, prefix="/api")
    print("✅ [SUCCESS] Feedback router loaded")
    print("   • POST   /api/feedback - Submit feedback")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Feedback router: {e}")

# Load Content router
print("\n[Content] Attempting to import Content router...")
try:
    from backend.routes.content import router as content_router
    app.include_router(content_router, prefix="/api")
    print("✅ [SUCCESS] Content router loaded")
    print("   • GET    /api/content/{locale} - Get localized content")
except Exception as e:
    print(f"❌ [ERROR] Failed to load Content router: {e}")

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
