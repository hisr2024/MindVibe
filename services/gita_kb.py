"""
Bhagavad Gita Knowledge Base Service
Handles verse storage, embedding generation, and semantic search
"""
import json
import os
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from ..models import GitaVerse


class GitaKnowledgeBase:
    """Service for managing and searching Bhagavad Gita verses"""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
    
    async def load_verses_from_json(self, db: AsyncSession, json_path: str) -> int:
        """Load verses from JSON file into database"""
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        loaded_count = 0
        for verse_data in data.get("verses", []):
            # Check if verse already exists
            result = await db.execute(
                select(GitaVerse).where(
                    GitaVerse.chapter == verse_data["chapter"],
                    GitaVerse.verse == verse_data["verse"]
                )
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                await db.execute(
                    insert(GitaVerse).values(
                        chapter=verse_data["chapter"],
                        verse=verse_data["verse"],
                        sanskrit=verse_data["sanskrit"],
                        english=verse_data["english"],
                        hindi=verse_data["hindi"],
                        principle=verse_data["principle"],
                        theme=verse_data["theme"]
                    )
                )
                loaded_count += 1
        
        await db.commit()
        return loaded_count
    
    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using OpenAI API"""
        if not self.openai_api_key:
            return None
        
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.openai_api_key)
            
            response = await client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None
    
    async def update_verse_embeddings(self, db: AsyncSession) -> int:
        """Generate and store embeddings for all verses"""
        result = await db.execute(select(GitaVerse))
        verses = result.scalars().all()
        
        updated_count = 0
        for verse in verses:
            if not verse.embedding:
                # Combine English and theme for embedding
                text = f"{verse.english} Theme: {verse.theme}"
                embedding = await self.generate_embedding(text)
                
                if embedding:
                    verse.embedding = json.dumps(embedding)
                    updated_count += 1
        
        await db.commit()
        return updated_count
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    async def search_relevant_verses(
        self, 
        db: AsyncSession, 
        query: str, 
        limit: int = 3
    ) -> List[Dict]:
        """Search for relevant verses using semantic similarity"""
        # Generate embedding for query
        query_embedding = await self.generate_embedding(query)
        
        if not query_embedding:
            # Fallback to keyword search if embeddings not available
            return await self._keyword_search(db, query, limit)
        
        # Get all verses with embeddings
        result = await db.execute(
            select(GitaVerse).where(GitaVerse.embedding.isnot(None))
        )
        verses = result.scalars().all()
        
        # Calculate similarities
        verse_similarities = []
        for verse in verses:
            try:
                verse_embedding = json.loads(verse.embedding)
                similarity = self.cosine_similarity(query_embedding, verse_embedding)
                verse_similarities.append((verse, similarity))
            except:
                continue
        
        # Sort by similarity and return top results
        verse_similarities.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for verse, similarity in verse_similarities[:limit]:
            results.append({
                "chapter": verse.chapter,
                "verse": verse.verse,
                "sanskrit": verse.sanskrit,
                "english": verse.english,
                "hindi": verse.hindi,
                "principle": verse.principle,
                "theme": verse.theme,
                "relevance_score": similarity
            })
        
        return results
    
    async def _keyword_search(
        self, 
        db: AsyncSession, 
        query: str, 
        limit: int = 3
    ) -> List[Dict]:
        """Fallback keyword-based search"""
        keywords = query.lower().split()
        
        result = await db.execute(select(GitaVerse))
        verses = result.scalars().all()
        
        verse_scores = []
        for verse in verses:
            score = 0
            searchable_text = f"{verse.english} {verse.theme}".lower()
            
            for keyword in keywords:
                if keyword in searchable_text:
                    score += searchable_text.count(keyword)
            
            if score > 0:
                verse_scores.append((verse, score))
        
        verse_scores.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for verse, score in verse_scores[:limit]:
            results.append({
                "chapter": verse.chapter,
                "verse": verse.verse,
                "sanskrit": verse.sanskrit,
                "english": verse.english,
                "hindi": verse.hindi,
                "principle": verse.principle,
                "theme": verse.theme,
                "relevance_score": score / 10.0  # Normalize score
            })
        
        return results if results else await self._get_default_verses(db, limit)
    
    async def _get_default_verses(self, db: AsyncSession, limit: int = 3) -> List[Dict]:
        """Get default verses when no relevant match found"""
        result = await db.execute(select(GitaVerse).limit(limit))
        verses = result.scalars().all()
        
        return [{
            "chapter": verse.chapter,
            "verse": verse.verse,
            "sanskrit": verse.sanskrit,
            "english": verse.english,
            "hindi": verse.hindi,
            "principle": verse.principle,
            "theme": verse.theme,
            "relevance_score": 0.5
        } for verse in verses]
