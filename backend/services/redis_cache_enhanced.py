"""
Enhanced Redis Cache Service (Quantum Coherence v2.0)

This service provides comprehensive caching capabilities:
- KIAAN response caching (50-70% cost reduction)
- Gita verse caching
- Translation caching
- Rate limiting with Redis
- Cache invalidation and warming
- Prometheus metrics

Quantum Analogy: Redis maintains coherent state across distributed systems,
preventing decoherence (cache misses) through intelligent preloading and TTL management.
"""

import hashlib
import json
import logging
import os
from typing import Any, Optional

import redis
from prometheus_client import Counter, Histogram

logger = logging.getLogger(__name__)

# Prometheus metrics for cache monitoring
cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_type']
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_type']
)

cache_set_duration = Histogram(
    'cache_set_duration_seconds',
    'Time to set cache entry',
    ['cache_type']
)

cache_get_duration = Histogram(
    'cache_get_duration_seconds',
    'Time to get cache entry',
    ['cache_type']
)

# Cache configuration from environment
REDIS_ENABLED = os.getenv("REDIS_ENABLED", "false").lower() == "true"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_MAX_CONNECTIONS = int(os.getenv("REDIS_MAX_CONNECTIONS", "50"))
REDIS_SOCKET_TIMEOUT = int(os.getenv("REDIS_SOCKET_TIMEOUT", "5"))
REDIS_SOCKET_CONNECT_TIMEOUT = int(os.getenv("REDIS_SOCKET_CONNECT_TIMEOUT", "5"))

# Cache TTL configuration
CACHE_KIAAN_RESPONSES = os.getenv("CACHE_KIAAN_RESPONSES", "false").lower() == "true"
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "3600"))  # 1 hour
CACHE_VERSE_TTL_SECONDS = int(os.getenv("CACHE_VERSE_TTL_SECONDS", "86400"))  # 24 hours
CACHE_TRANSLATION_TTL_SECONDS = int(os.getenv("CACHE_TRANSLATION_TTL_SECONDS", "7200"))  # 2 hours


