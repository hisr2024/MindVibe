"""
RAG (Retrieval Augmented Generation) Service
Implements vector embeddings for semantic verse search

This service provides advanced semantic search capabilities using:
- OpenAI text-embedding-3-small model (1536 dimensions)
- PostgreSQL pgvector extension for efficient similarity search
- Hybrid search combining semantic and keyword approaches
- Automatic embedding generation for new verses
"""

import logging
import os
from typing import Any, List, Optional
import numpy as np
from openai import OpenAI
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import WisdomVerse

logger = logging.getLogger(__name__)


class RAGService:
    """RAG service for semantic verse retrieval."""

    def __init__(self):
        """Initialize RAG service with OpenAI embeddings."""
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.embedding_model = "text-embedding-3-small"  # 1536 dimensions, $0.02/1M tokens
        self.embedding_dim = 1536
        self.ready = bool(api_key)

        if not self.ready:
            logger.warning("⚠️ RAG Service: OpenAI API key not found, embeddings disabled")
        else:
            logger.info(f"✅ RAG Service initialized with {self.embedding_model}")

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text.

        Args:
            text: Input text to embed

        Returns:
            Embedding vector as list of floats
        """
        if not self.ready or not self.client:
            logger.error("RAG Service: OpenAI client not initialized")
            return [0.0] * self.embedding_dim

        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            embedding = response.data[0].embedding
            logger.debug(f"✅ Generated embedding for text (length: {len(text)} chars)")
            return embedding
        except Exception as e:
            logger.error(f"❌ Failed to generate embedding: {e}")
            return [0.0] * self.embedding_dim

    async def embed_all_verses(self, db: AsyncSession) -> int:
        """Generate embeddings for all verses in database.

        This should be run once during setup or when new verses are added.

        Args:
            db: Database session

        Returns:
            Number of verses embedded
        """
        if not self.ready:
            logger.error("RAG Service: Cannot embed verses, client not initialized")
            return 0

        # Get all verses without embeddings
        # Note: Requires embedding column to exist in WisdomVerse model
        stmt = select(WisdomVerse)
        result = await db.execute(stmt)
        verses = result.scalars().all()

        count = 0
        total = len(verses)
        logger.info(f"📚 Starting embedding generation for {total} verses...")

        for i, verse in enumerate(verses):
            # Skip if already has embedding (if column exists and has data)
            if hasattr(verse, 'embedding') and verse.embedding is not None:
                continue

            # Create searchable text from verse
            searchable_text = f"{verse.english} {verse.principle} {verse.theme} {verse.context or ''}"

            # Generate embedding
            embedding = await self.generate_embedding(searchable_text)

            # Store as array in database (if column exists)
            if hasattr(verse, 'embedding'):
                verse.embedding = embedding

            count += 1

            if count % 50 == 0:
                logger.info(f"   Embedded {count}/{total} verses ({count/total*100:.1f}%)...")
                await db.commit()

        await db.commit()
        logger.info(f"✅ Total verses embedded: {count}/{total}")
        return count

    async def semantic_search(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 15,
        similarity_threshold: float = 0.7
    ) -> List[dict[str, Any]]:
        """Perform semantic search for relevant verses.

        Uses cosine similarity between query embedding and verse embeddings.

        Args:
            db: Database session
            query: Search query
            limit: Maximum number of results
            similarity_threshold: Minimum similarity score (0-1)

        Returns:
            List of verse results with similarity scores
        """
        if not self.ready:
            logger.warning("RAG Service: Semantic search unavailable, using fallback")
            return await self._keyword_search_fallback(db, query, limit)

        # Generate query embedding
        query_embedding = await self.generate_embedding(query)

        # Check if pgvector extension is available
        try:
            # Perform vector similarity search using pgvector
            # Note: Requires pgvector extension in PostgreSQL
            # The <=> operator computes cosine distance
            sql = text("""
                SELECT
                    verse_id,
                    chapter,
                    verse_number,
                    english,
                    principle,
                    theme,
                    context,
                    1 - (embedding <=> CAST(:query_embedding AS vector)) as similarity
                FROM wisdom_verses
                WHERE embedding IS NOT NULL
                    AND 1 - (embedding <=> CAST(:query_embedding AS vector)) > :threshold
                ORDER BY embedding <=> CAST(:query_embedding AS vector)
                LIMIT :limit
            """)

            result = await db.execute(
                sql,
                {
                    "query_embedding": query_embedding,
                    "threshold": similarity_threshold,
                    "limit": limit
                }
            )

            verses = []
            for row in result:
                verses.append({
                    "verse_id": row.verse_id,
                    "chapter": row.chapter,
                    "verse_number": row.verse_number,
                    "english": row.english,
                    "principle": row.principle,
                    "theme": row.theme,
                    "context": row.context,
                    "similarity_score": float(row.similarity)
                })

            logger.info(f"✅ Semantic search found {len(verses)} verses for query: {query[:50]}...")
            return verses

        except Exception as e:
            logger.error(f"❌ Semantic search failed: {e}, falling back to keyword search")
            # Fallback to keyword search
            return await self._keyword_search_fallback(db, query, limit)

    async def _keyword_search_fallback(
        self,
        db: AsyncSession,
        query: str,
        limit: int
    ) -> List[dict[str, Any]]:
        """Fallback to keyword search if vector search fails.

        Args:
            db: Database session
            query: Search query
            limit: Maximum results

        Returns:
            List of verses matching keywords
        """
        # Extract keywords from query
        keywords = query.lower().split()

        # Build search conditions for multiple fields
        stmt = select(WisdomVerse).limit(limit)

        # Try to find verses matching any keyword in multiple fields
        if keywords:
            # For simplicity, search in english, principle, and theme
            from sqlalchemy import or_
            conditions = []
            for keyword in keywords[:5]:  # Limit to first 5 keywords
                conditions.extend([
                    WisdomVerse.english.ilike(f"%{keyword}%"),
                    WisdomVerse.principle.ilike(f"%{keyword}%"),
                    WisdomVerse.theme.ilike(f"%{keyword}%")
                ])
            if conditions:
                stmt = stmt.where(or_(*conditions))

        result = await db.execute(stmt)
        verses = result.scalars().all()

        formatted_verses = [
            {
                "verse_id": v.verse_id,
                "chapter": v.chapter,
                "verse_number": v.verse_number,
                "english": v.english,
                "principle": v.principle,
                "theme": v.theme,
                "context": v.context if hasattr(v, 'context') else None,
                "similarity_score": 0.5  # Lower score for keyword match
            }
            for v in verses
        ]

        logger.info(f"✅ Keyword search found {len(formatted_verses)} verses")
        return formatted_verses

    async def hybrid_search(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 15
    ) -> List[dict[str, Any]]:
        """Hybrid search combining semantic and keyword search.

        Args:
            db: Database session
            query: Search query
            limit: Maximum results

        Returns:
            Combined and ranked results
        """
        if not self.ready:
            # If RAG not ready, just use keyword search
            return await self._keyword_search_fallback(db, query, limit)

        # Get semantic results
        semantic_results = await self.semantic_search(db, query, limit=limit)

        # Get keyword results
        keyword_results = await self._keyword_search_fallback(db, query, limit=limit)

        # Combine and deduplicate by verse_id
        combined = {}

        for verse in semantic_results:
            vid = verse["verse_id"]
            combined[vid] = verse

        for verse in keyword_results:
            vid = verse["verse_id"]
            if vid not in combined:
                combined[vid] = verse
            else:
                # Boost score if appears in both
                combined[vid]["similarity_score"] = max(
                    combined[vid]["similarity_score"],
                    verse["similarity_score"]
                ) + 0.1  # Bonus for appearing in both results

        # Sort by score and limit
        results = sorted(
            combined.values(),
            key=lambda x: x["similarity_score"],
            reverse=True
        )[:limit]

        logger.info(f"✅ Hybrid search returned {len(results)} verses (from {len(semantic_results)} semantic + {len(keyword_results)} keyword)")
        return results

    async def get_similar_verses(
        self,
        db: AsyncSession,
        verse_id: str,
        limit: int = 5
    ) -> List[dict[str, Any]]:
        """Find verses similar to a given verse.

        Args:
            db: Database session
            verse_id: ID of the reference verse
            limit: Maximum number of similar verses

        Returns:
            List of similar verses
        """
        if not self.ready:
            logger.warning("RAG Service: Similar verse search unavailable")
            return []

        # Get the reference verse
        stmt = select(WisdomVerse).where(WisdomVerse.verse_id == verse_id)
        result = await db.execute(stmt)
        verse = result.scalar_one_or_none()

        if not verse:
            logger.warning(f"Verse {verse_id} not found")
            return []

        # Use the verse's english text as query
        return await self.semantic_search(
            db=db,
            query=verse.english,
            limit=limit + 1,  # +1 because the verse itself will be in results
            similarity_threshold=0.6
        )


# Global service instance
rag_service = RAGService()
