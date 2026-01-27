"""
Advanced Voice Learning API Routes

Provides API endpoints for advanced KIAAN Voice learning features:
- Analytics Dashboard
- Proactive Engagement
- Offline Sync
- Voice Personalization
- Spiritual Memory
- Quality Scoring
- Interaction Patterns
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

# Import services
from backend.services.voice_learning.analytics_dashboard import (
    get_analytics_dashboard,
    TimeGranularity,
)
from backend.services.voice_learning.proactive_engagement import (
    get_proactive_engagement_service,
    EngagementTrigger,
)
from backend.services.voice_learning.offline_sync import (
    get_offline_sync_service,
    DataType,
    SyncPriority,
)
from backend.services.voice_learning.voice_personalization import (
    get_voice_personalization_service,
    VoicePersona,
)
from backend.services.voice_learning.spiritual_memory import (
    get_spiritual_memory_service,
    GrowthDimension,
)
from backend.services.voice_learning.quality_scoring import (
    get_quality_scoring_service,
)
from backend.services.voice_learning.interaction_patterns import (
    get_interaction_patterns_service,
    InteractionType,
    ContentCategory,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice-learning/advanced", tags=["Voice Learning Advanced"])


# ==================== Request/Response Models ====================

class ActivityRequest(BaseModel):
    activity_type: str = Field(..., alias="activityType")
    metadata: Optional[Dict[str, Any]] = None


class MessageResponseRequest(BaseModel):
    responded: bool
    response_delay: Optional[float] = Field(None, alias="responseDelay")


class SyncBatchRequest(BaseModel):
    items: List[Dict[str, Any]]


class ProfileUpdateRequest(BaseModel):
    speaking_rate: Optional[float] = Field(None, alias="speakingRate")
    pitch_adjustment: Optional[float] = Field(None, alias="pitchAdjustment")
    volume_adjustment: Optional[float] = Field(None, alias="volumeAdjustment")
    pause_multiplier: Optional[float] = Field(None, alias="pauseMultiplier")
    emphasis_level: Optional[float] = Field(None, alias="emphasisLevel")
    warmth_level: Optional[float] = Field(None, alias="warmthLevel")
    energy_level: Optional[float] = Field(None, alias="energyLevel")
    accent_preference: Optional[str] = Field(None, alias="accentPreference")
    preferred_persona: Optional[str] = Field(None, alias="preferredPersona")
    accessibility_mode: Optional[bool] = Field(None, alias="accessibilityMode")


class PersonaRequest(BaseModel):
    persona: str


class VoiceFeedbackRequest(BaseModel):
    feedback_type: str = Field(..., alias="feedbackType")


class VerseResonanceRequest(BaseModel):
    verse_id: str = Field(..., alias="verseId")
    chapter: int
    verse_number: int = Field(..., alias="verseNumber")
    translation: str
    resonance_score: float = Field(..., alias="resonanceScore")
    context: str
    reflection: Optional[str] = None


class BreakthroughRequest(BaseModel):
    description: str
    growth_dimensions: List[str] = Field(..., alias="growthDimensions")
    trigger_verse: Optional[str] = Field(None, alias="triggerVerse")
    trigger_journey: Optional[str] = Field(None, alias="triggerJourney")


class InteractionRequest(BaseModel):
    event_type: str = Field(..., alias="eventType")
    duration_seconds: Optional[float] = Field(None, alias="durationSeconds")
    completion_rate: Optional[float] = Field(None, alias="completionRate")
    content_category: Optional[str] = Field(None, alias="contentCategory")


# Placeholder for user authentication
def get_current_user_id() -> str:
    """Get current user ID from auth context."""
    # TODO: Implement actual auth
    return "demo_user"


# ==================== Analytics Dashboard Routes ====================

@router.get("/analytics/snapshot")
async def get_analytics_snapshot(user_id: str = Depends(get_current_user_id)):
    """Get complete dashboard snapshot."""
    try:
        dashboard = get_analytics_dashboard()
        snapshot = await dashboard.get_dashboard_snapshot()

        return {
            "timestamp": snapshot.timestamp.isoformat(),
            "overallSatisfaction": snapshot.overall_satisfaction,
            "satisfactionTrend": snapshot.satisfaction_trend,
            "totalSessions": snapshot.total_sessions,
            "activeUsers24h": snapshot.active_users_24h,
            "averageSessionDuration": snapshot.average_session_duration,
            "feedbackResponseRate": snapshot.feedback_response_rate,
            "cacheHitRate": snapshot.cache_hit_rate,
            "topEmotions": snapshot.top_emotions,
            "engagementScore": snapshot.engagement_score,
            "alerts": [
                {
                    "type": a["type"],
                    "message": a["message"],
                    "timestamp": a["timestamp"].isoformat()
                }
                for a in snapshot.alerts
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get analytics snapshot: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/satisfaction-trend")
async def get_satisfaction_trend(
    days: int = Query(7, ge=1, le=90),
    user_id: str = Depends(get_current_user_id)
):
    """Get satisfaction trend over time."""
    dashboard = get_analytics_dashboard()
    trend = dashboard.get_satisfaction_trend(TimeGranularity.DAILY, days)
    return trend


@router.get("/analytics/quality-trends")
async def get_quality_trends(
    days: int = Query(7, ge=1, le=90),
    user_id: str = Depends(get_current_user_id)
):
    """Get quality trends by dimension."""
    quality_service = get_quality_scoring_service()
    trends = quality_service.get_quality_trends(days=days)

    return {
        dim.value: {
            "dimension": trend.dimension.value,
            "averageScore": trend.average_score,
            "scoreVariance": trend.score_variance,
            "sampleCount": trend.sample_count,
            "trendDirection": trend.trend_direction
        }
        for dim, trend in trends.items()
    }


# ==================== Proactive Engagement Routes ====================

@router.get("/engagement/pending")
async def get_pending_messages(user_id: str = Depends(get_current_user_id)):
    """Get pending proactive messages."""
    service = get_proactive_engagement_service()
    messages = service.get_pending_messages(user_id)

    return [
        {
            "id": f"{m.user_id}_{m.scheduled_time.timestamp()}",
            "trigger": m.trigger.value,
            "tone": m.tone.value,
            "message": m.message,
            "scheduledTime": m.scheduled_time.isoformat(),
            "priority": m.priority
        }
        for m in messages
    ]


@router.get("/engagement/pattern")
async def get_engagement_pattern(user_id: str = Depends(get_current_user_id)):
    """Get user's engagement pattern."""
    service = get_proactive_engagement_service()
    pattern = service.get_user_pattern(user_id)

    if not pattern:
        return None

    return {
        "preferredHours": pattern.preferred_hours,
        "lastEngagement": pattern.last_engagement.isoformat() if pattern.last_engagement else None,
        "responseRate": pattern.response_rate_to_proactive
    }


