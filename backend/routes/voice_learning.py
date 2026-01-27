"""
Voice Learning API Routes - KIAAN Self-Improvement Endpoints

Provides endpoints for the voice learning system:
- Session management
- Response enhancement
- Feedback collection
- Memory management
- Analytics and insights
- A/B testing administration

These endpoints enable KIAAN to learn and improve like Siri/Alexa.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging

from backend.deps import get_db, get_current_user_flexible
from backend.middleware.rate_limiter import limiter
from backend.services.voice_learning import (
    get_voice_learning,
    get_sentiment_service,
    get_ab_testing_service,
    get_preference_learning_service,
    get_cross_session_context_service,
    get_feedback_service,
)

router = APIRouter(prefix="/voice-learning", tags=["voice-learning"])
logger = logging.getLogger(__name__)


# ===== Pydantic Models =====

class StartSessionRequest(BaseModel):
    """Request to start a voice learning session."""
    session_id: Optional[str] = None
    initial_mood: Optional[str] = None


class StartSessionResponse(BaseModel):
    """Response for session start."""
    session_id: str
    user_id: str
    active_memories: List[str]
    proactive_prompts: List[str]
    preferences_applied: Dict[str, Any]


class EnhanceResponseRequest(BaseModel):
    """Request to enhance a response."""
    text: str = Field(..., min_length=1, max_length=5000)
    context: str = "general"
    language: str = "en"
    session_id: Optional[str] = None


class EnhanceResponseResponse(BaseModel):
    """Response with enhancements applied."""
    text: str
    ssml: str
    emotion: str
    voice_config: Dict[str, Any]
    memories_used: List[str]
    experiment_variant: Optional[str]
    cache_hit: bool
    enhancements_applied: List[str]


class ProcessInputRequest(BaseModel):
    """Request to process user input."""
    text: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None


class ProcessInputResponse(BaseModel):
    """Response with input analysis."""
    emotion: str
    confidence: float
    polarity: float
    intensity: float
    memories: List[str]
    crisis_detected: bool


class RecordFeedbackRequest(BaseModel):
    """Request to record feedback."""
    response_hash: Optional[str] = None
    rating: Optional[float] = Field(None, ge=1, le=5)
    feedback_type: str = "rating"
    metadata: Optional[Dict[str, Any]] = None


class RecordPlaybackRequest(BaseModel):
    """Request to record playback event."""
    event_type: str  # play, pause, skip, replay, complete
    content_hash: Optional[str] = None
    duration_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class AddMemoryRequest(BaseModel):
    """Request to add a memory."""
    memory_type: str  # emotional_state, topic, preference, milestone, concern, progress
    key: str
    content: str
    priority: str = "medium"


class MemoryResponse(BaseModel):
    """Memory response."""
    id: str
    memory_type: str
    key: str
    content: str
    priority: str
    confidence: float
    created_at: str


# ===== Session Management =====

@router.post("/session/start", response_model=StartSessionResponse)
async def start_session(
    payload: StartSessionRequest,
    user_id: str = Depends(get_current_user_flexible),
) -> StartSessionResponse:
    """
    Start a voice learning session.

    Initializes learning context with user memories and proactive prompts.
    """
    import uuid

    logger.info(f"Starting voice learning session for user {user_id}")

    voice_learning = get_voice_learning()
    session_id = payload.session_id or str(uuid.uuid4())

    state = await voice_learning.start_session(
        user_id=user_id,
        session_id=session_id,
        initial_mood=payload.initial_mood,
    )

    return StartSessionResponse(
        session_id=session_id,
        user_id=user_id,
        active_memories=state.active_memories,
        proactive_prompts=state.proactive_prompts,
        preferences_applied=state.preferences_applied,
    )


@router.post("/session/{session_id}/end")
async def end_session(
    session_id: str,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    End a voice learning session.

    Saves context and returns session summary.
    """
    logger.info(f"Ending voice learning session {session_id} for user {user_id}")

    voice_learning = get_voice_learning()
    summary = await voice_learning.end_session(session_id)

    return summary


# ===== Response Enhancement =====

