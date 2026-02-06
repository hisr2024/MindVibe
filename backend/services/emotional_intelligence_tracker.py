"""
Longitudinal Emotional Intelligence Tracker

A system for tracking emotional patterns, resilience, and growth over time.
Integrates with the Mood Analytics Engine to provide:

1. Emotional Baseline Detection
2. Resilience Score Tracking
3. Trigger Pattern Analysis
4. Growth Trajectory Visualization
5. Guna Balance Evolution

This enables personalized interventions that evolve with the user's journey.

Research foundations:
- Emotional Intelligence (Goleman, 1995)
- Resilience factors (Masten, 2001)
- Psychological flexibility (Hayes, ACT)
"""

import datetime
import logging
import statistics
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import EmotionalResetSession, Mood, JournalEntry
from backend.services.mood_analytics_engine import (
    EmotionVector,
    EmotionalQuadrant,
    Guna,
    MoodAnalysis,
    mood_analytics,
)

logger = logging.getLogger(__name__)


# =============================================================================
# DATA STRUCTURES
# =============================================================================

@dataclass
class EmotionalBaseline:
    """
    User's baseline emotional state calculated from historical data.

    The baseline represents the user's "resting" emotional state -
    what they typically return to after emotional events.
    """
    # Average position on valence-arousal grid
    mean_valence: float = 0.0
    mean_arousal: float = 0.0

    # Standard deviations (variability)
    valence_variability: float = 0.3
    arousal_variability: float = 0.3

    # Typical quadrant
    primary_quadrant: EmotionalQuadrant = EmotionalQuadrant.DEACTIVATED_PLEASANT

    # Guna tendencies
    typical_guna_balance: dict[str, float] = field(default_factory=dict)

    # Data quality
    data_points: int = 0
    confidence: float = 0.5
    last_updated: datetime.datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "mean_valence": round(self.mean_valence, 3),
            "mean_arousal": round(self.mean_arousal, 3),
            "valence_variability": round(self.valence_variability, 3),
            "arousal_variability": round(self.arousal_variability, 3),
            "primary_quadrant": self.primary_quadrant.value,
            "typical_guna_balance": {
                k: round(v, 2) for k, v in self.typical_guna_balance.items()
            },
            "data_points": self.data_points,
            "confidence": round(self.confidence, 2),
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }


@dataclass
class ResilienceMetrics:
    """
    User's emotional resilience metrics.

    Resilience = ability to recover from emotional disturbances
    and return to baseline.
    """
    # Recovery metrics
    average_recovery_time_hours: float = 24.0  # Time to return to baseline
    recovery_consistency: float = 0.5  # How consistent recovery is (0-1)

    # Bounce-back patterns
    positive_reframe_rate: float = 0.5  # How often they find silver linings
    emotional_regulation_score: float = 0.5  # Self-regulation ability

    # Growth indicators
    expanding_emotional_range: bool = False  # More positive experiences over time
    decreasing_distortion_frequency: bool = False  # Fewer cognitive distortions
    improving_guna_balance: bool = False  # Movement toward Sattva

    # Overall score (0-100)
    resilience_score: float = 50.0

    # Trend
    trend: str = "stable"  # improving, stable, declining

    def to_dict(self) -> dict[str, Any]:
        return {
            "average_recovery_time_hours": round(self.average_recovery_time_hours, 1),
            "recovery_consistency": round(self.recovery_consistency, 2),
            "positive_reframe_rate": round(self.positive_reframe_rate, 2),
            "emotional_regulation_score": round(self.emotional_regulation_score, 2),
            "expanding_emotional_range": self.expanding_emotional_range,
            "decreasing_distortion_frequency": self.decreasing_distortion_frequency,
            "improving_guna_balance": self.improving_guna_balance,
            "resilience_score": round(self.resilience_score, 1),
            "trend": self.trend,
        }


@dataclass
class TriggerPattern:
    """
    A recognized emotional trigger pattern.

    Triggers are situations/contexts that consistently lead to
    specific emotional responses.
    """
    trigger_description: str
    trigger_domain: str  # work, relationships, health, etc.
    resulting_emotions: list[str] = field(default_factory=list)
    average_intensity: float = 0.5
    frequency: int = 0  # How many times observed
    first_observed: datetime.datetime | None = None
    last_observed: datetime.datetime | None = None
    associated_distortions: list[str] = field(default_factory=list)

    # Intervention effectiveness
    successful_interventions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "trigger_description": self.trigger_description,
            "trigger_domain": self.trigger_domain,
            "resulting_emotions": self.resulting_emotions,
            "average_intensity": round(self.average_intensity, 2),
            "frequency": self.frequency,
            "first_observed": self.first_observed.isoformat() if self.first_observed else None,
            "last_observed": self.last_observed.isoformat() if self.last_observed else None,
            "associated_distortions": self.associated_distortions,
            "successful_interventions": self.successful_interventions,
        }


