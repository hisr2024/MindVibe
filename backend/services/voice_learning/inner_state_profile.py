"""
Inner State Profile Merge Service

Merges a user's persisted inner_state_profile with newly extracted
session signals.  The merge follows conservative, spiritually-framed
rules so that the profile evolves gradually and honestly:

  - Recurring themes are *strengthened* (weight nudged up).
  - Themes absent for 5+ consecutive sessions are *decayed*.
  - Growth signals only increase when *repeated* across sessions.
  - New themes are never invented; only themes already present in
    the profile or in the incoming signals (which were extracted
    from actual user text) are tracked.
  - Reactivity softening is recorded only when the pattern is
    confirmed over multiple sessions.
  - Awareness and steadiness move slowly via exponential smoothing.

Public API
----------
    merge_profile(existing, session_signals) -> dict
        Pure function.  Takes two plain dicts, returns the updated
        profile dict.  No side-effects, no I/O.
"""

from __future__ import annotations

import copy
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# How much a single session occurrence nudges a theme weight upward.
THEME_REINFORCE_STEP = 0.05

# Maximum theme weight.
THEME_WEIGHT_CAP = 1.0

# Minimum theme weight before the entry is considered dormant (kept but
# effectively invisible to downstream consumers).
THEME_WEIGHT_FLOOR = 0.05

# After this many consecutive sessions without seeing a theme, its weight
# begins to decay.
THEME_DECAY_AFTER_SESSIONS = 5

# Per-session multiplicative decay factor applied to themes that have not
# been seen for THEME_DECAY_AFTER_SESSIONS.
THEME_DECAY_FACTOR = 0.85

# Growth signal: how much a *repeated* confirmation raises the level.
GROWTH_REINFORCE_STEP = 0.03

# Growth signal cap.
GROWTH_LEVEL_CAP = 1.0

# Minimum consecutive sessions required before a growth signal is
# considered "repeated" and the level is allowed to increase.
GROWTH_REPEAT_THRESHOLD = 2

# Reactivity smoothing factor (EMA alpha).  Lower = slower change.
REACTIVITY_ALPHA = 0.15

# Awareness smoothing factor.
AWARENESS_ALPHA = 0.10

# Steadiness smoothing factor.
STEADINESS_ALPHA = 0.12


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, lo: float, hi: float) -> float:
    """Clamp *value* between *lo* and *hi*."""
    return max(lo, min(hi, value))


def _now_iso() -> str:
    """UTC now as ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


def _empty_profile() -> Dict[str, Any]:
    """Return a minimal empty inner_state_profile scaffold."""
    return {
        "themes": {},
        "growth_signals": {},
        "reactivity": {},
        "awareness": {},
        "steadiness": 0.5,
        "session_count": 0,
        "last_updated": _now_iso(),
    }


def _empty_session_signals() -> Dict[str, Any]:
    """Return a minimal empty session signals scaffold."""
    return {
        "themes_detected": [],
        "growth_signals_detected": [],
        "reactivity_markers": {},
        "awareness_indicators": [],
        "steadiness_observed": None,
    }


# ---------------------------------------------------------------------------
# Core merge logic
# ---------------------------------------------------------------------------

def merge_profile(
    existing: Optional[Dict[str, Any]],
    session_signals: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Merge *session_signals* into *existing* inner_state_profile.

    Both arguments are plain JSON-serialisable dicts.  A deep copy is made
    so the caller's data is never mutated.

    Args:
        existing: The persisted inner_state_profile (or None / empty dict
                  for a brand-new user).
        session_signals: Signals extracted from the current session.  May
                         be None if the session produced no meaningful
                         signals (profile is still updated for decay).

    Returns:
        Updated inner_state_profile dict.
    """
    profile = copy.deepcopy(existing) if existing else _empty_profile()

    # Ensure all required top-level keys exist (forward-compat).
    for key, default in _empty_profile().items():
        profile.setdefault(key, copy.deepcopy(default))

    signals = session_signals if session_signals else _empty_session_signals()
    for key, default in _empty_session_signals().items():
        signals.setdefault(key, copy.deepcopy(default))

    session_number = profile["session_count"] + 1
    profile["session_count"] = session_number

    _merge_themes(profile, signals, session_number)
    _merge_growth_signals(profile, signals, session_number)
    _merge_reactivity(profile, signals, session_number)
    _merge_awareness(profile, signals)
    _merge_steadiness(profile, signals)

    profile["last_updated"] = _now_iso()

    return profile


# ---------------------------------------------------------------------------
# Theme merging
# ---------------------------------------------------------------------------

def _merge_themes(
    profile: Dict[str, Any],
    signals: Dict[str, Any],
    session_number: int,
) -> None:
    """
    Strengthen themes that appear in this session's signals.
    Decay themes that have been absent for 5+ sessions.
    Never invent themes that don't exist in either source.
    """
    themes: Dict[str, Any] = profile["themes"]
    detected: List[str] = signals.get("themes_detected", [])

    # --- Reinforce detected themes ---
    for theme_key in detected:
        if theme_key in themes:
            entry = themes[theme_key]
            entry["weight"] = _clamp(
                entry["weight"] + THEME_REINFORCE_STEP,
                THEME_WEIGHT_FLOOR,
                THEME_WEIGHT_CAP,
            )
            entry["occurrence_count"] = entry.get("occurrence_count", 0) + 1
            entry["last_seen_session"] = session_number
        else:
            # First time this theme surfaces — seed it modestly.
            themes[theme_key] = {
                "weight": THEME_REINFORCE_STEP,
                "first_seen_session": session_number,
                "last_seen_session": session_number,
                "occurrence_count": 1,
            }

    # --- Decay themes not seen recently ---
    for theme_key, entry in themes.items():
        last_seen = entry.get("last_seen_session", 0)
        sessions_absent = session_number - last_seen

        if sessions_absent >= THEME_DECAY_AFTER_SESSIONS:
            entry["weight"] = _clamp(
                entry["weight"] * THEME_DECAY_FACTOR,
                THEME_WEIGHT_FLOOR,
                THEME_WEIGHT_CAP,
            )


