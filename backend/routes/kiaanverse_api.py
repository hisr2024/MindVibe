"""
Kiaanverse — Bhagavad Gita VR API Routes

REST endpoints for the immersive WebXR Gita experience:
- POST /api/kiaanverse/ask-krishna — Ask Krishna (KIAAN AI Sakha/Recital modes)
- GET  /api/kiaanverse/verse-teaching/{chapter}/{verse} — Get verse teaching
- GET  /api/kiaanverse/chapter-intro/{chapter} — Get chapter introduction

Uses the Krishna VR persona service which extends the core KIAAN wisdom engine.
Does NOT modify any KIAAN ecosystem responses — only adds VR persona layer.
"""

import logging
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.krishna_vr_persona import krishna_vr_persona

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaanverse", tags=["kiaanverse"])


class AskKrishnaRequest(BaseModel):
    """Request model for asking Krishna a question in Kiaanverse."""
    question: str = Field(..., min_length=1, max_length=1000, description="The seeker's question")
    chapter_context: int = Field(default=1, ge=1, le=18, description="Current chapter context (1-18)")
    language: str = Field(default="en", max_length=5, description="Response language code")
    mode: Literal["sakha", "recital"] = Field(default="sakha", description="Interaction mode: sakha or recital")


class GestureCueResponse(BaseModel):
    """Gesture animation cue for Krishna's 3D avatar."""
    type: str
    timestamp_ms: int
    duration_ms: int


class VerseReferenceResponse(BaseModel):
    """Referenced Gita verse data."""
    chapter: int
    verse: int
    sanskrit: str
    transliteration: str
    translation: str


class AskKrishnaResponse(BaseModel):
    """Krishna's wisdom response with VR animation data."""
    answer: str
    verse_reference: VerseReferenceResponse | None = None
    audio_url: str | None = None
    gestures: list[GestureCueResponse] = []
    emotion: str = "compassionate"


class VerseTeachingResponse(BaseModel):
    """Verse teaching for VR display."""
    chapter: int
    verse: int
    sanskrit: str
    transliteration: str
    translation: str
    teaching: str
    audio_url: str | None = None
    themes: list[str] = []


class ChapterIntroResponse(BaseModel):
    """Chapter introduction for VR narration."""
    chapter: int
    name: str
    sanskrit_name: str
    intro_text: str
    audio_url: str | None = None
    key_themes: list[str] = []
    total_verses: int


@router.post("/ask-krishna", response_model=AskKrishnaResponse)
async def ask_krishna(request: AskKrishnaRequest) -> AskKrishnaResponse:
    """
    Ask Krishna a question in the Kiaanverse VR experience.

    KIAAN AI embodies Krishna and responds with Gita wisdom,
    verse references, emotion tags, and gesture cues for 3D animation.
    Supports both Sakha (Q&A) and Recital (narration) modes.
    """
    try:
        logger.info(
            f"Kiaanverse Krishna query: mode={request.mode}, "
            f"chapter={request.chapter_context}, lang={request.language}"
        )

        result = await krishna_vr_persona.generate_krishna_response(
            question=request.question,
            chapter_context=request.chapter_context,
            language=request.language,
            mode=request.mode,
        )

        return AskKrishnaResponse(
            answer=result["answer"],
            verse_reference=(
                VerseReferenceResponse(**result["verse_reference"])
                if result.get("verse_reference")
                else None
            ),
            audio_url=result.get("audio_url"),
            gestures=[GestureCueResponse(**g) for g in result.get("gestures", [])],
            emotion=result.get("emotion", "compassionate"),
        )

    except Exception as e:
        logger.error(f"Kiaanverse ask-krishna failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Krishna's wisdom is momentarily unreachable. Please try again.",
        )


@router.get("/verse-teaching/{chapter}/{verse}", response_model=VerseTeachingResponse)
async def get_verse_teaching(chapter: int, verse: int) -> VerseTeachingResponse:
    """Get a specific verse teaching for VR display with Sanskrit and translation."""
    if chapter < 1 or chapter > 18:
        raise HTTPException(status_code=400, detail="Chapter must be between 1 and 18")
    if verse < 1 or verse > 78:
        raise HTTPException(status_code=400, detail="Invalid verse number")

    try:
        result = await krishna_vr_persona.get_verse_teaching(chapter, verse)
        return VerseTeachingResponse(**result)
    except Exception as e:
        logger.error(f"Kiaanverse verse-teaching fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Unable to retrieve verse teaching")


@router.get("/chapter-intro/{chapter}", response_model=ChapterIntroResponse)
async def get_chapter_intro(chapter: int) -> ChapterIntroResponse:
    """Get chapter introduction for VR narration and scene transition."""
    if chapter < 1 or chapter > 18:
        raise HTTPException(status_code=400, detail="Chapter must be between 1 and 18")

    try:
        result = await krishna_vr_persona.get_chapter_intro(chapter)
        return ChapterIntroResponse(**result)
    except Exception as e:
        logger.error(f"Kiaanverse chapter-intro fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Unable to retrieve chapter introduction")
