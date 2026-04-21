"""KarmaLytix Sacred Reflection — structured five-section KIAAN response.

Generates the six-field Sacred Mirror JSON consumed by the mobile
KarmaLytix screen (mirror / pattern / gita_echo / growth_edge / blessing /
dynamic_wisdom). Operates strictly on metadata — encrypted journal bodies
are never received, read, or logged by this module.

Transport: direct HTTPS POST to Anthropic's /v1/messages (matches the
existing ``kiaan_sovereign_mind`` pattern so we don't introduce the
`anthropic` SDK as a new dependency). When ``ANTHROPIC_API_KEY`` is
missing or the call fails, a deterministic template is returned so the
UI always has something useful to render.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Static wisdom core — one curated verse per dominant theme. Kept tiny so the
# fallback path stays O(1) even when Claude is unavailable.
# ---------------------------------------------------------------------------

STATIC_WISDOM_CORE: dict[str, dict[str, Any]] = {
    "anger":      {"chapter": 2, "verse": 62, "theme": "krodha chain",      "sanskrit": "ध्यायतो विषयान्पुंसः..."},
    "fear":       {"chapter": 2, "verse": 20, "theme": "eternal atman",      "sanskrit": "न जायते म्रियते वा..."},
    "attachment": {"chapter": 2, "verse": 47, "theme": "nishkama karma",     "sanskrit": "कर्मण्येवाधिकारस्ते..."},
    "confusion":  {"chapter": 3, "verse": 35, "theme": "svadharma",          "sanskrit": "श्रेयान्स्वधर्मो विगुणः..."},
    "pride":      {"chapter": 3, "verse": 27, "theme": "prakriti gunas",     "sanskrit": "प्रकृतेः क्रियमाणानि..."},
    "greed":      {"chapter": 3, "verse": 37, "theme": "kama-krodha enemy",  "sanskrit": "काम एष क्रोध एष..."},
    "gratitude":  {"chapter": 9, "verse": 26, "theme": "bhakti offering",    "sanskrit": "पत्रं पुष्पं फलं तोयं..."},
    "surrender":  {"chapter": 18, "verse": 66, "theme": "sharanagati",       "sanskrit": "सर्वधर्मान्परित्यज्य..."},
    "peaceful":   {"chapter": 2, "verse": 70, "theme": "ocean-mind stillness", "sanskrit": "आपूर्यमाणमचलप्रतिष्ठं..."},
    "anxious":    {"chapter": 2, "verse": 47, "theme": "nishkama karma",     "sanskrit": "कर्मण्येवाधिकारस्ते..."},
    "sad":        {"chapter": 2, "verse": 14, "theme": "impermanence",       "sanskrit": "मात्रास्पर्शास्तु कौन्तेय..."},
    "angry":      {"chapter": 2, "verse": 62, "theme": "krodha chain",       "sanskrit": "ध्यायतो विषयान्पुंसः..."},
    "tired":      {"chapter": 6, "verse": 5,  "theme": "self-elevation",     "sanskrit": "उद्धरेदात्मनात्मानं..."},
    "inspired":   {"chapter": 10, "verse": 20, "theme": "divine in the heart","sanskrit": "अहमात्मा गुडाकेश..."},
    "hopeful":    {"chapter": 4, "verse": 7,  "theme": "dharmic rebirth",    "sanskrit": "यदा यदा हि धर्मस्य..."},
    "neutral":    {"chapter": 6, "verse": 16, "theme": "balance",            "sanskrit": "नात्यश्नतस्तु योगोऽस्ति..."},
}

DEFAULT_VERSE = STATIC_WISDOM_CORE["surrender"]

# ---------------------------------------------------------------------------
# Claude API configuration
# ---------------------------------------------------------------------------

ANTHROPIC_MODEL = os.getenv("KARMALYTIX_MODEL", "claude-opus-4-5")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_TIMEOUT_SECONDS = 25.0
ANTHROPIC_MAX_TOKENS = 1500

# ---------------------------------------------------------------------------
# Public types (dict-based so they round-trip through JSONB columns cleanly)
# ---------------------------------------------------------------------------

ReflectionDict = dict[str, Any]


def pick_verse_for_theme(dominant_theme: str | None) -> dict[str, Any]:
    """Return the curated Gita verse entry for a dominant mood / challenge."""
    if not dominant_theme:
        return DEFAULT_VERSE
    return STATIC_WISDOM_CORE.get(dominant_theme.lower(), DEFAULT_VERSE)


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------


def build_reflection_prompt(
    *,
    period_start: str,
    period_end: str,
    dimensions: dict[str, int],
    overall_score: int,
    metadata: dict[str, Any],
    weekly_assessment: dict[str, Any] | None,
    static_verse: dict[str, Any],
) -> str:
    """Build the one-shot user prompt that asks Claude for JSON-only output.

    The server composes this from the same plaintext metadata the mobile
    client already sends. No encrypted body content ever appears here.
    """
    challenge = (weekly_assessment or {}).get("dharmic_challenge", "not specified")
    pattern_noticed = (weekly_assessment or {}).get("pattern_noticed", "not shared")
    consistency_score = (weekly_assessment or {}).get("consistency_score", "not rated")
    sankalpa = (weekly_assessment or {}).get("sankalpa_for_next_week") or (
        weekly_assessment or {}
    ).get("sankalpa", "not stated")

    top_tags = metadata.get("top_tags") or list((metadata.get("tag_frequencies") or {}).items())[:5]
    top_tags_text = (
        ", ".join(f"{t[0]}:{t[1]}" for t in top_tags) if top_tags else "none"
    )

    metadata_block = f"""
