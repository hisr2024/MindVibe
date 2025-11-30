"""Tests for Gita-inspired wisdom adherence validation

These tests ensure that all responses:
1. Follow the mandatory structured format
2. Ground advice in Gita-inspired concepts without naming the scripture or characters
3. Avoid generic advice without yogic foundations
4. Keep language modern and reference-free
"""

import pytest
from backend.services.wisdom_engine import WisdomEngine, validate_gita_response


class TestGitaResponseValidation:
    """Test the Gita-inspired response validation function"""

    def test_validate_gita_response_valid(self):
        """Test that valid Gita-inspired responses pass validation"""
        valid_response = """**Ancient Wisdom Principle:** Focus on karma-yoga—steady action with detachment from results.

**Modern Application:** For your situation, center on the duty right in front of you and let go of the outcome.

**Practical Steps:**
1. Take one purposeful action without overthinking results
2. Pause for four calming breaths before decisions
3. Journal what you can control versus what you cannot

**Deeper Understanding:** Equanimity and selfless effort train the mind to stay steady and compassionate. """

        assert validate_gita_response(valid_response) is True

    def test_validate_gita_response_missing_sections(self):
        """Test that responses missing required sections fail validation"""
        invalid_response = """**Ancient Wisdom Principle:** Steady effort matters.

**Modern Application:** This applies to you.

No practical steps or deeper understanding provided."""

        assert validate_gita_response(invalid_response) is False

    def test_validate_gita_response_no_gita_reference(self):
        """Test that responses without Gita-inspired concepts fail validation"""
        invalid_response = """**Ancient Wisdom Principle:** Some generic wisdom here.

**Modern Application:** Apply this to your life.

**Practical Steps:**
1. Do something
2. Do something else

**Deeper Understanding:** Some generic philosophy."""

        assert validate_gita_response(invalid_response) is False

    def test_validate_gita_response_with_chapter_verse(self):
        """Test that explicit scripture references fail validation"""
        invalid_response = """**Ancient Wisdom Principle:** Chapter 2, Verse 47 says to focus on action.

**Modern Application:** Focus on action, not results.

**Practical Steps:**
1. Practice mindful breathing
2. Cultivate patience

**Deeper Understanding:** This verse shows the path to inner peace."""

        assert validate_gita_response(invalid_response) is False

    def test_validate_gita_response_with_sanskrit_terms(self):
        """Test that responses with yogic Sanskrit terms pass"""
        valid_response = """**Ancient Wisdom Principle:** Abhyasa and vairagya build a steady mind.

**Modern Application:** Your true Self stays calm when you pair practice with letting go of outcomes.

**Practical Steps:**
1. Practice dhyana for five minutes daily
2. Offer one action as seva without expecting praise
3. Use viveka to notice what is in your control

**Deeper Understanding:** Karma-yoga and equanimity strengthen self-mastery and compassion."""

        assert validate_gita_response(valid_response) is True


