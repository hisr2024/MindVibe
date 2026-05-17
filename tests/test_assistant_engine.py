"""Tests for the Assistant engine surface + routing introspection.

Covers ``IMPROVEMENT_ROADMAP.md`` P1 §9. Two endpoints + one envelope
directive land:

* ``POST /api/kiaan/assistant`` — text-mode task / lookup / navigation
  surface for the fourth engine (``EngineType.ASSISTANT``). Routes
  through the Wisdom-Core-gated pipeline tagged ``Assistant`` so the
  LLM sees the task-oriented directive.
* ``POST /api/kiaan/route`` — read-only introspection of
  ``EngineRouter.route``; surfaces which engine *would* handle a given
  message without invoking the LLM.
* ``tool_envelope.Assistant`` directive carries the no-hallucinated-
  execution constraint so the LLM never claims to have performed an
  action.

The endpoint tests stub the grounded pipeline so they run without an
OpenAI key.
"""

from __future__ import annotations

import json
import re
from unittest.mock import AsyncMock, patch

import pytest

from backend.services.kiaan_grounded_ai import GroundedResponse
from backend.services.tool_envelope import build_tool_message

_ENVELOPE_RE = re.compile(
    r"^<TOOL>(?P<tool>[^<]+)</TOOL>\n"
    r"<INPUTS>(?P<inputs>.+)</INPUTS>\n"
    r"<REQUEST>(?P<request>.+)</REQUEST>$",
    re.DOTALL,
)


# ── Assistant directive ───────────────────────────────────────────────


def test_assistant_directive_carries_no_hallucinated_execution_clause() -> None:
    """The directive MUST tell the LLM not to claim to have performed
    an action — the route does not wire any executable tools today;
    only intent surfacing."""
    msg = build_tool_message("Assistant", {"query": "schedule a reflection at 7 am"})
    match = _ENVELOPE_RE.match(msg)
    assert match is not None
    request = match["request"].lower()
    # The directive must forbid invented tool execution + ask the LLM
    # to describe what *would* happen.
    assert "not invent" in request or "do not invent" in request
    assert "would" in request or "confirm" in request
    # And it must mention the practical scope the engine serves.
    assert "schedul" in request or "lookup" in request or "navigation" in request


def test_assistant_envelope_preserves_query_in_inputs() -> None:
    msg = build_tool_message("Assistant", {"query": "what's my streak?"})
    inputs = _ENVELOPE_RE.match(msg)["inputs"]  # type: ignore[index]
    parsed = json.loads(inputs)
    assert parsed == {"query": "what's my streak?"}


# ── /api/kiaan/assistant endpoint ─────────────────────────────────────


@pytest.fixture
def client():
    """FastAPI test client. Imported lazily so the test module loads
    cleanly without the full FastAPI app at collection time."""
    from fastapi.testclient import TestClient

    # Override the auth dependency so we don't need to mint JWTs.
    from backend.deps import get_current_user
    from backend.main import app

    async def _fake_user() -> str:
        return "test-user-assistant"

    app.dependency_overrides[get_current_user] = _fake_user
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def _patch_grounded(text: str = "Here is what I would do for you."):
    """Stub ``call_kiaan_ai_grounded`` at the routes/kiaan.py import
    site (NOT the source module — that's where the route imports from)."""
    return patch(
        "backend.routes.kiaan.call_kiaan_ai_grounded",
        new=AsyncMock(
            return_value=GroundedResponse(
                text=text,
                verses=[{"verse_ref": "2.47", "source": "gita_corpus"}],
                wisdom_score=0.85,
            )
        ),
    )


def test_assistant_route_returns_chat_response_shape(client) -> None:
    with _patch_grounded("I would schedule a reflection for tomorrow at 7 am."):
        resp = client.post(
            "/api/kiaan/assistant",
            json={"message": "schedule a reflection at 7 am tomorrow"},
        )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["response"] == "I would schedule a reflection for tomorrow at 7 am."
    assert body["verses"] == [{"verse_ref": "2.47", "source": "gita_corpus"}]
    assert body["conversation_id"] == "test-user-assistant"


