"""
Spiritual Journey Memory Service

Deep integration with the journey system to remember and leverage:
- Which Gita verses resonated most with the user
- User's spiritual growth milestones
- Breakthrough moments in past sessions
- Specific struggles they've overcome
- Preferred teaching styles and metaphors

Features:
- Long-term spiritual context retention
- Growth trajectory analysis
- Personalized verse recommendations
- Milestone celebration triggers
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set, Tuple
from enum import Enum
import asyncio
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class MemoryType(Enum):
    """Types of spiritual memories."""
    VERSE_RESONANCE = "verse_resonance"
    BREAKTHROUGH = "breakthrough"
    STRUGGLE = "struggle"
    MILESTONE = "milestone"
    INSIGHT = "insight"
    TEACHING_PREFERENCE = "teaching_preference"
    EMOTIONAL_HEALING = "emotional_healing"


class GrowthDimension(Enum):
    """Dimensions of spiritual growth tracked."""
    EQUANIMITY = "equanimity"  # Samatvam - evenness of mind
    DETACHMENT = "detachment"  # Vairagya - non-attachment
    DEVOTION = "devotion"  # Bhakti
    KNOWLEDGE = "knowledge"  # Jnana
    ACTION = "action"  # Karma
    SELF_AWARENESS = "self_awareness"  # Atma-jnana
    COMPASSION = "compassion"  # Karuna
    DISCIPLINE = "discipline"  # Tapas


@dataclass
class VerseResonance:
    """Record of how a verse resonated with the user."""
    verse_id: str
    chapter: int
    verse_number: int
    sanskrit_text: Optional[str]
    translation: str
    resonance_score: float  # 0-1
    context: str  # What the user was going through
    user_reflection: Optional[str]
    times_revisited: int = 0
    first_encountered: datetime = field(default_factory=datetime.utcnow)
    last_revisited: Optional[datetime] = None
    emotional_context: Optional[str] = None


@dataclass
class SpiritualBreakthrough:
    """Record of a spiritual breakthrough moment."""
    id: str
    user_id: str
    description: str
    trigger_verse: Optional[str]
    trigger_journey: Optional[str]
    growth_dimensions: List[GrowthDimension]
    user_words: Optional[str]  # User's own description
    timestamp: datetime = field(default_factory=datetime.utcnow)
    validated: bool = False  # User confirmed this was meaningful


@dataclass
class SpiritualStruggle:
    """Record of a struggle the user is working through."""
    id: str
    user_id: str
    description: str
    category: str  # "anger", "attachment", "fear", etc.
    related_verses: List[str]
    related_journeys: List[str]
    status: str  # "active", "progressing", "overcome"
    progress_notes: List[Dict[str, Any]] = field(default_factory=list)
    first_mentioned: datetime = field(default_factory=datetime.utcnow)
    last_updated: datetime = field(default_factory=datetime.utcnow)


@dataclass
class GrowthMilestone:
    """A milestone in the user's spiritual journey."""
    id: str
    user_id: str
    milestone_type: str
    title: str
    description: str
    related_dimension: GrowthDimension
    achieved_at: datetime = field(default_factory=datetime.utcnow)
    celebrated: bool = False


@dataclass
class SpiritualProfile:
    """Complete spiritual profile for a user."""
    user_id: str
    resonant_verses: List[VerseResonance] = field(default_factory=list)
    breakthroughs: List[SpiritualBreakthrough] = field(default_factory=list)
    struggles: List[SpiritualStruggle] = field(default_factory=list)
    milestones: List[GrowthMilestone] = field(default_factory=list)
    growth_scores: Dict[GrowthDimension, float] = field(default_factory=dict)
    preferred_teaching_style: str = "balanced"  # "story", "analytical", "poetic", "balanced"
    preferred_metaphors: List[str] = field(default_factory=list)
    journeys_completed: List[str] = field(default_factory=list)
    total_reflection_time_hours: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_active: datetime = field(default_factory=datetime.utcnow)


