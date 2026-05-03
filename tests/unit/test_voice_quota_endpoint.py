"""End-to-end tests for the Sakha voice REST endpoints (Part 6c).

  GET /api/voice/quota
  GET /api/voice/persona-version
"""

from __future__ import annotations

import os

os.environ.setdefault("KIAAN_PROMPT_LOADER_TEST", "1")
os.environ.setdefault("KIAAN_VOICE_QUOTA_TEST", "1")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from starlette.testclient import TestClient  # noqa: E402

from backend.routes.voice_quota import router  # noqa: E402
from backend.services.prompt_loader import (  # noqa: E402
    PERSONA_VERSION_FILE,
    reset_cache_for_tests,
)


def _live_persona_version() -> str:
    return PERSONA_VERSION_FILE.read_text(encoding="utf-8").strip()
from backend.services.voice.quota_service import (  # noqa: E402
    get_voice_quota_service,
)


@pytest.fixture
def client():
    reset_cache_for_tests()
    # Reset every user's daily counter so tests don't bleed
    s = get_voice_quota_service()
    for uid in [
        "u-q-free", "u-q-bhakta", "u-q-sadhak", "u-q-siddha",
        "u-q-exhausted", "u-q-partial",
    ]:
        s.reset_for_user_for_tests(uid)

    app = FastAPI()
    app.include_router(router)
    with TestClient(app) as c:
        yield c


# ─── /api/voice/persona-version ────────────────────────────────────────────


class TestPersonaVersionEndpoint:
    def test_returns_200_with_pinned_fields(self, client):
        r = client.get("/api/voice/persona-version")
        assert r.status_code == 200
        data = r.json()
        assert data["persona_version"] == _live_persona_version()
        assert data["schema_version"] == "1.0.0"
        assert data["subprotocol"] == "kiaan-voice-v1"
        assert data["server_loaded_at_iso"].startswith("20")  # ISO 8601 UTC

    def test_response_shape_is_strict(self, client):
        r = client.get("/api/voice/persona-version")
        assert set(r.json().keys()) == {
            "persona_version", "schema_version",
            "subprotocol", "server_loaded_at_iso",
        }


# ─── /api/voice/quota ─────────────────────────────────────────────────────


class TestQuotaEndpoint:
    def test_free_user_cannot_start(self, client):
        r = client.get("/api/voice/quota?user_id=u-q-free&tier=free")
        assert r.status_code == 200
        data = r.json()
        assert data["tier"] == "free"
        assert data["can_start_session"] is False
        assert data["minutes_remaining_today"] == 0

    def test_bhakta_fresh_quota(self, client):
        r = client.get("/api/voice/quota?user_id=u-q-bhakta&tier=bhakta")
        data = r.json()
        assert data["tier"] == "bhakta"
        assert data["can_start_session"] is True
        assert data["cap_minutes_per_day"] == 30
        assert data["minutes_remaining_today"] == 30

    def test_sadhak_unlimited(self, client):
        r = client.get("/api/voice/quota?user_id=u-q-sadhak&tier=sadhak")
        data = r.json()
        assert data["tier"] == "sadhak"
        assert data["can_start_session"] is True
        assert data["cap_minutes_per_day"] is None
        assert data["minutes_remaining_today"] is None

    def test_siddha_unlimited(self, client):
        r = client.get("/api/voice/quota?user_id=u-q-siddha&tier=siddha")
        data = r.json()
        assert data["tier"] == "siddha"
        assert data["can_start_session"] is True
        assert data["cap_minutes_per_day"] is None

    def test_bhakta_exhausted_after_using_all_minutes(self, client):
        s = get_voice_quota_service()
        s.record_minutes(user_id="u-q-exhausted", minutes=30)
        r = client.get("/api/voice/quota?user_id=u-q-exhausted&tier=bhakta")
        data = r.json()
        assert data["can_start_session"] is False
        assert data["minutes_remaining_today"] == 0
        assert "quota reached" in data["reason"].lower()

    def test_bhakta_partial_use(self, client):
        s = get_voice_quota_service()
        s.record_minutes(user_id="u-q-partial", minutes=18)
        r = client.get("/api/voice/quota?user_id=u-q-partial&tier=bhakta")
        data = r.json()
        assert data["minutes_used_today"] == 18
        assert data["minutes_remaining_today"] == 12

    def test_unknown_tier_falls_back_to_free(self, client):
        r = client.get("/api/voice/quota?user_id=u-q-bhakta&tier=hacker")
        data = r.json()
        assert data["tier"] == "free"
        assert data["can_start_session"] is False

    def test_response_includes_full_tier_matrix(self, client):
        r = client.get("/api/voice/quota?user_id=u-q-free&tier=free")
        data = r.json()
        assert len(data["tier_matrix"]) == 4
        tiers = {row["tier"] for row in data["tier_matrix"]}
        assert tiers == {"free", "bhakta", "sadhak", "siddha"}

    def test_persona_version_in_response(self, client):
        r = client.get("/api/voice/quota?user_id=u-q-bhakta&tier=bhakta")
        assert r.json()["persona_version"] == _live_persona_version()

    def test_missing_user_id_is_422(self, client):
        r = client.get("/api/voice/quota")
        assert r.status_code == 422

    def test_extra_field_in_response_forbidden_by_schema(self, client):
        # Pydantic strict response — there should be no extras
        r = client.get("/api/voice/quota?user_id=u-q-free&tier=free")
        data = r.json()
        expected = {
            "user_id", "tier", "minutes_used_today", "cap_minutes_per_day",
            "minutes_remaining_today", "can_start_session", "reason",
            "persona_version", "tier_matrix",
        }
        assert set(data.keys()) == expected
