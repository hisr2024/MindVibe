"""
Wisdom Knowledge Base service for managing and retrieving wisdom verses.

Provides functionality for sanitizing text, searching verses, and formatting responses.
"""

import difflib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import WisdomVerse


class WisdomKnowledgeBase:
    """Knowledge base for managing wisdom verses."""

    def __init__(self) -> None:
        """Initialize the wisdom knowledge base."""
        pass

    @staticmethod
    def sanitize_text(text: str | None) -> str | None:
        """
        Sanitize religious terms by replacing them with universal alternatives.

        Args:
            text: Text to sanitize (can be None)

        Returns:
            Sanitized text or None if input was None
        """
        if text is None:
            return None

        if text == "":
            return ""

        # Define replacements for religious terms
        replacements = {
            "Krishna": "the teacher",
            "krishna": "the teacher",
            "Arjuna": "the student",
            "arjuna": "the student",
            "Lord": "the wise one",
            "lord": "the wise one",
            "God": "inner wisdom",
            "god": "inner wisdom",
            "divine": "universal",
            "Divine": "Universal",
            "soul": "essence",
            "Soul": "Essence",
        }

        result = text
        for old, new in replacements.items():
            result = result.replace(old, new)

        return result

    @staticmethod
    async def get_verse_by_id(db: AsyncSession, verse_id: str) -> WisdomVerse | None:
        """
        Get a verse by its verse_id.

        Args:
            db: Database session
            verse_id: The verse identifier (e.g., "1.1")

        Returns:
            WisdomVerse object or None if not found
        """
        result = await db.execute(
            select(WisdomVerse).where(WisdomVerse.verse_id == verse_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_verses_by_theme(db: AsyncSession, theme: str) -> list[WisdomVerse]:
        """
        Get all verses matching a specific theme.

        Args:
            db: Database session
            theme: Theme to filter by

        Returns:
            List of WisdomVerse objects
        """
        result = await db.execute(select(WisdomVerse).where(WisdomVerse.theme == theme))
        return list(result.scalars().all())

    @staticmethod
    async def search_verses_by_application(
        db: AsyncSession, application: str
    ) -> list[WisdomVerse]:
        """
        Search verses by mental health application.

        Args:
            db: Database session
            application: Application to search for

        Returns:
            List of WisdomVerse objects containing the application
        """
        result = await db.execute(select(WisdomVerse))
        all_verses = result.scalars().all()

        # Filter verses that have the application in their mental_health_applications
        matching_verses = []
        for verse in all_verses:
            if verse.mental_health_applications:
                apps = verse.mental_health_applications.get("applications", [])
                if application in apps:
                    matching_verses.append(verse)

        return matching_verses

    @staticmethod
    def compute_text_similarity(text1: str, text2: str) -> float:
        """
        Compute similarity between two text strings using word overlap.

        Args:
            text1: First text string
            text2: Second text string

        Returns:
            Similarity score between 0.0 and 1.0
        """
        if not text1 or not text2:
            return 0.0
            
        # Use word-based similarity for better results
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        # Calculate Jaccard similarity (intersection / union)
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0

    @staticmethod
    async def search_relevant_verses(
        db: AsyncSession,
        query: str,
        theme: str | None = None,
        application: str | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        """
        Search for verses relevant to a query.

        Args:
            db: Database session
            query: Search query text
            theme: Optional theme to filter by
            application: Optional mental health application to filter by
            limit: Optional maximum number of results

        Returns:
            List of dicts with 'verse' and 'score' keys
        """
        kb = WisdomKnowledgeBase()

        # Get verses, optionally filtered by theme or application
        if theme:
            verses = await kb.get_verses_by_theme(db, theme)
        elif application:
            verses = await kb.search_verses_by_application(db, application)
        else:
            result = await db.execute(select(WisdomVerse))
            verses = list(result.scalars().all())

        # Compute similarity scores for each verse
        verse_scores = []
        for verse in verses:
            # Compare query against english text and context
            english_score = kb.compute_text_similarity(query, verse.english)
            context_score = kb.compute_text_similarity(query, verse.context)

            # Use the max score
            max_score = max(english_score, context_score)

            verse_scores.append({"verse": verse, "score": max_score})

        # Sort by score descending
        verse_scores.sort(key=lambda x: float(x["score"]), reverse=True)  # type: ignore[arg-type]

        # Apply limit if specified
        if limit is not None:
            verse_scores = verse_scores[:limit]

        return verse_scores

    @staticmethod
    def format_verse_response(
        verse: WisdomVerse,
        language: str = "english",
        include_sanskrit: bool = False,
    ) -> dict:
        """
        Format a verse for API response.

        Args:
            verse: WisdomVerse object to format
            language: Language preference ("english", "hindi")
            include_sanskrit: Whether to include Sanskrit text

        Returns:
            Formatted verse dictionary
        """
        # Format theme from snake_case to Title Case
        formatted_theme = verse.theme.replace("_", " ").title()

        # Extract applications list from mental_health_applications
        applications = []
        if verse.mental_health_applications:
            if isinstance(verse.mental_health_applications, dict):
                applications = verse.mental_health_applications.get("applications", [])
            elif isinstance(verse.mental_health_applications, list):
                applications = verse.mental_health_applications

        # Sanitize context
        sanitized_context = WisdomKnowledgeBase.sanitize_text(verse.context)

        response = {
            "verse_id": verse.verse_id,
            "chapter": verse.chapter,
            "verse_number": verse.verse_number,
            "theme": formatted_theme,
            "context": sanitized_context,
            "applications": applications,
            "language": language,
        }

        # Add language-specific text (sanitized)
        if language.lower() == "hindi":
            response["text"] = WisdomKnowledgeBase.sanitize_text(verse.hindi)
        else:
            response["text"] = WisdomKnowledgeBase.sanitize_text(verse.english)

        # Add Sanskrit if requested (no sanitization for Sanskrit)
        if include_sanskrit:
            response["sanskrit"] = verse.sanskrit

        return response


# Alias for backward compatibility
WisdomKB = WisdomKnowledgeBase
