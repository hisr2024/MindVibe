"""Tests for the structured tool envelope.

Covers ``IMPROVEMENT_ROADMAP.md`` P1.5 §10. Pins the wire shape that
the six sacred-tool routes hand to ``call_kiaan_ai_grounded`` and the
behaviours the persona prompt depends on:

* Three tags in fixed order: ``<TOOL>`` → ``<INPUTS>`` → ``<REQUEST>``.
* ``<INPUTS>`` contains valid JSON; empty / None / [] values are
  dropped so the LLM only sees fields the user actually filled.
* Per-tool directives are stable for the six known tools; unknown
  tools fall back to a generic directive.
* KarmaLytix's PRIVACY constraint is present in its directive (the
  one tool where the constraint has no other home in the prompt).
* Unicode (Hindi, Sanskrit) survives round-trip in the JSON values.
"""

from __future__ import annotations

import json
import re

from backend.services.tool_envelope import build_tool_message

# ── envelope shape ────────────────────────────────────────────────────


_ENVELOPE_RE = re.compile(
    r"^<TOOL>(?P<tool>[^<]+)</TOOL>\n"
    r"<INPUTS>(?P<inputs>.+)</INPUTS>\n"
    r"<REQUEST>(?P<request>.+)</REQUEST>$",
    re.DOTALL,
)


def test_envelope_has_three_tags_in_order() -> None:
    msg = build_tool_message(
        "Ardha", {"situation": "x", "limiting_belief": "y", "fear": "z"}
    )
    match = _ENVELOPE_RE.match(msg)
    assert match is not None, f"envelope does not match expected shape: {msg!r}"
    assert match["tool"] == "Ardha"


def test_envelope_inputs_is_valid_json() -> None:
    msg = build_tool_message(
        "Karma Reset",
        {"pattern": "procrastinate", "dimension": "work", "dharmic_action": "start"},
    )
    inputs = _ENVELOPE_RE.match(msg)["inputs"]  # type: ignore[index]
    parsed = json.loads(inputs)
    assert parsed == {
        "pattern": "procrastinate",
        "dimension": "work",
        "dharmic_action": "start",
    }


def test_envelope_drops_empty_and_none_values() -> None:
    """Skipped fields must not pollute the JSON the LLM sees."""
    msg = build_tool_message(
        "Viyoga",
        {
            "attachment": "old role",
            "attachment_type": "",  # skipped — should drop
            "freedom_vision": None,  # skipped — should drop
            "extra_metadata": [],  # skipped — should drop
        },
    )
    inputs = _ENVELOPE_RE.match(msg)["inputs"]  # type: ignore[index]
    parsed = json.loads(inputs)
    assert parsed == {"attachment": "old role"}


def test_envelope_handles_empty_input_dict() -> None:
    msg = build_tool_message("Emotional Reset", {})
    inputs = _ENVELOPE_RE.match(msg)["inputs"]  # type: ignore[index]
    assert json.loads(inputs) == {}


def test_envelope_handles_none_input_dict() -> None:
    msg = build_tool_message("Emotional Reset", None)  # type: ignore[arg-type]
    inputs = _ENVELOPE_RE.match(msg)["inputs"]  # type: ignore[index]
    assert json.loads(inputs) == {}


# ── i18n: Unicode in values must survive round-trip ───────────────────


def test_envelope_preserves_hindi_values() -> None:
    msg = build_tool_message(
        "Emotional Reset",
        {
            "emotion": "अशांत",  # ashanta - unsettled
            "intensity": "7",
            "situation": "मेरा प्रोजेक्ट रुक गया",  # my project stalled
        },
    )
    inputs = _ENVELOPE_RE.match(msg)["inputs"]  # type: ignore[index]
    parsed = json.loads(inputs)
    assert parsed["emotion"] == "अशांत"
    assert parsed["situation"] == "मेरा प्रोजेक्ट रुक गया"


def test_envelope_preserves_sanskrit_values() -> None:
    msg = build_tool_message(
        "Viyoga",
        {
            "attachment": "अहंकार",  # ahamkara
            "freedom_vision": "मोक्ष",  # moksha
        },
    )
    parsed = json.loads(_ENVELOPE_RE.match(msg)["inputs"])  # type: ignore[index]
    assert parsed["attachment"] == "अहंकार"
    assert parsed["freedom_vision"] == "मोक्ष"


# ── per-tool directives ───────────────────────────────────────────────


def test_known_tools_get_specific_directives() -> None:
    """All six sacred tools have non-empty directives that match their
    practice name."""
    samples = [
        ("Emotional Reset", "emotional reset"),
        ("Ardha", "reframe"),
        ("Viyoga", "Viyoga"),
        ("Karma Reset", "Karma Reset"),
        ("Sambandh Dharma (Relationship Compass)", "Sambandh Dharma"),
        ("KarmaLytix", "Sacred Mirror"),
    ]
    for tool, must_contain in samples:
        msg = build_tool_message(tool, {})
        request = _ENVELOPE_RE.match(msg)["request"]  # type: ignore[index]
        assert must_contain.lower() in request.lower(), (
            f"{tool!r} directive missing {must_contain!r}: {request!r}"
        )


def test_unknown_tool_gets_generic_directive() -> None:
    msg = build_tool_message("Custom Future Tool", {"foo": "bar"})
    request = _ENVELOPE_RE.match(msg)["request"]  # type: ignore[index]
    assert "Custom Future Tool" in request
    assert "Gita" in request


# ── KarmaLytix privacy constraint ─────────────────────────────────────


def test_karmalytix_directive_carries_privacy_clause() -> None:
    """KarmaLytix is metadata-only — the directive MUST tell the LLM
    not to invent or quote journal content."""
    msg = build_tool_message("KarmaLytix", {"mood_pattern": "rising"})
    request = _ENVELOPE_RE.match(msg)["request"]  # type: ignore[index]
    lowered = request.lower()
    assert "privacy" in lowered
    assert "metadata" in lowered
    assert "journal" in lowered
    # Output skeleton (Mirror / Pattern / Gita Echo / Growth Edge /
    # Blessing) is also part of the contract — keep it pinned.
    assert "mirror" in lowered
    assert "pattern" in lowered
    assert "gita echo" in lowered
    assert "growth edge" in lowered
    assert "blessing" in lowered


# ── JSON encoding hygiene ─────────────────────────────────────────────


def test_envelope_does_not_escape_unicode_to_ascii() -> None:
    """``ensure_ascii=False`` keeps the prompt readable and avoids
    paying 6 tokens per Devanagari character (``\\u0915`` etc.)."""
    msg = build_tool_message("Emotional Reset", {"emotion": "क्रोध"})
    inputs = _ENVELOPE_RE.match(msg)["inputs"]  # type: ignore[index]
    # Devanagari survives raw, no \u-escapes.
    assert "क्रोध" in inputs
    assert "\\u0915" not in inputs


def test_envelope_uses_compact_json_separators() -> None:
    """``separators=(",", ":")`` strips redundant whitespace in JSON —
    small win on token cost for tools with many fields."""
    msg = build_tool_message(
        "KarmaLytix",
        {"mood_pattern": "rising", "tags": "karma,dharma", "journaling_days": "5"},
    )
    inputs = _ENVELOPE_RE.match(msg)["inputs"]  # type: ignore[index]
    # No spaces after colons or commas — compact JSON.
    assert ": " not in inputs
    assert ", " not in inputs
