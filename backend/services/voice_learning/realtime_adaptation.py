"""
Real-Time Adaptation Service - Dynamic Prosody Per Sentence

Provides real-time voice adaptation during response generation:
- Sentence-level emotion detection
- Dynamic prosody changes mid-response
- Emotional trajectory matching
- Smooth transitions between emotions

This enables KIAAN to sound natural with emotion shifts, like Siri/Alexa.
"""

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, List, Tuple, Any
import asyncio

from backend.services.voice_learning.sentiment_analysis import (
    SentimentAnalysisService,
    SentimentResult,
    EmotionCategory,
    get_sentiment_service,
)

logger = logging.getLogger(__name__)


@dataclass
class SentenceEmotion:
    """Emotion analysis for a single sentence."""
    text: str
    emotion: EmotionCategory
    intensity: float
    polarity: float
    position: int  # Position in response (0-indexed)
    is_transition: bool = False  # Marks emotion change point

    def to_dict(self) -> Dict:
        return {
            "text": self.text[:50] + "..." if len(self.text) > 50 else self.text,
            "emotion": self.emotion.value,
            "intensity": round(self.intensity, 3),
            "polarity": round(self.polarity, 3),
            "position": self.position,
            "is_transition": self.is_transition,
        }


@dataclass
class AdaptiveProsody:
    """Prosody settings for a text segment."""
    speaking_rate: float = 0.95
    pitch: float = 0.0
    volume: float = 1.0
    emphasis: str = "none"  # none, reduced, moderate, strong
    pause_before_ms: int = 0
    pause_after_ms: int = 0

    def to_ssml_attributes(self) -> str:
        """Convert to SSML prosody attributes."""
        rate_percent = int(self.speaking_rate * 100)
        pitch_st = f"{self.pitch:+.1f}st"
        volume_level = "medium"
        if self.volume < 0.9:
            volume_level = "soft"
        elif self.volume > 1.1:
            volume_level = "loud"

        return f'rate="{rate_percent}%" pitch="{pitch_st}" volume="{volume_level}"'

    def to_dict(self) -> Dict:
        return {
            "speaking_rate": self.speaking_rate,
            "pitch": self.pitch,
            "volume": self.volume,
            "emphasis": self.emphasis,
            "pause_before_ms": self.pause_before_ms,
            "pause_after_ms": self.pause_after_ms,
        }


@dataclass
class AdaptedSegment:
    """A text segment with adapted prosody."""
    text: str
    prosody: AdaptiveProsody
    emotion: EmotionCategory
    ssml: str = ""

    def to_dict(self) -> Dict:
        return {
            "text": self.text,
            "prosody": self.prosody.to_dict(),
            "emotion": self.emotion.value,
            "ssml_preview": self.ssml[:100] if self.ssml else "",
        }


