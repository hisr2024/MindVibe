"""
Unit tests for performance optimization layer.

Tests the CacheManager functionality.

Note: This module is skipped if backend.performance.cache is not available.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json

# Skip entire module if the performance cache module doesn't exist
pytest.importorskip("backend.performance.cache", reason="backend.performance.cache module not implemented")
from backend.performance.cache import CacheManager


class TestCacheManager:
    """Test the CacheManager class."""

    def test_init(self):
        """Test CacheManager initialization."""
        cache = CacheManager()
        assert cache.redis_url == "redis://localhost:6379"
        assert cache.client is None
        assert cache.default_ttl == 300

    @pytest.mark.asyncio
    async def test_connect(self):
        """Test CacheManager connect method."""
        with patch('backend.performance.cache.redis') as mock_redis:
            mock_client = AsyncMock()
            mock_redis.from_url.return_value = mock_client
            
            cache = CacheManager()
            await cache.connect()
            
            mock_redis.from_url.assert_called_once_with(
                "redis://localhost:6379", 
                decode_responses=True
            )
            mock_client.ping.assert_called_once()
            assert cache.client == mock_client

    @pytest.mark.asyncio
    async def test_get_with_value(self):
        """Test CacheManager get method when value exists."""
        cache = CacheManager()
        cache.client = AsyncMock()
        cache.client.get.return_value = '{"key": "value"}'
        
        result = await cache.get("test_key")
        
        cache.client.get.assert_called_once_with("test_key")
        assert result == {"key": "value"}

    @pytest.mark.asyncio
    async def test_get_without_value(self):
        """Test CacheManager get method when value does not exist."""
        cache = CacheManager()
        cache.client = AsyncMock()
        cache.client.get.return_value = None
        
        result = await cache.get("test_key")
        
        cache.client.get.assert_called_once_with("test_key")
        assert result is None

    @pytest.mark.asyncio
    async def test_set_with_ttl(self):
        """Test CacheManager set method with custom TTL."""
        cache = CacheManager()
        cache.client = AsyncMock()
        
        await cache.set("test_key", {"data": "test"}, ttl=600)
        
        cache.client.setex.assert_called_once_with(
            "test_key", 
            600, 
            json.dumps({"data": "test"})
        )

    @pytest.mark.asyncio
    async def test_set_with_default_ttl(self):
        """Test CacheManager set method with default TTL."""
        cache = CacheManager()
        cache.client = AsyncMock()
        
        await cache.set("test_key", {"data": "test"})
        
        cache.client.setex.assert_called_once_with(
            "test_key", 
            300, 
            json.dumps({"data": "test"})
        )

    @pytest.mark.asyncio
    async def test_delete(self):
        """Test CacheManager delete method."""
        cache = CacheManager()
        cache.client = AsyncMock()
        
        await cache.delete("test_key")
        
        cache.client.delete.assert_called_once_with("test_key")

    @pytest.mark.asyncio
    async def test_auto_connect_on_get(self):
        """Test that get auto-connects if client is None."""
        with patch('backend.performance.cache.redis') as mock_redis:
            mock_client = AsyncMock()
            mock_client.get.return_value = None
            mock_redis.from_url.return_value = mock_client
            
            cache = CacheManager()
            result = await cache.get("test_key")
            
            mock_redis.from_url.assert_called_once()
            mock_client.ping.assert_called_once()
            assert cache.client == mock_client

    @pytest.mark.asyncio
    async def test_get_with_invalid_json(self):
        """Test CacheManager get method with invalid JSON."""
        cache = CacheManager()
        cache.client = AsyncMock()
        cache.client.get.return_value = 'invalid json{'
        
        result = await cache.get("test_key")
        
        # Should return None when JSON decode fails
        assert result is None

    @pytest.mark.asyncio
    async def test_set_with_non_serializable_value(self):
        """Test CacheManager set method with non-serializable value."""
        cache = CacheManager()
        cache.client = AsyncMock()
        
        # Try to set a non-serializable object
        non_serializable = object()
        
        with pytest.raises(TypeError):
            await cache.set("test_key", non_serializable)
