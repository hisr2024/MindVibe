"""
KIAAN Learning System API (v4.1)

Endpoints to monitor and control KIAAN's autonomous learning system.
Enables automatic Gita wisdom acquisition from external sources.

Sources:
- YouTube (ISKCON, Swami Mukundananda, Gaur Gopal Das, etc.)
- Audio Platforms (Spotify, Apple Music, Gaana, JioSaavn podcasts)
- Web Sources (IIT Kanpur Gita Supersite, holy-bhagavad-gita.org, etc.)

All content is validated for strict Bhagavad Gita compliance.
"""

import logging
import re
from typing import Any, ClassVar
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user, get_db
from backend.middleware.rate_limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaan/learning", tags=["kiaan-learning"])


# =============================================================================
# Request/Response Models
# =============================================================================

class AcquireContentRequest(BaseModel):
    """Request to trigger content acquisition."""
    force: bool = Field(False, description="Force acquisition even if interval not elapsed")
    search_queries: list[str] | None = Field(
        None,
        description="Custom search queries (optional)"
    )


class AddWisdomRequest(BaseModel):
    """Request to manually add wisdom."""
    content: str = Field(..., min_length=50, max_length=5000)
    source_url: str = Field(..., min_length=10)
    source_name: str = Field(..., min_length=3, max_length=100)
    language: str = Field("en", max_length=8)


class ProcessYouTubeVideoRequest(BaseModel):
    """Request to process a YouTube video for Gita wisdom extraction."""
    video_url: str = Field(
        ..., min_length=10, max_length=200,
        description="YouTube video URL or 11-character video ID"
    )
    languages: list[str] = Field(
        default=["en", "hi", "sa"],
        description="Preferred transcript languages",
        max_length=5,
    )
    force: bool = Field(
        False,
        description="Force reprocessing even if video was already processed"
    )

    # SSRF protection: Only allow YouTube domains or bare video IDs
    ALLOWED_YOUTUBE_HOSTS: ClassVar[set[str]] = {
        "youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com",
    }
    # Restrict languages to known codes to prevent injection
    ALLOWED_LANGUAGES: ClassVar[set[str]] = {
        "en", "hi", "sa", "ta", "te", "kn", "ml", "mr", "gu", "bn", "pa",
    }

    @field_validator("video_url")
    @classmethod
    def validate_youtube_url(cls, v: str) -> str:
        """Only allow YouTube URLs or bare 11-char video IDs — prevents SSRF."""
        v = v.strip()
        # Allow bare 11-char video ID
        if re.match(r"^[a-zA-Z0-9_-]{11}$", v):
            return v
        parsed = urlparse(v)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("URL must use http or https")
        if parsed.hostname not in cls.ALLOWED_YOUTUBE_HOSTS:
            raise ValueError(
                f"URL must be a YouTube URL, got host: {parsed.hostname}"
            )
        return v

    @field_validator("languages")
    @classmethod
    def validate_language_codes(cls, v: list[str]) -> list[str]:
        """Restrict to known language codes — prevents injection."""
        for lang in v:
            if lang not in cls.ALLOWED_LANGUAGES:
                raise ValueError(f"Unsupported language code: {lang}")
        return v


# =============================================================================
# Learning Engine Instance
# =============================================================================

def get_learning_engine():
    """Get the KIAAN learning engine instance."""
    try:
        from backend.services.kiaan_learning_engine import get_kiaan_learning_engine
        return get_kiaan_learning_engine()
    except Exception as e:
        logger.error(f"Failed to get learning engine: {e}")
        raise HTTPException(status_code=500, detail="Learning engine not available")


# =============================================================================
# API Endpoints
# =============================================================================

@router.get("/status")
async def get_learning_status() -> dict[str, Any]:
    """
    Get the current status of the KIAAN learning system.

    Returns:
        Learning statistics, scheduler status, and knowledge base info
    """
    engine = get_learning_engine()

    return {
        "status": "operational",
        "scheduler": engine.get_scheduler_status(),
        "statistics": engine.get_statistics(),
        "sources": {
            "youtube": ["ISKCON", "Swami Mukundananda", "Gaur Gopal Das", "Swami Sarvapriyananda"],
            "audio_platforms": ["Spotify", "Apple Music", "Gaana", "JioSaavn"],
            "web_sources": ["IIT Kanpur Gita Supersite", "holy-bhagavad-gita.org", "vedabase.io"],
        },
        "compliance": "Strict Bhagavad Gita only - all content validated",
    }


