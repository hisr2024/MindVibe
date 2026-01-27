"""
KIAAN Vector Memory Service - Semantic Memory with Embeddings

This module enhances KIAAN's memory capabilities with:
1. Vector Embeddings - Semantic understanding of content
2. Similarity Search - Find related memories by meaning
3. Knowledge Graph - Track relationships between concepts
4. Long-term Learning - Persistent knowledge across sessions
"""

import asyncio
import hashlib
import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional
import numpy as np

# Optional dependencies
try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

logger = logging.getLogger(__name__)


class EmbeddingProvider(str, Enum):
    """Available embedding providers."""
    OPENAI = "openai"
    SENTENCE_TRANSFORMERS = "sentence_transformers"
    LOCAL = "local"


class MemoryType(str, Enum):
    """Types of memory KIAAN can store."""
    CONVERSATION = "conversation"
    KNOWLEDGE = "knowledge"
    CODE = "code"
    RESEARCH = "research"
    TASK = "task"
    PREFERENCE = "preference"
    SKILL = "skill"  # New: learned skills
    ENTITY = "entity"  # New: named entities


@dataclass
class VectorMemoryEntry:
    """A memory entry with vector embedding."""
    id: str
    type: MemoryType
    content: Any
    embedding: Optional[list[float]] = None
    metadata: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    accessed_at: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    relevance_score: float = 1.0
    ttl_hours: Optional[int] = None
    relationships: list[str] = field(default_factory=list)  # IDs of related memories

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "content": self.content,
            "embedding": self.embedding,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "accessed_at": self.accessed_at.isoformat(),
            "access_count": self.access_count,
            "relevance_score": self.relevance_score,
            "ttl_hours": self.ttl_hours,
            "relationships": self.relationships
        }

    @classmethod
    def from_dict(cls, data: dict) -> "VectorMemoryEntry":
        return cls(
            id=data["id"],
            type=MemoryType(data["type"]),
            content=data["content"],
            embedding=data.get("embedding"),
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(data["created_at"]),
            accessed_at=datetime.fromisoformat(data["accessed_at"]),
            access_count=data.get("access_count", 0),
            relevance_score=data.get("relevance_score", 1.0),
            ttl_hours=data.get("ttl_hours"),
            relationships=data.get("relationships", [])
        )

    def is_expired(self) -> bool:
        if self.ttl_hours is None:
            return False
        expiry = self.created_at + timedelta(hours=self.ttl_hours)
        return datetime.now() > expiry


@dataclass
class KnowledgeNode:
    """A node in the knowledge graph."""
    id: str
    name: str
    node_type: str  # concept, entity, skill, topic
    properties: dict = field(default_factory=dict)
    connections: list[tuple[str, str]] = field(default_factory=list)  # (target_id, relationship_type)


class EmbeddingService:
    """Service for generating text embeddings."""

    def __init__(self, provider: EmbeddingProvider = EmbeddingProvider.OPENAI):
        self.provider = provider
        self.openai_client: Optional[AsyncOpenAI] = None
        self.local_model: Optional[Any] = None
        self._initialized = False

    async def initialize(self) -> bool:
        """Initialize the embedding service."""
        if self._initialized:
            return True

        if self.provider == EmbeddingProvider.OPENAI and OPENAI_AVAILABLE:
            api_key = os.getenv("OPENAI_API_KEY", "").strip()
            if api_key:
                self.openai_client = AsyncOpenAI(api_key=api_key)
                self._initialized = True
                logger.info("Embedding service initialized with OpenAI")
                return True

        if self.provider == EmbeddingProvider.SENTENCE_TRANSFORMERS and SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.local_model = SentenceTransformer('all-MiniLM-L6-v2')
                self._initialized = True
                logger.info("Embedding service initialized with SentenceTransformers")
                return True
            except Exception as e:
                logger.warning(f"Failed to load SentenceTransformer: {e}")

        # Fallback to simple hashing
        self.provider = EmbeddingProvider.LOCAL
        self._initialized = True
        logger.info("Embedding service using local fallback")
        return True

    async def embed(self, text: str) -> list[float]:
        """Generate embedding for text."""
        if not self._initialized:
            await self.initialize()

        if self.provider == EmbeddingProvider.OPENAI and self.openai_client:
            try:
                response = await self.openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text[:8000]  # Truncate to model limit
                )
                return response.data[0].embedding
            except Exception as e:
                logger.warning(f"OpenAI embedding failed: {e}")

        if self.provider == EmbeddingProvider.SENTENCE_TRANSFORMERS and self.local_model:
            try:
                embedding = self.local_model.encode(text[:512])
                return embedding.tolist()
            except Exception as e:
                logger.warning(f"SentenceTransformer embedding failed: {e}")

        # Fallback: simple hash-based pseudo-embedding
        return self._hash_embed(text)

    def _hash_embed(self, text: str, dim: int = 384) -> list[float]:
        """Generate pseudo-embedding using hashing (fallback)."""
        # Create deterministic but distributed embedding
        hash_bytes = hashlib.sha512(text.encode()).digest()
        # Expand to desired dimensions
        embedding = []
        for i in range(dim):
            idx = i % len(hash_bytes)
            # Normalize to [-1, 1]
            embedding.append((hash_bytes[idx] / 127.5) - 1)
        return embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        if self.provider == EmbeddingProvider.OPENAI and self.openai_client:
            try:
                response = await self.openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=[t[:8000] for t in texts]
                )
                return [item.embedding for item in response.data]
            except Exception as e:
                logger.warning(f"OpenAI batch embedding failed: {e}")

        # Fallback to sequential
        return [await self.embed(text) for text in texts]


