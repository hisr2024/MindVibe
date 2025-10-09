"""
Wisdom Knowledge Base Service

This service manages wisdom verses, sanitizes religious references,
and provides semantic search capabilities for finding relevant verses.
"""

import re
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import numpy as np

from ..models import WisdomVerse


class WisdomKnowledgeBase:
    """
    Service for managing and querying universal wisdom verses.
    Sanitizes religious references and provides semantic search.
    """
    
    # Words to sanitize from religious contexts
    RELIGIOUS_TERMS = [
        "krishna", "arjuna", "pandava", "kauravas", "kurukshetra",
        "bhagavan", "lord", "god", "hindu", "hinduism", "dharma",
        "karma", "yoga", "moksha", "avatar", "deity", "divine"
    ]
    
    @staticmethod
    def sanitize_text(text: str) -> str:
        """
        Remove or replace religious references to present wisdom universally.
        """
        if not text:
            return text
            
        # Convert to lowercase for comparison
        lower_text = text.lower()
        
        # Replace specific religious references with universal terms
        replacements = {
            r'\bkrishna\b': 'the teacher',
            r'\barjuna\b': 'the student',
            r'\blord\b': 'the wise one',
            r'\bgod\b': 'inner wisdom',
            r'\bdivine\b': 'universal',
            r'\bholy\b': 'sacred',
            r'\bsoul\b': 'true self',
        }
        
        sanitized = text
        for pattern, replacement in replacements.items():
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    @staticmethod
    async def get_verse_by_id(db: AsyncSession, verse_id: str) -> Optional[WisdomVerse]:
        """Get a specific verse by its ID."""
        result = await db.execute(
            select(WisdomVerse).where(WisdomVerse.verse_id == verse_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_verses_by_theme(db: AsyncSession, theme: str) -> List[WisdomVerse]:
        """Get all verses matching a specific theme."""
        result = await db.execute(
            select(WisdomVerse).where(WisdomVerse.theme == theme)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def search_verses_by_application(
        db: AsyncSession, 
        application: str
    ) -> List[WisdomVerse]:
        """
        Search verses by mental health application.
        Returns verses that have the application in their mental_health_applications.
        """
        result = await db.execute(select(WisdomVerse))
        all_verses = result.scalars().all()
        
        matching_verses = [
            verse for verse in all_verses
            if application in verse.mental_health_applications.get("applications", [])
        ]
        
        return matching_verses
    
    @staticmethod
    def compute_text_similarity(text1: str, text2: str) -> float:
        """
        Simple text similarity based on word overlap.
        In production, this would use embeddings from sentence-transformers.
        """
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    @staticmethod
    async def search_relevant_verses(
        db: AsyncSession,
        query: str,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Search for verses relevant to the query using semantic similarity.
        Returns verses with their relevance scores.
        """
        # Get all verses
        result = await db.execute(select(WisdomVerse))
        all_verses = result.scalars().all()
        
        # Calculate similarity scores
        verse_scores = []
        query_lower = query.lower()
        
        for verse in all_verses:
            # Calculate relevance based on multiple factors
            theme_score = 1.0 if verse.theme.replace('_', ' ') in query_lower else 0.0
            english_score = WisdomKnowledgeBase.compute_text_similarity(query, verse.english)
            context_score = WisdomKnowledgeBase.compute_text_similarity(query, verse.context)
            
            # Weighted average
            total_score = (theme_score * 0.4) + (english_score * 0.4) + (context_score * 0.2)
            
            verse_scores.append({
                "verse": verse,
                "score": total_score
            })
        
        # Sort by score and return top results
        verse_scores.sort(key=lambda x: x["score"], reverse=True)
        return verse_scores[:limit]
    
    @staticmethod
    def format_verse_response(
        verse: WisdomVerse,
        language: str = "english",
        include_sanskrit: bool = False
    ) -> Dict[str, Any]:
        """
        Format a verse for API response, applying sanitization.
        """
        response = {
            "verse_id": verse.verse_id,
            "theme": verse.theme.replace('_', ' ').title(),
            "context": WisdomKnowledgeBase.sanitize_text(verse.context),
            "applications": verse.mental_health_applications.get("applications", [])
        }
        
        # Add primary language
        if language == "hindi":
            response["text"] = verse.hindi
            response["language"] = "hindi"
        elif language == "sanskrit":
            response["text"] = verse.sanskrit
            response["language"] = "sanskrit"
        else:
            response["text"] = WisdomKnowledgeBase.sanitize_text(verse.english)
            response["language"] = "english"
        
        # Optionally include Sanskrit
        if include_sanskrit and language != "sanskrit":
            response["sanskrit"] = verse.sanskrit
        
        return response
