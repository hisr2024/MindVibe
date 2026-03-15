"""
Integration tests for YouTube transcript processing API endpoints.

Tests authentication, SSRF protection, and Gita compliance
validation on the YouTube processing endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User
from backend.security.password_hash import hash_password
from tests.conftest import auth_headers_for


@pytest.fixture
async def test_user(test_db: AsyncSession):
    """Create a test user for authenticated endpoint tests."""
    user = User(
        auth_uid="yt-test-auth-uid",
        email="yttest@example.com",
        hashed_password=hash_password("Test1234"),
        email_verified=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


# =============================================================================
# Authentication Tests
# =============================================================================


@pytest.mark.asyncio
async def test_process_video_unauthenticated(test_client: AsyncClient):
    """POST /youtube/process-video without auth returns 401."""
    response = await test_client.post(
        "/api/kiaan/learning/youtube/process-video",
        json={"video_url": "dQw4w9WgXcQ"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_quota_unauthenticated(test_client: AsyncClient):
    """GET /youtube/quota without auth returns 401."""
    response = await test_client.get(
        "/api/kiaan/learning/youtube/quota",
    )
    assert response.status_code == 401


# =============================================================================
# Input Validation / SSRF Prevention Tests
# =============================================================================


@pytest.mark.asyncio
async def test_process_video_non_youtube_url_rejected(
    test_client: AsyncClient, test_user: User
):
    """Non-YouTube URL is rejected with 422 (validation error)."""
    headers = auth_headers_for(test_user.id)
    response = await test_client.post(
        "/api/kiaan/learning/youtube/process-video",
        json={"video_url": "https://evil.com/malicious-payload"},
        headers=headers,
    )
    assert response.status_code == 422
    assert "YouTube URL" in response.text


@pytest.mark.asyncio
async def test_process_video_internal_url_rejected(
    test_client: AsyncClient, test_user: User
):
    """Internal URLs (SSRF attempt) are rejected."""
    headers = auth_headers_for(test_user.id)
    response = await test_client.post(
        "/api/kiaan/learning/youtube/process-video",
        json={"video_url": "http://169.254.169.254/metadata"},
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_process_video_invalid_language_rejected(
    test_client: AsyncClient, test_user: User
):
    """Invalid language codes are rejected."""
    headers = auth_headers_for(test_user.id)
    response = await test_client.post(
        "/api/kiaan/learning/youtube/process-video",
        json={
            "video_url": "dQw4w9WgXcQ",
            "languages": ["en", "xx_inject"],
        },
        headers=headers,
    )
    assert response.status_code == 422
    assert "Unsupported language" in response.text


# =============================================================================
# Quota Endpoint Tests
# =============================================================================


@pytest.mark.asyncio
async def test_quota_endpoint_authenticated(
    test_client: AsyncClient, test_user: User
):
    """GET /youtube/quota with auth returns quota information."""
    headers = auth_headers_for(test_user.id)
    response = await test_client.get(
        "/api/kiaan/learning/youtube/quota",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "daily_quota" in data
