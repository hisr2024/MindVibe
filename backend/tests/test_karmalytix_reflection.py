"""Tests for the KarmaLytix Sacred Reflection generator.

These exercise the critical properties of the Sacred Mirror pipeline
without touching a live Anthropic endpoint:

  1. Fallback is total — it returns a valid six-section dict even when
     every piece of metadata is missing.
  2. JSON extraction survives markdown fencing Claude sometimes emits.
  3. Normalisation fills missing fields from the template rather than
     returning a half-rendered payload to the mobile client.
  4. ``generate_structured_reflection`` gracefully falls back when the
     HTTP call raises, when the response is malformed JSON, or when the
     environment lacks ``ANTHROPIC_API_KEY``.
"""

from __future__ import annotations

import json
import os
import sys
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from backend.services.karmalytix_reflection import (  # noqa: E402
    DEFAULT_VERSE,
    REQUIRED_TOP_FIELDS,
    STATIC_WISDOM_CORE,
    _extract_json_block,
    _fallback_reflection,
    _normalise_reflection,
    generate_structured_reflection,
    pick_verse_for_theme,
)


# ---------------------------------------------------------------------------
# pick_verse_for_theme
# ---------------------------------------------------------------------------


def test_pick_verse_for_theme_known_key_returns_curated_verse() -> None:
    verse = pick_verse_for_theme("anger")
    assert verse == STATIC_WISDOM_CORE["anger"]
    assert verse["chapter"] == 2 and verse["verse"] == 62


def test_pick_verse_for_theme_unknown_returns_default() -> None:
    assert pick_verse_for_theme("feeling-vibey") == DEFAULT_VERSE


def test_pick_verse_for_theme_none_returns_default() -> None:
    assert pick_verse_for_theme(None) == DEFAULT_VERSE


# ---------------------------------------------------------------------------
# _fallback_reflection
# ---------------------------------------------------------------------------


def test_fallback_reflection_covers_every_required_field() -> None:
    fallback = _fallback_reflection(
        dimensions={"emotional_balance": 60, "consistency": 30, "self_awareness": 50,
                    "spiritual_growth": 45, "wisdom_integration": 20},
        metadata={"entry_count": 4, "journaling_days": 3, "dominant_mood": "anxious",
                  "top_tags": [("clarity", 3), ("fear", 2)]},
        static_verse=STATIC_WISDOM_CORE["anxious"],
        weekly_assessment={"sankalpa_for_next_week": "I will pause before reacting"},
    )
    assert set(fallback.keys()) >= REQUIRED_TOP_FIELDS
    assert fallback["mirror"].startswith("This week, you")
    # The weakest dimension should be surfaced in growth_edge.
    assert "Wisdom Integration" in fallback["growth_edge"]
    # Sankalpa should be echoed back when present.
    assert "I will pause before reacting" in fallback["blessing"]
    # gita_echo structure is always present even with minimal input.
    echo = fallback["gita_echo"]
    assert echo["chapter"] == STATIC_WISDOM_CORE["anxious"]["chapter"]
    assert echo["verse"] == STATIC_WISDOM_CORE["anxious"]["verse"]
    assert echo["sanskrit"]  # non-empty


def test_fallback_reflection_handles_empty_metadata() -> None:
    fallback = _fallback_reflection(
        dimensions={},
        metadata={},
        static_verse=DEFAULT_VERSE,
        weekly_assessment=None,
    )
    assert set(fallback.keys()) >= REQUIRED_TOP_FIELDS
    # Without a sankalpa, the blessing falls back to the generic blessing.
    assert "steady witness" in fallback["blessing"].lower()


# ---------------------------------------------------------------------------
# _extract_json_block
# ---------------------------------------------------------------------------


def test_extract_json_block_strips_markdown_fences() -> None:
    raw = '```json\n{"mirror": "hi"}\n```'
    assert _extract_json_block(raw) == '{"mirror": "hi"}'


def test_extract_json_block_returns_substring_when_not_fenced() -> None:
    raw = 'Some preamble {"mirror": "hi"} trailing noise'
    assert _extract_json_block(raw) == '{"mirror": "hi"}'


def test_extract_json_block_passes_clean_json_through() -> None:
    raw = '{"a": 1, "b": 2}'
    assert _extract_json_block(raw) == raw


# ---------------------------------------------------------------------------
# _normalise_reflection
# ---------------------------------------------------------------------------


