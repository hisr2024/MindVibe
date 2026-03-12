"""
Nityam Sadhana Composer - Personalized Daily Practice Generator

Composes a complete daily spiritual practice (sadhana) tailored to the user's
current mood and time of day. Combines Bhagavad Gita wisdom, breathwork,
reflection prompts, and dharma intentions into a cohesive practice session.

The composition flow:
  1. Fetch daily verse wisdom based on day-of-year and mood
  2. Select an appropriate breathing pattern for the user's emotional state
  3. Generate personalized interpretation and reflection via OpenAI
  4. Assemble and return the full SadhanaComposition

Fallback behaviour:
  - When OpenAI is unavailable the composer returns meaningful static content
    so the user's practice is never blocked by an API outage.
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

import openai

from backend.services.kiaan_friendship_engine import get_daily_wisdom

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# OpenAI client (uses OPENAI_API_KEY from environment automatically)
# ---------------------------------------------------------------------------
client = openai.AsyncOpenAI()

# Model selection - prefer a fast, cost-effective model for latency
OPENAI_MODEL = os.getenv("SADHANA_OPENAI_MODEL", "gpt-4o-mini")

# ---------------------------------------------------------------------------
# Breathing patterns mapped to emotional states
# ---------------------------------------------------------------------------
BREATHING_PATTERNS: Dict[str, Dict[str, Any]] = {
    "calming": {
        "name": "Calming Breath (4-7-8)",
        "inhale": 4,
        "hold_in": 7,
        "exhale": 8,
        "hold_out": 0,
        "cycles": 4,
        "description": (
            "A soothing 4-7-8 pattern that activates your parasympathetic "
            "nervous system. Inhale gently for 4 counts, hold the breath for "
            "7 counts, and exhale slowly for 8 counts. Let each cycle release "
            "tension from your body."
        ),
    },
    "energizing": {
        "name": "Energizing Breath (4-2-4-2)",
        "inhale": 4,
        "hold_in": 2,
        "exhale": 4,
        "hold_out": 2,
        "cycles": 6,
        "description": (
            "An invigorating 4-2-4-2 pattern that brightens your energy. "
            "Inhale for 4 counts, hold briefly for 2, exhale for 4 counts, "
            "and pause for 2. This rhythm amplifies your natural radiance."
        ),
    },
    "balanced": {
        "name": "Box Breathing (4-4-4-4)",
        "inhale": 4,
        "hold_in": 4,
        "exhale": 4,
        "hold_out": 4,
        "cycles": 5,
        "description": (
            "A balanced box-breathing pattern that centres mind and body. "
            "Equal counts of 4 for each phase create a square of stability. "
            "Used by meditators and high-performers alike to find calm focus."
        ),
    },
}

# Mood → breathing pattern mapping
MOOD_BREATHING_MAP: Dict[str, str] = {
    "heavy": "calming",
    "wounded": "calming",
    "sad": "calming",
    "anxious": "calming",
    "stressed": "calming",
    "radiant": "energizing",
    "grateful": "energizing",
    "joyful": "energizing",
    "excited": "energizing",
}

# ---------------------------------------------------------------------------
# Time-of-day greetings
# ---------------------------------------------------------------------------
TIME_GREETINGS: Dict[str, str] = {
    "morning": "Good morning. A new day of practice awaits you.",
    "afternoon": "Welcome to your afternoon pause. Let stillness find you.",
    "evening": "Good evening. Let the day's weight dissolve in this practice.",
    "night": "The night is gentle. Let this practice carry you toward rest.",
}

# ---------------------------------------------------------------------------
# Static fallback content (used when OpenAI is unavailable)
# ---------------------------------------------------------------------------
FALLBACK_INTERPRETATION = (
    "This verse speaks directly to where you are right now. "
    "Sit with its words for a moment - let them settle, "
    "not as ancient philosophy but as a mirror for your present experience."
)

FALLBACK_REFLECTION_PROMPT = {
    "prompt": "Take a few moments to reflect on how this verse meets you today.",
    "guiding_question": (
        "If this verse were advice from a trusted friend, "
        "what would it be asking you to notice about your life right now?"
    ),
}

FALLBACK_DHARMA_INTENTION = {
    "suggestion": (
        "Today I will act with awareness in one small moment - "
        "pausing before reacting, choosing presence over autopilot."
    ),
    "category": "mindfulness",
}


# ---------------------------------------------------------------------------
# Helper: select breathing pattern for a given mood
# ---------------------------------------------------------------------------
def _select_breathing_pattern(mood: str) -> Dict[str, Any]:
    """Select a breathing pattern appropriate for the user's current mood.

    Args:
        mood: Lowercase mood string from the user.

    Returns:
        A dict describing the breathing pattern (name, counts, cycles, description).
    """
    pattern_key = MOOD_BREATHING_MAP.get(mood.lower(), "balanced")
    return BREATHING_PATTERNS[pattern_key]


# ---------------------------------------------------------------------------
# Helper: build the OpenAI prompt
# ---------------------------------------------------------------------------
def _build_personalisation_prompt(
    verse_insight: str,
    verse_id: str,
    mood: str,
    time_of_day: str,
) -> str:
    """Construct the system + user prompt for personalisation."""
    system = (
        "You are a compassionate spiritual guide grounded in the Bhagavad Gita. "
        "Your language is warm, modern, and direct - never preachy. "
        "Respond ONLY with valid JSON (no markdown, no code fences)."
    )
    user = (
        f"The user feels '{mood}' during the {time_of_day}. "
        f"Today's Gita verse is {verse_id}: \"{verse_insight}\"\n\n"
        "Return a JSON object with exactly these keys:\n"
        "1. \"personal_interpretation\" - a 2-3 sentence interpretation of the verse "
        "that speaks directly to someone feeling this mood (warm, second-person).\n"
        "2. \"reflection_prompt\" - an object with \"prompt\" (an invitation to reflect, "
        "1-2 sentences) and \"guiding_question\" (a single open-ended question).\n"
        "3. \"dharma_intention\" - an object with \"suggestion\" (a concrete micro-action "
        "for today, 1-2 sentences) and \"category\" (one of: mindfulness, compassion, "
        "courage, gratitude, surrender, discipline)."
    )
    return system, user


# ---------------------------------------------------------------------------
# Core: compose a personalised daily sadhana
# ---------------------------------------------------------------------------
async def compose_daily_sadhana(
    mood: str,
    time_of_day: str,
) -> Dict[str, Any]:
    """Compose a personalised daily practice (Nityam Sadhana).

    Orchestrates verse selection, breathwork, and AI-personalised guidance
    into a single cohesive practice session.

    Args:
        mood: The user's current emotional state (e.g. 'heavy', 'radiant', 'calm').
        time_of_day: One of 'morning', 'afternoon', 'evening', 'night'.

    Returns:
        A SadhanaComposition dict containing greeting, breathing pattern,
        verse with interpretation, reflection prompt, dharma intention,
        estimated duration, and time_of_day label.

    Raises:
        No exceptions are raised to the caller; AI failures degrade
        gracefully to static fallback content.
    """
    day_of_year = datetime.utcnow().timetuple().tm_yday

    # ------------------------------------------------------------------
    # 1. Fetch daily wisdom (verse + insight) from KIAAN engine
    # ------------------------------------------------------------------
    wisdom = get_daily_wisdom(day_of_year, user_mood=mood)
    logger.info(
        "Daily wisdom fetched for day %d, mood='%s': verse %s",
        day_of_year, mood, wisdom.get("verse_id"),
    )

    # ------------------------------------------------------------------
    # 2. Select breathing pattern based on mood
    # ------------------------------------------------------------------
    breathing = _select_breathing_pattern(mood)

    # ------------------------------------------------------------------
    # 3. Generate personalised interpretation via OpenAI (with fallback)
    # ------------------------------------------------------------------
    personal_interpretation = FALLBACK_INTERPRETATION
    reflection_prompt = FALLBACK_REFLECTION_PROMPT.copy()
    dharma_intention = FALLBACK_DHARMA_INTENTION.copy()

    try:
        system_msg, user_msg = _build_personalisation_prompt(
            verse_insight=wisdom.get("insight", ""),
            verse_id=wisdom.get("verse_id", ""),
            mood=mood,
            time_of_day=time_of_day,
        )

        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.7,
            max_tokens=512,
            timeout=10.0,
        )

        import json as _json

        raw = response.choices[0].message.content.strip()
        ai_data = _json.loads(raw)

        # Extract AI-generated fields with safe fallbacks
        if "personal_interpretation" in ai_data:
            personal_interpretation = str(ai_data["personal_interpretation"])

        if "reflection_prompt" in ai_data and isinstance(ai_data["reflection_prompt"], dict):
            reflection_prompt = {
                "prompt": str(ai_data["reflection_prompt"].get(
                    "prompt", reflection_prompt["prompt"]
                )),
                "guiding_question": str(ai_data["reflection_prompt"].get(
                    "guiding_question", reflection_prompt["guiding_question"]
                )),
            }

        if "dharma_intention" in ai_data and isinstance(ai_data["dharma_intention"], dict):
            dharma_intention = {
                "suggestion": str(ai_data["dharma_intention"].get(
                    "suggestion", dharma_intention["suggestion"]
                )),
                "category": str(ai_data["dharma_intention"].get(
                    "category", dharma_intention["category"]
                )),
            }

        logger.info("AI personalisation generated successfully for verse %s", wisdom.get("verse_id"))

    except openai.APIConnectionError:
        logger.warning("OpenAI connection failed - using fallback content for sadhana")
    except openai.RateLimitError:
        logger.warning("OpenAI rate limit hit - using fallback content for sadhana")
    except openai.APITimeoutError:
        logger.warning("OpenAI request timed out - using fallback content for sadhana")
    except Exception as exc:
        # Catch-all so the practice is never blocked by AI failures
        logger.error("Unexpected error during AI personalisation: %s", exc, exc_info=True)

    # ------------------------------------------------------------------
    # 4. Assemble the SadhanaComposition
    # ------------------------------------------------------------------
    greeting = TIME_GREETINGS.get(time_of_day.lower(), TIME_GREETINGS["morning"])

    # Estimate duration: breathing cycles + reading + reflection
    breathing_duration = breathing["cycles"] * (
        breathing["inhale"] + breathing["hold_in"]
        + breathing["exhale"] + breathing["hold_out"]
    ) // 60 + 1  # at least 1 minute
    reading_minutes = 2
    reflection_minutes = 3
    duration_estimate = breathing_duration + reading_minutes + reflection_minutes

    composition: Dict[str, Any] = {
        "greeting": greeting,
        "breathing_pattern": {
            "name": breathing["name"],
            "inhale": breathing["inhale"],
            "hold_in": breathing["hold_in"],
            "exhale": breathing["exhale"],
            "hold_out": breathing["hold_out"],
            "cycles": breathing["cycles"],
            "description": breathing["description"],
        },
        "verse": {
            "chapter": wisdom.get("chapter", 2),
            "verse": wisdom.get("verse", 47),
            "verse_id": wisdom.get("verse_id", "2.47"),
            "english": wisdom.get("insight", ""),
            "modern_insight": wisdom.get("daily_practice", wisdom.get("insight", "")),
            "personal_interpretation": personal_interpretation,
        },
        "reflection_prompt": reflection_prompt,
        "dharma_intention": dharma_intention,
        "duration_estimate_minutes": max(duration_estimate, 5),
        "time_of_day": time_of_day.lower(),
    }

    logger.info(
        "Sadhana composition assembled: verse=%s, breathing=%s, duration=%dmin",
        composition["verse"]["verse_id"],
        composition["breathing_pattern"]["name"],
        composition["duration_estimate_minutes"],
    )

    return composition