@router.post("/acquire")
@limiter.limit("5/hour")
async def trigger_acquisition(
    request: Request,
    body: AcquireContentRequest = None
) -> dict[str, Any]:
    """
    Manually trigger content acquisition from external sources.

    This fetches new Gita wisdom from:
    - YouTube (video transcripts and lectures)
    - Audio platforms (podcast RSS feeds)
    - Web sources (curated Gita websites)

    All content is validated for strict Bhagavad Gita compliance.
    Rate limited to 5 requests per hour.
    """
    engine = get_learning_engine()

    body = body or AcquireContentRequest()

    try:
        result = await engine.acquire_new_content(
            force=body.force,
            search_queries=body.search_queries
        )

        return {
            "status": "success",
            "result": result,
            "message": f"Acquisition complete: {result.get('stored', 0)} new items stored"
        }
    except Exception as e:
        logger.error(f"Acquisition failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "message": "Acquisition failed - see logs for details"
        }


@router.post("/scheduler/start")
async def start_scheduler() -> dict[str, Any]:
    """
    Start the automatic learning scheduler.

    The scheduler runs every 6 hours to fetch new Gita wisdom
    from external sources automatically.
    """
    engine = get_learning_engine()

    try:
        engine.start_scheduler()
        return {
            "status": "success",
            "message": "Scheduler started",
            "scheduler": engine.get_scheduler_status()
        }
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@router.post("/scheduler/stop")
async def stop_scheduler() -> dict[str, Any]:
    """
    Stop the automatic learning scheduler.

    Note: Learning from queries will continue, only scheduled
    acquisition will stop.
    """
    engine = get_learning_engine()

    try:
        engine.stop_scheduler()
        return {
            "status": "success",
            "message": "Scheduler stopped",
            "scheduler": engine.get_scheduler_status()
        }
    except Exception as e:
        logger.error(f"Failed to stop scheduler: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@router.post("/wisdom/add", status_code=201)
@limiter.limit("10/hour")
async def add_manual_wisdom(
    request: Request,
    body: AddWisdomRequest
) -> dict[str, Any]:
    """
    Manually add wisdom to the knowledge base.

    The content will be validated for Bhagavad Gita compliance
    before being added.

    Rate limited to 10 requests per hour.
    """
    engine = get_learning_engine()

    success, message = engine.add_manual_wisdom(
        content=body.content,
        source_url=body.source_url,
        source_name=body.source_name,
        language=body.language
    )

    if success:
        return {
            "status": "success",
            "message": message
        }
    else:
        return {
            "status": "error",
            "message": message
        }


@router.get("/wisdom/search")
async def search_wisdom(
    query: str,
    limit: int = 10,
    language: str | None = None
) -> dict[str, Any]:
    """
    Search the learned wisdom knowledge base.

    Args:
        query: Search query
        limit: Maximum results (default 10, max 50)
        language: Filter by language (optional)
    """
    engine = get_learning_engine()

    limit = min(limit, 50)

    try:
        results = engine.get_relevant_wisdom(
            query=query,
            limit=limit,
            language=language
        )

        return {
            "status": "success",
            "query": query,
            "results": [
                {
                    "id": w.id,
                    "content": w.content[:500] + "..." if len(w.content) > 500 else w.content,
                    "source_name": w.source_name,
                    "source_type": w.source_type.value,
                    "language": w.language,
                    "chapter_refs": w.chapter_refs,
                    "themes": w.themes,
                    "quality_score": w.quality_score,
                }
                for w in results
            ],
            "count": len(results),
        }
    except Exception as e:
        logger.error(f"Wisdom search failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "results": []
        }


@router.get("/health")
async def learning_health() -> dict[str, Any]:
    """Health check for the learning system."""
    try:
        engine = get_learning_engine()
        stats = engine.get_statistics()

        return {
            "status": "healthy",
            "scheduler_running": engine._scheduler_running,
            "knowledge_base_items": stats.get("total_wisdom_items", 0),
            "validated_items": stats.get("validated_items", 0),
            "query_patterns": stats.get("total_patterns", 0),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


# =============================================================================
# 24/7 DAEMON ENDPOINTS
# =============================================================================

def get_daemon():
    """Get the 24/7 learning daemon instance."""
    try:
        from backend.services.kiaan_learning_daemon import get_learning_daemon
        return get_learning_daemon()
    except Exception as e:
        logger.error(f"Failed to get learning daemon: {e}")
        raise HTTPException(status_code=500, detail="Learning daemon not available")


@router.get("/daemon/status")
async def get_daemon_status() -> dict[str, Any]:
    """
    Get the status of the 24/7 learning daemon.

    Returns:
        - status: Current daemon state (running, stopped, paused, etc.)
        - uptime: How long the daemon has been running
        - workers_active: Number of active content workers
        - config: Current daemon configuration
    """
    daemon = get_daemon()
    return daemon.get_status()


@router.get("/daemon/health")
async def get_daemon_health() -> dict[str, Any]:
    """
    Get detailed health status of the 24/7 learning daemon.

    Returns:
        - status: Current state
        - uptime_seconds: Uptime in seconds
        - last_successful_fetch: Timestamp of last successful fetch
        - last_error: Most recent error (if any)
        - total_items_acquired: Total items stored
        - sources_healthy: Health status of each source
        - memory_usage_mb: Current memory usage
    """
    daemon = get_daemon()
    health = daemon.get_health_status()

    return {
        "status": health.status.value,
        "uptime_seconds": health.uptime_seconds,
        "last_successful_fetch": (
            health.last_successful_fetch.isoformat()
            if health.last_successful_fetch else None
        ),
        "last_error": health.last_error,
        "total_items_acquired": health.total_items_acquired,
        "total_errors": health.total_errors,
        "current_retry_count": health.current_retry_count,
        "sources_healthy": health.sources_healthy,
        "memory_usage_mb": health.memory_usage_mb,
        "timestamp": health.timestamp.isoformat(),
    }


@router.get("/daemon/metrics")
async def get_daemon_metrics() -> dict[str, Any]:
    """
    Get comprehensive metrics from the 24/7 learning daemon.

    Returns detailed metrics for observability:
        - Fetch counts (total, successful, failed)
        - Items processed (fetched, validated, stored, rejected)
        - Per-source breakdown (YouTube, Audio, Web)
        - Error tracking
        - Uptime information
    """
    daemon = get_daemon()
    return daemon.get_metrics()


@router.post("/daemon/start")
async def start_daemon() -> dict[str, Any]:
    """
    Start the 24/7 learning daemon.

    This starts continuous content acquisition from all sources.
    The daemon runs automatically and fetches content at configured intervals:
        - YouTube: Every 30 minutes
        - Audio: Every 1 hour
        - Web: Every 1 hour

    All content is validated for strict Bhagavad Gita compliance.
    """
    daemon = get_daemon()

    try:
        await daemon.start()
        return {
            "status": "success",
            "message": "24/7 Learning Daemon started",
            "daemon_status": daemon.get_status(),
        }
    except Exception as e:
        logger.error(f"Failed to start daemon: {e}")
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to start daemon",
        }


@router.post("/daemon/stop")
async def stop_daemon() -> dict[str, Any]:
    """
    Stop the 24/7 learning daemon.

    This gracefully stops all content workers and the health monitor.
    The daemon can be restarted later.
    """
    daemon = get_daemon()

    try:
        await daemon.stop()
        return {
            "status": "success",
            "message": "24/7 Learning Daemon stopped",
            "daemon_status": daemon.get_status(),
        }
    except Exception as e:
        logger.error(f"Failed to stop daemon: {e}")
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to stop daemon",
        }


