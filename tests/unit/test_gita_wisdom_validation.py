"""Tests for Gita wisdom adherence validation

These tests ensure that all responses:
1. Follow the mandatory structured format
2. Reference Gita principles explicitly
3. Include no generic advice without Gita foundation
4. Quote or paraphrase Gita teachings
"""

import pytest
from backend.services.wisdom_engine import WisdomEngine, validate_gita_response


class TestGitaResponseValidation:
    """Test the Gita response validation function"""

    def test_validate_gita_response_valid(self):
        """Test that valid Gita responses pass validation"""
        valid_response = """**Ancient Wisdom Principle:** The Gita teaches Karma Yoga in Chapter 2, Verse 47.

**Modern Application:** This applies to your situation by focusing on action over results.

**Practical Steps:**
1. Focus on your duties
2. Release attachment to outcomes
3. Practice daily meditation

**Deeper Understanding:** The Bhagavad Gita reveals that attachment is the root of suffering."""
        
        assert validate_gita_response(valid_response) is True

    def test_validate_gita_response_missing_sections(self):
        """Test that responses missing required sections fail validation"""
        invalid_response = """**Ancient Wisdom Principle:** The Gita teaches something.

**Modern Application:** This applies to you.

No practical steps or deeper understanding provided."""
        
        assert validate_gita_response(invalid_response) is False

    def test_validate_gita_response_no_gita_reference(self):
        """Test that responses without Gita references fail validation"""
        invalid_response = """**Ancient Wisdom Principle:** Some generic wisdom here.

**Modern Application:** Apply this to your life.

**Practical Steps:**
1. Do something
2. Do something else

**Deeper Understanding:** Some generic philosophy."""
        
        assert validate_gita_response(invalid_response) is False

    def test_validate_gita_response_with_chapter_verse(self):
        """Test that responses with chapter.verse references pass"""
        valid_response = """**Ancient Wisdom Principle:** Bhagavad Gita 2.47 teaches about Karma Yoga.

**Modern Application:** Focus on action, not results.

**Practical Steps:**
1. Practice Abhyasa
2. Cultivate Vairagya

**Deeper Understanding:** The Gita shows the path to inner peace."""
        
        assert validate_gita_response(valid_response) is True

    def test_validate_gita_response_with_sanskrit_terms(self):
        """Test that responses with Sanskrit Gita terms pass"""
        valid_response = """**Ancient Wisdom Principle:** The Gita teaches Atman is eternal.

**Modern Application:** Your true Self transcends circumstances.

**Practical Steps:**
1. Practice Dhyana (meditation)
2. Study Gita teachings
3. Cultivate Viveka (discrimination)

**Deeper Understanding:** Bhagavad Gita reveals Atman as unchanging consciousness."""
        
        assert validate_gita_response(valid_response) is True


