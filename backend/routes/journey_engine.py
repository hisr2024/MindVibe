"""
Journey Engine API Routes - REST API for Journey Management.

This module provides API endpoints for:
1. Journey template discovery and browsing
2. Journey lifecycle (start, pause, resume, complete)
3. Daily step delivery and completion
4. User dashboard and progress tracking
5. Enemy progress visualization

Base URL: /api/journey-engine

Endpoints:
    Templates:
        GET  /templates              - List available templates
        GET  /templates/{id}         - Get template details
        GET  /templates/slug/{slug}  - Get template by slug

    Journeys:
        GET    /journeys             - List user's journeys
        POST   /journeys             - Start a new journey
        GET    /journeys/{id}        - Get journey details
        POST   /journeys/{id}/pause  - Pause journey
        POST   /journeys/{id}/resume - Resume journey
        DELETE /journeys/{id}        - Abandon journey

    Steps:
        GET  /journeys/{id}/steps/current   - Get current step
        GET  /journeys/{id}/steps/{day}     - Get specific step
        POST /journeys/{id}/steps/{day}/complete - Complete step

    Dashboard:
        GET  /dashboard              - Get user's journey dashboard
        GET  /enemies                - List enemies with info
        GET  /enemies/{enemy}        - Get enemy progress
        GET  /examples/{enemy}       - Get modern examples

Usage:
    Include in FastAPI app:

    from backend.routes.journey_engine import router as journey_engine_router
    app.include_router(journey_engine_router, prefix="/api/journey-engine")
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings as _settings
from backend.deps import get_current_user, get_db
from backend.services.journey_engine import (
    JourneyEngineService,
    EnemyProgressTracker,
    ModernExamplesDB,
)
from backend.services.journey_engine.journey_engine_service import (
    JourneyEngineError,
    JourneyNotFoundError,
    TemplateNotFoundError,
    JourneyAlreadyCompletedError,
    StepNotAvailableError,
    StepTimeGatedError,
    MaxActiveJourneysError,
    ENEMY_LABELS,
)
from backend.services.journey_engine.template_generator import ENEMY_METADATA, EnemyType
from backend.services.notification_dispatcher import dispatch_notification

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Journey Engine"])


# =============================================================================
# START-JOURNEY IDEMPOTENCY (in-memory, 60s TTL)
# =============================================================================
# The mobile client can retry a start-journey POST if the initial response
# is delayed or the user double-taps before the UI disables the button.
# Without dedup, each retry would create a fresh UserJourney row, quickly
# tripping MaxActiveJourneysError and surfacing as "journey won't start"
# from the user's point of view.
#
# We cache successful (user_id, template_id, idempotency_key) -> JourneyResponse
# for 60 seconds. Any retry with the same key in that window returns the
# original response instead of creating a new journey. The cache is process-
# local (single worker safe), which matches the retry window comfortably —
# longer-term dedup belongs in a schema column, but that requires Alembic
# which this project does not use. Deliberately minimal surface area.

_IDEMPOTENCY_TTL_SECONDS = 60
_idempotency_cache: dict[tuple[str, str, str], tuple[float, Any]] = {}


def _idempotency_lookup(
    user_id: str, template_id: str, key: str
) -> Any | None:
    entry = _idempotency_cache.get((user_id, template_id, key))
    if entry is None:
        return None
    ts, value = entry
    if time.time() - ts > _IDEMPOTENCY_TTL_SECONDS:
        _idempotency_cache.pop((user_id, template_id, key), None)
        return None
    return value


def _idempotency_store(
    user_id: str, template_id: str, key: str, value: Any
) -> None:
    # Opportunistic GC so the dict doesn't grow unbounded on a healthy server.
    if len(_idempotency_cache) > 512:
        now = time.time()
        stale = [
            k
            for k, (ts, _) in _idempotency_cache.items()
            if now - ts > _IDEMPOTENCY_TTL_SECONDS
        ]
        for k in stale:
            _idempotency_cache.pop(k, None)
    _idempotency_cache[(user_id, template_id, key)] = (time.time(), value)


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================


class PersonalizationSettings(BaseModel):
    """User personalization settings for a journey."""

    pace: str = Field(default="daily", description="Pace: daily, every_other_day, weekly")
    time_budget_minutes: int = Field(default=10, ge=5, le=60, description="Daily time budget")
    focus_tags: list[str] = Field(default_factory=list, description="Focus enemy tags")
    preferred_tone: str = Field(default="gentle", description="Tone: gentle, direct, inspiring")
    provider_preference: str = Field(default="auto", description="AI provider preference")


class StartJourneyRequest(BaseModel):
    """Request to start a new journey."""

    template_id: str = Field(..., description="Template ID to start")
    personalization: PersonalizationSettings | None = Field(
        default=None, description="Optional personalization settings"
    )


class CompleteStepRequest(BaseModel):
    """Request to complete a journey step."""

    reflection: str | None = Field(default=None, min_length=1, max_length=5000, description="User reflection")
    check_in: dict[str, Any] | None = Field(default=None, description="Check-in data")


class TemplateResponse(BaseModel):
    """Response model for a journey template."""

    id: str
    slug: str
    title: str
    description: str | None
    primary_enemy_tags: list[str]
    duration_days: int
    difficulty: int
    is_featured: bool
    is_free: bool
    icon_name: str | None
    color_theme: str | None
    # Sacred enrichment fields (derived from primary enemy tag).
    # Optional so older tests / callers that construct TemplateResponse
    # directly continue to type-check; endpoints populate them via
    # _template_to_response() below.
    gita_verse_ref: dict[str, int] | None = None
    gita_verse_text: str | None = None
    modern_context: str | None = None
    transformation_promise: str | None = None


class TemplateListResponse(BaseModel):
    """Response model for template list."""

    templates: list[TemplateResponse]
    total: int
    limit: int
    offset: int


class JourneyResponse(BaseModel):
    """Response model for a user journey."""

    journey_id: str
    template_slug: str
    title: str
    status: str
    current_day: int
    total_days: int
    progress_percentage: float
    days_completed: int
    started_at: str | None
    last_activity: str | None
    primary_enemies: list[str]
    streak_days: int


class JourneyListResponse(BaseModel):
    """Response model for journey list."""

    journeys: list[JourneyResponse]
    total: int
    limit: int
    offset: int


class VerseContent(BaseModel):
    """Verse content in a step."""

    chapter: int
    verse: int
    sanskrit: str | None
    hindi: str | None
    english: str
    transliteration: str | None
    theme: str | None


class ModernExampleOut(BaseModel):
    """Modern real-life example surfaced with a daily step."""

    category: str
    scenario: str
    how_enemy_manifests: str
    gita_verse_ref: dict[str, int]
    gita_wisdom: str
    practical_antidote: str
    reflection_question: str


class StepResponse(BaseModel):
    """Response model for a daily step."""

    step_id: str
    journey_id: str
    day_index: int
    step_title: str
    teaching: str
    guided_reflection: list[str]
    practice: dict[str, Any]
    verse_refs: list[dict[str, int]]
    verses: list[VerseContent]
    micro_commitment: str | None
    check_in_prompt: dict[str, str] | None
    safety_note: str | None
    is_completed: bool
    completed_at: str | None
    available_to_complete: bool = True
    next_available_at: str | None = None
    # Flattened sacred fields for the 4-block day-content UI. Derived from
    # the first entry of verses[] + guided_reflection, and from
    # ModernExamplesDB keyed by (primary enemy, day_index). All optional so
    # existing callers keep working; endpoints populate via _step_to_response.
    verse_ref: dict[str, int] | None = None
    verse_sanskrit: str | None = None
    verse_transliteration: str | None = None
    verse_translation: str | None = None
    reflection_prompt: str | None = None
    modern_example: ModernExampleOut | None = None


class EnemyInfo(BaseModel):
    """Information about an inner enemy."""

    enemy: str
    sanskrit: str
    english: str
    description: str
    label: str
    key_verse: dict[str, int]
    themes: list[str]
    antidotes: list[str]
    modern_contexts: list[str]


class EnemyProgressResponse(BaseModel):
    """Progress against an inner enemy."""

    enemy: str
    enemy_label: str
    journeys_started: int
    journeys_completed: int
    total_days_practiced: int
    current_streak: int
    best_streak: int
    last_practice: str | None
    mastery_level: int
    # Active-journey progress for Battleground rendering. 0 when no
    # active journey exists for this enemy, else the % completion of
    # the most-recent active journey targeting this enemy. Lets the
    # radar + enemy cards show "Day 3 of 14 · 21%" instead of the
    # long-term weighted mastery figure.
    active_journey_progress_pct: int = 0
    active_journey_id: str | None = None
    active_journey_day: int = 0
    active_journey_total_days: int = 0


class DashboardResponse(BaseModel):
    """User's journey dashboard."""

    active_journeys: list[JourneyResponse]
    completed_journeys: int
    total_days_practiced: int
    current_streak: int
    enemy_progress: list[EnemyProgressResponse]
    recommended_templates: list[dict[str, Any]]
    today_steps: list[StepResponse]
    # Authoritative active-journey count from the DB. Frontend must use
    # this for the "N/5" indicator instead of len(active_journeys), so the
    # dashboard count and the start-journey limit check can never disagree.
    active_count: int = 0
    max_active: int = 5


