"""
Advanced Mood Analytics Engine

A behavioral science-grounded system for deep emotional analysis, integrating:
- Russell's Circumplex Model (Valence-Arousal dimensions)
- Cognitive Distortion Detection (CBT-based)
- Emotional Intensity Quantification
- Pattern Recognition across sessions
- Guna (Quality) Assessment from Bhagavad Gita

This engine powers both Emotional Reset and Karmic Reset features with
psychology-backed analysis that translates to actionable Gita wisdom.

Research foundations:
- Russell, J.A. (1980). A circumplex model of affect.
- Beck, A.T. (1979). Cognitive therapy and the emotional disorders.
- Plutchik, R. (2001). The nature of emotions.
"""

import datetime
import logging
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# =============================================================================
# CORE DATA STRUCTURES
# =============================================================================

class Guna(Enum):
    """
    The three Gunas (qualities) from Bhagavad Gita Chapter 14.

    Every emotion, thought, and action can be classified by its predominant guna:
    - Sattva: Pure, harmonious, illuminating (BG 14.6)
    - Rajas: Active, passionate, restless (BG 14.7)
    - Tamas: Dark, inert, deluding (BG 14.8)
    """
    SATTVA = "sattva"  # Purity, wisdom, peace
    RAJAS = "rajas"    # Passion, activity, desire
    TAMAS = "tamas"    # Darkness, inertia, delusion


class EmotionalQuadrant(Enum):
    """
    Russell's Circumplex Model quadrants based on valence and arousal.

    High Arousal + Positive Valence = Activated Pleasant (joy, excitement)
    High Arousal + Negative Valence = Activated Unpleasant (anger, anxiety)
    Low Arousal + Positive Valence = Deactivated Pleasant (calm, content)
    Low Arousal + Negative Valence = Deactivated Unpleasant (sad, depressed)
    """
    ACTIVATED_PLEASANT = "activated_pleasant"      # Joy, excitement, enthusiasm
    ACTIVATED_UNPLEASANT = "activated_unpleasant"  # Anger, anxiety, fear
    DEACTIVATED_PLEASANT = "deactivated_pleasant"  # Calm, relaxed, content
    DEACTIVATED_UNPLEASANT = "deactivated_unpleasant"  # Sad, depressed, bored


class CognitiveDistortion(Enum):
    """
    Common cognitive distortions from CBT (Beck, 1979).

    These are systematic errors in thinking that worsen emotional states.
    Identifying them allows for targeted interventions.
    """
    ALL_OR_NOTHING = "all_or_nothing"          # Black-and-white thinking
    CATASTROPHIZING = "catastrophizing"        # Expecting the worst
    OVERGENERALIZATION = "overgeneralization"  # One event = always
    MIND_READING = "mind_reading"              # Assuming others' thoughts
    FORTUNE_TELLING = "fortune_telling"        # Predicting negative future
    EMOTIONAL_REASONING = "emotional_reasoning"  # Feelings = facts
    SHOULD_STATEMENTS = "should_statements"    # Rigid expectations
    LABELING = "labeling"                      # Fixed negative identity
    PERSONALIZATION = "personalization"        # Blaming self for external
    DISCOUNTING_POSITIVE = "discounting_positive"  # Ignoring good things


@dataclass
class EmotionVector:
    """
    Multi-dimensional representation of an emotional state.

    Attributes:
        valence: Pleasantness (-1 to +1, negative to positive)
        arousal: Activation level (-1 to +1, low to high energy)
        intensity: Strength of emotion (0 to 1)
        quadrant: Which section of circumplex model
        guna: Predominant quality (sattva, rajas, tamas)
    """
    valence: float = 0.0      # -1 (unpleasant) to +1 (pleasant)
    arousal: float = 0.0      # -1 (deactivated) to +1 (activated)
    intensity: float = 0.5    # 0 (mild) to 1 (intense)
    quadrant: EmotionalQuadrant = EmotionalQuadrant.DEACTIVATED_PLEASANT
    guna: Guna = Guna.SATTVA

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "valence": round(self.valence, 3),
            "arousal": round(self.arousal, 3),
            "intensity": round(self.intensity, 3),
            "quadrant": self.quadrant.value,
            "guna": self.guna.value,
            "distance_from_center": round(
                math.sqrt(self.valence**2 + self.arousal**2), 3
            ),
        }


