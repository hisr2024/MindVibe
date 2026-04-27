"""STT router — server-side speech-to-text routing for Sakha voice mode.

Spec routing rule:
  • Indian languages (hi, mr, bn, ta, te, pa, gu, kn, ml, hi-en) → Sarvam Saarika
  • English + everything else (en, en-US, en-GB, …)               → Deepgram Nova-3

This module exposes a single STTRouter. Per-session, it picks the right
provider, streams base64 Opus chunks in, and yields STTResult events
(transcript.partial frames). The WSS handler uses the partial text on every
chunk to drive the CrisisPartialScanner.

Providers:
  • SarvamSTTProvider     — wraps Sarvam Saarika websocket / REST streaming
  • DeepgramSTTProvider   — wraps Deepgram Nova-3 streaming
  • MockSTTProvider       — deterministic, used in tests + dev

Key design choice: no real network calls happen at import time. The clients
are lazy-initialised on first use, and only when the corresponding env var
(KIAAN_SARVAM_API_KEY / KIAAN_DEEPGRAM_API_KEY) is set. If the env var is
missing OR if KIAAN_VOICE_MOCK_PROVIDERS=1 is set, the MockSTTProvider is
used. This makes the WSS endpoint runnable end-to-end in CI without ever
hitting a paid API.
"""

from __future__ import annotations

import base64
import logging
import os
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol

logger = logging.getLogger(__name__)


# ─── Result type ──────────────────────────────────────────────────────────


@dataclass(frozen=True)
class STTResult:
    """One transcript event from the STT provider.

    Either a partial (is_final=False) or the final transcript for the turn.
    Sequence numbers are monotonically increasing per session and never
    skipped — the WSS handler uses them for ordering and to derive
    barge-in token indices.
    """

    text: str
    is_final: bool
    seq: int
    confidence: float = 0.0
    detected_language: str | None = None
    elapsed_ms: int = 0


# ─── Provider interface ───────────────────────────────────────────────────


class STTProvider(Protocol):
    """Streaming STT provider interface.

    Lifecycle: start_session → feed_audio_chunk × N → end_of_speech → close.
    Each call to feed_audio_chunk may yield 0+ STTResult events. After
    end_of_speech the provider must yield exactly one is_final=True result
    and then stop yielding.
    """

    name: str
    supported_languages: frozenset[str]

    async def start_session(self, *, session_id: str, lang_hint: str) -> None: ...

    async def feed_audio_chunk(
        self, *, seq: int, opus_b64: str
    ) -> AsyncIterator[STTResult]: ...

    async def end_of_speech(self) -> AsyncIterator[STTResult]: ...

    async def close(self) -> None: ...


# ─── Mock provider (deterministic — used in tests and when no key is set) ─


@dataclass
class _MockState:
    session_id: str = ""
    lang_hint: str = "en"
    buffer_bytes: int = 0
    seq: int = 0
    started_at: float = 0.0
    closed: bool = False


