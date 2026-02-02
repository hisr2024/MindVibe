"""
KIAAN Quantum Dive API Routes

Provides endpoints for multi-dimensional consciousness analysis
with voice-guided deep dive sessions into the five layers of being.

Quantum Coherence: The interconnected nature of consciousness where
multiple states coexist and self-reflection collapses them into clarity.
"""

import logging
from datetime import date, datetime, timedelta
from typing import Any, Literal
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.models import UserDailyAnalysis, UserWeeklyReflection
from backend.services.kiaan_core import KIAANCore

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/kiaan/quantum-dive", tags=["kiaan", "quantum-dive", "voice"]
)

kiaan_core = KIAANCore()


# ===== Enums =====

class ConsciousnessLayer(str, Enum):
    ANNAMAYA = "annamaya"      # Physical
    PRANAMAYA = "pranamaya"    # Energy
    MANOMAYA = "manomaya"      # Mental/Emotional
    VIJNANAMAYA = "vijnanamaya"  # Wisdom
    ANANDAMAYA = "anandamaya"  # Bliss


class EvolutionTrend(str, Enum):
    ASCENDING = "ascending"
    STABLE = "stable"
    DESCENDING = "descending"
    TRANSFORMING = "transforming"


# ===== Pydantic Models =====

class QuantumState(BaseModel):
    """State of a consciousness layer."""
    layer: ConsciousnessLayer
    coherence: float = Field(..., ge=0, le=1, description="Alignment score 0-1")
    amplitude: float = Field(..., ge=0, le=1, description="Presence strength 0-1")
    phase: float = Field(..., ge=-1, le=1, description="Direction -1 to 1")
    dominant_pattern: str = Field(..., description="Main pattern description")
    blocked_by: list[str] = Field(default_factory=list, description="Obstacles")
    supported_by: list[str] = Field(default_factory=list, description="Supporters")


class QuantumInsight(BaseModel):
    """Deep insight from analysis."""
    id: str
    type: Literal["revelation", "pattern", "warning", "encouragement", "growth"]
    title: str
    content: str
    voice_narration: str
    confidence: float = Field(..., ge=0, le=1)
    layer: ConsciousnessLayer
    actionable: bool
    priority: Literal["high", "medium", "low"]


class WisdomRecommendation(BaseModel):
    """Gita verse recommendation."""
    verse_id: str
    chapter: int
    verse: int
    sanskrit: str | None = None
    translation: str
    relevance: str
    layer: ConsciousnessLayer
    application_guide: str
    voice_intro: str


class PracticeRecommendation(BaseModel):
    """Practice suggestion."""
    id: str
    name: str
    description: str
    duration: str
    frequency: str
    target_layer: ConsciousnessLayer
    expected_benefit: str
    voice_guidance: str


class QuantumDiveAnalysis(BaseModel):
    """Complete quantum dive analysis result."""
    overall_coherence: int = Field(..., ge=0, le=100, description="Overall score 0-100")
    consciousness_signature: str = Field(..., description="Unique pattern identifier")
    evolution_trend: EvolutionTrend
    layers: dict[str, QuantumState]
    temporal_patterns: list[dict[str, Any]]
    insights: list[QuantumInsight]
    wisdom_recommendations: list[WisdomRecommendation]
    practice_recommendations: list[PracticeRecommendation]
    voice_summary: str = Field(..., description="Voice-optimized summary")
    analyzed_at: datetime
    data_points: int
    confidence_score: float = Field(..., ge=0, le=1)


class QuantumDiveRequest(BaseModel):
    """Request to initiate quantum dive."""
    time_range_weeks: int = Field(default=4, ge=1, le=12, description="Weeks to analyze")
    focus_layers: list[ConsciousnessLayer] | None = Field(
        default=None, description="Specific layers to focus on"
    )
    quick_dive: bool = Field(default=False, description="Quick 2-minute dive")
    voice_optimized: bool = Field(default=True, description="Optimize for voice output")


class LayerDeepDiveRequest(BaseModel):
    """Request for deeper exploration of a specific layer."""
    layer: ConsciousnessLayer
    include_verses: bool = Field(default=True)
    include_practices: bool = Field(default=True)


class LayerDeepDiveResponse(BaseModel):
    """Deep dive response for a specific layer."""
    layer: ConsciousnessLayer
    layer_name: str
    layer_description: str
    state: QuantumState
    detailed_analysis: str
    voice_narration: str
    related_verse: WisdomRecommendation | None = None
    recommended_practice: PracticeRecommendation | None = None


# ===== Gita Wisdom Database =====

