"""
Gita Emotional Wisdom — Tier 0 routing layer for Emotional Reset.

Maps user emotions to WisdomCore's domain and shad-ripu APIs so that
generate_wisdom_insights() can query the FULL 700-verse Bhagavad Gita corpus
(plus dynamically learned wisdom) instead of a hardcoded verse subset.

Architecture:
    emotion string
        → EMOTION_DOMAIN_MAP   → WisdomCore.get_by_domain()   (full corpus)
        → EMOTION_SHAD_RIPU_MAP → WisdomCore.get_for_enemy()  (full corpus)
        → merge + deduplicate + sort by score
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from backend.services.wisdom_core import WisdomResult

logger = logging.getLogger(__name__)


# =============================================================================
# EMOTION → WISDOMCORE ROUTING MAPS
# =============================================================================

# Maps detected emotions → WisdomCore DOMAIN_THEMES keys (wisdom_core.py:300-311)
EMOTION_DOMAIN_MAP: dict[str, str] = {
    "anxious": "anxiety",
    "stressed": "stress",
    "sad": "grief",
    "angry": "anger",
    "overwhelmed": "overwhelm",
    "hopeless": "depression",
    "confused": "confusion",
    "lonely": "loneliness",
    "fearful": "fear",
    "frustrated": "anger",
    "guilty": "self_doubt",
    "hurt": "grief",
    "jealous": "self_doubt",
}

# Maps detected emotions → WisdomCore SHAD_RIPU_THEMES keys (wisdom_core.py:224-297)
# Not every emotion maps to a shad ripu — only those with a clear Gita parallel.
EMOTION_SHAD_RIPU_MAP: dict[str, str] = {
    "angry": "krodha",
    "frustrated": "krodha",
    "confused": "moha",
    "overwhelmed": "moha",
    "hopeless": "lobha",       # lobha = clinging/attachment to outcomes
    "jealous": "matsarya",
    "anxious": "kama",         # kama = craving/desire → fuels anxiety
    "stressed": "kama",
    "sad": "moha",
}


# =============================================================================
# SPECIAL VERSE REFERENCES
# =============================================================================

# BG 4.29 — the pranayama verse, used in breathing step (Step 3)
BREATHING_VERSE: dict[str, int] = {"chapter": 4, "verse": 29}

# Milestone verses for journey-step integration
JOURNEY_STEP_VERSES: list[tuple[int, int]] = [
    (1, 47),   # Arjuna's crisis — acknowledging suffering
    (13, 22),  # The witness self — observing without attachment
    (5, 10),   # Lotus leaf — acting without being tainted
    (18, 78),  # Final verse — where Krishna and Arjuna unite
]


# =============================================================================
# MAIN QUERY FUNCTION
# =============================================================================

async def get_emotional_wisdom(
    db: "AsyncSession",
    emotion: str,
    limit: int = 5,
) -> "list[WisdomResult]":
    """
    Query the full Gita corpus + dynamic learned wisdom for an emotion.

    Calls WisdomCore.get_by_domain() and (optionally) get_for_enemy(),
    merges results, deduplicates by verse_ref, and returns the top hits.

    Args:
        db: Async database session.
        emotion: Detected emotion string (e.g. "anxious", "angry").
        limit: Max results to return.

    Returns:
        List of WisdomResult objects sorted by score descending.
        Returns empty list if WisdomCore is unavailable or emotion is unmapped.
    """
    from backend.services.wisdom_core import get_wisdom_core

    wisdom_core = get_wisdom_core()
    if wisdom_core is None:
        logger.warning("get_emotional_wisdom: WisdomCore unavailable")
        return []

    emotion_lower = emotion.lower().strip()
    domain = EMOTION_DOMAIN_MAP.get(emotion_lower)
    enemy = EMOTION_SHAD_RIPU_MAP.get(emotion_lower)

    if not domain and not enemy:
        logger.debug(f"get_emotional_wisdom: no mapping for emotion '{emotion_lower}'")
        return []

    # Collect results from both APIs
    all_results: list[WisdomResult] = []

    if domain:
        try:
            domain_results = await wisdom_core.get_by_domain(
                db, domain=domain, limit=limit, include_learned=True,
            )
            all_results.extend(domain_results)
        except Exception as e:
            logger.debug(f"get_emotional_wisdom: get_by_domain('{domain}') failed: {e}")

    if enemy:
        try:
            enemy_results = await wisdom_core.get_for_enemy(
                db, enemy=enemy, limit=limit, include_learned=True,
            )
            all_results.extend(enemy_results)
        except Exception as e:
            logger.debug(f"get_emotional_wisdom: get_for_enemy('{enemy}') failed: {e}")

    # Deduplicate by verse_ref, keeping highest-scored entry
    seen: dict[str, WisdomResult] = {}
    for wr in all_results:
        ref = wr.verse_ref or (f"{wr.chapter}.{wr.verse}" if wr.chapter and wr.verse else wr.id)
        if ref not in seen or wr.score > seen[ref].score:
            seen[ref] = wr

    # Sort by score descending, return top `limit`
    merged = sorted(seen.values(), key=lambda r: r.score, reverse=True)
    return merged[:limit]