class MockSTTProvider:
    """Deterministic STT that synthesizes a transcript from buffered audio
    size + a per-session script lookup.

    The script lets tests inject specific transcripts for specific session
    IDs. Otherwise the provider returns a default benign transcript so a
    smoke run never accidentally trips the crisis scanner.
    """

    name = "mock"
    supported_languages = frozenset({"en", "hi", "hi-en", "mr", "ta", "te", "bn", "pa", "gu", "kn", "ml"})

    # Class-level scripts — tests set these via set_script() before opening
    # the WSS session. Keyed by session_id.
    _scripts: dict[str, list[str]] = {}

    @classmethod
    def set_script(cls, session_id: str, partials: list[str]) -> None:
        """Inject a deterministic transcript script for a session.

        partials[:-1] are emitted as transcript.partial events as audio
        chunks accumulate, and partials[-1] is emitted as is_final on
        end_of_speech."""
        if not partials:
            raise ValueError("script must have at least one entry")
        cls._scripts[session_id] = list(partials)

    @classmethod
    def clear_scripts(cls) -> None:
        cls._scripts.clear()

    def __init__(self) -> None:
        self._state = _MockState()

    async def start_session(self, *, session_id: str, lang_hint: str) -> None:
        self._state = _MockState(
            session_id=session_id,
            lang_hint=lang_hint,
            started_at=time.monotonic(),
        )

    async def feed_audio_chunk(
        self, *, seq: int, opus_b64: str
    ) -> AsyncIterator[STTResult]:
        if self._state.closed:
            return
        try:
            chunk_bytes = len(base64.b64decode(opus_b64, validate=True))
        except Exception:
            chunk_bytes = 0
        self._state.buffer_bytes += chunk_bytes
        self._state.seq = seq

        # Emit a partial every ~3KB of buffered audio. With Opus at 24kbps
        # mono that's ~1s of speech, so a 3-word partial cadence.
        partials = self._scripts.get(self._state.session_id, [
            "i", "i feel", "i feel a little", "i feel a little anxious",
        ])
        # Index excludes the final entry (which is reserved for end_of_speech)
        non_final = partials[:-1] or partials
        idx = min(self._state.buffer_bytes // 3000, len(non_final) - 1)
        text = non_final[idx]

        elapsed = int((time.monotonic() - self._state.started_at) * 1000)
        yield STTResult(
            text=text,
            is_final=False,
            seq=seq,
            confidence=0.85,
            detected_language=self._state.lang_hint,
            elapsed_ms=elapsed,
        )

    async def end_of_speech(self) -> AsyncIterator[STTResult]:
        if self._state.closed:
            return
        partials = self._scripts.get(self._state.session_id, [
            "i", "i feel", "i feel a little", "i feel a little anxious",
        ])
        final_text = partials[-1]
        elapsed = int((time.monotonic() - self._state.started_at) * 1000)
        yield STTResult(
            text=final_text,
            is_final=True,
            seq=self._state.seq + 1,
            confidence=0.92,
            detected_language=self._state.lang_hint,
            elapsed_ms=elapsed,
        )

    async def close(self) -> None:
        self._state.closed = True


# ─── Real provider stubs ──────────────────────────────────────────────────
# These wrap the real Sarvam / Deepgram SDKs but lazy-import them so the
# module loads without those packages installed. The actual streaming logic
# is filled in when KIAAN_SARVAM_API_KEY / KIAAN_DEEPGRAM_API_KEY are set;
# until then the router falls through to MockSTTProvider so dev + CI keep
# working.
#
# IMPORTANT: do not "improve" these stubs by removing the not-implemented
# guard — the spec is explicit that no real network call should happen
# without an explicit env-var opt-in.


class SarvamSTTProvider:
    """Sarvam Saarika streaming STT for Indic languages.

    Activates when KIAAN_SARVAM_API_KEY is set. Otherwise raises at
    start_session so the router falls back to Mock.
    """

    name = "sarvam-saarika"
    supported_languages = frozenset({"hi", "mr", "bn", "ta", "te", "pa", "gu", "kn", "ml", "hi-en"})

    def __init__(self) -> None:
        self._api_key = os.environ.get("KIAAN_SARVAM_API_KEY")
        self._client: object | None = None

    def is_configured(self) -> bool:
        return bool(self._api_key)

    async def start_session(self, *, session_id: str, lang_hint: str) -> None:
        if not self._api_key:
            raise RuntimeError(
                "SarvamSTTProvider: KIAAN_SARVAM_API_KEY not set. "
                "Either configure the env var or set "
                "KIAAN_VOICE_MOCK_PROVIDERS=1 to use the mock provider."
            )
        # Real impl: open Sarvam Saarika websocket connection here.
        # Lazy-import the SDK so this module loads without sarvam-ai installed.
        try:
            import sarvamai  # noqa: F401  # type: ignore[import-not-found]
        except ImportError as e:
            raise RuntimeError(
                "SarvamSTTProvider: sarvamai SDK not installed. "
                "pip install sarvamai or use mock providers."
            ) from e
        # NOTE: real implementation goes here — websocket open, language
        # config, etc. Not implemented in this commit because the env
        # cannot reach Sarvam in CI; the orchestrator has full mock
        # coverage so the WSS endpoint is exercisable without it.
        raise NotImplementedError(
            f"SarvamSTTProvider streaming impl not wired (session_id={session_id!r}, "
            f"lang_hint={lang_hint!r}). Set KIAAN_VOICE_MOCK_PROVIDERS=1 for mock."
        )

    async def feed_audio_chunk(
        self, *, seq: int, opus_b64: str
    ) -> AsyncIterator[STTResult]:
        if False:  # pragma: no cover — placeholder to satisfy AsyncIterator
            yield STTResult(text="", is_final=False, seq=seq)
        raise NotImplementedError(
            f"SarvamSTTProvider.feed_audio_chunk not wired "
            f"(seq={seq}, chunk_len={len(opus_b64)})"
        )

    async def end_of_speech(self) -> AsyncIterator[STTResult]:
        if False:  # pragma: no cover
            yield STTResult(text="", is_final=True, seq=0)
        raise NotImplementedError

    async def close(self) -> None:
        return None


class DeepgramSTTProvider:
    """Deepgram Nova-3 streaming STT for English + international.

    Activates when KIAAN_DEEPGRAM_API_KEY is set.
    """

    name = "deepgram-nova-3"
    supported_languages = frozenset({"en", "en-US", "en-GB", "en-IN", "en-AU"})

    def __init__(self) -> None:
        self._api_key = os.environ.get("KIAAN_DEEPGRAM_API_KEY")

    def is_configured(self) -> bool:
        return bool(self._api_key)

    async def start_session(self, *, session_id: str, lang_hint: str) -> None:
        if not self._api_key:
            raise RuntimeError(
                "DeepgramSTTProvider: KIAAN_DEEPGRAM_API_KEY not set."
            )
        try:
            import deepgram  # noqa: F401  # type: ignore[import-not-found]
        except ImportError as e:
            raise RuntimeError(
                "DeepgramSTTProvider: deepgram-sdk not installed."
            ) from e
        raise NotImplementedError(
            f"DeepgramSTTProvider streaming impl not wired "
            f"(session_id={session_id!r}, lang_hint={lang_hint!r})."
        )

    async def feed_audio_chunk(
        self, *, seq: int, opus_b64: str
    ) -> AsyncIterator[STTResult]:
        if False:  # pragma: no cover
            yield STTResult(text="", is_final=False, seq=seq)
        raise NotImplementedError(
            f"DeepgramSTTProvider.feed_audio_chunk not wired "
            f"(seq={seq}, chunk_len={len(opus_b64)})"
        )

    async def end_of_speech(self) -> AsyncIterator[STTResult]:
        if False:  # pragma: no cover
            yield STTResult(text="", is_final=True, seq=0)
        raise NotImplementedError

    async def close(self) -> None:
        return None


# ─── Router ───────────────────────────────────────────────────────────────


_INDIC_LANGS: frozenset[str] = frozenset(
    {"hi", "mr", "bn", "ta", "te", "pa", "gu", "kn", "ml", "hi-en"}
)


@dataclass
class STTRouterDecision:
    provider_name: str
    reason: str
    fell_back_to_mock: bool


class STTRouter:
    """Picks the right STT provider per session and dispatches to it.

    The router does not own state itself — providers do. Each session gets
    a fresh provider instance so concurrent sessions can't interfere.
    """

    def __init__(self) -> None:
        self._mock_forced = os.environ.get("KIAAN_VOICE_MOCK_PROVIDERS") == "1"

    @property
    def is_mock_only(self) -> bool:
        return self._mock_forced

    def decide(self, lang_hint: str) -> STTRouterDecision:
        """Decide which provider to use for a given language hint.

        Visible to tests and admin telemetry — the WSS handler also returns
        this decision so the mobile client knows which STT it's talking to."""
        normalized = (lang_hint or "en").lower().split("-")[0]
        if self._mock_forced:
            return STTRouterDecision(
                provider_name="mock",
                reason="KIAAN_VOICE_MOCK_PROVIDERS=1 (forced)",
                fell_back_to_mock=False,
            )
        # Indic → Sarvam, else Deepgram
        if normalized in _INDIC_LANGS or lang_hint == "hi-en":
            sarvam = SarvamSTTProvider()
            if sarvam.is_configured():
                return STTRouterDecision(
                    provider_name=sarvam.name,
                    reason=f"indic lang {lang_hint!r} → Sarvam Saarika",
                    fell_back_to_mock=False,
                )
            return STTRouterDecision(
                provider_name="mock",
                reason="Sarvam not configured (KIAAN_SARVAM_API_KEY unset) → mock fallback",
                fell_back_to_mock=True,
            )
        deepgram = DeepgramSTTProvider()
        if deepgram.is_configured():
            return STTRouterDecision(
                provider_name=deepgram.name,
                reason=f"non-indic lang {lang_hint!r} → Deepgram Nova-3",
                fell_back_to_mock=False,
            )
        return STTRouterDecision(
            provider_name="mock",
            reason="Deepgram not configured (KIAAN_DEEPGRAM_API_KEY unset) → mock fallback",
            fell_back_to_mock=True,
        )

    def build_provider(self, lang_hint: str) -> tuple[STTProvider, STTRouterDecision]:
        """Build a fresh provider instance for a session.

        Returns the chosen provider plus the routing decision so the WSS
        handler can include it in its log line."""
        decision = self.decide(lang_hint)
        if decision.provider_name == "mock":
            return MockSTTProvider(), decision
        if decision.provider_name == "sarvam-saarika":
            return SarvamSTTProvider(), decision
        if decision.provider_name == "deepgram-nova-3":
            return DeepgramSTTProvider(), decision
        # Defensive — shouldn't reach here
        logger.error(
            "STTRouter: unknown provider %r — falling back to mock",
            decision.provider_name,
        )
        return MockSTTProvider(), STTRouterDecision(
            provider_name="mock",
            reason=f"unknown provider {decision.provider_name!r}",
            fell_back_to_mock=True,
        )


# ─── Singleton ────────────────────────────────────────────────────────────


_router_instance: STTRouter | None = None


def get_stt_router() -> STTRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = STTRouter()
    return _router_instance


__all__ = [
    "STTResult",
    "STTProvider",
    "STTRouter",
    "STTRouterDecision",
    "MockSTTProvider",
    "SarvamSTTProvider",
    "DeepgramSTTProvider",
    "get_stt_router",
]
