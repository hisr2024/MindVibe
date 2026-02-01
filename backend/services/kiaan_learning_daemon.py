"""
KIAAN 24/7 Continuous Learning Daemon
======================================

Enterprise-grade background service for autonomous Gita wisdom acquisition.

This daemon runs continuously (24/7) to:
1. Fetch content from YouTube, Audio platforms, and Web sources
2. Validate all content for strict Bhagavad Gita compliance
3. Store validated wisdom in the knowledge base
4. Self-heal on failures with exponential backoff
5. Provide real-time health monitoring
6. Support graceful shutdown

Architecture:
    KIAANLearningDaemon (24/7 orchestrator)
    ├── ContentAcquisitionWorker (fetches from sources)
    ├── ValidationPipeline (ensures Gita compliance)
    ├── HealthMonitor (tracks system health)
    ├── AutoRecovery (handles failures)
    └── MetricsCollector (observability)

STRICT COMPLIANCE: Only authentic Bhagavad Gita teachings are stored.
All content is validated against the 18 chapters and 700 verses.

Usage:
    from backend.services.kiaan_learning_daemon import get_learning_daemon

    daemon = get_learning_daemon()
    await daemon.start()  # Starts 24/7 operation
"""

import asyncio
import logging
import os
import signal
import sys
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Optional

from backend.database import get_async_session
from backend.models import ContentSourceType as DBContentSourceType
from backend.services.db_knowledge_store import DatabaseKnowledgeStore, get_db_knowledge_store

logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

class DaemonConfig:
    """Configuration for the 24/7 learning daemon."""

    # Fetch intervals (in seconds)
    YOUTUBE_FETCH_INTERVAL = int(os.getenv("KIAAN_YOUTUBE_INTERVAL", "1800"))  # 30 minutes
    AUDIO_FETCH_INTERVAL = int(os.getenv("KIAAN_AUDIO_INTERVAL", "3600"))  # 1 hour
    WEB_FETCH_INTERVAL = int(os.getenv("KIAAN_WEB_INTERVAL", "3600"))  # 1 hour
    FULL_ACQUISITION_INTERVAL = int(os.getenv("KIAAN_FULL_INTERVAL", "7200"))  # 2 hours

    # Health check interval
    HEALTH_CHECK_INTERVAL = int(os.getenv("KIAAN_HEALTH_INTERVAL", "60"))  # 1 minute

    # Retry configuration
    MAX_RETRIES = int(os.getenv("KIAAN_MAX_RETRIES", "5"))
    BASE_BACKOFF_SECONDS = float(os.getenv("KIAAN_BACKOFF_BASE", "30"))
    MAX_BACKOFF_SECONDS = float(os.getenv("KIAAN_BACKOFF_MAX", "3600"))  # 1 hour max

    # Content limits per fetch
    MAX_ITEMS_PER_FETCH = int(os.getenv("KIAAN_MAX_ITEMS", "20"))

    # Enable/disable specific sources
    ENABLE_YOUTUBE = os.getenv("KIAAN_ENABLE_YOUTUBE", "true").lower() == "true"
    ENABLE_AUDIO = os.getenv("KIAAN_ENABLE_AUDIO", "true").lower() == "true"
    ENABLE_WEB = os.getenv("KIAAN_ENABLE_WEB", "true").lower() == "true"

    # Daemon mode
    DAEMON_ENABLED = os.getenv("KIAAN_DAEMON_ENABLED", "true").lower() == "true"


# =============================================================================
# DATA MODELS
# =============================================================================

class DaemonStatus(Enum):
    """Daemon operational status."""
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    RECOVERING = "recovering"
    SHUTTING_DOWN = "shutting_down"
    ERROR = "error"


class SourceType(Enum):
    """Content source types."""
    YOUTUBE = "youtube"
    AUDIO = "audio"
    WEB = "web"
    ALL = "all"


