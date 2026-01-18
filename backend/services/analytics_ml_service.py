"""
Analytics ML Service

Provides machine learning capabilities for mood prediction, trend analysis,
and pattern recognition.

Quantum Enhancement #6: Advanced Analytics Dashboard
"""

from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import numpy as np
from collections import defaultdict
import statistics


class MoodDataPoint:
    """Single mood data point"""
    def __init__(self, date: datetime, score: float, tags: List[str] = None):
        self.date = date
        self.score = score
        self.tags = tags or []


class TrendAnalysis:
    """Mood trend analysis result"""
    def __init__(
        self,
        trend_direction: str,
        trend_strength: float,
        moving_avg_7d: float,
        moving_avg_30d: float,
        volatility: float,
        anomalies: List[Dict]
    ):
        self.trend_direction = trend_direction  # "improving", "declining", "stable"
        self.trend_strength = trend_strength    # 0-1 (strength of trend)
        self.moving_avg_7d = moving_avg_7d
        self.moving_avg_30d = moving_avg_30d
        self.volatility = volatility
        self.anomalies = anomalies


class MoodPrediction:
    """Mood prediction result"""
    def __init__(
        self,
        date: datetime,
        predicted_score: float,
        confidence_low: float,
        confidence_high: float,
        confidence_level: float
    ):
        self.date = date
        self.predicted_score = predicted_score
        self.confidence_low = confidence_low
        self.confidence_high = confidence_high
        self.confidence_level = confidence_level


