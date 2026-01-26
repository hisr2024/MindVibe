"""
Gita Corpus Adapter - Unified interface for accessing Bhagavad Gita verses.

This adapter wraps the existing Gita verse storage (database + frontend data)
and provides a consistent interface for:
- Getting verse text by chapter/verse reference
- Searching verses by tags (enemy tags, virtue tags)
- Filtering and excluding recently used verses

The adapter NEVER returns full verse text in LLM prompts - only references.
Verse text is resolved at display time by the frontend or API layer.
"""

import logging
import random
from typing import Any, TypedDict

from sqlalchemy import and_, or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import GitaVerse, WisdomVerse

logger = logging.getLogger(__name__)


class VerseReference(TypedDict):
    """A reference to a Gita verse (chapter and verse number only)."""
    chapter: int
    verse: int


class VerseText(TypedDict):
    """Full verse text in multiple formats."""
    sanskrit: str | None
    transliteration: str | None
    translation: str  # English translation
    hindi: str | None
    reflection: str | None
    themes: list[str]
    keywords: list[str]


class VerseSearchResult(TypedDict):
    """Result from a tag-based verse search."""
    chapter: int
    verse: int
    score: float
    themes: list[str]


# Enemy tag to related theme mappings for verse selection
# These themes map to the full 700+ verse corpus across all 18 chapters
ENEMY_TAG_THEMES: dict[str, list[str]] = {
    "kama": [
        "desire", "lust", "attachment", "senses", "restraint", "control",
        "brahmacharya", "self-control", "moderation", "detachment",
        "renunciation", "tyaga", "vairagya", "indriya", "manas"
    ],
    "krodha": [
        "anger", "wrath", "patience", "peace", "calm", "equanimity",
        "tolerance", "forgiveness", "serenity", "composure",
        "kshama", "shanti", "prasada", "forbearance", "tranquility"
    ],
    "lobha": [
        "greed", "avarice", "contentment", "generosity", "charity",
        "satisfaction", "non-attachment", "selflessness", "giving",
        "dana", "santosha", "aparigraha", "tyaga", "abundance"
    ],
    "moha": [
        "delusion", "attachment", "clarity", "discrimination", "wisdom",
        "viveka", "knowledge", "understanding", "truth", "reality",
        "jnana", "buddhi", "maya", "avidya", "vidya", "prajna"
    ],
    "mada": [
        "pride", "ego", "arrogance", "humility", "modesty", "surrender",
        "service", "humbleness", "gratitude", "devotion",
        "ahamkara", "seva", "bhakti", "namrata", "vinaya"
    ],
    "matsarya": [
        "envy", "jealousy", "contentment", "appreciation", "joy",
        "mudita", "compassion", "empathy", "celebration", "harmony",
        "karuna", "maitri", "sukha", "ananda", "prem"
    ],
}

# Additional theme categories for comprehensive verse selection from all 18 chapters
CHAPTER_THEMES: dict[int, list[str]] = {
    1: ["grief", "confusion", "dharma", "duty", "family", "compassion", "despair"],
    2: ["soul", "immortality", "equanimity", "karma-yoga", "wisdom", "duty", "action", "detachment"],
    3: ["karma", "action", "duty", "sacrifice", "selflessness", "desire", "anger"],
    4: ["knowledge", "wisdom", "sacrifice", "renunciation", "divine", "incarnation"],
    5: ["renunciation", "action", "sannyasa", "karma-yoga", "peace", "brahman"],
    6: ["meditation", "yoga", "mind-control", "discipline", "self-realization", "equanimity"],
    7: ["knowledge", "divine", "maya", "devotion", "nature", "prakrti"],
    8: ["brahman", "death", "liberation", "om", "remembrance", "devotion"],
    9: ["devotion", "bhakti", "divine-secret", "worship", "grace", "surrender"],
    10: ["divine-glories", "vibhuti", "manifestation", "supreme", "infinite"],
    11: ["cosmic-form", "vishvarupa", "divine-vision", "time", "destruction", "devotion"],
    12: ["devotion", "bhakti", "qualities", "dear-to-divine", "equanimity", "love"],
    13: ["field", "knower", "prakrti", "purusha", "knowledge", "body", "soul"],
    14: ["gunas", "sattva", "rajas", "tamas", "liberation", "transcendence"],
    15: ["supreme-person", "tree-of-life", "eternal", "purushottama", "detachment"],
    16: ["divine-qualities", "demonic-qualities", "virtue", "vice", "liberation"],
    17: ["faith", "shraddha", "food", "sacrifice", "austerity", "charity", "gunas"],
    18: ["renunciation", "liberation", "duty", "surrender", "moksha", "grace", "devotion"],
}

