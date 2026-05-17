"""Wisdom Core retrieval helper for the unified KIAAN router.

Purpose
-------
Compose a system prompt that grounds every Kiaan response (chat + 6
tools) in **strictly Bhagavad-Gita-based wisdom** — the complete 700+
verse corpus, the per-verse principle, and the modern-world
implementation layer (``gita_practical_wisdom``):

  1. Load the modern-secular text persona (``sakha.text.openai.md``,
     persona-version 1.2.0) once at module import.
  2. Retrieve up to 3 verses from the Gita corpus, blending two
     wisdom sources, both 100% Bhagavad Gita:

     * **Static Gita corpus (700+ verses):** via
       :meth:`WisdomCore.search` with ``include_learned=False`` — only
       rows from the ``gita_verses`` table reach the prompt; the
       generic ``learned_wisdom`` table is excluded. The full
       18-chapter / 701-verse corpus is the searchable space.
     * **Gita-based dynamic corpus:** via
       :meth:`DynamicWisdomCorpus.get_effectiveness_weighted_verse` —
       selects a Gita verse from ``gita_verses`` weighted by which
       verses have *actually* helped users in this mood before
       (per the ``wisdom_effectiveness`` outcome table). The verse
       returned is still a Bhagavad Gita verse; the "dynamic" piece
       is the *ordering* signal, not the source.

  3. **Enrich each retrieved verse with its modern-world
     implementation** from the ``gita_practical_wisdom`` table —
     ``principle_in_action``, ``micro_practice``, ``action_steps``,
     ``modern_scenario``, ``reflection_prompt``, ``counter_pattern``.
     This is the implementation-in-the-modern-world layer the
     persona's 4-Part Structure (Ancient Wisdom Principle → Modern
     Application → Practical Steps → Deeper Understanding) consumes.
  4. Format the result as a ``RETRIEVED_VERSES`` block the persona
     expects (the persona prompt explicitly states it consumes a
     ``retrieved_verses`` block from the orchestrator).

Callers do
``compose_kiaan_system_prompt(db, query, tool_name, user_id=...)``,
hand the result to ``call_kiaan_ai(..., system_override=<that>)``,
and the LLM receives **persona 1.2.0 + 100% Bhagavad-Gita context +
modern-world implementation grounding**.

Design notes
------------
- Persona file read once at import. If it is missing (e.g. partial
  checkout, container without ``prompts/``) we log and fall back to
  ``call_kiaan_ai``'s default — never raise, never break the request.
- Both retrieval calls are wrapped in try/except. A DB hiccup,
  unmigrated schema, or empty effectiveness corpus must not 500 the
  chat endpoint; we degrade through these tiers in order:
    Tier 1: Dynamic (effectiveness-weighted Gita verse) + Static (Gita)
    Tier 2: Static only (Gita)
    Tier 3: Persona only (LLM answers ungrounded — last-resort)
- The dynamic-Gita verse is *prepended* to the static results when
  available, so it leads the persona's 4-Part Structure.
- Verse list returned alongside the system prompt so the route layer
  can echo verse refs to the client (the Android app already parses
  ``verseRefs`` from the streaming done frame).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# ── PERSONA LOADING ──────────────────────────────────────────────────────
_PERSONA_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "prompts"
    / "sakha.text.openai.md"
)


def _load_text_persona() -> str | None:
    """Read the modern-secular text persona once. Returns None if missing."""
    try:
        return _PERSONA_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.warning(
            "kiaan_wisdom_helper: persona file missing at %s — "
            "falling back to ai_provider default persona",
            _PERSONA_PATH,
        )
        return None
    except Exception as exc:
        logger.error(
            "kiaan_wisdom_helper: failed to read persona %s: %s",
            _PERSONA_PATH,
            exc,
        )
        return None


_TEXT_PERSONA: str | None = _load_text_persona()


# Mood detection moved to ``backend.services.wisdom.detect_mood`` after
# the IMPROVEMENT_ROADMAP.md P0 §4 consolidation. Imported lazily inside
# the helper module that uses it; no public surface change.


# ── PUBLIC API ───────────────────────────────────────────────────────────
async def compose_kiaan_system_prompt(
    db: AsyncSession,
    query: str,
    tool_name: str | None = None,
    *,
    user_id: str | None = None,
    verses_limit: int = 3,
) -> tuple[str | None, list[dict[str, Any]]]:
    """Compose a modern-secular system prompt grounded in **Bhagavad-Gita-only** Wisdom Core.

    Two retrieval layers, both 100% Bhagavad Gita:

    1. **Gita-based dynamic effectiveness selection** — when the query
       hints at a recognisable mood and a ``user_id`` is present, calls
       :meth:`DynamicWisdomCorpus.get_effectiveness_weighted_verse`.
       This picks a Gita verse (from ``gita_verses``) weighted by which
       verses have actually helped users in this mood before — the
       output is still a Bhagavad Gita verse; only the *ordering*
       signal is dynamic.
    2. **Static Gita search** — :meth:`WisdomCore.search` with
       ``include_learned=False`` so the generic ``learned_wisdom``
       table is skipped entirely. Result: only rows from the 700+
       verse ``gita_verses`` corpus.

    The dynamic-effectiveness verse (if any) is *prepended* to the
    static results so it leads the persona's 4-Part Structure.

    Args:
        db: Async session.
        query: User message (or tool-derived prompt) used as the search
            query.
        tool_name: Optional tool name (e.g. ``"Emotional Reset"``) for
            telemetry / future per-tool retrieval tuning.
        user_id: Optional user identifier. When present we can ask the
            dynamic corpus for an effectiveness-weighted Gita verse
            tailored to this user's session history.
        verses_limit: How many verses to pull total. Three is the
            sweet spot the persona's 4-Part Structure expects (lead +
            supporting + optional reference).

    Returns:
        ``(system_prompt, verses)``:
          * ``system_prompt`` — persona + retrieved-verses block, ready
            to pass as ``system_override`` to ``call_kiaan_ai``. ``None``
            if the persona file failed to load (caller should then drop
            ``system_override`` to use the legacy default).
          * ``verses`` — list of Gita verse dicts (``{verse_ref,
            chapter, verse, sanskrit, english, principle, theme,
            source}``). The first entry's ``source`` is
            ``"dynamic_corpus"`` when a dynamic Gita verse was used,
            otherwise ``"gita_corpus"``.

    Never raises. Logs and degrades through three tiers:
        Tier 1: Dynamic (Gita, effectiveness-weighted) + Static (Gita)
        Tier 2: Static (Gita) only
        Tier 3: Persona only (no retrieval)
    """
    if _TEXT_PERSONA is None:
        return None, []

    # Delegates the entire data path to the unified retriever (see
    # IMPROVEMENT_ROADMAP.md P0 §4). All three tiers — dynamic
    # effectiveness pick, static Gita search, gita_practical_wisdom
    # enrichment — now live in one place: backend.services.wisdom.
    # This function's job is reduced to: drive retrieval, project the
    # WisdomVerse objects into the dict shape this module's
    # _format_retrieved_verses_block expects, and stitch the persona +
    # verses block.
    #
    # ``tool_name`` is accepted for backward compatibility (callers pass
    # it via kwarg) and for telemetry. The unified retriever does not
    # yet differentiate by tool; logging it here keeps the signal until
    # per-tool retrieval tuning lands.
    logger.debug(
        "compose_kiaan_system_prompt: tool=%s user=%s limit=%d",
        tool_name,
        user_id,
        verses_limit,
    )
    from backend.services.wisdom import retrieve_wisdom

    bundle = await retrieve_wisdom(
        db=db,
        query=query,
        user_id=user_id,
        limit=verses_limit,
        include_dynamic=True,
        include_practical=True,
        include_learned=False,  # STRICTLY Gita corpus
        phase="guide",
        allow_mock_catalogue=False,  # chat falls back to persona-only
    )
    verses = [_wisdom_verse_to_chat_dict(v) for v in bundle.verses]

    block = _format_retrieved_verses_block(verses)
    system_prompt = (
        f"{_TEXT_PERSONA}\n\n{block}" if block else _TEXT_PERSONA
    )
    return system_prompt, verses


def _wisdom_verse_to_chat_dict(v: Any) -> dict[str, Any]:
    """Project a :class:`backend.services.wisdom.WisdomVerse` into the
    dict shape ``_format_retrieved_verses_block`` consumes (verse_ref,
    chapter, verse, sanskrit, english, principle, theme, source,
    practical_wisdom)."""
    return {
        "verse_ref": v.verse_ref,
        "chapter": v.chapter,
        "verse": v.verse,
        "sanskrit": v.sanskrit,
        "english": v.english,
        "principle": v.principle,
        "theme": v.theme,
        "source": v.source,
        "practical_wisdom": v.practical_wisdom,
    }


# Retrieval helpers (dynamic-effectiveness pick, static Gita search,
# gita_practical_wisdom enrichment, verse normalisation) moved to
# ``backend.services.wisdom.retrieve`` as part of the IMPROVEMENT_ROADMAP.md
# P0 §4 consolidation. The only formatting concern that still lives here
# is the persona-specific ``RETRIEVED VERSES`` block below.


def _format_retrieved_verses_block(verses: list[dict[str, Any]]) -> str:
    """Render the persona's expected ``retrieved_verses`` context block.

    Layout per verse:

        ### N. BG <chapter.verse>
        Sanskrit:     <devanagari>
        English:      <translation>
        Principle:    <single-line principle>
        Theme:        <theme tag>
        Source:       gita_corpus | dynamic_corpus

        Modern Implementation (life_domain: <domain>):
          Principle in Action: ...
          Modern Scenario:     ...
          Practical Steps:
            1. ...
            2. ...
            3. ...
          Micro-practice:      ...
          Reflection Prompt:   ...
          Counter-pattern:     ...

    The persona prompt's 4-Part Structure consumes:
      * "Ancient Wisdom Principle"  → Sanskrit + English (verbatim)
      * "Modern Application"        → Modern Scenario + Principle in Action
      * "Practical Steps"           → Action Steps + Micro-practice
      * "Deeper Understanding"      → Counter-pattern + Reflection Prompt
    """
    if not verses:
        return ""

    lines: list[str] = [
        "## RETRIEVED VERSES (from Wisdom Core — 100% Bhagavad Gita)"
    ]
    for i, v in enumerate(verses, start=1):
        ref = v.get("verse_ref") or "?"
        sanskrit = v.get("sanskrit") or ""
        english = v.get("english") or ""
        principle = v.get("principle") or ""
        theme = v.get("theme") or ""
        source = v.get("source") or "gita_corpus"
        lines.append(f"\n### {i}. BG {ref}")
        if sanskrit:
            lines.append(f"Sanskrit: {sanskrit}")
        if english:
            lines.append(f"English: {english}")
        if principle:
            lines.append(f"Principle: {principle}")
        if theme:
            lines.append(f"Theme: {theme}")
        lines.append(f"Source: {source}")

        # ── Modern-world implementation block (gita_practical_wisdom) ──
        practical = v.get("practical_wisdom") or []
        for entry in practical:
            domain = entry.get("life_domain") or "general"
            lines.append(
                f"\nModern Implementation (life_domain: {domain}):"
            )
            principle_in_action = entry.get("principle_in_action") or ""
            modern_scenario = entry.get("modern_scenario") or ""
            action_steps = entry.get("action_steps") or []
            micro_practice = entry.get("micro_practice") or ""
            reflection_prompt = entry.get("reflection_prompt") or ""
            counter_pattern = entry.get("counter_pattern") or ""

            if principle_in_action:
                lines.append(f"  Principle in Action: {principle_in_action}")
            if modern_scenario:
                lines.append(f"  Modern Scenario: {modern_scenario}")
            if action_steps:
                lines.append("  Practical Steps:")
                for n, step in enumerate(action_steps, start=1):
                    lines.append(f"    {n}. {step}")
            if micro_practice:
                lines.append(f"  Micro-practice: {micro_practice}")
            if reflection_prompt:
                lines.append(f"  Reflection Prompt: {reflection_prompt}")
            if counter_pattern:
                lines.append(f"  Counter-pattern: {counter_pattern}")

    lines.append(
        "\n---\n"
        "INSTRUCTIONS FOR USING THIS CONTEXT:\n"
        "  • Use the Sanskrit + English text verbatim where the 4-Part "
        "Structure calls for an Ancient Wisdom Principle.\n"
        "  • Use the Modern Scenario + Principle in Action to ground the "
        "Modern Application section in real 2026 life.\n"
        "  • Use the Practical Steps as the basis for the Practical Steps "
        "section — adapt them to the seeker's exact situation.\n"
        "  • Counter-pattern + Reflection Prompt feed the Deeper "
        "Understanding section.\n"
        "  • DO NOT invent verses, principles, or implementation details "
        "outside this retrieved set. Every claim must trace back to the "
        "Bhagavad Gita corpus shown above."
    )
    return "\n".join(lines)
