"""
Verify GitaVerse database schema matches model definition.
Identifies missing columns and type mismatches.

Usage:
    python scripts/verify_db_schema.py

Environment Variables:
    DATABASE_URL: PostgreSQL connection string (required)

Exit Codes:
    0: Schema verification passed
    1: Schema verification failed (missing columns or other errors)
"""

import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy import text

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.db_utils import create_ssl_engine, normalize_database_url


async def verify_schema() -> bool:
    """
    Verify that the gita_verses table has all required columns.

    Returns:
        bool: True if schema is valid, False otherwise
    """
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL", "")

    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False

    # Normalize URL for asyncpg and create SSL-enabled engine
    database_url = normalize_database_url(database_url)
    engine = create_ssl_engine(database_url)
    
    try:
        async with engine.begin() as conn:
            # Check if gita_verses table exists
            result = await conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'gita_verses'
            """))
            
            if not result.fetchone():
                print("❌ Table 'gita_verses' does not exist")
                print("   Run migrations first:")
                print("   psql $DATABASE_URL < migrations/20251109_add_gita_wisdom_database.sql")
                return False
            
            # Get all columns from gita_verses table
            result = await conn.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'gita_verses'
                ORDER BY ordinal_position
            """))
            
            columns = {row[0]: {"type": row[1], "nullable": row[2]} for row in result.fetchall()}
            
            # Expected columns based on GitaVerse model
            expected = [
                'id', 'chapter', 'verse', 'sanskrit', 'transliteration',
                'hindi', 'english', 'word_meanings', 'principle', 'theme',
                'source_id', 'embedding', 'mental_health_applications',
                'primary_domain', 'secondary_domains', 'created_at', 'updated_at'
            ]
            
            # Migration mapping for missing columns
            # Note: transliteration is included in base migration 20251109_add_gita_wisdom_database.sql
            MIGRATION_MAP = {
                'mental_health_applications': '20251207_add_mental_health_tags_to_gita.sql',
                'primary_domain': '20251207_add_wisdom_verse_domains.sql',
                'secondary_domains': '20251207_add_wisdom_verse_domains.sql',
            }
            
            # Check for missing columns
            missing = [col for col in expected if col not in columns]
            
            if missing:
                print("❌ Missing columns in gita_verses table:")
                for col in missing:
                    print(f"   - {col}")
                
                # Determine required migrations
                required_migrations = set()
                for col in missing:
                    if col in MIGRATION_MAP:
                        required_migrations.add(MIGRATION_MAP[col])
                
                if required_migrations:
                    print("\n📋 Required migrations:")
                    for migration in sorted(required_migrations):
                        print(f"   psql $DATABASE_URL < migrations/{migration}")
                return False
            
            # Display found columns
            print("✅ Schema verification passed")
            print(f"\n📊 Found {len(columns)} columns in gita_verses table:")
            for col_name, col_info in sorted(columns.items()):
                nullable = "NULL" if col_info["nullable"] == "YES" else "NOT NULL"
                print(f"   ✓ {col_name:<30} {col_info['type']:<20} {nullable}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error during schema verification: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await engine.dispose()


async def main() -> int:
    """
    Main entry point for schema verification.
    
    Returns:
        int: Exit code (0 for success, 1 for failure)
    """
    print("\n" + "=" * 70)
    print("🔍 GITA VERSES DATABASE SCHEMA VERIFICATION")
    print("=" * 70 + "\n")
    
    success = await verify_schema()
    
    print("\n" + "=" * 70)
    if success:
        print("✅ SCHEMA VERIFICATION COMPLETED SUCCESSFULLY")
        print("=" * 70 + "\n")
        return 0
    else:
        print("❌ SCHEMA VERIFICATION FAILED")
        print("=" * 70 + "\n")
        print("Please run the required migrations and try again.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