@dataclass
class MoodAnalysis:
    """
    Comprehensive analysis result from the Mood Analytics Engine.

    Contains all dimensions of emotional understanding needed for
    personalized reset protocols and Gita wisdom mapping.
    """
    # Core emotions detected
    primary_emotion: str = "neutral"
    secondary_emotions: list[str] = field(default_factory=list)

    # Vector representation
    emotion_vector: EmotionVector = field(default_factory=EmotionVector)

    # Cognitive patterns
    distortions_detected: list[CognitiveDistortion] = field(default_factory=list)
    distortion_severity: float = 0.0  # 0 to 1

    # Themes and context
    life_domains: list[str] = field(default_factory=list)
    temporal_orientation: str = "present"  # past, present, future

    # Gita-specific insights
    guna_balance: dict[str, float] = field(default_factory=dict)
    recommended_yoga_path: str = "karma"  # karma, jnana, bhakti, dhyana

    # Reset recommendations
    breathing_protocol: str = "balanced"  # calming, energizing, balanced
    reset_intensity: str = "moderate"  # gentle, moderate, deep

    # Confidence metrics
    analysis_confidence: float = 0.7

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "primary_emotion": self.primary_emotion,
            "secondary_emotions": self.secondary_emotions,
            "emotion_vector": self.emotion_vector.to_dict(),
            "distortions_detected": [d.value for d in self.distortions_detected],
            "distortion_severity": round(self.distortion_severity, 2),
            "life_domains": self.life_domains,
            "temporal_orientation": self.temporal_orientation,
            "guna_balance": {k: round(v, 2) for k, v in self.guna_balance.items()},
            "recommended_yoga_path": self.recommended_yoga_path,
            "breathing_protocol": self.breathing_protocol,
            "reset_intensity": self.reset_intensity,
            "analysis_confidence": round(self.analysis_confidence, 2),
        }


# =============================================================================
# EMOTION LEXICON
# =============================================================================

# Emotion mappings to valence-arousal coordinates
# Based on Russell's Circumplex Model research
EMOTION_COORDINATES: dict[str, tuple[float, float, Guna]] = {
    # Activated Pleasant (High Arousal + Positive Valence) - Often Rajasic joy
    "excited": (0.8, 0.8, Guna.RAJAS),
    "joyful": (0.9, 0.7, Guna.SATTVA),
    "happy": (0.8, 0.5, Guna.SATTVA),
    "enthusiastic": (0.7, 0.9, Guna.RAJAS),
    "elated": (0.9, 0.8, Guna.RAJAS),
    "inspired": (0.8, 0.6, Guna.SATTVA),
    "hopeful": (0.6, 0.3, Guna.SATTVA),
    "grateful": (0.8, 0.2, Guna.SATTVA),

    # Activated Unpleasant (High Arousal + Negative Valence) - Often Rajasic
    "anxious": (-0.6, 0.8, Guna.RAJAS),
    "angry": (-0.7, 0.9, Guna.RAJAS),
    "frustrated": (-0.6, 0.7, Guna.RAJAS),
    "stressed": (-0.5, 0.8, Guna.RAJAS),
    "fearful": (-0.7, 0.8, Guna.RAJAS),
    "panicked": (-0.8, 0.95, Guna.RAJAS),
    "irritated": (-0.5, 0.6, Guna.RAJAS),
    "enraged": (-0.9, 0.95, Guna.RAJAS),
    "worried": (-0.5, 0.6, Guna.RAJAS),
    "nervous": (-0.4, 0.7, Guna.RAJAS),
    "overwhelmed": (-0.6, 0.85, Guna.RAJAS),
    "agitated": (-0.5, 0.8, Guna.RAJAS),

    # Deactivated Pleasant (Low Arousal + Positive Valence) - Sattvic
    "calm": (0.6, -0.4, Guna.SATTVA),
    "peaceful": (0.7, -0.5, Guna.SATTVA),
    "relaxed": (0.6, -0.6, Guna.SATTVA),
    "content": (0.7, -0.3, Guna.SATTVA),
    "serene": (0.8, -0.6, Guna.SATTVA),
    "tranquil": (0.7, -0.7, Guna.SATTVA),
    "satisfied": (0.6, -0.2, Guna.SATTVA),
    "accepting": (0.5, -0.3, Guna.SATTVA),

    # Deactivated Unpleasant (Low Arousal + Negative Valence) - Often Tamasic
    "sad": (-0.7, -0.3, Guna.TAMAS),
    "depressed": (-0.8, -0.6, Guna.TAMAS),
    "hopeless": (-0.9, -0.5, Guna.TAMAS),
    "lonely": (-0.6, -0.4, Guna.TAMAS),
    "tired": (-0.3, -0.7, Guna.TAMAS),
    "exhausted": (-0.4, -0.8, Guna.TAMAS),
    "bored": (-0.3, -0.5, Guna.TAMAS),
    "empty": (-0.7, -0.6, Guna.TAMAS),
    "numb": (-0.5, -0.7, Guna.TAMAS),
    "disconnected": (-0.5, -0.5, Guna.TAMAS),
    "defeated": (-0.8, -0.4, Guna.TAMAS),
    "grief": (-0.8, -0.2, Guna.TAMAS),
    "melancholy": (-0.5, -0.4, Guna.TAMAS),

    # Mixed/Complex emotions
    "confused": (-0.3, 0.4, Guna.TAMAS),
    "uncertain": (-0.3, 0.2, Guna.RAJAS),
    "ambivalent": (0.0, 0.3, Guna.RAJAS),
    "nostalgic": (0.2, -0.3, Guna.SATTVA),
    "guilty": (-0.6, 0.3, Guna.RAJAS),
    "ashamed": (-0.7, 0.4, Guna.TAMAS),
    "jealous": (-0.6, 0.6, Guna.RAJAS),
    "resentful": (-0.7, 0.5, Guna.RAJAS),
    "regretful": (-0.5, -0.2, Guna.TAMAS),
    "bitter": (-0.6, 0.3, Guna.TAMAS),
}