LAYER_GITA_VERSES: dict[str, list[dict[str, Any]]] = {
    "annamaya": [
        {
            "verse_id": "BG_6_17",
            "chapter": 6,
            "verse": 17,
            "translation": "One who is moderate in eating, sleeping, working, and recreation can mitigate all material pains by practicing yoga.",
            "relevance": "Physical balance through moderation",
            "application_guide": "Establish regular routines for eating, sleeping, and activity.",
            "voice_intro": "For physical wellbeing, the Gita teaches us about moderation."
        }
    ],
    "pranamaya": [
        {
            "verse_id": "BG_4_29",
            "chapter": 4,
            "verse": 29,
            "translation": "Still others practice breath control as sacrifice, regulating the incoming and outgoing breath.",
            "relevance": "Vital energy through breath",
            "application_guide": "Practice conscious breathing to regulate life force.",
            "voice_intro": "For energy balance, ancient wisdom guides us to the breath."
        }
    ],
    "manomaya": [
        {
            "verse_id": "BG_6_5",
            "chapter": 6,
            "verse": 5,
            "translation": "One must elevate oneself by one's own mind, not degrade oneself. The mind is the friend of the conditioned soul, and its enemy as well.",
            "relevance": "Mind as friend or foe",
            "application_guide": "Train your mind to be your ally through positive self-talk.",
            "voice_intro": "Your mind can be your greatest friend or your greatest challenge."
        },
        {
            "verse_id": "BG_6_35",
            "chapter": 6,
            "verse": 35,
            "translation": "The mind is restless and difficult to curb, but it can be controlled through practice and detachment.",
            "relevance": "Mastering the restless mind",
            "application_guide": "With consistent practice, the turbulent mind becomes still.",
            "voice_intro": "Even the most restless mind can find peace through practice."
        }
    ],
    "vijnanamaya": [
        {
            "verse_id": "BG_2_47",
            "chapter": 2,
            "verse": 47,
            "translation": "You have a right to perform your duty, but not to the fruits of action. Never consider yourself the cause of results, nor be attached to inaction.",
            "relevance": "Wisdom of detached action",
            "application_guide": "Focus on the quality of your actions, not the outcomes.",
            "voice_intro": "True wisdom lies in acting without attachment to results."
        }
    ],
    "anandamaya": [
        {
            "verse_id": "BG_6_20",
            "chapter": 6,
            "verse": 20,
            "translation": "When the mind, disciplined through yoga, rests in the Self, free from all desires, one is said to be established in yoga.",
            "relevance": "Resting in blissful awareness",
            "application_guide": "Allow moments of simply being, free from wanting.",
            "voice_intro": "When desires quiet, natural bliss emerges."
        }
    ]
}

LAYER_PRACTICES: dict[str, list[dict[str, Any]]] = {
    "annamaya": [
        {
            "id": "body-scan",
            "name": "Body Awareness Scan",
            "description": "Systematic awareness of physical sensations from head to toe",
            "duration": "10 minutes",
            "frequency": "daily",
            "expected_benefit": "Increased body awareness and tension release",
            "voice_guidance": "Start with a daily body scan to reconnect with physical sensations."
        }
    ],
    "pranamaya": [
        {
            "id": "alternate-nostril",
            "name": "Nadi Shodhana (Alternate Nostril Breathing)",
            "description": "Balancing breath through alternating nostrils",
            "duration": "5-10 minutes",
            "frequency": "twice daily",
            "expected_benefit": "Energy balance and calm nervous system",
            "voice_guidance": "Alternate nostril breathing balances your energy channels."
        }
    ],
    "manomaya": [
        {
            "id": "witness-meditation",
            "name": "Witness Meditation",
            "description": "Observing thoughts without engagement or judgment",
            "duration": "15-20 minutes",
            "frequency": "daily",
            "expected_benefit": "Mental clarity and emotional regulation",
            "voice_guidance": "Practice witnessing your thoughts like clouds passing in the sky."
        }
    ],
    "vijnanamaya": [
        {
            "id": "self-inquiry",
            "name": "Self-Inquiry (Atma Vichara)",
            "description": "Asking 'Who am I?' and resting in awareness",
            "duration": "20 minutes",
            "frequency": "daily",
            "expected_benefit": "Direct insight into true nature",
            "voice_guidance": "Ask yourself 'Who am I?' and rest in the silent awareness."
        }
    ],
    "anandamaya": [
        {
            "id": "gratitude-meditation",
            "name": "Gratitude Meditation",
            "description": "Cultivating deep appreciation for existence",
            "duration": "10 minutes",
            "frequency": "daily",
            "expected_benefit": "Access to natural joy and contentment",
            "voice_guidance": "Let gratitude open the door to your natural bliss."
        }
    ]
}

LAYER_NAMES = {
    "annamaya": ("Annamaya Kosha", "your physical body and its sensations"),
    "pranamaya": ("Pranamaya Kosha", "your vital energy and life force"),
    "manomaya": ("Manomaya Kosha", "your mind, emotions, and thoughts"),
    "vijnanamaya": ("Vijnanamaya Kosha", "your wisdom, intellect, and discernment"),
    "anandamaya": ("Anandamaya Kosha", "your inner bliss and spiritual essence"),
}


