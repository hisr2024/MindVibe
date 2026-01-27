"""
Cross-Session Context Service - Conversation Memory Across Sessions

Provides persistent memory across conversation sessions:
- Remember past topics and preferences
- Track emotional history and progress
- Build user understanding over time
- Enable proactive check-ins

This enables KIAAN to say "I remember you were struggling with..." like Siri/Alexa.
"""

import logging
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Tuple
from enum import Enum

logger = logging.getLogger(__name__)


class MemoryType(str, Enum):
    """Types of memories stored."""
    EMOTIONAL_STATE = "emotional_state"
    TOPIC = "topic"
    PREFERENCE = "preference"
    MILESTONE = "milestone"
    CONCERN = "concern"
    PROGRESS = "progress"
    RELATIONSHIP = "relationship"
    INSIGHT = "insight"


class MemoryPriority(str, Enum):
    """Priority levels for memory retention."""
    CRITICAL = "critical"  # Never forget (crisis, major milestones)
    HIGH = "high"  # Long-term retention (6+ months)
    MEDIUM = "medium"  # Medium retention (1-3 months)
    LOW = "low"  # Short-term (1 week)


@dataclass
class UserMemory:
    """A single memory about a user."""
    id: str
    user_id: str
    memory_type: MemoryType
    priority: MemoryPriority

    # Content
    key: str  # Short key like "anxiety_work"
    content: str  # Full description
    context: Dict[str, Any] = field(default_factory=dict)

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    access_count: int = 0

    # Confidence and decay
    confidence: float = 1.0
    decay_rate: float = 0.98  # Per day

    @property
    def current_confidence(self) -> float:
        """Get current confidence with decay applied."""
        days = (datetime.utcnow() - self.last_accessed).days
        if self.priority == MemoryPriority.CRITICAL:
            return self.confidence  # Never decay critical memories
        return self.confidence * (self.decay_rate ** days)

    def touch(self) -> None:
        """Update access time and boost confidence."""
        self.last_accessed = datetime.utcnow()
        self.access_count += 1
        self.confidence = min(1.0, self.confidence + 0.05)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "memory_type": self.memory_type.value,
            "priority": self.priority.value,
            "key": self.key,
            "content": self.content,
            "context": self.context,
            "created_at": self.created_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat(),
            "access_count": self.access_count,
            "confidence": round(self.confidence, 3),
            "current_confidence": round(self.current_confidence, 3),
        }


@dataclass
class SessionContext:
    """Context for current session, enriched with memories."""
    user_id: str
    session_id: str

    # Current session state
    current_mood: str = "neutral"
    current_topic: str = "general"
    current_intensity: float = 0.5

    # Retrieved memories for this session
    active_memories: List[UserMemory] = field(default_factory=list)

    # Session progress
    messages_count: int = 0
    session_start: datetime = field(default_factory=datetime.utcnow)

    # Proactive opportunities
    proactive_prompts: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "current_mood": self.current_mood,
            "current_topic": self.current_topic,
            "current_intensity": self.current_intensity,
            "active_memories_count": len(self.active_memories),
            "messages_count": self.messages_count,
            "session_duration_minutes": round(
                (datetime.utcnow() - self.session_start).seconds / 60, 1
            ),
            "proactive_prompts": self.proactive_prompts,
        }


