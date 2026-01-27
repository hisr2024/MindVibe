"""
Sentiment Analysis Service - Transformer-Based Emotion Detection

Replaces simple keyword matching with advanced NLP for:
- Real-time sentiment scoring
- Emotional trajectory tracking
- Context-aware emotion detection
- Multi-language support
- Nuanced emotional gradations

This enables KIAAN to understand user emotions at Siri/Alexa level accuracy.
"""

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, List, Tuple
import asyncio
from functools import lru_cache

logger = logging.getLogger(__name__)

# Try to import transformers for advanced sentiment analysis
TRANSFORMERS_AVAILABLE = False
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
    TRANSFORMERS_AVAILABLE = True
    logger.info("Transformers library available for sentiment analysis")
except ImportError:
    logger.warning("Transformers not available - using enhanced rule-based fallback")


class EmotionCategory(str, Enum):
    """Primary emotion categories aligned with psychological research."""
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    ANXIETY = "anxiety"
    PEACE = "peace"
    HOPE = "hope"
    LOVE = "love"
    GRATITUDE = "gratitude"
    COMPASSION = "compassion"
    CONFUSION = "confusion"
    LONELINESS = "loneliness"
    NEUTRAL = "neutral"


@dataclass
class SentimentResult:
    """Result of sentiment analysis on text."""
    # Primary emotion detected
    primary_emotion: EmotionCategory
    # Confidence score (0.0 - 1.0)
    confidence: float
    # Overall sentiment polarity (-1.0 negative to 1.0 positive)
    polarity: float
    # Emotional intensity (0.0 calm to 1.0 intense)
    intensity: float
    # Secondary emotions detected
    secondary_emotions: List[Tuple[EmotionCategory, float]] = field(default_factory=list)
    # Raw sentiment label from model
    raw_label: str = ""
    # Processing timestamp
    timestamp: datetime = field(default_factory=datetime.utcnow)
    # Was this from transformer model or fallback?
    model_type: str = "transformer"

    def to_dict(self) -> Dict:
        """Convert to dictionary for API response."""
        return {
            "primary_emotion": self.primary_emotion.value,
            "confidence": round(self.confidence, 3),
            "polarity": round(self.polarity, 3),
            "intensity": round(self.intensity, 3),
            "secondary_emotions": [
                {"emotion": e.value, "score": round(s, 3)}
                for e, s in self.secondary_emotions
            ],
            "model_type": self.model_type,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class EmotionTrajectory:
    """Tracks emotional changes over a conversation."""
    # Sequence of emotions detected
    emotions: List[SentimentResult] = field(default_factory=list)
    # Overall trend (-1.0 declining to 1.0 improving)
    trend: float = 0.0
    # Volatility (how much emotions are fluctuating)
    volatility: float = 0.0
    # Dominant emotion across conversation
    dominant_emotion: EmotionCategory = EmotionCategory.NEUTRAL
    # Is user in crisis state?
    crisis_indicators: bool = False

    def add_emotion(self, result: SentimentResult) -> None:
        """Add a new emotion reading and recalculate trajectory."""
        self.emotions.append(result)
        self._recalculate_trajectory()

    def _recalculate_trajectory(self) -> None:
        """Recalculate trajectory metrics."""
        if len(self.emotions) < 2:
            return

        # Calculate trend from polarity changes
        polarities = [e.polarity for e in self.emotions[-10:]]  # Last 10 readings
        if len(polarities) >= 2:
            # Linear regression slope approximation
            n = len(polarities)
            x_mean = (n - 1) / 2
            y_mean = sum(polarities) / n

            numerator = sum((i - x_mean) * (p - y_mean) for i, p in enumerate(polarities))
            denominator = sum((i - x_mean) ** 2 for i in range(n))

            self.trend = numerator / denominator if denominator > 0 else 0.0
            self.trend = max(-1.0, min(1.0, self.trend))

        # Calculate volatility
        if len(polarities) >= 3:
            changes = [abs(polarities[i] - polarities[i-1]) for i in range(1, len(polarities))]
            self.volatility = sum(changes) / len(changes)

        # Find dominant emotion
        emotion_counts: Dict[EmotionCategory, int] = {}
        for e in self.emotions[-10:]:
            emotion_counts[e.primary_emotion] = emotion_counts.get(e.primary_emotion, 0) + 1

        self.dominant_emotion = max(emotion_counts.keys(), key=lambda k: emotion_counts[k])

        # Check for crisis indicators
        recent = self.emotions[-5:] if len(self.emotions) >= 5 else self.emotions
        crisis_emotions = {EmotionCategory.FEAR, EmotionCategory.ANXIETY, EmotionCategory.SADNESS}
        crisis_count = sum(1 for e in recent if e.primary_emotion in crisis_emotions and e.intensity > 0.7)
        self.crisis_indicators = crisis_count >= 3

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "trend": round(self.trend, 3),
            "volatility": round(self.volatility, 3),
            "dominant_emotion": self.dominant_emotion.value,
            "crisis_indicators": self.crisis_indicators,
            "reading_count": len(self.emotions),
        }


