"""Enhanced health monitoring endpoints for MindVibe."""

import logging
import os
import time
from datetime import datetime, timedelta

import psutil
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_current_user
from backend.middleware.circuit_breaker import get_all_circuit_breakers

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/health")
async def basic_health():
    """Basic health check for load balancers. No auth required.

    Returns only a simple status - no internal details exposed.
    """
    return {"status": "ok"}


@router.get("/health/detailed")
async def detailed_health(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Comprehensive health check with metrics. Requires authentication."""

    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
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


@router.get("/metrics")
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Application metrics for monitoring. Requires authentication."""

    now = datetime.utcnow()
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
        "timestamp": datetime.utcnow().isoformat(),
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
