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
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
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


@router.post("/wisdom/add")
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
