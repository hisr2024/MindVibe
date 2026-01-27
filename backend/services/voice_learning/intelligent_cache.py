"""
Intelligent Cache Service - Frequency + Predictive Caching

Provides smart caching for voice responses:
- Frequency-based cache priorities
- Predictive pre-caching of likely next responses
- Importance scoring for cache eviction
- Context-aware caching strategies

This enables instant voice responses for common queries, like Siri/Alexa.
"""

import logging
import hashlib
import json
import heapq
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Set
from pathlib import Path
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """An entry in the intelligent cache."""
    key: str
    content_hash: str
    data: bytes
    content_type: str  # "audio", "text", "ssml"

    # Importance metrics
    frequency: int = 1
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)

    # Metadata
    language: str = "en"
    voice_type: str = "friendly"
    context: str = "general"
    size_bytes: int = 0

    # Importance flags
    is_core_response: bool = False  # Welcome messages, common greetings
    is_verse: bool = False  # Gita verses (never change)
    is_meditation: bool = False  # Meditation scripts

    @property
    def priority_score(self) -> float:
        """Calculate priority score for cache eviction (higher = keep longer)."""
        # Base score from frequency
        score = min(100, self.frequency * 10)

        # Boost for core content
        if self.is_core_response:
            score += 200
        if self.is_verse:
            score += 150
        if self.is_meditation:
            score += 100

        # Decay based on age
        age_hours = (datetime.utcnow() - self.last_accessed).total_seconds() / 3600
        decay = max(0.1, 1.0 - (age_hours / 168))  # 1 week decay
        score *= decay

        return score

    def touch(self) -> None:
        """Update access time and frequency."""
        self.last_accessed = datetime.utcnow()
        self.frequency += 1

    def to_dict(self) -> Dict:
        return {
            "key": self.key,
            "content_hash": self.content_hash,
            "content_type": self.content_type,
            "frequency": self.frequency,
            "last_accessed": self.last_accessed.isoformat(),
            "created_at": self.created_at.isoformat(),
            "size_bytes": self.size_bytes,
            "priority_score": round(self.priority_score, 2),
            "is_core_response": self.is_core_response,
            "is_verse": self.is_verse,
            "is_meditation": self.is_meditation,
        }


@dataclass
class CachePrediction:
    """A prediction for what to pre-cache."""
    key: str
    probability: float
    reason: str
    context: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "key": self.key,
            "probability": round(self.probability, 3),
            "reason": self.reason,
            "context": self.context,
        }


