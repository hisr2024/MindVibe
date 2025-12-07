import redis.asyncio as redis
import json
import os
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.client = None
        self.default_ttl = 300
    
    async def connect(self):
        """Connect to Redis and test the connection."""
        self.client = redis.from_url(self.redis_url, decode_responses=True)
        # Test connection
        await self.client.ping()
    
    async def get(self, key: str) -> Optional[Any]:
        if not self.client:
            await self.connect()
        value = await self.client.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to decode cached value for key {key}: {e}")
                return None
        return None
    
    async def set(self, key: str, value: Any, ttl: int = None):
        if not self.client:
            await self.connect()
        try:
            serialized = json.dumps(value)
            await self.client.setex(key, ttl or self.default_ttl, serialized)
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to JSON serialize value for key {key}: {e}")
            raise
    
    async def delete(self, key: str):
        if not self.client:
            await self.connect()
        await self.client.delete(key)

cache = CacheManager()
