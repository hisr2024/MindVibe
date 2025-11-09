"""
Seed script for complete Bhagavad Gita wisdom database.

This script populates the database with:
- 18 chapters metadata
- Authentic sources (Gita Press Gorakhpur, ISKCON, IIT Kanpur, Swami Prabhupada)
- Complete verses with translations (starter set, expandable to 700)
- Modern context applications
- Keywords and themes
"""

import asyncio
import json
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models import (
    Base,
    GitaChapter,
    GitaKeyword,
    GitaModernContext,
    GitaSource,
    GitaVerse,
    GitaVerseKeyword,
)

# Database configuration
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

# Fix Render.com DATABASE_URL to use asyncpg
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


# Authentic sources data
SOURCES_DATA = [
    {
        "name": "Gita Press Gorakhpur",
        "description": "One of the most renowned publishers of Hindu scriptures in India, founded in 1923",
        "url": "https://www.gitapress.org/",
        "credibility_rating": 5,
    },
    {
        "name": "ISKCON (International Society for Krishna Consciousness)",
        "description": "Bhagavad-gita As It Is by A.C. Bhaktivedanta Swami Prabhupada",
        "url": "https://www.iskcon.org/",
        "credibility_rating": 5,
    },
    {
        "name": "IIT Kanpur Gita Supersite",
        "description": "Academic resource maintained by IIT Kanpur for Bhagavad Gita studies",
        "url": "https://www.gitasupersite.iitk.ac.in/",
        "credibility_rating": 5,
    },
    {
        "name": "Swami Sivananda Divine Life Society",
        "description": "Translation and commentary by Swami Sivananda",
        "url": "https://www.sivanandaonline.org/",
        "credibility_rating": 5,
    },
]


# Keywords and themes data
KEYWORDS_DATA = [
    {"keyword": "dharma", "category": "Ethics", "description": "Righteous duty"},
    {"keyword": "karma", "category": "Action", "description": "Action and consequences"},
    {"keyword": "yoga", "category": "Practice", "description": "Union and spiritual practice"},
    {"keyword": "knowledge", "category": "Wisdom", "description": "Self-knowledge and wisdom"},
    {"keyword": "devotion", "category": "Bhakti", "description": "Devotional love"},
    {"keyword": "detachment", "category": "Practice", "description": "Non-attachment"},
    {"keyword": "self-control", "category": "Practice", "description": "Mastery over senses"},
    {"keyword": "peace", "category": "Mental Health", "description": "Inner peace"},
    {"keyword": "anxiety", "category": "Mental Health", "description": "Dealing with worry"},
    {"keyword": "stress", "category": "Mental Health", "description": "Stress management"},
    {"keyword": "courage", "category": "Mental Health", "description": "Bravery and strength"},
    {"keyword": "acceptance", "category": "Mental Health", "description": "Acceptance of reality"},
    {"keyword": "equanimity", "category": "Practice", "description": "Mental calmness"},
    {"keyword": "selflessness", "category": "Ethics", "description": "Acting without ego"},
    {"keyword": "meditation", "category": "Practice", "description": "Contemplative practice"},
]