# Keywords that map to emotions
EMOTION_KEYWORDS: dict[str, list[str]] = {
    "anxious": ["anxious", "anxiety", "worried", "worry", "nervous", "uneasy", "restless"],
    "stressed": ["stress", "stressed", "pressure", "pressured", "tense", "tension", "strained"],
    "sad": ["sad", "unhappy", "down", "blue", "tearful", "crying", "low"],
    "depressed": ["depressed", "depression", "despair", "hopeless", "worthless"],
    "angry": ["angry", "mad", "furious", "enraged", "livid", "infuriated"],
    "frustrated": ["frustrated", "frustration", "annoyed", "irritated", "exasperated"],
    "fearful": ["afraid", "scared", "terrified", "frightened", "fear", "panic"],
    "overwhelmed": ["overwhelmed", "too much", "drowning", "swamped", "buried"],
    "hopeless": ["hopeless", "pointless", "no hope", "giving up", "what's the point"],
    "confused": ["confused", "lost", "uncertain", "unsure", "don't know", "puzzled"],
    "lonely": ["lonely", "alone", "isolated", "disconnected", "abandoned"],
    "guilty": ["guilty", "guilt", "blame myself", "my fault", "should have"],
    "ashamed": ["ashamed", "shame", "embarrassed", "humiliated", "disgrace"],
    "calm": ["calm", "peaceful", "relaxed", "at ease", "tranquil", "serene"],
    "happy": ["happy", "joyful", "glad", "pleased", "delighted", "cheerful"],
    "grateful": ["grateful", "thankful", "blessed", "appreciative", "fortunate"],
    "hopeful": ["hopeful", "optimistic", "looking forward", "positive"],
    "content": ["content", "satisfied", "fulfilled", "at peace", "comfortable"],
    "tired": ["tired", "exhausted", "fatigued", "drained", "worn out", "burnt out"],
    "numb": ["numb", "empty", "void", "nothing", "hollow", "blank"],
}


# =============================================================================
# COGNITIVE DISTORTION DETECTION
# =============================================================================