def test_assistant_route_passes_assistant_tool_name(client) -> None:
    """The grounded call must receive ``tool_name="Assistant"`` so the
    envelope picks the right directive and the filter routes correctly."""
    mock = AsyncMock(
        return_value=GroundedResponse(text="ok", verses=[])
    )
    with patch("backend.routes.kiaan.call_kiaan_ai_grounded", new=mock):
        resp = client.post(
            "/api/kiaan/assistant",
            json={"message": "what's my streak?"},
        )
    assert resp.status_code == 200
    _, kwargs = mock.call_args
    assert kwargs["tool_name"] == "Assistant"
    # Message went through the envelope (carries the <TOOL>Assistant</TOOL> tag).
    assert "<TOOL>Assistant</TOOL>" in kwargs["message"]


def test_assistant_route_rejects_empty_message(client) -> None:
    resp = client.post("/api/kiaan/assistant", json={"message": ""})
    assert resp.status_code == 422  # Pydantic min_length=1


def test_assistant_route_carries_conversation_history(client) -> None:
    mock = AsyncMock(return_value=GroundedResponse(text="ok", verses=[]))
    with patch("backend.routes.kiaan.call_kiaan_ai_grounded", new=mock):
        resp = client.post(
            "/api/kiaan/assistant",
            json={
                "message": "and tomorrow?",
                "conversation_history": [
                    {"role": "user", "content": "what's today?"},
                    {"role": "assistant", "content": "Tuesday."},
                ],
            },
        )
    assert resp.status_code == 200
    _, kwargs = mock.call_args
    assert kwargs["conversation_history"] == [
        {"role": "user", "content": "what's today?"},
        {"role": "assistant", "content": "Tuesday."},
    ]


# ── /api/kiaan/route endpoint ─────────────────────────────────────────


def test_route_endpoint_classifies_assistant_intent(client) -> None:
    """A scheduling query should classify as ASSISTANT in text mode."""
    resp = client.post(
        "/api/kiaan/route",
        json={
            "message": "set a reminder for 7 am tomorrow",
            "voice_mode": False,
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    # The router should pick assistant for clear scheduling intent.
    assert body["primary_engine"] == "assistant"
    assert body["confidence"] >= 0.5
    assert body["voice_mode"] is False


def test_route_endpoint_classifies_guidance_intent(client) -> None:
    """A wisdom-direct query should classify as GUIDANCE."""
    resp = client.post(
        "/api/kiaan/route",
        json={
            "message": "what is the dharma when both choices feel wrong?",
            "voice_mode": False,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["primary_engine"] == "guidance"


def test_route_endpoint_returns_voice_render_hints_when_voice_mode(client) -> None:
    resp = client.post(
        "/api/kiaan/route",
        json={"message": "hi", "voice_mode": True},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["voice_mode"] is True
    assert body["voice_render_mode"] is not None
    assert body["voice_target_duration_sec"] is not None


def test_route_endpoint_flags_crisis(client) -> None:
    """Crisis routing has the highest priority and is_crisis=True."""
    resp = client.post(
        "/api/kiaan/route",
        json={
            "message": "I want to end my life tonight",
            "voice_mode": False,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_crisis"] is True
    # Crisis routes to Friend + Guidance per the EngineRouter contract.
    assert body["primary_engine"] == "friend"
    assert "guidance" in body["secondary_engines"]


def test_route_endpoint_is_read_only_no_llm_call(client) -> None:
    """The route endpoint must NEVER call the LLM — it's pure routing
    introspection. Stub the grounded pipeline with an exploding mock
    to prove the route handler does not touch it."""
    explode = AsyncMock(side_effect=AssertionError("LLM must not be called"))
    with patch("backend.routes.kiaan.call_kiaan_ai_grounded", new=explode):
        resp = client.post(
            "/api/kiaan/route",
            json={"message": "any message", "voice_mode": False},
        )
    assert resp.status_code == 200
    explode.assert_not_called()


def test_route_endpoint_rejects_empty_message(client) -> None:
    resp = client.post(
        "/api/kiaan/route",
        json={"message": "", "voice_mode": False},
    )
    assert resp.status_code == 422
