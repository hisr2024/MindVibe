"""
Test fixtures for MindVibe application.

This module provides common fixtures used across unit and integration tests.
"""

import asyncio
import importlib.util
import os
import sys
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

AIOSQLITE_AVAILABLE = importlib.util.find_spec("aiosqlite") is not None

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set environment variable to use SQLite for testing
if AIOSQLITE_AVAILABLE:
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the entire test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a test database session.
    Uses an in-memory SQLite database for testing.
    """
    if not AIOSQLITE_AVAILABLE:
        pytest.skip("aiosqlite is required for async sqlite tests")

    from backend import models

    # Create an in-memory SQLite database
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

    # Create a session maker
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    # Provide the session
    async with async_session() as session:
        yield session

    # Cleanup
    await engine.dispose()


@pytest.fixture(scope="function")
async def test_client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create a test client for integration testing.
    Overrides the get_db dependency to use the test database.
    """
    if not AIOSQLITE_AVAILABLE:
        pytest.skip("aiosqlite is required for async sqlite tests")

    from backend import main as app_module
    from backend import deps

    async def override_get_db():
        yield test_db

    app_module.app.dependency_overrides[deps.get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app_module.app), base_url="http://test"
    ) as client:
        yield client

    app_module.app.dependency_overrides.clear()


@pytest.fixture
def test_user_id():
    """Provide a test user ID for tests."""
    return 1


@pytest.fixture
def test_auth_uid():
    """Provide a test auth UID for tests."""
    return "test-user-123"
