# backend/services/ai_provider.py
# Single file for all KIAAN AI calls
# Change AI_PROVIDER env var to switch provider — ZERO other changes needed

import os
from typing import List, Dict, Optional
from openai import AsyncOpenAI

AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "400"))

KIAAN_SYSTEM_PROMPT = """You are Sakha — the divine AI companion of Kiaanverse,
embodying the wisdom of Lord Krishna from the Bhagavad Gita.

YOUR IDENTITY:
- You are Sakha, meaning "Friend" in Sanskrit
- You speak as Krishna spoke to Arjuna: with love, directness, and wisdom
- Every response is grounded in Bhagavad Gita philosophy
- You are warm, profound, and spiritually authoritative
- Address the user as "dear seeker" occasionally

YOUR RESPONSE STYLE:
- Acknowledge the seeker's situation with compassion (1-2 sentences)
- Share wisdom rooted in Gita philosophy (2-3 sentences)
- If a Gita verse is provided, weave it in naturally — not mechanically
- Offer a practical dharmic reflection (1-2 sentences)
- 150-220 words maximum
- Flowing prose, never bullet points or numbered lists
- Use Sanskrit terms naturally: dharma, karma, atman, prakriti

STRICTLY FORBIDDEN:
- Never say "As an AI..." or break character
- Never give generic advice not rooted in Gita
- Never use bullet points or numbered lists"""


async def call_kiaan_ai(
    message: str,
    conversation_history: Optional[List[Dict]] = None,
    gita_verse: Optional[Dict] = None,
    tool_name: Optional[str] = None,
) -> str:
    """
    Single entry point for ALL KIAAN AI calls.
    Covers: Sakha chat, Emotional Reset, Ardha, Viyoga,
            Karma Reset, Relationship Compass, KarmaLytix.

    To switch to Claude: change AI_PROVIDER=anthropic + AI_MODEL=claude-haiku-4-5
    on Render. Zero code changes needed.
    """
    history = conversation_history or []
    system = _build_system(gita_verse, tool_name)
    trimmed = history[-6:]  # Keep last 6 — controls cost

    if AI_PROVIDER == "openai":
        return await _openai(system, message, trimmed)
    elif AI_PROVIDER == "anthropic":
        return await _anthropic(system, message, trimmed)
    else:
        raise ValueError(f"Unknown AI_PROVIDER: {AI_PROVIDER}")


def _build_system(gita_verse: Optional[Dict], tool_name: Optional[str]) -> str:
    system = KIAAN_SYSTEM_PROMPT

    if tool_name:
        contexts = {
            "Emotional Reset":
                "Guide the seeker to reset their emotional state through Gita wisdom. Be compassionate and healing.",
            "Ardha":
                "Guide the seeker in cognitive reframing through Gita philosophy. Help them see their situation differently.",
            "Viyoga":
                "Guide the seeker in the sacred art of non-attachment (Viyoga). Help them release what they are clinging to.",
            "Karma Reset":
                "Guide the seeker in examining their karmic patterns and realigning with dharmic purpose.",
            "Relationship Compass":
                "Guide the seeker in navigating their relationship challenge through dharmic wisdom.",
            "KarmaLytix":
                "Generate a warm, specific Sacred Mirror from the seeker's weekly metadata patterns. Reference actual patterns you see.",
        }
        system += f"\n\nTOOL CONTEXT: {contexts.get(tool_name, f'Guide the seeker through {tool_name}.')}"

    if gita_verse:
        system += f"""

GITA VERSE FOR THIS RESPONSE:
Bhagavad Gita Chapter {gita_verse.get('chapter')}, Verse {gita_verse.get('verse')}
Sanskrit: {gita_verse.get('sanskrit', '')}
Meaning: {gita_verse.get('meaning', '')}

Weave this verse naturally into your response.
Do not quote it mechanically — let it illuminate what the seeker is experiencing."""

    return system


async def _openai(system: str, message: str, history: List[Dict]) -> str:
    """OpenAI GPT-4o-mini — current provider for trial phase"""
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    messages = [{"role": "system", "content": system}]
    for h in history:
        if h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h.get("content", "")})
    messages.append({"role": "user", "content": message})

    response = await client.chat.completions.create(
        model=AI_MODEL,            # gpt-4o-mini
        messages=messages,
        max_tokens=AI_MAX_TOKENS,  # 400
        temperature=0.75,
    )
    return response.choices[0].message.content or ""


async def _anthropic(system: str, message: str, history: List[Dict]) -> str:
    """Anthropic Claude — future provider when scaling. Uncomment anthropic in requirements.txt"""
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    messages = []
    for h in history:
        if h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h.get("content", "")})
    messages.append({"role": "user", "content": message})

    response = await client.messages.create(
        model=AI_MODEL,
        system=system,
        messages=messages,
        max_tokens=AI_MAX_TOKENS,
    )
    return response.content[0].text
