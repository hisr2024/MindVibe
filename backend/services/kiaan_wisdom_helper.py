"""Wisdom Core retrieval helper for the unified KIAAN router.

Purpose
-------
``backend/routes/kiaan.py`` currently builds responses through
:func:`backend.services.ai_provider.call_kiaan_ai`, which uses an
inline persona constant (``KIAAN_SYSTEM_PROMPT``) and only sees the
``gita_verse`` the *caller* hands in. That means:

  * The chat endpoint and all six tool endpoints respond *without*
    consulting the Wisdom Core (static + dynamic), so they ignore
    700+ stored verses, learned wisdom, and effectiveness scoring.
  * The persona used there is the older Krishna-flavoured constant,
    not the modern-secular **persona-version 1.2.0** we ship in
    ``prompts/sakha.text.openai.md``.

This helper closes both gaps with two cheap operations:

  1. Load the modern-secular text persona (``sakha.text.openai.md``)
     once at module import.
  2. Retrieve up to 3 ranked verses from
     :class:`backend.services.wisdom_core.WisdomCore` and format them
     as a ``RETRIEVED_VERSES`` block the persona expects (the persona
     prompt explicitly states it consumes a ``retrieved_verses``
     block from the orchestrator).

Callers compose ``compose_kiaan_system_prompt(db, query, tool_name)``,
hand the result to ``call_kiaan_ai(..., system_override=<that>)``,
and the LLM receives **persona 1.2.0 + Wisdom Core context** — same
quality bar the voice path already meets.

Design notes
------------
- Persona file read once at import. If it is missing (e.g. partial
  checkout, container without ``prompts/``) we log and fall back to
  ``call_kiaan_ai``'s default — never raise, never break the request.
- Wisdom Core search has a hard try/except wrap. A DB hiccup or
  unmigrated schema must not 500 the chat endpoint; we degrade to
  the persona-only prompt and the LLM still answers.
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


# ── PUBLIC API ───────────────────────────────────────────────────────────
async def compose_kiaan_system_prompt(
    db: AsyncSession,
    query: str,
    tool_name: str | None = None,
    *,
    verses_limit: int = 3,
) -> tuple[str | None, list[dict[str, Any]]]:
    """Compose a modern-secular system prompt grounded in Wisdom Core.

    Args:
        db: Async session for the Wisdom Core search.
        query: User message (or tool-derived prompt) used as the search
            query against the static + dynamic corpus.
        tool_name: Optional tool name (e.g. ``"Emotional Reset"``) for
            context — currently informational, kept for future per-tool
            retrieval tuning.
        verses_limit: How many verses to pull. Three is the sweet spot
            the persona's 4-Part Structure expects (lead + supporting +
            optional reference).

    Returns:
        ``(system_prompt, verses)``:
          * ``system_prompt`` — full persona + retrieved-verses block,
            ready to pass as ``system_override`` to ``call_kiaan_ai``.
            ``None`` if the persona file failed to load (caller should
            then drop ``system_override`` to use the legacy default).
          * ``verses`` — list of dicts (``{verse_ref, principle, theme,
            content}``) suitable for echoing to the client.

    Never raises. Logs and degrades on every failure mode.
    """
    if _TEXT_PERSONA is None:
        return None, []

    verses: list[dict[str, Any]] = []
    try:
        # Local import keeps this module light at process start and
        # avoids a circular import with services that already import
        # ai_provider (which routes/kiaan.py also imports).
        from backend.services.wisdom_core import get_wisdom_core

        wisdom_core = get_wisdom_core()
        results = await wisdom_core.search(
            db=db,
            query=query,
            limit=verses_limit,
        )
        for r in results:
            chapter = r.chapter or ""
            verse_num = r.verse or ""
            verse_ref = r.verse_ref or (
                f"{chapter}.{verse_num}" if chapter and verse_num else ""
            )
            verses.append({
                "verse_ref": verse_ref,
                "chapter": chapter,
                "verse": verse_num,
                "sanskrit": r.sanskrit or "",
                "english": r.content or "",
                "principle": r.principle or "",
                "theme": r.theme or "",
            })
    except Exception as exc:
        # Retrieval failures must not break chat. Persona alone still
        # produces a coherent (though un-grounded) response.
        logger.warning(
            "kiaan_wisdom_helper: Wisdom Core search failed (tool=%s): %s",
            tool_name,
            exc,
        )

    block = _format_retrieved_verses_block(verses)
    system_prompt = (
        f"{_TEXT_PERSONA}\n\n{block}" if block else _TEXT_PERSONA
    )
    return system_prompt, verses


def _format_retrieved_verses_block(verses: list[dict[str, Any]]) -> str:
    """Render the persona's expected ``retrieved_verses`` context block."""
    if not verses:
        return ""

    lines: list[str] = ["## RETRIEVED VERSES (from Wisdom Core)"]
    for i, v in enumerate(verses, start=1):
        ref = v.get("verse_ref") or "?"
        sanskrit = v.get("sanskrit") or ""
        english = v.get("english") or ""
        principle = v.get("principle") or ""
        theme = v.get("theme") or ""
        lines.append(f"\n### {i}. BG {ref}")
        if sanskrit:
            lines.append(f"Sanskrit: {sanskrit}")
        if english:
            lines.append(f"English: {english}")
        if principle:
            lines.append(f"Principle: {principle}")
        if theme:
            lines.append(f"Theme: {theme}")
    lines.append(
        "\nUse these verses verbatim where the 4-Part Structure calls for "
        "an Ancient Wisdom Principle. Do not invent verses outside this "
        "list."
    )
    return "\n".join(lines)
