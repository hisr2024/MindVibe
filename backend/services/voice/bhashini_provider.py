"""BhashiniTTSProvider — wraps `bhashini_tts_service.synthesize_bhashini_tts`
to conform to the `TTSProvider` Protocol used by `tts_router.TTSRouter`.

Bhashini is the Indian government's national AI language platform. The
underlying service module
(`backend/services/bhashini_tts_service.py`) was already implemented end-
to-end (ULCA pipeline auth, language routing across 22 scheduled
languages, voice/gender mapping, mood-based emotion profiles), but
nothing imported it. The voice orchestrator never invoked Bhashini —
even with `BHASHINI_USER_ID` + `BHASHINI_API_KEY` set in the
environment, every voice turn fell through to other providers (or the
mock fallback when none were configured).

This module closes the gap. It:

  1. Wraps the existing async `synthesize_bhashini_tts(...)` call in a
     class that conforms to the `TTSProvider` Protocol (
     `name`, `supported_languages`, `supports_voice`, `synthesize_streaming`).

  2. Re-chunks the single WAV blob Bhashini returns into ~32KB
     `TTSChunk`s, exactly the shape the WSS `audio.chunk` frame
     expects. Modeled on `SarvamTTSProvider.synthesize_streaming` — the
     two providers share the same "non-streaming HTTP API → client-side
     chunking" pattern.

  3. Registers itself at import time via
     `provider_registry.register_tts_provider`, so the existing
     `TTSRouter.decide()` registry-fallthrough at lines 654-675 picks
     it up automatically. No changes to the router code itself.

Routing semantics:
  • `voice_id` MUST start with the `bhashini:` prefix (e.g.
    `bhashini:bhashini-devi`). The router uses the prefix to find the
    right plugin without having to enumerate every voice.
  • For Indic languages where Sarvam is also available, Sarvam wins
    (it's checked first in `TTSRouter.decide()` line 635). Bhashini
    is the FALLBACK when Sarvam is not configured. To make Bhashini
    primary, set `KIAAN_VOICE_DEFAULT_VOICE_HI=bhashini:bhashini-devi`
    (or per-language equivalents) so the voice_id starts with the
    `bhashini:` prefix and the prefix-match path takes precedence.

Failure modes:
  • Env credentials missing → `is_configured()` returns False → router
    skips this provider on decide() and falls through to the next.
  • Bhashini API call fails / returns None → we raise RuntimeError so
    the router's try/except logs `voice.tts.registered.factory_failed`
    and falls through to mock. That matches every other provider's
    error contract.
"""

from __future__ import annotations

import logging
import time
from typing import AsyncIterator

from backend.services.bhashini_tts_service import (
    BHASHINI_SUPPORTED_LANGUAGES,
    is_bhashini_available,
    synthesize_bhashini_tts,
)
from backend.services.voice.provider_registry import register_tts_provider
from backend.services.voice.tts_router import TTSChunk

logger = logging.getLogger(__name__)

# Mirror SarvamTTSProvider's chunk size so downstream consumers see the
# same chunk cadence regardless of which provider produced the audio.
# 32KB ≈ 1.5s of 22050Hz mono WAV which is the rate Bhashini returns by
# default.
_BHASHINI_TTS_CHUNK_BYTES = 32 * 1024


