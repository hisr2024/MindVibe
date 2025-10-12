"""
Seed script for wisdom verses.

Loads wisdom verses from data/wisdom/verses.json and populates the database.
"""

import asyncio
import os
import json
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import insert, select
from app.models import Base, WisdomVerse

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")
engine = create_async_engine(DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)


async def load_verses_from_json(filepath: str):
    """Load verses from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


async def main():
    """Main seeding function with batch insertion for efficiency."""
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
        print(f"Warning: Verses file not found at {verses_path}")
        return
    
    verses_data = await load_verses_from_json(verses_path)
    print(f"Loaded {len(verses_data)} verses from {verses_path}")
    
    # Seed the database using batch insertion
    async with Session() as session:
        # Get all existing verse IDs for efficient checking
        result = await session.execute(select(WisdomVerse.verse_id))
        existing_ids = {row[0] for row in result.fetchall()}
        print(f"Found {len(existing_ids)} existing verses in database")
        
        # Prepare batch insert data
        new_verses = []
        skipped_count = 0
        
        for verse_data in verses_data:
            if verse_data['verse_id'] not in existing_ids:
                # Convert mental_health_applications list to dict format
                applications_dict = {
                    "applications": verse_data.get('mental_health_applications', [])
                }
                
                new_verses.append({
                    'verse_id': verse_data['verse_id'],
                    'chapter': verse_data['chapter'],
                    'verse_number': verse_data['verse_number'],
                    'theme': verse_data['theme'],
                    'english': verse_data['english'],
                    'hindi': verse_data['hindi'],
                    'sanskrit': verse_data['sanskrit'],
                    'context': verse_data['context'],
                    'mental_health_applications': applications_dict,
                    'embedding': None  # Will be computed later if needed
                })
            else:
                skipped_count += 1
        
        # Batch insert new verses (in chunks for very large datasets)
        if new_verses:
            batch_size = 100
            total_inserted = 0
            
            for i in range(0, len(new_verses), batch_size):
                batch = new_verses[i:i + batch_size]
                await session.execute(insert(WisdomVerse), batch)
                total_inserted += len(batch)
                print(f"Inserted batch: {total_inserted}/{len(new_verses)} verses")
            
            await session.commit()
            print(f"\nSeeding completed!")
            print(f"  New verses inserted: {len(new_verses)}")
            print(f"  Existing verses skipped: {skipped_count}")
            print(f"  Total verses in database: {len(verses_data)}")
        else:
            print(f"All {len(verses_data)} verses already exist in database, no insertion needed")


if __name__ == "__main__":
    asyncio.run(main())
