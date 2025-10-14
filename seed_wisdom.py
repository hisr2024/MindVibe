"""
Seed script for wisdom verses.

Loads wisdom verses from data/wisdom/verses.json and populates the database.
"""

import asyncio
import os
import json
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import insert, select
from models import Base, WisdomVerse

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://mindvibe:password@db:5432/mindvibe")
engine = create_async_engine(DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)


async def load_verses_from_json(filepath: str):
    """Load verses from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


async def main():
    """Main seeding function."""
    try:
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # Load verses from JSON
        verses_path = os.path.join(
            os.path.dirname(__file__),
            'data',
            'wisdom',
            'verses.json'
        )
        
        if not os.path.exists(verses_path):
            print(f"Error: Verses file not found at {verses_path}")
            return
        
        verses_data = await load_verses_from_json(verses_path)
        print(f"Loaded {len(verses_data)} verses from {verses_path}")
        
        # Seed the database
        async with Session() as session:
            for verse_data in verses_data:
                # Check if verse already exists
                result = await session.execute(
                    select(WisdomVerse).where(WisdomVerse.verse_id == verse_data['verse_id'])
                )
                existing = result.scalar_one_or_none()
                
                if not existing:
                    # Convert mental_health_applications list to dict format
                    applications_dict = {
                        "applications": verse_data.get('mental_health_applications', [])
                    }
                    
                    # Insert new verse
                    await session.execute(
                        insert(WisdomVerse).values(
                            verse_id=verse_data['verse_id'],
                            chapter=verse_data['chapter'],
                            verse_number=verse_data['verse_number'],
                            theme=verse_data['theme'],
                            english=verse_data['english'],
                            hindi=verse_data['hindi'],
                            sanskrit=verse_data['sanskrit'],
                            context=verse_data['context'],
                            mental_health_applications=applications_dict,
                            embedding=None  # Will be computed later if needed
                        )
                    )
                    print(f"Inserted verse {verse_data['verse_id']}")
                else:
                    print(f"Verse {verse_data['verse_id']} already exists, skipping")
            
            await session.commit()
            print("Wisdom verses seeding completed!")
    except Exception as e:
        print(f"Error during wisdom seeding: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    asyncio.run(main())
