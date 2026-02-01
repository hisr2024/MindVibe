"""
Gita AI Analysis API Routes - OpenAI-Powered Pattern Analysis.

Provides RESTful API endpoints for AI-powered analysis using Core Wisdom Gita database.

ENDPOINTS:
- POST /api/gita-ai/analyze-emotion - AI-powered emotion recognition
- POST /api/gita-ai/analyze-relationship - AI-powered relationship analysis
- POST /api/gita-ai/analyze-communication - AI-powered communication pattern analysis
- POST /api/gita-ai/analyze-attachment - AI-powered attachment pattern analysis
- GET /api/gita-ai/health - Service health check

REPLACES:
- Hardcoded emotion classification in emotionClassifier.ts
- Keyword matching in gita_wisdom_retrieval.py
- Regex patterns in sacred_conversation_patterns.py

SECURITY:
- Rate limiting via provider manager
- Input validation and sanitization
- Cached responses for performance
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from backend.services.gita_ai_analyzer import (
    get_gita_ai_analyzer,
    AttachmentAnalysis,
    EmotionAnalysis,
    RelationshipAnalysis,
    CommunicationAnalysis,
    GitaWisdomCore,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gita-ai", tags=["gita-ai-analysis"])

# Initialize AI analyzer
gita_ai_analyzer = None
wisdom_core = None
try:
    gita_ai_analyzer = get_gita_ai_analyzer()
    wisdom_core = GitaWisdomCore()
    logger.info("✅ Gita AI Analysis API: Initialized with OpenAI + Core Wisdom")
except Exception as e:
    logger.error(f"❌ Gita AI Analysis API: Failed to initialize: {e}")


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class EmotionAnalysisRequest(BaseModel):
    """Request model for emotion analysis."""
    mood_score: int = Field(..., ge=1, le=10, description="Mood score 1-10")
    tags: list[str] = Field(default=[], description="Mood tags")
    note: str = Field(default="", max_length=1000, description="Optional mood note")

    @validator("tags")
    def validate_tags(cls, v):
        """Limit and sanitize tags."""
        return [t.strip()[:50] for t in v[:10]]  # Max 10 tags, 50 chars each


class RelationshipAnalysisRequest(BaseModel):
    """Request model for relationship analysis."""
    concern: str = Field(..., min_length=10, max_length=2000, description="Relationship concern")


class CommunicationAnalysisRequest(BaseModel):
    """Request model for communication analysis."""
    message: str = Field(..., min_length=5, max_length=2000, description="Message to analyze")
    context: str = Field(default="", max_length=500, description="Optional context")


class AttachmentAnalysisRequest(BaseModel):
    """Request model for attachment analysis."""
    concern: str = Field(..., min_length=10, max_length=2000, description="Outcome worry/concern")


class EmotionAnalysisResponse(BaseModel):
    """Response model for emotion analysis."""
    primary_emotion: str
    gita_mapping: str
    intensity: float
    description: str
    recommended_verse: str
    verse_text: str
    healing_path: str
    activities: list[str]
    ai_powered: bool = True


class RelationshipAnalysisResponse(BaseModel):
    """Response model for relationship analysis."""
    relationship_type: str
    dominant_emotion: str
    dharma_lens: str
    primary_verse: str
    verse_text: str
    core_principle: str
    healing_insight: str
    action_steps: list[str]
    ai_powered: bool = True


class CommunicationAnalysisResponse(BaseModel):
    """Response model for communication analysis."""
    communication_style: str
    emotional_tone: str
    gita_guidance: str
    primary_verse: str
    verse_text: str
    sacred_speech_principle: str
    improvement_suggestion: str
    ai_powered: bool = True


class AttachmentAnalysisResponse(BaseModel):
    """Response model for attachment analysis."""
    attachment_type: str
    description: str
    gita_teaching: str
    primary_verse: str
    verse_text: str
    remedy: str
    confidence: float
    secondary_patterns: list[str]
    ai_powered: bool = True


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/analyze-emotion", response_model=EmotionAnalysisResponse)
async def analyze_emotion(request: EmotionAnalysisRequest) -> EmotionAnalysisResponse:
    """
    Analyze emotional state using OpenAI + Core Wisdom Gita database.

    REPLACES: lib/emotionClassifier.ts classifyEmotion() hardcoded logic

    This endpoint uses AI to understand the user's emotional state and maps it
    to Bhagavad Gita concepts (shanti, chinta, vishada, utsaha, samatvam).

    Returns:
        EmotionAnalysisResponse with Gita-grounded emotional analysis
    """
    if not gita_ai_analyzer:
        raise HTTPException(
            status_code=503,
            detail="AI analyzer not available. Service may be starting up."
        )

    try:
        analysis = await gita_ai_analyzer.analyze_emotion(
            mood_score=request.mood_score,
            tags=request.tags,
            note=request.note,
        )

        logger.info(f"Emotion analysis: {analysis.primary_emotion} (gita: {analysis.gita_mapping})")

        return EmotionAnalysisResponse(
            primary_emotion=analysis.primary_emotion,
            gita_mapping=analysis.gita_mapping,
            intensity=analysis.intensity,
            description=analysis.description,
            recommended_verse=analysis.recommended_verse,
            verse_text=analysis.verse_text,
            healing_path=analysis.healing_path,
            activities=analysis.activities,
            ai_powered=True,
        )

    except Exception as e:
        logger.error(f"Emotion analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-relationship", response_model=RelationshipAnalysisResponse)
async def analyze_relationship(request: RelationshipAnalysisRequest) -> RelationshipAnalysisResponse:
    """
    Analyze relationship dynamics using OpenAI + Core Wisdom Gita database.

    REPLACES: gita_wisdom_retrieval.py RELATIONSHIP_KEYWORDS dictionary matching

    This endpoint uses AI to understand relationship dynamics and provides
    Dharma-grounded insights for healing and growth.

    Returns:
        RelationshipAnalysisResponse with Gita-grounded relationship analysis
    """
    if not gita_ai_analyzer:
        raise HTTPException(
            status_code=503,
            detail="AI analyzer not available. Service may be starting up."
        )

    try:
        analysis = await gita_ai_analyzer.analyze_relationship(
            user_input=request.concern,
        )

        logger.info(f"Relationship analysis: {analysis.relationship_type} ({analysis.dominant_emotion})")

        return RelationshipAnalysisResponse(
            relationship_type=analysis.relationship_type,
            dominant_emotion=analysis.dominant_emotion,
            dharma_lens=analysis.dharma_lens,
            primary_verse=analysis.primary_verse,
            verse_text=analysis.verse_text,
            core_principle=analysis.core_principle,
            healing_insight=analysis.healing_insight,
            action_steps=analysis.action_steps,
            ai_powered=True,
        )

    except Exception as e:
        logger.error(f"Relationship analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-communication", response_model=CommunicationAnalysisResponse)
async def analyze_communication(request: CommunicationAnalysisRequest) -> CommunicationAnalysisResponse:
    """
    Analyze communication patterns using OpenAI + Core Wisdom Gita database.

    REPLACES: sacred_conversation_patterns.py hardcoded templates

    This endpoint uses AI to understand communication style and provides
    Gita-grounded guidance for sacred speech (vak).

    Returns:
        CommunicationAnalysisResponse with Gita-grounded communication guidance
    """
    if not gita_ai_analyzer:
        raise HTTPException(
            status_code=503,
            detail="AI analyzer not available. Service may be starting up."
        )

    try:
        analysis = await gita_ai_analyzer.analyze_communication(
            message=request.message,
            context=request.context if request.context else None,
        )

        logger.info(f"Communication analysis: {analysis.communication_style} ({analysis.emotional_tone})")

        return CommunicationAnalysisResponse(
            communication_style=analysis.communication_style,
            emotional_tone=analysis.emotional_tone,
            gita_guidance=analysis.gita_guidance,
            primary_verse=analysis.primary_verse,
            verse_text=analysis.verse_text,
            sacred_speech_principle=analysis.sacred_speech_principle,
            improvement_suggestion=analysis.improvement_suggestion,
            ai_powered=True,
        )

    except Exception as e:
        logger.error(f"Communication analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-attachment", response_model=AttachmentAnalysisResponse)
async def analyze_attachment(request: AttachmentAnalysisRequest) -> AttachmentAnalysisResponse:
    """
    Analyze attachment patterns using OpenAI + Core Wisdom Gita database.

    REPLACES: viyoga.py _analyze_attachment_pattern() keyword matching

    This endpoint uses AI to understand attachment patterns and provides
    Karma Yoga grounded insights for detachment.

    Returns:
        AttachmentAnalysisResponse with Gita-grounded attachment analysis
    """
    if not gita_ai_analyzer:
        raise HTTPException(
            status_code=503,
            detail="AI analyzer not available. Service may be starting up."
        )

    try:
        analysis = await gita_ai_analyzer.analyze_attachment_pattern(
            user_input=request.concern,
        )

        logger.info(f"Attachment analysis: {analysis.attachment_type} (confidence: {analysis.confidence})")

        return AttachmentAnalysisResponse(
            attachment_type=analysis.attachment_type,
            description=analysis.description,
            gita_teaching=analysis.gita_teaching,
            primary_verse=analysis.primary_verse,
            verse_text=analysis.verse_text,
            remedy=analysis.remedy,
            confidence=analysis.confidence,
            secondary_patterns=analysis.secondary_patterns,
            ai_powered=True,
        )

    except Exception as e:
        logger.error(f"Attachment analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/health")
async def gita_ai_health() -> dict[str, Any]:
    """
    Health check for Gita AI Analysis service.

    Returns service status and capabilities.
    """
    analyzer_ready = gita_ai_analyzer is not None
    wisdom_ready = wisdom_core is not None and wisdom_core.verses_count > 0

    return {
        "status": "ok" if (analyzer_ready and wisdom_ready) else "degraded",
        "service": "gita-ai-analysis",
        "version": "1.0",
        "capabilities": {
            "ai_analyzer_ready": analyzer_ready,
            "wisdom_core_ready": wisdom_ready,
            "verses_loaded": wisdom_core.verses_count if wisdom_core else 0,
        },
        "endpoints": [
            "/api/gita-ai/analyze-emotion",
            "/api/gita-ai/analyze-relationship",
            "/api/gita-ai/analyze-communication",
            "/api/gita-ai/analyze-attachment",
        ],
        "replaces": {
            "emotion_recognition": "lib/emotionClassifier.ts (hardcoded categories)",
            "relationship_detection": "gita_wisdom_retrieval.py (keyword matching)",
            "communication_analysis": "sacred_conversation_patterns.py (regex)",
            "attachment_analysis": "viyoga.py (keyword matching)",
        },
    }
