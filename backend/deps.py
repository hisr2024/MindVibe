"""Dependency injection for FastAPI routes"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from fastapi import Depends, HTTPException, status

from backend.db_utils import build_database_url

# Database setup
DATABASE_URL = build_database_url()

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def get_user_id() -> str:
    """Get user ID - returns test user for now"""
    # For development/testing, return a test user ID
    return "dev-anon"
