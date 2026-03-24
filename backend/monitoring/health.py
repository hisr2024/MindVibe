"""Enhanced health monitoring endpoints for MindVibe — instance-aware for multi-instance deployments."""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone

import psutil
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.deps import get_db, get_current_user
from backend.middleware.circuit_breaker import get_all_circuit_breakers

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

# Heartbeat interval: each instance writes its status to Redis every 30 seconds
_HEARTBEAT_INTERVAL_SECONDS = 30
_HEARTBEAT_TTL_SECONDS = 60  # Key expires if instance stops heartbeating


async def start_instance_heartbeat() -> None:
    """Background task: periodically write this instance's heartbeat to Redis.

    Each instance writes to a Redis key `instances:{INSTANCE_ID}` with a 60s TTL.
    If an instance crashes or stops, its key expires automatically. Other instances
    (or the /health/instances endpoint) can enumerate live instances.
    """
    try:
        from backend.cache.redis_cache import get_redis_cache
        redis = await get_redis_cache()
        if not redis.is_connected:
            logger.info("Instance heartbeat disabled (Redis not connected)")
            return

        instance_id = settings.INSTANCE_ID
        logger.info("Starting instance heartbeat for %s", instance_id)

        while True:
            try:
                heartbeat_data = json.dumps({
                    "instance_id": instance_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "uptime_seconds": int(time.time() - psutil.boot_time()),
                    "cpu_percent": psutil.cpu_percent(interval=0),
                    "memory_percent": psutil.virtual_memory().percent,
                })
                await redis.set(
                    f"instances:{instance_id}",
                    heartbeat_data,
                    expire_seconds=_HEARTBEAT_TTL_SECONDS,
                )
            except Exception as e:
                logger.warning("Heartbeat write failed: %s", e)

            await asyncio.sleep(_HEARTBEAT_INTERVAL_SECONDS)
    except asyncio.CancelledError:
        logger.info("Instance heartbeat stopped")
    except Exception as e:
        logger.warning("Instance heartbeat task exited: %s", e)


@router.get("/health")
async def basic_health(
    db: AsyncSession = Depends(get_db),
):
    """Basic health check for load balancers. No auth required.

    Performs lightweight dependency checks (database ping, Redis ping if enabled)
    to confirm the service can handle requests. Returns degraded status if any
    dependency is unreachable, so load balancers can route traffic accordingly.
    Includes instance_id so operators can identify which instance responded.
    """
    health_status = "ok"
    checks: dict = {}

    # Database ping — lightweight SELECT 1
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "up"
    except Exception:
        checks["database"] = "down"
        health_status = "degraded"
        logger.warning("Health check: database unreachable")

    # Redis ping — only if Redis is enabled
    redis_enabled = os.getenv("REDIS_ENABLED", "false").lower() in ("true", "1")
    if redis_enabled:
        try:
            from backend.cache.redis_cache import get_redis_cache
            redis = await get_redis_cache()
            if redis.is_connected:
                checks["redis"] = "up"
            else:
                checks["redis"] = "down"
                health_status = "degraded"
                logger.warning("Health check: Redis unreachable")
        except Exception:
            checks["redis"] = "down"
            health_status = "degraded"
            logger.warning("Health check: Redis unreachable")

    return {
        "status": health_status,
        "instance_id": settings.INSTANCE_ID,
        "checks": checks,
    }