@router.post("/enhance", response_model=EnhanceResponseResponse)
async def enhance_response(
    payload: EnhanceResponseRequest,
    user_id: str = Depends(get_current_user_flexible),
) -> EnhanceResponseResponse:
    """
    Enhance a KIAAN response with voice learning.

    Applies:
    - Sentiment analysis
    - Voice fingerprinting
    - A/B experiments
    - Learned preferences
    - Adaptive prosody
    - Intelligent caching
    """
    logger.info(f"Enhancing response for user {user_id}: {len(payload.text)} chars")

    voice_learning = get_voice_learning()

    enhanced = await voice_learning.enhance_response(
        user_id=user_id,
        text=payload.text,
        context=payload.context,
        language=payload.language,
        session_id=payload.session_id,
    )

    return EnhanceResponseResponse(
        text=enhanced.text,
        ssml=enhanced.ssml,
        emotion=enhanced.emotion.value,
        voice_config=enhanced.voice_config,
        memories_used=enhanced.memories_used,
        experiment_variant=enhanced.experiment_variant,
        cache_hit=enhanced.cache_hit,
        enhancements_applied=enhanced.enhancements_applied,
    )


@router.post("/process-input", response_model=ProcessInputResponse)
async def process_input(
    payload: ProcessInputRequest,
    user_id: str = Depends(get_current_user_flexible),
) -> ProcessInputResponse:
    """
    Process user input for voice learning.

    Analyzes emotion and updates session state.
    """
    logger.info(f"Processing input for user {user_id}: {len(payload.text)} chars")

    voice_learning = get_voice_learning()

    analysis = await voice_learning.process_user_input(
        user_id=user_id,
        text=payload.text,
        session_id=payload.session_id,
    )

    return ProcessInputResponse(
        emotion=analysis["emotion"],
        confidence=analysis["confidence"],
        polarity=analysis["polarity"],
        intensity=analysis["intensity"],
        memories=analysis["memories"],
        crisis_detected=analysis["crisis_detected"],
    )


# ===== Feedback Collection =====