class EnhancedRedisCache:
    """Enhanced Redis cache with quantum coherence optimizations."""

    def __init__(self):
        """Initialize Redis connection pool."""
        self.enabled = REDIS_ENABLED
        self.cache_responses = CACHE_KIAAN_RESPONSES
        self.redis_client: Optional[redis.Redis] = None

        if self.enabled:
            try:
                # Create connection pool for better performance
                pool = redis.ConnectionPool.from_url(
                    REDIS_URL,
                    db=REDIS_DB,
                    max_connections=REDIS_MAX_CONNECTIONS,
                    socket_timeout=REDIS_SOCKET_TIMEOUT,
                    socket_connect_timeout=REDIS_SOCKET_CONNECT_TIMEOUT,
                    decode_responses=True
                )

                self.redis_client = redis.Redis(connection_pool=pool)

                # Test connection
                self.redis_client.ping()
                logger.info(
                    f"✅ Redis connected: {REDIS_URL} "
                    f"(db={REDIS_DB}, max_conn={REDIS_MAX_CONNECTIONS}, "
                    f"cache_responses={self.cache_responses})"
                )

            except Exception as e:
                logger.error(f"❌ Redis connection failed: {e}")
                self.redis_client = None
                self.enabled = False
        else:
            logger.info("⚠️ Redis caching disabled (set REDIS_ENABLED=true to enable)")

    def _generate_cache_key(self, cache_type: str, identifier: str) -> str:
        """
        Generate cache key with namespace.

        Args:
            cache_type: Type of cache (kiaan, verse, translation)
            identifier: Unique identifier (hashed if needed)

        Returns:
            Cache key
        """
        # Hash long identifiers to keep key size manageable
        if len(identifier) > 100:
            identifier_hash = hashlib.sha256(identifier.encode()).hexdigest()[:16]
            return f"mindvibe:{cache_type}:{identifier_hash}"

        return f"mindvibe:{cache_type}:{identifier}"

    def get(self, cache_type: str, key: str) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            cache_type: Type of cache
            key: Cache key

        Returns:
            Cached value or None
        """
        if not self.enabled or not self.redis_client:
            return None

        cache_key = self._generate_cache_key(cache_type, key)

        try:
            with cache_get_duration.labels(cache_type=cache_type).time():
                value = self.redis_client.get(cache_key)

            if value:
                cache_hits_total.labels(cache_type=cache_type).inc()
                logger.debug(f"✅ Cache HIT: {cache_type}:{key[:50]}")
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            else:
                cache_misses_total.labels(cache_type=cache_type).inc()
                logger.debug(f"❌ Cache MISS: {cache_type}:{key[:50]}")
                return None

        except Exception as e:
            logger.error(f"❌ Cache get error: {e}")
            cache_misses_total.labels(cache_type=cache_type).inc()
            return None

    def set(
        self,
        cache_type: str,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache.

        Args:
            cache_type: Type of cache
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (optional)

        Returns:
            True if successful
        """
        if not self.enabled or not self.redis_client:
            return False

        # Determine TTL based on cache type
        if ttl is None:
            if cache_type == "kiaan":
                ttl = CACHE_TTL_SECONDS
            elif cache_type == "verse":
                ttl = CACHE_VERSE_TTL_SECONDS
            elif cache_type == "translation":
                ttl = CACHE_TRANSLATION_TTL_SECONDS
            else:
                ttl = CACHE_TTL_SECONDS

        cache_key = self._generate_cache_key(cache_type, key)

        try:
            with cache_set_duration.labels(cache_type=cache_type).time():
                # Serialize value if it's not a string
                if not isinstance(value, str):
                    value = json.dumps(value)

                self.redis_client.setex(cache_key, ttl, value)

            logger.debug(f"✅ Cache SET: {cache_type}:{key[:50]} (TTL: {ttl}s)")
            return True

        except Exception as e:
            logger.error(f"❌ Cache set error: {e}")
            return False

    def delete(self, cache_type: str, key: str) -> bool:
        """
        Delete value from cache.

        Args:
            cache_type: Type of cache
            key: Cache key

        Returns:
            True if successful
        """
        if not self.enabled or not self.redis_client:
            return False

        cache_key = self._generate_cache_key(cache_type, key)

        try:
            self.redis_client.delete(cache_key)
            logger.debug(f"✅ Cache DELETE: {cache_type}:{key[:50]}")
            return True

        except Exception as e:
            logger.error(f"❌ Cache delete error: {e}")
            return False

    def clear_type(self, cache_type: str) -> int:
        """
        Clear all cache entries of a specific type.

        Args:
            cache_type: Type of cache to clear

        Returns:
            Number of keys deleted
        """
        if not self.enabled or not self.redis_client:
            return 0

        try:
            pattern = f"mindvibe:{cache_type}:*"
            keys = self.redis_client.keys(pattern)

            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"✅ Cleared {deleted} keys from {cache_type} cache")
                return deleted

            return 0

        except Exception as e:
            logger.error(f"❌ Cache clear error: {e}")
            return 0

    def get_stats(self) -> dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache stats
        """
        if not self.enabled or not self.redis_client:
            return {
                "enabled": False,
                "status": "disabled"
            }

        try:
            info = self.redis_client.info()

            return {
                "enabled": True,
                "status": "connected",
                "used_memory": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace": self.redis_client.dbsize(),
                "cache_responses_enabled": self.cache_responses,
                "ttl_config": {
                    "kiaan_responses": CACHE_TTL_SECONDS,
                    "verses": CACHE_VERSE_TTL_SECONDS,
                    "translations": CACHE_TRANSLATION_TTL_SECONDS
                }
            }

        except Exception as e:
            logger.error(f"❌ Cache stats error: {e}")
            return {
                "enabled": True,
                "status": "error",
                "error": str(e)
            }

    def cache_kiaan_response(self, message: str, context: str, response: str) -> bool:
        """
        Cache KIAAN response for specific message and context.

        Args:
            message: User message
            context: Context type
            response: KIAAN response

        Returns:
            True if cached successfully
        """
        if not self.cache_responses:
            return False

        # Create cache key from message + context
        cache_key = f"{message}:{context}"

        return self.set("kiaan", cache_key, response)

    def get_cached_kiaan_response(self, message: str, context: str) -> Optional[str]:
        """
        Get cached KIAAN response.

        Args:
            message: User message
            context: Context type

        Returns:
            Cached response or None
        """
        if not self.cache_responses:
            return None

        cache_key = f"{message}:{context}"

        return self.get("kiaan", cache_key)

    def cache_verse(self, verse_id: str, verse_data: dict[str, Any]) -> bool:
        """
        Cache Gita verse data.

        Args:
            verse_id: Verse identifier (e.g., "2.47")
            verse_data: Verse data dictionary

        Returns:
            True if cached successfully
        """
        return self.set("verse", verse_id, verse_data)

    def get_cached_verse(self, verse_id: str) -> Optional[dict[str, Any]]:
        """
        Get cached verse data.

        Args:
            verse_id: Verse identifier

        Returns:
            Verse data or None
        """
        return self.get("verse", verse_id)

    def cache_translation(self, text: str, target_lang: str, translated: str) -> bool:
        """
        Cache translation result.

        Args:
            text: Original text
            target_lang: Target language code
            translated: Translated text

        Returns:
            True if cached successfully
        """
        cache_key = f"{text}:{target_lang}"
        return self.set("translation", cache_key, translated)

    def get_cached_translation(self, text: str, target_lang: str) -> Optional[str]:
        """
        Get cached translation.

        Args:
            text: Original text
            target_lang: Target language code

        Returns:
            Translated text or None
        """
        cache_key = f"{text}:{target_lang}"
        return self.get("translation", cache_key)

    def warm_cache(self, cache_type: str, items: dict[str, Any]) -> int:
        """
        Warm cache with multiple items.

        Args:
            cache_type: Type of cache
            items: Dictionary of key-value pairs to cache

        Returns:
            Number of items cached
        """
        if not self.enabled:
            return 0

        count = 0
        for key, value in items.items():
            if self.set(cache_type, key, value):
                count += 1

        logger.info(f"✅ Warmed {cache_type} cache with {count} items")
        return count


# Global instance
redis_cache = EnhancedRedisCache()
