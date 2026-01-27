"""
Learning Feedback Service - RLHF-Style Improvement Loop

Provides reinforcement learning from human feedback:
- Collect explicit and implicit feedback
- Build reward models for response quality
- Identify improvement opportunities
- Track learning over time

This enables KIAAN to continuously improve like Siri/Alexa through user feedback.
"""

import logging
import json
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Tuple
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)


class FeedbackType(str, Enum):
    """Types of feedback collected."""
    # Explicit feedback
    RATING = "rating"  # 1-5 star rating
    THUMBS = "thumbs"  # Thumbs up/down
    TEXT = "text"  # Written feedback
    REPORT = "report"  # Issue report

    # Implicit feedback
    COMPLETION = "completion"  # Listened to full response
    SKIP = "skip"  # Skipped response
    REPLAY = "replay"  # Replayed response
    FOLLOW_UP = "follow_up"  # Asked follow-up
    ENGAGEMENT = "engagement"  # Time spent engaging
    RETURN = "return"  # Returned within 24h


class ImprovementCategory(str, Enum):
    """Categories for improvement actions."""
    PROMPT = "prompt"  # Prompt engineering
    VOICE = "voice"  # Voice settings
    CONTENT = "content"  # Content quality
    LENGTH = "length"  # Response length
    EMOTION = "emotion"  # Emotion handling
    RELEVANCE = "relevance"  # Relevance to query
    SPEED = "speed"  # Response speed


@dataclass
class FeedbackSignal:
    """A single feedback signal."""
    id: str
    user_id: str
    feedback_type: FeedbackType
    value: float  # Normalized 0-1 or -1 to 1
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # Context
    response_hash: str = ""  # Hash of response for correlation
    query_hash: str = ""  # Hash of query
    context_type: str = "general"
    language: str = "en"

    # Metadata
    voice_settings: Dict[str, Any] = field(default_factory=dict)
    response_length: int = 0
    response_time_ms: int = 0

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "feedback_type": self.feedback_type.value,
            "value": round(self.value, 3),
            "timestamp": self.timestamp.isoformat(),
            "response_hash": self.response_hash,
            "context_type": self.context_type,
            "language": self.language,
            "response_length": self.response_length,
            "response_time_ms": self.response_time_ms,
        }


@dataclass
class ImprovementAction:
    """A recommended improvement action."""
    category: ImprovementCategory
    action: str
    priority: float  # 0-1, higher = more important
    evidence: str
    affected_users: int
    potential_impact: float  # Expected improvement
    config_change: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict:
        return {
            "category": self.category.value,
            "action": self.action,
            "priority": round(self.priority, 3),
            "evidence": self.evidence,
            "affected_users": self.affected_users,
            "potential_impact": round(self.potential_impact, 3),
            "config_change": self.config_change,
        }


@dataclass
class RewardModel:
    """Simplified reward model for response quality."""
    # Feature weights learned from feedback
    weights: Dict[str, float] = field(default_factory=dict)

    # Baseline scores
    baseline_scores: Dict[str, float] = field(default_factory=dict)

    # Training metadata
    training_samples: int = 0
    last_updated: datetime = field(default_factory=datetime.utcnow)

    def predict_reward(self, features: Dict[str, float]) -> float:
        """Predict reward score for response features."""
        score = 0.0
        for feature, value in features.items():
            weight = self.weights.get(feature, 0.0)
            baseline = self.baseline_scores.get(feature, 0.0)
            score += weight * (value - baseline)
        return max(0.0, min(1.0, 0.5 + score))  # Normalize to 0-1

    def update(self, features: Dict[str, float], reward: float, learning_rate: float = 0.01) -> None:
        """Update model weights based on feedback."""
        prediction = self.predict_reward(features)
        error = reward - prediction

        for feature, value in features.items():
            if feature not in self.weights:
                self.weights[feature] = 0.0
            if feature not in self.baseline_scores:
                self.baseline_scores[feature] = value
            else:
                # Update baseline with exponential moving average
                self.baseline_scores[feature] = 0.95 * self.baseline_scores[feature] + 0.05 * value

            # Gradient update
            self.weights[feature] += learning_rate * error * (value - self.baseline_scores[feature])

        self.training_samples += 1
        self.last_updated = datetime.utcnow()


