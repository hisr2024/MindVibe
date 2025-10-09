"""
Seed script for loading Bhagavad Gita verses into the database
"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from models import Base, GitaVerse
from services.gita_kb import GitaKnowledgeBase

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")
engine = create_async_engine(DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)


async def main():
    """Load Bhagavad Gita verses from JSON file"""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with Session() as session:
        # Check if verses already exist
        result = await session.execute(select(GitaVerse))
        existing_verses = result.scalars().all()
        
        if existing_verses:
            print(f"Found {len(existing_verses)} existing verses in database.")
            response = input("Do you want to reload verses? This will skip duplicates. (y/n): ")
            if response.lower() != 'y':
                print("Skipping verse loading.")
                return
        
        # Load verses from JSON
        kb = GitaKnowledgeBase()
        json_path = os.path.join(os.path.dirname(__file__), "data", "gita_verses.json")
        
        print(f"Loading verses from {json_path}...")
        count = await kb.load_verses_from_json(session, json_path)
        print(f"Successfully loaded {count} new verses.")
        
        # Generate embeddings if OpenAI API key is available
        if os.getenv("OPENAI_API_KEY"):
            print("\nGenerating embeddings for verses...")
            embedding_count = await kb.update_verse_embeddings(session)
            print(f"Generated embeddings for {embedding_count} verses.")
        else:
            print("\nOpenAI API key not found. Skipping embedding generation.")
            print("Set OPENAI_API_KEY environment variable to enable semantic search.")
    
    print("\nVerse seeding complete!")


if __name__ == "__main__":
    asyncio.run(main())
