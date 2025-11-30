"""Integration tests for Gita-inspired wisdom adherence in API responses

These tests ensure that API endpoints return responses that:
1. Follow the mandatory structured format
2. Use Gita-inspired yogic principles without explicit scripture or character references
3. Avoid generic advice without a dharma/karma-yoga foundation
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import WisdomVerse, GitaVerse


yogic_terms = ["dharma", "karma", "equanimity", "detachment", "samatvam", "abhyasa", "yoga"]
blocked_terms = ["gita", "bhagavad", "krishna", "arjuna", "chapter", "verse"]


class TestWisdomGuideGitaAdherence:
    """Test that wisdom guide API follows Gita-inspired requirements"""

    @pytest.mark.asyncio
    async def test_wisdom_query_response_has_structure(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that wisdom query responses follow mandatory structure"""
        # Create test verse
        verse = WisdomVerse(
            verse_id="2.47",
            chapter=2,
            verse_number=47,
            theme="action_without_attachment",
            english="You have the right to perform your duties, but not to the fruits",
            hindi="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
            sanskrit="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
            context="Karma Yoga teaching",
            mental_health_applications={"applications": ["anxiety", "stress"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "I'm anxious about my future",
                "language": "english",
            },
        )

        assert response.status_code == 200
        data = response.json()
        wisdom_response = data["response"]

        # Check for mandatory structure
        assert "**Ancient Wisdom Principle:**" in wisdom_response
        assert "**Modern Application:**" in wisdom_response
        assert "**Practical Steps:**" in wisdom_response
        assert "**Deeper Understanding:**" in wisdom_response

    @pytest.mark.asyncio
    async def test_wisdom_query_response_uses_yogic_concepts(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that wisdom responses rely on yogic concepts without explicit references"""
        verse = WisdomVerse(
            verse_id="6.35",
            chapter=6,
            verse_number=35,
            theme="control_of_mind",
            english="The mind is restless but can be controlled through practice",
            hindi="मन चंचल है पर अभ्यास से वश में हो सकता है",
            sanskrit="असंशयं महाबाहो मनो दुर्निग्रहं चलम्",
            context="Teaching on mind control",
            mental_health_applications={"applications": ["anxiety", "adhd"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "My mind is always restless",
                "language": "english",
            },
        )

        assert response.status_code == 200
        data = response.json()
        wisdom_response = data["response"].lower()

        assert any(indicator in wisdom_response for indicator in yogic_terms)
        assert not any(term in wisdom_response for term in blocked_terms)

    @pytest.mark.asyncio
    async def test_wisdom_query_no_generic_advice(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that responses don't provide generic advice without yogic context"""
        verse = WisdomVerse(
            verse_id="2.48",
            chapter=2,
            verse_number=48,
            theme="equanimity_in_adversity",
            english="Perform your duty with equanimity in success and failure",
            hindi="समत्व से कर्म करो",
            sanskrit="योगस्थः कुरु कर्माणि",
            context="Teaching on equanimity",
            mental_health_applications={"applications": ["stress", "anxiety"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "I'm stressed about my performance",
                "language": "english",
            },
        )

        assert response.status_code == 200
        data = response.json()
        wisdom_response = data["response"].lower()

        # Response should not be generic - should have yogic foundation
        generic_only_phrases = [
            "just relax",
            "think positive",
            "stay calm",
            "be mindful"
        ]

        if any(phrase in wisdom_response for phrase in generic_only_phrases):
            assert any(term in wisdom_response for term in yogic_terms)
            assert not any(term in wisdom_response for term in blocked_terms)


class TestGitaAPIGitaAdherence:
    """Test that Gita API follows strict structure for verse retrieval"""

    @pytest.mark.asyncio
    async def test_gita_wisdom_response_structure(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that Gita API responses follow mandatory structure"""
        verses = [
            GitaVerse(
                chapter=2,
                verse=47,
                sanskrit="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
                hindi="कर्म में तुम्हारा अधिकार है, फल में नहीं",
                english="You have right to action, not to fruits of action",
                principle="Karma Yoga",
                theme="action_without_attachment",
            )
        ]

        test_db.add_all(verses)
        await test_db.commit()

        response = await test_client.get("/api/gita/verses/2/47")

        assert response.status_code == 200
        data = response.json()

        # Verify verse data is present
        assert "verse" in data
        assert data["verse"]["chapter"] == 2
        assert data["verse"]["verse"] == 47

    @pytest.mark.asyncio
    async def test_gita_api_references_specific_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that Gita API responses reference specific verses"""
        verse = GitaVerse(
            chapter=6,
            verse=35,
            sanskrit="असंशयं महाबाहो मनो दुर्निग्रहं चलम्",
            hindi="निःसंदेह मन चंचल है",
            english="The mind is restless, no doubt",
            principle="Mind Control",
            theme="mind_control",
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.get("/api/gita/verses/6/35")

        assert response.status_code == 200
        data = response.json()

        # Should have verse information
        verse_data = data["verse"]
        assert verse_data["verse_id"] == "6.35"
        assert "sanskrit" in verse_data
        assert "english" in verse_data
        assert verse_data["theme"] == "mind_control"


class TestTemplateResponsesGitaBased:
    """Test that template responses (when OpenAI unavailable) stay yogic and reference-free"""

    @pytest.mark.asyncio
    async def test_template_response_has_gita_structure(
        self, test_client: AsyncClient, test_db: AsyncSession, monkeypatch
    ):
        """Test template responses follow structure without explicit references"""
        # Force template response by setting invalid OpenAI key
        monkeypatch.setenv("OPENAI_API_KEY", "invalid-key-for-testing")

        verse = WisdomVerse(
            verse_id="2.47",
            chapter=2,
            verse_number=47,
            theme="action_without_attachment",
            english="You have the right to perform your duties, but not to the fruits",
            hindi="कर्म में अधिकार है",
            sanskrit="कर्मण्येवाधिकारस्ते",
            context="Karma Yoga",
            mental_health_applications={"applications": ["anxiety"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "I'm worried about results",
                "language": "english",
            },
        )

        assert response.status_code == 200
        data = response.json()
        wisdom_response = data["response"].lower()

        # Template response should still have structure
        assert "**ancient wisdom principle:**" in wisdom_response
        assert "**practical steps:**" in wisdom_response
        assert any(term in wisdom_response for term in yogic_terms)
        assert not any(term in wisdom_response for term in blocked_terms)

    @pytest.mark.asyncio
    async def test_empty_verses_template_has_gita_foundation(
        self, test_client: AsyncClient, test_db: AsyncSession, monkeypatch
    ):
        """Test that even with no verses, template response is yogic and reference-free"""
        monkeypatch.setenv("OPENAI_API_KEY", "invalid-key-for-testing")

        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "Some very obscure question",
                "language": "english",
            },
        )

        # Might return 404 if no verses found, which is acceptable
        # Or might return 200 with fallback response
        if response.status_code == 200:
            data = response.json()
            wisdom_response = data.get("response", "").lower()

            assert any(term in wisdom_response for term in yogic_terms)
            assert not any(term in wisdom_response for term in blocked_terms)


class TestResponseValidation:
    """Test response validation for Gita-inspired adherence"""

    def test_valid_response_structure(self):
        """Test that properly structured responses are valid"""
        from backend.services.wisdom_engine import validate_gita_response

        valid_response = """**Ancient Wisdom Principle:** Karma-yoga invites steady action without attachment.

**Modern Application:** Apply this to your work stress by focusing on effort over outcome.

**Practical Steps:**
1. Focus on your duties (svadharma)
2. Release attachment to outcomes
3. Practice daily breathwork before action

**Deeper Understanding:** Peace grows from equanimity and selfless action."""

        assert validate_gita_response(valid_response) is True

    def test_invalid_response_missing_sections(self):
        """Test that responses missing sections are invalid"""
        from backend.services.wisdom_engine import validate_gita_response

        invalid_response = """**Ancient Wisdom Principle:** Steady effort matters.

**Modern Application:** This helps you.

No other sections provided."""

        assert validate_gita_response(invalid_response) is False

    def test_invalid_response_contains_references(self):
        """Test that responses with scripture references are invalid"""
        from backend.services.wisdom_engine import validate_gita_response

        invalid_response = """**Ancient Wisdom Principle:** The Bhagavad Gita 2.47 teaches Karma Yoga.

**Modern Application:** Apply this to your life.

**Practical Steps:**
1. Do this
2. Do that

**Deeper Understanding:** Generic philosophy here."""

        assert validate_gita_response(invalid_response) is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
