"""
Test fixtures for MindVibe application.

This module provides common fixtures used across unit and integration tests.
"""

import asyncio
import os
import sys
import inspect
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.types import TypeDecorator
from starlette.requests import Request

# Allow pytest-cov options even when the plugin is not installed.
def pytest_addoption(parser):
    """Register optional coverage CLI flags to avoid errors without pytest-cov."""
    try:
        parser.addoption("--cov", action="append", default=[])
    except Exception:
        pass  # Already registered by pytest-cov
    try:
        parser.addoption("--cov-report", action="append", default=[])
    except Exception:
        pass
    try:
        parser.addoption("--cov-fail-under", action="store", default=None)
    except Exception:
        pass


def pytest_configure(config):
    """Register asyncio marker for environments without pytest-asyncio."""
    config.addinivalue_line("markers", "asyncio: mark async tests")


@pytest.hookimpl(tryfirst=True)
def pytest_pyfunc_call(pyfuncitem):
    """Run async test functions without pytest-asyncio."""
    if asyncio.iscoroutinefunction(pyfuncitem.obj):
        signature = inspect.signature(pyfuncitem.obj)
        allowed_args = {
            name: value
            for name, value in pyfuncitem.funcargs.items()
            if name in signature.parameters
        }
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(pyfuncitem.obj(**allowed_args))
        loop.close()
        return True
    return None

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set environment variable to use SQLite for testing
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from backend import main as app_module
from backend import models


# Patch ARRAY type to work with SQLite (convert to JSON)
class SQLiteCompatibleArray(TypeDecorator):
    """Type decorator that converts ARRAY to JSON for SQLite compatibility."""
    impl = JSON
    cache_ok = True

    def __init__(self, item_type=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.item_type = item_type


# Monkey-patch the ARRAY type for SQLite testing
original_array = ARRAY
models.ARRAY = SQLiteCompatibleArray


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the entire test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def test_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a test database session.
    Uses an in-memory SQLite database for testing.
    """
    async def setup_db():
        from sqlalchemy.dialects import postgresql

        # Monkey-patch ARRAY at the dialect level for SQLite
        original_array_class = postgresql.ARRAY
        postgresql.ARRAY = SQLiteCompatibleArray

        # Create an in-memory SQLite database
        engine = create_async_engine(
            "sqlite+aiosqlite:///:memory:",
            echo=False,
        )

        # Create only the tables needed for wisdom journey tests
        # Skip tables with PostgreSQL-specific types that can't be easily converted
        tables_to_create = [
            models.User.__table__,
            models.GitaVerse.__table__,
            models.Mood.__table__,
            models.JournalEntry.__table__,
            models.WisdomJourney.__table__,
            models.JourneyStep.__table__,
            models.JourneyRecommendation.__table__,
        ]

        # Add subscription-related tables
        for cls_name in ["SubscriptionPlan", "UserSubscription", "UsageTracking"]:
            if hasattr(models, cls_name):
                cls = getattr(models, cls_name)
                if hasattr(cls, "__table__") and cls.__table__ not in tables_to_create:
                    tables_to_create.append(cls.__table__)

        # Add auth-related tables
        for cls_name in ["Session", "AdminUser", "RefreshToken"]:
            if hasattr(models, cls_name):
                cls = getattr(models, cls_name)
                if hasattr(cls, "__table__") and cls.__table__ not in tables_to_create:
                    tables_to_create.append(cls.__table__)

        # Add Gita-related tables
        for cls_name in [
            "GitaChapter",
            "GitaVerseTranslation",
            "GitaKeyword",
            "GitaModernContext",
            "GitaSource",
            "GitaVerseKeyword",
        ]:
            if hasattr(models, cls_name):
                cls = getattr(models, cls_name)
                if hasattr(cls, "__table__") and cls.__table__ not in tables_to_create:
                    tables_to_create.append(cls.__table__)

        # Add content and blob tables
        for cls_name in ["EncryptedBlob", "ContentPack", "WisdomVerse"]:
            if hasattr(models, cls_name):
                cls = getattr(models, cls_name)
                if hasattr(cls, "__table__") and cls.__table__ not in tables_to_create:
                    tables_to_create.append(cls.__table__)

        # Add payment tables
        for cls_name in ["Payment"]:
            if hasattr(models, cls_name):
                cls = getattr(models, cls_name)
                if hasattr(cls, "__table__") and cls.__table__ not in tables_to_create:
                    tables_to_create.append(cls.__table__)

        # Add voice-related tables
        for cls_name in ["UserVoicePreferences", "VoiceAnalytics"]:
            if hasattr(models, cls_name):
                cls = getattr(models, cls_name)
                if hasattr(cls, "__table__") and cls.__table__ not in tables_to_create:
                    tables_to_create.append(cls.__table__)

        # Also add enhanced journey tables if they exist
        for table_name in [
            "journey_templates",
            "journey_template_steps",
            "user_journeys",
            "user_journey_step_state",
        ]:
            if hasattr(models, table_name):
                tables_to_create.append(getattr(models, table_name))
            # Check for class-based tables
            for cls_name in [
                "JourneyTemplate",
                "JourneyTemplateStep",
                "UserJourney",
                "UserJourneyStepState",
            ]:
                if hasattr(models, cls_name):
                    cls = getattr(models, cls_name)
                    if hasattr(cls, "__table__") and cls.__table__ not in tables_to_create:
                        tables_to_create.append(cls.__table__)

        async with engine.begin() as conn:
            # Create only compatible tables
            for table in tables_to_create:
                try:
                    await conn.run_sync(table.create, checkfirst=True)
                except Exception:
                    # Skip tables that fail to create
                    pass

        # Create a session maker
        async_session = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        session = async_session()
        return session, engine, original_array_class

    session, engine, original_array_class = asyncio.run(setup_db())
    try:
        yield session
    finally:
        async def teardown_db():
            await session.close()
            await engine.dispose()
            from sqlalchemy.dialects import postgresql

            postgresql.ARRAY = original_array_class

        asyncio.run(teardown_db())


@pytest.fixture(scope="function")
def test_client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create a test client for integration testing.
    Overrides the get_db dependency to use the test database.
    """
    from backend import deps

    async def override_get_db():
        yield test_db

    app_module.app.dependency_overrides[deps.get_db] = override_get_db

    client = AsyncClient(
        transport=ASGITransport(app=app_module.app), base_url="http://test"
    )
    try:
        yield client
    finally:
        asyncio.run(client.aclose())
        app_module.app.dependency_overrides.clear()


@pytest.fixture
def test_user_id():
    """Provide a test user ID for tests."""
    return 1


@pytest.fixture
def test_auth_uid():
    """Provide a test auth UID for tests."""
    return "test-user-123"


def create_test_token(user_id: str) -> str:
    """Create a JWT token for testing.

    Uses the same signing mechanism as the backend so that
    get_current_user() accepts the token during integration tests.
    """
    from backend.security.jwt import create_access_token
    return create_access_token(user_id=str(user_id), session_id="test-session")


def auth_headers_for(user_id: str) -> dict:
    """Return Authorization headers with a valid JWT for the given user ID."""
    token = create_test_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


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
