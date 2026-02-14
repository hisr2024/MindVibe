"""
Unit tests for KarmaResetService.

Tests the service layer for KIAAN integration with karma reset,
including verse retrieval, context building, and validation.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from backend.services.karma_reset_service import KarmaResetService


class TestKarmaResetService:
    """Test KarmaResetService methods."""

    def setup_method(self):
        """Set up test fixtures."""
        self.service = KarmaResetService()

    def test_normalize_repair_type_apology(self):
        """Test normalizing apology variations."""
        assert self.service._normalize_repair_type("apology") == "apology"
        assert self.service._normalize_repair_type("Apology") == "apology"
        assert self.service._normalize_repair_type("APOLOGY") == "apology"
        assert self.service._normalize_repair_type("apologize") == "apology"

    def test_normalize_repair_type_clarification(self):
        """Test normalizing clarification variations."""
        assert self.service._normalize_repair_type("clarification") == "clarification"
        assert self.service._normalize_repair_type("Clarification") == "clarification"
        assert self.service._normalize_repair_type("clarify") == "clarification"

    def test_normalize_repair_type_calm_followup(self):
        """Test normalizing calm follow-up variations."""
        assert self.service._normalize_repair_type("calm_followup") == "calm_followup"
        assert self.service._normalize_repair_type("Calm follow-up") == "calm_followup"
        assert self.service._normalize_repair_type("calm follow up") == "calm_followup"
        assert self.service._normalize_repair_type("Calm-follow-up") == "calm_followup"

    def test_normalize_repair_type_self_forgive(self):
        """Test normalizing self-forgive variations."""
        assert self.service._normalize_repair_type("self-forgive") == "self-forgive"
        assert self.service._normalize_repair_type("self forgive") == "self-forgive"

    @pytest.mark.asyncio
    async def test_get_reset_verses_apology(self):
        """Test verse retrieval for apology type."""
        # Mock database and wisdom_kb
        mock_db = AsyncMock()
        
        mock_verses = [
            {
                "verse": {"verse_id": "12.13", "theme": "forgiveness"},
                "score": 0.85,
                "sanitized_text": "One who is not envious..."
            },
            {
                "verse": {"verse_id": "16.1", "theme": "virtues"},
                "score": 0.80,
                "sanitized_text": "Fearlessness, purity of heart..."
            }
        ]
        
        with patch.object(
            self.service._wisdom_kb,
            'search_relevant_verses_full_db',
            new_callable=AsyncMock,
            return_value=mock_verses
        ):
            verses = await self.service.get_reset_verses(
                db=mock_db,
                repair_type="apology",
                situation="I was harsh to my friend",
                limit=5
            )
            
            assert len(verses) == 2
            assert verses[0]["score"] == 0.85
            assert "forgiveness" in verses[0]["verse"]["theme"]

    @pytest.mark.asyncio
    async def test_get_reset_verses_clarification(self):
        """Test verse retrieval for clarification type."""
        mock_db = AsyncMock()
        
        mock_verses = [
            {
                "verse": {"verse_id": "17.15", "theme": "communication"},
                "score": 0.88,
                "sanitized_text": "Words that cause no distress..."
            }
        ]
        
        with patch.object(
            self.service._wisdom_kb,
            'search_relevant_verses_full_db',
            new_callable=AsyncMock,
            return_value=mock_verses
        ):
            verses = await self.service.get_reset_verses(
                db=mock_db,
                repair_type="clarification",
                situation="I was misunderstood",
                limit=5
            )
            
            assert len(verses) == 1
            assert "communication" in verses[0]["verse"]["theme"]

    @pytest.mark.asyncio
    async def test_get_reset_verses_handles_errors(self):
        """Test that get_reset_verses handles errors gracefully."""
        mock_db = AsyncMock()
        
        with patch.object(
            self.service._wisdom_kb,
            'search_relevant_verses_full_db',
            new_callable=AsyncMock,
            side_effect=Exception("Database error")
        ):
            verses = await self.service.get_reset_verses(
                db=mock_db,
                repair_type="apology",
                situation="Test",
                limit=5
            )
            
            # Should return empty list on error
            assert verses == []

    def test_build_gita_context_with_verses(self):
        """Test building wisdom context from verse results."""
        verse_results = [
            {
                "verse": {"verse_id": "12.13"},
                "score": 0.85,
                "sanitized_text": "One who is not envious but a kind friend to all"
            },
            {
                "verse": {"verse_id": "16.1"},
                "score": 0.80,
                "sanitized_text": "Fearlessness, purity of heart, steadfastness"
            }
        ]
        
        context = self.service.build_gita_context(
            verse_results=verse_results,
            repair_type="apology"
        )
        
        assert "Helpful insights for apology" in context
        assert "One who is not envious" in context
        assert "Fearlessness" in context

    def test_build_gita_context_empty_verses(self):
        """Test building context with no verses."""
        context = self.service.build_gita_context(
            verse_results=[],
            repair_type="apology"
        )
        
        assert context == ""

    def test_build_gita_context_limits_to_top_3(self):
        """Test that context only includes top 3 verses."""
        verse_results = [
            {"verse": {"verse_id": f"{i}.1"}, "score": 0.9 - i*0.1, "sanitized_text": f"Verse {i}"}
            for i in range(1, 6)
        ]
        
        context = self.service.build_gita_context(
            verse_results=verse_results,
            repair_type="apology"
        )
        
        # Should only have first 3 verses
        assert "Verse 1" in context
        assert "Verse 2" in context
        assert "Verse 3" in context
        assert "Verse 4" not in context
        assert "Verse 5" not in context

    @pytest.mark.asyncio
    async def test_validate_reset_guidance_valid(self):
        """Test validation of valid reset guidance."""
        guidance = {
            "breathingLine": "Take four slow breaths and center yourself in dharma.",
            "rippleSummary": "Your words created a ripple that disturbed the peace of another.",
            "repairAction": "Offer a sincere apology rooted in compassion and awareness.",
            "forwardIntention": "Move forward with equanimity and wisdom in your actions."
        }
        
        mock_validation = {
            "is_valid": True,
            "issues": [],
            "gita_score": 0.85,
            "gita_terms_found": ["dharma", "peace", "compassion", "awareness", "equanimity", "wisdom"]
        }
        
        with patch.object(
            self.service._validator,
            'validate_response',
            return_value=mock_validation
        ):
            result = await self.service.validate_reset_guidance(
                guidance=guidance,
                verse_context="Some context"
            )
            
            assert result["valid"] is True
            assert result["score"] == 0.85
            assert len(result["gita_terms_found"]) > 0
            assert "dharma" in result["gita_terms_found"]

    @pytest.mark.asyncio
    async def test_validate_reset_guidance_short_text(self):
        """Test validation with text too short."""
        guidance = {
            "breathingLine": "Breathe.",
            "rippleSummary": "Oops.",
            "repairAction": "Sorry.",
            "forwardIntention": "Better."
        }
        
        result = await self.service.validate_reset_guidance(
            guidance=guidance,
            verse_context=""
        )
        
        # Should skip validation for short text
        assert result["valid"] is True
        assert "note" in result
        assert "too short" in result["note"]

    @pytest.mark.asyncio
    async def test_validate_reset_guidance_handles_errors(self):
        """Test validation handles errors gracefully."""
        guidance = {
            "breathingLine": "Take a deep breath and find your center in this moment of reflection.",
            "rippleSummary": "Your actions created an impact that needs acknowledgment.",
            "repairAction": "Reach out with sincerity and compassion.",
            "forwardIntention": "Move forward with greater awareness and mindfulness."
        }
        
        with patch.object(
            self.service._validator,
            'validate_response',
            side_effect=Exception("Validation error")
        ):
            result = await self.service.validate_reset_guidance(
                guidance=guidance,
                verse_context="Some context"
            )
            
            # Should return valid=True to not block user
            assert result["valid"] is True
            assert len(result["issues"]) > 0
            assert "error" in result["issues"][0].lower()

    def test_get_repair_theme_suggestions_apology(self):
        """Test getting theme suggestions for apology."""
        themes = self.service.get_repair_theme_suggestions("apology")
        
        assert "forgiveness" in themes
        assert "humility" in themes
        assert "compassion" in themes

    def test_get_repair_theme_suggestions_clarification(self):
        """Test getting theme suggestions for clarification."""
        themes = self.service.get_repair_theme_suggestions("clarification")
        
        assert "truth" in themes
        assert "communication" in themes
        assert "clarity" in themes

    def test_get_repair_theme_suggestions_calm_followup(self):
        """Test getting theme suggestions for calm follow-up."""
        themes = self.service.get_repair_theme_suggestions("calm_followup")
        
        assert "equanimity" in themes
        assert "peace" in themes
        assert "emotional_balance" in themes

    def test_get_repair_theme_suggestions_unknown(self):
        """Test getting theme suggestions for unknown type."""
        themes = self.service.get_repair_theme_suggestions("unknown_type")
        
        # Should return default themes
        assert "compassion" in themes
        assert "wisdom" in themes

    def test_get_repair_applications_apology(self):
        """Test getting application tags for apology."""
        apps = self.service.get_repair_applications("apology")
        
        assert "forgiveness" in apps
        assert "compassion" in apps
        assert "humility" in apps

    def test_get_repair_applications_clarification(self):
        """Test getting application tags for clarification."""
        apps = self.service.get_repair_applications("clarification")
        
        assert "clear_communication" in apps
        assert "truth" in apps
        assert "understanding" in apps

    def test_get_repair_applications_calm_followup(self):
        """Test getting application tags for calm follow-up."""
        apps = self.service.get_repair_applications("calm_followup")
        
        assert "emotional_balance" in apps
        assert "peace" in apps
        assert "equanimity" in apps

    def test_repair_type_mappings_complete(self):
        """Test that all repair types have complete mappings."""
        repair_types = ["apology", "clarification", "calm_followup", "self-forgive"]
        
        for repair_type in repair_types:
            # Should have theme mappings
            themes = self.service.get_repair_theme_suggestions(repair_type)
            assert len(themes) > 0
            
            # Should have application mappings
            apps = self.service.get_repair_applications(repair_type)
            assert len(apps) > 0
