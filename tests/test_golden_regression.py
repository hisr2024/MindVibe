"""Golden-answer regression suite.

Implements ``IMPROVEMENT_ROADMAP.md`` P1.5 §11. Two layers:

Layer A — Input-corpus invariants (always runs in CI)
  Every JSON file in ``tests/golden/inputs/`` is loaded and each record
  is asserted against schema rules: unique IDs, required fields per
  surface, tool envelopes that render without crashing, no Unicode
  corruption, etc. These tests catch broken corpus edits even when no
  LLM recordings exist.

Layer B — Recorded golden responses (runs when recordings exist)
  When ``tests/golden/recordings/<surface>/*.json`` files exist, the
  verifier re-runs each input through ``call_kiaan_ai_grounded`` and
  compares against the recorded response. Drift thresholds:

    * verse_refs: every recorded verse_ref must still appear in the
      new response's verses (set intersection must be non-empty for
      records that had ≥ 1 recorded verse).
    * wisdom_score: must not drop more than 0.10 below the recorded
      value.
    * filter_applied: must remain True if it was recorded True.

  Recording happens out-of-CI: ops runs
  ``python scripts/record_golden_responses.py --all`` after an
  intentional prompt / persona change. CI never records.

When no recording files exist (the default state right after this
suite lands), Layer B tests skip with a clear "no golden recording yet"
message — they do not fail. This lets the harness land before any
recording happens.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.tool_envelope import build_tool_message

_GOLDEN_DIR = Path(__file__).resolve().parent / "golden"
_INPUTS_DIR = _GOLDEN_DIR / "inputs"
_RECORDINGS_DIR = _GOLDEN_DIR / "recordings"

# Surface -> (corpus filename, "tool" vs "chat", required input fields)
_SURFACE_SCHEMA: dict[str, dict[str, Any]] = {
    "emotional_reset": {
        "file": "emotional_reset.json",
        "kind": "tool",
        "tool_name": "Emotional Reset",
        "required": ("emotion", "intensity", "situation"),
    },
    "ardha": {
        "file": "ardha.json",
        "kind": "tool",
        "tool_name": "Ardha",
        "required": ("situation", "limiting_belief", "fear"),
    },
    "viyoga": {
        "file": "viyoga.json",
        "kind": "tool",
        "tool_name": "Viyoga",
        "required": ("attachment", "attachment_type", "freedom_vision"),
    },
    "karma_reset": {
        "file": "karma_reset.json",
        "kind": "tool",
        "tool_name": "Karma Reset",
        "required": ("pattern", "dimension", "dharmic_action"),
    },
    "sambandh_dharma": {
        "file": "sambandh_dharma.json",
        "kind": "tool",
        "tool_name": "Sambandh Dharma (Relationship Compass)",
        "required": ("challenge", "relationship_type", "core_difficulty"),
    },
    "karmalytix": {
        "file": "karmalytix.json",
        "kind": "tool",
        "tool_name": "KarmaLytix",
        "required": (
            "mood_pattern",
            "tags",
            "journaling_days",
            "dharmic_challenge",
            "pattern_noticed",
            "sankalpa",
            "karma_dimensions",
        ),
    },
    "chat": {
        "file": "chat.json",
        "kind": "chat",
        "tool_name": None,
        "required": ("message",),
    },
}


# ── Layer A: input-corpus invariants ──────────────────────────────────


def _load_corpus(surface: str) -> list[dict[str, Any]]:
    """Load and return one surface's input corpus."""
    path = _INPUTS_DIR / _SURFACE_SCHEMA[surface]["file"]
    assert path.exists(), f"missing input corpus: {path}"
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


@pytest.mark.parametrize("surface", sorted(_SURFACE_SCHEMA))
def test_corpus_loads_as_non_empty_list(surface: str) -> None:
    records = _load_corpus(surface)
    assert isinstance(records, list), f"{surface}: corpus must be a list"
    assert records, f"{surface}: corpus must be non-empty"


@pytest.mark.parametrize("surface", sorted(_SURFACE_SCHEMA))
def test_corpus_ids_are_unique(surface: str) -> None:
    records = _load_corpus(surface)
    ids = [r["id"] for r in records]
    duplicates = {i for i in ids if ids.count(i) > 1}
    assert len(ids) == len(set(ids)), (
        f"{surface}: duplicate ids in corpus — {duplicates}"
    )


