"""Unit tests for the v1 privacy endpoints and backing services.

Covers:

- ``RateLimiter`` in-memory behaviour (Redis is not exercised here).
- ``PrivacyService`` export + deletion flows backed by the unified
  ``PrivacyRequest`` model.
- ``PrivacyRequest`` row lifecycle (status transitions, scheduled
  deletion timestamp, cancellation).
- Route wiring via ``/api/v1/privacy/*``.
- ZIP + README payload from the export builder.
- R2 fallback to token-based URLs when cloud storage is unconfigured.

The tests use the in-memory SQLite fixture from ``tests/conftest.py``
and a minimal JWT auth header so the routes pass
``get_current_user_object``.
"""

from __future__ import annotations

import io
import json
import zipfile

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import PrivacyRequest, User
from backend.services.privacy_service import (
    DELETION_GRACE_DAYS,
    PrivacyService,
    _build_export_zip,
    _upload_and_sign,
)
from backend.services.rate_limiter import RateLimiter

# =======================================================================
# RateLimiter
# =======================================================================

@pytest.mark.asyncio
async def test_rate_limiter_allows_within_limit():
    limiter = RateLimiter()
    key = f"test:allow:{id(limiter)}"
    await limiter.reset(key)
    assert [
        await limiter.check(key, limit=3, window_seconds=60) for _ in range(3)
    ] == [True, True, True]


@pytest.mark.asyncio
async def test_rate_limiter_blocks_over_limit():
    limiter = RateLimiter()
    key = f"test:block:{id(limiter)}"
    await limiter.reset(key)
    results = [
        await limiter.check(key, limit=2, window_seconds=60) for _ in range(4)
    ]
    assert results == [True, True, False, False]


@pytest.mark.asyncio
async def test_rate_limiter_fails_open_on_bad_args():
    """Invalid args must never block GDPR rights."""
    limiter = RateLimiter()
    assert await limiter.check("k", limit=0, window_seconds=60) is True
    assert await limiter.check("k", limit=5, window_seconds=0) is True


@pytest.mark.asyncio
async def test_rate_limiter_independent_keys():
    limiter = RateLimiter()
    key_a = f"test:iso-a:{id(limiter)}"
    key_b = f"test:iso-b:{id(limiter)}"
    await limiter.reset(key_a)
    await limiter.reset(key_b)
    for _ in range(2):
        assert await limiter.check(key_a, limit=2, window_seconds=60) is True
    assert await limiter.check(key_a, limit=2, window_seconds=60) is False
    assert await limiter.check(key_b, limit=2, window_seconds=60) is True


# =======================================================================
# PrivacyService — service-level
# =======================================================================

