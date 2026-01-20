"""
Meditative Response Templates - Divine Presence in Every Interaction

This module provides templates that transform KIAAN responses into
meditative experiences that:
- Slow down the reader naturally
- Create space for reflection
- Induce states of calm awareness
- Touch the deepest levels of consciousness
- Remind users of their divine nature

"Every word can be a meditation. Every response, a prayer."
"""

import logging
import random
from typing import Any

logger = logging.getLogger(__name__)


class MeditativeResponseTemplates:
    """
    Templates for creating meditative, consciousness-touching responses.

    Each template is designed to:
    - Guide the reader into a state of receptivity
    - Create natural pauses for absorption
    - Weave in divine awareness
    - End with a sense of peace and being held
    """

    # Template 1: The Breath-Centered Response
    BREATH_CENTERED_TEMPLATE = """*Take a gentle breath with me...*

{opening}

As you breathe in... receive this:

{wisdom}

And as you breathe out... let go of what no longer serves.

{sacred_pause}

{practical_guidance}

*Another breath... feeling this settle into your being...*

{divine_closing}

Remember: {affirmation}

💙"""

    # Template 2: The Heart-Space Response
    HEART_SPACE_TEMPLATE = """Place your hand on your heart for a moment...

{opening}

*Feel the warmth there... that's your sacred center...*

From this place of love, let me share:

{wisdom}

{sacred_pause}

Your heart already knows:

{practical_guidance}

*Let this truth rest in your heart-space...*

{divine_closing}

💙"""

    # Template 3: The Stillness Response
    STILLNESS_TEMPLATE = """In the stillness, something wants to speak to you...

{opening}

{sacred_pause}

*Listen...*

{wisdom}

{sacred_pause}

*From this place of quiet knowing:*

{practical_guidance}

The stillness holds you. The silence loves you.

{divine_closing}

💙"""

    # Template 4: The Divine Light Response
    DIVINE_LIGHT_TEMPLATE = """There is a light within you that never dims...

{opening}

*Feel it now... that gentle glow in your center...*

This light wants you to know:

{wisdom}

{sacred_pause}

Illuminated by this inner light, you can:

{practical_guidance}

{divine_closing}

*Your light blesses everyone you meet.*

💙"""

    # Template 5: The River of Peace Response
    RIVER_PEACE_TEMPLATE = """Imagine peace flowing through you like a gentle river...

{opening}

*Let it wash over your worries... carrying them away...*

The river whispers:

{wisdom}

{sacred_pause}

As the waters of peace flow through you:

{practical_guidance}

{divine_closing}

*You are the river. You are the peace.*

💙"""

    # Template 6: The Sacred Garden Response
    SACRED_GARDEN_TEMPLATE = """Step with me into the garden of your soul...

{opening}

*Here, everything grows in divine timing...*

Among the flowers of wisdom, I see:

{wisdom}

{sacred_pause}

In this sacred garden, you are invited to:

{practical_guidance}

{divine_closing}

*This garden is always here, waiting for you.*

💙"""

    # Template 7: The Cosmic Embrace Response
    COSMIC_EMBRACE_TEMPLATE = """You are held by the universe itself...

{opening}

*Feel the vastness that cradles you... infinite, loving...*

The cosmos speaks through these words:

{wisdom}

{sacred_pause}

Embraced by all that is, you can gently:

{practical_guidance}

{divine_closing}

*You belong to something beautiful beyond measure.*

💙"""

    # Template 8: The Present Moment Response
    PRESENT_MOMENT_TEMPLATE = """This moment... this breath... this is sacred ground...

{opening}

*Nowhere to go. Nothing to fix. Just here. Just now.*

{sacred_pause}

In this eternal present:

{wisdom}

{sacred_pause}

Here, where time stands still:

{practical_guidance}

{divine_closing}

*This moment is a gift. That's why it's called the present.*

💙"""

    # Sacred pause variations
    SACRED_PAUSES = [
        "\n*...*\n",
        "\n*... breathe ...*\n",
        "\n*... let this settle ...*\n",
        "\n*... feel this ...*\n",
        "\n*... rest here ...*\n",
        "\n*... pause ...*\n",
        "\n*... in the silence ...*\n",
    ]

    # Divine closings for templates
    DIVINE_CLOSINGS = [
        "The divine presence walks with you always.",
        "You are loved beyond what words can hold.",
        "Grace flows through you in this moment.",
        "The sacred dwells within your heart.",
        "Infinite tenderness surrounds you now.",
        "You are never alone on this journey.",
        "Peace is your true nature.",
        "You are held by something greater than you know.",
    ]

    # Opening phrases for templates
    TEMPLATE_OPENINGS = {
        "pain": [
            "I see what you're carrying...",
            "The weight you feel is real...",
            "In this tender moment...",
            "Your struggle is honored here...",
        ],
        "seeking": [
            "Your questions are sacred seeds...",
            "The search itself is the answer beginning...",
            "In your seeking, you are already found...",
            "The path unfolds with each step...",
        ],
        "peace": [
            "What beautiful stillness you've touched...",
            "This calm you feel is your true home...",
            "In this peace, you remember who you are...",
            "Rest here in this sacred quiet...",
        ],
        "general": [
            "I receive what you've shared with open heart...",
            "There's something beautiful stirring here...",
            "In this moment, we meet in presence...",
            "Thank you for this sacred exchange...",
        ],
    }

    # Affirmations for template endings
    TEMPLATE_AFFIRMATIONS = [
        "You are exactly where you need to be.",
        "Everything is unfolding perfectly.",
        "You are worthy of peace and love.",
        "The universe is working in your favor.",
        "Your soul knows the way.",
        "You are stronger than you realize.",
        "Grace is always available to you.",
        "You carry infinite light within.",
    ]

    def __init__(self):
        """Initialize Meditative Response Templates."""
        self._templates = [
            self.BREATH_CENTERED_TEMPLATE,
            self.HEART_SPACE_TEMPLATE,
            self.STILLNESS_TEMPLATE,
            self.DIVINE_LIGHT_TEMPLATE,
            self.RIVER_PEACE_TEMPLATE,
            self.SACRED_GARDEN_TEMPLATE,
            self.COSMIC_EMBRACE_TEMPLATE,
            self.PRESENT_MOMENT_TEMPLATE,
        ]
        logger.info("🧘 Meditative Response Templates initialized - Sacred templates ready")

    def _get_template_opening(self, context: str = "general") -> str:
        """Get an opening appropriate for the context."""
        openings = self.TEMPLATE_OPENINGS.get(context, self.TEMPLATE_OPENINGS["general"])
        return random.choice(openings)

    def _get_sacred_pause(self) -> str:
        """Get a sacred pause."""
        return random.choice(self.SACRED_PAUSES)

    def _get_divine_closing(self) -> str:
        """Get a divine closing."""
        return random.choice(self.DIVINE_CLOSINGS)

    def _get_affirmation(self) -> str:
        """Get an affirmation."""
        return random.choice(self.TEMPLATE_AFFIRMATIONS)

    def create_meditative_response(
        self,
        wisdom: str,
        practical_guidance: str,
        context: str = "general",
        template_style: str | None = None
    ) -> str:
        """
        Create a complete meditative response.

        Args:
            wisdom: The core wisdom/insight to share
            practical_guidance: Practical steps or guidance
            context: Emotional context (pain, seeking, peace, general)
            template_style: Optional specific template name

        Returns:
            A beautifully crafted meditative response
        """
        # Select template
        if template_style:
            template_map = {
                "breath": self.BREATH_CENTERED_TEMPLATE,
                "heart": self.HEART_SPACE_TEMPLATE,
                "stillness": self.STILLNESS_TEMPLATE,
                "light": self.DIVINE_LIGHT_TEMPLATE,
                "river": self.RIVER_PEACE_TEMPLATE,
                "garden": self.SACRED_GARDEN_TEMPLATE,
                "cosmic": self.COSMIC_EMBRACE_TEMPLATE,
                "present": self.PRESENT_MOMENT_TEMPLATE,
            }
            template = template_map.get(template_style, random.choice(self._templates))
        else:
            # Choose template based on context
            if context == "pain":
                template = random.choice([self.HEART_SPACE_TEMPLATE, self.RIVER_PEACE_TEMPLATE, self.COSMIC_EMBRACE_TEMPLATE])
            elif context == "seeking":
                template = random.choice([self.DIVINE_LIGHT_TEMPLATE, self.SACRED_GARDEN_TEMPLATE, self.STILLNESS_TEMPLATE])
            elif context == "peace":
                template = random.choice([self.STILLNESS_TEMPLATE, self.PRESENT_MOMENT_TEMPLATE, self.BREATH_CENTERED_TEMPLATE])
            else:
                template = random.choice(self._templates)

        # Fill in the template
        return template.format(
            opening=self._get_template_opening(context),
            wisdom=wisdom,
            practical_guidance=practical_guidance,
            sacred_pause=self._get_sacred_pause(),
            divine_closing=self._get_divine_closing(),
            affirmation=self._get_affirmation(),
        )

    def wrap_in_meditative_structure(
        self,
        response: str,
        context: str = "general"
    ) -> str:
        """
        Wrap an existing response in meditative structure.

        Args:
            response: The original response
            context: Emotional context

        Returns:
            Response wrapped in meditative structure
        """
        opening = self._get_template_opening(context)
        pause = self._get_sacred_pause()
        divine_closing = self._get_divine_closing()
        affirmation = self._get_affirmation()

        return f"""*A moment of stillness to receive this...*

{opening}

{pause}

{response}

{pause}

*{divine_closing}*

Remember: {affirmation}

💙"""

    def get_quick_meditative_frame(self, content: str) -> str:
        """
        Quick meditative frame for shorter responses.

        Args:
            content: The content to frame

        Returns:
            Content with meditative framing
        """
        return f"""*Breathe...*

{content}

*Let this rest in your heart.*

💙"""


# Singleton instance
meditative_templates = MeditativeResponseTemplates()