# Patterns that indicate cognitive distortions
DISTORTION_PATTERNS: dict[CognitiveDistortion, list[str]] = {
    CognitiveDistortion.ALL_OR_NOTHING: [
        "always", "never", "every time", "nothing ever", "everything",
        "completely", "totally", "absolutely nothing", "100%", "0%",
        "all or nothing", "black and white", "perfect or failure",
    ],
    CognitiveDistortion.CATASTROPHIZING: [
        "worst thing", "disaster", "catastrophe", "end of the world",
        "can't survive", "never recover", "ruin everything", "destroy",
        "terrible", "horrible", "the worst", "unbearable", "can't handle",
    ],
    CognitiveDistortion.OVERGENERALIZATION: [
        "always happens", "never works", "every single time",
        "this always", "i always", "they always", "nobody ever",
        "everyone always", "nothing ever changes", "same thing always",
    ],
    CognitiveDistortion.MIND_READING: [
        "they think", "he thinks", "she thinks", "people think",
        "everyone thinks", "they must think", "probably thinks",
        "judging me", "looking at me", "laughing at me", "hate me",
    ],
    CognitiveDistortion.FORTUNE_TELLING: [
        "will fail", "going to fail", "won't work", "will never",
        "bound to", "doomed", "inevitable", "guaranteed to fail",
        "never going to", "will definitely", "won't ever",
    ],
    CognitiveDistortion.EMOTIONAL_REASONING: [
        "i feel like", "feels like", "i feel that", "because i feel",
        "my gut says", "i just know", "sense that",
    ],
    CognitiveDistortion.SHOULD_STATEMENTS: [
        "should have", "must have", "ought to", "have to",
        "need to", "supposed to", "should be", "must be",
        "shouldn't have", "shouldn't be", "mustn't",
    ],
    CognitiveDistortion.LABELING: [
        "i'm a failure", "i'm stupid", "i'm worthless", "i'm a loser",
        "i'm an idiot", "i'm useless", "i'm pathetic", "i'm weak",
        "i'm a bad person", "i'm terrible", "i'm broken",
    ],
    CognitiveDistortion.PERSONALIZATION: [
        "my fault", "because of me", "i caused", "i made them",
        "i ruined", "blame myself", "i'm responsible for",
        "if only i had", "if i hadn't",
    ],
    CognitiveDistortion.DISCOUNTING_POSITIVE: [
        "doesn't count", "just luck", "anyone could", "not a big deal",
        "but", "yeah but", "that doesn't matter", "so what",
        "not good enough", "could have been better",
    ],
}


# =============================================================================
# LIFE DOMAINS
# =============================================================================

LIFE_DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "relationships": [
        "relationship", "partner", "spouse", "husband", "wife", "boyfriend",
        "girlfriend", "dating", "marriage", "divorce", "breakup", "love",
        "romantic", "intimacy", "trust", "commitment",
    ],
    "family": [
        "family", "parents", "mother", "father", "mom", "dad", "children",
        "kids", "son", "daughter", "sibling", "brother", "sister",
        "grandparents", "relatives", "in-laws",
    ],
    "work": [
        "work", "job", "career", "boss", "manager", "coworker", "colleague",
        "office", "company", "business", "professional", "workplace",
        "promotion", "fired", "layoff", "interview",
    ],
    "health": [
        "health", "sick", "illness", "disease", "doctor", "hospital",
        "medication", "pain", "chronic", "diagnosis", "treatment",
        "spiritual wellness", "physical", "body", "sleep", "insomnia",
    ],
    "finances": [
        "money", "financial", "debt", "bills", "savings", "income",
        "expenses", "budget", "afford", "loan", "mortgage", "rent",
        "poverty", "wealth", "investment",
    ],
    "self_identity": [
        "myself", "who i am", "identity", "purpose", "meaning",
        "self-worth", "confidence", "self-esteem", "value", "believe in",
        "what i want", "life direction", "goals", "dreams",
    ],
    "social": [
        "friends", "friendship", "social", "people", "community",
        "belonging", "loneliness", "isolation", "connection", "network",
        "peers", "group", "fitting in", "accepted",
    ],
    "spiritual": [
        "spiritual", "faith", "belief", "god", "religion", "prayer",
        "meditation", "soul", "purpose", "meaning of life", "existence",
        "higher power", "universe", "karma", "dharma",
    ],
}


# =============================================================================
# MOOD ANALYTICS ENGINE
# =============================================================================