class ExampleResponse(BaseModel):
    """A modern example for an enemy."""

    enemy: str
    category: str
    scenario: str
    how_enemy_manifests: str
    gita_verse_ref: dict[str, int]
    gita_wisdom: str
    practical_antidote: str
    reflection_question: str


class ExampleListResponse(BaseModel):
    """List of modern examples."""

    examples: list[ExampleResponse]
    total: int
    enemy: str


class CompletionResponse(BaseModel):
    """Response after completing a step."""

    success: bool
    day_completed: int
    journey_complete: bool
    next_day: int | None
    progress_percentage: float
    # Sakha wisdom surfaced after completion. Both fields are deterministic
    # placeholders synthesised from the canonical enemy verse — they are NOT
    # produced by an LLM. A future task can swap the body of
    # _build_sakha_response() for a real KIAAN call without changing the
    # client contract. Empty string + 0 keep older clients happy.
    ai_response: str = ""
    mastery_delta: int = 0


# =============================================================================
# DEPENDENCY INJECTION
# =============================================================================


async def get_journey_service(
    db: AsyncSession = Depends(get_db),
) -> JourneyEngineService:
    """Get journey engine service instance."""
    return JourneyEngineService(db)


async def get_examples_db() -> ModernExamplesDB:
    """Get modern examples database instance."""
    return ModernExamplesDB()


# =============================================================================
# SACRED ENRICHMENT HELPERS
# =============================================================================
# The Journey Engine already stores teaching, verses, practice, etc. on every
# step, and ENEMY_METADATA has the primary verse per enemy. What the mobile UI
# needs additionally are flattened, enemy-anchored sacred fields (verse in
# Devanagari + transliteration + English, modern real-life mirror, and a
# transformation promise) surfaced on the same response. The data already
# exists — this layer just projects it into the shape the client expects.