class BhashiniTTSProvider:
    """TTS provider backed by the Bhashini ULCA pipeline.

    voice_id format: `bhashini:<companion_voice_id>` (e.g.
    `bhashini:bhashini-devi`). The companion voice id maps internally
    to Bhashini gender + voice via `COMPANION_TO_BHASHINI` in
    `bhashini_tts_service`.
    """

    name = "bhashini"
    # `supported_languages` advertises every MindVibe language code
    # Bhashini accepts. Exposing this as a frozenset (not list) matches
    # the TTSProvider Protocol signature in `tts_router.py:112`.
    supported_languages = frozenset(BHASHINI_SUPPORTED_LANGUAGES)

    def is_configured(self) -> bool:
        # Mirrors the gate inside `synthesize_bhashini_tts` so the router
        # can skip this provider cleanly without ever calling the API
        # when credentials are missing.
        return is_bhashini_available()

    def supports_voice(self, voice_id: str) -> bool:
        # The router uses prefix match on voice_id to discover the right
        # plugin. We claim every voice_id with the `bhashini:` prefix.
        return voice_id.startswith("bhashini:")

    @staticmethod
    def _parse_voice_id(voice_id: str) -> str:
        """Strip the `bhashini:` prefix and return the companion voice id.

        `bhashini:bhashini-devi` → `bhashini-devi`. Empty or wrong
        prefix raises so the caller fails loudly rather than silently
        synthesizing the wrong voice.
        """
        if ":" not in voice_id:
            raise ValueError(
                f"BhashiniTTSProvider: voice_id missing 'bhashini:' "
                f"prefix: {voice_id!r}"
            )
        prefix, _, raw = voice_id.partition(":")
        if prefix != "bhashini" or not raw:
            raise ValueError(
                f"BhashiniTTSProvider: malformed voice_id {voice_id!r} "
                f"(expected 'bhashini:<companion_voice>')"
            )
        return raw

    async def synthesize_streaming(
        self,
        *,
        text: str,
        voice_id: str,
        lang_hint: str,
    ) -> AsyncIterator[TTSChunk]:
        """Synthesize `text` via Bhashini and yield TTSChunks.

        Bhashini returns a single WAV blob; we slice it into
        `_BHASHINI_TTS_CHUNK_BYTES`-sized pieces and emit them as a
        stream so the WSS audio.chunk consumer sees the same shape it
        gets from Sarvam / ElevenLabs.
        """
        if not text:
            # Empty input — emit nothing. The orchestrator handles the
            # zero-chunk case as a silent turn.
            return

        if not is_bhashini_available():
            raise RuntimeError(
                "BhashiniTTSProvider: BHASHINI_USER_ID/BHASHINI_API_KEY "
                f"not set (text_len={len(text)}, voice_id={voice_id!r}, "
                f"lang={lang_hint!r})."
            )

        companion_voice = self._parse_voice_id(voice_id)
        # MindVibe lang codes are already what `synthesize_bhashini_tts`
        # accepts (it does the Bhashini-internal code mapping itself).
        # Default `mood='neutral'` because the WSS turn doesn't currently
        # thread the user's mood through to TTS — when it does, this
        # call site is where we plumb it.
        started = time.monotonic()
        wav_bytes = await synthesize_bhashini_tts(
            text=text,
            language=lang_hint or "hi",
            voice_id=companion_voice,
            mood="neutral",
        )
        if wav_bytes is None:
            # Bhashini service returned None — usually means
            # auth failure, rate limit, or unsupported language. The
            # underlying module already logged the specifics.
            raise RuntimeError(
                f"BhashiniTTSProvider: synthesis returned None "
                f"(text_len={len(text)}, voice_id={voice_id!r}, "
                f"lang={lang_hint!r})"
            )

        # Re-chunk into TTSChunks. Mark the final chunk is_final=True so
        # the WSS consumer can close the audio stream cleanly.
        seq = 0
        total = len(wav_bytes)
        offset = 0
        while offset < total:
            end = min(offset + _BHASHINI_TTS_CHUNK_BYTES, total)
            piece = wav_bytes[offset:end]
            elapsed = int((time.monotonic() - started) * 1000)
            yield TTSChunk(
                seq=seq,
                data=piece,
                mime="audio/wav",
                is_final=(end == total),
                elapsed_ms=elapsed,
            )
            seq += 1
            offset = end


# ─── Self-registration at import time ──────────────────────────────────
#
# The router's plugin path (TTSRouter.decide() lines 654-675) only sees
# providers that have been registered via `register_tts_provider`. By
# self-registering on import, any module that imports this file
# automatically gets Bhashini wired into routing.
#
# `voice_prefix="bhashini:"` lets the router pick this provider via
# prefix match on voice_id (the most direct routing path — overrides
# the Indic→Sarvam built-in default if voice_id starts with `bhashini:`).
#
# `languages=` advertises every MindVibe code Bhashini accepts so the
# `find_provider_by_language` fallthrough works even when voice_id is
# the default (no explicit prefix).
register_tts_provider(
    name="bhashini",
    factory=BhashiniTTSProvider,
    voice_prefix="bhashini:",
    languages=BHASHINI_SUPPORTED_LANGUAGES,
)

__all__ = ["BhashiniTTSProvider"]
