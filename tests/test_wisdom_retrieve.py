"""Tests for the unified Wisdom Core retriever.

Covers ``IMPROVEMENT_ROADMAP.md`` P0 §4 — both the chat path
(``compose_kiaan_system_prompt``) and the voice path
(``retrieve_verses_for_turn``) now delegate their data path to
``backend.services.wisdom.retrieve.retrieve_wisdom``. This file pins
the behaviours of that unified function so the consolidation cannot
silently drift.

Three buckets:

1. Mood detection round-trip with the keyword taxonomy the chat path
   used before the consolidation.
2. Tier composition — dynamic pick when available, static-only when
   dynamic returns nothing, persona-only when both fail, mock
   catalogue only when the caller opts in.
3. Adapter contracts — chat dict shape and voice ``RetrievedVerse``
   shape both project losslessly from the canonical ``WisdomVerse``.
"""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.wisdom import (
    WisdomBundle,
    WisdomVerse,
    detect_mood,
    retrieve_wisdom,
)

# ── mood detection ─────────────────────────────────────────────────────


def test_detect_mood_recognises_anxiety_words() -> None:
    assert detect_mood("I feel so anxious about tomorrow") == "anxiety"
    assert detect_mood("I'm worried sick") == "anxiety"
    assert detect_mood("PANIC attack right now") == "anxiety"


def test_detect_mood_returns_none_for_general_queries() -> None:
    assert detect_mood("what is dharma") is None
    assert detect_mood("") is None
    assert detect_mood("tell me about karma yoga") is None


def test_detect_mood_first_match_wins() -> None:
    """If two mood keywords appear, the first taxonomy match is returned.

    Pins the legacy chat behaviour: ``_MOOD_KEYWORDS`` ordering decides
    the label. anxiety is before anger in the dict, so an anxious-angry
    sentence is labelled anxiety.
    """
    assert (
        detect_mood("I feel anxious and angry about everything") == "anxiety"
    )


# ── tier composition ──────────────────────────────────────────────────


def _fake_wisdom_result(verse_ref: str, score: float = 0.5) -> Any:
    r = MagicMock()
    r.verse_ref = verse_ref
    chap, vno = verse_ref.split(".")
    r.chapter = int(chap)
    r.verse = int(vno)
    r.sanskrit = f"<sa {verse_ref}>"
    r.content = f"<en {verse_ref}>"
    r.english = f"<en {verse_ref}>"
    r.principle = f"<p {verse_ref}>"
    r.theme = "test"
    r.mood_application_match = score
    r.score = score
    return r


def _patch_core(results: list[Any]) -> Any:
    """Stub ``backend.services.wisdom_core.get_wisdom_core`` so search
    returns the given results."""
    fake_core = MagicMock()
    fake_core.search = AsyncMock(return_value=results)
    return patch(
        "backend.services.wisdom_core.get_wisdom_core",
        return_value=fake_core,
    )


def _patch_dynamic(verse: dict[str, Any] | None) -> Any:
    fake_corpus = MagicMock()
    fake_corpus.get_effectiveness_weighted_verse = AsyncMock(
        return_value=verse
    )
    return patch(
        "backend.services.dynamic_wisdom_corpus.get_dynamic_wisdom_corpus",
        return_value=fake_corpus,
    )


@pytest.mark.asyncio
async def test_db_none_returns_empty_bundle_without_mock() -> None:
    """Chat-style call: no DB, no mock — empty bundle is the contract."""
    bundle = await retrieve_wisdom(db=None, query="I feel anxious")
    assert bundle.verses == []
    assert bundle.is_mock is False
    assert bundle.sources == ()
    # mood was still detected from the query.
    assert bundle.mood == "anxiety"


@pytest.mark.asyncio
async def test_db_none_returns_mock_when_allowed() -> None:
    """Voice-style call: no DB but allow_mock_catalogue=True → mock served."""
    bundle = await retrieve_wisdom(
        db=None,
        query="I feel anxious",
        allow_mock_catalogue=True,
        limit=2,
    )
    assert bundle.is_mock is True
    assert "mock_catalogue" in bundle.sources
    assert len(bundle.verses) >= 1
    assert bundle.verses[0].source == "mock_catalogue"


