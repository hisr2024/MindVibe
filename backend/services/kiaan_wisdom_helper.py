"""Wisdom Core retrieval helper for the unified KIAAN router.

Purpose
-------
Compose a system prompt that grounds every Kiaan response (chat + 6
tools) in **strictly Bhagavad-Gita-based wisdom** — both the static
700+ verse corpus and the per-mood effectiveness-learning layer:

  1. Load the modern-secular text persona (``sakha.text.openai.md``,
     persona-version 1.2.0) once at module import.
  2. Retrieve up to 3 verses from the Gita corpus, blending two
     wisdom sources, both 100% Bhagavad Gita:

     * **Static Gita corpus (700+ verses):** via
       :meth:`WisdomCore.search` with ``include_learned=False`` — only
       rows from the ``gita_verses`` table reach the prompt; the
       generic ``learned_wisdom`` table is excluded.
     * **Gita-based dynamic corpus:** via
       :meth:`DynamicWisdomCorpus.get_effectiveness_weighted_verse` —
       selects a Gita verse from ``gita_verses`` weighted by which
       verses have *actually* helped users in this mood before
       (per the ``wisdom_effectiveness`` outcome table). The verse
       returned is still a Bhagavad Gita verse; the "dynamic" piece
       is the *ordering* signal, not the source.

  3. Format the result as a ``RETRIEVED_VERSES`` block the persona
     expects (the persona prompt explicitly states it consumes a
     ``retrieved_verses`` block from the orchestrator).

Callers do
``compose_kiaan_system_prompt(db, query, tool_name, user_id=...)``,
hand the result to ``call_kiaan_ai(..., system_override=<that>)``,
and the LLM receives **persona 1.2.0 + 100% Bhagavad-Gita context**.

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


# ── MOOD DETECTION (inline mirror of KIAANResponseOptimizer) ─────────────
# Keyword-based mood detector. Mirrored from
# ``backend.services.kiaan_core.KIAANResponseOptimizer.detect_mood_from_message``
# so this module stays free of an import cycle (kiaan_core indirectly
# imports ai_provider; this module is imported by routes/kiaan.py which
# also imports ai_provider). Behaviour kept deliberately identical.
_MOOD_KEYWORDS: dict[str, tuple[str, ...]] = {
    "anxiety": (
        "anxious", "worried", "nervous", "panic", "fear", "scared", "terrified",
    ),
    "sadness": (
        "sad", "depressed", "lonely", "grief", "loss", "crying", "tears",
        "hopeless",
    ),
    "stress": (
        "stressed", "overwhelmed", "pressure", "burden", "exhausted", "tired",
        "burnt",
    ),
    "anger": (
        "angry", "furious", "rage", "mad", "irritated", "frustrated", "resent",
    ),
    "gratitude": ("thank", "grateful", "appreciate", "blessed"),
}


def _detect_mood(message: str) -> str | None:
    """Return the first matching mood label, or None for general queries."""
    if not message:
        return None
    lowered = message.lower()
    for mood, keywords in _MOOD_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            return mood
    return None


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

    verses: list[dict[str, Any]] = []
    seen_refs: set[str] = set()

    # ─── Tier 1: Gita-based dynamic effectiveness pick ───────────────
    # Only fires when we have a user_id (the dynamic corpus keys
    # selections + history off user) and the query carries a mood
    # signal. The verse returned is always a Bhagavad Gita verse —
    # ``DynamicWisdomCorpus._resolve_verse`` looks it up in
    # ``gita_verses``. Misses (no effectiveness data, all verses
    # already seen, etc.) return None and we fall through.
    mood = _detect_mood(query) if user_id else None
    if mood and user_id:
        try:
            from backend.services.dynamic_wisdom_corpus import (
                get_dynamic_wisdom_corpus,
            )

            dyn = get_dynamic_wisdom_corpus()
            dyn_verse = await dyn.get_effectiveness_weighted_verse(
                db=db,
                mood=mood,
                user_message=query,
                phase="guide",
                user_id=user_id,
            )
            if dyn_verse:
                normalized = _normalise_dynamic_verse(dyn_verse)
                if normalized.get("verse_ref"):
                    seen_refs.add(normalized["verse_ref"])
                    verses.append(normalized)
        except Exception as exc:
            # Dynamic corpus is best-effort. Static Gita search below
            # is the floor.
            logger.debug(
                "kiaan_wisdom_helper: dynamic-effectiveness pick skipped "
                "(mood=%s tool=%s): %s",
                mood,
                tool_name,
                exc,
            )

    # ─── Tier 2: Static Gita corpus search (always runs) ─────────────
    # ``include_learned=False`` is the strict-Gita guarantee: only rows
    # from ``gita_verses`` reach the prompt; ``learned_wisdom`` (which
    # may carry non-Gita content) is excluded.
    try:
        from backend.services.wisdom_core import get_wisdom_core

        wisdom_core = get_wisdom_core()
        # Pull a few extras so we can fill ``verses_limit`` after
        # de-duplicating against the dynamic pick above.
        results = await wisdom_core.search(
            db=db,
            query=query,
            limit=verses_limit + 2,
            include_learned=False,  # ← STRICTLY Gita
        )
        for r in results:
            chapter = r.chapter or ""
            verse_num = r.verse or ""
            verse_ref = r.verse_ref or (
                f"{chapter}.{verse_num}" if chapter and verse_num else ""
            )
            if not verse_ref or verse_ref in seen_refs:
                continue
            seen_refs.add(verse_ref)
            verses.append({
                "verse_ref": verse_ref,
                "chapter": chapter,
                "verse": verse_num,
                "sanskrit": r.sanskrit or "",
                "english": r.content or "",
                "principle": r.principle or "",
                "theme": r.theme or "",
                "source": "gita_corpus",
            })
            if len(verses) >= verses_limit:
                break
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


def _normalise_dynamic_verse(verse: dict[str, Any]) -> dict[str, Any]:
    """Normalise a DynamicWisdomCorpus verse dict to the shape used here.

    Two upstream paths produce slightly different keys:
      * SakhaWisdomEngine — usually ``english`` / ``content``
      * DB fallback (DynamicWisdomCorpus._resolve_verse) — uses
        ``wisdom`` for the English text

    We accept both and emit the helper's canonical shape.
    """
    verse_ref = verse.get("verse_ref") or ""
    chapter: Any = verse.get("chapter") or ""
    verse_num: Any = verse.get("verse") or ""
    if (not chapter or not verse_num) and verse_ref:
        # Reconstruct chapter/verse from the ref.
        parts = verse_ref.split(".")
        if len(parts) == 2:
            chapter = chapter or parts[0]
            verse_num = verse_num or parts[1]
    return {
        "verse_ref": verse_ref,
        "chapter": chapter,
        "verse": verse_num,
        "sanskrit": verse.get("sanskrit") or "",
        "english": (
            verse.get("english")
            or verse.get("wisdom")
            or verse.get("content")
            or ""
        ),
        "principle": verse.get("principle") or "",
        "theme": verse.get("theme") or "",
        "source": verse.get("source") or "dynamic_corpus",
    }


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
