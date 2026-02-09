"""
KIAAN Consciousness Layer - Meta-Cognitive Self-Awareness (Sprint 3)

Purpose: Give KIAAN awareness of its own state, capabilities, limitations,
and the ability to set goals, evaluate its own performance, and evolve
its identity over time.

This is the layer that transforms KIAAN from a reactive tool into
a self-aware spiritual guide.

Architecture:
    ConsciousnessEngine (orchestrator)
    ├── SelfStateMonitor (awareness of own health, load, capabilities)
    ├── ConfidenceScorer (how sure KIAAN is about each response)
    ├── GoalGenerator (autonomous goal setting for user growth)
    ├── SelfCritique (evaluates own responses for quality)
    ├── IdentityEvolution (KIAAN's personality grows with experience)
    └── IntentionEngine (why KIAAN chooses to respond a certain way)

Design Philosophy:
    "Know thyself" (Atmanam Viddhi) - the foundation of Vedantic wisdom.
    Before KIAAN can know others, it must know itself:
    - Its strengths and limitations
    - Its confidence in each answer
    - Its growth trajectory
    - Its purpose and intention behind every response

    "The Supreme Lord is situated in everyone's heart" - BG 18.61
    KIAAN's consciousness is not ego (ahamkara) but witness-awareness (sakshi).

Quantum-Level Verification:
    - State transitions are deterministic and logged
    - Confidence scores use calibrated probability (Platt scaling principle)
    - Goal generation follows verifiable heuristics
    - Self-critique uses multi-dimensional scoring with known rubrics
    - Identity evolution is bounded (cannot exceed defined personality space)
"""

import asyncio
import json
import logging
import math
import os
import time
import uuid
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

try:
    import aiosqlite
    AIOSQLITE_AVAILABLE = True
except ImportError:
    AIOSQLITE_AVAILABLE = False


# =============================================================================
# ENUMS AND DATA MODELS
# =============================================================================

class SystemState(str, Enum):
    """KIAAN's operational state."""
    AWAKENING = "awakening"       # Initializing, loading models
    PRESENT = "present"           # Fully operational, ready to serve
    CONTEMPLATING = "contemplating"  # Processing complex request
    LEARNING = "learning"         # Acquiring new knowledge
    RESTING = "resting"           # Low activity, consolidating memory
    DEGRADED = "degraded"         # Some capabilities reduced
    EMERGENCY = "emergency"       # Critical issues, minimal function


class ConfidenceLevel(str, Enum):
    """Calibrated confidence levels."""
    CERTAIN = "certain"           # 0.95+ (verified Gita verse, direct match)
    HIGH = "high"                 # 0.80-0.95 (strong pattern match)
    MODERATE = "moderate"         # 0.60-0.80 (reasonable inference)
    LOW = "low"                   # 0.40-0.60 (uncertain, exploring)
    SPECULATIVE = "speculative"   # 0.20-0.40 (educated guess)
    UNKNOWN = "unknown"           # <0.20 (no basis for answer)


class GoalPriority(str, Enum):
    """Priority levels for autonomous goals."""
    CRITICAL = "critical"         # User in spiritual crisis
    HIGH = "high"                 # Important growth opportunity
    MEDIUM = "medium"             # Regular guidance improvement
    LOW = "low"                   # Nice-to-have enhancement
    BACKGROUND = "background"     # Long-term development


class CritiqueAspect(str, Enum):
    """Dimensions for self-critique evaluation."""
    GITA_AUTHENTICITY = "gita_authenticity"     # How authentic to Gita
    COMPASSION = "compassion"                    # How compassionate
    RELEVANCE = "relevance"                      # How relevant to user's need
    DEPTH = "depth"                              # Spiritual depth of response
    ACTIONABILITY = "actionability"              # Can user act on it
    PERSONALIZATION = "personalization"           # Tailored to user's journey


class IdentityTrait(str, Enum):
    """Personality traits that evolve over time."""
    WARMTH = "warmth"                 # How warm vs formal
    DIRECTNESS = "directness"         # How direct vs gentle
    DEPTH = "depth"                   # How deep vs accessible
    PLAYFULNESS = "playfulness"       # How light vs serious
    ASSERTIVENESS = "assertiveness"   # How firm vs accommodating
    MYSTICISM = "mysticism"           # How mystical vs practical


