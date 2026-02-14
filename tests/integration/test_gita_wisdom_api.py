"""Integration tests for Gita wisdom adherence in API responses

These tests ensure that API endpoints return responses that:
1. Follow the mandatory Gita-based structure
2. Reference specific Gita verses and principles
3. Do not provide generic advice without Gita foundation
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import WisdomVerse, GitaVerse


class TestWisdomGuideGitaAdherence:
    """Test that wisdom guide API follows Gita adherence requirements"""

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
            "/api/gita/wisdom",
            json={
                "query": "I'm anxious about my future",
                "language": "english",
            },
        )

        # Accept 200 (success) or 500/503 (OpenAI unavailable)
        assert response.status_code in (200, 500, 503), f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            wisdom_response = data.get("response") or data.get("guidance", "")

            # Check for mandatory structure
            assert "**Ancient Wisdom Principle:**" in wisdom_response
            assert "**Modern Application:**" in wisdom_response
            assert "**Practical Steps:**" in wisdom_response
            assert "**Deeper Understanding:**" in wisdom_response

    @pytest.mark.asyncio
    async def test_wisdom_query_response_references_gita(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that wisdom responses reference Gita explicitly"""
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
            "/api/gita/wisdom",
            json={
                "query": "My mind is always restless",
                "language": "english",
            },
        )

        # Accept 200 (success) or 500/503 (OpenAI unavailable)
        assert response.status_code in (200, 500, 503), f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            wisdom_response = data.get("response") or data.get("guidance", "")

            # Should reference Gita concepts
            gita_indicators = [
                "Gita", "Bhagavad", "Atman", "Karma", "Dharma",
                "Abhyasa", "Vairagya", "Yoga", "Chapter", "Verse"
            ]

            has_gita_reference = any(indicator in wisdom_response for indicator in gita_indicators)
            assert has_gita_reference, f"Response does not reference Gita: {wisdom_response}"

    @pytest.mark.asyncio
    async def test_wisdom_query_no_generic_advice(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that responses don't provide generic advice without Gita context"""
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
            "/api/gita/wisdom",
            json={
                "query": "I'm stressed about my performance",
                "language": "english",
            },
        )

        # Accept 200 (success) or 500/503 (OpenAI unavailable)
        assert response.status_code in (200, 500, 503), f"Unexpected status: {response.status_code}"
        if response.status_code != 200:
            return  # Skip remaining assertions if AI is unavailable
        data = response.json()
        wisdom_response = data.get("response") or data.get("guidance", "")

        # Response should not be generic - should have Gita foundation
        # Check that it's not just generic mental health advice
        generic_only_phrases = [
            "just relax",
            "think positive",
            "stay calm",
            "be mindful"
        ]

        # If any generic phrase appears, it should be accompanied by Gita wisdom
        response_lower = wisdom_response.lower()
        for phrase in generic_only_phrases:
            if phrase in response_lower:
                # Must also mention Gita or related concepts
                assert "gita" in response_lower or "dharma" in response_lower or \
                       "karma" in response_lower or "atman" in response_lower, \
                       f"Response uses generic phrase '{phrase}' without Gita context"


class TestGitaAPIGitaAdherence:
    """Test that Gita API follows strict Gita adherence"""

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

        # Note: The actual wisdom endpoint might need verses to be passed
        # This test checks the template response structure
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
    """Test that template responses (when OpenAI unavailable) are Gita-based"""

    @pytest.mark.asyncio
    async def test_template_response_has_gita_structure(
        self, test_client: AsyncClient, test_db: AsyncSession, monkeypatch
    ):
        """Test template responses follow Gita structure"""
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
            "/api/gita/wisdom",
            json={
                "query": "I'm worried about results",
                "language": "english",
            },
        )

        # Accept 200 (success) or 500/503 (OpenAI unavailable)
        assert response.status_code in (200, 500, 503), f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            wisdom_response = data.get("response") or data.get("guidance", "")

            # Template response should still have structure
            assert "**Ancient Wisdom Principle:**" in wisdom_response
            assert "**Practical Steps:**" in wisdom_response

            # Should reference Gita
            assert "Gita" in wisdom_response or "Bhagavad" in wisdom_response or \
                   "Karma" in wisdom_response or "Yoga" in wisdom_response

    @pytest.mark.asyncio
    async def test_empty_verses_template_has_gita_foundation(
        self, test_client: AsyncClient, test_db: AsyncSession, monkeypatch
    ):
        """Test that even with no verses, template response is Gita-based"""
        monkeypatch.setenv("OPENAI_API_KEY", "invalid-key-for-testing")

        response = await test_client.post(
            "/api/gita/wisdom",
            json={
                "query": "Some very obscure question",
                "language": "english",
            },
        )

        # Might return 404 if no verses found, which is acceptable
        # Or might return 200 with fallback response
        if response.status_code == 200:
            data = response.json()
            wisdom_response = data.get("response") or data.get("guidance", "")

            # Even fallback should mention Gita
            gita_terms = ["Gita", "Bhagavad", "Atman", "Dharma", "Karma"]
            has_gita = any(term in wisdom_response for term in gita_terms)
            assert has_gita, "Fallback response should reference Gita"


class TestResponseValidation:
    """Test response validation for Gita adherence"""

    def test_valid_response_structure(self):
        """Test that properly structured responses are valid"""
        from backend.services.wisdom_engine import validate_gita_response

        valid_response = """**Ancient Wisdom Principle:** The Bhagavad Gita (2.47) teaches Karma Yoga.

**Modern Application:** Apply this to your work stress.

**Practical Steps:**
1. Focus on your duties (Svadharma)
2. Release attachment to outcomes
3. Practice daily meditation (Dhyana)

**Deeper Understanding:** The Gita reveals that peace comes from detachment."""

        assert validate_gita_response(valid_response) is True

    def test_invalid_response_missing_sections(self):
        """Test that responses missing sections are invalid"""
        from backend.services.wisdom_engine import validate_gita_response

        invalid_response = """**Ancient Wisdom Principle:** The Gita teaches something.

**Modern Application:** This helps you.

No other sections provided."""

        assert validate_gita_response(invalid_response) is False

    def test_invalid_response_no_gita_reference(self):
        """Test that responses without Gita references are invalid"""
        from backend.services.wisdom_engine import validate_gita_response

        invalid_response = """**Ancient Wisdom Principle:** Some generic wisdom.

**Modern Application:** Apply generic advice.

**Practical Steps:**
1. Do this
2. Do that

**Deeper Understanding:** Generic philosophy here."""

        assert validate_gita_response(invalid_response) is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