@router.post("/feedback")
async def record_feedback(
    payload: RecordFeedbackRequest,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Record user feedback for continuous improvement.

    Supports ratings, thumbs up/down, skips, replays, and completions.
    """
    logger.info(f"Recording feedback for user {user_id}: type={payload.feedback_type}")

    voice_learning = get_voice_learning()

    result = await voice_learning.record_feedback(
        user_id=user_id,
        response_hash=payload.response_hash,
        rating=payload.rating,
        feedback_type=payload.feedback_type,
        metadata=payload.metadata,
    )

    return result


@router.post("/playback-event")
async def record_playback_event(
    payload: RecordPlaybackRequest,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, str]:
    """
    Record audio playback events.

    Used for preference learning from implicit signals.
    """
    logger.debug(f"Recording playback event for user {user_id}: {payload.event_type}")

    voice_learning = get_voice_learning()

    await voice_learning.record_playback_event(
        user_id=user_id,
        event_type=payload.event_type,
        content_hash=payload.content_hash,
        duration_ms=payload.duration_ms,
        metadata=payload.metadata,
    )

    return {"status": "recorded"}


# ===== Memory Management =====

@router.post("/memory")
async def add_memory(
    payload: AddMemoryRequest,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Add a memory for cross-session context.
    """
    logger.info(f"Adding memory for user {user_id}: type={payload.memory_type}, key={payload.key}")

    voice_learning = get_voice_learning()

    memory = await voice_learning.add_memory(
        user_id=user_id,
        memory_type=payload.memory_type,
        key=payload.key,
        content=payload.content,
        priority=payload.priority,
    )

    return memory


@router.get("/memories")
async def get_memories(
    memory_type: Optional[str] = None,
    limit: int = 10,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get user memories.
    """
    voice_learning = get_voice_learning()

    memories = await voice_learning.get_user_memories(
        user_id=user_id,
        memory_type=memory_type,
        limit=limit,
    )

    return {
        "memories": memories,
        "count": len(memories),
    }


# ===== Sentiment Analysis =====

@router.post("/sentiment/analyze")
async def analyze_sentiment(
    text: str = Field(..., min_length=1, max_length=2000),
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Analyze sentiment of text.

    Returns emotion, confidence, polarity, and intensity.
    """
    sentiment_service = get_sentiment_service()

    result = await sentiment_service.analyze(text, user_id)

    return {
        "primary_emotion": result.primary_emotion.value,
        "confidence": result.confidence,
        "polarity": result.polarity,
        "intensity": result.intensity,
        "secondary_emotions": [
            {"emotion": e.value, "score": s}
            for e, s in result.secondary_emotions
        ] if result.secondary_emotions else [],
    }


@router.get("/sentiment/trajectory")
async def get_emotional_trajectory(
    session_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get emotional trajectory for user.
    """
    sentiment_service = get_sentiment_service()

    trajectory = await sentiment_service.get_trajectory(user_id, session_id)

    if not trajectory:
        return {"trajectory": None}

    return {
        "trajectory": trajectory.to_dict(),
    }


# ===== Preferences =====

@router.get("/preferences")
async def get_preferences(
    min_confidence: float = 0.3,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get learned preferences for user.
    """
    preferences_service = get_preference_learning_service()

    prefs = await preferences_service.get_preferences(user_id, min_confidence)

    return {
        "preferences": prefs,
        "count": len(prefs),
    }


@router.get("/preferences/{key}")
async def get_preference_value(
    key: str,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get specific preference value.
    """
    preferences_service = get_preference_learning_service()

    value, confidence = await preferences_service.get_preference_value(user_id, key)

    return {
        "key": key,
        "value": value,
        "confidence": confidence,
    }


# ===== A/B Testing =====

@router.get("/experiments")
async def list_experiments(
    status: Optional[str] = None,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    List A/B experiments.
    """
    from backend.services.voice_learning.ab_testing import ExperimentStatus

    ab_testing = get_ab_testing_service()

    status_enum = ExperimentStatus(status) if status else None
    experiments = await ab_testing.list_experiments(status_enum)

    return {
        "experiments": [e.to_dict() for e in experiments],
        "count": len(experiments),
    }


@router.get("/experiments/{experiment_id}")
async def get_experiment(
    experiment_id: str,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get experiment details.
    """
    ab_testing = get_ab_testing_service()

    experiment = await ab_testing.get_experiment(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    return experiment.to_dict()


@router.get("/experiments/{experiment_id}/results")
async def get_experiment_results(
    experiment_id: str,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get experiment analysis results.
    """
    ab_testing = get_ab_testing_service()

    result = await ab_testing.analyze_experiment(experiment_id)

    return result.to_dict()


# ===== Analytics and Insights =====

@router.get("/insights")
async def get_user_insights(
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get comprehensive insights about user's voice learning data.
    """
    voice_learning = get_voice_learning()

    insights = await voice_learning.get_user_insights(user_id)

    return insights


@router.get("/health")
async def get_system_health(
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get health metrics for voice learning services.
    """
    voice_learning = get_voice_learning()

    health = await voice_learning.get_system_health()

    return health


# ===== Emotional Progress =====

@router.get("/progress/emotional")
async def get_emotional_progress(
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get user's emotional progress over time.
    """
    context_service = get_cross_session_context_service()

    progress = await context_service.get_emotional_progress(user_id)

    return progress


# ===== Feedback Analysis =====

@router.get("/feedback/patterns")
async def get_feedback_patterns(
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get feedback patterns and improvement recommendations.
    """
    feedback_service = get_feedback_service()

    patterns = await feedback_service.analyze_feedback_patterns()

    return {
        "improvements": [
            {
                "category": p.category,
                "action": p.action,
                "priority": p.priority,
                "evidence": p.evidence,
            }
            for p in patterns[:10]  # Top 10 improvements
        ],
    }


@router.get("/feedback/reward-model")
async def get_reward_model(
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get current reward model parameters.
    """
    feedback_service = get_feedback_service()

    model = await feedback_service.get_reward_model()

    return model.to_dict()


# ===== Proactive Prompts =====

@router.get("/prompts")
async def get_proactive_prompts(
    limit: int = 5,
    user_id: str = Depends(get_current_user_flexible),
) -> Dict[str, Any]:
    """
    Get proactive prompts based on user's history.
    """
    context_service = get_cross_session_context_service()

    prompts = await context_service.get_proactive_prompts(user_id)

    return {
        "prompts": prompts[:limit],
        "count": len(prompts[:limit]),
    }
