"""Tests for the local llama.cpp provider.

Covers ``IMPROVEMENT_ROADMAP.md`` P1 §6 — the on-device LLM at the
tail of the provider chain. Tests live in two buckets:

* **Pure-degradation tests** (always run): the provider reports
  ``is_configured = False`` when any of the three preconditions is
  missing — llama-cpp not installed, model file not on disk, env
  killswitch off. Health check returns the precise reason.
* **Wired-mock tests** (always run): with the ``Llama`` class stubbed,
  the provider loads, calls ``create_chat_completion``, and projects
  the response into the ``ProviderResponse`` shape. JSON-mode best-
  effort steer appends a system message.

No tests require llama-cpp-python or a real GGUF file — they would not
work in CI without major infrastructure changes. The recorder in
``scripts/`` would prove the integration end-to-end on an instance
where both are present; we don't run that in CI by design.
"""

from __future__ import annotations

import asyncio
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from backend.services.ai.providers.base import (
    AIProviderError,
    ProviderStatus,
)
from backend.services.ai.providers.local_llama_provider import (
    LocalLlamaProvider,
)

# ── Degradation: not configured ───────────────────────────────────────


def test_provider_not_configured_when_no_model_path() -> None:
    p = LocalLlamaProvider()
    # Default env in CI: no KIAAN_LOCAL_MODEL_PATH set.
    assert p.is_configured is False


def test_provider_not_configured_when_enabled_false(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    model = tmp_path / "fake.gguf"
    model.write_bytes(b"\x00")
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))
    monkeypatch.setenv("KIAAN_LOCAL_LLAMA_ENABLED", "false")
    p = LocalLlamaProvider()
    assert p.is_configured is False


def test_provider_not_configured_when_model_file_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", "/does/not/exist.gguf")
    p = LocalLlamaProvider()
    assert p.is_configured is False


def test_provider_not_configured_when_llama_cpp_missing(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    """File exists, enabled — but llama_cpp is not importable."""
    model = tmp_path / "fake.gguf"
    model.write_bytes(b"\x00")
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))
    with patch(
        "backend.services.ai.providers.local_llama_provider._llama_class",
        return_value=None,
    ):
        p = LocalLlamaProvider()
        assert p.is_configured is False


# ── Health check reports precise reasons ──────────────────────────────


@pytest.mark.asyncio
async def test_health_check_reports_kill_switch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("KIAAN_LOCAL_LLAMA_ENABLED", "false")
    p = LocalLlamaProvider()
    h = await p.health_check()
    assert h.status == ProviderStatus.UNHEALTHY
    assert "ENABLED=false" in h.error


@pytest.mark.asyncio
async def test_health_check_reports_missing_path() -> None:
    p = LocalLlamaProvider()
    h = await p.health_check()
    assert h.status == ProviderStatus.UNHEALTHY
    assert "KIAAN_LOCAL_MODEL_PATH" in h.error


@pytest.mark.asyncio
async def test_health_check_reports_missing_file(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", "/nope.gguf")
    p = LocalLlamaProvider()
    h = await p.health_check()
    assert h.status == ProviderStatus.UNHEALTHY
    assert "not found" in h.error


@pytest.mark.asyncio
async def test_health_check_reports_missing_library(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    model = tmp_path / "fake.gguf"
    model.write_bytes(b"\x00")
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))
    with patch(
        "backend.services.ai.providers.local_llama_provider._llama_class",
        return_value=None,
    ):
        p = LocalLlamaProvider()
        h = await p.health_check()
        assert h.status == ProviderStatus.UNHEALTHY
        assert "llama-cpp-python" in h.error


@pytest.mark.asyncio
async def test_health_check_degraded_when_configured_but_not_loaded(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    """Configured + library present + model not yet loaded → DEGRADED.

    The manager will still route to the provider; first request pays
    the load cost. This is the documented contract.
    """
    model = tmp_path / "fake.gguf"
    model.write_bytes(b"\x00")
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))
    fake_llama_cls = MagicMock()
    with patch(
        "backend.services.ai.providers.local_llama_provider._llama_class",
        return_value=fake_llama_cls,
    ):
        p = LocalLlamaProvider()
        h = await p.health_check()
        assert h.status == ProviderStatus.DEGRADED
        assert "not yet loaded" in h.error


# ── Wired mock: chat() loads + projects response shape ────────────────


def _patch_llama_with_response(reply_text: str, tmp_path: Any) -> tuple:
    """Helper: returns (env_setup, patches) that install a stub
    llama.cpp Llama class whose ``create_chat_completion`` returns the
    given reply."""
    model = tmp_path / "fake.gguf"
    model.write_bytes(b"\x00")
    fake_instance = MagicMock()
    fake_instance.create_chat_completion = MagicMock(return_value={
        "choices": [
            {"message": {"content": reply_text}, "finish_reason": "stop"}
        ],
        "usage": {"prompt_tokens": 12, "completion_tokens": 7, "total_tokens": 19},
    })
    fake_llama_cls = MagicMock(return_value=fake_instance)
    return model, fake_instance, fake_llama_cls


