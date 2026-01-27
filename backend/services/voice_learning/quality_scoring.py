"""
Conversation Quality Scoring Service

Automatic quality scoring for continuous improvement of KIAAN responses:
- Relevance scoring (did response match query intent?)
- Helpfulness assessment (did user seem satisfied?)
- Spiritual depth evaluation (appropriate Gita wisdom?)
- Emotional attunement (matched user's state?)
- Engagement measurement (did user continue conversation?)

Features:
- Multi-dimensional quality assessment
- Automatic scoring with ML-based inference
- Feedback correlation analysis
- Quality trend tracking
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import asyncio
import logging
import re
from collections import defaultdict

logger = logging.getLogger(__name__)


class QualityDimension(Enum):
    """Dimensions of conversation quality."""
    RELEVANCE = "relevance"
    HELPFULNESS = "helpfulness"
    SPIRITUAL_DEPTH = "spiritual_depth"
    EMOTIONAL_ATTUNEMENT = "emotional_attunement"
    ENGAGEMENT = "engagement"
    CLARITY = "clarity"
    COMPASSION = "compassion"
    ACTIONABILITY = "actionability"


class ResponseType(Enum):
    """Types of KIAAN responses."""
    WISDOM = "wisdom"
    COMFORT = "comfort"
    GUIDANCE = "guidance"
    VERSE_SHARING = "verse_sharing"
    REFLECTION_PROMPT = "reflection_prompt"
    GREETING = "greeting"
    CLARIFICATION = "clarification"
    ACKNOWLEDGMENT = "acknowledgment"


@dataclass
class QualityScore:
    """Quality score for a single dimension."""
    dimension: QualityDimension
    score: float  # 0-1
    confidence: float  # 0-1
    signals: List[str]  # Signals that contributed to this score


@dataclass
class ConversationQuality:
    """Complete quality assessment for a conversation turn."""
    conversation_id: str
    turn_id: str
    user_input: str
    kiaan_response: str
    response_type: ResponseType
    dimension_scores: Dict[QualityDimension, QualityScore]
    overall_score: float
    overall_confidence: float
    improvement_suggestions: List[str]
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class QualityTrend:
    """Quality trend over time."""
    dimension: QualityDimension
    period_start: datetime
    period_end: datetime
    average_score: float
    score_variance: float
    sample_count: int
    trend_direction: str  # "improving", "stable", "declining"


class ConversationQualityService:
    """
    Service for scoring and analyzing conversation quality.

    Automatically evaluates each conversation turn across multiple
    dimensions to enable continuous improvement of KIAAN responses.
    """

    def __init__(self):
        self._quality_history: Dict[str, List[ConversationQuality]] = defaultdict(list)
        self._dimension_weights: Dict[QualityDimension, float] = {}
        self._initialized = False

        # Initialize dimension weights
        self._dimension_weights = {
            QualityDimension.RELEVANCE: 0.20,
            QualityDimension.HELPFULNESS: 0.20,
            QualityDimension.SPIRITUAL_DEPTH: 0.15,
            QualityDimension.EMOTIONAL_ATTUNEMENT: 0.15,
            QualityDimension.ENGAGEMENT: 0.10,
            QualityDimension.CLARITY: 0.10,
            QualityDimension.COMPASSION: 0.05,
            QualityDimension.ACTIONABILITY: 0.05,
        }

        # Quality indicators
        self._quality_indicators = self._initialize_quality_indicators()

        logger.info("ConversationQualityService initialized")

    def _initialize_quality_indicators(self) -> Dict[str, Dict[str, Any]]:
        """Initialize indicators for quality assessment."""
        return {
            "spiritual_keywords": [
                "gita", "krishna", "arjuna", "verse", "dharma", "karma",
                "yoga", "atman", "brahman", "moksha", "peace", "wisdom",
                "soul", "eternal", "divine", "chapter", "shloka"
            ],
            "compassion_phrases": [
                "i understand", "it's okay", "be gentle", "i'm here",
                "take your time", "you're not alone", "this is natural",
                "many people feel", "it's common to", "be kind to yourself"
            ],
            "actionable_phrases": [
                "try", "consider", "practice", "you could", "one way",
                "start by", "begin with", "take a moment", "reflect on",
                "ask yourself", "notice when", "observe how"
            ],
            "engagement_questions": [
                "?", "what do you think", "how does that", "would you like",
                "shall we", "does this resonate", "what comes to mind"
            ],
            "clarity_indicators": {
                "short_sentences": 15,  # words per sentence threshold
                "structured_response": True,
                "no_jargon": True
            }
        }

    async def initialize(self) -> None:
        """Initialize the service."""
        if self._initialized:
            return
        self._initialized = True
        logger.info("ConversationQualityService initialized")

    # ==================== Quality Scoring ====================

    async def score_conversation_turn(
        self,
        conversation_id: str,
        turn_id: str,
        user_input: str,
        kiaan_response: str,
        user_emotion: Optional[str] = None,
        subsequent_behavior: Optional[Dict[str, Any]] = None
    ) -> ConversationQuality:
        """
        Score a single conversation turn.

        Args:
            conversation_id: Unique conversation identifier
            turn_id: Turn identifier within conversation
            user_input: What the user said
            kiaan_response: KIAAN's response
            user_emotion: Detected user emotion (optional)
            subsequent_behavior: What user did after (optional)
        """
        # Detect response type
        response_type = self._detect_response_type(kiaan_response)

        # Score each dimension
        dimension_scores = {}

        dimension_scores[QualityDimension.RELEVANCE] = self._score_relevance(
            user_input, kiaan_response
        )

        dimension_scores[QualityDimension.HELPFULNESS] = self._score_helpfulness(
            kiaan_response, subsequent_behavior
        )

        dimension_scores[QualityDimension.SPIRITUAL_DEPTH] = self._score_spiritual_depth(
            kiaan_response, response_type
        )

        dimension_scores[QualityDimension.EMOTIONAL_ATTUNEMENT] = self._score_emotional_attunement(
            user_input, kiaan_response, user_emotion
        )

        dimension_scores[QualityDimension.ENGAGEMENT] = self._score_engagement(
            kiaan_response, subsequent_behavior
        )

        dimension_scores[QualityDimension.CLARITY] = self._score_clarity(kiaan_response)

        dimension_scores[QualityDimension.COMPASSION] = self._score_compassion(kiaan_response)

        dimension_scores[QualityDimension.ACTIONABILITY] = self._score_actionability(
            kiaan_response, response_type
        )

        # Calculate overall score
        overall_score = self._calculate_overall_score(dimension_scores)
        overall_confidence = self._calculate_overall_confidence(dimension_scores)

        # Generate improvement suggestions
        suggestions = self._generate_improvement_suggestions(dimension_scores, response_type)

        quality = ConversationQuality(
            conversation_id=conversation_id,
            turn_id=turn_id,
            user_input=user_input,
            kiaan_response=kiaan_response,
            response_type=response_type,
            dimension_scores=dimension_scores,
            overall_score=overall_score,
            overall_confidence=overall_confidence,
            improvement_suggestions=suggestions
        )

        # Store in history
        self._quality_history[conversation_id].append(quality)

        return quality

    def _detect_response_type(self, response: str) -> ResponseType:
        """Detect the type of KIAAN response."""
        response_lower = response.lower()

        if "chapter" in response_lower and ("verse" in response_lower or "shloka" in response_lower):
            return ResponseType.VERSE_SHARING

        if any(phrase in response_lower for phrase in ["what do you think", "reflect on", "consider"]):
            return ResponseType.REFLECTION_PROMPT

        if any(greeting in response_lower for greeting in ["namaste", "good morning", "hello", "welcome"]):
            return ResponseType.GREETING

        if any(phrase in response_lower for phrase in ["i understand", "i hear you", "that sounds"]):
            return ResponseType.COMFORT

        if any(phrase in response_lower for phrase in ["you could", "try", "one approach", "practice"]):
            return ResponseType.GUIDANCE

        if "?" in response and len(response) < 100:
            return ResponseType.CLARIFICATION

        if len(response) < 50:
            return ResponseType.ACKNOWLEDGMENT

        return ResponseType.WISDOM

    def _score_relevance(
        self,
        user_input: str,
        response: str
    ) -> QualityScore:
        """Score how relevant the response is to user input."""
        signals = []
        score = 0.5  # Base score

        # Extract key words from user input
        user_words = set(re.findall(r'\b\w+\b', user_input.lower()))
        response_words = set(re.findall(r'\b\w+\b', response.lower()))

        # Remove common words
        common_words = {"the", "a", "an", "is", "are", "was", "were", "i", "you", "we", "it", "to", "of", "and", "in", "for", "on", "with", "that", "this"}
        user_keywords = user_words - common_words
        response_keywords = response_words - common_words

        # Calculate overlap
        if user_keywords:
            overlap = len(user_keywords & response_keywords) / len(user_keywords)
            score += overlap * 0.3
            if overlap > 0.3:
                signals.append(f"Keyword overlap: {overlap:.0%}")

        # Check for topic coherence
        emotional_topics = ["sad", "happy", "angry", "anxious", "worried", "stressed", "confused"]
        user_emotional = any(topic in user_input.lower() for topic in emotional_topics)
        response_emotional = any(topic in response.lower() for topic in emotional_topics)

        if user_emotional and response_emotional:
            score += 0.1
            signals.append("Addresses emotional topic")

        # Check for question-answer coherence
        if "?" in user_input and len(response) > 50:
            score += 0.1
            signals.append("Substantive answer to question")

        return QualityScore(
            dimension=QualityDimension.RELEVANCE,
            score=min(1.0, score),
            confidence=0.7,
            signals=signals
        )

    def _score_helpfulness(
        self,
        response: str,
        subsequent_behavior: Optional[Dict[str, Any]]
    ) -> QualityScore:
        """Score how helpful the response was."""
        signals = []
        score = 0.5

        # If we have subsequent behavior data
        if subsequent_behavior:
            # User continued conversation
            if subsequent_behavior.get("continued", False):
                score += 0.2
                signals.append("User continued conversation")

            # User gave positive feedback
            if subsequent_behavior.get("rating", 0) >= 4:
                score += 0.3
                signals.append("Positive user feedback")
            elif subsequent_behavior.get("rating", 0) <= 2:
                score -= 0.2
                signals.append("Negative user feedback")

            # User took suggested action
            if subsequent_behavior.get("action_taken", False):
                score += 0.2
                signals.append("User took suggested action")

        # Content-based helpfulness indicators
        actionable = self._quality_indicators["actionable_phrases"]
        actionable_count = sum(1 for phrase in actionable if phrase in response.lower())

        if actionable_count >= 2:
            score += 0.1
            signals.append(f"{actionable_count} actionable suggestions")

        # Length appropriateness (not too short, not too long)
        word_count = len(response.split())
        if 50 <= word_count <= 200:
            score += 0.1
            signals.append("Appropriate response length")

        return QualityScore(
            dimension=QualityDimension.HELPFULNESS,
            score=min(1.0, max(0.0, score)),
            confidence=0.6 if subsequent_behavior else 0.4,
            signals=signals
        )

    def _score_spiritual_depth(
        self,
        response: str,
        response_type: ResponseType
    ) -> QualityScore:
        """Score the spiritual depth of the response."""
        signals = []
        score = 0.3  # Base score

        response_lower = response.lower()
        spiritual_keywords = self._quality_indicators["spiritual_keywords"]

        # Count spiritual keywords
        keyword_count = sum(1 for kw in spiritual_keywords if kw in response_lower)

        if keyword_count >= 3:
            score += 0.3
            signals.append(f"Rich spiritual vocabulary ({keyword_count} terms)")
        elif keyword_count >= 1:
            score += 0.15
            signals.append("Contains spiritual references")

        # Check for verse citation
        if response_type == ResponseType.VERSE_SHARING:
            score += 0.3
            signals.append("Includes Gita verse")

            # Check for explanation with verse
            if len(response) > 150:
                score += 0.1
                signals.append("Verse with explanation")

        # Check for depth of teaching
        teaching_indicators = ["teaches us", "reminds us", "the meaning", "deeper understanding", "this suggests"]
        if any(ind in response_lower for ind in teaching_indicators):
            score += 0.1
            signals.append("Contains teaching element")

        return QualityScore(
            dimension=QualityDimension.SPIRITUAL_DEPTH,
            score=min(1.0, score),
            confidence=0.75,
            signals=signals
        )

    def _score_emotional_attunement(
        self,
        user_input: str,
        response: str,
        user_emotion: Optional[str]
    ) -> QualityScore:
        """Score how well response matches user's emotional state."""
        signals = []
        score = 0.5

        response_lower = response.lower()

        # Check for acknowledgment of emotion
        acknowledgment_phrases = ["i understand", "i hear", "it sounds like", "that must be", "it's natural to"]
        if any(phrase in response_lower for phrase in acknowledgment_phrases):
            score += 0.2
            signals.append("Acknowledges user's state")

        # Check emotion-appropriate response
        if user_emotion:
            emotion_responses = {
                "anxiety": ["calm", "peace", "breath", "present", "okay"],
                "sadness": ["care", "support", "here for you", "gentle", "healing"],
                "anger": ["understand", "valid", "pause", "reflect", "release"],
                "confusion": ["clarity", "understand", "explore", "discover", "clear"],
                "gratitude": ["beautiful", "wonderful", "appreciate", "blessed"],
            }

            appropriate_words = emotion_responses.get(user_emotion, [])
            if any(word in response_lower for word in appropriate_words):
                score += 0.2
                signals.append(f"Appropriate for {user_emotion}")

        # Check for compassionate tone
        compassion_phrases = self._quality_indicators["compassion_phrases"]
        if any(phrase in response_lower for phrase in compassion_phrases):
            score += 0.1
            signals.append("Compassionate tone")

        return QualityScore(
            dimension=QualityDimension.EMOTIONAL_ATTUNEMENT,
            score=min(1.0, score),
            confidence=0.65 if user_emotion else 0.45,
            signals=signals
        )

    def _score_engagement(
        self,
        response: str,
        subsequent_behavior: Optional[Dict[str, Any]]
    ) -> QualityScore:
        """Score how engaging the response is."""
        signals = []
        score = 0.4

        response_lower = response.lower()

        # Check for engagement elements
        if "?" in response:
            score += 0.2
            signals.append("Includes question")

        engagement_questions = self._quality_indicators["engagement_questions"]
        question_count = sum(1 for q in engagement_questions if q in response_lower)

        if question_count >= 1:
            score += 0.1
            signals.append("Invites reflection")

        # Check for personalization
        if any(phrase in response_lower for phrase in ["you mentioned", "you said", "your"]):
            score += 0.15
            signals.append("References user's input")

        # Check subsequent engagement if available
        if subsequent_behavior:
            if subsequent_behavior.get("response_time_seconds", 999) < 60:
                score += 0.1
                signals.append("Quick user response")

            if subsequent_behavior.get("message_length", 0) > 20:
                score += 0.1
                signals.append("Substantive user follow-up")

        return QualityScore(
            dimension=QualityDimension.ENGAGEMENT,
            score=min(1.0, score),
            confidence=0.6 if subsequent_behavior else 0.5,
            signals=signals
        )

    def _score_clarity(self, response: str) -> QualityScore:
        """Score the clarity of the response."""
        signals = []
        score = 0.5

        # Check sentence length
        sentences = re.split(r'[.!?]+', response)
        sentences = [s.strip() for s in sentences if s.strip()]

        if sentences:
            avg_words = sum(len(s.split()) for s in sentences) / len(sentences)
            if avg_words <= 15:
                score += 0.2
                signals.append("Clear, concise sentences")
            elif avg_words <= 20:
                score += 0.1
                signals.append("Reasonable sentence length")
            else:
                score -= 0.1
                signals.append("Long sentences may reduce clarity")

        # Check for structure
        if any(marker in response for marker in ["\n", "1.", "2.", "First", "Second"]):
            score += 0.15
            signals.append("Structured response")

        # Check for jargon (negative)
        complex_words = ["notwithstanding", "heretofore", "aforementioned", "viz", "ergo"]
        if any(word in response.lower() for word in complex_words):
            score -= 0.1
            signals.append("Contains complex language")

        # Simple language bonus
        simple_words_ratio = len([w for w in response.split() if len(w) <= 6]) / max(1, len(response.split()))
        if simple_words_ratio > 0.7:
            score += 0.1
            signals.append("Accessible vocabulary")

        return QualityScore(
            dimension=QualityDimension.CLARITY,
            score=min(1.0, max(0.0, score)),
            confidence=0.8,
            signals=signals
        )

    def _score_compassion(self, response: str) -> QualityScore:
        """Score the compassionate quality of the response."""
        signals = []
        score = 0.4

        response_lower = response.lower()
        compassion_phrases = self._quality_indicators["compassion_phrases"]

        # Count compassion indicators
        compassion_count = sum(1 for phrase in compassion_phrases if phrase in response_lower)

        if compassion_count >= 2:
            score += 0.4
            signals.append("Multiple compassionate expressions")
        elif compassion_count == 1:
            score += 0.2
            signals.append("Contains compassionate expression")

        # Check for non-judgmental language
        judgmental = ["you should have", "you shouldn't", "wrong to", "bad to"]
        if not any(phrase in response_lower for phrase in judgmental):
            score += 0.1
            signals.append("Non-judgmental tone")

        # Check for supportive language
        supportive = ["you're doing", "it's brave", "proud of", "strong of you"]
        if any(phrase in response_lower for phrase in supportive):
            score += 0.1
            signals.append("Supportive affirmation")

        return QualityScore(
            dimension=QualityDimension.COMPASSION,
            score=min(1.0, score),
            confidence=0.7,
            signals=signals
        )

    def _score_actionability(
        self,
        response: str,
        response_type: ResponseType
    ) -> QualityScore:
        """Score how actionable the response is."""
        signals = []
        score = 0.3

        response_lower = response.lower()
        actionable_phrases = self._quality_indicators["actionable_phrases"]

        # Count actionable suggestions
        action_count = sum(1 for phrase in actionable_phrases if phrase in response_lower)

        if action_count >= 3:
            score += 0.5
            signals.append(f"Multiple actionable suggestions ({action_count})")
        elif action_count >= 1:
            score += 0.3
            signals.append("Contains actionable suggestion")

        # Response type affects expected actionability
        if response_type in [ResponseType.GUIDANCE, ResponseType.REFLECTION_PROMPT]:
            # Higher expectation for these types
            if action_count >= 1:
                score += 0.1
            else:
                score -= 0.1
                signals.append("Guidance lacks actionable steps")

        elif response_type in [ResponseType.COMFORT, ResponseType.ACKNOWLEDGMENT]:
            # Lower expectation - it's okay to not have actions
            score += 0.1  # Bonus for appropriate response type

        return QualityScore(
            dimension=QualityDimension.ACTIONABILITY,
            score=min(1.0, max(0.0, score)),
            confidence=0.65,
            signals=signals
        )

    # ==================== Calculations ====================

    def _calculate_overall_score(
        self,
        dimension_scores: Dict[QualityDimension, QualityScore]
    ) -> float:
        """Calculate weighted overall score."""
        total_weight = 0.0
        weighted_sum = 0.0

        for dimension, score in dimension_scores.items():
            weight = self._dimension_weights.get(dimension, 0.1)
            weighted_sum += score.score * weight * score.confidence
            total_weight += weight * score.confidence

        if total_weight == 0:
            return 0.5

        return weighted_sum / total_weight

    def _calculate_overall_confidence(
        self,
        dimension_scores: Dict[QualityDimension, QualityScore]
    ) -> float:
        """Calculate overall confidence in the quality assessment."""
        if not dimension_scores:
            return 0.0

        confidences = [s.confidence for s in dimension_scores.values()]
        return sum(confidences) / len(confidences)

    def _generate_improvement_suggestions(
        self,
        dimension_scores: Dict[QualityDimension, QualityScore],
        response_type: ResponseType
    ) -> List[str]:
        """Generate actionable improvement suggestions."""
        suggestions = []

        # Find lowest scoring dimensions
        sorted_scores = sorted(
            dimension_scores.items(),
            key=lambda x: x[1].score
        )

        for dimension, score in sorted_scores[:3]:
            if score.score < 0.6:
                suggestions.extend(self._get_dimension_suggestions(dimension, score, response_type))

        return suggestions[:5]  # Return top 5 suggestions

    def _get_dimension_suggestions(
        self,
        dimension: QualityDimension,
        score: QualityScore,
        response_type: ResponseType
    ) -> List[str]:
        """Get improvement suggestions for a specific dimension."""
        suggestions_map = {
            QualityDimension.RELEVANCE: [
                "Address user's specific question more directly",
                "Reference key points from user's message"
            ],
            QualityDimension.HELPFULNESS: [
                "Include specific, actionable suggestions",
                "Offer concrete next steps"
            ],
            QualityDimension.SPIRITUAL_DEPTH: [
                "Consider including a relevant Gita verse",
                "Connect response to deeper spiritual principles"
            ],
            QualityDimension.EMOTIONAL_ATTUNEMENT: [
                "Acknowledge the user's emotional state explicitly",
                "Use more empathetic language"
            ],
            QualityDimension.ENGAGEMENT: [
                "End with a thoughtful question for reflection",
                "Invite the user to share more"
            ],
            QualityDimension.CLARITY: [
                "Use shorter sentences for clarity",
                "Structure the response with clear points"
            ],
            QualityDimension.COMPASSION: [
                "Add more supportive, understanding language",
                "Validate the user's experience"
            ],
            QualityDimension.ACTIONABILITY: [
                "Provide specific practice suggestions",
                "Offer a concrete exercise or reflection prompt"
            ],
        }

        return suggestions_map.get(dimension, [])

    # ==================== Analytics ====================

    def get_quality_trends(
        self,
        conversation_id: Optional[str] = None,
        days: int = 7
    ) -> Dict[QualityDimension, QualityTrend]:
        """Get quality trends over time."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        trends = {}

        # Collect all quality records
        all_records = []
        if conversation_id:
            all_records = [
                q for q in self._quality_history.get(conversation_id, [])
                if q.timestamp >= cutoff
            ]
        else:
            for records in self._quality_history.values():
                all_records.extend([q for q in records if q.timestamp >= cutoff])

        if not all_records:
            return {}

        # Calculate trends per dimension
        for dimension in QualityDimension:
            scores = [
                q.dimension_scores[dimension].score
                for q in all_records
                if dimension in q.dimension_scores
            ]

            if len(scores) < 2:
                continue

            # Split into halves for trend
            mid = len(scores) // 2
            first_half_avg = sum(scores[:mid]) / mid if mid > 0 else 0
            second_half_avg = sum(scores[mid:]) / len(scores[mid:]) if len(scores[mid:]) > 0 else 0

            if second_half_avg > first_half_avg * 1.05:
                trend = "improving"
            elif second_half_avg < first_half_avg * 0.95:
                trend = "declining"
            else:
                trend = "stable"

            import statistics
            variance = statistics.variance(scores) if len(scores) > 1 else 0

            trends[dimension] = QualityTrend(
                dimension=dimension,
                period_start=cutoff,
                period_end=datetime.utcnow(),
                average_score=sum(scores) / len(scores),
                score_variance=variance,
                sample_count=len(scores),
                trend_direction=trend
            )

        return trends

    def get_conversation_quality_summary(
        self,
        conversation_id: str
    ) -> Dict[str, Any]:
        """Get quality summary for a conversation."""
        records = self._quality_history.get(conversation_id, [])

        if not records:
            return {"error": "No quality records found"}

        avg_overall = sum(r.overall_score for r in records) / len(records)

        dimension_avgs = {}
        for dimension in QualityDimension:
            scores = [
                r.dimension_scores[dimension].score
                for r in records
                if dimension in r.dimension_scores
            ]
            if scores:
                dimension_avgs[dimension.value] = sum(scores) / len(scores)

        return {
            "conversation_id": conversation_id,
            "total_turns": len(records),
            "average_overall_score": avg_overall,
            "dimension_averages": dimension_avgs,
            "response_type_distribution": self._get_response_type_distribution(records),
            "improvement_areas": self._identify_improvement_areas(dimension_avgs)
        }

    def _get_response_type_distribution(
        self,
        records: List[ConversationQuality]
    ) -> Dict[str, int]:
        """Get distribution of response types."""
        distribution = defaultdict(int)
        for record in records:
            distribution[record.response_type.value] += 1
        return dict(distribution)

    def _identify_improvement_areas(
        self,
        dimension_avgs: Dict[str, float]
    ) -> List[str]:
        """Identify areas needing improvement."""
        threshold = 0.6
        return [dim for dim, avg in dimension_avgs.items() if avg < threshold]


# Singleton instance
_quality_service_instance: Optional[ConversationQualityService] = None


def get_quality_scoring_service() -> ConversationQualityService:
    """Get the singleton conversation quality service instance."""
    global _quality_service_instance
    if _quality_service_instance is None:
        _quality_service_instance = ConversationQualityService()
    return _quality_service_instance
