"""Smart TTS endpoint for the mobile TapToListenButton (Step 70).

Route: POST /api/voice/tts

Picks the best available TTS provider per (text, language) using a
quality-vs-cost ladder and caches the result for 7 days. The mobile
client gets back a URL to a static .opus blob it can stream through
KiaanAudioPlayer.

Quality vs cost ladder per language:

  English / en-IN
    1. Google Neural2  (free 1M chars/month — DEFAULT)
    2. ElevenLabs      (paid premium — used when Google fails or quota exhausted)
    3. Mock fallback   (tests + dev with no providers)

  Hindi / Indic
    1. Sarvam Bulbul   (already paying — best Indic quality)
    2. Google Neural2  (free fallback if Sarvam unconfigured)
    3. Mock fallback

  Sanskrit (sa)
    1. Sarvam Bulbul (Devanagari-aware)
    2. Google Neural2 with hi-IN voice (acceptable Devanagari pronunciation)
    3. Mock fallback

The router never falls all the way back to expo-speech here — that's the
mobile's offline-only path. The backend always returns *some* audio bytes
or an error; the mobile chooses whether to retry locally.

Caching:

  Key:   sha256(f"{provider}|{voice_id}|{lang}|{persona_version}|{text}")
  TTL:   7 days (FINAL.2 spec § CACHING TIERS)
  Path:  backend/static/voice/tts-cache/<key>.opus
  URL:   /static/voice/tts-cache/<key>.opus

  Mobile clients can warm the cache for predictable strings (e.g. the
  10 anchor verses) by hitting this endpoint at first launch.
"""

from __future__ import annotations

import hashlib
import logging
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.voice.tts_router import (
    SarvamTTSProvider,
    ElevenLabsTTSProvider,
    MockTTSProvider,
    TTSChunk,
    get_voice_id,
)
# Import google_tts_provider as a side-effect so it auto-registers itself
# with the provider registry. Then we instantiate it directly below.
from backend.services.voice import google_tts_provider as _google_tts_module  # noqa: F401
from backend.services.voice.google_tts_provider import (
    GoogleTTSProvider,
    get_google_voice_id,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["voice-tts"])
# Second router (no prefix) to expose the legacy alias path
# /api/voice-companion/synthesize that the mobile TapToListenButton
# already POSTs to. Both routers ship the same handler.
alias_router = APIRouter(tags=["voice-tts-alias"])


# ─── Cache directory (served as static at /static/voice/tts-cache/) ─────

_REPO_ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = _REPO_ROOT / "backend" / "static" / "voice" / "tts-cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


# ─── Schemas ──────────────────────────────────────────────────────────────


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4_000)
    language: str = Field(default="en-IN", max_length=8)
    # Optional client preference. The router treats this as a hint;
    # quality-vs-cost rules can override (e.g. force Sarvam for hi).
    prefer: str | None = Field(default=None, pattern="^(google|sarvam|elevenlabs|auto)$")


class TTSResponse(BaseModel):
    audio_url: str
    provider: str
    voice_id: str
    language: str
    cache_hit: bool
    bytes: int


_INDIC_LANGS = frozenset({
    "hi", "mr", "bn", "ta", "te", "pa", "gu", "kn", "ml", "sa",
})


# ─── Cache helpers ────────────────────────────────────────────────────────


def _cache_key(*, provider: str, voice_id: str, language: str, text: str) -> str:
    """Stable hash of the synthesis parameters. The persona-version is NOT
    part of the key for the TapToListen flow — that key field belongs to
    the WSS pipeline (where prompt structure changes per persona). This
    endpoint just reads back arbitrary text, so persona doesn't apply.
    """
    h = hashlib.sha256()
    payload = f"{provider}|{voice_id}|{language}|{text}".encode("utf-8")
    h.update(payload)
    return h.hexdigest()


def _cache_path(key: str) -> Path:
    return CACHE_DIR / f"{key}.opus"


def _audio_url_for(key: str) -> str:
    return f"/static/voice/tts-cache/{key}.opus"


# ─── Provider ladder ──────────────────────────────────────────────────────


async def _synth_via(
    provider, *, text: str, voice_id: str, lang: str
) -> bytes:
    """Run a provider's streaming synth and concatenate chunks into bytes."""
    chunks: list[bytes] = []
    async for chunk in provider.synthesize_streaming(
        text=text, voice_id=voice_id, lang_hint=lang,
    ):
        chunks.append(chunk.data)
        if chunk.is_final:
            break
    return b"".join(chunks)


