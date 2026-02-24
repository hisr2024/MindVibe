"""
AI-Powered Insight Generator Service

Generates personalized, actionable insights using GPT-4o-mini based on user analytics.

Quantum Enhancement #6: Advanced Analytics Dashboard
"""

from typing import List, Dict, Optional
from datetime import datetime
import logging
import statistics
import os

logger = logging.getLogger(__name__)


class InsightGeneratorService:
    """Service for generating AI-powered insights"""

    def __init__(self):
        self.openai_available = False
        self.openai_client = None

        # Try to import OpenAI (optional dependency)
        try:
            import openai
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.openai_client = openai.OpenAI(api_key=api_key)
                self.openai_available = True
        except ImportError:
            pass

    def generate_weekly_insight(
        self,
        mood_data: List[Dict],
        journal_data: List[Dict],
        verse_interactions: List[Dict],
        wellness_score: float,
        trend_analysis: Dict
    ) -> str:
        """
        Generate personalized weekly insight

        If OpenAI is available, uses GPT-4o-mini for generation.
        Otherwise, falls back to template-based insights.
        """
        if self.openai_available and self.openai_client:
            return self._generate_gpt_insight(
                mood_data, journal_data, verse_interactions,
                wellness_score, trend_analysis
            )
        else:
            return self._generate_template_insight(
                mood_data, journal_data, verse_interactions,
                wellness_score, trend_analysis
            )

    def generate_mood_insight(
        self,
        mood_average: float,
        trend: str,
        volatility: float,
        patterns: Dict
    ) -> str:
        """Generate insight about mood patterns"""
        insights = []

        # Mood average insight
        if mood_average >= 8.0:
            insights.append(f"Your mood has been excellent this week (avg: {mood_average:.1f}). This reflects strong emotional wellbeing.")
        elif mood_average >= 6.5:
            insights.append(f"Your mood has been positive this week (avg: {mood_average:.1f}). You're maintaining good balance.")
        elif mood_average >= 5.0:
            insights.append(f"Your mood has been moderate this week (avg: {mood_average:.1f}). Consider what small changes might help.")
        else:
            insights.append(f"Your mood has been challenging this week (avg: {mood_average:.1f}). Remember that difficult periods are part of the journey.")

        # Trend insight
        if trend == "improving":
            insights.append("📈 Great news! Your mood is trending upward. Keep nurturing the habits that support this growth.")
        elif trend == "declining":
            insights.append("📉 I notice your mood has been declining. This is a good time to revisit practices that have helped you before.")

        # Volatility insight
        if volatility > 2.0:
            insights.append(f"💭 Your mood has been variable (volatility: {volatility:.1f}). Consistency in daily practices can help create more stability.")

        # Weekly patterns
        if patterns.get("weekly"):
            weekly_data = patterns["weekly"]
            # Find best and worst days
            day_avgs = [(day, data["average"]) for day, data in weekly_data.items()]
            if day_avgs:
                day_avgs.sort(key=lambda x: x[1])
                worst_day = day_avgs[0][0]
                best_day = day_avgs[-1][0]

                if day_avgs[-1][1] - day_avgs[0][1] > 1.5:  # Significant difference
                    insights.append(
                        f"🗓️ Pattern detected: Your mood is typically highest on {best_day} "
                        f"and lowest on {worst_day}. Consider extra self-care on {worst_day}."
                    )

        return " ".join(insights[:3])  # Max 3 insights

    def generate_growth_insight(
        self,
        current_period_avg: float,
        previous_period_avg: float,
        streak_days: int
    ) -> str:
        """Generate insight about growth and progress"""
        change = current_period_avg - previous_period_avg
        change_pct = (change / previous_period_avg * 100) if previous_period_avg > 0 else 0

        insights = []

        # Change insight
        if change >= 1.0:
            insights.append(
                f"🌱 Significant growth! Your mood improved by {change:.1f} points "
                f"({change_pct:+.1f}%) compared to the previous period."
            )
        elif change >= 0.3:
            insights.append(
                f"📈 Positive progress! Your mood improved by {change:.1f} points. "
                "Small consistent gains lead to lasting change."
            )
        elif change <= -1.0:
            insights.append(
                f"This period has been challenging with a {abs(change):.1f} point decrease. "
                "Remember: setbacks are opportunities for learning and growth."
            )

        # Streak insight
        if streak_days >= 30:
            insights.append(
                f"🔥 Incredible dedication! You've maintained your practice for {streak_days} days. "
                "This consistency is building lasting positive habits."
            )
        elif streak_days >= 7:
            insights.append(
                f"✨ You've built a {streak_days}-day streak! Consistency is the foundation of transformation."
            )

        return " ".join(insights[:2])

    def generate_verse_insight(
        self,
        verse_interactions: List[Dict],
        top_chapters: List[str],
        total_time_minutes: int
    ) -> str:
        """Generate insight about verse engagement"""
        if not verse_interactions:
            return "💫 Start exploring the Bhagavad Gita verses to receive wisdom tailored to your journey."

        insights = []

        # Engagement level
        if total_time_minutes > 60:
            insights.append(
                f"📖 You've spent {total_time_minutes} minutes with the Gita this week. "
                "This deep engagement shows your commitment to wisdom."
            )
        elif total_time_minutes > 20:
            insights.append(
                f"📚 You've dedicated {total_time_minutes} minutes to reading verses. "
                "Each moment of reflection plants seeds of transformation."
            )

        # Chapter preferences
        if top_chapters:
            chapter_names = {
                "2": "Sankhya Yoga (Wisdom)",
                "3": "Karma Yoga (Action)",
                "6": "Dhyana Yoga (Meditation)",
                "12": "Bhakti Yoga (Devotion)"
            }

            top_chapter = top_chapters[0]
            chapter_name = chapter_names.get(top_chapter, f"Chapter {top_chapter}")

            insights.append(
                f"🕉️ You're drawn to {chapter_name}. This reflects your current spiritual focus "
                "and what your soul needs right now."
            )

        return " ".join(insights[:2])

    def _generate_gpt_insight(
        self,
        mood_data: List[Dict],
        journal_data: List[Dict],
        verse_interactions: List[Dict],
        wellness_score: float,
        trend_analysis: Dict
    ) -> str:
        """Generate insight using GPT-4o-mini"""
        # Prepare context
        recent_moods = mood_data[-7:] if len(mood_data) >= 7 else mood_data
        avg_mood = statistics.mean([m.get("score", 5.0) for m in recent_moods]) if recent_moods else 5.0

        # Extract tags from moods
        all_tags = []
        for mood in recent_moods:
            tags = mood.get("tags", {}).get("tags", [])
            if tags:
                all_tags.extend(tags)

        top_tags = list(set(all_tags))[:5] if all_tags else []

        # Journal themes (simplified - just count)
        journal_count = len([j for j in journal_data if j])

        prompt = f"""As KIAAN, MindVibe's compassionate AI guide rooted in Bhagavad Gita wisdom, analyze this user's week:

**Wellness Score**: {wellness_score}/100
**Average Mood**: {avg_mood:.1f}/10
**Mood Trend**: {trend_analysis.get('trend_direction', 'stable')}
**Frequent Emotions**: {', '.join(top_tags) if top_tags else 'Not specified'}
**Journal Entries**: {journal_count}
**Verse Interactions**: {len(verse_interactions)}

Provide ONE compassionate, actionable insight (2-3 sentences) that:
1. Acknowledges their current state with empathy
2. Offers a specific, practical suggestion rooted in Gita wisdom
3. Focuses on growth, not judgment

Keep it warm, personal, and encouraging. Use "you" and "your"."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are KIAAN, a compassionate spiritual wellness guide inspired by the Bhagavad Gita."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )

            # Safe null check for OpenAI response
            content = None
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg and response_msg.content:
                    content = response_msg.content.strip()

            if not content:
                return self._generate_template_insight(
                    mood_data, journal_data, verse_interactions,
                    wellness_score, trend_analysis
                )
            return content

        except Exception as e:
            logger.error(f"GPT insight generation failed: {e}")
            # Fallback to template
            return self._generate_template_insight(
                mood_data, journal_data, verse_interactions,
                wellness_score, trend_analysis
            )

    def _generate_template_insight(
        self,
        mood_data: List[Dict],
        journal_data: List[Dict],
        verse_interactions: List[Dict],
        wellness_score: float,
        trend_analysis: Dict
    ) -> str:
        """Generate insight using templates (fallback)"""
        recent_moods = mood_data[-7:] if len(mood_data) >= 7 else mood_data
        avg_mood = statistics.mean([m.get("score", 5.0) for m in recent_moods]) if recent_moods else 5.0

        trend = trend_analysis.get("trend_direction", "stable")
        journal_count = len(journal_data)

        # Select template based on wellness score
        if wellness_score >= 80:
            return (
                f"Your wellness journey is thriving this week with a score of {wellness_score}/100! "
                f"Your mood has been {trend}, averaging {avg_mood:.1f}/10. "
                "Continue nurturing these positive habits - they're creating lasting transformation. "
                "As the Gita teaches, 'Yogah karmasu kaushalam' - excellence in action through consistent practice."
            )
        elif wellness_score >= 60:
            return (
                f"You're maintaining steady progress with a wellness score of {wellness_score}/100. "
                f"Your mood is {trend} with an average of {avg_mood:.1f}/10. "
                f"You've journaled {journal_count} times this week - each entry deepens self-awareness. "
                "Keep building on this foundation, one day at a time."
            )
        elif wellness_score >= 40:
            return (
                f"Your wellness score is {wellness_score}/100, showing room for growth. "
                f"Your mood has been {trend} (avg: {avg_mood:.1f}/10). "
                "Remember: challenges are opportunities for inner strength. "
                "Try exploring the meditation verses (Chapter 6) and commit to daily mood check-ins. "
                "Small consistent steps lead to profound transformation."
            )
        else:
            return (
                f"This week has been challenging with a wellness score of {wellness_score}/100. "
                f"Your mood has been {trend}. "
                "I see you, and you're not alone in this journey. "
                "Consider reaching out for professional support, and explore the verses on equanimity (Chapter 2:48). "
                "Every moment is a new beginning - start with one small act of self-compassion today."
            )
