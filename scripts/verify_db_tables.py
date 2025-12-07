"""Verify database tables and schema."""

import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def verify_tables():
    """Check what tables exist and their columns."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(database_url)
    
    async with engine.connect() as conn:
        # List all tables
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' 
            ORDER BY table_name;
        """))
        
        tables = [row[0] for row in result.fetchall()]
        
        print("=" * 70)
        print("📋 DATABASE TABLES")
        print("=" * 70)
        for table in tables:
            print(f"   ✅ {table}")
        print()
        
        # Check gita_verses table specifically
        if 'gita_verses' in tables:
            print("=" * 70)
            print("🔍 GITA_VERSES TABLE STRUCTURE")
            print("=" * 70)
            
            result = await conn.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'gita_verses'
                ORDER BY ordinal_position;
            """))
            
            for row in result.fetchall():
                nullable = "NULL" if row[2] == "YES" else "NOT NULL"
                print(f"   {row[0]:<30} {row[1]:<20} {nullable}")
            print()
            
            # Count verses
            result = await conn.execute(text("SELECT COUNT(*) FROM gita_verses;"))
            count = result.scalar()
            print(f"📊 Current verse count: {count}/700\n")
        else:
            print("❌ gita_verses table does not exist!\n")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(verify_tables())
