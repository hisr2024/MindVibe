"""Redis cache integration for session storage, caching, and rate limiting.

This module provides optional Redis integration for:
- Session storage
- Response caching (configurable via CACHE_KIAAN_RESPONSES)
- Rate limit tracking

KIAAN Impact: ✅ NEUTRAL - Caching is opt-in via config flag `CACHE_KIAAN_RESPONSES`.
"""

import hashlib
import json
import logging
from typing import Any

from backend.core.settings import settings

logger = logging.getLogger(__name__)

# Global Redis client instance
_redis_client: Any = None


class RedisCache:
    """Redis cache client for session storage and optional response caching.
    
    This class provides a singleton Redis client that can be used for:
    - Session storage
    - Optional KIAAN response caching (only if CACHE_KIAAN_RESPONSES is True)
    - Rate limit tracking
    
    All caching features are opt-in and configurable.
    """

    def __init__(self) -> None:
        """Initialize Redis cache client."""
        self._client: Any = None
        self._connected: bool = False

    async def connect(self) -> bool:
        """Connect to Redis server if enabled.
        
        Returns:
            bool: True if connected successfully, False otherwise.
        """
        if not settings.REDIS_ENABLED:
            logger.info("Redis is disabled via REDIS_ENABLED setting")
            return False
        
        try:
            import redis.asyncio as redis
            
            self._client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self._client.ping()
            self._connected = True
            logger.info("Successfully connected to Redis at %s", settings.REDIS_URL)
            return True
        except ImportError:
            logger.warning("Redis package not installed. Install with: pip install redis")
            return False
        except Exception as e:
            logger.warning("Failed to connect to Redis: %s", e)
            self._connected = False
            return False

    async def disconnect(self) -> None:
        """Disconnect from Redis server."""
        if self._client:
            await self._client.close()
            self._connected = False
            logger.info("Disconnected from Redis")

    @property
    def is_connected(self) -> bool:
        """Check if Redis client is connected.
        
        Returns:
            bool: True if connected to Redis.
        """
        return self._connected and self._client is not None

    async def get(self, key: str) -> str | None:
        """Get a value from Redis cache.
        
        Args:
            key: The cache key.
            
        Returns:
            The cached value or None if not found/not connected.
        """
        if not self.is_connected:
            return None
        try:
            return await self._client.get(key)
        except Exception as e:
            logger.warning("Redis GET failed for key %s: %s", key, e)
            return None

    async def set(
        self, key: str, value: str, expire_seconds: int | None = None
    ) -> bool:
        """Set a value in Redis cache.
        
        Args:
            key: The cache key.
            value: The value to cache.
            expire_seconds: Optional expiration time in seconds.
            
        Returns:
            bool: True if set successfully.
        """
        if not self.is_connected:
            return False
        try:
            if expire_seconds:
                await self._client.setex(key, expire_seconds, value)
            else:
                await self._client.set(key, value)
            return True
        except Exception as e:
            logger.warning("Redis SET failed for key %s: %s", key, e)
            return False

    async def delete(self, key: str) -> bool:
        """Delete a key from Redis cache.
        
        Args:
            key: The cache key to delete.
            
        Returns:
            bool: True if deleted successfully.
        """
        if not self.is_connected:
            return False
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.warning("Redis DELETE failed for key %s: %s", key, e)
            return False

    async def incr(self, key: str, expire_seconds: int | None = None) -> int | None:
        """Increment a counter in Redis (useful for rate limiting).
        
        Args:
            key: The counter key.
            expire_seconds: Optional expiration time for the counter.
            
        Returns:
            int: The new counter value, or None if failed.
        """
        if not self.is_connected:
            return None
        try:
            value = await self._client.incr(key)
            if expire_seconds and value == 1:
                await self._client.expire(key, expire_seconds)
            return value
        except Exception as e:
            logger.warning("Redis INCR failed for key %s: %s", key, e)
            return None

    # Session storage methods
    async def store_session(
        self, session_id: str, data: dict[str, Any], expire_seconds: int = 86400
    ) -> bool:
        """Store session data in Redis.
        
        Args:
            session_id: The session identifier.
            data: Session data to store.
            expire_seconds: Session expiration time (default: 24 hours).
            
        Returns:
            bool: True if stored successfully.
        """
        key = f"session:{session_id}"
        return await self.set(key, json.dumps(data), expire_seconds)

    async def get_session(self, session_id: str) -> dict[str, Any] | None:
        """Retrieve session data from Redis.
        
        Args:
            session_id: The session identifier.
            
        Returns:
            dict: Session data or None if not found.
        """
        key = f"session:{session_id}"
        data = await self.get(key)
        if data:
            return json.loads(data)
        return None

    async def delete_session(self, session_id: str) -> bool:
        """Delete session data from Redis.
        
        Args:
            session_id: The session identifier.
            
        Returns:
            bool: True if deleted successfully.
        """
        key = f"session:{session_id}"
        return await self.delete(key)

    # KIAAN response caching methods (only used if CACHE_KIAAN_RESPONSES is True)
    @staticmethod
    def _generate_cache_key(message: str) -> str:
        """Generate a cache key for a KIAAN message.
        
        Args:
            message: The user message.
            
        Returns:
            str: A hash-based cache key.
        """
        # Use SHA-256 hash for consistent, safe cache keys
        message_hash = hashlib.sha256(message.lower().strip().encode()).hexdigest()
        return f"kiaan:response:{message_hash}"

    async def cache_kiaan_response(
        self, message: str, response: str, expire_seconds: int = 3600
    ) -> bool:
        """Cache a KIAAN response (only if CACHE_KIAAN_RESPONSES is enabled).
        
        Args:
            message: The user message.
            response: The KIAAN response.
            expire_seconds: Cache expiration time (default: 1 hour).
            
        Returns:
            bool: True if cached successfully.
        """
        if not settings.CACHE_KIAAN_RESPONSES:
            return False
        
        key = self._generate_cache_key(message)
        return await self.set(key, response, expire_seconds)

    async def get_cached_kiaan_response(self, message: str) -> str | None:
        """Get a cached KIAAN response (only if CACHE_KIAAN_RESPONSES is enabled).
        
        Args:
            message: The user message.
            
        Returns:
            str: The cached response or None if not found/disabled.
        """
        if not settings.CACHE_KIAAN_RESPONSES:
            return None
        
        key = self._generate_cache_key(message)
        return await self.get(key)

    # Rate limiting methods
    async def check_rate_limit(
        self, key: str, limit: int, window_seconds: int
    ) -> tuple[bool, int]:
        """Check if a rate limit has been exceeded.
        
        Note: This is an optional Redis-backed rate limiting method. The primary
        rate limiting is handled by slowapi in backend/middleware/rate_limiter.py
        which uses in-memory storage by default. This Redis-backed method can be
        used for distributed rate limiting when Redis is enabled.
        
        When Redis is not connected, this method allows all requests through
        since the primary rate limiting is still active via slowapi. In production
        with multiple instances, consider ensuring Redis is available for
        consistent rate limiting across instances.
        
        Args:
            key: The rate limit key (e.g., "rate_limit:chat:192.168.1.1").
            limit: Maximum requests allowed in the window.
            window_seconds: The time window in seconds.
            
        Returns:
            tuple: (is_allowed: bool, current_count: int)
        """
        if not self.is_connected:
            # If Redis is not connected, allow the request since primary
            # rate limiting via slowapi is still active with in-memory storage.
            # Log this in production for monitoring.
            logger.debug("Redis not connected, falling back to primary rate limiter")
            return (True, 0)
        
        count = await self.incr(key, window_seconds)
        if count is None:
            return (True, 0)
        
        return (count <= limit, count)


# Singleton instance
_redis_cache: RedisCache | None = None


async def get_redis_cache() -> RedisCache:
    """Get the singleton Redis cache instance.
    
    Returns:
        RedisCache: The Redis cache instance.
    """
    global _redis_cache
    if _redis_cache is None:
        _redis_cache = RedisCache()
        await _redis_cache.connect()
    return _redis_cache