class KIAANVectorMemory:
    """
    Enhanced memory service with vector search capabilities.

    Features:
    - Semantic similarity search using embeddings
    - Knowledge graph for relationship tracking
    - Automatic relevance decay
    - Cross-session learning
    """

    DEFAULT_TTLS = {
        MemoryType.CONVERSATION: 24,
        MemoryType.KNOWLEDGE: None,
        MemoryType.CODE: 168,
        MemoryType.RESEARCH: 72,
        MemoryType.TASK: 24,
        MemoryType.PREFERENCE: None,
        MemoryType.SKILL: None,
        MemoryType.ENTITY: 168
    }

    def __init__(
        self,
        embedding_provider: EmbeddingProvider = EmbeddingProvider.OPENAI,
        redis_url: Optional[str] = None,
        max_memories: int = 10000
    ):
        self.embedding_service = EmbeddingService(embedding_provider)
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        self.redis_client: Optional[Any] = None
        self.max_memories = max_memories

        # In-memory storage
        self._memories: dict[str, VectorMemoryEntry] = {}
        self._embeddings: dict[str, list[float]] = {}
        self._knowledge_graph: dict[str, KnowledgeNode] = {}

        # Indexes
        self._type_index: dict[MemoryType, set[str]] = {t: set() for t in MemoryType}
        self._user_index: dict[str, set[str]] = {}
        self._entity_index: dict[str, set[str]] = {}  # entity_name -> memory_ids

        self._lock = asyncio.Lock()

    async def initialize(self) -> None:
        """Initialize the memory service."""
        await self.embedding_service.initialize()

        if REDIS_AVAILABLE and self.redis_url:
            try:
                self.redis_client = await aioredis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
                logger.info("KIAAN Vector Memory: Redis connected")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}")

    async def store(
        self,
        content: Any,
        memory_type: MemoryType,
        user_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        ttl_hours: Optional[int] = None,
        entities: Optional[list[str]] = None
    ) -> str:
        """
        Store a memory with vector embedding.

        Args:
            content: Content to store
            memory_type: Type of memory
            user_id: Optional user ID
            metadata: Additional metadata
            ttl_hours: Time to live in hours
            entities: Named entities in the content

        Returns:
            Memory ID
        """
        async with self._lock:
            # Generate ID
            # SECURITY: Use sha256 instead of md5 to reduce collision risk
            content_str = json.dumps(content, sort_keys=True, default=str)
            content_hash = hashlib.sha256(content_str.encode()).hexdigest()[:12]
            memory_id = f"{memory_type.value}_{content_hash}_{int(datetime.now().timestamp())}"

            # Generate embedding
            text_for_embedding = self._extract_text(content)
            embedding = await self.embedding_service.embed(text_for_embedding)

            # Create entry
            entry = VectorMemoryEntry(
                id=memory_id,
                type=memory_type,
                content=content,
                embedding=embedding,
                metadata={
                    **(metadata or {}),
                    "user_id": user_id,
                    "entities": entities or []
                },
                ttl_hours=ttl_hours or self.DEFAULT_TTLS.get(memory_type)
            )

            # Store
            self._memories[memory_id] = entry
            self._embeddings[memory_id] = embedding

            # Update indexes
            self._type_index[memory_type].add(memory_id)
            if user_id:
                if user_id not in self._user_index:
                    self._user_index[user_id] = set()
                self._user_index[user_id].add(memory_id)

            # Index entities
            for entity in (entities or []):
                if entity not in self._entity_index:
                    self._entity_index[entity] = set()
                self._entity_index[entity].add(memory_id)

            # Persist to Redis if available
            if self.redis_client:
                await self._persist_to_redis(entry)

            # Cleanup if over limit
            if len(self._memories) > self.max_memories:
                await self._cleanup_old_memories()

            logger.debug(f"Stored vector memory: {memory_id}")
            return memory_id

    async def semantic_search(
        self,
        query: str,
        memory_type: Optional[MemoryType] = None,
        user_id: Optional[str] = None,
        limit: int = 10,
        threshold: float = 0.5
    ) -> list[tuple[VectorMemoryEntry, float]]:
        """
        Search memories by semantic similarity.

        Args:
            query: Search query
            memory_type: Filter by type
            user_id: Filter by user
            limit: Maximum results
            threshold: Minimum similarity score (0-1)

        Returns:
            List of (memory, similarity_score) tuples
        """
        # Generate query embedding
        query_embedding = await self.embedding_service.embed(query)

        # Get candidate memories
        candidates = set(self._memories.keys())

        if memory_type:
            candidates &= self._type_index.get(memory_type, set())
        if user_id and user_id in self._user_index:
            candidates &= self._user_index[user_id]

        # Calculate similarities
        results = []
        for memory_id in candidates:
            if memory_id not in self._embeddings:
                continue

            memory = self._memories.get(memory_id)
            if memory is None or memory.is_expired():
                continue

            similarity = self._cosine_similarity(query_embedding, self._embeddings[memory_id])

            if similarity >= threshold:
                results.append((memory, similarity))

        # Sort by similarity
        results.sort(key=lambda x: x[1], reverse=True)

        # Update access counts
        for memory, _ in results[:limit]:
            memory.accessed_at = datetime.now()
            memory.access_count += 1

        return results[:limit]

    async def find_related(
        self,
        memory_id: str,
        limit: int = 5
    ) -> list[tuple[VectorMemoryEntry, float]]:
        """Find memories related to a given memory."""
        if memory_id not in self._embeddings:
            return []

        source_embedding = self._embeddings[memory_id]
        results = []

        for mid, embedding in self._embeddings.items():
            if mid == memory_id:
                continue

            memory = self._memories.get(mid)
            if memory is None or memory.is_expired():
                continue

            similarity = self._cosine_similarity(source_embedding, embedding)
            results.append((memory, similarity))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:limit]

    async def add_knowledge_node(
        self,
        name: str,
        node_type: str,
        properties: Optional[dict] = None,
        connections: Optional[list[tuple[str, str]]] = None
    ) -> str:
        """Add a node to the knowledge graph."""
        node_id = f"node_{hashlib.md5(name.encode()).hexdigest()[:8]}"

        node = KnowledgeNode(
            id=node_id,
            name=name,
            node_type=node_type,
            properties=properties or {},
            connections=connections or []
        )

        self._knowledge_graph[node_id] = node
        return node_id

    async def connect_nodes(
        self,
        source_id: str,
        target_id: str,
        relationship: str
    ) -> bool:
        """Connect two nodes in the knowledge graph."""
        if source_id not in self._knowledge_graph:
            return False
        if target_id not in self._knowledge_graph:
            return False

        self._knowledge_graph[source_id].connections.append((target_id, relationship))
        return True

    async def get_knowledge_context(
        self,
        topic: str,
        depth: int = 2
    ) -> dict:
        """Get knowledge context for a topic by traversing the graph."""
        # Find nodes matching topic
        matching_nodes = [
            node for node in self._knowledge_graph.values()
            if topic.lower() in node.name.lower()
        ]

        if not matching_nodes:
            return {"topic": topic, "nodes": [], "connections": []}

        # BFS to get connected nodes
        visited = set()
        to_visit = [(n.id, 0) for n in matching_nodes]
        result_nodes = []
        result_connections = []

        while to_visit:
            node_id, current_depth = to_visit.pop(0)
            if node_id in visited or current_depth > depth:
                continue

            visited.add(node_id)
            node = self._knowledge_graph.get(node_id)
            if node:
                result_nodes.append({
                    "id": node.id,
                    "name": node.name,
                    "type": node.node_type,
                    "properties": node.properties
                })

                for target_id, rel_type in node.connections:
                    result_connections.append({
                        "source": node_id,
                        "target": target_id,
                        "relationship": rel_type
                    })
                    to_visit.append((target_id, current_depth + 1))

        return {
            "topic": topic,
            "nodes": result_nodes,
            "connections": result_connections
        }

    async def learn_from_interaction(
        self,
        user_id: str,
        query: str,
        response: str,
        feedback: Optional[str] = None
    ) -> None:
        """Learn from a user interaction to improve future responses."""
        # Store as knowledge
        await self.store(
            content={
                "query": query,
                "response": response,
                "feedback": feedback,
                "learned_at": datetime.now().isoformat()
            },
            memory_type=MemoryType.KNOWLEDGE,
            user_id=user_id,
            metadata={"interaction_type": "learning"}
        )

        # Extract and store entities
        entities = self._extract_entities(query + " " + response)
        for entity in entities:
            await self.add_knowledge_node(
                name=entity,
                node_type="entity",
                properties={"source": "interaction", "user_id": user_id}
            )

    async def get_user_context(
        self,
        user_id: str,
        limit: int = 20
    ) -> dict:
        """Get comprehensive context for a user."""
        if user_id not in self._user_index:
            return {"user_id": user_id, "memories": [], "preferences": {}}

        memory_ids = list(self._user_index[user_id])
        memories = []

        for mid in memory_ids[:limit]:
            memory = self._memories.get(mid)
            if memory and not memory.is_expired():
                memories.append(memory.to_dict())

        # Get preferences
        preferences = {}
        for memory in memories:
            if memory["type"] == MemoryType.PREFERENCE.value:
                content = memory.get("content", {})
                if isinstance(content, dict) and "key" in content:
                    preferences[content["key"]] = content.get("value")

        return {
            "user_id": user_id,
            "memories": memories,
            "preferences": preferences,
            "memory_count": len(memory_ids)
        }

    async def delete(self, memory_id: str) -> bool:
        """Delete a memory."""
        async with self._lock:
            if memory_id not in self._memories:
                return False

            memory = self._memories[memory_id]

            # Remove from indexes
            self._type_index[memory.type].discard(memory_id)

            user_id = memory.metadata.get("user_id")
            if user_id and user_id in self._user_index:
                self._user_index[user_id].discard(memory_id)

            for entity in memory.metadata.get("entities", []):
                if entity in self._entity_index:
                    self._entity_index[entity].discard(memory_id)

            # Remove from storage
            del self._memories[memory_id]
            self._embeddings.pop(memory_id, None)

            # Remove from Redis
            if self.redis_client:
                await self.redis_client.delete(f"kiaan_vmem:{memory_id}")

            return True

    async def get_stats(self) -> dict:
        """Get memory statistics."""
        return {
            "total_memories": len(self._memories),
            "total_embeddings": len(self._embeddings),
            "knowledge_nodes": len(self._knowledge_graph),
            "by_type": {t.value: len(ids) for t, ids in self._type_index.items()},
            "users": len(self._user_index),
            "entities_tracked": len(self._entity_index),
            "embedding_provider": self.embedding_service.provider.value,
            "redis_connected": self.redis_client is not None
        }

    # Private methods

    def _extract_text(self, content: Any) -> str:
        """Extract text from content for embedding."""
        if isinstance(content, str):
            return content
        if isinstance(content, dict):
            parts = []
            for key, value in content.items():
                if isinstance(value, str):
                    parts.append(value)
                elif isinstance(value, (list, dict)):
                    parts.append(json.dumps(value, default=str))
            return " ".join(parts)
        return json.dumps(content, default=str)

    def _cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        arr1 = np.array(vec1)
        arr2 = np.array(vec2)

        dot_product = np.dot(arr1, arr2)
        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

    def _extract_entities(self, text: str) -> list[str]:
        """Extract named entities from text (simple implementation)."""
        import re
        # Simple extraction: capitalized words, code identifiers
        entities = set()

        # Capitalized phrases (potential proper nouns)
        cap_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'
        entities.update(re.findall(cap_pattern, text))

        # Code identifiers (snake_case, camelCase)
        code_pattern = r'\b[a-z]+(?:_[a-z]+)+\b|\b[a-z]+(?:[A-Z][a-z]+)+\b'
        entities.update(re.findall(code_pattern, text))

        return list(entities)[:20]  # Limit

    async def _persist_to_redis(self, entry: VectorMemoryEntry) -> None:
        """Persist memory to Redis."""
        try:
            data = entry.to_dict()
            ttl = entry.ttl_hours * 3600 if entry.ttl_hours else None

            await self.redis_client.set(
                f"kiaan_vmem:{entry.id}",
                json.dumps(data, default=str),
                ex=ttl
            )
        except Exception as e:
            logger.warning(f"Redis persist failed: {e}")

    async def _cleanup_old_memories(self) -> int:
        """Remove old/expired memories to stay under limit."""
        # Sort by access time
        sorted_memories = sorted(
            self._memories.values(),
            key=lambda m: (m.is_expired(), -m.access_count, m.accessed_at)
        )

        removed = 0
        target = len(self._memories) - int(self.max_memories * 0.8)

        for memory in sorted_memories:
            if removed >= target:
                break
            if memory.is_expired() or removed < target // 2:
                await self.delete(memory.id)
                removed += 1

        logger.info(f"Cleaned up {removed} memories")
        return removed


# Singleton instance
kiaan_vector_memory = KIAANVectorMemory()


# Export
__all__ = [
    "KIAANVectorMemory",
    "VectorMemoryEntry",
    "KnowledgeNode",
    "MemoryType",
    "EmbeddingProvider",
    "EmbeddingService",
    "kiaan_vector_memory"
]
