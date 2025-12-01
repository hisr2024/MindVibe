"""Distributed rate limiter with Redis-backed sliding windows."""
from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

import redis.asyncio as redis
from fastapi import HTTPException, Request, Response, status

from backend.core.metrics import record_rate_limit_rejection
from backend.core.settings import settings


class SlidingWindowRateLimiter:
    def __init__(self):
        self.requests: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)

    def evaluate(
        self, key: Tuple[str, str], limit: int, window_seconds: int
    ) -> tuple[bool, int, int]:
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


class RedisSlidingWindowLimiter:
    """Redis-based limiter to support overlapping backend instances."""

    def __init__(self, client: redis.Redis):
        self.client = client

    async def evaluate(
        self, key: Tuple[str, str], limit: int, window_seconds: int
    ) -> tuple[bool, int, int]:
        now_ms = int(time.time() * 1000)
        window_start = now_ms - (window_seconds * 1000)
        member = f"{now_ms}:{key[0]}:{key[1]}"
        redis_key = f"rl:{key[0]}:{key[1]}"

        async with self.client.pipeline() as pipe:
            pipe.zremrangebyscore(redis_key, 0, window_start)
            pipe.zcard(redis_key)
            pipe.zadd(redis_key, {member: now_ms})
            pipe.expire(redis_key, window_seconds)
            cleaned, current_count, *_ = await pipe.execute()

        remaining = max(limit - int(current_count), 0)
        allowed = remaining > 0
        if not allowed:
            reset_at = int((window_start + (window_seconds * 1000)) / 1000)
            return False, 0, reset_at

        reset_at = int((window_start + (window_seconds * 1000)) / 1000)
        return True, remaining - 1, reset_at


def _build_limiter() -> SlidingWindowRateLimiter | RedisSlidingWindowLimiter:
    try:
        client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        return RedisSlidingWindowLimiter(client)
    except Exception:  # pragma: no cover - defensive: redis misconfig
        return SlidingWindowRateLimiter()


limiter = _build_limiter()


def rate_limit(limit: int, window_seconds: int = 60):
    async def dependency(request: Request, response: Response):
        client_ip = request.client.host if request.client else "unknown"
        path = request.scope.get("route").path if request.scope.get("route") else request.url.path
        key = (client_ip, path)
        evaluate = limiter.evaluate
        result = evaluate(key, limit, window_seconds)
        if asyncio.iscoroutine(result):
            allowed, remaining, reset_at = await result
        else:
            allowed, remaining, reset_at = result

        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_at)
        response.headers["Retry-After"] = str(max(reset_at - int(time.time()), 0))

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


__all__ = [
    "rate_limit",
    "limiter",
    "SlidingWindowRateLimiter",
    "RedisSlidingWindowLimiter",
]
