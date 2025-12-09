"""
Integration tests for Karma Reset KIAAN Integration.

Tests the new /api/karma-reset/kiaan/generate endpoint with enhanced
KIAAN wisdom engine integration and metadata.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, AsyncMock

from backend.models import GitaVerse


class TestKarmaResetKiaanIntegration:
    """Test the /api/karma-reset/kiaan/generate endpoint with KIAAN metadata."""

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_returns_metadata(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that KIAAN endpoint returns metadata about verses and validation."""
        # Create test verses
        verse1 = GitaVerse(
            chapter=16,
            verse=1,
            sanskrit="अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः",
            hindi="निडरता, मन की पवित्रता",
            english="Fearlessness, purity of heart, steadfastness in knowledge",
            principle="Cultivating virtues like humility",
            theme="virtues",
            mental_health_applications=["humility", "self_awareness"],
        )
        verse2 = GitaVerse(
            chapter=12,
            verse=13,
            sanskrit="अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च",
            hindi="सभी प्राणियों के प्रति द्वेष रहित",
            english="One who is not envious but a kind friend to all",
            principle="Practicing forgiveness and compassion",
            theme="forgiveness",
            mental_health_applications=["forgiveness", "compassion"],
        )
        test_db.add_all([verse1, verse2])
        await test_db.commit()

        # Make request to KIAAN endpoint
        response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "I snapped at my colleague",
                "feeling": "My teammate",
                "repair_type": "apology",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Verify basic structure
        assert "reset_guidance" in data
        assert "kiaan_metadata" in data
        assert "_meta" in data

        # Verify metadata fields
        metadata = data["kiaan_metadata"]
        assert "verses_used" in metadata
        assert "verses" in metadata
        assert "validation_passed" in metadata
        assert "validation_score" in metadata
        assert "gita_terms_found" in metadata
        assert "wisdom_context" in metadata

        # Verify verses_used is a number
        assert isinstance(metadata["verses_used"], int)
        assert metadata["verses_used"] >= 0

        # Verify validation_score is a float
        assert isinstance(metadata["validation_score"], (int, float))
        assert 0.0 <= metadata["validation_score"] <= 1.0

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_apology_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that apology type retrieves forgiveness-related verses."""
        # Create forgiveness verses
        verse1 = GitaVerse(
            chapter=12,
            verse=13,
            sanskrit="अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च",
            hindi="सभी प्राणियों के प्रति द्वेष रहित",
            english="One who is not envious but a kind friend to all creatures",
            principle="Practicing forgiveness and compassion toward all",
            theme="forgiveness",
            mental_health_applications=["forgiveness", "compassion"],
        )
        verse2 = GitaVerse(
            chapter=16,
            verse=1,
            sanskrit="अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः",
            hindi="निडरता, मन की पवित्रता",
            english="Fearlessness, purity of heart, steadfastness",
            principle="Cultivating virtues like humility and purity",
            theme="virtues",
            mental_health_applications=["humility", "self_awareness"],
        )
        test_db.add_all([verse1, verse2])
        await test_db.commit()

        response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "I was harsh with a friend",
                "feeling": "My friend",
                "repair_type": "apology",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Should have retrieved verses
        metadata = data["kiaan_metadata"]
        assert metadata["verses_used"] > 0

        # Check verses array contains verse info
        if len(metadata["verses"]) > 0:
            verse_info = metadata["verses"][0]
            assert "verse_id" in verse_info
            assert "score" in verse_info
            assert "theme" in verse_info
            assert "sanitized_text" in verse_info

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_clarification_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that clarification type retrieves communication-related verses."""
        # Create communication verses
        verse = GitaVerse(
            chapter=17,
            verse=15,
            sanskrit="अनुद्वेगकरं वाक्यं सत्यं प्रियहितं च यत्",
            hindi="जो वचन उद्वेग न करने वाला, सत्य",
            english="Words that cause no distress, truthful, pleasant and beneficial",
            principle="Speaking truth with kindness and clarity",
            theme="communication",
            mental_health_applications=["clear_communication", "truth"],
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "My message was misunderstood",
                "feeling": "A friend",
                "repair_type": "clarification",
            },
        )

        assert response.status_code == 200
        data = response.json()
        
        # Should have KIAAN metadata
        assert "kiaan_metadata" in data
        assert data["kiaan_metadata"]["verses_used"] >= 0

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_calm_followup_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that calm follow-up type retrieves equanimity verses."""
        # Create equanimity verses
        verse = GitaVerse(
            chapter=2,
            verse=48,
            sanskrit="योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा",
            hindi="आसक्ति को छोड़कर योग में स्थित होकर",
            english="Perform your duty equipoised, abandoning attachment",
            principle="Maintaining equanimity and emotional balance",
            theme="equanimity",
            mental_health_applications=["emotional_balance", "peace"],
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "I sent a frustrated text",
                "feeling": "My partner",
                "repair_type": "calm_followup",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "kiaan_metadata" in data

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_validation_results(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that validation results are included in metadata."""
        # Create test verses
        verse = GitaVerse(
            chapter=12,
            verse=13,
            sanskrit="अद्वेष्टा सर्वभूतानां",
            hindi="सभी प्राणियों के प्रति",
            english="One who is not envious but a kind friend",
            principle="Compassion toward all",
            theme="compassion",
            mental_health_applications=["compassion"],
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "I was impatient",
                "feeling": "Customer",
                "repair_type": "apology",
            },
        )

        assert response.status_code == 200
        data = response.json()

        metadata = data["kiaan_metadata"]
        
        # Validation fields should be present
        assert "validation_passed" in metadata
        assert isinstance(metadata["validation_passed"], bool)
        
        assert "validation_score" in metadata
        assert isinstance(metadata["validation_score"], (int, float))
        
        # Gita terms found (may be empty list)
        assert "gita_terms_found" in metadata
        assert isinstance(metadata["gita_terms_found"], list)

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_fallback_no_verses(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that KIAAN endpoint works even with no verses in database."""
        # Don't add any verses
        
        response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "I was rude",
                "feeling": "A stranger",
                "repair_type": "apology",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Should still return guidance
        assert "reset_guidance" in data
        assert "kiaan_metadata" in data
        
        # Metadata should show 0 verses used
        assert data["kiaan_metadata"]["verses_used"] == 0

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_required_guidance_keys(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that all required guidance keys are present."""
        response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "I made a mistake",
                "feeling": "Team",
                "repair_type": "apology",
            },
        )

        assert response.status_code == 200
        data = response.json()

        guidance = data["reset_guidance"]
        
        # All 4 keys must be present
        assert "breathingLine" in guidance
        assert "rippleSummary" in guidance
        assert "repairAction" in guidance
        assert "forwardIntention" in guidance
        
        # All should have non-empty values
        assert len(guidance["breathingLine"]) > 0
        assert len(guidance["rippleSummary"]) > 0
        assert len(guidance["repairAction"]) > 0
        assert len(guidance["forwardIntention"]) > 0

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_meta_information(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that _meta information is included and accurate."""
        response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "I was late",
                "feeling": "My friend",
                "repair_type": "apology",
            },
        )

        assert response.status_code == 200
        data = response.json()

        meta = data["_meta"]
        
        # Meta fields
        assert "request_id" in meta
        assert "processing_time_ms" in meta
        assert "model_used" in meta
        assert "kiaan_enhanced" in meta
        
        # Verify types
        assert isinstance(meta["request_id"], str)
        assert isinstance(meta["processing_time_ms"], int)
        assert isinstance(meta["model_used"], str)
        assert meta["kiaan_enhanced"] is True

    @pytest.mark.asyncio
    async def test_kiaan_endpoint_different_from_original(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that KIAAN endpoint is different from original endpoint."""
        # Both endpoints should exist and work independently
        
        # Original endpoint
        original_response = await test_client.post(
            "/api/karma-reset/generate",
            json={
                "situation": "Test situation",
                "feeling": "Someone",
                "repair_type": "apology",
            },
        )
        
        # KIAAN endpoint
        kiaan_response = await test_client.post(
            "/api/karma-reset/kiaan/generate",
            json={
                "situation": "Test situation",
                "feeling": "Someone",
                "repair_type": "apology",
            },
        )
        
        # Both should succeed
        assert original_response.status_code == 200
        assert kiaan_response.status_code == 200
        
        # KIAAN should have metadata that original doesn't
        original_data = original_response.json()
        kiaan_data = kiaan_response.json()
        
        assert "kiaan_metadata" in kiaan_data
        assert "kiaan_metadata" not in original_data

    @pytest.mark.asyncio
    async def test_kiaan_karma_reset_handles_various_repair_types(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that all repair type variations are handled correctly."""
        repair_types = ["apology", "clarification", "calm_followup", "Apology", "Calm follow-up"]
        
        for repair_type in repair_types:
            response = await test_client.post(
                "/api/karma-reset/kiaan/generate",
                json={
                    "situation": "Test situation",
                    "feeling": "Someone",
                    "repair_type": repair_type,
                },
            )
            
            assert response.status_code == 200, f"Failed for repair_type: {repair_type}"
            data = response.json()
            assert "reset_guidance" in data
            assert "kiaan_metadata" in data

    @pytest.mark.asyncio
    async def test_kiaan_health_endpoint(
        self, test_client: AsyncClient
    ):
        """Test the KIAAN health check endpoint."""
        response = await test_client.get("/api/karma-reset/kiaan/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "service" in data
        assert data["service"] == "karma-reset-kiaan"
        assert "version" in data
