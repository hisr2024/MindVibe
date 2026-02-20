"""
Comprehensive tests for Gita adherence validation and response quality.

Tests ensure that KIAAN responses are properly rooted in Bhagavad Gita wisdom
and follow validation requirements.
"""

import pytest
from backend.services.gita_validator import GitaValidator
from backend.services.gita_analytics import GitaAnalyticsService


class TestGitaValidator:
    """Test suite for Gita response validation."""

    @pytest.fixture
    def validator(self):
        """Create a GitaValidator instance."""
        return GitaValidator()

    @pytest.fixture
    def valid_gita_response(self):
        """A valid Gita-rooted response (200+ words)."""
        return """The timeless wisdom teaches us that true peace comes from focusing on your actions, not the outcomes. You pour your energy into doing your best, then release attachment to how things turn out. This is the path of karma yoga - acting with full presence but without anxiety about results.

In your situation with work stress, this means approaching each day with the spirit of nishkama karma - selfless action without fixation on rewards. First, identify what is actually in your control today - your effort, your attitude, your response to challenges. Second, give those things your absolute best without obsessing over the promotion or recognition or any particular result. Third, practice this daily mantra: 'I do my dharma and trust the process.'

When you shift from outcome-obsession to action-devotion, something truly profound happens. The anxiety dissolves because you are no longer fighting reality - you are flowing with it. Your buddhi (higher wisdom) recognizes that you are the eternal observer, the sakshi, not the temporary doer-result chain. This understanding is the essence of vairagya - detachment from the fruits of action.

The ancient sages understood that our suffering comes not from action itself but from our clinging to particular outcomes. By practicing this awareness daily, you cultivate the equanimity that the Gita calls samatva - evenness of mind in success and failure alike. This is more than stress management - it is the gateway to unshakeable inner peace and spiritual liberation. Start today with one small practice of conscious detachment. 💙"""

    @pytest.fixture
    def generic_response(self):
        """A generic response that should fail validation."""
        return """According to recent studies, stress management is important for spiritual wellness. Research indicates that mindfulness and therapy can help reduce anxiety. Experts recommend practicing deep breathing and seeking professional help if needed.

You should try to set boundaries at work and make time for self-care. Modern psychology shows that cognitive behavioral therapy is effective for managing work stress. Talk to a therapist about developing coping strategies.

Remember to take breaks and prioritize your wellbeing. 💙"""

    @pytest.fixture
    def short_response(self):
        """A response that's too short."""
        return """Focus on your actions, not results. Let go of attachment and find inner peace. Practice dharma daily. 💙"""

    @pytest.fixture
    def sample_verse_context(self):
        """Sample verse context for validation."""
        return [
            {
                "verse": {
                    "verse_id": "2.47",
                    "english": "You have the right to perform your duties...",
                    "theme": "action_without_attachment"
                },
                "score": 0.85
            },
            {
                "verse": {
                    "verse_id": "2.48",
                    "english": "Be steadfast in yoga, O Arjuna...",
                    "theme": "equanimity"
                },
                "score": 0.78
            }
        ]

    def test_valid_gita_response_passes_validation(
        self, validator, valid_gita_response, sample_verse_context
    ):
        """Test that a valid Gita-rooted response passes all validation checks."""
        is_valid, details = validator.validate_response(
            valid_gita_response, sample_verse_context
        )
        
        assert is_valid, f"Valid response failed: {details.get('issues')}"
        assert details["has_gita_terminology"]
        assert details["no_forbidden_terms"]
        assert details["has_wisdom_markers"]
        assert details["appropriate_length"]
        assert details["verse_context_used"]
        assert len(details["gita_terms_found"]) >= 2
        assert len(details["issues"]) == 0

    def test_generic_response_fails_validation(self, validator, generic_response):
        """Test that generic non-Gita responses are caught and blocked."""
        is_valid, details = validator.validate_response(generic_response, [])
        
        assert not is_valid, "Generic response should fail validation"
        assert not details["no_forbidden_terms"]
        assert len(details["forbidden_terms_found"]) > 0
        # Forbidden terms should include phrases like "research indicates", "experts recommend", etc.
        all_forbidden = " ".join(details["forbidden_terms_found"]).lower()
        assert any(term in all_forbidden for term in ["research", "experts", "therapy", "therapist", "psychology"]), \
            f"Expected generic forbidden terms, found: {details['forbidden_terms_found']}"
        assert len(details["issues"]) > 0

    def test_short_response_fails_validation(self, validator, short_response):
        """Test that responses that are too short fail validation."""
        is_valid, details = validator.validate_response(short_response, [])
        
        assert not is_valid, "Short response should fail validation"
        assert not details["appropriate_length"]
        assert details["word_count"] < validator.MIN_WORDS

    def test_response_without_verse_context_fails(self, validator, valid_gita_response):
        """Test that responses without verse context fail validation."""
        is_valid, details = validator.validate_response(valid_gita_response, None)
        
        assert not is_valid, "Response without verse context should fail"
        assert not details["verse_context_used"]

    def test_empty_response_fails(self, validator):
        """Test that empty responses fail validation."""
        is_valid, details = validator.validate_response("", [])
        
        assert not is_valid
        assert "Response is empty" in details["issues"]

    def test_response_with_explicit_citations_fails(self, validator, sample_verse_context):
        """Test that responses with explicit verse citations fail validation."""
        response_with_citation = """According to Bhagavad Gita 2.47, you should focus on actions not results. Krishna said in chapter 2 that we must practice karma yoga for inner peace. This verse teaches us about detachment and equanimity. 💙"""
        
        is_valid, details = validator.validate_response(
            response_with_citation, sample_verse_context
        )
        
        # Should fail because it explicitly cites verses
        assert not is_valid
        assert not details["no_forbidden_terms"]

    def test_gita_terms_detection(self, validator, valid_gita_response):
        """Test that Gita terms are properly detected."""
        is_valid, details = validator.validate_response(
            valid_gita_response, [{"verse": {"verse_id": "2.47"}}]
        )
        
        gita_terms_found = [term.lower() for term in details["gita_terms_found"]]
        
        # Check that key terms are detected
        assert "karma" in gita_terms_found or "dharma" in gita_terms_found
        assert len(gita_terms_found) >= 2

    def test_wisdom_markers_detection(self, validator, valid_gita_response):
        """Test that wisdom markers are properly detected."""
        is_valid, details = validator.validate_response(
            valid_gita_response, [{"verse": {"verse_id": "2.47"}}]
        )
        
        assert details["has_wisdom_markers"]
        assert len(details["wisdom_markers_found"]) > 0

    def test_fallback_response_generation(self, validator):
        """Test that fallback responses are properly generated."""
        fallback = validator.get_fallback_response("I'm feeling anxious")
        
        assert fallback is not None
        assert len(fallback) > 0
        assert "💙" in fallback
        
        # Validate that fallback itself would pass validation
        is_valid, details = validator.validate_response(
            fallback, [{"verse": {"verse_id": "2.47"}}]
        )
        assert is_valid, f"Fallback response should pass validation: {details.get('issues')}"

    def test_four_part_structure_check(self, validator, valid_gita_response):
        """Test the 4-part structure checker."""
        structure = validator.check_four_part_structure(valid_gita_response)
        
        assert structure["has_ancient_wisdom"]
        assert structure["has_modern_application"]
        assert structure["has_practical_steps"]
        assert structure["has_deeper_understanding"]

    def test_word_count_validation(self, validator):
        """Test word count validation boundaries."""
        # Too short
        short_text = " ".join(["word"] * 50)  # 50 words
        is_valid, details = validator.validate_response(
            short_text, [{"verse": {"verse_id": "2.47"}}]
        )
        assert not details["appropriate_length"]
        assert details["word_count"] < validator.MIN_WORDS
        
        # Just right
        good_text = " ".join(["word"] * 300)  # 300 words
        is_valid, details = validator.validate_response(
            good_text, [{"verse": {"verse_id": "2.47"}}]
        )
        assert details["appropriate_length"]
        assert validator.MIN_WORDS <= details["word_count"] <= validator.MAX_WORDS
        
        # Too long
        long_text = " ".join(["word"] * 600)  # 600 words
        is_valid, details = validator.validate_response(
            long_text, [{"verse": {"verse_id": "2.47"}}]
        )
        assert not details["appropriate_length"]
        assert details["word_count"] > validator.MAX_WORDS


