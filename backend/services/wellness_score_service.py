"""
Wellness Score Service

Calculates comprehensive wellness score (0-100) from multiple factors.

Quantum Enhancement #6: Advanced Analytics Dashboard
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import statistics


class WellnessScoreBreakdown:
    """Wellness score with component breakdown"""
    def __init__(
        self,
        total_score: float,
        mood_stability_score: float,
        engagement_score: float,
        consistency_score: float,
        growth_score: float,
        level: str,
        level_description: str,
        recommendations: List[str]
    ):
        self.total_score = total_score
        self.mood_stability_score = mood_stability_score
        self.engagement_score = engagement_score
        self.consistency_score = consistency_score
        self.growth_score = growth_score
        self.level = level
        self.level_description = level_description
        self.recommendations = recommendations


class WellnessScoreService:
    """Service for calculating comprehensive wellness score"""

    def __init__(self):
        # Component weights (must sum to 1.0)
        self.MOOD_WEIGHT = 0.35
        self.ENGAGEMENT_WEIGHT = 0.25
        self.CONSISTENCY_WEIGHT = 0.20
        self.GROWTH_WEIGHT = 0.20

    def calculate_wellness_score(
        self,
        mood_data: List[Dict],
        journal_data: List[Dict],
        verse_interactions: List[Dict],
        kiaan_conversations: List[Dict],
        lookback_days: int = 30
    ) -> WellnessScoreBreakdown:
        """
        Calculate comprehensive wellness score

        Components:
        1. Mood Stability (35%): Consistency and positivity of mood
        2. Engagement (25%): Active use of app features
        3. Consistency (20%): Regular check-ins and streaks
        4. Growth (20%): Improvement trajectory over time
        """

        # Calculate each component
        mood_stability = self._calculate_mood_stability(mood_data, lookback_days)
        engagement = self._calculate_engagement(
            journal_data, verse_interactions, kiaan_conversations, lookback_days
        )
        consistency = self._calculate_consistency(mood_data, journal_data, lookback_days)
        growth = self._calculate_growth(mood_data, lookback_days)

        # Calculate weighted total
        total_score = (
            (mood_stability * self.MOOD_WEIGHT) +
            (engagement * self.ENGAGEMENT_WEIGHT) +
            (consistency * self.CONSISTENCY_WEIGHT) +
            (growth * self.GROWTH_WEIGHT)
        )

        # Determine level and description
        level, description = self._get_level_description(total_score)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            total_score, mood_stability, engagement, consistency, growth
        )

        return WellnessScoreBreakdown(
            total_score=round(total_score, 1),
            mood_stability_score=round(mood_stability, 1),
            engagement_score=round(engagement, 1),
            consistency_score=round(consistency, 1),
            growth_score=round(growth, 1),
            level=level,
            level_description=description,
            recommendations=recommendations
        )

    def _calculate_mood_stability(
        self,
        mood_data: List[Dict],
        lookback_days: int
    ) -> float:
        """
        Calculate mood stability score (0-100)

        Factors:
        - Average mood (higher is better)
        - Low volatility (stable is better)
        - Absence of severe lows
        """
        if not mood_data:
            return 50.0  # Neutral score

        # Filter to lookback period
        cutoff_date = datetime.now() - timedelta(days=lookback_days)
        recent_moods = [
            m for m in mood_data
            if datetime.fromisoformat(m.get("at", m.get("created_at", ""))) >= cutoff_date
        ]

        if not recent_moods:
            return 50.0

        scores = [m.get("score", 5.0) for m in recent_moods]

        # Factor 1: Average mood (0-10 scale → 0-50 points)
        avg_mood = statistics.mean(scores)
        avg_points = (avg_mood / 10.0) * 50

        # Factor 2: Stability (low volatility = more points, 0-30 points)
        if len(scores) > 1:
            std_dev = statistics.stdev(scores)
            # Lower std_dev is better (0-2.5 scale → 30-0 points)
            stability_points = max(0, 30 - (std_dev * 12))
        else:
            stability_points = 20  # Default for single data point

        # Factor 3: Absence of severe lows (0-20 points)
        severe_low_count = sum(1 for s in scores if s <= 3.0)
        severe_low_pct = (severe_low_count / len(scores)) * 100
        low_points = max(0, 20 - severe_low_pct)

        total = avg_points + stability_points + low_points
        return min(100.0, max(0.0, total))

    def _calculate_engagement(
        self,
        journal_data: List[Dict],
        verse_interactions: List[Dict],
        kiaan_conversations: List[Dict],
        lookback_days: int
    ) -> float:
        """
        Calculate engagement score (0-100)

        Factors:
        - Journal frequency
        - Verse reading activity
        - KIAAN interactions
        """
        cutoff_date = datetime.now() - timedelta(days=lookback_days)

        # Filter data
        recent_journals = [
            j for j in journal_data
            if datetime.fromisoformat(j.get("created_at", "")) >= cutoff_date
        ]
        recent_verses = [
            v for v in verse_interactions
            if datetime.fromisoformat(v.get("timestamp", "")) >= cutoff_date
        ]
        recent_kiaan = [
            k for k in kiaan_conversations
            if datetime.fromisoformat(k.get("created_at", "")) >= cutoff_date
        ]

        # Factor 1: Journal entries (0-40 points)
        # Target: 2-3 per week = ~10 per month
        journal_count = len(recent_journals)
        target_journals = (lookback_days / 7) * 2.5
        journal_points = min(40, (journal_count / target_journals) * 40)

        # Factor 2: Verse interactions (0-30 points)
        # Target: Daily = ~30 per month
        verse_count = len(recent_verses)
        target_verses = lookback_days
        verse_points = min(30, (verse_count / target_verses) * 30)

        # Factor 3: KIAAN conversations (0-30 points)
        # Target: Weekly = ~4 per month
        kiaan_count = len(recent_kiaan)
        target_kiaan = (lookback_days / 7)
        kiaan_points = min(30, (kiaan_count / target_kiaan) * 30)

        total = journal_points + verse_points + kiaan_points
        return min(100.0, max(0.0, total))

    def _calculate_consistency(
        self,
        mood_data: List[Dict],
        journal_data: List[Dict],
        lookback_days: int
    ) -> float:
        """
        Calculate consistency score (0-100)

        Factors:
        - Current streak
        - Check-in frequency
        - Regular usage pattern
        """
        cutoff_date = datetime.now() - timedelta(days=lookback_days)

        # Combine mood and journal dates for activity tracking
        activity_dates = set()

        for mood in mood_data:
            date = datetime.fromisoformat(mood.get("at", mood.get("created_at", "")))
            if date >= cutoff_date:
                activity_dates.add(date.date())

        for journal in journal_data:
            date = datetime.fromisoformat(journal.get("created_at", ""))
            if date >= cutoff_date:
                activity_dates.add(date.date())

        if not activity_dates:
            return 0.0

        # Factor 1: Current streak (0-50 points)
        current_streak = self._calculate_current_streak(activity_dates)
        # 7+ day streak = full points
        streak_points = min(50, (current_streak / 7.0) * 50)

        # Factor 2: Overall frequency (0-50 points)
        activity_count = len(activity_dates)
        frequency_rate = (activity_count / lookback_days) * 100
        # 50%+ activity rate = full points
        frequency_points = min(50, frequency_rate)

        total = streak_points + frequency_points
        return min(100.0, max(0.0, total))

    def _calculate_growth(
        self,
        mood_data: List[Dict],
        lookback_days: int
    ) -> float:
        """
        Calculate growth score (0-100)

        Factors:
        - Mood improvement over time
        - Positive trajectory
        """
        if not mood_data or len(mood_data) < 7:
            return 50.0  # Neutral for insufficient data

        cutoff_date = datetime.now() - timedelta(days=lookback_days)
        recent_moods = [
            m for m in mood_data
            if datetime.fromisoformat(m.get("at", m.get("created_at", ""))) >= cutoff_date
        ]

        if len(recent_moods) < 7:
            return 50.0

        # Sort by date
        sorted_moods = sorted(
            recent_moods,
            key=lambda x: datetime.fromisoformat(x.get("at", x.get("created_at", "")))
        )

        scores = [m.get("score", 5.0) for m in sorted_moods]

        # Calculate first half average vs second half average
        mid_point = len(scores) // 2
        first_half_avg = statistics.mean(scores[:mid_point])
        second_half_avg = statistics.mean(scores[mid_point:])

        # Calculate improvement
        improvement = second_half_avg - first_half_avg

        # Score calculation
        # -2 or worse = 0 points (significant decline)
        # 0 = 50 points (stable)
        # +2 or better = 100 points (significant improvement)
        if improvement >= 2.0:
            growth_score = 100.0
        elif improvement <= -2.0:
            growth_score = 0.0
        else:
            # Linear scale from 0 to 100
            growth_score = 50 + (improvement * 25)

        return min(100.0, max(0.0, growth_score))

    def _calculate_current_streak(self, activity_dates: set) -> int:
        """Calculate current consecutive day streak"""
        if not activity_dates:
            return 0

        sorted_dates = sorted(activity_dates, reverse=True)
        today = datetime.now().date()
        streak = 0

        # Check if there's activity today or yesterday
        if today not in sorted_dates and (today - timedelta(days=1)) not in sorted_dates:
            return 0

        # Count consecutive days backwards from today
        current_date = today
        for _ in range(365):  # Max streak cap
            if current_date in sorted_dates:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break

        return streak

    def _get_level_description(self, score: float) -> tuple:
        """Get wellness level and description"""
        if score >= 85:
            return "excellent", "Thriving! Your wellness journey is flourishing"
        elif score >= 70:
            return "good", "You're doing well and maintaining positive habits"
        elif score >= 50:
            return "fair", "You're on the right path with room to grow"
        elif score >= 30:
            return "needs_attention", "Consider increasing your engagement and consistency"
        else:
            return "needs_improvement", "Let's work on building healthier patterns together"

    def _generate_recommendations(
        self,
        total: float,
        mood: float,
        engagement: float,
        consistency: float,
        growth: float
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        # Find lowest scoring component
        components = [
            ("mood_stability", mood, "Practice daily mood check-ins to better understand your emotional patterns"),
            ("engagement", engagement, "Try exploring more verses and journaling to deepen your practice"),
            ("consistency", consistency, "Build a daily habit by setting a reminder for evening reflection"),
            ("growth", growth, "Focus on small improvements each week - progress is a journey")
        ]

        # Sort by score (lowest first)
        components.sort(key=lambda x: x[1])

        # Add recommendations for lowest 2 components
        for i in range(min(2, len(components))):
            if components[i][1] < 70:  # Only recommend if below 70
                recommendations.append(components[i][2])

        # General recommendations based on total score
        if total < 50:
            recommendations.append("Consider exploring the AI Wisdom Journeys for guided support")
        elif total >= 85:
            recommendations.append("You're thriving! Consider helping others in Community Circles")

        return recommendations[:3]  # Max 3 recommendations