class SpiritualMemoryService:
    """
    Service for maintaining deep spiritual memory and context.

    Remembers and leverages the user's spiritual journey to provide
    increasingly personalized and meaningful guidance.
    """

    def __init__(self):
        self._profiles: Dict[str, SpiritualProfile] = {}
        self._verse_database: Dict[str, Dict[str, Any]] = {}
        self._initialized = False

        # Verse-to-struggle mapping
        self._verse_struggle_mapping = self._initialize_verse_mapping()

        # Growth dimension milestones
        self._milestone_thresholds = {
            0.2: "Awakening",
            0.4: "Growing",
            0.6: "Deepening",
            0.8: "Flourishing",
            1.0: "Mastery"
        }

        logger.info("SpiritualMemoryService initialized")

    def _initialize_verse_mapping(self) -> Dict[str, List[str]]:
        """Map struggles to helpful verses."""
        return {
            "anger": ["2.62", "2.63", "3.37", "16.21"],  # Krodha verses
            "attachment": ["2.47", "2.55", "2.71", "5.3"],  # Detachment verses
            "fear": ["2.40", "4.10", "11.50", "18.30"],  # Fearlessness verses
            "desire": ["2.62", "2.70", "3.37", "5.22"],  # Desire control verses
            "confusion": ["2.7", "3.2", "18.63", "18.66"],  # Clarity verses
            "grief": ["2.11", "2.27", "2.30", "2.25"],  # Grief transcendence
            "anxiety": ["6.35", "9.22", "18.66", "12.6"],  # Peace verses
            "pride": ["16.4", "18.26", "13.8", "15.5"],  # Humility verses
        }

    async def initialize(self) -> None:
        """Initialize the service."""
        if self._initialized:
            return

        # In production, load verse database
        self._initialized = True
        logger.info("SpiritualMemoryService initialized")

    # ==================== Profile Management ====================

    def get_or_create_profile(self, user_id: str) -> SpiritualProfile:
        """Get existing profile or create a new one."""
        if user_id not in self._profiles:
            self._profiles[user_id] = SpiritualProfile(user_id=user_id)
            # Initialize growth scores
            for dimension in GrowthDimension:
                self._profiles[user_id].growth_scores[dimension] = 0.0
            logger.info(f"Created new spiritual profile for user {user_id}")

        return self._profiles[user_id]

    def update_last_active(self, user_id: str) -> None:
        """Update user's last active timestamp."""
        profile = self.get_or_create_profile(user_id)
        profile.last_active = datetime.utcnow()

    # ==================== Verse Resonance ====================

    def record_verse_resonance(
        self,
        user_id: str,
        verse_id: str,
        chapter: int,
        verse_number: int,
        translation: str,
        resonance_score: float,
        context: str,
        user_reflection: Optional[str] = None,
        emotional_context: Optional[str] = None,
        sanskrit_text: Optional[str] = None
    ) -> VerseResonance:
        """Record that a verse resonated with the user."""
        profile = self.get_or_create_profile(user_id)

        # Check if we already have this verse
        existing = next(
            (v for v in profile.resonant_verses if v.verse_id == verse_id),
            None
        )

        if existing:
            # Update existing record
            existing.resonance_score = (existing.resonance_score + resonance_score) / 2
            existing.times_revisited += 1
            existing.last_revisited = datetime.utcnow()
            if user_reflection:
                existing.user_reflection = user_reflection
            return existing

        # Create new record
        resonance = VerseResonance(
            verse_id=verse_id,
            chapter=chapter,
            verse_number=verse_number,
            sanskrit_text=sanskrit_text,
            translation=translation,
            resonance_score=resonance_score,
            context=context,
            user_reflection=user_reflection,
            emotional_context=emotional_context
        )

        profile.resonant_verses.append(resonance)

        # Keep top 50 most resonant verses
        profile.resonant_verses.sort(key=lambda v: v.resonance_score, reverse=True)
        profile.resonant_verses = profile.resonant_verses[:50]

        logger.debug(f"Recorded verse resonance for user {user_id}: {verse_id}")
        return resonance

    def get_most_resonant_verses(
        self,
        user_id: str,
        limit: int = 10,
        emotional_context: Optional[str] = None
    ) -> List[VerseResonance]:
        """Get user's most resonant verses, optionally filtered by emotion."""
        profile = self.get_or_create_profile(user_id)

        verses = profile.resonant_verses

        if emotional_context:
            # Filter by emotional context
            filtered = [
                v for v in verses
                if v.emotional_context == emotional_context
            ]
            if filtered:
                verses = filtered

        return sorted(
            verses,
            key=lambda v: v.resonance_score * (1 + v.times_revisited * 0.1),
            reverse=True
        )[:limit]

    def recommend_verse_for_struggle(
        self,
        user_id: str,
        struggle_category: str
    ) -> Optional[Dict[str, Any]]:
        """Recommend a verse based on user's struggle and history."""
        profile = self.get_or_create_profile(user_id)

        # Get verses for this struggle category
        suggested_verses = self._verse_struggle_mapping.get(struggle_category, [])

        if not suggested_verses:
            return None

        # Check user's resonance history
        resonant_for_category = [
            v for v in profile.resonant_verses
            if v.verse_id in suggested_verses
        ]

        if resonant_for_category:
            # Return most resonant verse they haven't seen recently
            for verse in sorted(resonant_for_category, key=lambda v: v.resonance_score, reverse=True):
                if not verse.last_revisited or (datetime.utcnow() - verse.last_revisited).days > 7:
                    return {
                        "verse_id": verse.verse_id,
                        "reason": "previously_resonant",
                        "resonance_score": verse.resonance_score,
                        "translation": verse.translation
                    }

        # Suggest a new verse they haven't encountered
        encountered_ids = {v.verse_id for v in profile.resonant_verses}
        new_suggestions = [v for v in suggested_verses if v not in encountered_ids]

        if new_suggestions:
            return {
                "verse_id": new_suggestions[0],
                "reason": "new_recommendation",
                "resonance_score": None
            }

        return None

    # ==================== Breakthroughs ====================

    def record_breakthrough(
        self,
        user_id: str,
        description: str,
        growth_dimensions: List[GrowthDimension],
        trigger_verse: Optional[str] = None,
        trigger_journey: Optional[str] = None,
        user_words: Optional[str] = None
    ) -> SpiritualBreakthrough:
        """Record a spiritual breakthrough moment."""
        profile = self.get_or_create_profile(user_id)

        breakthrough = SpiritualBreakthrough(
            id=f"bt_{user_id}_{len(profile.breakthroughs)}",
            user_id=user_id,
            description=description,
            trigger_verse=trigger_verse,
            trigger_journey=trigger_journey,
            growth_dimensions=growth_dimensions,
            user_words=user_words
        )

        profile.breakthroughs.append(breakthrough)

        # Update growth scores
        for dimension in growth_dimensions:
            current = profile.growth_scores.get(dimension, 0.0)
            profile.growth_scores[dimension] = min(1.0, current + 0.1)

        # Check for milestones
        self._check_milestones(user_id)

        logger.info(f"Recorded breakthrough for user {user_id}: {description[:50]}...")
        return breakthrough

    def validate_breakthrough(self, user_id: str, breakthrough_id: str) -> bool:
        """User confirms a breakthrough was meaningful."""
        profile = self.get_or_create_profile(user_id)

        for bt in profile.breakthroughs:
            if bt.id == breakthrough_id:
                bt.validated = True
                # Boost growth score for validated breakthroughs
                for dimension in bt.growth_dimensions:
                    current = profile.growth_scores.get(dimension, 0.0)
                    profile.growth_scores[dimension] = min(1.0, current + 0.05)
                return True

        return False

    # ==================== Struggles ====================

    def record_struggle(
        self,
        user_id: str,
        description: str,
        category: str
    ) -> SpiritualStruggle:
        """Record a struggle the user is working through."""
        profile = self.get_or_create_profile(user_id)

        # Check if similar struggle exists
        existing = next(
            (s for s in profile.struggles
             if s.category == category and s.status == "active"),
            None
        )

        if existing:
            # Add progress note
            existing.progress_notes.append({
                "timestamp": datetime.utcnow(),
                "note": description
            })
            existing.last_updated = datetime.utcnow()
            return existing

        # Create new struggle record
        struggle = SpiritualStruggle(
            id=f"st_{user_id}_{len(profile.struggles)}",
            user_id=user_id,
            description=description,
            category=category,
            related_verses=self._verse_struggle_mapping.get(category, []),
            related_journeys=self._get_journeys_for_struggle(category),
            status="active"
        )

        profile.struggles.append(struggle)
        logger.info(f"Recorded struggle for user {user_id}: {category}")
        return struggle

    def update_struggle_status(
        self,
        user_id: str,
        struggle_id: str,
        status: str,
        note: Optional[str] = None
    ) -> Optional[SpiritualStruggle]:
        """Update the status of a struggle."""
        profile = self.get_or_create_profile(user_id)

        for struggle in profile.struggles:
            if struggle.id == struggle_id:
                old_status = struggle.status
                struggle.status = status
                struggle.last_updated = datetime.utcnow()

                if note:
                    struggle.progress_notes.append({
                        "timestamp": datetime.utcnow(),
                        "note": note,
                        "status_change": f"{old_status} -> {status}"
                    })

                # If overcome, record as milestone
                if status == "overcome" and old_status != "overcome":
                    self._record_struggle_overcome_milestone(user_id, struggle)

                return struggle

        return None

    def get_active_struggles(self, user_id: str) -> List[SpiritualStruggle]:
        """Get user's active struggles."""
        profile = self.get_or_create_profile(user_id)
        return [s for s in profile.struggles if s.status in ["active", "progressing"]]

    def _get_journeys_for_struggle(self, category: str) -> List[str]:
        """Get recommended journey IDs for a struggle category."""
        journey_mapping = {
            "anger": ["transform-anger-krodha", "peace-through-acceptance"],
            "attachment": ["letting-go-journey", "non-attachment-practice"],
            "fear": ["courage-from-within", "fearless-living"],
            "anxiety": ["calm-mind-journey", "present-moment-peace"],
            "confusion": ["clarity-of-purpose", "dharma-discovery"],
            "grief": ["healing-through-wisdom", "eternal-perspective"],
        }
        return journey_mapping.get(category, [])

    # ==================== Milestones ====================

    def _check_milestones(self, user_id: str) -> List[GrowthMilestone]:
        """Check if user has achieved any new milestones."""
        profile = self.get_or_create_profile(user_id)
        new_milestones = []

        for dimension, score in profile.growth_scores.items():
            for threshold, level in sorted(self._milestone_thresholds.items()):
                if score >= threshold:
                    # Check if this milestone exists
                    milestone_id = f"ms_{dimension.value}_{level}"
                    existing = any(
                        m.id == milestone_id for m in profile.milestones
                    )

                    if not existing:
                        milestone = GrowthMilestone(
                            id=milestone_id,
                            user_id=user_id,
                            milestone_type=level,
                            title=f"{level} in {dimension.value.replace('_', ' ').title()}",
                            description=self._get_milestone_description(dimension, level),
                            related_dimension=dimension
                        )
                        profile.milestones.append(milestone)
                        new_milestones.append(milestone)
                        logger.info(f"User {user_id} achieved milestone: {milestone.title}")

        return new_milestones

    def _get_milestone_description(
        self,
        dimension: GrowthDimension,
        level: str
    ) -> str:
        """Get description for a milestone."""
        descriptions = {
            GrowthDimension.EQUANIMITY: {
                "Awakening": "You've begun to notice the fluctuations of your mind.",
                "Growing": "You're developing the ability to pause before reacting.",
                "Deepening": "Equanimity is becoming your natural response to challenges.",
                "Flourishing": "You maintain peace even in turbulent circumstances.",
                "Mastery": "You embody the Gita's teaching: 'Alike in pleasure and pain.'",
            },
            GrowthDimension.DETACHMENT: {
                "Awakening": "You're beginning to see attachment as a source of suffering.",
                "Growing": "You can let go of small attachments with awareness.",
                "Deepening": "Non-attachment is becoming a practice, not just a concept.",
                "Flourishing": "You act without being bound by the fruits of action.",
                "Mastery": "You've realized: 'You have the right to work, but not to its fruits.'",
            },
            # Add more descriptions as needed
        }

        return descriptions.get(dimension, {}).get(
            level,
            f"You've reached the {level} stage in {dimension.value}."
        )

    def _record_struggle_overcome_milestone(
        self,
        user_id: str,
        struggle: SpiritualStruggle
    ) -> GrowthMilestone:
        """Record milestone for overcoming a struggle."""
        profile = self.get_or_create_profile(user_id)

        milestone = GrowthMilestone(
            id=f"ms_overcome_{struggle.id}",
            user_id=user_id,
            milestone_type="Victory",
            title=f"Overcame {struggle.category.title()}",
            description=f"You've made significant progress in overcoming {struggle.category}.",
            related_dimension=GrowthDimension.SELF_AWARENESS
        )

        profile.milestones.append(milestone)
        return milestone

    def get_uncelebrated_milestones(self, user_id: str) -> List[GrowthMilestone]:
        """Get milestones that haven't been celebrated yet."""
        profile = self.get_or_create_profile(user_id)
        return [m for m in profile.milestones if not m.celebrated]

    def mark_milestone_celebrated(self, user_id: str, milestone_id: str) -> bool:
        """Mark a milestone as celebrated."""
        profile = self.get_or_create_profile(user_id)

        for milestone in profile.milestones:
            if milestone.id == milestone_id:
                milestone.celebrated = True
                return True

        return False

    # ==================== Teaching Preferences ====================

    def update_teaching_preference(
        self,
        user_id: str,
        style: str,
        signal_strength: float = 1.0
    ) -> None:
        """Update user's teaching style preference based on engagement."""
        profile = self.get_or_create_profile(user_id)

        # Simple preference update - could be made more sophisticated
        if signal_strength > 0.7:
            profile.preferred_teaching_style = style

    def add_preferred_metaphor(self, user_id: str, metaphor: str) -> None:
        """Add a metaphor that resonated with the user."""
        profile = self.get_or_create_profile(user_id)

        if metaphor not in profile.preferred_metaphors:
            profile.preferred_metaphors.append(metaphor)
            # Keep last 20 preferred metaphors
            profile.preferred_metaphors = profile.preferred_metaphors[-20:]

    # ==================== Analytics ====================

    def get_spiritual_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a summary of user's spiritual journey."""
        profile = self.get_or_create_profile(user_id)

        return {
            "journey_age_days": (datetime.utcnow() - profile.created_at).days,
            "verses_encountered": len(profile.resonant_verses),
            "top_resonant_verses": [
                {"verse_id": v.verse_id, "score": v.resonance_score}
                for v in profile.resonant_verses[:5]
            ],
            "breakthroughs_count": len(profile.breakthroughs),
            "validated_breakthroughs": len([b for b in profile.breakthroughs if b.validated]),
            "active_struggles": len([s for s in profile.struggles if s.status == "active"]),
            "overcome_struggles": len([s for s in profile.struggles if s.status == "overcome"]),
            "milestones_achieved": len(profile.milestones),
            "growth_scores": {d.value: s for d, s in profile.growth_scores.items()},
            "strongest_dimensions": sorted(
                profile.growth_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )[:3],
            "teaching_style": profile.preferred_teaching_style,
            "reflection_hours": profile.total_reflection_time_hours,
            "journeys_completed": len(profile.journeys_completed),
        }

    def get_growth_trajectory(
        self,
        user_id: str,
        dimension: Optional[GrowthDimension] = None
    ) -> List[Dict[str, Any]]:
        """Get growth trajectory over time."""
        profile = self.get_or_create_profile(user_id)

        # Build trajectory from breakthroughs and milestones
        events = []

        for bt in profile.breakthroughs:
            for dim in bt.growth_dimensions:
                if dimension is None or dim == dimension:
                    events.append({
                        "type": "breakthrough",
                        "dimension": dim.value,
                        "timestamp": bt.timestamp,
                        "description": bt.description[:100]
                    })

        for ms in profile.milestones:
            if dimension is None or ms.related_dimension == dimension:
                events.append({
                    "type": "milestone",
                    "dimension": ms.related_dimension.value,
                    "timestamp": ms.achieved_at,
                    "title": ms.title
                })

        return sorted(events, key=lambda x: x["timestamp"])


# Singleton instance
_spiritual_memory_instance: Optional[SpiritualMemoryService] = None


def get_spiritual_memory_service() -> SpiritualMemoryService:
    """Get the singleton spiritual memory service instance."""
    global _spiritual_memory_instance
    if _spiritual_memory_instance is None:
        _spiritual_memory_instance = SpiritualMemoryService()
    return _spiritual_memory_instance