class TestGitaAnalytics:
    """Test suite for Gita analytics service."""

    @pytest.fixture(autouse=True)
    def reset_analytics(self):
        """Reset analytics before each test."""
        GitaAnalyticsService.reset_analytics(confirm=True)
        yield
        GitaAnalyticsService.reset_analytics(confirm=True)

    def test_verse_usage_tracking(self):
        """Test tracking verse usage."""
        GitaAnalyticsService.track_verse_usage("2.47", "action_without_attachment")
        GitaAnalyticsService.track_verse_usage("2.47", "action_without_attachment")
        GitaAnalyticsService.track_verse_usage("6.35", "meditation")
        
        most_used = GitaAnalyticsService.get_most_used_verses(limit=10)
        
        assert len(most_used) == 2
        assert most_used[0]["verse_id"] == "2.47"
        assert most_used[0]["usage_count"] == 2
        assert most_used[1]["verse_id"] == "6.35"
        assert most_used[1]["usage_count"] == 1

    def test_theme_usage_tracking(self):
        """Test tracking theme usage."""
        GitaAnalyticsService.track_verse_usage("2.47", "action_without_attachment")
        GitaAnalyticsService.track_verse_usage("2.48", "equanimity")
        GitaAnalyticsService.track_verse_usage("6.35", "equanimity")
        
        theme_stats = GitaAnalyticsService.get_theme_usage_stats()
        
        assert theme_stats["action_without_attachment"] == 1
        assert theme_stats["equanimity"] == 2

    def test_validation_stats_tracking(self):
        """Test tracking validation results."""
        GitaAnalyticsService.track_validation_result(True)
        GitaAnalyticsService.track_validation_result(True)
        GitaAnalyticsService.track_validation_result(False, "missing_gita_terms")
        GitaAnalyticsService.track_validation_result(False, "forbidden_terms")
        
        stats = GitaAnalyticsService.get_validation_stats()
        
        assert stats["total_validations"] == 4
        assert stats["passed"] == 2
        assert stats["failed"] == 2
        assert stats["pass_rate_percent"] == 50.0
        assert "missing_gita_terms" in stats["failure_reasons"]
        assert "forbidden_terms" in stats["failure_reasons"]

    def test_verse_frequency_tracking(self):
        """Test verse usage frequency analysis."""
        GitaAnalyticsService.track_verse_usage("2.47", "action")
        GitaAnalyticsService.track_verse_usage("2.47", "action")
        
        frequency = GitaAnalyticsService.get_verse_usage_frequency("2.47", days=30)
        
        assert frequency["verse_id"] == "2.47"
        assert frequency["total_uses"] == 2
        assert frequency["recent_uses"] == 2
        assert frequency["last_used"] is not None

    def test_unused_verse_frequency(self):
        """Test frequency data for unused verses."""
        frequency = GitaAnalyticsService.get_verse_usage_frequency("18.78", days=30)
        
        assert frequency["verse_id"] == "18.78"
        assert frequency["total_uses"] == 0
        assert frequency["recent_uses"] == 0
        assert frequency["last_used"] is None

    @pytest.mark.asyncio
    async def test_coverage_calculation(self, test_db):
        """Test verse coverage calculation."""
        # Track some verse usage
        GitaAnalyticsService.track_verse_usage("2.47")
        GitaAnalyticsService.track_verse_usage("2.48")
        GitaAnalyticsService.track_verse_usage("6.35")
        
        coverage = await GitaAnalyticsService.calculate_verse_coverage(test_db)
        
        assert "total_verses_in_db" in coverage
        assert "unique_verses_used" in coverage
        assert coverage["unique_verses_used"] == 3
        assert "coverage_percent" in coverage

    def test_analytics_reset(self):
        """Test analytics reset functionality."""
        GitaAnalyticsService.track_verse_usage("2.47", "action")
        GitaAnalyticsService.track_validation_result(True)
        
        # Verify data exists
        assert len(GitaAnalyticsService.get_most_used_verses()) > 0
        
        # Reset
        GitaAnalyticsService.reset_analytics(confirm=True)
        
        # Verify data is cleared
        assert len(GitaAnalyticsService.get_most_used_verses()) == 0
        stats = GitaAnalyticsService.get_validation_stats()
        assert stats["total_validations"] == 0


