"""Tests for caching module."""

import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch

from backend.cache.redis_cache import (
    CacheConfig,
    CacheEntry,
    InMemoryCache,
    CacheManager,
    cache_key,
)


class TestCacheConfig:
    """Tests for CacheConfig."""

    def test_default_values(self):
        """Test default configuration values."""
        config = CacheConfig()
        assert config.default_ttl == 300
        assert config.max_ttl == 86400
        assert config.max_entries == 10000
        assert config.prefix == "mindvibe:"


class TestCacheEntry:
    """Tests for CacheEntry."""

    def test_is_expired_fresh(self):
        """Test fresh entry is not expired."""
        entry = CacheEntry(
            value="test",
            created_at=time.time(),
            expires_at=time.time() + 300,
        )
        assert entry.is_expired() is False

    def test_is_expired_old(self):
        """Test old entry is expired."""
        entry = CacheEntry(
            value="test",
            created_at=time.time() - 600,
            expires_at=time.time() - 300,
        )
        assert entry.is_expired() is True

    def test_touch_increments_hits(self):
        """Test touching entry increments hits."""
        entry = CacheEntry(
            value="test",
            created_at=time.time(),
            expires_at=time.time() + 300,
        )
        assert entry.hits == 0
        entry.touch()
        assert entry.hits == 1


class TestInMemoryCache:
    """Tests for InMemoryCache."""

    @pytest.fixture
    def cache(self):
        config = CacheConfig(max_entries=100, default_ttl=60)
        return InMemoryCache(config)

    def test_set_and_get(self, cache):
        """Test setting and getting values."""
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_nonexistent(self, cache):
        """Test getting nonexistent key returns None."""
        assert cache.get("nonexistent") is None

    def test_delete(self, cache):
        """Test deleting values."""
        cache.set("key1", "value1")
        assert cache.delete("key1") is True
        assert cache.get("key1") is None
        assert cache.delete("key1") is False

    def test_exists(self, cache):
        """Test existence check."""
        cache.set("key1", "value1")
        assert cache.exists("key1") is True
        assert cache.exists("nonexistent") is False

    def test_expiration(self, cache):
        """Test value expiration."""
        cache.set("key1", "value1", ttl=1)  # 1 second TTL
        assert cache.get("key1") == "value1"

        time.sleep(1.5)
        assert cache.get("key1") is None

    def test_lru_eviction(self):
        """Test LRU eviction when cache is full."""
        config = CacheConfig(max_entries=3)
        cache = InMemoryCache(config)

        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")
        cache.set("key4", "value4")  # Should evict key1

        assert cache.get("key1") is None
        assert cache.get("key4") == "value4"

    def test_invalidate_by_tag(self, cache):
        """Test invalidation by tag."""
        cache.set("key1", "value1", tags=["user:123"])
        cache.set("key2", "value2", tags=["user:123"])
        cache.set("key3", "value3", tags=["user:456"])

        count = cache.invalidate_by_tag("user:123")
        assert count == 2
        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.get("key3") == "value3"

    def test_invalidate_pattern(self, cache):
        """Test invalidation by pattern."""
        cache.set("user:1:profile", "value1")
        cache.set("user:2:profile", "value2")
        cache.set("product:1", "value3")

        count = cache.invalidate_pattern("user:*")
        assert count == 2
        assert cache.get("user:1:profile") is None
        assert cache.get("product:1") == "value3"

    def test_clear(self, cache):
        """Test clearing all entries."""
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.clear()

        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_stats(self, cache):
        """Test getting cache statistics."""
        cache.set("key1", "value1")
        cache.get("key1")
        cache.get("key1")

        stats = cache.stats()
        assert stats["entries"] == 1
        assert stats["total_hits"] == 2


class TestCacheManager:
    """Tests for CacheManager."""

    @pytest.fixture
    def manager(self):
        return CacheManager()  # No Redis URL - will use memory cache

    @pytest.mark.asyncio
    async def test_set_and_get(self, manager):
        """Test setting and getting values."""
        await manager.set("key1", "value1")
        result = await manager.get("key1")
        assert result == "value1"

    @pytest.mark.asyncio
    async def test_delete(self, manager):
        """Test deleting values."""
        await manager.set("key1", "value1")
        result = await manager.delete("key1")
        assert result is True
        assert await manager.get("key1") is None

    @pytest.mark.asyncio
    async def test_invalidate_by_tag(self, manager):
        """Test invalidation by tag."""
        await manager.set("key1", "value1", tags=["test"])
        await manager.set("key2", "value2", tags=["test"])

        count = await manager.invalidate_by_tag("test")
        assert count == 2

    def test_stats(self, manager):
        """Test getting cache statistics."""
        stats = manager.stats()
        assert "backend" in stats
        assert stats["backend"] == "memory"


class TestCacheKeyFunction:
    """Tests for cache_key function."""

    def test_cache_key_positional_args(self):
        """Test cache key generation with positional args."""
        key = cache_key("arg1", "arg2", "arg3")
        assert len(key) == 32  # MD5 hex

    def test_cache_key_keyword_args(self):
        """Test cache key generation with keyword args."""
        key = cache_key(user_id=123, action="view")
        assert len(key) == 32

    def test_cache_key_consistency(self):
        """Test cache key consistency."""
        key1 = cache_key("arg1", user_id=123)
        key2 = cache_key("arg1", user_id=123)
        assert key1 == key2

    def test_cache_key_uniqueness(self):
        """Test cache key uniqueness."""
        key1 = cache_key("arg1")
        key2 = cache_key("arg2")
        assert key1 != key2