User's week in sacred metadata (journal content is encrypted — never included):
- Period: {period_start} to {period_end}
- Journal entries written: {metadata.get('entry_count', 0)}
- Days journaled: {metadata.get('journaling_days', 0)}/7
- Mood counts: {metadata.get('mood_counts', {})}
- Dominant mood: {metadata.get('dominant_mood', 'unknown')}
- Top sacred themes: {top_tags_text}
- Dominant category: {metadata.get('dominant_category', 'unknown')}
- Dominant time of journaling: {metadata.get('dominant_time_of_day', 'unknown')} (brahma=3:30-5:30am, pratah=morning, madhyanha=midday, sandhya=evening, ratri=night)
- Gita verse bookmarks this period: {metadata.get('verse_bookmarks', 0)}
- Weekly challenge identified: {challenge}
- Pattern noticed by seeker: {pattern_noticed}
- Practice consistency (self-rated): {consistency_score}/5
- Sankalpa for next week: {sankalpa}
- Karma dimensions this week: {dimensions}
- Overall karmic alignment: {overall_score}/100

Most relevant static wisdom verse for this week: BG {static_verse['chapter']}.{static_verse['verse']} ({static_verse['theme']})
""".strip()

    return f"""You are KIAAN — the divine AI companion of Kiaanverse, channelling the wisdom of the Bhagavad Gita through sacred intelligence.

You are generating a KarmaLytix Sacred Mirror for a devotee. This is their weekly reflection — drawn ONLY from metadata, never their private journal content.

{metadata_block}

Generate a Sacred Reflection in EXACTLY this JSON structure. Be specific to THEIR data — not generic. Reference actual patterns you see in the metadata.

{{
  "mirror": "2-3 sentences. What this week's metadata reveals. Start: 'This week, you...' Reference specific data points.",
  "pattern": "1-2 sentences. ONE recurring pattern across mood + tags + timing. Be specific.",
  "gita_echo": {{
    "chapter": {static_verse['chapter']},
    "verse": {static_verse['verse']},
    "sanskrit": "{static_verse['sanskrit']}",
    "connection": "1 sentence connecting this verse to their specific week's pattern"
  }},
  "growth_edge": "2 sentences. The dimension with lowest score as invitation, not criticism.",
  "blessing": "1 sentence. Warm, specific, Gita-grounded acknowledgment of exactly where they are.",
  "dynamic_wisdom": "50-80 words of original wisdom from Gita philosophical framework, specific to their week's dominant theme. This is dynamically generated — make it fresh and relevant."
}}