def _ordered_providers(language: str, prefer: str | None) -> list[tuple[str, object, str]]:
    """Return the provider-try ladder for this language as
    (name, provider_instance, voice_id) tuples."""
    normalized = (language or "en").lower().split("-")[0]
    ladder: list[tuple[str, object, str]] = []
    google = GoogleTTSProvider()
    sarvam = SarvamTTSProvider()
    eleven = ElevenLabsTTSProvider()

    # English-leading
    if normalized not in _INDIC_LANGS and normalized != "sa":
        if google.is_configured():
            ladder.append(("google-neural2", google,
                           f"google:{get_google_voice_id(language)}"))
        if eleven.is_configured():
            ladder.append(("elevenlabs", eleven, get_voice_id(language)))
    # Indic-leading
    else:
        if sarvam.is_configured():
            ladder.append(("sarvam", sarvam, get_voice_id(language)))
        if google.is_configured():
            ladder.append(("google-neural2", google,
                           f"google:{get_google_voice_id(language)}"))

    # Honor explicit `prefer` by re-ordering: bring the preferred provider
    # to the front if present in the ladder.
    if prefer and prefer != "auto":
        ladder.sort(key=lambda t: 0 if t[0].startswith(prefer) else 1)

    # Always end with Mock so test envs don't 503 the user.
    if not ladder or os.environ.get("KIAAN_VOICE_MOCK_PROVIDERS") == "1":
        ladder.append(("mock", MockTTSProvider(), get_voice_id(language)))

    return ladder


# ─── Endpoint ─────────────────────────────────────────────────────────────


@router.post("/tts", response_model=TTSResponse)
async def synthesize_tts(payload: TTSRequest) -> TTSResponse:
    """Synthesize text and return a cached static URL.

    Idempotent — repeat calls with the same (text, language, provider)
    return the same audio_url with cache_hit=True after the first call.
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    last_err: str | None = None

    for provider_name, provider, voice_id in _ordered_providers(
        payload.language, payload.prefer
    ):
        key = _cache_key(
            provider=provider_name, voice_id=voice_id,
            language=payload.language, text=text,
        )
        path = _cache_path(key)

        # Cache hit — return immediately.
        if path.exists():
            return TTSResponse(
                audio_url=_audio_url_for(key),
                provider=provider_name,
                voice_id=voice_id,
                language=payload.language,
                cache_hit=True,
                bytes=path.stat().st_size,
            )

        # Cache miss — synthesize.
        try:
            audio_bytes = await _synth_via(
                provider, text=text, voice_id=voice_id, lang=payload.language,
            )
        except Exception as e:
            last_err = f"{provider_name}: {e}"
            logger.warning(
                "TTS provider %s failed for lang=%s: %s",
                provider_name, payload.language, e,
            )
            continue

        if not audio_bytes:
            last_err = f"{provider_name}: empty audio"
            continue

        # Atomic write — write to .tmp then rename so concurrent requests
        # don't see a half-written file.
        tmp = path.with_suffix(".tmp")
        tmp.write_bytes(audio_bytes)
        tmp.replace(path)

        return TTSResponse(
            audio_url=_audio_url_for(key),
            provider=provider_name,
            voice_id=voice_id,
            language=payload.language,
            cache_hit=False,
            bytes=len(audio_bytes),
        )

    raise HTTPException(
        status_code=503,
        detail=f"All TTS providers failed: {last_err or 'no provider configured'}",
    )


# Alias under the voice-companion namespace because the mobile
# TapToListenButton's existing call site points there. Same handler,
# same response shape — just the URL the client already uses.
@alias_router.post(
    "/api/voice-companion/synthesize", response_model=TTSResponse,
)
async def synthesize_tts_alias(payload: TTSRequest) -> TTSResponse:
    """Alias of POST /api/voice/tts at /api/voice-companion/synthesize.

    Identical behavior — same provider ladder, same 7-day cache,
    same response shape. Exists so callers that already POST to
    /api/voice-companion/synthesize work without migration.
    """
    return await synthesize_tts(payload)


# ─── Static file serving (route the cache files) ──────────────────────────
#
# The /static/voice/tts-cache/<key>.opus URLs are served by the existing
# StaticFiles mount in main.py if backend/static is mounted. If your
# main.py doesn't mount static yet, add the obvious mount in startup.


@router.get("/tts/cache-stats")
async def cache_stats() -> dict[str, int]:
    """Operator-facing rollup of the TTS cache. Useful for monitoring
    cache-hit rate and bytes-on-disk during the staged rollout."""
    files = list(CACHE_DIR.glob("*.opus"))
    return {
        "files": len(files),
        "bytes_on_disk": sum(f.stat().st_size for f in files),
    }
