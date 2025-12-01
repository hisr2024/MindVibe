"""Global rate limiting middleware."""

import asyncio
import os
from typing import Iterable

from fastapi import Request
from fastapi.responses import JSONResponse

from backend.core.metrics import record_rate_limit_rejection
from backend.security.rate_limiter import limiter

DEFAULT_LIMIT = int(os.getenv("GLOBAL_RATE_LIMIT", "300"))
DEFAULT_WINDOW = int(os.getenv("GLOBAL_RATE_LIMIT_WINDOW", "60"))
EXEMPT_PATH_PREFIXES: Iterable[str] = ("/health", "/metrics", "/docs", "/openapi")


async def global_rate_limit(request: Request, call_next):
    """Apply a simple sliding window rate limit per IP+path."""

    path = request.url.path
    if any(path.startswith(prefix) for prefix in EXEMPT_PATH_PREFIXES):
        return await call_next(request)

    client_ip = request.client. host if request.client else "unknown"
    
    # Handle both sync and async rate limiters
    result = limiter.evaluate((client_ip, path), DEFAULT_LIMIT, DEFAULT_WINDOW)
    if asyncio.iscoroutine(result):
        allowed, remaining, reset_at = await result
    else:
        allowed, remaining, reset_at = result

    if not allowed:
        record_rate_limit_rejection(path)
        return JSONResponse(
            status_code=429,
            content={
                "code": "rate_limit_exceeded",
                "message": "Too many requests. Please slow down.",
                "retry_after": DEFAULT_WINDOW,
            },
            headers={
                "X-RateLimit-Limit": str(DEFAULT_LIMIT),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_at),
            },
        )

    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(DEFAULT_LIMIT)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_at)
    return response

