"""
Unit tests for Gita Emotional Wisdom — Tier 0 routing layer.

Tests the emotion→domain/enemy mapping and the get_emotional_wisdom() function
that queries WisdomCore's full 700-verse Gita corpus.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.gita_emotional_wisdom import (
    BREATHING_VERSE,
    EMOTION_DOMAIN_MAP,
    EMOTION_SHAD_RIPU_MAP,
    JOURNEY_STEP_VERSES,
    get_emotional_wisdom,
)


# Helper to create WisdomResult-like objects without importing the real dataclass
def _make_wisdom_result(
    verse_ref: str,
    score: float,
    content: str = "Test wisdom content",
    chapter: int | None = None,
    verse: int | None = None,
):
    """Create a mock WisdomResult with the attributes used by get_emotional_wisdom."""
    from backend.services.wisdom_core import WisdomResult, WisdomSource

    ch, vs = (chapter, verse)
    if ch is None and vs is None and "." in verse_ref:
        parts = verse_ref.split(".")
        ch, vs = int(parts[0]), int(parts[1])

    return WisdomResult(
        id=f"gita-{verse_ref}",
        content=content,
        source=WisdomSource.GITA_VERSE,
        score=score,
        chapter=ch,
        verse=vs,
        verse_ref=verse_ref,
    )


class TestEmotionMaps:
    """Test the emotion→domain and emotion→shad-ripu mappings."""

    def test_emotion_domain_map_covers_all_base_emotions(self):
        """All 7 original emotions from EMOTION_VERSE_MAPPING must be mapped."""
        base_emotions = {"anxious", "stressed", "sad", "angry", "overwhelmed", "hopeless", "confused"}
        for emotion in base_emotions:
            assert emotion in EMOTION_DOMAIN_MAP, f"'{emotion}' missing from EMOTION_DOMAIN_MAP"

    def test_emotion_shad_ripu_map_keys_subset_of_domain_map(self):
        """Every emotion in SHAD_RIPU_MAP should also be in DOMAIN_MAP for robustness."""
        for emotion in EMOTION_SHAD_RIPU_MAP:
            assert emotion in EMOTION_DOMAIN_MAP, (
                f"'{emotion}' is in SHAD_RIPU_MAP but not DOMAIN_MAP — "
                f"Tier 0 gate check would skip it"
            )

    def test_emotion_domain_map_values_are_strings(self):
        """All domain map values should be non-empty strings."""
        for emotion, domain in EMOTION_DOMAIN_MAP.items():
            assert isinstance(domain, str) and domain, f"Invalid domain for '{emotion}': {domain!r}"

    def test_emotion_shad_ripu_map_values_are_valid(self):
        """Shad ripu values should be one of the six inner enemies."""
        valid_ripus = {"kama", "krodha", "lobha", "moha", "mada", "matsarya"}
        for emotion, ripu in EMOTION_SHAD_RIPU_MAP.items():
            assert ripu in valid_ripus, f"'{ripu}' for emotion '{emotion}' is not a valid shad ripu"


class TestConstants:
    """Test constant definitions."""

    def test_breathing_verse_is_bg_4_29(self):
        """BREATHING_VERSE should reference BG 4.29 (the pranayama verse)."""
        assert BREATHING_VERSE == {"chapter": 4, "verse": 29}

    def test_journey_step_verses_are_tuples(self):
        """JOURNEY_STEP_VERSES should be a list of (chapter, verse) tuples."""
        assert len(JOURNEY_STEP_VERSES) >= 4
        for item in JOURNEY_STEP_VERSES:
            assert isinstance(item, tuple) and len(item) == 2
            ch, vs = item
            assert isinstance(ch, int) and 1 <= ch <= 18
            assert isinstance(vs, int) and vs >= 1


class TestGetEmotionalWisdom:
    """Test the get_emotional_wisdom() async function."""

    @pytest.mark.asyncio
    async def test_returns_results_for_mapped_emotion(self):
        """Should return WisdomResult objects for a valid mapped emotion."""
        mock_db = AsyncMock()
        domain_results = [
            _make_wisdom_result("2.47", 5.0, "You have a right to perform your prescribed duties"),
            _make_wisdom_result("2.48", 4.0, "Perform your duty equipoised"),
        ]
        enemy_results = [
            _make_wisdom_result("5.26", 3.5, "For those free from anger"),
        ]

        mock_core = MagicMock()
        mock_core.get_by_domain = AsyncMock(return_value=domain_results)
        mock_core.get_for_enemy = AsyncMock(return_value=enemy_results)

        with patch("backend.services.wisdom_core.get_wisdom_core", return_value=mock_core):
            results = await get_emotional_wisdom(mock_db, "angry", limit=5)

        assert len(results) == 3
        # Sorted by score descending
        assert results[0].score >= results[1].score >= results[2].score

    @pytest.mark.asyncio
    async def test_deduplicates_by_verse_ref(self):
        """When domain and enemy return the same verse, keep the higher-scored one."""
        mock_db = AsyncMock()
        # Same verse from both sources, different scores
        domain_results = [_make_wisdom_result("2.62", 4.0)]
        enemy_results = [_make_wisdom_result("2.62", 6.0)]  # higher score

        mock_core = MagicMock()
        mock_core.get_by_domain = AsyncMock(return_value=domain_results)
        mock_core.get_for_enemy = AsyncMock(return_value=enemy_results)

        with patch("backend.services.wisdom_core.get_wisdom_core", return_value=mock_core):
            results = await get_emotional_wisdom(mock_db, "angry", limit=5)

        assert len(results) == 1
        assert results[0].score == 6.0  # Kept the higher-scored one

    @pytest.mark.asyncio
    async def test_unmapped_emotion_returns_empty(self):
        """Emotions not in either map should return empty list."""
        mock_db = AsyncMock()
        mock_core = MagicMock()

        with patch("backend.services.wisdom_core.get_wisdom_core", return_value=mock_core):
            results = await get_emotional_wisdom(mock_db, "ecstatic", limit=5)

        assert results == []
        mock_core.get_by_domain.assert_not_called()
        mock_core.get_for_enemy.assert_not_called()

    @pytest.mark.asyncio
    async def test_wisdomcore_unavailable_returns_empty(self):
        """If WisdomCore is None, return empty list without crashing."""
        mock_db = AsyncMock()

        with patch("backend.services.wisdom_core.get_wisdom_core", return_value=None):
            results = await get_emotional_wisdom(mock_db, "anxious", limit=5)

        assert results == []

    @pytest.mark.asyncio
    async def test_respects_limit(self):
        """Should return at most `limit` results."""
        mock_db = AsyncMock()
        domain_results = [
            _make_wisdom_result(f"{2}.{i}", float(10 - i)) for i in range(1, 8)
        ]

        mock_core = MagicMock()
        mock_core.get_by_domain = AsyncMock(return_value=domain_results)
        mock_core.get_for_enemy = AsyncMock(return_value=[])

        with patch("backend.services.wisdom_core.get_wisdom_core", return_value=mock_core):
            results = await get_emotional_wisdom(mock_db, "stressed", limit=3)

        assert len(results) == 3

    @pytest.mark.asyncio
    async def test_domain_api_failure_still_returns_enemy_results(self):
        """If get_by_domain throws, enemy results should still be returned."""
        mock_db = AsyncMock()
        enemy_results = [_make_wisdom_result("2.63", 4.0)]

        mock_core = MagicMock()
        mock_core.get_by_domain = AsyncMock(side_effect=Exception("DB timeout"))
        mock_core.get_for_enemy = AsyncMock(return_value=enemy_results)

        with patch("backend.services.wisdom_core.get_wisdom_core", return_value=mock_core):
            results = await get_emotional_wisdom(mock_db, "angry", limit=5)

        assert len(results) == 1
        assert results[0].verse_ref == "2.63"

    @pytest.mark.asyncio
    async def test_emotion_only_in_domain_map(self):
        """Emotions only in DOMAIN_MAP (not SHAD_RIPU) should still work."""
        mock_db = AsyncMock()
        domain_results = [_make_wisdom_result("12.13", 4.5)]

        mock_core = MagicMock()
        mock_core.get_by_domain = AsyncMock(return_value=domain_results)

        with patch("backend.services.wisdom_core.get_wisdom_core", return_value=mock_core):
            # "lonely" is in DOMAIN_MAP but not in SHAD_RIPU_MAP
            results = await get_emotional_wisdom(mock_db, "lonely", limit=5)

        assert len(results) == 1
        mock_core.get_for_enemy.assert_not_called()
