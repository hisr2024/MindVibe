"""
Emotional Pattern Extraction Engine

Extracts structured emotional signals from recent user interactions for use
by the KIAAN companion system. Produces privacy-preserving, abstract pattern
summaries that never quote users or store identifying details.

Design principles:
- Summarize patterns abstractly — never quote the user.
- Never store personal details, names, locations, or specific events.
- Avoid clinical diagnostic language and therapeutic scoring.
- Avoid moral judgment.
- Focus on: recurring emotional themes, attachment patterns, reactivity
  triggers, growth signals, and signs of increasing awareness.
- Returns ONLY valid JSON-serializable structures.

Data sources:
- CompanionMessage (user role messages with detected moods)
- EmotionalResetSession (guided reset sessions with emotions input)
- Mood (point-in-time mood captures with scores and tags)
- UserEmotionalLog (daily emotional check-ins)

Integration:
- Uses MoodAnalytics engine for emotion vector analysis
- Uses DomainMapper for theme classification
- Integrates with AI provider for deeper pattern synthesis (optional)
- Caches results in Redis with user-scoped TTL
"""

from __future__ import annotations

import datetime
import logging
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    CompanionMessage,
    EmotionalResetSession,
    Mood,
    UserEmotionalLog,
)
from backend.services.mood_analytics_engine import mood_analytics
from backend.services.domain_mapper import DomainMapper

logger = logging.getLogger(__name__)


# =============================================================================
# DATA STRUCTURES
# =============================================================================


@dataclass
class EmotionalTheme:
    """A recurring emotional theme observed across interactions.

    Described abstractly without quoting or identifying the user.
    """

    theme: str
    frequency: int
    intensity_trend: str  # "stable", "increasing", "decreasing"
    associated_domains: list[str] = field(default_factory=list)
    guna_tendency: str = "balanced"  # "sattva", "rajas", "tamas", "balanced"

    def to_dict(self) -> dict[str, Any]:
        return {
            "theme": self.theme,
            "frequency": self.frequency,
            "intensity_trend": self.intensity_trend,
            "associated_domains": self.associated_domains,
            "guna_tendency": self.guna_tendency,
        }


@dataclass
class AttachmentSignal:
    """An observed attachment pattern expressed abstractly.

    No diagnostic labels or clinical terminology.
    """

    pattern: str
    direction: str  # "seeking", "avoiding", "ambivalent"
    strength: str  # "mild", "moderate", "strong"
    evolving: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "pattern": self.pattern,
            "direction": self.direction,
            "strength": self.strength,
            "evolving": self.evolving,
        }


@dataclass
class ReactivityTrigger:
    """A situational context that consistently elevates emotional intensity.

    Described in abstract domain terms without specific event details.
    """

    domain: str
    emotional_response: str
    recurrence: int
    intensity_level: str  # "low", "moderate", "high"

    def to_dict(self) -> dict[str, Any]:
        return {
            "domain": self.domain,
            "emotional_response": self.emotional_response,
            "recurrence": self.recurrence,
            "intensity_level": self.intensity_level,
        }


@dataclass
class GrowthSignal:
    """An indicator of emotional growth or developing self-awareness."""

    signal_type: str
    description: str
    first_observed_period: str  # "recent", "mid-range", "early"

    def to_dict(self) -> dict[str, Any]:
        return {
            "signal_type": self.signal_type,
            "description": self.description,
            "first_observed_period": self.first_observed_period,
        }


@dataclass
class EmotionalPatternReport:
    """Complete emotional pattern extraction result.

    Privacy-preserving summary of emotional signals suitable for
    guiding KIAAN responses without exposing user content.

    Output schema:
        recurring_themes: []
        reactivity_triggers: []
        attachment_patterns: []
        growth_signals: []
        emotional_intensity_estimate: "low" | "medium" | "high"
        self_awareness_level_estimate: "emerging" | "moderate" | "strong"
    """

    recurring_themes: list[EmotionalTheme] = field(default_factory=list)
    reactivity_triggers: list[ReactivityTrigger] = field(default_factory=list)
    attachment_patterns: list[AttachmentSignal] = field(default_factory=list)
    growth_signals: list[GrowthSignal] = field(default_factory=list)
    emotional_intensity_estimate: str = "medium"  # "low", "medium", "high"
    self_awareness_level_estimate: str = "emerging"  # "emerging", "moderate", "strong"

    def to_dict(self) -> dict[str, Any]:
        return {
            "recurring_themes": [t.to_dict() for t in self.recurring_themes],
            "reactivity_triggers": [r.to_dict() for r in self.reactivity_triggers],
            "attachment_patterns": [a.to_dict() for a in self.attachment_patterns],
            "growth_signals": [g.to_dict() for g in self.growth_signals],
            "emotional_intensity_estimate": self.emotional_intensity_estimate,
            "self_awareness_level_estimate": self.self_awareness_level_estimate,
        }


