"""
Calming Mood Analytics Service - Divine Awareness Integration

This service enhances mood tracking with:
- Sacred awareness of emotional states
- Divine comfort for every feeling
- Calming, nurturing responses
- Consciousness-touching feedback
- Spiritual growth insights

"Every emotion is a doorway to the divine when met with awareness."
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class CalmingMoodAnalytics:
    """
    Advanced mood analytics that infuses divine awareness into emotional tracking.

    Creates an experience where users feel:
    - Deeply seen and understood
    - Held with compassion
    - Connected to something sacred
    - At peace with their emotions
    """

    # Sacred micro-responses for each mood level (1-10 scale)
    SACRED_MOOD_RESPONSES = {
        # Very low (1-2) - Deep compassion and presence
        1: {
            "response": "I see you in this darkness, and I hold you with infinite tenderness. This pain is real, and you don't have to carry it alone. 💙",
            "divine_message": "Even in the deepest night, the divine light within you never goes out. It waits, patient and eternal, for your return.",
            "practice": "Place your hand on your heart. Breathe. Whisper: 'I am held. I am loved. This too shall pass.'",
            "affirmation": "I am worthy of compassion, especially in my darkest moments.",
        },
        2: {
            "response": "This heaviness is hard to carry. I'm here with you, sitting in this space, not trying to fix or change anything. Just being here. 💙",
            "divine_message": "The sacred meets you exactly where you are. There is no place too dark for grace to find you.",
            "practice": "Breathe in for 4... hold for 4... out for 8. Let each exhale carry away a little of the weight.",
            "affirmation": "I allow myself to feel without judgment. My feelings are valid.",
        },
        # Low (3-4) - Gentle support and acknowledgment
        3: {
            "response": "I sense the struggle within you. Whatever you're moving through, you're showing courage by being present with it. 💙",
            "divine_message": "Every challenge is the universe inviting you to grow. You are being shaped by sacred hands.",
            "practice": "Close your eyes. Find one thing, however small, that brings a flicker of peace. Rest your attention there.",
            "affirmation": "I am stronger than I know. Peace finds me even in difficulty.",
        },
        4: {
            "response": "There's a quietness to your energy today. That's okay. Sometimes we need to walk slowly through the valley. 💙",
            "divine_message": "The divine never rushes. In slowness, you are aligned with sacred timing.",
            "practice": "Step outside if you can. Feel the air on your skin. Remember: you are part of something vast and beautiful.",
            "affirmation": "I trust the rhythm of my own healing.",
        },
        # Neutral (5-6) - Steady presence and gentle encouragement
        5: {
            "response": "A quiet steadiness today. You're here, you're present, you're showing up. That matters more than you know. 💙",
            "divine_message": "In the middle place, wisdom speaks. Listen to what stillness wants to teach you today.",
            "practice": "Take three conscious breaths. With each one, silently say: 'Here. Now. Peace.'",
            "affirmation": "I am at peace with where I am. This moment is enough.",
        },
        6: {
            "response": "There's a gentle balance in your being today. A readiness for what comes next. 💙",
            "divine_message": "From this centered place, you can move in any direction the soul calls you.",
            "practice": "Set one small intention for today. Hold it lightly, like a feather in your palm.",
            "affirmation": "I am centered. I move through life with grace.",
        },
        # Good (7-8) - Celebration and deepening
        7: {
            "response": "A warmth is building within you. Let yourself receive this goodness - you deserve it. 💙",
            "divine_message": "Joy is the language of the soul. When you feel good, the divine smiles through you.",
            "practice": "Pause and savor this feeling. Let it sink into your cells. This is what you're here for.",
            "affirmation": "I welcome joy. I am worthy of feeling good.",
        },
        8: {
            "response": "There's a brightness in your energy today - like sunlight breaking through clouds. Beautiful. 💙",
            "divine_message": "You are aligned with your true nature. This peace, this joy - this is who you really are.",
            "practice": "Share a kind word with someone today. Let your light touch another soul.",
            "affirmation": "My joy blesses everyone I meet.",
        },
        # Excellent (9-10) - Radiance and gratitude
        9: {
            "response": "Such radiance flows through you! This is the soul shining through. Bask in this beautiful energy. 💙",
            "divine_message": "In moments like these, you glimpse your eternal nature - boundless, peaceful, whole.",
            "practice": "Breathe this feeling into your heart. Store it there as a treasure you can always return to.",
            "affirmation": "I am connected to infinite peace and joy.",
        },
        10: {
            "response": "You are glowing with the light of true peace. This is sacred. This is you, remembering who you really are. 💙",
            "divine_message": "This feeling of wholeness is not temporary - it is your true nature revealed. You are one with all that is.",
            "practice": "Sit in silence for a moment. Send this peace out into the world as a blessing for all beings.",
            "affirmation": "I am peace itself. I am love itself. I am whole.",
        },
    }

    # Emotion-to-divine-guidance mapping
    EMOTION_DIVINE_GUIDANCE = {
        "peaceful": {
            "category": "serenity",
            "divine_reflection": "Peace is your true nature. In this moment, you are remembering what you've always known.",
            "sacred_practice": "Rest in this peace. Let it deepen. There is nothing to do, nowhere to go. Just be.",
            "consciousness_note": "This stillness you feel is the same stillness at the heart of the universe.",
        },
        "anxious": {
            "category": "transformation",
            "divine_reflection": "Anxiety is energy seeking direction. The sacred is with you, helping transform fear into wisdom.",
            "sacred_practice": "Ground yourself. Feel your feet on the earth. Breathe slowly. You are supported by the universe itself.",
            "consciousness_note": "Behind the waves of anxiety, an ocean of calm waits. You can sink into it anytime.",
        },
        "sad": {
            "category": "tenderness",
            "divine_reflection": "Sadness is the heart's way of honoring what matters. The divine weeps with you and holds you close.",
            "sacred_practice": "Let the tears flow if they come. Each one is a prayer, a release, a step toward healing.",
            "consciousness_note": "In the depths of sadness, love is being born. Trust this sacred process.",
        },
        "angry": {
            "category": "transformation",
            "divine_reflection": "Anger is often love that has been hurt. The sacred fire within you can transform this into strength.",
            "sacred_practice": "Place your hand on your heart. Breathe deeply. Ask: 'What does this anger want to protect?'",
            "consciousness_note": "Divine fire purifies. Let this energy burn away what no longer serves.",
        },
        "grateful": {
            "category": "connection",
            "divine_reflection": "Gratitude opens the door to the divine. In thankfulness, heaven and earth meet.",
            "sacred_practice": "Close your eyes and feel the warmth of gratitude in your chest. This feeling connects you to all that is.",
            "consciousness_note": "When you are grateful, you align with the abundant nature of the universe.",
        },
        "happy": {
            "category": "radiance",
            "divine_reflection": "Joy is the song of the soul. When you are happy, the universe celebrates through you.",
            "sacred_practice": "Let this happiness radiate outward. Touch others with your light. Be a blessing today.",
            "consciousness_note": "This happiness is not separate from you - it IS you, expressing your divine nature.",
        },
        "tired": {
            "category": "rest",
            "divine_reflection": "Even the divine rested after creation. Your tiredness is an invitation to surrender.",
            "sacred_practice": "Give yourself full permission to rest. This is not weakness - it is wisdom.",
            "consciousness_note": "In rest, the soul is restored. Let go and let the infinite hold you.",
        },
        "confused": {
            "category": "emergence",
            "divine_reflection": "Confusion often precedes clarity. The sacred is rearranging things within you.",
            "sacred_practice": "Instead of seeking answers, rest in the question. Let understanding emerge in its own time.",
            "consciousness_note": "Not-knowing is sacred space. From confusion, new wisdom is being born.",
        },
        "hopeful": {
            "category": "faith",
            "divine_reflection": "Hope is the heart's trust in the goodness of life. It is the divine speaking within you.",
            "sacred_practice": "Hold this hope gently. Nurture it like a small flame. It will grow.",
            "consciousness_note": "Hope connects you to the future the universe is preparing for you.",
        },
        "lonely": {
            "category": "connection",
            "divine_reflection": "Even in loneliness, you are never truly alone. The divine presence is closer than your own breath.",
            "sacred_practice": "Place your hand on your heart and feel its beat. That rhythm connects you to all living things.",
            "consciousness_note": "Loneliness is a call to remember your connection to the infinite.",
        },
        "overwhelmed": {
            "category": "surrender",
            "divine_reflection": "When life feels like too much, the sacred invites you to lay down your burdens.",
            "sacred_practice": "This moment only. This breath only. Let everything else wait. You are doing enough by being here.",
            "consciousness_note": "The infinite cannot be overwhelmed. That infinite presence lives within you.",
        },
    }

    # Mood trend sacred insights
    TREND_INSIGHTS = {
        "improving": {
            "insight": "Your light is growing brighter. The sacred is celebrating your journey.",
            "encouragement": "Keep trusting the process. Each step toward peace is blessed.",
            "practice": "Notice what has helped you rise. These are gifts to honor.",
        },
        "stable": {
            "insight": "There is wisdom in steadiness. You are rooted in something deep.",
            "encouragement": "From this stable place, you can grow in any direction you choose.",
            "practice": "Use this stability to deepen your practice. Consistency is sacred.",
        },
        "declining": {
            "insight": "Every descent is also a journey inward. The sacred meets you in the depths.",
            "encouragement": "Be extra gentle with yourself now. This is a time for radical self-compassion.",
            "practice": "Reach out. Connect. You are not meant to walk through darkness alone.",
        },
        "fluctuating": {
            "insight": "Like the sea, your emotions have tides. This is natural and beautiful.",
            "encouragement": "Don't resist the waves. Learn to surf them with grace.",
            "practice": "Find your anchor - a breath, a mantra, a place of peace within.",
        },
    }

    def __init__(self):
        """Initialize the Calming Mood Analytics service."""
        logger.info("🌿 Calming Mood Analytics initialized - Divine awareness active")

    def get_sacred_mood_response(self, mood_score: int) -> dict[str, str]:
        """
        Get sacred response for a mood score (1-10).

        Args:
            mood_score: Mood score from 1-10

        Returns:
            Dictionary with sacred response elements
        """
        score = max(1, min(10, mood_score))
        return self.SACRED_MOOD_RESPONSES[score]

    def get_emotion_divine_guidance(self, emotion: str) -> dict[str, str]:
        """
        Get divine guidance for a specific emotion.

        Args:
            emotion: The emotion name

        Returns:
            Dictionary with divine guidance elements
        """
        emotion_lower = emotion.lower()

        # Map similar emotions
        emotion_map = {
            "stressed": "anxious",
            "worried": "anxious",
            "nervous": "anxious",
            "depressed": "sad",
            "down": "sad",
            "heavy": "sad",
            "frustrated": "angry",
            "irritated": "angry",
            "content": "peaceful",
            "calm": "peaceful",
            "serene": "peaceful",
            "joyful": "happy",
            "excited": "happy",
            "exhausted": "tired",
            "drained": "tired",
            "lost": "confused",
            "uncertain": "confused",
            "stuck": "confused",
            "isolated": "lonely",
            "disconnected": "lonely",
            "buried": "overwhelmed",
            "drowning": "overwhelmed",
            "thankful": "grateful",
            "blessed": "grateful",
            "optimistic": "hopeful",
            "anticipating": "hopeful",
        }

        mapped_emotion = emotion_map.get(emotion_lower, emotion_lower)
        return self.EMOTION_DIVINE_GUIDANCE.get(mapped_emotion, self.EMOTION_DIVINE_GUIDANCE["peaceful"])

    def get_trend_insight(self, trend: str) -> dict[str, str]:
        """
        Get sacred insight for a mood trend.

        Args:
            trend: One of "improving", "stable", "declining", "fluctuating"

        Returns:
            Dictionary with trend insight elements
        """
        return self.TREND_INSIGHTS.get(trend, self.TREND_INSIGHTS["stable"])

    def create_divine_mood_feedback(
        self,
        mood_score: int,
        emotion: str | None = None,
        notes: str | None = None
    ) -> dict[str, Any]:
        """
        Create comprehensive divine mood feedback.

        Args:
            mood_score: Mood score (1-10)
            emotion: Primary emotion (optional)
            notes: User notes (optional)

        Returns:
            Complete divine feedback structure
        """
        mood_response = self.get_sacred_mood_response(mood_score)

        feedback = {
            "score": mood_score,
            "sacred_response": mood_response["response"],
            "divine_message": mood_response["divine_message"],
            "sacred_practice": mood_response["practice"],
            "affirmation": mood_response["affirmation"],
        }

        if emotion:
            guidance = self.get_emotion_divine_guidance(emotion)
            feedback["emotion_guidance"] = guidance

        return feedback

    def generate_consciousness_touching_summary(
        self,
        mood_history: list[dict[str, Any]],
        period: str = "week"
    ) -> dict[str, str]:
        """
        Generate a consciousness-touching summary of mood patterns.

        Args:
            mood_history: List of mood entries
            period: Time period ("day", "week", "month")

        Returns:
            Sacred summary of mood journey
        """
        if not mood_history:
            return {
                "summary": "Each moment you choose to check in with yourself is a sacred act of self-awareness.",
                "insight": "Begin your journey of divine self-discovery. Every mood noted is a step toward wholeness.",
                "practice": "Set a gentle intention to pause and feel once a day. The divine meets you in these moments.",
            }

        # Calculate average
        scores = [m.get("score", 5) for m in mood_history if m.get("score")]
        avg_score = sum(scores) / len(scores) if scores else 5

        # Determine trend
        if len(scores) >= 3:
            first_half = sum(scores[:len(scores)//2]) / (len(scores)//2)
            second_half = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
            diff = second_half - first_half

            if diff > 0.5:
                trend = "improving"
            elif diff < -0.5:
                trend = "declining"
            elif max(scores) - min(scores) > 3:
                trend = "fluctuating"
            else:
                trend = "stable"
        else:
            trend = "stable"

        trend_insight = self.get_trend_insight(trend)
        mood_response = self.get_sacred_mood_response(round(avg_score))

        return {
            "summary": f"Over this {period}, your soul has journeyed through various landscapes of feeling. Your average vibration was {round(avg_score, 1)}/10.",
            "trend": trend,
            "insight": trend_insight["insight"],
            "encouragement": trend_insight["encouragement"],
            "practice": trend_insight["practice"],
            "divine_message": mood_response["divine_message"],
            "affirmation": mood_response["affirmation"],
        }


# Singleton instance
calming_mood_analytics = CalmingMoodAnalytics()
