"""
A/B Testing Service - Response Experimentation Framework

Enables systematic experimentation to improve KIAAN responses:
- Test different prompt variations
- Compare response styles
- Optimize voice settings
- Measure user satisfaction

This is how Siri/Alexa continuously improve - through thousands of experiments.
"""

import logging
import hashlib
import json
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)


class ExperimentType(str, Enum):
    """Types of experiments."""
    PROMPT = "prompt"  # Different system prompts
    RESPONSE_LENGTH = "response_length"  # Short vs long responses
    VOICE_SETTINGS = "voice_settings"  # Speaking rate, pitch, etc.
    EMOTION_STYLE = "emotion_style"  # How emotions are expressed
    VERSE_SELECTION = "verse_selection"  # Verse recommendation algorithm
    TEMPERATURE = "temperature"  # AI creativity level


class ExperimentStatus(str, Enum):
    """Experiment status."""
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class Variant:
    """A variant in an experiment."""
    id: str
    name: str
    description: str
    config: Dict[str, Any]  # Configuration for this variant
    weight: float = 0.5  # Traffic allocation (0-1)

    # Metrics
    impressions: int = 0
    conversions: int = 0  # Defined by experiment goal
    total_rating: float = 0.0
    rating_count: int = 0

    @property
    def conversion_rate(self) -> float:
        """Calculate conversion rate."""
        return self.conversions / max(1, self.impressions)

    @property
    def avg_rating(self) -> float:
        """Calculate average rating."""
        return self.total_rating / max(1, self.rating_count)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "config": self.config,
            "weight": self.weight,
            "impressions": self.impressions,
            "conversions": self.conversions,
            "conversion_rate": round(self.conversion_rate, 4),
            "avg_rating": round(self.avg_rating, 2),
            "rating_count": self.rating_count,
        }


@dataclass
class Experiment:
    """An A/B experiment."""
    id: str
    name: str
    description: str
    experiment_type: ExperimentType
    status: ExperimentStatus = ExperimentStatus.DRAFT

    # Variants
    variants: List[Variant] = field(default_factory=list)

    # Targeting
    user_percentage: float = 100.0  # % of users in experiment
    target_contexts: List[str] = field(default_factory=list)  # Empty = all contexts
    target_languages: List[str] = field(default_factory=list)  # Empty = all languages

    # Timing
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    min_duration_days: int = 7
    max_duration_days: int = 30

    # Statistical settings
    min_sample_size: int = 100  # Per variant
    confidence_level: float = 0.95

    # Results
    winner_variant_id: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "experiment_type": self.experiment_type.value,
            "status": self.status.value,
            "variants": [v.to_dict() for v in self.variants],
            "user_percentage": self.user_percentage,
            "target_contexts": self.target_contexts,
            "target_languages": self.target_languages,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "min_sample_size": self.min_sample_size,
            "confidence_level": self.confidence_level,
            "winner_variant_id": self.winner_variant_id,
        }


@dataclass
class ExperimentResult:
    """Result of experiment analysis."""
    experiment_id: str
    is_significant: bool
    confidence: float
    winner_variant_id: Optional[str]
    winner_improvement: float  # % improvement over control
    recommendation: str
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "experiment_id": self.experiment_id,
            "is_significant": self.is_significant,
            "confidence": round(self.confidence, 4),
            "winner_variant_id": self.winner_variant_id,
            "winner_improvement": round(self.winner_improvement, 2),
            "recommendation": self.recommendation,
            "details": self.details,
        }