class RealTimeAdaptationService:
    """
    Service for real-time voice adaptation.

    Features:
    - Split text into sentences
    - Analyze emotion per sentence
    - Generate adaptive prosody
    - Create smooth transitions
    - Output SSML with dynamic prosody
    """

    # Base prosody for each emotion
    EMOTION_PROSODY = {
        EmotionCategory.JOY: AdaptiveProsody(
            speaking_rate=1.02,
            pitch=1.0,
            volume=1.0,
            emphasis="moderate"
        ),
        EmotionCategory.SADNESS: AdaptiveProsody(
            speaking_rate=0.88,
            pitch=-1.0,
            volume=0.85,
            emphasis="reduced",
            pause_after_ms=200
        ),
        EmotionCategory.ANGER: AdaptiveProsody(
            speaking_rate=0.95,
            pitch=0.3,
            volume=1.1,
            emphasis="strong"
        ),
        EmotionCategory.FEAR: AdaptiveProsody(
            speaking_rate=0.90,
            pitch=0.2,
            volume=0.9,
            emphasis="reduced"
        ),
        EmotionCategory.ANXIETY: AdaptiveProsody(
            speaking_rate=0.86,
            pitch=-0.3,
            volume=0.85,
            emphasis="reduced",
            pause_before_ms=100
        ),
        EmotionCategory.PEACE: AdaptiveProsody(
            speaking_rate=0.90,
            pitch=-0.4,
            volume=0.85,
            emphasis="none",
            pause_after_ms=300
        ),
        EmotionCategory.HOPE: AdaptiveProsody(
            speaking_rate=0.98,
            pitch=0.6,
            volume=1.0,
            emphasis="moderate"
        ),
        EmotionCategory.LOVE: AdaptiveProsody(
            speaking_rate=0.92,
            pitch=0.2,
            volume=0.9,
            emphasis="moderate"
        ),
        EmotionCategory.GRATITUDE: AdaptiveProsody(
            speaking_rate=0.95,
            pitch=0.4,
            volume=0.95,
            emphasis="moderate"
        ),
        EmotionCategory.COMPASSION: AdaptiveProsody(
            speaking_rate=0.90,
            pitch=-0.2,
            volume=0.9,
            emphasis="moderate",
            pause_before_ms=100
        ),
        EmotionCategory.LONELINESS: AdaptiveProsody(
            speaking_rate=0.87,
            pitch=-0.8,
            volume=0.85,
            emphasis="reduced",
            pause_after_ms=250
        ),
        EmotionCategory.CONFUSION: AdaptiveProsody(
            speaking_rate=0.92,
            pitch=0.0,
            volume=0.9,
            emphasis="none"
        ),
        EmotionCategory.NEUTRAL: AdaptiveProsody(
            speaking_rate=0.95,
            pitch=0.0,
            volume=1.0,
            emphasis="none"
        ),
    }

    # Transition smoothing factor (0 = no smoothing, 1 = full smoothing)
    TRANSITION_SMOOTHING = 0.4

    def __init__(self, sentiment_service: Optional[SentimentAnalysisService] = None):
        """Initialize real-time adaptation service."""
        self.sentiment_service = sentiment_service or get_sentiment_service()

    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences for analysis."""
        # Handle common sentence endings
        text = re.sub(r'\.{3,}', '…', text)  # Normalize ellipsis

        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?…])\s+', text)

        # Filter empty sentences
        sentences = [s.strip() for s in sentences if s.strip()]

        return sentences

    async def analyze_text(
        self,
        text: str,
        user_id: Optional[str] = None
    ) -> List[SentenceEmotion]:
        """
        Analyze emotion for each sentence in text.

        Args:
            text: Full text to analyze
            user_id: Optional user ID for context

        Returns:
            List of SentenceEmotion for each sentence
        """
        sentences = self._split_into_sentences(text)
        results: List[SentenceEmotion] = []
        prev_emotion = EmotionCategory.NEUTRAL

        for i, sentence in enumerate(sentences):
            # Analyze sentence
            sentiment_result = await self.sentiment_service.analyze(sentence, user_id)

            # Detect if this is a transition point
            is_transition = (
                i > 0 and
                sentiment_result.primary_emotion != prev_emotion and
                sentiment_result.confidence > 0.5
            )

            sentence_emotion = SentenceEmotion(
                text=sentence,
                emotion=sentiment_result.primary_emotion,
                intensity=sentiment_result.intensity,
                polarity=sentiment_result.polarity,
                position=i,
                is_transition=is_transition
            )
            results.append(sentence_emotion)
            prev_emotion = sentiment_result.primary_emotion

        return results

    def _get_prosody_for_emotion(
        self,
        emotion: EmotionCategory,
        intensity: float = 1.0
    ) -> AdaptiveProsody:
        """Get prosody settings for an emotion."""
        base_prosody = self.EMOTION_PROSODY.get(
            emotion,
            self.EMOTION_PROSODY[EmotionCategory.NEUTRAL]
        )

        # Adjust based on intensity
        return AdaptiveProsody(
            speaking_rate=base_prosody.speaking_rate,
            pitch=base_prosody.pitch * intensity,
            volume=0.85 + (base_prosody.volume - 0.85) * intensity,
            emphasis=base_prosody.emphasis,
            pause_before_ms=int(base_prosody.pause_before_ms * intensity),
            pause_after_ms=int(base_prosody.pause_after_ms * intensity),
        )

    def _smooth_transition(
        self,
        prev_prosody: AdaptiveProsody,
        next_prosody: AdaptiveProsody
    ) -> AdaptiveProsody:
        """Create smooth transition between prosody settings."""
        factor = self.TRANSITION_SMOOTHING

        return AdaptiveProsody(
            speaking_rate=prev_prosody.speaking_rate * factor + next_prosody.speaking_rate * (1 - factor),
            pitch=prev_prosody.pitch * factor + next_prosody.pitch * (1 - factor),
            volume=prev_prosody.volume * factor + next_prosody.volume * (1 - factor),
            emphasis=next_prosody.emphasis,
            pause_before_ms=max(prev_prosody.pause_after_ms, next_prosody.pause_before_ms),
            pause_after_ms=next_prosody.pause_after_ms,
        )

    async def adapt_text(
        self,
        text: str,
        user_id: Optional[str] = None,
        base_prosody: Optional[AdaptiveProsody] = None
    ) -> List[AdaptedSegment]:
        """
        Adapt text with dynamic prosody per sentence.

        Args:
            text: Text to adapt
            user_id: Optional user ID
            base_prosody: Optional base prosody to blend with

        Returns:
            List of AdaptedSegment with prosody for each sentence
        """
        sentence_emotions = await self.analyze_text(text, user_id)
        segments: List[AdaptedSegment] = []
        prev_prosody = base_prosody or self.EMOTION_PROSODY[EmotionCategory.NEUTRAL]

        for sentence_emotion in sentence_emotions:
            # Get prosody for this emotion
            emotion_prosody = self._get_prosody_for_emotion(
                sentence_emotion.emotion,
                sentence_emotion.intensity
            )

            # Apply smoothing at transitions
            if sentence_emotion.is_transition:
                prosody = self._smooth_transition(prev_prosody, emotion_prosody)
            else:
                prosody = emotion_prosody

            # Generate SSML
            ssml = self._generate_ssml_segment(sentence_emotion.text, prosody)

            segment = AdaptedSegment(
                text=sentence_emotion.text,
                prosody=prosody,
                emotion=sentence_emotion.emotion,
                ssml=ssml
            )
            segments.append(segment)
            prev_prosody = prosody

        return segments

    def _generate_ssml_segment(
        self,
        text: str,
        prosody: AdaptiveProsody
    ) -> str:
        """Generate SSML for a text segment with prosody."""
        # Escape XML special characters
        escaped_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # Build SSML
        ssml_parts = []

        # Add pause before if specified
        if prosody.pause_before_ms > 0:
            ssml_parts.append(f'<break time="{prosody.pause_before_ms}ms"/>')

        # Add prosody wrapper
        ssml_parts.append(f'<prosody {prosody.to_ssml_attributes()}>')

        # Add emphasis if specified
        if prosody.emphasis == "strong":
            ssml_parts.append(f'<emphasis level="strong">{escaped_text}</emphasis>')
        elif prosody.emphasis == "moderate":
            ssml_parts.append(f'<emphasis level="moderate">{escaped_text}</emphasis>')
        elif prosody.emphasis == "reduced":
            ssml_parts.append(f'<emphasis level="reduced">{escaped_text}</emphasis>')
        else:
            ssml_parts.append(escaped_text)

        ssml_parts.append('</prosody>')

        # Add pause after if specified
        if prosody.pause_after_ms > 0:
            ssml_parts.append(f'<break time="{prosody.pause_after_ms}ms"/>')

        return "".join(ssml_parts)

    async def generate_adaptive_ssml(
        self,
        text: str,
        user_id: Optional[str] = None,
        base_prosody: Optional[AdaptiveProsody] = None
    ) -> str:
        """
        Generate full SSML with adaptive prosody for entire text.

        Args:
            text: Text to convert to adaptive SSML
            user_id: Optional user ID
            base_prosody: Optional base prosody settings

        Returns:
            Complete SSML string with adaptive prosody
        """
        segments = await self.adapt_text(text, user_id, base_prosody)

        ssml_content = " ".join(segment.ssml for segment in segments)

        return f'<speak>{ssml_content}</speak>'

    async def get_emotional_arc(
        self,
        text: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze the emotional arc of a text.

        Returns insights about how emotions flow through the text.

        Args:
            text: Text to analyze
            user_id: Optional user ID

        Returns:
            Dictionary with emotional arc information
        """
        sentence_emotions = await self.analyze_text(text, user_id)

        if not sentence_emotions:
            return {
                "arc_type": "empty",
                "transitions": 0,
                "dominant_emotion": EmotionCategory.NEUTRAL.value,
            }

        # Analyze arc
        emotions = [se.emotion for se in sentence_emotions]
        polarities = [se.polarity for se in sentence_emotions]
        transitions = sum(1 for se in sentence_emotions if se.is_transition)

        # Calculate dominant emotion
        emotion_counts: Dict[EmotionCategory, int] = {}
        for e in emotions:
            emotion_counts[e] = emotion_counts.get(e, 0) + 1
        dominant = max(emotion_counts.keys(), key=lambda k: emotion_counts[k])

        # Determine arc type
        if len(polarities) >= 3:
            start_polarity = sum(polarities[:len(polarities)//3]) / max(1, len(polarities)//3)
            end_polarity = sum(polarities[-len(polarities)//3:]) / max(1, len(polarities)//3)

            if end_polarity - start_polarity > 0.3:
                arc_type = "ascending"  # Negative to positive
            elif start_polarity - end_polarity > 0.3:
                arc_type = "descending"  # Positive to negative
            elif transitions >= 3:
                arc_type = "volatile"  # Multiple changes
            else:
                arc_type = "stable"  # Relatively constant
        else:
            arc_type = "brief"

        return {
            "arc_type": arc_type,
            "transitions": transitions,
            "dominant_emotion": dominant.value,
            "sentence_count": len(sentence_emotions),
            "start_polarity": round(polarities[0] if polarities else 0, 3),
            "end_polarity": round(polarities[-1] if polarities else 0, 3),
            "avg_intensity": round(
                sum(se.intensity for se in sentence_emotions) / len(sentence_emotions),
                3
            ),
        }


# Singleton instance
_realtime_adaptation_service: Optional[RealTimeAdaptationService] = None


def get_realtime_adaptation_service() -> RealTimeAdaptationService:
    """Get singleton real-time adaptation service."""
    global _realtime_adaptation_service
    if _realtime_adaptation_service is None:
        _realtime_adaptation_service = RealTimeAdaptationService()
    return _realtime_adaptation_service