class LearningFeedbackService:
    """
    Service for collecting feedback and driving improvements.

    Features:
    - Collect explicit and implicit feedback
    - Build simple reward models
    - Identify improvement patterns
    - Generate actionable recommendations
    - Track improvement over time
    """

    # Feedback value mappings
    FEEDBACK_VALUES = {
        FeedbackType.RATING: lambda v: (v - 1) / 4,  # 1-5 -> 0-1
        FeedbackType.THUMBS: lambda v: 1.0 if v else 0.0,
        FeedbackType.COMPLETION: lambda v: 0.8,
        FeedbackType.SKIP: lambda v: 0.2,
        FeedbackType.REPLAY: lambda v: 0.9,
        FeedbackType.FOLLOW_UP: lambda v: 0.85,
        FeedbackType.ENGAGEMENT: lambda v: min(1.0, v / 60),  # Seconds, cap at 60s
        FeedbackType.RETURN: lambda v: 0.9,
    }

    # Minimum samples for statistical significance
    MIN_SAMPLES = 30

    def __init__(self, redis_client=None, db_session=None):
        """Initialize feedback service."""
        self.redis_client = redis_client
        self.db_session = db_session

        self._feedback_log: List[FeedbackSignal] = []
        self._response_feedback: Dict[str, List[FeedbackSignal]] = defaultdict(list)
        self._context_feedback: Dict[str, List[FeedbackSignal]] = defaultdict(list)
        self._signal_counter: int = 0

        # Reward models
        self._reward_model = RewardModel()
        self._context_models: Dict[str, RewardModel] = {}

        # Improvement tracking
        self._improvement_history: List[Dict] = []

    def _generate_signal_id(self) -> str:
        """Generate unique signal ID."""
        self._signal_counter += 1
        return f"fb_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{self._signal_counter}"

    def _hash_content(self, content: str) -> str:
        """Generate hash for content."""
        return hashlib.md5(content.encode()).hexdigest()[:12]

    async def record_feedback(
        self,
        user_id: str,
        feedback_type: FeedbackType,
        value: Any,
        response_text: Optional[str] = None,
        query_text: Optional[str] = None,
        context_type: str = "general",
        language: str = "en",
        voice_settings: Optional[Dict[str, Any]] = None,
        response_time_ms: int = 0
    ) -> FeedbackSignal:
        """
        Record a feedback signal.

        Args:
            user_id: User identifier
            feedback_type: Type of feedback
            value: Feedback value (varies by type)
            response_text: The response that was evaluated
            query_text: The original query
            context_type: Context type
            language: Language
            voice_settings: Voice settings used
            response_time_ms: Response generation time

        Returns:
            Recorded feedback signal
        """
        # Normalize value
        normalizer = self.FEEDBACK_VALUES.get(feedback_type, lambda v: v)
        normalized_value = normalizer(value)

        signal = FeedbackSignal(
            id=self._generate_signal_id(),
            user_id=user_id,
            feedback_type=feedback_type,
            value=normalized_value,
            response_hash=self._hash_content(response_text) if response_text else "",
            query_hash=self._hash_content(query_text) if query_text else "",
            context_type=context_type,
            language=language,
            voice_settings=voice_settings or {},
            response_length=len(response_text) if response_text else 0,
            response_time_ms=response_time_ms
        )

        # Store signal
        self._feedback_log.append(signal)
        if signal.response_hash:
            self._response_feedback[signal.response_hash].append(signal)
        self._context_feedback[context_type].append(signal)

        # Keep log bounded
        if len(self._feedback_log) > 10000:
            self._feedback_log = self._feedback_log[-10000:]

        # Update reward model
        features = self._extract_features(signal)
        self._reward_model.update(features, normalized_value)

        # Update context-specific model
        if context_type not in self._context_models:
            self._context_models[context_type] = RewardModel()
        self._context_models[context_type].update(features, normalized_value)

        logger.debug(f"Recorded feedback: {feedback_type.value}={normalized_value:.2f}")
        return signal

    def _extract_features(self, signal: FeedbackSignal) -> Dict[str, float]:
        """Extract features from feedback for reward model."""
        features = {
            "response_length": signal.response_length / 500,  # Normalize to ~500 chars
            "response_time": signal.response_time_ms / 2000,  # Normalize to 2s
        }

        # Voice settings features
        if signal.voice_settings:
            features["speaking_rate"] = signal.voice_settings.get("speaking_rate", 0.95)
            features["pitch"] = (signal.voice_settings.get("pitch", 0) + 2) / 4  # -2 to 2 -> 0 to 1
            features["emotion_intensity"] = signal.voice_settings.get("emotion_intensity", 1.0)

        return features

    async def get_response_score(
        self,
        response_text: str,
        context_type: str = "general"
    ) -> float:
        """
        Get predicted quality score for a response.

        Args:
            response_text: Response to score
            context_type: Context type

        Returns:
            Quality score 0-1
        """
        response_hash = self._hash_content(response_text)

        # Check if we have direct feedback for this response
        if response_hash in self._response_feedback:
            feedback = self._response_feedback[response_hash]
            if len(feedback) >= 3:
                return sum(f.value for f in feedback) / len(feedback)

        # Use reward model prediction
        features = {
            "response_length": len(response_text) / 500,
        }

        model = self._context_models.get(context_type, self._reward_model)
        return model.predict_reward(features)

    async def analyze_patterns(
        self,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Analyze feedback patterns over time.

        Args:
            days: Number of days to analyze

        Returns:
            Analysis results
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        recent = [f for f in self._feedback_log if f.timestamp > cutoff]

        if not recent:
            return {"status": "insufficient_data", "sample_count": 0}

        # Calculate metrics
        by_type = defaultdict(list)
        by_context = defaultdict(list)
        by_day = defaultdict(list)

        for f in recent:
            by_type[f.feedback_type.value].append(f.value)
            by_context[f.context_type].append(f.value)
            day_key = f.timestamp.strftime("%Y-%m-%d")
            by_day[day_key].append(f.value)

        # Aggregate
        type_scores = {k: sum(v) / len(v) for k, v in by_type.items()}
        context_scores = {k: sum(v) / len(v) for k, v in by_context.items()}
        daily_trend = {k: sum(v) / len(v) for k, v in sorted(by_day.items())}

        # Calculate overall trend
        if len(daily_trend) >= 2:
            values = list(daily_trend.values())
            trend = (values[-1] - values[0]) / len(values)
        else:
            trend = 0.0

        return {
            "status": "analyzed",
            "sample_count": len(recent),
            "overall_score": sum(f.value for f in recent) / len(recent),
            "by_feedback_type": type_scores,
            "by_context": context_scores,
            "daily_trend": daily_trend,
            "trend_direction": "improving" if trend > 0.05 else "declining" if trend < -0.05 else "stable",
            "trend_value": round(trend, 4),
        }

    async def identify_improvements(self) -> List[ImprovementAction]:
        """
        Identify potential improvement actions from feedback patterns.

        Returns:
            List of recommended improvements
        """
        improvements = []
        recent = [f for f in self._feedback_log if f.timestamp > datetime.utcnow() - timedelta(days=14)]

        if len(recent) < self.MIN_SAMPLES:
            return []

        # Analyze by response length
        short_responses = [f for f in recent if f.response_length < 200]
        long_responses = [f for f in recent if f.response_length > 400]

        if len(short_responses) >= 10 and len(long_responses) >= 10:
            short_score = sum(f.value for f in short_responses) / len(short_responses)
            long_score = sum(f.value for f in long_responses) / len(long_responses)

            if short_score > long_score + 0.1:
                improvements.append(ImprovementAction(
                    category=ImprovementCategory.LENGTH,
                    action="Reduce response length to 150-250 words",
                    priority=0.8,
                    evidence=f"Short responses score {short_score:.2f} vs long {long_score:.2f}",
                    affected_users=len(set(f.user_id for f in long_responses)),
                    potential_impact=short_score - long_score,
                    config_change={"max_tokens": 200}
                ))
            elif long_score > short_score + 0.1:
                improvements.append(ImprovementAction(
                    category=ImprovementCategory.LENGTH,
                    action="Increase response length for more depth",
                    priority=0.7,
                    evidence=f"Long responses score {long_score:.2f} vs short {short_score:.2f}",
                    affected_users=len(set(f.user_id for f in short_responses)),
                    potential_impact=long_score - short_score,
                    config_change={"max_tokens": 350}
                ))

        # Analyze by context
        context_scores = {}
        for f in recent:
            if f.context_type not in context_scores:
                context_scores[f.context_type] = []
            context_scores[f.context_type].append(f.value)

        avg_scores = {k: sum(v) / len(v) for k, v in context_scores.items() if len(v) >= 10}

        for context, score in avg_scores.items():
            if score < 0.5:
                improvements.append(ImprovementAction(
                    category=ImprovementCategory.CONTENT,
                    action=f"Improve response quality for '{context}' context",
                    priority=0.6 + (0.5 - score),
                    evidence=f"Context '{context}' has low score: {score:.2f}",
                    affected_users=len(set(f.user_id for f in recent if f.context_type == context)),
                    potential_impact=0.3
                ))

        # Analyze voice settings
        voice_feedback = [f for f in recent if f.voice_settings]
        if len(voice_feedback) >= 20:
            by_rate = defaultdict(list)
            for f in voice_feedback:
                rate = f.voice_settings.get("speaking_rate", 0.95)
                rate_bucket = round(rate, 1)
                by_rate[rate_bucket].append(f.value)

            rate_scores = {k: sum(v) / len(v) for k, v in by_rate.items() if len(v) >= 5}
            if rate_scores:
                best_rate = max(rate_scores.keys(), key=lambda k: rate_scores[k])
                current_avg = sum(rate_scores.values()) / len(rate_scores)

                if rate_scores[best_rate] > current_avg + 0.1:
                    improvements.append(ImprovementAction(
                        category=ImprovementCategory.VOICE,
                        action=f"Adjust default speaking rate to {best_rate}",
                        priority=0.7,
                        evidence=f"Speaking rate {best_rate} scores {rate_scores[best_rate]:.2f}",
                        affected_users=len(set(f.user_id for f in voice_feedback)),
                        potential_impact=rate_scores[best_rate] - current_avg,
                        config_change={"speaking_rate": best_rate}
                    ))

        # Sort by priority
        improvements.sort(key=lambda x: x.priority, reverse=True)

        return improvements[:10]  # Top 10 improvements

    async def get_learning_stats(self) -> Dict[str, Any]:
        """Get learning statistics."""
        return {
            "total_feedback_signals": len(self._feedback_log),
            "unique_responses": len(self._response_feedback),
            "contexts_tracked": len(self._context_feedback),
            "reward_model": {
                "training_samples": self._reward_model.training_samples,
                "features": list(self._reward_model.weights.keys()),
                "last_updated": self._reward_model.last_updated.isoformat()
                if self._reward_model.last_updated else None
            },
            "context_models": {
                ctx: {"samples": m.training_samples}
                for ctx, m in self._context_models.items()
            },
            "improvement_history_count": len(self._improvement_history),
        }

    async def apply_improvement(
        self,
        improvement: ImprovementAction
    ) -> bool:
        """
        Record that an improvement was applied.

        Args:
            improvement: The improvement action

        Returns:
            Success status
        """
        self._improvement_history.append({
            "improvement": improvement.to_dict(),
            "applied_at": datetime.utcnow().isoformat(),
            "status": "applied"
        })

        logger.info(f"Applied improvement: {improvement.action}")
        return True


# Singleton instance
_feedback_service: Optional[LearningFeedbackService] = None


def get_feedback_service(
    redis_client=None,
    db_session=None
) -> LearningFeedbackService:
    """Get singleton feedback service."""
    global _feedback_service
    if _feedback_service is None:
        _feedback_service = LearningFeedbackService(redis_client, db_session)
    return _feedback_service