class TestWisdomEngineGitaAdherence:
    """Test that WisdomEngine generates Gita-based responses"""

    def setup_method(self):
        """Set up test fixtures"""
        self.engine = WisdomEngine()

    def test_wisdom_principles_reference_gita(self):
        """Test that all wisdom principles reference Gita"""
        for principle_name, principle_text in self.engine.wisdom_principles.items():
            assert "Gita" in principle_text or "Bhagavad" in principle_text, \
                f"Principle '{principle_name}' does not reference Gita"

    def test_coping_strategies_reference_gita(self):
        """Test that coping strategies reference Gita concepts"""
        gita_terms = [
            "Gita", "Bhagavad", "Yoga", "Pranayama", "Dhyana", 
            "Karma", "Atman", "Sakshi", "Svadhyaya", "Chapter"
        ]
        
        for strategy_name, strategy_text in self.engine.coping_strategies.items():
            has_gita_reference = any(term in strategy_text for term in gita_terms)
            assert has_gita_reference, \
                f"Strategy '{strategy_name}' does not reference Gita concepts"

    def test_wisdom_themes_reference_gita(self):
        """Test that wisdom themes reference Gita"""
        for theme_name, theme_data in self.engine.wisdom_themes.items():
            message = theme_data.get("message", "")
            assert "Gita" in message or any(term in message for term in [
                "Atman", "Dharma", "Karma", "Vairagya", "Abhyasa", "Daya", "Samatvam"
            ]), f"Theme '{theme_name}' message does not reference Gita concepts"

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

    def test_generate_response_references_gita(self):
        """Test that generated responses reference Gita"""
        test_messages = [
            "I'm feeling anxious",
            "I feel depressed",
            "I'm lonely"
        ]
        
        gita_indicators = [
            "Gita", "Bhagavad", "Atman", "Karma", "Dharma", 
            "Samatvam", "Abhyasa", "Vairagya", "Sadhana", "Chapter"
        ]
        
        for message in test_messages:
            response = self.engine.generate_response(message)
            has_gita_reference = any(indicator in response for indicator in gita_indicators)
            assert has_gita_reference, \
                f"Response for '{message}' does not reference Gita"

    def test_crisis_response_unchanged(self):
        """Test that crisis responses are not affected"""
        crisis_message = "I want to kill myself"
        response = self.engine.generate_response(crisis_message)
        
        # Crisis response should have emergency information
        assert "988" in response or "741741" in response
        assert "Crisis" in response or "PRIORITY" in response

    def test_provide_specific_guidance_has_gita_structure(self):
        """Test that specific guidance follows Gita structure"""
        concerns = ["anxiety", "depression", "loneliness"]
        
        for concern in concerns:
            guidance = self.engine._provide_specific_guidance(concern)
            
            # Should have structured format
            assert "**Ancient Wisdom Principle:**" in guidance
            assert "**Modern Application:**" in guidance
            assert "**Practical Steps:**" in guidance
            assert "**Deeper Understanding:**" in guidance
            
            # Should reference Gita
            gita_indicators = ["Gita", "Bhagavad", "Chapter", "Verse"]
            has_reference = any(indicator in guidance for indicator in gita_indicators)
            assert has_reference, f"Specific guidance for '{concern}' missing Gita reference"

    def test_validate_and_deepen_has_gita_wisdom(self):
        """Test that validation responses include Gita wisdom"""
        response = self.engine._validate_and_deepen("anxiety")
        
        assert "Gita" in response or "Bhagavad" in response
        assert "**Ancient Wisdom Principle:**" in response
        assert "**Deeper Understanding:**" in response

    def test_reinforce_progress_has_gita_wisdom(self):
        """Test that progress reinforcement includes Gita wisdom"""
        response = self.engine._reinforce_progress("anxiety")
        
        assert "Gita" in response or "Bhagavad" in response
        assert "**Ancient Wisdom Principle:**" in response
        assert "**Deeper Understanding:**" in response

    def test_no_generic_mental_health_advice(self):
        """Test that responses don't use generic mental health language without Gita context"""
        generic_phrases = [
            "cognitive behavioral therapy",
            "talk to a therapist",
            "mental health professional",
            "psychology",
            "neuroscience"
        ]
        
        test_messages = [
            "I'm anxious",
            "I feel depressed",
            "I'm stressed"
        ]
        
        for message in test_messages:
            response = self.engine.generate_response(message)
            response_lower = response.lower()
            
            # If any generic phrase is used, it should be accompanied by Gita wisdom
            for phrase in generic_phrases:
                if phrase in response_lower:
                    # Must also have Gita reference nearby
                    assert "gita" in response_lower or "dharma" in response_lower or \
                           "karma" in response_lower or "atman" in response_lower, \
                           f"Response uses '{phrase}' without Gita context"

    def test_all_strategies_formatted_correctly(self):
        """Test that formatted strategies maintain Gita context"""
        for strategy_keys in [
            ["breathing", "meditation"],
            ["grounding", "movement"],
            ["journaling", "connection"]
        ]:
            formatted = self.engine._format_strategies(strategy_keys)
            
            # Should have numbered list
            assert "1." in formatted
            
            # At least one should reference Gita concepts
            gita_terms = ["Gita", "Pranayama", "Dhyana", "Yoga", "Sakshi", "Svadhyaya", "Karma", "Chapter"]
            has_gita = any(term in formatted for term in gita_terms)
            assert has_gita, f"Formatted strategies missing Gita references: {formatted}"


class TestGitaResponseStructure:
    """Test the mandatory response structure is followed"""

    def setup_method(self):
        """Set up test fixtures"""
        self.engine = WisdomEngine()

    def test_response_has_all_four_sections(self):
        """Test that responses have all four mandatory sections in order"""
        response = self.engine.generate_response("I'm feeling stressed")
        
        # Find positions of each section
        principle_pos = response.find("**Ancient Wisdom Principle:**")
        application_pos = response.find("**Modern Application:**")
        steps_pos = response.find("**Practical Steps:**")
        understanding_pos = response.find("**Deeper Understanding:**")
        
        # All sections must be present
        assert principle_pos != -1, "Missing Ancient Wisdom Principle"
        assert application_pos != -1, "Missing Modern Application"
        assert steps_pos != -1, "Missing Practical Steps"
        assert understanding_pos != -1, "Missing Deeper Understanding"
        
        # Sections must be in correct order
        assert principle_pos < application_pos, "Sections out of order"
        assert application_pos < steps_pos, "Sections out of order"
        assert steps_pos < understanding_pos, "Sections out of order"

    def test_practical_steps_are_actionable(self):
        """Test that practical steps section contains numbered actions"""
        response = self.engine.generate_response("I need help")
        
        # Extract practical steps section
        start = response.find("**Practical Steps:**")
        end = response.find("**Deeper Understanding:**")
        steps_section = response[start:end]
        
        # Should have numbered items
        assert "1." in steps_section or "1)" in steps_section, \
            "Practical steps should have numbered items"

    def test_deeper_understanding_mentions_gita_philosophy(self):
        """Test that deeper understanding section discusses Gita philosophy"""
        response = self.engine.generate_response("I'm confused")
        
        # Extract deeper understanding section
        start = response.find("**Deeper Understanding:**")
        understanding_section = response[start:]
        
        # Should reference Gita philosophy
        philosophy_terms = [
            "Gita", "Bhagavad", "Atman", "Self", "eternal", 
            "consciousness", "liberation", "realization", "Sadhana"
        ]
        
        has_philosophy = any(term in understanding_section for term in philosophy_terms)
        assert has_philosophy, "Deeper Understanding missing Gita philosophy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
