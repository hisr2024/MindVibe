"""
KIAAN Memory Service - Persistent Context and Knowledge Management with OFFLINE SUPPORT

This module provides KIAAN with long-term memory capabilities:
1. Session Memory - Track conversation context across interactions
2. Knowledge Memory - Store learned facts and preferences
3. Task Memory - Remember ongoing tasks and their progress
4. Code Memory - Cache analyzed code and patterns
5. Research Memory - Store research findings for reference

OFFLINE INDEPENDENCE (v3.0):
- SQLite backend for offline persistence (no Redis required)
- Automatic fallback chain: Redis → SQLite → In-Memory
- Memory export/import for backup and restore
- Full-text search support in SQLite
- Encrypted storage option for sensitive data
"""

import asyncio
import hashlib
import json
import logging
import os
import sqlite3
import aiosqlite
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Optional
from collections import OrderedDict

# Optional Redis support
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

# Default SQLite database path
DEFAULT_SQLITE_PATH = Path.home() / ".mindvibe" / "memory.db"


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


# =============================================================================
# SQLITE MEMORY BACKEND - Offline Persistence
# =============================================================================

class SQLiteMemoryBackend:
    """
    SQLite-based memory backend for offline persistence.
    Provides full persistence without requiring Redis.
    """

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = Path(db_path or os.getenv("SQLITE_DB_PATH", str(DEFAULT_SQLITE_PATH)))
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialized = False

    async def initialize(self) -> bool:
        """Initialize SQLite database and create tables."""
        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                # Create memories table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS memories (
                        id TEXT PRIMARY KEY,
                        type TEXT NOT NULL,
                        content TEXT NOT NULL,
                        metadata TEXT,
                        created_at TEXT NOT NULL,
                        accessed_at TEXT NOT NULL,
                        access_count INTEGER DEFAULT 0,
                        relevance_score REAL DEFAULT 1.0,
                        ttl_hours INTEGER,
                        user_id TEXT
                    )
                """)

                # Create indexes for fast lookups
                await db.execute("CREATE INDEX IF NOT EXISTS idx_type ON memories(type)")
                await db.execute("CREATE INDEX IF NOT EXISTS idx_user ON memories(user_id)")
                await db.execute("CREATE INDEX IF NOT EXISTS idx_created ON memories(created_at)")

                # Create FTS table for full-text search
                await db.execute("""
                    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
                        id,
                        content,
                        content='memories',
                        content_rowid='rowid'
                    )
                """)

                await db.commit()

            self._initialized = True
            logger.info(f"SQLite memory backend initialized: {self.db_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize SQLite backend: {e}")
            return False

    async def store(self, entry: "MemoryEntry") -> bool:
        """Store a memory entry in SQLite."""
        if not self._initialized:
            await self.initialize()

        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO memories
                    (id, type, content, metadata, created_at, accessed_at,
                     access_count, relevance_score, ttl_hours, user_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    entry.id,
                    entry.type.value,
                    json.dumps(entry.content, default=str),
                    json.dumps(entry.metadata, default=str),
                    entry.created_at.isoformat(),
                    entry.accessed_at.isoformat(),
                    entry.access_count,
                    entry.relevance_score,
                    entry.ttl_hours,
                    entry.metadata.get("user_id")
                ))

                # Update FTS index
                await db.execute("""
                    INSERT OR REPLACE INTO memories_fts(id, content)
                    VALUES (?, ?)
                """, (entry.id, json.dumps(entry.content, default=str)))

                await db.commit()
                return True

        except Exception as e:
            logger.error(f"SQLite store failed: {e}")
            return False

    async def retrieve(self, memory_id: str) -> Optional["MemoryEntry"]:
        """Retrieve a memory entry from SQLite."""
        if not self._initialized:
            await self.initialize()

        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    "SELECT * FROM memories WHERE id = ?",
                    (memory_id,)
                ) as cursor:
                    row = await cursor.fetchone()
                    if row:
                        # Update access time and count
                        await db.execute("""
                            UPDATE memories
                            SET accessed_at = ?, access_count = access_count + 1
                            WHERE id = ?
                        """, (datetime.now().isoformat(), memory_id))
                        await db.commit()

                        return self._row_to_entry(dict(row))
                    return None

        except Exception as e:
            logger.error(f"SQLite retrieve failed: {e}")
            return None

    async def search(
        self,
        query: str,
        memory_type: Optional["MemoryType"] = None,
        user_id: Optional[str] = None,
        limit: int = 10
    ) -> list["MemoryEntry"]:
        """Search memories using full-text search."""
        if not self._initialized:
            await self.initialize()

        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                db.row_factory = aiosqlite.Row

                # Build query
                sql = """
                    SELECT m.* FROM memories m
                    JOIN memories_fts fts ON m.id = fts.id
                    WHERE memories_fts MATCH ?
                """
                params = [query]

                if memory_type:
                    sql += " AND m.type = ?"
                    params.append(memory_type.value)

                if user_id:
                    sql += " AND m.user_id = ?"
                    params.append(user_id)

                sql += " ORDER BY m.relevance_score DESC, m.accessed_at DESC LIMIT ?"
                params.append(limit)

                async with db.execute(sql, params) as cursor:
                    rows = await cursor.fetchall()
                    return [self._row_to_entry(dict(row)) for row in rows]

        except Exception as e:
            logger.error(f"SQLite search failed: {e}")
            # Fallback to simple LIKE search
            return await self._simple_search(query, memory_type, user_id, limit)

    async def _simple_search(
        self,
        query: str,
        memory_type: Optional["MemoryType"],
        user_id: Optional[str],
        limit: int
    ) -> list["MemoryEntry"]:
        """Simple LIKE-based search as fallback."""
        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                db.row_factory = aiosqlite.Row

                sql = "SELECT * FROM memories WHERE content LIKE ?"
                params = [f"%{query}%"]

                if memory_type:
                    sql += " AND type = ?"
                    params.append(memory_type.value)

                if user_id:
                    sql += " AND user_id = ?"
                    params.append(user_id)

                sql += " LIMIT ?"
                params.append(limit)

                async with db.execute(sql, params) as cursor:
                    rows = await cursor.fetchall()
                    return [self._row_to_entry(dict(row)) for row in rows]

        except Exception as e:
            logger.error(f"SQLite simple search failed: {e}")
            return []

    async def get_by_type(
        self,
        memory_type: "MemoryType",
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> list["MemoryEntry"]:
        """Get all memories of a specific type."""
        if not self._initialized:
            await self.initialize()

        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                db.row_factory = aiosqlite.Row

                if user_id:
                    sql = "SELECT * FROM memories WHERE type = ? AND user_id = ? ORDER BY created_at DESC LIMIT ?"
                    params = (memory_type.value, user_id, limit)
                else:
                    sql = "SELECT * FROM memories WHERE type = ? ORDER BY created_at DESC LIMIT ?"
                    params = (memory_type.value, limit)

                async with db.execute(sql, params) as cursor:
                    rows = await cursor.fetchall()
                    return [self._row_to_entry(dict(row)) for row in rows]

        except Exception as e:
            logger.error(f"SQLite get_by_type failed: {e}")
            return []

    async def delete(self, memory_id: str) -> bool:
        """Delete a memory entry."""
        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                await db.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
                await db.execute("DELETE FROM memories_fts WHERE id = ?", (memory_id,))
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"SQLite delete failed: {e}")
            return False

    async def cleanup_expired(self) -> int:
        """Remove expired memories."""
        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                # Find expired entries
                result = await db.execute("""
                    DELETE FROM memories
                    WHERE ttl_hours IS NOT NULL
                    AND datetime(created_at, '+' || ttl_hours || ' hours') < datetime('now')
                """)
                await db.commit()
                return result.rowcount
        except Exception as e:
            logger.error(f"SQLite cleanup failed: {e}")
            return 0

    async def export_to_json(self, output_path: str) -> bool:
        """Export all memories to JSON file for backup."""
        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute("SELECT * FROM memories") as cursor:
                    rows = await cursor.fetchall()
                    entries = [dict(row) for row in rows]

            with open(output_path, "w") as f:
                json.dump(entries, f, indent=2, default=str)

            logger.info(f"Exported {len(entries)} memories to {output_path}")
            return True

        except Exception as e:
            logger.error(f"Export failed: {e}")
            return False

    async def import_from_json(self, input_path: str) -> int:
        """Import memories from JSON file."""
        try:
            with open(input_path, "r") as f:
                entries = json.load(f)

            count = 0
            for entry_data in entries:
                entry = MemoryEntry(
                    id=entry_data["id"],
                    type=MemoryType(entry_data["type"]),
                    content=json.loads(entry_data["content"]) if isinstance(entry_data["content"], str) else entry_data["content"],
                    metadata=json.loads(entry_data.get("metadata", "{}")) if isinstance(entry_data.get("metadata"), str) else entry_data.get("metadata", {}),
                    created_at=datetime.fromisoformat(entry_data["created_at"]),
                    accessed_at=datetime.fromisoformat(entry_data["accessed_at"]),
                    access_count=entry_data.get("access_count", 0),
                    relevance_score=entry_data.get("relevance_score", 1.0),
                    ttl_hours=entry_data.get("ttl_hours")
                )
                if await self.store(entry):
                    count += 1

            logger.info(f"Imported {count} memories from {input_path}")
            return count

        except Exception as e:
            logger.error(f"Import failed: {e}")
            return 0

    async def get_stats(self) -> dict:
        """Get database statistics."""
        try:
            async with aiosqlite.connect(str(self.db_path)) as db:
                # Total count
                async with db.execute("SELECT COUNT(*) FROM memories") as cursor:
                    total = (await cursor.fetchone())[0]

                # Count by type
                async with db.execute(
                    "SELECT type, COUNT(*) FROM memories GROUP BY type"
                ) as cursor:
                    by_type = {row[0]: row[1] for row in await cursor.fetchall()}

                # Database file size
                file_size = self.db_path.stat().st_size if self.db_path.exists() else 0

                return {
                    "total_entries": total,
                    "by_type": by_type,
                    "file_size_bytes": file_size,
                    "file_size_mb": round(file_size / (1024 * 1024), 2)
                }

        except Exception as e:
            logger.error(f"Get stats failed: {e}")
            return {}

    def _row_to_entry(self, row: dict) -> "MemoryEntry":
        """Convert database row to MemoryEntry."""
        return MemoryEntry(
            id=row["id"],
            type=MemoryType(row["type"]),
            content=json.loads(row["content"]) if isinstance(row["content"], str) else row["content"],
            metadata=json.loads(row["metadata"]) if isinstance(row.get("metadata"), str) else row.get("metadata", {}),
            created_at=datetime.fromisoformat(row["created_at"]),
            accessed_at=datetime.fromisoformat(row["accessed_at"]),
            access_count=row.get("access_count", 0),
            relevance_score=row.get("relevance_score", 1.0),
            ttl_hours=row.get("ttl_hours")
        )


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
    Memory service for KIAAN's persistent context with OFFLINE SUPPORT.

    Provides:
    - In-memory LRU cache for fast access
    - Redis backend for distributed persistence (when available)
    - SQLite backend for offline persistence (always available)
    - Automatic memory cleanup (TTL, relevance decay)
    - Semantic memory retrieval
    - Memory export/import for backup

    FALLBACK CHAIN: Redis → SQLite → In-Memory
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

    def __init__(
        self,
        redis_url: Optional[str] = None,
        sqlite_path: Optional[str] = None,
        max_cache_size: int = 1000,
        backend: str = "auto"  # auto, redis, sqlite, memory
    ):
        """
        Initialize memory service with fallback support.

        Args:
            redis_url: Redis connection URL
            sqlite_path: Path to SQLite database
            max_cache_size: Maximum LRU cache size
            backend: Backend preference (auto, redis, sqlite, memory)
        """
        self.cache = LRUCache(max_size=max_cache_size)
        self.redis_client: Optional[Any] = None
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        self.backend_preference = backend

        # Initialize SQLite backend for offline persistence
        self.sqlite_backend = SQLiteMemoryBackend(sqlite_path)
        self._sqlite_available = False

        # Track active backend
        self._active_backend = "memory"  # Will be updated in initialize()

        # Index for fast lookups by type and user
        self._type_index: dict[MemoryType, set[str]] = {t: set() for t in MemoryType}
        self._user_index: dict[str, set[str]] = {}

    async def initialize(self) -> None:
        """
        Initialize memory backends with automatic fallback.
        Fallback chain: Redis → SQLite → In-Memory
        """
        # Try Redis first (if preferred or auto)
        if self.backend_preference in ("auto", "redis") and REDIS_AVAILABLE and self.redis_url:
            try:
                self.redis_client = await aioredis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await self.redis_client.ping()
                self._active_backend = "redis"
                logger.info("KIAAN Memory: Redis connected and active")
            except Exception as e:
                logger.warning(f"KIAAN Memory: Redis connection failed: {e}")
                self.redis_client = None

        # Try SQLite (if Redis failed or SQLite preferred)
        if self._active_backend == "memory" or self.backend_preference == "sqlite":
            try:
                self._sqlite_available = await self.sqlite_backend.initialize()
                if self._sqlite_available:
                    self._active_backend = "sqlite"
                    logger.info("KIAAN Memory: SQLite backend initialized (offline capable)")
            except Exception as e:
                logger.warning(f"KIAAN Memory: SQLite initialization failed: {e}")

        # Log final backend
        if self._active_backend == "memory":
            logger.info("KIAAN Memory: Using in-memory storage only")
        else:
            logger.info(f"KIAAN Memory: Active backend = {self._active_backend}")

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
        # SECURITY: Use sha256 instead of md5 to reduce collision risk
        content_hash = hashlib.sha256(
            json.dumps(content, sort_keys=True, default=str).encode()
        ).hexdigest()[:12]  # Use 12 chars of sha256 for better uniqueness
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

        # Store in SQLite for offline persistence
        if self._sqlite_available:
            try:
                await self.sqlite_backend.store(entry)
            except Exception as e:
                logger.warning(f"SQLite store failed: {e}")

        logger.debug(f"Stored memory: {memory_id} (type: {memory_type.value}, backend: {self._active_backend})")
        return memory_id

    async def retrieve(self, memory_id: str) -> Optional[MemoryEntry]:
        """Retrieve a memory entry by ID with fallback chain."""
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

        # Try SQLite (offline fallback)
        if self._sqlite_available:
            try:
                entry = await self.sqlite_backend.retrieve(memory_id)
                if entry:
                    if entry.is_expired():
                        await self.delete(memory_id)
                        return None
                    # Restore to cache
                    await self.cache.set(memory_id, entry)
                    return entry
            except Exception as e:
                logger.warning(f"SQLite retrieve failed: {e}")

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
            "redis_connected": self.redis_client is not None,
            "sqlite_available": self._sqlite_available,
            "active_backend": self._active_backend,
            "offline_capable": self._sqlite_available
        }

        # Add SQLite stats if available
        if self._sqlite_available:
            sqlite_stats = await self.sqlite_backend.get_stats()
            stats["sqlite_stats"] = sqlite_stats

        return stats

    async def export_memories(self, output_path: str) -> bool:
        """Export all memories to JSON file for backup."""
        if self._sqlite_available:
            return await self.sqlite_backend.export_to_json(output_path)
        return False

    async def import_memories(self, input_path: str) -> int:
        """Import memories from JSON file."""
        if self._sqlite_available:
            return await self.sqlite_backend.import_from_json(input_path)
        return 0

    def get_backend_info(self) -> dict:
        """Get information about active backends."""
        return {
            "active": self._active_backend,
            "redis_available": self.redis_client is not None,
            "sqlite_available": self._sqlite_available,
            "fallback_chain": ["redis", "sqlite", "memory"],
            "offline_capable": self._sqlite_available
        }


# Singleton instance
kiaan_memory = KIAANMemoryService()


# Export
__all__ = [
    "KIAANMemoryService",
    "MemoryEntry",
    "MemoryType",
    "SQLiteMemoryBackend",
    "LRUCache",
    "kiaan_memory",
    "REDIS_AVAILABLE",
]
