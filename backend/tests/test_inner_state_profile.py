"""
Tests for inner_state_profile merge logic.

Covers:
  - Theme reinforcement and decay
  - Growth signal repeat-gating
  - Reactivity EMA blending and trend derivation
  - Awareness slow increase
  - Steadiness EMA blending
  - Edge cases: empty/null inputs, first session
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.services.voice_learning.inner_state_profile import (
    merge_profile,
    THEME_REINFORCE_STEP,
    THEME_DECAY_FACTOR,
    THEME_DECAY_AFTER_SESSIONS,
    THEME_WEIGHT_FLOOR,
    GROWTH_REINFORCE_STEP,
    GROWTH_REPEAT_THRESHOLD,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_profile(**overrides):
    """Build a minimal profile dict with overrides."""
    base = {
        "themes": {},
        "growth_signals": {},
        "reactivity": {},
        "awareness": {},
        "steadiness": 0.5,
        "session_count": 0,
        "last_updated": "2025-01-01T00:00:00+00:00",
    }
    base.update(overrides)
    return base


def make_signals(**overrides):
    """Build a minimal session-signals dict with overrides."""
    base = {
        "themes_detected": [],
        "growth_signals_detected": [],
        "reactivity_markers": {},
        "awareness_indicators": [],
        "steadiness_observed": None,
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# First session / empty inputs
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_none_profile_creates_scaffold(self):
        result = merge_profile(None, None)
        assert result["session_count"] == 1
        assert result["themes"] == {}
        assert isinstance(result["last_updated"], str)

    def test_empty_dict_profile(self):
        result = merge_profile({}, {})
        assert result["session_count"] == 1

    def test_none_signals_still_increments_session(self):
        profile = make_profile(session_count=5)
        result = merge_profile(profile, None)
        assert result["session_count"] == 6

    def test_does_not_mutate_input(self):
        profile = make_profile(themes={"anger": {"weight": 0.3, "first_seen_session": 1, "last_seen_session": 1, "occurrence_count": 1}})
        original_weight = profile["themes"]["anger"]["weight"]
        merge_profile(profile, make_signals(themes_detected=["anger"]))
        assert profile["themes"]["anger"]["weight"] == original_weight


# ---------------------------------------------------------------------------
# Theme merging
# ---------------------------------------------------------------------------

class TestThemeMerging:
    def test_new_theme_seeded_at_reinforce_step(self):
        result = merge_profile(None, make_signals(themes_detected=["anxiety"]))
        assert "anxiety" in result["themes"]
        assert result["themes"]["anxiety"]["weight"] == pytest.approx(THEME_REINFORCE_STEP)
        assert result["themes"]["anxiety"]["occurrence_count"] == 1

    def test_existing_theme_reinforced(self):
        profile = make_profile(themes={
            "anxiety": {"weight": 0.2, "first_seen_session": 1, "last_seen_session": 3, "occurrence_count": 3},
        }, session_count=3)
        result = merge_profile(profile, make_signals(themes_detected=["anxiety"]))
        assert result["themes"]["anxiety"]["weight"] == pytest.approx(0.2 + THEME_REINFORCE_STEP)
        assert result["themes"]["anxiety"]["occurrence_count"] == 4
        assert result["themes"]["anxiety"]["last_seen_session"] == 4

    def test_theme_weight_capped_at_1(self):
        profile = make_profile(themes={
            "anger": {"weight": 0.98, "first_seen_session": 1, "last_seen_session": 10, "occurrence_count": 10},
        }, session_count=10)
        result = merge_profile(profile, make_signals(themes_detected=["anger"]))
        assert result["themes"]["anger"]["weight"] <= 1.0

    def test_theme_not_decayed_before_threshold(self):
        profile = make_profile(themes={
            "grief": {"weight": 0.5, "first_seen_session": 1, "last_seen_session": 7, "occurrence_count": 5},
        }, session_count=10)
        # Session 11 means grief was last seen 4 sessions ago (< 5 threshold)
        result = merge_profile(profile, make_signals())
        assert result["themes"]["grief"]["weight"] == 0.5  # No decay

    def test_theme_decayed_at_threshold(self):
        profile = make_profile(themes={
            "grief": {"weight": 0.5, "first_seen_session": 1, "last_seen_session": 5, "occurrence_count": 5},
        }, session_count=10)
        # Session 11, last_seen=5 → absent 6 sessions (>= 5 threshold)
        result = merge_profile(profile, make_signals())
        expected = max(THEME_WEIGHT_FLOOR, 0.5 * THEME_DECAY_FACTOR)
        assert result["themes"]["grief"]["weight"] == pytest.approx(expected)

    def test_theme_never_decays_below_floor(self):
        profile = make_profile(themes={
            "loss": {"weight": THEME_WEIGHT_FLOOR, "first_seen_session": 1, "last_seen_session": 1, "occurrence_count": 1},
        }, session_count=100)
        result = merge_profile(profile, make_signals())
        assert result["themes"]["loss"]["weight"] >= THEME_WEIGHT_FLOOR

    def test_no_new_themes_invented(self):
        """Themes not in signals must not appear in the result."""
        profile = make_profile(themes={
            "anger": {"weight": 0.3, "first_seen_session": 1, "last_seen_session": 1, "occurrence_count": 1},
        })
        result = merge_profile(profile, make_signals(themes_detected=["anxiety"]))
        # anger still present, anxiety added, but nothing else
        assert set(result["themes"].keys()) == {"anger", "anxiety"}


# ---------------------------------------------------------------------------
# Growth signal merging
# ---------------------------------------------------------------------------

class TestGrowthSignals:
    def test_first_sighting_seeds_at_zero(self):
        result = merge_profile(None, make_signals(growth_signals_detected=["equanimity"]))
        entry = result["growth_signals"]["equanimity"]
        assert entry["level"] == 0.0
        assert entry["consecutive_sessions"] == 1

    def test_level_unchanged_below_repeat_threshold(self):
        """Single occurrence should not raise level."""
        profile = make_profile(growth_signals={
            "equanimity": {"level": 0.0, "consecutive_sessions": 1, "last_confirmed_session": 1},
        }, session_count=5)
        # Session 6 is NOT consecutive to session 1 → streak resets
        result = merge_profile(profile, make_signals(growth_signals_detected=["equanimity"]))
        assert result["growth_signals"]["equanimity"]["level"] == 0.0

    def test_level_increases_after_repeat_threshold(self):
        """Consecutive confirmations should raise level."""
        profile = make_profile(growth_signals={
            "equanimity": {"level": 0.0, "consecutive_sessions": 1, "last_confirmed_session": 1},
        }, session_count=1)
        # Session 2 is consecutive to session 1 → streak = 2 >= threshold
        result = merge_profile(profile, make_signals(growth_signals_detected=["equanimity"]))
        assert result["growth_signals"]["equanimity"]["consecutive_sessions"] == 2
        assert result["growth_signals"]["equanimity"]["level"] == pytest.approx(GROWTH_REINFORCE_STEP)

    def test_level_capped_at_1(self):
        profile = make_profile(growth_signals={
            "devotion": {"level": 0.99, "consecutive_sessions": 10, "last_confirmed_session": 10},
        }, session_count=10)
        result = merge_profile(profile, make_signals(growth_signals_detected=["devotion"]))
        assert result["growth_signals"]["devotion"]["level"] <= 1.0

    def test_gap_resets_streak_but_preserves_level(self):
        profile = make_profile(growth_signals={
            "compassion": {"level": 0.15, "consecutive_sessions": 5, "last_confirmed_session": 3},
        }, session_count=10)
        # Session 11, last confirmed was 3 → gap → streak resets
        result = merge_profile(profile, make_signals(growth_signals_detected=["compassion"]))
        assert result["growth_signals"]["compassion"]["consecutive_sessions"] == 1
        assert result["growth_signals"]["compassion"]["level"] == 0.15  # Preserved


# ---------------------------------------------------------------------------
# Reactivity merging
# ---------------------------------------------------------------------------

class TestReactivity:
    def test_new_reactivity_pattern(self):
        result = merge_profile(None, make_signals(reactivity_markers={"anger": 0.7}))
        entry = result["reactivity"]["anger"]
        assert entry["intensity"] == pytest.approx(0.7, abs=0.01)
        assert entry["trend"] == "stable"
        assert entry["session_count"] == 1

    def test_reactivity_blended_via_ema(self):
        profile = make_profile(reactivity={
            "anger": {"intensity": 0.8, "trend": "stable", "session_count": 3, "last_seen_session": 3},
        }, session_count=3)
        # New observation much lower → should soften
        result = merge_profile(profile, make_signals(reactivity_markers={"anger": 0.2}))
        blended = 0.8 * 0.85 + 0.2 * 0.15  # 0.71
        assert result["reactivity"]["anger"]["intensity"] == pytest.approx(blended, abs=0.01)
        assert result["reactivity"]["anger"]["trend"] == "softening"

    def test_reactivity_escalating_trend(self):
        profile = make_profile(reactivity={
            "panic": {"intensity": 0.3, "trend": "stable", "session_count": 2, "last_seen_session": 2},
        }, session_count=2)
        result = merge_profile(profile, make_signals(reactivity_markers={"panic": 0.9}))
        assert result["reactivity"]["panic"]["trend"] == "escalating"

    def test_unobserved_reactivity_softens(self):
        profile = make_profile(reactivity={
            "anger": {"intensity": 0.6, "trend": "stable", "session_count": 5, "last_seen_session": 5},
        }, session_count=5)
        result = merge_profile(profile, make_signals())  # anger not observed
        assert result["reactivity"]["anger"]["intensity"] < 0.6
        assert result["reactivity"]["anger"]["trend"] == "softening"

    def test_reactivity_dict_format(self):
        """Reactivity markers can be passed as {intensity: N} dicts."""
        result = merge_profile(None, make_signals(reactivity_markers={"fear": {"intensity": 0.5}}))
        assert result["reactivity"]["fear"]["intensity"] == pytest.approx(0.5, abs=0.01)


# ---------------------------------------------------------------------------
# Awareness merging
# ---------------------------------------------------------------------------

class TestAwareness:
    def test_new_awareness_area(self):
        result = merge_profile(None, make_signals(awareness_indicators=["body_sensations"]))
        assert result["awareness"]["body_sensations"] > 0
        assert result["awareness"]["body_sensations"] < 0.2  # Slow increase

    def test_existing_awareness_grows_slowly(self):
        profile = make_profile(awareness={"breath": 0.5})
        result = merge_profile(profile, make_signals(awareness_indicators=["breath"]))
        expected = 0.5 + 0.10 * (1.0 - 0.5)  # 0.55
        assert result["awareness"]["breath"] == pytest.approx(expected, abs=0.01)

    def test_unobserved_awareness_stays_put(self):
        profile = make_profile(awareness={"breath": 0.5})
        result = merge_profile(profile, make_signals(awareness_indicators=[]))
        assert result["awareness"]["breath"] == 0.5


# ---------------------------------------------------------------------------
# Steadiness merging
# ---------------------------------------------------------------------------

class TestSteadiness:
    def test_steadiness_blended(self):
        profile = make_profile(steadiness=0.5)
        result = merge_profile(profile, make_signals(steadiness_observed=0.8))
        expected = 0.5 * 0.88 + 0.8 * 0.12  # 0.536
        assert result["steadiness"] == pytest.approx(expected, abs=0.01)

    def test_steadiness_unchanged_when_not_observed(self):
        profile = make_profile(steadiness=0.5)
        result = merge_profile(profile, make_signals(steadiness_observed=None))
        assert result["steadiness"] == 0.5

    def test_steadiness_clamped_to_0_1(self):
        profile = make_profile(steadiness=0.99)
        result = merge_profile(profile, make_signals(steadiness_observed=1.5))
        assert result["steadiness"] <= 1.0


# ---------------------------------------------------------------------------
# Integration: multi-session simulation
# ---------------------------------------------------------------------------

class TestMultiSessionIntegration:
    def test_gradual_growth_over_sessions(self):
        """Simulates 10 consecutive sessions with the same growth signal."""
        profile = None
        for i in range(10):
            profile = merge_profile(
                profile,
                make_signals(growth_signals_detected=["self_awareness"]),
            )
        entry = profile["growth_signals"]["self_awareness"]
        # Level should have increased but not unreasonably.
        assert entry["level"] > 0
        assert entry["level"] <= 1.0
        assert entry["consecutive_sessions"] == 10

    def test_theme_decay_over_absent_sessions(self):
        """Theme present several times, then absent for many sessions → decayed."""
        # Build up weight above the floor first so decay is observable.
        profile = None
        for _ in range(5):
            profile = merge_profile(profile, make_signals(themes_detected=["guilt"]))
        initial_weight = profile["themes"]["guilt"]["weight"]
        assert initial_weight > THEME_WEIGHT_FLOOR  # Sanity check

        for _ in range(10):
            profile = merge_profile(profile, make_signals())

        assert profile["themes"]["guilt"]["weight"] < initial_weight
        assert profile["themes"]["guilt"]["weight"] >= THEME_WEIGHT_FLOOR

    def test_no_themes_invented_across_sessions(self):
        """Over many sessions, no themes appear that weren't in signals."""
        profile = None
        themes_ever_sent = set()
        for themes in [["anger"], ["anxiety", "anger"], ["fear"], []]:
            themes_ever_sent.update(themes)
            profile = merge_profile(profile, make_signals(themes_detected=themes))

        assert set(profile["themes"].keys()) == themes_ever_sent
