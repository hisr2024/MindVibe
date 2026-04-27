"""Voice provider registry — extensibility seam for STT/TTS/LLM providers.

The built-in providers (Mock, Sarvam, ElevenLabs, Deepgram, OpenAI) are
hardwired into their respective routers. This registry lets ops or
plugins add new providers without touching router code.

Usage — adding a future Google TTS provider:

    # backend/services/voice/providers/google_tts.py
    from backend.services.voice.tts_router import TTSProvider, TTSChunk
    from backend.services.voice.provider_registry import register_tts_provider

    class GoogleTTSProvider:
        name = "google"
        supported_languages = frozenset({"en", "hi", ...})
        def is_configured(self): return bool(os.environ.get("GOOGLE_TTS_KEY"))
        def supports_voice(self, vid): return vid.startswith("google:")
        async def synthesize_streaming(self, *, text, voice_id, lang_hint): ...

    register_tts_provider("google", GoogleTTSProvider, voice_prefix="google:")

Then import the module once at startup so the registration runs:

    # backend/main.py
    from backend.services.voice.providers import google_tts  # noqa: F401

The router will pick GoogleTTSProvider when a voice_id starts with
'google:' and the provider's is_configured() returns True.

Registration is idempotent — re-registering the same name overwrites the
previous entry (useful for tests).
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from typing import Any, Callable

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RegisteredProvider:
    """Metadata for a registered provider class."""

    name: str
    factory: Callable[[], Any]
    voice_prefix: str | None  # for TTS — prefix that this provider claims
    languages: frozenset[str]


class _Registry:
    """Thread-safe registry per provider kind (stt / tts / llm)."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._stt: dict[str, RegisteredProvider] = {}
        self._tts: dict[str, RegisteredProvider] = {}
        self._llm: dict[str, RegisteredProvider] = {}

    def _bucket(self, kind: str) -> dict[str, RegisteredProvider]:
        if kind == "stt":
            return self._stt
        if kind == "tts":
            return self._tts
        if kind == "llm":
            return self._llm
        raise ValueError(f"unknown provider kind {kind!r}")

    def register(
        self,
        kind: str,
        name: str,
        factory: Callable[[], Any],
        *,
        voice_prefix: str | None = None,
        languages: frozenset[str] | None = None,
    ) -> None:
        with self._lock:
            self._bucket(kind)[name] = RegisteredProvider(
                name=name,
                factory=factory,
                voice_prefix=voice_prefix,
                languages=languages or frozenset(),
            )
        logger.info(
            "voice.provider.registered kind=%s name=%s prefix=%r langs=%d",
            kind, name, voice_prefix, len(languages) if languages else 0,
        )

    def unregister(self, kind: str, name: str) -> None:
        with self._lock:
            self._bucket(kind).pop(name, None)

    def get(self, kind: str, name: str) -> RegisteredProvider | None:
        with self._lock:
            return self._bucket(kind).get(name)

    def all(self, kind: str) -> list[RegisteredProvider]:
        with self._lock:
            return list(self._bucket(kind).values())

    def find_by_voice_prefix(
        self, kind: str, voice_id: str,
    ) -> RegisteredProvider | None:
        """Find a provider whose voice_prefix matches the start of voice_id."""
        with self._lock:
            for p in self._bucket(kind).values():
                if p.voice_prefix and voice_id.startswith(p.voice_prefix):
                    return p
        return None

    def find_by_language(
        self, kind: str, lang_hint: str,
    ) -> RegisteredProvider | None:
        """Find the first provider that declares support for lang_hint."""
        normalized = (lang_hint or "").lower()
        primary = normalized.split("-")[0]
        with self._lock:
            for p in self._bucket(kind).values():
                if not p.languages:
                    continue
                if normalized in p.languages or primary in p.languages:
                    return p
        return None

    def reset(self) -> None:
        """Test-only — clear every registered provider."""
        with self._lock:
            self._stt.clear()
            self._tts.clear()
            self._llm.clear()


_registry = _Registry()


# ─── Public API ───────────────────────────────────────────────────────────


def register_stt_provider(
    name: str,
    factory: Callable[[], Any],
    *,
    languages: frozenset[str] | None = None,
) -> None:
    """Register an STT provider for use by STTRouter."""
    _registry.register("stt", name, factory, languages=languages)


def register_tts_provider(
    name: str,
    factory: Callable[[], Any],
    *,
    voice_prefix: str,
    languages: frozenset[str] | None = None,
) -> None:
    """Register a TTS provider for use by TTSRouter.

    voice_prefix is required because TTSRouter dispatches by voice_id
    (e.g. 'google:standard-en-IN-Wavenet-A').
    """
    _registry.register(
        "tts", name, factory, voice_prefix=voice_prefix, languages=languages,
    )


def register_llm_provider(
    name: str, factory: Callable[[], Any],
) -> None:
    """Register an LLM provider for use by LLMRouter."""
    _registry.register("llm", name, factory)


def get_provider(kind: str, name: str) -> RegisteredProvider | None:
    return _registry.get(kind, name)


def all_providers(kind: str) -> list[RegisteredProvider]:
    return _registry.all(kind)


def find_provider_by_voice_prefix(
    kind: str, voice_id: str,
) -> RegisteredProvider | None:
    return _registry.find_by_voice_prefix(kind, voice_id)


def find_provider_by_language(
    kind: str, lang_hint: str,
) -> RegisteredProvider | None:
    return _registry.find_by_language(kind, lang_hint)


def _reset_registry_for_tests() -> None:
    _registry.reset()


__all__ = [
    "RegisteredProvider",
    "register_stt_provider",
    "register_tts_provider",
    "register_llm_provider",
    "get_provider",
    "all_providers",
    "find_provider_by_voice_prefix",
    "find_provider_by_language",
    "_reset_registry_for_tests",
]