@dataclass
class FetchResult:
    """Result of a content fetch operation."""
    source: SourceType
    success: bool
    items_fetched: int
    items_validated: int
    items_stored: int
    items_rejected: int
    errors: list[str]
    duration_seconds: float
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class HealthStatus:
    """Daemon health status."""
    status: DaemonStatus
    uptime_seconds: float
    last_successful_fetch: Optional[datetime]
    last_error: Optional[str]
    total_items_acquired: int
    total_errors: int
    current_retry_count: int
    sources_healthy: dict[str, bool]
    memory_usage_mb: float
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class DaemonMetrics:
    """Metrics for observability."""
    total_fetches: int = 0
    successful_fetches: int = 0
    failed_fetches: int = 0
    total_items_fetched: int = 0
    total_items_validated: int = 0
    total_items_stored: int = 0
    total_items_rejected: int = 0
    youtube_fetches: int = 0
    audio_fetches: int = 0
    web_fetches: int = 0
    total_errors: int = 0
    uptime_start: datetime = field(default_factory=datetime.now)
    last_youtube_fetch: Optional[datetime] = None
    last_audio_fetch: Optional[datetime] = None
    last_web_fetch: Optional[datetime] = None
    last_error_message: Optional[str] = None
    last_error_time: Optional[datetime] = None


# =============================================================================
# HEALTH MONITOR
# =============================================================================

