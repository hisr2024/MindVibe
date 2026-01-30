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

from fastapi import APIRouter, Depends, HTTPException, Path, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.deps import get_current_user_flexible, get_db
from backend.models import JourneyTemplate
from backend.middleware.rate_limiter import limiter
from backend.middleware.feature_access import (
    require_wisdom_journeys,
    WisdomJourneysAccessRequired,
    get_current_user_id,
    is_developer,
)
from backend.middleware.rbac import get_current_admin, AdminContext
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
from backend.models import UserJourney

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/journeys", tags=["journeys-enhanced"])
admin_router = APIRouter(prefix="/api/admin/ai", tags=["admin-ai"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class StartJourneysRequest(BaseModel):
    """Request to start one or more journeys."""
    journey_ids: list[str] = Field(..., min_length=1, max_length=5)
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
    is_free: bool = False  # Free access for all users (one journey should be free for testing)
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
        logger.info(f"[access] User ID from request: {user_id}")

        await get_or_create_free_subscription(db, user_id)
        logger.info(f"[access] Subscription ensured for user: {user_id}")

        # Check for developer bypass - gives full unlimited access
        is_dev = await is_developer(db, user_id)
        logger.info(f"[access] is_developer check for {user_id}: {is_dev}")

        if is_dev:
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
        logger.info(f"[access] Stats for {user_id}: {stats}")

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
        # Return a graceful fallback response instead of 500 error
        # This allows users to still see and start free journeys even if there are DB issues
        return JourneyAccessResponse(
            has_access=True,  # Allow free journey access
            tier="free",
            active_journeys=0,
            journey_limit=1,
            remaining=1,
            is_unlimited=False,
            can_start_more=True,
            is_trial=True,
            trial_days_limit=3,
            upgrade_url="/pricing",
            upgrade_cta="Upgrade for Full Access",
        )


# =============================================================================
# DEMO JOURNEY TEMPLATES (loaded from shared JSON file)
# =============================================================================

def _load_demo_templates() -> list[dict]:
    """
    Load demo journey templates from shared JSON file.

    Single source of truth: data/journey_templates.json
    This ensures frontend and backend use identical fallback templates.
    """
    import json
    from pathlib import Path

    templates_path = Path(__file__).parent.parent.parent / "data" / "journey_templates.json"

    try:
        with open(templates_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("templates", [])
    except Exception as e:
        logger.warning(f"Failed to load journey templates from {templates_path}: {e}")
        # Minimal fallback if file is missing
        return [
            {
                "id": "demo-krodha-001",
                "slug": "transform-anger-demo",
                "title": "Transform Anger (Krodha)",
                "description": "A 14-day journey to transform destructive anger into constructive energy through Gita wisdom.",
                "primary_enemy_tags": ["krodha"],
                "duration_days": 14,
                "difficulty": 2,
                "is_featured": True,
                "icon_name": "flame",
                "color_theme": "red",
            }
        ]


# Load templates at module initialization
DEMO_JOURNEY_TEMPLATES = _load_demo_templates()


# =============================================================================
# CATALOG ENDPOINTS
# =============================================================================


@router.get("/catalog", response_model=list[JourneyTemplateResponse])
async def get_catalog(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> list[JourneyTemplateResponse]:
    """
    Get all available journey templates.

    Returns journey templates sorted by featured status and title.
    Available to all users to show the catalog (with premium badges).
    Falls back to demo templates if database is not seeded.
    """
    # Prevent browser caching to ensure fresh data
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    engine = get_journey_engine()

    try:
        templates = await engine.get_catalog(db)

        # If database returned empty, return demo templates with a warning header
        if not templates:
            logger.warning("[catalog] No templates in database - returning demo templates. Run seeding script to populate.")
            response.headers["X-MindVibe-Fallback"] = "demo-templates"
            return [JourneyTemplateResponse(**t) for t in DEMO_JOURNEY_TEMPLATES]

        logger.info(f"[catalog] Returning {len(templates)} templates from database")
        return [JourneyTemplateResponse(**t) for t in templates]

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        # Handle case where table doesn't exist yet (not migrated)
        if "journey_templates" in error_msg or "relation" in error_msg or "does not exist" in error_msg:
            logger.warning("[catalog] Journey templates table not found - returning demo templates")
            response.headers["X-MindVibe-Fallback"] = "demo-templates"
            return [JourneyTemplateResponse(**t) for t in DEMO_JOURNEY_TEMPLATES]

        logger.error(f"[catalog] Error getting catalog: {e}", exc_info=True)
        # Return demo templates as fallback instead of 500 error
        response.headers["X-MindVibe-Fallback"] = "demo-templates-error"
        return [JourneyTemplateResponse(**t) for t in DEMO_JOURNEY_TEMPLATES]


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

    **Premium Feature**: Requires Basic tier or higher (except for free journeys).
    - FREE journeys: Available to all users (one journey marked as free for testing)
    - FREE tier: Trial access
    - BASIC: 1 active journey
    - PREMIUM: Up to 5 active journeys
    - ENTERPRISE: Unlimited journeys
    - DEVELOPER: Full access to all journeys

    Supports starting multiple journeys in a single request.
    Rate limited to 10 journey starts per hour.
    """
    # Debug: Log auth headers for troubleshooting
    auth_header = request.headers.get("Authorization", "")
    x_auth_uid = request.headers.get("X-Auth-UID", "")
    logger.info(
        f"[start_journeys] Auth check - "
        f"Authorization: {'present' if auth_header else 'missing'}, "
        f"X-Auth-UID: {'present' if x_auth_uid else 'missing'}, "
        f"journey_ids: {body.journey_ids}"
    )

    # Get user ID first (authentication still required)
    try:
        user_id = await get_current_user_id(request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[start_journeys] Error getting user_id: {e}")
        raise HTTPException(status_code=401, detail="Authentication required")

    # Check if user is a developer (full access to all journeys)
    try:
        is_dev = await is_developer(db, user_id)
    except Exception as e:
        logger.warning(f"[start_journeys] Error checking developer status: {e}")
        is_dev = False

    if is_dev:
        logger.info(f"[start_journeys] Developer access granted for {user_id} - full access to all journeys")
        active_count = 0
        journey_limit = -1  # Unlimited
    else:
        # Check if ALL requested journeys are free (is_free=True)
        # First check demo templates (always available), then database
        all_free = False
        templates_found = []

        try:
            # Check demo templates first
            demo_ids = {t["id"] for t in DEMO_JOURNEY_TEMPLATES}
            requested_demo_ids = [jid for jid in body.journey_ids if jid in demo_ids]

            if requested_demo_ids and len(requested_demo_ids) == len(body.journey_ids):
                # All requested journeys are demo templates
                templates_found = [t for t in DEMO_JOURNEY_TEMPLATES if t["id"] in body.journey_ids]
                all_free = all(t.get("is_free", False) for t in templates_found) if templates_found else False
                logger.info(f"[start_journeys] Using demo templates: {[t['title'] for t in templates_found]}")
            else:
                # Try database query (may fail if is_free column doesn't exist)
                try:
                    result = await db.execute(
                        select(JourneyTemplate)
                        .where(JourneyTemplate.id.in_(body.journey_ids))
                    )
                    db_templates = list(result.scalars().all())

                    if db_templates:
                        templates_found = db_templates
                        # Safely check is_free with fallback
                        all_free = all(getattr(t, "is_free", False) for t in db_templates)
                        logger.info(f"[start_journeys] Found {len(db_templates)} templates in database")
                except Exception as db_err:
                    logger.warning(f"[start_journeys] DB query for is_free failed (column may not exist): {db_err}")
                    # Fall back to demo templates if DB query fails
                    if requested_demo_ids:
                        templates_found = [t for t in DEMO_JOURNEY_TEMPLATES if t["id"] in body.journey_ids]
                        all_free = all(t.get("is_free", False) for t in templates_found) if templates_found else False

            logger.info(f"[start_journeys] Free journey check: all_free={all_free}, templates_count={len(templates_found)}")
        except Exception as e:
            logger.warning(f"[start_journeys] Error checking free journeys: {e}")
            all_free = False

        if all_free and templates_found:
            # All requested journeys are free - allow access
            logger.info(f"[start_journeys] Free journey access granted for user {user_id}")
            active_count = 0
            journey_limit = 1  # Limited to free journeys
        else:
            # Check premium access with limit validation
            try:
                access_check = WisdomJourneysAccessRequired(
                    check_limit=True, requested_count=len(body.journey_ids)
                )
                user_id, active_count, journey_limit = await access_check(request, db)
                logger.info(f"[start_journeys] Access granted for user {user_id}, active: {active_count}, limit: {journey_limit}")
            except HTTPException as e:
                logger.warning(f"[start_journeys] Access denied: {e.status_code} - {e.detail}")
                raise
            except Exception as e:
                error_msg = str(e).lower()
                logger.error(f"[start_journeys] Error checking access: {e}", exc_info=True)

                # Provide more specific error messages based on the error type
                if "relation" in error_msg or "does not exist" in error_msg:
                    raise HTTPException(
                        status_code=503,
                        detail={
                            "error": "database_not_ready",
                            "message": "Database tables are being set up. Please try again in a moment.",
                        }
                    )
                elif "connection" in error_msg or "connect" in error_msg:
                    raise HTTPException(
                        status_code=503,
                        detail={
                            "error": "database_connection_error",
                            "message": "Unable to connect to the database. Please try again in a moment.",
                        }
                    )
                else:
                    raise HTTPException(
                        status_code=503,
                        detail={
                            "error": "service_unavailable",
                            "message": "Wisdom Journeys is being set up. Please check back in a few minutes!",
                        }
                    )

    engine = get_journey_engine()

    try:
        journeys = await engine.start_journeys(
            db=db,
            user_id=user_id,
            journey_template_ids=body.journey_ids,
            personalization=body.personalization,
        )

        # Check if any journeys were created
        if not journeys:
            logger.warning(f"No journeys created for IDs: {body.journey_ids}")
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "templates_not_found",
                    "message": "The selected journey templates were not found. "
                               "Please ensure the database has been seeded with journey templates.",
                    "requested_ids": body.journey_ids,
                }
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
        error_msg = str(e).lower()
        logger.error(f"Error starting journeys: {e}", exc_info=True)

        # Provide specific error messages based on the error type
        if "relation" in error_msg or "does not exist" in error_msg or "no such table" in error_msg:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "database_setup_required",
                    "message": "Wisdom Journeys is being set up. Database tables need to be created. "
                               "Please contact support or try again later.",
                    "_admin_note": "Run: python scripts/seed_journey_templates.py --seed",
                }
            )
        elif "foreign key" in error_msg or "violates" in error_msg:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "database_constraint_error",
                    "message": "Journey templates need to be seeded. Please try again later.",
                    "_admin_note": "Run: python scripts/seed_journey_templates.py --seed",
                }
            )
        elif "connection" in error_msg or "timeout" in error_msg:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "database_connection_error",
                    "message": "Unable to connect to the database. Please try again in a moment.",
                }
            )
        else:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "journey_creation_failed",
                    "message": "Failed to start journeys. Please try again.",
                }
            )


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
        error_msg = str(e).lower()
        logger.error(f"Error getting active journeys: {e}", exc_info=True)

        if "relation" in error_msg or "does not exist" in error_msg:
            # Return empty list if tables don't exist yet (graceful degradation)
            return []
        raise HTTPException(
            status_code=500,
            detail={"error": "fetch_failed", "message": "Failed to get active journeys"}
        )


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
        error_msg = str(e).lower()
        logger.error(f"Error getting today's agenda: {e}", exc_info=True)

        if "relation" in error_msg or "does not exist" in error_msg:
            # Return empty agenda if tables don't exist yet (graceful degradation)
            return TodayAgendaResponse(
                steps=[],
                priority_step=None,
                active_journey_count=0,
                message="Start a journey to see your daily wisdom agenda.",
            )
        raise HTTPException(
            status_code=500,
            detail={"error": "fetch_failed", "message": "Failed to get today's agenda"}
        )


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
    day_index: int = Path(..., ge=1, description="Day index (1-indexed, must be positive)"),
    body: CompleteStepRequest = None,
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
    admin: AdminContext = Depends(get_current_admin),
) -> ProviderStatusResponse:
    """
    Get health status of all AI providers.

    Admin-only endpoint for monitoring provider health.
    Requires admin authentication.
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
