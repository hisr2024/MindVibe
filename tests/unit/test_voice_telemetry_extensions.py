"""Tests for Part 3: Dynamic Wisdom v3.1 voice-channel telemetry.

Covers the additive surface:
  • _PendingDelivery.delivery_channel propagates into ORM kwargs
  • _validate_voice_outcomes drops unknown keys & clamps ranges
  • record_wisdom_delivery accepts delivery_channel + bumps voice counter
  • _update_voice_metrics rolls outcome signals into counters correctly
  • get_voice_metrics derives sane rates and returns None when total=0

These tests stay pure-Python (no DB) — the delivery flushes to the buffer
which is what the corpus contract guarantees the WSS endpoint can rely on.
"""

from __future__ import annotations

import asyncio

from backend.services.dynamic_wisdom_corpus import (
    DynamicWisdomCorpus,
    VALID_DELIVERY_CHANNELS,
    VOICE_OUTCOME_KEYS,
    _PendingDelivery,
    _validate_voice_outcomes,
)


class TestPendingDelivery:
    def test_delivery_channel_default_is_text(self):
        p = _PendingDelivery(
            user_id="u", session_id="s", verse_ref="BG 2.47",
            principle=None, mood_at_delivery="anxious",
            mood_intensity_at_delivery=0.5, phase_at_delivery="exploring",
            theme_used=None,
        )
        kwargs = p.to_orm_kwargs()
        assert kwargs["delivery_channel"] == "text"

    def test_delivery_channel_voice_propagates_to_orm(self):
        p = _PendingDelivery(
            user_id="u", session_id="s", verse_ref="BG 2.47",
            principle="karma yoga", mood_at_delivery="anxious",
            mood_intensity_at_delivery=0.5, phase_at_delivery="exploring",
            theme_used="anxiety",
            delivery_channel="voice_android",
        )
        kwargs = p.to_orm_kwargs()
        assert kwargs["delivery_channel"] == "voice_android"


class TestValidateVoiceOutcomes:
    def test_returns_none_for_none_input(self):
        assert _validate_voice_outcomes(None) is None
        assert _validate_voice_outcomes({}) is None

    def test_drops_unknown_keys(self):
        out = _validate_voice_outcomes({"completed_listening": True, "garbage_key": "x"})
        assert out == {"completed_listening": True}

    def test_clamps_filter_pass_rate(self):
        assert _validate_voice_outcomes({"filter_pass_rate": 1.5}) == {"filter_pass_rate": 1.0}
        assert _validate_voice_outcomes({"filter_pass_rate": -0.5}) == {"filter_pass_rate": 0.0}
        assert _validate_voice_outcomes({"filter_pass_rate": 0.7}) == {"filter_pass_rate": 0.7}

    def test_clamps_first_byte_ms_to_non_negative_int(self):
        out = _validate_voice_outcomes({"first_audio_byte_ms": 1234.7})
        assert out == {"first_audio_byte_ms": 1234}
        out = _validate_voice_outcomes({"first_audio_byte_ms": -10})
        assert out == {"first_audio_byte_ms": 0}

    def test_clamps_time_to_next_session(self):
        assert _validate_voice_outcomes(
            {"time_to_next_session_hours": -2}
        ) == {"time_to_next_session_hours": 0.0}

    def test_truncates_tier_used_to_32_chars(self):
        long = "x" * 100
        out = _validate_voice_outcomes({"tier_used": long})
        assert out is not None and len(out["tier_used"]) == 32

    def test_coerces_truthy_to_bool(self):
        out = _validate_voice_outcomes({"completed_listening": 1, "session_continued": ""})
        assert out == {"completed_listening": True, "session_continued": False}

    def test_validates_all_known_keys(self):
        full = {
            "completed_listening": True,
            "tapped_follow_up_practice": False,
            "session_continued": True,
            "time_to_next_session_hours": 4.5,
            "barge_in_at_token_index": 12,
            "filter_pass_rate": 0.9,
            "first_audio_byte_ms": 1100,
            "tier_used": "openai",
            "cache_hit": True,
        }
        cleaned = _validate_voice_outcomes(full)
        assert cleaned is not None
        assert set(cleaned.keys()) == set(full.keys())


class TestVoiceConstants:
    def test_valid_delivery_channels(self):
        assert "text" in VALID_DELIVERY_CHANNELS
        assert "voice_android" in VALID_DELIVERY_CHANNELS
        assert "voice_web" in VALID_DELIVERY_CHANNELS
        assert "voice_ios" in VALID_DELIVERY_CHANNELS
        # Negative
        assert "voice_zune" not in VALID_DELIVERY_CHANNELS

    def test_voice_outcome_keys_set(self):
        # Should include all keys defined in the spec
        for key in (
            "completed_listening", "tapped_follow_up_practice",
            "session_continued", "time_to_next_session_hours",
            "barge_in_at_token_index", "filter_pass_rate",
            "first_audio_byte_ms", "tier_used", "cache_hit",
        ):
            assert key in VOICE_OUTCOME_KEYS


