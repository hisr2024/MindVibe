"""Distributed rate limiter for privacy/compliance endpoints.

This provides a small, async-first rate limiter that can gate sensitive
operations (e.g. GDPR data exports) independently of the global slowapi
middleware.  It is intentionally simple and defensive:

- When Redis is available, counters live in Redis so limits are enforced
  consistently across all API instances.
- When Redis is unavailable, a thread-safe in-memory fallback is used so
  single-instance deployments (and tests) continue to work.
- Fails open on internal errors: we would rather allow a request than
  block a user from exercising a GDPR right.

Intended usage:

    limiter = RateLimiter()
    allowed = await limiter.check(
        key=f"privacy:export:{user_id}",
        limit=1,
        window_seconds=86400,
    )
    if not allowed:
        raise HTTPException(429, "Too many requests")

The caller is responsible for building a meaningful key.  We recommend
namespacing by feature (``privacy:export:…``) so that counters for
different endpoints do not collide.

KIAAN Impact: ✅ NEUTRAL – operational utility, no impact on KIAAN logic.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class _InMemoryCounter:
    """Thread-safe in-memory counter used when Redis is not available."""

    count: int = 0
    window_start: float = 0.0


class RateLimiter:
    """Sliding-window-ish rate limiter with Redis + in-memory fallback.

    Each ``check`` increments the counter for ``key`` and returns whether
    the request is allowed.  Counters are expired after ``window_seconds``
    so bursts cannot persist across windows.
    """

    # Process-wide in-memory fallback state, shared across RateLimiter
    # instances so that instantiating a new limiter in each request does
    # not reset counters.  Redis remains the source of truth when
    # available.
    _shared_memory_counters: dict[str, _InMemoryCounter] = {}
    _shared_memory_lock: asyncio.Lock | None = None

    def __init__(self) -> None:
        # Lazily create the lock on first construction.  Creating an
        # ``asyncio.Lock()`` at module import time can bind it to the
        # wrong event loop in some environments (e.g. pytest's
        # per-test-loop model).
        if RateLimiter._shared_memory_lock is None:
            RateLimiter._shared_memory_lock = asyncio.Lock()

    async def _redis_check(
        self, key: str, limit: int, window_seconds: int
    ) -> bool | None:
        """Try Redis-backed check; return ``None`` if Redis is unavailable."""
        try:
            from backend.cache.redis_cache import get_redis_cache
        except Exception as e:  # pragma: no cover - import guard
            logger.debug("Redis cache module unavailable: %s", e)
            return None

        try:
            cache = await get_redis_cache()
        except Exception as e:  # pragma: no cover - defensive
            logger.warning("RateLimiter could not obtain Redis cache: %s", e)
            return None

        if not getattr(cache, "is_connected", False):
            return None

        try:
            count = await cache.incr(key, expire_seconds=window_seconds)
        except Exception as e:
            logger.warning("RateLimiter Redis incr failed for %s: %s", key, e)
            return None

        if count is None:
            # Redis rejected the operation; fall back to memory.
            return None
        return count <= limit

    async def _memory_check(
        self, key: str, limit: int, window_seconds: int
    ) -> bool:
        """In-memory fallback: rolling fixed-window counter."""
        if RateLimiter._shared_memory_lock is None:
            RateLimiter._shared_memory_lock = asyncio.Lock()
        lock: asyncio.Lock = RateLimiter._shared_memory_lock
        counters: dict[str, _InMemoryCounter] = RateLimiter._shared_memory_counters

        now = time.monotonic()
        async with lock:
            entry = counters.get(key)
            if entry is None or (now - entry.window_start) >= window_seconds:
                counters[key] = _InMemoryCounter(count=1, window_start=now)
                return True

            entry.count += 1
            return entry.count <= limit

    async def check(self, key: str, limit: int, window_seconds: int) -> bool:
        """Return ``True`` if the request is allowed, ``False`` otherwise.

        Args:
            key: Unique counter key (e.g. ``"privacy:export:<user_id>"``).
            limit: Maximum allowed calls within the window.
            window_seconds: Rolling window size in seconds.

        Notes:
            - Fails **open** on unexpected errors so outages in Redis or
              the rate limiter itself never block GDPR rights.
            - Counters are independent per ``key``.
        """
        if limit <= 0 or window_seconds <= 0:
            # Misconfiguration – fail open rather than deny every request.
            logger.error(
                "RateLimiter called with invalid args: limit=%s, window=%s",
                limit,
                window_seconds,
            )
            return True

        try:
            redis_result = await self._redis_check(key, limit, window_seconds)
            if redis_result is not None:
                return redis_result
            return await self._memory_check(key, limit, window_seconds)
        except Exception as e:
            # Defensive: never turn a rate-limiter bug into a user-facing
            # 429 on sensitive privacy endpoints.
            logger.exception("RateLimiter.check failed for %s: %s", key, e)
            return True

    async def reset(self, key: str) -> None:
        """Reset the counter for ``key`` (primarily for tests)."""
        try:
            from backend.cache.redis_cache import get_redis_cache

            cache = await get_redis_cache()
            if getattr(cache, "is_connected", False):
                await cache.delete(key)
        except Exception:
            pass

        if RateLimiter._shared_memory_lock is None:
            RateLimiter._shared_memory_lock = asyncio.Lock()
        async with RateLimiter._shared_memory_lock:
            RateLimiter._shared_memory_counters.pop(key, None)