async def _mk_user(db: AsyncSession, uid: str = "privacy-user-1") -> User:
    user = User(
        id=uid,
        auth_uid=f"auth-{uid}",
        email=f"{uid}@example.com",
        hashed_password="xxx",
        email_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.mark.asyncio
async def test_create_privacy_request_inserts_row(test_db: AsyncSession):
    user = await _mk_user(test_db, "audit-user")
    service = PrivacyService(test_db)

    req = await service.create_privacy_request(
        user_id=user.id, request_type="export", ip_hash="abc123"
    )
    assert isinstance(req, PrivacyRequest)
    assert req.request_type == "export"
    assert req.status == "pending"
    assert req.ip_hash == "abc123"
    assert req.user_id == user.id

    rows = (await test_db.execute(select(PrivacyRequest))).scalars().all()
    assert any(r.id == req.id for r in rows)


@pytest.mark.asyncio
async def test_create_privacy_request_rejects_bad_type(test_db: AsyncSession):
    user = await _mk_user(test_db, "bad-type-user")
    service = PrivacyService(test_db)
    with pytest.raises(ValueError):
        await service.create_privacy_request(
            user_id=user.id, request_type="weird", ip_hash="x"
        )


@pytest.mark.asyncio
async def test_update_request_status_updates_fields(test_db: AsyncSession):
    user = await _mk_user(test_db, "update-user")
    service = PrivacyService(test_db)
    req = await service.create_privacy_request(
        user_id=user.id, request_type="export", ip_hash="x"
    )

    updated = await service.update_request_status(
        request_id=req.id,
        status="ready",
        download_url="https://example.test/signed",
    )
    assert updated is not None
    assert updated.status == "ready"
    assert updated.download_url == "https://example.test/signed"


@pytest.mark.asyncio
async def test_get_active_and_latest_export_request(test_db: AsyncSession):
    user = await _mk_user(test_db, "export-user")
    service = PrivacyService(test_db)
    req = await service.create_privacy_request(
        user_id=user.id, request_type="export", ip_hash="x"
    )

    active = await service.get_active_export_request(user.id)
    assert active is not None and active.id == req.id

    # Mark ready — no longer "active".
    await service.update_request_status(req.id, status="ready")
    assert await service.get_active_export_request(user.id) is None

    latest = await service.get_latest_export_request(user.id)
    assert latest is not None and latest.id == req.id
    assert latest.status == "ready"


@pytest.mark.asyncio
async def test_initiate_and_cancel_soft_delete(test_db: AsyncSession):
    user = await _mk_user(test_db, "delete-user")
    service = PrivacyService(test_db)

    req = await service.create_privacy_request(
        user_id=user.id, request_type="delete", ip_hash="x"
    )
    scheduled = await service.initiate_soft_delete(
        user_id=user.id, request_id=req.id
    )
    assert scheduled is not None

    active = await service.get_active_deletion_request(user.id)
    assert active is not None
    assert active.status == "pending_deletion"
    # Compare dialect-agnostically (SQLite strips tzinfo on read).
    assert active.scheduled_deletion_at is not None
    delta = abs(
        active.scheduled_deletion_at.replace(tzinfo=None).timestamp()
        - scheduled.replace(tzinfo=None).timestamp()
    )
    assert delta < 1.0

    cancelled = await service.cancel_soft_delete(user.id)
    assert cancelled is True
    assert await service.get_active_deletion_request(user.id) is None

    row = await test_db.get(PrivacyRequest, req.id)
    assert row is not None and row.status == "cancelled"


@pytest.mark.asyncio
async def test_cancel_without_pending_returns_false(test_db: AsyncSession):
    user = await _mk_user(test_db, "no-delete-user")
    service = PrivacyService(test_db)
    assert await service.cancel_soft_delete(user.id) is False


@pytest.mark.asyncio
async def test_initiate_soft_delete_rejects_unknown_user(test_db: AsyncSession):
    service = PrivacyService(test_db)
    # Create a privacy request with a valid user, then try to initiate
    # deletion with a bogus user id.
    user = await _mk_user(test_db, "present-user")
    req = await service.create_privacy_request(
        user_id=user.id, request_type="delete", ip_hash="x"
    )
    with pytest.raises(ValueError):
        await service.initiate_soft_delete(
            user_id="nonexistent-id", request_id=req.id
        )


# =======================================================================
# Export builder (ZIP + README + fallback URL)
# =======================================================================

def test_build_export_zip_contains_expected_files():
    data = {
        "account": {"id": "u1", "email": "u1@example.com"},
        "conversations": [],
        "practice": {"mood_logs": [], "journal_entries_encrypted": []},
        "subscription": [],
        "consents": [],
    }
    zip_bytes, filename = _build_export_zip("u1", data)
    assert filename.startswith("kiaanverse-data-export-u1-")
    assert filename.endswith(".zip")

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = set(zf.namelist())
        assert {
            "account.json",
            "conversations.json",
            "practice.json",
            "subscription.json",
            "consents.json",
            "README.txt",
        }.issubset(names)

        account = json.loads(zf.read("account.json"))
        assert account["id"] == "u1"

        readme = zf.read("README.txt").decode("utf-8")
        assert "KIAANVERSE DATA EXPORT" in readme
        assert "GDPR Art. 20" in readme


def test_upload_and_sign_falls_back_when_r2_not_configured(monkeypatch):
    """Without R2 env vars, we return a token URL instead of raising."""
    for var in (
        "R2_ENDPOINT_URL",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
    ):
        monkeypatch.delenv(var, raising=False)

    url, expires_at = _upload_and_sign(
        zip_bytes=b"irrelevant", filename="x.zip", user_id="u1"
    )
    assert "token=" in url
    assert expires_at is not None


# =======================================================================
# Router
# =======================================================================

def _auth_headers_for(user_id: str) -> dict:
    from backend.security.jwt import create_access_token

    token = create_access_token(user_id=str(user_id), session_id="t-session")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_export_returns_none_when_no_history(
    test_client: AsyncClient, test_db: AsyncSession
):
    user = await _mk_user(test_db, "get-none-user")
    response = await test_client.get(
        "/api/v1/privacy/export", headers=_auth_headers_for(user.id)
    )
    assert response.status_code == 200
    assert response.json()["status"] == "none"


@pytest.mark.asyncio
async def test_delete_then_cancel_flow(
    test_client: AsyncClient, test_db: AsyncSession
):
    user = await _mk_user(test_db, "del-cancel-user")
    headers = _auth_headers_for(user.id)

    # Request deletion — should return a fresh pending_deletion.
    resp1 = await test_client.post("/api/v1/privacy/delete", headers=headers)
    assert resp1.status_code == 200, resp1.text
    body1 = resp1.json()
    assert body1["status"] == "pending_deletion"
    assert body1["scheduled_deletion_at"] is not None

    # Second call is idempotent.
    resp2 = await test_client.post("/api/v1/privacy/delete", headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "pending_deletion"

    # Cancel.
    resp3 = await test_client.post(
        "/api/v1/privacy/delete/cancel", headers=headers
    )
    assert resp3.status_code == 200
    assert resp3.json()["status"] == "active"

    # Cancelling twice → 404.
    resp4 = await test_client.post(
        "/api/v1/privacy/delete/cancel", headers=headers
    )
    assert resp4.status_code == 404


@pytest.mark.asyncio
async def test_export_endpoint_requires_auth(test_client: AsyncClient):
    response = await test_client.post("/api/v1/privacy/export")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_export_endpoint_queues_and_returns_pending(
    test_client: AsyncClient, test_db: AsyncSession, monkeypatch
):
    user = await _mk_user(test_db, "export-post-user")
    headers = _auth_headers_for(user.id)

    # Stub the background task — it would otherwise try to build a ZIP
    # using the shared engine, which in the in-memory test harness is a
    # separate database than the one the test_db fixture is using.
    async def _noop_export(self, **kwargs):  # noqa: ARG001
        return None

    monkeypatch.setattr(
        "backend.services.privacy_service.PrivacyService.export_user_data",
        _noop_export,
    )
    await RateLimiter().reset(f"privacy:export:{user.id}")

    response = await test_client.post(
        "/api/v1/privacy/export", headers=headers
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "pending"
    assert body["request_id"]


@pytest.mark.asyncio
async def test_export_rate_limited_to_one_per_day(
    test_client: AsyncClient, test_db: AsyncSession, monkeypatch
):
    """Second export attempt within the window should be rejected 429.

    We route around the "existing pending" short-circuit by marking the
    first request ``ready`` between attempts — this exercises the
    ``RateLimiter.check`` path specifically.
    """
    user = await _mk_user(test_db, "rate-limit-user")
    headers = _auth_headers_for(user.id)

    async def _noop_export(self, **kwargs):  # noqa: ARG001
        return None

    monkeypatch.setattr(
        "backend.services.privacy_service.PrivacyService.export_user_data",
        _noop_export,
    )
    await RateLimiter().reset(f"privacy:export:{user.id}")

    # First attempt — allowed.
    r1 = await test_client.post("/api/v1/privacy/export", headers=headers)
    assert r1.status_code == 200

    # Move the request out of "active" so the second call reaches the
    # rate limiter instead of being idempotently collapsed.
    first_id = r1.json()["request_id"]
    row = await test_db.get(PrivacyRequest, first_id)
    assert row is not None
    row.status = "ready"
    await test_db.commit()

    # Second attempt — blocked by the 1/24h limit.
    r2 = await test_client.post("/api/v1/privacy/export", headers=headers)
    assert r2.status_code == 429


@pytest.mark.asyncio
async def test_deletion_grace_period_is_30_days(test_db: AsyncSession):
    assert DELETION_GRACE_DAYS == 30
