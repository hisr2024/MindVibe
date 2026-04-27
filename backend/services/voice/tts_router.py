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


class SarvamTTSProvider:
    """Sarvam TTS — Indic + Sanskrit voices.

    Activates when KIAAN_SARVAM_API_KEY is set. Otherwise raises so the
    router falls back to Mock."""

    name = "sarvam"
    supported_languages = frozenset(
        {"hi", "mr", "bn", "ta", "te", "pa", "gu", "kn", "ml", "hi-en", "sa"}
    )

    def __init__(self) -> None:
        self._api_key = os.environ.get("KIAAN_SARVAM_API_KEY")

    def is_configured(self) -> bool:
        return bool(self._api_key)

    def supports_voice(self, voice_id: str) -> bool:
        return voice_id.startswith("sarvam:")

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
        try:
            import sarvamai  # noqa: F401  # type: ignore[import-not-found]
        except ImportError as e:
            raise RuntimeError("sarvamai SDK not installed") from e
        # NOTE: real streaming impl deferred — see stt_router.SarvamSTTProvider
        # for the same rationale.
        if False:  # pragma: no cover — placeholder to satisfy AsyncIterator
            yield TTSChunk(seq=0, data=b"")
        raise NotImplementedError(
            f"SarvamTTSProvider streaming impl not wired "
            f"(text_len={len(text)}, voice_id={voice_id!r}, lang={lang_hint!r})."
        )


class ElevenLabsTTSProvider:
    """ElevenLabs TTS — English voice for Sakha."""

    name = "elevenlabs"
    supported_languages = frozenset({"en", "en-US", "en-GB", "en-IN", "en-AU"})

    def __init__(self) -> None:
        self._api_key = os.environ.get("KIAAN_ELEVENLABS_API_KEY")

    def is_configured(self) -> bool:
        return bool(self._api_key)

    def supports_voice(self, voice_id: str) -> bool:
        return voice_id.startswith("elevenlabs:")

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
        try:
            import elevenlabs  # noqa: F401  # type: ignore[import-not-found]
        except ImportError as e:
            raise RuntimeError("elevenlabs SDK not installed") from e
        if False:  # pragma: no cover
            yield TTSChunk(seq=0, data=b"")
        raise NotImplementedError(
            f"ElevenLabsTTSProvider streaming impl not wired "
            f"(text_len={len(text)}, voice_id={voice_id!r}, lang={lang_hint!r})."
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

        if normalized in _INDIC_LANGS_TTS:
            sarvam = SarvamTTSProvider()
            if sarvam.is_configured():
                return TTSRouterDecision(
                    provider_name=sarvam.name,
                    voice_id=voice_id,
                    reason=f"indic lang {lang_hint!r} → Sarvam",
                    fell_back_to_mock=False,
                )
            return TTSRouterDecision(
                provider_name="mock",
                voice_id=voice_id,
                reason="Sarvam not configured → mock fallback",
                fell_back_to_mock=True,
            )

        eleven = ElevenLabsTTSProvider()
        if eleven.is_configured():
            return TTSRouterDecision(
                provider_name=eleven.name,
                voice_id=voice_id,
                reason=f"english lang {lang_hint!r} → ElevenLabs",
                fell_back_to_mock=False,
            )
        return TTSRouterDecision(
            provider_name="mock",
            voice_id=voice_id,
            reason="ElevenLabs not configured → mock fallback",
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