class IntelligentCacheService:
    """
    Intelligent caching service for voice responses.

    Features:
    - Priority-based cache with importance scoring
    - Pre-caching of predicted next responses
    - Core content protection (never evicted)
    - Context-aware cache warming
    - LRU with importance weighting
    """

    # Maximum cache size in bytes (default 500MB)
    MAX_CACHE_SIZE_BYTES = 500 * 1024 * 1024

    # Core phrases that should always be cached
    CORE_PHRASES = [
        "Welcome to KIAAN, your sacred companion",
        "Take a gentle breath with me",
        "I am here with you",
        "Let's begin with a calming breath",
        "I'm here, fully present",
        "Go gently, dear soul",
        "You are held, always",
        "Peace be with you",
    ]

    # Common Gita verses to pre-cache
    CORE_VERSES = [
        "2.47",  # Karma Yoga - "Your right is to action alone"
        "2.48",  # Equanimity
        "2.14",  # Impermanence of sensations
        "6.5",   # Self-elevation
        "6.35",  # Mind mastery through practice
        "18.66", # Surrender
    ]

    # Transition patterns for prediction
    TRANSITION_PATTERNS = {
        "greeting": ["breathing_intro", "mood_check"],
        "breathing_intro": ["anxiety_response", "meditation_start"],
        "anxiety_response": ["verse_comfort", "practical_guidance"],
        "verse_comfort": ["reflection_prompt", "farewell"],
        "meditation_start": ["meditation_body", "meditation_end"],
        "farewell": [],  # Terminal
    }

    def __init__(
        self,
        redis_client=None,
        cache_dir: Optional[str] = None,
        max_size_bytes: int = MAX_CACHE_SIZE_BYTES
    ):
        """Initialize intelligent cache service."""
        self.redis_client = redis_client
        self.cache_dir = Path(cache_dir) if cache_dir else Path.home() / ".mindvibe" / "intelligent_cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.max_size_bytes = max_size_bytes

        self._cache: Dict[str, CacheEntry] = {}
        self._current_size_bytes: int = 0
        self._access_sequence: List[str] = []  # For pattern detection
        self._prediction_hits: int = 0
        self._prediction_total: int = 0

        # Load existing cache index
        self._load_cache_index()

    def _load_cache_index(self) -> None:
        """Load cache index from disk."""
        index_file = self.cache_dir / "cache_index.json"
        if index_file.exists():
            try:
                with open(index_file, "r") as f:
                    data = json.load(f)
                    for key, entry_data in data.get("entries", {}).items():
                        entry = CacheEntry(
                            key=key,
                            content_hash=entry_data.get("content_hash", ""),
                            data=b"",  # Will load on access
                            content_type=entry_data.get("content_type", "audio"),
                            frequency=entry_data.get("frequency", 1),
                            last_accessed=datetime.fromisoformat(entry_data["last_accessed"]),
                            created_at=datetime.fromisoformat(entry_data["created_at"]),
                            size_bytes=entry_data.get("size_bytes", 0),
                            is_core_response=entry_data.get("is_core_response", False),
                            is_verse=entry_data.get("is_verse", False),
                            is_meditation=entry_data.get("is_meditation", False),
                        )
                        self._cache[key] = entry
                        self._current_size_bytes += entry.size_bytes

                logger.info(f"Loaded {len(self._cache)} cache entries")
            except Exception as e:
                logger.warning(f"Failed to load cache index: {e}")

    def _save_cache_index(self) -> None:
        """Save cache index to disk."""
        index_file = self.cache_dir / "cache_index.json"
        try:
            data = {
                "entries": {
                    key: entry.to_dict()
                    for key, entry in self._cache.items()
                },
                "stats": {
                    "total_size_bytes": self._current_size_bytes,
                    "entry_count": len(self._cache),
                    "prediction_hit_rate": self.prediction_hit_rate,
                }
            }
            with open(index_file, "w") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.warning(f"Failed to save cache index: {e}")

    def _generate_key(
        self,
        text: str,
        language: str = "en",
        voice_type: str = "friendly",
        context: str = "general"
    ) -> str:
        """Generate cache key."""
        content = f"{text}:{language}:{voice_type}:{context}"
        # SECURITY: Use sha256 instead of md5 for consistency
        return hashlib.sha256(content.encode()).hexdigest()

    @property
    def prediction_hit_rate(self) -> float:
        """Get prediction hit rate."""
        if self._prediction_total == 0:
            return 0.0
        return self._prediction_hits / self._prediction_total

    async def get(
        self,
        text: str,
        language: str = "en",
        voice_type: str = "friendly",
        context: str = "general"
    ) -> Optional[bytes]:
        """
        Get cached content if available.

        Args:
            text: Text content
            language: Language code
            voice_type: Voice type
            context: Context type

        Returns:
            Cached bytes or None
        """
        key = self._generate_key(text, language, voice_type, context)

        if key not in self._cache:
            return None

        entry = self._cache[key]
        entry.touch()

        # Track access for prediction
        self._access_sequence.append(context)
        if len(self._access_sequence) > 100:
            self._access_sequence = self._access_sequence[-100:]

        # Load data if not in memory
        if not entry.data:
            data_file = self.cache_dir / f"{key}.bin"
            if data_file.exists():
                with open(data_file, "rb") as f:
                    entry.data = f.read()
            else:
                return None

        logger.debug(f"Cache hit: {key} (frequency: {entry.frequency})")
        return entry.data

    async def set(
        self,
        text: str,
        data: bytes,
        language: str = "en",
        voice_type: str = "friendly",
        context: str = "general",
        content_type: str = "audio",
        is_core: bool = False,
        is_verse: bool = False,
        is_meditation: bool = False
    ) -> None:
        """
        Cache content with intelligent priority.

        Args:
            text: Text content
            data: Bytes to cache
            language: Language code
            voice_type: Voice type
            context: Context type
            content_type: Type of content
            is_core: Is this a core response
            is_verse: Is this a verse
            is_meditation: Is this meditation content
        """
        key = self._generate_key(text, language, voice_type, context)
        size = len(data)

        # Check if we need to evict
        while self._current_size_bytes + size > self.max_size_bytes:
            await self._evict_lowest_priority()

        # Create entry
        entry = CacheEntry(
            key=key,
            content_hash=hashlib.sha256(data).hexdigest(),
            data=data,
            content_type=content_type,
            language=language,
            voice_type=voice_type,
            context=context,
            size_bytes=size,
            is_core_response=is_core or any(phrase.lower() in text.lower() for phrase in self.CORE_PHRASES),
            is_verse=is_verse,
            is_meditation=is_meditation,
        )

        # Save data to disk
        data_file = self.cache_dir / f"{key}.bin"
        with open(data_file, "wb") as f:
            f.write(data)

        self._cache[key] = entry
        self._current_size_bytes += size

        # Persist index periodically
        if len(self._cache) % 10 == 0:
            self._save_cache_index()

        logger.debug(f"Cached: {key} ({size} bytes, priority: {entry.priority_score:.1f})")

    async def _evict_lowest_priority(self) -> None:
        """Evict the lowest priority cache entry."""
        if not self._cache:
            return

        # Find lowest priority entry that isn't core
        lowest_key = None
        lowest_score = float("inf")

        for key, entry in self._cache.items():
            if entry.is_core_response or entry.is_verse:
                continue  # Never evict core content
            if entry.priority_score < lowest_score:
                lowest_score = entry.priority_score
                lowest_key = key

        if lowest_key:
            entry = self._cache[lowest_key]
            self._current_size_bytes -= entry.size_bytes

            # Remove from disk
            data_file = self.cache_dir / f"{lowest_key}.bin"
            if data_file.exists():
                data_file.unlink()

            del self._cache[lowest_key]
            logger.debug(f"Evicted: {lowest_key} (score: {lowest_score:.1f})")

    async def predict_next(
        self,
        current_context: str,
        user_state: Optional[Dict[str, Any]] = None
    ) -> List[CachePrediction]:
        """
        Predict what to pre-cache based on current context.

        Args:
            current_context: Current conversation context
            user_state: Optional user state information

        Returns:
            List of cache predictions
        """
        predictions: List[CachePrediction] = []
        self._prediction_total += 1

        # Use transition patterns
        next_contexts = self.TRANSITION_PATTERNS.get(current_context, [])
        for i, next_ctx in enumerate(next_contexts):
            probability = 0.7 - (i * 0.2)  # Decrease for later options
            predictions.append(CachePrediction(
                key=next_ctx,
                probability=probability,
                reason=f"Common transition from {current_context}",
                context={"source": current_context}
            ))

        # Boost based on user state
        if user_state:
            mood = user_state.get("mood", "neutral")
            if mood == "anxious":
                predictions.append(CachePrediction(
                    key="anxiety_response",
                    probability=0.8,
                    reason="User is anxious",
                    context={"mood": mood}
                ))
                predictions.append(CachePrediction(
                    key="breathing_exercise",
                    probability=0.7,
                    reason="Breathing helps anxiety",
                    context={"mood": mood}
                ))

        return predictions

    async def warm_cache(
        self,
        predictions: List[CachePrediction],
        generator_fn
    ) -> int:
        """
        Pre-cache predicted content.

        Args:
            predictions: List of cache predictions
            generator_fn: Async function to generate content if not cached

        Returns:
            Number of items pre-cached
        """
        warmed = 0

        for prediction in predictions:
            if prediction.probability < 0.5:
                continue  # Only pre-cache high probability predictions

            # Check if already cached
            key = prediction.key
            if key in self._cache:
                continue

            try:
                # Generate and cache
                data = await generator_fn(prediction.context)
                if data:
                    await self.set(
                        text=key,
                        data=data,
                        context=prediction.context.get("type", "general")
                    )
                    warmed += 1
                    logger.debug(f"Pre-cached: {key}")
            except Exception as e:
                logger.warning(f"Failed to pre-cache {key}: {e}")

        return warmed

    async def warm_core_content(self, tts_service) -> int:
        """
        Pre-cache core phrases and verses.

        Args:
            tts_service: TTS service to generate audio

        Returns:
            Number of items cached
        """
        warmed = 0

        # Cache core phrases
        for phrase in self.CORE_PHRASES:
            key = self._generate_key(phrase, "en", "friendly", "general")
            if key not in self._cache:
                try:
                    audio = tts_service.synthesize(phrase, "en", "friendly")
                    if audio:
                        await self.set(
                            text=phrase,
                            data=audio,
                            is_core=True
                        )
                        warmed += 1
                except Exception as e:
                    logger.warning(f"Failed to cache core phrase: {e}")

        logger.info(f"Warmed {warmed} core content items")
        return warmed

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_frequency = sum(e.frequency for e in self._cache.values())
        core_count = sum(1 for e in self._cache.values() if e.is_core_response)
        verse_count = sum(1 for e in self._cache.values() if e.is_verse)

        return {
            "entry_count": len(self._cache),
            "size_bytes": self._current_size_bytes,
            "size_mb": round(self._current_size_bytes / 1024 / 1024, 2),
            "max_size_mb": round(self.max_size_bytes / 1024 / 1024, 2),
            "utilization": round(self._current_size_bytes / self.max_size_bytes, 3),
            "total_frequency": total_frequency,
            "avg_frequency": round(total_frequency / max(1, len(self._cache)), 2),
            "core_entries": core_count,
            "verse_entries": verse_count,
            "prediction_hit_rate": round(self.prediction_hit_rate, 3),
        }

    async def cleanup(self) -> int:
        """Clean up old and low-priority entries."""
        initial_count = len(self._cache)
        cutoff = datetime.utcnow() - timedelta(days=30)

        keys_to_remove = []
        for key, entry in self._cache.items():
            # Don't remove core content
            if entry.is_core_response or entry.is_verse:
                continue
            # Remove old low-frequency entries
            if entry.last_accessed < cutoff and entry.frequency < 5:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            entry = self._cache[key]
            self._current_size_bytes -= entry.size_bytes
            data_file = self.cache_dir / f"{key}.bin"
            if data_file.exists():
                data_file.unlink()
            del self._cache[key]

        self._save_cache_index()

        removed = len(keys_to_remove)
        logger.info(f"Cleaned up {removed} cache entries")
        return removed


# Singleton instance
_intelligent_cache_service: Optional[IntelligentCacheService] = None


def get_intelligent_cache_service(
    redis_client=None,
    cache_dir: Optional[str] = None
) -> IntelligentCacheService:
    """Get singleton intelligent cache service."""
    global _intelligent_cache_service
    if _intelligent_cache_service is None:
        _intelligent_cache_service = IntelligentCacheService(redis_client, cache_dir)
    return _intelligent_cache_service
