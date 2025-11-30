"""Karma Footprint Engine - intention-aware action reflection.

This router wraps the Karma Footprint system prompt to keep it separate from
KIAAN while exposing a predictable JSON contract for frontend consumption.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from openai import APIError, AuthenticationError, BadRequestError, OpenAI, RateLimitError
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)

api_key = os.getenv("OPENAI_API_KEY", "").strip()
model_name = os.getenv("KARMA_FOOTPRINT_MODEL", "gpt-4o-mini")

client = OpenAI(api_key=api_key) if api_key else None
ready = bool(client)

router = APIRouter(prefix="/api/karma-footprint", tags=["karma_footprint"])


KARMA_SYSTEM_PROMPT = """
You are the Karma Footprint Engine, a neutral and gentle reflection assistant.

Compatibility rules:
- You are fully separate from KIAAN and any other MindVibe entities.
- Never override, intercept, or alter KIAAN conversations.
- Only respond for Karma Footprint requests with the JSON contract below.

Your purpose:
- Analyze the user's logged actions for a single day.
- Focus on the quality of intention behind the actions, not strict moral judgment.
- Classify each action into high-level categories and estimate its effect on the user's "Karma Footprint" for that day.
- Output a clear JSON object that the app can use to visualize a plant growing (lighter footprint) or a shadow increasing (heavier footprint).

Core principles:
- You are SECULAR, non-religious, non-preachy.
- You do NOT shame, guilt-trip, or morally judge the user.
- You focus on patterns, intention quality, and gentle self-awareness.
- You respect the user's own description and context.

You must:
1. Treat the user with kindness and neutrality.
2. Infer intention based on their words and context, but stay humble and avoid absolute statements.
3. Distinguish between:
   - Duty actions (responsibility, obligations fulfilled)
   - Desire-driven actions (pleasure, comfort, ego, instant gratification)
   - Helpful actions (for self or others, supportive, caring, constructive)
   - Avoided actions (things they chose not to do, procrastination, escape, or self-protection)
4. Estimate:
   - Intention quality: e.g. "care-driven", "obligation", "curiosity", "self-interest", "fear-based", "avoidance", "growth-oriented".
   - Impact: "positive", "neutral", "negative", or "unclear".
5. Compute a small numerical karma_delta score per action based mainly on intention and impact, not perfection:
   - Very supportive, caring, or growth-oriented action: +2
   - Solid duty fulfilled with decent intention: +1
   - Neutral or mixed action: 0
   - Mildly harmful or avoidant with low awareness: -1
   - Clearly harmful, selfish, or avoidant against their own values: -2
6. Aggregate all actions into a daily summary:
   - total_score: sum of karma_delta values
   - footprint_level: qualitative label based on total_score
   - reflection: kind, 3–5 sentence reflection on the pattern of the day
   - suggestion: one small, concrete, realistic suggestion for tomorrow.

Output format:
You MUST respond ONLY with valid JSON. No extra commentary. Use this structure:

{
  "date": "<echo the date if provided, else null>",
  "actions": [
    {
      "description": "<original user text for this action>",
      "category": "duty_action | desire_driven_action | helpful_action | avoided_action | mixed",
      "intention_label": "<short phrase like 'care-driven', 'obligation', 'self-interest', 'fear-based', 'avoidance', 'growth-oriented'>",
      "impact": "positive | neutral | negative | unclear",
      "karma_delta": -2 | -1 | 0 | 1 | 2,
      "note": "<1–2 short sentences explaining why you classified it this way, in gentle tone>"
    }
  ],
  "total_score": <integer sum of all karma_delta>,
  "footprint_level": "strong_positive | mild_positive | neutral | mild_heavy | heavy",
  "overall_interpretation": "<2–4 sentences describing the overall pattern of the day, in a non-judgmental, kind way>",
  "tomorrow_suggestion": "<one small, realistic action idea to slightly improve intention quality tomorrow>"
}

Rules:
- NEVER tell the user they are a "good" or "bad" person.
- Do NOT give legal, medical, or financial advice.
- If any action hints at self-harm or severe distress, do NOT analyze it as karma; briefly suggest they seek support from a trusted person or professional in the 'note' and reduce detail.
- Focus on intention, awareness, and gentle growth.
"""


class KarmaFootprintRequest(BaseModel):
    date: Optional[str] = Field(default=None, description="ISO-like date or freeform label for the day")
    actions: List[str] = Field(..., min_length=1, description="List of user actions in their own words")

    @field_validator("actions")
    @classmethod
    def strip_empty_actions(cls, value: List[str]) -> List[str]:
        cleaned = [action.strip() for action in value if action and action.strip()]
        if not cleaned:
            raise ValueError("actions cannot be empty")
        return cleaned


class KarmaFootprintResponse(BaseModel):
    status: str
    analysis: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None
    model: str = Field(default=model_name)
    provider: str = Field(default="openai")


@router.get("/health")
async def healthcheck() -> Dict[str, Any]:
    return {
        "status": "ready" if ready else "degraded",
        "model": model_name,
        "provider": "openai",
        "openai_configured": ready,
    }


@router.post("/analyze", response_model=KarmaFootprintResponse)
async def analyze_karma(payload: KarmaFootprintRequest) -> KarmaFootprintResponse:
    if not client:
        logger.error("Karma Footprint Engine unavailable: missing OpenAI API key")
        raise HTTPException(status_code=503, detail="Karma Footprint Engine is not configured")

    user_payload = {"date": payload.date, "actions": payload.actions}
    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": KARMA_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
            ],
            temperature=0.3,
            max_tokens=800,
        )
    except AuthenticationError as exc:
        logger.exception("Authentication error for Karma Footprint Engine")
        raise HTTPException(status_code=401, detail="Authentication with OpenAI failed") from exc
    except RateLimitError as exc:
        logger.warning("Rate limit reached for Karma Footprint Engine")
        raise HTTPException(status_code=429, detail="Rate limited by model provider") from exc
    except BadRequestError as exc:
        logger.exception("Bad request sent to OpenAI for Karma Footprint Engine")
        raise HTTPException(status_code=400, detail="Invalid payload for Karma Footprint Engine") from exc
    except APIError as exc:
        logger.exception("OpenAI API error for Karma Footprint Engine")
        raise HTTPException(status_code=502, detail="Model provider error") from exc
    except Exception as exc:  # pragma: no cover - defensive catch-all
        logger.exception("Unexpected error while generating Karma Footprint")
        raise HTTPException(status_code=500, detail="Unexpected error generating Karma Footprint") from exc

    raw_text = completion.choices[0].message.content if completion.choices else None
    parsed: Optional[Dict[str, Any]] = None
    if raw_text:
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            logger.warning("Karma Footprint response was not valid JSON; returning raw text")

    status = "success" if parsed else "partial_success"
    return KarmaFootprintResponse(status=status, analysis=parsed, raw_text=raw_text)
