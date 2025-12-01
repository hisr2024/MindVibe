"""Redis cache helpers."""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

import redis.asyncio as redis

from backend.core.settings import settings

logger = logging.getLogger("mindvibe.cache")


@lru_cache(maxsize=1)
def _redis_client() -> redis.Redis:
    return redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)


async def cache_get(key: str) -> Any:
    client = _redis_client()
    return await client.get(key)


async def cache_set(key: str, value: Any, ttl_seconds: int | None = None) -> None:
    client = _redis_client()
    ttl = ttl_seconds or settings.CACHE_DEFAULT_TTL_SECONDS
    await client.set(key, value, ex=ttl)


async def cache_delete(key: str) -> None:
    client = _redis_client()
    await client.delete(key)


async def cache_ping() -> bool:
    client = _redis_client()
    try:
        await client.ping()
        return True
    except Exception as exc:  # pragma: no cover - connectivity guard
        logger.warning("cache_ping_failed", extra={"error": str(exc)})
        return False

