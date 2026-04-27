"""Unit tests for backend/services/voice/quota_service.py (Part 6b)."""

from __future__ import annotations

import os

# Allow reset_for_user_for_tests to run
os.environ.setdefault("KIAAN_VOICE_QUOTA_TEST", "1")

import pytest  # noqa: E402

from backend.services.voice.quota_service import (  # noqa: E402
    TIER_MATRIX,
    VoiceQuotaService,
    get_voice_quota_service,
    normalize_tier,
)


class TestTierMatrix:
    def test_all_four_tiers_present(self):
        assert set(TIER_MATRIX.keys()) == {"free", "bhakta", "sadhak", "siddha"}

    def test_free_is_locked(self):
        assert TIER_MATRIX["free"].minutes_per_day == 0
        assert TIER_MATRIX["free"].engines == ()

    def test_bhakta_is_30_minutes(self):
        assert TIER_MATRIX["bhakta"].minutes_per_day == 30

    def test_sadhak_and_siddha_unlimited(self):
        assert TIER_MATRIX["sadhak"].minutes_per_day is None
        assert TIER_MATRIX["siddha"].minutes_per_day is None


class TestNormalizeTier:
    def test_canonical_passthrough(self):
        assert normalize_tier("bhakta") == "bhakta"
        assert normalize_tier("sadhak") == "sadhak"

    def test_uppercase_normalized(self):
        assert normalize_tier("BHAKTA") == "bhakta"
        assert normalize_tier("Siddha") == "siddha"

    def test_unknown_falls_back_to_free(self):
        assert normalize_tier("hacker") == "free"
        assert normalize_tier(None) == "free"
        assert normalize_tier("") == "free"


class TestEvaluate:
    def setup_method(self):
        self.s = VoiceQuotaService()

    def test_free_cannot_start(self):
        e = self.s.evaluate(user_id="u-free", tier="free")
        assert e.can_start_session is False
        assert e.cap_minutes_per_day == 0
        assert e.minutes_remaining_today == 0

    def test_bhakta_fresh_can_start_with_30min(self):
        e = self.s.evaluate(user_id="u-bh1", tier="bhakta")
        assert e.can_start_session is True
        assert e.cap_minutes_per_day == 30
        assert e.minutes_remaining_today == 30

    def test_sadhak_unlimited(self):
        e = self.s.evaluate(user_id="u-sa", tier="sadhak")
        assert e.can_start_session is True
        assert e.cap_minutes_per_day is None
        assert e.minutes_remaining_today is None

    def test_siddha_unlimited(self):
        e = self.s.evaluate(user_id="u-si", tier="siddha")
        assert e.can_start_session is True
        assert e.cap_minutes_per_day is None

    def test_bhakta_exhausted_cannot_start(self):
        self.s.record_minutes(user_id="u-bh2", minutes=30)
        e = self.s.evaluate(user_id="u-bh2", tier="bhakta")
        assert e.can_start_session is False
        assert e.minutes_remaining_today == 0

    def test_bhakta_partial_use_remaining_balance(self):
        self.s.record_minutes(user_id="u-bh3", minutes=12)
        e = self.s.evaluate(user_id="u-bh3", tier="bhakta")
        assert e.can_start_session is True
        assert e.minutes_remaining_today == 18

    def test_unknown_tier_treated_as_free(self):
        e = self.s.evaluate(user_id="u-unknown", tier="hacker")
        assert e.tier == "free"
        assert e.can_start_session is False


class TestRecordMinutes:
    def setup_method(self):
        self.s = VoiceQuotaService()

    def test_record_accumulates(self):
        self.s.record_minutes(user_id="u-rec", minutes=5)
        self.s.record_minutes(user_id="u-rec", minutes=7)
        e = self.s.evaluate(user_id="u-rec", tier="bhakta")
        assert e.minutes_used_today == 12

    def test_negative_minutes_ignored(self):
        self.s.record_minutes(user_id="u-neg", minutes=-3)
        e = self.s.evaluate(user_id="u-neg", tier="bhakta")
        assert e.minutes_used_today == 0

    def test_fractional_rounds_up_to_whole_minute(self):
        # 0.5 + 0.5 = 1.0 each rounds up to 1 → 2 minutes counted
        self.s.record_minutes(user_id="u-frac", minutes=0.5)  # type: ignore[arg-type]
        self.s.record_minutes(user_id="u-frac", minutes=0.5)  # type: ignore[arg-type]
        e = self.s.evaluate(user_id="u-frac", tier="bhakta")
        assert e.minutes_used_today == 2


class TestResetGuard:
    def test_reset_refuses_without_env(self, monkeypatch):
        monkeypatch.delenv("KIAAN_VOICE_QUOTA_TEST", raising=False)
        s = VoiceQuotaService()
        with pytest.raises(RuntimeError):
            s.reset_for_user_for_tests("u")

    def test_reset_works_with_env(self, monkeypatch):
        monkeypatch.setenv("KIAAN_VOICE_QUOTA_TEST", "1")
        s = VoiceQuotaService()
        s.record_minutes(user_id="u-r", minutes=10)
        s.reset_for_user_for_tests("u-r")
        e = s.evaluate(user_id="u-r", tier="bhakta")
        assert e.minutes_used_today == 0


class TestSingleton:
    def test_get_voice_quota_service_returns_same_instance(self):
        a = get_voice_quota_service()
        b = get_voice_quota_service()
        assert a is b