@dataclass
class GrowthMilestone:
    """
    A recognized milestone in emotional growth.
    """
    milestone_type: str
    description: str
    achieved_at: datetime.datetime
    significance: float  # 0-1

    def to_dict(self) -> dict[str, Any]:
        return {
            "milestone_type": self.milestone_type,
            "description": self.description,
            "achieved_at": self.achieved_at.isoformat(),
            "significance": round(self.significance, 2),
        }


@dataclass
class EmotionalIntelligenceProfile:
    """
    Complete emotional intelligence profile for a user.
    """
    user_id: str
    baseline: EmotionalBaseline
    resilience: ResilienceMetrics
    trigger_patterns: list[TriggerPattern] = field(default_factory=list)
    growth_milestones: list[GrowthMilestone] = field(default_factory=list)

    # Historical data
    emotional_journey_summary: str = ""
    days_tracked: int = 0
    total_sessions: int = 0

    # Recommendations
    focus_areas: list[str] = field(default_factory=list)
    recommended_practices: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "user_id": self.user_id,
            "baseline": self.baseline.to_dict(),
            "resilience": self.resilience.to_dict(),
            "trigger_patterns": [t.to_dict() for t in self.trigger_patterns[:5]],
            "growth_milestones": [m.to_dict() for m in self.growth_milestones[-5:]],
            "emotional_journey_summary": self.emotional_journey_summary,
            "days_tracked": self.days_tracked,
            "total_sessions": self.total_sessions,
            "focus_areas": self.focus_areas,
            "recommended_practices": self.recommended_practices,
        }


# =============================================================================
# EMOTIONAL INTELLIGENCE TRACKER
# =============================================================================

