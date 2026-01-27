"""
Psychology Patterns Service

Implements evidence-based psychology patterns:
- CBT: Cognitive restructuring, thought labeling, behavioral experiments
- ACT: Values clarification, acceptance-based coping, committed action
- Mindfulness: Breathing exercises, grounding techniques, observation
- Behavioral Activation: Small purposeful actions, progress tracking, habit structuring
"""

from typing import Any


class PsychologyPatterns:
    """Provides evidence-based psychological intervention patterns."""

    def __init__(self) -> None:
        """Initialize the psychology patterns service."""
        pass

    # ==================== CBT Patterns ====================

    def get_cognitive_restructuring_pattern(self, context: str) -> str:
        """
        Get cognitive restructuring suggestion.

        Args:
            context: User's context

        Returns:
            Cognitive restructuring guidance
        """
        patterns = [
            "Notice the thought that's troubling you. Ask yourself: 'What evidence supports this thought? What evidence contradicts it?'",
            "When you catch yourself in a negative thought, try this: 'Is there another way to look at this situation?'",
            "Challenge your thought: 'If a friend had this thought, what would I tell them? Can I offer myself that same perspective?'",
        ]

        # Simple selection based on context length
        import hashlib

        hash_val = int(hashlib.sha256(context.encode()).hexdigest(), 16)
        return patterns[hash_val % len(patterns)]

    def get_thought_labeling_technique(self, context: str) -> str:
        """
        Get thought labeling technique.

        Args:
            context: User's context

        Returns:
            Thought labeling guidance
        """
        return "Practice labeling your thoughts: When you notice a thought, simply note 'thinking' or name the type (e.g., 'worry thought,' 'self-criticism,' 'planning'). This creates distance from the thought."

    def get_behavioral_experiment_pattern(self, context: str) -> str:
        """
        Get behavioral experiment suggestion.

        Args:
            context: User's context

        Returns:
            Behavioral experiment guidance
        """
        return "Try a small behavioral experiment: What would happen if you did the opposite of what your anxiety tells you? Test it with a low-stakes situation first."

    # ==================== ACT Patterns ====================

    def get_values_clarification_exercise(self) -> dict[str, Any]:
        """
        Get values clarification exercise.

        Returns:
            Values exercise structure
        """
        return {
            "instruction": "Take a moment to identify what truly matters to you.",
            "questions": [
                "What do you want your life to be about?",
                "What kind of person do you want to be?",
                "What relationships matter most to you?",
            ],
            "reflection": "Notice if your current actions align with these values. Small steps toward your values create meaning.",
        }

    def get_acceptance_based_coping(self, context: str) -> str:
        """
        Get acceptance-based coping strategy.

        Args:
            context: User's context

        Returns:
            Acceptance guidance
        """
        strategies = [
            "You don't have to make difficult feelings go away to move forward. Can you make room for this feeling while still doing what matters?",
            "Practice saying: 'I notice I'm having the thought that...' This creates space between you and the thought.",
            "What if you didn't need to control this feeling, just observe it? Feelings are temporary visitors, not permanent states.",
        ]

        import hashlib

        hash_val = int(hashlib.sha256(context.encode()).hexdigest(), 16)
        return strategies[hash_val % len(strategies)]

    def get_committed_action_step(self, values_area: str | None = None) -> str:
        """
        Get committed action step aligned with values.

        Args:
            values_area: Specific values area (optional)

        Returns:
            Committed action guidance
        """
        return "Identify one small action you can take today that moves you toward what you care about. It doesn't have to be perfect—just meaningful."

    # ==================== Mindfulness Patterns ====================

    def get_breathing_exercise(self, technique: str = "4-2-6") -> dict[str, Any]:
        """
        Get breathing exercise instructions.

        Args:
            technique: Breathing technique type

        Returns:
            Breathing exercise details
        """
        exercises = {
            "4-2-6": {
                "name": "4-2-6 Breathing",
                "instruction": "Breathe in for 4 counts, hold for 2, breathe out for 6 counts.",
                "duration": "2-3 minutes",
                "benefit": "Activates the calming response, reduces anxiety",
            },
            "box": {
                "name": "Box Breathing",
                "instruction": "Breathe in for 4, hold for 4, breathe out for 4, hold for 4.",
                "duration": "3-5 minutes",
                "benefit": "Promotes focus and calm, used by Navy SEALs",
            },
            "5-5": {
                "name": "5-5 Breathing",
                "instruction": "Breathe in slowly for 5 counts, breathe out slowly for 5 counts.",
                "duration": "2-3 minutes",
                "benefit": "Simple and effective for stress reduction",
            },
        }

        return exercises.get(technique, exercises["4-2-6"])

    def get_grounding_technique(self, technique: str = "5-4-3-2-1") -> dict[str, Any]:
        """
        Get grounding technique instructions.

        Args:
            technique: Grounding technique type

        Returns:
            Grounding technique details
        """
        techniques = {
            "5-4-3-2-1": {
                "name": "5-4-3-2-1 Grounding",
                "instruction": "Notice 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.",
                "purpose": "Brings you to the present moment, interrupts anxiety spiral",
            },
            "body_scan": {
                "name": "Quick Body Scan",
                "instruction": "Starting at your head, notice body sensations moving down to your toes. Just observe without changing anything.",
                "purpose": "Reconnects you with physical presence, reduces rumination",
            },
            "physical_grounding": {
                "name": "Physical Grounding",
                "instruction": "Press your feet firmly into the floor. Notice the sensation. Place your hands on your thighs and feel the contact.",
                "purpose": "Immediate physical anchoring to the present",
            },
        }

        return techniques.get(technique, techniques["5-4-3-2-1"])

    def get_observation_without_judgment(self) -> str:
        """
        Get observation without judgment guidance.

        Returns:
            Observation guidance
        """
        return "Practice noticing your experience without labeling it as good or bad. Simply observe: 'This is what I'm feeling right now.' This is how you create space."

    # ==================== Behavioral Activation Patterns ====================

    def get_small_action_step(self, context: str) -> dict[str, Any]:
        """
        Generate small, purposeful action step.

        Args:
            context: User's context

        Returns:
            Action step with tracking guidance
        """
        return {
            "action": "Choose one specific task you can complete in the next hour that gives you a sense of accomplishment.",
            "examples": [
                "Make your bed",
                "Take a 5-minute walk",
                "Send one message to a friend",
                "Organize one small area",
            ],
            "tracking": "Notice how you feel before and after completing this action.",
        }

    def get_habit_structuring_guidance(self) -> dict[str, Any]:
        """
        Get habit structuring guidance.

        Returns:
            Habit structuring framework
        """
        return {
            "principle": "Start small and build consistency before adding complexity.",
            "steps": [
                "Choose ONE habit to build (not multiple)",
                "Make it incredibly small (2 minutes or less)",
                "Anchor it to something you already do",
                "Track completion (even just a checkmark)",
            ],
            "example": "After I pour my morning coffee (anchor), I will take 3 deep breaths (2-minute habit).",
        }

    def get_progress_tracking_suggestion(self) -> str:
        """
        Get progress tracking suggestion.

        Returns:
            Progress tracking guidance
        """
        return "Track your effort, not perfection. Each day you practice, even for a moment, mark it. This visual record builds momentum and self-trust."

    # ==================== Values Clarification ====================

    def get_values_identification_prompts(self) -> list[str]:
        """
        Get prompts for identifying personal values.

        Returns:
            List of values identification prompts
        """
        return [
            "If you knew you couldn't fail, what would you do with your life? What values does that reveal?",
            "What qualities do you admire most in others? These often reflect your values.",
            "When have you felt most fulfilled? What values were you expressing?",
            "What do you want people to remember about you? What values matter most?",
            "What causes or issues do you care deeply about? What values drive that care?",
        ]

    def connect_action_to_values(self, action: str, value: str) -> str:
        """
        Connect a specific action to a personal value.

        Args:
            action: Proposed action
            value: Personal value

        Returns:
            Connection statement
        """
        return f"Taking this action connects to what matters to you. When you {action}, you're living in alignment with your value of {value}."

    def get_service_altruism_suggestion(self) -> dict[str, Any]:
        """
        Get service/altruism suggestion.

        Returns:
            Service suggestion structure
        """
        return {
            "principle": "Helping others often helps us. Service creates connection and meaning.",
            "small_acts": [
                "Send a supportive message to someone",
                "Hold the door for someone",
                "Share something helpful you learned",
                "Listen fully to someone without interrupting",
            ],
            "reflection": "Notice how small acts of kindness affect both you and others.",
        }

    # ==================== Pattern Selection ====================

    def select_pattern_for_context(self, user_message: str, domain: str | None = None) -> dict[str, Any]:
        """
        Select appropriate psychological pattern based on context.

        Args:
            user_message: User's message
            domain: Psychological domain

        Returns:
            Selected pattern with type and content
        """
        message_lower = user_message.lower()

        # Detect pattern needs based on keywords
        if any(word in message_lower for word in ["thought", "thinking", "believe", "assume"]):
            return {
                "type": "CBT",
                "pattern": "cognitive_restructuring",
                "content": self.get_cognitive_restructuring_pattern(user_message),
            }

        if any(word in message_lower for word in ["anxious", "panic", "overwhelm", "racing"]):
            return {
                "type": "Mindfulness",
                "pattern": "breathing_exercise",
                "content": self.get_breathing_exercise("4-2-6"),
            }

        if any(word in message_lower for word in ["stuck", "unmotivated", "procrastinate"]):
            return {
                "type": "Behavioral Activation",
                "pattern": "small_action",
                "content": self.get_small_action_step(user_message),
            }

        if any(word in message_lower for word in ["purpose", "meaning", "why", "matter"]):
            return {
                "type": "ACT",
                "pattern": "values_clarification",
                "content": self.get_values_clarification_exercise(),
            }

        # Default: mindfulness observation
        return {
            "type": "Mindfulness",
            "pattern": "observation",
            "content": self.get_observation_without_judgment(),
        }
