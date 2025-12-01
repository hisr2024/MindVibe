"""Minimal in-memory rate limiter for FastAPI routes."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request, Response, status

from backend.core.metrics import record_rate_limit_rejection


class SlidingWindowRateLimiter:
    def __init__(self):
        self.requests: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)

    def evaluate(
        self, key: Tuple[str, str], limit: int, window_seconds: int
    ) -> tuple[bool, int, int]:
        """Return (allowed, remaining, reset_epoch)."""

        now = time.time()
        window_start = now - window_seconds
        bucket = self.requests[key]
        while bucket and bucket[0] < window_start:
            bucket.popleft()

        remaining = limit - len(bucket)
        allowed = remaining > 0
        if allowed:
            bucket.append(now)
            remaining -= 1

        reset_at = int(window_start + window_seconds)
        return allowed, max(remaining, 0), reset_at


limiter = SlidingWindowRateLimiter()


def rate_limit(limit: int, window_seconds: int = 60):
    async def dependency(request: Request, response: Response):
        client_ip = request.client.host if request.client else "unknown"
        path = request.scope.get("route").path if request.scope.get("route") else request.url.path
        key = (client_ip, path)
        allowed, remaining, reset_at = limiter.evaluate(key, limit, window_seconds)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_at)

        if not allowed:
            record_rate_limit_rejection(path)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "rate_limit_exceeded",
                    "message": "Rate limit exceeded. Please retry later.",
                    "retry_after": window_seconds,
                },
            )

    return dependency


__all__ = ["rate_limit", "limiter", "SlidingWindowRateLimiter"]
