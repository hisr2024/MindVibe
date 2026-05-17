"""Tests for per-sentence script + TTS-lang detection.

Covers ``IMPROVEMENT_ROADMAP.md`` P1 §8. The unit tests pin the script
detector behaviour; the integration test asserts the orchestrator
actually re-routes TTS per sentence rather than once per turn.
"""

from __future__ import annotations

import asyncio
from typing import Any
from unittest.mock import MagicMock

import pytest

from backend.services.voice.lang_detect import (
    detect_script,
    pick_tts_lang,
)

# ── detect_script ─────────────────────────────────────────────────────


def test_clean_english_is_classified_en() -> None:
    assert detect_script("I feel anxious about tomorrow") == "en"
    assert detect_script("Just one word: yoga") == "en"


def test_clean_hindi_is_classified_hi() -> None:
    assert detect_script("मुझे चिंता हो रही है") == "hi"
    assert detect_script("एक छोटा वाक्य") == "hi"


def test_hinglish_is_classified_mixed() -> None:
    assert detect_script("Krishna कहते हैं that we should act") == "mixed"
    assert detect_script("धर्म comes first") == "mixed"


def test_empty_or_punctuation_only_is_unknown() -> None:
    assert detect_script("") == "unknown"
    assert detect_script("   ") == "unknown"
    assert detect_script("12345 !!!") == "unknown"
    assert detect_script("...") == "unknown"


def test_english_with_minority_devanagari_quote_stays_en() -> None:
    """A long English sentence quoting one Sanskrit word stays ``en``."""
    text = (
        "Acting without attachment to results is what Krishna calls "
        "nishkama karma, and the Sanskrit term is धर्म"
    )
    # 1 Devanagari word in ~17 English words → well above the 0.80 threshold.
    assert detect_script(text) == "en"


def test_hindi_with_minority_english_brand_name_stays_hi() -> None:
    text = "मुझे Google पर ध्यान केंद्रित करना है"
    # 1 English brand vs many Devanagari syllables.
    assert detect_script(text) == "hi"


def test_threshold_below_majority_returns_mixed() -> None:
    """Exactly-half mix tips into ``mixed`` rather than guessing."""
    # Construct equal counts deliberately.
    text = "ABCDE फगहझङ"  # 5 Latin, 5 Devanagari letters.
    assert detect_script(text) == "mixed"


# ── pick_tts_lang ─────────────────────────────────────────────────────


def test_pick_tts_lang_routes_hi_to_hi() -> None:
    assert pick_tts_lang("मुझे चिंता है", fallback="en") == "hi"


def test_pick_tts_lang_routes_en_to_en() -> None:
    assert pick_tts_lang("I feel anxious", fallback="hi") == "en"


def test_pick_tts_lang_routes_mixed_to_hi_en() -> None:
    """Sarvam Hindi voice handles Hinglish cleanly; ElevenLabs does not."""
    assert pick_tts_lang("Krishna कहते हैं dharma comes first", fallback="en") == "hi-en"


def test_pick_tts_lang_unknown_uses_fallback() -> None:
    assert pick_tts_lang("12345 ???", fallback="en") == "en"
    assert pick_tts_lang("12345 ???", fallback="hi") == "hi"
    assert pick_tts_lang("", fallback="hi-en") == "hi-en"


# ── orchestrator wiring: per-sentence TTS routing ─────────────────────


