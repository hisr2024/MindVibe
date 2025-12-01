"""Structured logging helpers."""
from __future__ import annotations

import json
import logging
import time
from contextvars import ContextVar
from typing import Callable
from uuid import uuid4

from fastapi import Request

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)


def _ensure_request_id(request: Request) -> str:
    request_id = request.headers.get("x-request-id") or request_id_ctx.get()
    if not request_id:
        request_id = uuid4().hex
    request.state.request_id = request_id
    request_id_ctx.set(request_id)
    return request_id


def configure_logging(level: int = logging.INFO) -> None:
    logger = logging.getLogger("mindvibe")
    if logger.handlers:
        return

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
    logger.setLevel(level)
    logger.propagate = False


async def log_request(request: Request, call_next: Callable):
    request_id = _ensure_request_id(request)
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start

    payload = {
        "event": "http_request",
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": int(duration * 1000),
        "request_id": request_id,
        "client": request.client.host if request.client else None,
    }
    response.headers.setdefault("X-Request-ID", request_id)
    logging.getLogger("mindvibe").info(json.dumps(payload))
    return response


__all__ = ["configure_logging", "log_request", "request_id_ctx"]
