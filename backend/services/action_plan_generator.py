"""
Action Plan Generator Service

Generates practical, actionable steps (2-4 items) for users based on their concerns.
Focuses on what's in user's control: effort, attention, choices.
"""

from typing import Any


class ActionPlanGenerator:
    """Generates practical action plans for mental wellness support."""

    def __init__(self) -> None:
        """Initialize the action plan generator."""
        pass

    def generate_action_steps(
        self,
        user_message: str,
        domain: str | None = None,
        max_steps: int = 4,
    ) -> list[dict[str, Any]]:
        """
        Generate 2-4 practical action steps based on user message and domain.

        Args:
            user_message: User's input message
            domain: Psychological domain (optional)
            max_steps: Maximum number of steps (default 4)

        Returns:
            List of action step dictionaries with 'text' and 'type' keys
        """
        steps = []

        # Domain-specific action plans
        domain_actions = {
            "self_understanding": [
                {
                    "text": "Take 2 minutes to write down what you're noticing about your thoughts right now, without judgment.",
                    "type": "reflection",
                },
                {
                    "text": "Ask yourself: 'What am I feeling, and what might have triggered it?'",
                    "type": "inquiry",
                },
            ],
            "action_discipline": [
                {
                    "text": "Choose one small task you can complete in the next hour that aligns with your values.",
                    "type": "behavioral",
                },
                {
                    "text": "Set a specific time today to take this action, even if just for 10 minutes.",
                    "type": "behavioral",
                },
            ],
            "equanimity": [
                {
                    "text": "Notice when your mind judges a situation as 'good' or 'bad' - can you observe it neutrally?",
                    "type": "mindfulness",
                },
                {
                    "text": "Practice responding to the next challenge with: 'This is what's happening right now.'",
                    "type": "reframing",
                },
            ],
            "emotional_regulation": [
                {
                    "text": "When you notice strong emotions, pause and name what you're feeling out loud or in writing.",
                    "type": "emotion_labeling",
                },
                {
                    "text": "Try the 4-2-6 breathing pattern: breathe in for 4 counts, hold for 2, breathe out for 6.",
                    "type": "grounding",
                },
            ],
            "meditation_attention": [
                {
                    "text": "Set a timer for 3 minutes and focus on your breath, gently returning when your mind wanders.",
                    "type": "mindfulness",
                },
                {
                    "text": "Practice the 5-4-3-2-1 grounding: notice 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.",
                    "type": "grounding",
                },
            ],
            "resilience": [
                {
                    "text": "Identify one small thing you did today that required effort, and acknowledge yourself for it.",
                    "type": "reflection",
                },
                {
                    "text": "When facing a setback, ask: 'What's one thing I can control in this situation?'",
                    "type": "inquiry",
                },
            ],
            "values_service": [
                {
                    "text": "Write down 3 things that matter most to you - what gives your life meaning?",
                    "type": "values",
                },
                {
                    "text": "Choose one small action today that connects to what you truly care about.",
                    "type": "behavioral",
                },
            ],
        }

        # Fallback general action steps
        general_actions = [
            {
                "text": "Take 3 slow, deep breaths and notice how your body feels right now.",
                "type": "grounding",
            },
            {
                "text": "Write down one thought that's bothering you and ask: 'Is this thought helpful right now?'",
                "type": "cognitive",
            },
            {
                "text": "Identify one small step you can take today toward what matters to you.",
                "type": "behavioral",
            },
            {
                "text": "Practice self-compassion: What would you say to a friend in this situation?",
                "type": "reflection",
            },
        ]

        # Select domain-specific actions if domain provided
        if domain and domain in domain_actions:
            steps = domain_actions[domain][:max_steps]
        else:
            # Use general actions and select based on message content
            steps = self._select_contextual_actions(user_message, general_actions, max_steps)

        # Ensure we have 2-4 steps
        if len(steps) < 2:
            steps.extend(general_actions[: max(2 - len(steps), 0)])

        return steps[:max_steps]

    def _select_contextual_actions(
        self,
        message: str,
        actions: list[dict[str, Any]],
        count: int,
    ) -> list[dict[str, Any]]:
        """
        Select actions based on message content.

        Args:
            message: User's message
            actions: Available actions
            count: Number of actions to select

        Returns:
            Selected actions
        """
        message_lower = message.lower()

        # Prioritize actions based on keywords in message
        selected = []

        # Check for anxiety/worry keywords
        if any(word in message_lower for word in ["anxious", "worry", "stress", "overwhelm"]):
            for action in actions:
                if action["type"] in ["grounding", "cognitive"]:
                    selected.append(action)
                    if len(selected) >= count:
                        return selected

        # Check for motivation/action keywords
        if any(word in message_lower for word in ["stuck", "unmotivated", "procrastinate"]):
            for action in actions:
                if action["type"] == "behavioral":
                    selected.append(action)
                    if len(selected) >= count:
                        return selected

        # Default: return first N actions
        return actions[:count]

    def format_action_steps_as_text(self, steps: list[dict[str, Any]]) -> str:
        """
        Format action steps as numbered text.

        Args:
            steps: List of action step dictionaries

        Returns:
            Formatted string with numbered steps
        """
        if not steps:
            return ""

        formatted = "\n\n**Here are some practical steps:**\n"
        for i, step in enumerate(steps, 1):
            formatted += f"{i}. {step['text']}\n"

        return formatted.strip()
