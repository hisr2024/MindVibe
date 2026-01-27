"""
Offline Learning Sync Service

Enables voice learning to continue even when the user is offline by:
- Queuing feedback signals locally
- Syncing when connection is restored
- Providing local sentiment analysis fallback
- Caching personalization settings

Features:
- Conflict resolution for sync
- Batch processing for efficiency
- Priority-based sync ordering
- Data integrity verification
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import asyncio
import logging
import json
import hashlib
from collections import defaultdict

logger = logging.getLogger(__name__)


class SyncStatus(Enum):
    """Status of sync operations."""
    PENDING = "pending"
    SYNCING = "syncing"
    SYNCED = "synced"
    FAILED = "failed"
    CONFLICT = "conflict"


class SyncPriority(Enum):
    """Priority levels for sync items."""
    CRITICAL = 1  # Must sync immediately
    HIGH = 2      # Sync soon
    NORMAL = 3    # Standard sync
    LOW = 4       # Sync when convenient
    BACKGROUND = 5  # Sync in background


class DataType(Enum):
    """Types of data that can be synced."""
    FEEDBACK = "feedback"
    PREFERENCE = "preference"
    MEMORY = "memory"
    SESSION = "session"
    EMOTION = "emotion"
    CACHE = "cache"


@dataclass
class SyncItem:
    """An item pending sync."""
    id: str
    data_type: DataType
    data: Dict[str, Any]
    priority: SyncPriority
    created_at: datetime
    status: SyncStatus = SyncStatus.PENDING
    retry_count: int = 0
    last_error: Optional[str] = None
    checksum: Optional[str] = None
    user_id: Optional[str] = None

    def __post_init__(self):
        if not self.checksum:
            self.checksum = self._calculate_checksum()

    def _calculate_checksum(self) -> str:
        """Calculate checksum for data integrity."""
        data_str = json.dumps(self.data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()


@dataclass
class SyncResult:
    """Result of a sync operation."""
    success: bool
    synced_count: int
    failed_count: int
    conflicts: List[SyncItem]
    errors: List[str]
    duration_ms: float


@dataclass
class OfflineCache:
    """Cached data for offline use."""
    user_preferences: Dict[str, Any] = field(default_factory=dict)
    recent_emotions: List[Dict[str, Any]] = field(default_factory=list)
    sentiment_keywords: Dict[str, str] = field(default_factory=dict)
    voice_settings: Dict[str, Any] = field(default_factory=dict)
    cached_at: datetime = field(default_factory=datetime.utcnow)


class OfflineSyncService:
    """
    Service for managing offline learning data and synchronization.

    Ensures that voice learning continues seamlessly even without
    network connectivity, with proper sync when connection returns.
    """

    def __init__(self):
        self._sync_queue: List[SyncItem] = []
        self._offline_cache: Dict[str, OfflineCache] = {}
        self._sync_in_progress = False
        self._connection_status = True
        self._sync_callbacks: List[Callable] = []
        self._conflict_resolvers: Dict[DataType, Callable] = {}
        self._initialized = False

        # Configuration
        self._max_queue_size = 10000
        self._max_retries = 3
        self._batch_size = 100
        self._sync_interval_seconds = 30
        self._cache_ttl_hours = 24

        # Local sentiment keywords for offline analysis
        self._offline_sentiment_keywords = self._initialize_sentiment_keywords()

        logger.info("OfflineSyncService initialized")

    def _initialize_sentiment_keywords(self) -> Dict[str, List[str]]:
        """Initialize keywords for offline sentiment analysis."""
        return {
            "anxiety": [
                "worried", "anxious", "nervous", "stressed", "overwhelmed",
                "panic", "fear", "dread", "uneasy", "tense", "restless",
                "चिंतित", "घबराहट", "तनाव"  # Hindi
            ],
            "sadness": [
                "sad", "depressed", "unhappy", "miserable", "heartbroken",
                "lonely", "hopeless", "grief", "sorrow", "melancholy",
                "दुखी", "उदास", "निराश"  # Hindi
            ],
            "anger": [
                "angry", "furious", "frustrated", "irritated", "annoyed",
                "rage", "resentful", "bitter", "hostile", "mad",
                "गुस्सा", "क्रोधित", "नाराज"  # Hindi
            ],
            "gratitude": [
                "grateful", "thankful", "blessed", "appreciative",
                "fortunate", "lucky", "content", "happy", "joyful",
                "आभारी", "कृतज्ञ", "धन्य"  # Hindi
            ],
            "serenity": [
                "peaceful", "calm", "serene", "tranquil", "relaxed",
                "content", "balanced", "centered", "mindful", "present",
                "शांत", "स्थिर", "शांति"  # Hindi
            ],
            "confusion": [
                "confused", "lost", "uncertain", "doubtful", "puzzled",
                "unclear", "torn", "conflicted", "questioning",
                "भ्रमित", "अनिश्चित"  # Hindi
            ],
        }

    async def initialize(self) -> None:
        """Initialize the service."""
        if self._initialized:
            return

        # Register default conflict resolvers
        self._register_default_resolvers()

        self._initialized = True
        logger.info("OfflineSyncService initialized")

    def _register_default_resolvers(self) -> None:
        """Register default conflict resolution strategies."""
        # Feedback: Keep latest
        self._conflict_resolvers[DataType.FEEDBACK] = lambda local, remote: (
            local if local.created_at > remote.get("created_at", datetime.min) else None
        )

        # Preferences: Merge with local priority
        self._conflict_resolvers[DataType.PREFERENCE] = lambda local, remote: local

        # Memory: Keep both (no conflict)
        self._conflict_resolvers[DataType.MEMORY] = lambda local, remote: local

    # ==================== Queue Management ====================

    def queue_for_sync(
        self,
        data_type: DataType,
        data: Dict[str, Any],
        priority: SyncPriority = SyncPriority.NORMAL,
        user_id: Optional[str] = None
    ) -> SyncItem:
        """Add an item to the sync queue."""
        if len(self._sync_queue) >= self._max_queue_size:
            # Remove lowest priority items
            self._sync_queue.sort(key=lambda x: x.priority.value)
            self._sync_queue = self._sync_queue[:self._max_queue_size - 1]
            logger.warning("Sync queue full, removed low priority items")

        item = SyncItem(
            id=f"{data_type.value}_{datetime.utcnow().timestamp()}_{len(self._sync_queue)}",
            data_type=data_type,
            data=data,
            priority=priority,
            created_at=datetime.utcnow(),
            user_id=user_id
        )

        self._sync_queue.append(item)
        logger.debug(f"Queued item for sync: {item.id}")

        return item

    def get_queue_status(self) -> Dict[str, Any]:
        """Get current sync queue status."""
        status_counts = defaultdict(int)
        type_counts = defaultdict(int)
        priority_counts = defaultdict(int)

        for item in self._sync_queue:
            status_counts[item.status.value] += 1
            type_counts[item.data_type.value] += 1
            priority_counts[item.priority.value] += 1

        return {
            "total_items": len(self._sync_queue),
            "by_status": dict(status_counts),
            "by_type": dict(type_counts),
            "by_priority": dict(priority_counts),
            "sync_in_progress": self._sync_in_progress,
            "connection_status": self._connection_status
        }

    def clear_synced_items(self) -> int:
        """Remove successfully synced items from queue."""
        before_count = len(self._sync_queue)
        self._sync_queue = [
            item for item in self._sync_queue
            if item.status != SyncStatus.SYNCED
        ]
        removed = before_count - len(self._sync_queue)
        logger.info(f"Cleared {removed} synced items from queue")
        return removed

    # ==================== Sync Operations ====================

    async def sync_all(
        self,
        sync_handler: Callable[[List[SyncItem]], List[Dict[str, Any]]]
    ) -> SyncResult:
        """
        Sync all pending items.

        Args:
            sync_handler: Async function that processes items and returns results
        """
        if self._sync_in_progress:
            return SyncResult(
                success=False,
                synced_count=0,
                failed_count=0,
                conflicts=[],
                errors=["Sync already in progress"],
                duration_ms=0
            )

        self._sync_in_progress = True
        start_time = datetime.utcnow()

        try:
            # Get pending items sorted by priority
            pending = [
                item for item in self._sync_queue
                if item.status == SyncStatus.PENDING
            ]
            pending.sort(key=lambda x: (x.priority.value, x.created_at))

            synced_count = 0
            failed_count = 0
            conflicts = []
            errors = []

            # Process in batches
            for i in range(0, len(pending), self._batch_size):
                batch = pending[i:i + self._batch_size]

                # Mark as syncing
                for item in batch:
                    item.status = SyncStatus.SYNCING

                try:
                    # Call sync handler
                    results = await sync_handler(batch)

                    # Process results
                    for item, result in zip(batch, results):
                        if result.get("success"):
                            item.status = SyncStatus.SYNCED
                            synced_count += 1
                        elif result.get("conflict"):
                            item.status = SyncStatus.CONFLICT
                            conflicts.append(item)
                        else:
                            item.status = SyncStatus.FAILED
                            item.last_error = result.get("error", "Unknown error")
                            item.retry_count += 1
                            failed_count += 1

                            if item.retry_count >= self._max_retries:
                                errors.append(
                                    f"Item {item.id} failed after {self._max_retries} retries: {item.last_error}"
                                )
                            else:
                                # Reset to pending for retry
                                item.status = SyncStatus.PENDING

                except Exception as e:
                    logger.error(f"Batch sync failed: {e}")
                    for item in batch:
                        item.status = SyncStatus.FAILED
                        item.last_error = str(e)
                        failed_count += 1
                    errors.append(f"Batch sync error: {str(e)}")

            duration = (datetime.utcnow() - start_time).total_seconds() * 1000

            # Notify callbacks
            for callback in self._sync_callbacks:
                try:
                    await callback(synced_count, failed_count)
                except Exception as e:
                    logger.error(f"Sync callback failed: {e}")

            return SyncResult(
                success=failed_count == 0 and len(conflicts) == 0,
                synced_count=synced_count,
                failed_count=failed_count,
                conflicts=conflicts,
                errors=errors,
                duration_ms=duration
            )

        finally:
            self._sync_in_progress = False

    async def resolve_conflicts(
        self,
        conflicts: List[SyncItem],
        remote_data: Dict[str, Dict[str, Any]]
    ) -> List[SyncItem]:
        """Resolve sync conflicts using registered resolvers."""
        resolved = []

        for item in conflicts:
            resolver = self._conflict_resolvers.get(item.data_type)
            if not resolver:
                # Default: keep local
                resolved.append(item)
                continue

            remote = remote_data.get(item.id, {})
            result = resolver(item, remote)

            if result:
                result.status = SyncStatus.PENDING
                resolved.append(result)

        return resolved

    # ==================== Offline Cache ====================

    def update_offline_cache(
        self,
        user_id: str,
        preferences: Optional[Dict[str, Any]] = None,
        emotions: Optional[List[Dict[str, Any]]] = None,
        voice_settings: Optional[Dict[str, Any]] = None
    ) -> None:
        """Update the offline cache for a user."""
        if user_id not in self._offline_cache:
            self._offline_cache[user_id] = OfflineCache()

        cache = self._offline_cache[user_id]
        cache.cached_at = datetime.utcnow()

        if preferences:
            cache.user_preferences.update(preferences)

        if emotions:
            cache.recent_emotions = emotions[-100:]  # Keep last 100

        if voice_settings:
            cache.voice_settings.update(voice_settings)

        # Add sentiment keywords
        cache.sentiment_keywords = {
            emotion: ",".join(keywords)
            for emotion, keywords in self._offline_sentiment_keywords.items()
        }

    def get_offline_cache(self, user_id: str) -> Optional[OfflineCache]:
        """Get cached data for offline use."""
        cache = self._offline_cache.get(user_id)

        if cache:
            # Check if cache is still valid
            age = datetime.utcnow() - cache.cached_at
            if age > timedelta(hours=self._cache_ttl_hours):
                logger.warning(f"Offline cache expired for user {user_id}")
                return None

        return cache

    # ==================== Offline Sentiment Analysis ====================

    def analyze_sentiment_offline(self, text: str) -> Dict[str, Any]:
        """
        Perform basic sentiment analysis offline using keyword matching.

        This is a fallback when the full sentiment service is unavailable.
        """
        text_lower = text.lower()
        scores = {}

        for emotion, keywords in self._offline_sentiment_keywords.items():
            score = 0
            matched_keywords = []

            for keyword in keywords:
                if keyword.lower() in text_lower:
                    score += 1
                    matched_keywords.append(keyword)

            if score > 0:
                scores[emotion] = {
                    "score": min(1.0, score / 3),  # Normalize
                    "matched_keywords": matched_keywords
                }

        if not scores:
            return {
                "primary_emotion": "neutral",
                "confidence": 0.3,
                "is_offline_analysis": True,
                "emotions": {}
            }

        # Find primary emotion
        primary = max(scores.items(), key=lambda x: x[1]["score"])

        return {
            "primary_emotion": primary[0],
            "confidence": primary[1]["score"],
            "is_offline_analysis": True,
            "emotions": scores
        }

    # ==================== Connection Management ====================

    def set_connection_status(self, connected: bool) -> None:
        """Update connection status."""
        previous = self._connection_status
        self._connection_status = connected

        if not previous and connected:
            logger.info("Connection restored - ready to sync")
        elif previous and not connected:
            logger.info("Connection lost - entering offline mode")

    def is_online(self) -> bool:
        """Check if currently online."""
        return self._connection_status

    # ==================== Callbacks ====================

    def register_sync_callback(
        self,
        callback: Callable[[int, int], Any]
    ) -> None:
        """Register a callback to be called after sync completes."""
        self._sync_callbacks.append(callback)

    def register_conflict_resolver(
        self,
        data_type: DataType,
        resolver: Callable[[SyncItem, Dict[str, Any]], Optional[SyncItem]]
    ) -> None:
        """Register a custom conflict resolver for a data type."""
        self._conflict_resolvers[data_type] = resolver

    # ==================== Export/Import ====================

    def export_queue_for_storage(self) -> str:
        """Export sync queue as JSON for local storage."""
        export_data = []

        for item in self._sync_queue:
            export_data.append({
                "id": item.id,
                "data_type": item.data_type.value,
                "data": item.data,
                "priority": item.priority.value,
                "created_at": item.created_at.isoformat(),
                "status": item.status.value,
                "retry_count": item.retry_count,
                "checksum": item.checksum,
                "user_id": item.user_id
            })

        return json.dumps(export_data, default=str)

    def import_queue_from_storage(self, json_data: str) -> int:
        """Import sync queue from local storage."""
        try:
            import_data = json.loads(json_data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse import data: {e}")
            return 0

        imported = 0

        for item_data in import_data:
            try:
                item = SyncItem(
                    id=item_data["id"],
                    data_type=DataType(item_data["data_type"]),
                    data=item_data["data"],
                    priority=SyncPriority(item_data["priority"]),
                    created_at=datetime.fromisoformat(item_data["created_at"]),
                    status=SyncStatus(item_data["status"]),
                    retry_count=item_data.get("retry_count", 0),
                    checksum=item_data.get("checksum"),
                    user_id=item_data.get("user_id")
                )

                # Verify checksum
                if item.checksum and item.checksum != item._calculate_checksum():
                    logger.warning(f"Checksum mismatch for item {item.id}, skipping")
                    continue

                # Don't import already synced items
                if item.status != SyncStatus.SYNCED:
                    self._sync_queue.append(item)
                    imported += 1

            except (KeyError, ValueError) as e:
                logger.warning(f"Failed to import item: {e}")
                continue

        logger.info(f"Imported {imported} items from storage")
        return imported


# Singleton instance
_offline_sync_instance: Optional[OfflineSyncService] = None


def get_offline_sync_service() -> OfflineSyncService:
    """Get the singleton offline sync service instance."""
    global _offline_sync_instance
    if _offline_sync_instance is None:
        _offline_sync_instance = OfflineSyncService()
    return _offline_sync_instance
