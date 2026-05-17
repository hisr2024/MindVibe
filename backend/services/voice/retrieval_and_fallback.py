"""Verse retrieval + tier-3/tier-4 fallback templates for the voice orchestrator.

The orchestrator needs two narrow capabilities outside its main pipeline:

  1. retrieve_verses_for_turn(...): top-N verses scored by mood + engine
     for the system-prompt context. Wraps wisdom_core.search() in
     production; falls back to a deterministic mock catalogue when the
     DB is unreachable (CI, unit tests).

  2. tier_3_template(...) / tier_4_verse_only(...): the safe responses
     Sakha falls back to when StreamingGitaFilter rejects the LLM stream.
     Tier-3 is a pre-rendered template per (engine, mood) — always
     filter-passable, always Gita-grounded. Tier-4 is the verse alone,
     in Sanskrit + English, with no commentary.

Per spec, Tier-3 audio should ideally be pre-rendered Sarvam clips so
first-byte stays under 1.2s on the fallback path. We return the *text*
here; the orchestrator hands it to TTS which (in production) hits the
audio cache for the pre-rendered clip, or synthesizes fresh.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# ─── Verse retrieval ──────────────────────────────────────────────────────


@dataclass(frozen=True)
class RetrievedVerse:
    """A single verse with the fields the orchestrator needs."""

    ref: str            # "BG 2.47"
    chapter: int
    verse: int
    sanskrit: str
    english: str
    hindi: str | None = None
    principle: str | None = None
    theme: str | None = None
    mood_application_match: float = 0.0

    def to_prompt_dict(self) -> dict:
        """Shape the LLM prompt expects in retrieved_verses[]."""
        return {
            "ref": self.ref,
            "sanskrit": self.sanskrit,
            "english": self.english,
            "hindi": self.hindi,
            "principle": self.principle,
            "theme": self.theme,
            "mood_application_match": self.mood_application_match,
        }


# Mock catalogue keyed by mood, used when wisdom_core is unreachable
# (CI, unit tests, or KIAAN_VOICE_MOCK_PROVIDERS=1). Carefully curated so
# every mood has at least one verse the StreamingGitaFilter passes.
_MOCK_VERSE_CATALOGUE: dict[str, list[RetrievedVerse]] = {
    "anxious": [
        RetrievedVerse(
            ref="BG 2.47", chapter=2, verse=47,
            sanskrit="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
            english="You have a right to action alone, never to its fruits.",
            principle="nishkama_karma", theme="anxiety_about_results",
            mood_application_match=0.92,
        ),
        RetrievedVerse(
            ref="BG 6.35", chapter=6, verse=35,
            sanskrit="अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते।",
            english="Through practice and detachment, the mind is restrained.",
            principle="abhyasa_vairagya", theme="restless_mind",
            mood_application_match=0.85,
        ),
    ],
    "sad": [
        RetrievedVerse(
            ref="BG 2.14", chapter=2, verse=14,
            sanskrit="आगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत।",
            english="They come and go, impermanent — endure them, Bharata.",
            principle="anitya", theme="this_too_passes",
            mood_application_match=0.88,
        ),
    ],
    "depressed": [
        RetrievedVerse(
            ref="BG 6.5", chapter=6, verse=5,
            sanskrit="उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।",
            english="Lift yourself by your own self; do not let the self sink.",
            principle="atma_uddharana", theme="self_lifting",
            mood_application_match=0.93,
        ),
    ],
    "lonely": [
        RetrievedVerse(
            ref="BG 6.30", chapter=6, verse=30,
            sanskrit="यो मां पश्यति सर्वत्र सर्वं च मयि पश्यति।",
            english="One who sees Me everywhere is never lost to Me.",
            principle="ishvara_drishti", theme="you_are_not_alone",
            mood_application_match=0.94,
        ),
    ],
    "angry": [
        RetrievedVerse(
            ref="BG 2.62", chapter=2, verse=62,
            sanskrit="ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।",
            english="Brooding on objects gives rise to attachment.",
            principle="krodha_chain", theme="anger_origin",
            mood_application_match=0.91,
        ),
    ],
    "stressed": [
        RetrievedVerse(
            ref="BG 2.48", chapter=2, verse=48,
            sanskrit="समत्वं योग उच्यते।",
            english="Equanimity is called yoga.",
            principle="samatvam", theme="equanimity",
            mood_application_match=0.90,
        ),
    ],
    "overwhelmed": [
        RetrievedVerse(
            ref="BG 18.46", chapter=18, verse=46,
            sanskrit="स्वकर्मणा तमभ्यर्च्य सिद्धिं विन्दति मानवः।",
            english="By one's own work, perfection is attained.",
            principle="one_thing_at_a_time", theme="rest_is_allowed",
            mood_application_match=0.84,
        ),
    ],
    "uncertain": [
        RetrievedVerse(
            ref="BG 18.66", chapter=18, verse=66,
            sanskrit="सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।",
            english="Abandoning all dharmas, take refuge in Me alone.",
            principle="sharanagati", theme="surrender_in_uncertainty",
            mood_application_match=0.83,
        ),
    ],
    "fearful": [
        RetrievedVerse(
            ref="BG 2.40", chapter=2, verse=40,
            sanskrit="नेहाभिक्रमनाशोऽस्ति प्रत्यवायो न विद्यते।",
            english="On this path no effort is wasted, no progress is lost.",
            principle="no_effort_wasted", theme="fear_of_failure",
            mood_application_match=0.80,
        ),
    ],
    "grieving": [
        RetrievedVerse(
            ref="BG 2.13", chapter=2, verse=13,
            sanskrit="देहिनोऽस्मिन्यथा देहे कौमारं यौवनं जरा।",
            english="As childhood, youth, and old age come to the embodied — so too another body.",
            principle="deha_atma_viveka", theme="grief_and_continuity",
            mood_application_match=0.94,
        ),
    ],
    "neutral": [
        RetrievedVerse(
            ref="BG 2.50", chapter=2, verse=50,
            sanskrit="बुद्धियुक्तो जहातीह उभे सुकृतदुष्कृते।",
            english="One united with intelligence sets aside both good and bad deeds.",
            principle="buddhi_yoga", theme="neutral_steadiness",
            mood_application_match=0.65,
        ),
    ],
}


def _engine_verse_count(engine: str) -> int:
    """Per spec: GUIDANCE up to 3 verses, FRIEND up to 2, others 1."""
    if engine == "GUIDANCE":
        return 3
    if engine == "FRIEND":
        return 2
    return 1


async def retrieve_verses_for_turn(
    *,
    mood_label: str,
    engine: str,
    user_message: str,
    user_id: str,
    db=None,  # AsyncSession when available; None in mock mode
) -> list[RetrievedVerse]:
    """Retrieve top-N verses for a Sakha turn.

    Live path: calls wisdom_core.search() with the spec scoring formula
    (see CLAUDE.md). The DB session is required.

    Mock path (db is None OR KIAAN_VOICE_MOCK_PROVIDERS=1): returns the
    canned catalogue for the mood. Always returns at least one verse
    (falls back to "neutral" if mood unknown), so the orchestrator always
    has something to seed retrieved_verses with.
    """
    limit = _engine_verse_count(engine)
    mock_forced = os.environ.get("KIAAN_VOICE_MOCK_PROVIDERS") == "1"

    if not mock_forced and db is not None:
        try:
            from backend.services.wisdom_core import get_wisdom_core
            core = get_wisdom_core()
            results = await core.search(
                db=db, query=user_message, mood=mood_label,
                limit=limit, user_id=user_id,
            )
            return [_wisdom_result_to_retrieved(r) for r in results]
        except Exception as e:
            logger.warning(
                "retrieve_verses_for_turn: live wisdom_core failed (%s) — "
                "falling back to mock catalogue",
                e,
            )

    # Mock path
    catalogue = _MOCK_VERSE_CATALOGUE.get(
        mood_label.lower(), _MOCK_VERSE_CATALOGUE["neutral"]
    )
    return list(catalogue[:limit])


def _wisdom_result_to_retrieved(result) -> RetrievedVerse:
    """Adapter: wisdom_core.WisdomResult → RetrievedVerse."""
    return RetrievedVerse(
        ref=getattr(result, "reference", "") or getattr(result, "verse_ref", ""),
        chapter=getattr(result, "chapter", 0),
        verse=getattr(result, "verse", 0) or getattr(result, "verse_number", 0),
        sanskrit=getattr(result, "sanskrit", ""),
        english=getattr(result, "english", ""),
        hindi=getattr(result, "hindi", None),
        principle=getattr(result, "principle", None),
        theme=getattr(result, "theme", None),
        mood_application_match=float(
            getattr(result, "mood_application_match", 0.0) or 0.0
        ),
    )


# ─── Tier-3 fallback templates ────────────────────────────────────────────


def tier_3_template(*, engine: str, mood_label: str, verse: RetrievedVerse) -> str:
    """Return the Tier-3 pre-rendered Sakha response for a (engine, mood, verse)
    triple. Always filter-passable — Sanskrit verbatim, translation verbatim,
    one suggestion, soft closer.

    The orchestrator hands this to TTS verbatim. Production should serve a
    pre-rendered Sarvam audio file from the safety bundle (Part 11) when
    available; the cache key includes verse + mood + persona_version so
    pre-rendered clips hit on first use.
    """
    sanskrit = verse.sanskrit
    english = verse.english
    ref = verse.ref

    if engine == "GUIDANCE":
        suggestion = "Right now, one breath, fully — let the result rest."
    elif engine == "FRIEND":
        suggestion = "Just for tonight, one kind word to yourself."
    elif engine == "VOICE_GUIDE":
        suggestion = "I am taking you there. The screen will know."
    else:  # ASSISTANT
        suggestion = "Doing it now, with care."

    # Explicit "Krishna" anchors the StreamingGitaFilter required-signal
    # regex (which expects canonical English Gita keywords; Devanagari word
    # boundaries are too unreliable to rely on). Always present in Tier-3.
    return (
        f"{sanskrit} <pause:medium> "
        f"{english} <pause:short> "
        f"Krishna teaches this in {ref} — for what you are feeling, {mood_label}. "
        f"<pause:short> {suggestion} <pause:long>"
    )


def tier_4_verse_only(*, verse: RetrievedVerse) -> str:
    """Tier-4 fallback: the verse alone, in Sanskrit + English, with a
    canonical Gita anchor. No commentary.

    This is the absolute floor — the response that runs when even the
    Tier-3 template generation fails. Must include a canonical English
    keyword (Krishna / Gita / Bhagavad) so the StreamingGitaFilter's
    required-signal regex passes; without it the verse-only path would
    paradoxically be rejected by the very filter it's meant to satisfy.
    """
    return (
        f"{verse.sanskrit} <pause:medium> "
        f"{verse.english} <pause:short> "
        f"From the Bhagavad Gita, {verse.ref}. <pause:long>"
    )


__all__ = [
    "RetrievedVerse",
    "retrieve_verses_for_turn",
    "tier_3_template",
    "tier_4_verse_only",
]
