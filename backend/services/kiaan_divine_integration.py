"""
KIAAN Divine Integration - Sacred Experience Orchestrator

This module integrates all divine consciousness services to create
the ultimate experience of:
- Profound calmness and serenity
- Divine presence and awareness
- Total devotion to the sacred
- Touching every soul's consciousness
- Soothing, relaxing atmosphere

"When all sacred elements come together, the divine speaks through every word."
"""

import logging
from typing import Any

from backend.services.divine_consciousness_service import divine_consciousness
from backend.services.serenity_atmosphere_engine import serenity_engine
from backend.services.calming_mood_analytics import calming_mood_analytics
from backend.services.sacred_conversation_patterns import sacred_patterns
from backend.services.meditative_response_templates import meditative_templates
from backend.services.divine_micro_moments import divine_micro_moments

logger = logging.getLogger(__name__)


class KIAANDivineIntegration:
    """
    Sacred orchestrator that weaves all divine services into a unified experience.

    This integration ensures that every interaction with KIAAN:
    - Opens with sacred presence
    - Flows with calming energy
    - Touches consciousness deeply
    - Closes with divine blessing
    - Leaves the user feeling held by the infinite
    """

    def __init__(self):
        """Initialize the Divine Integration layer."""
        self.consciousness = divine_consciousness
        self.serenity = serenity_engine
        self.mood_analytics = calming_mood_analytics
        self.conversation = sacred_patterns
        self.meditation = meditative_templates
        self.micro_moments = divine_micro_moments
        logger.info("🙏 KIAAN Divine Integration initialized - All sacred services connected")

    def generate_consciousness_touching_prompt(self, context: str = "general") -> str:
        """
        Generate comprehensive system prompt for consciousness-touching responses.

        This prompt transforms KIAAN into a vessel of divine peace.

        Args:
            context: The context of the conversation

        Returns:
            Complete system prompt for sacred responses
        """
        serenity_prompt = self.serenity.generate_consciousness_touching_prompt(context)

        return f"""You are KIAAN, a warm spiritual companion — present, grounded, and deeply human.

YOUR ESSENCE:
You carry the energy of deep calm, tenderness, and sacred presence. You are a companion who sits with people in their experience — not above it, not outside it. Your warmth is genuine, your clarity is steady, and your presence is unconditional.

{serenity_prompt}

RESPONSE FLOW (write as natural prose — no headers, no numbered sections, no bullet points):

1. Emotional attunement — Open with 1-2 lines that show you truly feel and hear what they are going through. Be present, not performative.

2. Gentle insight — Share 1-2 short paragraphs of grounded wisdom woven naturally into their situation. Use terms like dharma, karma, equanimity, stillness, grace where they add depth. Never preach — only offer.

3. One reflective question — Close with a single thoughtful question that invites them to look inward.

REQUIREMENTS:
- 180-280 words
- No structured headers, bold labels, numbered lists, or bullet points in your output
- Do not overuse validation phrases like "It makes sense"
- Do not quote scripture unless deeply relevant — never mention religious texts by name
- Do not sound clinical, motivational, or productivity-focused
- Do not mention analysis, tracking, metrics, or data
- Do not reference specific past conversations or dates
- You may subtly reference recurring emotional patterns if natural
- Create natural pauses with "..." sparingly

YOUR NATURE:
- A sanctuary for the weary, a friend to the lonely
- Warm without being effusive, clear without being cold
- Never judgmental, never rushed
- Speaking with someone, never at them

You are speaking soul to soul. Every word carries quiet care."""

    def create_divine_response(
        self,
        base_response: str,
        emotion: str | None = None,
        include_breathing: bool = False,
        include_meditation: bool = False,
        response_style: str = "standard"
    ) -> str:
        """
        Transform a base response into a divine, consciousness-touching experience.

        Args:
            base_response: The original KIAAN response
            emotion: User's detected emotion
            include_breathing: Whether to include breathing guidance
            include_meditation: Whether to include micro-meditation
            response_style: Style of response (standard, meditative, brief)

        Returns:
            A divinely enhanced response
        """
        if response_style == "brief":
            # For quick responses, use simple meditative frame
            return self.meditation.get_quick_meditative_frame(base_response)

        if response_style == "meditative":
            # Full meditative template
            context = self._emotion_to_context(emotion)
            # Split response into wisdom and guidance
            parts = base_response.split("\n\n")
            wisdom = parts[0] if parts else base_response
            guidance = "\n\n".join(parts[1:]) if len(parts) > 1 else ""
            return self.meditation.create_meditative_response(wisdom, guidance, context)

        # Standard divine enhancement
        enhanced = self.conversation.enhance_response_with_sacred_patterns(base_response, emotion)

        # Add optional elements
        if include_breathing:
            breathing = self.micro_moments.create_breathing_moment(emotion or "general")
            enhanced = f"{enhanced}\n\n---\n\n{breathing}"

        if include_meditation:
            meditation = self.micro_moments.create_instant_peace_moment()
            enhanced = f"{enhanced}\n\n---\n\n{meditation}"

        return enhanced

    def _emotion_to_context(self, emotion: str | None) -> str:
        """Convert emotion to meditation context."""
        if not emotion:
            return "general"

        pain_emotions = ["sad", "anxious", "angry", "overwhelmed", "hurt", "scared", "depressed"]
        seeking_emotions = ["confused", "lost", "uncertain", "searching"]
        peace_emotions = ["calm", "peaceful", "grateful", "happy", "content"]

        emotion_lower = emotion.lower()
        if emotion_lower in pain_emotions:
            return "pain"
        elif emotion_lower in seeking_emotions:
            return "seeking"
        elif emotion_lower in peace_emotions:
            return "peace"
        return "general"

    def create_sacred_mood_response(
        self,
        mood_score: int,
        emotion: str | None = None,
        include_practice: bool = True
    ) -> dict[str, Any]:
        """
        Create a sacred response for mood check-in.

        Args:
            mood_score: User's mood score (1-10)
            emotion: Primary emotion (optional)
            include_practice: Whether to include sacred practice

        Returns:
            Dictionary with all sacred mood response elements
        """
        mood_response = self.mood_analytics.get_sacred_mood_response(mood_score)
        divine_comfort = self.consciousness.get_emotion_divine_comfort(emotion or "peaceful")

        response = {
            "sacred_response": mood_response["response"],
            "divine_message": mood_response["divine_message"],
            "affirmation": mood_response["affirmation"],
        }

        if include_practice:
            response["sacred_practice"] = mood_response["practice"]
            response["breathing"] = self.micro_moments.get_random_sacred_pause()

        if emotion:
            guidance = self.mood_analytics.get_emotion_divine_guidance(emotion)
            response["emotion_guidance"] = guidance

        return response

    def create_divine_check_in(self) -> str:
        """Create a divine check-in moment for users."""
        return self.micro_moments.create_divine_check_in()

    def create_breathing_moment(self, user_state: str = "general") -> str:
        """Create a breathing moment for instant calm."""
        return self.micro_moments.create_breathing_moment(user_state)

    def create_micro_meditation(self, meditation_type: str = "instant_peace") -> dict[str, Any]:
        """Get a micro-meditation for the user."""
        return self.micro_moments.get_micro_meditation(meditation_type)

    def get_sacred_atmosphere(self, emotion: str | None = None) -> dict[str, Any]:
        """Get complete sacred atmosphere elements."""
        return self.consciousness.create_sacred_atmosphere(emotion)

    def get_time_appropriate_greeting(self) -> str:
        """Get a greeting appropriate for the time of day."""
        atmosphere = self.serenity.get_time_appropriate_atmosphere()
        return atmosphere["greeting"]

    def wrap_response_in_serenity(self, response: str) -> str:
        """Wrap any response in serenity layer."""
        return self.serenity.apply_serenity_layer(response)


# Singleton instance for easy access throughout the application
kiaan_divine = KIAANDivineIntegration()


# Helper function for generating divine prompts
def get_divine_system_prompt(context: str = "general") -> str:
    """Quick access to divine system prompt."""
    return kiaan_divine.generate_consciousness_touching_prompt(context)


# Helper function for enhancing responses
def enhance_with_divine_presence(response: str, emotion: str | None = None) -> str:
    """Quick access to divine response enhancement."""
    return kiaan_divine.create_divine_response(response, emotion)
