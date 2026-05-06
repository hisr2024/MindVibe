"""Voice companion subpackage — Sakha WSS pipeline modules.

Modules:
  • wss_frames        — Pydantic frame protocol (kiaan-voice-v1)
  • stt_router        — Server-side STT routing (Sarvam / Deepgram / Mock)
  • tts_router        — Server-side TTS routing + audio cache
  • orchestrator      — Per-turn voice orchestrator
  • mock_providers    — Deterministic mock STT/TTS for tests + dev
  • bhashini_provider — Optional plugin TTS provider (India national AI
                        language platform). Self-registers at import
                        time but inert until BHASHINI_USER_ID +
                        BHASHINI_API_KEY are set in the environment.
"""

# Import the Bhashini provider so its module-level `register_tts_provider`
# call fires during server boot. The registration is metadata-only: it
# just adds an entry to the provider registry. No HTTP calls, no
# credential checks, no risk of import-time failure even when Bhashini
# credentials are absent — `BhashiniTTSProvider.is_configured()` returns
# False in that case and `TTSRouter.decide()` skips it cleanly, falling
# through to whichever other provider IS configured (or mock).
#
# Wrapped in try/except as belt-and-braces: even if the underlying
# bhashini_tts_service module ever fails to import (e.g., a missing
# transitive dep on a freshly-spun-up Render instance), the rest of the
# voice subsystem must still boot. Voice working with Sarvam/ElevenLabs/
# OpenAI is more important than the dormant Bhashini path.
try:
    from . import bhashini_provider  # noqa: F401  (import-for-side-effects)
except Exception as _bhashini_import_err:  # pragma: no cover
    import logging as _logging

    _logging.getLogger(__name__).warning(
        "voice.bhashini_provider.import_failed err=%s — "
        "Bhashini TTS will be unavailable but other providers continue.",
        _bhashini_import_err,
    )