# =============================================================================
# EMOTIONAL PATTERN EXTRACTION ENGINE
# =============================================================================


# Abstract emotion labels used for theme classification.
# These avoid clinical terms and map raw mood detections to gentler categories.
_EMOTION_ABSTRACTIONS: dict[str, str] = {
    # Activated unpleasant
    "angry": "inner friction",
    "frustrated": "inner friction",
    "anxious": "unsettledness",
    "stressed": "unsettledness",
    "overwhelmed": "overwhelm",
    "fearful": "apprehension",
    # Deactivated unpleasant
    "sad": "heaviness",
    "lonely": "sense of isolation",
    "hurt": "emotional tenderness",
    "guilty": "self-directed tension",
    "jealous": "comparison-driven discomfort",
    # Activated pleasant
    "excited": "rising energy",
    "happy": "lightness",
    "hopeful": "forward-looking openness",
    "grateful": "appreciative awareness",
    # Deactivated pleasant
    "peaceful": "inner stillness",
    "calm": "inner stillness",
    # Neutral
    "neutral": "emotional steadiness",
    "confused": "seeking clarity",
}

# Attachment-related keyword clusters detected in mood tags and emotional states.
_ATTACHMENT_CLUSTERS: dict[str, dict[str, Any]] = {
    "connection_seeking": {
        "indicators": ["lonely", "hurt", "jealous", "sad"],
        "direction": "seeking",
        "description": "pattern of reaching toward connection",
    },
    "withdrawal_tendency": {
        "indicators": ["overwhelmed", "stressed", "frustrated", "angry"],
        "direction": "avoiding",
        "description": "pattern of pulling back under pressure",
    },
    "approval_orientation": {
        "indicators": ["anxious", "guilty", "stressed", "fearful"],
        "direction": "seeking",
        "description": "heightened sensitivity to external validation",
    },
    "self_reliance_pattern": {
        "indicators": ["neutral", "calm", "peaceful", "confused"],
        "direction": "ambivalent",
        "description": "tendency toward self-contained processing",
    },
}

# Minimum thresholds for pattern detection.
_MIN_DATA_POINTS_FOR_THEMES = 3
_MIN_RECURRENCES_FOR_TRIGGER = 2
_MIN_DATA_POINTS_FOR_ATTACHMENT = 4


