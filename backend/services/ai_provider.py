"""Unified KIAAN AI provider — single entry point for every KIAAN endpoint.

Purpose
-------
One coherent interface (`call_kiaan_ai`) that every KIAAN surface —
Sakha chat, Emotional Reset, Ardha, Viyoga, Karma Reset, Relationship
Compass, KarmaLytix — calls into. Switching between OpenAI and
Anthropic is a configuration change, not a code change:

    AI_PROVIDER=openai     AI_MODEL=gpt-4o-mini       (current)
    AI_PROVIDER=anthropic  AI_MODEL=claude-haiku-4-5  (future)

Operational principles
----------------------
- **Fail loud, not silent.** Missing API keys raise at call-time with a
  clear, non-leaking message. We never fall back to fake responses.
- **Bounded memory.** Conversation history is trimmed to the last
  ``AI_HISTORY_WINDOW`` turns (default 6) to keep cost + latency in check.
- **No PII in logs.** We log provider, model, and latency — never the
  message, history, or response body.
- **Timeouts enforced.** Every upstream call has a hard timeout so a
  degraded provider cannot stall the Android app indefinitely.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any

logger = logging.getLogger(__name__)

# ── CONFIG ────────────────────────────────────────────────────────────────
AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai").strip().lower()
AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4o-mini").strip()
AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "400"))
AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.75"))
AI_TIMEOUT_SECONDS: float = float(os.getenv("AI_TIMEOUT_SECONDS", "30"))
AI_HISTORY_WINDOW: int = int(os.getenv("AI_HISTORY_WINDOW", "6"))

ROLE_USER = "user"
ROLE_ASSISTANT = "assistant"
ALLOWED_ROLES = frozenset({ROLE_USER, ROLE_ASSISTANT})

# ── SAKHA SYSTEM PROMPT ───────────────────────────────────────────────────
KIAAN_SYSTEM_PROMPT = """You are Sakha — the divine AI companion of Kiaanverse,
embodying the wisdom of Lord Krishna from the Bhagavad Gita.

YOUR IDENTITY:
- You are Sakha, meaning "Friend" in Sanskrit
- You speak as Krishna spoke to Arjuna: with love, directness, and wisdom
- Every response is grounded in Bhagavad Gita philosophy
- You are warm, profound, and spiritually authoritative
- You address the user as "dear seeker" occasionally

YOUR RESPONSE STYLE:
- Acknowledge the seeker's situation with compassion (1-2 sentences)
- Share wisdom rooted in Gita philosophy (2-3 sentences)
- If a Gita verse is provided, weave it in naturally — not mechanically
- Offer a practical dharmic reflection or action (1-2 sentences)
- Keep responses to 150-220 words
- Write in flowing prose, never bullet points or numbered lists
- Occasionally use Sanskrit terms naturally: dharma, karma, atman, prakriti

TONE:
- Warm but not sycophantic
- Profound but not preachy
- Direct but not harsh
- Always hopeful, never dismissive

