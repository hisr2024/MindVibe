"""
Enhanced Wisdom Journeys API Routes.

Provides endpoints for the multi-journey Wisdom Journey system:
- GET  /api/journeys/catalog - Get journey templates
- POST /api/journeys/start - Start multiple journeys
- GET  /api/journeys/active - Get active journeys
- GET  /api/journeys/today - Get today's agenda
- POST /api/journeys/{id}/today - Get/generate today's step
- POST /api/journeys/{id}/steps/{day}/complete - Complete a step
- POST /api/journeys/{id}/pause - Pause journey
- POST /api/journeys/{id}/resume - Resume journey
- POST /api/journeys/{id}/abandon - Abandon journey
- GET  /api/journeys/{id}/history - Get journey history
- GET  /api/admin/ai/providers/status - Provider health (admin only)
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_flexible, get_db
from backend.middleware.rate_limiter import limiter
from backend.middleware.feature_access import (
    require_wisdom_journeys,
    WisdomJourneysAccessRequired,
    get_current_user_id,
    is_developer,
)
from backend.services.journey_engine_enhanced import (
    EnhancedJourneyEngine,
    get_journey_engine,
)
from backend.services.ai.providers import get_provider_manager
from backend.services.subscription_service import (
    get_wisdom_journeys_stats,
    get_user_tier,
    get_or_create_free_subscription,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/journeys", tags=["journeys-enhanced"])
admin_router = APIRouter(prefix="/api/admin/ai", tags=["admin-ai"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class StartJourneysRequest(BaseModel):
    """Request to start one or more journeys."""
    journey_ids: list[str] = Field(..., min_items=1, max_items=5)
    personalization: dict[str, Any] | None = Field(
        default=None,
        description="Personalization settings: pace, time_budget_minutes, focus_tags, preferred_tone, provider_preference"
    )


class CompleteStepRequest(BaseModel):
    """Request to mark a step as complete."""
    check_in: dict[str, Any] | None = Field(
        default=None,
        description="Check-in data: {intensity: 0-10, label: string}"
    )
    reflection_response: str | None = Field(
        default=None,
        max_length=10000,
        description="User reflection text (will be encrypted)"
    )


class JourneyTemplateResponse(BaseModel):
    """Journey template response."""
    id: str
    slug: str
    title: str
    description: str | None
    primary_enemy_tags: list[str]
    duration_days: int
    difficulty: int
    is_featured: bool
    icon_name: str | None
    color_theme: str | None


class UserJourneyResponse(BaseModel):
    """User journey response."""
    id: str
    template_id: str | None
    template_title: str
    template_slug: str | None
    status: str
    current_day_index: int
    total_days: int
    progress_percentage: int
    started_at: str
    personalization: dict[str, Any] | None


class StepResponse(BaseModel):
    """Step response with KIAAN-generated content."""
    step_state_id: str
    user_journey_id: str
    day_index: int
    kiaan_step: dict[str, Any] | None
    verse_refs: list[dict[str, int]]
    verse_texts: list[dict[str, Any]] | None = None
    completed: bool
    check_in: dict[str, Any] | None
    provider_used: str | None
    model_used: str | None


class TodayAgendaResponse(BaseModel):
    """Today's agenda across all active journeys."""
    steps: list[dict[str, Any]]
    priority_step: dict[str, Any] | None
    active_journey_count: int | None = None
    message: str | None = None


class ProviderStatusResponse(BaseModel):
    """AI provider health status."""
    providers: dict[str, dict[str, Any]]


class JourneyAccessResponse(BaseModel):
    """Wisdom Journeys access information for the current user."""
    has_access: bool
    tier: str
    active_journeys: int
    journey_limit: int
    remaining: int
    is_unlimited: bool
    can_start_more: bool
    # Trial access info for free users
    is_trial: bool = False
    trial_days_limit: int = 0  # 0 = no limit, 3 = trial limited to 3 days
    # Upgrade prompts
    upgrade_url: str | None = None
    upgrade_cta: str | None = None


# =============================================================================
# ACCESS & SUBSCRIPTION ENDPOINTS
# =============================================================================