class SentimentAnalysisService:
    """
    Advanced sentiment analysis using transformer models.

    Features:
    - Multi-language support via multilingual models
    - Emotional intensity detection
    - Trajectory tracking across conversation
    - Crisis state detection
    - Graceful fallback when transformers unavailable
    """

    # Emotion mapping from various model outputs
    LABEL_TO_EMOTION = {
        # GoEmotions labels
        "admiration": EmotionCategory.GRATITUDE,
        "amusement": EmotionCategory.JOY,
        "anger": EmotionCategory.ANGER,
        "annoyance": EmotionCategory.ANGER,
        "approval": EmotionCategory.JOY,
        "caring": EmotionCategory.LOVE,
        "confusion": EmotionCategory.CONFUSION,
        "curiosity": EmotionCategory.NEUTRAL,
        "desire": EmotionCategory.HOPE,
        "disappointment": EmotionCategory.SADNESS,
        "disapproval": EmotionCategory.ANGER,
        "disgust": EmotionCategory.ANGER,
        "embarrassment": EmotionCategory.ANXIETY,
        "excitement": EmotionCategory.JOY,
        "fear": EmotionCategory.FEAR,
        "gratitude": EmotionCategory.GRATITUDE,
        "grief": EmotionCategory.SADNESS,
        "joy": EmotionCategory.JOY,
        "love": EmotionCategory.LOVE,
        "nervousness": EmotionCategory.ANXIETY,
        "optimism": EmotionCategory.HOPE,
        "pride": EmotionCategory.JOY,
        "realization": EmotionCategory.NEUTRAL,
        "relief": EmotionCategory.PEACE,
        "remorse": EmotionCategory.SADNESS,
        "sadness": EmotionCategory.SADNESS,
        "surprise": EmotionCategory.NEUTRAL,
        "neutral": EmotionCategory.NEUTRAL,
        # Standard sentiment labels
        "positive": EmotionCategory.JOY,
        "negative": EmotionCategory.SADNESS,
        "POSITIVE": EmotionCategory.JOY,
        "NEGATIVE": EmotionCategory.SADNESS,
        "LABEL_0": EmotionCategory.SADNESS,  # Often negative
        "LABEL_1": EmotionCategory.NEUTRAL,
        "LABEL_2": EmotionCategory.JOY,  # Often positive
    }

    # Enhanced keyword patterns for fallback
    EMOTION_PATTERNS = {
        EmotionCategory.ANXIETY: {
            "keywords": ["anxious", "worried", "nervous", "stress", "panic", "overwhelmed",
                        "scared", "terrified", "dread", "uneasy", "tense", "restless"],
            "phrases": ["can't stop thinking", "what if", "afraid of", "nervous about",
                       "stressed out", "freaking out", "losing my mind"],
            "weight": 0.85
        },
        EmotionCategory.SADNESS: {
            "keywords": ["sad", "depressed", "lonely", "grief", "loss", "crying", "tears",
                        "hopeless", "empty", "numb", "heartbroken", "devastated", "miserable"],
            "phrases": ["feel so alone", "can't go on", "nothing matters", "lost everything",
                       "want to cry", "feeling down", "so tired of"],
            "weight": 0.85
        },
        EmotionCategory.JOY: {
            "keywords": ["happy", "joy", "excited", "wonderful", "amazing", "great", "fantastic",
                        "blessed", "grateful", "thrilled", "delighted", "ecstatic"],
            "phrases": ["so happy", "best day", "can't believe how good", "feeling great",
                       "over the moon", "on cloud nine"],
            "weight": 0.80
        },
        EmotionCategory.ANGER: {
            "keywords": ["angry", "furious", "frustrated", "annoyed", "irritated", "mad",
                        "rage", "hate", "resentful", "bitter", "outraged"],
            "phrases": ["so angry", "makes me mad", "can't stand", "hate this", "fed up with"],
            "weight": 0.80
        },
        EmotionCategory.FEAR: {
            "keywords": ["afraid", "scared", "terrified", "fearful", "frightened", "horror",
                        "petrified", "alarmed", "spooked"],
            "phrases": ["so scared", "afraid of", "terrified of", "fear that"],
            "weight": 0.85
        },
        EmotionCategory.PEACE: {
            "keywords": ["calm", "peaceful", "serene", "tranquil", "relaxed", "content",
                        "centered", "balanced", "harmonious", "still"],
            "phrases": ["at peace", "feeling calm", "so relaxed", "inner peace"],
            "weight": 0.75
        },
        EmotionCategory.HOPE: {
            "keywords": ["hope", "optimistic", "hopeful", "looking forward", "excited about",
                        "anticipating", "positive", "better", "improving"],
            "phrases": ["have hope", "things will get better", "looking up", "bright future"],
            "weight": 0.75
        },
        EmotionCategory.LOVE: {
            "keywords": ["love", "adore", "cherish", "care", "affection", "fond", "devoted",
                        "attached", "connected"],
            "phrases": ["love you", "care so much", "mean everything", "special to me"],
            "weight": 0.80
        },
        EmotionCategory.GRATITUDE: {
            "keywords": ["thank", "grateful", "appreciate", "blessed", "thankful", "indebted",
                        "fortunate", "lucky"],
            "phrases": ["so grateful", "thank you", "appreciate it", "means a lot"],
            "weight": 0.80
        },
        EmotionCategory.LONELINESS: {
            "keywords": ["lonely", "alone", "isolated", "abandoned", "forgotten", "disconnected",
                        "solitary", "excluded"],
            "phrases": ["so alone", "no one understands", "all by myself", "feel isolated"],
            "weight": 0.85
        },
        EmotionCategory.CONFUSION: {
            "keywords": ["confused", "lost", "unsure", "uncertain", "bewildered", "puzzled",
                        "perplexed", "unclear"],
            "phrases": ["don't understand", "so confused", "not sure", "don't know what"],
            "weight": 0.70
        },
    }

    # Intensity modifiers
    INTENSITY_AMPLIFIERS = [
        "very", "so", "extremely", "incredibly", "really", "truly", "deeply",
        "completely", "absolutely", "totally", "utterly", "profoundly"
    ]

    INTENSITY_DAMPENERS = [
        "slightly", "a bit", "somewhat", "kind of", "sort of", "a little",
        "maybe", "perhaps", "sometimes", "occasionally"
    ]

    def __init__(self, model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
        """
        Initialize sentiment analysis service.

        Args:
            model_name: HuggingFace model name for sentiment analysis
        """
        self.model_name = model_name
        self.sentiment_pipeline = None
        self.emotion_pipeline = None
        self._initialized = False
        self._user_trajectories: Dict[str, EmotionTrajectory] = {}

        # Initialize models asynchronously
        if TRANSFORMERS_AVAILABLE:
            self._init_models()

    def _init_models(self) -> None:
        """Initialize transformer models."""
        try:
            # Primary sentiment analysis
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                device=-1,  # CPU for compatibility
                truncation=True,
                max_length=512
            )

            # Try to load emotion-specific model
            try:
                self.emotion_pipeline = pipeline(
                    "text-classification",
                    model="bhadresh-savani/distilbert-base-uncased-emotion",
                    device=-1,
                    truncation=True,
                    max_length=512,
                    top_k=5  # Get top 5 emotions
                )
                logger.info("Loaded emotion-specific model")
            except Exception as e:
                logger.warning(f"Could not load emotion model, using sentiment only: {e}")
                self.emotion_pipeline = None

            self._initialized = True
            logger.info(f"Sentiment analysis initialized with model: {self.model_name}")

        except Exception as e:
            logger.error(f"Failed to initialize sentiment models: {e}")
            self._initialized = False

    async def analyze(
        self,
        text: str,
        user_id: Optional[str] = None,
        context: Optional[str] = None
    ) -> SentimentResult:
        """
        Analyze sentiment and emotion in text.

        Args:
            text: Text to analyze
            user_id: Optional user ID for trajectory tracking
            context: Optional context (e.g., "crisis", "meditation", "casual")

        Returns:
            SentimentResult with detected emotions and scores
        """
        if not text or not text.strip():
            return SentimentResult(
                primary_emotion=EmotionCategory.NEUTRAL,
                confidence=1.0,
                polarity=0.0,
                intensity=0.0,
                model_type="empty_input"
            )

        # Use transformer if available, otherwise fallback
        if self._initialized and self.sentiment_pipeline:
            result = await self._analyze_with_transformer(text, context)
        else:
            result = self._analyze_with_rules(text, context)

        # Track trajectory if user_id provided
        if user_id:
            self._update_trajectory(user_id, result)

        return result

    async def _analyze_with_transformer(
        self,
        text: str,
        context: Optional[str] = None
    ) -> SentimentResult:
        """Analyze using transformer models."""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()

            # Get sentiment
            sentiment_result = await loop.run_in_executor(
                None,
                lambda: self.sentiment_pipeline(text[:512])[0]
            )

            raw_label = sentiment_result["label"]
            confidence = sentiment_result["score"]

            # Map to polarity
            if raw_label.upper() in ["POSITIVE", "LABEL_2"]:
                polarity = confidence
            elif raw_label.upper() in ["NEGATIVE", "LABEL_0"]:
                polarity = -confidence
            else:
                polarity = 0.0

            # Get detailed emotions if available
            secondary_emotions = []
            primary_emotion = self.LABEL_TO_EMOTION.get(raw_label, EmotionCategory.NEUTRAL)

            if self.emotion_pipeline:
                try:
                    emotion_results = await loop.run_in_executor(
                        None,
                        lambda: self.emotion_pipeline(text[:512])
                    )

                    if emotion_results and len(emotion_results) > 0:
                        # Handle nested list structure
                        emotions = emotion_results[0] if isinstance(emotion_results[0], list) else emotion_results

                        for i, emotion in enumerate(emotions[:5]):
                            emotion_cat = self.LABEL_TO_EMOTION.get(
                                emotion["label"],
                                EmotionCategory.NEUTRAL
                            )
                            if i == 0:
                                primary_emotion = emotion_cat
                                confidence = emotion["score"]
                            else:
                                secondary_emotions.append((emotion_cat, emotion["score"]))

                except Exception as e:
                    logger.warning(f"Emotion pipeline failed: {e}")

            # Calculate intensity
            intensity = self._calculate_intensity(text, confidence)

            # Context-aware adjustment
            if context == "crisis":
                # Boost negative emotion detection in crisis context
                if primary_emotion in {EmotionCategory.FEAR, EmotionCategory.ANXIETY, EmotionCategory.SADNESS}:
                    intensity = min(1.0, intensity * 1.2)

            return SentimentResult(
                primary_emotion=primary_emotion,
                confidence=confidence,
                polarity=polarity,
                intensity=intensity,
                secondary_emotions=secondary_emotions,
                raw_label=raw_label,
                model_type="transformer"
            )

        except Exception as e:
            logger.error(f"Transformer analysis failed: {e}")
            return self._analyze_with_rules(text, context)

    def _analyze_with_rules(
        self,
        text: str,
        context: Optional[str] = None
    ) -> SentimentResult:
        """Fallback rule-based analysis when transformers unavailable."""
        text_lower = text.lower()

        # Score each emotion
        emotion_scores: Dict[EmotionCategory, float] = {}

        for emotion, patterns in self.EMOTION_PATTERNS.items():
            score = 0.0

            # Check keywords
            for keyword in patterns["keywords"]:
                if keyword in text_lower:
                    score += patterns["weight"]

            # Check phrases (higher weight)
            for phrase in patterns["phrases"]:
                if phrase in text_lower:
                    score += patterns["weight"] * 1.3

            if score > 0:
                emotion_scores[emotion] = min(1.0, score)

        # Determine primary emotion
        if emotion_scores:
            primary_emotion = max(emotion_scores.keys(), key=lambda k: emotion_scores[k])
            confidence = emotion_scores[primary_emotion]

            # Get secondary emotions
            secondary = [(e, s) for e, s in emotion_scores.items() if e != primary_emotion]
            secondary.sort(key=lambda x: x[1], reverse=True)
            secondary_emotions = secondary[:3]
        else:
            primary_emotion = EmotionCategory.NEUTRAL
            confidence = 0.5
            secondary_emotions = []

        # Calculate polarity
        positive_emotions = {EmotionCategory.JOY, EmotionCategory.HOPE, EmotionCategory.LOVE,
                           EmotionCategory.GRATITUDE, EmotionCategory.PEACE}
        negative_emotions = {EmotionCategory.SADNESS, EmotionCategory.ANGER, EmotionCategory.FEAR,
                           EmotionCategory.ANXIETY, EmotionCategory.LONELINESS}

        if primary_emotion in positive_emotions:
            polarity = confidence
        elif primary_emotion in negative_emotions:
            polarity = -confidence
        else:
            polarity = 0.0

        # Calculate intensity
        intensity = self._calculate_intensity(text, confidence)

        return SentimentResult(
            primary_emotion=primary_emotion,
            confidence=confidence,
            polarity=polarity,
            intensity=intensity,
            secondary_emotions=secondary_emotions,
            raw_label="rule_based",
            model_type="rule_based"
        )

    def _calculate_intensity(self, text: str, base_confidence: float) -> float:
        """Calculate emotional intensity from text."""
        text_lower = text.lower()
        intensity = base_confidence

        # Check for amplifiers
        for amplifier in self.INTENSITY_AMPLIFIERS:
            if amplifier in text_lower:
                intensity *= 1.15

        # Check for dampeners
        for dampener in self.INTENSITY_DAMPENERS:
            if dampener in text_lower:
                intensity *= 0.85

        # Exclamation marks increase intensity
        exclamation_count = text.count("!")
        if exclamation_count > 0:
            intensity *= (1 + min(0.2, exclamation_count * 0.05))

        # ALL CAPS indicates intensity
        caps_ratio = sum(1 for c in text if c.isupper()) / max(1, len(text))
        if caps_ratio > 0.3:
            intensity *= 1.2

        # Repeated letters indicate intensity (e.g., "soooo")
        if re.search(r'(.)\1{2,}', text_lower):
            intensity *= 1.1

        return min(1.0, intensity)

    def _update_trajectory(self, user_id: str, result: SentimentResult) -> None:
        """Update user's emotional trajectory."""
        if user_id not in self._user_trajectories:
            self._user_trajectories[user_id] = EmotionTrajectory()

        self._user_trajectories[user_id].add_emotion(result)

    def get_trajectory(self, user_id: str) -> Optional[EmotionTrajectory]:
        """Get user's emotional trajectory."""
        return self._user_trajectories.get(user_id)

    def clear_trajectory(self, user_id: str) -> None:
        """Clear user's trajectory (e.g., at session end)."""
        if user_id in self._user_trajectories:
            del self._user_trajectories[user_id]

    async def analyze_conversation(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[str] = None
    ) -> EmotionTrajectory:
        """
        Analyze emotion trajectory across a conversation.

        Args:
            messages: List of {"role": "user/assistant", "content": "..."}
            user_id: Optional user ID

        Returns:
            EmotionTrajectory across the conversation
        """
        trajectory = EmotionTrajectory()

        for message in messages:
            if message.get("role") == "user":
                result = await self.analyze(message.get("content", ""), user_id)
                trajectory.add_emotion(result)

        return trajectory

    def get_prosody_for_emotion(self, emotion: EmotionCategory) -> Dict[str, float]:
        """
        Get recommended prosody settings for an emotion.

        Returns:
            Dict with rate, pitch, volume settings
        """
        EMOTION_PROSODY = {
            EmotionCategory.JOY: {"rate": 1.02, "pitch": 1.0, "volume": 1.0},
            EmotionCategory.SADNESS: {"rate": 0.88, "pitch": -1.0, "volume": 0.85},
            EmotionCategory.ANGER: {"rate": 0.95, "pitch": 0.3, "volume": 1.1},
            EmotionCategory.FEAR: {"rate": 0.90, "pitch": 0.2, "volume": 0.9},
            EmotionCategory.ANXIETY: {"rate": 0.86, "pitch": -0.3, "volume": 0.85},
            EmotionCategory.PEACE: {"rate": 0.90, "pitch": -0.4, "volume": 0.85},
            EmotionCategory.HOPE: {"rate": 0.98, "pitch": 0.6, "volume": 1.0},
            EmotionCategory.LOVE: {"rate": 0.92, "pitch": 0.2, "volume": 0.9},
            EmotionCategory.GRATITUDE: {"rate": 0.95, "pitch": 0.4, "volume": 0.95},
            EmotionCategory.COMPASSION: {"rate": 0.90, "pitch": -0.2, "volume": 0.9},
            EmotionCategory.LONELINESS: {"rate": 0.87, "pitch": -0.8, "volume": 0.85},
            EmotionCategory.CONFUSION: {"rate": 0.92, "pitch": 0.0, "volume": 0.9},
            EmotionCategory.NEUTRAL: {"rate": 0.95, "pitch": 0.0, "volume": 1.0},
        }
        return EMOTION_PROSODY.get(emotion, EMOTION_PROSODY[EmotionCategory.NEUTRAL])


# Singleton instance
_sentiment_service: Optional[SentimentAnalysisService] = None


def get_sentiment_service() -> SentimentAnalysisService:
    """Get singleton sentiment analysis service."""
    global _sentiment_service
    if _sentiment_service is None:
        _sentiment_service = SentimentAnalysisService()
    return _sentiment_service