@router.post("/daemon/pause")
async def pause_daemon() -> dict[str, Any]:
    """
    Pause the 24/7 learning daemon.

    This pauses content fetching but keeps the daemon running.
    Use resume to continue fetching.
    """
    daemon = get_daemon()

    try:
        await daemon.pause()
        return {
            "status": "success",
            "message": "24/7 Learning Daemon paused",
            "daemon_status": daemon.get_status(),
        }
    except Exception as e:
        logger.error(f"Failed to pause daemon: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@router.post("/daemon/resume")
async def resume_daemon() -> dict[str, Any]:
    """
    Resume the 24/7 learning daemon from paused state.

    This resumes content fetching.
    """
    daemon = get_daemon()

    try:
        await daemon.resume()
        return {
            "status": "success",
            "message": "24/7 Learning Daemon resumed",
            "daemon_status": daemon.get_status(),
        }
    except Exception as e:
        logger.error(f"Failed to resume daemon: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


# =============================================================================
# YouTube Transcript Processing Endpoints
# =============================================================================

@router.post("/youtube/process-video")
@limiter.limit("10/hour")
async def process_youtube_video(
    request: Request,
    body: ProcessYouTubeVideoRequest,
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Process a YouTube video to extract Gita wisdom from its transcript.

    Fetches the video transcript, extracts wisdom nuggets using AI,
    validates for Gita compliance (structural + Five Pillar), and stores
    validated wisdom.

    Requires authentication. Rate limited to 10 requests per hour.
    """
    try:
        from backend.services.youtube_transcript_service import YouTubeTranscriptService
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="YouTube transcript service not available. Install youtube-transcript-api."
        )

    service = YouTubeTranscriptService()

    # Extract video ID
    video_id = service.extract_video_id(body.video_url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Could not extract a valid YouTube video ID from the provided URL."
        )

    # Check cooldown — prevent abuse by reprocessing same video rapidly
    if not body.force and not service.check_cooldown(video_id):
        return {
            "status": "cooldown",
            "video_id": video_id,
            "message": "This video was recently processed. "
                       "Wait 5 minutes or use force=true to reprocess.",
        }

    # Fetch transcript
    transcript = service.fetch_transcript(video_id, languages=body.languages)
    if not transcript:
        return {
            "status": "no_transcript",
            "video_id": video_id,
            "message": "No transcript available for this video. "
                       "The video may have captions disabled or be unavailable.",
        }

    # Extract wisdom nuggets
    nuggets = service.extract_wisdom_nuggets(
        transcript=transcript,
        video_title=f"Video {video_id}",
        channel_name="Manual Processing",
    )

    # Process through learning engine validation and storage
    # Uses BOTH structural validation AND Five Pillar deep Gita compliance
    engine = get_learning_engine()

    try:
        from backend.services.gita_validator import GitaValidator as FivePillarValidator
        five_pillar = FivePillarValidator()
    except ImportError:
        five_pillar = None
        logger.warning("Five Pillar validator not available, using structural only")

    stored_count = 0
    rejected_count = 0
    results = []

    for nugget in nuggets:
        content = nugget.get("content", "")
        if not content:
            continue

        # Structural validation (chapter/verse refs, Gita keywords, non-Gita rejection)
        structural = engine.validator.validate_content(
            content,
            f"https://youtube.com/watch?v={video_id}"
        )

        # Five Pillar deep compliance check
        pillar_result = {}
        if five_pillar:
            pillar_result = five_pillar.score_five_pillar_compliance(
                content, secular_mode=False
            )

        # Require structural validation to pass; Five Pillar score is informational
        is_valid = structural["is_valid"]
        if is_valid and structural["confidence"] < 0.3:
            is_valid = False

        results.append({
            "content_preview": content[:200] + "..." if len(content) > 200 else content,
            "is_valid": is_valid,
            "structural_confidence": structural["confidence"],
            "five_pillar_score": pillar_result.get("overall_score", 0.0),
            "five_pillar_level": pillar_result.get("compliance_level", "N/A"),
            "chapter_refs": nugget.get("chapter_refs", []),
            "themes": nugget.get("themes", []),
            "quality_score": nugget.get("quality_score", 0.0),
        })

        if is_valid:
            stored_count += 1
        else:
            rejected_count += 1

    logger.info(
        f"YouTube video processed by user {user_id}: "
        f"video={video_id}, nuggets={len(nuggets)}, "
        f"stored={stored_count}, rejected={rejected_count}"
    )

    return {
        "status": "success",
        "video_id": video_id,
        "transcript_length": len(transcript),
        "nuggets_extracted": len(nuggets),
        "stored": stored_count,
        "rejected": rejected_count,
        "results": results,
    }


@router.get("/youtube/quota")
async def get_youtube_quota(
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Get current YouTube Data API quota usage and remaining quota.

    The YouTube Data API v3 grants 10,000 units per day.
    Each search.list call costs 100 units (~100 searches/day).
    Transcript fetching does NOT consume API quota.

    Requires authentication.
    """
    try:
        from backend.services.youtube_transcript_service import YouTubeTranscriptService
        service = YouTubeTranscriptService()
        tracker = service.quota_tracker
        return {
            "status": "success",
            "daily_quota": tracker.DAILY_QUOTA,
            "used": tracker.usage,
            "remaining": tracker.remaining_quota,
            "search_cost": tracker.SEARCH_COST,
            "max_searches_remaining": tracker.remaining_quota // tracker.SEARCH_COST,
            "transcript_api_available": service._transcript_api_available,
            "openai_available": service._openai_available,
        }
    except ImportError:
        return {
            "status": "unavailable",
            "message": "YouTube transcript service not installed",
            "daily_quota": 10000,
            "used": 0,
            "remaining": 10000,
        }
