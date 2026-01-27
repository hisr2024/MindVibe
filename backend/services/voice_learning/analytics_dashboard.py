"""
Voice Analytics Dashboard Service

Provides comprehensive analytics and visualization data for the KIAAN Voice
learning system. Tracks A/B test results, satisfaction trends, emotion detection
accuracy, and overall system performance metrics.

Features:
- Real-time metrics aggregation
- A/B test performance analysis
- User satisfaction trend tracking
- Emotion detection accuracy monitoring
- Cache performance metrics
- Session engagement analytics
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import asyncio
import logging
from collections import defaultdict
import statistics

logger = logging.getLogger(__name__)


class MetricType(Enum):
    """Types of metrics tracked by the dashboard."""
    SATISFACTION = "satisfaction"
    EMOTION_ACCURACY = "emotion_accuracy"
    RESPONSE_QUALITY = "response_quality"
    ENGAGEMENT = "engagement"
    CACHE_PERFORMANCE = "cache_performance"
    AB_TEST = "ab_test"
    SESSION_DURATION = "session_duration"
    FEEDBACK_RATE = "feedback_rate"


class TimeGranularity(Enum):
    """Time granularity for metrics aggregation."""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


@dataclass
class MetricDataPoint:
    """A single data point for a metric."""
    timestamp: datetime
    value: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ABTestResult:
    """Results for an A/B test variant."""
    experiment_id: str
    variant_id: str
    variant_name: str
    sample_size: int
    conversion_rate: float
    average_satisfaction: float
    confidence_interval: Tuple[float, float]
    is_winner: bool
    statistical_significance: float
    improvement_percentage: float


@dataclass
class EmotionAccuracyMetrics:
    """Metrics for emotion detection accuracy."""
    emotion: str
    true_positives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float


@dataclass
class DashboardSnapshot:
    """Complete snapshot of dashboard metrics."""
    timestamp: datetime
    overall_satisfaction: float
    satisfaction_trend: str  # "improving", "stable", "declining"
    total_sessions: int
    active_users_24h: int
    average_session_duration: float
    feedback_response_rate: float
    cache_hit_rate: float
    top_emotions: List[Tuple[str, float]]
    ab_test_winners: List[ABTestResult]
    engagement_score: float
    alerts: List[Dict[str, Any]]


class VoiceAnalyticsDashboard:
    """
    Comprehensive analytics dashboard for KIAAN Voice learning system.

    Aggregates and analyzes data from all voice learning services to provide
    actionable insights and real-time monitoring capabilities.
    """

    def __init__(self):
        self._metrics: Dict[MetricType, List[MetricDataPoint]] = defaultdict(list)
        self._ab_test_data: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: defaultdict(list))
        self._emotion_predictions: List[Dict[str, Any]] = []
        self._session_data: Dict[str, Dict[str, Any]] = {}
        self._alerts: List[Dict[str, Any]] = []
        self._initialized = False

        # Configuration
        self._retention_days = 30
        self._alert_thresholds = {
            "satisfaction_low": 3.0,
            "cache_hit_rate_low": 0.5,
            "error_rate_high": 0.1,
            "response_time_high": 2000,  # ms
        }

        logger.info("VoiceAnalyticsDashboard initialized")

    async def initialize(self) -> None:
        """Initialize the dashboard with historical data."""
        if self._initialized:
            return

        # In production, load historical data from database
        self._initialized = True
        logger.info("Dashboard initialized with historical data")

    # ==================== Data Ingestion ====================

    def record_satisfaction(
        self,
        user_id: str,
        rating: float,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record a user satisfaction rating."""
        self._metrics[MetricType.SATISFACTION].append(
            MetricDataPoint(
                timestamp=datetime.utcnow(),
                value=rating,
                metadata={
                    "user_id": user_id,
                    "session_id": session_id,
                    **(context or {})
                }
            )
        )
        self._check_satisfaction_alert(rating)

    def record_emotion_prediction(
        self,
        predicted_emotion: str,
        actual_emotion: Optional[str],
        confidence: float,
        text: str,
        user_id: str
    ) -> None:
        """Record an emotion prediction for accuracy tracking."""
        self._emotion_predictions.append({
            "timestamp": datetime.utcnow(),
            "predicted": predicted_emotion,
            "actual": actual_emotion,
            "confidence": confidence,
            "text_length": len(text),
            "user_id": user_id
        })

    def record_ab_test_outcome(
        self,
        experiment_id: str,
        variant_id: str,
        outcome: float,
        user_id: str
    ) -> None:
        """Record an A/B test outcome."""
        self._ab_test_data[experiment_id][variant_id].append(outcome)

    def record_session_event(
        self,
        session_id: str,
        event_type: str,
        data: Dict[str, Any]
    ) -> None:
        """Record a session event for engagement tracking."""
        if session_id not in self._session_data:
            self._session_data[session_id] = {
                "start_time": datetime.utcnow(),
                "events": [],
                "user_id": data.get("user_id")
            }

        self._session_data[session_id]["events"].append({
            "type": event_type,
            "timestamp": datetime.utcnow(),
            **data
        })

    def record_cache_event(
        self,
        hit: bool,
        response_time_ms: float,
        cache_key: Optional[str] = None
    ) -> None:
        """Record a cache hit/miss event."""
        self._metrics[MetricType.CACHE_PERFORMANCE].append(
            MetricDataPoint(
                timestamp=datetime.utcnow(),
                value=1.0 if hit else 0.0,
                metadata={
                    "response_time_ms": response_time_ms,
                    "cache_key": cache_key
                }
            )
        )

    # ==================== Analytics Queries ====================

    def get_satisfaction_trend(
        self,
        granularity: TimeGranularity = TimeGranularity.DAILY,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get satisfaction trend over time."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        relevant_data = [
            dp for dp in self._metrics[MetricType.SATISFACTION]
            if dp.timestamp >= cutoff
        ]

        if not relevant_data:
            return []

        # Group by time bucket
        buckets = self._bucket_data(relevant_data, granularity)

        trend = []
        for bucket_key, points in sorted(buckets.items()):
            values = [p.value for p in points]
            trend.append({
                "period": bucket_key,
                "average": statistics.mean(values),
                "min": min(values),
                "max": max(values),
                "count": len(values),
                "std_dev": statistics.stdev(values) if len(values) > 1 else 0
            })

        return trend

    def get_ab_test_results(self, experiment_id: str) -> List[ABTestResult]:
        """Get detailed results for an A/B test experiment."""
        if experiment_id not in self._ab_test_data:
            return []

        variants = self._ab_test_data[experiment_id]
        results = []

        # Calculate metrics for each variant
        variant_metrics = {}
        for variant_id, outcomes in variants.items():
            if not outcomes:
                continue

            avg = statistics.mean(outcomes)
            std = statistics.stdev(outcomes) if len(outcomes) > 1 else 0
            n = len(outcomes)

            # 95% confidence interval
            margin = 1.96 * (std / (n ** 0.5)) if n > 0 else 0

            variant_metrics[variant_id] = {
                "average": avg,
                "std": std,
                "n": n,
                "ci_low": avg - margin,
                "ci_high": avg + margin
            }

        # Determine winner
        if variant_metrics:
            best_variant = max(variant_metrics.items(), key=lambda x: x[1]["average"])
            best_avg = best_variant[1]["average"]
        else:
            best_variant = None
            best_avg = 0

        for variant_id, metrics in variant_metrics.items():
            is_winner = variant_id == best_variant[0] if best_variant else False
            improvement = ((metrics["average"] - best_avg) / best_avg * 100) if best_avg > 0 else 0

            results.append(ABTestResult(
                experiment_id=experiment_id,
                variant_id=variant_id,
                variant_name=f"Variant {variant_id}",
                sample_size=metrics["n"],
                conversion_rate=metrics["average"],
                average_satisfaction=metrics["average"],
                confidence_interval=(metrics["ci_low"], metrics["ci_high"]),
                is_winner=is_winner,
                statistical_significance=self._calculate_significance(
                    metrics, variant_metrics
                ),
                improvement_percentage=improvement
            ))

        return sorted(results, key=lambda x: x.average_satisfaction, reverse=True)

    def get_emotion_accuracy_metrics(self) -> List[EmotionAccuracyMetrics]:
        """Calculate accuracy metrics for each emotion category."""
        if not self._emotion_predictions:
            return []

        # Filter predictions with actual labels
        labeled = [p for p in self._emotion_predictions if p.get("actual")]

        if not labeled:
            return []

        # Calculate per-emotion metrics
        emotions = set(p["predicted"] for p in labeled) | set(p["actual"] for p in labeled)
        results = []

        for emotion in emotions:
            tp = sum(1 for p in labeled if p["predicted"] == emotion and p["actual"] == emotion)
            fp = sum(1 for p in labeled if p["predicted"] == emotion and p["actual"] != emotion)
            fn = sum(1 for p in labeled if p["predicted"] != emotion and p["actual"] == emotion)

            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

            results.append(EmotionAccuracyMetrics(
                emotion=emotion,
                true_positives=tp,
                false_positives=fp,
                false_negatives=fn,
                precision=precision,
                recall=recall,
                f1_score=f1
            ))

        return sorted(results, key=lambda x: x.f1_score, reverse=True)

    def get_engagement_metrics(self, days: int = 7) -> Dict[str, Any]:
        """Get user engagement metrics."""
        cutoff = datetime.utcnow() - timedelta(days=days)

        recent_sessions = {
            sid: data for sid, data in self._session_data.items()
            if data.get("start_time", datetime.min) >= cutoff
        }

        if not recent_sessions:
            return {
                "total_sessions": 0,
                "unique_users": 0,
                "avg_session_duration": 0,
                "avg_interactions_per_session": 0,
                "engagement_score": 0
            }

        # Calculate metrics
        unique_users = len(set(s.get("user_id") for s in recent_sessions.values() if s.get("user_id")))

        durations = []
        interactions = []
        for session in recent_sessions.values():
            events = session.get("events", [])
            if events:
                first_event = min(e["timestamp"] for e in events)
                last_event = max(e["timestamp"] for e in events)
                duration = (last_event - first_event).total_seconds()
                durations.append(duration)
                interactions.append(len(events))

        avg_duration = statistics.mean(durations) if durations else 0
        avg_interactions = statistics.mean(interactions) if interactions else 0

        # Engagement score: weighted combination of metrics
        engagement_score = min(100, (
            (avg_duration / 300) * 30 +  # Duration weight (5 min = 30 points)
            (avg_interactions / 10) * 40 +  # Interactions weight (10 = 40 points)
            (unique_users / 100) * 30  # User base weight
        ))

        return {
            "total_sessions": len(recent_sessions),
            "unique_users": unique_users,
            "avg_session_duration": avg_duration,
            "avg_interactions_per_session": avg_interactions,
            "engagement_score": engagement_score,
            "sessions_per_user": len(recent_sessions) / unique_users if unique_users > 0 else 0
        }

    def get_cache_performance(self, hours: int = 24) -> Dict[str, Any]:
        """Get cache performance metrics."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)

        cache_events = [
            dp for dp in self._metrics[MetricType.CACHE_PERFORMANCE]
            if dp.timestamp >= cutoff
        ]

        if not cache_events:
            return {
                "hit_rate": 0,
                "total_requests": 0,
                "avg_response_time_ms": 0,
                "hits": 0,
                "misses": 0
            }

        hits = sum(1 for e in cache_events if e.value == 1.0)
        total = len(cache_events)
        response_times = [e.metadata.get("response_time_ms", 0) for e in cache_events]

        return {
            "hit_rate": hits / total if total > 0 else 0,
            "total_requests": total,
            "avg_response_time_ms": statistics.mean(response_times) if response_times else 0,
            "hits": hits,
            "misses": total - hits
        }

    async def get_dashboard_snapshot(self) -> DashboardSnapshot:
        """Get a complete snapshot of all dashboard metrics."""
        # Gather all metrics
        satisfaction_trend = self.get_satisfaction_trend(TimeGranularity.DAILY, 7)
        engagement = self.get_engagement_metrics(7)
        cache_perf = self.get_cache_performance(24)
        emotion_metrics = self.get_emotion_accuracy_metrics()

        # Calculate overall satisfaction
        recent_satisfaction = [
            dp.value for dp in self._metrics[MetricType.SATISFACTION]
            if dp.timestamp >= datetime.utcnow() - timedelta(days=7)
        ]
        overall_satisfaction = statistics.mean(recent_satisfaction) if recent_satisfaction else 0

        # Determine satisfaction trend
        if len(satisfaction_trend) >= 2:
            recent_avg = satisfaction_trend[-1]["average"]
            prev_avg = satisfaction_trend[-2]["average"]
            if recent_avg > prev_avg * 1.05:
                trend = "improving"
            elif recent_avg < prev_avg * 0.95:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"

        # Get A/B test winners
        ab_winners = []
        for exp_id in self._ab_test_data.keys():
            results = self.get_ab_test_results(exp_id)
            winners = [r for r in results if r.is_winner]
            ab_winners.extend(winners)

        # Top emotions
        emotion_counts: Dict[str, int] = defaultdict(int)
        for pred in self._emotion_predictions[-1000:]:  # Last 1000
            emotion_counts[pred["predicted"]] += 1

        total_emotions = sum(emotion_counts.values()) or 1
        top_emotions = [
            (emotion, count / total_emotions)
            for emotion, count in sorted(emotion_counts.items(), key=lambda x: -x[1])[:5]
        ]

        # Active users in 24h
        cutoff_24h = datetime.utcnow() - timedelta(hours=24)
        active_users = len(set(
            data.get("user_id")
            for data in self._session_data.values()
            if data.get("start_time", datetime.min) >= cutoff_24h and data.get("user_id")
        ))

        # Feedback response rate
        total_responses = len([
            dp for dp in self._metrics[MetricType.SATISFACTION]
            if dp.timestamp >= cutoff_24h
        ])
        sessions_24h = len([
            s for s in self._session_data.values()
            if s.get("start_time", datetime.min) >= cutoff_24h
        ])
        feedback_rate = total_responses / sessions_24h if sessions_24h > 0 else 0

        return DashboardSnapshot(
            timestamp=datetime.utcnow(),
            overall_satisfaction=overall_satisfaction,
            satisfaction_trend=trend,
            total_sessions=engagement["total_sessions"],
            active_users_24h=active_users,
            average_session_duration=engagement["avg_session_duration"],
            feedback_response_rate=feedback_rate,
            cache_hit_rate=cache_perf["hit_rate"],
            top_emotions=top_emotions,
            ab_test_winners=ab_winners,
            engagement_score=engagement["engagement_score"],
            alerts=self._alerts[-10:]  # Last 10 alerts
        )

    # ==================== Alerting ====================

    def _check_satisfaction_alert(self, rating: float) -> None:
        """Check if satisfaction rating triggers an alert."""
        if rating < self._alert_thresholds["satisfaction_low"]:
            self._alerts.append({
                "type": "low_satisfaction",
                "timestamp": datetime.utcnow(),
                "value": rating,
                "threshold": self._alert_thresholds["satisfaction_low"],
                "message": f"Low satisfaction rating: {rating:.1f}"
            })

    def get_active_alerts(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get active alerts from the last N hours."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return [a for a in self._alerts if a["timestamp"] >= cutoff]

    # ==================== Helper Methods ====================

    def _bucket_data(
        self,
        data: List[MetricDataPoint],
        granularity: TimeGranularity
    ) -> Dict[str, List[MetricDataPoint]]:
        """Group data points into time buckets."""
        buckets: Dict[str, List[MetricDataPoint]] = defaultdict(list)

        for dp in data:
            if granularity == TimeGranularity.HOURLY:
                key = dp.timestamp.strftime("%Y-%m-%d %H:00")
            elif granularity == TimeGranularity.DAILY:
                key = dp.timestamp.strftime("%Y-%m-%d")
            elif granularity == TimeGranularity.WEEKLY:
                key = dp.timestamp.strftime("%Y-W%W")
            else:  # MONTHLY
                key = dp.timestamp.strftime("%Y-%m")

            buckets[key].append(dp)

        return buckets

    def _calculate_significance(
        self,
        variant_metrics: Dict[str, Any],
        all_metrics: Dict[str, Dict[str, Any]]
    ) -> float:
        """Calculate statistical significance (simplified t-test approximation)."""
        if len(all_metrics) < 2:
            return 0.0

        # Compare against control (first variant)
        control_id = list(all_metrics.keys())[0]
        control = all_metrics[control_id]

        if variant_metrics == control:
            return 0.0

        # Simplified significance calculation
        diff = abs(variant_metrics["average"] - control["average"])
        pooled_std = (variant_metrics["std"] + control["std"]) / 2

        if pooled_std == 0:
            return 1.0 if diff > 0 else 0.0

        # Effect size (Cohen's d approximation)
        effect_size = diff / pooled_std

        # Convert to probability (simplified)
        significance = min(1.0, effect_size / 2)

        return significance

    def cleanup_old_data(self, days: int = None) -> int:
        """Remove data older than retention period."""
        days = days or self._retention_days
        cutoff = datetime.utcnow() - timedelta(days=days)
        removed = 0

        # Clean metrics
        for metric_type in MetricType:
            original_len = len(self._metrics[metric_type])
            self._metrics[metric_type] = [
                dp for dp in self._metrics[metric_type]
                if dp.timestamp >= cutoff
            ]
            removed += original_len - len(self._metrics[metric_type])

        # Clean emotion predictions
        original_len = len(self._emotion_predictions)
        self._emotion_predictions = [
            p for p in self._emotion_predictions
            if p["timestamp"] >= cutoff
        ]
        removed += original_len - len(self._emotion_predictions)

        # Clean session data
        sessions_to_remove = [
            sid for sid, data in self._session_data.items()
            if data.get("start_time", datetime.min) < cutoff
        ]
        for sid in sessions_to_remove:
            del self._session_data[sid]
            removed += 1

        # Clean alerts
        original_len = len(self._alerts)
        self._alerts = [a for a in self._alerts if a["timestamp"] >= cutoff]
        removed += original_len - len(self._alerts)

        logger.info(f"Cleaned up {removed} old data points")
        return removed


# Singleton instance
_dashboard_instance: Optional[VoiceAnalyticsDashboard] = None


def get_analytics_dashboard() -> VoiceAnalyticsDashboard:
    """Get the singleton analytics dashboard instance."""
    global _dashboard_instance
    if _dashboard_instance is None:
        _dashboard_instance = VoiceAnalyticsDashboard()
    return _dashboard_instance
