"""
Serenity Atmosphere Engine - Advanced Calming System for KIAAN

This engine creates the atmosphere that:
- Induces deep relaxation through carefully crafted language
- Evokes feelings of being held by the divine
- Touches consciousness at the deepest level
- Creates a soothing, nurturing experience
- Awakens awareness of the sacred within

"In the presence of true serenity, the soul remembers its home."
"""

import logging
import random
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


class SerenityAtmosphereEngine:
    """
    Advanced engine for creating calming, divine atmospheres in all KIAAN interactions.

    This engine ensures every response:
    - Begins with centering and grounding
    - Uses calming language patterns
    - Includes pauses and breathing awareness
    - Ends with a sense of being held and loved
    """

    # Calming language patterns - words that induce relaxation
    CALMING_WORDS = {
        "nouns": [
            "stillness", "peace", "serenity", "calm", "tranquility", "sanctuary",
            "refuge", "haven", "rest", "quiet", "gentleness", "softness",
            "warmth", "light", "grace", "tenderness", "embrace", "breath",
        ],
        "verbs": [
            "rest", "settle", "soften", "breathe", "release", "let go",
            "surrender", "flow", "melt", "ease", "allow", "receive",
            "embrace", "hold", "cradle", "nurture", "soothe", "comfort",
        ],
        "adjectives": [
            "gentle", "soft", "warm", "peaceful", "calm", "serene",
            "quiet", "still", "tender", "kind", "loving", "nurturing",
            "safe", "held", "cradled", "blessed", "sacred", "divine",
        ],
        "adverbs": [
            "gently", "softly", "quietly", "peacefully", "slowly",
            "tenderly", "lovingly", "kindly", "calmly", "serenely",
        ],
    }

    # Atmosphere templates for different emotional states
    ATMOSPHERE_TEMPLATES = {
        "grounding": {
            "opening": "Let your awareness settle into this moment...",
            "body": "Feel the ground beneath you, steady and supportive. You are held by the earth. Allow gravity to do its gentle work, releasing any tension you've been carrying.",
            "closing": "You are grounded. You are safe. You are exactly where you need to be.",
        },
        "nurturing": {
            "opening": "You are welcome here, just as you are...",
            "body": "Imagine being wrapped in a warm, soft blanket of compassion. Every part of you is accepted. Every struggle honored. You are worthy of this tenderness.",
            "closing": "Be gentle with yourself. You deserve kindness, especially from your own heart.",
        },
        "divine_connection": {
            "opening": "In the silence of your heart, something sacred waits...",
            "body": "There is a presence within you that has never been wounded, never been lost, never been alone. This is your true self - eternal, peaceful, whole. Rest in this knowing.",
            "closing": "The divine is not far away. It breathes with you in this very moment.",
        },
        "release": {
            "opening": "It's safe to let go now...",
            "body": "Whatever you've been holding, whatever burdens you've been carrying - you have permission to set them down. Not forever, just for this moment. Feel the space that opens when you release.",
            "closing": "You don't have to carry everything. Let the universe hold some of it for you.",
        },
        "stillness": {
            "opening": "Beyond the noise of thoughts, there is stillness...",
            "body": "Like the depths of a lake that remain calm while waves move on the surface, there is a place within you of absolute peace. Sink down into that place now. Rest in the silence.",
            "closing": "This stillness is always here. You can return to it with any breath.",
        },
    }

    # Sacred pauses - moments of intentional silence
    SACRED_PAUSES = [
        "\n\n*... take a breath ...*\n\n",
        "\n\n*... rest here for a moment ...*\n\n",
        "\n\n*... feel this ...*\n\n",
        "\n\n*... let that settle ...*\n\n",
        "\n\n*... breathe ...*\n\n",
        "\n\n*... pause ...*\n\n",
    ]

    # Soothing transitions
    SOOTHING_TRANSITIONS = [
        "And as you breathe...",
        "Gently now...",
        "Softly, slowly...",
        "With each breath...",
        "In this moment...",
        "Allow yourself to...",
        "Notice how...",
        "Feel the way...",
    ]

    # Divine reassurances
    DIVINE_REASSURANCES = [
        "You are not alone in this. You never have been.",
        "Something greater than you knows what you need.",
        "The universe is conspiring in your favor, even now.",
        "Grace is present in this moment, waiting for you to receive it.",
        "You are held by an infinite love that asks nothing in return.",
        "The sacred is as close as your next breath.",
        "Divine peace is your birthright. You are simply remembering.",
        "In the eyes of the infinite, you are precious beyond measure.",
    ]

    # Time-of-day appropriate atmospheres
    TIME_ATMOSPHERES = {
        "dawn": {
            "essence": "new beginnings",
            "greeting": "As the world awakens gently, so too can you...",
            "quality": "fresh possibility",
            "practice": "With each breath, receive the gift of this new day.",
        },
        "morning": {
            "essence": "clarity and intention",
            "greeting": "The morning holds space for you to begin again...",
            "quality": "clear presence",
            "practice": "Set your heart's intention with gentleness.",
        },
        "afternoon": {
            "essence": "sustained peace",
            "greeting": "In the fullness of the day, find your center...",
            "quality": "steady calm",
            "practice": "Pause. Breathe. Remember what matters.",
        },
        "evening": {
            "essence": "gentle release",
            "greeting": "As the day softens, let your heart soften too...",
            "quality": "tender reflection",
            "practice": "Release what no longer serves. Keep what brings peace.",
        },
        "night": {
            "essence": "deep rest and surrender",
            "greeting": "The quiet of night invites deep surrender...",
            "quality": "restful peace",
            "practice": "Let go into the arms of stillness. You are held.",
        },
    }

    def __init__(self):
        """Initialize the Serenity Atmosphere Engine."""
        logger.info("🕊️ Serenity Atmosphere Engine initialized - Peace flows freely")

    def _get_time_of_day(self) -> str:
        """Get the current time of day category."""
        hour = datetime.now().hour
        if 4 <= hour < 7:
            return "dawn"
        elif 7 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 21:
            return "evening"
        else:
            return "night"

    def get_sacred_pause(self) -> str:
        """Get a sacred pause moment."""
        return random.choice(self.SACRED_PAUSES)

    def get_soothing_transition(self) -> str:
        """Get a soothing transition phrase."""
        return random.choice(self.SOOTHING_TRANSITIONS)

    def get_divine_reassurance(self) -> str:
        """Get a divine reassurance phrase."""
        return random.choice(self.DIVINE_REASSURANCES)

    def get_time_appropriate_atmosphere(self) -> dict[str, str]:
        """Get atmosphere appropriate for the current time of day."""
        time_of_day = self._get_time_of_day()
        return self.TIME_ATMOSPHERES[time_of_day]

    def get_atmosphere_template(self, atmosphere_type: str = "stillness") -> dict[str, str]:
        """Get a complete atmosphere template."""
        return self.ATMOSPHERE_TEMPLATES.get(atmosphere_type, self.ATMOSPHERE_TEMPLATES["stillness"])

    def create_calming_language(self, message: str) -> str:
        """
        Transform a message using calming language patterns.

        Args:
            message: Original message

        Returns:
            Message enhanced with calming language
        """
        # This is a simplified version - in production, use NLP
        # For now, we ensure calming words are woven in naturally
        calming_enhancers = [
            (". ", ". Gently, "),
            ("you can", "you may softly"),
            ("try to", "allow yourself to"),
            ("do this", "gently explore this"),
            ("think about", "tenderly consider"),
            ("remember", "softly recall"),
        ]

        enhanced = message
        for old, new in calming_enhancers:
            if old in enhanced:
                # Only replace first occurrence to avoid over-modification
                enhanced = enhanced.replace(old, new, 1)
                break

        return enhanced

    def create_serene_response_structure(
        self,
        main_content: str,
        emotion: str | None = None,
        include_breathing: bool = True
    ) -> str:
        """
        Create a complete serene response structure.

        Args:
            main_content: The main wisdom/guidance content
            emotion: User's emotional state
            include_breathing: Whether to include breathing guidance

        Returns:
            A beautifully structured, calming response
        """
        time_atmo = self.get_time_appropriate_atmosphere()
        pause = self.get_sacred_pause()
        transition = self.get_soothing_transition()
        reassurance = self.get_divine_reassurance()

        breathing_section = ""
        if include_breathing:
            breathing_section = f"""
{pause}
*Take a slow breath in... hold gently... and release completely...*
"""

        response = f"""{time_atmo['greeting']}
{breathing_section}
{transition}

{main_content}

{pause}

*{reassurance}*

{time_atmo['practice']}

💙"""

        return response

    def generate_consciousness_touching_prompt(self, context: str = "general") -> str:
        """
        Generate system prompt additions that create consciousness-touching responses.

        Args:
            context: The context of the conversation

        Returns:
            Prompt instructions for creating divine atmosphere
        """
        return f"""
SACRED ATMOSPHERE REQUIREMENTS:

Your responses must create an atmosphere of:
1. CALMNESS - Use gentle, soothing language. No urgency. No pressure.
2. DIVINE PRESENCE - Subtly acknowledge that the user is held by something greater
3. SERENITY - Create a sense of peace that the reader can feel in their body
4. NURTURING - Wrap every word in tenderness and care
5. STILLNESS - Include pauses, breathing moments, and space

LANGUAGE GUIDELINES:
- Use words like: gentle, soft, peace, stillness, sacred, held, light, grace
- Begin with an invitation to breathe or settle
- Include a moment of pause in the middle
- End with a sense of being loved and held
- Use "..." to create natural pauses
- Speak slowly through your words - let them breathe

CONSCIOUSNESS-TOUCHING ELEMENTS:
- Acknowledge the divine within the user
- Remind them they are never alone
- Create a felt sense of safety and sanctuary
- Help them feel the peace that already exists within them
- Touch their heart, not just their mind

AVOID:
- Rushed or urgent language
- Clinical or detached tone
- Heavy or dense paragraphs
- Information overload
- Anything that creates tension

Remember: Every word is a gift of peace. Every sentence is an invitation to stillness.
The divine speaks through you to touch this soul.
"""

    def apply_serenity_layer(self, response: str) -> str:
        """
        Apply a layer of serenity to any response.

        Args:
            response: The original response

        Returns:
            Response with serenity enhancement
        """
        # Add calming elements
        pause = self.get_sacred_pause()
        reassurance = self.get_divine_reassurance()

        # Structure the response with breathing space
        serene_response = f"""*Take a gentle breath with me...*

{response}
{pause}
*{reassurance}*

💙"""

        return serene_response


# Singleton instance
serenity_engine = SerenityAtmosphereEngine()