@pytest.mark.asyncio
async def test_dynamic_then_static_composes_in_order() -> None:
    """Tier 1 (dynamic) verse leads, tier 2 (static) fills the rest."""
    dynamic_pick = {
        "verse_ref": "2.47",
        "chapter": 2,
        "verse": 47,
        "sanskrit": "<dyn sa>",
        "english": "<dyn en>",
        "principle": "<dyn principle>",
        "theme": "anxiety",
        "effectiveness_score": 0.93,
    }
    static_results = [
        _fake_wisdom_result("2.47", 0.9),  # collides with dynamic — must dedup
        _fake_wisdom_result("2.48", 0.8),
        _fake_wisdom_result("6.35", 0.7),
    ]
    db = MagicMock()
    with _patch_dynamic(dynamic_pick), _patch_core(static_results):
        bundle = await retrieve_wisdom(
            db=db,
            query="I feel anxious",
            user_id="user-1",
            limit=3,
            include_practical=False,  # skip the tier-3 enrichment query
        )
    refs = [v.verse_ref for v in bundle.verses]
    # Dynamic pick leads.
    assert refs[0] == "2.47"
    assert bundle.verses[0].source == "dynamic_corpus"
    # The colliding static "2.47" is deduplicated.
    assert refs.count("2.47") == 1
    # Remaining slots come from static.
    assert refs[1:] == ["2.48", "6.35"]
    assert all(v.source == "gita_corpus" for v in bundle.verses[1:])
    assert "dynamic_corpus" in bundle.sources
    assert "gita_corpus" in bundle.sources


@pytest.mark.asyncio
async def test_static_only_when_dynamic_returns_nothing() -> None:
    """Cold-start user: dynamic returns None, static fills all slots."""
    db = MagicMock()
    with (
        _patch_dynamic(None),
        _patch_core([_fake_wisdom_result("2.47"), _fake_wisdom_result("2.48")]),
    ):
        bundle = await retrieve_wisdom(
            db=db,
            query="I feel anxious",
            user_id="cold-start",
            limit=3,
            include_practical=False,
        )
    assert [v.verse_ref for v in bundle.verses] == ["2.47", "2.48"]
    assert bundle.sources == ("gita_corpus", "gita_corpus")


@pytest.mark.asyncio
async def test_dynamic_skipped_without_user_id() -> None:
    """No user_id → tier 1 is skipped entirely; static drives everything."""
    db = MagicMock()
    fake_corpus = MagicMock()
    fake_corpus.get_effectiveness_weighted_verse = AsyncMock(
        side_effect=AssertionError("dynamic must not be called without user_id")
    )
    with (
        patch(
            "backend.services.dynamic_wisdom_corpus.get_dynamic_wisdom_corpus",
            return_value=fake_corpus,
        ),
        _patch_core([_fake_wisdom_result("2.47")]),
    ):
        bundle = await retrieve_wisdom(
            db=db,
            query="I feel anxious",
            user_id=None,
            limit=1,
            include_practical=False,
        )
    assert [v.verse_ref for v in bundle.verses] == ["2.47"]
    assert "dynamic_corpus" not in bundle.sources


@pytest.mark.asyncio
async def test_static_failure_degrades_to_empty_bundle() -> None:
    """When both tiers fail and mock is not allowed: empty bundle, no raise."""
    db = MagicMock()
    fake_core = MagicMock()
    fake_core.search = AsyncMock(side_effect=RuntimeError("db down"))
    fake_corpus = MagicMock()
    fake_corpus.get_effectiveness_weighted_verse = AsyncMock(
        side_effect=RuntimeError("corpus down")
    )
    with (
        patch(
            "backend.services.wisdom_core.get_wisdom_core",
            return_value=fake_core,
        ),
        patch(
            "backend.services.dynamic_wisdom_corpus.get_dynamic_wisdom_corpus",
            return_value=fake_corpus,
        ),
    ):
        bundle = await retrieve_wisdom(
            db=db,
            query="I feel anxious",
            user_id="user-1",
            limit=3,
            include_practical=False,
        )
    assert bundle.verses == []
    assert bundle.sources == ()
    assert bundle.is_mock is False


@pytest.mark.asyncio
async def test_practical_enrichment_skipped_when_no_verses() -> None:
    """Tier 3 must not query when tier 1 + tier 2 returned nothing."""
    db = MagicMock()
    db.execute = AsyncMock(side_effect=AssertionError("enrichment must not query"))
    with _patch_dynamic(None), _patch_core([]):
        bundle = await retrieve_wisdom(
            db=db,
            query="general question with no mood signal",
            user_id="u",
            include_practical=True,
        )
    assert bundle.verses == []


@pytest.mark.asyncio
async def test_empty_query_returns_empty_bundle() -> None:
    bundle = await retrieve_wisdom(db=None, query="")
    assert bundle.verses == []
    assert bundle.mood is None