@router.post("/engagement/activity")
async def record_activity(
    request: ActivityRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Record user activity."""
    service = get_proactive_engagement_service()
    service.record_user_activity(
        user_id=user_id,
        activity_type=request.activity_type,
        metadata=request.metadata
    )
    return {"status": "recorded"}


@router.post("/engagement/message/{message_id}/delivered")
async def mark_message_delivered(
    message_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Mark a proactive message as delivered."""
    service = get_proactive_engagement_service()
    messages = service.get_pending_messages(user_id)

    for msg in messages:
        if f"{msg.user_id}_{msg.scheduled_time.timestamp()}" == message_id:
            service.mark_message_delivered(msg)
            return {"status": "delivered"}

    raise HTTPException(status_code=404, detail="Message not found")


@router.post("/engagement/message/{message_id}/response")
async def record_message_response(
    message_id: str,
    request: MessageResponseRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Record user response to proactive message."""
    service = get_proactive_engagement_service()
    service.record_proactive_response(
        user_id=user_id,
        message_id=message_id,
        responded=request.responded,
        response_delay_seconds=request.response_delay
    )
    return {"status": "recorded"}


# ==================== Offline Sync Routes ====================

@router.get("/sync/status")
async def get_sync_status(user_id: str = Depends(get_current_user_id)):
    """Get sync queue status."""
    service = get_offline_sync_service()
    status = service.get_queue_status()

    return {
        "totalItems": status["total_items"],
        "byStatus": status["by_status"],
        "syncInProgress": status["sync_in_progress"],
        "connectionStatus": status["connection_status"]
    }


@router.post("/sync/batch")
async def sync_batch(
    request: SyncBatchRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Sync a batch of offline items."""
    service = get_offline_sync_service()

    # Queue items
    for item in request.items:
        data_type = DataType(item.get("type", "feedback"))
        service.queue_for_sync(
            data_type=data_type,
            data=item,
            priority=SyncPriority.NORMAL,
            user_id=user_id
        )

    # Perform sync
    async def mock_sync_handler(items):
        # In production, this would sync to database
        return [{"success": True} for _ in items]

    result = await service.sync_all(mock_sync_handler)

    return {
        "synced": result.synced_count,
        "failed": result.failed_count
    }


# ==================== Voice Personalization Routes ====================

@router.get("/personalization/profile")
async def get_voice_profile(user_id: str = Depends(get_current_user_id)):
    """Get user's voice profile."""
    service = get_voice_personalization_service()
    profile = service.get_or_create_profile(user_id)

    return {
        "speakingRate": profile.speaking_rate,
        "pitchAdjustment": profile.pitch_adjustment,
        "volumeAdjustment": profile.volume_adjustment,
        "pauseMultiplier": profile.pause_multiplier,
        "emphasisLevel": profile.emphasis_level,
        "warmthLevel": profile.warmth_level,
        "energyLevel": profile.energy_level,
        "accentPreference": profile.accent_preference.value,
        "preferredPersona": profile.preferred_persona.value if profile.preferred_persona else None,
        "accessibilityMode": profile.accessibility_mode
    }


@router.patch("/personalization/profile")
async def update_voice_profile(
    request: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Update user's voice profile."""
    service = get_voice_personalization_service()

    updates = request.model_dump(exclude_none=True, by_alias=False)
    profile = service.update_profile(user_id, updates)

    return {
        "speakingRate": profile.speaking_rate,
        "pitchAdjustment": profile.pitch_adjustment,
        "volumeAdjustment": profile.volume_adjustment,
        "pauseMultiplier": profile.pause_multiplier,
        "emphasisLevel": profile.emphasis_level,
        "warmthLevel": profile.warmth_level,
        "energyLevel": profile.energy_level,
        "accentPreference": profile.accent_preference.value,
        "preferredPersona": profile.preferred_persona.value if profile.preferred_persona else None,
        "accessibilityMode": profile.accessibility_mode
    }


@router.post("/personalization/persona")
async def apply_voice_persona(
    request: PersonaRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Apply a voice persona preset."""
    service = get_voice_personalization_service()

    try:
        persona = VoicePersona(request.persona)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid persona: {request.persona}")

    profile = service.apply_persona(user_id, persona)

    return {
        "speakingRate": profile.speaking_rate,
        "pitchAdjustment": profile.pitch_adjustment,
        "volumeAdjustment": profile.volume_adjustment,
        "pauseMultiplier": profile.pause_multiplier,
        "emphasisLevel": profile.emphasis_level,
        "warmthLevel": profile.warmth_level,
        "energyLevel": profile.energy_level,
        "accentPreference": profile.accent_preference.value,
        "preferredPersona": profile.preferred_persona.value if profile.preferred_persona else None,
        "accessibilityMode": profile.accessibility_mode
    }


@router.post("/personalization/feedback")
async def provide_voice_feedback(
    request: VoiceFeedbackRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Provide feedback about voice characteristics."""
    service = get_voice_personalization_service()

    valid_feedback = [
        "too_fast", "too_slow", "too_loud", "too_quiet",
        "too_high_pitch", "too_low_pitch", "need_more_pauses",
        "too_many_pauses", "too_monotone", "too_dramatic"
    ]

    if request.feedback_type not in valid_feedback:
        raise HTTPException(status_code=400, detail=f"Invalid feedback type: {request.feedback_type}")

    adaptations = service.learn_from_feedback(user_id, request.feedback_type, {})

    return {
        "applied": len(adaptations),
        "adaptations": [
            {"characteristic": a.characteristic.value, "value": a.value}
            for a in adaptations
        ]
    }


# ==================== Spiritual Memory Routes ====================

@router.get("/spiritual/summary")
async def get_spiritual_summary(user_id: str = Depends(get_current_user_id)):
    """Get user's spiritual journey summary."""
    service = get_spiritual_memory_service()
    summary = service.get_spiritual_summary(user_id)

    return {
        "journeyAgeDays": summary["journey_age_days"],
        "versesEncountered": summary["verses_encountered"],
        "topResonantVerses": summary["top_resonant_verses"],
        "breakthroughsCount": summary["breakthroughs_count"],
        "validatedBreakthroughs": summary["validated_breakthroughs"],
        "activeStruggles": summary["active_struggles"],
        "overcomeStruggles": summary["overcome_struggles"],
        "milestonesAchieved": summary["milestones_achieved"],
        "growthScores": summary["growth_scores"],
        "strongestDimensions": summary["strongest_dimensions"],
        "teachingStyle": summary["teaching_style"],
        "reflectionHours": summary["reflection_hours"],
        "journeysCompleted": summary["journeys_completed"]
    }


@router.post("/spiritual/verse-resonance")
async def record_verse_resonance(
    request: VerseResonanceRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Record that a verse resonated with the user."""
    service = get_spiritual_memory_service()

    resonance = service.record_verse_resonance(
        user_id=user_id,
        verse_id=request.verse_id,
        chapter=request.chapter,
        verse_number=request.verse_number,
        translation=request.translation,
        resonance_score=request.resonance_score,
        context=request.context,
        user_reflection=request.reflection
    )

    return {
        "verseId": resonance.verse_id,
        "resonanceScore": resonance.resonance_score,
        "timesRevisited": resonance.times_revisited
    }


@router.post("/spiritual/breakthrough")
async def record_breakthrough(
    request: BreakthroughRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Record a spiritual breakthrough."""
    service = get_spiritual_memory_service()

    try:
        dimensions = [GrowthDimension(d) for d in request.growth_dimensions]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid growth dimension: {e}")

    breakthrough = service.record_breakthrough(
        user_id=user_id,
        description=request.description,
        growth_dimensions=dimensions,
        trigger_verse=request.trigger_verse,
        trigger_journey=request.trigger_journey
    )

    return {
        "id": breakthrough.id,
        "description": breakthrough.description,
        "timestamp": breakthrough.timestamp.isoformat()
    }


@router.get("/spiritual/recommend-verse")
async def get_recommended_verse(
    category: str = Query(..., description="Struggle category"),
    user_id: str = Depends(get_current_user_id)
):
    """Get recommended verse for a struggle category."""
    service = get_spiritual_memory_service()
    recommendation = service.recommend_verse_for_struggle(user_id, category)

    if not recommendation:
        return None

    return {
        "verseId": recommendation["verse_id"],
        "reason": recommendation["reason"],
        "resonanceScore": recommendation.get("resonance_score")
    }


@router.get("/spiritual/milestones/uncelebrated")
async def get_uncelebrated_milestones(user_id: str = Depends(get_current_user_id)):
    """Get milestones that haven't been celebrated."""
    service = get_spiritual_memory_service()
    milestones = service.get_uncelebrated_milestones(user_id)

    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "achievedAt": m.achieved_at.isoformat()
        }
        for m in milestones
    ]


@router.post("/spiritual/milestone/{milestone_id}/celebrate")
async def celebrate_milestone(
    milestone_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Mark a milestone as celebrated."""
    service = get_spiritual_memory_service()
    success = service.mark_milestone_celebrated(user_id, milestone_id)

    if not success:
        raise HTTPException(status_code=404, detail="Milestone not found")

    return {"status": "celebrated"}


# ==================== Interaction Patterns Routes ====================

@router.get("/patterns/analytics")
async def get_interaction_analytics(user_id: str = Depends(get_current_user_id)):
    """Get user's interaction pattern analytics."""
    service = get_interaction_patterns_service()
    analytics = service.get_interaction_analytics(user_id)

    if "error" in analytics:
        return {
            "totalInteractions": 0,
            "responseLength": {"preferred": 100, "tolerance": [50, 200], "confidence": 0.3},
            "attentionSpan": {"averageDuration": 45, "completionRate": 0.7, "optimalSegment": 30, "fatiguePoint": None},
            "voiceTextPreference": {"voiceInput": 0.5, "voiceOutput": 0.5, "voicePreferredContent": [], "textPreferredContent": []},
            "activeHours": list(range(8, 22)),
            "preferredSessionDuration": 15
        }

    return analytics


@router.get("/patterns/optimal-length")
async def get_optimal_response_length(
    category: Optional[str] = Query(None, description="Content category"),
    user_id: str = Depends(get_current_user_id)
):
    """Get optimal response length for user."""
    service = get_interaction_patterns_service()

    content_category = None
    if category:
        try:
            content_category = ContentCategory(category)
        except ValueError:
            pass

    return service.get_optimal_response_length(user_id, content_category)


@router.get("/patterns/should-use-voice")
async def should_use_voice(
    category: str = Query(..., description="Content category"),
    user_id: str = Depends(get_current_user_id)
):
    """Determine if voice output should be used."""
    service = get_interaction_patterns_service()

    try:
        content_category = ContentCategory(category)
    except ValueError:
        return {"useVoice": True, "confidence": 0.5}

    use_voice, confidence = service.should_use_voice_output(user_id, content_category)

    return {
        "useVoice": use_voice,
        "confidence": confidence
    }


@router.get("/patterns/good-time")
async def is_good_time_to_engage(user_id: str = Depends(get_current_user_id)):
    """Check if current time is good for engagement."""
    service = get_interaction_patterns_service()
    is_good, reason = service.is_good_time_to_engage(user_id)

    return {
        "isGood": is_good,
        "reason": reason
    }


@router.post("/patterns/interaction")
async def record_interaction(
    request: InteractionRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Record a user interaction."""
    service = get_interaction_patterns_service()

    try:
        event_type = InteractionType(request.event_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid event type: {request.event_type}")

    content_category = None
    if request.content_category:
        try:
            content_category = ContentCategory(request.content_category)
        except ValueError:
            pass

    service.record_interaction(
        user_id=user_id,
        event_type=event_type,
        duration_seconds=request.duration_seconds,
        completion_rate=request.completion_rate,
        content_category=content_category
    )

    return {"status": "recorded"}