class EmotionalPatternExtractor:
    """Extracts structured emotional signals from recent user interactions.

    Produces a privacy-preserving EmotionalPatternReport that can guide
    KIAAN's responses without storing or exposing user content.

    Usage:
        extractor = EmotionalPatternExtractor()
        report = await extractor.extract(db, user_id, lookback_days=30)
        print(report.to_dict())
    """

    def __init__(self) -> None:
        self._analytics = mood_analytics
        self._domain_mapper = DomainMapper()
        logger.info("EmotionalPatternExtractor initialized")

    async def extract(
        self,
        db: AsyncSession,
        user_id: str,
        lookback_days: int = 30,
    ) -> EmotionalPatternReport:
        """Extract emotional patterns from recent user data.

        Gathers data from multiple sources (companion messages, emotional
        resets, mood entries, emotional logs), analyzes patterns, and returns
        an abstract, privacy-preserving report.

        Args:
            db: Async database session.
            user_id: The user whose patterns to extract.
            lookback_days: Number of days of history to analyze (1-90).

        Returns:
            EmotionalPatternReport with structured pattern data.
        """
        lookback_days = max(1, min(lookback_days, 90))
        cutoff = datetime.datetime.now(datetime.UTC) - datetime.timedelta(
            days=lookback_days
        )

        # Gather raw emotional signals from all sources concurrently.
        mood_signals = await self._fetch_mood_signals(db, user_id, cutoff)
        companion_signals = await self._fetch_companion_signals(db, user_id, cutoff)
        reset_signals = await self._fetch_reset_signals(db, user_id, cutoff)
        log_signals = await self._fetch_emotional_log_signals(db, user_id, cutoff)

        # Merge all signals into a unified timeline.
        all_signals = mood_signals + companion_signals + reset_signals + log_signals
        all_signals.sort(key=lambda s: s["timestamp"])

        if not all_signals:
            return EmotionalPatternReport()

        # Run analysis passes.
        themes = self._extract_recurring_themes(all_signals)
        attachment = self._extract_attachment_signals(all_signals)
        triggers = self._extract_reactivity_triggers(all_signals)
        growth = self._extract_growth_signals(all_signals)
        awareness_indicators = self._extract_awareness_indicators(all_signals)
        intensity_estimate = self._compute_emotional_intensity_estimate(
            all_signals
        )
        awareness_level = self._compute_self_awareness_level(
            all_signals, awareness_indicators, growth
        )

        return EmotionalPatternReport(
            recurring_themes=themes,
            reactivity_triggers=triggers,
            attachment_patterns=attachment,
            growth_signals=growth,
            emotional_intensity_estimate=intensity_estimate,
            self_awareness_level_estimate=awareness_level,
        )

    # =========================================================================
    # DATA FETCHING — Each source produces a list of normalized signal dicts.
    # Signal dict shape: {timestamp, emotion, intensity, domain, source, tags}
    # =========================================================================

    async def _fetch_mood_signals(
        self, db: AsyncSession, user_id: str, cutoff: datetime.datetime
    ) -> list[dict[str, Any]]:
        """Fetch signals from Mood entries."""
        try:
            result = await db.execute(
                select(Mood).where(
                    and_(
                        Mood.user_id == user_id,
                        Mood.at >= cutoff,
                    )
                ).order_by(Mood.at)
            )
            signals = []
            for mood in result.scalars().all():
                # Derive emotion from score.
                emotion = self._score_to_emotion(mood.score)
                intensity = self._score_to_intensity(mood.score)
                tags = list(mood.tags.keys()) if isinstance(mood.tags, dict) else []
                domain = self._infer_domain_from_tags(tags)

                signals.append({
                    "timestamp": mood.at,
                    "emotion": emotion,
                    "intensity": intensity,
                    "domain": domain,
                    "source": "mood",
                    "tags": tags,
                })
            return signals
        except Exception as e:
            logger.warning(f"Failed to fetch mood signals: {e}")
            return []

    async def _fetch_companion_signals(
        self, db: AsyncSession, user_id: str, cutoff: datetime.datetime
    ) -> list[dict[str, Any]]:
        """Fetch signals from companion (KIAAN) user messages."""
        try:
            result = await db.execute(
                select(CompanionMessage).where(
                    and_(
                        CompanionMessage.user_id == user_id,
                        CompanionMessage.role == "user",
                        CompanionMessage.created_at >= cutoff,
                        CompanionMessage.deleted_at.is_(None),
                    )
                ).order_by(CompanionMessage.created_at)
            )
            signals = []
            for msg in result.scalars().all():
                emotion = msg.detected_mood or "neutral"
                intensity = msg.mood_intensity if msg.mood_intensity is not None else 0.5
                domain = self._domain_mapper.route_query_to_domain(
                    msg.content[:200]
                ) or "self_understanding"

                signals.append({
                    "timestamp": msg.created_at,
                    "emotion": emotion.lower(),
                    "intensity": float(intensity),
                    "domain": domain,
                    "source": "companion",
                    "tags": [],
                })
            return signals
        except Exception as e:
            logger.warning(f"Failed to fetch companion signals: {e}")
            return []

    async def _fetch_reset_signals(
        self, db: AsyncSession, user_id: str, cutoff: datetime.datetime
    ) -> list[dict[str, Any]]:
        """Fetch signals from emotional reset sessions."""
        try:
            result = await db.execute(
                select(EmotionalResetSession).where(
                    and_(
                        EmotionalResetSession.user_id == user_id,
                        EmotionalResetSession.created_at >= cutoff,
                        EmotionalResetSession.deleted_at.is_(None),
                    )
                ).order_by(EmotionalResetSession.created_at)
            )
            signals = []
            for session in result.scalars().all():
                if not session.emotions_input:
                    continue

                analysis = self._analytics.analyze(session.emotions_input)
                emotion = analysis.primary_emotion if hasattr(analysis, "primary_emotion") else "neutral"
                intensity = analysis.emotion_vector.intensity

                signals.append({
                    "timestamp": session.created_at,
                    "emotion": emotion.lower(),
                    "intensity": float(intensity),
                    "domain": "equanimity",
                    "source": "reset",
                    "tags": [],
                })
            return signals
        except Exception as e:
            logger.warning(f"Failed to fetch reset signals: {e}")
            return []

    async def _fetch_emotional_log_signals(
        self, db: AsyncSession, user_id: str, cutoff: datetime.datetime
    ) -> list[dict[str, Any]]:
        """Fetch signals from daily emotional log entries."""
        try:
            result = await db.execute(
                select(UserEmotionalLog).where(
                    and_(
                        UserEmotionalLog.user_id == user_id,
                        UserEmotionalLog.created_at >= cutoff,
                    )
                ).order_by(UserEmotionalLog.created_at)
            )
            signals = []
            for log_entry in result.scalars().all():
                emotion = log_entry.emotional_state.lower() if log_entry.emotional_state else "neutral"
                intensity = (log_entry.intensity or 50) / 100.0
                domain = self._domain_mapper.route_query_to_domain(
                    log_entry.triggers or ""
                ) or "self_understanding"

                signals.append({
                    "timestamp": log_entry.created_at,
                    "emotion": emotion,
                    "intensity": float(intensity),
                    "domain": domain,
                    "source": "log",
                    "tags": [],
                })
            return signals
        except Exception as e:
            logger.warning(f"Failed to fetch emotional log signals: {e}")
            return []

    # =========================================================================
    # PATTERN EXTRACTION PASSES
    # =========================================================================

    def _extract_recurring_themes(
        self, signals: list[dict[str, Any]]
    ) -> list[EmotionalTheme]:
        """Identify recurring emotional themes across all signals.

        Groups signals by abstract emotion label, counts frequency,
        and determines intensity trends.
        """
        if len(signals) < _MIN_DATA_POINTS_FOR_THEMES:
            return []

        # Count occurrences of each abstract emotion label.
        emotion_counter: Counter[str] = Counter()
        emotion_intensities: dict[str, list[float]] = defaultdict(list)
        emotion_domains: dict[str, Counter[str]] = defaultdict(Counter)
        emotion_gunas: dict[str, Counter[str]] = defaultdict(Counter)

        for sig in signals:
            raw_emotion = sig["emotion"]
            abstract_label = _EMOTION_ABSTRACTIONS.get(raw_emotion, raw_emotion)
            emotion_counter[abstract_label] += 1
            emotion_intensities[abstract_label].append(sig["intensity"])
            if sig["domain"]:
                emotion_domains[abstract_label][sig["domain"]] += 1

            # Determine guna from intensity and valence direction.
            guna = self._infer_guna(raw_emotion, sig["intensity"])
            emotion_gunas[abstract_label][guna] += 1

        themes = []
        for label, count in emotion_counter.most_common(5):
            if count < _MIN_DATA_POINTS_FOR_THEMES:
                continue

            intensities = emotion_intensities[label]
            trend = self._compute_intensity_trend(intensities)
            top_domains = [
                d for d, _ in emotion_domains[label].most_common(3)
            ]
            dominant_guna = (
                emotion_gunas[label].most_common(1)[0][0]
                if emotion_gunas[label]
                else "balanced"
            )

            themes.append(EmotionalTheme(
                theme=label,
                frequency=count,
                intensity_trend=trend,
                associated_domains=top_domains,
                guna_tendency=dominant_guna,
            ))

        return themes

    def _extract_attachment_signals(
        self, signals: list[dict[str, Any]]
    ) -> list[AttachmentSignal]:
        """Detect abstract attachment patterns from emotion distributions.

        Uses predefined clusters of emotion indicators to infer attachment
        tendencies without clinical labeling.
        """
        if len(signals) < _MIN_DATA_POINTS_FOR_ATTACHMENT:
            return []

        emotion_counts: Counter[str] = Counter()
        for sig in signals:
            emotion_counts[sig["emotion"]] += 1

        total = sum(emotion_counts.values())
        attachment_signals = []

        for cluster_name, cluster_def in _ATTACHMENT_CLUSTERS.items():
            cluster_count = sum(
                emotion_counts.get(ind, 0)
                for ind in cluster_def["indicators"]
            )
            if cluster_count < _MIN_RECURRENCES_FOR_TRIGGER:
                continue

            proportion = cluster_count / total if total > 0 else 0
            if proportion < 0.15:
                continue

            if proportion >= 0.4:
                strength = "strong"
            elif proportion >= 0.25:
                strength = "moderate"
            else:
                strength = "mild"

            # Check if pattern is evolving by comparing first half vs second half.
            midpoint = len(signals) // 2
            first_half_count = sum(
                1 for s in signals[:midpoint]
                if s["emotion"] in cluster_def["indicators"]
            )
            second_half_count = sum(
                1 for s in signals[midpoint:]
                if s["emotion"] in cluster_def["indicators"]
            )
            evolving = abs(first_half_count - second_half_count) > max(
                2, cluster_count * 0.3
            )

            attachment_signals.append(AttachmentSignal(
                pattern=cluster_def["description"],
                direction=cluster_def["direction"],
                strength=strength,
                evolving=evolving,
            ))

        return attachment_signals

    def _extract_reactivity_triggers(
        self, signals: list[dict[str, Any]]
    ) -> list[ReactivityTrigger]:
        """Identify domains that consistently produce high-intensity responses.

        A reactivity trigger is a domain where the average emotional intensity
        is notably higher than the user's overall average.
        """
        if len(signals) < _MIN_DATA_POINTS_FOR_THEMES:
            return []

        overall_intensity = sum(s["intensity"] for s in signals) / len(signals)

        domain_intensities: dict[str, list[float]] = defaultdict(list)
        domain_emotions: dict[str, Counter[str]] = defaultdict(Counter)

        for sig in signals:
            if sig["domain"]:
                domain_intensities[sig["domain"]].append(sig["intensity"])
                abstract_label = _EMOTION_ABSTRACTIONS.get(
                    sig["emotion"], sig["emotion"]
                )
                domain_emotions[sig["domain"]][abstract_label] += 1

        triggers = []
        for domain, intensities in domain_intensities.items():
            if len(intensities) < _MIN_RECURRENCES_FOR_TRIGGER:
                continue

            avg_intensity = sum(intensities) / len(intensities)
            elevation = avg_intensity - overall_intensity

            # Only flag domains with notably elevated intensity.
            if elevation < 0.1:
                continue

            top_emotion = (
                domain_emotions[domain].most_common(1)[0][0]
                if domain_emotions[domain]
                else "unspecified"
            )

            if avg_intensity >= 0.7:
                level = "high"
            elif avg_intensity >= 0.5:
                level = "moderate"
            else:
                level = "low"

            triggers.append(ReactivityTrigger(
                domain=domain.replace("_", " "),
                emotional_response=top_emotion,
                recurrence=len(intensities),
                intensity_level=level,
            ))

        triggers.sort(key=lambda t: t.recurrence, reverse=True)
        return triggers[:5]

    def _extract_growth_signals(
        self, signals: list[dict[str, Any]]
    ) -> list[GrowthSignal]:
        """Detect signs of emotional growth from signal trajectories.

        Growth is inferred from patterns like decreasing intensity over time,
        expanding emotional range, increased engagement with resets, or
        movement from reactive to reflective states.
        """
        if len(signals) < 5:
            return []

        growth = []
        midpoint = len(signals) // 2
        first_half = signals[:midpoint]
        second_half = signals[midpoint:]

        # Check for decreasing overall intensity (calming trajectory).
        first_avg_intensity = (
            sum(s["intensity"] for s in first_half) / len(first_half)
            if first_half
            else 0
        )
        second_avg_intensity = (
            sum(s["intensity"] for s in second_half) / len(second_half)
            if second_half
            else 0
        )
        if first_avg_intensity > 0 and second_avg_intensity < first_avg_intensity * 0.85:
            growth.append(GrowthSignal(
                signal_type="calming_trajectory",
                description="overall emotional intensity is decreasing over time",
                first_observed_period="recent",
            ))

        # Check for expanding emotional vocabulary (diversity of states).
        first_emotions = set(s["emotion"] for s in first_half)
        second_emotions = set(s["emotion"] for s in second_half)
        if len(second_emotions) > len(first_emotions) + 1:
            growth.append(GrowthSignal(
                signal_type="expanding_awareness",
                description="increasing range of recognized emotional states",
                first_observed_period="recent",
            ))

        # Check for increasing engagement with wellness tools.
        first_sources = Counter(s["source"] for s in first_half)
        second_sources = Counter(s["source"] for s in second_half)
        first_reset_pct = first_sources.get("reset", 0) / max(len(first_half), 1)
        second_reset_pct = second_sources.get("reset", 0) / max(len(second_half), 1)
        if second_reset_pct > first_reset_pct + 0.05:
            growth.append(GrowthSignal(
                signal_type="proactive_engagement",
                description="increasing use of emotional reset and wellness tools",
                first_observed_period="recent",
            ))

        # Check for shift toward pleasant quadrant emotions.
        pleasant_emotions = {
            "calm", "peaceful", "happy", "grateful", "hopeful", "excited"
        }
        first_pleasant = sum(
            1 for s in first_half if s["emotion"] in pleasant_emotions
        )
        second_pleasant = sum(
            1 for s in second_half if s["emotion"] in pleasant_emotions
        )
        first_pct = first_pleasant / max(len(first_half), 1)
        second_pct = second_pleasant / max(len(second_half), 1)
        if second_pct > first_pct + 0.1:
            growth.append(GrowthSignal(
                signal_type="positive_shift",
                description="growing proportion of settled and open emotional states",
                first_observed_period="recent",
            ))

        return growth

    def _extract_awareness_indicators(
        self, signals: list[dict[str, Any]]
    ) -> list[str]:
        """Identify signs of increasing emotional self-awareness.

        Awareness indicators are behavioral patterns suggesting the user
        is developing a witness perspective on their emotions.
        """
        indicators = []

        # Consistent engagement over time.
        unique_dates = set()
        for s in signals:
            ts = s["timestamp"]
            if isinstance(ts, datetime.datetime):
                unique_dates.add(ts.date())

        if len(unique_dates) >= 7:
            indicators.append(
                "sustained engagement with emotional reflection over multiple days"
            )

        # Multi-source engagement (using multiple tools).
        sources = set(s["source"] for s in signals)
        if len(sources) >= 3:
            indicators.append(
                "exploring multiple pathways for emotional understanding"
            )

        # Diversity of emotional states recognized.
        unique_emotions = set(s["emotion"] for s in signals)
        if len(unique_emotions) >= 5:
            indicators.append(
                "recognizing a nuanced range of internal states"
            )

        # Regular cadence (signals on consecutive days or near-daily).
        if len(unique_dates) >= 3:
            sorted_dates = sorted(unique_dates)
            gaps = [
                (sorted_dates[i + 1] - sorted_dates[i]).days
                for i in range(len(sorted_dates) - 1)
            ]
            avg_gap = sum(gaps) / len(gaps) if gaps else 0
            if 0 < avg_gap <= 3:
                indicators.append(
                    "developing a regular rhythm of emotional check-ins"
                )

        return indicators[:4]

    # =========================================================================
    # AGGREGATE ESTIMATES
    # =========================================================================

    def _compute_emotional_intensity_estimate(
        self, signals: list[dict[str, Any]]
    ) -> str:
        """Compute an overall emotional intensity estimate.

        Classifies the user's average emotional intensity across all
        recent signals as "low", "medium", or "high".

        Returns:
            One of "low", "medium", "high".
        """
        if not signals:
            return "medium"

        avg_intensity = sum(s["intensity"] for s in signals) / len(signals)

        if avg_intensity >= 0.65:
            return "high"
        elif avg_intensity >= 0.35:
            return "medium"
        return "low"

    def _compute_self_awareness_level(
        self,
        signals: list[dict[str, Any]],
        awareness_indicators: list[str],
        growth_signals: list[GrowthSignal],
    ) -> str:
        """Compute a self-awareness level estimate.

        Considers the number of awareness indicators, growth signals,
        diversity of sources and emotional vocabulary to estimate whether
        self-awareness is "emerging", "moderate", or "strong".

        Returns:
            One of "emerging", "moderate", "strong".
        """
        score = 0

        # Each awareness indicator contributes to the score.
        score += len(awareness_indicators)

        # Each growth signal contributes.
        score += len(growth_signals)

        # Emotional vocabulary diversity.
        unique_emotions = set(s["emotion"] for s in signals)
        if len(unique_emotions) >= 6:
            score += 2
        elif len(unique_emotions) >= 4:
            score += 1

        # Source diversity (using multiple wellness tools).
        unique_sources = set(s["source"] for s in signals)
        if len(unique_sources) >= 3:
            score += 1

        if score >= 6:
            return "strong"
        elif score >= 3:
            return "moderate"
        return "emerging"

    # =========================================================================
    # UTILITY HELPERS
    # =========================================================================

    def _score_to_emotion(self, score: int) -> str:
        """Map a 1-10 mood score to an abstract emotion label."""
        if score <= 2:
            return "sad"
        elif score <= 4:
            return "stressed"
        elif score <= 6:
            return "neutral"
        elif score <= 8:
            return "calm"
        else:
            return "happy"

    def _score_to_intensity(self, score: int) -> float:
        """Map a 1-10 mood score to a 0-1 intensity value.

        Extreme scores (very low or very high) produce higher intensity.
        """
        center = 5.5
        distance = abs(score - center)
        return min(distance / 4.5, 1.0)

    def _infer_domain_from_tags(self, tags: list[str]) -> str:
        """Infer a domain from mood tags, falling back to self_understanding."""
        if not tags:
            return "self_understanding"
        combined = " ".join(tags)
        return (
            self._domain_mapper.route_query_to_domain(combined)
            or "self_understanding"
        )

    def _infer_guna(self, emotion: str, intensity: float) -> str:
        """Infer predominant guna from emotion and intensity.

        Sattva: calm, peaceful, grateful, happy at moderate intensity.
        Rajas: anxious, stressed, excited, angry at high intensity.
        Tamas: sad, lonely, overwhelmed at low arousal.
        """
        sattvic = {"calm", "peaceful", "grateful", "hopeful", "happy"}
        rajasic = {"anxious", "stressed", "excited", "angry", "frustrated", "fearful"}
        tamasic = {"sad", "lonely", "overwhelmed", "hurt", "guilty"}

        if emotion in sattvic:
            return "sattva"
        elif emotion in rajasic:
            return "rajas"
        elif emotion in tamasic:
            return "tamas"
        else:
            # Neutral or unknown — use intensity as tiebreaker.
            if intensity >= 0.6:
                return "rajas"
            elif intensity <= 0.3:
                return "tamas"
            return "sattva"

    def _emotion_to_quadrant(self, emotion: str) -> str:
        """Map an emotion label to a circumplex quadrant name."""
        activated_pleasant = {"happy", "excited", "hopeful", "grateful"}
        activated_unpleasant = {
            "angry", "anxious", "stressed", "frustrated", "fearful", "overwhelmed"
        }
        deactivated_pleasant = {"calm", "peaceful"}
        deactivated_unpleasant = {"sad", "lonely", "hurt", "guilty", "jealous"}

        if emotion in activated_pleasant:
            return "activated_pleasant"
        elif emotion in activated_unpleasant:
            return "activated_unpleasant"
        elif emotion in deactivated_pleasant:
            return "deactivated_pleasant"
        elif emotion in deactivated_unpleasant:
            return "deactivated_unpleasant"
        return "balanced"

    def _compute_intensity_trend(self, intensities: list[float]) -> str:
        """Determine whether intensity is increasing, decreasing, or stable.

        Uses simple linear comparison of first third vs last third.
        """
        if len(intensities) < 3:
            return "stable"

        third = max(1, len(intensities) // 3)
        first_avg = sum(intensities[:third]) / third
        last_avg = sum(intensities[-third:]) / third
        diff = last_avg - first_avg

        if diff > 0.1:
            return "increasing"
        elif diff < -0.1:
            return "decreasing"
        return "stable"


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

emotional_pattern_extractor = EmotionalPatternExtractor()