class MoodAnalyticsEngine:
    """
    Advanced emotional analysis engine combining behavioral science
    and Bhagavad Gita wisdom frameworks.

    This engine provides:
    1. Multi-dimensional emotion mapping (Valence-Arousal-Intensity)
    2. Cognitive distortion detection for targeted interventions
    3. Guna (quality) assessment for Gita-aligned guidance
    4. Personalized reset protocol recommendations
    5. Pattern recognition for longitudinal insights
    """

    def __init__(self) -> None:
        """Initialize the Mood Analytics Engine."""
        self._emotion_cache: dict[str, EmotionVector] = {}
        logger.info("MoodAnalyticsEngine initialized")

    def analyze(self, text: str, context: dict[str, Any] | None = None) -> MoodAnalysis:
        """
        Perform comprehensive mood analysis on user input.

        Args:
            text: User's emotional expression (raw text)
            context: Optional context (previous emotions, time of day, etc.)

        Returns:
            MoodAnalysis with all dimensions of emotional understanding
        """
        if not text or len(text.strip()) < 3:
            return MoodAnalysis(analysis_confidence=0.3)

        text_lower = text.lower()
        context = context or {}

        # Step 1: Detect emotions and create vector
        emotions = self._detect_emotions(text_lower)
        vector = self._calculate_emotion_vector(emotions)

        # Step 2: Detect cognitive distortions
        distortions = self._detect_distortions(text_lower)
        distortion_severity = len(distortions) / len(CognitiveDistortion) * 2  # Scale
        distortion_severity = min(distortion_severity, 1.0)

        # Step 3: Identify life domains
        domains = self._identify_life_domains(text_lower)

        # Step 4: Determine temporal orientation
        temporal = self._detect_temporal_orientation(text_lower)

        # Step 5: Calculate Guna balance
        guna_balance = self._calculate_guna_balance(emotions, vector)

        # Step 6: Recommend yoga path based on analysis
        yoga_path = self._recommend_yoga_path(vector, domains, guna_balance)

        # Step 7: Determine reset protocol
        breathing = self._determine_breathing_protocol(vector)
        intensity = self._determine_reset_intensity(vector, distortion_severity)

        # Step 8: Calculate confidence
        confidence = self._calculate_confidence(emotions, len(text))

        # Build analysis result
        primary = emotions[0] if emotions else "neutral"
        secondary = emotions[1:4] if len(emotions) > 1 else []

        return MoodAnalysis(
            primary_emotion=primary,
            secondary_emotions=secondary,
            emotion_vector=vector,
            distortions_detected=distortions,
            distortion_severity=distortion_severity,
            life_domains=domains,
            temporal_orientation=temporal,
            guna_balance=guna_balance,
            recommended_yoga_path=yoga_path,
            breathing_protocol=breathing,
            reset_intensity=intensity,
            analysis_confidence=confidence,
        )

    def _detect_emotions(self, text: str) -> list[str]:
        """
        Detect emotions from text using keyword matching.

        Returns emotions sorted by match strength.
        """
        emotion_scores: dict[str, int] = {}

        for emotion, keywords in EMOTION_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text)
            if score > 0:
                emotion_scores[emotion] = score

        # Sort by score descending
        sorted_emotions = sorted(
            emotion_scores.keys(),
            key=lambda e: emotion_scores[e],
            reverse=True
        )

        return sorted_emotions if sorted_emotions else ["uncertain"]

    def _calculate_emotion_vector(self, emotions: list[str]) -> EmotionVector:
        """
        Calculate weighted emotion vector from detected emotions.

        Uses first emotion as primary with weight 1.0,
        subsequent emotions with decreasing weights.
        """
        if not emotions:
            return EmotionVector()

        total_valence = 0.0
        total_arousal = 0.0
        total_weight = 0.0
        guna_counts: dict[Guna, float] = {g: 0.0 for g in Guna}

        for i, emotion in enumerate(emotions[:5]):  # Max 5 emotions
            weight = 1.0 / (i + 1)  # Decreasing weights

            if emotion in EMOTION_COORDINATES:
                valence, arousal, guna = EMOTION_COORDINATES[emotion]
                total_valence += valence * weight
                total_arousal += arousal * weight
                total_weight += weight
                guna_counts[guna] += weight

        if total_weight == 0:
            return EmotionVector()

        avg_valence = total_valence / total_weight
        avg_arousal = total_arousal / total_weight

        # Determine quadrant
        quadrant = self._determine_quadrant(avg_valence, avg_arousal)

        # Determine predominant guna
        predominant_guna = max(guna_counts.keys(), key=lambda g: guna_counts[g])

        # Calculate intensity from distance from center
        intensity = min(math.sqrt(avg_valence**2 + avg_arousal**2), 1.0)

        return EmotionVector(
            valence=avg_valence,
            arousal=avg_arousal,
            intensity=intensity,
            quadrant=quadrant,
            guna=predominant_guna,
        )

    def _determine_quadrant(
        self, valence: float, arousal: float
    ) -> EmotionalQuadrant:
        """Determine which quadrant of the circumplex model."""
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

    def _detect_distortions(self, text: str) -> list[CognitiveDistortion]:
        """Detect cognitive distortions in the text."""
        detected = []

        for distortion, patterns in DISTORTION_PATTERNS.items():
            if any(pattern in text for pattern in patterns):
                detected.append(distortion)

        return detected

    def _identify_life_domains(self, text: str) -> list[str]:
        """Identify which life domains are relevant."""
        domains = []

        for domain, keywords in LIFE_DOMAIN_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                domains.append(domain)

        return domains if domains else ["general"]

    def _detect_temporal_orientation(self, text: str) -> str:
        """Detect whether focus is on past, present, or future."""
        past_markers = [
            "was", "were", "had", "did", "used to", "remember", "back then",
            "yesterday", "last week", "last year", "ago", "before",
        ]
        future_markers = [
            "will", "going to", "tomorrow", "next", "soon", "later",
            "future", "eventually", "someday", "planning to",
        ]
        present_markers = [
            "am", "is", "are", "now", "today", "currently", "right now",
            "at the moment", "these days", "lately",
        ]

        past_count = sum(1 for m in past_markers if m in text)
        future_count = sum(1 for m in future_markers if m in text)
        present_count = sum(1 for m in present_markers if m in text)

        max_count = max(past_count, future_count, present_count)

        if max_count == 0:
            return "present"

        if past_count == max_count:
            return "past"
        elif future_count == max_count:
            return "future"
        else:
            return "present"

    def _calculate_guna_balance(
        self,
        emotions: list[str],
        vector: EmotionVector
    ) -> dict[str, float]:
        """
        Calculate the balance of three Gunas.

        Based on Bhagavad Gita Chapter 14:
        - Sattva (purity): positive valence, low arousal
        - Rajas (passion): high arousal (positive or negative)
        - Tamas (darkness): negative valence, low arousal
        """
        sattva = 0.0
        rajas = 0.0
        tamas = 0.0

        # From emotion vector
        if vector.valence > 0:
            sattva += vector.valence * 0.5
        else:
            tamas += abs(vector.valence) * 0.5

        if abs(vector.arousal) > 0.3:
            rajas += abs(vector.arousal) * 0.5

        if vector.arousal < -0.3 and vector.valence < 0:
            tamas += 0.3

        # From individual emotions
        for emotion in emotions[:3]:
            if emotion in EMOTION_COORDINATES:
                _, _, guna = EMOTION_COORDINATES[emotion]
                if guna == Guna.SATTVA:
                    sattva += 0.2
                elif guna == Guna.RAJAS:
                    rajas += 0.2
                else:
                    tamas += 0.2

        # Normalize to sum to 1
        total = sattva + rajas + tamas
        if total > 0:
            sattva /= total
            rajas /= total
            tamas /= total
        else:
            sattva = rajas = tamas = 0.33

        return {
            "sattva": sattva,
            "rajas": rajas,
            "tamas": tamas,
        }

    def _recommend_yoga_path(
        self,
        vector: EmotionVector,
        domains: list[str],
        guna_balance: dict[str, float]
    ) -> str:
        """
        Recommend a yoga path based on emotional state.

        From Bhagavad Gita:
        - Karma Yoga: Path of action (for those stuck in inaction)
        - Jnana Yoga: Path of knowledge (for confusion/seeking understanding)
        - Bhakti Yoga: Path of devotion (for loneliness/disconnection)
        - Dhyana Yoga: Path of meditation (for high arousal/anxiety)
        """
        # High arousal → Dhyana (meditation to calm)
        if vector.arousal > 0.6:
            return "dhyana"

        # High Tamas (inertia) → Karma (action)
        if guna_balance.get("tamas", 0) > 0.5:
            return "karma"

        # Confusion or self-identity issues → Jnana (knowledge)
        if "self_identity" in domains or vector.quadrant == EmotionalQuadrant.DEACTIVATED_UNPLEASANT:
            return "jnana"

        # Loneliness or relationship issues → Bhakti (devotion/connection)
        if "relationships" in domains or "social" in domains:
            return "bhakti"

        # Default to Karma yoga (action)
        return "karma"

    def _determine_breathing_protocol(self, vector: EmotionVector) -> str:
        """
        Determine optimal breathing protocol based on emotional state.

        - High arousal (anxiety) → Calming (longer exhale)
        - Low arousal (depression) → Energizing (equal or longer inhale)
        - Balanced → Standard 4-4-4-4
        """
        if vector.arousal > 0.5:
            return "calming"  # 4-4-6-2 (longer exhale to activate parasympathetic)
        elif vector.arousal < -0.3 and vector.valence < 0:
            return "energizing"  # 6-2-4-2 (energizing breath for lethargy)
        else:
            return "balanced"  # 4-4-4-4 (box breathing)

    def _determine_reset_intensity(
        self,
        vector: EmotionVector,
        distortion_severity: float
    ) -> str:
        """
        Determine how intense the reset session should be.

        - High distortion + high intensity → Deep reset
        - Moderate → Standard reset
        - Low intensity → Gentle reset
        """
        combined_score = vector.intensity + distortion_severity

        if combined_score > 1.3:
            return "deep"
        elif combined_score > 0.6:
            return "moderate"
        else:
            return "gentle"

    def _calculate_confidence(
        self, emotions: list[str], text_length: int
    ) -> float:
        """Calculate confidence in the analysis."""
        # More emotions detected → higher confidence
        emotion_factor = min(len(emotions) / 3, 1.0) * 0.4

        # Longer text → higher confidence (up to a point)
        length_factor = min(text_length / 100, 1.0) * 0.3

        # Base confidence
        base = 0.3

        return min(base + emotion_factor + length_factor, 0.95)

    def get_gita_verse_themes(self, analysis: MoodAnalysis) -> list[str]:
        """
        Generate Gita verse search themes based on analysis.

        Maps emotional state to relevant Gita concepts.
        """
        themes = []

        # From primary emotion
        emotion_theme_map = {
            "anxious": ["equanimity", "detachment", "surrender"],
            "angry": ["self-control", "forgiveness", "compassion"],
            "sad": ["impermanence", "eternal-self", "hope"],
            "hopeless": ["divine-grace", "surrender", "faith"],
            "confused": ["discrimination", "wisdom", "guidance"],
            "overwhelmed": ["acceptance", "duty", "focus"],
            "stressed": ["balance", "equanimity", "letting-go"],
            "fearful": ["courage", "protection", "faith"],
            "guilty": ["forgiveness", "karma", "redemption"],
            "lonely": ["connection", "devotion", "divine-love"],
        }

        if analysis.primary_emotion in emotion_theme_map:
            themes.extend(emotion_theme_map[analysis.primary_emotion])

        # From Guna imbalance
        if analysis.guna_balance.get("tamas", 0) > 0.4:
            themes.extend(["action", "awakening", "energy"])
        if analysis.guna_balance.get("rajas", 0) > 0.5:
            themes.extend(["peace", "stillness", "contentment"])

        # From yoga path
        yoga_themes = {
            "karma": ["action", "duty", "detachment-from-results"],
            "jnana": ["knowledge", "discrimination", "self-inquiry"],
            "bhakti": ["devotion", "surrender", "divine-love"],
            "dhyana": ["meditation", "focus", "stillness"],
        }

        if analysis.recommended_yoga_path in yoga_themes:
            themes.extend(yoga_themes[analysis.recommended_yoga_path])

        # Deduplicate while preserving order
        seen = set()
        unique_themes = []
        for theme in themes:
            if theme not in seen:
                seen.add(theme)
                unique_themes.append(theme)

        return unique_themes[:6]  # Return top 6 themes

    def get_adaptive_breathing_pattern(
        self, analysis: MoodAnalysis
    ) -> dict[str, Any]:
        """
        Generate adaptive breathing pattern based on emotional state.

        Based on research:
        - Longer exhale activates parasympathetic (calming)
        - Energizing breath uses quicker rhythm
        - Box breathing is balanced
        """
        protocol = analysis.breathing_protocol

        patterns = {
            "calming": {
                "name": "Calming Breath (Parasympathetic Activation)",
                "inhale": 4,
                "hold_in": 4,
                "exhale": 6,  # Longer exhale
                "hold_out": 2,
                "duration_seconds": 180,  # Longer for high anxiety
                "narration": [
                    "This extended exhale pattern activates your body's natural calming response.",
                    "Breathe in slowly through your nose... 1... 2... 3... 4...",
                    "Hold gently... 1... 2... 3... 4...",
                    "Now exhale slowly, longer this time... 1... 2... 3... 4... 5... 6...",
                    "Brief pause... 1... 2...",
                    "With each exhale, feel tension leaving your body.",
                ],
                "science": "Longer exhales stimulate the vagus nerve, activating your parasympathetic nervous system.",
            },
            "energizing": {
                "name": "Energizing Breath (Sympathetic Activation)",
                "inhale": 5,
                "hold_in": 2,
                "exhale": 4,
                "hold_out": 1,
                "duration_seconds": 90,  # Shorter, more activating
                "narration": [
                    "This pattern will gently energize and awaken your mind.",
                    "Breathe in deeply... 1... 2... 3... 4... 5...",
                    "Brief hold... 1... 2...",
                    "Release actively... 1... 2... 3... 4...",
                    "And again...",
                    "Feel vitality returning with each breath.",
                ],
                "science": "Slightly longer inhales with active exhales can help lift low energy states.",
            },
            "balanced": {
                "name": "Box Breathing (Equanimity)",
                "inhale": 4,
                "hold_in": 4,
                "exhale": 4,
                "hold_out": 4,
                "duration_seconds": 120,
                "narration": [
                    "Box breathing creates perfect balance in your nervous system.",
                    "Breathe in... 1... 2... 3... 4...",
                    "Hold... 1... 2... 3... 4...",
                    "Exhale... 1... 2... 3... 4...",
                    "Pause... 1... 2... 3... 4...",
                    "This rhythm brings equilibrium to body and mind.",
                ],
                "science": "Equal phases create homeostatic balance between sympathetic and parasympathetic systems.",
            },
        }

        return patterns.get(protocol, patterns["balanced"])

    def generate_karmic_insight(self, analysis: MoodAnalysis) -> dict[str, Any]:
        """
        Generate karmic insight based on emotional analysis.

        Maps emotional patterns to karmic concepts from Bhagavad Gita:
        - Samskaras (imprints) from repeated patterns
        - Vasanas (tendencies) driving behavior
        - Karma (action-consequence)
        """
        insight = {
            "karmic_pattern": "",
            "samskara_type": "",
            "recommended_action": "",
            "gita_principle": "",
        }

        # Detect pattern type
        if analysis.guna_balance.get("tamas", 0) > 0.5:
            insight["karmic_pattern"] = "Inertia Pattern (Tamas Dominance)"
            insight["samskara_type"] = "Avoidance samskara - tendency to withdraw"
            insight["recommended_action"] = "Begin with small, meaningful actions (Karma Yoga)"
            insight["gita_principle"] = "Action is greater than inaction (BG 3.8)"

        elif analysis.guna_balance.get("rajas", 0) > 0.5:
            insight["karmic_pattern"] = "Reactivity Pattern (Rajas Dominance)"
            insight["samskara_type"] = "Reactive samskara - tendency to act impulsively"
            insight["recommended_action"] = "Pause before responding; act without attachment to results"
            insight["gita_principle"] = "Perform action without attachment to outcomes (BG 2.47)"

        else:
            insight["karmic_pattern"] = "Balance Seeking (Sattva Emerging)"
            insight["samskara_type"] = "Growth samskara - tendency toward clarity"
            insight["recommended_action"] = "Maintain practices that cultivate peace"
            insight["gita_principle"] = "Equanimity is yoga (BG 2.48)"

        # Add distortion-based insight
        if CognitiveDistortion.PERSONALIZATION in analysis.distortions_detected:
            insight["karmic_note"] = "Pattern of taking excessive responsibility - practice discernment between what is yours to carry and what is not."
        elif CognitiveDistortion.CATASTROPHIZING in analysis.distortions_detected:
            insight["karmic_note"] = "Pattern of anticipating suffering - remember that the future is unwritten and you shape it through present action."

        return insight


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

mood_analytics = MoodAnalyticsEngine()
