"""Redis cache integration for session storage, caching, rate limiting, and Pub/Sub.

This module provides Redis integration for:
- Session storage
- Response caching (configurable via CACHE_KIAAN_RESPONSES)
- Rate limit tracking
- Distributed Pub/Sub for WebSocket message broadcast across instances
- Connection pooling for multi-instance deployments
- Automatic reconnection with exponential backoff when Redis becomes unavailable
"""

import asyncio
import hashlib
import json
import logging
from collections.abc import Callable
from typing import Any

from backend.core.settings import settings

logger = logging.getLogger(__name__)

# Global Redis client instance
_redis_client: Any = None

# Reconnect loop configuration
_RECONNECT_INITIAL_BACKOFF = 5  # seconds
_RECONNECT_MAX_BACKOFF = 60  # seconds
_HEALTH_CHECK_INTERVAL = 30  # seconds


class RedisCache:
    """Redis cache client with connection pooling, Pub/Sub, and auto-reconnection.

    Provides a singleton Redis client for session storage, optional response
    caching, rate limit tracking, and distributed Pub/Sub messaging for
    multi-instance deployments. Automatically reconnects to Redis with
    exponential backoff when the connection is lost or unavailable at startup.
    """

    def __init__(self) -> None:
        """Initialize Redis cache client."""
        self._client: Any = None
        self._connected: bool = False
        self._pool: Any = None
        self._reconnect_task: asyncio.Task | None = None
        self._reconnect_callbacks: list[Callable] = []
        self._max_reconnect_backoff: int = _RECONNECT_MAX_BACKOFF

    async def _cleanup_stale_pool(self) -> None:
        """Close any existing client and pool before creating a new connection."""
        if self._client:
            try:
                await self._client.close()
            except Exception:
                pass
            self._client = None
        if self._pool:
            try:
                await self._pool.disconnect()
            except Exception:
                pass
            self._pool = None

    async def connect(self) -> bool:
        """Connect to Redis server with connection pooling if enabled.

        Cleans up any stale connection pool before attempting a new connection.

        Returns:
            bool: True if connected successfully, False otherwise.
        """
        if not settings.REDIS_ENABLED:
            logger.info("Redis is disabled via REDIS_ENABLED setting")
            return False

        # Clean up any stale pool/client from a previous failed attempt
        await self._cleanup_stale_pool()

        try:
            import redis.asyncio as redis

            # Use connection pool for multi-instance resilience
            self._pool = redis.ConnectionPool.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
                socket_connect_timeout=settings.REDIS_SOCKET_TIMEOUT,
                retry_on_timeout=settings.REDIS_RETRY_ON_TIMEOUT,
            )
            self._client = redis.Redis(connection_pool=self._pool)
            # Test connection
            await self._client.ping()
            self._connected = True
            logger.info(
                "Successfully connected to Redis at %s (pool_size=%d)",
                settings.REDIS_URL,
                settings.REDIS_MAX_CONNECTIONS,
            )
            return True
        except ImportError:
            logger.warning(
                "Redis package not installed. Install with: pip install redis"
            )
            return False
        except Exception as e:
            logger.warning("Failed to connect to Redis: %s", e)
            self._connected = False
            return False

    async def disconnect(self) -> None:
        """Disconnect from Redis server, cancel reconnect loop, and close pool."""
        # Cancel the reconnect loop if running
        if self._reconnect_task and not self._reconnect_task.done():
            self._reconnect_task.cancel()
            try:
                await self._reconnect_task
            except asyncio.CancelledError:
                pass
            self._reconnect_task = None

        if self._client:
            await self._client.close()
            self._connected = False
            logger.info("Disconnected from Redis")
        if self._pool:
            await self._pool.disconnect()
            self._pool = None

    @property
    def is_connected(self) -> bool:
        """Check if Redis client is connected.

        Returns:
            bool: True if connected to Redis.
        """
        return self._connected and self._client is not None

    def get_client(self) -> Any:
        """Return the raw redis.asyncio client for direct use (e.g. slowapi storage).

        Returns:
            The underlying Redis client, or None if not connected.
        """
        if self.is_connected:
            return self._client
        return None

    # --- Reconnection infrastructure ---

    def register_on_reconnect(self, callback: Callable) -> None:
        """Register a callback to invoke when Redis reconnects.

        Callbacks may be sync or async. They are called in order and
        failures in one callback do not prevent others from running.

        Args:
            callback: A sync or async callable to invoke on reconnection.
        """
        self._reconnect_callbacks.append(callback)

    async def start_reconnect_loop(self) -> None:
        """Start the background reconnection and health-check loop.

        When connected: periodically pings Redis to detect failures early.
        When disconnected: attempts reconnection with exponential backoff
        (5s -> 10s -> 20s -> 40s -> 60s cap).

        On successful reconnection, all registered callbacks are fired to
        re-enable dependent services (rate limiter, heartbeat, DDoS, etc.).
        """
        if self._reconnect_task and not self._reconnect_task.done():
            return  # already running
        self._reconnect_task = asyncio.create_task(
            self._reconnect_loop(), name="redis_reconnect"
        )

    async def _reconnect_loop(self) -> None:
        """Core reconnection loop (runs as a background task).

        Exits early if REDIS_URL points to localhost in production (the Redis
        service isn't linked — retrying will never succeed).
        """
        import os as _os
        _env = _os.getenv("ENVIRONMENT", "development").lower()
        _is_prod = _env in ("production", "prod")
        _is_localhost = "localhost" in settings.REDIS_URL or "127.0.0.1" in settings.REDIS_URL
        if _is_prod and _is_localhost and not self._connected:
            logger.warning(
                "Redis reconnect loop skipped: REDIS_URL points to localhost in production. "
                "Set REDIS_URL to your external Redis service connection string."
            )
            return

        backoff = _RECONNECT_INITIAL_BACKOFF
        while True:
            try:
                if self._connected:
                    # Health check: verify connection is still alive
                    await asyncio.sleep(_HEALTH_CHECK_INTERVAL)
                    try:
                        if self._client:
                            await self._client.ping()
                    except Exception:
                        logger.warning(
                            "Redis connection lost (health check failed), "
                            "will attempt reconnection"
                        )
                        self._connected = False
                        backoff = _RECONNECT_INITIAL_BACKOFF
                else:
                    # Disconnected — attempt reconnection
                    await asyncio.sleep(backoff)
                    logger.info(
                        "Attempting Redis reconnection (backoff=%ds)...", backoff
                    )
                    success = await self.connect()
                    if success:
                        logger.info(
                            "✅ Redis reconnected successfully after backoff"
                        )
                        backoff = _RECONNECT_INITIAL_BACKOFF
                        await self._fire_reconnect_callbacks()
                    else:
                        backoff = min(backoff * 2, self._max_reconnect_backoff)
            except asyncio.CancelledError:
                logger.info("Redis reconnect loop cancelled")
                return
            except Exception as e:
                logger.warning("Unexpected error in reconnect loop: %s", e)
                await asyncio.sleep(backoff)

    async def _fire_reconnect_callbacks(self) -> None:
        """Invoke all registered reconnection callbacks."""
        for cb in self._reconnect_callbacks:
            try:
                result = cb()
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                logger.warning("Reconnect callback failed: %s", e)

    def _mark_disconnected_on_error(self, exc: Exception) -> None:
        """Mark connection as lost if the error indicates a connection failure."""
        exc_type = type(exc).__name__
        if "Connection" in exc_type or "Timeout" in exc_type:
            self._connected = False

    # --- Cache operations ---

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
            self._mark_disconnected_on_error(e)
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
            self._mark_disconnected_on_error(e)
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
            self._mark_disconnected_on_error(e)
            return False

    async def exists(self, key: str) -> bool:
        """Check if a key exists in Redis.

        Args:
            key: The cache key.

        Returns:
            bool: True if key exists.
        """
        if not self.is_connected:
            return False
        try:
            return bool(await self._client.exists(key))
        except Exception as e:
            logger.warning("Redis EXISTS failed for key %s: %s", key, e)
            self._mark_disconnected_on_error(e)
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
            self._mark_disconnected_on_error(e)
            return None

    # --- Pub/Sub methods for distributed WebSocket messaging ---

    async def publish(self, channel: str, message: str) -> int:
        """Publish a message to a Redis Pub/Sub channel.

        Used by the distributed ConnectionManager to broadcast WebSocket
        messages across multiple API instances.

        Args:
            channel: The channel name (e.g. "chat:room:{room_id}").
            message: JSON-encoded message payload.

        Returns:
            int: Number of subscribers that received the message, or 0 on failure.
        """
        if not self.is_connected:
            return 0
        try:
            return await self._client.publish(channel, message)
        except Exception as e:
            logger.warning("Redis PUBLISH failed on channel %s: %s", channel, e)
            self._mark_disconnected_on_error(e)
            return 0

    async def subscribe(self, *channels: str) -> Any:
        """Subscribe to one or more Redis Pub/Sub channels.

        Returns an async pubsub object. Caller must iterate over messages
        with `async for message in pubsub.listen()`.

        Args:
            channels: One or more channel names to subscribe to.

        Returns:
            A redis.asyncio PubSub object, or None if not connected.
        """
        if not self.is_connected:
            return None
        try:
            pubsub = self._client.pubsub()
            await pubsub.subscribe(*channels)
            return pubsub
        except Exception as e:
            logger.warning("Redis SUBSCRIBE failed for channels %s: %s", channels, e)
            self._mark_disconnected_on_error(e)
            return None

    # --- Sorted set methods for distributed DDoS tracking ---

    async def zadd(
        self, key: str, mapping: dict[str, float], expire_seconds: int | None = None
    ) -> int:
        """Add members with scores to a sorted set.

        Args:
            key: The sorted set key.
            mapping: Dict of {member: score}.
            expire_seconds: Optional TTL for the key.

        Returns:
            int: Number of new elements added.
        """
        if not self.is_connected:
            return 0
        try:
            result = await self._client.zadd(key, mapping)
            if expire_seconds:
                await self._client.expire(key, expire_seconds)
            return result
        except Exception as e:
            logger.warning("Redis ZADD failed for key %s: %s", key, e)
            self._mark_disconnected_on_error(e)
            return 0

    async def zcount(self, key: str, min_score: float, max_score: float) -> int:
        """Count members in a sorted set within a score range.

        Args:
            key: The sorted set key.
            min_score: Minimum score (inclusive).
            max_score: Maximum score (inclusive).

        Returns:
            int: Count of members in range.
        """
        if not self.is_connected:
            return 0
        try:
            return await self._client.zcount(key, min_score, max_score)
        except Exception as e:
            logger.warning("Redis ZCOUNT failed for key %s: %s", key, e)
            self._mark_disconnected_on_error(e)
            return 0

    async def zremrangebyscore(
        self, key: str, min_score: float, max_score: float
    ) -> int:
        """Remove members from a sorted set by score range.

        Args:
            key: The sorted set key.
            min_score: Minimum score.
            max_score: Maximum score.

        Returns:
            int: Number of members removed.
        """
        if not self.is_connected:
            return 0
        try:
            return await self._client.zremrangebyscore(key, min_score, max_score)
        except Exception as e:
            logger.warning("Redis ZREMRANGEBYSCORE failed for key %s: %s", key, e)
            self._mark_disconnected_on_error(e)
            return 0

    async def hincrby(self, key: str, field: str, amount: int = 1) -> int | None:
        """Increment a hash field by the given amount.

        Args:
            key: The hash key.
            field: The field to increment.
            amount: Increment value.

        Returns:
            int: New value after increment, or None on failure.
        """
        if not self.is_connected:
            return None
        try:
            return await self._client.hincrby(key, field, amount)
        except Exception as e:
            logger.warning(
                "Redis HINCRBY failed for key %s field %s: %s", key, field, e
            )
            self._mark_disconnected_on_error(e)
            return None

    async def hget(self, key: str, field: str) -> str | None:
        """Get a single field from a hash.

        Args:
            key: The hash key.
            field: The field name.

        Returns:
            str: The field value, or None.
        """
        if not self.is_connected:
            return None
        try:
            return await self._client.hget(key, field)
        except Exception as e:
            logger.warning("Redis HGET failed for key %s field %s: %s", key, field, e)
            self._mark_disconnected_on_error(e)
            return None

    async def hset(self, key: str, field: str, value: str) -> bool:
        """Set a hash field value.

        Args:
            key: The hash key.
            field: The field name.
            value: The value to set.

        Returns:
            bool: True if set successfully.
        """
        if not self.is_connected:
            return False
        try:
            await self._client.hset(key, field, value)
            return True
        except Exception as e:
            logger.warning("Redis HSET failed for key %s field %s: %s", key, field, e)
            self._mark_disconnected_on_error(e)
            return False

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

        When Redis is not connected, this method allows all requests through
        since the primary rate limiting is still active via slowapi.

        Args:
            key: The rate limit key (e.g., "rate_limit:chat:192.168.1.1").
            limit: Maximum requests allowed in the window.
            window_seconds: The time window in seconds.

        Returns:
            tuple: (is_allowed: bool, current_count: int)
        """
        if not self.is_connected:
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
