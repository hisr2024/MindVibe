"""
Bhagavad Gita Service Layer.

Provides comprehensive methods for managing and querying Gita verses,
including search by keywords, themes, chapters, and modern context applications.
"""

from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    GitaChapter,
    GitaKeyword,
    GitaModernContext,
    GitaSource,
    GitaVerse,
    GitaVerseKeyword,
)


class GitaService:
    """Service layer for Bhagavad Gita wisdom database operations."""

    @staticmethod
    async def get_chapter(
        db: AsyncSession, chapter_number: int
    ) -> GitaChapter | None:
        """
        Get chapter metadata by chapter number.

        Args:
            db: Database session
            chapter_number: Chapter number (1-18)

        Returns:
            GitaChapter object or None if not found
        """
        result = await db.execute(
            select(GitaChapter).where(GitaChapter.chapter_number == chapter_number)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_chapters(db: AsyncSession) -> list[GitaChapter]:
        """
        Get all 18 chapters with metadata.

        Args:
            db: Database session

        Returns:
            List of GitaChapter objects ordered by chapter number
        """
        result = await db.execute(
            select(GitaChapter).order_by(GitaChapter.chapter_number)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_verses_by_chapter(
        db: AsyncSession, chapter_number: int, limit: int | None = None
    ) -> list[GitaVerse]:
        """
        Get all verses from a specific chapter.

        Args:
            db: Database session
            chapter_number: Chapter number (1-18)
            limit: Optional limit on number of verses returned

        Returns:
            List of GitaVerse objects ordered by verse number
        """
        query = (
            select(GitaVerse)
            .where(GitaVerse.chapter == chapter_number)
            .order_by(GitaVerse.verse)
        )

        if limit is not None:
            query = query.limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_verse_by_reference(
        db: AsyncSession, chapter: int, verse: int
    ) -> GitaVerse | None:
        """
        Get a specific verse by chapter and verse number.

        Args:
            db: Database session
            chapter: Chapter number
            verse: Verse number

        Returns:
            GitaVerse object or None if not found
        """
        result = await db.execute(
            select(GitaVerse).where(
                and_(GitaVerse.chapter == chapter, GitaVerse.verse == verse)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def search_verses_by_keyword(
        db: AsyncSession, keyword: str, limit: int = 50
    ) -> list[GitaVerse]:
        """
        Search verses by keyword.

        Args:
            db: Database session
            keyword: Keyword to search for
            limit: Maximum number of results (default 50)

        Returns:
            List of GitaVerse objects matching the keyword
        """
        # First, find the keyword ID
        keyword_result = await db.execute(
            select(GitaKeyword).where(
                func.lower(GitaKeyword.keyword) == keyword.lower()
            )
        )
        keyword_obj = keyword_result.scalar_one_or_none()

        if not keyword_obj:
            return []

        # Then find verses associated with this keyword
        result = await db.execute(
            select(GitaVerse)
            .join(GitaVerseKeyword, GitaVerse.id == GitaVerseKeyword.verse_id)
            .where(GitaVerseKeyword.keyword_id == keyword_obj.id)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def search_verses_by_theme(
        db: AsyncSession, theme: str, limit: int = 50
    ) -> list[GitaVerse]:
        """
        Search verses by theme.

        Args:
            db: Database session
            theme: Theme to search for (case-insensitive partial match)
            limit: Maximum number of results (default 50)

        Returns:
            List of GitaVerse objects matching the theme
        """
        result = await db.execute(
            select(GitaVerse)
            .where(GitaVerse.theme.ilike(f"%{theme}%"))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def search_verses_by_text(
        db: AsyncSession,
        query_text: str,
        language: str = "english",
        limit: int = 20,
    ) -> list[GitaVerse]:
        """
        Search verses by text content (full-text search).

        Args:
            db: Database session
            query_text: Text to search for
            language: Language to search in ('english', 'hindi', 'sanskrit')
            limit: Maximum number of results (default 20)

        Returns:
            List of GitaVerse objects matching the query
        """
        if language == "hindi":
            search_field = GitaVerse.hindi
        elif language == "sanskrit":
            search_field = GitaVerse.sanskrit
        else:
            search_field = GitaVerse.english

        result = await db.execute(
            select(GitaVerse).where(search_field.ilike(f"%{query_text}%")).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_modern_context(
        db: AsyncSession, verse_id: int
    ) -> list[GitaModernContext]:
        """
        Get modern context applications for a specific verse.

        Args:
            db: Database session
            verse_id: ID of the verse

        Returns:
            List of GitaModernContext objects for the verse
        """
        result = await db.execute(
            select(GitaModernContext).where(GitaModernContext.verse_id == verse_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def search_verses_by_application(
        db: AsyncSession, application: str, limit: int = 30
    ) -> list[GitaVerse]:
        """
        Search verses by modern application area (e.g., 'stress', 'anxiety', 'leadership').

        Args:
            db: Database session
            application: Application area to search for
            limit: Maximum number of results (default 30)

        Returns:
            List of GitaVerse objects with matching applications
        """
        result = await db.execute(
            select(GitaVerse)
            .join(GitaModernContext, GitaVerse.id == GitaModernContext.verse_id)
            .where(GitaModernContext.application_area.ilike(f"%{application}%"))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def add_verse_translation(
        db: AsyncSession,
        chapter: int,
        verse: int,
        sanskrit: str,
        hindi: str,
        english: str,
        principle: str,
        theme: str,
        transliteration: str | None = None,
        word_meanings: dict[str, str] | None = None,
        source_id: int | None = None,
    ) -> GitaVerse:
        """
        Add a new verse translation to the database.

        Args:
            db: Database session
            chapter: Chapter number
            verse: Verse number
            sanskrit: Sanskrit text
            hindi: Hindi translation
            english: English translation
            principle: Core principle/teaching
            theme: Thematic categorization
            transliteration: Optional transliteration
            word_meanings: Optional word-by-word meanings
            source_id: Optional source attribution ID

        Returns:
            Created GitaVerse object

        Raises:
            ValueError: If verse already exists
        """
        # Check if verse already exists
        existing = await GitaService.get_verse_by_reference(db, chapter, verse)
        if existing:
            raise ValueError(f"Verse {chapter}.{verse} already exists")

        new_verse = GitaVerse(
            chapter=chapter,
            verse=verse,
            sanskrit=sanskrit,
            transliteration=transliteration,
            hindi=hindi,
            english=english,
            word_meanings=word_meanings,
            principle=principle,
            theme=theme,
            source_id=source_id,
        )

        db.add(new_verse)
        await db.commit()
        await db.refresh(new_verse)
        return new_verse

    @staticmethod
    async def update_verse_translation(
        db: AsyncSession,
        verse_id: int,
        sanskrit: str | None = None,
        hindi: str | None = None,
        english: str | None = None,
        principle: str | None = None,
        theme: str | None = None,
        transliteration: str | None = None,
        word_meanings: dict[str, str] | None = None,
    ) -> GitaVerse | None:
        """
        Update an existing verse translation.

        Args:
            db: Database session
            verse_id: ID of the verse to update
            sanskrit: Optional updated Sanskrit text
            hindi: Optional updated Hindi translation
            english: Optional updated English translation
            principle: Optional updated principle
            theme: Optional updated theme
            transliteration: Optional updated transliteration
            word_meanings: Optional updated word meanings

        Returns:
            Updated GitaVerse object or None if not found
        """
        result = await db.execute(select(GitaVerse).where(GitaVerse.id == verse_id))
        verse = result.scalar_one_or_none()

        if not verse:
            return None

        if sanskrit is not None:
            verse.sanskrit = sanskrit
        if hindi is not None:
            verse.hindi = hindi
        if english is not None:
            verse.english = english
        if principle is not None:
            verse.principle = principle
        if theme is not None:
            verse.theme = theme
        if transliteration is not None:
            verse.transliteration = transliteration
        if word_meanings is not None:
            verse.word_meanings = word_meanings

        await db.commit()
        await db.refresh(verse)
        return verse

    @staticmethod
    async def query_verses_with_filters(
        db: AsyncSession,
        chapter: int | None = None,
        theme: str | None = None,
        keyword: str | None = None,
        application: str | None = None,
        source_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[GitaVerse]:
        """
        Query verses with multiple optional filters.

        Args:
            db: Database session
            chapter: Optional chapter number filter
            theme: Optional theme filter (partial match)
            keyword: Optional keyword filter
            application: Optional application area filter
            source_id: Optional source ID filter
            limit: Maximum number of results (default 50)
            offset: Number of results to skip (default 0)

        Returns:
            List of GitaVerse objects matching the filters
        """
        query = select(GitaVerse)

        # Apply filters
        conditions = []

        if chapter is not None:
            conditions.append(GitaVerse.chapter == chapter)

        if theme is not None:
            conditions.append(GitaVerse.theme.ilike(f"%{theme}%"))

        if source_id is not None:
            conditions.append(GitaVerse.source_id == source_id)

        if keyword is not None:
            # Join with keywords table
            keyword_result = await db.execute(
                select(GitaKeyword).where(
                    func.lower(GitaKeyword.keyword) == keyword.lower()
                )
            )
            keyword_obj = keyword_result.scalar_one_or_none()
            if keyword_obj:
                query = query.join(
                    GitaVerseKeyword, GitaVerse.id == GitaVerseKeyword.verse_id
                )
                conditions.append(GitaVerseKeyword.keyword_id == keyword_obj.id)

        if application is not None:
            # Join with modern contexts table
            query = query.join(
                GitaModernContext, GitaVerse.id == GitaModernContext.verse_id
            )
            conditions.append(
                GitaModernContext.application_area.ilike(f"%{application}%")
            )

        if conditions:
            query = query.where(and_(*conditions))

        # Apply pagination
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_source(db: AsyncSession, source_id: int) -> GitaSource | None:
        """
        Get source information by ID.

        Args:
            db: Database session
            source_id: Source ID

        Returns:
            GitaSource object or None if not found
        """
        result = await db.execute(select(GitaSource).where(GitaSource.id == source_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_sources(db: AsyncSession) -> list[GitaSource]:
        """
        Get all authentic sources.

        Args:
            db: Database session

        Returns:
            List of all GitaSource objects
        """
        result = await db.execute(select(GitaSource))
        return list(result.scalars().all())

    @staticmethod
    async def add_keyword_to_verse(
        db: AsyncSession, verse_id: int, keyword: str, category: str | None = None
    ) -> GitaVerseKeyword:
        """
        Add a keyword to a verse.

        Args:
            db: Database session
            verse_id: ID of the verse
            keyword: Keyword text
            category: Optional keyword category

        Returns:
            Created GitaVerseKeyword association object
        """
        # Find or create keyword
        result = await db.execute(
            select(GitaKeyword).where(
                func.lower(GitaKeyword.keyword) == keyword.lower()
            )
        )
        keyword_obj = result.scalar_one_or_none()

        if not keyword_obj:
            keyword_obj = GitaKeyword(keyword=keyword, category=category)
            db.add(keyword_obj)
            await db.commit()
            await db.refresh(keyword_obj)

        # Create association
        verse_keyword = GitaVerseKeyword(verse_id=verse_id, keyword_id=keyword_obj.id)
        db.add(verse_keyword)
        await db.commit()
        await db.refresh(verse_keyword)
        return verse_keyword

    @staticmethod
    async def add_modern_context(
        db: AsyncSession,
        verse_id: int,
        application_area: str,
        description: str,
        examples: list[str] | None = None,
        mental_health_benefits: list[str] | None = None,
    ) -> GitaModernContext:
        """
        Add modern context to a verse.

        Args:
            db: Database session
            verse_id: ID of the verse
            application_area: Modern application area
            description: Description of the application
            examples: Optional list of examples
            mental_health_benefits: Optional list of mental health benefits

        Returns:
            Created GitaModernContext object
        """
        context = GitaModernContext(
            verse_id=verse_id,
            application_area=application_area,
            description=description,
            examples=examples,
            mental_health_benefits=mental_health_benefits,
        )
        db.add(context)
        await db.commit()
        await db.refresh(context)
        return context

    @staticmethod
    def format_verse_response(
        verse: GitaVerse,
        language: str = "english",
        include_sanskrit: bool = False,
        include_transliteration: bool = False,
        include_word_meanings: bool = False,
    ) -> dict[str, Any]:
        """
        Format a verse for API response.

        Args:
            verse: GitaVerse object to format
            language: Language preference ('english', 'hindi', 'sanskrit')
            include_sanskrit: Whether to include Sanskrit text
            include_transliteration: Whether to include transliteration
            include_word_meanings: Whether to include word-by-word meanings

        Returns:
            Formatted verse dictionary
        """
        response: dict[str, Any] = {
            "id": verse.id,
            "chapter": verse.chapter,
            "verse": verse.verse,
            "reference": f"{verse.chapter}.{verse.verse}",
            "principle": verse.principle,
            "theme": verse.theme,
            "language": language,
        }

        # Add language-specific text
        if language.lower() == "hindi":
            response["text"] = verse.hindi
        elif language.lower() == "sanskrit":
            response["text"] = verse.sanskrit
        else:
            response["text"] = verse.english

        # Add optional fields
        if include_sanskrit:
            response["sanskrit"] = verse.sanskrit

        if include_transliteration and verse.transliteration:
            response["transliteration"] = verse.transliteration

        if include_word_meanings and verse.word_meanings:
            response["word_meanings"] = verse.word_meanings

        return response
