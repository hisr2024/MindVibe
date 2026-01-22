"""
KIAAN Memory Service - Persistent Context and Knowledge Management

This module provides KIAAN with long-term memory capabilities:
1. Session Memory - Track conversation context across interactions
2. Knowledge Memory - Store learned facts and preferences
3. Task Memory - Remember ongoing tasks and their progress
4. Code Memory - Cache analyzed code and patterns
5. Research Memory - Store research findings for reference
"""

import asyncio
import hashlib
import json
import logging
import os
import pickle
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional
from collections import OrderedDict

# Optional Redis support
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


class MemoryType(str, Enum):
    """Types of memory KIAAN can store."""
    CONVERSATION = "conversation"  # Chat history
    KNOWLEDGE = "knowledge"        # Facts and learnings
    CODE = "code"                  # Code snippets and analysis
    RESEARCH = "research"          # Research findings
    TASK = "task"                  # Task state and progress
    PREFERENCE = "preference"      # User preferences


@dataclass
class MemoryEntry:
    """A single memory entry."""
    id: str
    type: MemoryType
    content: Any
    metadata: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    accessed_at: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    relevance_score: float = 1.0
    ttl_hours: Optional[int] = None  # None = no expiration

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "content": self.content,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "accessed_at": self.accessed_at.isoformat(),
            "access_count": self.access_count,
            "relevance_score": self.relevance_score,
            "ttl_hours": self.ttl_hours
        }

    @classmethod
    def from_dict(cls, data: dict) -> "MemoryEntry":
        return cls(
            id=data["id"],
            type=MemoryType(data["type"]),
            content=data["content"],
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(data["created_at"]),
            accessed_at=datetime.fromisoformat(data["accessed_at"]),
            access_count=data.get("access_count", 0),
            relevance_score=data.get("relevance_score", 1.0),
            ttl_hours=data.get("ttl_hours")
        )

    def is_expired(self) -> bool:
        if self.ttl_hours is None:
            return False
        expiry = self.created_at + timedelta(hours=self.ttl_hours)
        return datetime.now() > expiry


class LRUCache:
    """LRU Cache for in-memory storage."""

    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self.cache: OrderedDict[str, MemoryEntry] = OrderedDict()
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[MemoryEntry]:
        async with self._lock:
            if key not in self.cache:
                return None
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            entry = self.cache[key]
            entry.accessed_at = datetime.now()
            entry.access_count += 1
            return entry

    async def set(self, key: str, entry: MemoryEntry) -> None:
        async with self._lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            else:
                if len(self.cache) >= self.max_size:
                    # Remove oldest
                    self.cache.popitem(last=False)
                self.cache[key] = entry

    async def delete(self, key: str) -> bool:
        async with self._lock:
            if key in self.cache:
                del self.cache[key]
                return True
            return False

    async def clear(self) -> None:
        async with self._lock:
            self.cache.clear()

    async def get_all(self) -> list[MemoryEntry]:
        async with self._lock:
            return list(self.cache.values())


