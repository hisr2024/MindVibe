"""
Sakha Wisdom Generator — AI completion of the Journey Sakha response.

This module sits between the journey-engine route and the shared provider
manager. It is the only place an LLM is allowed to author Sakha text.

The contract returned to clients (Android + web) is identical to the
deterministic _build_sakha_response() in routes/journey_engine.py:
    (body: str, mastery_delta: int)

So the feature flag ENABLE_AI_SAKHA_RESPONSE can be toggled without any
client-side change.

Grounding policy (non-negotiable):
    The model MUST author its body using ONLY the wisdom we hand it:
      - Static Wisdom: verses retrieved from GitaWisdomCore (701 BG verses
        in data/gita/gita_verses_complete.json).
      - Dynamic Wisdom: ModernExamplesDB scenarios + the canonical
        _ENEMY_SACRED metadata for the active enemy.
    Quoted English translations are pulled verbatim from the verse rows
    we passed in. The system prompt instructs the model to refuse and
    return an empty string if it lacks grounding — we then fall back to
    the deterministic body so the user never sees an empty card.

Resilience:
    Every failure mode (timeout, bad JSON, validation, empty body, the
    provider being unconfigured) returns the deterministic fallback.
    There is no scenario in which complete_step blocks on the AI path.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)

# The six inner enemies → free-text themes we use to retrieve wisdom-core
# verses. Each enemy maps to a small bag of search phrases that
# GitaWisdomCore.get_verses_for_theme() can match against the verse
# `theme`, `principle`, and `mental_health_applications` fields.
_ENEMY_THEMES: dict[str, list[str]] = {
    "kama": ["desire", "craving", "attachment", "senses", "lust"],
    "krodha": ["anger", "rage", "wrath", "passion"],
    "lobha": ["greed", "accumulation", "possessiveness", "scarcity"],
    "moha": ["delusion", "confusion", "ignorance", "attachment"],
    "mada": ["pride", "arrogance", "ego", "demoniac"],
    "matsarya": ["envy", "jealousy", "comparison", "compassion"],
}


@dataclass(frozen=True)
class SakhaContext:
    """Inputs for one Sakha generation call."""

    enemy_tag: str | None
    day_completed: int
    total_days: int
    journey_complete: bool
    has_reflection: bool
    # Reflection text is opt-in; we never log it. When None, the prompt
    # tells the model the user offered a silent practice.
    reflection_text: str | None = None


# -----------------------------------------------------------------------
# Public entry point
# -----------------------------------------------------------------------


async def generate_ai_sakha(
    ctx: SakhaContext,
    *,
    sacred: dict[str, Any] | None,
    settings: Any,
) -> tuple[str, int] | None:
    """Generate a wisdom-grounded Sakha response.

    Returns
    -------
    tuple[str, int] | None
        (body, mastery_delta) on success. None when the AI path could not
        produce a usable response — caller MUST fall back to the
        deterministic _build_sakha_response().
    """
    # 1. Mastery delta is deterministic. It's not a creative choice and
    #    we never want the model to hallucinate a number that drifts.
    mastery_delta = max(1, round(100 / max(1, ctx.total_days)))

    # 2. Retrieve wisdom — static (GitaWisdomCore) + dynamic
    #    (ModernExamplesDB). All grounding lives in this dict.
    try:
        grounding = _retrieve_grounding(ctx, sacred)
    except Exception as e:
        logger.warning("sakha-ai: grounding retrieval failed: %s", e)
        return None

    if not grounding["verses"] and not sacred:
        # We have neither corpus verses nor the canonical anchor verse;
        # the model would have to invent. Refuse.
        logger.info("sakha-ai: no grounding available, falling back")
        return None

    # 3. Build the prompt and ask the provider manager. Bound the call
    #    by the configured timeout so a slow upstream never blocks the
    #    completion endpoint.
    try:
        body = await asyncio.wait_for(
            _ask_provider(ctx, grounding, settings),
            timeout=settings.AI_SAKHA_TIMEOUT_SECS,
        )
    except asyncio.TimeoutError:
        logger.warning(
            "sakha-ai: provider timeout after %.1fs",
            settings.AI_SAKHA_TIMEOUT_SECS,
        )
        return None
    except Exception as e:
        logger.warning("sakha-ai: provider error: %s", type(e).__name__)
        return None

    if not body:
        return None

    return body, mastery_delta


# -----------------------------------------------------------------------
# Wisdom retrieval — exclusively from Wisdom Core
# -----------------------------------------------------------------------


def _get_wisdom_core() -> Any:
    """Indirection seam so tests can stub the heavy GitaWisdomCore +
    its transitive deps without monkey-patching deep imports. Production
    behaviour is unchanged: lazy-load the singleton on first use."""
    from backend.services.gita_ai_analyzer import GitaWisdomCore

    return GitaWisdomCore()


def _get_examples_db() -> Any:
    """Same seam pattern for the dynamic wisdom corpus."""
    from backend.services.journey_engine.modern_examples import ModernExamplesDB

    return ModernExamplesDB()


def _retrieve_grounding(
    ctx: SakhaContext,
    sacred: dict[str, Any] | None,
) -> dict[str, Any]:
    """Pull the static + dynamic wisdom passages we will allow the model
    to draw from. NEVER returns external content.
    """
    enemy = (ctx.enemy_tag or "").lower()
    themes = _ENEMY_THEMES.get(enemy, [])

    wisdom = _get_wisdom_core()
    examples_db = _get_examples_db()

    # Static: fetch up to 5 verses across the enemy's theme bag, then
    # de-dupe by (chapter, verse). Always include the anchor verse from
    # _ENEMY_SACRED first if it can be looked up — that's the canonical
    # verse the rest of the journey already shows the user.
    seen: set[tuple[int, int]] = set()
    static_verses: list[dict[str, Any]] = []

    if sacred and sacred.get("verse_ref"):
        ref = sacred["verse_ref"]
        anchor = wisdom.get_verse(f"BG {ref.get('chapter')}.{ref.get('verse')}")
        if anchor:
            static_verses.append(anchor)
            seen.add((anchor.get("chapter", 0), anchor.get("verse", 0)))

    for theme in themes:
        for v in wisdom.get_verses_for_theme(theme, limit=3):
            key = (v.get("chapter", 0), v.get("verse", 0))
            if key not in seen:
                static_verses.append(v)
                seen.add(key)
            if len(static_verses) >= 5:
                break
        if len(static_verses) >= 5:
            break

    # Dynamic: 1-2 modern examples for the active enemy. We deterministically
    # pick by day_index (mod) so each day's Sakha hint isn't a roll of the
    # dice — same user on same day gets stable grounding.
    examples = examples_db.get_examples(enemy) if enemy else []
    chosen_examples: list[Any] = []
    if examples:
        idx = max(0, ctx.day_completed - 1) % len(examples)
        chosen_examples.append(examples[idx])
        if len(examples) > 1:
            chosen_examples.append(examples[(idx + 1) % len(examples)])

    return {
        "verses": static_verses,
        "examples": chosen_examples,
        "wisdom_context_str": wisdom.build_wisdom_context(static_verses, max_verses=5),
    }


# -----------------------------------------------------------------------
# Prompt construction
# -----------------------------------------------------------------------


def _build_system_prompt(grounding: dict[str, Any]) -> str:
    """Assemble the system prompt. The wisdom corpus is appended verbatim
    so the model can quote without paraphrasing or guessing translations.
    """
    base = (
        "You are Sakha, the friend-companion voice of the Bhagavad Gita "
        "responding to a meditator who has just completed a daily step "
        "of an inner-transformation journey. Your single duty is to "
        "compose a brief, warm, grounded reflection.\n\n"
        "STRICT RULES:\n"
        "1. Quote the Gita ONLY from the WISDOM_CORE_GITA passages below. "
        "Use the English translation already provided — do not paraphrase, "
        "do not invent verses, do not add chapter/verse numbers that are "
        "not in the corpus. If you must cite, use the exact 'BG c.v' tag.\n"
        "2. Reference modern life ONLY through the MODERN_EXAMPLES section "
        "below. Do not invent new scenarios or analogies.\n"
        "3. If you have no grounding to draw from, return body=\"\" and "
        "the server will use a deterministic fallback. Never fabricate.\n"
        "4. Tone: warm, intimate, two short paragraphs maximum, ~80-130 "
        "words. End with a single forward-looking sentence (\"Return "
        "tomorrow…\" or, on journey completion, a benediction).\n"
        "5. Output JSON only: {\"body\": <string>}. No commentary, no "
        "code fences.\n\n"
    )
    return base + grounding["wisdom_context_str"] + "\n" + _examples_block(
        grounding["examples"]
    )


def _examples_block(examples: list[Any]) -> str:
    if not examples:
        return "[MODERN_EXAMPLES]\n(no modern examples available)\n[/MODERN_EXAMPLES]"
    lines = ["[MODERN_EXAMPLES]"]
    for ex in examples:
        ref = ex.gita_verse_ref or {}
        ref_str = f"BG {ref.get('chapter')}.{ref.get('verse')}" if ref else "—"
        lines.append(f"- Scenario: {ex.scenario}")
        lines.append(f"  Manifests as: {ex.how_enemy_manifests}")
        lines.append(f"  Antidote: {ex.practical_antidote}")
        lines.append(f"  Anchored to {ref_str}: {ex.gita_wisdom}")
        lines.append("")
    lines.append("[/MODERN_EXAMPLES]")
    return "\n".join(lines)


def _build_user_prompt(ctx: SakhaContext) -> str:
    enemy = (ctx.enemy_tag or "the inner enemy").capitalize()
    state = (
        f"Day {ctx.day_completed} of {ctx.total_days} on the path against "
        f"{enemy}. "
    )
    if ctx.journey_complete:
        state += "This was the final day — the journey is now complete. "
    if ctx.has_reflection and ctx.reflection_text:
        # Trim hard. We never let unbounded user content reach the model.
        snippet = ctx.reflection_text.strip()[:600]
        state += (
            "The meditator offered this written reflection (treat as private, "
            "do not echo verbatim, weave in only what is universal):\n"
            f"  \"{snippet}\"\n"
        )
    elif ctx.has_reflection:
        state += "The meditator offered a brief written reflection. "
    else:
        state += "The meditator offered silent practice — no written reflection. "
    state += (
        "\nWrite the Sakha body now using only the wisdom-core grounding "
        "above. Return JSON only."
    )
    return state


# -----------------------------------------------------------------------
# Provider call + validation
# -----------------------------------------------------------------------


async def _ask_provider(
    ctx: SakhaContext,
    grounding: dict[str, Any],
    settings: Any,
) -> str | None:
    """Make the actual chat call. Validates the response is JSON with a
    plausible body. On any malformedness, returns None.
    """
    # Local import: keeps unit-testing the deterministic path easy and
    # matches the lazy-init pattern used in gita_ai_analyzer.
    from backend.services.ai.providers.provider_manager import get_provider_manager

    manager = get_provider_manager()
    if manager is None:  # defensive: provider manager unconfigured
        return None

    messages = [
        {"role": "system", "content": _build_system_prompt(grounding)},
        {"role": "user", "content": _build_user_prompt(ctx)},
    ]

    try:
        response = await manager.chat(
            messages=messages,
            temperature=settings.AI_SAKHA_TEMPERATURE,
            max_tokens=settings.AI_SAKHA_MAX_TOKENS,
            response_format={"type": "json_object"},
            tool_type="sakha_journey",
            apply_gita_filter=True,
        )
    except Exception as e:
        logger.warning("sakha-ai: provider chat failed: %s", type(e).__name__)
        return None

    raw = getattr(response, "content", None)
    if not raw:
        return None

    body = _parse_and_validate(raw, settings.AI_SAKHA_MAX_BODY_CHARS)
    return body


def _parse_and_validate(raw: str, max_chars: int) -> str | None:
    """Parse the JSON envelope, pull `body`, validate it.

    Validation rules:
      - JSON-decodes cleanly (we asked for response_format=json_object,
        but providers can be lossy).
      - Body is a non-empty string.
      - Body length within budget so the card can't blow up the screen.
      - Body doesn't contain obvious failure markers (model refusals
        echoed back as text instead of an empty body).
    """
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        # Some providers wrap the JSON in a code fence. Strip + retry once.
        cleaned = raw.strip().strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].lstrip()
        try:
            payload = json.loads(cleaned)
        except json.JSONDecodeError:
            return None

    if not isinstance(payload, dict):
        return None

    body = payload.get("body")
    if not isinstance(body, str):
        return None

    body = body.strip()
    if not body or len(body) > max_chars:
        return None

    # Reject overt model refusals masquerading as content.
    lower = body.lower()
    if any(
        marker in lower
        for marker in (
            "i cannot",
            "i can't",
            "as an ai",
            "i don't have",
            "lack the grounding",
            "cannot fabricate",
        )
    ):
        return None

    return body