# Sanskrit / transliteration / translation / modern-context / promise keyed by
# the canonical enemy tag. Content is intentionally conservative and taken
# from the Bhagavad Gita — never invented. For enemies where the step already
# returns a verses[] array with full sanskrit + transliteration, the step
# builder prefers that live data over these fallbacks.
_ENEMY_SACRED: dict[str, dict[str, Any]] = {
    "kama": {
        "verse_ref": {"chapter": 3, "verse": 37},
        "verse_sanskrit": "काम एष क्रोध एष रजोगुणसमुद्भवः\nमहाशनो महापाप्मा विद्ध्येनमिह वैरिणम्",
        "verse_transliteration": "kāma eṣa krodha eṣa rajo-guṇa-samudbhavaḥ\nmahāśano mahā-pāpmā viddhyenam iha vairiṇam",
        "verse_translation": "It is desire, it is anger, born of the mode of passion — all-devouring and greatly sinful. Know this to be the enemy here in this world.",
        "modern_context": "Endless scrolling, compulsive shopping, relationship obsession, chasing the next hit that never satisfies.",
        "transformation_promise": "Nishkama Karma — action without craving for the fruit.",
    },
    "krodha": {
        "verse_ref": {"chapter": 2, "verse": 63},
        "verse_sanskrit": "क्रोधाद्भवति संमोहः संमोहात्स्मृतिविभ्रमः\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति",
        "verse_transliteration": "krodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ\nsmṛti-bhraṁśād buddhi-nāśo buddhi-nāśāt praṇaśyati",
        "verse_translation": "From anger arises delusion; from delusion, bewilderment of memory; from the loss of memory, the destruction of discrimination; and when discrimination is lost, one perishes.",
        "modern_context": "Road rage, social media outrage, reactive arguments, the ten-second flash that ruins a relationship.",
        "transformation_promise": "Viveka — the pause of discrimination before reaction.",
    },
    "lobha": {
        "verse_ref": {"chapter": 14, "verse": 17},
        "verse_sanskrit": "लोभः प्रवृत्तिरारम्भः कर्मणामशमः स्पृहा\nरजस्येतानि जायन्ते विवृद्धे भरतर्षभ",
        "verse_transliteration": "lobhaḥ pravṛttir ārambhaḥ karmaṇām aśamaḥ spṛhā\nrajasy etāni jāyante vivṛddhe bharatarṣabha",
        "verse_translation": "Greed, ceaseless activity, the undertaking of works, restlessness and craving — these arise when the mode of passion grows, O best of the Bharatas.",
        "modern_context": "Hoarding, financial anxiety, never feeling 'enough', grasping that cannot be satisfied.",
        "transformation_promise": "Dana — generous giving without expectation.",
    },
    "moha": {
        "verse_ref": {"chapter": 2, "verse": 52},
        "verse_sanskrit": "यदा ते मोहकलिलं बुद्धिर्व्यतितरिष्यति\nतदा गन्तासि निर्वेदं श्रोतव्यस्य श्रुतस्य च",
        "verse_transliteration": "yadā te moha-kalilaṁ buddhir vyatitariṣyati\ntadā gantāsi nirvedaṁ śrotavyasya śrutasya ca",
        "verse_translation": "When your intellect crosses beyond the thicket of delusion, then you shall become indifferent to all that has been heard and all that is yet to be heard.",
        "modern_context": "Toxic relationships, identity attachment, fear of change, mistaking the temporary for the real.",
        "transformation_promise": "Viveka-Vairagya — discrimination and loving detachment.",
    },
    "mada": {
        "verse_ref": {"chapter": 16, "verse": 4},
        "verse_sanskrit": "दम्भो दर्पोऽभिमानश्च क्रोधः पारुष्यमेव च\nअज्ञानं चाभिजातस्य पार्थ सम्पदमासुरीम्",
        "verse_transliteration": "dambho darpo 'bhimānaś ca krodhaḥ pāruṣyam eva ca\najñānaṁ cābhijātasya pārtha sampadam āsurīm",
        "verse_translation": "Hypocrisy, arrogance, self-conceit, anger, harshness and ignorance — these, O Pārtha, are the marks of one born with the demoniac qualities.",
        "modern_context": "Arrogance, inability to accept feedback, needing to be right, the inflated self that forgets its true nature.",
        "transformation_promise": "Namrata — genuine humility, seeing the Self in all.",
    },
    "matsarya": {
        "verse_ref": {"chapter": 12, "verse": 13},
        "verse_sanskrit": "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च\nनिर्ममो निरहङ्कारः समदुःखसुखः क्षमी",
        "verse_transliteration": "adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca\nnirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī",
        "verse_translation": "He who hates no creature, who is friendly and compassionate, free from attachment and egoism, balanced in pleasure and pain, and forgiving — he is dear to Me.",
        "modern_context": "Social media comparison, jealousy of colleagues, resentment when others shine.",
        "transformation_promise": "Mudita — sympathetic joy in others' success.",
    },
}

# Accept alternate spelling used in some template tags.
_ENEMY_SACRED["matsara"] = _ENEMY_SACRED["matsarya"]


def _sacred_for_enemy(enemy_tag: str | None) -> dict[str, Any] | None:
    if not enemy_tag:
        return None
    return _ENEMY_SACRED.get(enemy_tag.lower())


def _template_to_response(t: Any) -> TemplateResponse:
    """Project a domain template into a TemplateResponse with sacred fields."""
    tags = t.primary_enemy_tags or []
    sacred = _sacred_for_enemy(tags[0] if tags else None)
    return TemplateResponse(
        id=t.id,
        slug=t.slug,
        title=t.title,
        description=t.description,
        primary_enemy_tags=tags,
        duration_days=t.duration_days,
        difficulty=t.difficulty,
        is_featured=t.is_featured,
        is_free=t.is_free,
        icon_name=t.icon_name,
        color_theme=t.color_theme,
        gita_verse_ref=sacred["verse_ref"] if sacred else None,
        gita_verse_text=sacred["verse_sanskrit"] if sacred else None,
        modern_context=sacred["modern_context"] if sacred else None,
        transformation_promise=sacred["transformation_promise"] if sacred else None,
    )


# Module-level singleton so we don't rebuild the examples list per request.
_modern_examples_singleton: ModernExamplesDB | None = None


def _modern_examples() -> ModernExamplesDB:
    global _modern_examples_singleton
    if _modern_examples_singleton is None:
        _modern_examples_singleton = ModernExamplesDB()
    return _modern_examples_singleton


def _pick_modern_example(
    enemy_tag: str | None, day_index: int
) -> ModernExampleOut | None:
    """Deterministically pick a modern example for (enemy, day)."""
    if not enemy_tag:
        return None
    try:
        examples = _modern_examples().get_examples(enemy_tag.lower())
    except Exception:  # pragma: no cover — defensive
        return None
    if not examples:
        return None
    ex = examples[max(0, day_index - 1) % len(examples)]
    return ModernExampleOut(
        category=ex.category,
        scenario=ex.scenario,
        how_enemy_manifests=ex.how_enemy_manifests,
        gita_verse_ref=ex.gita_verse_ref,
        gita_wisdom=ex.gita_wisdom,
        practical_antidote=ex.practical_antidote,
        reflection_question=ex.reflection_question,
    )


