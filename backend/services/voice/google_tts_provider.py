"""Google Cloud Text-to-Speech provider for the Sakha voice pipeline.

Activates when KIAAN_GOOGLE_TTS_API_KEY is set (or KIAAN_GOOGLE_TTS_KEY_PATH
points to a service-account JSON). Targets the Neural2 voices which match
the persona's contemplative register and ship 1M characters/month free —
big-enough headroom that KIAANverse pays $0/month for English-language TTS
until the user base crosses ~10K daily active.

Why this provider exists alongside Sarvam (Indic) + ElevenLabs (premium en):

  • The TapToListenButton's default provider="system" uses on-device
    expo-speech, which sounds generic and robotic. Replacing it with a
    backend Google Neural2 call upgrades quality dramatically while
    staying free for a long time.

  • Google supports en-IN (Indian English), hi-IN, and most Indic codes —
    so it's a viable cheap fallback for any language Sarvam isn't
    configured for.

  • Sanskrit pronunciation: Google's hi-IN Neural2 voices read
    Devanagari acceptably. Not as good as Microsoft Studio voices, but
    solid for verse readbacks.

Authentication:
  Two paths supported. Pick whichever fits your Render env:

  1. API KEY (simpler, recommended for getting started):
       GET an API key from console.cloud.google.com → Credentials.
       Set env: KIAAN_GOOGLE_TTS_API_KEY=AIza…
       Calls go to https://texttospeech.googleapis.com/v1/text:synthesize?key=$KEY
       Free tier: 1M chars/month for Neural2 voices.

  2. SERVICE ACCOUNT JSON (full IAM, recommended for production):
       Create a service account, download the .json key.
       Set env: KIAAN_GOOGLE_TTS_KEY_PATH=/etc/secrets/google-tts-sa.json
       Calls use bearer-token auth via google-auth library.
       Same free tier; finer-grained permissions.

  If neither is set, this provider returns is_configured() == False and
  the smart router skips it.

Voice IDs:
  We expose Google voices via the registry as voice_id="google:<name>"
  where <name> is the Google voice name (e.g. "en-IN-Neural2-D").
  The router maps lang_hint → voice_id via _GOOGLE_VOICE_BY_LANG.

Streaming:
  Google's REST API returns the full audio in one response, not chunked.
  We yield it as a single TTSChunk(is_final=True). For the WSS streaming
  voice companion, this is acceptable because the cache layer means
  most plays are already cached. For uncached first-byte we accept the
  one-shot delivery — Google's response is typically <500ms even for
  full-paragraph inputs.

Output format:
  We request OGG_OPUS to match the rest of the voice pipeline (Sarvam
  + ElevenLabs both produce Opus). KiaanAudioPlayer's
  ConcatenatingMediaSource accepts mixed Opus chunks transparently.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import os
from collections.abc import AsyncIterator
from typing import Any

import httpx

from backend.services.voice.tts_router import TTSChunk

logger = logging.getLogger(__name__)


# ─── Voice catalogue ──────────────────────────────────────────────────────
#
# Curated subset of Google Neural2 voices that match Sakha's contemplative
# register. Studio / Chirp HD / WaveNet voices are also available — start
# with Neural2 because they're in the free tier (1M chars/month) and the
# voice quality is indistinguishable from premium for narration.
#
# To swap voices, change the entry below; no code change elsewhere needed.

_GOOGLE_VOICE_BY_LANG: dict[str, str] = {
    # English (default to Indian English — matches KIAANverse audience)
    "en":      "en-IN-Neural2-D",
    "en-in":   "en-IN-Neural2-D",
    "en-us":   "en-US-Neural2-D",
    "en-gb":   "en-GB-Neural2-D",
    # Hindi
    "hi":      "hi-IN-Neural2-D",
    "hi-in":   "hi-IN-Neural2-D",
    # Other Indic — Google supports these via Wavenet/Neural2 where listed
    "mr":      "mr-IN-Wavenet-A",
    "bn":      "bn-IN-Wavenet-A",
    "ta":      "ta-IN-Wavenet-A",
    "te":      "te-IN-Standard-A",
    "kn":      "kn-IN-Wavenet-A",
    "ml":      "ml-IN-Wavenet-A",
    "gu":      "gu-IN-Wavenet-A",
    "pa":      "pa-IN-Wavenet-A",
    # Sanskrit — read via hi-IN voice (Devanagari is shared)
    "sa":      "hi-IN-Neural2-D",
}


GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"
SUPPORTED_LANGS = frozenset(_GOOGLE_VOICE_BY_LANG.keys())


def get_google_voice_id(lang_hint: str) -> str:
    """Pick the Google voice name for a language. Falls back to en-IN."""
    normalized = (lang_hint or "en").lower()
    return _GOOGLE_VOICE_BY_LANG.get(
        normalized,
        _GOOGLE_VOICE_BY_LANG.get(normalized.split("-")[0], "en-IN-Neural2-D"),
    )


class GoogleTTSProvider:
    """Streaming TTS via Google Cloud Text-to-Speech REST API.

    Single-chunk streaming — Google returns the full audio in one
    response. We yield it once with is_final=True so the orchestrator's
    chunk-pump logic doesn't change.
    """

    name = "google-neural2"
    supported_languages = SUPPORTED_LANGS

    def __init__(self) -> None:
        self._api_key = os.environ.get("KIAAN_GOOGLE_TTS_API_KEY")
        self._key_path = os.environ.get("KIAAN_GOOGLE_TTS_KEY_PATH")
        # Cached bearer token for service-account auth (refreshed on expiry).
        self._cached_bearer: str | None = None

    def is_configured(self) -> bool:
        return bool(self._api_key) or bool(self._key_path)

    def supports_voice(self, voice_id: str) -> bool:
        return voice_id.startswith("google:")

    async def _resolve_auth(self) -> tuple[str, dict[str, str]]:
        """Return (endpoint_url, headers) honoring whichever auth path is set.

        API-key auth: query string key=…, no Authorization header.
        Service-account auth: bearer token in Authorization header.
        """
        if self._api_key:
            return f"{GOOGLE_TTS_ENDPOINT}?key={self._api_key}", {}
        if self._cached_bearer:
            return GOOGLE_TTS_ENDPOINT, {
                "Authorization": f"Bearer {self._cached_bearer}",
            }
        # Service-account JSON path. Lazy-import google-auth so the
        # provider doesn't pull it into envs that use API-key auth.
        try:
            from google.auth import default as gauth_default  # type: ignore[import-not-found]
            from google.auth.transport.requests import Request  # type: ignore[import-not-found]
        except ImportError as e:
            raise RuntimeError(
                "GoogleTTSProvider: KIAAN_GOOGLE_TTS_KEY_PATH set but "
                "google-auth package not installed. Either pip install "
                "google-auth or switch to KIAAN_GOOGLE_TTS_API_KEY."
            ) from e

        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self._key_path or ""
        creds, _ = gauth_default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        # Refresh in a thread so we don't block the event loop.
        await asyncio.get_event_loop().run_in_executor(
            None, lambda: creds.refresh(Request())
        )
        self._cached_bearer = creds.token
        return GOOGLE_TTS_ENDPOINT, {
            "Authorization": f"Bearer {self._cached_bearer}",
        }

    async def synthesize_streaming(
        self,
        *,
        text: str,
        voice_id: str,
        lang_hint: str,
    ) -> AsyncIterator[TTSChunk]:
        if not self.is_configured():
            raise RuntimeError(
                "GoogleTTSProvider: neither KIAAN_GOOGLE_TTS_API_KEY nor "
                "KIAAN_GOOGLE_TTS_KEY_PATH is set."
            )

        # Resolve the actual Google voice name. Either:
        #   - voice_id was passed as "google:en-IN-Neural2-D" → strip prefix
        #   - voice_id wasn't a google: voice (caller passed something else
        #     like "elevenlabs:foo") → derive from lang_hint
        if voice_id.startswith("google:"):
            voice_name = voice_id.split(":", 1)[1]
        else:
            voice_name = get_google_voice_id(lang_hint)

        # Strip any non-Google prefix from lang_hint and pick the locale.
        normalized = (lang_hint or "en").lower()
        # Google's languageCode field expects the full BCP-47 (en-IN, hi-IN, etc.)
        # If voice_name is "en-IN-Neural2-D", derive language_code "en-IN".
        parts = voice_name.split("-", 2)
        language_code = (
            f"{parts[0]}-{parts[1]}" if len(parts) >= 2 else "en-IN"
        )

        url, headers = await self._resolve_auth()
        headers["Content-Type"] = "application/json"

        payload: dict[str, Any] = {
            "input": {"text": text},
            "voice": {
                "languageCode": language_code,
                "name": voice_name,
            },
            "audioConfig": {
                "audioEncoding": "OGG_OPUS",
                # 0.85× speaking rate matches the contemplative register
                # we set in useSpeechOutput. Google's range is 0.25-4.0.
                "speakingRate": 0.95,
                "pitch": 0.0,
                "sampleRateHertz": 24_000,
            },
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(
                    f"GoogleTTSProvider: HTTP {resp.status_code} "
                    f"(lang={language_code} voice={voice_name}) → "
                    f"{resp.text[:200]}"
                )
            data = resp.json()
            audio_b64 = data.get("audioContent", "")
            if not audio_b64:
                raise RuntimeError(
                    f"GoogleTTSProvider: empty audioContent in response "
                    f"(keys={list(data.keys())})"
                )
            audio_bytes = base64.b64decode(audio_b64)

        yield TTSChunk(
            seq=0,
            data=audio_bytes,
            is_final=True,
        )


# ─── Provider-registry hook ──────────────────────────────────────────────
#
# When the backend imports this module on startup, it auto-registers with
# the central provider registry so the existing TTSRouter picks it up
# without any code change to tts_router.py. The router's
# find_provider_by_language("tts", lang) call will return this provider
# when Sarvam/ElevenLabs aren't configured for the requested language.


def _register() -> None:
    try:
        from backend.services.voice.provider_registry import register_tts_provider
    except ImportError:
        return
    register_tts_provider(
        name="google-neural2",
        factory=GoogleTTSProvider,
        voice_prefix="google:",
        languages=frozenset(SUPPORTED_LANGS),
    )


_register()


__all__ = [
    "GoogleTTSProvider",
    "get_google_voice_id",
    "SUPPORTED_LANGS",
]