async def seed_sources(session):
    """Seed authentic sources."""
    print("Seeding sources...")
    
    for source_data in SOURCES_DATA:
        # Check if source already exists
        result = await session.execute(
            select(GitaSource).where(GitaSource.name == source_data["name"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            source = GitaSource(**source_data)
            session.add(source)
    
    await session.commit()
    print(f"✓ Seeded {len(SOURCES_DATA)} sources")


async def seed_chapters(session):
    """Seed chapter metadata from JSON file."""
    print("Seeding chapters...")
    
    data_dir = Path(__file__).parent.parent / "data" / "gita"
    chapters_file = data_dir / "chapter_metadata.json"
    
    with open(chapters_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    chapters_data = data.get("chapters", [])
    
    for chapter_data in chapters_data:
        # Check if chapter already exists
        result = await session.execute(
            select(GitaChapter).where(
                GitaChapter.chapter_number == chapter_data["chapter_number"]
            )
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            chapter = GitaChapter(
                chapter_number=chapter_data["chapter_number"],
                sanskrit_name=chapter_data["sanskrit_name"],
                english_name=chapter_data["english_name"],
                verse_count=chapter_data["verse_count"],
                themes=chapter_data.get("themes", []),
                mental_health_relevance=chapter_data.get("mental_health_relevance"),
            )
            session.add(chapter)
    
    await session.commit()
    print(f"✓ Seeded {len(chapters_data)} chapters")


async def seed_keywords(session):
    """Seed keywords and themes."""
    print("Seeding keywords...")
    
    for keyword_data in KEYWORDS_DATA:
        # Check if keyword already exists
        result = await session.execute(
            select(GitaKeyword).where(GitaKeyword.keyword == keyword_data["keyword"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            keyword = GitaKeyword(**keyword_data)
            session.add(keyword)
    
    await session.commit()
    print(f"✓ Seeded {len(KEYWORDS_DATA)} keywords")


async def seed_verses(session):
    """Seed verses from JSON file."""
    print("Seeding verses...")
    
    data_dir = Path(__file__).parent.parent / "data" / "gita"
    verses_file = data_dir / "gita_verses_starter.json"
    
    with open(verses_file, "r", encoding="utf-8") as f:
        verses_data = json.load(f)
    
    # Get Gita Press source
    result = await session.execute(
        select(GitaSource).where(GitaSource.name == "Gita Press Gorakhpur")
    )
    gita_press_source = result.scalar_one_or_none()
    
    verse_count = 0
    for verse_data in verses_data:
        # Check if verse already exists
        result = await session.execute(
            select(GitaVerse).where(
                (GitaVerse.chapter == verse_data["chapter"])
                & (GitaVerse.verse == verse_data["verse"])
            )
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            verse = GitaVerse(
                chapter=verse_data["chapter"],
                verse=verse_data["verse"],
                sanskrit=verse_data.get("sanskrit", ""),
                transliteration=verse_data.get("transliteration"),
                hindi=verse_data.get("hindi", ""),
                english=verse_data.get("english", ""),
                word_meanings=verse_data.get("word_meanings"),
                principle=verse_data.get("theme", "Unknown"),
                theme=verse_data.get("theme", "General"),
                source_id=gita_press_source.id if gita_press_source else None,
            )
            session.add(verse)
            verse_count += 1
    
    await session.commit()
    print(f"✓ Seeded {verse_count} verses")


async def seed_modern_contexts(session):
    """Seed modern context applications for verses."""
    print("Seeding modern contexts...")
    
    # Get all verses
    result = await session.execute(select(GitaVerse))
    verses = list(result.scalars().all())
    
    # Add modern contexts for key verses
    modern_contexts = [
        {
            "chapter": 2,
            "verse": 47,
            "application_area": "Work-Life Balance",
            "description": "Focus on your work without being attached to results. This reduces stress and anxiety in professional life.",
            "examples": [
                "Do your best at work without obsessing over promotions",
                "Complete tasks with dedication but accept outcomes gracefully",
            ],
            "mental_health_benefits": [
                "Reduced performance anxiety",
                "Better stress management",
                "Improved work satisfaction",
            ],
        },
        {
            "chapter": 2,
            "verse": 14,
            "application_area": "Emotional Resilience",
            "description": "Accept that happiness and distress are temporary. This helps build emotional resilience.",
            "examples": [
                "Understanding that difficult times will pass",
                "Not getting overly attached to happy moments",
            ],
            "mental_health_benefits": [
                "Better emotional regulation",
                "Reduced mood swings",
                "Increased resilience",
            ],
        },
        {
            "chapter": 6,
            "verse": 5,
            "application_area": "Self-Empowerment",
            "description": "You are your own best friend or worst enemy. Take responsibility for your growth.",
            "examples": [
                "Practice self-compassion",
                "Take ownership of your choices",
            ],
            "mental_health_benefits": [
                "Increased self-awareness",
                "Better self-esteem",
                "Personal empowerment",
            ],
        },
    ]
    
    context_count = 0
    for context_data in modern_contexts:
        # Find the verse
        verse = next(
            (
                v
                for v in verses
                if v.chapter == context_data["chapter"]
                and v.verse == context_data["verse"]
            ),
            None,
        )
        
        if verse:
            # Check if context already exists
            result = await session.execute(
                select(GitaModernContext).where(
                    (GitaModernContext.verse_id == verse.id)
                    & (
                        GitaModernContext.application_area
                        == context_data["application_area"]
                    )
                )
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                context = GitaModernContext(
                    verse_id=verse.id,
                    application_area=context_data["application_area"],
                    description=context_data["description"],
                    examples=context_data.get("examples"),
                    mental_health_benefits=context_data.get("mental_health_benefits"),
                )
                session.add(context)
                context_count += 1
    
    await session.commit()
    print(f"✓ Seeded {context_count} modern contexts")


async def seed_verse_keywords(session):
    """Associate verses with keywords."""
    print("Seeding verse-keyword associations...")
    
    # Get all verses and keywords
    verses_result = await session.execute(select(GitaVerse))
    verses = list(verses_result.scalars().all())
    
    keywords_result = await session.execute(select(GitaKeyword))
    keywords = {k.keyword: k for k in keywords_result.scalars().all()}
    
    # Define associations based on verse themes
    associations = [
        # Chapter 2, Verse 47 - Karma Yoga
        {"chapter": 2, "verse": 47, "keywords": ["karma", "detachment", "stress"]},
        # Chapter 2, Verse 14 - Equanimity
        {"chapter": 2, "verse": 14, "keywords": ["equanimity", "acceptance", "anxiety"]},
        # Chapter 6, Verse 5 - Self-control
        {"chapter": 6, "verse": 5, "keywords": ["self-control", "courage"]},
    ]
    
    assoc_count = 0
    for assoc in associations:
        verse = next(
            (
                v
                for v in verses
                if v.chapter == assoc["chapter"] and v.verse == assoc["verse"]
            ),
            None,
        )
        
        if verse:
            for keyword_name in assoc["keywords"]:
                keyword = keywords.get(keyword_name)
                if keyword:
                    # Check if association already exists
                    result = await session.execute(
                        select(GitaVerseKeyword).where(
                            (GitaVerseKeyword.verse_id == verse.id)
                            & (GitaVerseKeyword.keyword_id == keyword.id)
                        )
                    )
                    existing = result.scalar_one_or_none()
                    
                    if not existing:
                        verse_keyword = GitaVerseKeyword(
                            verse_id=verse.id, keyword_id=keyword.id
                        )
                        session.add(verse_keyword)
                        assoc_count += 1
    
    await session.commit()
    print(f"✓ Seeded {assoc_count} verse-keyword associations")


async def main():
    """Main seeding function."""
    print("=" * 60)
    print("Bhagavad Gita Wisdom Database Seeding Script")
    print("=" * 60)
    print()
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Seed in order due to foreign key dependencies
            await seed_sources(session)
            await seed_chapters(session)
            await seed_keywords(session)
            await seed_verses(session)
            await seed_modern_contexts(session)
            await seed_verse_keywords(session)
            
            print()
            print("=" * 60)
            print("✓ Database seeding completed successfully!")
            print("=" * 60)
            
        except Exception as e:
            print(f"✗ Error during seeding: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