# Modern life application themes for KIAAN AI
MODERN_THEMES: dict[str, list[str]] = {
    "workplace": ["duty", "action", "karma", "detachment", "leadership", "service", "dharma"],
    "relationships": ["love", "attachment", "compassion", "forgiveness", "harmony", "devotion"],
    "mental_health": ["peace", "equanimity", "mind-control", "anxiety", "stress", "clarity"],
    "technology": ["senses", "restraint", "detachment", "awareness", "moderation"],
    "financial": ["contentment", "greed", "charity", "renunciation", "abundance", "detachment"],
    "wellness": ["discipline", "body", "senses", "yoga", "meditation", "balance"],
    "purpose": ["dharma", "duty", "calling", "action", "service", "self-realization"],
}

# Virtue tags (opposite of enemies)
VIRTUE_TAGS: dict[str, str] = {
    "kama": "restraint",
    "krodha": "peace",
    "lobha": "contentment",
    "moha": "wisdom",
    "mada": "humility",
    "matsarya": "joy",
}


class GitaCorpusAdapter:
    """
    Unified adapter for accessing Bhagavad Gita verses.

    Provides methods for:
    - get_verse_text(chapter, verse) -> VerseText
    - search_by_tags(tags, limit, exclude_refs) -> list[VerseSearchResult]
    - random_by_tags(tags, limit, exclude_refs) -> list[VerseSearchResult]
    """

    def __init__(self) -> None:
        """Initialize the adapter."""
        self._cache: dict[str, VerseText] = {}
        logger.info("GitaCorpusAdapter initialized")

    def _make_cache_key(self, chapter: int, verse: int) -> str:
        """Create a cache key for a verse."""
        return f"{chapter}:{verse}"

    async def get_verse_text(
        self,
        db: AsyncSession,
        chapter: int,
        verse: int,
    ) -> VerseText | None:
        """
        Get full verse text by chapter and verse number.

        Args:
            db: Database session
            chapter: Chapter number (1-18)
            verse: Verse number within chapter

        Returns:
            VerseText dict or None if not found
        """
        cache_key = self._make_cache_key(chapter, verse)

        # Check cache first
        if cache_key in self._cache:
            return self._cache[cache_key]

        try:
            # Query GitaVerse table
            result = await db.execute(
                select(GitaVerse).where(
                    and_(
                        GitaVerse.chapter == chapter,
                        GitaVerse.verse == verse,
                    )
                )
            )
            verse_row = result.scalar_one_or_none()

            if verse_row:
                verse_text: VerseText = {
                    "sanskrit": getattr(verse_row, "sanskrit", None),
                    "transliteration": getattr(verse_row, "transliteration", None),
                    "translation": getattr(verse_row, "text", "") or getattr(verse_row, "english", ""),
                    "hindi": getattr(verse_row, "hindi", None),
                    "reflection": getattr(verse_row, "reflection", None),
                    "themes": getattr(verse_row, "themes", []) or [],
                    "keywords": getattr(verse_row, "keywords", []) or [],
                }
                self._cache[cache_key] = verse_text
                return verse_text

            # Try WisdomVerse as fallback
            wisdom_result = await db.execute(
                select(WisdomVerse).where(
                    and_(
                        WisdomVerse.chapter == chapter,
                        WisdomVerse.verse_number == verse,
                    )
                )
            )
            wisdom_row = wisdom_result.scalar_one_or_none()

            if wisdom_row:
                verse_text = {
                    "sanskrit": getattr(wisdom_row, "sanskrit", None),
                    "transliteration": None,
                    "translation": wisdom_row.english or "",
                    "hindi": wisdom_row.hindi,
                    "reflection": None,
                    "themes": [],
                    "keywords": [],
                }
                self._cache[cache_key] = verse_text
                return verse_text

            logger.warning(f"Verse {chapter}:{verse} not found in database")
            return None

        except Exception as e:
            logger.error(f"Error fetching verse {chapter}:{verse}: {e}")
            return None

    async def get_verses_bulk(
        self,
        db: AsyncSession,
        refs: list[VerseReference],
    ) -> list[tuple[VerseReference, VerseText | None]]:
        """
        Get multiple verses in bulk.

        Args:
            db: Database session
            refs: List of verse references

        Returns:
            List of (reference, verse_text) tuples
        """
        results: list[tuple[VerseReference, VerseText | None]] = []

        for ref in refs:
            verse_text = await self.get_verse_text(db, ref["chapter"], ref["verse"])
            results.append((ref, verse_text))

        return results

    async def search_by_tags(
        self,
        db: AsyncSession,
        tags: list[str],
        limit: int = 10,
        exclude_refs: list[VerseReference] | None = None,
        chapters: list[int] | None = None,
    ) -> list[VerseSearchResult]:
        """
        Search verses by tags (enemy tags, themes, keywords) across all 700+ verses.

        Args:
            db: Database session
            tags: Tags to search for (enemy tags like "krodha" are expanded)
            limit: Maximum results to return
            exclude_refs: Verse references to exclude
            chapters: Optional list of chapters to search within

        Returns:
            List of VerseSearchResult sorted by relevance score
        """
        exclude_refs = exclude_refs or []

        # Expand enemy tags to related themes
        expanded_themes: set[str] = set()
        for tag in tags:
            tag_lower = tag.lower()
            if tag_lower in ENEMY_TAG_THEMES:
                expanded_themes.update(ENEMY_TAG_THEMES[tag_lower])
            # Also check modern themes
            elif tag_lower in MODERN_THEMES:
                expanded_themes.update(MODERN_THEMES[tag_lower])
            else:
                expanded_themes.add(tag_lower)

        # Add chapter-specific themes if chapters provided
        if chapters:
            for ch in chapters:
                if ch in CHAPTER_THEMES:
                    expanded_themes.update(CHAPTER_THEMES[ch])

        try:
            # Query GitaVerse with theme/keyword matching
            # Using JSON contains for themes array
            conditions = []

            for theme in list(expanded_themes)[:10]:  # Limit to avoid query explosion
                conditions.append(
                    func.lower(func.cast(GitaVerse.themes, String)).contains(theme.lower())
                )
                conditions.append(
                    func.lower(func.cast(GitaVerse.keywords, String)).contains(theme.lower())
                )

            if not conditions:
                # Fallback to random selection if no themes
                return await self.random_by_tags(db, ["general"], limit, exclude_refs)

            result = await db.execute(
                select(GitaVerse)
                .where(or_(*conditions))
                .limit(limit * 3)  # Get more for filtering
            )
            verses = list(result.scalars().all())

            # Filter out excluded refs and score
            scored_results: list[VerseSearchResult] = []

            for v in verses:
                # Skip excluded
                if any(
                    r["chapter"] == v.chapter and r["verse"] == v.verse
                    for r in exclude_refs
                ):
                    continue

                # Calculate relevance score
                score = self._calculate_relevance(v, expanded_themes)

                scored_results.append({
                    "chapter": v.chapter,
                    "verse": v.verse,
                    "score": score,
                    "themes": getattr(v, "themes", []) or [],
                })

            # Sort by score and limit
            scored_results.sort(key=lambda x: x["score"], reverse=True)
            return scored_results[:limit]

        except Exception as e:
            logger.error(f"Error searching verses by tags: {e}")
            return await self.random_by_tags(db, tags, limit, exclude_refs)

    def _calculate_relevance(
        self,
        verse: GitaVerse,
        themes: set[str],
    ) -> float:
        """Calculate relevance score for a verse based on theme overlap."""
        score = 0.0

        verse_themes = set(t.lower() for t in (getattr(verse, "themes", []) or []))
        verse_keywords = set(k.lower() for k in (getattr(verse, "keywords", []) or []))

        # Theme matches
        theme_overlap = len(themes & verse_themes)
        score += theme_overlap * 0.3

        # Keyword matches
        keyword_overlap = len(themes & verse_keywords)
        score += keyword_overlap * 0.2

        # Journey relevance boost
        if hasattr(verse, "journey_relevance_score") and verse.journey_relevance_score:
            score += float(verse.journey_relevance_score) * 0.2

        # Normalize to 0-1
        return min(score, 1.0)

    async def random_by_tags(
        self,
        db: AsyncSession,
        tags: list[str],
        limit: int = 3,
        exclude_refs: list[VerseReference] | None = None,
    ) -> list[VerseSearchResult]:
        """
        Get random verses matching tags.

        Args:
            db: Database session
            tags: Tags to filter by (can be empty for truly random)
            limit: Number of verses to return
            exclude_refs: Verse references to exclude

        Returns:
            List of random VerseSearchResult
        """
        exclude_refs = exclude_refs or []

        try:
            # Get verses matching at least one tag
            if tags and tags != ["general"]:
                results = await self.search_by_tags(db, tags, limit * 3, exclude_refs)
                if results:
                    random.shuffle(results)
                    return results[:limit]

            # Fallback: get random verses
            result = await db.execute(
                select(GitaVerse)
                .order_by(func.random())
                .limit(limit * 3)
            )
            verses = list(result.scalars().all())

            # Filter excluded
            filtered: list[VerseSearchResult] = []
            for v in verses:
                if any(
                    r["chapter"] == v.chapter and r["verse"] == v.verse
                    for r in exclude_refs
                ):
                    continue

                filtered.append({
                    "chapter": v.chapter,
                    "verse": v.verse,
                    "score": 0.5,  # Neutral score for random
                    "themes": getattr(v, "themes", []) or [],
                })

                if len(filtered) >= limit:
                    break

            return filtered

        except Exception as e:
            logger.error(f"Error getting random verses: {e}")
            # Return fallback key verses
            return self._get_fallback_verses(limit, exclude_refs)

    def _get_fallback_verses(
        self,
        limit: int,
        exclude_refs: list[VerseReference] | None = None,
    ) -> list[VerseSearchResult]:
        """Return fallback key verses when database queries fail."""
        exclude_refs = exclude_refs or []

        fallback_refs = [
            {"chapter": 2, "verse": 47, "score": 0.9, "themes": ["karma", "detachment", "action"]},
            {"chapter": 2, "verse": 48, "score": 0.85, "themes": ["equanimity", "balance"]},
            {"chapter": 6, "verse": 5, "score": 0.8, "themes": ["self-improvement", "mind"]},
            {"chapter": 2, "verse": 14, "score": 0.75, "themes": ["impermanence", "endurance"]},
            {"chapter": 12, "verse": 13, "score": 0.7, "themes": ["compassion", "kindness"]},
            {"chapter": 18, "verse": 66, "score": 0.65, "themes": ["surrender", "faith"]},
            {"chapter": 3, "verse": 19, "score": 0.6, "themes": ["duty", "action"]},
            {"chapter": 5, "verse": 10, "score": 0.55, "themes": ["surrender", "detachment"]},
        ]

        filtered = [
            r for r in fallback_refs
            if not any(
                e["chapter"] == r["chapter"] and e["verse"] == r["verse"]
                for e in exclude_refs
            )
        ]

        return filtered[:limit]

    async def get_verses_for_enemy(
        self,
        db: AsyncSession,
        enemy: str,
        limit: int = 3,
        exclude_refs: list[VerseReference] | None = None,
    ) -> list[VerseSearchResult]:
        """
        Get verses relevant to overcoming a specific inner enemy.

        Args:
            db: Database session
            enemy: Enemy tag (kama, krodha, lobha, moha, mada, matsarya)
            limit: Number of verses
            exclude_refs: Verses to exclude

        Returns:
            List of relevant VerseSearchResult
        """
        enemy_lower = enemy.lower()

        if enemy_lower not in ENEMY_TAG_THEMES:
            logger.warning(f"Unknown enemy tag: {enemy}, using general verses")
            return await self.random_by_tags(db, ["general"], limit, exclude_refs)

        # Get themes for this enemy plus virtue tags
        themes = ENEMY_TAG_THEMES[enemy_lower].copy()
        if enemy_lower in VIRTUE_TAGS:
            themes.append(VIRTUE_TAGS[enemy_lower])

        return await self.search_by_tags(db, themes, limit, exclude_refs)

    def get_enemy_themes(self, enemy: str) -> list[str]:
        """Get the list of themes associated with an enemy tag."""
        return ENEMY_TAG_THEMES.get(enemy.lower(), [])

    def get_virtue_for_enemy(self, enemy: str) -> str:
        """Get the virtue that counters a specific enemy."""
        return VIRTUE_TAGS.get(enemy.lower(), "peace")

    def get_recommended_chapters(self, enemy: str) -> list[int]:
        """
        Get recommended Gita chapters for addressing a specific enemy.

        Returns chapters from the 18-chapter corpus most relevant to each enemy.
        """
        # Map enemies to most relevant chapters from the 700+ verse corpus
        chapter_recommendations = {
            "kama": [2, 3, 5, 6, 13, 14, 15],  # Desire, senses, detachment
            "krodha": [2, 3, 6, 12, 16],        # Anger, equanimity, divine qualities
            "lobha": [2, 3, 5, 12, 16, 17],     # Greed, charity, selflessness
            "moha": [2, 4, 7, 13, 14, 15, 18],  # Delusion, knowledge, wisdom
            "mada": [2, 9, 11, 12, 16, 18],     # Pride, devotion, surrender
            "matsarya": [2, 6, 12, 14, 16],     # Envy, equanimity, divine qualities
            "mixed": list(range(1, 19)),        # All 18 chapters for comprehensive journey
        }
        return chapter_recommendations.get(enemy.lower(), list(range(1, 19)))

    def get_chapter_themes(self, chapter: int) -> list[str]:
        """Get themes for a specific chapter."""
        return CHAPTER_THEMES.get(chapter, [])

    def get_modern_themes(self, context: str) -> list[str]:
        """Get verse search themes for modern life contexts."""
        return MODERN_THEMES.get(context.lower(), [])

    async def get_verses_from_chapters(
        self,
        db: AsyncSession,
        chapters: list[int],
        limit: int = 10,
        exclude_refs: list[VerseReference] | None = None,
    ) -> list[VerseSearchResult]:
        """
        Get random verses from specific chapters.

        Args:
            db: Database session
            chapters: List of chapter numbers to search
            limit: Maximum verses to return
            exclude_refs: Verses to exclude

        Returns:
            List of VerseSearchResult from the specified chapters
        """
        exclude_refs = exclude_refs or []

        try:
            result = await db.execute(
                select(GitaVerse)
                .where(GitaVerse.chapter.in_(chapters))
                .order_by(func.random())
                .limit(limit * 3)
            )
            verses = list(result.scalars().all())

            # Filter excluded
            filtered: list[VerseSearchResult] = []
            for v in verses:
                if any(
                    r["chapter"] == v.chapter and r["verse"] == v.verse
                    for r in exclude_refs
                ):
                    continue

                filtered.append({
                    "chapter": v.chapter,
                    "verse": v.verse,
                    "score": 0.7,  # Chapter-based selection score
                    "themes": getattr(v, "themes", []) or [],
                })

                if len(filtered) >= limit:
                    break

            return filtered

        except Exception as e:
            logger.error(f"Error getting verses from chapters: {e}")
            return self._get_fallback_verses(limit, exclude_refs)

    def clear_cache(self) -> None:
        """Clear the verse text cache."""
        self._cache.clear()


# Singleton instance
_adapter_instance: GitaCorpusAdapter | None = None


def get_gita_corpus_adapter() -> GitaCorpusAdapter:
    """Get the singleton GitaCorpusAdapter instance."""
    global _adapter_instance
    if _adapter_instance is None:
        _adapter_instance = GitaCorpusAdapter()
    return _adapter_instance


# Convenience exports
gita_corpus = get_gita_corpus_adapter()