def _build_sakha_response(
    enemy_tag: str | None,
    *,
    day_completed: int,
    total_days: int,
    journey_complete: bool,
    has_reflection: bool,
) -> tuple[str, int]:
    """Synthesise a deterministic Sakha wisdom response + mastery delta.

    This is intentionally NOT an LLM call. It composes a templated response
    from the canonical enemy verse so the day-page Sakha card always has
    something meaningful to show, even with no AI provider configured. The
    return contract (string + int) is shaped so a future KIAAN integration
    can be slotted in without changing the endpoint or the client.
    """
    sacred = _sacred_for_enemy(enemy_tag) if enemy_tag else None
    sanskrit_name = (enemy_tag or "the inner enemy").capitalize()

    # Mastery delta: each completed day moves the user roughly one slice
    # closer to mastery. Floor at 1 so even very long journeys reward today.
    mastery_delta = max(1, round(100 / max(1, total_days)))

    if journey_complete:
        if sacred:
            body = (
                f"You have walked the full path against {sanskrit_name}. "
                f"The Gita reminds: \"{sacred['verse_translation']}\" — "
                f"carry this victory quietly. The war within is never fully "
                f"won, but today you have proven the enemy is not stronger "
                f"than you. Return when the next battle calls."
            )
        else:
            body = (
                f"You have completed your journey. Carry today's stillness "
                f"into your day. The Gita teaches: even a little of this "
                f"practice saves you from great fear."
            )
        return body, mastery_delta

    opening = (
        "The reflection you offered has been received."
        if has_reflection
        else "Even silent practice is heard."
    )

    if sacred:
        body = (
            f"{opening} You have taken Day {day_completed} on the path "
            f"against {sanskrit_name}. The Gita reminds: "
            f"\"{sacred['verse_translation']}\" Carry this stillness into "
            f"your day. Return tomorrow for the next teaching."
        )
    else:
        body = (
            f"{opening} You have taken Day {day_completed} of your journey. "
            f"Every moment of awareness is progress. The Gita teaches: even "
            f"a little of this practice saves you from great fear. Return "
            f"tomorrow to continue."
        )

    return body, mastery_delta


def _step_to_response(
    step: Any, *, enemy_tag: str | None = None
) -> StepResponse:
    """Project a domain step into a StepResponse with sacred flattening.

    Args:
        step: Domain step object from JourneyEngineService.
        enemy_tag: Optional explicit enemy tag (used by dashboard where the
            step's parent journey's primary enemy is already known). If not
            provided we fall back to the sacred defaults keyed by the verse
            chapter — safe because every step always has at least one verse.
    """
    verses = [
        VerseContent(
            chapter=v["chapter"],
            verse=v["verse"],
            sanskrit=v.get("sanskrit"),
            hindi=v.get("hindi"),
            english=v["english"],
            transliteration=v.get("transliteration"),
            theme=v.get("theme"),
        )
        for v in step.verses
    ]

    first_verse = verses[0] if verses else None
    sacred = _sacred_for_enemy(enemy_tag)

    # Prefer live verse content from the step; fall back to the canonical
    # enemy verse so the UI never shows an empty block.
    verse_ref: dict[str, int] | None = None
    verse_sanskrit: str | None = None
    verse_translit: str | None = None
    verse_translation: str | None = None

    if first_verse is not None:
        verse_ref = {"chapter": first_verse.chapter, "verse": first_verse.verse}
        verse_sanskrit = first_verse.sanskrit
        verse_translit = first_verse.transliteration
        verse_translation = first_verse.english

    if sacred is not None:
        verse_ref = verse_ref or sacred["verse_ref"]
        verse_sanskrit = verse_sanskrit or sacred["verse_sanskrit"]
        verse_translit = verse_translit or sacred["verse_transliteration"]
        verse_translation = verse_translation or sacred["verse_translation"]

    reflection_prompt = (
        step.guided_reflection[0] if step.guided_reflection else None
    )

    return StepResponse(
        step_id=step.step_id,
        journey_id=step.journey_id,
        day_index=step.day_index,
        step_title=step.step_title,
        teaching=step.teaching,
        guided_reflection=step.guided_reflection,
        practice=step.practice,
        verse_refs=step.verse_refs,
        verses=verses,
        micro_commitment=step.micro_commitment,
        check_in_prompt=step.check_in_prompt,
        safety_note=step.safety_note,
        is_completed=step.is_completed,
        completed_at=step.completed_at.isoformat() if step.completed_at else None,
        available_to_complete=step.available_to_complete,
        next_available_at=step.next_available_at.isoformat() if step.next_available_at else None,
        verse_ref=verse_ref,
        verse_sanskrit=verse_sanskrit,
        verse_transliteration=verse_translit,
        verse_translation=verse_translation,
        reflection_prompt=reflection_prompt,
        modern_example=_pick_modern_example(enemy_tag, step.day_index),
    )


# =============================================================================
# TEMPLATE ENDPOINTS
# =============================================================================


