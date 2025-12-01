"""Application-wide rate limiting middleware."""
from __future__ import annotations

import os
from typing import Iterable

from fastapi import Request
from fastapi.responses import JSONResponse, Response

from backend.security.rate_limiter import limiter

DEFAULT_LIMIT = int(os.getenv("GLOBAL_RATE_LIMIT_PER_MINUTE", "120"))
SENSITIVE_LIMIT = int(os.getenv("SENSITIVE_RATE_LIMIT_PER_MINUTE", "60"))
WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
EXEMPT_PATHS: set[str] = {
    "/health",
    "/api/health",
    "/metrics",
}
SENSITIVE_PATH_PREFIXES: tuple[str, ...] = (
    "/api/auth",
    "/api/chat",
    "/api/journal",
)


def _choose_limit(path: str) -> int:
    if any(path.startswith(prefix) for prefix in SENSITIVE_PATH_PREFIXES):
        return SENSITIVE_LIMIT
    return DEFAULT_LIMIT


def _normalized_path(request: Request) -> str:
    route = request.scope.get("route")
    if route and getattr(route, "path", None):
        return route.path
    return request.url.path


def rate_limit_middleware():
    async def middleware(request: Request, call_next) -> Response:
        path = _normalized_path(request)
        if path in EXEMPT_PATHS:
            return await call_next(request)

        limit = _choose_limit(path)
        allowed, remaining, reset_at = limiter.evaluate(
            key=(request.client.host if request.client else "unknown", path),
            limit=limit,
            window_seconds=WINDOW_SECONDS,
        )

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "code": "rate_limit_exceeded",
                    "message": "Too many requests. Please slow down.",
                    "limit": limit,
                    "retry_after": WINDOW_SECONDS,
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(reset_at),
                },
            )

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_at)
        return response

    return middleware


__all__ = ["rate_limit_middleware"]
