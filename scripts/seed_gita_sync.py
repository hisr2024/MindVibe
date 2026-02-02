"""
Synchronous Gita verse seeding script - Safe for Render.com
Seeds all 700 verses from data/gita/gita_verses_complete.json
"""
import json
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from backend.models import GitaVerse
from scripts.db_utils import get_sync_ssl_connect_args


def seed_gita_verses():
    """Seed all 700 Gita verses from JSON file."""

    print("🌱 Starting Gita Verse Seeding...")
    print("=" * 70)

    # Get database URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    # Convert postgres:// to postgresql:// for SQLAlchemy
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print(f"✅ Database URL configured")

    # Create engine with SSL support
    ssl_args = get_sync_ssl_connect_args(db_url)
    engine = create_engine(db_url, echo=False, connect_args=ssl_args)
    Session = sessionmaker(bind=engine)
    
    # Load JSON file
    json_path = Path(__file__).parent.parent / "data" / "gita" / "gita_verses_complete.json"

    if not json_path.exists():
        print(f"❌ ERROR: JSON file not found at {json_path}")
        sys.exit(1)

    print(f"📖 Loading verses from {json_path.name}...")
    
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            verses_data = json.load(f)
    except Exception as e:
        print(f"❌ ERROR loading JSON: {e}")
        sys.exit(1)
    
    print(f"✅ Loaded {len(verses_data)} verses from JSON")
    print("=" * 70)
    
    # Seed verses
    session = Session()
    try:
        seeded = 0
        skipped = 0
        failed = 0
        
        for idx, verse_data in enumerate(verses_data, 1):
            chapter = verse_data.get("chapter")
            verse_num = verse_data.get("verse")
            
            try:
                # Check if verse already exists
                existing = session.execute(
                    select(GitaVerse).where(
                        GitaVerse.chapter == chapter,
                        GitaVerse.verse == verse_num
                    )
                ).scalar_one_or_none()
                
                if existing:
                    skipped += 1
                    continue
                
                # Create new verse
                verse = GitaVerse(
                    chapter=chapter,
                    verse=verse_num,
                    sanskrit=verse_data.get("sanskrit", ""),
                    transliteration=verse_data.get("transliteration"),
                    hindi=verse_data.get("hindi", ""),
                    english=verse_data.get("english", ""),
                    word_meanings=verse_data.get("word_meanings", {}),
                    principle=verse_data.get("principle", ""),
                    theme=verse_data.get("theme", ""),
                    mental_health_applications=verse_data.get("mental_health_applications", []),
                    primary_domain=verse_data.get("primary_domain"),
                    secondary_domains=verse_data.get("secondary_domains"),
                )
                
                session.add(verse)
                seeded += 1
                
                # Commit in batches of 100
                if seeded % 100 == 0:
                    session.commit()
                    print(f"   ✅ Seeded {seeded} verses...")
                
            except Exception as e:
                print(f"   ⚠️  Failed verse {chapter}. {verse_num}: {e}")
                failed += 1
                continue
        
        # Final commit
        session.commit()
        
        # Summary
        print("=" * 70)
        print("📊 SEEDING SUMMARY")
        print("=" * 70)
        print(f"   ✅ Seeded: {seeded}")
        print(f"   ⏭️  Skipped: {skipped}")
        print(f"   ❌ Failed: {failed}")
        print(f"   📊 Total: {seeded + skipped}/{len(verses_data)}")
        print("=" * 70)
        
        # Verify final count
        total = session.execute(select(GitaVerse)).scalars().all()
        print(f"\n✅ Total verses in database: {len(total)}/700")

        if len(total) == 700:
            print("\n🎉 SUCCESS! All 700 Gita verses are now in the database!")
        else:
            print(f"\n⚠️  WARNING: Expected 700 verses, found {len(total)}")

    except Exception as e:
        print(f"\n❌ ERROR during seeding: {e}")
        session.rollback()
        sys.exit(1)
    finally:
        session.close()
        engine.dispose()


if __name__ == "__main__":
    seed_gita_verses()
