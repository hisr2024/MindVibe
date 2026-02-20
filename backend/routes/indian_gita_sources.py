"""Indian Gita Sources API Routes

Provides RESTful endpoints for authentic Bhagavad Gita teachings, yoga paths,
meditation techniques, and spiritual wellness applications rooted in Gita philosophy.

Endpoints:
- GET /api/gita-sources/teachings - Search Gita teachings
- GET /api/gita-sources/yoga-paths - Get yoga paths from Gita
- GET /api/gita-sources/meditation - Get Gita-based meditation techniques
- GET /api/gita-sources/sthitaprajna - Get qualities of steady wisdom (2.54-72)
- GET /api/gita-sources/karma-yoga - Get Karma Yoga principles
- GET /api/gita-sources/wisdom/{mood} - Get quick wisdom for mood
- POST /api/gita-sources/practice - Get practice recommendation for issue
- POST /api/gita-sources/kiaan-wisdom - Get wisdom formatted for KIAAN
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any

from backend.services.indian_data_sources import (
    indian_gita_sources,
    GitaMentalHealthTheme,
    GitaYogaPath,
)

router = APIRouter(prefix="/api/gita-sources", tags=["gita-sources"])


# ==================== REQUEST/RESPONSE SCHEMAS ====================


class TeachingResponse(BaseModel):
    """Response model for a Gita teaching."""

    id: str
    title: str
    teaching: str
    verse_reference: str | None = None
    sanskrit_verse: str | None = None
    hindi_translation: str | None = None
    practical_application: str | None = None
    mental_health_benefit: str | None = None
    yoga_path: str | None = None
    theme: str
    keywords: list[str] = Field(default_factory=list)


class YogaPathResponse(BaseModel):
    """Response model for a yoga path from Gita."""

    id: str
    yoga_path: str
    sanskrit_name: str
    english_name: str
    gita_reference: str
    description: str
    instructions: list[str] = Field(default_factory=list)
    mental_benefits: list[str] = Field(default_factory=list)
    related_verses: list[str] = Field(default_factory=list)
    duration_minutes: int


class MeditationResponse(BaseModel):
    """Response model for Gita meditation technique."""

    id: str
    sanskrit_name: str
    english_name: str
    gita_reference: str
    description: str
    instructions: list[str] = Field(default_factory=list)
    mental_benefits: list[str] = Field(default_factory=list)
    verse_guidance: str | None = None
    duration_minutes: int


class SthitaprajnaResponse(BaseModel):
    """Response model for Sthitaprajna quality (steady wisdom)."""

    id: str
    quality: str
    sanskrit_term: str
    verse_reference: str
    description: str
    mental_health_application: str
    practical_steps: list[str] = Field(default_factory=list)


class KarmaYogaPrincipleResponse(BaseModel):
    """Response model for Karma Yoga principle."""

    id: str
    principle: str
    meaning: str
    verse: str
    application: str
    mental_health_benefit: str


class QuickWisdomResponse(BaseModel):
    """Response model for quick Gita wisdom based on mood."""

    verse: str
    sanskrit: str
    meaning: str
    practice: str
    affirmation: str


class PracticeRequest(BaseModel):
    """Request model for practice recommendation."""

    issue: str = Field(..., min_length=2, max_length=500, description="Spiritual wellness issue")


class PracticeResponse(BaseModel):
    """Response model for practice recommendation."""

    key_verse: str
    immediate_practice: str
    teaching_title: str | None = None
    meditation_name: str | None = None
    yoga_path_name: str | None = None
    sthitaprajna_quality: str | None = None


class KiaanWisdomRequest(BaseModel):
    """Request model for KIAAN wisdom integration."""

    query: str = Field(..., min_length=2, max_length=1000, description="User query")
    context: str = Field(default="general", description="KIAAN context type")
    limit: int = Field(default=3, ge=1, le=10, description="Maximum results per category")


class KiaanWisdomResponse(BaseModel):
    """Response model for KIAAN wisdom integration."""

    teachings: list[dict] = Field(default_factory=list)
    recommended_practice: dict | None = None
    sthitaprajna_quality: dict | None = None
    karma_yoga_principle: dict | None = None
    context: str


# ==================== ENDPOINTS ====================


@router.get("/teachings", response_model=list[TeachingResponse])
async def get_teachings(
    query: str = Query(default="", description="Search query"),
    theme: str | None = Query(default=None, description="Spiritual wellness theme filter"),
    yoga_path: str | None = Query(default=None, description="Yoga path filter"),
    limit: int = Query(default=5, ge=1, le=20, description="Maximum results"),
) -> list[dict[str, Any]]:
    """
    Search Bhagavad Gita teachings for spiritual wellness.

    Returns teachings from authentic sources (Gita Press, Swami Sivananda, etc.)
    with practical spiritual wellness applications.
    """
    # Parse theme enum if provided
    theme_enum = None
    if theme:
        try:
            theme_enum = GitaMentalHealthTheme(theme)
        except ValueError:
            pass  # Invalid theme, ignore filter

    # Parse yoga path enum if provided
    yoga_path_enum = None
    if yoga_path:
        try:
            yoga_path_enum = GitaYogaPath(yoga_path)
        except ValueError:
            pass  # Invalid yoga path, ignore filter

    teachings = await indian_gita_sources.search_teachings(
        query=query or "peace",  # Default to peace if no query
        theme=theme_enum,
        yoga_path=yoga_path_enum,
        limit=limit,
    )

    return [
        {
            "id": t.id,
            "title": t.title,
            "teaching": t.teaching,
            "verse_reference": t.verse_reference,
            "sanskrit_verse": t.sanskrit_verse,
            "hindi_translation": t.hindi_translation,
            "practical_application": t.practical_application,
            "mental_health_benefit": t.mental_health_benefit,
            "yoga_path": t.yoga_path.value if t.yoga_path else None,
            "theme": t.theme.value,
            "keywords": t.keywords,
        }
        for t in teachings
    ]


@router.get("/yoga-paths", response_model=list[YogaPathResponse])
async def get_yoga_paths() -> list[dict[str, Any]]:
    """
    Get the four yoga paths as taught in the Bhagavad Gita.

    Returns Karma Yoga (selfless action), Jnana Yoga (knowledge),
    Bhakti Yoga (devotion), and Dhyana Yoga (meditation) with
    practical instructions and spiritual wellness benefits.
    """
    practices = indian_gita_sources._yoga_practices

    return [
        {
            "id": p.id,
            "yoga_path": p.yoga_path.value,
            "sanskrit_name": p.sanskrit_name,
            "english_name": p.english_name,
            "gita_reference": p.gita_reference,
            "description": p.description,
            "instructions": p.instructions,
            "mental_benefits": p.mental_benefits,
            "related_verses": p.gita_verses_related,
            "duration_minutes": p.duration_minutes,
        }
        for p in practices
    ]


@router.get("/meditation", response_model=list[MeditationResponse])
async def get_meditation_techniques() -> list[dict[str, Any]]:
    """
    Get meditation techniques from Bhagavad Gita Chapter 6 (Dhyana Yoga).

    Returns authentic meditation practices with specific verse guidance
    from Krishna's instructions to Arjuna.
    """
    techniques = indian_gita_sources._meditation_techniques

    return [
        {
            "id": m.id,
            "sanskrit_name": m.sanskrit_name,
            "english_name": m.english_name,
            "gita_reference": m.gita_reference,
            "description": m.description,
            "instructions": m.instructions,
            "mental_benefits": m.mental_benefits,
            "verse_guidance": m.verse_guidance,
            "duration_minutes": m.duration_minutes,
        }
        for m in techniques
    ]


@router.get("/sthitaprajna", response_model=list[SthitaprajnaResponse])
async def get_sthitaprajna_qualities() -> list[dict[str, Any]]:
    """
    Get the qualities of the Sthitaprajna (person of steady wisdom).

    Based on Bhagavad Gita 2.54-72, these verses form the Gita's
    complete description of optimal spiritual wellness and emotional regulation.
    """
    qualities = indian_gita_sources._sthitaprajna_qualities

    return [
        {
            "id": q.id,
            "quality": q.quality,
            "sanskrit_term": q.sanskrit_term,
            "verse_reference": q.verse_reference,
            "description": q.description,
            "mental_health_application": q.mental_health_application,
            "practical_steps": q.practical_steps,
        }
        for q in qualities
    ]


@router.get("/karma-yoga", response_model=list[KarmaYogaPrincipleResponse])
async def get_karma_yoga_principles() -> list[dict[str, Any]]:
    """
    Get Karma Yoga principles for daily life.

    Returns practical principles from Karma Yoga (path of selfless action)
    with applications for reducing anxiety and finding peace in work.
    """
    principles = indian_gita_sources._karma_yoga_principles

    return [
        {
            "id": p["id"],
            "principle": p["principle"],
            "meaning": p["meaning"],
            "verse": p["verse"],
            "application": p["application"],
            "mental_health_benefit": p["mental_health_benefit"],
        }
        for p in principles
    ]


@router.get("/wisdom/{mood}", response_model=QuickWisdomResponse)
async def get_quick_wisdom(mood: str) -> dict[str, Any]:
    """
    Get quick Gita wisdom based on current mood/emotion.

    Provides instant wisdom with Sanskrit verse, meaning, practice,
    and affirmation tailored to the user's emotional state.

    Examples:
    - /wisdom/anxious - Returns wisdom for anxiety
    - /wisdom/sad - Returns wisdom for sadness
    - /wisdom/stressed - Returns wisdom for stress
    - /wisdom/angry - Returns wisdom for anger
    """
    wisdom = indian_gita_sources.get_quick_gita_wisdom(mood)
    return wisdom


@router.post("/practice", response_model=PracticeResponse)
async def get_practice_recommendation(request: PracticeRequest) -> dict[str, Any]:
    """
    Get Gita-based practice recommendation for a spiritual wellness issue.

    Analyzes the issue and returns a comprehensive recommendation including
    relevant teaching, meditation, yoga path, and immediate practice.
    """
    recommendation = await indian_gita_sources.get_practice_for_issue(request.issue)

    # Extract names safely
    teaching_title = None
    if recommendation.get("primary_teaching"):
        teachings = recommendation["primary_teaching"]
        if teachings and len(teachings) > 0:
            teaching_title = teachings[0].title

    meditation_name = None
    if recommendation.get("meditation"):
        meditation_name = recommendation["meditation"].english_name

    yoga_path_name = None
    if recommendation.get("yoga_path"):
        yoga_path_name = recommendation["yoga_path"].english_name

    sthitaprajna_quality = None
    if recommendation.get("sthitaprajna_quality"):
        sthitaprajna_quality = recommendation["sthitaprajna_quality"].quality

    return {
        "key_verse": recommendation.get("key_verse", ""),
        "immediate_practice": recommendation.get("immediate_practice", ""),
        "teaching_title": teaching_title,
        "meditation_name": meditation_name,
        "yoga_path_name": yoga_path_name,
        "sthitaprajna_quality": sthitaprajna_quality,
    }


@router.post("/kiaan-wisdom", response_model=KiaanWisdomResponse)
async def get_kiaan_wisdom(request: KiaanWisdomRequest) -> dict[str, Any]:
    """
    Get Gita wisdom formatted for KIAAN integration.

    This endpoint provides comprehensive Gita-based content to enhance
    KIAAN responses with authentic philosophical grounding.

    Used internally by KIAAN Core to enrich wisdom responses.
    """
    wisdom = await indian_gita_sources.get_wisdom_for_kiaan(
        query=request.query,
        context=request.context,
        limit=request.limit,
    )

    return wisdom


@router.get("/themes")
async def get_available_themes() -> dict[str, list[str]]:
    """
    Get list of available spiritual wellness themes from Gita teachings.
    """
    return {
        "themes": [theme.value for theme in GitaMentalHealthTheme],
        "yoga_paths": [path.value for path in GitaYogaPath],
    }


@router.get("/verse-wisdom/{chapter}/{verse}")
async def get_verse_wisdom(chapter: int, verse: int) -> dict[str, Any]:
    """
    Get wisdom teachings associated with a specific Gita verse.

    Returns any teachings that reference the specified verse with
    spiritual wellness applications.
    """
    verse_ref = f"{chapter}.{verse}"

    matching_teachings = []
    for teaching in indian_gita_sources._gita_teachings:
        if teaching.verse_reference and verse_ref in teaching.verse_reference:
            matching_teachings.append({
                "id": teaching.id,
                "title": teaching.title,
                "teaching": teaching.teaching[:500] + "..." if len(teaching.teaching) > 500 else teaching.teaching,
                "practical_application": teaching.practical_application,
                "mental_health_benefit": teaching.mental_health_benefit,
            })

    # Check yoga practices
    matching_practices = []
    for practice in indian_gita_sources._yoga_practices:
        if verse_ref in practice.gita_verses_related:
            matching_practices.append({
                "id": practice.id,
                "name": practice.english_name,
                "sanskrit": practice.sanskrit_name,
                "yoga_path": practice.yoga_path.value,
            })

    # Check Sthitaprajna qualities
    matching_qualities = []
    for quality in indian_gita_sources._sthitaprajna_qualities:
        if verse_ref in quality.verse_reference:
            matching_qualities.append({
                "id": quality.id,
                "quality": quality.quality,
                "sanskrit": quality.sanskrit_term,
                "application": quality.mental_health_application,
            })

    return {
        "verse_reference": verse_ref,
        "teachings": matching_teachings,
        "yoga_practices": matching_practices,
        "sthitaprajna_qualities": matching_qualities,
    }