class CrossSessionContextService:
    """
    Service for managing cross-session user context.

    Features:
    - Store and retrieve user memories
    - Build user understanding over time
    - Generate proactive check-in prompts
    - Reference past conversations naturally
    - Track emotional progress
    """

    # Retention periods by priority
    RETENTION_DAYS = {
        MemoryPriority.CRITICAL: 365 * 10,  # 10 years
        MemoryPriority.HIGH: 180,  # 6 months
        MemoryPriority.MEDIUM: 60,  # 2 months
        MemoryPriority.LOW: 7,  # 1 week
    }

    # Topics that create memories
    MEMORABLE_TOPICS = [
        "anxiety", "depression", "stress", "grief", "relationship",
        "work", "family", "health", "spiritual", "purpose",
        "anger", "fear", "loneliness", "growth", "goal"
    ]

    def __init__(self, redis_client=None, db_session=None):
        """Initialize cross-session context service."""
        self.redis_client = redis_client
        self.db_session = db_session
        self._user_memories: Dict[str, List[UserMemory]] = {}
        self._active_sessions: Dict[str, SessionContext] = {}
        self._memory_counter: int = 0

    def _generate_memory_id(self) -> str:
        """Generate unique memory ID."""
        self._memory_counter += 1
        return f"mem_{datetime.utcnow().strftime('%Y%m%d')}_{self._memory_counter}"

    async def start_session(
        self,
        user_id: str,
        session_id: str
    ) -> SessionContext:
        """
        Start a new session and load relevant memories.

        Args:
            user_id: User identifier
            session_id: Session identifier

        Returns:
            SessionContext with loaded memories
        """
        # Load user memories
        memories = await self._load_user_memories(user_id)

        # Get relevant memories for this session
        relevant = await self._get_relevant_memories(user_id, limit=5)

        # Create session context
        context = SessionContext(
            user_id=user_id,
            session_id=session_id,
            active_memories=relevant
        )

        # Generate proactive prompts based on memories
        context.proactive_prompts = await self._generate_proactive_prompts(user_id, memories)

        self._active_sessions[session_id] = context

        logger.info(f"Started session {session_id} with {len(relevant)} active memories")
        return context

    async def _load_user_memories(self, user_id: str) -> List[UserMemory]:
        """Load all memories for a user."""
        if user_id in self._user_memories:
            return self._user_memories[user_id]

        # Try Redis
        if self.redis_client:
            try:
                data = self.redis_client.get(f"user_memories:{user_id}")
                if data:
                    memories_data = json.loads(data)
                    memories = []
                    for m in memories_data:
                        memory = UserMemory(
                            id=m["id"],
                            user_id=user_id,
                            memory_type=MemoryType(m["memory_type"]),
                            priority=MemoryPriority(m["priority"]),
                            key=m["key"],
                            content=m["content"],
                            context=m.get("context", {}),
                            created_at=datetime.fromisoformat(m["created_at"]),
                            last_accessed=datetime.fromisoformat(m["last_accessed"]),
                            access_count=m.get("access_count", 0),
                            confidence=m.get("confidence", 1.0),
                        )
                        memories.append(memory)
                    self._user_memories[user_id] = memories
                    return memories
            except Exception as e:
                logger.warning(f"Failed to load memories from Redis: {e}")

        self._user_memories[user_id] = []
        return []

    async def _save_user_memories(self, user_id: str) -> None:
        """Save user memories to storage."""
        if user_id not in self._user_memories:
            return

        memories = self._user_memories[user_id]

        # Save to Redis
        if self.redis_client:
            try:
                data = [m.to_dict() for m in memories]
                self.redis_client.setex(
                    f"user_memories:{user_id}",
                    86400 * 365,  # 1 year
                    json.dumps(data)
                )
            except Exception as e:
                logger.warning(f"Failed to save memories to Redis: {e}")

    async def _get_relevant_memories(
        self,
        user_id: str,
        topic: Optional[str] = None,
        limit: int = 5
    ) -> List[UserMemory]:
        """Get most relevant memories for current context."""
        memories = await self._load_user_memories(user_id)

        # Filter out expired memories
        now = datetime.utcnow()
        valid_memories = []
        for m in memories:
            retention = timedelta(days=self.RETENTION_DAYS[m.priority])
            if now - m.created_at < retention:
                valid_memories.append(m)

        # Sort by relevance
        def relevance_score(m: UserMemory) -> float:
            score = m.current_confidence * 10
            # Boost recent memories
            days_ago = (now - m.last_accessed).days
            score += max(0, 5 - days_ago)
            # Boost high priority
            priority_boost = {
                MemoryPriority.CRITICAL: 10,
                MemoryPriority.HIGH: 5,
                MemoryPriority.MEDIUM: 2,
                MemoryPriority.LOW: 0,
            }
            score += priority_boost[m.priority]
            # Boost topic match
            if topic and topic.lower() in m.key.lower():
                score += 8
            return score

        valid_memories.sort(key=relevance_score, reverse=True)
        return valid_memories[:limit]

    async def store_memory(
        self,
        user_id: str,
        memory_type: MemoryType,
        key: str,
        content: str,
        priority: MemoryPriority = MemoryPriority.MEDIUM,
        context: Optional[Dict[str, Any]] = None
    ) -> UserMemory:
        """
        Store a new memory about the user.

        Args:
            user_id: User identifier
            memory_type: Type of memory
            key: Short key for the memory
            content: Full description
            priority: Memory priority
            context: Additional context

        Returns:
            Created memory
        """
        memory = UserMemory(
            id=self._generate_memory_id(),
            user_id=user_id,
            memory_type=memory_type,
            priority=priority,
            key=key,
            content=content,
            context=context or {}
        )

        if user_id not in self._user_memories:
            self._user_memories[user_id] = []

        # Check for duplicate key and update instead
        for i, existing in enumerate(self._user_memories[user_id]):
            if existing.key == key and existing.memory_type == memory_type:
                # Update existing memory
                existing.content = content
                existing.context.update(context or {})
                existing.touch()
                await self._save_user_memories(user_id)
                return existing

        self._user_memories[user_id].append(memory)
        await self._save_user_memories(user_id)

        logger.info(f"Stored memory for {user_id}: {key}")
        return memory

    async def extract_and_store_memories(
        self,
        user_id: str,
        user_message: str,
        kiaan_response: str,
        context: Optional[Dict[str, Any]] = None
    ) -> List[UserMemory]:
        """
        Automatically extract and store memories from a conversation.

        Args:
            user_id: User identifier
            user_message: User's message
            kiaan_response: KIAAN's response
            context: Additional context

        Returns:
            List of extracted memories
        """
        extracted = []
        message_lower = user_message.lower()

        # Extract topic-based memories
        for topic in self.MEMORABLE_TOPICS:
            if topic in message_lower:
                # Store as concern or topic
                memory_type = MemoryType.CONCERN if topic in ["anxiety", "depression", "grief", "fear"] else MemoryType.TOPIC

                # Extract relevant portion
                sentences = user_message.split(".")
                relevant = [s for s in sentences if topic in s.lower()]
                content = ". ".join(relevant) if relevant else user_message[:200]

                memory = await self.store_memory(
                    user_id=user_id,
                    memory_type=memory_type,
                    key=f"{topic}_{datetime.utcnow().strftime('%Y%m')}",
                    content=content,
                    priority=MemoryPriority.MEDIUM if memory_type == MemoryType.TOPIC else MemoryPriority.HIGH,
                    context=context
                )
                extracted.append(memory)

        # Store emotional state
        emotions = ["happy", "sad", "angry", "anxious", "peaceful", "hopeful", "grateful"]
        for emotion in emotions:
            if emotion in message_lower:
                memory = await self.store_memory(
                    user_id=user_id,
                    memory_type=MemoryType.EMOTIONAL_STATE,
                    key=f"mood_{emotion}",
                    content=f"User expressed feeling {emotion}",
                    priority=MemoryPriority.LOW,
                    context={"emotion": emotion, "date": datetime.utcnow().isoformat()}
                )
                extracted.append(memory)
                break

        return extracted

    async def _generate_proactive_prompts(
        self,
        user_id: str,
        memories: List[UserMemory]
    ) -> List[str]:
        """Generate proactive check-in prompts based on memories."""
        prompts = []

        # Check for recent concerns
        concerns = [m for m in memories if m.memory_type == MemoryType.CONCERN]
        for concern in concerns[:2]:
            days_ago = (datetime.utcnow() - concern.last_accessed).days
            if 3 <= days_ago <= 14:
                prompts.append(
                    f"I've been thinking about you... How is {concern.key.replace('_', ' ')} going?"
                )

        # Check for milestones
        milestones = [m for m in memories if m.memory_type == MemoryType.MILESTONE]
        for milestone in milestones:
            days_since = (datetime.utcnow() - milestone.created_at).days
            if days_since in [7, 30, 90]:
                prompts.append(
                    f"It's been {days_since} days since {milestone.content}. How are you feeling about it?"
                )

        # Check for progress patterns
        progress = [m for m in memories if m.memory_type == MemoryType.PROGRESS]
        if len(progress) >= 3:
            prompts.append(
                "I've noticed you've been making progress. Would you like to reflect on your journey?"
            )

        return prompts[:3]  # Limit to 3 prompts

    async def get_session_context(
        self,
        session_id: str
    ) -> Optional[SessionContext]:
        """Get current session context."""
        return self._active_sessions.get(session_id)

    async def update_session(
        self,
        session_id: str,
        mood: Optional[str] = None,
        topic: Optional[str] = None,
        intensity: Optional[float] = None
    ) -> None:
        """Update session context."""
        if session_id not in self._active_sessions:
            return

        context = self._active_sessions[session_id]
        if mood:
            context.current_mood = mood
        if topic:
            context.current_topic = topic
        if intensity is not None:
            context.current_intensity = intensity
        context.messages_count += 1

    async def end_session(
        self,
        session_id: str
    ) -> Optional[Dict[str, Any]]:
        """End session and return summary."""
        if session_id not in self._active_sessions:
            return None

        context = self._active_sessions[session_id]

        # Calculate session stats
        duration = (datetime.utcnow() - context.session_start).seconds / 60

        summary = {
            "session_id": session_id,
            "user_id": context.user_id,
            "duration_minutes": round(duration, 1),
            "messages_count": context.messages_count,
            "final_mood": context.current_mood,
            "topics_discussed": context.current_topic,
            "memories_accessed": len(context.active_memories),
        }

        # Store session as a memory if significant
        if duration > 5 and context.messages_count > 3:
            await self.store_memory(
                user_id=context.user_id,
                memory_type=MemoryType.INSIGHT,
                key=f"session_{session_id[:8]}",
                content=f"Had a {round(duration)}min conversation about {context.current_topic}",
                priority=MemoryPriority.LOW
            )

        del self._active_sessions[session_id]

        return summary

    async def get_user_summary(self, user_id: str) -> Dict[str, Any]:
        """Get summary of user's memory profile."""
        memories = await self._load_user_memories(user_id)

        type_counts = {}
        priority_counts = {}

        for m in memories:
            type_counts[m.memory_type.value] = type_counts.get(m.memory_type.value, 0) + 1
            priority_counts[m.priority.value] = priority_counts.get(m.priority.value, 0) + 1

        return {
            "user_id": user_id,
            "total_memories": len(memories),
            "by_type": type_counts,
            "by_priority": priority_counts,
            "oldest_memory": min(m.created_at for m in memories).isoformat() if memories else None,
            "newest_memory": max(m.created_at for m in memories).isoformat() if memories else None,
        }


# Singleton instance
_cross_session_service: Optional[CrossSessionContextService] = None


def get_cross_session_context_service(
    redis_client=None,
    db_session=None
) -> CrossSessionContextService:
    """Get singleton cross-session context service."""
    global _cross_session_service
    if _cross_session_service is None:
        _cross_session_service = CrossSessionContextService(redis_client, db_session)
    return _cross_session_service
