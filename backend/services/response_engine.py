"""
Core Response Engine for MindVibe AI Mental-Wellness Coach

Implements the 6-step response framework:
1. Empathic validation
2. Structured action plan (2-4 steps)
3. Micro-practice suggestions (breathing, grounding, reflection)
4. Reflective questions for self-inquiry
5. Encouragement & closure (effort/self-trust focused)
6. Word count enforcement (120-250 words)
"""

from typing import Any

from backend.services.action_plan_generator import ActionPlanGenerator


class ResponseEngine:
    """Core response engine implementing the 6-step framework."""

    # Word count constraints
    MIN_WORDS = 120
    MAX_WORDS = 250

    def __init__(self) -> None:
        """Initialize the response engine."""
        self.action_generator = ActionPlanGenerator()

    def generate_response(
        self,
        user_message: str,
        domain: str | None = None,
        verses: list[dict] | None = None,
    ) -> dict[str, Any]:
        """
        Generate a complete response using the 6-step framework.

        Args:
            user_message: User's input message
            domain: Psychological domain (optional)
            verses: Relevant wisdom verses (optional)

        Returns:
            Dictionary with 'response' text and metadata
        """
        # Step 1: Empathic validation
        validation = self._generate_empathic_validation(user_message, domain)

        # Step 2: Structured action plan (2-4 steps)
        action_steps = self.action_generator.generate_action_steps(
            user_message, domain, max_steps=3
        )

        # Step 3: Micro-practice suggestion
        micro_practice = self._select_micro_practice(user_message, domain)

        # Step 4: Reflective question
        reflective_question = self._generate_reflective_question(user_message, domain)

        # Step 5: Encouragement & closure
        encouragement = self._generate_encouragement(user_message, domain)

        # Assemble the response
        response_parts = [validation]

        # Add action steps
        if action_steps:
            response_parts.append("\n\n**Practical steps you can take:**")
            for i, step in enumerate(action_steps, 1):
                response_parts.append(f"\n{i}. {step['text']}")

        # Add micro-practice
        if micro_practice:
            response_parts.append(f"\n\n**Try this now:** {micro_practice}")

        # Add reflective question
        if reflective_question:
            response_parts.append(f"\n\n{reflective_question}")

        # Add encouragement
        if encouragement:
            response_parts.append(f"\n\n{encouragement}")

        # Combine all parts
        full_response = "".join(response_parts)

        # Step 6: Enforce word count (120-250 words)
        final_response = self._enforce_word_count(full_response)

        return {
            "response": final_response,
            "word_count": len(final_response.split()),
            "domain": domain,
            "validation_passed": self._validate_response(final_response),
        }

    def _generate_empathic_validation(
        self, message: str, domain: str | None = None
    ) -> str:
        """
        Generate empathic validation response.

        Args:
            message: User's message
            domain: Psychological domain

        Returns:
            Validation text
        """
        message_lower = message.lower()

        # Detect emotional content
        if any(
            word in message_lower
            for word in ["anxious", "worried", "stress", "overwhelm", "scared", "afraid"]
        ):
            return "I hear that you're experiencing some difficult feelings right now. What you're going through is challenging, and it's understandable to feel this way."

        if any(word in message_lower for word in ["sad", "depressed", "down", "hopeless"]):
            return "Thank you for sharing what you're experiencing. Feeling this way takes courage to acknowledge, and you're not alone in this."

        if any(
            word in message_lower
            for word in ["stuck", "lost", "confused", "don't know", "uncertain"]
        ):
            return "I understand you're feeling uncertain right now. This sense of being stuck is something many people experience, and it's a signal that you're ready for change."

        if any(word in message_lower for word in ["angry", "frustrated", "irritated"]):
            return "I recognize the frustration you're feeling. These emotions are valid signals that something matters to you."

        # Default empathic validation
        return "I hear what you're sharing. What you're experiencing is part of being human, and you've taken an important step by reaching out."

    def _select_micro_practice(
        self, message: str, domain: str | None = None
    ) -> str:
        """
        Select an appropriate micro-practice.

        Args:
            message: User's message
            domain: Psychological domain

        Returns:
            Micro-practice instruction
        """
        message_lower = message.lower()

        # Domain-specific practices
        if domain == "meditation_attention":
            return "Focus on your breath for 30 seconds. Notice the sensation of air moving in and out, without trying to change it."

        if domain == "emotional_regulation":
            return "Place one hand on your chest. Take a slow breath in for 4 counts, hold for 2, and breathe out for 6. Repeat twice."

        # Context-based practices
        if any(
            word in message_lower
            for word in ["anxious", "panic", "overwhelm", "racing thoughts"]
        ):
            return "Use the 5-4-3-2-1 technique: Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste. This brings you to the present moment."

        if any(word in message_lower for word in ["stuck", "procrastinate", "unmotivated"]):
            return "Set a timer for 5 minutes and do just one small part of what you're avoiding. You only need to start, not finish."

        # Default grounding practice
        return "Take three slow breaths. On each exhale, let your shoulders drop and soften."

    def _generate_reflective_question(
        self, message: str, domain: str | None = None
    ) -> str:
        """
        Generate a reflective question for self-inquiry.

        Args:
            message: User's message
            domain: Psychological domain

        Returns:
            Reflective question
        """
        message_lower = message.lower()

        # Domain-specific questions
        domain_questions = {
            "self_understanding": "What are you noticing about your thoughts and reactions in this moment?",
            "action_discipline": "What's one small action that would move you toward what matters to you?",
            "equanimity": "Can you observe this situation without labeling it as good or bad?",
            "values_service": "What do you care about most in this situation?",
            "resilience": "What strength have you shown by getting through difficult times before?",
        }

        if domain and domain in domain_questions:
            return domain_questions[domain]

        # Context-based questions
        if "anxious" in message_lower or "worry" in message_lower:
            return "What would it be like to focus on what you can control right now, rather than the outcome?"

        if "stuck" in message_lower or "lost" in message_lower:
            return "If a trusted friend were in this situation, what would you suggest they try first?"

        # Default reflective question
        return "What matters most to you in navigating this?"

    def _generate_encouragement(
        self, message: str, domain: str | None = None
    ) -> str:
        """
        Generate encouragement focused on effort and self-trust.

        Args:
            message: User's message
            domain: Psychological domain

        Returns:
            Encouragement text
        """
        encouragements = [
            "You have the capacity to navigate this. Trust in your ability to take small steps forward.",
            "Remember, progress comes from consistent effort, not perfection. You're already moving in the right direction.",
            "Your willingness to engage with this shows strength. Keep trusting the process.",
            "Small actions build momentum. You're capable of making meaningful changes.",
            "You've overcome challenges before. Trust yourself to work through this one too.",
        ]

        # Simple selection based on message length (varying responses)
        import hashlib

        hash_val = int(hashlib.md5(message.encode()).hexdigest(), 16)
        return encouragements[hash_val % len(encouragements)]

    def _enforce_word_count(self, response: str) -> str:
        """
        Enforce 120-250 word count limit.

        Args:
            response: Generated response text

        Returns:
            Response within word count limits
        """
        words = response.split()
        word_count = len(words)

        # If within range, return as-is
        if self.MIN_WORDS <= word_count <= self.MAX_WORDS:
            return response

        # If too short, add additional content
        if word_count < self.MIN_WORDS:
            # Add additional supportive text to reach minimum
            additional_text = " Remember, making changes takes time and patience. Each small step you take builds on the previous one, creating sustainable progress. You're capable of navigating this challenge, and you don't have to do it perfectly. Trust in your ability to learn and adapt as you go."
            
            # Keep adding until we reach minimum
            while len(response.split()) < self.MIN_WORDS:
                response += additional_text
                # Break if we've added text and are close to minimum
                if len(response.split()) >= self.MIN_WORDS - 10:
                    break
            
            return response

        # If too long, trim intelligently
        if word_count > self.MAX_WORDS:
            # Try to trim from the end while keeping structure
            # Find the last complete sentence before MAX_WORDS
            truncated = " ".join(words[: self.MAX_WORDS])

            # Find the last period to end on a complete sentence
            last_period = truncated.rfind(".")
            if last_period > 0:
                return truncated[: last_period + 1]

            # Otherwise just truncate at word limit
            return truncated + "..."

        return response

    def _validate_response(self, response: str) -> bool:
        """
        Validate that response meets quality standards.

        Args:
            response: Generated response text

        Returns:
            True if valid, False otherwise
        """
        words = response.split()
        word_count = len(words)

        # Check word count
        if word_count < self.MIN_WORDS or word_count > self.MAX_WORDS:
            return False

        # Check for religious terms (should be sanitized)
        religious_terms = ["Krishna", "Arjuna", "Lord", "God", "divine", "soul"]
        response_lower = response.lower()
        if any(term.lower() in response_lower for term in religious_terms):
            return False

        # Check minimum length
        if len(response) < 100:
            return False

        return True