class KIAANMemoryService:
    """
    Memory service for KIAAN's persistent context.

    Provides:
    - In-memory LRU cache for fast access
    - Optional Redis backend for persistence
    - Automatic memory cleanup (TTL, relevance decay)
    - Semantic memory retrieval
    """

    # Default TTLs by memory type (in hours)
    DEFAULT_TTLS = {
        MemoryType.CONVERSATION: 24,      # 1 day
        MemoryType.KNOWLEDGE: None,       # Permanent
        MemoryType.CODE: 168,             # 1 week
        MemoryType.RESEARCH: 72,          # 3 days
        MemoryType.TASK: 24,              # 1 day
        MemoryType.PREFERENCE: None       # Permanent
    }

    def __init__(self, redis_url: Optional[str] = None, max_cache_size: int = 1000):
        """Initialize memory service."""
        self.cache = LRUCache(max_size=max_cache_size)
        self.redis_client: Optional[Any] = None
        self.redis_url = redis_url or os.getenv("REDIS_URL")

        # Index for fast lookups by type and user
        self._type_index: dict[MemoryType, set[str]] = {t: set() for t in MemoryType}
        self._user_index: dict[str, set[str]] = {}

    async def initialize(self) -> None:
        """Initialize Redis connection if available."""
        if REDIS_AVAILABLE and self.redis_url:
            try:
                self.redis_client = await aioredis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
                logger.info("KIAAN Memory: Redis connected")
            except Exception as e:
                logger.warning(f"KIAAN Memory: Redis connection failed: {e}")
                self.redis_client = None
        else:
            logger.info("KIAAN Memory: Using in-memory storage only")

    async def store(
        self,
        content: Any,
        memory_type: MemoryType,
        user_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        ttl_hours: Optional[int] = None
    ) -> str:
        """
        Store a memory entry.

        Args:
            content: The content to store
            memory_type: Type of memory
            user_id: Optional user ID for user-specific memories
            metadata: Additional metadata
            ttl_hours: Override default TTL

        Returns:
            Memory ID
        """
        # Generate unique ID
        content_hash = hashlib.md5(
            json.dumps(content, sort_keys=True, default=str).encode()
        ).hexdigest()[:8]
        memory_id = f"{memory_type.value}_{content_hash}_{int(datetime.now().timestamp())}"

        # Create entry
        entry = MemoryEntry(
            id=memory_id,
            type=memory_type,
            content=content,
            metadata={
                **(metadata or {}),
                "user_id": user_id
            },
            ttl_hours=ttl_hours or self.DEFAULT_TTLS.get(memory_type)
        )

        # Store in cache
        await self.cache.set(memory_id, entry)

        # Update indexes
        self._type_index[memory_type].add(memory_id)
        if user_id:
            if user_id not in self._user_index:
                self._user_index[user_id] = set()
            self._user_index[user_id].add(memory_id)

        # Store in Redis if available
        if self.redis_client:
            try:
                redis_key = f"kiaan_memory:{memory_id}"
                ttl_seconds = entry.ttl_hours * 3600 if entry.ttl_hours else None

                await self.redis_client.set(
                    redis_key,
                    json.dumps(entry.to_dict(), default=str),
                    ex=ttl_seconds
                )
            except Exception as e:
                logger.warning(f"Redis store failed: {e}")

        logger.debug(f"Stored memory: {memory_id} (type: {memory_type.value})")
        return memory_id

    async def retrieve(self, memory_id: str) -> Optional[MemoryEntry]:
        """Retrieve a memory entry by ID."""
        # Try cache first
        entry = await self.cache.get(memory_id)
        if entry:
            if entry.is_expired():
                await self.delete(memory_id)
                return None
            return entry

        # Try Redis
        if self.redis_client:
            try:
                redis_key = f"kiaan_memory:{memory_id}"
                data = await self.redis_client.get(redis_key)
                if data:
                    entry = MemoryEntry.from_dict(json.loads(data))
                    # Restore to cache
                    await self.cache.set(memory_id, entry)
                    return entry
            except Exception as e:
                logger.warning(f"Redis retrieve failed: {e}")

        return None

    async def search(
        self,
        query: str,
        memory_type: Optional[MemoryType] = None,
        user_id: Optional[str] = None,
        limit: int = 10
    ) -> list[MemoryEntry]:
        """
        Search memories by content.

        Args:
            query: Search query (simple substring match for now)
            memory_type: Filter by type
            user_id: Filter by user
            limit: Maximum results

        Returns:
            List of matching memory entries
        """
        results = []

        # Get candidate IDs
        candidate_ids = set()

        if memory_type:
            candidate_ids = self._type_index.get(memory_type, set()).copy()
        else:
            for ids in self._type_index.values():
                candidate_ids.update(ids)

        if user_id and user_id in self._user_index:
            candidate_ids &= self._user_index[user_id]

        # Search through candidates
        query_lower = query.lower()
        for memory_id in candidate_ids:
            entry = await self.retrieve(memory_id)
            if entry is None:
                continue

            # Simple content matching
            content_str = json.dumps(entry.content, default=str).lower()
            if query_lower in content_str:
                results.append(entry)

            if len(results) >= limit:
                break

        # Sort by relevance and recency
        results.sort(
            key=lambda e: (e.relevance_score, e.accessed_at),
            reverse=True
        )

        return results[:limit]

    async def get_by_type(
        self,
        memory_type: MemoryType,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> list[MemoryEntry]:
        """Get all memories of a specific type."""
        results = []
        ids = self._type_index.get(memory_type, set())

        if user_id and user_id in self._user_index:
            ids = ids & self._user_index[user_id]

        for memory_id in list(ids)[:limit]:
            entry = await self.retrieve(memory_id)
            if entry and not entry.is_expired():
                results.append(entry)

        return sorted(results, key=lambda e: e.created_at, reverse=True)

    async def get_conversation_history(
        self,
        session_id: str,
        limit: int = 20
    ) -> list[dict]:
        """Get conversation history for a session."""
        memories = await self.search(
            query=session_id,
            memory_type=MemoryType.CONVERSATION,
            limit=limit
        )

        # Sort by creation time
        memories.sort(key=lambda m: m.created_at)

        return [m.content for m in memories]

    async def store_conversation_turn(
        self,
        session_id: str,
        role: str,
        content: str,
        user_id: Optional[str] = None
    ) -> str:
        """Store a conversation turn."""
        return await self.store(
            content={
                "session_id": session_id,
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat()
            },
            memory_type=MemoryType.CONVERSATION,
            user_id=user_id,
            metadata={"session_id": session_id}
        )

    async def store_knowledge(
        self,
        topic: str,
        knowledge: Any,
        source: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> str:
        """Store learned knowledge."""
        return await self.store(
            content={
                "topic": topic,
                "knowledge": knowledge,
                "source": source
            },
            memory_type=MemoryType.KNOWLEDGE,
            user_id=user_id,
            metadata={"topic": topic}
        )

    async def store_code_analysis(
        self,
        file_path: str,
        analysis: dict,
        user_id: Optional[str] = None
    ) -> str:
        """Store code analysis results."""
        return await self.store(
            content={
                "file_path": file_path,
                "analysis": analysis
            },
            memory_type=MemoryType.CODE,
            user_id=user_id,
            metadata={"file_path": file_path}
        )

    async def store_research_finding(
        self,
        query: str,
        findings: list[dict],
        sources: list[str],
        user_id: Optional[str] = None
    ) -> str:
        """Store research findings."""
        return await self.store(
            content={
                "query": query,
                "findings": findings,
                "sources": sources
            },
            memory_type=MemoryType.RESEARCH,
            user_id=user_id,
            metadata={"query": query}
        )

    async def store_task_state(
        self,
        task_id: str,
        state: dict,
        user_id: Optional[str] = None
    ) -> str:
        """Store task state for resumption."""
        return await self.store(
            content={
                "task_id": task_id,
                "state": state
            },
            memory_type=MemoryType.TASK,
            user_id=user_id,
            metadata={"task_id": task_id}
        )

    async def store_preference(
        self,
        user_id: str,
        preference_key: str,
        preference_value: Any
    ) -> str:
        """Store user preference."""
        return await self.store(
            content={
                "key": preference_key,
                "value": preference_value
            },
            memory_type=MemoryType.PREFERENCE,
            user_id=user_id,
            metadata={"preference_key": preference_key}
        )

    async def get_user_preferences(self, user_id: str) -> dict:
        """Get all preferences for a user."""
        prefs = await self.get_by_type(
            memory_type=MemoryType.PREFERENCE,
            user_id=user_id
        )
        return {
            p.content["key"]: p.content["value"]
            for p in prefs
        }

    async def delete(self, memory_id: str) -> bool:
        """Delete a memory entry."""
        # Remove from cache
        deleted = await self.cache.delete(memory_id)

        # Remove from indexes
        for type_ids in self._type_index.values():
            type_ids.discard(memory_id)
        for user_ids in self._user_index.values():
            user_ids.discard(memory_id)

        # Remove from Redis
        if self.redis_client:
            try:
                await self.redis_client.delete(f"kiaan_memory:{memory_id}")
            except Exception as e:
                logger.warning(f"Redis delete failed: {e}")

        return deleted

    async def cleanup_expired(self) -> int:
        """Remove expired memories. Returns count of removed entries."""
        removed = 0
        all_entries = await self.cache.get_all()

        for entry in all_entries:
            if entry.is_expired():
                await self.delete(entry.id)
                removed += 1

        logger.info(f"KIAAN Memory: Cleaned up {removed} expired entries")
        return removed

    async def get_stats(self) -> dict:
        """Get memory statistics."""
        stats = {
            "total_entries": sum(len(ids) for ids in self._type_index.values()),
            "by_type": {
                t.value: len(ids) for t, ids in self._type_index.items()
            },
            "users_with_memories": len(self._user_index),
            "redis_connected": self.redis_client is not None
        }
        return stats


# Singleton instance
kiaan_memory = KIAANMemoryService()


# Export
__all__ = [
    "KIAANMemoryService",
    "MemoryEntry",
    "MemoryType",
    "kiaan_memory"
]