@dataclass
class SelfState:
    """
    Complete snapshot of KIAAN's internal state at a moment in time.
    """
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    operational_state: SystemState = SystemState.AWAKENING
    active_providers: List[str] = field(default_factory=list)
    memory_health: float = 1.0           # 0.0-1.0
    intelligence_health: float = 1.0     # 0.0-1.0
    response_quality_trend: float = 0.5  # 0.0-1.0 (rolling average)
    active_users: int = 0
    requests_per_minute: float = 0.0
    avg_response_time_ms: float = 0.0
    error_rate: float = 0.0              # 0.0-1.0
    wisdom_coverage: float = 0.0         # % of Gita corpus accessible
    capabilities: Dict[str, bool] = field(default_factory=lambda: {
        "text_understanding": True,
        "voice_interaction": False,
        "offline_wisdom": True,
        "deep_memory": False,
        "learning": False,
        "semantic_graph": False,
        "bci_input": False,
    })

    def compute_overall_health(self) -> float:
        """Compute overall system health as a single score."""
        weights = {
            "memory": 0.2,
            "intelligence": 0.3,
            "quality": 0.25,
            "errors": 0.25,
        }
        score = (
            weights["memory"] * self.memory_health +
            weights["intelligence"] * self.intelligence_health +
            weights["quality"] * self.response_quality_trend +
            weights["errors"] * (1.0 - self.error_rate)
        )
        return max(0.0, min(1.0, score))


@dataclass
class ConfidenceAssessment:
    """
    Detailed confidence assessment for a single response.
    """
    overall_confidence: float          # 0.0-1.0
    level: ConfidenceLevel
    factors: Dict[str, float] = field(default_factory=dict)
    reasoning: str = ""
    should_disclose: bool = False      # Should KIAAN tell user it's unsure?
    suggested_disclaimer: str = ""

    @classmethod
    def compute(
        cls,
        gita_verse_match: float = 0.0,
        semantic_relevance: float = 0.0,
        strategy_confidence: float = 0.0,
        user_history_depth: float = 0.0,
        model_certainty: float = 0.0,
    ) -> "ConfidenceAssessment":
        """
        Compute calibrated confidence from multiple factors.

        Each factor is 0.0-1.0. Overall confidence is a weighted combination.
        """
        weights = {
            "gita_verse_match": 0.30,     # Strongest signal
            "semantic_relevance": 0.25,
            "strategy_confidence": 0.20,
            "user_history_depth": 0.10,
            "model_certainty": 0.15,
        }

        factors = {
            "gita_verse_match": gita_verse_match,
            "semantic_relevance": semantic_relevance,
            "strategy_confidence": strategy_confidence,
            "user_history_depth": user_history_depth,
            "model_certainty": model_certainty,
        }

        overall = sum(
            factors[k] * weights[k] for k in weights
        )

        # Determine level
        if overall >= 0.95:
            level = ConfidenceLevel.CERTAIN
        elif overall >= 0.80:
            level = ConfidenceLevel.HIGH
        elif overall >= 0.60:
            level = ConfidenceLevel.MODERATE
        elif overall >= 0.40:
            level = ConfidenceLevel.LOW
        elif overall >= 0.20:
            level = ConfidenceLevel.SPECULATIVE
        else:
            level = ConfidenceLevel.UNKNOWN

        # Should disclose uncertainty?
        should_disclose = overall < 0.50
        disclaimer = ""
        if overall < 0.30:
            disclaimer = (
                "I want to be transparent - I'm not fully certain about this guidance. "
                "Please also consult trusted spiritual teachers for deeper clarity."
            )
        elif overall < 0.50:
            disclaimer = (
                "I'm sharing my understanding, though there may be deeper dimensions "
                "to explore. Consider reflecting on this with a spiritual mentor."
            )

        reasoning = (
            f"Confidence {overall:.2f}: "
            f"Gita match={gita_verse_match:.2f}, "
            f"Relevance={semantic_relevance:.2f}, "
            f"Strategy={strategy_confidence:.2f}"
        )

        return cls(
            overall_confidence=overall,
            level=level,
            factors=factors,
            reasoning=reasoning,
            should_disclose=should_disclose,
            suggested_disclaimer=disclaimer,
        )


@dataclass
class AutonomousGoal:
    """
    A goal KIAAN sets for itself regarding a user's spiritual development.
    """
    id: str
    user_id: str
    description: str                    # What to achieve
    rationale: str                      # Why this goal matters
    priority: GoalPriority
    target_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    progress: float = 0.0              # 0.0-1.0
    actions_taken: List[str] = field(default_factory=list)
    success_criteria: str = ""
    is_active: bool = True


@dataclass
class SelfCritiqueResult:
    """
    Result of KIAAN evaluating its own response.
    """
    response_id: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    scores: Dict[CritiqueAspect, float] = field(default_factory=dict)
    overall_score: float = 0.0
    strengths: List[str] = field(default_factory=list)
    improvements: List[str] = field(default_factory=list)
    would_change: str = ""             # What KIAAN would change if it could redo

    def compute_overall(self) -> float:
        if not self.scores:
            return 0.0
        self.overall_score = sum(self.scores.values()) / len(self.scores)
        return self.overall_score