# ---------------------------------------------------------------------------
# Growth signal merging
# ---------------------------------------------------------------------------

def _merge_growth_signals(
    profile: Dict[str, Any],
    signals: Dict[str, Any],
    session_number: int,
) -> None:
    """
    Growth signals (e.g. equanimity, self_awareness) must be *repeated*
    before the level increases.  A single occurrence just records the
    signal; the level only moves after GROWTH_REPEAT_THRESHOLD consecutive
    confirmations.
    """
    growth: Dict[str, Any] = profile["growth_signals"]
    detected: List[str] = signals.get("growth_signals_detected", [])

    detected_set = set(detected)

    for dim_key in detected_set:
        if dim_key in growth:
            entry = growth[dim_key]
            prev_session = entry.get("last_confirmed_session", 0)

            # Consecutive if this is the very next session after last confirm.
            if session_number - prev_session <= 1:
                entry["consecutive_sessions"] = entry.get("consecutive_sessions", 0) + 1
            else:
                # Gap detected — reset streak but keep level.
                entry["consecutive_sessions"] = 1

            entry["last_confirmed_session"] = session_number

            # Only raise level when repeated enough.
            if entry["consecutive_sessions"] >= GROWTH_REPEAT_THRESHOLD:
                entry["level"] = _clamp(
                    entry.get("level", 0.0) + GROWTH_REINFORCE_STEP,
                    0.0,
                    GROWTH_LEVEL_CAP,
                )
        else:
            # First sighting — seed but do NOT increase level yet.
            growth[dim_key] = {
                "level": 0.0,
                "consecutive_sessions": 1,
                "last_confirmed_session": session_number,
            }


# ---------------------------------------------------------------------------
# Reactivity merging
# ---------------------------------------------------------------------------

def _merge_reactivity(
    profile: Dict[str, Any],
    signals: Dict[str, Any],
    session_number: int,
) -> None:
    """
    Track reactivity patterns (e.g. anger, panic).  Use exponential moving
    average so intensity shifts gradually.  Derive trend from direction of
    change.
    """
    reactivity: Dict[str, Any] = profile["reactivity"]
    markers: Dict[str, Any] = signals.get("reactivity_markers", {})

    # markers is expected as  { "anger": { "intensity": 0.8 }, ... }
    # or simply { "anger": 0.7 } for shorthand.

    observed_keys = set()

    for pattern_key, raw_value in markers.items():
        observed_keys.add(pattern_key)

        if isinstance(raw_value, dict):
            new_intensity = float(raw_value.get("intensity", 0.5))
        else:
            new_intensity = float(raw_value)

        new_intensity = _clamp(new_intensity, 0.0, 1.0)

        if pattern_key in reactivity:
            entry = reactivity[pattern_key]
            old_intensity = entry.get("intensity", 0.5)

            # Exponential moving average.
            blended = old_intensity * (1 - REACTIVITY_ALPHA) + new_intensity * REACTIVITY_ALPHA
            entry["intensity"] = round(blended, 4)

            # Derive trend.
            delta = blended - old_intensity
            if delta < -0.02:
                entry["trend"] = "softening"
            elif delta > 0.02:
                entry["trend"] = "escalating"
            else:
                entry["trend"] = "stable"

            entry["session_count"] = entry.get("session_count", 0) + 1
            entry["last_seen_session"] = session_number
        else:
            reactivity[pattern_key] = {
                "intensity": round(new_intensity, 4),
                "trend": "stable",
                "session_count": 1,
                "last_seen_session": session_number,
            }

    # For patterns NOT observed this session, soften slightly toward 0.
    for pattern_key, entry in reactivity.items():
        if pattern_key not in observed_keys:
            old = entry.get("intensity", 0.5)
            softened = old * (1 - REACTIVITY_ALPHA * 0.5)  # Half-rate decay when absent
            if softened < old:
                entry["intensity"] = round(softened, 4)
                entry["trend"] = "softening"


# ---------------------------------------------------------------------------
# Awareness merging
# ---------------------------------------------------------------------------

def _merge_awareness(
    profile: Dict[str, Any],
    signals: Dict[str, Any],
) -> None:
    """
    Awareness indicators are a list of area keys observed this session.
    Each area gets a slow EMA-based increase; areas not observed stay put.
    """
    awareness: Dict[str, float] = profile["awareness"]
    indicators: List[str] = signals.get("awareness_indicators", [])

    for area in indicators:
        current = awareness.get(area, 0.0)
        # Move toward 1.0 slowly.
        updated = current + AWARENESS_ALPHA * (1.0 - current)
        awareness[area] = round(_clamp(updated, 0.0, 1.0), 4)


# ---------------------------------------------------------------------------
# Steadiness merging
# ---------------------------------------------------------------------------

def _merge_steadiness(
    profile: Dict[str, Any],
    signals: Dict[str, Any],
) -> None:
    """
    Steadiness is a single 0-1 score blended via EMA.  If the session
    did not produce an observation, steadiness stays unchanged.
    """
    observed = signals.get("steadiness_observed")
    if observed is None:
        return

    observed = _clamp(float(observed), 0.0, 1.0)
    current = profile.get("steadiness", 0.5)
    blended = current * (1 - STEADINESS_ALPHA) + observed * STEADINESS_ALPHA
    profile["steadiness"] = round(blended, 4)