@pytest.mark.asyncio
async def test_chat_returns_provider_response_with_usage(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    model, fake_inst, fake_cls = _patch_llama_with_response(
        "Karma yoga teaches selfless action.", tmp_path
    )
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))
    with patch(
        "backend.services.ai.providers.local_llama_provider._llama_class",
        return_value=fake_cls,
    ):
        p = LocalLlamaProvider()
        resp = await p.chat(
            messages=[
                {"role": "system", "content": "You are Sakha."},
                {"role": "user", "content": "I feel anxious."},
            ],
            temperature=0.7,
            max_tokens=200,
        )
    assert resp.content == "Karma yoga teaches selfless action."
    assert resp.provider == "local_llama"
    assert resp.prompt_tokens == 12
    assert resp.completion_tokens == 7
    assert resp.total_tokens == 19
    # Inference was called once with our messages.
    assert fake_inst.create_chat_completion.call_count == 1
    _, kwargs = fake_inst.create_chat_completion.call_args
    assert kwargs["temperature"] == 0.7
    assert kwargs["max_tokens"] == 200


@pytest.mark.asyncio
async def test_chat_raises_on_empty_content(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    """Empty completion content must surface as AIProviderError so the
    manager hops to the next provider in the chain."""
    model, _fake_inst, fake_cls = _patch_llama_with_response("   ", tmp_path)
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))
    with patch(
        "backend.services.ai.providers.local_llama_provider._llama_class",
        return_value=fake_cls,
    ):
        p = LocalLlamaProvider()
        with pytest.raises(AIProviderError) as exc_info:
            await p.chat(
                messages=[{"role": "user", "content": "hi"}],
                temperature=0.7,
                max_tokens=200,
            )
        assert "empty content" in str(exc_info.value)


@pytest.mark.asyncio
async def test_chat_raises_when_not_configured() -> None:
    p = LocalLlamaProvider()
    with pytest.raises(AIProviderError):
        await p.chat(
            messages=[{"role": "user", "content": "hi"}],
            temperature=0.7,
            max_tokens=200,
        )


@pytest.mark.asyncio
async def test_chat_appends_json_steer_when_json_mode_requested(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    """When ``response_format={"type": "json_object"}``, the provider
    appends a system message asking for JSON. v1 best-effort — no
    grammar enforcement yet."""
    model, fake_inst, fake_cls = _patch_llama_with_response('{"ok": true}', tmp_path)
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))
    with patch(
        "backend.services.ai.providers.local_llama_provider._llama_class",
        return_value=fake_cls,
    ):
        p = LocalLlamaProvider()
        await p.chat(
            messages=[{"role": "user", "content": "give me a json"}],
            temperature=0.7,
            max_tokens=200,
            response_format={"type": "json_object"},
        )
    _, kwargs = fake_inst.create_chat_completion.call_args
    msgs = kwargs["messages"]
    # The last system message must instruct JSON-only.
    json_steer = [m for m in msgs if m["role"] == "system" and "JSON" in m["content"]]
    assert json_steer, f"json steer not injected: {msgs!r}"


@pytest.mark.asyncio
async def test_preload_is_idempotent(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    """Calling ``preload`` twice must not load the model twice."""
    model, fake_inst, fake_cls = _patch_llama_with_response("hello", tmp_path)
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))
    with patch(
        "backend.services.ai.providers.local_llama_provider._llama_class",
        return_value=fake_cls,
    ):
        p = LocalLlamaProvider()
        await p.preload()
        await p.preload()
    # The Llama class was constructed exactly once.
    assert fake_cls.call_count == 1


# ── Provider chain wiring ─────────────────────────────────────────────


def test_provider_manager_default_chain_includes_local_llama() -> None:
    """Default ``AI_PROVIDER_FALLBACKS`` must place local_llama at the
    tail. Pins the documented chain shape."""
    from backend.services.ai.providers.provider_manager import ProviderManager

    pm = ProviderManager()
    assert pm._fallback_order == ["openai", "sarvam", "oai_compat", "local_llama"]


def test_provider_manager_skips_unconfigured_local_llama() -> None:
    """In CI / dev where no GGUF is present, the provider must NOT
    appear in the registered providers list — the manager's silent
    skip is what keeps `is_configured = False` providers out."""
    from backend.services.ai.providers.provider_manager import ProviderManager

    pm = ProviderManager()
    # Order may include "local_llama" in the fallback chain, but the
    # registered provider set must not (no GGUF on the CI box).
    assert "local_llama" not in pm.list_providers()


def test_concurrent_chat_serialises_through_lock(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    """``llama_cpp.Llama`` is not async-safe; the provider lock must
    serialise concurrent calls. Test runs two ``chat`` calls in
    parallel and asserts they don't overlap."""
    model = tmp_path / "fake.gguf"
    model.write_bytes(b"\x00")
    monkeypatch.setenv("KIAAN_LOCAL_MODEL_PATH", str(model))

    in_flight = 0
    max_in_flight = 0

    def _slow_complete(*args: Any, **kwargs: Any) -> Any:
        nonlocal in_flight, max_in_flight
        in_flight += 1
        max_in_flight = max(max_in_flight, in_flight)
        # Simulate a generation that takes a moment.
        import time as _time
        _time.sleep(0.05)
        in_flight -= 1
        return {
            "choices": [{"message": {"content": "ok"}, "finish_reason": "stop"}],
            "usage": {},
        }

    fake_inst = MagicMock()
    fake_inst.create_chat_completion = MagicMock(side_effect=_slow_complete)
    fake_cls = MagicMock(return_value=fake_inst)

    async def _run() -> int:
        with patch(
            "backend.services.ai.providers.local_llama_provider._llama_class",
            return_value=fake_cls,
        ):
            p = LocalLlamaProvider()
            await asyncio.gather(
                p.chat(messages=[{"role": "user", "content": "a"}]),
                p.chat(messages=[{"role": "user", "content": "b"}]),
                p.chat(messages=[{"role": "user", "content": "c"}]),
            )
        return max_in_flight

    observed = asyncio.run(_run())
    assert observed == 1, f"lock did not serialise: max_in_flight={observed}"