# ===== API Endpoints =====

@router.post("/analyze", response_model=QuantumDiveAnalysis)
async def perform_quantum_dive(
    request: QuantumDiveRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> QuantumDiveAnalysis:
    """
    Perform a comprehensive quantum dive analysis.

    Analyzes consciousness across five layers (koshas):
    - Annamaya (Physical)
    - Pranamaya (Energy)
    - Manomaya (Mental/Emotional)
    - Vijnanamaya (Wisdom)
    - Anandamaya (Bliss)

    Returns multi-dimensional insights, Gita wisdom, and practice recommendations.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for quantum dive",
        )

    logger.info(f"Initiating quantum dive for user {user_id}")

    try:
        # Gather data from database
        daily_data = await _get_daily_analyses(db, user_id, request.time_range_weeks)
        weekly_data = await _get_weekly_reflections(db, user_id, request.time_range_weeks)

        # Perform analysis
        analysis = await _perform_quantum_analysis(
            user_id=user_id,
            daily_data=daily_data,
            weekly_data=weekly_data,
            focus_layers=request.focus_layers,
            quick_dive=request.quick_dive,
            db=db
        )

        # Generate voice summary if requested
        if request.voice_optimized:
            analysis["voice_summary"] = _generate_voice_summary(analysis)
        else:
            analysis["voice_summary"] = ""

        return QuantumDiveAnalysis(**analysis)

    except Exception as e:
        logger.error(f"Quantum dive failed for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quantum dive analysis failed: {str(e)}"
        )


@router.get("/quick", response_model=QuantumDiveAnalysis)
async def quick_quantum_dive(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> QuantumDiveAnalysis:
    """
    Perform a quick quantum dive (2-minute version).

    Provides essential insights without deep exploration.
    Ideal for daily check-ins.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    request = QuantumDiveRequest(
        time_range_weeks=1,
        quick_dive=True,
        voice_optimized=True
    )

    return await perform_quantum_dive(request, db, user_id)


@router.post("/layer/{layer}", response_model=LayerDeepDiveResponse)
async def deep_dive_layer(
    layer: ConsciousnessLayer,
    request: LayerDeepDiveRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> LayerDeepDiveResponse:
    """
    Deep dive into a specific consciousness layer.

    Provides detailed analysis, relevant verse, and practice recommendation.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    logger.info(f"Layer deep dive for user {user_id}: {layer}")

    try:
        # Get recent data for this user
        daily_data = await _get_daily_analyses(db, user_id, weeks=2)
        weekly_data = await _get_weekly_reflections(db, user_id, weeks=2)

        # Analyze specific layer
        layer_state = await _analyze_single_layer(
            layer=layer.value,
            daily_data=daily_data,
            weekly_data=weekly_data
        )

        # Get layer metadata
        layer_name, layer_desc = LAYER_NAMES[layer.value]

        # Get detailed analysis from KIAAN
        detailed_analysis = await _get_layer_analysis_from_kiaan(
            layer=layer.value,
            state=layer_state,
            user_id=user_id,
            db=db
        )

        # Generate voice narration
        voice_narration = _generate_layer_voice_narration(
            layer=layer.value,
            layer_name=layer_name,
            state=layer_state,
            detailed_analysis=detailed_analysis
        )

        # Get related verse if requested
        related_verse = None
        if request.include_verses:
            verses = LAYER_GITA_VERSES.get(layer.value, [])
            if verses:
                v = verses[0]
                related_verse = WisdomRecommendation(
                    verse_id=v["verse_id"],
                    chapter=v["chapter"],
                    verse=v["verse"],
                    translation=v["translation"],
                    relevance=v["relevance"],
                    layer=layer,
                    application_guide=v["application_guide"],
                    voice_intro=v["voice_intro"]
                )

        # Get recommended practice if requested
        recommended_practice = None
        if request.include_practices:
            practices = LAYER_PRACTICES.get(layer.value, [])
            if practices:
                p = practices[0]
                recommended_practice = PracticeRecommendation(
                    id=p["id"],
                    name=p["name"],
                    description=p["description"],
                    duration=p["duration"],
                    frequency=p["frequency"],
                    target_layer=layer,
                    expected_benefit=p["expected_benefit"],
                    voice_guidance=p["voice_guidance"]
                )

        return LayerDeepDiveResponse(
            layer=layer,
            layer_name=layer_name,
            layer_description=layer_desc,
            state=QuantumState(
                layer=layer,
                coherence=layer_state["coherence"],
                amplitude=layer_state["amplitude"],
                phase=layer_state["phase"],
                dominant_pattern=layer_state["dominant_pattern"],
                blocked_by=layer_state.get("blocked_by", []),
                supported_by=layer_state.get("supported_by", [])
            ),
            detailed_analysis=detailed_analysis,
            voice_narration=voice_narration,
            related_verse=related_verse,
            recommended_practice=recommended_practice
        )

    except Exception as e:
        logger.error(f"Layer deep dive failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Layer analysis failed: {str(e)}"
        )


@router.get("/voice-summary")
async def get_voice_summary(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> dict[str, str]:
    """
    Get a voice-optimized summary for narration.

    Returns text optimized for text-to-speech.
    Ideal for "Hey KIAAN, how am I doing?" queries.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        # Get quick analysis
        analysis = await quick_quantum_dive(db, user_id)

        return {
            "summary": analysis.voice_summary,
            "coherence": analysis.overall_coherence,
            "trend": analysis.evolution_trend.value
        }

    except Exception as e:
        logger.error(f"Voice summary failed: {e}")
        return {
            "summary": "I'm unable to complete your quantum dive right now. Please try again in a moment.",
            "coherence": 0,
            "trend": "stable"
        }


@router.get("/history")
async def get_quantum_dive_history(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> list[dict[str, Any]]:
    """
    Get history of quantum dive analyses.

    Returns previous analyses for trend tracking.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    # For now, return weekly reflection history as proxy
    # In production, store actual quantum dive results
    weekly_data = await _get_weekly_reflections(db, user_id, weeks=limit)

    history = []
    for week in weekly_data:
        history.append({
            "date": week["week_start"].isoformat(),
            "wellbeing_score": week.get("wellbeing_score"),
            "insights_count": len(week.get("insights", [])),
            "verses_explored": len(week.get("verses_explored", []))
        })

    return history


# ===== Helper Functions =====

async def _get_daily_analyses(
    db: AsyncSession, user_id: str, weeks: int
) -> list[dict[str, Any]]:
    """Fetch daily analyses for the specified time range."""
    cutoff_date = date.today() - timedelta(weeks=weeks)

    result = await db.execute(
        select(UserDailyAnalysis)
        .where(
            UserDailyAnalysis.user_id == user_id,
            UserDailyAnalysis.analysis_date >= cutoff_date,
        )
        .order_by(UserDailyAnalysis.analysis_date.desc())
    )
    analyses = result.scalars().all()

    daily_data = []
    for a in analyses:
        # Extract emotions from insights or emotional_summary
        emotions = []
        concerns = []

        # Parse insights for emotions and concerns
        insights = a.insights or []
        if isinstance(insights, list):
            for insight in insights:
                if isinstance(insight, dict):
                    # Look for emotion indicators
                    insight_text = str(insight.get("content", "") or insight.get("text", "")).lower()
                    if any(e in insight_text for e in ["sad", "angry", "anxious", "stressed", "frustrated"]):
                        emotions.append(insight_text.split()[0] if insight_text else "mixed")
                    if any(e in insight_text for e in ["happy", "calm", "peaceful", "content", "grateful"]):
                        emotions.append(insight_text.split()[0] if insight_text else "positive")
                    # Check for concerns
                    if insight.get("type") == "concern" or "concern" in insight_text:
                        concerns.append(insight.get("content", insight_text)[:50])
                elif isinstance(insight, str):
                    emotions.append(insight.lower())

        # Infer emotions from mood score if no direct emotions found
        if not emotions and a.overall_mood_score is not None:
            if a.overall_mood_score >= 7:
                emotions = ["content", "peaceful"]
            elif a.overall_mood_score >= 5:
                emotions = ["neutral"]
            else:
                emotions = ["stressed"]

        daily_data.append({
            "date": a.analysis_date,
            "mood_score": a.overall_mood_score,
            "emotions": emotions,
            "concerns": concerns,
            "recommended_verses": a.recommended_verses or [],
            "emotional_summary": a.emotional_summary or "",
            "insights": insights
        })

    return daily_data


async def _get_weekly_reflections(
    db: AsyncSession, user_id: str, weeks: int
) -> list[dict[str, Any]]:
    """Fetch weekly reflections for the specified time range."""
    cutoff_date = date.today() - timedelta(weeks=weeks)

    result = await db.execute(
        select(UserWeeklyReflection)
        .where(
            UserWeeklyReflection.user_id == user_id,
            UserWeeklyReflection.week_start_date >= cutoff_date,
        )
        .order_by(UserWeeklyReflection.week_start_date.desc())
    )
    reflections = result.scalars().all()

    return [
        {
            "week_start": r.week_start_date,
            "week_end": r.week_end_date,
            "emotional_summary": r.emotional_journey_summary,
            "insights": r.key_insights or [],
            "wellbeing_score": r.overall_wellbeing_score,
            "verses_explored": r.verses_explored or [],
            "milestones": r.milestones_achieved or [],
            "growth_areas": r.areas_for_growth or []
        }
        for r in reflections
    ]


async def _perform_quantum_analysis(
    user_id: str,
    daily_data: list[dict[str, Any]],
    weekly_data: list[dict[str, Any]],
    focus_layers: list[ConsciousnessLayer] | None,
    quick_dive: bool,
    db: AsyncSession
) -> dict[str, Any]:
    """Perform the multi-dimensional quantum analysis."""

    # Analyze each layer
    layers_to_analyze = (
        [l.value for l in focus_layers] if focus_layers
        else ["annamaya", "pranamaya", "manomaya", "vijnanamaya", "anandamaya"]
    )

    layers_analysis = {}
    for layer in layers_to_analyze:
        layers_analysis[layer] = await _analyze_single_layer(
            layer=layer,
            daily_data=daily_data,
            weekly_data=weekly_data
        )

    # Calculate overall coherence
    coherence_values = [l["coherence"] for l in layers_analysis.values()]
    amplitude_values = [l["amplitude"] for l in layers_analysis.values()]

    weighted_coherence = sum(
        c * a for c, a in zip(coherence_values, amplitude_values)
    ) / max(sum(amplitude_values), 0.1)

    overall_coherence = int(weighted_coherence * 100)

    # Determine evolution trend
    evolution_trend = _determine_evolution_trend(daily_data, weekly_data)

    # Generate insights
    insights = _generate_insights(layers_analysis, daily_data, weekly_data)

    # Get wisdom recommendations
    wisdom_recommendations = _get_wisdom_recommendations(layers_analysis)

    # Get practice recommendations
    practice_recommendations = _get_practice_recommendations(layers_analysis)

    # Detect temporal patterns
    temporal_patterns = _detect_temporal_patterns(daily_data, weekly_data)

    # Generate consciousness signature
    signature = _generate_signature(layers_analysis, overall_coherence)

    # Calculate data points and confidence
    data_points = len(daily_data) + len(weekly_data)
    confidence_score = min(0.95, 0.3 + (data_points / 50) * 0.65)

    return {
        "overall_coherence": overall_coherence,
        "consciousness_signature": signature,
        "evolution_trend": evolution_trend,
        "layers": {
            layer: QuantumState(
                layer=ConsciousnessLayer(layer),
                coherence=data["coherence"],
                amplitude=data["amplitude"],
                phase=data["phase"],
                dominant_pattern=data["dominant_pattern"],
                blocked_by=data.get("blocked_by", []),
                supported_by=data.get("supported_by", [])
            ).model_dump()
            for layer, data in layers_analysis.items()
        },
        "temporal_patterns": temporal_patterns,
        "insights": insights,
        "wisdom_recommendations": wisdom_recommendations,
        "practice_recommendations": practice_recommendations,
        "analyzed_at": datetime.now(),
        "data_points": data_points,
        "confidence_score": confidence_score
    }


async def _analyze_single_layer(
    layer: str,
    daily_data: list[dict[str, Any]],
    weekly_data: list[dict[str, Any]]
) -> dict[str, Any]:
    """Analyze a single consciousness layer."""

    # Calculate metrics based on layer type
    if layer == "annamaya":
        return _analyze_annamaya(daily_data)
    elif layer == "pranamaya":
        return _analyze_pranamaya(daily_data)
    elif layer == "manomaya":
        return _analyze_manomaya(daily_data, weekly_data)
    elif layer == "vijnanamaya":
        return _analyze_vijnanamaya(weekly_data)
    elif layer == "anandamaya":
        return _analyze_anandamaya(daily_data, weekly_data)

    return {
        "coherence": 0.5,
        "amplitude": 0.5,
        "phase": 0,
        "dominant_pattern": "Unknown",
        "blocked_by": [],
        "supported_by": []
    }


def _analyze_annamaya(daily_data: list[dict[str, Any]]) -> dict[str, Any]:
    """Analyze physical layer."""
    concerns = [c for d in daily_data for c in d.get("concerns", [])]
    physical_concerns = [c for c in concerns if any(
        word in c.lower() for word in ["sleep", "tired", "pain", "body", "energy"]
    )]

    has_physical_issues = len(physical_concerns) > len(daily_data) * 0.3

    avg_mood = (
        sum(d.get("mood_score", 5) for d in daily_data) / len(daily_data)
        if daily_data else 5
    ) / 10

    return {
        "coherence": 0.4 if has_physical_issues else 0.7,
        "amplitude": 0.6,
        "phase": 0.2 if avg_mood > 0.6 else -0.2,
        "dominant_pattern": "Physical tension" if has_physical_issues else "Physically balanced",
        "blocked_by": ["Sleep issues", "Physical discomfort"] if has_physical_issues else [],
        "supported_by": ["Body awareness", "Regular routine"]
    }


def _analyze_pranamaya(daily_data: list[dict[str, Any]]) -> dict[str, Any]:
    """Analyze energy layer."""
    # Infer from mood scores and emotional volatility
    mood_scores = [d.get("mood_score", 5) for d in daily_data]

    if len(mood_scores) < 2:
        return {
            "coherence": 0.5,
            "amplitude": 0.5,
            "phase": 0,
            "dominant_pattern": "Stable energy",
            "blocked_by": [],
            "supported_by": ["Breath practice"]
        }

    avg_mood = sum(mood_scores) / len(mood_scores) / 10
    variance = sum((m/10 - avg_mood) ** 2 for m in mood_scores) / len(mood_scores)

    energy_balance = 1 - min(variance * 5, 1)  # High variance = low balance

    return {
        "coherence": energy_balance * 0.7 + 0.2,
        "amplitude": 0.6,
        "phase": 0.3 if avg_mood > 0.6 else -0.1,
        "dominant_pattern": "Energy balanced" if energy_balance > 0.5 else "Energy fluctuating",
        "blocked_by": ["Energy scattered"] if energy_balance < 0.4 else [],
        "supported_by": ["Breath practice", "Regular movement"]
    }


def _analyze_manomaya(
    daily_data: list[dict[str, Any]],
    weekly_data: list[dict[str, Any]]
) -> dict[str, Any]:
    """Analyze mental/emotional layer."""
    # Safely extract emotions as strings
    emotions = []
    for d in daily_data:
        raw_emotions = d.get("emotions", [])
        if isinstance(raw_emotions, list):
            for e in raw_emotions:
                if isinstance(e, str):
                    emotions.append(e)
                elif isinstance(e, dict):
                    emotions.append(str(e.get("name", e.get("emotion", "unknown"))))
        elif isinstance(raw_emotions, dict):
            emotions.extend(str(k) for k in raw_emotions.keys())

    negative_emotions = [e for e in emotions if str(e).lower() in [
        "sad", "angry", "anxious", "fearful", "frustrated", "stressed"
    ]]

    negative_ratio = len(negative_emotions) / max(len(emotions), 1)

    weekly_scores = [w.get("wellbeing_score") for w in weekly_data if w.get("wellbeing_score")]
    avg_wellbeing = sum(weekly_scores) / len(weekly_scores) / 10 if weekly_scores else 0.5

    emotional_stability = 1 - negative_ratio

    return {
        "coherence": emotional_stability * 0.6 + avg_wellbeing * 0.4,
        "amplitude": 0.8,  # Mental layer often most present
        "phase": avg_wellbeing - 0.5,
        "dominant_pattern": "Emotionally centered" if emotional_stability > 0.6 else "Processing emotions",
        "blocked_by": ["Emotional turbulence"] if negative_ratio > 0.5 else [],
        "supported_by": ["Self-reflection", "Emotional awareness"]
    }


def _analyze_vijnanamaya(weekly_data: list[dict[str, Any]]) -> dict[str, Any]:
    """Analyze wisdom layer."""
    verses_explored = sum(len(w.get("verses_explored", [])) for w in weekly_data)
    insights_gained = sum(len(w.get("insights", [])) for w in weekly_data)

    wisdom_engagement = min(1, (verses_explored + insights_gained) / 20)

    return {
        "coherence": 0.3 + wisdom_engagement * 0.5,
        "amplitude": wisdom_engagement * 0.7 + 0.2,
        "phase": 0.4 if wisdom_engagement > 0.5 else 0,
        "dominant_pattern": "Wisdom integration" if wisdom_engagement > 0.5 else "Seeking guidance",
        "blocked_by": [] if wisdom_engagement > 0.3 else ["Limited self-reflection"],
        "supported_by": ["Gita wisdom engagement"] if verses_explored > 0 else []
    }


def _analyze_anandamaya(
    daily_data: list[dict[str, Any]],
    weekly_data: list[dict[str, Any]]
) -> dict[str, Any]:
    """Analyze bliss layer."""
    # Check for gratitude and positive emotions
    gratitude_items = sum(
        len(d.get("gratitude", [])) for d in daily_data
        if isinstance(d.get("gratitude"), list)
    )

    # Safely extract emotions as strings
    emotions = []
    for d in daily_data:
        raw_emotions = d.get("emotions", [])
        if isinstance(raw_emotions, list):
            for e in raw_emotions:
                if isinstance(e, str):
                    emotions.append(e)
                elif isinstance(e, dict):
                    emotions.append(str(e.get("name", e.get("emotion", "unknown"))))
        elif isinstance(raw_emotions, dict):
            emotions.extend(str(k) for k in raw_emotions.keys())

    positive_emotions = [e for e in emotions if str(e).lower() in [
        "happy", "calm", "peaceful", "content", "grateful", "joyful"
    ]]

    positive_ratio = len(positive_emotions) / max(len(emotions), 1)
    has_gratitude = gratitude_items > 0

    return {
        "coherence": positive_ratio * 0.6 + (0.3 if has_gratitude else 0),
        "amplitude": 0.5 + positive_ratio * 0.3,
        "phase": 0.5 if positive_ratio > 0.5 else -0.2,
        "dominant_pattern": "Natural joy" if positive_ratio > 0.6 else "Cultivating contentment",
        "blocked_by": [] if has_gratitude else ["Limited gratitude practice"],
        "supported_by": ["Gratitude practice"] if has_gratitude else []
    }


def _determine_evolution_trend(
    daily_data: list[dict[str, Any]],
    weekly_data: list[dict[str, Any]]
) -> str:
    """Determine overall evolution trend."""
    if len(weekly_data) < 2:
        return "stable"

    weekly_scores = [
        w.get("wellbeing_score", 5) for w in weekly_data
        if w.get("wellbeing_score") is not None
    ]

    if len(weekly_scores) < 2:
        return "stable"

    first_half = weekly_scores[:len(weekly_scores)//2]
    second_half = weekly_scores[len(weekly_scores)//2:]

    first_avg = sum(first_half) / len(first_half) if first_half else 5
    second_avg = sum(second_half) / len(second_half) if second_half else 5

    diff = second_avg - first_avg

    if diff > 1:
        return "ascending"
    elif diff < -1:
        return "descending"
    elif abs(diff) > 0.5:
        return "transforming"
    return "stable"


def _generate_insights(
    layers: dict[str, Any],
    daily_data: list[dict[str, Any]],
    weekly_data: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Generate quantum insights from analysis."""
    insights = []

    # Layer-based insights
    for layer_name, layer_data in layers.items():
        coherence = layer_data["coherence"]
        layer_info = LAYER_NAMES.get(layer_name, (layer_name, ""))

        if coherence < 0.4:
            insights.append({
                "id": f"insight-{layer_name}-warning",
                "type": "warning",
                "title": f"{layer_info[0]} Needs Attention",
                "content": f"Your {layer_info[1]} shows signs of imbalance.",
                "voice_narration": f"I notice your {layer_info[1]} needs some care. {layer_data['dominant_pattern']}. Let's work on bringing more balance here.",
                "confidence": 0.7,
                "layer": layer_name,
                "actionable": True,
                "priority": "high"
            })
        elif coherence > 0.7:
            insights.append({
                "id": f"insight-{layer_name}-strength",
                "type": "encouragement",
                "title": f"Strong {layer_info[0]}",
                "content": f"Your {layer_info[1]} is showing excellent coherence.",
                "voice_narration": f"Your {layer_info[1]} is flourishing. {layer_data['dominant_pattern']}. This is a wonderful foundation.",
                "confidence": 0.8,
                "layer": layer_name,
                "actionable": False,
                "priority": "low"
            })

    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    insights.sort(key=lambda x: priority_order.get(x["priority"], 1))

    return insights[:5]


def _get_wisdom_recommendations(layers: dict[str, Any]) -> list[dict[str, Any]]:
    """Get Gita wisdom recommendations based on analysis."""
    recommendations = []

    # Find layers needing attention
    sorted_layers = sorted(layers.items(), key=lambda x: x[1]["coherence"])

    for layer_name, _ in sorted_layers[:2]:
        verses = LAYER_GITA_VERSES.get(layer_name, [])
        if verses:
            v = verses[0]
            recommendations.append({
                "verse_id": v["verse_id"],
                "chapter": v["chapter"],
                "verse": v["verse"],
                "translation": v["translation"],
                "relevance": v["relevance"],
                "layer": layer_name,
                "application_guide": v["application_guide"],
                "voice_intro": v["voice_intro"]
            })

    return recommendations


def _get_practice_recommendations(layers: dict[str, Any]) -> list[dict[str, Any]]:
    """Get practice recommendations based on analysis."""
    recommendations = []

    # Find layers needing work
    layers_needing_work = [
        (name, data) for name, data in layers.items()
        if data["coherence"] < 0.6
    ]
    layers_needing_work.sort(key=lambda x: x[1]["coherence"])

    for layer_name, _ in layers_needing_work[:2]:
        practices = LAYER_PRACTICES.get(layer_name, [])
        if practices:
            p = practices[0]
            recommendations.append({
                "id": p["id"],
                "name": p["name"],
                "description": p["description"],
                "duration": p["duration"],
                "frequency": p["frequency"],
                "target_layer": layer_name,
                "expected_benefit": p["expected_benefit"],
                "voice_guidance": p["voice_guidance"]
            })

    return recommendations


def _detect_temporal_patterns(
    daily_data: list[dict[str, Any]],
    weekly_data: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Detect patterns across time."""
    patterns = []

    # Weekly wellbeing trend
    weekly_scores = [
        w.get("wellbeing_score") for w in weekly_data
        if w.get("wellbeing_score") is not None
    ]

    if len(weekly_scores) >= 2:
        trend = _determine_evolution_trend(daily_data, weekly_data)
        patterns.append({
            "id": "weekly-wellbeing",
            "name": "Weekly Wellbeing Pattern",
            "description": f"Your wellbeing has been {trend} over recent weeks",
            "frequency": "weekly",
            "strength": 0.7,
            "trend": trend
        })

    # Recurring concerns
    concerns = [c for d in daily_data for c in d.get("concerns", [])]
    concern_counts: dict[str, int] = {}
    for concern in concerns:
        key = concern.lower()
        concern_counts[key] = concern_counts.get(key, 0) + 1

    for concern, count in sorted(concern_counts.items(), key=lambda x: -x[1])[:2]:
        if count >= 2:
            patterns.append({
                "id": f"concern-{concern.replace(' ', '-')}",
                "name": f"Recurring: {concern}",
                "description": f"{concern} has appeared {count} times",
                "frequency": "sporadic",
                "strength": min(1, count / 5),
                "trend": "stable"
            })

    return patterns


def _generate_signature(layers: dict[str, Any], coherence: int) -> str:
    """Generate a unique consciousness signature."""
    avg_coherence = sum(l["coherence"] for l in layers.values()) / len(layers)

    if avg_coherence > 0.7:
        return f"Quantum Coherent ({coherence})"
    elif avg_coherence > 0.5:
        return f"Integrating Wave ({coherence})"
    elif avg_coherence > 0.3:
        return f"Emerging Light ({coherence})"
    return f"Awakening Seed ({coherence})"


def _generate_voice_summary(analysis: dict[str, Any]) -> str:
    """Generate voice-optimized summary."""
    lines = []

    coherence = analysis["overall_coherence"]
    trend = analysis["evolution_trend"]

    lines.append(f"Your Quantum Dive is complete. Your overall coherence score is {coherence} out of 100.")

    trend_descriptions = {
        "ascending": "Your consciousness is on an ascending path, showing positive growth.",
        "stable": "Your state is stable, providing a solid foundation for deeper work.",
        "descending": "You may be experiencing some challenges. This is an opportunity for transformation.",
        "transforming": "You are in a period of transformation. Change is happening at deep levels."
    }
    lines.append(trend_descriptions.get(trend, trend_descriptions["stable"]))

    # Top insight
    insights = analysis.get("insights", [])
    if insights:
        lines.append(insights[0].get("voice_narration", ""))

    # Practice recommendation
    practices = analysis.get("practice_recommendations", [])
    if practices:
        lines.append(f"My recommendation: {practices[0].get('voice_guidance', '')}")

    lines.append("Remember, this journey is yours. Each moment of awareness is a step toward greater coherence.")

    return " ".join(lines)


async def _get_layer_analysis_from_kiaan(
    layer: str,
    state: dict[str, Any],
    user_id: str,
    db: AsyncSession
) -> str:
    """Get detailed layer analysis from KIAAN Core."""
    layer_name, layer_desc = LAYER_NAMES.get(layer, (layer, ""))

    prompt = f"""Analyze the user's {layer_name} ({layer_desc}) based on this state:
    - Coherence: {state['coherence']:.2f}
    - Dominant Pattern: {state['dominant_pattern']}
    - Blocked by: {', '.join(state.get('blocked_by', [])) or 'None identified'}
    - Supported by: {', '.join(state.get('supported_by', [])) or 'General awareness'}

    Provide a brief, compassionate analysis (2-3 sentences) with practical guidance."""

    try:
        response = await kiaan_core.get_kiaan_response(
            message=prompt,
            user_id=user_id,
            db=db,
            context="quantum_dive_layer_analysis"
        )
        return response.get("response", f"Your {layer_name} shows {state['dominant_pattern']}.")
    except Exception:
        return f"Your {layer_name} shows {state['dominant_pattern']}. Consider practices that support this layer."


def _generate_layer_voice_narration(
    layer: str,
    layer_name: str,
    state: dict[str, Any],
    detailed_analysis: str
) -> str:
    """Generate voice narration for layer deep dive."""
    coherence_percent = int(state["coherence"] * 100)

    lines = [
        f"Let us explore {layer_name} more deeply.",
        f"Your {layer_name} shows {coherence_percent} percent coherence.",
        f"The dominant pattern here is: {state['dominant_pattern']}.",
        detailed_analysis
    ]

    if state.get("blocked_by"):
        lines.append(f"Some obstacles here may include: {', '.join(state['blocked_by'])}.")

    if state.get("supported_by"):
        lines.append(f"What's supporting this layer: {', '.join(state['supported_by'])}.")

    return " ".join(lines)
