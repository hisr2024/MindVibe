"""Tests for backend/services/voice/tool_prefill_contracts.py (Part 11c).

Covers:
  • 15 contracts present, EcosystemTool coverage
  • PII scrub: name, email, phone, address, medical, financial
  • apply_contract: INPUT_TO_TOOL / NAVIGATE / DROP outcomes
  • Required fields gate
  • Allowed fields filter (extras dropped)
  • Confidence threshold per-tool
  • Display template substitution
"""

from __future__ import annotations

from backend.services.voice.tool_prefill_contracts import (
    CONTRACTS,
    all_tools,
    apply_contract,
    get_contract,
    has_contract,
    scrub_payload,
    scrub_string,
)


class TestRegistry:
    def test_15_contracts_present(self):
        assert len(CONTRACTS) == 15

    def test_known_tools_have_contracts(self):
        for tool in (
            "EMOTIONAL_RESET", "KARMA_RESET", "KARMIC_TREE", "ARDHA",
            "VIYOGA", "RELATIONSHIP_COMPASS", "SACRED_REFLECTIONS",
            "MOOD_INSIGHTS", "SADHANA", "GITA_LIBRARY", "WISDOM_ROOMS",
            "KARMA_FOOTPRINT", "KIAAN_VIBE", "KIAAN_CHAT", "COMPANION",
        ):
            assert has_contract(tool), f"{tool} missing"

    def test_lookup_is_case_insensitive(self):
        assert get_contract("emotional_reset") is not None
        assert get_contract("Emotional_Reset") is not None
        assert get_contract("EMOTIONAL_RESET") is not None

    def test_unknown_tool_returns_none(self):
        assert get_contract("HACKER_TOOL") is None
        assert has_contract("HACKER_TOOL") is False

    def test_all_tools_includes_15(self):
        assert len(all_tools()) == 15


class TestScrubString:
    def test_scrubs_email(self):
        assert "<email>" in scrub_string("call me at user@example.com please")

    def test_scrubs_phone(self):
        assert "<phone>" in scrub_string("ring me on +1 (650) 555-1234 sometime")

    def test_scrubs_full_name(self):
        assert "<name>" in scrub_string("written by Aman Sharma yesterday")

    def test_scrubs_address(self):
        assert "<address>" in scrub_string("we live at 42 Sunshine Lane downtown")

    def test_scrubs_medical(self):
        assert "<medical>" in scrub_string("my therapist diagnosed me last week")

    def test_scrubs_financial(self):
        assert "<financial>" in scrub_string("balance is bank 5000 dollars")

    def test_idempotent(self):
        once = scrub_string("Aman Sharma at user@x.com")
        twice = scrub_string(once)
        assert once == twice

    def test_empty_string_passes_through(self):
        assert scrub_string("") == ""


class TestScrubPayload:
    def test_scrubs_only_named_keys(self):
        payload = {"prefill_text": "Aman Sharma is here", "verse_ref": "BG 2.47"}
        out = scrub_payload(payload, ("prefill_text",))
        assert "Aman" not in out["prefill_text"]
        assert out["verse_ref"] == "BG 2.47"

    def test_passes_through_non_strings(self):
        payload = {"intensity": 0.8, "mood_label": "anxious"}
        out = scrub_payload(payload, ("intensity",))
        assert out["intensity"] == 0.8

    def test_handles_none_payload(self):
        assert scrub_payload(None, ("any",)) == {}  # type: ignore[arg-type]


class TestApplyContract:
    def test_input_to_tool_happy_path(self):
        action, payload, display = apply_contract(
            "EMOTIONAL_RESET",
            {"mood_label": "anxious", "trigger_summary": "work pressure"},
            confidence=0.9,
        )
        assert action == "INPUT_TO_TOOL"
        assert payload is not None and "anxious" in display

    def test_navigate_when_below_confidence_threshold(self):
        action, payload, _ = apply_contract(
            "EMOTIONAL_RESET",
            {"mood_label": "anxious"},
            confidence=0.5,
        )
        assert action == "NAVIGATE" and payload is None

    def test_navigate_when_required_field_missing(self):
        action, _, _ = apply_contract(
            "VIYOGA",
            {"person_role": "spouse"},  # absence_topic missing
            confidence=0.9,
        )
        assert action == "NAVIGATE"

    def test_drop_when_unknown_tool(self):
        action, payload, display = apply_contract(
            "UNKNOWN_TOOL",
            {"x": 1},
            confidence=0.9,
        )
        assert action == "DROP" and payload is None and display is None

    def test_extra_fields_filtered_out(self):
        action, payload, _ = apply_contract(
            "EMOTIONAL_RESET",
            {
                "mood_label": "sad",
                "trigger_summary": "x",
                "evil_extra_field": "drop_me",
            },
            confidence=0.9,
        )
        assert action == "INPUT_TO_TOOL"
        assert "evil_extra_field" not in (payload or {})

    def test_pii_scrubbed_in_payload(self):
        action, payload, _ = apply_contract(
            "SACRED_REFLECTIONS",
            {
                "prefill_text": "Krishna teaches in BG 2.47. Aman Sharma wrote me.",
                "verse_ref": "BG 2.47",
            },
            confidence=0.85,
        )
        assert action == "INPUT_TO_TOOL"
        assert "Aman" not in payload["prefill_text"]

    def test_per_tool_confidence_threshold_honored(self):
        # MOOD_INSIGHTS has voice_guide_min_confidence=0.6 — passes at 0.65
        action, _, _ = apply_contract("MOOD_INSIGHTS", {}, confidence=0.65)
        assert action == "INPUT_TO_TOOL"
        # Same confidence on a strict tool (default 0.75) → NAVIGATE
        action2, _, _ = apply_contract(
            "RELATIONSHIP_COMPASS",
            {"relationship_role": "spouse"},
            confidence=0.65,
        )
        assert action2 == "NAVIGATE"

    def test_display_template_substitutes_placeholders(self):
        _, _, display = apply_contract(
            "EMOTIONAL_RESET",
            {"mood_label": "anxious"},
            confidence=0.9,
        )
        assert display is not None and "{mood_label}" not in display
        assert "anxious" in display

    def test_input_to_tool_drops_payload_with_invalid_required(self):
        action, payload, _ = apply_contract(
            "ARDHA",
            {"mood_label": "stressed"},  # split_theme missing
            confidence=0.9,
        )
        assert action == "NAVIGATE"
        assert payload is None