@router.get("/templates", response_model=TemplateListResponse)
async def list_templates(
    enemy: str | None = Query(None, description="Filter by enemy tag"),
    difficulty_max: int | None = Query(None, ge=1, le=5, description="Max difficulty"),
    free_only: bool = Query(False, description="Only free templates"),
    featured_only: bool = Query(False, description="Only featured templates"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    offset: int = Query(0, ge=0, description="Offset"),
    service: JourneyEngineService = Depends(get_journey_service),
):
    """
    List available journey templates.

    Templates can be filtered by enemy type, difficulty, and pricing.
    """
    templates, total = await service.list_templates(
        enemy_filter=enemy,
        difficulty_max=difficulty_max,
        free_only=free_only,
        featured_only=featured_only,
        limit=limit,
        offset=offset,
    )

    return TemplateListResponse(
        templates=[_template_to_response(t) for t in templates],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/templates/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
):
    """Get a specific template by ID."""
    try:
        template = await service.get_template(template_id)
        return _template_to_response(template)
    except TemplateNotFoundError as e:
        logger.warning(f"Template not found: {e}")
        raise HTTPException(status_code=404, detail={"error": "TEMPLATE_NOT_FOUND", "message": "Journey template not found."})


@router.get("/templates/slug/{slug}", response_model=TemplateResponse)
async def get_template_by_slug(
    slug: str,
    service: JourneyEngineService = Depends(get_journey_service),
):
    """Get a template by its slug."""
    try:
        template = await service.get_template_by_slug(slug)
        return _template_to_response(template)
    except TemplateNotFoundError as e:
        logger.warning(f"Template not found by slug: {e}")
        raise HTTPException(status_code=404, detail={"error": "TEMPLATE_NOT_FOUND", "message": "Journey template not found."})


# =============================================================================
# JOURNEY ENDPOINTS
# =============================================================================


@router.get("/journeys", response_model=JourneyListResponse)
async def list_journeys(
    status_filter: str | None = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    offset: int = Query(0, ge=0, description="Offset"),
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """
    List user's journeys.

    Returns all journeys for the authenticated user, optionally filtered by status.
    """
    user_id = current_user

    stats, total = await service.list_user_journeys(
        user_id=user_id,
        status_filter=status_filter,
        limit=limit,
        offset=offset,
    )

    return JourneyListResponse(
        journeys=[
            JourneyResponse(
                journey_id=s.journey_id,
                template_slug=s.template_slug,
                title=s.title,
                status=s.status,
                current_day=s.current_day,
                total_days=s.total_days,
                progress_percentage=s.progress_percentage,
                days_completed=s.days_completed,
                started_at=s.started_at.isoformat() if s.started_at else None,
                last_activity=s.last_activity.isoformat() if s.last_activity else None,
                primary_enemies=s.primary_enemies,
                streak_days=s.streak_days,
            )
            for s in stats
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/journeys", response_model=JourneyResponse, status_code=status.HTTP_201_CREATED)
async def start_journey(
    request: StartJourneyRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new journey.

    Users can have up to 5 active journeys simultaneously. If the same
    Idempotency-Key is replayed within 60 seconds for the same user and
    template, the original JourneyResponse is returned without creating a
    duplicate — this protects against mobile double-taps and proxy retries.
    """
    user_id = current_user

    # Short-circuit on replay
    if idempotency_key:
        cached = _idempotency_lookup(user_id, request.template_id, idempotency_key)
        if cached is not None:
            return cached

    try:
        personalization = None
        if request.personalization:
            personalization = request.personalization.model_dump()

        journey = await service.start_journey(
            user_id=user_id,
            template_id=request.template_id,
            personalization=personalization,
        )

        await db.commit()

        # Get stats for response
        stats = await service.get_journey(user_id, journey.id)

        response = JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )

        if idempotency_key:
            _idempotency_store(user_id, request.template_id, idempotency_key, response)

        return response

    except MaxActiveJourneysError as e:
        raise HTTPException(status_code=400, detail={"error": "MAX_ACTIVE_JOURNEYS", "message": str(e)})
    except TemplateNotFoundError as e:
        logger.warning(f"Template not found when starting journey: {e}")
        raise HTTPException(status_code=404, detail={"error": "TEMPLATE_NOT_FOUND", "message": "Journey template not found."})
    except Exception as e:
        logger.error(f"Error starting journey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "INTERNAL_ERROR", "message": "An internal error occurred. Please try again."})


@router.get("/journeys/{journey_id}", response_model=JourneyResponse)
async def get_journey(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """Get detailed information about a specific journey."""
    user_id = current_user

    try:
        stats = await service.get_journey(user_id, journey_id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )
    except JourneyNotFoundError as e:
        logger.warning(f"Journey not found: {e}")
        raise HTTPException(status_code=404, detail={"error": "JOURNEY_NOT_FOUND", "message": "Journey not found."})


@router.post("/journeys/{journey_id}/pause", response_model=JourneyResponse)
async def pause_journey(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pause an active journey."""
    user_id = current_user

    try:
        await service.pause_journey(user_id, journey_id)
        await db.commit()

        stats = await service.get_journey(user_id, journey_id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )
    except JourneyNotFoundError as e:
        logger.warning(f"Journey not found for pause: {e}")
        raise HTTPException(status_code=404, detail={"error": "JOURNEY_NOT_FOUND", "message": "Journey not found."})
    except JourneyEngineError as e:
        logger.warning(f"Cannot pause journey: {e}")
        raise HTTPException(status_code=400, detail={"error": "JOURNEY_ERROR", "message": "Cannot pause this journey."})


@router.post("/journeys/{journey_id}/resume", response_model=JourneyResponse)
async def resume_journey(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resume a paused journey."""
    user_id = current_user

    try:
        await service.resume_journey(user_id, journey_id)
        await db.commit()

        stats = await service.get_journey(user_id, journey_id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )
    except JourneyNotFoundError as e:
        logger.warning(f"Journey not found for resume: {e}")
        raise HTTPException(status_code=404, detail={"error": "JOURNEY_NOT_FOUND", "message": "Journey not found."})
    except JourneyEngineError as e:
        logger.warning(f"Cannot resume journey: {e}")
        raise HTTPException(status_code=400, detail={"error": "JOURNEY_RESUME_ERROR", "message": "Cannot resume this journey."})


@router.delete("/journeys/{journey_id}", response_model=JourneyResponse)
async def abandon_journey(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Abandon a journey (mark as abandoned, not deleted)."""
    user_id = current_user

    try:
        await service.abandon_journey(user_id, journey_id)
        await db.commit()

        stats = await service.get_journey(user_id, journey_id)

        return JourneyResponse(
            journey_id=stats.journey_id,
            template_slug=stats.template_slug,
            title=stats.title,
            status=stats.status,
            current_day=stats.current_day,
            total_days=stats.total_days,
            progress_percentage=stats.progress_percentage,
            days_completed=stats.days_completed,
            started_at=stats.started_at.isoformat() if stats.started_at else None,
            last_activity=stats.last_activity.isoformat() if stats.last_activity else None,
            primary_enemies=stats.primary_enemies,
            streak_days=stats.streak_days,
        )
    except JourneyNotFoundError as e:
        logger.warning(f"Journey not found for abandon: {e}")
        raise HTTPException(status_code=404, detail={"error": "JOURNEY_NOT_FOUND", "message": "Journey not found."})
    except JourneyAlreadyCompletedError as e:
        logger.warning(f"Cannot abandon completed journey: {e}")
        raise HTTPException(status_code=400, detail={"error": "JOURNEY_ALREADY_COMPLETED", "message": "This journey has already been completed."})


# =============================================================================
# STEP ENDPOINTS
# =============================================================================


@router.get("/journeys/{journey_id}/steps/current", response_model=StepResponse | None)
async def get_current_step(
    journey_id: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """
    Get the current step for a journey.

    Returns null if journey is paused or completed.
    """
    user_id = current_user

    try:
        step = await service.get_current_step(user_id, journey_id)

        if step is None:
            return None

        # Look up the journey's primary enemy so the step response can surface
        # the right modern example + sacred fallbacks. Failure is non-fatal.
        enemy_tag: str | None = None
        try:
            stats = await service.get_journey(user_id, journey_id)
            enemy_tag = stats.primary_enemies[0] if stats.primary_enemies else None
        except Exception:  # pragma: no cover — defensive
            pass

        return _step_to_response(step, enemy_tag=enemy_tag)
    except JourneyNotFoundError as e:
        logger.warning(f"Journey not found for current step: {e}")
        raise HTTPException(status_code=404, detail={"error": "JOURNEY_NOT_FOUND", "message": "Journey not found."})


@router.get("/journeys/{journey_id}/steps/{day_index}", response_model=StepResponse)
async def get_step(
    journey_id: str,
    day_index: int,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """Get a specific step by day index."""
    user_id = current_user

    try:
        step = await service.get_step(user_id, journey_id, day_index)

        enemy_tag: str | None = None
        try:
            stats = await service.get_journey(user_id, journey_id)
            enemy_tag = stats.primary_enemies[0] if stats.primary_enemies else None
        except Exception:  # pragma: no cover
            pass

        return _step_to_response(step, enemy_tag=enemy_tag)
    except JourneyNotFoundError as e:
        logger.warning(f"Journey not found for step: {e}")
        raise HTTPException(status_code=404, detail={"error": "JOURNEY_NOT_FOUND", "message": "Journey not found."})
    except StepNotAvailableError as e:
        logger.warning(f"Step not available: {e}")
        raise HTTPException(status_code=400, detail={"error": "STEP_NOT_AVAILABLE", "message": "This step is not available."})


@router.post("/journeys/{journey_id}/steps/{day_index}/complete", response_model=CompletionResponse)
async def complete_step(
    journey_id: str,
    day_index: int,
    request: CompleteStepRequest,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Complete a journey step.

    Marks the step as complete and optionally saves the user's reflection.
    """
    user_id = current_user

    try:
        result = await service.complete_step(
            user_id=user_id,
            journey_id=journey_id,
            day_index=day_index,
            reflection=request.reflection,
            check_in=request.check_in,
        )

        await db.commit()

        # Dispatch milestone notification if journey is now complete
        if result["journey_complete"]:
            await dispatch_notification(
                db=db,
                user_id=user_id,
                notification_type="milestone",
                title="Journey Complete! 🎉",
                body="You've completed your journey. Your karma tree grows stronger with your dedication.",
                data={
                    "type": "milestone",
                    "journeyId": journey_id,
                    "milestoneType": "journey_complete",
                },
            )

        # Sakha wisdom: by default we synthesise a deterministic templated
        # response from the canonical enemy verse. When ENABLE_AI_SAKHA_RESPONSE
        # is on, we first try a wisdom-grounded LLM response that draws
        # exclusively from the Wisdom Core (701-verse GitaWisdomCore +
        # ModernExamplesDB). The contract returned to clients is identical
        # in both modes, so flipping the flag never breaks Android / web.
        # The failure path is non-fatal at every layer — any exception or
        # AI refusal silently falls through to the deterministic body.
        ai_response = ""
        mastery_delta = 0
        try:
            stats = await service.get_journey(user_id, journey_id)
            enemy_tag = stats.primary_enemies[0] if stats.primary_enemies else None
            sacred = _sacred_for_enemy(enemy_tag) if enemy_tag else None

            ai_result: tuple[str, int] | None = None
            if _settings.ENABLE_AI_SAKHA_RESPONSE:
                from backend.services.journey_engine.sakha_wisdom_generator import (
                    SakhaContext,
                    generate_ai_sakha,
                )

                ai_result = await generate_ai_sakha(
                    SakhaContext(
                        enemy_tag=enemy_tag,
                        day_completed=result["day_completed"],
                        total_days=stats.total_days or 1,
                        journey_complete=result["journey_complete"],
                        has_reflection=bool(
                            request.reflection and request.reflection.strip()
                        ),
                        reflection_text=(request.reflection or None),
                    ),
                    sacred=sacred,
                    settings=_settings,
                )

            if ai_result is not None:
                ai_response, mastery_delta = ai_result
            else:
                ai_response, mastery_delta = _build_sakha_response(
                    enemy_tag,
                    day_completed=result["day_completed"],
                    total_days=stats.total_days or 1,
                    journey_complete=result["journey_complete"],
                    has_reflection=bool(request.reflection and request.reflection.strip()),
                )
        except Exception:  # pragma: no cover — defensive
            logger.exception(
                "[complete_step] failed to build sakha response for journey %s",
                journey_id,
            )

        return CompletionResponse(
            success=result["success"],
            day_completed=result["day_completed"],
            journey_complete=result["journey_complete"],
            next_day=result["next_day"],
            progress_percentage=result["progress_percentage"],
            ai_response=ai_response,
            mastery_delta=mastery_delta,
        )
    except JourneyNotFoundError as e:
        logger.warning(f"Journey not found for step completion: {e}")
        raise HTTPException(status_code=404, detail={"error": "JOURNEY_NOT_FOUND", "message": "Journey not found."})
    except StepTimeGatedError as e:
        logger.info(f"Step time-gated for journey {journey_id}: next available {e.next_available_at}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "STEP_TIME_GATED",
                "message": "Come back tomorrow to continue your journey.",
                "next_available_at": e.next_available_at.isoformat() if e.next_available_at else None,
            },
        )
    except StepNotAvailableError as e:
        logger.warning(f"Step not available for completion: {e}")
        raise HTTPException(status_code=400, detail={"error": "STEP_NOT_AVAILABLE", "message": "This step is not available."})
    except JourneyEngineError as e:
        logger.warning(f"Journey engine error during step completion: {e}")
        raise HTTPException(status_code=400, detail={"error": "JOURNEY_ERROR", "message": "Unable to complete this step."})


# =============================================================================
# DASHBOARD ENDPOINTS
# =============================================================================


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """
    Get user's journey dashboard.

    Includes active journeys, enemy progress, recommendations, and today's steps.
    """
    user_id = current_user

    try:
        dashboard = await service.get_dashboard(user_id)
    except Exception as e:
        # CATASTROPHIC fallback. ``service.get_dashboard`` now wraps every
        # optional component in its own try/except, so reaching this block
        # means the core active-journey query itself failed (DB outage,
        # migration skew, etc.). Previously this handler returned an
        # all-zeros DashboardResponse, which masked a MissingGreenlet in
        # _get_enemy_progress and made every started journey invisible.
        # We still return 200 (shell keeps rendering) BUT we do an
        # emergency direct query for the active journeys so the user can
        # see and continue the work they already started.
        logger.error(
            f"[dashboard] core failure user={user_id}: {e}", exc_info=True
        )

        from backend.models import UserJourney, UserJourneyStatus
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        emergency_journeys: list[JourneyResponse] = []
        emergency_active_count = 0
        try:
            emergency_stmt = (
                select(UserJourney)
                .options(selectinload(UserJourney.template))
                .where(
                    UserJourney.user_id == user_id,
                    UserJourney.status == UserJourneyStatus.ACTIVE.value,
                    UserJourney.deleted_at.is_(None),
                )
                .order_by(UserJourney.created_at.desc())
                .limit(5)
            )
            emergency_result = await service.db.execute(emergency_stmt)
            for row in emergency_result.scalars().all():
                emergency_active_count += 1
                template = row.template
                emergency_journeys.append(
                    JourneyResponse(
                        journey_id=row.id,
                        template_slug=template.slug if template else "unknown",
                        title=template.title if template else "Your Journey",
                        status=row.status,
                        current_day=row.current_day_index,
                        total_days=template.duration_days if template else 14,
                        progress_percentage=0.0,
                        days_completed=0,
                        started_at=(
                            row.started_at.isoformat() if row.started_at
                            else (row.created_at.isoformat() if row.created_at else None)
                        ),
                        last_activity=None,
                        primary_enemies=(
                            template.primary_enemy_tags if template else []
                        ),
                        streak_days=0,
                    )
                )
        except Exception as emerg_e:  # noqa: BLE001
            logger.error(
                f"[dashboard] emergency recovery also failed "
                f"user={user_id}: {emerg_e}",
                exc_info=True,
            )

        return DashboardResponse(
            active_journeys=emergency_journeys,
            completed_journeys=0,
            total_days_practiced=0,
            current_streak=0,
            enemy_progress=[],
            recommended_templates=[],
            today_steps=[],
            active_count=emergency_active_count,
            max_active=5,
        )

    # Map journey_id -> primary enemy tag so today_steps can surface the
    # right sacred fallbacks and modern example without a second DB hit.
    _journey_enemy_map: dict[str, str | None] = {
        j.journey_id: (j.primary_enemies[0] if j.primary_enemies else None)
        for j in dashboard.active_journeys
    }

    return DashboardResponse(
        active_journeys=[
            JourneyResponse(
                journey_id=j.journey_id,
                template_slug=j.template_slug,
                title=j.title,
                status=j.status,
                current_day=j.current_day,
                total_days=j.total_days,
                progress_percentage=j.progress_percentage,
                days_completed=j.days_completed,
                started_at=j.started_at.isoformat() if j.started_at else None,
                last_activity=j.last_activity.isoformat() if j.last_activity else None,
                primary_enemies=j.primary_enemies,
                streak_days=j.streak_days,
            )
            for j in dashboard.active_journeys
        ],
        completed_journeys=dashboard.completed_journeys,
        total_days_practiced=dashboard.total_days_practiced,
        current_streak=dashboard.current_streak,
        enemy_progress=[
            EnemyProgressResponse(
                enemy=ep.enemy,
                enemy_label=ep.enemy_label,
                journeys_started=ep.journeys_started,
                journeys_completed=ep.journeys_completed,
                total_days_practiced=ep.total_days_practiced,
                current_streak=ep.current_streak,
                best_streak=ep.best_streak,
                last_practice=ep.last_practice.isoformat() if ep.last_practice else None,
                mastery_level=ep.mastery_level,
                active_journey_progress_pct=ep.active_journey_progress_pct,
                active_journey_id=ep.active_journey_id,
                active_journey_day=ep.active_journey_day,
                active_journey_total_days=ep.active_journey_total_days,
            )
            for ep in dashboard.enemy_progress
        ],
        recommended_templates=dashboard.recommended_templates,
        today_steps=[
            _step_to_response(
                s,
                enemy_tag=_journey_enemy_map.get(s.journey_id),
            )
            for s in dashboard.today_steps
        ],
        active_count=dashboard.active_count,
        max_active=dashboard.max_active,
    )


@router.get("/debug/my-journeys")
async def debug_my_journeys(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Debug endpoint - disabled in production to prevent data exposure."""
    import os
    from fastapi import HTTPException as _HTTPException
    if os.getenv("ENVIRONMENT", "development").lower() in ("production", "prod"):
        raise _HTTPException(status_code=404, detail="Not found")

    from sqlalchemy import text

    user_id = current_user
    active_count_result = await db.execute(
        text("""
            SELECT COUNT(*) FROM user_journeys
            WHERE user_id = :user_id
            AND status = 'active'
            AND (deleted_at IS NULL OR deleted_at > NOW())
        """),
        {"user_id": user_id}
    )
    active_count = active_count_result.scalar() or 0
    return {"user_id": user_id, "active_count": active_count}


@router.delete("/debug/clear-all-journeys")
async def debug_clear_all_journeys(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Debug endpoint - disabled in production to prevent mass deletion."""
    import os
    from fastapi import HTTPException as _HTTPException
    if os.getenv("ENVIRONMENT", "development").lower() in ("production", "prod"):
        raise _HTTPException(status_code=404, detail="Not found")

    from sqlalchemy import text

    user_id = current_user
    result = await db.execute(
        text("""
            UPDATE user_journeys
            SET deleted_at = NOW(), status = 'abandoned'
            WHERE user_id = :user_id AND deleted_at IS NULL
        """),
        {"user_id": user_id}
    )
    await db.commit()
    return {"message": "All journeys cleared", "journeys_cleared": result.rowcount}


@router.post("/fix-stuck-journeys")
async def fix_stuck_journeys(
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fix stuck journey state by clearing all orphaned and problematic journeys.

    Call this endpoint if you see "You have X active journeys" error but
    the dashboard shows 0 active journeys.
    """
    user_id = current_user

    try:
        # First try to clean orphaned journeys
        orphaned_count = await service.cleanup_orphaned_journeys(user_id)

        # If still stuck, force clear all journeys
        remaining_count = await service._count_active_journeys(user_id)

        if remaining_count >= service.MAX_ACTIVE_JOURNEYS:
            # Force clear all - user requested fix
            cleared_count = await service.force_clear_all_journeys(user_id)
            await db.commit()

            return {
                "message": "All journeys cleared to fix stuck state",
                "orphaned_cleaned": orphaned_count,
                "force_cleared": cleared_count,
                "status": "fixed",
            }

        await db.commit()

        return {
            "message": "Orphaned journeys cleaned",
            "orphaned_cleaned": orphaned_count,
            "remaining_active": remaining_count,
            "status": "cleaned",
        }

    except Exception as e:
        logger.error(f"Error fixing stuck journeys for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fix stuck journeys")


# =============================================================================
# ENEMY ENDPOINTS
# =============================================================================


@router.get("/enemies", response_model=list[EnemyInfo])
async def list_enemies():
    """
    List all six inner enemies with their information.

    Returns details about each Shadripu including Sanskrit name,
    description, key verse, themes, and modern contexts.
    """
    enemies = []
    for enemy_type in EnemyType:
        meta = ENEMY_METADATA[enemy_type]
        enemies.append(EnemyInfo(
            enemy=enemy_type.value,
            sanskrit=meta["sanskrit"],
            english=meta["english"],
            description=meta["description"],
            label=ENEMY_LABELS.get(enemy_type.value, enemy_type.value),
            key_verse=meta["key_verse"],
            themes=meta["themes"],
            antidotes=meta["antidotes"],
            modern_contexts=meta["modern_contexts"],
        ))
    return enemies


@router.get("/enemies/{enemy}", response_model=EnemyProgressResponse | None)
async def get_enemy_progress(
    enemy: str,
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
):
    """Get user's progress against a specific inner enemy."""
    user_id = current_user

    # Validate enemy
    enemy_lower = enemy.lower()
    if enemy_lower not in ENEMY_LABELS:
        raise HTTPException(status_code=400, detail=f"Invalid enemy: {enemy}")

    tracker = EnemyProgressTracker(service.db)
    progress = await tracker.get_enemy_details(user_id, enemy_lower)

    if progress is None:
        return None

    return EnemyProgressResponse(
        enemy=progress.enemy,
        enemy_label=progress.enemy_label,
        journeys_started=progress.journeys_started,
        journeys_completed=progress.journeys_completed,
        total_days_practiced=progress.total_days_practiced,
        current_streak=progress.current_streak,
        best_streak=progress.best_streak,
        last_practice=progress.last_practice.isoformat() if progress.last_practice else None,
        mastery_level=progress.mastery_level,
    )


@router.get("/enemies/{enemy}/radar")
async def get_enemy_radar(
    service: JourneyEngineService = Depends(get_journey_service),
    current_user: str = Depends(get_current_user),
) -> dict[str, int]:
    """
    Get radar chart data for enemy mastery visualization.

    Returns mastery levels (0-100) for all six enemies.
    """
    user_id = current_user
    tracker = EnemyProgressTracker(service.db)
    return await tracker.get_radar_data(user_id)


# =============================================================================
# EXAMPLES ENDPOINTS
# =============================================================================


@router.get("/examples/{enemy}", response_model=ExampleListResponse)
async def get_examples(
    enemy: str,
    category: str | None = Query(None, description="Filter by category"),
    limit: int = Query(10, ge=1, le=50, description="Max examples"),
    examples_db: ModernExamplesDB = Depends(get_examples_db),
):
    """
    Get modern examples for a specific enemy.

    Examples connect the Six Enemies to everyday situations with
    relevant Gita wisdom and practical antidotes.
    """
    enemy_lower = enemy.lower()
    if enemy_lower not in ENEMY_LABELS:
        raise HTTPException(status_code=400, detail=f"Invalid enemy: {enemy}")

    examples = examples_db.get_examples(
        enemy=enemy_lower,
        category=category,
        limit=limit,
    )

    return ExampleListResponse(
        examples=[
            ExampleResponse(
                enemy=ex.enemy,
                category=ex.category,
                scenario=ex.scenario,
                how_enemy_manifests=ex.how_enemy_manifests,
                gita_verse_ref=ex.gita_verse_ref,
                gita_wisdom=ex.gita_wisdom,
                practical_antidote=ex.practical_antidote,
                reflection_question=ex.reflection_question,
            )
            for ex in examples
        ],
        total=len(examples),
        enemy=enemy_lower,
    )


@router.get("/examples/{enemy}/random", response_model=ExampleResponse | None)
async def get_random_example(
    enemy: str,
    examples_db: ModernExamplesDB = Depends(get_examples_db),
):
    """Get a random example for the given enemy."""
    enemy_lower = enemy.lower()
    if enemy_lower not in ENEMY_LABELS:
        raise HTTPException(status_code=400, detail=f"Invalid enemy: {enemy}")

    example = examples_db.get_random_example(enemy_lower)

    if example is None:
        return None

    return ExampleResponse(
        enemy=example.enemy,
        category=example.category,
        scenario=example.scenario,
        how_enemy_manifests=example.how_enemy_manifests,
        gita_verse_ref=example.gita_verse_ref,
        gita_wisdom=example.gita_wisdom,
        practical_antidote=example.practical_antidote,
        reflection_question=example.reflection_question,
    )
