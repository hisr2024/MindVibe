"""
Unified Wisdom Core - The Single Source of Truth for KIAAN's Wisdom.

This module provides a unified interface for accessing all wisdom content:
1. Static Gita Corpus (700+ authenticated verses from gita_verses table)
2. Dynamically Learned Wisdom (content from 24/7 daemon in learned_wisdom table)
3. User Query Patterns (for AI-free response templates)

Architecture:
    ┌─────────────────────────────────────────────────────────────────┐
    │                        WISDOM CORE                              │
    │                  (Single Source of Truth)                       │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │  ┌──────────────────┐     ┌──────────────────────────────────┐ │
    │  │   STATIC CORPUS  │     │      DYNAMIC LEARNING            │ │
    │  │                  │     │                                  │ │
    │  │  gita_verses     │     │  learned_wisdom                  │ │
    │  │  (700+ verses)   │     │  (24/7 daemon content)           │ │
    │  │                  │     │                                  │ │
    │  │  gita_chapters   │     │  user_query_patterns             │ │
    │  │  (18 chapters)   │     │  (intent → response templates)   │ │
    │  │                  │     │                                  │ │
    │  │  gita_sources    │     │  content_source_registry         │ │
    │  │  (attributions)  │     │  (YouTube, Audio, Web sources)   │ │
    │  └──────────────────┘     └──────────────────────────────────┘ │
    │                                                                 │
    │                    ┌─────────────────┐                         │
    │                    │  SEARCH ENGINE  │                         │
    │                    │                 │                         │
    │                    │  - Semantic     │                         │
    │                    │  - Keyword      │                         │
    │                    │  - Theme-based  │                         │
    │                    │  - Domain-based │                         │
    │                    └─────────────────┘                         │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                            ┌─────────────┐
                            │  KIAAN CORE │
                            └─────────────┘

Usage:
    from backend.services.wisdom_core import WisdomCore

    wisdom = WisdomCore()
    async with get_db_session() as db:
        # Search across all wisdom (static + learned)
        results = await wisdom.search(db, "finding peace in chaos", limit=5)

        # Get wisdom by theme
        verses = await wisdom.get_by_theme(db, "equanimity")

        # Get wisdom for inner enemy (Shad Ripu)
        anger_wisdom = await wisdom.get_for_enemy(db, "krodha")

        # Get wisdom by mental health domain
        anxiety_help = await wisdom.get_by_domain(db, "anxiety")
"""

from __future__ import annotations

import difflib
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    ContentSourceType,
    GitaChapter,
    GitaVerse,
    LearnedWisdom,
    UserQueryPattern,
    ValidationStatus,
)
from backend.services.db_knowledge_store import DatabaseKnowledgeStore

logger = logging.getLogger(__name__)


# =============================================================================
# DATA CLASSES
# =============================================================================


class WisdomSource(str, Enum):
    """Source of wisdom content."""

    GITA_VERSE = "gita_verse"  # Static authenticated verse
    LEARNED = "learned"  # Dynamically learned content
    PATTERN = "pattern"  # From query pattern template