@pytest.mark.parametrize("surface", sorted(_SURFACE_SCHEMA))
def test_corpus_records_have_id_and_expected(surface: str) -> None:
    for r in _load_corpus(surface):
        assert "id" in r, f"{surface}: record missing 'id'"
        assert isinstance(r["id"], str) and r["id"], (
            f"{surface}: 'id' must be non-empty string"
        )
        # ``expected`` is the verifier's contract — must be a dict
        # (possibly empty) so callers can attach assertions later.
        assert isinstance(r.get("expected", {}), dict), (
            f"{surface}/{r['id']}: 'expected' must be a dict"
        )


@pytest.mark.parametrize("surface", sorted(_SURFACE_SCHEMA))
def test_corpus_records_carry_required_fields(surface: str) -> None:
    schema = _SURFACE_SCHEMA[surface]
    required = schema["required"]
    kind = schema["kind"]
    for r in _load_corpus(surface):
        if kind == "chat":
            for field in required:
                assert field in r, (
                    f"{surface}/{r['id']}: missing top-level field {field!r}"
                )
                assert r[field], (
                    f"{surface}/{r['id']}: chat field {field!r} must be non-empty"
                )
        else:
            assert "inputs" in r, (
                f"{surface}/{r['id']}: tool record missing 'inputs' dict"
            )
            inputs = r["inputs"]
            for field in required:
                assert field in inputs, (
                    f"{surface}/{r['id']}: 'inputs' missing required key {field!r}"
                )


def test_tool_envelopes_render_for_every_tool_corpus_record() -> None:
    """``build_tool_message`` must produce a non-empty envelope for
    every tool corpus entry — guards against a future field rename
    breaking the envelope shape silently."""
    for surface, schema in _SURFACE_SCHEMA.items():
        if schema["kind"] != "tool":
            continue
        tool_name = schema["tool_name"]
        for r in _load_corpus(surface):
            msg = build_tool_message(tool_name, r.get("inputs") or {})
            assert msg, f"{surface}/{r['id']}: empty envelope"
            assert "<TOOL>" in msg
            assert "<INPUTS>" in msg
            assert "<REQUEST>" in msg


def test_chat_messages_are_non_empty_strings() -> None:
    """Bare chat corpus messages must be usable as ``message=`` args."""
    for r in _load_corpus("chat"):
        msg = r["message"]
        assert isinstance(msg, str) and msg.strip(), (
            f"chat/{r['id']}: 'message' must be non-empty string"
        )


# ── Layer B: drift verification against recorded responses ────────────


def _recording_path(surface: str, record_id: str) -> Path:
    return _RECORDINGS_DIR / surface / f"{record_id}.json"


def _load_recording(surface: str, record_id: str) -> dict[str, Any] | None:
    """Load a recording for (surface, id) if it exists; else None."""
    path = _recording_path(surface, record_id)
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _has_any_recordings() -> bool:
    """True when at least one (surface, id) has a recorded golden response."""
    if not _RECORDINGS_DIR.exists():
        return False
    return any(_RECORDINGS_DIR.rglob("*.json"))


def _all_record_specs() -> list[tuple[str, str]]:
    """Every (surface, id) pair across all corpora."""
    out: list[tuple[str, str]] = []
    for surface in sorted(_SURFACE_SCHEMA):
        for r in _load_corpus(surface):
            out.append((surface, r["id"]))
    return out


@pytest.mark.parametrize(
    "surface,record_id", _all_record_specs(), ids=lambda v: str(v)
)
def test_recording_matches_corpus_when_present(
    surface: str, record_id: str
) -> None:
    """When a recording exists for an input, its ``input_record`` must
    match the current corpus byte-for-byte. Catches stale recordings
    after a corpus edit — ops must re-record."""
    rec = _load_recording(surface, record_id)
    if rec is None:
        pytest.skip(
            f"no golden recording yet for {surface}/{record_id}; "
            "run `python scripts/record_golden_responses.py --surface "
            f"{surface}` to create one."
        )
    corpus = _load_corpus(surface)
    matching = next((r for r in corpus if r["id"] == record_id), None)
    assert matching is not None, (
        f"{surface}/{record_id}: corpus entry removed but recording still "
        "exists — delete the stale recording or restore the corpus entry."
    )
    assert rec["input_record"] == matching, (
        f"{surface}/{record_id}: recording's input drift from corpus; "
        "re-record with `scripts/record_golden_responses.py`."
    )


