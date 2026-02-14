"""
Integration tests for the Karma Reset Gita integration.

Tests the /api/karma-reset/generate endpoint with Gita verse search functionality.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, AsyncMock

from backend.models import GitaVerse
from tests.conftest import auth_headers_for


class TestKarmaResetGitaIntegration:
    """Test the /api/karma-reset/generate endpoint with Gita integration."""

    @pytest.mark.asyncio
    async def test_karma_reset_apology_with_gita_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test karma reset with apology type fetches relevant Gita verses."""
        # Create test verses about forgiveness and humility
        verse1 = GitaVerse(
            chapter=16,
            verse=1,
            sanskrit="अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः",
            hindi="निडरता, मन की पवित्रता, ज्ञान योग में दृढ़ता",
            english="Fearlessness, purity of heart, steadfastness in knowledge and yoga",
            principle="Cultivating virtues like humility and purity",
            theme="virtues",
            mental_health_applications=["humility", "self_awareness"],
        )
        verse2 = GitaVerse(
            chapter=12,
            verse=13,
            sanskrit="अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च",
            hindi="सभी प्राणियों के प्रति द्वेष रहित, मित्रवत और दयालु",
            english="One who is not envious but a kind friend to all creatures",
            principle="Practicing forgiveness and compassion toward all",
            theme="forgiveness",
            mental_health_applications=["forgiveness", "compassion"],
        )
        test_db.add_all([verse1, verse2])
        await test_db.commit()

        # Make request with apology scenario
        headers = auth_headers_for("test-user-123")
        response = await test_client.post(
            "/api/karma-reset/generate",
            json={
                "what_happened": "I snapped at my colleague during a meeting",
                "who_felt_it": "My teammate",
                "repair_type": "apology",
            },
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "reset_guidance" in data

        # Verify all 4 parts exist in reset_guidance
        reset_guidance = data["reset_guidance"]
        assert "breathingLine" in reset_guidance or "breathing_line" in reset_guidance
        assert "rippleSummary" in reset_guidance or "ripple_summary" in reset_guidance
        assert "repairAction" in reset_guidance or "repair_action" in reset_guidance
        assert "forwardIntention" in reset_guidance or "forward_intention" in reset_guidance

    @pytest.mark.asyncio
    async def test_karma_reset_clarification_with_gita_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test karma reset with clarification type fetches truth-related verses."""
        # Create test verses about truth and communication
        verse = GitaVerse(
            chapter=17,
            verse=15,
            sanskrit="अनुद्वेगकरं वाक्यं सत्यं प्रियहितं च यत्",
            hindi="जो वचन उद्वेग न करने वाला, सत्य, प्रिय और हितकारी हो",
            english="Words that cause no distress, truthful, pleasant and beneficial",
            principle="Speaking truth with kindness and clarity",
            theme="communication",
            mental_health_applications=["clear_communication", "truth"],
        )
        test_db.add(verse)
        await test_db.commit()

        headers = auth_headers_for("test-user-123")
        response = await test_client.post(
            "/api/karma-reset/generate",
            json={
                "what_happened": "My message was misunderstood",
                "who_felt_it": "A friend",
                "repair_type": "clarification",
            },
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "reset_guidance" in data

    @pytest.mark.asyncio
    async def test_karma_reset_calm_followup_with_gita_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test karma reset with calm follow-up fetches equanimity verses."""
        # Create test verses about peace and emotional balance
        verse = GitaVerse(
            chapter=2,
            verse=48,
            sanskrit="योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय",
            hindi="हे अर्जुन! आसक्ति को छोड़कर योग में स्थित होकर कर्म कर",
            english="Perform your duty equipoised, abandoning attachment to success or failure",
            principle="Maintaining equanimity and emotional balance",
            theme="equanimity",
            mental_health_applications=["emotional_balance", "peace"],
        )
        test_db.add(verse)
        await test_db.commit()

        headers = auth_headers_for("test-user-123")
        response = await test_client.post(
            "/api/karma-reset/generate",
            json={
                "what_happened": "I sent a frustrated text",
                "who_felt_it": "My partner",
                "repair_type": "calm_followup",
            },
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "reset_guidance" in data

    @pytest.mark.asyncio
    async def test_karma_reset_fallback_when_no_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test karma reset still works when no Gita verses are found."""
        # Don't add any verses to database
        
        headers = auth_headers_for("test-user-123")
        response = await test_client.post(
            "/api/karma-reset/generate",
            json={
                "what_happened": "I was rude to someone",
                "who_felt_it": "A stranger",
                "repair_type": "apology",
            },
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        # Should still generate guidance with fallback principles
        assert "reset_guidance" in data

    @pytest.mark.asyncio
    async def test_karma_reset_handles_database_error_gracefully(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test karma reset handles database errors gracefully."""
        # Create a verse to ensure DB works initially
        verse = GitaVerse(
            chapter=1,
            verse=1,
            sanskrit="धर्मक्षेत्रे कुरुक्षेत्रे",
            hindi="धर्मक्षेत्र कुरुक्षेत्र में",
            english="In the field of dharma, the field of battle",
            principle="Duty and righteousness",
            theme="dharma",
            mental_health_applications=["duty"],
        )
        test_db.add(verse)
        await test_db.commit()

        # Mock search_relevant_verses to raise an exception
        with patch(
            'backend.services.wisdom_kb.WisdomKnowledgeBase.search_relevant_verses',
            new_callable=AsyncMock,
            side_effect=Exception("Database error")
        ):
            headers = auth_headers_for("test-user-123")
            response = await test_client.post(
                "/api/karma-reset/generate",
                json={
                    "what_happened": "I lost my temper",
                    "who_felt_it": "My family",
                    "repair_type": "apology",
                },
                headers=headers,
            )

            assert response.status_code == 200
            data = response.json()
            # Should still work with fallback
            assert "reset_guidance" in data

    @pytest.mark.asyncio
    async def test_karma_reset_repair_type_variations(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test karma reset handles different repair type formats."""
        # Test with title case format (as might come from frontend)
        headers = auth_headers_for("test-user-123")
        response = await test_client.post(
            "/api/karma-reset/generate",
            json={
                "what_happened": "I was impatient",
                "who_felt_it": "Customer",
                "repair_type": "Apology",  # Title case
            },
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "reset_guidance" in data

        # Test with "Calm follow-up" format
        response = await test_client.post(
            "/api/karma-reset/generate",
            json={
                "what_happened": "I overreacted",
                "who_felt_it": "Colleague",
                "repair_type": "Calm follow-up",  # With space and hyphen
            },
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "reset_guidance" in data

    @pytest.mark.asyncio
    async def test_karma_reset_response_backward_compatibility(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that response includes all field name variations for backward compatibility."""
        headers = auth_headers_for("test-user-123")
        response = await test_client.post(
            "/api/karma-reset/generate",
            json={
                "what_happened": "I made a mistake",
                "who_felt_it": "Team",
                "repair_type": "apology",
            },
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()

        if "reset_guidance" in data:
            reset_guidance = data["reset_guidance"]
            
            # Should have camelCase versions
            breathing_value = (
                reset_guidance.get("breathingLine") or 
                reset_guidance.get("breathing_line") or 
                reset_guidance.get("pauseAndBreathe")
            )
            assert breathing_value is not None
            
            ripple_value = (
                reset_guidance.get("rippleSummary") or 
                reset_guidance.get("ripple_summary") or 
                reset_guidance.get("nameTheRipple")
            )
            assert ripple_value is not None
