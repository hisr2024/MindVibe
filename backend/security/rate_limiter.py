"""Minimal in-memory rate limiter for FastAPI routes."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    def __init__(self):
        self.requests: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)

    def is_allowed(self, key: Tuple[str, str], limit: int, window_seconds: int) -> bool:
        now = time.time()
        window_start = now - window_seconds
        bucket = self.requests[key]
        while bucket and bucket[0] < window_start:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True


limiter = SlidingWindowRateLimiter()


def rate_limit(limit: int, window_seconds: int = 60):
    async def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        key = (client_ip, request.url.path)
        if not limiter.is_allowed(key, limit, window_seconds):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please retry later.",
            )

    return dependency


__all__ = ["rate_limit", "limiter", "SlidingWindowRateLimiter"]
