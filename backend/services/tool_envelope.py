"""Structured tool-input envelope for KIAAN sacred tools.

Implements ``IMPROVEMENT_ROADMAP.md`` P1.5 §10. Each of the six sacred
tool routes used to hand-roll an English narrative around the user's
inputs::

    "I am experiencing overwhelmed with an intensity of 7/10. Here is
     what happened: my client deadline collapsed. Please guide me
     through an emotional reset."

This is brittle (every field becomes English filler the LLM has to
re-parse), untranslated (every locale would need its own f-string),
and bigger than it needs to be (~30 % more tokens than necessary).

This module replaces those narratives with a compact, structured
envelope the LLM can parse deterministically::

    <TOOL>Emotional Reset</TOOL>
    <INPUTS>{"emotion":"overwhelmed","intensity":"7","situation":"..."}</INPUTS>
    <REQUEST>Guide me through an emotional reset grounded in Gita wisdom.</REQUEST>

Why XML-ish tags around JSON? Four reasons:

1. The tags give the LLM a stable, unambiguous parse anchor. The
   persona prompt knows to look for ``<TOOL>`` / ``<INPUTS>`` /
   ``<REQUEST>`` — there is no ambiguity about which substring is a
   user-provided value vs hand-rolled English glue.
2. JSON inside ``<INPUTS>`` keeps localisation trivial — the *keys*
   are stable English identifiers; the *values* can be any language.
   An Indian user typing in Hindi gets the same envelope shape an
   English user does; no per-locale f-strings to maintain.
3. Adding or renaming a tool field is a dict entry, not an f-string
   edit. The route file shrinks ~30 % per tool.
4. Structured envelopes are honest in audit logs — every tool call
   logs the exact field dict the model saw, not a hand-rolled English
   paraphrase that's drifted from the inputs.

Token cost vs the old f-string narrative is roughly neutral for
typical inputs (the envelope eliminates filler like "Here is what
happened:" / "The action I feel called to:" but pays a fixed cost for
the three tags). The win is parse stability, maintainability, and
i18n — not token compression.

Privacy: ``build_tool_message`` strips empty / null inputs before
JSON-encoding so the LLM never sees ``"sankalpa": ""`` clutter when
the user skipped a field. KarmaLytix carries its own PRIVACY directive
verbatim (journal content is encrypted client-side and must never
appear in the envelope).
"""

from __future__ import annotations

import json
from typing import Any

# Per-tool directive — short imperative the LLM reads from ``<REQUEST>``.
# Kept terse on purpose: the persona prompt already documents the
# 4-Part Structure (Ancient Wisdom Principle → Modern Application →
# Practical Steps → Deeper Understanding), so repeating it per turn
# would just pay token cost for redundancy. KarmaLytix is the
# exception — its PRIVACY constraint and output skeleton are
# tool-specific and have no other home.
_TOOL_DIRECTIVES: dict[str, str] = {
    "Emotional Reset": "Guide me through an emotional reset.",
    "Ardha": "Help me reframe this.",
    "Viyoga": "Guide me through Viyoga — the practice of non-attachment.",
    "Karma Reset": "Guide me through a Karma Reset.",
    "Sambandh Dharma (Relationship Compass)": (
        "Guide me through the Sambandh Dharma practice."
    ),
    "KarmaLytix": (
        "Generate a weekly Sacred Mirror. PRIVACY: metadata only — "
        "journal content is encrypted and never shared; do not invent "
        "or quote journal text. Structure: Mirror, Pattern, Gita Echo, "
        "Growth Edge, Blessing."
    ),
}

_DEFAULT_DIRECTIVE = (
    "Guide me through the {tool_name} practice with Gita-grounded wisdom."
)


def build_tool_message(tool_name: str, inputs: dict[str, Any]) -> str:
    """Compose the LLM-facing message for a sacred-tool request.

    Args:
        tool_name: The canonical tool name (one of the six sacred
            tools, or any custom tool — unknown names fall back to a
            generic directive). Same identifier the route layer passes
            to ``call_kiaan_ai_grounded`` for filter routing.
        inputs: Structured user inputs. Keys are stable English
            identifiers (``emotion``, ``situation``, ``limiting_belief``);
            values may be any language. Empty / None values are dropped
            from the envelope so the LLM only sees fields the user
            actually filled.

    Returns:
        A three-tag envelope (``<TOOL>...</TOOL>\\n<INPUTS>...</INPUTS>\\n<REQUEST>...</REQUEST>``)
        ready to pass as the ``message`` argument to
        ``call_kiaan_ai_grounded``.
    """
    cleaned = {
        k: v
        for k, v in (inputs or {}).items()
        if v is not None and v != "" and v != [] and v != {}
    }
    inputs_json = json.dumps(cleaned, ensure_ascii=False, separators=(",", ":"))
    directive = _TOOL_DIRECTIVES.get(
        tool_name,
        _DEFAULT_DIRECTIVE.format(tool_name=tool_name),
    )
    return (
        f"<TOOL>{tool_name}</TOOL>\n"
        f"<INPUTS>{inputs_json}</INPUTS>\n"
        f"<REQUEST>{directive}</REQUEST>"
    )


__all__ = ["build_tool_message"]
