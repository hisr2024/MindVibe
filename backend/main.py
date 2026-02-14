"""MindVibe FastAPI backend - KIAAN Integration"""

import logging
import os
import sys
import traceback
import ssl
from typing import Any, Awaitable, Callable, Dict
from urllib.parse import parse_qs, urlparse

# Configure logging early
logging.basicConfig(level=logging.INFO, format='%(message)s')
startup_logger = logging.getLogger("mindvibe.startup")

# Install in-memory log handler so backend logs are available via admin API
from backend.routes.admin.backend_logs import install_log_handler
install_log_handler()

# CRITICAL: Load environment variables BEFORE anything else
from dotenv import load_dotenv
load_dotenv()

startup_logger.info("")
startup_logger.info("=" * 80)
startup_logger.info("🕉️  MINDVIBE - STARTUP SEQUENCE")
startup_logger.info("=" * 80)

# Set API key explicitly for this module
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
startup_logger.info(f"✅ OPENAI_API_KEY: {'configured' if OPENAI_API_KEY else 'missing'}")

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
from backend.middleware.threat_detection import ThreatDetectionMiddleware
from backend.middleware.input_sanitizer import InputSanitizerMiddleware
from backend.middleware.csrf import CSRFMiddleware
from backend.models import Base

# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "https://mind-vibe-universal.vercel.app,https://www.mindvibe.life,https://mindvibe.life,http://localhost:3000,http://localhost:3001"
    ).split(",")
]