class EmotionalIntelligenceTracker:
    """
    Tracks and analyzes emotional patterns over time.

    Uses historical session data to:
    1. Establish baseline emotional state
    2. Track resilience and recovery patterns
    3. Identify recurring triggers
    4. Measure emotional growth
    5. Provide personalized recommendations
    """

    # Minimum data requirements
    MIN_SESSIONS_FOR_BASELINE = 3
    MIN_SESSIONS_FOR_RESILIENCE = 5
    MIN_OCCURRENCES_FOR_PATTERN = 2

    def __init__(self) -> None:
        """Initialize the tracker."""
        self._analytics = mood_analytics
        logger.info("EmotionalIntelligenceTracker initialized")

    async def build_profile(
        self,
        db: AsyncSession,
        user_id: str,
        lookback_days: int = 90
    ) -> EmotionalIntelligenceProfile:
        """
        Build complete emotional intelligence profile for a user.

        Args:
            db: Database session
            user_id: User identifier
            lookback_days: How many days of history to analyze

        Returns:
            Complete EmotionalIntelligenceProfile
        """
        # Fetch historical data
        sessions = await self._fetch_sessions(db, user_id, lookback_days)
        moods = await self._fetch_mood_entries(db, user_id, lookback_days)

        # Calculate baseline
        baseline = self._calculate_baseline(sessions, moods)

        # Calculate resilience
        resilience = self._calculate_resilience(sessions, moods, baseline)

        # Identify trigger patterns
        triggers = self._identify_trigger_patterns(sessions)

        # Find growth milestones
        milestones = self._find_growth_milestones(sessions, baseline)

        # Generate summary
        summary = self._generate_journey_summary(
            sessions, baseline, resilience, triggers, milestones
        )

        # Generate recommendations
        focus_areas = self._identify_focus_areas(baseline, resilience, triggers)
        practices = self._recommend_practices(focus_areas, baseline)

        # Count metrics
        first_session = sessions[0] if sessions else None
        last_session = sessions[-1] if sessions else None
        days = 0
        if first_session and last_session:
            first_date = first_session.get("created_at")
            last_date = last_session.get("created_at")
            if first_date and last_date:
                days = (last_date - first_date).days + 1

        return EmotionalIntelligenceProfile(
            user_id=user_id,
            baseline=baseline,
            resilience=resilience,
            trigger_patterns=triggers,
            growth_milestones=milestones,
            emotional_journey_summary=summary,
            days_tracked=days,
            total_sessions=len(sessions),
            focus_areas=focus_areas,
            recommended_practices=practices,
        )

    async def _fetch_sessions(
        self,
        db: AsyncSession,
        user_id: str,
        days: int
    ) -> list[dict[str, Any]]:
        """Fetch emotional reset sessions for user."""
        cutoff = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=days)

        result = await db.execute(
            select(EmotionalResetSession)
            .where(
                and_(
                    EmotionalResetSession.user_id == user_id,
                    EmotionalResetSession.created_at >= cutoff,
                    EmotionalResetSession.deleted_at.is_(None),
                )
            )
            .order_by(EmotionalResetSession.created_at)
        )

        sessions = []
        for session in result.scalars().all():
            sessions.append({
                "id": session.id,
                "created_at": session.created_at,
                "completed": session.completed,
                "emotions_input": session.emotions_input,
                "assessment_data": session.assessment_data,
                "affirmations": session.affirmations,
            })

        return sessions

    async def _fetch_mood_entries(
        self,
        db: AsyncSession,
        user_id: str,
        days: int
    ) -> list[dict[str, Any]]:
        """Fetch mood entries for user."""
        cutoff = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=days)

        try:
            result = await db.execute(
                select(Mood)
                .where(
                    and_(
                        Mood.user_id == user_id,
                        Mood.at >= cutoff,
                    )
                )
                .order_by(Mood.at)
            )

            moods = []
            for entry in result.scalars().all():
                moods.append({
                    "id": entry.id,
                    "created_at": entry.created_at,
                    "mood_score": getattr(entry, "mood_score", None),
                    "energy_level": getattr(entry, "energy_level", None),
                    "notes": getattr(entry, "notes", None),
                })

            return moods
        except Exception as e:
            logger.warning(f"Could not fetch mood entries: {e}")
            return []

    def _calculate_baseline(
        self,
        sessions: list[dict[str, Any]],
        moods: list[dict[str, Any]]
    ) -> EmotionalBaseline:
        """Calculate emotional baseline from historical data."""
        if len(sessions) < self.MIN_SESSIONS_FOR_BASELINE:
            return EmotionalBaseline(confidence=0.3, data_points=len(sessions))

        valences = []
        arousals = []
        guna_totals: dict[str, float] = {"sattva": 0, "rajas": 0, "tamas": 0}

        for session in sessions:
            if session.get("emotions_input"):
                analysis = self._analytics.analyze(session["emotions_input"])
                valences.append(analysis.emotion_vector.valence)
                arousals.append(analysis.emotion_vector.arousal)

                for guna, value in analysis.guna_balance.items():
                    guna_totals[guna] = guna_totals.get(guna, 0) + value

        if not valences:
            return EmotionalBaseline(confidence=0.3, data_points=len(sessions))

        # Calculate means
        mean_valence = statistics.mean(valences)
        mean_arousal = statistics.mean(arousals)

        # Calculate variability
        valence_var = statistics.stdev(valences) if len(valences) > 1 else 0.3
        arousal_var = statistics.stdev(arousals) if len(arousals) > 1 else 0.3

        # Determine primary quadrant
        quadrant = self._determine_quadrant(mean_valence, mean_arousal)

        # Normalize guna balance
        total_guna = sum(guna_totals.values())
        guna_balance = {}
        if total_guna > 0:
            for guna, value in guna_totals.items():
                guna_balance[guna] = value / total_guna

        # Calculate confidence based on data quantity
        confidence = min(0.5 + (len(sessions) * 0.05), 0.95)

        return EmotionalBaseline(
            mean_valence=mean_valence,
            mean_arousal=mean_arousal,
            valence_variability=valence_var,
            arousal_variability=arousal_var,
            primary_quadrant=quadrant,
            typical_guna_balance=guna_balance,
            data_points=len(sessions),
            confidence=confidence,
            last_updated=datetime.datetime.now(datetime.UTC),
        )

    def _determine_quadrant(
        self, valence: float, arousal: float
    ) -> EmotionalQuadrant:
        """Determine quadrant from valence and arousal."""
        if arousal >= 0:
            if valence >= 0:
                return EmotionalQuadrant.ACTIVATED_PLEASANT
            else:
                return EmotionalQuadrant.ACTIVATED_UNPLEASANT
        else:
            if valence >= 0:
                return EmotionalQuadrant.DEACTIVATED_PLEASANT
            else:
                return EmotionalQuadrant.DEACTIVATED_UNPLEASANT

    def _calculate_resilience(
        self,
        sessions: list[dict[str, Any]],
        moods: list[dict[str, Any]],
        baseline: EmotionalBaseline
    ) -> ResilienceMetrics:
        """Calculate resilience metrics from patterns."""
        if len(sessions) < self.MIN_SESSIONS_FOR_RESILIENCE:
            return ResilienceMetrics()

        # Analyze emotional trajectories
        recovery_times = []
        positive_reframes = 0
        regulation_scores = []

        prev_session = None
        for session in sessions:
            if not session.get("emotions_input"):
                continue

            analysis = self._analytics.analyze(session["emotions_input"])

            # Check for positive reframing (affirmations accepted/generated)
            if session.get("affirmations") and len(session.get("affirmations", [])) > 0:
                positive_reframes += 1

            # Check emotional regulation (completing session = regulation)
            if session.get("completed"):
                regulation_scores.append(1.0)
            else:
                regulation_scores.append(0.5)

            # Calculate recovery time (if previous session was negative)
            if prev_session:
                prev_analysis = self._analytics.analyze(
                    prev_session.get("emotions_input", "")
                )
                if prev_analysis.emotion_vector.valence < -0.3:
                    if analysis.emotion_vector.valence > -0.1:
                        # Recovery detected
                        time_diff = (
                            session["created_at"] - prev_session["created_at"]
                        ).total_seconds() / 3600  # hours
                        recovery_times.append(min(time_diff, 168))  # Cap at 1 week

            prev_session = session

        # Calculate averages
        avg_recovery = (
            statistics.mean(recovery_times) if recovery_times else 24.0
        )
        recovery_consistency = (
            1 - (statistics.stdev(recovery_times) / 48)
            if len(recovery_times) > 1
            else 0.5
        )
        recovery_consistency = max(0, min(1, recovery_consistency))

        positive_rate = positive_reframes / len(sessions) if sessions else 0.5
        regulation = statistics.mean(regulation_scores) if regulation_scores else 0.5

        # Check for growth trends
        if len(sessions) >= 10:
            first_half = sessions[:len(sessions)//2]
            second_half = sessions[len(sessions)//2:]

            first_valences = [
                self._analytics.analyze(s.get("emotions_input", "")).emotion_vector.valence
                for s in first_half if s.get("emotions_input")
            ]
            second_valences = [
                self._analytics.analyze(s.get("emotions_input", "")).emotion_vector.valence
                for s in second_half if s.get("emotions_input")
            ]

            expanding_range = (
                statistics.mean(second_valences) > statistics.mean(first_valences)
                if first_valences and second_valences
                else False
            )
        else:
            expanding_range = False

        # Calculate overall resilience score
        resilience_score = (
            (1 - min(avg_recovery / 48, 1)) * 25 +  # Faster recovery = higher score
            recovery_consistency * 25 +
            positive_rate * 25 +
            regulation * 25
        )

        # Determine trend
        if len(sessions) >= 10:
            trend = "improving" if expanding_range else "stable"
        else:
            trend = "insufficient_data"

        return ResilienceMetrics(
            average_recovery_time_hours=avg_recovery,
            recovery_consistency=recovery_consistency,
            positive_reframe_rate=positive_rate,
            emotional_regulation_score=regulation,
            expanding_emotional_range=expanding_range,
            decreasing_distortion_frequency=False,  # Would need more data
            improving_guna_balance=expanding_range,
            resilience_score=resilience_score,
            trend=trend,
        )

    def _identify_trigger_patterns(
        self,
        sessions: list[dict[str, Any]]
    ) -> list[TriggerPattern]:
        """Identify recurring emotional trigger patterns."""
        patterns: dict[str, TriggerPattern] = {}

        for session in sessions:
            if not session.get("emotions_input"):
                continue

            analysis = self._analytics.analyze(session["emotions_input"])

            # Group by domain + primary emotion
            for domain in analysis.life_domains:
                key = f"{domain}_{analysis.primary_emotion}"

                if key not in patterns:
                    patterns[key] = TriggerPattern(
                        trigger_description=f"{domain.replace('_', ' ').title()} situations leading to {analysis.primary_emotion}",
                        trigger_domain=domain,
                        resulting_emotions=[analysis.primary_emotion],
                        average_intensity=analysis.emotion_vector.intensity,
                        frequency=1,
                        first_observed=session["created_at"],
                        last_observed=session["created_at"],
                        associated_distortions=[d.value for d in analysis.distortions_detected],
                    )
                else:
                    p = patterns[key]
                    p.frequency += 1
                    p.last_observed = session["created_at"]
                    p.average_intensity = (
                        p.average_intensity * (p.frequency - 1) +
                        analysis.emotion_vector.intensity
                    ) / p.frequency

                    # Add new emotions
                    for emotion in [analysis.primary_emotion] + analysis.secondary_emotions:
                        if emotion not in p.resulting_emotions:
                            p.resulting_emotions.append(emotion)

                    # Add new distortions
                    for d in analysis.distortions_detected:
                        if d.value not in p.associated_distortions:
                            p.associated_distortions.append(d.value)

        # Filter to patterns with minimum occurrences
        significant_patterns = [
            p for p in patterns.values()
            if p.frequency >= self.MIN_OCCURRENCES_FOR_PATTERN
        ]

        # Sort by frequency
        significant_patterns.sort(key=lambda p: p.frequency, reverse=True)

        return significant_patterns[:10]  # Return top 10

    def _find_growth_milestones(
        self,
        sessions: list[dict[str, Any]],
        baseline: EmotionalBaseline
    ) -> list[GrowthMilestone]:
        """Find and recognize growth milestones."""
        milestones = []

        # First session
        if sessions:
            milestones.append(GrowthMilestone(
                milestone_type="first_session",
                description="Took the first step on your emotional wellness journey",
                achieved_at=sessions[0]["created_at"],
                significance=0.7,
            ))

        # Session count milestones
        session_milestones = {
            5: "Established a practice of emotional reflection",
            10: "Deepening emotional awareness through consistent practice",
            25: "Emotional reset has become a meaningful habit",
            50: "Demonstrated strong commitment to emotional growth",
            100: "Mastering the art of emotional reset",
        }

        for count, description in session_milestones.items():
            if len(sessions) >= count:
                milestones.append(GrowthMilestone(
                    milestone_type=f"sessions_{count}",
                    description=description,
                    achieved_at=sessions[count-1]["created_at"],
                    significance=min(0.5 + (count / 100), 0.9),
                ))

        # Consecutive completion streak
        streak = 0
        max_streak = 0
        streak_end_session = None

        for session in sessions:
            if session.get("completed"):
                streak += 1
                if streak > max_streak:
                    max_streak = streak
                    streak_end_session = session
            else:
                streak = 0

        if max_streak >= 3:
            milestones.append(GrowthMilestone(
                milestone_type="streak",
                description=f"Completed {max_streak} sessions in a row",
                achieved_at=streak_end_session["created_at"] if streak_end_session else datetime.datetime.now(datetime.UTC),
                significance=min(0.5 + (max_streak / 20), 0.8),
            ))

        # Sort by date
        milestones.sort(key=lambda m: m.achieved_at)

        return milestones

    def _generate_journey_summary(
        self,
        sessions: list[dict[str, Any]],
        baseline: EmotionalBaseline,
        resilience: ResilienceMetrics,
        triggers: list[TriggerPattern],
        milestones: list[GrowthMilestone]
    ) -> str:
        """Generate narrative summary of emotional journey."""
        if not sessions:
            return "Your emotional wellness journey awaits. Begin your first session to start tracking your growth."

        parts = []

        # Session overview
        completed = sum(1 for s in sessions if s.get("completed"))
        parts.append(
            f"You've engaged in {len(sessions)} emotional reset sessions, "
            f"completing {completed} of them."
        )

        # Baseline insight
        quadrant_descriptions = {
            EmotionalQuadrant.ACTIVATED_PLEASANT: "generally energized and positive",
            EmotionalQuadrant.ACTIVATED_UNPLEASANT: "often experiencing heightened stress or anxiety",
            EmotionalQuadrant.DEACTIVATED_PLEASANT: "typically calm and content",
            EmotionalQuadrant.DEACTIVATED_UNPLEASANT: "sometimes struggling with low energy or mood",
        }
        parts.append(
            f"Your baseline emotional state tends toward being "
            f"{quadrant_descriptions.get(baseline.primary_quadrant, 'balanced')}."
        )

        # Resilience insight
        if resilience.resilience_score > 70:
            parts.append(
                "You show strong emotional resilience, recovering well from difficult emotions."
            )
        elif resilience.resilience_score > 50:
            parts.append(
                "Your emotional resilience is developing. Each session strengthens your recovery ability."
            )
        else:
            parts.append(
                "Building resilience takes time. Focus on completing sessions and practicing the techniques."
            )

        # Trigger insight
        if triggers:
            top_trigger = triggers[0]
            parts.append(
                f"A pattern worth noting: {top_trigger.trigger_domain.replace('_', ' ')} "
                f"situations tend to trigger {', '.join(top_trigger.resulting_emotions[:2])}."
            )

        # Encouragement
        parts.append(
            "Remember: awareness is the first step to transformation. "
            "You're already on the path."
        )

        return " ".join(parts)

    def _identify_focus_areas(
        self,
        baseline: EmotionalBaseline,
        resilience: ResilienceMetrics,
        triggers: list[TriggerPattern]
    ) -> list[str]:
        """Identify areas to focus on for growth."""
        focus = []

        # Based on baseline
        if baseline.typical_guna_balance.get("tamas", 0) > 0.4:
            focus.append("Building energy and motivation through action")
        if baseline.typical_guna_balance.get("rajas", 0) > 0.5:
            focus.append("Cultivating stillness and equanimity")

        # Based on resilience
        if resilience.average_recovery_time_hours > 48:
            focus.append("Strengthening emotional recovery speed")
        if resilience.positive_reframe_rate < 0.5:
            focus.append("Developing positive reframing skills")

        # Based on triggers
        if triggers:
            top_domain = triggers[0].trigger_domain
            focus.append(f"Working with {top_domain.replace('_', ' ')} challenges")

        return focus[:3]  # Top 3 focus areas

    def _recommend_practices(
        self,
        focus_areas: list[str],
        baseline: EmotionalBaseline
    ) -> list[str]:
        """Recommend specific practices based on focus areas."""
        practices = []

        # Universal practices
        practices.append("Daily 5-minute breathing practice (morning or evening)")

        # Based on guna balance
        if baseline.typical_guna_balance.get("tamas", 0) > 0.4:
            practices.append("Start each day with one small completed task (Karma Yoga)")
        if baseline.typical_guna_balance.get("rajas", 0) > 0.5:
            practices.append("Evening stillness practice: 10 minutes without devices")

        # Based on quadrant
        if baseline.primary_quadrant == EmotionalQuadrant.ACTIVATED_UNPLEASANT:
            practices.append("Extended exhale breathing when stress arises (4-4-6-2)")
        if baseline.primary_quadrant == EmotionalQuadrant.DEACTIVATED_UNPLEASANT:
            practices.append("Energizing morning routine: movement + gratitude list")

        return practices[:4]

    async def get_current_deviation(
        self,
        db: AsyncSession,
        user_id: str,
        current_text: str
    ) -> dict[str, Any]:
        """
        Compare current emotional state to baseline.

        Useful for showing users how far they are from their normal state.
        """
        # Get baseline
        profile = await self.build_profile(db, user_id)
        baseline = profile.baseline

        # Analyze current
        current = self._analytics.analyze(current_text)

        # Calculate deviation
        valence_diff = current.emotion_vector.valence - baseline.mean_valence
        arousal_diff = current.emotion_vector.arousal - baseline.mean_arousal

        # Calculate distance from baseline
        distance = (valence_diff**2 + arousal_diff**2) ** 0.5

        # Determine direction
        if valence_diff > 0.1:
            valence_direction = "more positive"
        elif valence_diff < -0.1:
            valence_direction = "more negative"
        else:
            valence_direction = "similar to baseline"

        if arousal_diff > 0.1:
            arousal_direction = "more activated"
        elif arousal_diff < -0.1:
            arousal_direction = "more calm"
        else:
            arousal_direction = "similar to baseline"

        return {
            "current_valence": current.emotion_vector.valence,
            "current_arousal": current.emotion_vector.arousal,
            "baseline_valence": baseline.mean_valence,
            "baseline_arousal": baseline.mean_arousal,
            "valence_deviation": valence_diff,
            "arousal_deviation": arousal_diff,
            "distance_from_baseline": distance,
            "valence_direction": valence_direction,
            "arousal_direction": arousal_direction,
            "is_significantly_different": distance > 0.3,
            "baseline_confidence": baseline.confidence,
        }


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

emotional_intelligence_tracker = EmotionalIntelligenceTracker()
