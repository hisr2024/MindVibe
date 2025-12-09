"""
Unit tests for the WisdomKnowledgeBase full database integration.

Tests the integration with GitaService to access 700+ Bhagavad Gita verses.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.gita_service import GitaService
from backend.services.wisdom_kb import WisdomKnowledgeBase, _GitaVerseWrapper


class TestWisdomKnowledgeBaseFullDatabase:
    """Test WisdomKnowledgeBase integration with full Gita database."""

    @pytest.fixture
    def kb(self):
        """Create a WisdomKnowledgeBase instance."""
        return WisdomKnowledgeBase()

    @pytest.fixture
    def mock_gita_verses(self):
        """Create mock Gita verses for testing."""
        verses = []
        # Create 50 mock verses across multiple chapters for testing
        for chapter in range(1, 11):
            for verse_num in range(1, 6):
                verse = MagicMock()
                verse.id = chapter * 100 + verse_num
                verse.chapter = chapter
                verse.verse = verse_num
                verse.sanskrit = f"Sanskrit text for {chapter}.{verse_num}"
                verse.transliteration = f"Transliteration {chapter}.{verse_num}"
                verse.hindi = f"Hindi text for {chapter}.{verse_num}"
                verse.english = f"English translation for chapter {chapter} verse {verse_num}"
                verse.word_meanings = {}
                verse.principle = f"Core principle from chapter {chapter}"
                verse.theme = f"theme_chapter_{chapter}"
                verse.mental_health_applications = (
                    ["anxiety_management", "stress_reduction"]
                    if chapter % 2 == 0
                    else ["mindfulness", "equanimity"]
                )
                verse.primary_domain = "anxiety" if chapter % 2 == 0 else "mindfulness"
                verse.secondary_domains = ["stress"] if chapter % 3 == 0 else []
                verses.append(verse)
        return verses

    def test_sanitize_text_krishna_to_teacher(self):
        """Test that 'Krishna' is replaced with 'the teacher'."""
        text = "Krishna spoke to Arjuna on the battlefield"
        result = WisdomKnowledgeBase.sanitize_text(text)
        assert "the teacher" in result
        assert "krishna" not in result.lower()

    def test_sanitize_text_arjuna_to_student(self):
        """Test that 'Arjuna' is replaced with 'the student'."""
        text = "Arjuna asked Krishna about duty"
        result = WisdomKnowledgeBase.sanitize_text(text)
        assert "the student" in result
        assert "arjuna" not in result.lower()

    def test_sanitize_text_all_replacements(self):
        """Test all religious term replacements."""
        text = "Lord Krishna told Arjuna about the Divine Soul and God"
        result = WisdomKnowledgeBase.sanitize_text(text)

        # Check all terms are replaced
        assert "krishna" not in result.lower()
        assert "arjuna" not in result.lower()
        assert "lord" not in result.lower()
        assert "divine" not in result.lower()
        assert "soul" not in result.lower()
        assert "god " not in result.lower()  # Note space to avoid false matches

        # Check replacements are present
        assert "the teacher" in result
        assert "the student" in result
        assert "the wise one" in result

    def test_sanitize_text_none_returns_none(self):
        """Test that None input returns None."""
        assert WisdomKnowledgeBase.sanitize_text(None) is None

    def test_sanitize_text_empty_returns_empty(self):
        """Test that empty string returns empty string."""
        assert WisdomKnowledgeBase.sanitize_text("") == ""

    def test_compute_text_similarity_identical(self):
        """Test similarity of identical texts is 1.0."""
        text = "Find peace within yourself"
        similarity = WisdomKnowledgeBase.compute_text_similarity(text, text)
        assert similarity == 1.0

    def test_compute_text_similarity_different(self):
        """Test similarity of different texts is low."""
        text1 = "apple banana cherry"
        text2 = "dog elephant fox"
        similarity = WisdomKnowledgeBase.compute_text_similarity(text1, text2)
        assert similarity < 0.35

    def test_compute_text_similarity_partial_overlap(self):
        """Test similarity of partially overlapping texts."""
        text1 = "find inner peace and calm"
        text2 = "seeking inner peace today"
        similarity = WisdomKnowledgeBase.compute_text_similarity(text1, text2)
        assert 0.0 < similarity < 1.0
        assert similarity > 0.2

    @pytest.mark.asyncio
    async def test_get_all_verses_returns_cache(self, kb):
        """Test that get_all_verses uses cache on second call."""
        mock_db = AsyncMock()

        # Pre-populate cache
        cached_verses = [{"verse_id": "1.1", "english": "Test verse"}]
        kb._verse_cache = cached_verses

        result = await kb.get_all_verses(mock_db)

        # Should return cached data without DB call
        assert result == cached_verses
        mock_db.execute.assert_not_called()

    def test_clear_cache(self, kb):
        """Test that clear_cache resets the cache."""
        kb._verse_cache = [{"verse_id": "1.1"}]
        kb.clear_cache()
        assert kb._verse_cache is None

    @pytest.mark.asyncio
    async def test_get_all_verses_from_gita_service(self, kb, mock_gita_verses):
        """Test that get_all_verses fetches from GitaService."""
        mock_db = AsyncMock()

        with patch.object(
            GitaService, "get_all_verses_with_tags", new_callable=AsyncMock
        ) as mock_get_all:
            mock_get_all.return_value = mock_gita_verses

            # Clear cache to force fresh fetch
            kb.clear_cache()
            result = await kb.get_all_verses(mock_db)

            # Should have fetched all mock verses
            mock_get_all.assert_called_once_with(mock_db)
            assert len(result) == len(mock_gita_verses)

    @pytest.mark.asyncio
    async def test_search_relevant_verses_full_db_uses_tag_boost(self, kb):
        """Test that tag boost is applied when query matches mental health tags."""
        mock_db = AsyncMock()

        # Create test verses with different tags
        test_verses = [
            {
                "verse_id": "2.47",
                "chapter": 2,
                "verse_number": 47,
                "theme": "action",
                "english": "Focus on action, not results",
                "context": "About performing duty",
                "mental_health_applications": ["anxiety_management", "stress_reduction"],
            },
            {
                "verse_id": "2.56",
                "chapter": 2,
                "verse_number": 56,
                "theme": "equanimity",
                "english": "Remain steady in joy and sorrow",
                "context": "About emotional balance",
                "mental_health_applications": ["mindfulness", "equanimity"],
            },
        ]

        # Pre-populate cache
        kb._verse_cache = test_verses

        # Search with query matching anxiety tag
        result = await kb.search_relevant_verses_full_db(
            mock_db, "anxiety stress worried", limit=2
        )

        assert len(result) > 0
        # First result should have anxiety-related verse boosted
        first_verse = result[0]["verse"]
        assert "anxiety_management" in first_verse.get("mental_health_applications", [])

    @pytest.mark.asyncio
    async def test_search_relevant_verses_full_db_limit(self, kb):
        """Test that search respects limit parameter."""
        mock_db = AsyncMock()

        # Create many test verses
        kb._verse_cache = [
            {
                "verse_id": f"{i}.{j}",
                "chapter": i,
                "verse_number": j,
                "theme": "test",
                "english": f"Verse {i}.{j} about peace",
                "context": "Context",
                "mental_health_applications": [],
            }
            for i in range(1, 6)
            for j in range(1, 6)
        ]

        result = await kb.search_relevant_verses_full_db(
            mock_db, "peace", limit=3
        )

        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_search_relevant_verses_full_db_by_theme(self, kb, mock_gita_verses):
        """Test filtering by theme."""
        mock_db = AsyncMock()

        with patch.object(
            GitaService, "search_verses_by_theme", new_callable=AsyncMock
        ) as mock_search:
            # Return only theme_chapter_2 verses
            mock_search.return_value = [v for v in mock_gita_verses if v.chapter == 2]

            _ = await kb.search_relevant_verses_full_db(
                mock_db, "query", theme="theme_chapter_2", limit=10
            )

            mock_search.assert_called_once_with(mock_db, "theme_chapter_2")

    @pytest.mark.asyncio
    async def test_search_relevant_verses_full_db_by_application(self, kb, mock_gita_verses):
        """Test filtering by mental health application."""
        mock_db = AsyncMock()

        with patch.object(
            GitaService, "search_by_mental_health_application", new_callable=AsyncMock
        ) as mock_search:
            mock_search.return_value = [v for v in mock_gita_verses if v.chapter % 2 == 0]

            _ = await kb.search_relevant_verses_full_db(
                mock_db, "query", application="anxiety_management", limit=10
            )

            mock_search.assert_called_once_with(mock_db, "anxiety_management")


class TestGitaVerseWrapper:
    """Test the GitaVerseWrapper class for backward compatibility."""

    def test_wrapper_exposes_all_attributes(self):
        """Test that wrapper exposes all verse attributes."""
        verse_dict = {
            "verse_id": "2.47",
            "chapter": 2,
            "verse_number": 47,
            "theme": "action_without_attachment",
            "english": "You have the right to perform your duties",
            "hindi": "तुम्हारा अधिकार केवल कर्म करने में है",
            "sanskrit": "कर्मण्येवाधिकारस्ते",
            "context": "About performing duty",
            "mental_health_applications": ["anxiety_management"],
            "primary_domain": "anxiety",
            "secondary_domains": ["stress"],
        }

        wrapper = _GitaVerseWrapper(verse_dict)

        assert wrapper.verse_id == "2.47"
        assert wrapper.chapter == 2
        assert wrapper.verse_number == 47
        assert wrapper.theme == "action_without_attachment"
        assert wrapper.english == "You have the right to perform your duties"
        assert wrapper.hindi == "तुम्हारा अधिकार केवल कर्म करने में है"
        assert wrapper.sanskrit == "कर्मण्येवाधिकारस्ते"
        assert wrapper.context == "About performing duty"
        assert wrapper.mental_health_applications == ["anxiety_management"]
        assert wrapper.primary_domain == "anxiety"
        assert wrapper.secondary_domains == ["stress"]

    def test_wrapper_handles_missing_fields(self):
        """Test that wrapper handles missing fields gracefully."""
        verse_dict = {
            "verse_id": "1.1",
            "english": "Some text",
        }

        wrapper = _GitaVerseWrapper(verse_dict)

        assert wrapper.verse_id == "1.1"
        assert wrapper.chapter == 0  # Default
        assert wrapper.verse_number == 0  # Default
        assert wrapper.theme == ""  # Default
        assert wrapper.mental_health_applications == []  # Default


class TestGitaServiceExtensions:
    """Test the new GitaService methods."""

    @pytest.fixture
    def mock_gita_verse(self):
        """Create a mock GitaVerse for testing."""
        verse = MagicMock()
        verse.id = 1
        verse.chapter = 2
        verse.verse = 47
        verse.sanskrit = "कर्मण्येवाधिकारस्ते"
        verse.transliteration = "karmanye vadhikaraste"
        verse.hindi = "तुम्हारा अधिकार केवल कर्म करने में है"
        verse.english = "You have the right to perform your duties"
        verse.word_meanings = {"karma": "action"}
        verse.principle = "Focus on action, not results"
        verse.theme = "action_without_attachment"
        verse.mental_health_applications = ["anxiety_management", "stress_reduction"]
        verse.primary_domain = "anxiety"
        verse.secondary_domains = ["stress"]
        return verse

    def test_convert_to_wisdom_verse_format(self, mock_gita_verse):
        """Test conversion from GitaVerse to wisdom format."""
        result = GitaService.convert_to_wisdom_verse_format(mock_gita_verse)

        assert result["verse_id"] == "2.47"
        assert result["chapter"] == 2
        assert result["verse_number"] == 47
        assert result["theme"] == "action_without_attachment"
        assert result["english"] == "You have the right to perform your duties"
        assert result["hindi"] == "तुम्हारा अधिकार केवल कर्म करने में है"
        assert result["sanskrit"] == "कर्मण्येवाधिकारस्ते"
        assert result["context"] == "Focus on action, not results"  # principle as context
        assert result["mental_health_applications"] == ["anxiety_management", "stress_reduction"]
        assert result["primary_domain"] == "anxiety"
        assert result["secondary_domains"] == ["stress"]

    def test_convert_to_wisdom_verse_format_handles_none(self):
        """Test conversion handles None values gracefully."""
        verse = MagicMock()
        verse.chapter = 1
        verse.verse = 1
        verse.sanskrit = ""
        verse.hindi = ""
        verse.english = ""
        verse.principle = ""
        verse.theme = ""
        verse.mental_health_applications = None
        verse.primary_domain = None
        verse.secondary_domains = None

        result = GitaService.convert_to_wisdom_verse_format(verse)

        assert result["mental_health_applications"] == []
        assert result["primary_domain"] is None
        assert result["secondary_domains"] == []

    @pytest.mark.asyncio
    async def test_get_all_verses_with_tags(self):
        """Test getting all verses with tags."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [MagicMock(), MagicMock()]
        mock_db.execute.return_value = mock_result

        result = await GitaService.get_all_verses_with_tags(mock_db)

        assert len(result) == 2
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_verses_with_tags_respects_limit(self):
        """Test that limit parameter is respected."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [MagicMock()]
        mock_db.execute.return_value = mock_result

        _ = await GitaService.get_all_verses_with_tags(mock_db, limit=10)

        # Verify the query was executed
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_by_primary_domain(self):
        """Test searching by primary domain."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_verse = MagicMock()
        mock_verse.primary_domain = "anxiety"
        mock_result.scalars.return_value.all.return_value = [mock_verse]
        mock_db.execute.return_value = mock_result

        result = await GitaService.search_by_primary_domain(mock_db, "anxiety")

        assert len(result) == 1
        mock_db.execute.assert_called_once()