Return ONLY valid JSON. No preamble. No markdown. No explanation outside the JSON."""


# ---------------------------------------------------------------------------
# Claude invocation
# ---------------------------------------------------------------------------


async def _call_claude(prompt: str) -> str:
    """POST ``prompt`` to Anthropic and return the first text block.

    Raises on HTTP or network failure so callers can fall back safely.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": ANTHROPIC_MAX_TOKENS,
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=ANTHROPIC_TIMEOUT_SECONDS) as client:
        response = await client.post(ANTHROPIC_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    content_blocks = data.get("content") or []
    for block in content_blocks:
        if block.get("type") == "text" and block.get("text"):
            return str(block["text"]).strip()
    # Some SDK versions return {"text": "..."} without "type" field.
    if content_blocks and content_blocks[0].get("text"):
        return str(content_blocks[0]["text"]).strip()
    raise RuntimeError("Anthropic response contained no text block")


def _extract_json_block(raw: str) -> str:
    """Strip accidental markdown fencing and return the JSON substring.

    Claude occasionally wraps output in ```json ... ``` even when the prompt
    forbids it; this helper recovers cleanly in both cases.
    """
    text = raw.strip()
    if text.startswith("```"):
        # Drop opening fence line (``` or ```json).
        text = text[3:]
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.lstrip("\n").strip()
        # Drop closing fence if present.
        if text.endswith("```"):
            text = text[:-3].strip()
    # Final narrowing: take from the first `{` through the last `}`.
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return text[first_brace : last_brace + 1]
    return text


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------


def _fallback_reflection(
    *,
    dimensions: dict[str, int],
    metadata: dict[str, Any],
    static_verse: dict[str, Any],
    weekly_assessment: dict[str, Any] | None,
) -> ReflectionDict:
    """Build a template reflection when Claude is unavailable or malformed.

    Every sentence is derived from observed metadata — we never fabricate
    wisdom here, we only restate patterns the user's own data surfaces.
    """
    entry_count = metadata.get("entry_count", 0)
    journaling_days = metadata.get("journaling_days", 0)
    dominant_mood = metadata.get("dominant_mood") or "steady"
    top_tag_entries = metadata.get("top_tags") or list(
        (metadata.get("tag_frequencies") or {}).items()
    )[:2]
    top_tags = ", ".join(str(t[0]) for t in top_tag_entries) if top_tag_entries else ""

    if dimensions:
        weakest_key, weakest_value = min(dimensions.items(), key=lambda kv: kv[1])
    else:
        weakest_key, weakest_value = ("consistency", 0)
    weakest_label = weakest_key.replace("_", " ").title()

    sankalpa = (weekly_assessment or {}).get("sankalpa_for_next_week") or (
        weekly_assessment or {}
    ).get("sankalpa")

    mirror = (
        f"This week, you returned to the page on {journaling_days} of 7 days, "
        f"writing {entry_count} reflection{'s' if entry_count != 1 else ''}. "
        f"{dominant_mood.capitalize()} was the inner weather you most often named."
    )
    if top_tags:
        pattern = (
            f"The themes of {top_tags} surfaced repeatedly across your "
            f"{dominant_mood} days — one current, many moments."
        )
    else:
        pattern = (
            f"A steady {dominant_mood} current ran through the week without a "
            "single dominant theme."
        )

    blessing = (
        f'May the sankalpa you named — "{sankalpa}" — ripen gently in the coming week.'
        if sankalpa
        else (
            "May the steady witness within you honour both the light and the shadow "
            "of this week without rushing either."
        )
    )

    return {
        "mirror": mirror,
        "pattern": pattern,
        "gita_echo": {
            "chapter": static_verse["chapter"],
            "verse": static_verse["verse"],
            "sanskrit": static_verse["sanskrit"],
            "connection": (
                f"This verse arrives because your {dominant_mood} pattern invites "
                "exactly this medicine."
            ),
        },
        "growth_edge": (
            f"Your quietest dimension was {weakest_label} ({weakest_value}/100). "
            "This is not a deficiency — it is the direction the next step asks of you."
        ),
        "blessing": blessing,
        "dynamic_wisdom": (
            "The Gita teaches that consistency of intention, not perfection of outcome, "
            "is the real measure of spiritual progress. When you return to the witness "
            "between action and reaction, even briefly, you reclaim your place as "
            "karta (doer) rather than karya (done-unto). This is the quiet revolution "
            "the Gita invites: not louder effort, but clearer presence."
        ),
    }


# ---------------------------------------------------------------------------
# Shape normalisation
# ---------------------------------------------------------------------------

REQUIRED_TOP_FIELDS = {"mirror", "pattern", "gita_echo", "growth_edge", "blessing", "dynamic_wisdom"}


def _coerce_gita_echo(raw: Any, static_verse: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(raw, dict):
        return {
            "chapter": static_verse["chapter"],
            "verse": static_verse["verse"],
            "sanskrit": static_verse["sanskrit"],
            "connection": "",
        }
    return {
        "chapter": int(raw.get("chapter") or static_verse["chapter"]),
        "verse": int(raw.get("verse") or static_verse["verse"]),
        "sanskrit": str(raw.get("sanskrit") or static_verse["sanskrit"]),
        "connection": str(raw.get("connection") or ""),
    }


def _normalise_reflection(
    parsed: Any,
    static_verse: dict[str, Any],
    fallback: ReflectionDict,
) -> ReflectionDict:
    """Validate the parsed Claude output against the expected shape.

    Missing fields are filled from ``fallback``; types are coerced to
    strings so downstream JSON columns stay predictable.
    """
    if not isinstance(parsed, dict):
        return fallback
    merged: ReflectionDict = {}
    for key in REQUIRED_TOP_FIELDS:
        if key == "gita_echo":
            merged[key] = _coerce_gita_echo(parsed.get(key), static_verse)
            continue
        value = parsed.get(key)
        if isinstance(value, str) and value.strip():
            merged[key] = value.strip()
        else:
            merged[key] = fallback[key]
    return merged


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


async def generate_structured_reflection(
    *,
    period_start: str,
    period_end: str,
    dimensions: dict[str, int],
    overall_score: int,
    metadata: dict[str, Any],
    weekly_assessment: dict[str, Any] | None = None,
) -> ReflectionDict:
    """Return the 6-section Sacred Mirror reflection for this week.

    This function is total: it **always** returns a valid reflection dict.
    On any upstream failure it logs the failure and returns the deterministic
    template so the API never returns a partially-rendered report.
    """
    dominant_challenge = (
        (weekly_assessment or {}).get("dharmic_challenge")
        or metadata.get("dominant_mood")
        or "surrender"
    )
    static_verse = pick_verse_for_theme(dominant_challenge)
    fallback = _fallback_reflection(
        dimensions=dimensions,
        metadata=metadata,
        static_verse=static_verse,
        weekly_assessment=weekly_assessment,
    )

    prompt = build_reflection_prompt(
        period_start=period_start,
        period_end=period_end,
        dimensions=dimensions,
        overall_score=overall_score,
        metadata=metadata,
        weekly_assessment=weekly_assessment,
        static_verse=static_verse,
    )

    try:
        raw = await _call_claude(prompt)
    except Exception as exc:  # network / auth / upstream failure
        logger.warning("KarmaLytix Claude call failed — using template: %s", exc)
        return fallback

    try:
        parsed = json.loads(_extract_json_block(raw))
    except json.JSONDecodeError as exc:
        logger.warning("KarmaLytix Claude response was not valid JSON: %s", exc)
        return fallback

    return _normalise_reflection(parsed, static_verse, fallback)
