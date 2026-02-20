"""
Database-backed Knowledge Store for KIAAN Learning System.

This module provides persistent storage for learned wisdom in PostgreSQL,
replacing the JSON file-based storage. It connects the KIAAN Learning Daemon
to the Wisdom Core, enabling learned content to be used in journey generation.

Architecture:
    Daemon → DatabaseKnowledgeStore → PostgreSQL (learned_wisdom table)
                                              ↓
    WisdomKB ← gita_corpus_adapter ← PostgreSQL (gita_verses + learned_wisdom)
                                              ↓
                                         KIAAN Core
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    ContentSourceRegistry,
    ContentSourceType,
    LearnedWisdom,
    UserQueryPattern,
    ValidationStatus,
)

logger = logging.getLogger(__name__)


def compute_content_hash(content: str) -> str:
    """Compute SHA-256 hash of content for deduplication."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


class DatabaseKnowledgeStore:
    """
    Database-backed knowledge store for KIAAN's learned wisdom.

    This class provides the interface between the KIAAN Learning Daemon
    and the PostgreSQL database, ensuring that learned wisdom is:
    - Persisted durably (not lost on restart)
    - Deduplicated (via content hash)
    - Indexed for fast retrieval
    - Accessible to the Wisdom Core services

    Usage:
        store = DatabaseKnowledgeStore()
        async with get_db_session() as db:
            await store.add_wisdom(db, wisdom_data)
            results = await store.search_by_theme(db, "peace", limit=10)
    """

    # ==========================================================================
    # WISDOM OPERATIONS
    # ==========================================================================

    async def add_wisdom(
        self,
        db: AsyncSession,
        content: str,
        source_type: str,
        source_name: str,
        source_url: Optional[str] = None,
        source_author: Optional[str] = None,
        language: str = "en",
        chapter_refs: Optional[list[int]] = None,
        verse_refs: Optional[list[list[int]]] = None,
        themes: Optional[list[str]] = None,
        shad_ripu_tags: Optional[list[str]] = None,
        keywords: Optional[list[str]] = None,
        quality_score: float = 0.5,
        primary_domain: Optional[str] = None,
        secondary_domains: Optional[list[str]] = None,
        mental_health_applications: Optional[list[str]] = None,
        metadata: Optional[dict] = None,
    ) -> Optional[LearnedWisdom]:
        """
        Add new wisdom to the database.

        Handles deduplication via content hash. If wisdom with same content
        already exists, returns None without creating duplicate.

        Args:
            db: Database session
            content: The wisdom content text
            source_type: Type of source (youtube, audio, web, etc.)
            source_name: Name of the source
            source_url: URL of the source (optional)
            source_author: Author/speaker name (optional)
            language: Content language code (default: "en")
            chapter_refs: List of Gita chapter numbers (1-18)
            verse_refs: List of [chapter, verse] pairs
            themes: List of theme tags
            shad_ripu_tags: List of inner enemy tags (kama, krodha, etc.)
            keywords: List of searchable keywords
            quality_score: Quality score 0.0-1.0
            primary_domain: Primary spiritual wellness domain
            secondary_domains: Additional domains
            mental_health_applications: Specific applications
            metadata: Additional metadata dict

        Returns:
            The created LearnedWisdom object, or None if duplicate

        Raises:
            ValueError: If source_type is invalid
        """
        # Validate source type
        try:
            source_type_enum = ContentSourceType(source_type.lower())
        except ValueError:
            raise ValueError(f"Invalid source_type: {source_type}")

        # Compute content hash for deduplication
        content_hash = compute_content_hash(content)

        # Check for existing content
        existing = await db.execute(
            select(LearnedWisdom).where(LearnedWisdom.content_hash == content_hash)
        )
        if existing.scalar_one_or_none():
            logger.debug(f"Duplicate content detected, hash: {content_hash[:16]}...")
            return None

        # Create new wisdom entry
        wisdom = LearnedWisdom(
            content=content,
            content_hash=content_hash,
            source_type=source_type_enum,
            source_url=source_url,
            source_name=source_name,
            source_author=source_author,
            language=language,
            chapter_refs=chapter_refs or [],
            verse_refs=verse_refs or [],
            themes=themes or [],
            shad_ripu_tags=shad_ripu_tags or [],
            keywords=keywords or [],
            quality_score=quality_score,
            validation_status=ValidationStatus.PENDING,
            primary_domain=primary_domain,
            secondary_domains=secondary_domains,
            mental_health_applications=mental_health_applications,
            extra_metadata=metadata or {},
            learned_at=datetime.utcnow(),
        )

        try:
            db.add(wisdom)
            await db.commit()
            await db.refresh(wisdom)
            logger.info(
                f"Added wisdom: {wisdom.id[:8]}... from {source_name} "
                f"(chapters: {chapter_refs}, themes: {themes})"
            )
            return wisdom
        except IntegrityError:
            await db.rollback()
            logger.warning(f"Integrity error adding wisdom (likely duplicate)")
            return None

    async def get_wisdom_by_id(
        self, db: AsyncSession, wisdom_id: str
    ) -> Optional[LearnedWisdom]:
        """Get a specific wisdom entry by ID."""
        result = await db.execute(
            select(LearnedWisdom).where(
                LearnedWisdom.id == wisdom_id,
                LearnedWisdom.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_wisdom_by_chapter(
        self,
        db: AsyncSession,
        chapter: int,
        validated_only: bool = True,
        limit: int = 50,
    ) -> list[LearnedWisdom]:
        """
        Get all wisdom related to a specific Gita chapter.

        Args:
            db: Database session
            chapter: Chapter number (1-18)
            validated_only: Only return validated content (default: True)
            limit: Maximum results to return

        Returns:
            List of LearnedWisdom objects
        """
        query = select(LearnedWisdom).where(
            LearnedWisdom.chapter_refs.contains([chapter]),
            LearnedWisdom.deleted_at.is_(None),
        )

        if validated_only:
            query = query.where(
                LearnedWisdom.validation_status == ValidationStatus.VALIDATED
            )

        query = query.order_by(LearnedWisdom.quality_score.desc()).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_wisdom_by_theme(
        self,
        db: AsyncSession,
        theme: str,
        validated_only: bool = True,
        limit: int = 50,
    ) -> list[LearnedWisdom]:
        """
        Get all wisdom related to a specific theme.

        Uses case-insensitive matching on theme tags.
        """
        theme_lower = theme.lower()
        query = select(LearnedWisdom).where(
            LearnedWisdom.deleted_at.is_(None),
        )

        if validated_only:
            query = query.where(
                LearnedWisdom.validation_status == ValidationStatus.VALIDATED
            )

        query = query.order_by(LearnedWisdom.quality_score.desc()).limit(limit * 3)

        result = await db.execute(query)
        all_items = result.scalars().all()

        # Filter by theme (JSON array contains)
        matching = [
            w for w in all_items
            if any(theme_lower in t.lower() for t in (w.themes or []))
        ]

        return matching[:limit]

    async def get_wisdom_by_shad_ripu(
        self,
        db: AsyncSession,
        enemy: str,
        validated_only: bool = True,
        limit: int = 50,
    ) -> list[LearnedWisdom]:
        """
        Get all wisdom related to a specific inner enemy (Shad Ripu).

        Args:
            enemy: One of: kama, krodha, lobha, moha, mada, matsarya
        """
        query = select(LearnedWisdom).where(
            LearnedWisdom.shad_ripu_tags.contains([enemy]),
            LearnedWisdom.deleted_at.is_(None),
        )

        if validated_only:
            query = query.where(
                LearnedWisdom.validation_status == ValidationStatus.VALIDATED
            )

        query = query.order_by(LearnedWisdom.quality_score.desc()).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_wisdom_by_domain(
        self,
        db: AsyncSession,
        domain: str,
        validated_only: bool = True,
        limit: int = 50,
    ) -> list[LearnedWisdom]:
        """
        Get wisdom by spiritual wellness domain (e.g., anxiety, stress, grief).
        """
        query = select(LearnedWisdom).where(
            or_(
                LearnedWisdom.primary_domain == domain,
                LearnedWisdom.secondary_domains.contains([domain]),
            ),
            LearnedWisdom.deleted_at.is_(None),
        )

        if validated_only:
            query = query.where(
                LearnedWisdom.validation_status == ValidationStatus.VALIDATED
            )

        query = query.order_by(LearnedWisdom.quality_score.desc()).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def search_wisdom(
        self,
        db: AsyncSession,
        query_text: str,
        validated_only: bool = True,
        limit: int = 20,
    ) -> list[tuple[LearnedWisdom, float]]:
        """
        Search wisdom by content, keywords, and themes.

        Returns results with relevance scores.

        Args:
            db: Database session
            query_text: Search query
            validated_only: Only return validated content
            limit: Maximum results

        Returns:
            List of (LearnedWisdom, score) tuples sorted by relevance
        """
        query_lower = query_text.lower()

        base_query = select(LearnedWisdom).where(
            LearnedWisdom.deleted_at.is_(None),
        )

        if validated_only:
            base_query = base_query.where(
                LearnedWisdom.validation_status == ValidationStatus.VALIDATED
            )

        # Fetch all candidates (we'll score in Python for flexibility)
        base_query = base_query.limit(limit * 10)
        result = await db.execute(base_query)
        candidates = result.scalars().all()

        # Score each candidate
        scored_results = []
        for wisdom in candidates:
            score = 0.0

            # Content match (highest weight)
            if query_lower in wisdom.content.lower():
                score += 5.0

            # Keyword match
            for keyword in wisdom.keywords or []:
                if query_lower in keyword.lower():
                    score += 2.0
                elif keyword.lower() in query_lower:
                    score += 1.5

            # Theme match
            for theme in wisdom.themes or []:
                if query_lower in theme.lower():
                    score += 3.0
                elif theme.lower() in query_lower:
                    score += 2.0

            # Shad Ripu match
            for tag in wisdom.shad_ripu_tags or []:
                if tag.lower() in query_lower:
                    score += 2.5

            # Quality score bonus
            score += wisdom.quality_score * 1.0

            if score > 0:
                scored_results.append((wisdom, score))

        # Sort by score descending
        scored_results.sort(key=lambda x: x[1], reverse=True)
        return scored_results[:limit]

    async def record_usage(self, db: AsyncSession, wisdom_id: str) -> bool:
        """
        Record that a wisdom item was used (shown to user).

        Updates usage_count and last_used_at for analytics.
        """
        result = await db.execute(
            update(LearnedWisdom)
            .where(LearnedWisdom.id == wisdom_id)
            .values(
                usage_count=LearnedWisdom.usage_count + 1,
                last_used_at=datetime.utcnow(),
            )
        )
        await db.commit()
        return result.rowcount > 0

    async def validate_wisdom(
        self,
        db: AsyncSession,
        wisdom_id: str,
        validated_by: str,
        approved: bool = True,
        rejection_reason: Optional[str] = None,
    ) -> bool:
        """
        Mark wisdom as validated or rejected.

        Args:
            db: Database session
            wisdom_id: ID of wisdom to validate
            validated_by: ID of admin/system doing validation
            approved: True to validate, False to reject
            rejection_reason: Required if rejected

        Returns:
            True if updated, False if not found
        """
        values = {
            "validation_status": (
                ValidationStatus.VALIDATED if approved else ValidationStatus.REJECTED
            ),
            "validated_by": validated_by,
            "validated_at": datetime.utcnow(),
        }

        if not approved and rejection_reason:
            values["rejection_reason"] = rejection_reason

        result = await db.execute(
            update(LearnedWisdom)
            .where(LearnedWisdom.id == wisdom_id)
            .values(**values)
        )
        await db.commit()
        return result.rowcount > 0

    # ==========================================================================
    # QUERY PATTERN OPERATIONS
    # ==========================================================================

    async def add_query_pattern(
        self,
        db: AsyncSession,
        query_template: str,
        intent: str,
        related_chapters: Optional[list[int]] = None,
        related_verses: Optional[list[list[int]]] = None,
        related_themes: Optional[list[str]] = None,
        response_template: Optional[str] = None,
    ) -> Optional[UserQueryPattern]:
        """
        Add or update a query pattern.

        If pattern with same hash exists, updates frequency instead.
        """
        query_hash = compute_content_hash(query_template.lower().strip())

        # Check for existing pattern
        result = await db.execute(
            select(UserQueryPattern).where(
                UserQueryPattern.query_hash == query_hash,
                UserQueryPattern.deleted_at.is_(None),
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update frequency
            existing.frequency += 1
            existing.last_seen_at = datetime.utcnow()
            await db.commit()
            logger.debug(f"Updated pattern frequency: {existing.id[:8]}...")
            return existing

        # Create new pattern
        pattern = UserQueryPattern(
            query_template=query_template,
            query_hash=query_hash,
            intent=intent,
            related_chapters=related_chapters or [],
            related_verses=related_verses or [],
            related_themes=related_themes or [],
            response_template=response_template,
        )

        try:
            db.add(pattern)
            await db.commit()
            await db.refresh(pattern)
            logger.info(f"Added query pattern: {pattern.id[:8]}... intent={intent}")
            return pattern
        except IntegrityError:
            await db.rollback()
            return None

    async def get_patterns_by_intent(
        self, db: AsyncSession, intent: str, limit: int = 20
    ) -> list[UserQueryPattern]:
        """Get query patterns by intent."""
        result = await db.execute(
            select(UserQueryPattern)
            .where(
                UserQueryPattern.intent == intent,
                UserQueryPattern.deleted_at.is_(None),
            )
            .order_by(UserQueryPattern.frequency.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def record_successful_response(
        self, db: AsyncSession, pattern_id: str
    ) -> bool:
        """Record that a pattern led to a successful response."""
        result = await db.execute(
            update(UserQueryPattern)
            .where(UserQueryPattern.id == pattern_id)
            .values(successful_responses=UserQueryPattern.successful_responses + 1)
        )
        await db.commit()
        return result.rowcount > 0

    # ==========================================================================
    # SOURCE REGISTRY OPERATIONS
    # ==========================================================================

    async def register_source(
        self,
        db: AsyncSession,
        name: str,
        source_type: str,
        url: Optional[str] = None,
        fetch_interval_seconds: int = 3600,
        credibility_rating: int = 5,
        metadata: Optional[dict] = None,
    ) -> Optional[ContentSourceRegistry]:
        """Register a new content source."""
        try:
            source_type_enum = ContentSourceType(source_type.lower())
        except ValueError:
            raise ValueError(f"Invalid source_type: {source_type}")

        source = ContentSourceRegistry(
            name=name,
            source_type=source_type_enum,
            url=url,
            fetch_interval_seconds=fetch_interval_seconds,
            credibility_rating=credibility_rating,
            extra_metadata=metadata or {},
        )

        try:
            db.add(source)
            await db.commit()
            await db.refresh(source)
            logger.info(f"Registered source: {name} ({source_type})")
            return source
        except IntegrityError:
            await db.rollback()
            logger.warning(f"Source already exists: {name}")
            return None

    async def get_enabled_sources(
        self, db: AsyncSession
    ) -> list[ContentSourceRegistry]:
        """Get all enabled content sources."""
        result = await db.execute(
            select(ContentSourceRegistry)
            .where(
                ContentSourceRegistry.enabled == True,
                ContentSourceRegistry.deleted_at.is_(None),
            )
            .order_by(ContentSourceRegistry.priority.desc())
        )
        return list(result.scalars().all())

    async def update_source_health(
        self,
        db: AsyncSession,
        source_id: str,
        success: bool,
        items_fetched: int = 0,
        error: Optional[str] = None,
    ) -> bool:
        """Update source health after a fetch attempt."""
        now = datetime.utcnow()

        if success:
            values = {
                "last_fetch_at": now,
                "last_success_at": now,
                "consecutive_failures": 0,
                "total_items_fetched": ContentSourceRegistry.total_items_fetched
                + items_fetched,
                "last_error": None,
            }
        else:
            values = {
                "last_fetch_at": now,
                "consecutive_failures": ContentSourceRegistry.consecutive_failures + 1,
                "last_error": error,
            }

        result = await db.execute(
            update(ContentSourceRegistry)
            .where(ContentSourceRegistry.id == source_id)
            .values(**values)
        )
        await db.commit()
        return result.rowcount > 0

    # ==========================================================================
    # STATISTICS
    # ==========================================================================

    async def get_statistics(self, db: AsyncSession) -> dict:
        """Get comprehensive knowledge store statistics."""
        # Count wisdom by status
        total_result = await db.execute(
            select(func.count(LearnedWisdom.id)).where(
                LearnedWisdom.deleted_at.is_(None)
            )
        )
        total_wisdom = total_result.scalar() or 0

        validated_result = await db.execute(
            select(func.count(LearnedWisdom.id)).where(
                LearnedWisdom.validation_status == ValidationStatus.VALIDATED,
                LearnedWisdom.deleted_at.is_(None),
            )
        )
        validated_wisdom = validated_result.scalar() or 0

        pending_result = await db.execute(
            select(func.count(LearnedWisdom.id)).where(
                LearnedWisdom.validation_status == ValidationStatus.PENDING,
                LearnedWisdom.deleted_at.is_(None),
            )
        )
        pending_wisdom = pending_result.scalar() or 0

        rejected_result = await db.execute(
            select(func.count(LearnedWisdom.id)).where(
                LearnedWisdom.validation_status == ValidationStatus.REJECTED,
                LearnedWisdom.deleted_at.is_(None),
            )
        )
        rejected_wisdom = rejected_result.scalar() or 0

        # Count patterns
        patterns_result = await db.execute(
            select(func.count(UserQueryPattern.id)).where(
                UserQueryPattern.deleted_at.is_(None)
            )
        )
        total_patterns = patterns_result.scalar() or 0

        # Count sources
        sources_result = await db.execute(
            select(func.count(ContentSourceRegistry.id)).where(
                ContentSourceRegistry.deleted_at.is_(None)
            )
        )
        total_sources = sources_result.scalar() or 0

        enabled_sources_result = await db.execute(
            select(func.count(ContentSourceRegistry.id)).where(
                ContentSourceRegistry.enabled == True,
                ContentSourceRegistry.deleted_at.is_(None),
            )
        )
        enabled_sources = enabled_sources_result.scalar() or 0

        # Get distinct languages
        languages_result = await db.execute(
            select(LearnedWisdom.language)
            .where(LearnedWisdom.deleted_at.is_(None))
            .distinct()
        )
        languages = [row[0] for row in languages_result.all()]

        # Get chapters covered
        chapters_result = await db.execute(
            select(LearnedWisdom.chapter_refs).where(
                LearnedWisdom.validation_status == ValidationStatus.VALIDATED,
                LearnedWisdom.deleted_at.is_(None),
            )
        )
        all_chapters = set()
        for row in chapters_result.all():
            if row[0]:
                all_chapters.update(row[0])

        return {
            "wisdom": {
                "total": total_wisdom,
                "validated": validated_wisdom,
                "pending": pending_wisdom,
                "rejected": rejected_wisdom,
            },
            "patterns": {
                "total": total_patterns,
            },
            "sources": {
                "total": total_sources,
                "enabled": enabled_sources,
            },
            "coverage": {
                "languages": sorted(languages),
                "chapters": sorted(list(all_chapters)),
            },
        }


# Singleton instance
_db_knowledge_store: Optional[DatabaseKnowledgeStore] = None


def get_db_knowledge_store() -> DatabaseKnowledgeStore:
    """Get the singleton DatabaseKnowledgeStore instance."""
    global _db_knowledge_store
    if _db_knowledge_store is None:
        _db_knowledge_store = DatabaseKnowledgeStore()
    return _db_knowledge_store
