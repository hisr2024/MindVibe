import os
from datetime import datetime, timezone
from typing import Any, Dict, Tuple

from fastapi import APIRouter
from sqlalchemy import text

from backend.deps import engine

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

_service_start = datetime.now(timezone.utc)


async def _check_database() -> Tuple[bool, str | None]:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True, None
    except Exception as exc:  # pragma: no cover - logged for operational insight
        return False, str(exc)


def _service_metadata(db_ok: bool, db_error: str | None, api_url_configured: bool, openai_configured: bool) -> Dict[str, Any]:
    status = "healthy" if db_ok and openai_configured else "degraded"
    return {
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": (datetime.now(timezone.utc) - _service_start).total_seconds(),
        "checks": {
            "database": {
                "status": "up" if db_ok else "down",
                "error": db_error,
            },
            "api_url_configured": api_url_configured,
            "openai_key_present": openai_configured,
        },
    }


@router.get("/health")
async def monitoring_health() -> Dict[str, Any]:
    db_ok, db_error = await _check_database()
    openai_configured = bool(os.getenv("OPENAI_API_KEY", "").strip())
    api_url_configured = bool(os.getenv("NEXT_PUBLIC_API_URL", "").strip())
    return _service_metadata(db_ok, db_error, api_url_configured, openai_configured)


@router.get("/readiness")
async def monitoring_readiness() -> Dict[str, Any]:
    db_ok, db_error = await _check_database()
    openai_configured = bool(os.getenv("OPENAI_API_KEY", "").strip())
    api_url_configured = bool(os.getenv("NEXT_PUBLIC_API_URL", "").strip())
    response = _service_metadata(db_ok, db_error, api_url_configured, openai_configured)
    response["ready"] = db_ok and openai_configured
    return response