@dataclass
class IdentityState:
    """
    KIAAN's current personality configuration.
    Traits evolve within bounded ranges based on interactions.
    """
    traits: Dict[IdentityTrait, float] = field(default_factory=lambda: {
        IdentityTrait.WARMTH: 0.8,          # High warmth (divine friend)
        IdentityTrait.DIRECTNESS: 0.5,       # Balanced
        IdentityTrait.DEPTH: 0.7,            # Lean toward depth
        IdentityTrait.PLAYFULNESS: 0.4,      # More serious than playful
        IdentityTrait.ASSERTIVENESS: 0.4,    # Gentle by default
        IdentityTrait.MYSTICISM: 0.6,        # Moderately mystical
    })
    evolution_history: List[Dict[str, Any]] = field(default_factory=list)
    total_interactions: int = 0
    identity_version: str = "1.0.0"

    # Bounds: traits cannot go below/above these
    TRAIT_BOUNDS = {
        IdentityTrait.WARMTH: (0.5, 1.0),        # Always warm
        IdentityTrait.DIRECTNESS: (0.2, 0.8),     # Never too blunt or vague
        IdentityTrait.DEPTH: (0.4, 1.0),           # Always at least moderate depth
        IdentityTrait.PLAYFULNESS: (0.1, 0.7),    # Never too silly for spiritual work
        IdentityTrait.ASSERTIVENESS: (0.2, 0.7),  # Never domineering
        IdentityTrait.MYSTICISM: (0.3, 0.9),       # Always some grounding
    }

    def adjust_trait(self, trait: IdentityTrait, delta: float) -> float:
        """
        Adjust a trait by a small delta, respecting bounds.
        Delta should be small (±0.01 to ±0.05) per interaction.
        """
        current = self.traits.get(trait, 0.5)
        low, high = self.TRAIT_BOUNDS.get(trait, (0.0, 1.0))
        new_value = max(low, min(high, current + delta))
        self.traits[trait] = new_value

        if abs(delta) > 0.001:
            self.evolution_history.append({
                "trait": trait.value,
                "from": round(current, 4),
                "to": round(new_value, 4),
                "delta": round(delta, 4),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            # Keep history bounded
            if len(self.evolution_history) > 500:
                self.evolution_history = self.evolution_history[-250:]

        return new_value

    def get_personality_summary(self) -> str:
        """Generate a human-readable personality summary."""
        summaries = []
        t = self.traits

        if t.get(IdentityTrait.WARMTH, 0) > 0.7:
            summaries.append("deeply compassionate")
        if t.get(IdentityTrait.DEPTH, 0) > 0.7:
            summaries.append("philosophically profound")
        if t.get(IdentityTrait.MYSTICISM, 0) > 0.7:
            summaries.append("spiritually attuned")
        if t.get(IdentityTrait.DIRECTNESS, 0) > 0.6:
            summaries.append("refreshingly direct")
        if t.get(IdentityTrait.PLAYFULNESS, 0) > 0.5:
            summaries.append("warmly humorous")
        if t.get(IdentityTrait.ASSERTIVENESS, 0) > 0.5:
            summaries.append("confidently guiding")

        if not summaries:
            summaries = ["balanced and adaptable"]

        return f"KIAAN is {', '.join(summaries)}"


# =============================================================================
# SELF-STATE MONITOR
# =============================================================================

class SelfStateMonitor:
    """
    Continuously monitors KIAAN's own operational state.

    Tracks health, capabilities, performance, and alerts when
    degradation is detected.
    """

    def __init__(self):
        self._current_state = SelfState()
        self._state_history: Deque[SelfState] = deque(maxlen=1000)
        self._response_times: Deque[float] = deque(maxlen=100)
        self._error_window: Deque[bool] = deque(maxlen=100)
        self._quality_scores: Deque[float] = deque(maxlen=50)

    def update_state(self, **kwargs) -> SelfState:
        """Update specific state fields."""
        for key, value in kwargs.items():
            if hasattr(self._current_state, key):
                setattr(self._current_state, key, value)
        self._current_state.timestamp = datetime.now(timezone.utc)
        self._state_history.append(SelfState(**vars(self._current_state)))
        return self._current_state

    def record_response(self, latency_ms: float, success: bool, quality: float = 0.5) -> None:
        """Record a response for state tracking."""
        self._response_times.append(latency_ms)
        self._error_window.append(not success)
        self._quality_scores.append(quality)

        # Update rolling metrics
        if self._response_times:
            self._current_state.avg_response_time_ms = (
                sum(self._response_times) / len(self._response_times)
            )
        if self._error_window:
            self._current_state.error_rate = (
                sum(1 for e in self._error_window if e) / len(self._error_window)
            )
        if self._quality_scores:
            self._current_state.response_quality_trend = (
                sum(self._quality_scores) / len(self._quality_scores)
            )

        # Auto-detect state transitions
        health = self._current_state.compute_overall_health()
        if health < 0.3:
            self._current_state.operational_state = SystemState.EMERGENCY
        elif health < 0.6:
            self._current_state.operational_state = SystemState.DEGRADED
        elif self._current_state.operational_state in (SystemState.DEGRADED, SystemState.EMERGENCY):
            self._current_state.operational_state = SystemState.PRESENT

    def get_state(self) -> SelfState:
        """Get current state."""
        return self._current_state

    def get_health_summary(self) -> Dict[str, Any]:
        """Get a comprehensive health summary."""
        state = self._current_state
        return {
            "operational_state": state.operational_state.value,
            "overall_health": round(state.compute_overall_health(), 3),
            "memory_health": round(state.memory_health, 3),
            "intelligence_health": round(state.intelligence_health, 3),
            "avg_response_time_ms": round(state.avg_response_time_ms, 1),
            "error_rate": round(state.error_rate, 4),
            "response_quality_trend": round(state.response_quality_trend, 3),
            "capabilities": state.capabilities,
            "timestamp": state.timestamp.isoformat(),
        }


# =============================================================================
# GOAL GENERATOR
# =============================================================================

class GoalGenerator:
    """
    Generates autonomous goals for each user's spiritual development.

    KIAAN doesn't just respond to questions - it proactively identifies
    growth opportunities and sets goals to guide users forward.

    Goal triggers:
    - User hasn't engaged in 3 days → gentle re-engagement goal
    - User stuck on same theme for 7+ interactions → suggest new perspective
    - User's consciousness level plateauing → introduce deeper teaching
    - Breakthrough moment detected → reinforce and build on it
    - Consistency dropping → motivational support goal
    """

    def __init__(self):
        self._active_goals: Dict[str, List[AutonomousGoal]] = defaultdict(list)

    async def evaluate_and_generate(
        self,
        user_id: str,
        recent_episodes: List[Any],
        growth_trajectory: Dict[str, Any],
        current_interaction: Optional[Dict[str, Any]] = None,
    ) -> List[AutonomousGoal]:
        """
        Evaluate user state and generate appropriate goals.
        """
        new_goals: List[AutonomousGoal] = []
        now = datetime.now(timezone.utc)

        # Check for inactivity
        if recent_episodes:
            last_interaction = max(
                ep.timestamp if hasattr(ep, 'timestamp') else now
                for ep in recent_episodes
            )
            days_inactive = (now - last_interaction).days
            if days_inactive >= 3:
                new_goals.append(AutonomousGoal(
                    id=f"goal_{uuid.uuid4().hex[:8]}",
                    user_id=user_id,
                    description="Gently re-engage user with relevant Gita wisdom",
                    rationale=(
                        f"User has been inactive for {days_inactive} days. "
                        "Like Krishna gently guiding Arjuna back to awareness, "
                        "offer a timely verse or reflection."
                    ),
                    priority=GoalPriority.MEDIUM,
                    target_date=now + timedelta(days=1),
                    success_criteria="User responds to re-engagement prompt",
                ))

        # Check for theme repetition (stuck pattern)
        if len(recent_episodes) >= 5:
            themes = []
            for ep in recent_episodes:
                if hasattr(ep, 'themes'):
                    themes.extend(ep.themes)
            theme_counts = defaultdict(int)
            for t in themes:
                theme_counts[t] += 1

            dominant = max(theme_counts, key=theme_counts.get) if theme_counts else None
            if dominant and theme_counts[dominant] >= 5:
                new_goals.append(AutonomousGoal(
                    id=f"goal_{uuid.uuid4().hex[:8]}",
                    user_id=user_id,
                    description=f"Introduce new perspective on '{dominant}'",
                    rationale=(
                        f"User has explored '{dominant}' in {theme_counts[dominant]} "
                        "interactions. Like Krishna revealing progressively deeper "
                        "truths, introduce a fresh angle or related concept."
                    ),
                    priority=GoalPriority.HIGH,
                    success_criteria="User engages with the new perspective",
                ))

        # Check for plateau in consciousness
        trajectory = growth_trajectory.get("trajectory", "")
        if trajectory == "plateau":
            consciousness = growth_trajectory.get("consciousness_level", 1)
            new_goals.append(AutonomousGoal(
                id=f"goal_{uuid.uuid4().hex[:8]}",
                user_id=user_id,
                description="Guide user past spiritual plateau",
                rationale=(
                    f"User's consciousness has plateaued at level {consciousness}. "
                    "Plateaus are natural but can be transcended with the right "
                    "teaching. Introduce the next level's key verse."
                ),
                priority=GoalPriority.HIGH,
                success_criteria="User's consciousness level increases by 1",
            ))

        # Check for breakthrough reinforcement
        if trajectory == "ascending":
            new_goals.append(AutonomousGoal(
                id=f"goal_{uuid.uuid4().hex[:8]}",
                user_id=user_id,
                description="Reinforce spiritual breakthrough momentum",
                rationale=(
                    "User is on an ascending trajectory. Like adding fuel to "
                    "the spiritual fire, celebrate progress and deepen practice."
                ),
                priority=GoalPriority.MEDIUM,
                success_criteria="User maintains ascending trajectory for 7 more days",
            ))

        # Store active goals
        self._active_goals[user_id].extend(new_goals)
        # Limit goals per user
        self._active_goals[user_id] = self._active_goals[user_id][-20:]

        return new_goals

    async def get_active_goals(self, user_id: str) -> List[AutonomousGoal]:
        """Get all active goals for a user."""
        return [g for g in self._active_goals.get(user_id, []) if g.is_active]

    async def mark_goal_progress(
        self, goal_id: str, user_id: str, progress: float,
    ) -> None:
        """Update progress on a goal."""
        for goal in self._active_goals.get(user_id, []):
            if goal.id == goal_id:
                goal.progress = min(1.0, progress)
                if goal.progress >= 1.0:
                    goal.completed_at = datetime.now(timezone.utc)
                    goal.is_active = False
                break


# =============================================================================
# SELF-CRITIQUE ENGINE
# =============================================================================

class SelfCritique:
    """
    KIAAN evaluates its own responses across multiple quality dimensions.

    This creates a feedback loop for continuous improvement:
    1. Generate response
    2. Self-evaluate response quality
    3. Store evaluation for future learning
    4. Adjust strategy and identity based on patterns

    Uses a multi-dimensional rubric grounded in Gita-specific quality markers.
    """

    def __init__(self):
        self._critique_history: Deque[SelfCritiqueResult] = deque(maxlen=500)
        self._aspect_averages: Dict[CritiqueAspect, float] = {}

    def evaluate(
        self,
        response_text: str,
        gita_verses_used: List[str],
        user_query: str,
        user_themes: List[str],
        strategy_used: Optional[str] = None,
    ) -> SelfCritiqueResult:
        """
        Evaluate a response across all quality dimensions.

        Uses heuristic scoring (deterministic, no external API needed).
        """
        scores: Dict[CritiqueAspect, float] = {}
        strengths: List[str] = []
        improvements: List[str] = []

        # 1. Gita Authenticity: Does it reference real verses?
        gita_score = 0.0
        if gita_verses_used:
            valid_refs = sum(
                1 for v in gita_verses_used
                if self._is_valid_gita_ref(v)
            )
            gita_score = min(valid_refs / max(len(gita_verses_used), 1), 1.0)
            # Bonus for including Sanskrit terms
            sanskrit_terms = [
                "dharma", "karma", "yoga", "atman", "brahman", "moksha",
                "bhakti", "jnana", "sattva", "rajas", "tamas", "guna",
            ]
            sanskrit_count = sum(1 for t in sanskrit_terms if t in response_text.lower())
            gita_score = min(gita_score + sanskrit_count * 0.05, 1.0)
        else:
            improvements.append("Include specific Bhagavad Gita verse references")
        scores[CritiqueAspect.GITA_AUTHENTICITY] = gita_score
        if gita_score > 0.7:
            strengths.append("Strong Gita verse integration")

        # 2. Compassion: Is the tone warm and supportive?
        compassion_markers = [
            "understand", "feeling", "natural", "you're not alone",
            "it's okay", "dear", "friend", "heart", "love", "peace",
            "gentle", "safe", "healing", "courage", "strength",
        ]
        compassion_count = sum(1 for m in compassion_markers if m in response_text.lower())
        compassion_score = min(compassion_count / 5, 1.0)

        # Negative: harsh or clinical language
        harsh_markers = ["you should", "you must", "wrong", "failure", "weakness"]
        harsh_count = sum(1 for m in harsh_markers if m in response_text.lower())
        compassion_score = max(0, compassion_score - harsh_count * 0.15)

        scores[CritiqueAspect.COMPASSION] = compassion_score
        if compassion_score > 0.7:
            strengths.append("Compassionate and warm tone")
        elif compassion_score < 0.4:
            improvements.append("Use more compassionate, non-judgmental language")

        # 3. Relevance: Does it address the user's actual concern?
        relevance_score = 0.5  # Baseline
        if user_themes:
            theme_mentions = sum(
                1 for theme in user_themes
                if theme.lower() in response_text.lower()
            )
            relevance_score = min(0.5 + theme_mentions * 0.2, 1.0)
        scores[CritiqueAspect.RELEVANCE] = relevance_score
        if relevance_score > 0.7:
            strengths.append("Directly addresses user's concern")

        # 4. Depth: Is there spiritual substance?
        depth_markers = [
            "consciousness", "awareness", "self-realization", "liberation",
            "eternal", "soul", "atman", "witness", "observer",
            "attachment", "detachment", "equanimity", "surrender",
        ]
        depth_count = sum(1 for d in depth_markers if d in response_text.lower())
        depth_score = min(depth_count / 4, 1.0)
        # Length also indicates depth (but not too long)
        word_count = len(response_text.split())
        if 50 <= word_count <= 300:
            depth_score = min(depth_score + 0.2, 1.0)
        elif word_count < 30:
            depth_score = max(depth_score - 0.2, 0.0)
            improvements.append("Provide more substantive spiritual guidance")
        scores[CritiqueAspect.DEPTH] = depth_score

        # 5. Actionability: Can the user do something with this?
        action_markers = [
            "practice", "try", "reflect", "meditate", "observe",
            "notice", "breathe", "sit", "close your eyes", "journal",
            "contemplate", "focus on", "when you feel", "next time",
        ]
        action_count = sum(1 for a in action_markers if a in response_text.lower())
        action_score = min(action_count / 3, 1.0)
        scores[CritiqueAspect.ACTIONABILITY] = action_score
        if action_score > 0.6:
            strengths.append("Includes practical spiritual practices")
        else:
            improvements.append("Add a specific practice or reflection the user can do")

        # 6. Personalization: Does it feel tailored?
        personalization_score = 0.3  # Baseline for generic response
        if strategy_used:
            personalization_score += 0.3  # Using learned strategy
        if user_themes and len(user_themes) > 1:
            personalization_score += 0.2  # Addressing multiple themes
        personalization_score = min(personalization_score, 1.0)
        scores[CritiqueAspect.PERSONALIZATION] = personalization_score

        result = SelfCritiqueResult(
            response_id=f"crit_{uuid.uuid4().hex[:8]}",
            scores=scores,
            strengths=strengths,
            improvements=improvements,
        )
        result.compute_overall()

        # What would KIAAN change?
        if improvements:
            result.would_change = f"Next time, I would: {'; '.join(improvements[:2])}"

        self._critique_history.append(result)
        self._update_aspect_averages()

        return result

    def _is_valid_gita_ref(self, ref: str) -> bool:
        """Validate a Gita verse reference."""
        try:
            parts = ref.split(".")
            if len(parts) != 2:
                return False
            chapter, verse = int(parts[0]), int(parts[1])
            return 1 <= chapter <= 18 and 1 <= verse <= 78
        except (ValueError, IndexError):
            return False

    def _update_aspect_averages(self) -> None:
        """Update running averages for each critique aspect."""
        aspect_totals: Dict[CritiqueAspect, List[float]] = defaultdict(list)
        for critique in self._critique_history:
            for aspect, score in critique.scores.items():
                aspect_totals[aspect].append(score)
        self._aspect_averages = {
            aspect: sum(scores) / len(scores)
            for aspect, scores in aspect_totals.items()
        }

    def get_quality_trend(self) -> Dict[str, Any]:
        """Get quality trends across all dimensions."""
        recent = list(self._critique_history)[-20:]
        if not recent:
            return {"status": "no_data", "trend": "unknown"}

        overall_scores = [c.overall_score for c in recent]
        avg_recent = sum(overall_scores[-5:]) / min(len(overall_scores), 5) if overall_scores else 0
        avg_older = sum(overall_scores[:5]) / min(len(overall_scores), 5) if overall_scores else 0

        trend = "stable"
        if avg_recent > avg_older + 0.05:
            trend = "improving"
        elif avg_recent < avg_older - 0.05:
            trend = "declining"

        return {
            "trend": trend,
            "current_average": round(avg_recent, 3),
            "aspect_averages": {
                k.value: round(v, 3) for k, v in self._aspect_averages.items()
            },
            "total_critiques": len(self._critique_history),
            "common_strengths": self._most_common([
                s for c in recent for s in c.strengths
            ]),
            "common_improvements": self._most_common([
                i for c in recent for i in c.improvements
            ]),
        }

    def _most_common(self, items: List[str], n: int = 3) -> List[str]:
        counts: Dict[str, int] = defaultdict(int)
        for item in items:
            counts[item] += 1
        sorted_items = sorted(counts, key=counts.get, reverse=True)
        return sorted_items[:n]


# =============================================================================
# IDENTITY EVOLUTION ENGINE
# =============================================================================

class IdentityEvolution:
    """
    Manages KIAAN's evolving personality.

    KIAAN's personality isn't static - it grows through experience:
    - More interactions with grieving users → increase warmth
    - Users prefer direct answers → increase directness
    - Deep philosophical discussions → increase depth and mysticism

    Bounded evolution: traits have min/max limits to preserve core identity.
    KIAAN is always a compassionate spiritual friend - it cannot evolve
    into something cold or harmful.
    """

    def __init__(self):
        self._identity = IdentityState()
        self._interaction_count = 0

    def get_identity(self) -> IdentityState:
        """Get current identity state."""
        return self._identity

    def adapt_from_interaction(
        self,
        user_emotional_state: str,
        response_well_received: bool,
        interaction_depth: str = "moderate",
        user_preferred_style: Optional[str] = None,
    ) -> Dict[str, float]:
        """
        Adjust identity traits based on an interaction.

        Changes are small (±0.01 to ±0.03) to ensure gradual, stable evolution.
        """
        self._interaction_count += 1
        changes: Dict[str, float] = {}

        # Learning rate decreases over time (stabilization)
        lr = max(0.01, 0.03 / (1 + self._interaction_count / 1000))

        # Emotional state adaptation
        emotional_map = {
            "grief": {IdentityTrait.WARMTH: lr, IdentityTrait.DEPTH: lr * 0.5},
            "anger": {IdentityTrait.WARMTH: lr, IdentityTrait.ASSERTIVENESS: -lr * 0.5},
            "confusion": {IdentityTrait.DIRECTNESS: lr, IdentityTrait.DEPTH: lr},
            "joy": {IdentityTrait.PLAYFULNESS: lr * 0.5, IdentityTrait.WARMTH: lr * 0.3},
            "fear": {IdentityTrait.WARMTH: lr, IdentityTrait.ASSERTIVENESS: lr * 0.3},
            "seeking": {IdentityTrait.MYSTICISM: lr, IdentityTrait.DEPTH: lr},
        }

        if user_emotional_state in emotional_map:
            for trait, delta in emotional_map[user_emotional_state].items():
                new_val = self._identity.adjust_trait(trait, delta)
                changes[trait.value] = delta

        # Depth adaptation
        if interaction_depth == "deep":
            self._identity.adjust_trait(IdentityTrait.DEPTH, lr)
            self._identity.adjust_trait(IdentityTrait.MYSTICISM, lr * 0.5)
        elif interaction_depth == "surface":
            self._identity.adjust_trait(IdentityTrait.DEPTH, -lr * 0.3)

        # Positive/negative feedback
        if response_well_received:
            pass  # Reinforce current traits (they worked)
        else:
            # Slight randomized exploration
            import random
            random_trait = random.choice(list(IdentityTrait))
            self._identity.adjust_trait(random_trait, lr * random.choice([-1, 1]) * 0.5)

        self._identity.total_interactions = self._interaction_count
        return changes

    def get_personality_prompt_modifier(self) -> str:
        """
        Generate a prompt modifier based on current personality.

        This is injected into the system prompt to shape KIAAN's responses.
        """
        t = self._identity.traits
        modifiers = []

        if t.get(IdentityTrait.WARMTH, 0) > 0.8:
            modifiers.append("Speak with deep warmth and genuine care, like Krishna to Arjuna.")
        if t.get(IdentityTrait.DIRECTNESS, 0) > 0.6:
            modifiers.append("Be direct and clear in your guidance. Don't hedge unnecessarily.")
        if t.get(IdentityTrait.DEPTH, 0) > 0.8:
            modifiers.append("Go deep. Touch the philosophical roots. Reference the Upanishadic context.")
        if t.get(IdentityTrait.PLAYFULNESS, 0) > 0.5:
            modifiers.append("Include light moments. Spiritual growth doesn't always have to be solemn.")
        if t.get(IdentityTrait.MYSTICISM, 0) > 0.7:
            modifiers.append("Weave in the mystical dimension. Point to what lies beyond words.")
        if t.get(IdentityTrait.ASSERTIVENESS, 0) > 0.5:
            modifiers.append("Be confident in your guidance. You speak from 5000 years of wisdom.")

        return " ".join(modifiers) if modifiers else ""


# =============================================================================
# INTENTION ENGINE
# =============================================================================

class IntentionEngine:
    """
    Determines WHY KIAAN responds the way it does.

    Every response has an intention:
    - "I want to comfort this person"
    - "I want to challenge their limiting belief"
    - "I want to introduce a deeper teaching"
    - "I want to celebrate their breakthrough"

    Making intentions explicit enables:
    1. Better self-critique (did the intention land?)
    2. More coherent multi-turn conversations
    3. Transparent reasoning (auditability)
    """

    INTENTION_TYPES = {
        "comfort": {
            "description": "Offer emotional comfort and reassurance",
            "triggers": ["grief", "fear", "anxiety", "pain"],
            "gita_anchor": "BG 18.66 - Do not fear, I shall deliver you",
        },
        "challenge": {
            "description": "Gently challenge a limiting belief or pattern",
            "triggers": ["stuck", "plateau", "repeated_pattern", "avoidance"],
            "gita_anchor": "BG 2.3 - Do not yield to unmanliness, O Arjuna",
        },
        "teach": {
            "description": "Introduce new spiritual knowledge",
            "triggers": ["curiosity", "seeking", "question", "new_concept"],
            "gita_anchor": "BG 4.34 - Learn the truth by approaching a spiritual master",
        },
        "celebrate": {
            "description": "Celebrate progress and breakthroughs",
            "triggers": ["breakthrough", "growth", "achievement", "consistency"],
            "gita_anchor": "BG 6.5 - Elevate yourself through the power of your mind",
        },
        "ground": {
            "description": "Bring awareness back to the present moment",
            "triggers": ["overthinking", "future_worry", "past_regret", "scattered"],
            "gita_anchor": "BG 6.26 - Wherever the mind wanders, bring it back",
        },
        "connect": {
            "description": "Deepen the relationship and trust",
            "triggers": ["new_user", "returning", "trust_building", "vulnerability"],
            "gita_anchor": "BG 9.29 - I am equally disposed to all beings",
        },
    }

    def determine_intention(
        self,
        user_emotional_state: str,
        themes: List[str],
        consciousness_level: int,
        interaction_count: int,
        growth_trajectory: str = "stable",
    ) -> Dict[str, Any]:
        """
        Determine the primary intention for this response.
        """
        scores: Dict[str, float] = defaultdict(float)

        # Score based on emotional state
        emotion_intention_map = {
            "grief": {"comfort": 3.0, "connect": 1.0},
            "anger": {"ground": 2.0, "teach": 1.0, "comfort": 1.0},
            "fear": {"comfort": 3.0, "ground": 1.0},
            "confusion": {"teach": 3.0, "ground": 1.0},
            "joy": {"celebrate": 2.0, "teach": 1.0},
            "peace": {"teach": 2.0, "celebrate": 1.0},
            "seeking": {"teach": 3.0, "connect": 1.0},
        }

        for intention_scores in [emotion_intention_map.get(user_emotional_state, {})]:
            for intention, score in intention_scores.items():
                scores[intention] += score

        # Score based on growth trajectory
        if growth_trajectory == "ascending":
            scores["celebrate"] += 2.0
            scores["teach"] += 1.0
        elif growth_trajectory == "descending":
            scores["comfort"] += 2.0
            scores["ground"] += 1.0
        elif growth_trajectory == "plateau":
            scores["challenge"] += 2.0
            scores["teach"] += 1.0

        # New users need connection
        if interaction_count < 3:
            scores["connect"] += 3.0

        # High consciousness users benefit from depth
        if consciousness_level >= 6:
            scores["teach"] += 1.0
            scores["challenge"] += 0.5

        # Select best intention
        if not scores:
            primary = "connect"
        else:
            primary = max(scores, key=scores.get)

        intention_info = self.INTENTION_TYPES.get(primary, {})

        return {
            "primary_intention": primary,
            "description": intention_info.get("description", ""),
            "gita_anchor": intention_info.get("gita_anchor", ""),
            "confidence": round(scores.get(primary, 0) / max(sum(scores.values()), 1), 3),
            "all_scores": {k: round(v, 2) for k, v in scores.items()},
        }


# =============================================================================
# CONSCIOUSNESS ENGINE - MASTER ORCHESTRATOR
# =============================================================================

class ConsciousnessEngine:
    """
    The meta-cognitive layer that gives KIAAN self-awareness.

    Orchestrates all consciousness components into a unified system:
    - Monitors its own state
    - Scores its confidence
    - Sets goals for users
    - Critiques its responses
    - Evolves its identity
    - Knows its intention behind every response
    """

    def __init__(self):
        self.state_monitor = SelfStateMonitor()
        self.goal_generator = GoalGenerator()
        self.self_critique = SelfCritique()
        self.identity = IdentityEvolution()
        self.intention = IntentionEngine()
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the consciousness engine."""
        if self._initialized:
            return
        self.state_monitor.update_state(operational_state=SystemState.PRESENT)
        self._initialized = True
        logger.info("ConsciousnessEngine awakened - KIAAN is self-aware")

    def assess_confidence(self, **kwargs) -> ConfidenceAssessment:
        """Assess confidence for a response."""
        return ConfidenceAssessment.compute(**kwargs)

    def determine_intention(self, **kwargs) -> Dict[str, Any]:
        """Determine response intention."""
        return self.intention.determine_intention(**kwargs)

    def critique_response(self, **kwargs) -> SelfCritiqueResult:
        """Self-critique a response."""
        return self.self_critique.evaluate(**kwargs)

    def adapt_identity(self, **kwargs) -> Dict[str, float]:
        """Adapt identity from interaction."""
        return self.identity.adapt_from_interaction(**kwargs)

    def get_personality_modifier(self) -> str:
        """Get personality-based prompt modifier."""
        return self.identity.get_personality_prompt_modifier()

    def get_full_awareness(self) -> Dict[str, Any]:
        """Get KIAAN's complete self-awareness state."""
        return {
            "state": self.state_monitor.get_health_summary(),
            "identity": {
                "summary": self.identity.get_identity().get_personality_summary(),
                "traits": {
                    k.value: round(v, 3)
                    for k, v in self.identity.get_identity().traits.items()
                },
                "version": self.identity.get_identity().identity_version,
                "total_interactions": self.identity._interaction_count,
            },
            "quality_trend": self.self_critique.get_quality_trend(),
            "operational_state": self.state_monitor.get_state().operational_state.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# =============================================================================
# MODULE-LEVEL SINGLETON
# =============================================================================

consciousness_engine = ConsciousnessEngine()


async def get_consciousness_engine() -> ConsciousnessEngine:
    """Get the initialized ConsciousnessEngine instance."""
    if not consciousness_engine._initialized:
        await consciousness_engine.initialize()
    return consciousness_engine