# Log CORS configuration at startup for debugging
startup_logger.info(f"✅ CORS allowed origins: {ALLOWED_ORIGINS}")

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

    Render Postgres instances require TLS by default but use self-signed
    certificates. When using asyncpg, the ``sslmode=require`` query parameter
    from the connection string is ignored unless we translate it into the
    ``ssl`` flag expected by asyncpg.

    Auto-detection:
    - Render environment: defaults to 'require' (SSL without cert verification)
    - Other environments: defaults to 'require' for compatibility
    - Override with DB_SSL_MODE environment variable
    """
    import ssl as ssl_module
    from urllib.parse import parse_qs, urlparse
    import logging

    logger = logging.getLogger(__name__)
    parsed = urlparse(db_url)
    query_params = parse_qs(parsed.query)

    ssl_pref = os.getenv("DB_SSL_MODE") or query_params.get("sslmode", [None])[0] or query_params.get("ssl", [None])[0]

    # Auto-detect Render environment (Render sets RENDER=true)
    is_render = os.getenv("RENDER", "").lower() == "true"

    # Default to 'require' for Render (self-signed certs) and general compatibility
    if not ssl_pref:
        ssl_pref = "require"
        if is_render:
            logger.info("Render environment detected - using SSL without certificate verification")

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


# Import engine and SessionLocal from deps.py to ensure single database connection pool
# This avoids duplicate engines with potentially different SSL configurations
from backend.deps import engine, SessionLocal

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

# Add threat detection middleware (malware, ransomware, trojans, injections)
app.add_middleware(
    ThreatDetectionMiddleware,
    enabled=True,
    log_threats=True,
    block_threats=True,
)

# Add input sanitization middleware (XSS, SQL injection, path traversal)
app.add_middleware(
    InputSanitizerMiddleware,
    sanitize_input=False,  # Don't alter input, just detect
    log_suspicious=True,
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Add CSRF protection middleware
app.add_middleware(
    CSRFMiddleware,
    cookie_secure=os.getenv("ENVIRONMENT", "development") == "production",
    cookie_samesite="strict",
)

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

    # Get origin for CORS headers
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        cors_origin = origin
    elif origin.replace("https://www.", "https://") in ALLOWED_ORIGINS:
        cors_origin = origin  # Allow www variant
    elif origin.replace("https://", "https://www.") in ALLOWED_ORIGINS:
        cors_origin = origin  # Allow non-www variant
    else:
        cors_origin = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "https://mind-vibe-universal.vercel.app"

    cors_headers = {
        "Access-Control-Allow-Origin": cors_origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": ", ".join(ALLOWED_HEADERS),
    }

    # Return proper HTTP status codes - never mask 500s as 200s
    # The frontend should handle error status codes gracefully
    return JSONResponse(
        status_code=503,
        content={
            "error": "service_unavailable",
            "detail": "An unexpected error occurred. Please try again.",
        },
        headers=cors_headers,
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

    # Check if origin is allowed - be more flexible with www/non-www variants
    if origin and origin in ALLOWED_ORIGINS:
        allowed_origin = origin
    elif origin:
        # Check for www/non-www variant
        if origin.startswith("https://www."):
            non_www = origin.replace("https://www.", "https://")
            if non_www in ALLOWED_ORIGINS:
                allowed_origin = origin  # Allow the www variant
            else:
                allowed_origin = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "https://mind-vibe-universal.vercel.app"
        elif origin.startswith("https://"):
            www_variant = origin.replace("https://", "https://www.")
            if www_variant in ALLOWED_ORIGINS:
                allowed_origin = origin  # Allow the non-www variant
            else:
                allowed_origin = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "https://mind-vibe-universal.vercel.app"
        else:
            allowed_origin = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "https://mind-vibe-universal.vercel.app"
    else:
        # Fallback to first allowed origin (for non-browser clients)
        allowed_origin = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "https://mind-vibe-universal.vercel.app"

    cors_headers = {
        "Access-Control-Allow-Origin": allowed_origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": ", ".join(ALLOWED_HEADERS),
    }

    if request.method == "OPTIONS":
        return JSONResponse(
            content={"status": "ok"},
            headers=cors_headers,
        )

    try:
        response = await call_next(request)
        # Add CORS headers to successful response
        for key, value in cors_headers.items():
            response.headers[key] = value
        return response
    except Exception as e:
        # Ensure CORS headers are added even when errors occur
        logger = logging.getLogger("mindvibe.cors")
        logger.error(f"Error in request processing: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers=cors_headers,
        )

@app.on_event("startup")
async def startup():
    try:
        # Step 1: Run SQL migrations
        if RUN_MIGRATIONS_ON_STARTUP:
            migration_result = await apply_sql_migrations(engine)
            if migration_result.applied:
                startup_logger.info(f"✅ Applied SQL migrations: {', '.join(migration_result.applied)}")
            else:
                startup_logger.info("ℹ️ No new SQL migrations to apply")
        else:
            migration_result = await get_migration_status(engine)
            if migration_result.pending:
                startup_logger.info("⚠️ RUN_MIGRATIONS_ON_STARTUP disabled; pending migrations detected")
                startup_logger.info(f"   Pending: {', '.join(migration_result.pending)}")
            else:
                startup_logger.info("ℹ️ RUN_MIGRATIONS_ON_STARTUP disabled; no pending migrations")

        # Step 2: Run manual Python migrations
        startup_logger.info("\n🔧 Running manual migrations...")
        try:
            from backend.core.manual_migrations import run_manual_migrations
            manual_results = await run_manual_migrations(engine)
            for migration_name, result in manual_results.items():
                status_icon = "✅" if result['success'] else "⚠️"
                startup_logger.info(f"{status_icon} {migration_name}: {result['message']}")
        except Exception as manual_error:
            startup_logger.info(f"⚠️ Manual migrations had issues: {manual_error}")
            # Don't fail startup - manual migrations are supplementary

        # Step 3: Ensure ORM tables exist (standard SQLAlchemy approach)
        startup_logger.info("\n🔧 Ensuring ORM tables exist...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        startup_logger.info("✅ Database schema ready")

        # Step 4: Seed subscription plans if they don't exist
        startup_logger.info("\n🔧 Ensuring subscription plans exist...")
        try:
            from backend.scripts.seed_subscription_plans import seed_subscription_plans
            await seed_subscription_plans(str(engine.url))
            startup_logger.info("✅ Subscription plans ready")
        except Exception as seed_error:
            startup_logger.info(f"⚠️ Subscription plan seeding had issues: {seed_error}")
            # Don't fail startup - but log the warning

        # Step 5: Initialize KIAAN 24/7 Learning Daemon (Autonomous Gita Wisdom)
        startup_logger.info("\n🕉️ Initializing KIAAN 24/7 Learning Daemon...")
        try:
            from backend.services.kiaan_learning_daemon import get_learning_daemon

            daemon = get_learning_daemon()

            # Start the 24/7 daemon
            import asyncio
            asyncio.create_task(daemon.start())

            startup_logger.info(f"✅ KIAAN 24/7 Learning Daemon starting")
            startup_logger.info(f"   • Mode: CONTINUOUS (24/7)")
            startup_logger.info(f"   • YouTube fetch interval: 30 minutes")
            startup_logger.info(f"   • Audio fetch interval: 1 hour")
            startup_logger.info(f"   • Web fetch interval: 1 hour")
            startup_logger.info(f"   • Auto-recovery: Enabled (exponential backoff)")
            startup_logger.info(f"   • Health monitoring: Enabled")
            startup_logger.info(f"   • Sources: YouTube, Audio Platforms, Web")
            startup_logger.info(f"   • Compliance: Strict Bhagavad Gita only")
        except Exception as daemon_error:
            startup_logger.info(f"⚠️ KIAAN Learning Daemon initialization had issues: {daemon_error}")
            # Fallback to legacy scheduler
            try:
                from backend.services.kiaan_learning_engine import get_kiaan_learning_engine
                learning_engine = get_kiaan_learning_engine()
                learning_engine.start_scheduler()
                startup_logger.info(f"✅ Fallback: KIAAN Learning Scheduler started (every 6 hours)")
            except Exception as fallback_error:
                startup_logger.info(f"⚠️ KIAAN Learning System fallback failed: {fallback_error}")
            # Don't fail startup - learning is supplementary

    except Exception as exc:
        failed_meta = migrations_module.LATEST_MIGRATION_RESULT
        if failed_meta and failed_meta.failed_file:
            startup_logger.info("❌ [MIGRATIONS] Context for the failure:")
            startup_logger.info(f"   File: {failed_meta.failed_file}")
            if failed_meta.failed_statement:
                startup_logger.info(f"   Statement: {failed_meta.failed_statement}")
        startup_logger.info(f"❌ [MIGRATIONS] Failed to apply migrations: {exc}")
        raise


@app.on_event("shutdown")
async def shutdown():
    """Cleanup resources on application shutdown."""
    startup_logger.info("\n🛑 MINDVIBE - SHUTDOWN SEQUENCE")

    # Stop KIAAN 24/7 Learning Daemon
    try:
        from backend.services.kiaan_learning_daemon import get_learning_daemon
        daemon = get_learning_daemon()
        await daemon.stop()
        startup_logger.info("✅ KIAAN 24/7 Learning Daemon stopped")
    except Exception as e:
        startup_logger.info(f"⚠️ Error stopping KIAAN daemon: {e}")

    # Stop legacy scheduler if running
    try:
        from backend.services.kiaan_learning_engine import get_kiaan_learning_engine
        learning_engine = get_kiaan_learning_engine()
        learning_engine.stop_scheduler()
        startup_logger.info("✅ KIAAN Learning Scheduler stopped")
    except Exception as e:
        startup_logger.info(f"⚠️ Error stopping KIAAN scheduler: {e}")

    # Dispose database engine
    try:
        await engine.dispose()
        startup_logger.info("✅ Database engine disposed")
    except Exception as e:
        startup_logger.info(f"⚠️ Error disposing database engine: {e}")

    # Close Redis connections if available
    try:
        from backend.cache.redis_cache import get_redis_cache
        redis_cache = await get_redis_cache()
        if redis_cache and hasattr(redis_cache, '_client') and redis_cache._client:
            await redis_cache._client.close()
            startup_logger.info("✅ Redis connection closed")
    except Exception as e:
        startup_logger.info(f"⚠️ Error closing Redis connection: {e}")

    startup_logger.info("✅ Shutdown complete")


startup_logger.info("\n[1/3] Attempting to import KIAAN chat router...")
kiaan_router_loaded = False

try:
    from backend.routes.chat import router as chat_router
    startup_logger.info("✅ [SUCCESS] Chat router imported successfully")

    startup_logger.info("[2/3] Attempting to include router in FastAPI app...")
    app.include_router(chat_router)
    startup_logger.info("✅ [SUCCESS] Chat router included in FastAPI app")

    kiaan_router_loaded = True
    startup_logger.info("[3/3] KIAAN Router Status: ✅ OPERATIONAL")
    startup_logger.info("✅ Endpoints now available:")
    startup_logger.info("   • POST   /api/chat/message - KIAAN chat endpoint")
    startup_logger.info("   • GET    /api/chat/health - Health check")
    startup_logger.info("   • GET    /api/chat/about - KIAAN information")

except ImportError as e:
    startup_logger.info(f"❌ [IMPORT ERROR] Failed to import chat router:")
    startup_logger.info(f"   Error: {e}")
    traceback.print_exc(file=sys.stdout)
    
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Unexpected error loading chat router:")
    startup_logger.info(f"   Error Type: {type(e).__name__}")
    startup_logger.info(f"   Error Message: {e}")
    traceback.print_exc(file=sys.stdout)

startup_logger.info("\n[Chat Rooms] Loading real-time rooms router...")
try:
    from backend.routes.chat_rooms import router as chat_rooms_router
    app.include_router(chat_rooms_router)
    startup_logger.info("✅ [SUCCESS] Chat rooms router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load chat rooms router: {e}")

# Load Monitoring router
startup_logger.info("\n[Monitoring] Loading monitoring and observability router...")
try:
    from backend.monitoring.health import router as monitoring_router
    app.include_router(monitoring_router)
    startup_logger.info("✅ [SUCCESS] Monitoring router loaded")
    startup_logger.info("   • GET    /api/monitoring/health/detailed - Detailed health check")
    startup_logger.info("   • GET    /api/monitoring/metrics - Application metrics")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Monitoring router: {e}")

# Load Gita API router
startup_logger.info("\n[Gita API] Attempting to import Gita API router...")
try:
    from backend.routes.gita_api import router as gita_router
    app.include_router(gita_router)
    startup_logger.info("✅ [SUCCESS] Gita API router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Gita API router: {e}")

# Load Indian Gita Sources router (authentic Indian data sources)
startup_logger.info("\n[Indian Gita Sources] Attempting to import Indian Gita Sources router...")
try:
    from backend.routes.indian_gita_sources import router as indian_gita_sources_router
    app.include_router(indian_gita_sources_router)
    startup_logger.info("✅ [SUCCESS] Indian Gita Sources router loaded")
    startup_logger.info("   • GET    /api/gita-sources/teachings - Gita teachings for mental health")
    startup_logger.info("   • GET    /api/gita-sources/yoga-paths - Four yoga paths from Gita")
    startup_logger.info("   • GET    /api/gita-sources/meditation - Chapter 6 meditation techniques")
    startup_logger.info("   • GET    /api/gita-sources/sthitaprajna - Qualities of steady wisdom (2.54-72)")
    startup_logger.info("   • GET    /api/gita-sources/karma-yoga - Karma Yoga principles")
    startup_logger.info("   • GET    /api/gita-sources/wisdom/{mood} - Quick wisdom for mood")
    startup_logger.info("   • POST   /api/gita-sources/practice - Practice recommendation")
    startup_logger.info("   • POST   /api/gita-sources/kiaan-wisdom - KIAAN integration endpoint")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Indian Gita Sources router: {e}")

# Load Auth router
startup_logger.info("\n[Auth] Attempting to import Auth router...")
try:
    from backend.routes.auth import router as auth_router
    app.include_router(auth_router)
    startup_logger.info("✅ [SUCCESS] Auth router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Auth router: {e}")

# NOTE: 2FA endpoints are included in auth.py router (no separate import needed)
# The two_factor_auth.py module exists for reference but endpoints are in auth.py
startup_logger.info("\n[2FA] 2FA endpoints included in Auth router")

# Load Profile router
startup_logger.info("\n[Profile] Attempting to import Profile router...")
try:
    from backend.routes.profile import router as profile_router
    app.include_router(profile_router)
    startup_logger.info("✅ [SUCCESS] Profile router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Profile router: {e}")

# Load Karma Footprint router
startup_logger.info("\n[Karma Footprint] Attempting to import Karma Footprint router...")
try:
    from backend.routes.karma_footprint import router as karma_router
    app.include_router(karma_router)
    startup_logger.info("✅ [SUCCESS] Karma Footprint router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Karma Footprint router: {e}")

# Load Guidance Engines router
startup_logger.info("\n[Guidance Engines] Attempting to import Guidance router...")
try:
    from backend.routes.guidance import router as guidance_router
    app.include_router(guidance_router)
    startup_logger.info("✅ [SUCCESS] Guidance router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Guidance router: {e}")

# Load Karmic Tree gamification router
startup_logger.info("\n[Karmic Tree] Attempting to import Karmic Tree router...")
try:
    from backend.routes.karmic_tree import router as karmic_tree_router

    app.include_router(karmic_tree_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Karmic Tree router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Karmic Tree router: {e}")

# Load Subscriptions router
startup_logger.info("\n[Subscriptions] Attempting to import Subscriptions router...")
try:
    from backend.routes.subscriptions import router as subscriptions_router
    app.include_router(subscriptions_router)
    startup_logger.info("✅ [SUCCESS] Subscriptions router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Subscriptions router: {e}")

# Load Wisdom Guide router
startup_logger.info("\n[Wisdom Guide] Attempting to import Wisdom Guide router...")
try:
    from backend.routes.wisdom_guide import router as wisdom_guide_router
    app.include_router(wisdom_guide_router)
    startup_logger.info("✅ [SUCCESS] Wisdom Guide router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Wisdom Guide router: {e}")

# Load Emotional Reset router
startup_logger.info("\n[Emotional Reset] Attempting to import Emotional Reset router...")
try:
    from backend.routes.emotional_reset import router as emotional_reset_router
    app.include_router(emotional_reset_router)
    startup_logger.info("✅ [SUCCESS] Emotional Reset router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Emotional Reset router: {e}")

# Load Karmic Tree Analytics router
startup_logger.info("\n[Karmic Tree] Attempting to import Karmic Tree Analytics router...")
try:
    from backend.routes.analytics.karmic_tree import router as analytics_karmic_tree_router
    app.include_router(analytics_karmic_tree_router, prefix="/api/analytics")
    startup_logger.info("✅ [SUCCESS] Karmic Tree Analytics router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Karmic Tree Analytics router: {e}")

# Load main Analytics router (overview, mood-trends, journal-stats, kiaan-insights, etc.)
startup_logger.info("\n[Analytics] Attempting to import Analytics router...")
try:
    from backend.routes.analytics_dashboard import router as analytics_router
    app.include_router(analytics_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Analytics router loaded")
    startup_logger.info("   • GET    /api/analytics/overview - Overview metrics")
    startup_logger.info("   • GET    /api/analytics/mood-trends - Mood trend data")
    startup_logger.info("   • GET    /api/analytics/journal-stats - Journal statistics")
    startup_logger.info("   • GET    /api/analytics/kiaan-insights - KIAAN insights")
    startup_logger.info("   • GET    /api/analytics/weekly-summary - Weekly summary")
    startup_logger.info("   • GET    /api/analytics/achievements - Achievements")
    startup_logger.info("   • POST   /api/analytics/export - Export data")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Analytics router: {e}")

# Load Admin routers
startup_logger.info("\n[Admin] Attempting to import Admin routers...")
admin_routers_loaded = []
try:
    from backend.routes.admin.auth import router as admin_auth_router
    app.include_router(admin_auth_router)
    admin_routers_loaded.append("auth")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Auth router: {e}")

try:
    from backend.routes.admin.users import router as admin_users_router
    app.include_router(admin_users_router)
    admin_routers_loaded.append("users")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Users router: {e}")

try:
    from backend.routes.admin.subscriptions import router as admin_subscriptions_router
    app.include_router(admin_subscriptions_router)
    admin_routers_loaded.append("subscriptions")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Subscriptions router: {e}")

try:
    from backend.routes.admin.moderation import router as admin_moderation_router
    app.include_router(admin_moderation_router)
    admin_routers_loaded.append("moderation")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Moderation router: {e}")

try:
    from backend.routes.admin.feature_flags import router as admin_feature_flags_router
    app.include_router(admin_feature_flags_router)
    admin_routers_loaded.append("feature_flags")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Feature Flags router: {e}")

try:
    from backend.routes.admin.announcements import router as admin_announcements_router
    app.include_router(admin_announcements_router)
    admin_routers_loaded.append("announcements")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Announcements router: {e}")

try:
    from backend.routes.admin.ab_tests import router as admin_ab_tests_router
    app.include_router(admin_ab_tests_router)
    admin_routers_loaded.append("ab_tests")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin A/B Tests router: {e}")

try:
    from backend.routes.admin.audit_logs import router as admin_audit_logs_router
    app.include_router(admin_audit_logs_router)
    admin_routers_loaded.append("audit_logs")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Audit Logs router: {e}")

try:
    from backend.routes.admin.export import router as admin_export_router
    app.include_router(admin_export_router)
    admin_routers_loaded.append("export")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Export router: {e}")

try:
    from backend.routes.admin.kiaan_analytics import router as admin_kiaan_analytics_router
    app.include_router(admin_kiaan_analytics_router)
    admin_routers_loaded.append("kiaan_analytics")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin KIAAN Analytics router: {e}")

try:
    from backend.routes.admin.voice_analytics import router as admin_voice_analytics_router
    app.include_router(admin_voice_analytics_router)
    admin_routers_loaded.append("voice_analytics")
    startup_logger.info("   • GET    /api/admin/voice/overview - Voice analytics overview")
    startup_logger.info("   • GET    /api/admin/voice/trends - Voice usage trends")
    startup_logger.info("   • GET    /api/admin/voice/quality - Voice quality metrics")
    startup_logger.info("   • GET    /api/admin/voice/enhancements - Enhancement stats")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Voice Analytics router: {e}")

try:
    from backend.routes.admin.backend_logs import router as admin_backend_logs_router
    app.include_router(admin_backend_logs_router)
    admin_routers_loaded.append("backend_logs")
    startup_logger.info("   • GET    /api/admin/backend-logs - Backend application logs")
    startup_logger.info("   • GET    /api/admin/backend-logs/stats - Log level statistics")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Admin Backend Logs router: {e}")

if admin_routers_loaded:
    startup_logger.info(f"✅ [SUCCESS] Admin routers loaded: {', '.join(admin_routers_loaded)}")
else:
    startup_logger.info("❌ [ERROR] No Admin routers were loaded")

# Load GDPR/Compliance routers
startup_logger.info("\n[Compliance] Attempting to import Compliance routers...")
compliance_routers_loaded = []
try:
    from backend.routes.gdpr import router as gdpr_router
    app.include_router(gdpr_router)
    compliance_routers_loaded.append("gdpr")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load GDPR router: {e}")

try:
    from backend.routes.compliance import router as compliance_router
    app.include_router(compliance_router)
    compliance_routers_loaded.append("compliance")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Compliance router: {e}")

if compliance_routers_loaded:
    startup_logger.info(f"✅ [SUCCESS] Compliance routers loaded: {', '.join(compliance_routers_loaded)}")
else:
    startup_logger.info("❌ [ERROR] No Compliance routers were loaded")

# Load Karma Reset router (Viyog, Relationship Compass, Ardha use KIAAN's wisdom system)
startup_logger.info("\n[Karma Reset] Attempting to import Karma Reset router...")
try:
    from backend.routes.karma_reset import router as karma_reset_router
    app.include_router(karma_reset_router)
    startup_logger.info("✅ [SUCCESS] Karma Reset router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Karma Reset router: {e}")

# Load Karma Reset KIAAN Integration router (NEW - enhanced with KIAAN ecosystem)
startup_logger.info("\n[Karma Reset KIAAN] Attempting to import Karma Reset KIAAN router...")
try:
    from backend.routes.karma_reset_kiaan import router as karma_reset_kiaan_router
    app.include_router(karma_reset_kiaan_router)
    startup_logger.info("✅ [SUCCESS] Karma Reset KIAAN router loaded (ecosystem enhanced)")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Karma Reset KIAAN router: {e}")

# Load Progress Reset router (User data reset with comprehensive error handling)
startup_logger.info("\n[Progress Reset] Attempting to import Progress Reset router...")
try:
    from backend.routes.progress_reset import router as progress_reset_router
    app.include_router(progress_reset_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Progress Reset router loaded (with transaction rollback)")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Progress Reset router: {e}")

# Load Ardha router
startup_logger.info("\n[Ardha] Attempting to import Ardha router...")
try:
    from backend.routes.ardha import router as ardha_router
    app.include_router(ardha_router)
    startup_logger.info("✅ [SUCCESS] Ardha router loaded with KIAAN integration")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Ardha router: {e}")

# Load Viyoga router
startup_logger.info("\n[Viyoga] Attempting to import Viyoga router...")
try:
    from backend.routes.viyoga import router as viyoga_router
    app.include_router(viyoga_router)
    startup_logger.info("✅ [SUCCESS] Viyoga router loaded with KIAAN integration")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Viyoga router: {e}")

# Load Gita AI Analysis router (OpenAI-powered pattern analysis)
startup_logger.info("\n[Gita AI Analysis] Attempting to import Gita AI Analysis router...")
try:
    from backend.routes.gita_ai_analysis import router as gita_ai_analysis_router
    app.include_router(gita_ai_analysis_router)
    startup_logger.info("✅ [SUCCESS] Gita AI Analysis router loaded with OpenAI + Core Wisdom integration")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Gita AI Analysis router: {e}")

# Load Relationship Compass router
startup_logger.info("\n[Relationship Compass] Attempting to import Relationship Compass router...")
try:
    from backend.routes.relationship_compass import router as relationship_compass_router
    app.include_router(relationship_compass_router)
    startup_logger.info("✅ [SUCCESS] Relationship Compass router loaded with KIAAN integration")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Relationship Compass router: {e}")

# Load Daily Analysis router
startup_logger.info("\n[Daily Analysis] Attempting to import Daily Analysis router...")
try:
    from backend.routes.daily_analysis import router as daily_analysis_router
    app.include_router(daily_analysis_router)
    startup_logger.info("✅ [SUCCESS] Daily Analysis router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Daily Analysis router: {e}")

# Load Sacred Reflections router
startup_logger.info("\n[Sacred Reflections] Attempting to import Sacred Reflections router...")
try:
    from backend.routes.sacred_reflections import router as sacred_reflections_router
    app.include_router(sacred_reflections_router)
    startup_logger.info("✅ [SUCCESS] Sacred Reflections router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Sacred Reflections router: {e}")

# Load Quantum Dive router
startup_logger.info("\n[Quantum Dive] Attempting to import Quantum Dive router...")
try:
    from backend.routes.quantum_dive import router as quantum_dive_router
    app.include_router(quantum_dive_router)
    startup_logger.info("✅ [SUCCESS] Quantum Dive router loaded (Multi-dimensional consciousness analysis)")
    startup_logger.info("   • POST   /api/kiaan/quantum-dive/analyze - Full quantum dive analysis")
    startup_logger.info("   • GET    /api/kiaan/quantum-dive/quick - Quick quantum dive")
    startup_logger.info("   • POST   /api/kiaan/quantum-dive/layer/{layer} - Deep dive into specific layer")
    startup_logger.info("   • GET    /api/kiaan/quantum-dive/voice-summary - Voice-optimized summary")
    startup_logger.info("   • GET    /api/kiaan/quantum-dive/history - Analysis history")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Quantum Dive router: {e}")

# Load KIAAN Learning router (Autonomous Gita Wisdom Acquisition v4.1)
startup_logger.info("\n[KIAAN Learning] Attempting to import KIAAN Learning router...")
try:
    from backend.routes.kiaan_learning import router as kiaan_learning_router
    app.include_router(kiaan_learning_router)
    startup_logger.info("✅ [SUCCESS] KIAAN Learning router loaded (Autonomous Gita Wisdom Acquisition)")
    startup_logger.info("   • GET    /api/kiaan/learning/status - Learning system status")
    startup_logger.info("   • POST   /api/kiaan/learning/acquire - Trigger content acquisition")
    startup_logger.info("   • POST   /api/kiaan/learning/scheduler/start - Start auto-scheduler")
    startup_logger.info("   • POST   /api/kiaan/learning/scheduler/stop - Stop auto-scheduler")
    startup_logger.info("   • POST   /api/kiaan/learning/wisdom/add - Add manual wisdom")
    startup_logger.info("   • GET    /api/kiaan/learning/wisdom/search - Search knowledge base")
    startup_logger.info("   • GET    /api/kiaan/learning/health - Health check")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load KIAAN Learning router: {e}")

# Load KIAAN Divine router (Voice & Intelligence APIs)
startup_logger.info("\n[KIAAN Divine] Attempting to import KIAAN Divine router...")
try:
    from backend.routes.kiaan_divine import router as kiaan_divine_router
    app.include_router(kiaan_divine_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] KIAAN Divine router loaded (Voice & Intelligence)")
    startup_logger.info("   • POST   /api/kiaan/divine-chat - Divine conversation with emotion")
    startup_logger.info("   • POST   /api/kiaan/synthesize - Voice synthesis with emotion")
    startup_logger.info("   • POST   /api/kiaan/transcribe - Whisper speech recognition")
    startup_logger.info("   • POST   /api/kiaan/soul-reading - Emotional/spiritual analysis")
    startup_logger.info("   • POST   /api/kiaan/stop - Stop all voice synthesis")
    startup_logger.info("   • GET    /api/kiaan/health - Health check")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load KIAAN Divine router: {e}")

# Load Gita Social Ingestion router (Social Media Data Pipeline)
startup_logger.info("\n[Gita Ingestion] Attempting to import Gita Social Ingestion router...")
try:
    from backend.routes.gita_social_ingestion import router as gita_ingestion_router
    app.include_router(gita_ingestion_router)
    startup_logger.info("✅ [SUCCESS] Gita Social Ingestion router loaded")
    startup_logger.info("   • GET    /api/gita-ingestion/trusted-sources - List trusted sources")
    startup_logger.info("   • POST   /api/gita-ingestion/validate - Validate content compliance")
    startup_logger.info("   • POST   /api/gita-ingestion/ingest - Ingest single source")
    startup_logger.info("   • POST   /api/gita-ingestion/ingest/bulk - Bulk ingest sources")
    startup_logger.info("   • GET    /api/gita-ingestion/check-source - Check if source is trusted")
    startup_logger.info("   • GET    /api/gita-ingestion/platforms - Get supported platforms")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Gita Social Ingestion router: {e}")

# Load Weekly Assessment router
startup_logger.info("\n[Weekly Assessment] Attempting to import Weekly Assessment router...")
try:
    from backend.routes.weekly_assessment import router as weekly_assessment_router
    app.include_router(weekly_assessment_router)
    startup_logger.info("✅ [SUCCESS] Weekly Assessment router loaded")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Weekly Assessment router: {e}")

# Load Translation router
startup_logger.info("\n[Translation] Attempting to import Translation router...")
try:
    from backend.routes.translation import router as translation_router
    app.include_router(translation_router)
    startup_logger.info("✅ [SUCCESS] Translation router loaded")
    startup_logger.info("   • POST   /api/translation/translate - Translate text")
    startup_logger.info("   • POST   /api/translation/preferences - Update language preferences")
    startup_logger.info("   • GET    /api/translation/preferences - Get language preferences")
    startup_logger.info("   • GET    /api/translation/languages - Get supported languages")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Translation router: {e}")

# Load Journeys router (Production CRUD)
startup_logger.info("\n[Journeys] Attempting to import Journeys router...")
try:
    from backend.routes.journeys import router as journeys_router
    app.include_router(journeys_router)
    startup_logger.info("✅ [SUCCESS] Journeys router loaded")
    startup_logger.info("   • GET    /api/journeys - List journeys")
    startup_logger.info("   • POST   /api/journeys - Create journey")
    startup_logger.info("   • GET    /api/journeys/{id} - Get journey")
    startup_logger.info("   • PUT    /api/journeys/{id} - Update journey")
    startup_logger.info("   • DELETE /api/journeys/{id} - Delete journey")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Journeys router: {e}")

# Load Journey Engine router (Guided Journeys - Six Enemies / Shadripu)
startup_logger.info("\n[Journey Engine] Attempting to import Journey Engine router...")
try:
    from backend.routes.journey_engine import router as journey_engine_router
    app.include_router(journey_engine_router, prefix="/api/journey-engine")
    startup_logger.info("✅ [SUCCESS] Journey Engine router loaded (Six Enemies / Shadripu)")
    startup_logger.info("   • GET    /api/journey-engine/templates - List journey templates")
    startup_logger.info("   • GET    /api/journey-engine/templates/{id} - Get template")
    startup_logger.info("   • GET    /api/journey-engine/journeys - List user journeys")
    startup_logger.info("   • POST   /api/journey-engine/journeys - Start journey")
    startup_logger.info("   • GET    /api/journey-engine/journeys/{id}/steps/current - Get current step")
    startup_logger.info("   • POST   /api/journey-engine/journeys/{id}/steps/{day}/complete - Complete step")
    startup_logger.info("   • GET    /api/journey-engine/dashboard - Get user dashboard")
    startup_logger.info("   • GET    /api/journey-engine/enemies - List enemies with info")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Journey Engine router: {e}")

# Load Sync router (Quantum Enhancement #2)
startup_logger.info("\n[Sync] Attempting to import Sync router...")
try:
    from backend.routes.sync import router as sync_router
    app.include_router(sync_router)
    startup_logger.info("✅ [SUCCESS] Sync router loaded (Quantum Enhancement #2 - Offline-First)")
    startup_logger.info("   • POST   /api/sync/batch - Batch sync offline operations")
    startup_logger.info("   • POST   /api/sync/pull - Pull server-side changes")
    startup_logger.info("   • GET    /api/sync/status - Sync status and health check")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Sync router: {e}")

# Load Voice router (Quantum Enhancement #3)
startup_logger.info("\n[Voice] Attempting to import Voice router...")
try:
    from backend.routes.voice import router as voice_router
    app.include_router(voice_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Voice router loaded (Quantum Enhancement #3 - Multilingual Voice)")
    startup_logger.info("   • POST   /api/voice/synthesize - Synthesize text to speech")
    startup_logger.info("   • POST   /api/voice/verse/{id} - Get verse audio")
    startup_logger.info("   • POST   /api/voice/message - Synthesize KIAAN message")
    startup_logger.info("   • POST   /api/voice/meditation - Synthesize meditation audio")
    startup_logger.info("   • POST   /api/voice/batch-download - Batch download verses")
    startup_logger.info("   • GET    /api/voice/settings - Get voice preferences")
    startup_logger.info("   • PUT    /api/voice/settings - Update voice preferences")
    startup_logger.info("   • GET    /api/voice/supported-languages - List supported languages")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Voice router: {e}")

# Load Multilingual Voice router (ElevenLabs-inspired Voice System)
startup_logger.info("\n[Multilingual Voice] Attempting to import Multilingual Voice router...")
try:
    from backend.routes.multilingual_voice import router as multilingual_voice_router
    app.include_router(multilingual_voice_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Multilingual Voice router loaded (30+ speakers, 18 languages)")
    startup_logger.info("   • GET    /api/voice/multilingual/languages - Supported languages")
    startup_logger.info("   • GET    /api/voice/multilingual/speakers - All speaker profiles")
    startup_logger.info("   • GET    /api/voice/multilingual/speakers/{lang} - Speakers by language")
    startup_logger.info("   • GET    /api/voice/multilingual/speaker/{id} - Speaker details")
    startup_logger.info("   • GET    /api/voice/multilingual/speaker/{id}/preview - Preview speaker")
    startup_logger.info("   • POST   /api/voice/multilingual/synthesize - Synthesize with speaker")
    startup_logger.info("   • GET    /api/voice/multilingual/recommend - Recommend speaker")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Multilingual Voice router: {e}")

# Load Voice Learning router (KIAAN Self-Improvement System)
startup_logger.info("\n[Voice Learning] Attempting to import Voice Learning router...")
try:
    from backend.routes.voice_learning import router as voice_learning_router
    app.include_router(voice_learning_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Voice Learning router loaded (KIAAN Self-Improvement)")
    startup_logger.info("   • POST   /api/voice-learning/session/start - Start learning session")
    startup_logger.info("   • POST   /api/voice-learning/enhance - Enhance response with learning")
    startup_logger.info("   • POST   /api/voice-learning/feedback - Record user feedback")
    startup_logger.info("   • POST   /api/voice-learning/playback-event - Record playback events")
    startup_logger.info("   • GET    /api/voice-learning/memories - Get user memories")
    startup_logger.info("   • GET    /api/voice-learning/preferences - Get learned preferences")
    startup_logger.info("   • GET    /api/voice-learning/insights - Get user insights")
    startup_logger.info("   • GET    /api/voice-learning/experiments - List A/B experiments")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Voice Learning router: {e}")

# Load Advanced Voice Learning router (Analytics, Proactive, Offline, Personalization)
startup_logger.info("\n[Voice Learning Advanced] Attempting to import Advanced Voice Learning router...")
try:
    from backend.routes.voice_learning_advanced import router as voice_learning_advanced_router
    app.include_router(voice_learning_advanced_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Advanced Voice Learning router loaded")
    startup_logger.info("   • GET    /api/voice-learning/advanced/analytics/snapshot - Dashboard snapshot")
    startup_logger.info("   • GET    /api/voice-learning/advanced/engagement/pending - Proactive messages")
    startup_logger.info("   • GET    /api/voice-learning/advanced/personalization/profile - Voice profile")
    startup_logger.info("   • GET    /api/voice-learning/advanced/spiritual/summary - Spiritual journey")
    startup_logger.info("   • GET    /api/voice-learning/advanced/patterns/analytics - Interaction patterns")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Advanced Voice Learning router: {e}")

# Load Divine Consciousness router (Sacred Atmosphere Enhancement)
startup_logger.info("\n[Divine Consciousness] Attempting to import Divine Consciousness router...")
try:
    from backend.routes.divine_consciousness import router as divine_consciousness_router
    app.include_router(divine_consciousness_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Divine Consciousness router loaded (Sacred Atmosphere)")
    startup_logger.info("   • GET    /api/divine/atmosphere - Get sacred atmosphere")
    startup_logger.info("   • GET    /api/divine/breathing/{pattern} - Get breathing exercise")
    startup_logger.info("   • GET    /api/divine/meditation/{type} - Get micro-meditation")
    startup_logger.info("   • POST   /api/divine/mood-response - Get sacred mood response")
    startup_logger.info("   • GET    /api/divine/reminder - Get divine reminder")
    startup_logger.info("   • GET    /api/divine/affirmation - Get divine affirmation")
    startup_logger.info("   • GET    /api/divine/greeting - Get time-appropriate greeting")
    startup_logger.info("   • GET    /api/divine/sacred-pause - Get sacred pause")
    startup_logger.info("   • GET    /api/divine/check-in - Get divine check-in")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Divine Consciousness router: {e}")

# Load Journal router
startup_logger.info("\n[Journal] Attempting to import Journal router...")
try:
    from backend.routes.journal import router as journal_router
    app.include_router(journal_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Journal router loaded")
    startup_logger.info("   • GET    /api/journal/entries - List journal entries")
    startup_logger.info("   • POST   /api/journal/entries - Create journal entry")
    startup_logger.info("   • POST   /api/journal/quick-save - Quick save content")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Journal router: {e}")

# Load Community router
startup_logger.info("\n[Community] Attempting to import Community router...")
try:
    from backend.routes.community import router as community_router
    app.include_router(community_router)
    startup_logger.info("✅ [SUCCESS] Community router loaded")
    startup_logger.info("   • GET    /api/community/circles - List wisdom circles")
    startup_logger.info("   • POST   /api/community/circles/{id}/join - Join circle")
    startup_logger.info("   • POST   /api/community/posts - Create post")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Community router: {e}")

# NOTE: Analytics dashboard router already loaded above (from analytics_dashboard.py)

# Load Moods router
startup_logger.info("\n[Moods] Attempting to import Moods router...")
try:
    from backend.routes.moods import router as moods_router
    app.include_router(moods_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Moods router loaded")
    startup_logger.info("   • POST   /api/moods - Submit mood entry")
    startup_logger.info("   • GET    /api/moods/micro-response - Get mood analysis")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Moods router: {e}")

# Load Feedback router
startup_logger.info("\n[Feedback] Attempting to import Feedback router...")
try:
    from backend.routes.feedback import router as feedback_router
    app.include_router(feedback_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Feedback router loaded")
    startup_logger.info("   • POST   /api/feedback - Submit feedback")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Feedback router: {e}")

# Load Content router
startup_logger.info("\n[Content] Attempting to import Content router...")
try:
    from backend.routes.content import router as content_router
    app.include_router(content_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] Content router loaded")
    startup_logger.info("   • GET    /api/content/{locale} - Get localized content")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Content router: {e}")

# Load Voice Companion (Best Friend) router
startup_logger.info("\n[Companion] Attempting to import Voice Companion router...")
try:
    from backend.routes.voice_companion import router as voice_companion_router
    app.include_router(voice_companion_router)
    startup_logger.info("✅ [SUCCESS] Voice Companion router loaded")
    startup_logger.info("   • POST   /api/companion/session/start - Start companion session")
    startup_logger.info("   • POST   /api/companion/message - Send message to KIAAN friend")
    startup_logger.info("   • POST   /api/companion/session/end - End companion session")
    startup_logger.info("   • GET    /api/companion/history - Conversation history")
    startup_logger.info("   • GET    /api/companion/profile - Companion profile")
    startup_logger.info("   • PATCH  /api/companion/profile - Update preferences")
    startup_logger.info("   • GET    /api/companion/memories - User memories")
    startup_logger.info("   • DELETE /api/companion/memories/{id} - Delete memory")
    startup_logger.info("   • GET    /api/companion/health - Health check")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Voice Companion router: {e}")

# Load KIAAN Voice Companion (Divine Friend with Voice Output)
startup_logger.info("\n[Voice Companion] Attempting to import KIAAN Voice Companion router...")
try:
    from backend.routes.kiaan_voice_companion import router as kiaan_voice_companion_router
    app.include_router(kiaan_voice_companion_router)
    startup_logger.info("✅ [SUCCESS] KIAAN Voice Companion router loaded (Divine Friend)")
    startup_logger.info("   • POST   /api/voice-companion/session/start - Start voice session")
    startup_logger.info("   • POST   /api/voice-companion/message - Send message (voice-first)")
    startup_logger.info("   • POST   /api/voice-companion/session/end - End voice session")
    startup_logger.info("   • POST   /api/voice-companion/synthesize - Synthesize voice")
    startup_logger.info("   • GET    /api/voice-companion/history - Conversation history")
    startup_logger.info("   • GET    /api/voice-companion/health - Health check")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load KIAAN Voice Companion router: {e}")

# Load KIAAN Friend Mode router (Dual-mode: Best Friend + Gita Guide)
startup_logger.info("\n[KIAAN Friend Mode] Attempting to import KIAAN Friend Mode router...")
try:
    from backend.routes.kiaan_friend_mode import router as kiaan_friend_router
    app.include_router(kiaan_friend_router, prefix="/api")
    startup_logger.info("✅ [SUCCESS] KIAAN Friend Mode router loaded (Best Friend + Gita Guide)")
    startup_logger.info("   • POST   /api/kiaan/friend/chat - Dual-mode chat (auto-detects friend vs guide)")
    startup_logger.info("   • GET    /api/kiaan/friend/daily-wisdom - Personalized daily wisdom")
    startup_logger.info("   • POST   /api/kiaan/friend/mood-check - Quick mood check-in")
    startup_logger.info("   • GET    /api/kiaan/friend/gita-guide/{chapter} - Modern secular interpretation")
    startup_logger.info("   • GET    /api/kiaan/friend/gita-guide - All 18 chapter guides")
    startup_logger.info("   • POST   /api/kiaan/friend/verse-insight - Deep verse insight with modern lens")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load KIAAN Friend Mode router: {e}")

# Load Emotional Pattern Extraction router
startup_logger.info("\n[Emotional Patterns] Attempting to import Emotional Pattern Extraction router...")
try:
    from backend.routes.emotional_patterns import router as emotional_patterns_router
    app.include_router(emotional_patterns_router)
    startup_logger.info("✅ [SUCCESS] Emotional Pattern Extraction router loaded")
    startup_logger.info("   • GET    /api/kiaan/emotional-patterns/extract - Extract emotional signals")
except Exception as e:
    startup_logger.info(f"❌ [ERROR] Failed to load Emotional Pattern Extraction router: {e}")

startup_logger.info("="*80)
startup_logger.info(f"KIAAN Router Status: {'✅ LOADED' if kiaan_router_loaded else '❌ FAILED'}")
startup_logger.info("="*80 + "\n")


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
