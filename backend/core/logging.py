"""Structured logging helpers."""
from __future__ import annotations

import json
import logging
import time
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Callable, Dict, Optional
from uuid import uuid4

from fastapi import Request
from opentelemetry import trace

from backend.core.settings import settings
from backend.security.jwt import decode_access_token

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)
correlation_id_ctx: ContextVar[str | None] = ContextVar("correlation_id", default=None)
session_id_ctx: ContextVar[str | None] = ContextVar("session_id", default=None)
user_id_ctx: ContextVar[str | None] = ContextVar("user_id", default=None)


def _ensure_request_and_correlation_ids(request: Request) -> tuple[str, str]:
    request_id = request.headers.get("x-request-id") or request_id_ctx.get()
    if not request_id:
        request_id = uuid4().hex

    correlation_id = (
        request.headers.get("x-correlation-id")
        or request.headers.get("x-request-id")
        or correlation_id_ctx.get()
        or request_id
    )

    request.state.request_id = request_id
    request.state.correlation_id = correlation_id

    request_id_ctx.set(request_id)
    correlation_id_ctx.set(correlation_id)
    return request_id, correlation_id


def _extract_auth_context(request: Request) -> Dict[str, Optional[str]]:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    payload = getattr(request.state, "auth_payload", None)

    if not payload and token:
        try:
            payload = decode_access_token(token)
        except Exception:
            payload = None

    user_id = payload.get("sub") if payload else None
    session_id = payload.get("sid") if payload else None
    role = payload.get("role") if payload else None

    session_id_ctx.set(session_id)
    user_id_ctx.set(user_id)

    return {"user_id": user_id, "session_id": session_id, "role": role}


def _trace_context() -> Dict[str, str]:
    span = trace.get_current_span()
    context = span.get_span_context()
    if not context or not context.is_valid:
        return {}

    return {
        "trace_id": format(context.trace_id, "032x"),
        "span_id": format(context.span_id, "016x"),
    }


class JsonFormatter(logging.Formatter):
    """Render log records as structured JSON."""

    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        base = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
            "service": settings.OTEL_SERVICE_NAME,
        }

        # Attach contextual correlation identifiers when present
        context_fields = {
            "request_id": request_id_ctx.get(),
            "correlation_id": correlation_id_ctx.get(),
            "session_id": session_id_ctx.get(),
            "user_id": user_id_ctx.get(),
        }
        base.update({k: v for k, v in context_fields.items() if v})

        # Allow call sites to pass a dict payload for richer logs
        if isinstance(record.msg, dict):
            base.update(record.msg)
        else:
            base["message"] = record.getMessage()

        return json.dumps(base)


def configure_logging(level: int = logging.INFO) -> None:
    logger = logging.getLogger("mindvibe")
    if logger.handlers:
        return

    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(level)
    logger.propagate = False


async def log_request(request: Request, call_next: Callable):
    request_id, correlation_id = _ensure_request_and_correlation_ids(request)
    auth_context = _extract_auth_context(request)
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start

    trace_ctx = _trace_context()
    payload = {
        "event": "http_request",
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": int(duration * 1000),
        "request_id": request_id,
        "correlation_id": correlation_id,
        "client": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        **auth_context,
        **trace_ctx,
    }
    response.headers.setdefault("X-Request-ID", request_id)
    response.headers.setdefault("X-Correlation-ID", correlation_id)
    logging.getLogger("mindvibe").info(payload)
    return response


__all__ = [
    "configure_logging",
    "log_request",
    "request_id_ctx",
    "correlation_id_ctx",
    "session_id_ctx",
    "user_id_ctx",
]
