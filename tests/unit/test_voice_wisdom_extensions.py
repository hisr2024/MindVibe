"""Tests for Part 2: Voice extensions to the Wisdom Core.

Covers:
  • CrisisPartialScanner — partial-transcript crisis detection, latching, region routing
  • StreamingGitaFilter   — sentence-streaming Gita-grounding verdicts
  • EngineRouter.voice_mode — voice-render annotations and ASSISTANT bias
  • WisdomEngine.render_mode — voice-arc rendering parity with text 4-Part

These tests are pure-Python (no DB, no network), so they run in <1s.
"""

from __future__ import annotations

import pytest

from backend.services.crisis_partial_scanner import (
    CrisisPartialScanner,
    CrisisSeverity,
    crisis_audio_for_language,
    helplines_for_region,
    get_scanner_for_session,
)
from backend.services.gita_wisdom_filter import (
    StreamingGitaFilter,
    StreamingFilterVerdict,
    WisdomTool,
)
from backend.services.kiaan_engine_router import EngineRouter, EngineType
from backend.services.wisdom_engine import wisdom_engine


# ─── CrisisPartialScanner ────────────────────────────────────────────────


class TestCrisisPartialScanner:
    """The most latency-critical filter in the system. Must NOT miss."""

    def test_detects_direct_ideation_english(self):
        scanner = CrisisPartialScanner("session-1", region="US", language="en")
        hit = scanner.scan("i just want to die honestly", seq=3)
        assert hit is not None
        assert hit.matched_phrase == "want to die"
        assert hit.severity == CrisisSeverity.IDEATION
        assert hit.seq_at_detection == 3
        assert hit.region == "US"
        assert hit.audio_url.endswith(".en.opus")

    def test_detects_method_severity(self):
        scanner = CrisisPartialScanner("session-2", region="IN")
        hit = scanner.scan("thinking about overdose tonight", seq=5)
        assert hit is not None
        assert hit.severity == CrisisSeverity.METHOD

    def test_detects_plan_severity(self):
        scanner = CrisisPartialScanner("session-3")
        hit = scanner.scan("i have a plan to end it", seq=2)
        assert hit is not None
        assert hit.severity == CrisisSeverity.PLAN

    def test_detects_devanagari(self):
        scanner = CrisisPartialScanner("session-4", region="IN", language="hi")
        hit = scanner.scan("मैं खुद को मार लूँगा", seq=1)
        assert hit is not None
        assert hit.audio_url.endswith(".hi.opus")
        assert hit.region == "IN"

    def test_detects_romanized_hindi(self):
        scanner = CrisisPartialScanner("session-5", language="hi")
        hit = scanner.scan("ab marna chahta hoon", seq=1)
        assert hit is not None

    def test_does_not_emit_on_benign_text(self):
        scanner = CrisisPartialScanner("session-6")
        for partial in ["i am feeling stressed", "work is hard today", "kill the lights"]:
            assert scanner.scan(partial) is None

    def test_latches_after_first_hit(self):
        scanner = CrisisPartialScanner("session-7")
        first = scanner.scan("i want to die", seq=1)
        assert first is not None
        # Subsequent scans return None — the WSS handler reads .is_latched
        second = scanner.scan("i want to die anyway", seq=2)
        assert second is None
        assert scanner.is_latched is True

    def test_helplines_for_region(self):
        in_lines = helplines_for_region("IN")
        assert any("Vandrevala" in h["name"] for h in in_lines)
        us_lines = helplines_for_region("US")
        assert any("988" in h["number"] for h in us_lines)
        unknown = helplines_for_region("ZZ")
        assert unknown[0]["region"] == "GLOBAL"

    def test_audio_falls_back_to_english_for_unknown_lang(self):
        assert crisis_audio_for_language("xx").endswith(".en.opus")
        assert crisis_audio_for_language("hi-IN").endswith(".hi.opus")
        assert crisis_audio_for_language(None).endswith(".en.opus")

    def test_factory_returns_fresh_instance(self):
        a = get_scanner_for_session("s")
        b = get_scanner_for_session("s")
        assert a is not b
        a.scan("kill myself")
        assert a.is_latched is True
        assert b.is_latched is False  # no leak between instances

    def test_to_frame_shape_for_wss(self):
        scanner = CrisisPartialScanner("session-x", region="US", language="en")
        hit = scanner.scan("i want to die", seq=4)
        assert hit is not None
        frame = hit.to_frame()
        assert frame["type"] == "crisis"
        assert "incident_id" in frame
        assert isinstance(frame["helpline"], list)
        assert frame["audio_url"]
        assert frame["region"] == "US"