class TestVerseSearchCoverage:
    """Test verse search algorithm coverage."""

    @pytest.mark.asyncio
    async def test_emotion_to_theme_mapping(self, test_db):
        """Test that emotion-to-theme mapping provides diverse results."""
        from backend.services.wisdom_kb import WisdomKnowledgeBase
        
        kb = WisdomKnowledgeBase()
        
        # Test various emotional queries
        emotions = [
            "I'm feeling very anxious about my future",
            "I'm so angry and can't control it",
            "Feeling depressed and hopeless",
            "Lonely and disconnected from everyone",
            "Lost my sense of purpose in life"
        ]
        
        all_themes = set()
        for emotion in emotions:
            themes = kb._extract_themes(emotion)
            all_themes.update(themes)
        
        # Should have diverse themes from different emotional states
        assert len(all_themes) >= 10, f"Expected diverse themes, got: {all_themes}"

    @pytest.mark.asyncio
    async def test_multi_strategy_search(self, test_db):
        """Test that search combines multiple strategies for better coverage."""
        from backend.services.wisdom_kb import WisdomKnowledgeBase
        
        kb = WisdomKnowledgeBase()
        
        # Search with a complex emotional query
        results = await kb.search_relevant_verses(
            db=test_db,
            query="I'm anxious about work and feeling overwhelmed",
            limit=7
        )
        
        # Should return results (if verses are in DB)
        assert isinstance(results, list)
        
        # If we have results, verify they have proper structure
        if results:
            for result in results:
                assert "verse" in result
                assert "score" in result
                assert isinstance(result["score"], (int, float))

    @pytest.mark.asyncio
    async def test_verse_ranking_algorithm(self, test_db):
        """Test that verse ranking prioritizes relevant results."""
        from backend.services.wisdom_kb import WisdomKnowledgeBase
        
        kb = WisdomKnowledgeBase()
        
        results = await kb.search_relevant_verses(
            db=test_db,
            query="stress and anxiety at work",
            limit=5
        )
        
        if len(results) > 1:
            # Scores should be in descending order
            scores = [r["score"] for r in results]
            assert scores == sorted(scores, reverse=True), "Results should be ranked by score"
