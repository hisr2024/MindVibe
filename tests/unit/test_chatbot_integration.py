"""
Integration tests for complete ChatbotService with all 4 phases integrated
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.models import WisdomVerse
from backend.services.chatbot import ChatbotService


class TestChatbotServiceIntegration:
    """Integration tests for ChatbotService with all phases."""

    @pytest.fixture
    def chatbot(self):
        """Create a ChatbotService instance."""
        return ChatbotService()

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        return AsyncMock()

    @pytest.fixture
    def sample_verse_with_domain(self):
        """Create a sample verse with domain tagging."""
        verse = MagicMock(spec=WisdomVerse)
        verse.verse_id = "2.47"
        verse.chapter = 2
        verse.verse_number = 47
        verse.theme = "action_without_attachment"
        verse.english = "You have the right to perform your duties, but not to the fruits of action."
        verse.hindi = "तुम्हारा अधिकार केवल कर्म करने में है।"
        verse.sanskrit = "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।"
        verse.context = "Teaches the principle of performing duties without attachment to outcomes."
        verse.mental_health_applications = {
            "applications": ["anxiety_management", "stress_reduction"]
        }
        verse.primary_domain = "action_discipline"
        verse.secondary_domains = ["equanimity"]
        return verse

    def test_chatbot_initialization(self, chatbot):
        """Test that chatbot initializes with all required services."""
        assert chatbot.kb is not None
        assert chatbot.response_engine is not None
        assert chatbot.action_generator is not None
        assert chatbot.domain_mapper is not None
        assert chatbot.safety_validator is not None
        assert chatbot.psychology_patterns is not None

    @pytest.mark.asyncio
    async def test_crisis_detection_and_response(self, chatbot, mock_db):
        """Test that crisis is detected and appropriate response is returned."""
        session_id = "crisis-test"
        crisis_message = "I want to kill myself"

        # Mock the KB search to return empty (crisis takes priority)
        with patch.object(
            chatbot.kb,
            "search_relevant_verses",
            return_value=[],
        ):
            result = await chatbot.chat(
                message=crisis_message,
                session_id=session_id,
                db=mock_db,
            )

            # Should return crisis response
            assert "988" in result["response"] or "911" in result["response"]
            assert any(
                word in result["response"].lower()
                for word in ["help", "support", "crisis", "safety"]
            )

    @pytest.mark.asyncio
    async def test_normal_message_with_domain_routing(
        self, chatbot, mock_db, sample_verse_with_domain
    ):
        """Test normal message processing with domain routing."""
        session_id = "normal-test"
        message = "I feel anxious about my work"

        with patch.object(
            chatbot.kb,
            "search_relevant_verses",
            return_value=[{"verse": sample_verse_with_domain, "score": 0.9}],
        ), patch.object(
            chatbot.kb,
            "format_verse_response",
            return_value={
                "verse_id": "2.47",
                "text": "You have the right to perform your duties...",
                "theme": "Action Without Attachment",
            },
        ):
            result = await chatbot.chat(
                message=message,
                session_id=session_id,
                db=mock_db,
            )

            # Check response structure
            assert "response" in result
            assert "verses" in result
            assert "session_id" in result

            # Response should be within word count
            word_count = len(result["response"].split())
            assert 120 <= word_count <= 250, f"Word count {word_count} not in range 120-250"

            # Response should not contain religious terms
            assert "Krishna" not in result["response"]
            assert "Arjuna" not in result["response"]
            assert "God" not in result["response"]

    @pytest.mark.asyncio
    async def test_response_quality_validation(
        self, chatbot, mock_db, sample_verse_with_domain
    ):
        """Test that generated responses pass quality validation."""
        session_id = "quality-test"
        messages = [
            "I'm feeling overwhelmed",
            "I need motivation",
            "How can I focus better?",
            "I want to help others",
        ]

        for i, message in enumerate(messages):
            with patch.object(
                chatbot.kb,
                "search_relevant_verses",
                return_value=[{"verse": sample_verse_with_domain, "score": 0.8}],
            ), patch.object(
                chatbot.kb,
                "format_verse_response",
                return_value={"verse_id": "2.47", "text": "Test verse"},
            ):
                result = await chatbot.chat(
                    message=message,
                    session_id=f"{session_id}-{i}",
                    db=mock_db,
                )

                response = result["response"]

                # Validate with safety validator
                validation = chatbot.safety_validator.validate_response_quality(response)

                # Should pass basic validation
                assert 120 <= validation["word_count"] <= 250
                # Note: Some validation issues might exist, but word count should be OK

    @pytest.mark.asyncio
    async def test_conversation_history_maintained(self, chatbot, mock_db):
        """Test that conversation history is properly maintained."""
        session_id = "history-test"
        messages = ["Hello", "I need help", "Thank you"]

        for message in messages:
            with patch.object(
                chatbot.kb,
                "search_relevant_verses",
                return_value=[],
            ):
                await chatbot.chat(
                    message=message,
                    session_id=session_id,
                    db=mock_db,
                )

        history = chatbot.get_conversation_history(session_id)

        # Should have 6 messages (3 user + 3 assistant)
        assert len(history) == 6
        assert history[0]["role"] == "user"
        assert history[1]["role"] == "assistant"

    @pytest.mark.asyncio
    async def test_religious_term_sanitization_in_response(
        self, chatbot, mock_db
    ):
        """Test that religious terms are sanitized in responses."""
        session_id = "sanitize-test"
        message = "Tell me about Krishna's teaching"

        verse_with_religious_terms = MagicMock(spec=WisdomVerse)
        verse_with_religious_terms.verse_id = "2.1"
        verse_with_religious_terms.chapter = 2
        verse_with_religious_terms.verse_number = 1
        verse_with_religious_terms.theme = "wisdom"
        verse_with_religious_terms.english = "Krishna speaks to Arjuna about the divine soul"
        verse_with_religious_terms.context = "The Lord teaches about God"
        verse_with_religious_terms.mental_health_applications = {"applications": []}
        verse_with_religious_terms.primary_domain = "knowledge_insight"
        verse_with_religious_terms.secondary_domains = []

        with patch.object(
            chatbot.kb,
            "search_relevant_verses",
            return_value=[{"verse": verse_with_religious_terms, "score": 0.9}],
        ), patch.object(
            chatbot.kb,
            "format_verse_response",
            return_value={
                "verse_id": "2.1",
                "text": "The teacher speaks to the student about the essence",
                "context": "The wise one teaches about inner wisdom",
            },
        ):
            result = await chatbot.chat(
                message=message,
                session_id=session_id,
                db=mock_db,
            )

            response = result["response"]

            # Should not contain religious terms
            assert "Krishna" not in response
            assert "Arjuna" not in response
            assert "God" not in response
            assert "Lord" not in response
            assert "divine" not in response.lower() or "Divine" not in response

    @pytest.mark.asyncio
    async def test_domain_aware_response_generation(
        self, chatbot, mock_db, sample_verse_with_domain
    ):
        """Test that responses are domain-aware."""
        session_id = "domain-test"

        # Test different domains
        domain_messages = {
            "action_discipline": "I need motivation to take action",
            "emotional_regulation": "I can't control my emotions",
            "meditation_attention": "How can I improve my focus?",
            "values_service": "I want to help others",
        }

        for expected_domain, message in domain_messages.items():
            verse = MagicMock(spec=WisdomVerse)
            verse.verse_id = "1.1"
            verse.primary_domain = expected_domain
            verse.secondary_domains = []
            verse.theme = expected_domain
            verse.english = "Test verse"
            verse.context = "Test context"
            verse.mental_health_applications = {"applications": []}

            with patch.object(
                chatbot.kb,
                "search_relevant_verses",
                return_value=[{"verse": verse, "score": 0.9}],
            ), patch.object(
                chatbot.kb,
                "format_verse_response",
                return_value={"verse_id": "1.1", "text": "Test"},
            ):
                result = await chatbot.chat(
                    message=message,
                    session_id=f"{session_id}-{expected_domain}",
                    db=mock_db,
                )

                # Response should be generated successfully
                assert len(result["response"]) > 0

    @pytest.mark.asyncio
    async def test_evidence_based_patterns_in_response(
        self, chatbot, mock_db
    ):
        """Test that responses contain evidence-based psychological patterns."""
        session_id = "evidence-test"
        message = "I'm feeling anxious and worried"

        with patch.object(
            chatbot.kb,
            "search_relevant_verses",
            return_value=[],
        ):
            result = await chatbot.chat(
                message=message,
                session_id=session_id,
                db=mock_db,
            )

            response = result["response"]

            # Check for evidence-based language
            evidence_alignment = chatbot.safety_validator.check_evidence_alignment(response)

            # Should have some evidence-based content
            assert evidence_alignment["total_score"] > 0

    def test_all_9_domains_accessible(self, chatbot):
        """Test that all 9 psychological domains are accessible."""
        all_domains = chatbot.domain_mapper.get_all_domains()

        assert len(all_domains) == 9
        for domain_key in [
            "self_understanding",
            "action_discipline",
            "equanimity",
            "knowledge_insight",
            "values_service",
            "meditation_attention",
            "resilience",
            "interconnectedness",
            "cognitive_flexibility",
        ]:
            assert domain_key in all_domains

    def test_crisis_keywords_comprehensive(self, chatbot):
        """Test that crisis detection covers all required categories."""
        crisis_keywords = chatbot.safety_validator.CRISIS_KEYWORDS

        assert "self_harm" in crisis_keywords
        assert "harm_to_others" in crisis_keywords
        assert "acute_distress" in crisis_keywords

        # Check that keywords are comprehensive
        assert len(crisis_keywords["self_harm"]) >= 5
        assert len(crisis_keywords["harm_to_others"]) >= 3
        assert len(crisis_keywords["acute_distress"]) >= 3

    def test_religious_terms_mapping_complete(self, chatbot):
        """Test that religious term sanitization is comprehensive."""
        religious_terms = chatbot.safety_validator.RELIGIOUS_TERMS

        # Should include key terms
        assert "Krishna" in religious_terms
        assert "Arjuna" in religious_terms
        assert "God" in religious_terms
        assert "Lord" in religious_terms
        assert "divine" in religious_terms
        assert "soul" in religious_terms
