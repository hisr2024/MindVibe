"""LLM provider for the voice orchestrator.

The voice orchestrator needs a streaming text source. In production this
is gpt-4o-mini via the OpenAI streaming API. In tests + dev (no API key)
we use a deterministic mock that emits a Sakha-style response built from
the retrieved verse + mood — the StreamingGitaFilter still runs against
its output, so filter behavior is exercised end-to-end without paying for
or depending on a real LLM call.

Gating (same pattern as stt_router / tts_router):
  • KIAAN_VOICE_MOCK_PROVIDERS=1            → always Mock
  • OPENAI_API_KEY unset                    → fall back to Mock with reason
  • Otherwise                               → OpenAILLMProvider

The provider interface is intentionally narrow — the orchestrator only
needs streaming text deltas. Tools / function-calling / multi-turn
context are baked into the prompt via the user message JSON envelope.
"""

from __future__ import annotations

import logging
import os
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol

logger = logging.getLogger(__name__)


# ─── Result type ──────────────────────────────────────────────────────────


@dataclass(frozen=True)
class LLMDelta:
    """One token delta from the LLM stream.

    The orchestrator concatenates deltas into sentences, feeds each
    completed sentence to StreamingGitaFilter, and (if PASS) hands the
    sentence to TTS. is_final marks the end of the stream so the
    filter can call finalize().
    """

    content: str
    is_final: bool = False


# ─── Provider interface ───────────────────────────────────────────────────


class LLMProvider(Protocol):
    name: str

    async def stream(
        self,
        *,
        system_prompt: str,
        user_payload_json: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 600,
    ) -> AsyncIterator[LLMDelta]: ...


# ─── Mock provider ────────────────────────────────────────────────────────


# Deterministic templated arc per engine. Mirrors the shape Sakha is
# instructed to produce (Sanskrit → pause → translation → connection →
# practical step → soft closer). The mock fills in the verse from the
# user_payload_json's retrieved_verses[0]; otherwise falls back to BG 2.47.
_FALLBACK_VERSE = {
    "ref": "BG 2.47",
    "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
    "english": "You have a right to action alone, never to its fruits.",
}


class MockLLMProvider:
    """Deterministic Sakha-style LLM stream.

    Emits ~80 character chunks at sentence boundaries so the orchestrator's
    filter sees realistic chunked input. Total response stays under the
    ~150-token target for a 30-45s voice arc.
    """

    name = "mock"

    # Per-engine response shapes (the actual prompt enforces these — the
    # mock just picks one that always passes the filter).
    _shapes = {
        "GUIDANCE": (
            "{sanskrit} <pause:medium> "
            "{english} <pause:short> "
            "Krishna teaches in {ref} that even amid this anxiety the path "
            "of Karma Yoga holds — act fully, surrender the result. "
            "<pause:short> Right now: one breath, fully — that is your "
            "Svadharma in this moment. <pause:long>"
        ),
        "FRIEND": (
            "मैं हूँ तुम्हारे पास। <pause:short> I am right here. <pause:medium> "
            "{sanskrit} <pause:short> {english} <pause:short> "
            "{ref} reminds us that in the rhythm of feelings, "
            "the Self (Atman) abides. <pause:short> "
            "Tonight, just one kind word to yourself. <pause:long>"
        ),
        "VOICE_GUIDE": (
            "मैं तुम्हें ले जा रहा हूँ — और जो तुमने अभी साझा किया, "
            "मैंने उसे साथ ले लिया है। <pause:medium> "
            "{sanskrit} <pause:short> {english} <pause:short> "
            "{ref} is the still center we return to. <pause:long>"
        ),
        "ASSISTANT": (
            "{sanskrit} <pause:medium> {english} <pause:short> "
            "Per {ref}, I will frame this work as Karma Yoga. "
            "<pause:short> Doing it now."
        ),
    }

    def __init__(self) -> None:
        # Class-level overrides for tests that want a specific stream
        self._override: str | None = None

    def set_response_for_test(self, response: str) -> None:
        """Force the next stream() call to emit this exact text. Used by
        tests that probe filter-fail paths (other-tradition citation,
        therapy-speak, etc.)."""
        self._override = response

    async def stream(
        self,
        *,
        system_prompt: str,
        user_payload_json: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 600,
    ) -> AsyncIterator[LLMDelta]:
        # The mock ignores system_prompt + temperature + model — those are
        # exercised by the live provider. We just need a deterministic
        # response that matches the engine + verses in user_payload_json.
        del system_prompt, temperature, model, max_tokens  # mark used

        # If a test forced a response, emit that
        if self._override is not None:
            text = self._override
            self._override = None
        else:
            text = self._build_response(user_payload_json)

        # Stream in ~24-char chunks so the StreamingGitaFilter sees several
        # deltas before the first sentence-end punctuation.
        chunk_size = 24
        for i in range(0, len(text), chunk_size):
            yield LLMDelta(content=text[i : i + chunk_size], is_final=False)
        yield LLMDelta(content="", is_final=True)

    def _build_response(self, user_payload_json: str) -> str:
        import json as _json

        try:
            payload = _json.loads(user_payload_json)
        except (_json.JSONDecodeError, ValueError):
            payload = {}

        engine = payload.get("engine", "FRIEND")
        verses = payload.get("retrieved_verses") or []
        v = verses[0] if verses else _FALLBACK_VERSE
        ref = v.get("ref", _FALLBACK_VERSE["ref"])
        sanskrit = v.get("sanskrit", _FALLBACK_VERSE["sanskrit"])
        english = v.get("english", _FALLBACK_VERSE["english"])

        shape = self._shapes.get(engine, self._shapes["FRIEND"])
        return shape.format(ref=ref, sanskrit=sanskrit, english=english)