def test_normalise_fills_missing_fields_from_fallback() -> None:
    fallback = _fallback_reflection(
        dimensions={"consistency": 40, "emotional_balance": 70, "spiritual_growth": 55,
                    "self_awareness": 60, "wisdom_integration": 30},
        metadata={"entry_count": 2, "journaling_days": 2, "dominant_mood": "peaceful"},
        static_verse=STATIC_WISDOM_CORE["peaceful"],
        weekly_assessment=None,
    )
    partial = {
        "mirror": "Claude-written mirror",
        # pattern deliberately missing
        "gita_echo": {"chapter": 2, "verse": 70, "sanskrit": "...", "connection": "stillness"},
        "growth_edge": "",  # empty string should trigger fallback fill
        "blessing": "Claude-written blessing",
        # dynamic_wisdom deliberately missing
    }
    merged = _normalise_reflection(partial, STATIC_WISDOM_CORE["peaceful"], fallback)
    assert merged["mirror"] == "Claude-written mirror"
    assert merged["pattern"] == fallback["pattern"]  # filled from fallback
    assert merged["growth_edge"] == fallback["growth_edge"]
    assert merged["dynamic_wisdom"] == fallback["dynamic_wisdom"]
    assert merged["blessing"] == "Claude-written blessing"
    assert merged["gita_echo"]["chapter"] == 2
    assert merged["gita_echo"]["connection"] == "stillness"


def test_normalise_rejects_non_dict_input() -> None:
    fallback = _fallback_reflection(
        dimensions={}, metadata={}, static_verse=DEFAULT_VERSE, weekly_assessment=None,
    )
    assert _normalise_reflection("not-a-dict", DEFAULT_VERSE, fallback) is fallback


# ---------------------------------------------------------------------------
# generate_structured_reflection (end-to-end, with mocked httpx)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_falls_back_when_api_key_missing(monkeypatch) -> None:
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    result = await generate_structured_reflection(
        period_start="2026-04-13",
        period_end="2026-04-19",
        dimensions={"emotional_balance": 60, "consistency": 40, "self_awareness": 50,
                    "spiritual_growth": 45, "wisdom_integration": 20},
        overall_score=43,
        metadata={"entry_count": 5, "journaling_days": 4, "dominant_mood": "anxious"},
        weekly_assessment=None,
    )
    assert set(result.keys()) >= REQUIRED_TOP_FIELDS
    assert result["gita_echo"]["sanskrit"]  # deterministic template path populated


@pytest.mark.asyncio
async def test_generate_returns_parsed_response_on_happy_path(monkeypatch) -> None:
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    claude_payload = {
        "mirror": "This week, you paused more than you rushed.",
        "pattern": "Morning reflections coincided with peaceful moods.",
        "gita_echo": {
            "chapter": 2, "verse": 70, "sanskrit": "आपूर्यमाणम्...",
            "connection": "Your calm mirrors the steady ocean.",
        },
        "growth_edge": "Consistency has room to deepen. Consider one entry at pratah each day.",
        "blessing": "You are walking steady.",
        "dynamic_wisdom": "A short seventy-word paragraph about presence.",
    }
    with patch(
        "backend.services.karmalytix_reflection._call_claude",
        new=AsyncMock(return_value=json.dumps(claude_payload)),
    ):
        result = await generate_structured_reflection(
            period_start="2026-04-13",
            period_end="2026-04-19",
            dimensions={"emotional_balance": 72, "consistency": 40, "self_awareness": 55,
                        "spiritual_growth": 60, "wisdom_integration": 40},
            overall_score=53,
            metadata={"entry_count": 6, "journaling_days": 5, "dominant_mood": "peaceful"},
            weekly_assessment=None,
        )
    assert result["mirror"] == claude_payload["mirror"]
    assert result["gita_echo"]["connection"] == claude_payload["gita_echo"]["connection"]


@pytest.mark.asyncio
async def test_generate_falls_back_when_claude_returns_bad_json(monkeypatch) -> None:
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    with patch(
        "backend.services.karmalytix_reflection._call_claude",
        new=AsyncMock(return_value="not valid json {"),
    ):
        result = await generate_structured_reflection(
            period_start="2026-04-13",
            period_end="2026-04-19",
            dimensions={"emotional_balance": 60, "consistency": 40, "self_awareness": 50,
                        "spiritual_growth": 45, "wisdom_integration": 20},
            overall_score=43,
            metadata={"entry_count": 5, "journaling_days": 4, "dominant_mood": "anxious"},
            weekly_assessment=None,
        )
    # Falling back should still return every required field.
    assert set(result.keys()) >= REQUIRED_TOP_FIELDS
    assert "This week, you" in result["mirror"]


@pytest.mark.asyncio
async def test_generate_falls_back_when_claude_raises(monkeypatch) -> None:
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    with patch(
        "backend.services.karmalytix_reflection._call_claude",
        new=AsyncMock(side_effect=RuntimeError("Claude is down")),
    ):
        result = await generate_structured_reflection(
            period_start="2026-04-13",
            period_end="2026-04-19",
            dimensions={"emotional_balance": 30, "consistency": 20, "self_awareness": 25,
                        "spiritual_growth": 35, "wisdom_integration": 10},
            overall_score=24,
            metadata={"entry_count": 3, "journaling_days": 3, "dominant_mood": "sad"},
            weekly_assessment={"sankalpa_for_next_week": "I will rest without guilt"},
        )
    assert set(result.keys()) >= REQUIRED_TOP_FIELDS
    assert "I will rest without guilt" in result["blessing"]