@router.get("/access", response_model=JourneyAccessResponse)
async def get_journey_access(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JourneyAccessResponse:
    """
    Check the current user's access to Wisdom Journeys.

    Returns subscription tier, active journey count, and limits.
    This endpoint is available to all users (including free tier)
    to show appropriate upgrade prompts.
    """
    try:
        user_id = await get_current_user_id(request)
        await get_or_create_free_subscription(db, user_id)

        # Check for developer bypass - gives full unlimited access
        if await is_developer(db, user_id):
            logger.info(f"Developer access: unlimited journeys for {user_id}")
            return JourneyAccessResponse(
                has_access=True,
                tier="developer",
                active_journeys=0,
                journey_limit=-1,
                remaining=999,
                is_unlimited=True,
                can_start_more=True,
                upgrade_url=None,
                upgrade_cta=None,
            )

        stats = await get_wisdom_journeys_stats(db, user_id)

        # Add upgrade info based on access status
        upgrade_url = None
        upgrade_cta = None

        if stats["is_trial"]:
            # Trial users - encourage upgrade
            upgrade_url = "/pricing"
            upgrade_cta = "Upgrade for Full Access"
        elif not stats["can_start_more"] and not stats["is_unlimited"]:
            upgrade_url = "/pricing"
            upgrade_cta = "Upgrade for More Journeys"

        return JourneyAccessResponse(
            has_access=stats["has_access"],
            tier="trial" if stats["is_trial"] else stats["tier"],
            active_journeys=stats["active_journeys"],
            journey_limit=stats["journey_limit"],
            remaining=stats["remaining"],
            is_unlimited=stats["is_unlimited"],
            can_start_more=stats["can_start_more"],
            is_trial=stats["is_trial"],
            trial_days_limit=stats["trial_days_limit"],
            upgrade_url=upgrade_url,
            upgrade_cta=upgrade_cta,
        )

    except HTTPException as e:
        # For 401 errors (not authenticated), show trial access available
        if e.status_code == 401:
            return JourneyAccessResponse(
                has_access=True,  # Trial available after sign in
                tier="trial",
                active_journeys=0,
                journey_limit=1,
                remaining=1,
                is_unlimited=False,
                can_start_more=True,
                is_trial=True,
                trial_days_limit=3,
                upgrade_url="/account",
                upgrade_cta="Sign in for Free Trial",
            )
        raise
    except Exception as e:
        logger.error(f"Error checking journey access: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to check journey access")


# =============================================================================
# DEMO JOURNEY TEMPLATES (shown when database not seeded)
# =============================================================================

DEMO_JOURNEY_TEMPLATES = [
    {
        "id": "demo-krodha-001",
        "slug": "transform-anger-demo",
        "title": "Transform Anger (Krodha)",
        "description": "A 14-day journey to transform destructive anger into constructive energy through Gita wisdom. Learn to recognize triggers, practice patience, and cultivate inner peace.",
        "primary_enemy_tags": ["krodha"],
        "duration_days": 14,
        "difficulty": 2,
        "is_featured": True,
        "icon_name": "flame",
        "color_theme": "red",
    },
    {
        "id": "demo-kama-001",
        "slug": "master-desire-demo",
        "title": "Mastering Desire (Kama)",
        "description": "A 21-day journey to understand and master desires. Transform cravings into purposeful aspirations aligned with your dharma.",
        "primary_enemy_tags": ["kama"],
        "duration_days": 21,
        "difficulty": 3,
        "is_featured": True,
        "icon_name": "heart",
        "color_theme": "pink",
    },
    {
        "id": "demo-lobha-001",
        "slug": "overcome-greed-demo",
        "title": "Contentment Over Greed (Lobha)",
        "description": "A 14-day journey to cultivate santosha (contentment) and release the grip of greed. Find abundance in simplicity.",
        "primary_enemy_tags": ["lobha"],
        "duration_days": 14,
        "difficulty": 2,
        "is_featured": False,
        "icon_name": "coins",
        "color_theme": "amber",
    },
    {
        "id": "demo-moha-001",
        "slug": "clarity-attachment-demo",
        "title": "Clarity Over Attachment (Moha)",
        "description": "A 21-day journey to see through delusion and attachment. Develop viveka (discrimination) and find clarity.",
        "primary_enemy_tags": ["moha"],
        "duration_days": 21,
        "difficulty": 3,
        "is_featured": False,
        "icon_name": "cloud",
        "color_theme": "purple",
    },
    {
        "id": "demo-mada-001",
        "slug": "humility-pride-demo",
        "title": "Humility Over Ego (Mada)",
        "description": "A 14-day journey to dissolve ego and cultivate true humility. Recognize the Self beyond the small self.",
        "primary_enemy_tags": ["mada"],
        "duration_days": 14,
        "difficulty": 2,
        "is_featured": False,
        "icon_name": "crown",
        "color_theme": "orange",
    },
    {
        "id": "demo-matsarya-001",
        "slug": "joy-envy-demo",
        "title": "Joy Over Envy (Matsarya)",
        "description": "A 14-day journey to transform envy into mudita (sympathetic joy). Celebrate others' success as your own.",
        "primary_enemy_tags": ["matsarya"],
        "duration_days": 14,
        "difficulty": 2,
        "is_featured": False,
        "icon_name": "eye",
        "color_theme": "emerald",
    },
    {
        "id": "demo-complete-001",
        "slug": "complete-transformation-demo",
        "title": "Complete Inner Transformation",
        "description": "A comprehensive 30-day journey addressing all six inner enemies. The ultimate path to self-mastery and liberation.",
        "primary_enemy_tags": ["kama", "krodha", "lobha", "moha", "mada", "matsarya"],
        "duration_days": 30,
        "difficulty": 4,
        "is_featured": True,
        "icon_name": "sparkles",
        "color_theme": "indigo",
    },
]


# =============================================================================
# CATALOG ENDPOINTS
# =============================================================================


@router.get("/catalog", response_model=list[JourneyTemplateResponse])
async def get_catalog(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> list[JourneyTemplateResponse]:
    """
    Get all available journey templates.

    Returns journey templates sorted by featured status and title.
    Available to all users to show the catalog (with premium badges).
    Falls back to demo templates if database is not seeded.
    """
    engine = get_journey_engine()

    try:
        templates = await engine.get_catalog(db)

        # If database returned empty, use demo templates
        if not templates:
            logger.info("No templates in database, returning demo templates")
            return [JourneyTemplateResponse(**t) for t in DEMO_JOURNEY_TEMPLATES]

        return [JourneyTemplateResponse(**t) for t in templates]

    except Exception as e:
        error_msg = str(e).lower()
        # Handle case where table doesn't exist yet (not migrated)
        if "journey_templates" in error_msg or "relation" in error_msg or "does not exist" in error_msg:
            logger.warning("Journey templates table not found - returning demo templates")
            return [JourneyTemplateResponse(**t) for t in DEMO_JOURNEY_TEMPLATES]
        logger.error(f"Error getting catalog: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get journey catalog")


# =============================================================================
# JOURNEY MANAGEMENT ENDPOINTS
# =============================================================================


@router.post("/start", response_model=list[UserJourneyResponse])
@limiter.limit("10/hour")
async def start_journeys(
    request: Request,
    body: StartJourneysRequest,
    db: AsyncSession = Depends(get_db),
) -> list[UserJourneyResponse]:
    """
    Start one or more journeys.

    **Premium Feature**: Requires Basic tier or higher.
    - FREE: No access
    - BASIC: 1 active journey
    - PREMIUM: Up to 5 active journeys
    - ENTERPRISE: Unlimited journeys

    Supports starting multiple journeys in a single request.
    Rate limited to 10 journey starts per hour.
    """
    # Check premium access with limit validation
    access_check = WisdomJourneysAccessRequired(
        check_limit=True, requested_count=len(body.journey_ids)
    )
    user_id, active_count, journey_limit = await access_check(request, db)

    engine = get_journey_engine()

    # Check if trying to start demo journeys (database not yet set up)
    demo_ids = [jid for jid in body.journey_ids if jid.startswith("demo-")]
    if demo_ids:
        # Demo templates are preview-only until database is set up
        logger.info(f"User {user_id} attempted to start demo journeys: {demo_ids}")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "demo_preview_only",
                "message": "Wisdom Journeys is currently in preview mode. "
                           "The full feature with personalized AI content is coming soon! "
                           "Please check back later or contact support for early access.",
                "journey_ids": demo_ids,
            }
        )

    try:
        journeys = await engine.start_journeys(
            db=db,
            user_id=user_id,
            journey_template_ids=body.journey_ids,
            personalization=body.personalization,
        )

        return [
            UserJourneyResponse(
                id=j.id,
                template_id=j.journey_template_id,
                template_title=j.template.title if j.template else "Journey",
                template_slug=j.template.slug if j.template else None,
                status=j.status.value,
                current_day_index=j.current_day_index,
                total_days=j.template.duration_days if j.template else 14,
                progress_percentage=0,
                started_at=j.started_at.isoformat(),
                personalization=j.personalization,
            )
            for j in journeys
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting journeys: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to start journeys")


@router.get("/active", response_model=list[UserJourneyResponse])
async def get_active_journeys(
    request: Request,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> list[UserJourneyResponse]:
    """
    Get all active journeys for the current user.

    **Premium Feature**: Requires Basic tier or higher.
    """
    user_id, _, _ = access
    engine = get_journey_engine()

    try:
        journeys = await engine.get_active_journeys(db, user_id)
        return [UserJourneyResponse(**j) for j in journeys]

    except Exception as e:
        logger.error(f"Error getting active journeys: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get active journeys")


# =============================================================================
# TODAY'S AGENDA ENDPOINTS
# =============================================================================


@router.get("/today", response_model=TodayAgendaResponse)
async def get_today_agenda(
    request: Request,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> TodayAgendaResponse:
    """
    Get today's agenda across all active journeys.

    **Premium Feature**: Requires Basic tier or higher.

    Returns steps for all active journeys and optionally recommends
    a priority step based on check-in intensity.
    """
    user_id, active_count, journey_limit = access
    engine = get_journey_engine()

    try:
        agenda = await engine.get_today_steps(db, user_id)
        # Add journey count info to response
        agenda["active_journey_count"] = active_count
        return TodayAgendaResponse(**agenda)

    except Exception as e:
        logger.error(f"Error getting today's agenda: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get today's agenda")


@router.post("/{user_journey_id}/today", response_model=StepResponse)
@limiter.limit("30/hour")
async def get_or_generate_today_step(
    request: Request,
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> StepResponse:
    """
    Get or generate today's step for a specific journey.

    **Premium Feature**: Requires Basic tier or higher.

    This endpoint is idempotent - calling it multiple times returns
    the same cached step if already generated.

    Rate limited to 30 step generations per hour.
    """
    user_id, _, _ = access
    engine = get_journey_engine()

    try:
        # Verify ownership
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this journey")

        # Get step
        step = await engine.get_journey_step(db, user_journey_id)

        if not step:
            raise HTTPException(status_code=500, detail="Failed to generate step")

        return StepResponse(**step)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting step for journey {user_journey_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get journey step")


# =============================================================================
# STEP COMPLETION ENDPOINTS
# =============================================================================


@router.post("/{user_journey_id}/steps/{day_index}/complete")
@limiter.limit("100/hour")
async def complete_step(
    request: Request,
    user_journey_id: str,
    day_index: int,
    body: CompleteStepRequest,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> dict[str, Any]:
    """
    Mark a journey step as complete with check-in and reflection.

    **Premium Feature**: Requires Basic tier or higher.

    The reflection is stored using the existing journaling/encryption system.
    """
    user_id, _, _ = access
    engine = get_journey_engine()

    try:
        # Verify ownership
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this journey")

        result = await engine.complete_step(
            db=db,
            user_journey_id=user_journey_id,
            day_index=day_index,
            check_in=body.check_in,
            reflection_response=body.reflection_response,
        )

        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing step: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to complete step")


# =============================================================================
# JOURNEY STATUS ENDPOINTS
# =============================================================================


@router.post("/{user_journey_id}/pause")
async def pause_journey(
    request: Request,
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> dict[str, str]:
    """
    Pause an active journey.

    **Premium Feature**: Requires Basic tier or higher.
    """
    user_id, _, _ = access
    engine = get_journey_engine()

    try:
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        await engine.pause_journey(db, user_journey_id)
        return {"status": "paused", "journey_id": user_journey_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pausing journey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to pause journey")


@router.post("/{user_journey_id}/resume")
async def resume_journey(
    request: Request,
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> dict[str, str]:
    """
    Resume a paused journey.

    **Premium Feature**: Requires Basic tier or higher.
    """
    user_id, _, _ = access
    engine = get_journey_engine()

    try:
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        await engine.resume_journey(db, user_journey_id)
        return {"status": "active", "journey_id": user_journey_id}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error resuming journey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to resume journey")


@router.post("/{user_journey_id}/abandon")
async def abandon_journey(
    request: Request,
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> dict[str, str]:
    """
    Abandon a journey.

    **Premium Feature**: Requires Basic tier or higher.
    """
    user_id, _, _ = access
    engine = get_journey_engine()

    try:
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        await engine.abandon_journey(db, user_journey_id)
        return {"status": "abandoned", "journey_id": user_journey_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error abandoning journey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to abandon journey")


# =============================================================================
# HISTORY ENDPOINTS
# =============================================================================


@router.get("/{user_journey_id}/history")
async def get_journey_history(
    request: Request,
    user_journey_id: str,
    db: AsyncSession = Depends(get_db),
    access: tuple = Depends(require_wisdom_journeys),
) -> list[dict[str, Any]]:
    """
    Get complete history of a journey's steps.

    **Premium Feature**: Requires Basic tier or higher.
    """
    user_id, _, _ = access
    engine = get_journey_engine()

    try:
        from backend.models import UserJourney
        journey = await db.get(UserJourney, user_journey_id)

        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")

        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        return await engine.get_journey_history(db, user_journey_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting journey history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get journey history")


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================


@admin_router.get("/providers/status", response_model=ProviderStatusResponse)
async def get_provider_status(
    # Note: In production, add admin auth check here
    # admin: AdminUser = Depends(require_admin_role)
) -> ProviderStatusResponse:
    """
    Get health status of all AI providers.

    Admin-only endpoint for monitoring provider health.
    """
    manager = get_provider_manager()

    try:
        health_status = await manager.get_all_health_status()

        providers = {}
        for name, result in health_status.items():
            providers[name] = {
                "status": result.status.value,
                "latency_ms": result.latency_ms,
                "error": result.error,
                "last_check": result.timestamp.isoformat(),
            }

        return ProviderStatusResponse(providers=providers)

    except Exception as e:
        logger.error(f"Error getting provider status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get provider status")