class HealthMonitor:
    """
    Monitors daemon health and triggers recovery when needed.

    Features:
    - Periodic health checks
    - Memory monitoring
    - Source availability tracking
    - Alert triggering
    """

    def __init__(self, daemon: "KIAANLearningDaemon"):
        self.daemon = daemon
        self._running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        """Start health monitoring."""
        self._running = True
        self._task = asyncio.create_task(self._monitor_loop())
        logger.info("Health monitor started")

    async def stop(self):
        """Stop health monitoring."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Health monitor stopped")

    async def _monitor_loop(self):
        """Main monitoring loop."""
        while self._running:
            try:
                await asyncio.sleep(DaemonConfig.HEALTH_CHECK_INTERVAL)

                if not self._running:
                    break

                health = self.daemon.get_health_status()

                # Log health status periodically
                logger.debug(
                    f"Daemon health: status={health.status.value}, "
                    f"uptime={health.uptime_seconds:.0f}s, "
                    f"items={health.total_items_acquired}, "
                    f"errors={health.total_errors}"
                )

                # Check for issues
                if health.current_retry_count > 0:
                    logger.warning(
                        f"Daemon in recovery mode: retry {health.current_retry_count}/{DaemonConfig.MAX_RETRIES}"
                    )

                # Check memory usage
                if health.memory_usage_mb > 500:  # Alert if over 500MB
                    logger.warning(f"High memory usage: {health.memory_usage_mb:.1f}MB")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health monitor error: {e}")

    def get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        try:
            import psutil
            process = psutil.Process()
            return process.memory_info().rss / (1024 * 1024)
        except ImportError:
            return 0.0
        except Exception:
            return 0.0


# =============================================================================
# AUTO RECOVERY
# =============================================================================

class AutoRecovery:
    """
    Handles automatic recovery from failures.

    Features:
    - Exponential backoff
    - Per-source recovery
    - Circuit breaker pattern
    """

    def __init__(self):
        self._retry_counts: dict[str, int] = {}
        self._last_errors: dict[str, datetime] = {}
        self._circuit_open: dict[str, bool] = {}

    def record_failure(self, source: str, error: str):
        """Record a failure for a source."""
        self._retry_counts[source] = self._retry_counts.get(source, 0) + 1
        self._last_errors[source] = datetime.now()

        # Open circuit if too many failures
        if self._retry_counts[source] >= DaemonConfig.MAX_RETRIES:
            self._circuit_open[source] = True
            logger.warning(f"Circuit opened for source: {source}")

    def record_success(self, source: str):
        """Record a success for a source (resets retry count)."""
        self._retry_counts[source] = 0
        self._circuit_open[source] = False

    def get_backoff_seconds(self, source: str) -> float:
        """Get backoff time for a source."""
        retry_count = self._retry_counts.get(source, 0)
        backoff = min(
            DaemonConfig.BASE_BACKOFF_SECONDS * (2 ** retry_count),
            DaemonConfig.MAX_BACKOFF_SECONDS
        )
        return backoff

    def should_skip(self, source: str) -> bool:
        """Check if source should be skipped (circuit open)."""
        if not self._circuit_open.get(source, False):
            return False

        # Check if enough time has passed to retry
        last_error = self._last_errors.get(source)
        if last_error:
            elapsed = (datetime.now() - last_error).total_seconds()
            if elapsed > DaemonConfig.MAX_BACKOFF_SECONDS:
                # Reset circuit for retry
                self._circuit_open[source] = False
                self._retry_counts[source] = 0
                return False

        return True

    def get_retry_count(self, source: str) -> int:
        """Get current retry count for a source."""
        return self._retry_counts.get(source, 0)


# =============================================================================
# CONTENT ACQUISITION WORKER
# =============================================================================

class ContentAcquisitionWorker:
    """
    Worker for fetching content from various sources.

    Runs in parallel for different source types.
    """

    def __init__(self, daemon: "KIAANLearningDaemon", source: SourceType):
        self.daemon = daemon
        self.source = source
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._last_fetch: Optional[datetime] = None

    def get_interval(self) -> int:
        """Get fetch interval for this source."""
        intervals = {
            SourceType.YOUTUBE: DaemonConfig.YOUTUBE_FETCH_INTERVAL,
            SourceType.AUDIO: DaemonConfig.AUDIO_FETCH_INTERVAL,
            SourceType.WEB: DaemonConfig.WEB_FETCH_INTERVAL,
            SourceType.ALL: DaemonConfig.FULL_ACQUISITION_INTERVAL,
        }
        return intervals.get(self.source, 3600)

    async def start(self):
        """Start the worker."""
        self._running = True
        self._task = asyncio.create_task(self._worker_loop())
        logger.info(f"Content worker started: {self.source.value}")

    async def stop(self):
        """Stop the worker."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info(f"Content worker stopped: {self.source.value}")

    async def _worker_loop(self):
        """Main worker loop."""
        # Initial delay to stagger workers
        initial_delay = {
            SourceType.YOUTUBE: 10,
            SourceType.AUDIO: 30,
            SourceType.WEB: 60,
            SourceType.ALL: 120,
        }.get(self.source, 0)

        await asyncio.sleep(initial_delay)

        while self._running:
            try:
                # Check if source should be skipped (circuit breaker)
                if self.daemon.recovery.should_skip(self.source.value):
                    logger.warning(f"Skipping {self.source.value} (circuit open)")
                    await asyncio.sleep(60)  # Wait before checking again
                    continue

                # Perform fetch
                result = await self._fetch_content()

                # Record result
                if result.success:
                    self.daemon.recovery.record_success(self.source.value)
                else:
                    self.daemon.recovery.record_failure(
                        self.source.value,
                        result.errors[0] if result.errors else "Unknown error"
                    )

                # Update metrics
                self.daemon._update_metrics(result)
                self._last_fetch = datetime.now()

                # Wait for next interval
                interval = self.get_interval()

                # Add backoff if there were errors
                if not result.success:
                    interval += self.daemon.recovery.get_backoff_seconds(self.source.value)

                await asyncio.sleep(interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker error ({self.source.value}): {e}")
                self.daemon.recovery.record_failure(self.source.value, str(e))

                # Wait before retry
                backoff = self.daemon.recovery.get_backoff_seconds(self.source.value)
                await asyncio.sleep(backoff)

    async def _fetch_content(self) -> FetchResult:
        """Fetch content from the source."""
        start_time = time.time()
        errors = []

        try:
            from backend.services.kiaan_learning_engine import get_kiaan_learning_engine
            engine = get_kiaan_learning_engine()

            # Fetch based on source type
            if self.source == SourceType.YOUTUBE:
                items = await engine.fetcher.fetch_youtube_gita_content(
                    max_results=DaemonConfig.MAX_ITEMS_PER_FETCH
                )
                source_items = {"youtube": items, "audio": [], "web": []}

            elif self.source == SourceType.AUDIO:
                items = await engine.fetcher.fetch_audio_platform_content()
                source_items = {"youtube": [], "audio": items, "web": []}

            elif self.source == SourceType.WEB:
                items = await engine.fetcher.fetch_web_content()
                source_items = {"youtube": [], "audio": [], "web": items}

            else:  # ALL
                source_items = await engine.fetcher.fetch_all_sources(
                    max_per_source=DaemonConfig.MAX_ITEMS_PER_FETCH
                )

            # Process and store items
            stats = await self._process_items(engine, source_items)

            duration = time.time() - start_time

            return FetchResult(
                source=self.source,
                success=True,
                items_fetched=stats["fetched"],
                items_validated=stats["validated"],
                items_stored=stats["stored"],
                items_rejected=stats["rejected"],
                errors=errors,
                duration_seconds=duration,
            )

        except Exception as e:
            logger.error(f"Fetch error ({self.source.value}): {e}")
            errors.append(str(e))

            return FetchResult(
                source=self.source,
                success=False,
                items_fetched=0,
                items_validated=0,
                items_stored=0,
                items_rejected=0,
                errors=errors,
                duration_seconds=time.time() - start_time,
            )

    async def _process_items(self, engine, source_items: dict) -> dict:
        """
        Process and store fetched items to both JSON cache and database.

        This method ensures learned wisdom is stored in:
        1. JSON file (legacy, for fast local access)
        2. PostgreSQL database (for KIAAN Wisdom Core integration)
        """
        from backend.services.kiaan_learning_engine import ContentType, LearnedWisdom
        import uuid

        stats = {"fetched": 0, "validated": 0, "stored": 0, "rejected": 0, "db_stored": 0}

        # Map content types to database source types
        content_type_map = {
            ContentType.VIDEO: DBContentSourceType.YOUTUBE,
            ContentType.AUDIO: DBContentSourceType.AUDIO,
            ContentType.TEXT: DBContentSourceType.WEB,
        }

        # Get database store
        db_store = get_db_knowledge_store()

        # Process YouTube items
        for item in source_items.get("youtube", []):
            stats["fetched"] += 1
            result = await self._process_single_item_with_db(
                engine, db_store, item, ContentType.VIDEO, content_type_map
            )
            if result == "stored":
                stats["stored"] += 1
                stats["validated"] += 1
            elif result == "db_stored":
                stats["stored"] += 1
                stats["validated"] += 1
                stats["db_stored"] += 1
            elif result == "rejected":
                stats["rejected"] += 1

        # Process audio items
        for item in source_items.get("audio", []):
            stats["fetched"] += 1
            result = await self._process_single_item_with_db(
                engine, db_store, item, ContentType.AUDIO, content_type_map
            )
            if result == "stored":
                stats["stored"] += 1
                stats["validated"] += 1
            elif result == "db_stored":
                stats["stored"] += 1
                stats["validated"] += 1
                stats["db_stored"] += 1
            elif result == "rejected":
                stats["rejected"] += 1

        # Process web items
        for item in source_items.get("web", []):
            stats["fetched"] += 1
            result = await self._process_single_item_with_db(
                engine, db_store, item, ContentType.TEXT, content_type_map
            )
            if result == "stored":
                stats["stored"] += 1
                stats["validated"] += 1
            elif result == "db_stored":
                stats["stored"] += 1
                stats["validated"] += 1
                stats["db_stored"] += 1
            elif result == "rejected":
                stats["rejected"] += 1

        if stats["db_stored"] > 0:
            logger.info(f"Stored {stats['db_stored']} items to Wisdom Core database")

        return stats

    def _process_single_item(self, engine, item: dict, content_type) -> str:
        """Process a single content item (legacy JSON storage only)."""
        try:
            from backend.services.kiaan_learning_engine import LearnedWisdom
            import uuid

            # Extract content for validation
            content = f"{item.get('title', '')} {item.get('description', '')}"

            # Validate
            validation = engine.validator.validate_content(
                content,
                item.get('url', '')
            )

            if not validation["is_valid"]:
                return "rejected"

            # Create wisdom object
            wisdom = LearnedWisdom(
                id=str(uuid.uuid4()),
                content=content,
                source_type=content_type,
                source_url=item.get('url', ''),
                source_name=item.get('source', item.get('channel', 'Unknown')),
                language=item.get('language', 'en'),
                chapter_refs=validation["chapter_refs"],
                verse_refs=validation["verse_refs"],
                themes=validation["keywords_found"],
                shad_ripu_tags=validation.get("shad_ripu_tags", []),
                keywords=validation["keywords_found"],
                quality_score=validation["confidence"],
                validation_status="validated",
                learned_at=datetime.now(),
                extra_metadata={"original_item": item, "daemon_acquired": True}
            )

            # Store
            if engine.store.add_wisdom(wisdom):
                return "stored"
            else:
                return "duplicate"

        except Exception as e:
            logger.error(f"Error processing item: {e}")
            return "error"

    async def _process_single_item_with_db(
        self,
        engine,
        db_store: DatabaseKnowledgeStore,
        item: dict,
        content_type,
        content_type_map: dict
    ) -> str:
        """
        Process a single content item and store to both JSON and database.

        This ensures learned wisdom is available in:
        1. JSON file (fast local cache for offline/fallback)
        2. PostgreSQL database (for KIAAN Wisdom Core integration)

        Returns:
            "db_stored" - Stored to both JSON and database
            "stored" - Stored to JSON only (db duplicate or error)
            "duplicate" - Already exists
            "rejected" - Failed validation
            "error" - Processing error
        """
        try:
            from backend.services.kiaan_learning_engine import LearnedWisdom
            import uuid

            # Extract content for validation
            content = f"{item.get('title', '')} {item.get('description', '')}"

            # Validate
            validation = engine.validator.validate_content(
                content,
                item.get('url', '')
            )

            if not validation["is_valid"]:
                return "rejected"

            wisdom_id = str(uuid.uuid4())
            source_name = item.get('source', item.get('channel', 'Unknown'))
            source_url = item.get('url', '')
            language = item.get('language', 'en')
            chapter_refs = validation["chapter_refs"]
            verse_refs = validation["verse_refs"]
            themes = validation["keywords_found"]
            shad_ripu_tags = validation.get("shad_ripu_tags", [])
            keywords = validation["keywords_found"]
            quality_score = validation["confidence"]

            # Create wisdom object for JSON storage
            wisdom = LearnedWisdom(
                id=wisdom_id,
                content=content,
                source_type=content_type,
                source_url=source_url,
                source_name=source_name,
                language=language,
                chapter_refs=chapter_refs,
                verse_refs=verse_refs,
                themes=themes,
                shad_ripu_tags=shad_ripu_tags,
                keywords=keywords,
                quality_score=quality_score,
                validation_status="validated",
                learned_at=datetime.now(),
                extra_metadata={"original_item": item, "daemon_acquired": True}
            )

            # Store to JSON (legacy)
            json_stored = engine.store.add_wisdom(wisdom)

            # Store to database (new - Wisdom Core integration)
            db_stored = False
            try:
                async for db in get_async_session():
                    db_source_type = content_type_map.get(content_type, DBContentSourceType.WEB)

                    # Determine mental health domain from themes
                    primary_domain = None
                    mental_health_apps = []
                    domain_mapping = {
                        "peace": "anxiety",
                        "calm": "anxiety",
                        "equanimity": "stress",
                        "anger": "anger",
                        "patience": "anger",
                        "forgiveness": "anger",
                        "hope": "depression",
                        "joy": "depression",
                        "purpose": "self_doubt",
                        "courage": "fear",
                        "strength": "fear",
                        "wisdom": "confusion",
                        "clarity": "confusion",
                        "detachment": "anxiety",
                        "surrender": "stress",
                        "devotion": "loneliness",
                        "compassion": "grief",
                        "acceptance": "grief",
                    }

                    for theme in themes:
                        theme_lower = theme.lower()
                        if theme_lower in domain_mapping:
                            if not primary_domain:
                                primary_domain = domain_mapping[theme_lower]
                            mental_health_apps.append(theme_lower)

                    result = await db_store.add_wisdom(
                        db=db,
                        content=content,
                        source_type=db_source_type.value,
                        source_name=source_name,
                        source_url=source_url if source_url else None,
                        language=language,
                        chapter_refs=chapter_refs,
                        verse_refs=[[v[0], v[1]] for v in verse_refs] if verse_refs else [],
                        themes=themes,
                        shad_ripu_tags=shad_ripu_tags,
                        keywords=keywords,
                        quality_score=quality_score,
                        primary_domain=primary_domain,
                        mental_health_applications=mental_health_apps if mental_health_apps else None,
                        extra_metadata={"daemon_acquired": True, "original_source": item.get('source', 'unknown')},
                    )
                    db_stored = result is not None
                    break

            except Exception as db_error:
                logger.warning(f"Database storage failed (JSON storage continues): {db_error}")

            if json_stored and db_stored:
                return "db_stored"
            elif json_stored:
                return "stored"
            else:
                return "duplicate"

        except Exception as e:
            logger.error(f"Error processing item: {e}")
            return "error"


# =============================================================================
# KIAAN LEARNING DAEMON (24/7 ORCHESTRATOR)
# =============================================================================

class KIAANLearningDaemon:
    """
    24/7 Continuous Learning Daemon for KIAAN AI.

    This is the main orchestrator that runs continuously to:
    1. Coordinate content acquisition from multiple sources
    2. Ensure strict Bhagavad Gita compliance
    3. Handle failures with auto-recovery
    4. Provide health monitoring and observability

    Usage:
        daemon = get_learning_daemon()
        await daemon.start()  # Starts 24/7 operation

        # Check status
        status = daemon.get_status()
        health = daemon.get_health_status()

        # Stop daemon
        await daemon.stop()
    """

    _instance: Optional["KIAANLearningDaemon"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "KIAANLearningDaemon":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialize()
            return cls._instance

    def _initialize(self):
        """Initialize the daemon."""
        self._status = DaemonStatus.STOPPED
        self._metrics = DaemonMetrics()
        self._start_time: Optional[datetime] = None

        # Components
        self.recovery = AutoRecovery()
        self.health_monitor: Optional[HealthMonitor] = None
        self._workers: list[ContentAcquisitionWorker] = []

        # Shutdown handling
        self._shutdown_event = asyncio.Event()
        self._shutdown_handlers_installed = False

        logger.info("KIAAN Learning Daemon initialized")

    # -------------------------------------------------------------------------
    # Lifecycle Management
    # -------------------------------------------------------------------------

    async def start(self):
        """
        Start the 24/7 learning daemon.

        This starts all workers and begins continuous content acquisition.
        """
        if self._status == DaemonStatus.RUNNING:
            logger.warning("Daemon already running")
            return

        if not DaemonConfig.DAEMON_ENABLED:
            logger.info("Daemon disabled via configuration")
            return

        try:
            self._status = DaemonStatus.STARTING
            self._start_time = datetime.now()
            self._metrics.uptime_start = self._start_time

            logger.info("=" * 60)
            logger.info("KIAAN 24/7 Learning Daemon Starting")
            logger.info("=" * 60)

            # Install shutdown handlers
            self._install_shutdown_handlers()

            # Start health monitor
            self.health_monitor = HealthMonitor(self)
            await self.health_monitor.start()

            # Start content workers
            await self._start_workers()

            self._status = DaemonStatus.RUNNING

            logger.info("=" * 60)
            logger.info("KIAAN Learning Daemon RUNNING 24/7")
            logger.info(f"  YouTube interval: {DaemonConfig.YOUTUBE_FETCH_INTERVAL}s")
            logger.info(f"  Audio interval: {DaemonConfig.AUDIO_FETCH_INTERVAL}s")
            logger.info(f"  Web interval: {DaemonConfig.WEB_FETCH_INTERVAL}s")
            logger.info(f"  Full sync interval: {DaemonConfig.FULL_ACQUISITION_INTERVAL}s")
            logger.info("=" * 60)

            # Run initial acquisition immediately
            await self._run_initial_acquisition()

        except Exception as e:
            logger.error(f"Failed to start daemon: {e}")
            self._status = DaemonStatus.ERROR
            self._metrics.last_error_message = str(e)
            self._metrics.last_error_time = datetime.now()
            raise

    async def stop(self):
        """
        Stop the daemon gracefully.

        This stops all workers and cleans up resources.
        """
        if self._status == DaemonStatus.STOPPED:
            return

        self._status = DaemonStatus.SHUTTING_DOWN
        logger.info("KIAAN Learning Daemon shutting down...")

        try:
            # Stop workers
            for worker in self._workers:
                await worker.stop()
            self._workers.clear()

            # Stop health monitor
            if self.health_monitor:
                await self.health_monitor.stop()
                self.health_monitor = None

            self._status = DaemonStatus.STOPPED
            logger.info("KIAAN Learning Daemon stopped")

        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
            self._status = DaemonStatus.ERROR

    async def pause(self):
        """Pause the daemon (stops fetching but keeps running)."""
        if self._status == DaemonStatus.RUNNING:
            for worker in self._workers:
                await worker.stop()
            self._status = DaemonStatus.PAUSED
            logger.info("KIAAN Learning Daemon paused")

    async def resume(self):
        """Resume the daemon from paused state."""
        if self._status == DaemonStatus.PAUSED:
            await self._start_workers()
            self._status = DaemonStatus.RUNNING
            logger.info("KIAAN Learning Daemon resumed")

    # -------------------------------------------------------------------------
    # Worker Management
    # -------------------------------------------------------------------------

    async def _start_workers(self):
        """Start all content acquisition workers."""
        self._workers.clear()

        # Create workers for enabled sources
        if DaemonConfig.ENABLE_YOUTUBE:
            worker = ContentAcquisitionWorker(self, SourceType.YOUTUBE)
            self._workers.append(worker)
            await worker.start()

        if DaemonConfig.ENABLE_AUDIO:
            worker = ContentAcquisitionWorker(self, SourceType.AUDIO)
            self._workers.append(worker)
            await worker.start()

        if DaemonConfig.ENABLE_WEB:
            worker = ContentAcquisitionWorker(self, SourceType.WEB)
            self._workers.append(worker)
            await worker.start()

        logger.info(f"Started {len(self._workers)} content workers")

    async def _run_initial_acquisition(self):
        """Run initial content acquisition on startup."""
        logger.info("Running initial content acquisition...")

        try:
            from backend.services.kiaan_learning_engine import get_kiaan_learning_engine
            engine = get_kiaan_learning_engine()

            # Check if knowledge base needs population
            stats = engine.store.get_statistics()
            if stats["validated_items"] < 10:
                logger.info("Knowledge base nearly empty - running full acquisition")
                result = await engine.acquire_new_content(force=True)
                logger.info(
                    f"Initial acquisition complete: {result.get('stored', 0)} items stored"
                )
            else:
                logger.info(f"Knowledge base has {stats['validated_items']} items - skipping initial acquisition")

        except Exception as e:
            logger.error(f"Initial acquisition failed: {e}")

    # -------------------------------------------------------------------------
    # Shutdown Handling
    # -------------------------------------------------------------------------

    def _install_shutdown_handlers(self):
        """Install signal handlers for graceful shutdown."""
        if self._shutdown_handlers_installed:
            return

        try:
            loop = asyncio.get_event_loop()

            for sig in (signal.SIGTERM, signal.SIGINT):
                loop.add_signal_handler(
                    sig,
                    lambda s=sig: asyncio.create_task(self._handle_signal(s))
                )

            self._shutdown_handlers_installed = True
            logger.debug("Shutdown handlers installed")

        except (NotImplementedError, RuntimeError):
            # Signal handlers not supported (e.g., Windows)
            logger.debug("Signal handlers not supported on this platform")

    async def _handle_signal(self, sig):
        """Handle shutdown signal."""
        logger.info(f"Received signal {sig.name}, initiating shutdown...")
        await self.stop()
        self._shutdown_event.set()

    # -------------------------------------------------------------------------
    # Metrics & Monitoring
    # -------------------------------------------------------------------------

    def _update_metrics(self, result: FetchResult):
        """Update metrics with fetch result."""
        self._metrics.total_fetches += 1

        if result.success:
            self._metrics.successful_fetches += 1
        else:
            self._metrics.failed_fetches += 1
            self._metrics.total_errors += 1
            if result.errors:
                self._metrics.last_error_message = result.errors[0]
                self._metrics.last_error_time = datetime.now()

        self._metrics.total_items_fetched += result.items_fetched
        self._metrics.total_items_validated += result.items_validated
        self._metrics.total_items_stored += result.items_stored
        self._metrics.total_items_rejected += result.items_rejected

        # Update per-source metrics
        if result.source == SourceType.YOUTUBE:
            self._metrics.youtube_fetches += 1
            self._metrics.last_youtube_fetch = result.timestamp
        elif result.source == SourceType.AUDIO:
            self._metrics.audio_fetches += 1
            self._metrics.last_audio_fetch = result.timestamp
        elif result.source == SourceType.WEB:
            self._metrics.web_fetches += 1
            self._metrics.last_web_fetch = result.timestamp

    def get_status(self) -> dict:
        """Get current daemon status."""
        uptime = 0.0
        if self._start_time:
            uptime = (datetime.now() - self._start_time).total_seconds()

        return {
            "status": self._status.value,
            "uptime_seconds": uptime,
            "uptime_human": self._format_uptime(uptime),
            "workers_active": len(self._workers),
            "config": {
                "youtube_interval": DaemonConfig.YOUTUBE_FETCH_INTERVAL,
                "audio_interval": DaemonConfig.AUDIO_FETCH_INTERVAL,
                "web_interval": DaemonConfig.WEB_FETCH_INTERVAL,
                "youtube_enabled": DaemonConfig.ENABLE_YOUTUBE,
                "audio_enabled": DaemonConfig.ENABLE_AUDIO,
                "web_enabled": DaemonConfig.ENABLE_WEB,
            },
        }

    def get_health_status(self) -> HealthStatus:
        """Get detailed health status."""
        uptime = 0.0
        if self._start_time:
            uptime = (datetime.now() - self._start_time).total_seconds()

        # Determine last successful fetch
        last_successful = None
        for ts in [
            self._metrics.last_youtube_fetch,
            self._metrics.last_audio_fetch,
            self._metrics.last_web_fetch,
        ]:
            if ts and (last_successful is None or ts > last_successful):
                last_successful = ts

        # Check source health
        sources_healthy = {
            "youtube": not self.recovery.should_skip("youtube"),
            "audio": not self.recovery.should_skip("audio"),
            "web": not self.recovery.should_skip("web"),
        }

        # Get memory usage
        memory_usage = 0.0
        if self.health_monitor:
            memory_usage = self.health_monitor.get_memory_usage()

        return HealthStatus(
            status=self._status,
            uptime_seconds=uptime,
            last_successful_fetch=last_successful,
            last_error=self._metrics.last_error_message,
            total_items_acquired=self._metrics.total_items_stored,
            total_errors=self._metrics.total_errors,
            current_retry_count=max(
                self.recovery.get_retry_count("youtube"),
                self.recovery.get_retry_count("audio"),
                self.recovery.get_retry_count("web"),
            ),
            sources_healthy=sources_healthy,
            memory_usage_mb=memory_usage,
        )

    def get_metrics(self) -> dict:
        """Get all metrics for observability."""
        return {
            "total_fetches": self._metrics.total_fetches,
            "successful_fetches": self._metrics.successful_fetches,
            "failed_fetches": self._metrics.failed_fetches,
            "success_rate": (
                self._metrics.successful_fetches / self._metrics.total_fetches
                if self._metrics.total_fetches > 0 else 0.0
            ),
            "items": {
                "fetched": self._metrics.total_items_fetched,
                "validated": self._metrics.total_items_validated,
                "stored": self._metrics.total_items_stored,
                "rejected": self._metrics.total_items_rejected,
            },
            "by_source": {
                "youtube": {
                    "fetches": self._metrics.youtube_fetches,
                    "last_fetch": (
                        self._metrics.last_youtube_fetch.isoformat()
                        if self._metrics.last_youtube_fetch else None
                    ),
                },
                "audio": {
                    "fetches": self._metrics.audio_fetches,
                    "last_fetch": (
                        self._metrics.last_audio_fetch.isoformat()
                        if self._metrics.last_audio_fetch else None
                    ),
                },
                "web": {
                    "fetches": self._metrics.web_fetches,
                    "last_fetch": (
                        self._metrics.last_web_fetch.isoformat()
                        if self._metrics.last_web_fetch else None
                    ),
                },
            },
            "errors": {
                "total": self._metrics.total_errors,
                "last_message": self._metrics.last_error_message,
                "last_time": (
                    self._metrics.last_error_time.isoformat()
                    if self._metrics.last_error_time else None
                ),
            },
            "uptime": {
                "start": self._metrics.uptime_start.isoformat(),
                "seconds": (datetime.now() - self._metrics.uptime_start).total_seconds(),
            },
        }

    @staticmethod
    def _format_uptime(seconds: float) -> str:
        """Format uptime in human-readable format."""
        if seconds < 60:
            return f"{seconds:.0f}s"
        elif seconds < 3600:
            return f"{seconds / 60:.0f}m"
        elif seconds < 86400:
            return f"{seconds / 3600:.1f}h"
        else:
            return f"{seconds / 86400:.1f}d"


# =============================================================================
# SINGLETON ACCESSOR
# =============================================================================

def get_learning_daemon() -> KIAANLearningDaemon:
    """Get the singleton KIAAN Learning Daemon instance."""
    return KIAANLearningDaemon()


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

async def start_daemon():
    """Start the 24/7 learning daemon."""
    daemon = get_learning_daemon()
    await daemon.start()
    return daemon


async def stop_daemon():
    """Stop the learning daemon."""
    daemon = get_learning_daemon()
    await daemon.stop()


def get_daemon_status() -> dict:
    """Get current daemon status."""
    return get_learning_daemon().get_status()


def get_daemon_metrics() -> dict:
    """Get daemon metrics."""
    return get_learning_daemon().get_metrics()
