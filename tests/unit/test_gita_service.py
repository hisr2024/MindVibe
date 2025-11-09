"""
Unit tests for the GitaService.

Tests the Gita wisdom database service layer functionality including
verse retrieval, search, filtering, and CRUD operations.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    GitaChapter,
    GitaKeyword,
    GitaModernContext,
    GitaSource,
    GitaVerse,
    GitaVerseKeyword,
)
from backend.services.gita_service import GitaService


class TestGitaServiceChapters:
    """Test chapter-related functionality."""

    @pytest.mark.asyncio
    async def test_get_chapter(self, test_db: AsyncSession):
        """Test retrieving a chapter by number."""
        # Create a test chapter
        chapter = GitaChapter(
            chapter_number=1,
            sanskrit_name="अर्जुनविषादयोग",
            english_name="The Yoga of Arjuna's Dejection",
            verse_count=47,
            themes=["Dilemma", "Morality"],
            mental_health_relevance="Decision-making struggles",
        )
        test_db.add(chapter)
        await test_db.commit()

        # Retrieve the chapter
        result = await GitaService.get_chapter(test_db, 1)

        assert result is not None
        assert result.chapter_number == 1
        assert result.sanskrit_name == "अर्जुनविषादयोग"
        assert result.verse_count == 47

    @pytest.mark.asyncio
    async def test_get_chapter_not_found(self, test_db: AsyncSession):
        """Test retrieving a non-existent chapter."""
        result = await GitaService.get_chapter(test_db, 99)
        assert result is None

    @pytest.mark.asyncio
    async def test_get_all_chapters(self, test_db: AsyncSession):
        """Test retrieving all chapters."""
        # Create test chapters
        chapters = [
            GitaChapter(
                chapter_number=1,
                sanskrit_name="अर्जुनविषादयोग",
                english_name="Chapter 1",
                verse_count=47,
                themes=["Dilemma"],
            ),
            GitaChapter(
                chapter_number=2,
                sanskrit_name="सांख्ययोग",
                english_name="Chapter 2",
                verse_count=72,
                themes=["Knowledge"],
            ),
        ]
        test_db.add_all(chapters)
        await test_db.commit()

        # Retrieve all chapters
        result = await GitaService.get_all_chapters(test_db)

        assert len(result) == 2
        assert result[0].chapter_number == 1
        assert result[1].chapter_number == 2


class TestGitaServiceVerses:
    """Test verse retrieval functionality."""

    @pytest.mark.asyncio
    async def test_get_verses_by_chapter(self, test_db: AsyncSession):
        """Test retrieving verses by chapter number."""
        # Create a chapter
        chapter = GitaChapter(
            chapter_number=2,
            sanskrit_name="सांख्ययोग",
            english_name="The Yoga of Knowledge",
            verse_count=2,
            themes=["Knowledge"],
        )
        test_db.add(chapter)
        await test_db.commit()

        # Create test verses
        verses = [
            GitaVerse(
                chapter=2,
                verse=1,
                sanskrit="धृतराष्ट्र उवाच",
                hindi="धृतराष्ट्र ने कहा",
                english="Dhritarashtra said",
                principle="Introduction",
                theme="Setting",
            ),
            GitaVerse(
                chapter=2,
                verse=2,
                sanskrit="संजय उवाच",
                hindi="संजय ने कहा",
                english="Sanjaya said",
                principle="Narration",
                theme="Setting",
            ),
        ]
        test_db.add_all(verses)
        await test_db.commit()

        # Retrieve verses
        result = await GitaService.get_verses_by_chapter(test_db, 2)

        assert len(result) == 2
        assert result[0].verse == 1
        assert result[1].verse == 2

    @pytest.mark.asyncio
    async def test_get_verses_by_chapter_with_limit(self, test_db: AsyncSession):
        """Test retrieving verses with limit."""
        chapter = GitaChapter(
            chapter_number=3,
            sanskrit_name="कर्मयोग",
            english_name="Karma Yoga",
            verse_count=3,
            themes=["Action"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verses = [
            GitaVerse(
                chapter=3,
                verse=i,
                sanskrit=f"Test {i}",
                hindi=f"परीक्षण {i}",
                english=f"Test verse {i}",
                principle="Test",
                theme="Test",
            )
            for i in range(1, 4)
        ]
        test_db.add_all(verses)
        await test_db.commit()

        result = await GitaService.get_verses_by_chapter(test_db, 3, limit=2)

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_get_verse_by_reference(self, test_db: AsyncSession):
        """Test retrieving a specific verse by chapter and verse number."""
        chapter = GitaChapter(
            chapter_number=2,
            sanskrit_name="सांख्ययोग",
            english_name="Knowledge",
            verse_count=1,
            themes=["Knowledge"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verse = GitaVerse(
            chapter=2,
            verse=47,
            sanskrit="कर्मण्येवाधिकारस्ते",
            hindi="तुम्हें केवल कर्म करने का अधिकार है",
            english="You have the right to perform your duty",
            principle="Karma Yoga",
            theme="Action",
        )
        test_db.add(verse)
        await test_db.commit()

        result = await GitaService.get_verse_by_reference(test_db, 2, 47)

        assert result is not None
        assert result.chapter == 2
        assert result.verse == 47

    @pytest.mark.asyncio
    async def test_get_verse_by_reference_not_found(self, test_db: AsyncSession):
        """Test retrieving a non-existent verse."""
        result = await GitaService.get_verse_by_reference(test_db, 99, 99)
        assert result is None


class TestGitaServiceSearch:
    """Test search functionality."""

    @pytest.mark.asyncio
    async def test_search_verses_by_keyword(self, test_db: AsyncSession):
        """Test searching verses by keyword."""
        # Create chapter, keyword, and verse
        chapter = GitaChapter(
            chapter_number=2,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=1,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        keyword = GitaKeyword(keyword="karma", category="Action")
        test_db.add(keyword)
        await test_db.commit()

        verse = GitaVerse(
            chapter=2,
            verse=47,
            sanskrit="Test",
            hindi="Test",
            english="Test",
            principle="Karma",
            theme="Action",
        )
        test_db.add(verse)
        await test_db.commit()

        # Associate keyword with verse
        verse_keyword = GitaVerseKeyword(verse_id=verse.id, keyword_id=keyword.id)
        test_db.add(verse_keyword)
        await test_db.commit()

        # Search by keyword
        result = await GitaService.search_verses_by_keyword(test_db, "karma")

        assert len(result) == 1
        assert result[0].id == verse.id

    @pytest.mark.asyncio
    async def test_search_verses_by_theme(self, test_db: AsyncSession):
        """Test searching verses by theme."""
        chapter = GitaChapter(
            chapter_number=4,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=2,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verses = [
            GitaVerse(
                chapter=4,
                verse=1,
                sanskrit="Test 1",
                hindi="Test 1",
                english="Test 1",
                principle="Peace",
                theme="Inner Peace",
            ),
            GitaVerse(
                chapter=4,
                verse=2,
                sanskrit="Test 2",
                hindi="Test 2",
                english="Test 2",
                principle="Action",
                theme="Karma Yoga",
            ),
        ]
        test_db.add_all(verses)
        await test_db.commit()

        result = await GitaService.search_verses_by_theme(test_db, "peace")

        assert len(result) == 1
        assert result[0].theme == "Inner Peace"

    @pytest.mark.asyncio
    async def test_search_verses_by_text(self, test_db: AsyncSession):
        """Test full-text search in verses."""
        chapter = GitaChapter(
            chapter_number=5,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=1,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verse = GitaVerse(
            chapter=5,
            verse=1,
            sanskrit="योगस्थः कुरु कर्माणि",
            hindi="योग में स्थित होकर कर्म करो",
            english="Perform action being steadfast in yoga",
            principle="Balanced Action",
            theme="Yoga",
        )
        test_db.add(verse)
        await test_db.commit()

        # Search in English
        result = await GitaService.search_verses_by_text(
            test_db, "steadfast", language="english"
        )

        assert len(result) == 1
        assert result[0].id == verse.id


class TestGitaServiceModernContext:
    """Test modern context functionality."""

    @pytest.mark.asyncio
    async def test_get_modern_context(self, test_db: AsyncSession):
        """Test retrieving modern context for a verse."""
        chapter = GitaChapter(
            chapter_number=2,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=1,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verse = GitaVerse(
            chapter=2,
            verse=47,
            sanskrit="Test",
            hindi="Test",
            english="Test",
            principle="Karma",
            theme="Action",
        )
        test_db.add(verse)
        await test_db.commit()

        context = GitaModernContext(
            verse_id=verse.id,
            application_area="Work-Life Balance",
            description="Focus on work without attachment to results",
            examples=["Do your best at work"],
            mental_health_benefits=["Reduced stress"],
        )
        test_db.add(context)
        await test_db.commit()

        result = await GitaService.get_modern_context(test_db, verse.id)

        assert len(result) == 1
        assert result[0].application_area == "Work-Life Balance"

    @pytest.mark.asyncio
    async def test_search_verses_by_application(self, test_db: AsyncSession):
        """Test searching verses by application area."""
        chapter = GitaChapter(
            chapter_number=6,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=1,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verse = GitaVerse(
            chapter=6,
            verse=5,
            sanskrit="Test",
            hindi="Test",
            english="Test",
            principle="Self-control",
            theme="Practice",
        )
        test_db.add(verse)
        await test_db.commit()

        context = GitaModernContext(
            verse_id=verse.id,
            application_area="Stress Management",
            description="Manage stress through self-awareness",
        )
        test_db.add(context)
        await test_db.commit()

        result = await GitaService.search_verses_by_application(test_db, "stress")

        assert len(result) == 1
        assert result[0].id == verse.id


class TestGitaServiceCRUD:
    """Test CRUD operations."""

    @pytest.mark.asyncio
    async def test_add_verse_translation(self, test_db: AsyncSession):
        """Test adding a new verse translation."""
        chapter = GitaChapter(
            chapter_number=7,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=1,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verse = await GitaService.add_verse_translation(
            test_db,
            chapter=7,
            verse=1,
            sanskrit="Test Sanskrit",
            hindi="Test Hindi",
            english="Test English",
            principle="Test Principle",
            theme="Test Theme",
        )

        assert verse.id is not None
        assert verse.chapter == 7
        assert verse.verse == 1

    @pytest.mark.asyncio
    async def test_add_duplicate_verse_raises_error(self, test_db: AsyncSession):
        """Test that adding a duplicate verse raises an error."""
        chapter = GitaChapter(
            chapter_number=8,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=1,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        # Add first verse
        await GitaService.add_verse_translation(
            test_db,
            chapter=8,
            verse=1,
            sanskrit="Test",
            hindi="Test",
            english="Test",
            principle="Test",
            theme="Test",
        )

        # Try to add duplicate
        with pytest.raises(ValueError, match="already exists"):
            await GitaService.add_verse_translation(
                test_db,
                chapter=8,
                verse=1,
                sanskrit="Duplicate",
                hindi="Duplicate",
                english="Duplicate",
                principle="Duplicate",
                theme="Duplicate",
            )

    @pytest.mark.asyncio
    async def test_update_verse_translation(self, test_db: AsyncSession):
        """Test updating a verse translation."""
        chapter = GitaChapter(
            chapter_number=9,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=1,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verse = GitaVerse(
            chapter=9,
            verse=1,
            sanskrit="Original",
            hindi="Original",
            english="Original",
            principle="Original",
            theme="Original",
        )
        test_db.add(verse)
        await test_db.commit()

        updated = await GitaService.update_verse_translation(
            test_db, verse.id, english="Updated English"
        )

        assert updated is not None
        assert updated.english == "Updated English"
        assert updated.sanskrit == "Original"  # Unchanged


class TestGitaServiceFilters:
    """Test complex filtering."""

    @pytest.mark.asyncio
    async def test_query_verses_with_filters(self, test_db: AsyncSession):
        """Test querying verses with multiple filters."""
        chapter = GitaChapter(
            chapter_number=10,
            sanskrit_name="Test",
            english_name="Test",
            verse_count=2,
            themes=["Test"],
        )
        test_db.add(chapter)
        await test_db.commit()

        verses = [
            GitaVerse(
                chapter=10,
                verse=1,
                sanskrit="Test 1",
                hindi="Test 1",
                english="Test 1",
                principle="Test",
                theme="Knowledge",
            ),
            GitaVerse(
                chapter=10,
                verse=2,
                sanskrit="Test 2",
                hindi="Test 2",
                english="Test 2",
                principle="Test",
                theme="Action",
            ),
        ]
        test_db.add_all(verses)
        await test_db.commit()

        result = await GitaService.query_verses_with_filters(
            test_db, chapter=10, theme="knowledge"
        )

        assert len(result) == 1
        assert result[0].theme == "Knowledge"


class TestGitaServiceFormatting:
    """Test verse formatting functionality."""

    def test_format_verse_response_english(self):
        """Test formatting verse in English."""
        verse = GitaVerse(
            id=1,
            chapter=2,
            verse=47,
            sanskrit="कर्मण्येवाधिकारस्ते",
            transliteration="karmaṇy evādhikāras te",
            hindi="तुम्हें केवल कर्म का अधिकार है",
            english="You have the right to perform your duty",
            word_meanings={"कर्म": "action", "अधिकार": "right"},
            principle="Karma Yoga",
            theme="Action",
        )

        result = GitaService.format_verse_response(verse, language="english")

        assert result["reference"] == "2.47"
        assert result["text"] == "You have the right to perform your duty"
        assert result["language"] == "english"

    def test_format_verse_response_with_sanskrit(self):
        """Test formatting verse with Sanskrit included."""
        verse = GitaVerse(
            id=1,
            chapter=2,
            verse=47,
            sanskrit="कर्मण्येवाधिकारस्ते",
            hindi="Test",
            english="Test",
            principle="Test",
            theme="Test",
        )

        result = GitaService.format_verse_response(
            verse, language="english", include_sanskrit=True
        )

        assert "sanskrit" in result
        assert result["sanskrit"] == "कर्मण्येवाधिकारस्ते"

    def test_format_verse_response_with_transliteration(self):
        """Test formatting verse with transliteration."""
        verse = GitaVerse(
            id=1,
            chapter=2,
            verse=47,
            sanskrit="Test",
            transliteration="karmaṇy evādhikāras te",
            hindi="Test",
            english="Test",
            principle="Test",
            theme="Test",
        )

        result = GitaService.format_verse_response(
            verse, language="english", include_transliteration=True
        )

        assert "transliteration" in result
        assert result["transliteration"] == "karmaṇy evādhikāras te"