class AnalyticsMLService:
    """Machine learning service for analytics"""

    def __init__(self):
        self.min_data_points = 7  # Minimum data points for analysis

    def analyze_mood_trends(
        self,
        mood_data: List[MoodDataPoint],
        lookback_days: int = 90
    ) -> TrendAnalysis:
        """
        Comprehensive mood trend analysis

        Features:
        - Moving averages (7-day, 30-day)
        - Volatility calculation
        - Trend detection (improving/declining/stable)
        - Anomaly detection
        """
        if len(mood_data) < self.min_data_points:
            return self._default_trend_analysis()

        # Sort by date
        sorted_data = sorted(mood_data, key=lambda x: x.date)
        scores = [d.score for d in sorted_data]

        # Calculate moving averages
        ma_7d = self._moving_average(scores, window=7)
        ma_30d = self._moving_average(scores, window=30)

        # Calculate volatility (standard deviation)
        volatility = statistics.stdev(scores) if len(scores) > 1 else 0.0

        # Trend detection using linear regression
        trend_direction, trend_strength = self._detect_trend(scores)

        # Anomaly detection
        anomalies = self._detect_anomalies(sorted_data, scores)

        return TrendAnalysis(
            trend_direction=trend_direction,
            trend_strength=trend_strength,
            moving_avg_7d=ma_7d[-1] if ma_7d else statistics.mean(scores),
            moving_avg_30d=ma_30d[-1] if ma_30d else statistics.mean(scores),
            volatility=volatility,
            anomalies=anomalies
        )

    def predict_mood(
        self,
        mood_data: List[MoodDataPoint],
        forecast_days: int = 7
    ) -> List[MoodPrediction]:
        """
        Predict future mood scores

        Uses simplified time-series forecasting based on:
        - Recent trend
        - Historical patterns
        - Moving averages
        """
        if len(mood_data) < self.min_data_points:
            return []

        sorted_data = sorted(mood_data, key=lambda x: x.date)
        scores = [d.score for d in sorted_data]

        # Calculate base prediction using moving average + trend
        ma_7d = statistics.mean(scores[-7:]) if len(scores) >= 7 else statistics.mean(scores)

        # Detect trend
        trend_direction, trend_strength = self._detect_trend(scores)

        # Calculate daily trend adjustment
        trend_multiplier = 1.0
        if trend_direction == "improving":
            trend_multiplier = 1.0 + (trend_strength * 0.1)
        elif trend_direction == "declining":
            trend_multiplier = 1.0 - (trend_strength * 0.1)

        # Calculate volatility for confidence intervals
        volatility = statistics.stdev(scores) if len(scores) > 1 else 1.0

        # Generate predictions
        predictions = []
        last_date = sorted_data[-1].date

        for day in range(1, forecast_days + 1):
            pred_date = last_date + timedelta(days=day)

            # Base prediction with trend adjustment
            pred_score = ma_7d * (trend_multiplier ** day)

            # Add weekly pattern (if we have enough data)
            if len(scores) >= 14:
                weekly_pattern = self._get_weekly_pattern(sorted_data, pred_date.weekday())
                pred_score = (pred_score * 0.7) + (weekly_pattern * 0.3)

            # Clamp to valid range (1-10)
            pred_score = max(1.0, min(10.0, pred_score))

            # Confidence intervals (based on volatility)
            confidence_level = max(0.5, 1.0 - (day * 0.1))  # Decreases with forecast distance
            confidence_margin = volatility * 1.5 * day  # Increases with forecast distance

            predictions.append(MoodPrediction(
                date=pred_date,
                predicted_score=round(pred_score, 1),
                confidence_low=round(max(1.0, pred_score - confidence_margin), 1),
                confidence_high=round(min(10.0, pred_score + confidence_margin), 1),
                confidence_level=round(confidence_level, 2)
            ))

        return predictions

    def calculate_risk_score(
        self,
        mood_data: List[MoodDataPoint],
        journal_data: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Calculate mental health risk score (0-100)

        Lower is better:
        - 0-30: Low risk (stable mental health)
        - 31-60: Medium risk (some concerns)
        - 61-100: High risk (significant concerns)

        Factors:
        - Mood trend (declining = higher risk)
        - Volatility (high volatility = higher risk)
        - Low mood frequency
        - Concerning journal themes (if provided)
        """
        if len(mood_data) < self.min_data_points:
            return {"score": 50, "level": "insufficient_data"}

        risk_score = 0.0
        factors = {}

        # Factor 1: Recent mood average (40% weight)
        recent_scores = [d.score for d in sorted(mood_data, key=lambda x: x.date)[-7:]]
        avg_mood = statistics.mean(recent_scores)
        if avg_mood < 4.0:
            mood_risk = 40
        elif avg_mood < 6.0:
            mood_risk = 25
        elif avg_mood < 7.0:
            mood_risk = 10
        else:
            mood_risk = 5

        risk_score += mood_risk
        factors["mood_average"] = {"value": avg_mood, "risk": mood_risk}

        # Factor 2: Trend direction (30% weight)
        trend_direction, trend_strength = self._detect_trend([d.score for d in mood_data])
        if trend_direction == "declining":
            trend_risk = 30 * trend_strength
        elif trend_direction == "stable":
            trend_risk = 15
        else:  # improving
            trend_risk = 5

        risk_score += trend_risk
        factors["trend"] = {"direction": trend_direction, "risk": trend_risk}

        # Factor 3: Volatility (20% weight)
        scores = [d.score for d in mood_data]
        volatility = statistics.stdev(scores) if len(scores) > 1 else 0.0
        volatility_risk = min(20, volatility * 5)  # High volatility = higher risk

        risk_score += volatility_risk
        factors["volatility"] = {"value": volatility, "risk": volatility_risk}

        # Factor 4: Low mood frequency (10% weight)
        low_mood_count = sum(1 for d in mood_data if d.score <= 3.0)
        low_mood_pct = (low_mood_count / len(mood_data)) * 100
        low_mood_risk = min(10, low_mood_pct / 2)

        risk_score += low_mood_risk
        factors["low_mood_frequency"] = {"percentage": low_mood_pct, "risk": low_mood_risk}

        # Determine risk level
        risk_score = round(risk_score, 1)
        if risk_score <= 30:
            level = "low"
            description = "Your mental health patterns indicate stability"
        elif risk_score <= 60:
            level = "medium"
            description = "Some patterns warrant attention"
        else:
            level = "high"
            description = "Significant patterns detected - consider professional support"

        return {
            "score": risk_score,
            "level": level,
            "description": description,
            "factors": factors
        }

    def detect_patterns(self, mood_data: List[MoodDataPoint]) -> Dict:
        """
        Detect behavioral patterns

        - Weekly patterns (e.g., "Sunday blues")
        - Time-of-day patterns (if timestamps available)
        - Tag correlations (which tags correlate with low/high moods)
        """
        if len(mood_data) < self.min_data_points:
            return {}

        patterns = {}

        # Weekly pattern analysis
        day_scores = defaultdict(list)
        for dp in mood_data:
            day_of_week = dp.date.weekday()  # 0=Monday, 6=Sunday
            day_scores[day_of_week].append(dp.score)

        weekly_pattern = {}
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for day, scores in day_scores.items():
            if scores:
                weekly_pattern[day_names[day]] = {
                    "average": round(statistics.mean(scores), 1),
                    "count": len(scores)
                }

        patterns["weekly"] = weekly_pattern

        # Tag correlation analysis
        tag_scores = defaultdict(list)
        for dp in mood_data:
            for tag in dp.tags:
                tag_scores[tag.lower()].append(dp.score)

        tag_correlations = []
        for tag, scores in tag_scores.items():
            if len(scores) >= 3:  # At least 3 occurrences
                avg_score = statistics.mean(scores)
                tag_correlations.append({
                    "tag": tag,
                    "average_mood": round(avg_score, 1),
                    "count": len(scores),
                    "impact": "positive" if avg_score > 7 else "negative" if avg_score < 5 else "neutral"
                })

        # Sort by frequency
        tag_correlations.sort(key=lambda x: x["count"], reverse=True)
        patterns["tag_correlations"] = tag_correlations[:10]  # Top 10

        return patterns

    # Helper methods

    def _moving_average(self, data: List[float], window: int) -> List[float]:
        """Calculate moving average"""
        if len(data) < window:
            return [statistics.mean(data)]

        result = []
        for i in range(len(data) - window + 1):
            window_data = data[i:i + window]
            result.append(statistics.mean(window_data))

        return result

    def _detect_trend(self, scores: List[float]) -> Tuple[str, float]:
        """
        Detect trend using simple linear regression

        Returns:
            - trend_direction: "improving", "declining", "stable"
            - trend_strength: 0-1 (how strong the trend is)
        """
        if len(scores) < 3:
            return "stable", 0.0

        n = len(scores)
        x = list(range(n))
        y = scores

        # Calculate linear regression slope
        x_mean = statistics.mean(x)
        y_mean = statistics.mean(y)

        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return "stable", 0.0

        slope = numerator / denominator

        # Determine direction and strength
        if abs(slope) < 0.02:  # Very flat
            return "stable", 0.0
        elif slope > 0:
            strength = min(1.0, abs(slope) / 0.1)  # Normalize
            return "improving", strength
        else:
            strength = min(1.0, abs(slope) / 0.1)
            return "declining", strength

    def _detect_anomalies(
        self,
        mood_data: List[MoodDataPoint],
        scores: List[float]
    ) -> List[Dict]:
        """Detect anomalous mood entries using IQR method"""
        if len(scores) < 10:
            return []

        # Calculate IQR
        sorted_scores = sorted(scores)
        q1_idx = len(sorted_scores) // 4
        q3_idx = (3 * len(sorted_scores)) // 4

        q1 = sorted_scores[q1_idx]
        q3 = sorted_scores[q3_idx]
        iqr = q3 - q1

        # Anomaly thresholds
        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        anomalies = []
        for dp in mood_data:
            if dp.score < lower_bound:
                anomalies.append({
                    "date": dp.date.isoformat(),
                    "score": dp.score,
                    "type": "unusually_low",
                    "description": f"Mood score {dp.score} is unusually low compared to your typical range"
                })
            elif dp.score > upper_bound:
                anomalies.append({
                    "date": dp.date.isoformat(),
                    "score": dp.score,
                    "type": "unusually_high",
                    "description": f"Mood score {dp.score} is unusually high compared to your typical range"
                })

        return anomalies

    def _get_weekly_pattern(
        self,
        mood_data: List[MoodDataPoint],
        target_weekday: int
    ) -> float:
        """Get average mood for a specific day of week"""
        scores_for_day = [
            d.score for d in mood_data
            if d.date.weekday() == target_weekday
        ]

        if scores_for_day:
            return statistics.mean(scores_for_day)

        # Fallback to overall average
        return statistics.mean([d.score for d in mood_data])

    def _default_trend_analysis(self) -> TrendAnalysis:
        """Return default trend analysis when insufficient data"""
        return TrendAnalysis(
            trend_direction="stable",
            trend_strength=0.0,
            moving_avg_7d=0.0,
            moving_avg_30d=0.0,
            volatility=0.0,
            anomalies=[]
        )
