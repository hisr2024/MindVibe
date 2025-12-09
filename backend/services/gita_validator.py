"""
Gita Response Validation Service.

Validates that KIAAN's responses are properly rooted in Bhagavad Gita wisdom
and follow the required structure and terminology.
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


class GitaValidator:
    """Validator for ensuring responses are rooted in Gita wisdom."""

    # Required Sanskrit/Gita terminology that should appear in responses
    GITA_TERMS = [
        "dharma", "karma", "atman", "yoga", "moksha", "sattva", "rajas", "tamas",
        "prakriti", "purusha", "guna", "buddhi", "manas", "chitta", "ahimsa",
        "tapas", "swadhyaya", "ishvara", "sannyasa", "tyaga", "bhakti", "jnana",
        "dhyana", "samadhi", "nishkama", "vairagya", "viveka", "shraddha",
        "devotion", "detachment", "equanimity", "duty", "action", "knowledge",
        "wisdom", "peace", "balance", "surrender", "awareness", "consciousness",
        "inner self", "higher self", "essence", "purpose", "discipline"
    ]

    # Forbidden generic/non-Gita terms that indicate generic advice
    FORBIDDEN_TERMS = [
        "studies show", "research indicates", "according to research",
        "scientists say", "experts recommend", "data suggests",
        "modern psychology", "clinical studies", "proven by science",
        "psychologists agree", "therapy suggests", "medical advice",
        "consult a doctor", "seek professional help", "talk to a therapist"
    ]

    # Structural markers that indicate Gita-based wisdom
    WISDOM_MARKERS = [
        "ancient wisdom", "timeless teaching", "universal principle",
        "eternal truth", "path to", "journey of", "practice of",
        "cultivate", "embrace", "release", "let go", "transcend",
        "inner peace", "self-mastery", "spiritual growth"
    ]

    # Minimum and maximum word counts
    MIN_WORDS = 200
    MAX_WORDS = 500
    
    # Compile citation patterns once at class level for performance
    CITATION_PATTERNS = [
        re.compile(r'bhagavad gita \d+\.\d+'),
        re.compile(r'gita \d+\.\d+'),
        re.compile(r'chapter \d+ verse \d+'),
        re.compile(r'verse \d+\.\d+'),
        re.compile(r'krishna said in chapter'),
    ]

    def __init__(self):
        """Initialize the Gita validator."""
        self.logger = logger

    def validate_response(
        self,
        response: str,
        verse_context: list[dict[str, Any]] | None = None
    ) -> tuple[bool, dict[str, Any]]:
        """
        Validate that a response meets Gita adherence requirements.
        
        Args:
            response: The chatbot response to validate
            verse_context: Optional list of verse dictionaries that were used
            
        Returns:
            Tuple of (is_valid, validation_details)
            - is_valid: Boolean indicating if validation passed
            - validation_details: Dict with detailed validation results
        """
        validation_details = {
            "has_gita_terminology": False,
            "no_forbidden_terms": True,
            "has_wisdom_markers": False,
            "appropriate_length": False,
            "verse_context_used": False,
            "gita_terms_found": [],
            "forbidden_terms_found": [],
            "wisdom_markers_found": [],
            "word_count": 0,
            "issues": []
        }

        if not response or not response.strip():
            validation_details["issues"].append("Response is empty")
            return False, validation_details

        # Clean response for analysis
        response_lower = response.lower()

        # 1. Check word count
        words = response.split()
        word_count = len(words)
        validation_details["word_count"] = word_count

        if self.MIN_WORDS <= word_count <= self.MAX_WORDS:
            validation_details["appropriate_length"] = True
        else:
            validation_details["issues"].append(
                f"Word count {word_count} not in range {self.MIN_WORDS}-{self.MAX_WORDS}"
            )

        # 2. Check for Gita terminology (at least 2 terms required)
        gita_terms_found = []
        for term in self.GITA_TERMS:
            if term.lower() in response_lower:
                gita_terms_found.append(term)

        validation_details["gita_terms_found"] = gita_terms_found
        if len(gita_terms_found) >= 2:
            validation_details["has_gita_terminology"] = True
        else:
            validation_details["issues"].append(
                f"Only {len(gita_terms_found)} Gita terms found, need at least 2"
            )

        # 3. Check for forbidden generic terms
        forbidden_found = []
        for term in self.FORBIDDEN_TERMS:
            if term.lower() in response_lower:
                forbidden_found.append(term)

        validation_details["forbidden_terms_found"] = forbidden_found
        if forbidden_found:
            validation_details["no_forbidden_terms"] = False
            validation_details["issues"].append(
                f"Contains forbidden terms: {', '.join(forbidden_found)}"
            )

        # 4. Check for wisdom markers (at least 1 required)
        wisdom_markers_found = []
        for marker in self.WISDOM_MARKERS:
            if marker.lower() in response_lower:
                wisdom_markers_found.append(marker)

        validation_details["wisdom_markers_found"] = wisdom_markers_found
        if wisdom_markers_found:
            validation_details["has_wisdom_markers"] = True
        else:
            validation_details["issues"].append(
                "No wisdom markers found in response"
            )

        # 5. Check if verse context was provided and used
        if verse_context and len(verse_context) > 0:
            validation_details["verse_context_used"] = True
        else:
            validation_details["issues"].append(
                "No verse context provided or empty"
            )

        # 6. Additional check: Ensure response doesn't explicitly cite verses
        # This is important - we want to use wisdom but not cite it
        for pattern in self.CITATION_PATTERNS:
            if pattern.search(response_lower):
                validation_details["issues"].append(
                    f"Response contains explicit verse citation: {pattern.pattern}"
                )
                validation_details["no_forbidden_terms"] = False

        # Determine overall validity
        is_valid = (
            validation_details["has_gita_terminology"] and
            validation_details["no_forbidden_terms"] and
            validation_details["has_wisdom_markers"] and
            validation_details["appropriate_length"] and
            validation_details["verse_context_used"]
        )

        if is_valid:
            self.logger.info("✅ Response validation passed")
        else:
            self.logger.warning(
                f"❌ Response validation failed: {', '.join(validation_details['issues'])}"
            )

        return is_valid, validation_details

    def get_fallback_response(self, user_message: str = "") -> str:
        """
        Get a Gita-rooted fallback response when validation fails.
        
        Args:
            user_message: Optional user message for context
            
        Returns:
            A safe, Gita-based response
        """
        fallback_responses = [
            """In times of uncertainty, remember the eternal wisdom: your duty lies in the action itself, not in worrying about the outcome. When we focus on doing our best in this present moment, we free ourselves from anxiety and discover true inner peace. This principle of karma yoga is the foundation of both spiritual growth and mental wellness.