@dataclass
class WisdomResult:
    """
    A single wisdom search result with relevance scoring.

    Unified format for both GitaVerse and LearnedWisdom content.
    """

    # Core content
    id: str
    content: str  # Main text (English for verses, content for learned)
    source: WisdomSource

    # Relevance
    score: float  # 0.0 - 10.0 relevance score
    match_reasons: list[str] = field(default_factory=list)

    # Gita reference (if applicable)
    chapter: Optional[int] = None
    verse: Optional[int] = None
    verse_ref: Optional[str] = None  # "2.47" format

    # Additional content
    sanskrit: Optional[str] = None
    hindi: Optional[str] = None
    transliteration: Optional[str] = None

    # Categorization
    theme: Optional[str] = None
    principle: Optional[str] = None
    themes: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)

    # Mental health
    primary_domain: Optional[str] = None
    secondary_domains: list[str] = field(default_factory=list)
    mental_health_applications: list[str] = field(default_factory=list)
    shad_ripu_tags: list[str] = field(default_factory=list)

    # Source info
    source_name: Optional[str] = None
    source_url: Optional[str] = None

    # Metadata
    quality_score: float = 1.0
    usage_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "content": self.content,
            "source": self.source.value,
            "score": self.score,
            "match_reasons": self.match_reasons,
            "chapter": self.chapter,
            "verse": self.verse,
            "verse_ref": self.verse_ref,
            "sanskrit": self.sanskrit,
            "hindi": self.hindi,
            "transliteration": self.transliteration,
            "theme": self.theme,
            "principle": self.principle,
            "themes": self.themes,
            "keywords": self.keywords,
            "primary_domain": self.primary_domain,
            "secondary_domains": self.secondary_domains,
            "mental_health_applications": self.mental_health_applications,
            "shad_ripu_tags": self.shad_ripu_tags,
            "source_name": self.source_name,
            "source_url": self.source_url,
            "quality_score": self.quality_score,
            "usage_count": self.usage_count,
        }


@dataclass
class WisdomStats:
    """Statistics about the wisdom corpus."""

    # Static corpus
    total_gita_verses: int = 0
    gita_chapters: int = 18
    gita_sources: int = 0

    # Learned corpus
    total_learned_wisdom: int = 0
    validated_learned: int = 0
    pending_learned: int = 0

    # Patterns
    total_patterns: int = 0

    # Coverage
    languages: list[str] = field(default_factory=list)
    chapters_with_learned: list[int] = field(default_factory=list)
    domains_covered: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "static_corpus": {
                "gita_verses": self.total_gita_verses,
                "chapters": self.gita_chapters,
                "sources": self.gita_sources,
            },
            "learned_corpus": {
                "total": self.total_learned_wisdom,
                "validated": self.validated_learned,
                "pending": self.pending_learned,
            },
            "patterns": {
                "total": self.total_patterns,
            },
            "coverage": {
                "languages": self.languages,
                "chapters_with_learned": self.chapters_with_learned,
                "domains": self.domains_covered,
            },
        }


# =============================================================================
# SHAD RIPU (SIX INNER ENEMIES) MAPPING
# =============================================================================

SHAD_RIPU_THEMES = {
    "kama": [
        "desire",
        "lust",
        "craving",
        "attachment",
        "restraint",
        "control",
        "detachment",
        "brahmacharya",
        "vairagya",
        "moderation",
    ],
    "krodha": [
        "anger",
        "wrath",
        "rage",
        "peace",
        "calm",
        "equanimity",
        "patience",
        "forgiveness",
        "tolerance",
        "serenity",
    ],
    "lobha": [
        "greed",
        "avarice",
        "hoarding",
        "contentment",
        "generosity",
        "charity",
        "dana",
        "santosha",
        "giving",
        "sharing",
    ],
    "moha": [
        "delusion",
        "ignorance",
        "confusion",
        "clarity",
        "wisdom",
        "knowledge",
        "viveka",
        "jnana",
        "discernment",
        "understanding",
    ],
    "mada": [
        "pride",
        "ego",
        "arrogance",
        "humility",
        "surrender",
        "service",
        "bhakti",
        "namrata",
        "modesty",
        "selflessness",
    ],
    "matsarya": [
        "envy",
        "jealousy",
        "resentment",
        "joy",
        "compassion",
        "empathy",
        "mudita",
        "ananda",
        "appreciation",
        "celebration",
    ],
}

