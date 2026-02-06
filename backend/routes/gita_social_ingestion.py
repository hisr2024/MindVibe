"""
Gita Social Media Content Ingestion API Routes

Endpoints for ingesting Bhagavad Gita wisdom content from social media
platforms (YouTube, Spotify, Instagram, etc.) into KIAAN's knowledge base.

All content passes through strict Gita compliance validation.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field

from backend.deps import get_current_user_flexible
from backend.services.gita_social_ingestion import (
    IngestionRequest,
    BulkIngestionRequest,
    IngestionResult,
    GitaComplianceResult,
    PlatformType,
    ContentType,
    validate_gita_compliance,
    process_ingestion,
    is_trusted_source,
    TRUSTED_YOUTUBE_CHANNELS,
    TRUSTED_PODCAST_FEEDS,
    TRUSTED_WEB_DOMAINS,
    TRUSTED_SOCIAL_ACCOUNTS,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gita-ingestion", tags=["gita-ingestion"])


# ─── Response Models ─────────────────────────────────────────────────────────

class ComplianceCheckResponse(BaseModel):
    """Response for content compliance validation."""
    compliance: GitaComplianceResult
    message: str


class TrustedSourcesResponse(BaseModel):
    """Response listing trusted content sources."""
    youtube_channels: list[str]
    podcast_feeds: list[str]
    web_domains: list[str]
    social_accounts: dict[str, list[str]]


class IngestionStatusResponse(BaseModel):
    """Response for ingestion processing status."""
    results: list[IngestionResult]
    total: int
    successful: int
    failed: int


class ValidateContentRequest(BaseModel):
    """Request to validate content for Gita compliance."""
    text: str = Field(..., min_length=20, max_length=50000, description="Content text to validate")


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/trusted-sources", response_model=TrustedSourcesResponse)
async def get_trusted_sources(
    user_id: str = Depends(get_current_user_flexible),
):
    """Get the list of trusted content sources for Gita wisdom.

    Returns all verified channels, podcasts, websites, and social accounts
    that are pre-approved for Gita content ingestion.
    """
    return TrustedSourcesResponse(
        youtube_channels=TRUSTED_YOUTUBE_CHANNELS,
        podcast_feeds=TRUSTED_PODCAST_FEEDS,
        web_domains=TRUSTED_WEB_DOMAINS,
        social_accounts=TRUSTED_SOCIAL_ACCOUNTS,
    )


@router.post("/validate", response_model=ComplianceCheckResponse)
async def validate_content(
    request: ValidateContentRequest,
    user_id: str = Depends(get_current_user_flexible),
):
    """Validate text content against Gita compliance rules.

    Checks if the provided content is aligned with Bhagavad Gita teachings
    and does not contain prohibited topics.
    """
    compliance = validate_gita_compliance(request.text)

    if compliance.is_compliant:
        message = f"Content is Gita-compliant (confidence: {compliance.confidence:.0%})"
    elif compliance.rejection_reason:
        message = f"Content rejected: {compliance.rejection_reason}"
    else:
        message = "Content does not meet Gita compliance threshold"

    return ComplianceCheckResponse(compliance=compliance, message=message)


@router.post("/ingest", response_model=IngestionResult)
async def ingest_content(
    request: IngestionRequest,
    user_id: str = Depends(get_current_user_flexible),
):
    """Ingest a single piece of content from a social media source.

    The content URL is validated against trusted sources and checked
    for Gita compliance before being added to the knowledge base.
    """
    logger.info(f"Ingestion request: platform={request.platform.value}, url={request.url[:80]}")
    result = await process_ingestion(request)
    return result


@router.post("/ingest/bulk", response_model=IngestionStatusResponse)
async def ingest_bulk(
    request: BulkIngestionRequest,
    user_id: str = Depends(get_current_user_flexible),
):
    """Ingest multiple content sources in a single batch.

    Processes up to 50 sources. Each source is independently validated
    for Gita compliance.
    """
    logger.info(f"Bulk ingestion request: {len(request.sources)} sources")

    results = []
    for source in request.sources:
        try:
            result = await process_ingestion(source)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to process source {source.url[:80]}: {e}")
            results.append(IngestionResult(
                success=False,
                message=f"Processing error: {str(e)}",
            ))

    successful = sum(1 for r in results if r.success)
    failed = len(results) - successful

    return IngestionStatusResponse(
        results=results,
        total=len(results),
        successful=successful,
        failed=failed,
    )


@router.get("/check-source")
async def check_source(
    url: str = Query(..., min_length=10, description="URL to check"),
    platform: PlatformType = Query(..., description="Platform type"),
    user_id: str = Depends(get_current_user_flexible),
):
    """Check if a URL is from a trusted source.

    Quick validation to verify whether a content source is pre-approved
    before attempting full ingestion.
    """
    trusted = is_trusted_source(url, platform)
    return {
        "url": url,
        "platform": platform.value,
        "is_trusted": trusted,
        "message": "Source is trusted" if trusted else "Source is not in the trusted list. Content will require compliance validation.",
    }


@router.get("/platforms")
async def get_platforms(
    user_id: str = Depends(get_current_user_flexible),
):
    """Get supported platforms and content types.

    Returns the list of all supported social media platforms and
    content types for ingestion.
    """
    return {
        "platforms": [p.value for p in PlatformType],
        "content_types": [ct.value for ct in ContentType],
    }
