"""Unified Wisdom Core retrieval — single data path for chat + voice.

Implements ``IMPROVEMENT_ROADMAP.md`` P0 §4. Two parallel implementations
of this used to live in:

  * ``backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt``
    (the chat / sacred-tool path) — Dynamic effectiveness pick +
    Static gita_verses search + ``gita_practical_wisdom`` enrichment;
    returns a persona-prompt block plus ``list[dict]``.
  * ``backend.services.voice.retrieval_and_fallback.retrieve_verses_for_turn``
    (the voice WSS path) — Static-only ``WisdomCore.search`` plus a
    mock catalogue fallback; returns ``list[RetrievedVerse]``.

Two queries against ``gita_verses``, two effectiveness picks, two return
shapes — and one production bug that the duplication hid (the voice
path was passing ``mood=`` / ``user_id=`` to ``WisdomCore.search`` which
does not accept either, silently falling back to the 10-entry mock
catalogue on every call). This module is now the only place that
actually reads from Wisdom Core; both call sites become thin adapters.

Three-tier retrieval pipeline
-----------------------------
1. **Dynamic effectiveness pick** — When ``user_id`` and ``mood`` are
   present and ``include_dynamic=True``, asks
   ``DynamicWisdomCorpus.get_effectiveness_weighted_verse`` for the
   Gita verse that has historically helped this user (or this mood
   cohort) the most. The returned verse is *always* a Bhagavad-Gita
   verse — only the *ordering* signal is dynamic.

2. **Static Gita search** — Always runs. Calls ``WisdomCore.search``
   with ``include_learned`` defaulting to False so only the 700+
   ``gita_verses`` corpus reaches the prompt. Results are
   deduplicated against the dynamic pick from step 1.

3. **Practical wisdom enrichment** — When ``include_practical=True``,
   for each retrieved verse fetches its rows from
   ``gita_practical_wisdom`` (principle_in_action, micro_practice,
   action_steps, modern_scenario, reflection_prompt, counter_pattern).
   This is what the persona's 4-Part Structure (Ancient Wisdom
   Principle → Modern Application → Practical Steps → Deeper
   Understanding) consumes. Voice turns set this False — they don't
   render the practical-wisdom block in the streamed TTS shape.

Mock catalogue
--------------
When ``allow_mock_catalogue=True`` (voice opts in) AND the live path
returns nothing (DB unavailable, all tiers failed, or
``KIAAN_VOICE_MOCK_PROVIDERS=1``), a small mood-keyed catalogue from
``backend.services.voice.retrieval_and_fallback._MOCK_VERSE_CATALOGUE``
is served so the orchestrator always has something to seed the prompt
with. Chat callers do *not* opt in — they get an empty bundle, which
``kiaan_wisdom_helper.compose_kiaan_system_prompt`` handles by
returning persona-only (last-resort).

Behaviour contract — what never raises
--------------------------------------
Every tier is wrapped in try/except. A DB hiccup, an unmigrated schema,
or an empty effectiveness corpus must not 500 the request. The function
returns an empty :class:`WisdomBundle` rather than propagating. Callers
log the empty bundle as "no Gita context" and degrade through their
own fallback (persona-only for chat, mock catalogue for voice).
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# ── Mood detection ─────────────────────────────────────────────────────
# Keyword-based mood detector — mirrors
# ``backend.services.kiaan_wisdom_helper._MOOD_KEYWORDS`` so chat
# behaviour stays exactly identical after consolidation.
_MOOD_KEYWORDS: dict[str, tuple[str, ...]] = {
    "anxiety": (
        "anxious",
        "worried",
        "nervous",
        "panic",
        "fear",
        "scared",
        "terrified",
    ),
    "sadness": (
        "sad",
        "depressed",
        "lonely",
        "grief",
        "loss",
        "crying",
        "tears",
        "hopeless",
    ),
    "stress": (
        "stressed",
        "overwhelmed",
        "pressure",
        "burden",
        "exhausted",
        "tired",
        "burnt",
    ),
    "anger": (
        "angry",
        "furious",
        "rage",
        "mad",
        "irritated",
        "frustrated",
        "resent",
    ),
    "gratitude": ("thank", "grateful", "appreciate", "blessed"),
}


def detect_mood(message: str) -> str | None:
    """Return the first matching mood label, or None for general queries."""
    if not message:
        return None
    lowered = message.lower()
    for mood, keywords in _MOOD_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            return mood
    return None


# ── Canonical shapes ───────────────────────────────────────────────────


@dataclass(frozen=True)
class WisdomVerse:
    """Canonical verse shape returned by the unified retriever.

    Both the chat and voice adapters project this into their own shape:
    chat needs ``practical_wisdom``; voice needs
    ``mood_application_match`` + integer chapter/verse numbers. We carry
    every field so both projections are lossless.
    """

    verse_ref: str  # "2.47" (no "BG " prefix — caller adds it for display)
    chapter: int
    verse: int
    sanskrit: str = ""
    english: str = ""
    hindi: str | None = None
    principle: str = ""
    theme: str = ""
    # "gita_corpus" (default), "dynamic_corpus" (effectiveness-weighted
    # pick), or "mock_catalogue" (last-resort).
    source: str = "gita_corpus"
    mood_application_match: float = 0.0
    # Filled by tier 3. Each entry mirrors a row in
    # ``gita_practical_wisdom``. Empty list when enrichment was skipped.
    practical_wisdom: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True)
class WisdomBundle:
    """Result of one retrieval call.

    ``verses`` is empty when every tier returned nothing AND the caller
    did not opt into the mock catalogue. ``mood`` is the value the
    retriever actually used (caller-supplied or auto-detected). ``sources``
    lists which tiers contributed (``dynamic_corpus``, ``gita_corpus``,
    ``mock_catalogue``) — useful for telemetry and tests.
    """

    verses: list[WisdomVerse] = field(default_factory=list)
    mood: str | None = None
    sources: tuple[str, ...] = ()
    is_mock: bool = False

    def __bool__(self) -> bool:
        return bool(self.verses)


# ── The unified retriever ──────────────────────────────────────────────


async def retrieve_wisdom(
    *,
    db: AsyncSession | None,
    query: str,
    user_id: str | None = None,
    mood: str | None = None,
    limit: int = 3,
    include_dynamic: bool = True,
    include_practical: bool = True,
    include_learned: bool = False,
    phase: str = "guide",
    allow_mock_catalogue: bool = False,
) -> WisdomBundle:
    """Single source of truth for Wisdom Core verse retrieval.

    Args:
        db: Async session. When None, returns an empty bundle (or the
            mock catalogue if ``allow_mock_catalogue=True``).
        query: User message — searched for keyword matches against
            ``gita_verses`` and used as the dynamic-pick context.
        user_id: When present, enables the dynamic effectiveness pick
            (tier 1). Required to personalise the ordering signal.
        mood: When provided, drives the dynamic pick and (in future)
            mood-aware ``WisdomCore`` filtering. When None, auto-detected
            from ``query`` via :func:`detect_mood`.
        limit: Total number of verses to return. The dynamic pick (when
            successful) consumes one slot; the rest come from static
            search.
        include_dynamic: Tier 1 toggle. Default True. Set False for
            callers that want pure static retrieval (back-office
            scripts, regression tests).
        include_practical: Tier 3 toggle. Chat callers leave True so
            the persona renders the modern-application block; voice
            callers set False (voice TTS does not render that block).
        include_learned: Forwarded to ``WisdomCore.search``. Default
            False — the strict-Gita guarantee documented in
            ``kiaan_wisdom_helper``: only rows from ``gita_verses``
            reach the prompt; ``learned_wisdom`` (which may carry
            non-Gita content) is excluded.
        phase: Passed to the dynamic pick. ``"guide"`` is the default;
            voice turns may pass ``"empower"`` or ``"understand"``.
        allow_mock_catalogue: When True AND the live tiers returned no
            verses, the voice mock catalogue is served instead. Voice
            callers set this True (the orchestrator always needs at
            least one verse to seed the prompt). Chat callers leave
            False — an empty bundle means "no Gita context", and the
            persona handles that with last-resort tier-3 framing.

    Returns:
        :class:`WisdomBundle`. Never None, never raises.
    """
    if not query or not query.strip():
        return WisdomBundle()

    effective_mood = mood or detect_mood(query)
    verses: list[WisdomVerse] = []
    seen_refs: set[str] = set()
    sources_used: list[str] = []

    # ── Tier 1: Dynamic effectiveness pick ──────────────────────────
    # Only fires when we have a user_id (the dynamic corpus keys
    # selections + history off user) AND a mood signal AND a live DB.
    if (
        include_dynamic
        and db is not None
        and user_id
        and effective_mood
    ):
        try:
            from backend.services.dynamic_wisdom_corpus import (
                get_dynamic_wisdom_corpus,
            )

            dyn = get_dynamic_wisdom_corpus()
            dyn_verse = await dyn.get_effectiveness_weighted_verse(
                db=db,
                mood=effective_mood,
                user_message=query,
                phase=phase,
                user_id=user_id,
            )
            if dyn_verse:
                wv = _normalise_dynamic_verse(dyn_verse)
                if wv.verse_ref and wv.verse_ref not in seen_refs:
                    seen_refs.add(wv.verse_ref)
                    verses.append(wv)
                    sources_used.append("dynamic_corpus")
        except Exception as exc:
            logger.debug(
                "wisdom.retrieve: dynamic effectiveness pick skipped "
                "(mood=%s user=%s): %s",
                effective_mood,
                user_id,
                exc,
            )

    # ── Tier 2: Static Gita search (always runs when db present) ─────
    if db is not None:
        try:
            from backend.services.wisdom_core import get_wisdom_core

            core = get_wisdom_core()
            # Pull a few extras so we can fill ``limit`` after
            # deduplicating against tier 1.
            results = await core.search(
                db=db,
                query=query,
                limit=limit + 2,
                include_learned=include_learned,
            )
            for r in results:
                ref = _result_ref(r)
                if not ref or ref in seen_refs:
                    continue
                seen_refs.add(ref)
                verses.append(_normalise_wisdom_result(r))
                sources_used.append("gita_corpus")
                if len(verses) >= limit:
                    break
        except Exception as exc:
            logger.warning(
                "wisdom.retrieve: Wisdom Core search failed: %s", exc
            )

    # ── Tier 3: Practical wisdom enrichment ─────────────────────────
    if include_practical and verses and db is not None:
        try:
            await _enrich_with_practical_wisdom(db, verses)
        except Exception as exc:
            logger.debug(
                "wisdom.retrieve: practical-wisdom enrichment skipped: %s",
                exc,
            )

    # ── Mock catalogue fallback (voice opt-in) ──────────────────────
    is_mock = False
    if not verses and allow_mock_catalogue:
        mock_verses = _mock_catalogue_for_mood(effective_mood, limit=limit)
        if mock_verses:
            verses = mock_verses
            sources_used.append("mock_catalogue")
            is_mock = True

    return WisdomBundle(
        verses=verses[:limit],
        mood=effective_mood,
        sources=tuple(sources_used),
        is_mock=is_mock,
    )


# ── Internal helpers ───────────────────────────────────────────────────


def _result_ref(r: Any) -> str:
    """Pull a stable verse_ref from a ``WisdomResult``-like object."""
    ref = getattr(r, "verse_ref", None) or getattr(r, "reference", None)
    if ref:
        return str(ref)
    chapter = getattr(r, "chapter", None)
    verse = getattr(r, "verse", None) or getattr(r, "verse_number", None)
    if chapter and verse:
        return f"{chapter}.{verse}"
    return ""


def _normalise_wisdom_result(r: Any) -> WisdomVerse:
    """Adapter: ``wisdom_core.WisdomResult`` → :class:`WisdomVerse`."""
    chapter_raw = getattr(r, "chapter", 0)
    verse_raw = getattr(r, "verse", 0) or getattr(r, "verse_number", 0)
    try:
        chapter = int(chapter_raw or 0)
    except (TypeError, ValueError):
        chapter = 0
    try:
        verse = int(verse_raw or 0)
    except (TypeError, ValueError):
        verse = 0
    ref = _result_ref(r) or (
        f"{chapter}.{verse}" if chapter and verse else ""
    )
    return WisdomVerse(
        verse_ref=ref,
        chapter=chapter,
        verse=verse,
        sanskrit=str(getattr(r, "sanskrit", "") or ""),
        english=str(
            getattr(r, "english", None)
            or getattr(r, "content", None)
            or ""
        ),
        hindi=getattr(r, "hindi", None),
        principle=str(getattr(r, "principle", "") or ""),
        theme=str(getattr(r, "theme", "") or ""),
        source="gita_corpus",
        mood_application_match=float(
            getattr(r, "mood_application_match", 0.0) or 0.0
        ),
    )


def _normalise_dynamic_verse(verse: dict[str, Any]) -> WisdomVerse:
    """Adapter: ``DynamicWisdomCorpus`` verse dict → :class:`WisdomVerse`.

    Two upstream paths produce slightly different keys:

      * ``SakhaWisdomEngine`` — usually ``english`` / ``content``
      * DB fallback (``DynamicWisdomCorpus._resolve_verse``) — uses
        ``wisdom`` for the English text
    """
    verse_ref = str(verse.get("verse_ref") or "")
    chapter_raw: Any = verse.get("chapter") or ""
    verse_num_raw: Any = verse.get("verse") or ""
    if (not chapter_raw or not verse_num_raw) and verse_ref:
        parts = verse_ref.split(".")
        if len(parts) == 2:
            chapter_raw = chapter_raw or parts[0]
            verse_num_raw = verse_num_raw or parts[1]
    try:
        chapter = int(chapter_raw or 0)
    except (TypeError, ValueError):
        chapter = 0
    try:
        verse_num = int(verse_num_raw or 0)
    except (TypeError, ValueError):
        verse_num = 0
    return WisdomVerse(
        verse_ref=verse_ref or (
            f"{chapter}.{verse_num}" if chapter and verse_num else ""
        ),
        chapter=chapter,
        verse=verse_num,
        sanskrit=str(verse.get("sanskrit") or ""),
        english=str(
            verse.get("english")
            or verse.get("wisdom")
            or verse.get("content")
            or ""
        ),
        hindi=verse.get("hindi"),
        principle=str(verse.get("principle") or ""),
        theme=str(verse.get("theme") or ""),
        source=str(verse.get("source") or "dynamic_corpus"),
        mood_application_match=float(
            verse.get("effectiveness_score")
            or verse.get("mood_application_match")
            or 0.0
        ),
    )


async def _enrich_with_practical_wisdom(
    db: AsyncSession, verses: list[WisdomVerse]
) -> None:
    """Attach ``GitaPracticalWisdom`` rows to each verse, in place.

    Mirrors ``kiaan_wisdom_helper._enrich_with_practical_wisdom``
    exactly — one batched SELECT keyed by ``verse_ref`` (the same
    indexed column the prior implementation used), then distributes
    rows back into the verses list. Cap at 2 per verse: leading domain
    + one alternate keeps the prompt focused without losing variety.

    Mutates the ``WisdomVerse`` objects via ``object.__setattr__`` —
    the dataclass is frozen for value-semantics elsewhere, but
    enrichment is the one path that legitimately writes back.
    """
    if not verses:
        return
    refs = [v.verse_ref for v in verses if v.verse_ref]
    if not refs:
        return

    # Lazy import: keeps module-import time fast and avoids a circular
    # via backend.models.wisdom → … → services modules.
    from sqlalchemy import select

    from backend.models.wisdom import GitaPracticalWisdom

    rows_result = await db.execute(
        select(GitaPracticalWisdom).where(
            GitaPracticalWisdom.verse_ref.in_(refs),
            GitaPracticalWisdom.is_validated.is_(True),
        )
    )
    rows = rows_result.scalars().all()
    if not rows:
        return

    by_ref: dict[str, list[Any]] = {}
    for row in rows:
        by_ref.setdefault(row.verse_ref, []).append(row)
    for entries in by_ref.values():
        entries.sort(
            key=lambda r: getattr(r, "effectiveness_score", 0.0) or 0.0,
            reverse=True,
        )

    for v in verses:
        ref_entries = by_ref.get(v.verse_ref) or []
        if not ref_entries:
            continue
        # Frozen dataclass: write via object.__setattr__ (documented
        # in the dataclass docs as the supported escape hatch).
        object.__setattr__(
            v,
            "practical_wisdom",
            [
                {
                    "life_domain": e.life_domain,
                    "principle_in_action": e.principle_in_action or "",
                    "micro_practice": e.micro_practice or "",
                    "action_steps": list(e.action_steps or []),
                    "reflection_prompt": e.reflection_prompt or "",
                    "modern_scenario": e.modern_scenario or "",
                    "counter_pattern": e.counter_pattern or "",
                }
                for e in ref_entries[:2]
            ],
        )


def _mock_catalogue_for_mood(
    mood: str | None, *, limit: int
) -> list[WisdomVerse]:
    """Project the voice path's deterministic catalogue into :class:`WisdomVerse`.

    Lives in ``backend.services.voice.retrieval_and_fallback`` for
    historical reasons; we read it and adapt the shape here so the
    unified retriever owns the entire data contract.
    """
    if os.environ.get("KIAAN_VOICE_MOCK_PROVIDERS") != "1" and mood is None:
        # When mock is not forced and we have no mood signal at all,
        # don't serve random verses — caller can still degrade.
        return []
    try:
        from backend.services.voice.retrieval_and_fallback import (
            _MOCK_VERSE_CATALOGUE,
        )
    except Exception:  # pragma: no cover - defensive
        return []
    mood_key = (mood or "neutral").lower()
    # The mock catalogue uses the same mood keys as detect_mood here.
    # Map back when our taxonomy disagrees ("anxiety" → "anxious").
    alias = {
        "anxiety": "anxious",
        "sadness": "sad",
        "stress": "stressed",
        "anger": "angry",
    }
    mood_key = alias.get(mood_key, mood_key)
    bucket = _MOCK_VERSE_CATALOGUE.get(mood_key) or _MOCK_VERSE_CATALOGUE.get(
        "neutral"
    )
    if not bucket:
        return []
    out: list[WisdomVerse] = []
    for r in bucket[:limit]:
        out.append(
            WisdomVerse(
                verse_ref=r.ref.replace("BG ", "") if r.ref else "",
                chapter=r.chapter,
                verse=r.verse,
                sanskrit=r.sanskrit or "",
                english=r.english or "",
                hindi=r.hindi,
                principle=r.principle or "",
                theme=r.theme or "",
                source="mock_catalogue",
                mood_application_match=r.mood_application_match,
            )
        )
    return out


__all__ = [
    "WisdomBundle",
    "WisdomVerse",
    "detect_mood",
    "retrieve_wisdom",
]
