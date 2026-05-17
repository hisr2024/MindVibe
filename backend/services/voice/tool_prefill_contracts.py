"""ToolVoicePrefillContract — per-EcosystemTool definition of:

  • allowed_fields:    which keys may travel from VOICE_GUIDE to the
                       destination tool. Anything else is dropped.
  • required_fields:   keys that MUST be present for the contract to
                       count as INPUT_TO_TOOL — missing → downgrade to
                       NAVIGATE only.
  • pii_scrub_fields:  keys that always pass through a name/employer/
                       location/medical/financial scrubber before
                       reaching the destination tool. Per spec, "Wrong
                       prefill is worse than no prefill" — so we err
                       toward stripping.
  • display_template:  the destination tool's mandatory visible-
                       confirmation copy (the spec example:
                       "Sakha shared that you're feeling anxious about
                       work.   [ Edit ▾ ]   [ Begin reflection → ]").
  • route:             the in-app path mobile useToolInvocation
                       navigates to (mirrors apps/sakha-mobile/hooks/
                       voice/useToolInvocation TOOL_ROUTES).
  • voice_guide_min_confidence: per-tool floor for INPUT_TO_TOOL
                       activation. Below it, downgrade to NAVIGATE.

Per spec, EcosystemTools without a contract default to NAVIGATE only.
This file is the registry. The mobile mirror lives at
apps/sakha-mobile/lib/tool-prefill-contracts.ts and is cross-checked
by scripts/validate-tool-contracts.mjs at CI time.

Confidentiality: this is Kiaanverse IP. The 15 tool definitions and
their contract shapes are NOT for distribution.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# ─── PII scrubbing (shared) ───────────────────────────────────────────────
# Conservative — strip anything that looks like identifying info before
# it reaches the destination tool. The orchestrator already scrubs at
# the wisdom-engine level; this is belt-and-braces.

_NAME_RE = re.compile(r"\b(?:[A-Z][a-z]+\s+){1,3}[A-Z][a-z]+\b")
_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_PHONE_RE = re.compile(r"\b\+?\d[\d\s().-]{6,}\d\b")
_ADDRESS_RE = re.compile(
    r"\b\d+\s+[A-Z][a-z]+\s+(?:Street|Avenue|Road|Lane|Boulevard|Blvd|Ave|St|Rd)\b",
    re.IGNORECASE,
)
_MEDICAL_RE = re.compile(
    r"\b(?:diagnos(?:ed|is)|prescription|prescribed|psychiatrist|therapist|"
    r"medication|antidepressant|antianxiety|adhd|bipolar|ptsd|ssri|snri)\b",
    re.IGNORECASE,
)
_FINANCIAL_RE = re.compile(
    r"\b(?:bank|account|card|credit|debit|loan|mortgage|salary|"
    r"₹|\$|€|£)\s*\d+",
    re.IGNORECASE,
)


def scrub_string(s: str) -> str:
    """Replace identifying tokens with role-tags. Idempotent."""
    if not s:
        return s
    s = _EMAIL_RE.sub("<email>", s)
    s = _PHONE_RE.sub("<phone>", s)
    s = _ADDRESS_RE.sub("<address>", s)
    s = _MEDICAL_RE.sub("<medical>", s)
    s = _FINANCIAL_RE.sub("<financial>", s)
    s = _NAME_RE.sub("<name>", s)
    return s.strip()


def scrub_payload(payload: dict, scrub_keys: tuple[str, ...]) -> dict:
    """Run scrub_string on the named keys of a payload. Other keys pass
    through unchanged. Unknown / missing keys are silently skipped."""
    if not payload:
        return {}
    out: dict = {}
    for k, v in payload.items():
        if k in scrub_keys and isinstance(v, str):
            out[k] = scrub_string(v)
        else:
            out[k] = v
    return out


# ─── Contract dataclass ───────────────────────────────────────────────────


@dataclass(frozen=True)
class ToolVoicePrefillContract:
    tool: str
    route: str
    allowed_fields: tuple[str, ...]
    required_fields: tuple[str, ...]
    pii_scrub_fields: tuple[str, ...]
    display_template: str
    voice_guide_min_confidence: float = 0.75
    notes: str = ""


# ─── 15 EcosystemTool contracts ───────────────────────────────────────────
# Order mirrors EcosystemTool enum in kiaan_unified_voice_engine.py.

CONTRACTS: dict[str, ToolVoicePrefillContract] = {
    "KIAAN_CHAT": ToolVoicePrefillContract(
        tool="KIAAN_CHAT",
        route="/kiaan/chat",
        allowed_fields=("opening_topic", "mood_label", "lang_hint"),
        required_fields=(),
        pii_scrub_fields=("opening_topic",),
        display_template="Sakha brought you here to keep the conversation going.",
    ),
    "COMPANION": ToolVoicePrefillContract(
        tool="COMPANION",
        route="/companion",
        allowed_fields=("topic_summary", "mood_label", "lang_hint"),
        required_fields=(),
        pii_scrub_fields=("topic_summary",),
        display_template="Sakha shared what we talked about with your Companion.",
    ),
    "VIYOGA": ToolVoicePrefillContract(
        tool="VIYOGA",
        route="/tools/viyoga",
        allowed_fields=("absence_topic", "person_role", "duration_label"),
        required_fields=("absence_topic",),
        pii_scrub_fields=("absence_topic",),
        display_template="Sakha shared that you are sitting with an absence — "
                         "{absence_topic}. Begin when you're ready.",
        notes="person_role is a coarse role like 'parent' or 'spouse' — never a name.",
    ),
    "ARDHA": ToolVoicePrefillContract(
        tool="ARDHA",
        route="/tools/ardha",
        allowed_fields=("split_theme", "mood_label"),
        required_fields=("split_theme",),
        pii_scrub_fields=("split_theme",),
        display_template="Sakha brought your split to Ardha — {split_theme}.",
    ),
    "RELATIONSHIP_COMPASS": ToolVoicePrefillContract(
        tool="RELATIONSHIP_COMPASS",
        route="/tools/relationship-compass",
        allowed_fields=("relationship_role", "tension_summary", "mood_label"),
        required_fields=("relationship_role",),
        pii_scrub_fields=("tension_summary",),
        display_template="Sakha shared the {relationship_role} tension you spoke of.",
        notes="relationship_role: 'spouse' | 'parent' | 'child' | 'sibling' | 'friend' | 'colleague'",
    ),
    "EMOTIONAL_RESET": ToolVoicePrefillContract(
        tool="EMOTIONAL_RESET",
        route="/tools/emotional-reset",
        allowed_fields=("mood_label", "trigger_summary", "intensity"),
        required_fields=("mood_label",),
        pii_scrub_fields=("trigger_summary",),
        display_template="Sakha shared that you're feeling {mood_label}. "
                         "Begin reflection →",
        voice_guide_min_confidence=0.7,
        notes="Lower confidence threshold because Emotional Reset is the most-"
              "tested + lowest-risk path; the user can edit.",
    ),
    "KARMA_RESET": ToolVoicePrefillContract(
        tool="KARMA_RESET",
        route="/tools/karma-reset",
        allowed_fields=("pattern_summary", "duration_label", "mood_label"),
        required_fields=("pattern_summary",),
        pii_scrub_fields=("pattern_summary",),
        display_template="Sakha brought the pattern you described — {pattern_summary} — "
                         "into Karma Reset. Edit ▾ if it's not right.",
    ),
    "KARMA_FOOTPRINT": ToolVoicePrefillContract(
        tool="KARMA_FOOTPRINT",
        route="/tools/karma-footprint",
        allowed_fields=("focus_area", "mood_label"),
        required_fields=(),
        pii_scrub_fields=("focus_area",),
        display_template="Sakha brought you to Karma Footprint — focusing on {focus_area}.",
    ),
    "KARMIC_TREE": ToolVoicePrefillContract(
        tool="KARMIC_TREE",
        route="/tools/karmic-tree",
        allowed_fields=("focus_area",),
        required_fields=(),
        pii_scrub_fields=(),
        display_template="Your Karmic Tree, opened from your conversation with Sakha.",
        voice_guide_min_confidence=0.6,
        notes="Karmic Tree is largely view-only — low risk for prefill drift.",
    ),
    "SACRED_REFLECTIONS": ToolVoicePrefillContract(
        tool="SACRED_REFLECTIONS",
        route="/tools/sacred-reflections",
        allowed_fields=("prefill_text", "verse_ref", "mood_label", "source"),
        required_fields=("prefill_text",),
        pii_scrub_fields=("prefill_text",),
        display_template="Sakha drafted a journal entry from your conversation. "
                         "Edit ▾ before saving.",
        notes="Largest payload — the full Sakha response. Always scrub.",
    ),
    "KIAAN_VIBE": ToolVoicePrefillContract(
        tool="KIAAN_VIBE",
        route="/tools/kiaan-vibe",
        allowed_fields=("mood_label", "intensity"),
        required_fields=("mood_label",),
        pii_scrub_fields=(),
        display_template="Vibe set from Sakha — {mood_label}.",
        voice_guide_min_confidence=0.65,
    ),
    "WISDOM_ROOMS": ToolVoicePrefillContract(
        tool="WISDOM_ROOMS",
        route="/tools/wisdom-rooms",
        allowed_fields=("room_topic", "mood_label"),
        required_fields=(),
        pii_scrub_fields=("room_topic",),
        display_template="Sakha brought you to Wisdom Rooms — looking for "
                         "rooms about {room_topic}.",
    ),
    "SADHANA": ToolVoicePrefillContract(
        tool="SADHANA",
        route="/tools/sadhana",
        allowed_fields=("practice_intent", "mood_label"),
        required_fields=(),
        pii_scrub_fields=("practice_intent",),
        display_template="Sakha brought you to your Sadhana — intent: {practice_intent}.",
    ),
    "GITA_LIBRARY": ToolVoicePrefillContract(
        tool="GITA_LIBRARY",
        route="/tools/gita-library",
        allowed_fields=("verse_ref", "chapter", "search_term"),
        required_fields=(),
        pii_scrub_fields=(),
        display_template="Opening {verse_ref} in the Gita Library.",
        voice_guide_min_confidence=0.6,
        notes="Verse refs are canonical — no PII risk.",
    ),
    "MOOD_INSIGHTS": ToolVoicePrefillContract(
        tool="MOOD_INSIGHTS",
        route="/tools/mood-insights",
        allowed_fields=("time_window", "mood_focus"),
        required_fields=(),
        pii_scrub_fields=(),
        display_template="Mood Insights for {time_window}, opened from Sakha.",
        voice_guide_min_confidence=0.6,
        notes="View-only — low confidence threshold.",
    ),
}


# ─── Public API ───────────────────────────────────────────────────────────


def get_contract(tool: str) -> ToolVoicePrefillContract | None:
    return CONTRACTS.get(tool.upper())


def has_contract(tool: str) -> bool:
    return tool.upper() in CONTRACTS


def all_tools() -> tuple[str, ...]:
    return tuple(CONTRACTS.keys())


def apply_contract(
    tool: str,
    payload: dict | None,
    confidence: float,
) -> tuple[str, dict | None, str | None]:
    """Apply the contract to a tool invocation.

    Returns (action, sanitized_payload, display_text).

    action ∈ {"INPUT_TO_TOOL", "NAVIGATE", "DROP"}:
      • INPUT_TO_TOOL: confidence ≥ tool's threshold AND all required
        fields present AND payload survives scrubbing → tool is launched
        with the sanitized payload + display copy
      • NAVIGATE: confidence below threshold OR a required field missing
        → tool is opened with no prefill
      • DROP: the tool has no contract registered → caller falls back to
        NAVIGATE-only with a default route
    """
    contract = get_contract(tool)
    if contract is None:
        return "DROP", None, None

    if confidence < contract.voice_guide_min_confidence:
        return "NAVIGATE", None, None

    payload = payload or {}
    # Filter to allowed fields only
    filtered = {k: v for k, v in payload.items() if k in contract.allowed_fields}
    # Check required fields
    if any(k not in filtered for k in contract.required_fields):
        return "NAVIGATE", None, None
    # Scrub PII
    sanitized = scrub_payload(filtered, contract.pii_scrub_fields)
    # Render display template (best-effort substitution)
    display: str = contract.display_template
    for k, v in sanitized.items():
        display = display.replace("{" + k + "}", str(v))
    return "INPUT_TO_TOOL", sanitized, display


__all__ = [
    "ToolVoicePrefillContract",
    "CONTRACTS",
    "get_contract",
    "has_contract",
    "all_tools",
    "apply_contract",
    "scrub_string",
    "scrub_payload",
]