class TestWisdomEngineGitaAdherence:
    """Test that WisdomEngine generates Gita-inspired responses without explicit references"""

    def setup_method(self):
        """Set up test fixtures"""
        self.engine = WisdomEngine()

    def test_wisdom_principles_use_yogic_concepts(self):
        """Test that all wisdom principles use yogic language without scripture names"""
        blocked_terms = ["Gita", "Bhagavad", "Krishna", "Arjuna", "Verse", "Chapter"]
        keywords = [
            "dharma", "karma", "equanimity", "detachment", "yoga", "sadhana",
            "svadharma", "vairagya", "samatvam", "witness", "daya", "abhyasa"
        ]

        for principle_text in self.engine.wisdom_principles.values():
            assert not any(term.lower() in principle_text.lower() for term in blocked_terms)
            assert any(word in principle_text.lower() for word in keywords)

    def test_coping_strategies_use_yoga_concepts(self):
        """Test that coping strategies rely on yogic practices and avoid references"""
        blocked_terms = ["gita", "bhagavad", "krishna", "arjuna", "chapter", "verse"]
        yoga_terms = [
            "yoga", "pranayama", "dhyana", "svadhyaya", "karma", "witness",
            "breath", "selfless"
        ]

        for strategy_text in self.engine.coping_strategies.values():
            assert not any(term in strategy_text.lower() for term in blocked_terms)
            assert any(term in strategy_text.lower() for term in yoga_terms)

    def test_wisdom_themes_use_yogic_principles(self):
        """Test that wisdom themes reference yogic principles without names"""
        blocked_terms = ["gita", "bhagavad", "krishna", "arjuna", "chapter", "verse"]
        keywords = [
            "dharma", "karma", "svadharma", "equanimity", "samatvam",
            "compassion", "witness", "vairagya", "sadhana"
        ]

        for message in (theme.get("message", "") for theme in self.engine.wisdom_themes.values()):
            assert not any(term in message.lower() for term in blocked_terms)
            assert any(word in message.lower() for word in keywords)

    def test_generate_response_has_structure(self):
        """Test that generated responses follow mandatory structure"""
        test_messages = [
            "I'm feeling anxious about my future",
            "I feel so lonely and isolated",
            "I'm stressed about work",
            "I don't know my purpose in life"
        ]

        for message in test_messages:
            response = self.engine.generate_response(message)

            # Check for all required sections
            assert "**Ancient Wisdom Principle:**" in response, \
                f"Response missing Ancient Wisdom Principle for: {message}"
            assert "**Modern Application:**" in response, \
                f"Response missing Modern Application for: {message}"
            assert "**Practical Steps:**" in response, \
                f"Response missing Practical Steps for: {message}"
            assert "**Deeper Understanding:**" in response, \
                f"Response missing Deeper Understanding for: {message}"

    def test_generate_response_uses_yogic_concepts(self):
        """Test that generated responses use yogic concepts without references"""
        test_messages = [
            "I'm feeling anxious",
            "I feel depressed",
            "I'm lonely"
        ]

        blocked_terms = ["gita", "bhagavad", "krishna", "arjuna", "verse", "chapter"]
        gita_inspired_terms = ["dharma", "karma", "equanimity", "detachment", "samatvam", "abhyasa", "vairagya", "sadhana"]

        for message in test_messages:
            response = self.engine.generate_response(message).lower()
            assert not any(term in response for term in blocked_terms), \
                f"Response for '{message}' should not include explicit references"
            assert any(term in response for term in gita_inspired_terms), \
                f"Response for '{message}' should include yogic concepts"

    def test_crisis_response_unchanged(self):
        """Test that crisis responses are not affected"""
        crisis_message = "I want to kill myself"
        response = self.engine.generate_response(crisis_message)

        # Crisis response should have emergency information
        assert "988" in response or "741741" in response
        assert "Crisis" in response or "PRIORITY" in response

    def test_provide_specific_guidance_has_structure(self):
        """Test that specific guidance follows structured, reference-free format"""
        concerns = ["anxiety", "depression", "loneliness"]

        for concern in concerns:
            guidance = self.engine._provide_specific_guidance(concern)

            # Should have structured format
            assert "**Ancient Wisdom Principle:**" in guidance
            assert "**Modern Application:**" in guidance
            assert "**Practical Steps:**" in guidance
            assert "**Deeper Understanding:**" in guidance

            blocked_terms = ["gita", "bhagavad", "krishna", "arjuna", "verse", "chapter"]
            assert not any(term in guidance.lower() for term in blocked_terms), \
                f"Specific guidance for '{concern}' should not include explicit references"

    def test_validate_and_deepen_has_yogic_wisdom(self):
        """Test that validation responses include yogic wisdom without references"""
        response = self.engine._validate_and_deepen("anxiety").lower()

        assert "**ancient wisdom principle:**" in response
        assert "**deeper understanding:**" in response
        assert "dharma" in response or "abhyasa" in response or "karma" in response
        assert "gita" not in response

    def test_reinforce_progress_has_yogic_wisdom(self):
        """Test that progress reinforcement includes yogic wisdom"""
        response = self.engine._reinforce_progress("anxiety").lower()

        assert "**ancient wisdom principle:**" in response
        assert "**deeper understanding:**" in response
        assert any(term in response for term in ["karma", "dharma", "abhyasa", "samskara"])
        assert "gita" not in response