# ─── StreamingGitaFilter ─────────────────────────────────────────────────


class TestStreamingGitaFilter:
    """Streaming filter must let well-grounded responses pass and reject the rest."""

    def test_passes_on_strong_gita_signal(self):
        f = StreamingGitaFilter(retrieved_verses=["BG 2.47"])
        # First sentence: Sanskrit + verse ref + concept
        r1 = f.feed("Krishna teaches in BG 2.47 that we have a right to action but not to its fruits. ")
        assert r1.verdict in (StreamingFilterVerdict.PASS, StreamingFilterVerdict.HOLD)
        r2 = f.feed("Practice Karma Yoga — act with full effort, surrender the result. ")
        # By second sentence we should have crossed PASS
        assert r2.verdict == StreamingFilterVerdict.PASS
        assert r2.cumulative_score >= StreamingGitaFilter.PASS_THRESHOLD

    def test_fails_on_other_tradition_citation(self):
        f = StreamingGitaFilter()
        r = f.feed("Buddha said all life is suffering. ")
        assert r.verdict == StreamingFilterVerdict.FAIL
        assert r.fallback_tier == "template"
        assert "hard violation" in (r.failure_reason or "")

    def test_fails_on_therapy_speak(self):
        f = StreamingGitaFilter()
        r = f.feed("As an AI, I cannot diagnose you. ")
        assert r.verdict == StreamingFilterVerdict.FAIL

    def test_fails_on_non_existent_verse(self):
        f = StreamingGitaFilter(retrieved_verses=["BG 2.47"])
        r = f.feed("BG 22.18 reminds us to act. ")
        assert r.verdict == StreamingFilterVerdict.FAIL
        assert "Chapter" in (r.failure_reason or "") or "BG" in (r.failure_reason or "")

    def test_fails_on_unretrieved_verse_citation(self):
        f = StreamingGitaFilter(retrieved_verses=["BG 2.47"])
        r = f.feed("BG 6.5 tells us to lift ourselves. ")
        assert r.verdict == StreamingFilterVerdict.FAIL
        assert "unretrieved" in (r.failure_reason or "")

    def test_fails_on_three_holds_with_no_signal(self):
        f = StreamingGitaFilter()
        f.feed("Take a deep breath. ")
        f.feed("Notice your body. ")
        r = f.feed("Try to relax. ")
        assert r.verdict == StreamingFilterVerdict.FAIL
        assert r.fallback_tier == "verse_only"

    def test_finalize_flushes_buffer(self):
        f = StreamingGitaFilter()
        f.feed("Krishna speaks of svadharma in the Gita")  # no terminator
        r = f.finalize()
        assert r.verdict in (StreamingFilterVerdict.PASS, StreamingFilterVerdict.FAIL)
        assert r.buffer_remaining == ""

    def test_finalize_fails_when_no_gita_signal_at_all(self):
        f = StreamingGitaFilter()
        f.feed("just relax ok")
        r = f.finalize()
        assert r.verdict == StreamingFilterVerdict.FAIL
        assert "no required Gita signal" in (r.failure_reason or "")

    def test_failed_filter_short_circuits_subsequent_feeds(self):
        f = StreamingGitaFilter()
        f.feed("Buddha said suffering is universal. ")
        assert f.is_failed
        r = f.feed("This is more text. ")
        assert r.verdict == StreamingFilterVerdict.FAIL
        assert "already in failed state" in (r.failure_reason or "")