class TestVoiceMetricsRollup:
    def test_get_voice_metrics_returns_none_when_no_data(self):
        c = DynamicWisdomCorpus()
        m = c.get_voice_metrics()
        assert m["deliveries_total"] == 0
        # Rates should be None until at least one event
        assert m["completed_listening_rate"] is None
        assert m["barge_in_rate"] is None
        assert m["filter_pass_rate"] is None
        assert m["tier_fallback_rate"] is None
        assert m["cache_hit_rate"] is None
        assert m["first_byte_ms_avg"] is None

    def test_update_voice_metrics_increments_correctly(self):
        c = DynamicWisdomCorpus()
        c._update_voice_metrics({
            "completed_listening": True,
            "first_audio_byte_ms": 1000,
            "filter_pass_rate": 1.0,
            "tier_used": "openai",
            "cache_hit": True,
        })
        c._update_voice_metrics({
            "barge_in_at_token_index": 5,
            "first_audio_byte_ms": 1400,
            "filter_pass_rate": 0.5,
            "tier_used": "template",
            "cache_hit": False,
        })
        c._metrics["voice_outcomes_total"] = 2  # simulate the wrapping caller
        m = c.get_voice_metrics()
        assert m["completed_listening_count"] == 1
        assert m["barge_in_count"] == 1
        assert m["completed_listening_rate"] == 0.5
        assert m["barge_in_rate"] == 0.5
        assert m["filter_pass_rate"] == 0.5  # 1 pass / 2 total
        assert m["tier_fallback_count"] == 1  # template counts as fallback
        assert m["tier_fallback_rate"] == 0.5
        assert m["cache_hit_rate"] == 0.5
        assert m["first_byte_ms_avg"] == 1200.0  # (1000 + 1400) / 2

    def test_voice_dimensions_in_runtime_metrics(self):
        c = DynamicWisdomCorpus()
        full = c.get_runtime_metrics()
        assert "voice" in full
        assert isinstance(full["voice"], dict)
        assert "deliveries_total" in full["voice"]


class TestRecordDeliveryVoiceChannel:
    """The voice counter increment happens before any DB I/O, so these
    tests only need the buffer-side behavior — no SessionLocal involvement."""

    @staticmethod
    def _drain_no_flush(corpus: DynamicWisdomCorpus) -> None:
        """Cancel the auto-flush task without touching the DB.

        record_wisdom_delivery() lazily starts a background flush task.
        The task tries to import backend.deps.SessionLocal, which in this
        test environment isn't loadable. We cancel it before it gets a
        chance to run."""
        corpus._stopped = True
        if corpus._flush_task and not corpus._flush_task.done():
            corpus._flush_task.cancel()

    def test_voice_channel_increments_voice_counter(self):
        async def run():
            c = DynamicWisdomCorpus()
            try:
                await c.record_wisdom_delivery(
                    db=None,
                    user_id="u", session_id="s",
                    verse_ref="BG 2.47", principle=None,
                    mood="anxious", mood_intensity=0.5, phase="exploring",
                    delivery_channel="voice_android",
                )
                assert c._metrics["voice_deliveries_total"] == 1
                # Buffered with the right channel
                assert len(c._delivery_buffer) == 1
                assert c._delivery_buffer[0].delivery_channel == "voice_android"
            finally:
                self._drain_no_flush(c)

        asyncio.run(run())

    def test_unknown_channel_coerced_to_text_with_no_voice_increment(self):
        async def run():
            c = DynamicWisdomCorpus()
            try:
                await c.record_wisdom_delivery(
                    db=None,
                    user_id="u", session_id="s",
                    verse_ref="BG 2.47", principle=None,
                    mood="anxious", mood_intensity=0.5, phase="exploring",
                    delivery_channel="voice_zune",  # unknown
                )
                assert c._metrics["voice_deliveries_total"] == 0
                assert c._delivery_buffer[0].delivery_channel == "text"
            finally:
                self._drain_no_flush(c)

        asyncio.run(run())

    def test_text_channel_default_does_not_increment_voice_counter(self):
        async def run():
            c = DynamicWisdomCorpus()
            try:
                await c.record_wisdom_delivery(
                    db=None,
                    user_id="u", session_id="s",
                    verse_ref="BG 2.47", principle=None,
                    mood="anxious", mood_intensity=0.5, phase="exploring",
                )
                assert c._metrics["voice_deliveries_total"] == 0
                assert c._delivery_buffer[0].delivery_channel == "text"
            finally:
                self._drain_no_flush(c)

        asyncio.run(run())