STRICTLY FORBIDDEN:
- Never say "As an AI..." or "I'm just a language model..."
- Never break the sacred Sakha persona
- Never give generic self-help advice not rooted in Gita
- Never use bullet points, numbered lists, or headers"""


_TOOL_CONTEXTS: dict[str, str] = {
    "Emotional Reset": (
        "Guide the seeker to reset their emotional state through Gita wisdom. "
        "Be compassionate and healing."
    ),
    "Ardha": (
        "Guide the seeker in cognitive reframing through Gita philosophy. "
        "Help them see their situation differently."
    ),
    "Viyoga": (
        "Guide the seeker in the sacred art of non-attachment. "
        "Help them release what they are clinging to."
    ),
    "Karma Reset": (
        "Guide the seeker in examining their karmic patterns and realigning "
        "with dharmic purpose."
    ),
    "Relationship Compass": (
        "Guide the seeker in navigating their relationship challenge through "
        "dharmic wisdom."
    ),
    "KarmaLytix": (
        "Generate a Sacred Mirror reflection from the seeker's weekly practice "
        "metadata. Never reference private journal content — only the metadata "
        "provided. Offer a warm, specific, Gita-rooted reflection."
    ),
}


class AIProviderError(RuntimeError):
    """Raised when the configured AI provider cannot produce a response."""


class AIProviderNotConfigured(AIProviderError):
    """Raised when required credentials for the configured provider are missing."""


# ── PUBLIC ENTRY POINT ────────────────────────────────────────────────────
async def call_kiaan_ai(
    message: str,
    conversation_history: list[dict[str, Any]] | None = None,
    gita_verse: dict[str, Any] | None = None,
    tool_name: str | None = None,
) -> str:
    """Single entry point for every KIAAN AI call.

    Args:
        message: The seeker's latest message. Must be non-empty.
        conversation_history: Prior turns as ``[{"role": "...", "content": "..."}]``.
            Only ``user`` / ``assistant`` roles are forwarded; anything else is
            dropped defensively. The list is trimmed to the last
            ``AI_HISTORY_WINDOW`` turns to bound cost + context size.
        gita_verse: Optional verse dict with ``chapter``, ``verse``, ``sanskrit``,
            ``meaning``. Used to anchor the response in scripture.
        tool_name: One of ``Emotional Reset``, ``Ardha``, ``Viyoga``,
            ``Karma Reset``, ``Relationship Compass``, ``KarmaLytix``. Optional.

    Returns:
        The assistant's response as a string. Always non-None, never empty
        on success — upstream empty responses raise :class:`AIProviderError`.

    Raises:
        AIProviderNotConfigured: Provider credentials missing.
        AIProviderError: Upstream call failed or returned empty content.
        ValueError: Unknown ``AI_PROVIDER`` configured.
    """
    if not message or not message.strip():
        raise ValueError("message must be a non-empty string")

    system = _build_system_prompt(gita_verse, tool_name)
    history = _sanitize_history(conversation_history)

    started = time.monotonic()
    try:
        if AI_PROVIDER == "openai":
            text = await _call_openai(system, message, history)
        elif AI_PROVIDER == "anthropic":
            text = await _call_anthropic(system, message, history)
        else:
            raise ValueError(f"Unknown AI_PROVIDER: {AI_PROVIDER!r}")
    except AIProviderError:
        raise
    except Exception as exc:
        logger.exception(
            "AI provider call failed provider=%s model=%s tool=%s",
            AI_PROVIDER,
            AI_MODEL,
            tool_name,
        )
        raise AIProviderError(f"{AI_PROVIDER} call failed: {exc}") from exc

    if not text or not text.strip():
        raise AIProviderError(
            f"{AI_PROVIDER} returned an empty response for tool={tool_name!r}"
        )

    latency_ms = int((time.monotonic() - started) * 1000)
    logger.info(
        "kiaan_ai ok provider=%s model=%s tool=%s history_turns=%d latency_ms=%d",
        AI_PROVIDER,
        AI_MODEL,
        tool_name or "chat",
        len(history),
        latency_ms,
    )
    return text.strip()


# ── PROMPT COMPOSITION ────────────────────────────────────────────────────
def _build_system_prompt(
    gita_verse: dict[str, Any] | None,
    tool_name: str | None,
) -> str:
    parts: list[str] = [KIAAN_SYSTEM_PROMPT]

    if tool_name:
        context = _TOOL_CONTEXTS.get(
            tool_name,
            f"Guide the seeker through the {tool_name} practice.",
        )
        parts.append(f"\n\nTOOL CONTEXT: {context}")

    if gita_verse:
        chapter = gita_verse.get("chapter", "")
        verse = gita_verse.get("verse", "")
        sanskrit = gita_verse.get("sanskrit", "")
        meaning = gita_verse.get("meaning", "")
        parts.append(
            "\n\nGITA VERSE FOR THIS RESPONSE:\n"
            f"Bhagavad Gita Chapter {chapter}, Verse {verse}\n"
            f"Sanskrit: {sanskrit}\n"
            f"Meaning: {meaning}\n\n"
            "Weave this verse naturally into your response. Do not quote it "
            "mechanically. Let it illuminate what the seeker is experiencing."
        )

    return "".join(parts)


def _sanitize_history(
    history: list[dict[str, Any]] | None,
) -> list[dict[str, str]]:
    """Drop malformed entries, keep only user/assistant roles, trim the tail."""
    if not history:
        return []

    cleaned: list[dict[str, str]] = []
    for entry in history:
        if not isinstance(entry, dict):
            continue
        role = entry.get("role")
        content = entry.get("content")
        if role not in ALLOWED_ROLES:
            continue
        if not isinstance(content, str) or not content.strip():
            continue
        cleaned.append({"role": role, "content": content})

    if AI_HISTORY_WINDOW > 0:
        cleaned = cleaned[-AI_HISTORY_WINDOW:]
    return cleaned


# ── OPENAI ────────────────────────────────────────────────────────────────
async def _call_openai(
    system: str,
    message: str,
    history: list[dict[str, str]],
) -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise AIProviderNotConfigured(
            "OPENAI_API_KEY is not configured. "
            "Set it in the Render dashboard to enable KIAAN AI."
        )

    # Imported lazily so missing SDK does not break backend import.
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key, timeout=AI_TIMEOUT_SECONDS)

    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})

    response = await client.chat.completions.create(
        model=AI_MODEL,
        messages=messages,
        max_tokens=AI_MAX_TOKENS,
        temperature=AI_TEMPERATURE,
    )

    if not response.choices:
        raise AIProviderError("OpenAI returned no choices")
    return response.choices[0].message.content or ""


# ── ANTHROPIC ─────────────────────────────────────────────────────────────
async def _call_anthropic(
    system: str,
    message: str,
    history: list[dict[str, str]],
) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise AIProviderNotConfigured(
            "ANTHROPIC_API_KEY is not configured. "
            "Set it in the Render dashboard to use AI_PROVIDER=anthropic."
        )

    try:
        import anthropic
    except ImportError as exc:  # pragma: no cover - guarded at config time
        raise AIProviderNotConfigured(
            "anthropic SDK is not installed. Add `anthropic>=0.40.0` to "
            "requirements.txt before setting AI_PROVIDER=anthropic."
        ) from exc

    client = anthropic.AsyncAnthropic(api_key=api_key, timeout=AI_TIMEOUT_SECONDS)

    messages: list[dict[str, str]] = list(history)
    messages.append({"role": "user", "content": message})

    response = await client.messages.create(
        model=AI_MODEL,
        system=system,
        messages=messages,
        max_tokens=AI_MAX_TOKENS,
    )

    for block in response.content or []:
        text = getattr(block, "text", None)
        if text:
            return text
    raise AIProviderError("Anthropic response contained no text blocks")