# ─── EngineRouter voice_mode ─────────────────────────────────────────────


class TestEngineRouterVoiceMode:
    def test_text_mode_unchanged(self):
        router = EngineRouter()
        decision = router.route("what is dharma")
        assert decision.voice_mode is False
        assert decision.voice_render_mode == "text"
        assert decision.voice_target_duration_sec is None

    def test_voice_mode_annotates_target_duration_for_guidance(self):
        router = EngineRouter()
        # Use wisdom-direct phrasing that avoids casual triggers like "tell me"
        decision = router.route(
            "what does the bhagavad gita say about dharma karma and moksha",
            voice_mode=True,
        )
        assert decision.voice_mode is True
        assert decision.voice_render_mode == "voice"
        assert decision.primary_engine == EngineType.GUIDANCE
        assert decision.voice_target_duration_sec == 45

    def test_voice_mode_annotates_friend_for_emotional(self):
        router = EngineRouter()
        decision = router.route("i feel so anxious tonight", voice_mode=True)
        assert decision.voice_mode is True
        assert decision.primary_engine == EngineType.FRIEND
        assert decision.voice_target_duration_sec == 30

    def test_voice_mode_caps_crisis_short(self):
        router = EngineRouter()
        decision = router.route("i want to die", voice_mode=True)
        assert decision.is_crisis is True
        assert decision.voice_mode is True
        assert decision.voice_target_duration_sec == 20  # crisis cap

    def test_voice_mode_biases_ambiguous_assistant_to_friend(self):
        router = EngineRouter()
        # Ambiguous query that scores low on assistant patterns but emotional
        decision = router.route("can you help me feel better", voice_mode=True)
        assert decision.voice_mode is True
        # Should NOT be ASSISTANT since confidence wouldn't be >=0.6
        assert decision.primary_engine != EngineType.ASSISTANT


# ─── WisdomEngine.render_mode ────────────────────────────────────────────


class TestWisdomEngineRenderMode:
    def test_text_mode_default_unchanged(self):
        out = wisdom_engine.generate_response("i feel anxious")
        assert "**Ancient Wisdom Principle:**" in out
        assert "**Modern Application:**" in out
        assert "**Practical Steps:**" in out

    def test_voice_mode_drops_section_labels(self):
        out = wisdom_engine.generate_response("i feel anxious", render_mode="voice")
        assert "**Ancient Wisdom Principle:**" not in out
        assert "**Practical Steps:**" not in out

    def test_voice_mode_includes_pause_hints(self):
        out = wisdom_engine.generate_response("i feel anxious", render_mode="voice")
        assert "<pause:" in out

    def test_voice_mode_has_sanskrit(self):
        out = wisdom_engine.generate_response("i feel anxious", render_mode="voice")
        # Devanagari should be present in the verse opener
        assert any("ऀ" <= ch <= "ॿ" for ch in out)

    def test_voice_mode_crisis_routes_short(self):
        out = wisdom_engine.generate_response(
            "i want to kill myself", render_mode="voice"
        )
        # Voice-mode crisis is the spoken arc, not the helpline-table-text
        assert "🚨" not in out
        assert "<pause:" in out

    def test_invalid_render_mode_raises(self):
        with pytest.raises(ValueError):
            wisdom_engine.generate_response("anything", render_mode="bogus")

    def test_voice_mode_for_each_concern_is_complete(self):
        """Every concern bucket must produce a non-empty voice arc."""
        concerns = [
            "i feel anxious", "i'm so depressed", "i feel lonely",
            "i'm not good enough", "i'm so stressed", "i'm overwhelmed",
            "we had a fight", "i failed at this", "what is my purpose",
            "i am so uncertain",
        ]
        for msg in concerns:
            out = wisdom_engine.generate_response(msg, render_mode="voice")
            assert out, f"empty voice arc for {msg!r}"
            assert "<pause:" in out, f"missing pause hint for {msg!r}"
