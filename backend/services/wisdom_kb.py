"""
Wisdom Knowledge Base service for managing and retrieving wisdom verses.

Provides functionality for sanitizing text, searching verses, and formatting responses.
Integrates with GitaService to access the full 700+ verse Bhagavad Gita database.
"""

import difflib
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import WisdomVerse
from backend.services.gita_service import GitaService


class WisdomKnowledgeBase:
    """Knowledge base for managing wisdom verses.

    Integrates with GitaService to provide access to 700+ Bhagavad Gita verses
    while preserving text sanitization and mental health tagging functionality.
    """

    # Mental health tag boost for search scoring
    TAG_BOOST = 0.2

    def __init__(self) -> None:
        """Initialize the wisdom knowledge base."""
        self._verse_cache: list[dict[str, Any]] | None = None
        self._gita_service = GitaService()

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
        Compute similarity between two text strings using SequenceMatcher.

        Args:
            text1: First text string
            text2: Second text string

        Returns:
            Similarity score between 0.0 and 1.0
        """
        return difflib.SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

    async def get_all_verses(self, db: AsyncSession) -> list[dict[str, Any]]:
        """
        Get all 700+ verses from the GitaService database.

        Uses caching to avoid repeated database queries.

        Args:
            db: Database session

        Returns:
            List of verse dictionaries in wisdom format
        """
        if self._verse_cache:
            return self._verse_cache

        # Fetch all verses from GitaService
        gita_verses = await GitaService.get_all_verses_with_tags(db)

        # Convert to wisdom verse format
        wisdom_verses = [
            GitaService.convert_to_wisdom_verse_format(gv) for gv in gita_verses
        ]

        # Cache the results
        self._verse_cache = wisdom_verses
        return wisdom_verses

    def clear_cache(self) -> None:
        """Clear the verse cache to force a fresh database fetch."""
        self._verse_cache = None

    async def get_database_stats(self, db: AsyncSession) -> dict[str, Any]:
        """
        Get statistics about loaded verses in the database.

        Args:
            db: Database session

        Returns:
            Dictionary with database statistics including:
            - total_verses: Total number of verses
            - by_chapter: Count per chapter
            - by_theme: Count per theme
            - tagged_verses: Verses with mental health tags
            - coverage: "complete" if 700 verses, else "partial"
        """
        from sqlalchemy import text

        from backend.models import GitaVerse

        # Total count
        result = await db.execute(text("SELECT COUNT(*) FROM gita_verses"))
        total = result.scalar() or 0

        # By chapter
        result = await db.execute(
            text(
                "SELECT chapter, COUNT(*) as cnt FROM gita_verses "
                "GROUP BY chapter ORDER BY chapter"
            )
        )
        by_chapter = {row[0]: row[1] for row in result.fetchall()}

        # By theme
        result = await db.execute(
            text("SELECT theme, COUNT(*) as cnt FROM gita_verses GROUP BY theme")
        )
        by_theme = {row[0]: row[1] for row in result.fetchall()}

        # Tagged verses (with mental health applications)
        result = await db.execute(
            text(
                "SELECT COUNT(*) FROM gita_verses "
                "WHERE mental_health_applications IS NOT NULL"
            )
        )
        tagged = result.scalar() or 0

        return {
            "total_verses": total,
            "by_chapter": by_chapter,
            "by_theme": by_theme,
            "tagged_verses": tagged,
            "coverage": "complete" if total == 700 else "partial",
        }

    async def search_with_fallback(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Search with intelligent fallback if initial search yields few results.

        Args:
            db: Database session
            query: Search query text
            limit: Maximum number of results (default 5)

        Returns:
            List of verse results with scores
        """
        # Initial search
        results = await self.search_relevant_verses_full_db(db, query, limit=limit)

        if len(results) >= 3:
            return results

        # Expand search to related themes
        themes = self._extract_themes(query)
        for theme in themes:
            theme_results = await self.search_relevant_verses_full_db(
                db, query, theme=theme, limit=2
            )
            # Add unique results
            existing_ids = {
                r.get("verse", {}).get("verse_id") for r in results if r.get("verse")
            }
            for tr in theme_results:
                verse = tr.get("verse", {})
                verse_id = verse.get("verse_id") if verse else None
                if verse_id and verse_id not in existing_ids:
                    results.append(tr)
                    existing_ids.add(verse_id)

        return results[:limit]

    def _extract_themes(self, query: str) -> list[str]:
        """
        Extract relevant themes from a query for expanded search.
        Enhanced emotion-to-theme mapping for better verse coverage.

        Args:
            query: Search query text

        Returns:
            List of theme keywords
        """
        query_lower = query.lower()

        # Enhanced emotion-to-theme mapping with Gita principles
        theme_mapping = {
            # Anxiety and stress
            "anxiety": ["equanimity", "peace", "balance", "detachment", "surrender"],
            "anxious": ["equanimity", "peace", "balance", "detachment", "surrender"],
            "worry": ["equanimity", "trust", "letting_go", "peace"],
            "stress": ["action", "work", "balance", "equanimity", "mindfulness"],
            "stressed": ["action", "work", "balance", "equanimity", "mindfulness"],
            "overwhelmed": ["peace", "balance", "meditation", "surrender", "breath"],
            
            # Fear and courage
            "fear": ["courage", "strength", "trust", "faith", "inner_power"],
            "afraid": ["courage", "strength", "trust", "faith", "inner_power"],
            "scared": ["courage", "strength", "trust", "faith", "protection"],
            "panic": ["equanimity", "breath", "grounding", "peace", "control"],
            
            # Sadness and depression
            "depression": ["hope", "light", "purpose", "self_compassion", "renewal"],
            "depressed": ["hope", "light", "purpose", "self_compassion", "renewal"],
            "sad": ["hope", "compassion", "acceptance", "healing"],
            "grief": ["compassion", "acceptance", "healing", "wisdom", "eternal"],
            "hopeless": ["hope", "purpose", "meaning", "light", "faith"],
            
            # Anger and frustration
            "anger": ["control", "peace", "patience", "equanimity", "restraint"],
            "angry": ["control", "peace", "patience", "equanimity", "restraint"],
            "frustrated": ["patience", "acceptance", "equanimity", "balance"],
            "irritated": ["peace", "patience", "mindfulness", "awareness"],
            "rage": ["control", "peace", "self_mastery", "restraint"],
            
            # Loneliness and connection
            "lonely": ["connection", "devotion", "love", "inner_self", "unity"],
            "alone": ["inner_self", "connection", "wholeness", "devotion"],
            "isolated": ["connection", "unity", "love", "compassion"],
            
            # Purpose and meaning
            "purpose": ["duty", "action", "meaning", "dharma", "calling"],
            "meaning": ["purpose", "duty", "dharma", "wisdom", "understanding"],
            "lost": ["direction", "purpose", "wisdom", "clarity", "guidance"],
            "confused": ["knowledge", "wisdom", "clarity", "understanding", "discernment"],
            "direction": ["purpose", "duty", "path", "guidance", "clarity"],
            
            # Self-worth and confidence
            "confidence": ["self_empowerment", "strength", "inner_power", "courage"],
            "worth": ["self_compassion", "value", "essence", "inner_self"],
            "inadequate": ["self_compassion", "worthiness", "acceptance", "growth"],
            "failure": ["learning", "growth", "resilience", "perseverance", "detachment"],
            
            # Change and uncertainty
            "change": ["acceptance", "adaptation", "flow", "impermanence", "trust"],
            "uncertain": ["trust", "faith", "equanimity", "surrender", "acceptance"],
            "transition": ["adaptation", "change", "growth", "resilience"],
            
            # Control and letting go
            "control": ["surrender", "letting_go", "acceptance", "detachment", "trust"],
            "perfectionism": ["acceptance", "balance", "self_compassion", "letting_go"],
            "obsessive": ["balance", "detachment", "mindfulness", "peace"],
            
            # Relationships
            "relationship": ["compassion", "love", "understanding", "forgiveness", "harmony"],
            "conflict": ["peace", "understanding", "compassion", "patience", "wisdom"],
            "forgiveness": ["compassion", "letting_go", "peace", "healing", "love"],
            
            # Work and duty
            "work": ["duty", "action", "balance", "purpose", "karma_yoga"],
            "career": ["duty", "purpose", "action", "dharma", "excellence"],
            "burnout": ["balance", "rest", "self_care", "boundaries", "renew"],
            
            # Inner peace and meditation
            "peace": ["meditation", "stillness", "equanimity", "balance", "calm"],
            "calm": ["peace", "meditation", "breath", "stillness", "centeredness"],
            "meditation": ["stillness", "awareness", "presence", "peace", "inner_self"],
            "mindfulness": ["awareness", "presence", "attention", "breath", "now"],
        }

        themes = []
        for keyword, related_themes in theme_mapping.items():
            if keyword in query_lower:
                themes.extend(related_themes)

        return list(set(themes))[:5]  # Return up to 5 unique themes for better coverage


    async def search_relevant_verses_full_db(
        self,
        db: AsyncSession,
        query: str,
        theme: str | None = None,
        application: str | None = None,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Search for verses relevant to a query across the full 700+ verse database.

        This method uses GitaService to search the complete Gita database with
        mental health tag boosting for better relevance.

        Args:
            db: Database session
            query: Search query text
            theme: Optional theme to filter by
            application: Optional mental health application to filter by
            limit: Maximum number of results (default 5)

        Returns:
            List of dicts with 'verse', 'score', and 'sanitized_text' keys
        """
        # Get verses (filtered or all)
        if theme:
            # Filter by theme using GitaService
            gita_verses = await GitaService.search_verses_by_theme(db, theme)
            verses = [GitaService.convert_to_wisdom_verse_format(gv) for gv in gita_verses]
        elif application:
            # Filter by application using GitaService
            gita_verses = await GitaService.search_by_mental_health_application(db, application)
            verses = [GitaService.convert_to_wisdom_verse_format(gv) for gv in gita_verses]
        else:
            # Get all verses from cache
            verses = await self.get_all_verses(db)

        if not verses:
            return []

        # Extract keywords from query for tag matching
        query_keywords = set(query.lower().split())

        # Compute similarity scores for each verse
        verse_scores: list[dict[str, Any]] = []
        for verse in verses:
            # Compare query against english text and context
            english_text = verse.get("english", "")
            context_text = verse.get("context", "")

            english_score = self.compute_text_similarity(query, english_text)
            context_score = self.compute_text_similarity(query, context_text)

            # Use the max score as base
            base_score = max(english_score, context_score)

            # Apply tag boost if query matches mental health applications
            tag_boost = 0.0
            mental_health_apps = verse.get("mental_health_applications", [])
            if mental_health_apps:
                for app in mental_health_apps:
                    # Check if any keyword from query is in the application tag
                    app_words = set(app.lower().replace("_", " ").split())
                    if query_keywords & app_words:
                        tag_boost = self.TAG_BOOST
                        break

            final_score = base_score + tag_boost

            verse_scores.append({
                "verse": verse,
                "score": final_score,
                "sanitized_text": self.sanitize_text(english_text),
            })

        # Sort by score descending
        verse_scores.sort(key=lambda x: float(x["score"]), reverse=True)

        # Return top N results
        return verse_scores[:limit]

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

        This method maintains backward compatibility with existing code
        while now searching the full GitaService database.

        Args:
            db: Database session
            query: Search query text
            theme: Optional theme to filter by
            application: Optional mental health application to filter by
            limit: Optional maximum number of results (default 5)

        Returns:
            List of dicts with 'verse' and 'score' keys
        """
        kb = WisdomKnowledgeBase()
        effective_limit = limit if limit is not None else 5

        # Try to search the full Gita database first
        try:
            gita_results = await kb.search_relevant_verses_full_db(
                db=db,
                query=query,
                theme=theme,
                application=application,
                limit=effective_limit,
            )

            if gita_results:
                # Convert Gita results back to expected format for backward compatibility
                # We need to return WisdomVerse-like objects or adapt the interface
                results = []
                for item in gita_results:
                    verse_dict = item["verse"]
                    # Create a simple object-like wrapper for backward compatibility
                    results.append({
                        "verse": _GitaVerseWrapper(verse_dict),
                        "score": item["score"],
                    })
                return results
        except Exception:
            # Fall back to WisdomVerse table if GitaService fails
            pass

        # Fallback: Get verses from WisdomVerse table
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


class _GitaVerseWrapper:
    """Wrapper to make Gita verse dicts behave like WisdomVerse objects for backward compatibility."""

    def __init__(self, verse_dict: dict[str, Any]) -> None:
        self._data = verse_dict
        self.verse_id = verse_dict.get("verse_id", "")
        self.chapter = verse_dict.get("chapter", 0)
        self.verse_number = verse_dict.get("verse_number", 0)
        self.theme = verse_dict.get("theme", "")
        self.english = verse_dict.get("english", "")
        self.hindi = verse_dict.get("hindi", "")
        self.sanskrit = verse_dict.get("sanskrit", "")
        self.context = verse_dict.get("context", "")
        self.mental_health_applications = verse_dict.get("mental_health_applications", [])
        self.primary_domain = verse_dict.get("primary_domain")
        self.secondary_domains = verse_dict.get("secondary_domains", [])


# Alias for backward compatibility
WisdomKB = WisdomKnowledgeBase