@pytest.mark.asyncio
async def test_limit_is_honoured_after_dedup() -> None:
    """limit=2: dynamic + 1 static, never more."""
    dynamic_pick = {
        "verse_ref": "2.47",
        "chapter": 2,
        "verse": 47,
        "sanskrit": "<>",
        "english": "<>",
    }
    static_results = [
        _fake_wisdom_result("6.35"),
        _fake_wisdom_result("12.13"),
        _fake_wisdom_result("18.66"),
    ]
    db = MagicMock()
    with _patch_dynamic(dynamic_pick), _patch_core(static_results):
        bundle = await retrieve_wisdom(
            db=db,
            query="I feel anxious",
            user_id="u",
            limit=2,
            include_practical=False,
        )
    assert len(bundle.verses) == 2
    assert bundle.verses[0].source == "dynamic_corpus"
    assert bundle.verses[1].source == "gita_corpus"


# ── Voice adapter integration ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_voice_adapter_projects_to_retrieved_verse() -> None:
    """``retrieve_verses_for_turn`` reads through the unified retriever
    and returns the voice ``RetrievedVerse`` shape."""
    from backend.services.voice.retrieval_and_fallback import (
        retrieve_verses_for_turn,
    )

    db = MagicMock()
    with (
        _patch_dynamic(None),
        _patch_core(
            [
                _fake_wisdom_result("2.47", 0.9),
                _fake_wisdom_result("2.48", 0.8),
            ]
        ),
    ):
        result = await retrieve_verses_for_turn(
            mood_label="anxiety",
            engine="GUIDANCE",  # cap = 3
            user_message="I am anxious about results",
            user_id="user-1",
            db=db,
        )

    # Voice carries the "BG <ref>" prefix; unified retriever stores
    # bare "<chapter>.<verse>". The adapter re-prefixes.
    refs = [v.ref for v in result]
    assert refs == ["BG 2.47", "BG 2.48"]
    assert all(v.chapter and v.verse for v in result)


@pytest.mark.asyncio
async def test_voice_adapter_falls_back_to_mock_when_live_empty() -> None:
    """Live tiers return nothing → voice path serves mock catalogue."""
    from backend.services.voice.retrieval_and_fallback import (
        retrieve_verses_for_turn,
    )

    db = MagicMock()
    with _patch_dynamic(None), _patch_core([]):
        result = await retrieve_verses_for_turn(
            mood_label="anxiety",
            engine="GUIDANCE",
            user_message="I feel anxious",
            user_id="u",
            db=db,
        )
    # Mock catalogue has at least one anxiety verse.
    assert len(result) >= 1
    assert all(v.ref.startswith("BG ") for v in result)


# ── WisdomBundle / WisdomVerse shape ──────────────────────────────────


def test_wisdom_bundle_truthiness() -> None:
    """Empty bundle is falsy; populated is truthy — enables ``if bundle:`` idioms."""
    assert not WisdomBundle()
    assert WisdomBundle(verses=[WisdomVerse(verse_ref="2.47", chapter=2, verse=47)])


def test_wisdom_verse_defaults_are_safe() -> None:
    """All fields have safe defaults so callers can construct partials."""
    v = WisdomVerse(verse_ref="2.47", chapter=2, verse=47)
    assert v.sanskrit == ""
    assert v.english == ""
    assert v.hindi is None
    assert v.practical_wisdom == []
    assert v.source == "gita_corpus"


@pytest.mark.asyncio
async def test_chat_adapter_returns_dict_shape() -> None:
    """``compose_kiaan_system_prompt`` returns the dict shape the persona
    block expects, even though it now delegates to the unified retriever."""
    from backend.services.kiaan_wisdom_helper import compose_kiaan_system_prompt

    db = MagicMock()
    with (
        _patch_dynamic(None),
        _patch_core(
            [_fake_wisdom_result("2.47"), _fake_wisdom_result("2.48")]
        ),
    ):
        prompt, verses = await compose_kiaan_system_prompt(
            db=db,
            query="I feel anxious",
            user_id="u",
            verses_limit=2,
        )

    assert prompt is None or isinstance(prompt, str)  # persona may be missing in OSS tree
    assert isinstance(verses, list)
    assert len(verses) == 2
    assert verses[0]["verse_ref"] == "2.47"
    assert verses[0]["source"] == "gita_corpus"
    # Keys the persona's RETRIEVED VERSES block depends on:
    for v in verses:
        assert set(v.keys()) >= {
            "verse_ref",
            "chapter",
            "verse",
            "sanskrit",
            "english",
            "principle",
            "theme",
            "source",
            "practical_wisdom",
        }