class TestMentalHealthTagBoost:
    """Test mental health tag boosting in search."""

    @pytest.fixture
    def kb(self):
        """Create a WisdomKnowledgeBase instance."""
        return WisdomKnowledgeBase()

    def test_tag_boost_constant(self):
        """Test that TAG_BOOST is set correctly."""
        assert WisdomKnowledgeBase.TAG_BOOST == 0.2

    @pytest.mark.asyncio
    async def test_tag_boost_applied_to_matching_query(self, kb):
        """Test that tag boost increases score for matching tags."""
        mock_db = AsyncMock()

        # Create test verses - one with matching tag, one without
        kb._verse_cache = [
            {
                "verse_id": "2.47",
                "chapter": 2,
                "verse_number": 47,
                "theme": "action",
                "english": "Focus on work",
                "context": "About duty",
                "mental_health_applications": ["anxiety_management"],
            },
            {
                "verse_id": "2.56",
                "chapter": 2,
                "verse_number": 56,
                "theme": "peace",
                "english": "Focus on work",  # Same text for equal base score
                "context": "About duty",  # Same context
                "mental_health_applications": ["meditation_support"],
            },
        ]

        # Search with query that matches anxiety tag
        result = await kb.search_relevant_verses_full_db(
            mock_db, "anxiety management help", limit=2
        )

        # Verse with anxiety_management tag should have higher score
        assert len(result) == 2
        first_verse = result[0]["verse"]
        # The anxiety verse should be ranked higher due to tag boost
        assert "anxiety_management" in first_verse.get("mental_health_applications", [])
