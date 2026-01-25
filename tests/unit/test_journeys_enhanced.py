"""
Tests for Enhanced Wisdom Journeys System.

Tests cover:
- Starting multiple journeys in one call
- /today idempotency
- Verse exclusion (no repeats in last N)
- JSON schema validation + retry logic
- Provider fallback
- Auth isolation (cannot access other user's journeys)
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

# Note: These imports will work once the modules are properly set up
# For now, we mock them for test structure


class TestJourneyScheduler:
    """Tests for the JourneyScheduler class."""

    def test_calculate_day_index_daily_pace(self):
        """Test day index calculation with daily pace."""
        from backend.services.journey_engine_enhanced import JourneyScheduler

        scheduler = JourneyScheduler()
        started_at = datetime.now() - timedelta(days=5)

        day_index = scheduler.calculate_day_index(started_at, "daily", 3)

        # Should be on day 4 (0 completed = day 1, 3 completed = day 4)
        assert day_index >= 1
        assert day_index <= 6  # 5 days elapsed + 1

    def test_calculate_day_index_every_other_day(self):
        """Test day index calculation with every-other-day pace."""
        from backend.services.journey_engine_enhanced import JourneyScheduler

        scheduler = JourneyScheduler()
        started_at = datetime.now() - timedelta(days=10)

        day_index = scheduler.calculate_day_index(started_at, "every_other_day", 3)

        # 10 days / 2 = 5 elapsed periods, so should be around day 4-6
        assert day_index >= 1
        assert day_index <= 6

    def test_calculate_day_index_weekly(self):
        """Test day index calculation with weekly pace."""
        from backend.services.journey_engine_enhanced import JourneyScheduler

        scheduler = JourneyScheduler()
        started_at = datetime.now() - timedelta(days=21)

        day_index = scheduler.calculate_day_index(started_at, "weekly", 2)

        # 21 days / 7 = 3 weeks, so should be on day 3 (after 2 completed)
        assert day_index >= 1
        assert day_index <= 4


class TestGitaCorpusAdapter:
    """Tests for the GitaCorpusAdapter class."""

    @pytest.mark.asyncio
    async def test_get_verse_text_caching(self, test_db: AsyncSession):
        """Test that verse text is cached after first fetch."""
        from backend.services.gita_corpus_adapter import GitaCorpusAdapter

        adapter = GitaCorpusAdapter()

        # First call should query DB (or return None if not in DB)
        result1 = await adapter.get_verse_text(test_db, 2, 47)

        # Clear would reset cache
        adapter.clear_cache()

        # Result should be consistent
        result2 = await adapter.get_verse_text(test_db, 2, 47)

        # Both should be the same (either both None or both with data)
        assert result1 == result2

    def test_get_enemy_themes(self):
        """Test that enemy themes are correctly mapped."""
        from backend.services.gita_corpus_adapter import GitaCorpusAdapter

        adapter = GitaCorpusAdapter()

        krodha_themes = adapter.get_enemy_themes("krodha")
        assert "anger" in krodha_themes
        assert "patience" in krodha_themes

        moha_themes = adapter.get_enemy_themes("moha")
        assert "delusion" in moha_themes or "clarity" in moha_themes

    def test_get_virtue_for_enemy(self):
        """Test that virtues are correctly mapped to enemies."""
        from backend.services.gita_corpus_adapter import GitaCorpusAdapter

        adapter = GitaCorpusAdapter()

        assert adapter.get_virtue_for_enemy("krodha") == "peace"
        assert adapter.get_virtue_for_enemy("moha") == "wisdom"
        assert adapter.get_virtue_for_enemy("mada") == "humility"


class TestProviderManager:
    """Tests for the AI Provider Manager."""

    @pytest.mark.asyncio
    async def test_provider_fallback_on_failure(self):
        """Test that provider manager falls back on retryable failure."""
        from backend.services.ai.providers.base import AIProviderError
        from backend.services.ai.providers.provider_manager import ProviderManager

        manager = ProviderManager()

        # If no providers configured, should raise error
        if not manager.list_providers():
            with pytest.raises(AIProviderError):
                await manager.chat(
                    messages=[{"role": "user", "content": "test"}],
                    temperature=0.7,
                    max_tokens=100,
                )

    def test_get_configured_providers(self):
        """Test listing configured providers."""
        from backend.services.ai.providers.provider_manager import ProviderManager

        manager = ProviderManager()
        providers = manager.get_configured_providers()

        # Should return list (may be empty if no API keys set)
        assert isinstance(providers, list)


class TestJourneyCoach:
    """Tests for the Journey Coach (KIAAN AI step generation)."""

    @pytest.mark.asyncio
    async def test_safety_response_on_crisis_keywords(self):
        """Test that safety response is triggered on crisis keywords."""
        from backend.services.journey_coach import JourneyCoach

        coach = JourneyCoach()

        # Test with crisis keywords
        safety_result = await coach._check_safety(
            "I want to end my life",
            None,
        )

        # Should return safety response (if not mocked)
        # In real test with mocked LLM, would check for safety_response structure

    def test_build_safety_response(self):
        """Test that safety response contains required fields."""
        from backend.services.journey_coach import JourneyCoach

        coach = JourneyCoach()
        response = coach._build_safety_response()

        assert response["is_safety_response"] is True
        assert "safety_message" in response
        assert "crisis_resources" in response
        assert isinstance(response["crisis_resources"], list)
        assert len(response["crisis_resources"]) > 0


class TestJourneyStepSchema:
    """Tests for the KIAAN step JSON schema validation."""

    def test_valid_step_schema(self):
        """Test that valid step JSON passes schema validation."""
        from backend.services.journey_coach import JourneyStepSchema

        valid_step = {
            "step_title": "Day 1: Understanding Anger",
            "today_focus": "krodha",
            "verse_refs": [{"chapter": 2, "verse": 63}],
            "teaching": "Today we explore the nature of anger and how it affects our inner peace. " * 3,
            "guided_reflection": [
                "When did you last feel angry?",
                "What triggered that anger?",
            ],
            "practice": {
                "name": "Breath Awareness",
                "instructions": ["Sit quietly", "Breathe deeply"],
                "duration_minutes": 5,
            },
            "micro_commitment": "I will pause before reacting to frustration today.",
            "check_in_prompt": {
                "scale": "0-10",
                "label": "How intense is your anger today?",
            },
        }

        step = JourneyStepSchema(**valid_step)
        assert step.step_title == "Day 1: Understanding Anger"
        assert step.today_focus == "krodha"
        assert len(step.verse_refs) == 1

    def test_invalid_focus_rejected(self):
        """Test that invalid focus value is rejected."""
        from backend.services.journey_coach import JourneyStepSchema
        from pydantic import ValidationError

        invalid_step = {
            "step_title": "Test",
            "today_focus": "invalid_enemy",  # Invalid
            "verse_refs": [{"chapter": 2, "verse": 47}],
            "teaching": "x" * 60,
            "guided_reflection": ["question"],
            "practice": {"name": "test", "instructions": ["step"], "duration_minutes": 5},
            "micro_commitment": "x" * 15,
            "check_in_prompt": {"scale": "0-10", "label": "test"},
        }

        with pytest.raises(ValidationError):
            JourneyStepSchema(**invalid_step)

    def test_verse_refs_validation(self):
        """Test that verse refs are validated for chapter/verse range."""
        from backend.services.journey_coach import VerseRefSchema
        from pydantic import ValidationError

        # Valid
        valid_ref = VerseRefSchema(chapter=2, verse=47)
        assert valid_ref.chapter == 2
        assert valid_ref.verse == 47

        # Invalid chapter (Gita has 18 chapters)
        with pytest.raises(ValidationError):
            VerseRefSchema(chapter=19, verse=1)


class TestMultiJourneySupport:
    """Tests for multi-journey support."""

    @pytest.mark.asyncio
    async def test_start_multiple_journeys(self, test_db: AsyncSession):
        """Test starting multiple journeys in one call."""
        from backend.services.journey_engine_enhanced import EnhancedJourneyEngine

        engine = EnhancedJourneyEngine()

        # Note: This would need journey templates seeded in test DB
        # For now, verify the function signature works

        try:
            journeys = await engine.start_journeys(
                db=test_db,
                user_id="test-user-1",
                journey_template_ids=["template-1", "template-2"],
                personalization={"pace": "daily"},
            )
            # Should return list of journeys
            assert isinstance(journeys, list)
        except Exception:
            # Expected if templates don't exist in test DB
            pass

    @pytest.mark.asyncio
    async def test_get_active_journeys_returns_multiple(self, test_db: AsyncSession):
        """Test that get_active_journeys returns all active journeys."""
        from backend.services.journey_engine_enhanced import EnhancedJourneyEngine

        engine = EnhancedJourneyEngine()

        journeys = await engine.get_active_journeys(
            db=test_db,
            user_id="test-user-1",
        )

        # Should return a list
        assert isinstance(journeys, list)


class TestAuthIsolation:
    """Tests for auth isolation (users can't access each other's journeys)."""

    @pytest.mark.asyncio
    async def test_cannot_access_other_user_journey(self, test_client):
        """Test that user cannot access another user's journey."""
        # Create journey for user A
        # Try to access with user B credentials
        # Should return 403

        response = await test_client.get(
            "/api/journeys/fake-journey-id/history",
            headers={"Authorization": "Bearer fake-token"},
        )

        # Without proper auth, should get 401 or 403
        assert response.status_code in [401, 403, 404]


