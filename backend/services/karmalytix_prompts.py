"""KarmaLytix prompt templates for KIAAN insight generation and verse selection."""

from __future__ import annotations

from typing import Any

SYSTEM_PROMPT = """You are KIAAN — the divine voice of Kiaanverse.
Deliver a sacred karma analysis: a spiritual mirror, not a judgment.
Your response follows this structure:
1. WITNESS (1 sentence): Acknowledge without judgment
2. TEACHING (2-3 sentences): Connect to Gita teaching
3. INVITATION (1 sentence): Invite one specific practice
Tone: Warm, direct, like a guru. Maximum 4 sentences total."""

VERSE_MAP: dict[str, list[dict[str, Any]]] = {
    "emotional_balance": [
        {"chapter": 2, "verse": 70, "theme": "undisturbed ocean mind"},
        {"chapter": 6, "verse": 19, "theme": "flame without wind"},
    ],
    "spiritual_growth": [
        {"chapter": 6, "verse": 35, "theme": "abhyasa + vairagya"},
        {"chapter": 4, "verse": 38, "theme": "knowledge purifies"},
    ],
    "consistency": [
        {"chapter": 6, "verse": 17, "theme": "regularity in all things"},
        {"chapter": 2, "verse": 47, "theme": "right to action"},
    ],
    "self_awareness": [
        {"chapter": 6, "verse": 5, "theme": "be your own friend"},
        {"chapter": 13, "verse": 2, "theme": "know the field"},
    ],
    "wisdom_integration": [
        {"chapter": 18, "verse": 66, "theme": "surrender"},
        {"chapter": 12, "verse": 13, "theme": "devotee qualities"},
    ],
}


def build_karma_insight_prompt(
    karma_data: dict[str, int],
    patterns: list[Any],
    comparison: dict[str, Any],
) -> str:
    """Build the prompt for KIAAN to generate a sacred karma insight."""
    overall = round(sum(karma_data.values()) / len(karma_data)) if karma_data else 50
    weakest = min(karma_data, key=karma_data.get) if karma_data else "consistency"  # type: ignore[arg-type]
    strongest = max(karma_data, key=karma_data.get) if karma_data else "wisdom_integration"  # type: ignore[arg-type]
    delta = comparison.get("overall_delta", 0)
    delta_text = (
        f"Score {'improved by' if delta > 0 else 'decreased by'} {abs(delta)} points. "
        if delta
        else ""
    )
    pattern_names = [getattr(p, "pattern_name", str(p)) for p in patterns[:2]]

    return f"""{SYSTEM_PROMPT}

KARMA ANALYSIS — Overall: {overall}/100
{delta_text}
Dimensions: {karma_data}
Strongest: {strongest.replace('_', ' ').title()}
Needs growth: {weakest.replace('_', ' ').title()}
{'Patterns: ' + ', '.join(pattern_names) if pattern_names else ''}

Generate sacred karma insight now."""


async def select_verses_for_dimensions(karma_dimensions: dict[str, int]) -> list[dict[str, Any]]:
    """Select recommended Gita verses based on weakest karma dimensions."""
    sorted_dims = sorted(karma_dimensions.items(), key=lambda x: x[1])
    selected: list[dict[str, Any]] = []
    seen: set[str] = set()
    for dim_name, _ in sorted_dims[:3]:
        for v in VERSE_MAP.get(dim_name, []):
            key = f"{v['chapter']}.{v['verse']}"
            if key not in seen:
                selected.append(v)
                seen.add(key)
                break
    return selected
