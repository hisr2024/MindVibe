import redis.asyncio as redis
import json
import os
from typing import Optional, Any

class CacheManager:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.client = None
        self.default_ttl = 300
    
    async def connect(self):
        self.client = await redis.from_url(self.redis_url, decode_responses=True)
    
    async def get(self, key: str) -> Optional[Any]:
        if not self.client:
            await self.connect()
        value = await self.client.get(key)
        return json.loads(value) if value else None
    
    async def set(self, key: str, value: Any, ttl: int = None):
        if not self.client:
            await self.connect()
        await self.client.setex(key, ttl or self.default_ttl, json.dumps(value))
    
    async def delete(self, key: str):
        if not self.client:
            await self.connect()
        await self.client.delete(key)

cache = CacheManager()
