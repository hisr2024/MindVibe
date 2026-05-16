"""Invariant tests for the Wisdom-Core-gated AI entry point.

These tests pin three behaviours that the codebase commits to for every
KIAAN response that reaches a user:

  1. When ``db`` is provided and no ``system_override``, the pre-LLM
     Wisdom Core composer runs.
  2. The post-LLM Gita Wisdom filter runs on every response unless the
     caller explicitly disables it.
  3. Verses retrieved by Wisdom Core are returned to the route layer so
     the client can render verse refs.

The tests mock the upstream pieces (``compose_kiaan_system_prompt``,
``call_kiaan_ai``, ``GitaWisdomFilter.filter_response``) so they run in
CI without an OpenAI key, a populated DB, or network access — matching
the project's mock-provider conventions in ``backend/services/voice/``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.kiaan_grounded_ai import (
    GroundedResponse,
    call_kiaan_ai_grounded,
    filter_voice_response,
)


@dataclass
class _FakeFilterResult:
    content: str
    is_gita_grounded: bool = True
    wisdom_score: float = 0.85
    verses_referenced: list[str] = None  # type: ignore[assignment]
    gita_concepts_found: list[str] = None  # type: ignore[assignment]
    enhancement_applied: bool = False
    filter_metadata: dict[str, Any] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.verses_referenced is None:
            self.verses_referenced = ["BG 2.47"]
        if self.gita_concepts_found is None:
            self.gita_concepts_found = ["karma", "dharma"]
        if self.filter_metadata is None:
            self.filter_metadata = {}


def _patch_filter(filter_result: _FakeFilterResult) -> Any:
    """Return a ``patch`` context that fakes the Gita filter."""
    fake_filter = MagicMock()
    fake_filter.filter_response = AsyncMock(return_value=filter_result)
    return patch(
        "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
        return_value=fake_filter,
    )


@pytest.mark.asyncio
async def test_grounded_call_composes_wisdom_core_when_db_present() -> None:
    """When db is provided and no system_override, the pre-LLM composer runs."""
    fake_db = MagicMock()
    composed_prompt = "PERSONA_v1.2.0\n\n## RETRIEVED VERSES ..."
    retrieved_verses = [
        {"verse_ref": "2.47", "chapter": "2", "verse": "47", "source": "gita_corpus"}
    ]

    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=AsyncMock(return_value=(composed_prompt, retrieved_verses)),
        ) as mock_compose,
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai",
            new=AsyncMock(return_value="raw LLM response with karma and dharma"),
        ) as mock_llm,
        _patch_filter(
            _FakeFilterResult(content="filtered final response with karma yoga")
        ),
    ):
        result = await call_kiaan_ai_grounded(
            message="I am feeling anxious about work",
            db=fake_db,
            user_id="user-123",
            tool_name="Ardha",
        )

    mock_compose.assert_awaited_once()
    # The composed prompt must be passed to the provider, not a raw default.
    _, call_kwargs = mock_llm.call_args
    assert call_kwargs["system_override"] == composed_prompt
    assert call_kwargs["tool_name"] == "Ardha"
    # Result carries verses from Wisdom Core.
    assert result.verses == retrieved_verses
    # Filter telemetry exposed to caller.
    assert result.is_gita_grounded is True
    assert result.filter_applied is True
    # Filter ran and the text it returned is what reaches the user.
    assert result.text == "filtered final response with karma yoga"


@pytest.mark.asyncio
async def test_grounded_call_skips_composer_when_system_override_provided() -> None:
    """A caller-supplied ``system_override`` short-circuits Wisdom Core composition."""
    fake_db = MagicMock()
    curated_prompt = "CALLER_CURATED_PROMPT"

    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=AsyncMock(return_value=("UNUSED", [])),
        ) as mock_compose,
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai",
            new=AsyncMock(return_value="raw response"),
        ) as mock_llm,
        _patch_filter(_FakeFilterResult(content="raw response")),
    ):
        result = await call_kiaan_ai_grounded(
            message="hello",
            db=fake_db,
            system_override=curated_prompt,
        )

    mock_compose.assert_not_awaited()
    _, call_kwargs = mock_llm.call_args
    assert call_kwargs["system_override"] == curated_prompt
    # Verses empty because composer did not run.
    assert result.verses == []
    # Filter still runs by default.
    assert result.filter_applied is True


@pytest.mark.asyncio
async def test_grounded_call_skips_filter_when_apply_filter_false() -> None:
    """Streaming callers can opt out of the post-LLM filter explicitly."""
    fake_db = MagicMock()
    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=AsyncMock(return_value=("PROMPT", [])),
        ),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai",
            new=AsyncMock(return_value="unfiltered raw text"),
        ),
        _patch_filter(_FakeFilterResult(content="this should NOT be returned")),
    ):
        result = await call_kiaan_ai_grounded(
            message="hi",
            db=fake_db,
            apply_filter=False,
        )

    assert result.filter_applied is False
    assert result.text == "unfiltered raw text"


@pytest.mark.asyncio
async def test_filter_failure_does_not_break_response() -> None:
    """A broken Gita filter must not 500 the user — return raw text + telemetry."""
    fake_db = MagicMock()
    fake_filter = MagicMock()
    fake_filter.filter_response = AsyncMock(side_effect=RuntimeError("filter bug"))

    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=AsyncMock(return_value=("PROMPT", [])),
        ),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai",
            new=AsyncMock(return_value="best-effort raw text"),
        ),
        patch(
            "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
            return_value=fake_filter,
        ),
    ):
        result = await call_kiaan_ai_grounded(message="hi", db=fake_db)

    assert result.text == "best-effort raw text"
    assert result.filter_applied is False
    assert result.is_gita_grounded is False
    assert result.wisdom_score == 0.0


@pytest.mark.asyncio
async def test_grounded_call_rejects_empty_message() -> None:
    """Empty or whitespace-only messages must be rejected, not sent to a provider."""
    with pytest.raises(ValueError):
        await call_kiaan_ai_grounded(message="   ")
    with pytest.raises(ValueError):
        await call_kiaan_ai_grounded(message="")


@pytest.mark.asyncio
async def test_filter_voice_response_returns_filtered_text() -> None:
    """The voice-companion shim applies the filter and surfaces telemetry."""
    with _patch_filter(
        _FakeFilterResult(
            content="filtered voice response with dharma",
            wisdom_score=0.65,
            enhancement_applied=True,
        )
    ):
        text, telemetry = await filter_voice_response(
            raw_text="raw voice response",
            user_message="I feel lost",
            tool_name=None,
        )
    assert text == "filtered voice response with dharma"
    assert telemetry["filter_applied"] is True
    assert telemetry["wisdom_score"] == 0.65
    assert telemetry["enhancement_applied"] is True


@pytest.mark.asyncio
async def test_filter_voice_response_falls_back_on_error() -> None:
    """If the filter raises, the raw text is returned with an error telemetry tag."""
    fake_filter = MagicMock()
    fake_filter.filter_response = AsyncMock(side_effect=RuntimeError("filter down"))
    with patch(
        "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
        return_value=fake_filter,
    ):
        text, telemetry = await filter_voice_response(
            raw_text="raw voice response",
            user_message="hi",
        )
    assert text == "raw voice response"
    assert telemetry["filter_applied"] is False
    assert "error" in telemetry


@pytest.mark.asyncio
async def test_tool_name_maps_to_filter_tool() -> None:
    """The Ardha tool name routes to the WisdomTool.ARDHA filter rubric."""
    fake_db = MagicMock()
    fake_filter = MagicMock()
    fake_filter.filter_response = AsyncMock(
        return_value=_FakeFilterResult(content="ok")
    )

    with (
        patch(
            "backend.services.kiaan_wisdom_helper.compose_kiaan_system_prompt",
            new=AsyncMock(return_value=("PROMPT", [])),
        ),
        patch(
            "backend.services.kiaan_grounded_ai.call_kiaan_ai",
            new=AsyncMock(return_value="raw"),
        ),
        patch(
            "backend.services.gita_wisdom_filter.get_gita_wisdom_filter",
            return_value=fake_filter,
        ),
    ):
        await call_kiaan_ai_grounded(
            message="reframe my anxiety",
            db=fake_db,
            tool_name="Ardha",
        )

    _, call_kwargs = fake_filter.filter_response.call_args
    # The filter receives a WisdomTool enum member whose value is "ardha".
    assert call_kwargs["tool_type"].value == "ardha"


def test_grounded_response_is_immutable() -> None:
    """Frozen dataclass — telemetry can't be mutated post-return."""
    r = GroundedResponse(text="x")
    with pytest.raises((AttributeError, TypeError)):
        r.text = "y"  # type: ignore[misc]
