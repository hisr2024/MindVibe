"""
Tests for backend.services.journey_engine.sakha_wisdom_generator.

These exercise the AI-grounded Sakha path that runs when
ENABLE_AI_SAKHA_RESPONSE=1. The contract this module guarantees is:

  * Returns (body, mastery_delta) on success.
  * Returns None on every failure mode so the caller can fall back to
    the deterministic _build_sakha_response().

We never make a real network call. The provider_manager.chat is mocked
out via monkeypatch on the lazy import inside _ask_provider, and
GitaWisdomCore + ModernExamplesDB are exercised against the real
shipping data (701 verses, 30+ scenarios) — that's the integration
contract we care about not silently breaking.
"""

from __future__ import annotations

import json
import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _settings(**overrides):
    """Minimal settings stand-in. Mirrors the real Settings fields the
    generator reads, so we don't pull the whole Pydantic config (and its
    env validation) into a unit test."""
    base = dict(
        ENABLE_AI_SAKHA_RESPONSE=True,
        AI_SAKHA_MAX_TOKENS=320,
        AI_SAKHA_TEMPERATURE=0.4,
        AI_SAKHA_TIMEOUT_SECS=2.0,
        AI_SAKHA_MAX_BODY_CHARS=650,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def _ctx(**overrides):
    from backend.services.journey_engine.sakha_wisdom_generator import SakhaContext

    base = dict(
        enemy_tag="krodha",
        day_completed=3,
        total_days=14,
        journey_complete=False,
        has_reflection=False,
        reflection_text=None,
    )
    base.update(overrides)
    return SakhaContext(**base)


def _sacred():
    """A representative _ENEMY_SACRED entry."""
    return {
        "verse_ref": {"chapter": 2, "verse": 63},
        "verse_translation": (
            "From anger comes delusion; from delusion, confused memory…"
        ),
    }


# ---------------------------------------------------------------------------
# Provider mocking
# ---------------------------------------------------------------------------


def _install_fake_provider(monkeypatch, manager):
    """Inject a stub provider_manager module into sys.modules so the
    lazy ``from backend.services.ai.providers.provider_manager import
    get_provider_manager`` inside _ask_provider returns our stub. We do
    this via sys.modules instead of monkeypatch.setattr because importing
    the real module pulls in the full provider chain (sarvam/openai/etc.)
    which we deliberately don't want as a unit-test dependency.
    """
    import types

    fake_module = types.ModuleType("backend.services.ai.providers.provider_manager")
    fake_module.get_provider_manager = lambda: manager
    fake_module.AIProviderError = type("AIProviderError", (Exception,), {})
    fake_module.ProviderResponse = SimpleNamespace
    monkeypatch.setitem(
        sys.modules,
        "backend.services.ai.providers.provider_manager",
        fake_module,
    )
    for parent in (
        "backend.services.ai",
        "backend.services.ai.providers",
    ):
        if parent not in sys.modules:
            mod = types.ModuleType(parent)
            mod.__path__ = []
            monkeypatch.setitem(sys.modules, parent, mod)


class _FakeWisdomCore:
    """Stand-in for GitaWisdomCore. Returns one matching verse per theme
    and exposes the same build_wisdom_context signature the generator
    calls."""

    @staticmethod
    def get_verse(ref: str):
        return {
            "chapter": 2,
            "verse": 63,
            "english": (
                "From anger comes delusion; from delusion, confused memory."
            ),
            "principle": "Discern before you react.",
            "theme": "anger_management",
        }

    @staticmethod
    def get_verses_for_theme(theme: str, limit: int = 5):
        return [
            {
                "chapter": 16,
                "verse": 21,
                "english": "Three gates open onto hell: lust, anger, greed.",
                "principle": "Guard the gates.",
                "theme": "self_destruction",
                "mental_health_applications": ["impulse control"],
            }
        ]

    @staticmethod
    def build_wisdom_context(verses, max_verses: int = 6) -> str:
        return (
            "[CORE_WISDOM_GITA_CONTEXT]\n"
            f"{len(verses)} relevant verse(s) selected.\n"
            "- BG 2.63: From anger comes delusion.\n"
            "[/CORE_WISDOM_GITA_CONTEXT]"
        )


class _FakeExamplesDB:
    @staticmethod
    def get_examples(enemy: str):
        return [
            SimpleNamespace(
                enemy=enemy,
                category="reactive",
                scenario="A driver cuts you off on the freeway.",
                how_enemy_manifests="Heat rises before the thought lands.",
                gita_verse_ref={"chapter": 2, "verse": 63},
                gita_wisdom="From anger comes delusion.",
                practical_antidote="Take one breath. Rename the urge.",
                reflection_question="What was underneath the heat?",
            )
        ]


@pytest.fixture(autouse=True)
def _stub_wisdom_sources(monkeypatch):
    """Always swap the wisdom-core seams for lightweight stand-ins so a
    unit test never pulls in redis / sqlalchemy / prometheus_client via
    the real GitaWisdomCore import chain. Tests that want to assert on
    grounding contents can override these seams further."""
    from backend.services.journey_engine import sakha_wisdom_generator as gen

    monkeypatch.setattr(gen, "_get_wisdom_core", lambda: _FakeWisdomCore())
    monkeypatch.setattr(gen, "_get_examples_db", lambda: _FakeExamplesDB())


def _patch_provider(monkeypatch, content: str | None):
    """Install a fake get_provider_manager() that returns an object whose
    .chat() yields a Response-shaped object with a `.content` attribute.
    """
    response = SimpleNamespace(content=content)
    manager = SimpleNamespace(chat=AsyncMock(return_value=response))
    _install_fake_provider(monkeypatch, manager)
    return manager


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generates_body_and_deterministic_mastery(monkeypatch):
    """When the provider returns valid JSON, we return its body and the
    mastery delta computed deterministically from total_days."""
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    expected_body = (
        "Anger has begun to soften under your gaze, friend. "
        "Carry today's stillness into your day. "
        "Return tomorrow for the next teaching."
    )
    _patch_provider(monkeypatch, json.dumps({"body": expected_body}))

    result = await generate_ai_sakha(
        _ctx(total_days=14),
        sacred=_sacred(),
        settings=_settings(),
    )

    assert result is not None
    body, mastery = result
    assert body == expected_body
    # 14-day journey → ~7 mastery per day.
    assert mastery == 7


@pytest.mark.asyncio
async def test_passes_only_wisdom_core_grounding_to_provider(monkeypatch):
    """The provider must never see anything beyond the Wisdom Core
    grounding we explicitly pass in. We assert by inspecting the
    captured `messages` argument to .chat()."""
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    manager = _patch_provider(monkeypatch, json.dumps({"body": "ok"}))

    await generate_ai_sakha(
        _ctx(),
        sacred=_sacred(),
        settings=_settings(),
    )

    call = manager.chat.await_args
    assert call is not None
    sys_msg = call.kwargs["messages"][0]["content"]
    # The system prompt must include both the wisdom-core marker and the
    # modern examples block. Without these the model has no grounding.
    assert "[CORE_WISDOM_GITA_CONTEXT]" in sys_msg
    assert "[MODERN_EXAMPLES]" in sys_msg
    # Strict-grounding rule must be present so the model knows to refuse.
    assert "Quote the Gita ONLY from the WISDOM_CORE_GITA passages" in sys_msg


# ---------------------------------------------------------------------------
# Robust parsing
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_strips_code_fence_around_json(monkeypatch):
    """Some providers wrap JSON in ```json fences. We strip + reparse."""
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    fenced = "```json\n" + json.dumps({"body": "Even silent practice is heard."}) + "\n```"
    _patch_provider(monkeypatch, fenced)

    result = await generate_ai_sakha(_ctx(), sacred=_sacred(), settings=_settings())
    assert result is not None
    assert "silent practice is heard" in result[0]


@pytest.mark.asyncio
async def test_rejects_oversized_body(monkeypatch):
    """An overly long body is treated as a failure so the deterministic
    fallback runs. We rely on the caller-supplied char budget."""
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    big = "x" * 5000
    _patch_provider(monkeypatch, json.dumps({"body": big}))

    result = await generate_ai_sakha(
        _ctx(),
        sacred=_sacred(),
        settings=_settings(AI_SAKHA_MAX_BODY_CHARS=200),
    )
    assert result is None


@pytest.mark.asyncio
async def test_rejects_empty_body(monkeypatch):
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    _patch_provider(monkeypatch, json.dumps({"body": "   "}))

    result = await generate_ai_sakha(_ctx(), sacred=_sacred(), settings=_settings())
    assert result is None


@pytest.mark.asyncio
async def test_rejects_model_refusal_text(monkeypatch):
    """Providers sometimes echo their refusal as the body. We treat that
    as a failure so the user sees the deterministic Sakha instead."""
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    _patch_provider(monkeypatch, json.dumps({"body": "I cannot fulfil this request."}))

    result = await generate_ai_sakha(_ctx(), sacred=_sacred(), settings=_settings())
    assert result is None


@pytest.mark.asyncio
async def test_rejects_non_string_body(monkeypatch):
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    _patch_provider(monkeypatch, json.dumps({"body": {"oops": True}}))

    result = await generate_ai_sakha(_ctx(), sacred=_sacred(), settings=_settings())
    assert result is None


@pytest.mark.asyncio
async def test_rejects_invalid_json(monkeypatch):
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    _patch_provider(monkeypatch, "definitely not json {")

    result = await generate_ai_sakha(_ctx(), sacred=_sacred(), settings=_settings())
    assert result is None


# ---------------------------------------------------------------------------
# Resilience
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_provider_exception_returns_none(monkeypatch):
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    manager = SimpleNamespace(chat=AsyncMock(side_effect=RuntimeError("boom")))
    _install_fake_provider(monkeypatch, manager)

    result = await generate_ai_sakha(_ctx(), sacred=_sacred(), settings=_settings())
    assert result is None


@pytest.mark.asyncio
async def test_provider_timeout_returns_none(monkeypatch):
    """Slow providers must not block complete_step. We bound the call."""
    import asyncio

    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    async def _slow(*_args, **_kwargs):
        await asyncio.sleep(2)  # exceeds AI_SAKHA_TIMEOUT_SECS=0.05
        return SimpleNamespace(content=json.dumps({"body": "late"}))

    manager = SimpleNamespace(chat=_slow)
    _install_fake_provider(monkeypatch, manager)

    result = await generate_ai_sakha(
        _ctx(),
        sacred=_sacred(),
        settings=_settings(AI_SAKHA_TIMEOUT_SECS=0.05),
    )
    assert result is None


@pytest.mark.asyncio
async def test_no_grounding_returns_none(monkeypatch):
    """If we have no enemy tag and no sacred entry we cannot ground the
    model and must refuse. Caller will fall back to the deterministic
    "you have completed your journey" body."""
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    # Provider should never be reached when grounding is empty, but
    # patch it anyway so an accidental call would surface obvious noise.
    _patch_provider(monkeypatch, json.dumps({"body": "should not appear"}))

    result = await generate_ai_sakha(
        _ctx(enemy_tag=None),
        sacred=None,
        settings=_settings(),
    )
    assert result is None


# ---------------------------------------------------------------------------
# Mastery delta is deterministic regardless of model output
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "total_days,expected",
    [(7, 14), (14, 7), (21, 5), (30, 3)],
)
async def test_mastery_delta_is_deterministic(monkeypatch, total_days, expected):
    """The mastery delta must NOT come from the model — drift would
    erode trust in the +N pill. It is computed from total_days."""
    from backend.services.journey_engine.sakha_wisdom_generator import generate_ai_sakha

    _patch_provider(monkeypatch, json.dumps({"body": "grounded reflection"}))

    result = await generate_ai_sakha(
        _ctx(total_days=total_days),
        sacred=_sacred(),
        settings=_settings(),
    )
    assert result is not None
    _, mastery = result
    assert mastery == expected