This path of karma yoga - acting without attachment to results - is the foundation of lasting calm. Each small step you take with full presence is a victory. Practice letting go of what you cannot control while embracing what you can: your effort, your attitude, your response to life's challenges. This shift in perspective creates immediate relief from stress.

The ancient teachings remind us that we are not our circumstances but the eternal awareness witnessing them. Your true nature - the atman within - remains untouched by temporary difficulties. When you connect with this deeper reality through meditation and mindful action, you discover unshakeable strength that sustains you through any challenge.

Start today with one simple practice: before any task, take a breath and remind yourself, "I'll do my best and release the rest." This discipline of detachment transforms ordinary actions into a journey of spiritual growth and brings profound peace to daily life. Trust the process, honor your dharma, and watch as equanimity becomes your natural state. 💙""",

            """The ancient wisdom teaches us about the three gunas - the qualities that shape our inner state. When we're pulled by rajas (restlessness) or tamas (lethargy), we suffer. But we can cultivate sattva - clarity, harmony, and balance - through conscious choices and dedicated practice.

Begin by bringing awareness to your thoughts and emotions without judgment. Notice them like clouds passing through the sky of your consciousness. This practice of self-observation, combined with regular meditation and mindful action, gradually brings equanimity even amid life's storms. The key is consistency - even a few minutes daily creates transformation over time.

