"""Admin backend logs route - serves captured application logs."""

import logging
from collections import deque
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel

from backend.middleware.rbac import (
    get_current_admin,
    AdminContext,
    PermissionChecker,
)
from backend.models import AdminPermission


router = APIRouter(prefix="/api/admin/backend-logs", tags=["admin-backend-logs"])

# ---------------------------------------------------------------------------
# In-memory log buffer (ring buffer capped at 2000 entries)
# ---------------------------------------------------------------------------
MAX_LOG_ENTRIES = 2000
_log_buffer: deque[dict] = deque(maxlen=MAX_LOG_ENTRIES)


class BufferedLogHandler(logging.Handler):
    """Custom logging handler that stores log records in a ring buffer."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            entry = {
                "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
                "level": record.levelname,
                "logger": record.name,
                "message": self.format(record),
            }
            _log_buffer.append(entry)
        except Exception:
            self.handleError(record)


def install_log_handler() -> None:
    """Attach the buffered handler to the root logger so all app logs are captured."""
    handler = BufferedLogHandler()
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter("%(message)s"))
    logging.getLogger().addHandler(handler)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LogEntry(BaseModel):
    timestamp: str
    level: str
    logger: str
    message: str


class BackendLogsOut(BaseModel):
    logs: list[LogEntry]
    total: int
    has_more: bool


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=BackendLogsOut)
async def get_backend_logs(
    request: Request,
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    level: Optional[str] = Query(None, description="Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"),
    search: Optional[str] = Query(None, description="Search log messages"),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AUDIT_LOGS_VIEW)),
):
    """
    Retrieve recent backend application logs.

    Returns the most recent logs from the in-memory ring buffer.
    Logs are ordered newest-first.

    Permissions required: audit_logs:view
    """
    # Snapshot the buffer (thread-safe read of deque)
    all_logs = list(_log_buffer)

    # Apply filters
    if level:
        level_upper = level.upper()
        all_logs = [entry for entry in all_logs if entry["level"] == level_upper]

    if search:
        search_lower = search.lower()
        all_logs = [entry for entry in all_logs if search_lower in entry["message"].lower()]

    # Reverse so newest logs come first
    all_logs.reverse()

    total = len(all_logs)
    page = all_logs[offset : offset + limit]
    has_more = (offset + limit) < total

    return BackendLogsOut(
        logs=[LogEntry(**entry) for entry in page],
        total=total,
        has_more=has_more,
    )


@router.get("/stats")
async def get_log_stats(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.AUDIT_LOGS_VIEW)),
):
    """
    Get log level statistics from the buffer.

    Permissions required: audit_logs:view
    """
    stats: dict[str, int] = {
        "DEBUG": 0,
        "INFO": 0,
        "WARNING": 0,
        "ERROR": 0,
        "CRITICAL": 0,
    }
    for entry in _log_buffer:
        lvl = entry.get("level", "INFO")
        if lvl in stats:
            stats[lvl] += 1

    return {
        "total": len(_log_buffer),
        "buffer_capacity": MAX_LOG_ENTRIES,
        "by_level": stats,
    }
