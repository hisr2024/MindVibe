"""Redis Caching Layer for MindVibe.

This module provides comprehensive caching including:
- Redis caching for API responses (with in-memory fallback)
- Database query result caching
- Cache invalidation strategies
- Cache warming utilities
"""

import hashlib
import json
import logging
import time
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass, field
from functools import wraps
from typing import Any, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class CacheConfig:
    """Configuration for cache behavior."""

    default_ttl: int = 300  # 5 minutes
    max_ttl: int = 86400  # 24 hours
    max_entries: int = 10000
    prefix: str = "mindvibe:"
    enable_compression: bool = False
    compression_threshold: int = 1024  # Compress values larger than 1KB


@dataclass
class CacheEntry:
    """Represents a cache entry with metadata."""

    value: Any
    created_at: float
    expires_at: float
    hits: int = 0
    tags: list[str] = field(default_factory=list)

    def is_expired(self) -> bool:
        """Check if entry has expired."""
        return time.time() > self.expires_at

    def touch(self) -> None:
        """Update hit count."""
        self.hits += 1


class InMemoryCache:
    """In-memory cache implementation with LRU eviction.

    This provides a Redis-compatible interface for environments
    where Redis is not available.
    """

    def __init__(self, config: CacheConfig | None = None):
        """Initialize in-memory cache.

        Args:
            config: Cache configuration
        """
        self.config = config or CacheConfig()
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._tag_index: dict[str, set[str]] = {}

    def _make_key(self, key: str) -> str:
        """Create prefixed cache key."""
        return f"{self.config.prefix}{key}"

    def _evict_if_needed(self) -> None:
        """Evict oldest entries if cache is full."""
        while len(self._cache) >= self.config.max_entries:
            # Remove oldest entry (LRU)
            oldest_key = next(iter(self._cache))
            self._remove_from_tags(oldest_key)
            del self._cache[oldest_key]

    def _remove_from_tags(self, key: str) -> None:
        """Remove key from tag index."""
        entry = self._cache.get(key)
        if entry:
            for tag in entry.tags:
                if tag in self._tag_index:
                    self._tag_index[tag].discard(key)

    def get(self, key: str) -> Any | None:
        """Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        full_key = self._make_key(key)
        entry = self._cache.get(full_key)

        if entry is None:
            return None

        if entry.is_expired():
            self.delete(key)
            return None

        entry.touch()
        # Move to end (most recently used)
        self._cache.move_to_end(full_key)
        return entry.value

    def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
        tags: list[str] | None = None,
    ) -> bool:
        """Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            tags: Tags for cache invalidation

        Returns:
            True if successful
        """
        full_key = self._make_key(key)
        ttl = min(ttl or self.config.default_ttl, self.config.max_ttl)
        tags = tags or []

        self._evict_if_needed()

        # Remove old entry from tags if exists
        if full_key in self._cache:
            self._remove_from_tags(full_key)

        entry = CacheEntry(
            value=value,
            created_at=time.time(),
            expires_at=time.time() + ttl,
            tags=tags,
        )
        self._cache[full_key] = entry

        # Add to tag index
        for tag in tags:
            if tag not in self._tag_index:
                self._tag_index[tag] = set()
            self._tag_index[tag].add(full_key)

        return True

    def delete(self, key: str) -> bool:
        """Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if deleted, False if not found
        """
        full_key = self._make_key(key)
        if full_key in self._cache:
            self._remove_from_tags(full_key)
            del self._cache[full_key]
            return True
        return False

    def exists(self, key: str) -> bool:
        """Check if key exists and is not expired.

        Args:
            key: Cache key

        Returns:
            True if exists and not expired
        """
        return self.get(key) is not None

    def invalidate_by_tag(self, tag: str) -> int:
        """Invalidate all entries with a specific tag.

        Args:
            tag: Tag to invalidate

        Returns:
            Number of entries invalidated
        """
        if tag not in self._tag_index:
            return 0

        keys_to_delete = list(self._tag_index[tag])
        for full_key in keys_to_delete:
            if full_key in self._cache:
                self._remove_from_tags(full_key)
                del self._cache[full_key]

        del self._tag_index[tag]
        return len(keys_to_delete)

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate keys matching a pattern.

        Args:
            pattern: Pattern to match (supports * wildcard)

        Returns:
            Number of entries invalidated
        """
        import fnmatch

        full_pattern = self._make_key(pattern)
        keys_to_delete = [
            key for key in self._cache.keys() if fnmatch.fnmatch(key, full_pattern)
        ]

        for key in keys_to_delete:
            self._remove_from_tags(key)
            del self._cache[key]

        return len(keys_to_delete)

    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
        self._tag_index.clear()

    def stats(self) -> dict[str, Any]:
        """Get cache statistics.

        Returns:
            Dictionary with cache stats
        """
        total_hits = sum(entry.hits for entry in self._cache.values())
        return {
            "entries": len(self._cache),
            "max_entries": self.config.max_entries,
            "total_hits": total_hits,
            "tags": len(self._tag_index),
        }


