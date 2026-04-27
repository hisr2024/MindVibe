"""TTS router + audio cache — server-side text-to-speech for Sakha.

Spec routing rule:
  • Sanskrit + Indic-language segments → Sarvam (locked voice IDs per language)
  • English segments                    → ElevenLabs (locked voice ID)
  • Fallback (provider down or no key)   → Edge TTS / Mock

Sentence-boundary chunking: the orchestrator hands one sentence at a time to
synthesize_streaming() so the WSS handler can stream audio.chunk frames as
soon as the first chunk lands, hitting the 1.2s first-byte budget.

Cache key construction (CRITICAL — never includes raw user text):

    sha256(
        verse_refs_sorted    # the verses retrieved for this turn
        + mood_label         # e.g. "anxious"
        + render_mode        # "voice" | "text"
        + lang_hint          # "en" | "hi" | …
        + voice_id           # locked per language
        + persona_version    # "1.0.0"
    )

The cache holds the rendered Sakha response audio for 7 days. Cache hits
shortcut the LLM call entirely — first audio byte ≤ 500ms.

NO REAL NETWORK CALLS without explicit env-var opt-in:
  • KIAAN_SARVAM_API_KEY      → SarvamTTSProvider
  • KIAAN_ELEVENLABS_API_KEY  → ElevenLabsTTSProvider
  • Otherwise, MockTTSProvider returns a small deterministic Opus-shaped blob.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol

logger = logging.getLogger(__name__)


# ─── Voice ID registry (locked per spec) ──────────────────────────────────
# These IDs are placeholders until ops sets the real Sarvam / ElevenLabs IDs
# in the env. The spec says "Lock Sarvam voice IDs per language; lock
# ElevenLabs English voice ID" in Week 1 of the rollout. We read overrides
# from env so that lock can be done without a code change.

DEFAULT_VOICE_IDS: dict[str, str] = {
    "en": "elevenlabs:sakha-en-v1",
    "hi": "sarvam:meera",
    "mr": "sarvam:meera",
    "bn": "sarvam:meera",
    "ta": "sarvam:meera",
    "te": "sarvam:meera",
    "pa": "sarvam:meera",
    "gu": "sarvam:meera",
    "kn": "sarvam:meera",
    "ml": "sarvam:meera",
    "hi-en": "sarvam:meera",
    "sa": "sarvam:meera",  # Sanskrit — same voice as Hindi for now
}


def get_voice_id(lang_hint: str) -> str:
    """Resolve the locked voice_id for a language. Env override wins so ops
    can rotate voice IDs without redeploying code:

        KIAAN_VOICE_ID_EN=elevenlabs:abc
        KIAAN_VOICE_ID_HI=sarvam:xyz

    Falls back to English if the language is unknown."""
    normalized = (lang_hint or "en").lower().split("-")[0]
    env_key = f"KIAAN_VOICE_ID_{normalized.upper()}"
    return os.environ.get(env_key) or DEFAULT_VOICE_IDS.get(normalized) or DEFAULT_VOICE_IDS["en"]


# ─── TTS chunk type ───────────────────────────────────────────────────────


@dataclass(frozen=True)
class TTSChunk:
    """One audio chunk on the way to the WSS audio.chunk frame.

    `mime` is always "audio/opus" in production; mock providers may return
    any deterministic blob — the test asserts the bytes round-trip
    correctly through base64.
    """

    seq: int
    data: bytes
    mime: str = "audio/opus"
    is_final: bool = False
    elapsed_ms: int = 0


# ─── Provider interface ───────────────────────────────────────────────────


class TTSProvider(Protocol):
    """Streaming TTS provider.

    Lifecycle: synthesize_streaming(text, voice_id, lang_hint) yields N
    TTSChunk objects. The last one has is_final=True. After is_final no
    more chunks are produced.
    """

    name: str
    supported_languages: frozenset[str]

    def supports_voice(self, voice_id: str) -> bool: ...

    async def synthesize_streaming(
        self,
        *,
        text: str,
        voice_id: str,
        lang_hint: str,
    ) -> AsyncIterator[TTSChunk]: ...


# ─── Mock provider (deterministic) ────────────────────────────────────────


class MockTTSProvider:
    """Deterministic TTS that emits a tiny Opus-shaped blob per sentence.

    The bytes themselves are not playable Opus — they are a hash of the
    input text. Tests use them to verify chunk ordering, cache key safety,
    and end-of-stream signaling without needing a real audio decoder.
    """

    name = "mock"
    supported_languages = frozenset(DEFAULT_VOICE_IDS.keys())

    # Class-level chunk count for tests that want to bound how many chunks
    # the mock emits per sentence.
    chunks_per_sentence: int = 3

    def supports_voice(self, voice_id: str) -> bool:
        return voice_id.startswith(("mock:", "elevenlabs:", "sarvam:", "edge:"))

    async def synthesize_streaming(
        self,
        *,
        text: str,
        voice_id: str,
        lang_hint: str,
    ) -> AsyncIterator[TTSChunk]:
        if not text:
            return
        started = time.monotonic()
        digest = hashlib.sha256(
            f"{voice_id}|{lang_hint}|{text}".encode()
        ).digest()
        # Emit chunks_per_sentence chunks, each 32 bytes derived from the
        # digest. Final chunk is_final=True.
        for i in range(self.chunks_per_sentence):
            data = digest[(i * 8) % 32 : (i * 8) % 32 + 32]
            elapsed = int((time.monotonic() - started) * 1000)
            yield TTSChunk(
                seq=i,
                data=bytes(data),
                mime="audio/opus",
                is_final=(i == self.chunks_per_sentence - 1),
                elapsed_ms=elapsed,
            )
            # Tiny yield so concurrent tasks see progress
            await asyncio.sleep(0)


# ─── Real provider stubs ──────────────────────────────────────────────────


_SARVAM_BASE_URL = os.environ.get(
    "KIAAN_SARVAM_BASE_URL", "https://api.sarvam.ai"
)
_SARVAM_TTS_MODEL = os.environ.get("KIAAN_SARVAM_TTS_MODEL", "bulbul:v2")
_SARVAM_TTS_HTTP_TIMEOUT_S = float(
    os.environ.get("KIAAN_SARVAM_HTTP_TIMEOUT_S", "30.0")
)
_SARVAM_TTS_CHUNK_BYTES = int(
    os.environ.get("KIAAN_SARVAM_CHUNK_BYTES", "32768")
)

# Sarvam expects ISO-639-1 plus a region code. Map our short lang_hints.
_SARVAM_LANG_CODE: dict[str, str] = {
    "hi": "hi-IN",
    "mr": "mr-IN",
    "bn": "bn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "pa": "pa-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "sa": "sa-IN",
    "hi-en": "hi-IN",  # code-mixed English-in-Hindi → Hindi voice
}


class SarvamTTSProvider:
    """Sarvam TTS — Indic + Sanskrit voices.

    Sarvam's TTS endpoint is a non-streaming REST call: it returns the
    whole synthesized audio as base64 in a JSON body. We re-chunk that
    audio into TTSChunks of ~32KB each so downstream consumers (WSS
    audio.chunk frames) see the same shape they'd see from a true
    streaming provider.

    voice_id format: 'sarvam:<speaker_name>' (e.g. 'sarvam:meera').
    """

    name = "sarvam"
    supported_languages = frozenset(_SARVAM_LANG_CODE.keys())

    def __init__(self) -> None:
        self._api_key = os.environ.get("KIAAN_SARVAM_API_KEY")

    def is_configured(self) -> bool:
        return bool(self._api_key)

    def supports_voice(self, voice_id: str) -> bool:
        return voice_id.startswith("sarvam:")

    @staticmethod
    def _parse_voice_id(voice_id: str) -> str:
        if ":" not in voice_id:
            raise ValueError(
                f"SarvamTTSProvider: voice_id missing 'sarvam:' prefix: {voice_id!r}"
            )
        prefix, _, raw = voice_id.partition(":")
        if prefix != "sarvam" or not raw:
            raise ValueError(
                f"SarvamTTSProvider: malformed voice_id {voice_id!r} "
                f"(expected 'sarvam:<speaker>')"
            )
        return raw

    @staticmethod
    def _lang_code(lang_hint: str) -> str:
        normalized = (lang_hint or "hi").lower()
        return _SARVAM_LANG_CODE.get(normalized, _SARVAM_LANG_CODE.get(
            normalized.split("-")[0], "hi-IN"
        ))

    async def synthesize_streaming(
        self,
        *,
        text: str,
        voice_id: str,
        lang_hint: str,
    ) -> AsyncIterator[TTSChunk]:
        if not self._api_key:
            raise RuntimeError(
                f"SarvamTTSProvider: KIAAN_SARVAM_API_KEY not set "
                f"(text_len={len(text)}, voice_id={voice_id!r}, lang={lang_hint!r})."
            )
        if not text:
            return

        try:
            import httpx  # type: ignore[import-not-found]
        except ImportError as e:  # pragma: no cover
            raise RuntimeError("httpx not installed") from e

        speaker = self._parse_voice_id(voice_id)
        url = f"{_SARVAM_BASE_URL.rstrip('/')}/text-to-speech"
        headers = {
            "api-subscription-key": self._api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": [text],
            "target_language_code": self._lang_code(lang_hint),
            "speaker": speaker,
            "model": _SARVAM_TTS_MODEL,
            "audio_response_format": "wav",
            "speech_sample_rate": 22050,
            "enable_preprocessing": True,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.0,
        }

        started = time.monotonic()
        timeout = httpx.Timeout(
            connect=10.0,
            read=_SARVAM_TTS_HTTP_TIMEOUT_S,
            write=10.0,
            pool=10.0,
        )

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                body = resp.text[:500]
                raise RuntimeError(
                    f"SarvamTTSProvider: HTTP {resp.status_code} "
                    f"speaker={speaker!r} body={body!r}"
                )
            data = resp.json()

        audios = data.get("audios") or []
        if not audios:
            raise RuntimeError(
                f"SarvamTTSProvider: empty 'audios' in response keys={list(data.keys())}"
            )

        # Decode + concatenate every clip in audios (typically just one).
        wav_bytes = bytearray()
        import base64 as _b64
        for clip_b64 in audios:
            wav_bytes.extend(_b64.b64decode(clip_b64))

        # Chunk the WAV into TTSChunks. Mark the final chunk is_final=True.
        seq = 0
        view = bytes(wav_bytes)
        total = len(view)
        offset = 0
        while offset < total:
            end = min(offset + _SARVAM_TTS_CHUNK_BYTES, total)
            piece = view[offset:end]
            elapsed = int((time.monotonic() - started) * 1000)
            yield TTSChunk(
                seq=seq, data=piece,
                mime="audio/wav", is_final=(end == total),
                elapsed_ms=elapsed,
            )
            seq += 1
            offset = end


_ELEVENLABS_BASE_URL = os.environ.get(
    "KIAAN_ELEVENLABS_BASE_URL", "https://api.elevenlabs.io"
)
_ELEVENLABS_DEFAULT_MODEL = os.environ.get(
    "KIAAN_ELEVENLABS_MODEL", "eleven_turbo_v2_5"
)
_ELEVENLABS_OUTPUT_FORMAT = os.environ.get(
    "KIAAN_ELEVENLABS_OUTPUT_FORMAT", "opus_24000_64"
)
_ELEVENLABS_HTTP_TIMEOUT_S = float(
    os.environ.get("KIAAN_ELEVENLABS_HTTP_TIMEOUT_S", "30.0")
)
_ELEVENLABS_CHUNK_BYTES = int(
    os.environ.get("KIAAN_ELEVENLABS_CHUNK_BYTES", "16384")
)


class ElevenLabsTTSProvider:
    """ElevenLabs streaming TTS for English Sakha voices.

    Calls /v1/text-to-speech/{voice_id}/stream with audio/opus output and
    yields TTSChunks as bytes arrive over the HTTP stream. The voice_id
    is parsed as 'elevenlabs:<elevenlabs_voice_id>' — anything before the
    colon is the routing prefix; anything after is sent verbatim to
    ElevenLabs.
    """

    name = "elevenlabs"
    supported_languages = frozenset({"en", "en-US", "en-GB", "en-IN", "en-AU"})

    def __init__(self) -> None:
        self._api_key = os.environ.get("KIAAN_ELEVENLABS_API_KEY")

    def is_configured(self) -> bool:
        return bool(self._api_key)

    def supports_voice(self, voice_id: str) -> bool:
        return voice_id.startswith("elevenlabs:")

    @staticmethod
    def _parse_voice_id(voice_id: str) -> str:
        """Strip the 'elevenlabs:' prefix, return the raw provider voice_id."""
        if ":" not in voice_id:
            raise ValueError(
                f"ElevenLabsTTSProvider: voice_id missing 'elevenlabs:' prefix: {voice_id!r}"
            )
        prefix, _, raw = voice_id.partition(":")
        if prefix != "elevenlabs" or not raw:
            raise ValueError(
                f"ElevenLabsTTSProvider: malformed voice_id {voice_id!r} "
                f"(expected 'elevenlabs:<id>')"
            )
        return raw

    async def synthesize_streaming(
        self,
        *,
        text: str,
        voice_id: str,
        lang_hint: str,
    ) -> AsyncIterator[TTSChunk]:
        if not self._api_key:
            raise RuntimeError(
                f"ElevenLabsTTSProvider: KIAAN_ELEVENLABS_API_KEY not set "
                f"(text_len={len(text)}, voice_id={voice_id!r}, lang={lang_hint!r})."
            )
        if not text:
            return

        try:
            import httpx  # type: ignore[import-not-found]
        except ImportError as e:  # pragma: no cover — httpx is in requirements.txt
            raise RuntimeError("httpx not installed") from e

        eleven_voice_id = self._parse_voice_id(voice_id)
        url = (
            f"{_ELEVENLABS_BASE_URL.rstrip('/')}/v1/text-to-speech/"
            f"{eleven_voice_id}/stream"
            f"?output_format={_ELEVENLABS_OUTPUT_FORMAT}"
        )
        headers = {
            "xi-api-key": self._api_key,
            "Accept": "audio/ogg",
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "model_id": _ELEVENLABS_DEFAULT_MODEL,
            "voice_settings": {
                "stability": 0.55,
                "similarity_boost": 0.75,
                "style": 0.20,
                "use_speaker_boost": True,
            },
        }

        started = time.monotonic()
        seq = 0
        timeout = httpx.Timeout(
            connect=10.0,
            read=_ELEVENLABS_HTTP_TIMEOUT_S,
            write=10.0,
            pool=10.0,
        )

        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST", url, headers=headers, json=payload,
            ) as resp:
                if resp.status_code != 200:
                    body = (await resp.aread()).decode(errors="replace")[:500]
                    raise RuntimeError(
                        f"ElevenLabsTTSProvider: HTTP {resp.status_code} "
                        f"voice_id={eleven_voice_id!r} body={body!r}"
                    )
                buffer = bytearray()
                async for raw in resp.aiter_bytes(_ELEVENLABS_CHUNK_BYTES):
                    if not raw:
                        continue
                    buffer.extend(raw)
                    while len(buffer) >= _ELEVENLABS_CHUNK_BYTES:
                        chunk_data = bytes(buffer[:_ELEVENLABS_CHUNK_BYTES])
                        del buffer[:_ELEVENLABS_CHUNK_BYTES]
                        elapsed = int((time.monotonic() - started) * 1000)
                        yield TTSChunk(
                            seq=seq, data=chunk_data,
                            mime="audio/opus", is_final=False,
                            elapsed_ms=elapsed,
                        )
                        seq += 1
                # Flush any remainder as the final chunk
                elapsed = int((time.monotonic() - started) * 1000)
                yield TTSChunk(
                    seq=seq, data=bytes(buffer),
                    mime="audio/opus", is_final=True,
                    elapsed_ms=elapsed,
                )


# ─── Audio cache ──────────────────────────────────────────────────────────


CACHE_TTL_SECONDS = 7 * 24 * 3600


@dataclass
class _CacheEntry:
    chunks: list[TTSChunk]
    inserted_at: float
    persona_version: str


class AudioCache:
    """In-memory audio cache with safe key construction.

    The interface is Redis-ready: subclassing or composition can swap the
    backing dict for redis.set/get with the same TTL semantics. The point
    is that the *key construction* is identical no matter the backend, and
    the key NEVER includes raw user text.
    """

    def __init__(self, *, max_entries: int = 1024) -> None:
        self._entries: dict[str, _CacheEntry] = {}
        self._max_entries = max_entries
        self._hits = 0
        self._misses = 0

    @staticmethod
    def build_key(
        *,
        verse_refs: list[str],
        mood_label: str,
        render_mode: str,
        lang_hint: str,
        voice_id: str,
        persona_version: str,
    ) -> str:
        """Build a cache key from the orchestrator's per-turn context.

        IMPORTANT: this signature defines what determines a cache match.
        Adding a new dimension (e.g. user_tier) requires bumping the
        persona-version OR clearing the cache, otherwise stale audio leaks
        across the new dimension.

        The key is a sha256 hex digest. We sort verse_refs to make the key
        commutative on the verse list — order in the LLM prompt matters
        for prosody, but the cached *audio* sounds the same.
        """
        material = "|".join([
            "v1",  # cache schema — bump if structure changes
            persona_version,
            render_mode,
            lang_hint,
            voice_id,
            mood_label,
            ",".join(sorted(verse_refs)),
        ])
        return hashlib.sha256(material.encode()).hexdigest()

    def get(self, key: str) -> list[TTSChunk] | None:
        entry = self._entries.get(key)
        if entry is None:
            self._misses += 1
            return None
        if time.time() - entry.inserted_at > CACHE_TTL_SECONDS:
            # Expired — drop and miss
            del self._entries[key]
            self._misses += 1
            return None
        self._hits += 1
        return entry.chunks

    def put(
        self,
        key: str,
        chunks: list[TTSChunk],
        *,
        persona_version: str,
    ) -> None:
        # Enforce capacity (simple FIFO — good enough until we move to Redis)
        if len(self._entries) >= self._max_entries:
            # Drop oldest 10% to amortize eviction cost
            drop_count = max(1, self._max_entries // 10)
            oldest = sorted(
                self._entries.items(), key=lambda kv: kv[1].inserted_at
            )[:drop_count]
            for k, _ in oldest:
                del self._entries[k]
        self._entries[key] = _CacheEntry(
            chunks=list(chunks),
            inserted_at=time.time(),
            persona_version=persona_version,
        )

    def stats(self) -> dict[str, int | float | None]:
        total = self._hits + self._misses
        return {
            "entries": len(self._entries),
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total, 3) if total > 0 else None,
            "max_entries": self._max_entries,
        }

    def clear(self) -> None:
        self._entries.clear()
        self._hits = 0
        self._misses = 0


# ─── Router ───────────────────────────────────────────────────────────────


@dataclass
class TTSRouterDecision:
    provider_name: str
    voice_id: str
    reason: str
    fell_back_to_mock: bool


_INDIC_LANGS_TTS: frozenset[str] = frozenset(
    {"hi", "mr", "bn", "ta", "te", "pa", "gu", "kn", "ml", "hi-en", "sa"}
)


class TTSRouter:
    """Picks the right TTS provider per language and routes synth requests.

    Wraps the AudioCache. Callers normally use synthesize_with_cache() so
    cache lookup is automatic.
    """

    def __init__(self, *, cache: AudioCache | None = None) -> None:
        self._mock_forced = os.environ.get("KIAAN_VOICE_MOCK_PROVIDERS") == "1"
        self._cache = cache or AudioCache()

    @property
    def cache(self) -> AudioCache:
        return self._cache

    @property
    def is_mock_only(self) -> bool:
        return self._mock_forced

    def decide(self, lang_hint: str) -> TTSRouterDecision:
        normalized = (lang_hint or "en").lower().split("-")[0]
        voice_id = get_voice_id(lang_hint)

        if self._mock_forced:
            return TTSRouterDecision(
                provider_name="mock",
                voice_id=voice_id,
                reason="KIAAN_VOICE_MOCK_PROVIDERS=1 (forced)",
                fell_back_to_mock=False,
            )

        # Built-in routing: Indic→Sarvam, English→ElevenLabs.
        if normalized in _INDIC_LANGS_TTS:
            sarvam = SarvamTTSProvider()
            if sarvam.is_configured():
                return TTSRouterDecision(
                    provider_name=sarvam.name,
                    voice_id=voice_id,
                    reason=f"indic lang {lang_hint!r} → Sarvam",
                    fell_back_to_mock=False,
                )
        else:
            eleven = ElevenLabsTTSProvider()
            if eleven.is_configured():
                return TTSRouterDecision(
                    provider_name=eleven.name,
                    voice_id=voice_id,
                    reason=f"english lang {lang_hint!r} → ElevenLabs",
                    fell_back_to_mock=False,
                )

        # Registry fallthrough — let plugin providers claim the lang.
        from backend.services.voice.provider_registry import (
            find_provider_by_voice_prefix,
            find_provider_by_language,
        )
        registered = find_provider_by_voice_prefix("tts", voice_id) \
            or find_provider_by_language("tts", lang_hint)
        if registered is not None:
            try:
                inst = registered.factory()
                if getattr(inst, "is_configured", lambda: True)():
                    return TTSRouterDecision(
                        provider_name=registered.name,
                        voice_id=voice_id,
                        reason=f"registered provider {registered.name!r}",
                        fell_back_to_mock=False,
                    )
            except Exception as e:
                logger.warning(
                    "voice.tts.registered.factory_failed name=%s err=%s",
                    registered.name, e,
                )

        return TTSRouterDecision(
            provider_name="mock",
            voice_id=voice_id,
            reason=(
                f"no configured provider for lang {lang_hint!r} "
                f"→ mock fallback"
            ),
            fell_back_to_mock=True,
        )

    def build_provider(self, lang_hint: str) -> tuple[TTSProvider, TTSRouterDecision]:
        decision = self.decide(lang_hint)
        if decision.provider_name == "mock":
            return MockTTSProvider(), decision
        if decision.provider_name == "sarvam":
            return SarvamTTSProvider(), decision
        if decision.provider_name == "elevenlabs":
            return ElevenLabsTTSProvider(), decision

        # Registry-backed provider
        from backend.services.voice.provider_registry import get_provider
        registered = get_provider("tts", decision.provider_name)
        if registered is not None:
            try:
                return registered.factory(), decision
            except Exception as e:  # pragma: no cover — defensive
                logger.error(
                    "voice.tts.registered.build_failed name=%s err=%s",
                    decision.provider_name, e,
                )

        logger.error(
            "TTSRouter: unknown provider %r — falling back to mock",
            decision.provider_name,
        )
        return MockTTSProvider(), TTSRouterDecision(
            provider_name="mock",
            voice_id=decision.voice_id,
            reason=f"unknown provider {decision.provider_name!r}",
            fell_back_to_mock=True,
        )

    async def synthesize_with_cache(
        self,
        *,
        text: str,
        lang_hint: str,
        verse_refs: list[str],
        mood_label: str,
        render_mode: str,
        persona_version: str,
    ) -> tuple[list[TTSChunk], bool, TTSRouterDecision]:
        """Synthesize text with cache lookup.

        Returns (chunks, cache_hit, decision). If the cache had a hit, the
        chunks are returned without invoking the provider. Otherwise the
        provider is called and the result is cached before return.
        """
        decision = self.decide(lang_hint)
        key = AudioCache.build_key(
            verse_refs=verse_refs,
            mood_label=mood_label,
            render_mode=render_mode,
            lang_hint=lang_hint,
            voice_id=decision.voice_id,
            persona_version=persona_version,
        )
        cached = self._cache.get(key)
        if cached is not None:
            return cached, True, decision

        provider, _ = self.build_provider(lang_hint)
        chunks: list[TTSChunk] = []
        async for chunk in provider.synthesize_streaming(
            text=text, voice_id=decision.voice_id, lang_hint=lang_hint,
        ):
            chunks.append(chunk)
        self._cache.put(key, chunks, persona_version=persona_version)
        return chunks, False, decision


# ─── Singleton ────────────────────────────────────────────────────────────


_router_instance: TTSRouter | None = None


def get_tts_router() -> TTSRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = TTSRouter()
    return _router_instance


__all__ = [
    "TTSChunk",
    "TTSProvider",
    "TTSRouter",
    "TTSRouterDecision",
    "MockTTSProvider",
    "SarvamTTSProvider",
    "ElevenLabsTTSProvider",
    "AudioCache",
    "CACHE_TTL_SECONDS",
    "DEFAULT_VOICE_IDS",
    "get_voice_id",
    "get_tts_router",
]
