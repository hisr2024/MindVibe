"""
Test fixtures for MindVibe application.

This module provides common fixtures used across unit and integration tests.
"""

import asyncio
import os
import sys
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from starlette.requests import Request

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set environment variable to use SQLite for testing
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from backend import main as app_module
from backend import models


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


@pytest.fixture
def mock_request():
    """Create a mock Starlette Request for unit testing rate-limited endpoints.
    
    This fixture creates a minimal Request object that satisfies the slowapi
    rate limiter's requirements for extracting client IP address.
    """
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/test",
        "query_string": b"",
        "root_path": "",
        "headers": [],
        "server": ("127.0.0.1", 8000),
        "client": ("127.0.0.1", 12345),
    }
    return Request(scope)