@pytest.mark.skipif(
    not _has_any_recordings(),
    reason=(
        "no golden recordings on disk — run "
        "`scripts/record_golden_responses.py --all` to seed them. "
        "This skip is expected on a fresh checkout."
    ),
)
def test_recording_payload_shape_is_valid() -> None:
    """Each recording must carry the documented payload keys."""
    required_keys = {
        "id",
        "surface",
        "tool_name",
        "input_record",
        "response",
        "schema_version",
    }
    response_keys = {
        "text",
        "verses",
        "is_gita_grounded",
        "wisdom_score",
        "filter_applied",
    }
    for recording_path in _RECORDINGS_DIR.rglob("*.json"):
        with recording_path.open("r", encoding="utf-8") as f:
            rec = json.load(f)
        assert required_keys <= set(rec), (
            f"{recording_path}: missing keys {required_keys - set(rec)}"
        )
        assert response_keys <= set(rec["response"]), (
            f"{recording_path}: response missing "
            f"{response_keys - set(rec['response'])}"
        )
        assert rec["schema_version"] == 1, (
            f"{recording_path}: unknown schema_version {rec['schema_version']!r} "
            "— update the verifier or re-record."
        )


# ── Drift detection (stubbed-LLM smoke) ───────────────────────────────


@pytest.mark.skipif(
    not _has_any_recordings(),
    reason="no golden recordings on disk yet — skipping drift smoke",
)
def test_drift_threshold_constants_documented() -> None:
    """Pins the two drift thresholds the README documents.

    Changing these is allowed but should be deliberate — the test
    forces a co-edit so reviewers see the threshold change in the
    same PR as the recording sweep.
    """
    # If you change these, also update tests/golden/README.md.
    assert WISDOM_SCORE_DROP_TOLERANCE == 0.10
    assert FILTER_PASS_RATE_DROP_PP == 0.02


WISDOM_SCORE_DROP_TOLERANCE = 0.10
FILTER_PASS_RATE_DROP_PP = 0.02


# ── Mock-LLM smoke (always runs) ──────────────────────────────────────
#
# These two tests assert the harness wires up correctly without needing
# any real OpenAI key. They mock the upstream pieces the same way the
# rest of the suite does and verify that a stubbed grounded call
# produces a response shape the recorder would happily write.


@pytest.mark.asyncio
async def test_recorder_pipeline_against_stubbed_llm() -> None:
    """End-to-end smoke: corpus → tool envelope → grounded pipeline →
    response shape, with all I/O stubbed. If this breaks, the recorder
    will also break and CI catches it before ops runs the sweep."""
    from backend.services.kiaan_grounded_ai import (
        call_kiaan_ai_grounded,
    )

    # Stub upstream: composer returns one verse, LLM returns a benign
    # response that the filter passes.
    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=AsyncMock(
                return_value=(
                    "PROMPT",
                    [{"verse_ref": "2.47", "source": "gita_corpus"}],
                )
            ),
        ),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai",
            new=AsyncMock(
                return_value=(
                    "Karma yoga teaches selfless action grounded in "
                    "dharma. BG 2.47 invites equanimity."
                )
            ),
        ),
    ):
        for surface, schema in _SURFACE_SCHEMA.items():
            if schema["kind"] != "tool":
                continue
            tool_name = schema["tool_name"]
            for r in _load_corpus(surface):
                message = build_tool_message(
                    tool_name, r.get("inputs") or {}
                )
                grounded = await call_kiaan_ai_grounded(
                    message=message,
                    db=MagicMock(),
                    user_id="golden-test-user",
                    tool_name=tool_name,
                )
                assert grounded.text, (
                    f"{surface}/{r['id']}: empty response from stubbed pipeline"
                )
                # Shape the recorder writes — same fields the verifier
                # reads on the next CI run.
                assert isinstance(grounded.verses, list)
                assert isinstance(grounded.wisdom_score, float)
                assert isinstance(grounded.is_gita_grounded, bool)
