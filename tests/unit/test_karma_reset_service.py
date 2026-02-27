"""
Unit tests for KarmaResetService.

Tests the service layer for KIAAN integration with karma reset,
including verse retrieval, context building, validation, and
the new deep karmic path system.
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

    # ==================== Karmic Path Tests ====================

    def test_resolve_karmic_path_direct(self):
        """Test resolving karmic path by direct key."""
        path = self.service.resolve_karmic_path("kshama")
        assert path["name"] == "Kshama - The Path of Forgiveness"
        assert path["sanskrit_name"] == "क्षमा मार्ग"

    def test_resolve_karmic_path_legacy_apology(self):
        """Test resolving karmic path from legacy 'apology' type."""
        path = self.service.resolve_karmic_path("apology")
        assert "Kshama" in path["name"]
        assert path["repair_type_legacy"] == "apology"

    def test_resolve_karmic_path_legacy_clarification(self):
        """Test resolving karmic path from legacy 'clarification' type."""
        path = self.service.resolve_karmic_path("clarification")
        assert "Satya" in path["name"]
        assert path["repair_type_legacy"] == "clarification"

    def test_resolve_karmic_path_legacy_calm_followup(self):
        """Test resolving karmic path from legacy 'calm_followup' type."""
        path = self.service.resolve_karmic_path("calm_followup")
        assert "Shanti" in path["name"]

    def test_resolve_karmic_path_unknown_defaults_to_kshama(self):
        """Test that unknown path defaults to kshama."""
        path = self.service.resolve_karmic_path("unknown_type")
        assert "Kshama" in path["name"]

    def test_resolve_all_10_paths(self):
        """Test that all 10 karmic paths can be resolved."""
        path_keys = [
            "kshama", "satya", "shanti", "atma_kshama", "seva",
            "ahimsa", "daya", "tyaga", "tapas", "shraddha"
        ]
        for key in path_keys:
            path = self.service.resolve_karmic_path(key)
            assert path is not None
            assert "name" in path
            assert "core_verse" in path
            assert "sadhana" in path
            assert len(path["sadhana"]) > 0

    def test_get_available_paths_returns_all_10(self):
        """Test that get_available_paths returns all 10 paths."""
        paths = self.service.get_available_paths()
        assert len(paths) == 10
        keys = [p["key"] for p in paths]
        assert "kshama" in keys
        assert "shraddha" in keys

    def test_get_phase_definitions_returns_7(self):
        """Test that get_phase_definitions returns 7 phases."""
        phases = self.service.get_phase_definitions()
        assert len(phases) == 7
        assert phases[0]["name"] == "Sthiti Pariksha"
        assert phases[6]["name"] == "Gita Darshan"

    # ==================== Verse Retrieval Tests ====================

    @pytest.mark.asyncio
    async def test_get_reset_verses_apology(self):
        """Test verse retrieval for apology type."""
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
    async def test_get_reset_verses_karmic_path(self):
        """Test verse retrieval for a karmic path key."""
        mock_db = AsyncMock()

        mock_verses = [
            {
                "verse": {"verse_id": "17.15", "theme": "truth"},
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
                repair_type="satya",
                situation="I was misunderstood",
                limit=5
            )

            assert len(verses) == 1

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

    # ==================== Context Building Tests ====================

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

        # Should contain deep karmic path wisdom
        assert "KARMIC PATH:" in context
        # Should contain the dynamically retrieved verse texts
        assert "One who is not envious" in context
        assert "Fearlessness" in context
        # Should contain the verse section header
        assert "ADDITIONAL RELEVANT VERSES" in context

    def test_build_gita_context_empty_verses(self):
        """Test building context with no verses."""
        context = self.service.build_gita_context(
            verse_results=[],
            repair_type="apology"
        )

        assert context == ""

    def test_build_gita_context_includes_verses(self):
        """Test that context includes verse text from results."""
        verse_results = [
            {"verse": {"verse_id": f"{i}.1"}, "score": 0.9 - i*0.1, "sanitized_text": f"Verse {i}"}
            for i in range(1, 6)
        ]

        context = self.service.build_gita_context(
            verse_results=verse_results,
            repair_type="apology"
        )

        # New service includes top 5 verses (not 3)
        assert "Verse 1" in context
        assert "Verse 2" in context
        assert "Verse 3" in context
        assert "Verse 4" in context
        assert "Verse 5" in context

    # ==================== Validation Tests ====================

    @pytest.mark.asyncio
    async def test_validate_reset_guidance_valid(self):
        """Test validation of valid reset guidance."""
        guidance = {
            "breathingLine": "Take four slow breaths and center yourself in dharma.",
            "rippleSummary": "Your words created a ripple that disturbed the peace of another.",
            "repairAction": "Offer a sincere apology rooted in compassion and awareness.",
            "forwardIntention": "Move forward with equanimity and wisdom in your actions."
        }

        # Mock validate_response to return tuple (bool, dict)
        mock_validation = (True, {
            "issues": [],
            "gita_terms_found": ["dharma", "peace", "compassion", "awareness", "equanimity", "wisdom"],
            "wisdom_markers_found": ["path", "wisdom"],
        })

        # Mock score_five_pillar_compliance
        mock_pillar = {
            "overall_score": 0.85,
            "pillar_scores": {"atman_prakriti": 0.7, "phala_tyaga": 0.8},
            "compliance_level": "8/10",
            "pillars_met": 4,
            "missing_pillars": ["ishvara_arpana"],
            "strong_pillars": ["phala_tyaga"],
        }

        with patch.object(
            self.service._validator,
            'validate_response',
            return_value=mock_validation
        ), patch.object(
            self.service._validator,
            'score_five_pillar_compliance',
            return_value=mock_pillar
        ):
            result = await self.service.validate_reset_guidance(
                guidance=guidance,
                verse_context="Some context"
            )

            assert result["valid"] is True
            assert result["five_pillar_score"] == 0.85
            assert result["compliance_level"] == "8/10"
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

    # ==================== Legacy Compatibility Tests ====================

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

    # ==================== Deep Reset Generation Tests ====================

    @pytest.mark.asyncio
    async def test_generate_deep_reset_returns_complete_data(self):
        """Test that generate_deep_reset returns all required fields."""
        mock_db = AsyncMock()

        mock_verses = [
            {
                "verse": {
                    "verse_id": "16.3",
                    "chapter": 16,
                    "verse": 3,
                    "theme": "divine_qualities",
                    "sanskrit": "test",
                    "transliteration": "test",
                    "english": "test",
                    "hindi": "test",
                },
                "score": 0.9,
                "sanitized_text": "Forgiveness is a divine quality"
            }
        ]

        with patch.object(
            self.service._wisdom_kb,
            'search_relevant_verses_full_db',
            new_callable=AsyncMock,
            return_value=mock_verses
        ):
            result = await self.service.generate_deep_reset(
                db=mock_db,
                path_key="kshama",
                situation="I hurt my friend",
                feeling="My friend",
            )

            # Check all required top-level keys
            assert "karmic_path" in result
            assert "core_verse" in result
            assert "supporting_verses" in result
            assert "sadhana" in result
            assert "seven_phases" in result
            assert "verse_display" in result
            assert "wisdom_context" in result
            assert "verse_results_count" in result

            # Check karmic path data
            assert result["karmic_path"]["key"] == "kshama"
            assert "Kshama" in result["karmic_path"]["name"]

            # Check phases
            assert len(result["seven_phases"]) == 7

            # Check sadhana is populated
            assert len(result["sadhana"]) > 0

    @pytest.mark.asyncio
    async def test_generate_deep_reset_with_legacy_type(self):
        """Test that generate_deep_reset works with legacy repair types."""
        mock_db = AsyncMock()

        with patch.object(
            self.service._wisdom_kb,
            'search_relevant_verses_full_db',
            new_callable=AsyncMock,
            return_value=[]
        ):
            result = await self.service.generate_deep_reset(
                db=mock_db,
                path_key="apology",
                situation="I was rude",
                feeling="Colleague",
            )

            # Should resolve to kshama path via legacy mapping
            assert "Kshama" in result["karmic_path"]["name"]