class ABTestingService:
    """
    A/B Testing service for KIAAN improvements.

    Features:
    - Create and manage experiments
    - Deterministic user assignment (same user always gets same variant)
    - Automatic winner detection
    - Statistical significance testing
    - Safe rollout of improvements
    """

    def __init__(self, redis_client=None):
        """Initialize A/B testing service."""
        self.redis_client = redis_client
        self._experiments: Dict[str, Experiment] = {}
        self._user_assignments: Dict[str, Dict[str, str]] = {}  # user_id -> {exp_id -> variant_id}
        self._initialize_default_experiments()

    def _initialize_default_experiments(self) -> None:
        """Initialize default experiments."""
        # Experiment 1: Response length
        exp1 = Experiment(
            id="exp_response_length_v1",
            name="Response Length Optimization",
            description="Test shorter vs longer responses for engagement",
            experiment_type=ExperimentType.RESPONSE_LENGTH,
            status=ExperimentStatus.RUNNING,
            variants=[
                Variant(
                    id="control",
                    name="Standard Length",
                    description="Current 150-250 word responses",
                    config={"max_tokens": 250, "min_words": 150, "max_words": 250},
                    weight=0.5
                ),
                Variant(
                    id="shorter",
                    name="Concise",
                    description="Shorter 80-150 word responses",
                    config={"max_tokens": 150, "min_words": 80, "max_words": 150},
                    weight=0.5
                )
            ],
            user_percentage=20.0,
            started_at=datetime.utcnow()
        )
        self._experiments[exp1.id] = exp1

        # Experiment 2: Voice speaking rate
        exp2 = Experiment(
            id="exp_speaking_rate_v1",
            name="Speaking Rate Optimization",
            description="Test different speaking rates for comprehension",
            experiment_type=ExperimentType.VOICE_SETTINGS,
            status=ExperimentStatus.RUNNING,
            variants=[
                Variant(
                    id="control",
                    name="Standard Rate",
                    description="Current 0.95 speaking rate",
                    config={"speaking_rate": 0.95},
                    weight=0.33
                ),
                Variant(
                    id="slower",
                    name="Slower",
                    description="0.88 speaking rate",
                    config={"speaking_rate": 0.88},
                    weight=0.33
                ),
                Variant(
                    id="faster",
                    name="Faster",
                    description="1.02 speaking rate",
                    config={"speaking_rate": 1.02},
                    weight=0.34
                )
            ],
            user_percentage=15.0,
            started_at=datetime.utcnow()
        )
        self._experiments[exp2.id] = exp2

        # Experiment 3: Emotion style
        exp3 = Experiment(
            id="exp_emotion_style_v1",
            name="Emotion Expression Style",
            description="Test different ways of expressing emotion in voice",
            experiment_type=ExperimentType.EMOTION_STYLE,
            status=ExperimentStatus.RUNNING,
            variants=[
                Variant(
                    id="control",
                    name="Subtle",
                    description="Current subtle emotion expression",
                    config={"emotion_intensity": 1.0, "prosody_variation": 0.1},
                    weight=0.5
                ),
                Variant(
                    id="expressive",
                    name="Expressive",
                    description="More pronounced emotion expression",
                    config={"emotion_intensity": 1.3, "prosody_variation": 0.2},
                    weight=0.5
                )
            ],
            user_percentage=25.0,
            started_at=datetime.utcnow()
        )
        self._experiments[exp3.id] = exp3

    def _hash_user_to_bucket(self, user_id: str, experiment_id: str, num_buckets: int = 100) -> int:
        """
        Deterministically assign user to a bucket.

        Same user+experiment always gets same bucket for consistency.
        """
        content = f"{user_id}:{experiment_id}"
        hash_value = int(hashlib.sha256(content.encode()).hexdigest(), 16)
        return hash_value % num_buckets

    def _is_user_in_experiment(self, user_id: str, experiment: Experiment) -> bool:
        """Check if user is in experiment based on percentage."""
        bucket = self._hash_user_to_bucket(user_id, experiment.id)
        return bucket < experiment.user_percentage

    def _assign_variant(self, user_id: str, experiment: Experiment) -> Variant:
        """Assign user to a variant deterministically."""
        # Check cached assignment
        if user_id in self._user_assignments:
            if experiment.id in self._user_assignments[user_id]:
                variant_id = self._user_assignments[user_id][experiment.id]
                for v in experiment.variants:
                    if v.id == variant_id:
                        return v

        # Calculate variant based on hash
        bucket = self._hash_user_to_bucket(user_id, f"{experiment.id}_variant", 1000)
        cumulative_weight = 0.0

        for variant in experiment.variants:
            cumulative_weight += variant.weight * 1000
            if bucket < cumulative_weight:
                # Cache assignment
                if user_id not in self._user_assignments:
                    self._user_assignments[user_id] = {}
                self._user_assignments[user_id][experiment.id] = variant.id
                return variant

        # Fallback to first variant
        return experiment.variants[0]

    async def get_variant_for_user(
        self,
        user_id: str,
        experiment_type: ExperimentType,
        context: Optional[str] = None,
        language: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get experiment variant configuration for a user.

        Args:
            user_id: User identifier
            experiment_type: Type of experiment
            context: Current context
            language: Current language

        Returns:
            Variant config if user is in an active experiment, None otherwise
        """
        for experiment in self._experiments.values():
            # Check experiment is running and matches type
            if experiment.status != ExperimentStatus.RUNNING:
                continue
            if experiment.experiment_type != experiment_type:
                continue

            # Check targeting
            if experiment.target_contexts and context:
                if context not in experiment.target_contexts:
                    continue
            if experiment.target_languages and language:
                if language not in experiment.target_languages:
                    continue

            # Check if user is in experiment
            if not self._is_user_in_experiment(user_id, experiment):
                continue

            # Assign variant and record impression
            variant = self._assign_variant(user_id, experiment)
            variant.impressions += 1

            logger.debug(f"User {user_id} assigned to {experiment.id}/{variant.id}")

            return {
                "experiment_id": experiment.id,
                "variant_id": variant.id,
                "config": variant.config,
            }

        return None

    async def record_conversion(
        self,
        user_id: str,
        experiment_id: str,
        variant_id: str
    ) -> None:
        """Record a conversion (goal completion) for an experiment."""
        if experiment_id not in self._experiments:
            return

        experiment = self._experiments[experiment_id]
        for variant in experiment.variants:
            if variant.id == variant_id:
                variant.conversions += 1
                logger.debug(f"Recorded conversion for {experiment_id}/{variant_id}")
                break

    async def record_rating(
        self,
        user_id: str,
        experiment_id: str,
        variant_id: str,
        rating: float
    ) -> None:
        """Record a rating for an experiment variant."""
        if experiment_id not in self._experiments:
            return

        experiment = self._experiments[experiment_id]
        for variant in experiment.variants:
            if variant.id == variant_id:
                variant.total_rating += rating
                variant.rating_count += 1
                break

    async def analyze_experiment(self, experiment_id: str) -> ExperimentResult:
        """
        Analyze experiment results and determine winner.

        Uses simplified statistical significance testing.
        """
        if experiment_id not in self._experiments:
            return ExperimentResult(
                experiment_id=experiment_id,
                is_significant=False,
                confidence=0.0,
                winner_variant_id=None,
                winner_improvement=0.0,
                recommendation="Experiment not found"
            )

        experiment = self._experiments[experiment_id]

        # Check minimum sample size
        total_impressions = sum(v.impressions for v in experiment.variants)
        min_impressions = experiment.min_sample_size * len(experiment.variants)

        if total_impressions < min_impressions:
            return ExperimentResult(
                experiment_id=experiment_id,
                is_significant=False,
                confidence=0.0,
                winner_variant_id=None,
                winner_improvement=0.0,
                recommendation=f"Need more data. Current: {total_impressions}, Required: {min_impressions}",
                details={"impressions": total_impressions, "required": min_impressions}
            )

        # Find best variant by rating (primary) or conversion (secondary)
        control = None
        best = None
        best_score = -1.0

        for variant in experiment.variants:
            if variant.id == "control":
                control = variant

            # Score by rating if available, else conversion rate
            score = variant.avg_rating if variant.rating_count > 0 else variant.conversion_rate
            if score > best_score:
                best_score = score
                best = variant

        if not best or not control:
            return ExperimentResult(
                experiment_id=experiment_id,
                is_significant=False,
                confidence=0.0,
                winner_variant_id=None,
                winner_improvement=0.0,
                recommendation="Invalid experiment configuration"
            )

        # Calculate improvement
        control_score = control.avg_rating if control.rating_count > 0 else control.conversion_rate
        if control_score > 0:
            improvement = ((best_score - control_score) / control_score) * 100
        else:
            improvement = 100 if best_score > 0 else 0

        # Simplified significance check
        # In production, use proper chi-squared or t-test
        is_significant = (
            best.rating_count >= experiment.min_sample_size and
            abs(improvement) >= 5.0  # At least 5% difference
        )

        confidence = min(0.99, best.rating_count / (experiment.min_sample_size * 2))

        if is_significant and best.id != "control":
            recommendation = f"Roll out '{best.name}' variant with {improvement:.1f}% improvement"
        elif is_significant:
            recommendation = "Control is best. Keep current implementation."
        else:
            recommendation = "Continue experiment. No significant winner yet."

        return ExperimentResult(
            experiment_id=experiment_id,
            is_significant=is_significant,
            confidence=confidence,
            winner_variant_id=best.id if is_significant else None,
            winner_improvement=improvement,
            recommendation=recommendation,
            details={
                "variants": [v.to_dict() for v in experiment.variants],
                "control_score": control_score,
                "best_score": best_score,
            }
        )

    async def create_experiment(self, experiment: Experiment) -> str:
        """Create a new experiment."""
        self._experiments[experiment.id] = experiment
        logger.info(f"Created experiment: {experiment.id}")
        return experiment.id

    async def get_experiment(self, experiment_id: str) -> Optional[Experiment]:
        """Get experiment by ID."""
        return self._experiments.get(experiment_id)

    async def list_experiments(
        self,
        status: Optional[ExperimentStatus] = None
    ) -> List[Experiment]:
        """List all experiments, optionally filtered by status."""
        experiments = list(self._experiments.values())
        if status:
            experiments = [e for e in experiments if e.status == status]
        return experiments

    async def stop_experiment(self, experiment_id: str) -> bool:
        """Stop a running experiment."""
        if experiment_id not in self._experiments:
            return False

        experiment = self._experiments[experiment_id]
        experiment.status = ExperimentStatus.COMPLETED
        experiment.ended_at = datetime.utcnow()

        # Analyze and set winner
        result = await self.analyze_experiment(experiment_id)
        if result.is_significant:
            experiment.winner_variant_id = result.winner_variant_id

        logger.info(f"Stopped experiment: {experiment_id}, winner: {experiment.winner_variant_id}")
        return True


# Singleton instance
_ab_testing_service: Optional[ABTestingService] = None


def get_ab_testing_service(redis_client=None) -> ABTestingService:
    """Get singleton A/B testing service."""
    global _ab_testing_service
    if _ab_testing_service is None:
        _ab_testing_service = ABTestingService(redis_client)
    return _ab_testing_service