@router.get("/health/detailed")
async def detailed_health(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Comprehensive health check with metrics. Requires authentication."""

    health_data = {
        "status": "healthy",
        "instance_id": settings.INSTANCE_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {}
    }

    # Database check
    try:
        start_time = time.time()
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        db_latency = (time.time() - start_time) * 1000

        health_data["checks"]["database"] = {
            "status": "up",
            "latency_ms": round(db_latency, 2)
        }
    except Exception:
        health_data["checks"]["database"] = {
            "status": "down",
        }
        health_data["status"] = "degraded"

    # Redis check with latency
    try:
        from backend.cache.redis_cache import get_redis_cache
        redis = await get_redis_cache()
        if redis.is_connected:
            start_time = time.time()
            client = redis.get_client()
            if client:
                await client.ping()
            redis_latency = (time.time() - start_time) * 1000
            health_data["checks"]["redis"] = {
                "status": "up",
                "latency_ms": round(redis_latency, 2)
            }
        else:
            health_data["checks"]["redis"] = {"status": "down"}
            health_data["status"] = "degraded"
    except Exception:
        health_data["checks"]["redis"] = {"status": "down"}
        health_data["status"] = "degraded"

    # OpenAI API check - only report presence, never log key details
    health_data["checks"]["openai"] = {
        "status": "configured" if os.getenv("OPENAI_API_KEY") else "missing"
    }

    # System resources
    health_data["checks"]["system"] = {
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent
    }

    return health_data


@router.get("/health/instances")
async def list_instances(
    current_user: str = Depends(get_current_user),
):
    """List all live API instances via Redis heartbeat registry. Requires auth.

    Each running instance writes a heartbeat key to Redis every 30 seconds with
    a 60-second TTL. This endpoint enumerates all unexpired heartbeat keys to
    show which instances are currently alive, their resource usage, and last
    heartbeat time.
    """
    instances = []
    try:
        from backend.cache.redis_cache import get_redis_cache
        redis = await get_redis_cache()
        if redis.is_connected:
            client = redis.get_client()
            if client:
                # Scan for all instance heartbeat keys
                cursor = 0
                while True:
                    cursor, keys = await client.scan(cursor, match="instances:*", count=100)
                    for key in keys:
                        data = await client.get(key)
                        if data:
                            try:
                                instances.append(json.loads(data))
                            except (json.JSONDecodeError, TypeError):
                                pass
                    if cursor == 0:
                        break
    except Exception as e:
        logger.warning("Failed to enumerate instances: %s", e)

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_instances": len(instances),
        "instances": instances,
    }


@router.get("/metrics")
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Application metrics for monitoring. Requires authentication."""

    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)

    # User metrics
    total_users_result = await db.execute(text("SELECT COUNT(*) FROM users"))
    total_users = total_users_result.scalar()

    # Active users in last 24h (based on chat messages)
    active_users_result = await db.execute(
        text("SELECT COUNT(DISTINCT user_id) FROM chat_messages WHERE created_at > :since"),
        {"since": last_24h}
    )
    active_users_24h = active_users_result.scalar()

    # Chat metrics
    total_messages_result = await db.execute(
        text("SELECT COUNT(*) FROM chat_messages WHERE created_at > :since"),
        {"since": last_24h}
    )
    total_messages_24h = total_messages_result.scalar()

    # Mood metrics
    total_moods_result = await db.execute(
        text("SELECT COUNT(*) FROM moods WHERE created_at > :since"),
        {"since": last_24h}
    )
    total_moods_24h = total_moods_result.scalar()

    # Calculate average messages per user
    if active_users_24h > 0:
        avg_per_user = round(total_messages_24h / active_users_24h, 2)
    else:
        avg_per_user = 0.0

    return {
        "timestamp": now.isoformat(),
        "instance_id": settings.INSTANCE_ID,
        "users": {
            "total": total_users,
            "active_24h": active_users_24h
        },
        "messages": {
            "total_24h": total_messages_24h,
            "avg_per_user": avg_per_user
        },
        "moods": {
            "total_24h": total_moods_24h
        }
    }


@router.get("/security/status")
async def security_status(
    current_user: str = Depends(get_current_user),
):
    """Get security and DDoS protection status. Requires authentication."""

    # Get circuit breaker stats
    circuit_breakers = get_all_circuit_breakers()

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "instance_id": settings.INSTANCE_ID,
        "ddos_protection": {
            "enabled": True,
        },
        "circuit_breakers": circuit_breakers,
        "rate_limiting": {
            "enabled": True,
        },
        "security_headers": {
            "hsts": True,
            "csp": True,
            "xss_protection": True,
            "frame_options": True,
        }
    }


@router.get("/sentry-test")
async def sentry_test():
    """Send a test event to Sentry to verify the integration is working."""
    from backend.monitoring.error_tracking import trigger_test_error
    return trigger_test_error()