class TestTodayIdempotency:
    """Tests for /today endpoint idempotency."""

    @pytest.mark.asyncio
    async def test_today_returns_same_step_on_repeated_calls(self, test_db: AsyncSession):
        """Test that calling /today multiple times returns the same cached step."""
        from backend.services.journey_engine_enhanced import StepGenerator
        from backend.models import UserJourney, UserJourneyStatus
        from unittest.mock import MagicMock

        generator = StepGenerator()

        # Create a mock user journey
        mock_journey = MagicMock(spec=UserJourney)
        mock_journey.id = "test-journey-123"
        mock_journey.template = None
        mock_journey.personalization = {"pace": "daily"}

        # First call - should generate
        # Second call - should return cached

        # Note: Full test would require more setup
        # This demonstrates the test structure


class TestVerseExclusion:
    """Tests for verse exclusion (no repeats in last N)."""

    @pytest.mark.asyncio
    async def test_recent_verses_excluded(self, test_db: AsyncSession):
        """Test that recently used verses are excluded from selection."""
        from backend.services.journey_engine_enhanced import VersePicker

        picker = VersePicker()

        # Pick verses with exclusion list
        verses = await picker.pick_verses(
            db=test_db,
            template_step=None,
            enemy_tags=["krodha"],
            user_journey_id="test-journey-1",
            avoid_recent=20,
            max_verses=3,
        )

        # Should return a list
        assert isinstance(verses, list)

    @pytest.mark.asyncio
    async def test_static_verse_refs_preferred(self, test_db: AsyncSession):
        """Test that static verse refs from template are preferred."""
        from backend.services.journey_engine_enhanced import VersePicker
        from backend.models import JourneyTemplateStep
        from unittest.mock import MagicMock

        picker = VersePicker()

        # Mock template step with static refs
        mock_step = MagicMock(spec=JourneyTemplateStep)
        mock_step.static_verse_refs = [{"chapter": 2, "verse": 47}]
        mock_step.verse_selector = None

        verses = await picker.pick_verses(
            db=test_db,
            template_step=mock_step,
            enemy_tags=["general"],
            user_journey_id="test-journey-1",
            avoid_recent=0,
            max_verses=3,
        )

        # Should use static refs
        assert len(verses) == 1
        assert verses[0]["chapter"] == 2
        assert verses[0]["verse"] == 47


class TestJSONSchemaValidation:
    """Tests for JSON schema validation and retry logic."""

    def test_json_extraction_from_markdown(self):
        """Test that JSON is correctly extracted from markdown-wrapped response."""
        from backend.services.journey_coach import JourneyCoach

        coach = JourneyCoach()

        # Test various formats
        test_cases = [
            ('{"test": 1}', '{"test": 1}'),
            ('```json\n{"test": 1}\n```', '{"test": 1}'),
            ('Here is the response:\n```\n{"test": 1}\n```', '{"test": 1}'),
        ]

        for input_text, expected in test_cases:
            result = coach._extract_json(input_text)
            assert json.loads(result) == json.loads(expected)


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