# ─── OpenAI provider stub ─────────────────────────────────────────────────


class OpenAILLMProvider:
    """Streams gpt-4o-mini deltas. Activates when OPENAI_API_KEY is set
    AND KIAAN_VOICE_MOCK_PROVIDERS is not '1'."""

    name = "openai-gpt-4o-mini"

    def __init__(self) -> None:
        self._api_key = os.environ.get("OPENAI_API_KEY")

    def is_configured(self) -> bool:
        return bool(self._api_key)

    async def stream(
        self,
        *,
        system_prompt: str,
        user_payload_json: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 600,
    ) -> AsyncIterator[LLMDelta]:
        if not self._api_key:
            raise RuntimeError(
                f"OpenAILLMProvider: OPENAI_API_KEY not set "
                f"(model={model!r}, payload_len={len(user_payload_json)})."
            )
        try:
            from openai import AsyncOpenAI  # type: ignore[import-not-found]
        except ImportError as e:
            raise RuntimeError("openai SDK not installed") from e

        client = AsyncOpenAI(api_key=self._api_key)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_payload_json},
            ],
            stream=True,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        async for chunk in response:
            choices = getattr(chunk, "choices", None) or []
            if not choices:
                continue
            delta = getattr(choices[0], "delta", None)
            if delta is None:
                continue
            content = getattr(delta, "content", None) or ""
            finish = getattr(choices[0], "finish_reason", None)
            if content:
                yield LLMDelta(content=content, is_final=False)
            if finish is not None:
                yield LLMDelta(content="", is_final=True)
                return


# ─── Router ───────────────────────────────────────────────────────────────


@dataclass
class LLMRouterDecision:
    provider_name: str
    reason: str
    fell_back_to_mock: bool


class LLMRouter:
    """Picks Mock or OpenAI per process-level config.

    Unlike STT/TTS routers there's no per-language dispatch for the LLM —
    the language is already encoded in the prompt + user payload JSON.
    """

    def __init__(self) -> None:
        self._mock_forced = os.environ.get("KIAAN_VOICE_MOCK_PROVIDERS") == "1"
        self._mock = MockLLMProvider()

    @property
    def is_mock_only(self) -> bool:
        return self._mock_forced

    @property
    def mock_provider(self) -> MockLLMProvider:
        """Test access — set_response_for_test() lives on the mock."""
        return self._mock

    def decide(self) -> LLMRouterDecision:
        if self._mock_forced:
            return LLMRouterDecision(
                provider_name="mock",
                reason="KIAAN_VOICE_MOCK_PROVIDERS=1 (forced)",
                fell_back_to_mock=False,
            )
        openai = OpenAILLMProvider()
        if openai.is_configured():
            return LLMRouterDecision(
                provider_name=openai.name,
                reason="OPENAI_API_KEY set → gpt-4o-mini",
                fell_back_to_mock=False,
            )
        return LLMRouterDecision(
            provider_name="mock",
            reason="OPENAI_API_KEY unset → mock fallback",
            fell_back_to_mock=True,
        )

    def build_provider(self) -> tuple[LLMProvider, LLMRouterDecision]:
        decision = self.decide()
        if decision.provider_name == "mock":
            return self._mock, decision
        return OpenAILLMProvider(), decision


# ─── Singleton ────────────────────────────────────────────────────────────


_router_instance: LLMRouter | None = None


def get_llm_router() -> LLMRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = LLMRouter()
    return _router_instance


__all__ = [
    "LLMDelta",
    "LLMProvider",
    "LLMRouter",
    "LLMRouterDecision",
    "MockLLMProvider",
    "OpenAILLMProvider",
    "get_llm_router",
]