The path of wisdom shows that lasting peace comes not from controlling external circumstances, but from mastering our inner response to them. When you understand that you are the eternal witness - the unchanging awareness beyond temporary thoughts and feelings - you discover freedom from suffering. This recognition alone begins to dissolve the grip of anxiety and stress.

The path forward is simple but profound: engage fully with your duties, maintain balance in success and failure, practice compassion toward yourself and others, and trust in the journey of self-mastery. Each day is an opportunity to align with your higher purpose. Let go of perfectionism and embrace progress. Your buddhi (discriminating wisdom) will guide you when you quiet the restless mind through practice and patience. 💙""",

            """True peace comes from understanding the nature of the eternal self within you - the atman that remains unchanged despite life's turbulence. When you identify with this deeper essence rather than temporary circumstances, you discover unshakeable inner strength that no external situation can diminish.

This journey of self-knowledge begins with daily practice. Carve out time for quiet reflection, even if just for a few minutes. In this stillness, you connect with your inner wisdom and remember your true nature beyond fear and worry. The practice of dhyana (meditation) is not about stopping thoughts, but witnessing them without attachment. Start small and build gradually.

The timeless teachings emphasize that we suffer when we identify with the temporary - our roles, possessions, achievements. But our essence is eternal, pure consciousness itself. When you anchor yourself in this truth, external changes lose their power to disturb your peace. This understanding transforms everything.

Remember: you are not your thoughts, not your circumstances, but the aware presence behind them. Cultivate this awareness through meditation, mindful breathing, and bringing full presence to each moment. This is the path of jnana yoga - wisdom that liberates. Start where you are, practice with dedication, let go of attachment to immediate results, and trust that consistent effort leads to transformation. This is the way to freedom and lasting joy. 💙"""
        ]

        # Simple hash to pick a consistent response based on message
        import hashlib
        if user_message:
            hash_val = int(hashlib.md5(user_message.encode()).hexdigest(), 16)
            index = hash_val % len(fallback_responses)
        else:
            index = 0

        return fallback_responses[index]

    def check_four_part_structure(self, response: str) -> dict[str, bool]:
        """
        Check if response follows the 4-part structure:
        1. Ancient Wisdom
        2. Modern Application
        3. Practical Steps
        4. Deeper Understanding
        
        Args:
            response: The response to check
            
        Returns:
            Dict indicating which parts are present
        """
        response_lower = response.lower()

        structure = {
            "has_ancient_wisdom": False,
            "has_modern_application": False,
            "has_practical_steps": False,
            "has_deeper_understanding": False
        }

        # Ancient wisdom markers
        ancient_markers = [
            "wisdom", "ancient", "timeless", "eternal", "teaching",
            "principle", "path", "tradition"
        ]
        structure["has_ancient_wisdom"] = any(
            marker in response_lower for marker in ancient_markers
        )

        # Modern application markers
        modern_markers = [
            "today", "now", "modern", "daily life", "your life",
            "in practice", "real world", "everyday"
        ]
        structure["has_modern_application"] = any(
            marker in response_lower for marker in modern_markers
        )

        # Practical steps markers (actionable language)
        practical_markers = [
            "start", "begin", "practice", "try", "take", "make",
            "create", "build", "develop", "cultivate", "step"
        ]
        structure["has_practical_steps"] = any(
            marker in response_lower for marker in practical_markers
        )

        # Deeper understanding markers
        deeper_markers = [
            "remember", "understand", "realize", "recognize", "see that",
            "know that", "trust", "deeper", "profound", "essence"
        ]
        structure["has_deeper_understanding"] = any(
            marker in response_lower for marker in deeper_markers
        )

        return structure