class CacheManager:
    """Cache manager that handles both Redis and in-memory caching.

    Automatically falls back to in-memory cache if Redis is unavailable.
    """

    def __init__(
        self,
        redis_url: str | None = None,
        config: CacheConfig | None = None,
    ):
        """Initialize cache manager.

        Args:
            redis_url: Redis connection URL (optional)
            config: Cache configuration
        """
        self.config = config or CacheConfig()
        self._memory_cache = InMemoryCache(self.config)
        self._redis = None
        self._redis_available = False

        # Try to connect to Redis if URL provided
        if redis_url:
            try:
                import redis

                self._redis = redis.from_url(redis_url)
                self._redis.ping()
                self._redis_available = True
                logger.info("Redis cache connected successfully")
            except Exception as e:
                logger.warning(f"Redis not available, using in-memory cache: {e}")
                self._redis_available = False

    def _serialize(self, value: Any) -> str:
        """Serialize value for storage."""
        return json.dumps(value, default=str)

    def _deserialize(self, data: str) -> Any:
        """Deserialize value from storage."""
        return json.loads(data)

    async def get(self, key: str) -> Any | None:
        """Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        if self._redis_available:
            try:
                data = self._redis.get(f"{self.config.prefix}{key}")
                if data:
                    return self._deserialize(data)
                return None
            except Exception as e:
                logger.error(f"Redis get error: {e}")

        return self._memory_cache.get(key)

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
        tags: list[str] | None = None,
    ) -> bool:
        """Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            tags: Tags for cache invalidation

        Returns:
            True if successful
        """
        ttl = min(ttl or self.config.default_ttl, self.config.max_ttl)

        if self._redis_available:
            try:
                full_key = f"{self.config.prefix}{key}"
                self._redis.setex(full_key, ttl, self._serialize(value))

                # Store tags for invalidation
                if tags:
                    for tag in tags:
                        tag_key = f"{self.config.prefix}tag:{tag}"
                        self._redis.sadd(tag_key, full_key)
                        self._redis.expire(tag_key, self.config.max_ttl)

                return True
            except Exception as e:
                logger.error(f"Redis set error: {e}")

        return self._memory_cache.set(key, value, ttl, tags)

    async def delete(self, key: str) -> bool:
        """Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if deleted
        """
        if self._redis_available:
            try:
                return bool(self._redis.delete(f"{self.config.prefix}{key}"))
            except Exception as e:
                logger.error(f"Redis delete error: {e}")

        return self._memory_cache.delete(key)

    async def invalidate_by_tag(self, tag: str) -> int:
        """Invalidate all entries with a specific tag.

        Args:
            tag: Tag to invalidate

        Returns:
            Number of entries invalidated
        """
        if self._redis_available:
            try:
                tag_key = f"{self.config.prefix}tag:{tag}"
                keys = self._redis.smembers(tag_key)
                if keys:
                    self._redis.delete(*keys)
                    self._redis.delete(tag_key)
                return len(keys) if keys else 0
            except Exception as e:
                logger.error(f"Redis invalidate error: {e}")

        return self._memory_cache.invalidate_by_tag(tag)

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate keys matching a pattern.

        Args:
            pattern: Pattern to match

        Returns:
            Number of entries invalidated
        """
        if self._redis_available:
            try:
                full_pattern = f"{self.config.prefix}{pattern}"
                keys = list(self._redis.scan_iter(match=full_pattern))
                if keys:
                    self._redis.delete(*keys)
                return len(keys)
            except Exception as e:
                logger.error(f"Redis pattern invalidate error: {e}")

        return self._memory_cache.invalidate_pattern(pattern)

    def stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        stats = {"backend": "redis" if self._redis_available else "memory"}

        if self._redis_available:
            try:
                info = self._redis.info("stats")
                stats.update(
                    {
                        "hits": info.get("keyspace_hits", 0),
                        "misses": info.get("keyspace_misses", 0),
                    }
                )
            except Exception:
                pass
        else:
            stats.update(self._memory_cache.stats())

        return stats


# Singleton instance
cache_manager = CacheManager()


def get_cache_manager() -> CacheManager:
    """Get the singleton cache manager instance."""
    return cache_manager


def cache_key(*args: Any, **kwargs: Any) -> str:
    """Generate a cache key from arguments.

    Args:
        *args: Positional arguments
        **kwargs: Keyword arguments

    Returns:
        Cache key string
    """
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached(
    ttl: int = 300,
    tags: list[str] | None = None,
    key_prefix: str = "",
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator for caching function results.

    Args:
        ttl: Time to live in seconds
        tags: Tags for cache invalidation
        key_prefix: Prefix for cache key

    Returns:
        Decorated function
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            # Generate cache key
            key = f"{key_prefix}{func.__name__}:{cache_key(*args, **kwargs)}"

            # Try to get from cache
            result = await cache_manager.get(key)
            if result is not None:
                return result

            # Call function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(key, result, ttl, tags)
            return result

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            import asyncio

            return asyncio.get_event_loop().run_until_complete(
                async_wrapper(*args, **kwargs)
            )

        # Return appropriate wrapper based on function type
        if asyncio_function(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def asyncio_function(func: Callable[..., Any]) -> bool:
    """Check if function is async."""
    import asyncio

    return asyncio.iscoroutinefunction(func)


async def invalidate_pattern(pattern: str) -> int:
    """Convenience function to invalidate cache by pattern.

    Args:
        pattern: Pattern to match

    Returns:
        Number of entries invalidated
    """
    return await cache_manager.invalidate_pattern(pattern)