@pytest.mark.asyncio
async def test_orchestrator_routes_tts_per_sentence_language() -> None:
    """The happy-path TTS loop must call ``build_provider`` with the
    detected language of each sentence, not the static turn-level
    ``ctx.lang_hint``."""
    from backend.services.gita_wisdom_filter import StreamingFilterVerdict
    from backend.services.voice.orchestrator import VoiceCompanionOrchestrator
    from backend.services.voice.orchestrator_types import VoiceTurnContext
    from backend.services.voice.retrieval_and_fallback import RetrievedVerse

    # Three sentences spanning all three script verdicts:
    #   1. English  → should route to "en"
    #   2. Hindi    → should route to "hi"
    #   3. Hinglish → should route to "hi-en"
    sentences = [
        "Acting without attachment is true freedom.",
        "मन को शांत रखना ही योग है।",
        "Krishna कहते हैं that dharma comes first.",
    ]

    # Drive the streaming filter to emit one sentence per feed call.
    fake_filter = MagicMock()
    fake_filter.is_failed = False
    fake_filter.cumulative_score = 0.9
    fake_filter.feed = MagicMock(side_effect=[
        MagicMock(
            verdict=StreamingFilterVerdict.PASS,
            completed_sentences=[s],
            fallback_tier=None,
            failure_reason=None,
        )
        for s in sentences
    ] + [MagicMock(
        verdict=StreamingFilterVerdict.PASS,
        completed_sentences=[],
        fallback_tier=None,
        failure_reason=None,
    )])
    fake_filter.finalize = MagicMock(return_value=MagicMock(
        verdict=StreamingFilterVerdict.PASS,
        completed_sentences=[],
        fallback_tier=None,
        failure_reason=None,
    ))

    # LLM provider yields one delta per sentence; the (fake) filter
    # converts each delta into a completed_sentence.
    async def _fake_llm_stream(**_: Any):
        for s in sentences:
            yield MagicMock(is_final=False, content=s)
        yield MagicMock(is_final=True, content="")

    fake_llm = MagicMock()
    fake_llm.stream = _fake_llm_stream

    # Track every (lang_hint, voice_id) the TTS router is asked for.
    tts_calls: list[tuple[str, str]] = []

    fake_tts_provider = MagicMock()

    async def _fake_synth_streaming(*, text: str, voice_id: str, lang_hint: str):
        tts_calls.append((lang_hint, voice_id))
        yield MagicMock(
            seq=0,
            mime="audio/opus",
            data=b"\x00",
        )

    fake_tts_provider.synthesize_streaming = _fake_synth_streaming
    fake_tts_router = MagicMock()
    fake_tts_router.build_provider = MagicMock(return_value=(fake_tts_provider, None))
    fake_tts_router.decide = MagicMock(return_value=MagicMock(voice_id="en-voice"))
    fake_tts_router.cache = MagicMock()
    fake_tts_router.cache.get = MagicMock(return_value=None)  # cache miss

    orchestrator = VoiceCompanionOrchestrator()
    orchestrator._llm = MagicMock()
    orchestrator._llm.build_provider = MagicMock(return_value=(fake_llm, "fake-model"))
    orchestrator._tts = fake_tts_router

    # Stub verse retrieval so the run gets past the retrieval gate.
    async def _fake_retrieve(**_: Any) -> list[RetrievedVerse]:
        return []

    import backend.services.voice.orchestrator as orch_mod
    orig_retrieve = orch_mod.retrieve_verses_for_turn
    orch_mod.retrieve_verses_for_turn = _fake_retrieve  # type: ignore[assignment]

    # Patch the StreamingGitaFilter constructor at the *orchestrator's*
    # binding site (not the filter module's). The orchestrator imports
    # the class by name at module load — patching the source module
    # leaves the orchestrator's local binding untouched.
    orig_filter_cls = orch_mod.StreamingGitaFilter
    orch_mod.StreamingGitaFilter = MagicMock(return_value=fake_filter)  # type: ignore[assignment]

    try:
        ctx = VoiceTurnContext(
            session_id="s",
            user_id="u",
            conversation_id="c",
            user_latest="hello",
            lang_hint="en",  # turn-level hint is English
        )
        cancel = asyncio.Event()
        async for _ in orchestrator.run_turn(
            ctx,
            system_prompt="SYSTEM",
            db=None,
            cancel_event=cancel,
        ):
            pass
    finally:
        orch_mod.retrieve_verses_for_turn = orig_retrieve  # type: ignore[assignment]
        orch_mod.StreamingGitaFilter = orig_filter_cls  # type: ignore[assignment]

    # Three sentences → three TTS calls, one per sentence, with the
    # right per-sentence language.
    assert len(tts_calls) == 3, f"expected 3 TTS calls, got {tts_calls!r}"
    langs = [c[0] for c in tts_calls]
    assert langs == ["en", "hi", "hi-en"], (
        f"expected per-sentence routing en→hi→hi-en, got {langs!r}"
    )
    # voice_id must differ when the lang differs (the route picks
    # ``get_voice_id(per_sentence_lang)`` when it diverges from
    # ``ctx.lang_hint``). All three voices must be distinct here.
    voice_ids = [c[1] for c in tts_calls]
    assert len(set(voice_ids)) >= 2, (
        f"expected distinct voice IDs across script switches, got {voice_ids!r}"
    )