# Mental health domains and their related themes
DOMAIN_THEMES = {
    "anxiety": ["peace", "calm", "equanimity", "breath", "grounding", "trust", "surrender"],
    "depression": ["hope", "light", "purpose", "meaning", "joy", "renewal", "strength"],
    "stress": ["balance", "action", "detachment", "mindfulness", "resilience", "flow"],
    "grief": ["acceptance", "healing", "compassion", "eternal", "love", "letting_go"],
    "anger": ["patience", "forgiveness", "peace", "control", "equanimity", "understanding"],
    "loneliness": ["connection", "unity", "love", "inner_self", "devotion", "wholeness"],
    "fear": ["courage", "strength", "trust", "faith", "protection", "inner_power"],
    "self_doubt": ["confidence", "worth", "self_compassion", "growth", "potential"],
    "confusion": ["clarity", "wisdom", "discernment", "guidance", "understanding"],
    "overwhelm": ["simplicity", "priority", "breath", "presence", "peace", "balance"],
}


# =============================================================================
# WISDOM CORE CLASS
# =============================================================================


class WisdomCore:
    """
    Unified Wisdom Core - The single source of truth for all KIAAN wisdom.

    Integrates:
    - Static Gita Corpus (700+ verses)
    - Dynamically Learned Wisdom (from 24/7 daemon)
    - User Query Patterns (for AI-free responses)

    This is the primary interface KIAAN should use for all wisdom retrieval.
    """

    # Score weights for ranking
    CONTENT_MATCH_WEIGHT = 5.0
    THEME_MATCH_WEIGHT = 3.0
    KEYWORD_MATCH_WEIGHT = 2.0
    DOMAIN_MATCH_WEIGHT = 2.5
    QUALITY_WEIGHT = 1.0

    def __init__(self):
        """Initialize the Wisdom Core."""
        self._gita_cache: Optional[list[GitaVerse]] = None
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl_seconds = 300  # 5 minute cache
        self._db_store = DatabaseKnowledgeStore()

    # =========================================================================
    # UNIFIED SEARCH
    # =========================================================================

    async def search(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 10,
        include_learned: bool = True,
        validated_only: bool = True,
        language: str = "en",
    ) -> list[WisdomResult]:
        """
        Search across all wisdom sources (Gita + Learned).

        This is the primary search method for KIAAN to use.

        Args:
            db: Database session
            query: Search query text
            limit: Maximum results to return
            include_learned: Include learned wisdom (default: True)
            validated_only: Only validated learned wisdom (default: True)
            language: Preferred language code

        Returns:
            List of WisdomResult sorted by relevance score (highest first)
        """
        results: list[WisdomResult] = []
        query_lower = query.lower()
        query_keywords = {w for w in query_lower.split() if len(w) > 2}

        # 1. Search static Gita corpus
        gita_results = await self._search_gita_verses(db, query, query_keywords, limit * 2)
        results.extend(gita_results)

        # 2. Search learned wisdom (if enabled)
        if include_learned:
            learned_results = await self._search_learned_wisdom(
                db, query, query_keywords, validated_only, limit * 2
            )
            results.extend(learned_results)

        # 3. Sort by score and deduplicate
        results.sort(key=lambda r: r.score, reverse=True)

        # Deduplicate by content similarity
        unique_results = self._deduplicate_results(results)

        return unique_results[:limit]

    async def _search_gita_verses(
        self,
        db: AsyncSession,
        query: str,
        query_keywords: set[str],
        limit: int,
    ) -> list[WisdomResult]:
        """Search the static Gita verse corpus."""
        results = []

        # Fetch verses (with caching)
        verses = await self._get_cached_gita_verses(db)

        for verse in verses:
            score, reasons = self._score_gita_verse(verse, query, query_keywords)

            if score > 0:
                result = WisdomResult(
                    id=f"gita_{verse.chapter}_{verse.verse}",
                    content=verse.english,
                    source=WisdomSource.GITA_VERSE,
                    score=score,
                    match_reasons=reasons,
                    chapter=verse.chapter,
                    verse=verse.verse,
                    verse_ref=f"{verse.chapter}.{verse.verse}",
                    sanskrit=verse.sanskrit,
                    hindi=verse.hindi,
                    transliteration=verse.transliteration,
                    theme=verse.theme,
                    principle=verse.principle,
                    primary_domain=verse.primary_domain,
                    secondary_domains=verse.secondary_domains or [],
                    mental_health_applications=verse.mental_health_applications or [],
                    source_name="Bhagavad Gita",
                    quality_score=1.0,  # Static verses are highest quality
                )
                results.append(result)

        # Sort and limit
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]

    async def _search_learned_wisdom(
        self,
        db: AsyncSession,
        query: str,
        query_keywords: set[str],
        validated_only: bool,
        limit: int,
    ) -> list[WisdomResult]:
        """Search the dynamically learned wisdom."""
        results = []

        # Build query
        base_query = select(LearnedWisdom).where(
            LearnedWisdom.deleted_at.is_(None),
        )

        if validated_only:
            base_query = base_query.where(
                LearnedWisdom.validation_status == ValidationStatus.VALIDATED
            )

        base_query = base_query.limit(limit * 5)

        result = await db.execute(base_query)
        learned_items = result.scalars().all()

        for item in learned_items:
            score, reasons = self._score_learned_wisdom(item, query, query_keywords)

            if score > 0:
                # Build verse_ref if chapter/verse refs exist
                verse_ref = None
                if item.verse_refs and len(item.verse_refs) > 0:
                    first_ref = item.verse_refs[0]
                    if len(first_ref) >= 2:
                        verse_ref = f"{first_ref[0]}.{first_ref[1]}"

                result_item = WisdomResult(
                    id=f"learned_{item.id}",
                    content=item.content,
                    source=WisdomSource.LEARNED,
                    score=score,
                    match_reasons=reasons,
                    chapter=item.chapter_refs[0] if item.chapter_refs else None,
                    verse_ref=verse_ref,
                    themes=item.themes or [],
                    keywords=item.keywords or [],
                    primary_domain=item.primary_domain,
                    secondary_domains=item.secondary_domains or [],
                    mental_health_applications=item.mental_health_applications or [],
                    shad_ripu_tags=item.shad_ripu_tags or [],
                    source_name=item.source_name,
                    source_url=item.source_url,
                    quality_score=float(item.quality_score),
                    usage_count=item.usage_count,
                )
                results.append(result_item)

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]

    def _score_gita_verse(
        self, verse: GitaVerse, query: str, query_keywords: set[str]
    ) -> tuple[float, list[str]]:
        """Score a Gita verse for relevance to query."""
        score = 0.0
        reasons = []
        query_lower = query.lower()

        # Content match
        english_lower = verse.english.lower()
        if query_lower in english_lower:
            score += self.CONTENT_MATCH_WEIGHT
            reasons.append("content_match")
        else:
            # Keyword matching
            for kw in query_keywords:
                if kw in english_lower:
                    score += self.KEYWORD_MATCH_WEIGHT * 0.5
                    reasons.append(f"keyword:{kw}")

        # Theme match
        if verse.theme:
            theme_lower = verse.theme.lower().replace("_", " ")
            for kw in query_keywords:
                if kw in theme_lower:
                    score += self.THEME_MATCH_WEIGHT
                    reasons.append(f"theme:{verse.theme}")
                    break

        # Principle match
        if verse.principle:
            principle_lower = verse.principle.lower()
            for kw in query_keywords:
                if kw in principle_lower:
                    score += self.KEYWORD_MATCH_WEIGHT
                    reasons.append(f"principle:{verse.principle}")
                    break

        # Domain match
        if verse.primary_domain:
            domain_lower = verse.primary_domain.lower()
            for kw in query_keywords:
                if kw in domain_lower:
                    score += self.DOMAIN_MATCH_WEIGHT
                    reasons.append(f"domain:{verse.primary_domain}")
                    break

        # Mental health applications match
        if verse.mental_health_applications:
            for app in verse.mental_health_applications:
                app_lower = app.lower()
                for kw in query_keywords:
                    if kw in app_lower:
                        score += self.DOMAIN_MATCH_WEIGHT * 0.5
                        reasons.append(f"application:{app}")
                        break

        return score, reasons

    def _score_learned_wisdom(
        self, item: LearnedWisdom, query: str, query_keywords: set[str]
    ) -> tuple[float, list[str]]:
        """Score a learned wisdom item for relevance to query."""
        score = 0.0
        reasons = []
        query_lower = query.lower()

        # Content match
        content_lower = item.content.lower()
        if query_lower in content_lower:
            score += self.CONTENT_MATCH_WEIGHT
            reasons.append("content_match")
        else:
            for kw in query_keywords:
                if kw in content_lower:
                    score += self.KEYWORD_MATCH_WEIGHT * 0.5
                    reasons.append(f"keyword:{kw}")

        # Theme match
        for theme in item.themes or []:
            theme_lower = theme.lower()
            for kw in query_keywords:
                if kw in theme_lower:
                    score += self.THEME_MATCH_WEIGHT
                    reasons.append(f"theme:{theme}")
                    break

        # Keyword match
        for keyword in item.keywords or []:
            kw_lower = keyword.lower()
            for qkw in query_keywords:
                if qkw in kw_lower or kw_lower in qkw:
                    score += self.KEYWORD_MATCH_WEIGHT
                    reasons.append(f"indexed_keyword:{keyword}")
                    break

        # Shad Ripu match
        for tag in item.shad_ripu_tags or []:
            if tag.lower() in query_lower:
                score += self.DOMAIN_MATCH_WEIGHT
                reasons.append(f"shad_ripu:{tag}")

        # Quality score bonus
        score += float(item.quality_score) * self.QUALITY_WEIGHT

        return score, list(set(reasons))  # Deduplicate reasons

    def _deduplicate_results(
        self, results: list[WisdomResult], similarity_threshold: float = 0.85
    ) -> list[WisdomResult]:
        """Remove duplicate or highly similar results."""
        unique = []

        for result in results:
            is_duplicate = False
            for existing in unique:
                similarity = difflib.SequenceMatcher(
                    None, result.content[:200].lower(), existing.content[:200].lower()
                ).ratio()
                if similarity > similarity_threshold:
                    is_duplicate = True
                    break

            if not is_duplicate:
                unique.append(result)

        return unique

    # =========================================================================
    # THEME-BASED RETRIEVAL
    # =========================================================================

    async def get_by_theme(
        self,
        db: AsyncSession,
        theme: str,
        limit: int = 10,
        include_learned: bool = True,
    ) -> list[WisdomResult]:
        """
        Get wisdom by theme.

        Args:
            db: Database session
            theme: Theme to search for (e.g., "peace", "equanimity", "action")
            limit: Maximum results
            include_learned: Include learned wisdom

        Returns:
            List of WisdomResult sorted by relevance
        """
        results = []
        theme_lower = theme.lower()

        # 1. Search Gita verses by theme
        gita_query = select(GitaVerse).where(
            func.lower(GitaVerse.theme).contains(theme_lower)
        ).limit(limit)

        gita_result = await db.execute(gita_query)
        gita_verses = gita_result.scalars().all()

        for verse in gita_verses:
            results.append(
                WisdomResult(
                    id=f"gita_{verse.chapter}_{verse.verse}",
                    content=verse.english,
                    source=WisdomSource.GITA_VERSE,
                    score=5.0,  # Direct theme match
                    match_reasons=[f"theme:{verse.theme}"],
                    chapter=verse.chapter,
                    verse=verse.verse,
                    verse_ref=f"{verse.chapter}.{verse.verse}",
                    sanskrit=verse.sanskrit,
                    hindi=verse.hindi,
                    theme=verse.theme,
                    principle=verse.principle,
                    primary_domain=verse.primary_domain,
                    source_name="Bhagavad Gita",
                    quality_score=1.0,
                )
            )

        # 2. Search learned wisdom by theme
        if include_learned:
            learned = await self._db_store.get_wisdom_by_theme(db, theme, limit=limit)
            for item in learned:
                results.append(
                    WisdomResult(
                        id=f"learned_{item.id}",
                        content=item.content,
                        source=WisdomSource.LEARNED,
                        score=4.0 + float(item.quality_score),
                        match_reasons=[f"theme:{theme}"],
                        themes=item.themes or [],
                        shad_ripu_tags=item.shad_ripu_tags or [],
                        source_name=item.source_name,
                        quality_score=float(item.quality_score),
                    )
                )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]

    # =========================================================================
    # SHAD RIPU (INNER ENEMY) RETRIEVAL
    # =========================================================================

    async def get_for_enemy(
        self,
        db: AsyncSession,
        enemy: str,
        limit: int = 10,
        include_learned: bool = True,
    ) -> list[WisdomResult]:
        """
        Get wisdom for a specific inner enemy (Shad Ripu).

        Args:
            db: Database session
            enemy: One of: kama, krodha, lobha, moha, mada, matsarya
            limit: Maximum results
            include_learned: Include learned wisdom

        Returns:
            List of WisdomResult relevant to transforming that enemy
        """
        results = []
        enemy_lower = enemy.lower()

        # Get related themes for this enemy
        related_themes = SHAD_RIPU_THEMES.get(enemy_lower, [])

        # 1. Search Gita verses by related themes
        verses = await self._get_cached_gita_verses(db)

        for verse in verses:
            score = 0.0
            reasons = []

            # Check theme match
            if verse.theme:
                verse_theme = verse.theme.lower().replace("_", " ")
                for theme in related_themes:
                    if theme in verse_theme:
                        score += 3.0
                        reasons.append(f"theme:{verse.theme}")
                        break

            # Check principle match
            if verse.principle:
                principle_lower = verse.principle.lower()
                for theme in related_themes:
                    if theme in principle_lower:
                        score += 2.0
                        reasons.append(f"principle:{verse.principle}")
                        break

            # Check content match
            english_lower = verse.english.lower()
            for theme in related_themes[:5]:  # Check top 5 themes
                if theme in english_lower:
                    score += 1.0
                    reasons.append(f"content_theme:{theme}")

            if score > 0:
                results.append(
                    WisdomResult(
                        id=f"gita_{verse.chapter}_{verse.verse}",
                        content=verse.english,
                        source=WisdomSource.GITA_VERSE,
                        score=score,
                        match_reasons=reasons,
                        chapter=verse.chapter,
                        verse=verse.verse,
                        verse_ref=f"{verse.chapter}.{verse.verse}",
                        sanskrit=verse.sanskrit,
                        hindi=verse.hindi,
                        theme=verse.theme,
                        shad_ripu_tags=[enemy_lower],
                        source_name="Bhagavad Gita",
                        quality_score=1.0,
                    )
                )

        # 2. Search learned wisdom by shad ripu tag
        if include_learned:
            learned = await self._db_store.get_wisdom_by_shad_ripu(
                db, enemy_lower, limit=limit
            )
            for item in learned:
                results.append(
                    WisdomResult(
                        id=f"learned_{item.id}",
                        content=item.content,
                        source=WisdomSource.LEARNED,
                        score=4.0 + float(item.quality_score),
                        match_reasons=[f"shad_ripu:{enemy_lower}"],
                        shad_ripu_tags=item.shad_ripu_tags or [],
                        themes=item.themes or [],
                        source_name=item.source_name,
                        quality_score=float(item.quality_score),
                    )
                )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]

    # =========================================================================
    # MENTAL HEALTH DOMAIN RETRIEVAL
    # =========================================================================

    async def get_by_domain(
        self,
        db: AsyncSession,
        domain: str,
        limit: int = 10,
        include_learned: bool = True,
    ) -> list[WisdomResult]:
        """
        Get wisdom by mental health domain.

        Args:
            db: Database session
            domain: Domain like "anxiety", "depression", "stress", etc.
            limit: Maximum results
            include_learned: Include learned wisdom

        Returns:
            List of WisdomResult for that domain
        """
        results = []
        domain_lower = domain.lower()

        # Get related themes for this domain
        related_themes = DOMAIN_THEMES.get(domain_lower, [])

        # 1. Search Gita verses by domain
        gita_query = select(GitaVerse).where(
            or_(
                GitaVerse.primary_domain == domain_lower,
                GitaVerse.secondary_domains.contains([domain_lower]),
            )
        ).limit(limit)

        gita_result = await db.execute(gita_query)
        domain_verses = gita_result.scalars().all()

        for verse in domain_verses:
            results.append(
                WisdomResult(
                    id=f"gita_{verse.chapter}_{verse.verse}",
                    content=verse.english,
                    source=WisdomSource.GITA_VERSE,
                    score=5.0,
                    match_reasons=[f"domain:{domain_lower}"],
                    chapter=verse.chapter,
                    verse=verse.verse,
                    verse_ref=f"{verse.chapter}.{verse.verse}",
                    sanskrit=verse.sanskrit,
                    hindi=verse.hindi,
                    theme=verse.theme,
                    primary_domain=verse.primary_domain,
                    source_name="Bhagavad Gita",
                    quality_score=1.0,
                )
            )

        # Also search by related themes if we don't have enough results
        if len(results) < limit and related_themes:
            verses = await self._get_cached_gita_verses(db)
            for verse in verses:
                if f"gita_{verse.chapter}_{verse.verse}" in [r.id for r in results]:
                    continue

                if verse.theme:
                    theme_lower = verse.theme.lower().replace("_", " ")
                    for theme in related_themes:
                        if theme in theme_lower:
                            results.append(
                                WisdomResult(
                                    id=f"gita_{verse.chapter}_{verse.verse}",
                                    content=verse.english,
                                    source=WisdomSource.GITA_VERSE,
                                    score=3.0,
                                    match_reasons=[f"domain_theme:{theme}"],
                                    chapter=verse.chapter,
                                    verse=verse.verse,
                                    verse_ref=f"{verse.chapter}.{verse.verse}",
                                    theme=verse.theme,
                                    source_name="Bhagavad Gita",
                                    quality_score=1.0,
                                )
                            )
                            break

                if len(results) >= limit * 2:
                    break

        # 2. Search learned wisdom by domain
        if include_learned:
            learned = await self._db_store.get_wisdom_by_domain(
                db, domain_lower, limit=limit
            )
            for item in learned:
                results.append(
                    WisdomResult(
                        id=f"learned_{item.id}",
                        content=item.content,
                        source=WisdomSource.LEARNED,
                        score=4.0 + float(item.quality_score),
                        match_reasons=[f"domain:{domain_lower}"],
                        primary_domain=item.primary_domain,
                        mental_health_applications=item.mental_health_applications or [],
                        source_name=item.source_name,
                        quality_score=float(item.quality_score),
                    )
                )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]

    # =========================================================================
    # SPECIFIC VERSE RETRIEVAL
    # =========================================================================

    async def get_verse(
        self, db: AsyncSession, chapter: int, verse: int
    ) -> Optional[WisdomResult]:
        """
        Get a specific Gita verse by chapter and verse number.

        Args:
            db: Database session
            chapter: Chapter number (1-18)
            verse: Verse number

        Returns:
            WisdomResult or None if not found
        """
        result = await db.execute(
            select(GitaVerse).where(
                GitaVerse.chapter == chapter,
                GitaVerse.verse == verse,
            )
        )
        gita_verse = result.scalar_one_or_none()

        if not gita_verse:
            return None

        return WisdomResult(
            id=f"gita_{chapter}_{verse}",
            content=gita_verse.english,
            source=WisdomSource.GITA_VERSE,
            score=10.0,  # Exact match
            match_reasons=["exact_reference"],
            chapter=chapter,
            verse=verse,
            verse_ref=f"{chapter}.{verse}",
            sanskrit=gita_verse.sanskrit,
            hindi=gita_verse.hindi,
            transliteration=gita_verse.transliteration,
            theme=gita_verse.theme,
            principle=gita_verse.principle,
            primary_domain=gita_verse.primary_domain,
            secondary_domains=gita_verse.secondary_domains or [],
            mental_health_applications=gita_verse.mental_health_applications or [],
            source_name="Bhagavad Gita",
            quality_score=1.0,
        )

    async def get_chapter_verses(
        self, db: AsyncSession, chapter: int
    ) -> list[WisdomResult]:
        """Get all verses from a specific chapter."""
        result = await db.execute(
            select(GitaVerse)
            .where(GitaVerse.chapter == chapter)
            .order_by(GitaVerse.verse)
        )
        verses = result.scalars().all()

        return [
            WisdomResult(
                id=f"gita_{v.chapter}_{v.verse}",
                content=v.english,
                source=WisdomSource.GITA_VERSE,
                score=5.0,
                match_reasons=[f"chapter:{chapter}"],
                chapter=v.chapter,
                verse=v.verse,
                verse_ref=f"{v.chapter}.{v.verse}",
                sanskrit=v.sanskrit,
                hindi=v.hindi,
                theme=v.theme,
                source_name="Bhagavad Gita",
                quality_score=1.0,
            )
            for v in verses
        ]

    # =========================================================================
    # STATISTICS & HEALTH
    # =========================================================================

    async def get_statistics(self, db: AsyncSession) -> WisdomStats:
        """Get comprehensive statistics about the wisdom corpus."""
        stats = WisdomStats()

        # Gita verses count
        gita_count = await db.execute(select(func.count(GitaVerse.id)))
        stats.total_gita_verses = gita_count.scalar() or 0

        # Gita chapters
        chapter_count = await db.execute(select(func.count(GitaChapter.id)))
        stats.gita_chapters = chapter_count.scalar() or 18

        # Learned wisdom counts
        db_stats = await self._db_store.get_statistics(db)
        stats.total_learned_wisdom = db_stats["wisdom"]["total"]
        stats.validated_learned = db_stats["wisdom"]["validated"]
        stats.pending_learned = db_stats["wisdom"]["pending"]
        stats.total_patterns = db_stats["patterns"]["total"]
        stats.languages = db_stats["coverage"]["languages"]
        stats.chapters_with_learned = db_stats["coverage"]["chapters"]

        # Domains covered
        domains_result = await db.execute(
            select(LearnedWisdom.primary_domain)
            .where(
                LearnedWisdom.primary_domain.isnot(None),
                LearnedWisdom.deleted_at.is_(None),
            )
            .distinct()
        )
        stats.domains_covered = [row[0] for row in domains_result.all() if row[0]]

        return stats

    # =========================================================================
    # CACHING
    # =========================================================================

    async def _get_cached_gita_verses(self, db: AsyncSession) -> list[GitaVerse]:
        """Get Gita verses with caching."""
        now = datetime.utcnow()

        # Check if cache is valid
        if (
            self._gita_cache is not None
            and self._cache_timestamp is not None
            and (now - self._cache_timestamp).total_seconds() < self._cache_ttl_seconds
        ):
            return self._gita_cache

        # Fetch from database
        result = await db.execute(select(GitaVerse))
        self._gita_cache = list(result.scalars().all())
        self._cache_timestamp = now

        logger.debug(f"Cached {len(self._gita_cache)} Gita verses")
        return self._gita_cache

    def clear_cache(self):
        """Clear the verse cache."""
        self._gita_cache = None
        self._cache_timestamp = None


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_wisdom_core: Optional[WisdomCore] = None


def get_wisdom_core() -> WisdomCore:
    """Get the singleton WisdomCore instance."""
    global _wisdom_core
    if _wisdom_core is None:
        _wisdom_core = WisdomCore()
    return _wisdom_core
