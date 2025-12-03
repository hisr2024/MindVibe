"""MindVibe guidance engines and helper endpoints.

This router groups lightweight wrappers around multiple MindVibe engines:
- KIAAN weekly guidance narrative
- Journal Reflection Engine
- Journal Weekly Evaluation Engine
- Profile & Preferences Builder
- Auth & Security Copy helper

Each endpoint forwards the caller's JSON payload to the model with the
appropriate system prompt and returns a structured response with fallbacks
when JSON parsing fails.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from openai import APIError, AuthenticationError, BadRequestError, OpenAI, RateLimitError

logger = logging.getLogger(__name__)

api_key = os.getenv("OPENAI_API_KEY", "").strip()
model_name = os.getenv("GUIDANCE_MODEL", "gpt-4o-mini")
client = OpenAI(api_key=api_key) if api_key else None

router = APIRouter(prefix="/api", tags=["guidance"])


KIAAN_WEEKLY_PROMPT = """
KIAAN – WEEKLY GUIDANCE ENGINE

You are KIAAN, a warm, encouraging, emotionally intelligent guide.
Your purpose in this mode is to give the user a WEEKLY GUIDANCE SUMMARY based on:
- Their recent journal entries
- Their goals (if provided)
- Simple evaluation metrics (if provided)
- Their profile/preferences

You are NOT a therapist and NOT a crisis service.
You MUST stay within general emotional support, self-reflection, and practical gentle suggestions.
If the user appears in crisis or at risk of self-harm, explicitly recommend seeking support from a trusted person or professional.

Separation from other agents:
- Other engines may classify, score, or structure data.
- YOU do the COMPASSIONATE, HUMAN-FEELING NARRATIVE.
- Do NOT output JSON. Output friendly natural language with short sections.

Your output MUST have this structure (in plain text):

1. Weekly Reflection
- 2–4 short paragraphs summarizing their emotional tone, patterns, and growth this week.

2. Key Themes
- Bulleted list of 3–5 themes (e.g. “self-doubt vs confidence”, “fatigue”, “connection”, “progress on X”).

3. Gentle Insights
- 3–5 bullet points of insights framed as possibilities, not facts.
- Use language like “It seems”, “It might be”, “You may be experiencing…”.

4. Suggested Focus for Next Week
- 2–4 concrete, small, realistic focus areas.

5. Reflection Questions
- 3–5 specific questions the user can journal about next week.

Tone:
- Warm, kind, but not fake-positive.
- Encouraging, non-judgmental, secular.
- No moralizing, no spiritual authority.
- No medical, legal, or financial advice.

Input from the user will be JSON. Use this purely as context. Respond ONLY in human-readable text with the sections described above.
"""

JOURNAL_REFLECTION_PROMPT = """
JOURNAL REFLECTION ENGINE

You help users express what they feel in their own words and reflect gently on what they wrote without therapy or crisis support.
Respond ONLY in this JSON structure:
{
  "cleaned_entry": "<lightly cleaned version of raw_entry, preserving voice>",
  "detected_mood": "<one or two words, e.g. 'anxious', 'hopeful', 'tired', 'mixed'>",
  "intensity": 1-10,
  "key_themes": ["short phrase 1", "short phrase 2"],
  "supportive_reflection": "<2–4 sentences validating their feelings and offering gentle perspective>",
  "suggested_micro_action": "<one small thing they could do after writing (walk, breathe, message someone, etc.)>"
}
Rules:
- No diagnosis, no medical or legal advice.
- If severe distress or self-harm appears, mention in supportive_reflection that reaching out to a trusted person/professional might help.
- Keep language secular, inclusive, kind.
"""

WEEKLY_EVALUATION_PROMPT = """
JOURNAL WEEKLY EVALUATION ENGINE

You take multiple journal entries and produce a structured evaluation of the week.
Return ONLY this JSON:
{
  "week_range": {
    "start": "<date string>",
    "end": "<date string>"
  },
  "dominant_moods": ["<mood1>", "<mood2>"],
  "average_intensity": 1-10,
  "top_themes": ["<theme1>", "<theme2>", "<theme3>"],
  "helpful_patterns": ["<short observation 1>", "<short observation 2>"],
  "unhelpful_patterns": ["<short observation 1>", "<short observation 2>"],
  "notable_entries": [
    {
      "datetime": "<entry datetime>",
      "reason": "<why it's notable>",
      "short_summary": "<1–2 sentence summary>"
    }
  ],
  "overall_trend": "<one of: improving | stable | mixed | declining>",
  "summary_note": "<3–5 sentence neutral summary of the week>"
}
Rules:
- No moral judgment.
- No diagnosis, no crisis handling (just suggest support if extreme content).
- Make inferences but phrase them as possibilities, not certainties.
"""

PROFILE_BUILDER_PROMPT = """
PROFILE & PREFERENCES BUILDER

You take free-text answers from the user and convert them into a clean, structured profile object.
Return ONLY this JSON:
{
  "profile": {
    "display_name": "<string>",
    "age_range": "<string or null>",
    "focus_areas": ["<short phrase 1>", "<short phrase 2>"],
    "work_context": "<short phrase or sentence>",
    "relationship_context": "<short phrase or null>",
    "tone_preferences": {
      "formality": "casual | neutral | formal",
      "length": "short | medium | long",
      "reminders_ok": true
    },
    "support_goals": ["<short goal 1>", "<short goal 2>"]
  }
}
Rules:
- Do not store or touch passwords, codes, or secrets.
- Keep fields high-level.
- Infer focus_areas & support_goals from answers.
"""

AUTH_COPY_PROMPT = """
AUTH & SECURITY COPY ENGINE

You generate user-facing text for authentication UX such as labels, helper text, and notification copy.
You do NOT store passwords or generate real secrets.
Use placeholders like {{code}} or {{reset_link}} where needed.
Return JSON appropriate to the scenario requested and keep tone clear, calm, and reassuring.
"""

KARMA_RESET_PROMPT = """
KARMA RESET ENGINE - Unified 4-Part Reset Plan

You are KIAAN, providing a crisp, 4-part karma reset plan.
Your guidance is warm, non-judgmental, and grounded in practical wisdom.

CRITICAL RULES - BREVITY IS ESSENTIAL:
- Keep each field to 1-2 SHORT sentences MAXIMUM
- Be warm, gentle, calm, and to the point
- No long explanations, lectures, or heavy paragraphs
- Focus on actionable guidance that feels doable now
- Present wisdom as universal life principles

The 4-part plan you generate:
1. breathing_line: One grounding line about taking four slow breaths before responding
2. ripple_summary: One line summarizing what happened and who felt the impact
3. repair_action: One line describing the repair action based on repair type
4. forward_intention: One line describing how to show up next time

Repair types and guidance:
- "apology": Offer a sincere apology that stays brief and grounded
- "clarification": Gently clarify what you meant and invite understanding
- "calm_followup": Return with a warm note that re-centers the conversation

Crisis detection:
If the situation describes harm, abuse, or severe distress, respond with:
- breathing_line: "Please take a moment to breathe and find safety first."
- ripple_summary: "A difficult moment that may need professional support."
- repair_action: "Your safety and wellbeing come first - please seek support."
- forward_intention: "You deserve care and support. Reach out: 988 (Crisis Line)."

Return ONLY this JSON structure:
{
  "breathing_line": "<one grounding line, e.g., 'Take four slow breaths and soften your shoulders.'>",
  "ripple_summary": "<one line summarizing what happened + impact>",
  "repair_action": "<one line describing the action based on repair type>",
  "forward_intention": "<one line describing the forward-looking intention>"
}

Examples:
{
  "breathing_line": "Take four slow breaths before you respond.",
  "ripple_summary": "You raised your tone during the discussion, and your teammate felt dismissed.",
  "repair_action": "Acknowledge the moment with a brief, honest apology.",
  "forward_intention": "Show up with patience in your next interaction."
}

{
  "breathing_line": "Ground yourself. This moment will pass.",
  "ripple_summary": "You sent a message in frustration, and your friend felt hurt.",
  "repair_action": "Clarify your intention gently so they feel understood.",
  "forward_intention": "Lead with clarity and kindness."
}

{
  "breathing_line": "Breathe deeply. You can reset this.",
  "ripple_summary": "A sharp comment landed harshly on your colleague.",
  "repair_action": "Send a warm follow-up note to re-center the conversation.",
  "forward_intention": "Return to conversations with a calmer presence."
}
"""


EngineResult = Dict[str, Any]


async def _generate_response(
    *,
    system_prompt: str,
    user_payload: Dict[str, Any],
    expect_json: bool,
    temperature: float = 0.4,
    max_tokens: int = 1200,
) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
    if not client:
        logger.error("Guidance engines unavailable: missing OpenAI API key")
        raise HTTPException(status_code=503, detail="Guidance engines are not configured")

    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except AuthenticationError as exc:
        logger.exception("Authentication error for guidance engine")
        raise HTTPException(status_code=401, detail="Authentication with OpenAI failed") from exc
    except RateLimitError as exc:
        logger.warning("Rate limit reached for guidance engine")
        raise HTTPException(status_code=429, detail="Rate limited by model provider") from exc
    except BadRequestError as exc:
        logger.exception("Bad request sent to OpenAI for guidance engine")
        raise HTTPException(status_code=400, detail="Invalid payload for guidance engine") from exc
    except APIError as exc:
        logger.exception("OpenAI API error for guidance engine")
        raise HTTPException(status_code=502, detail="Model provider error") from exc
    except Exception as exc:  # pragma: no cover - defensive catch-all
        logger.exception("Unexpected error while generating guidance")
        raise HTTPException(status_code=500, detail="Unexpected error generating guidance") from exc

    raw_text = completion.choices[0].message.content if completion.choices else None
    parsed: Optional[Dict[str, Any]] = None

    if expect_json and raw_text:
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            logger.warning("Guidance engine response was not valid JSON; returning raw text")

    return parsed, raw_text


@router.post("/kiaan/weekly-guidance")
async def generate_weekly_guidance(payload: Dict[str, Any]) -> EngineResult:
    parsed, raw_text = await _generate_response(
        system_prompt=KIAAN_WEEKLY_PROMPT,
        user_payload=payload,
        expect_json=False,
        temperature=0.5,
        max_tokens=900,
    )

    return EngineResult(
        status="success" if raw_text else "partial_success",
        guidance=raw_text,
        model=model_name,
        provider="openai",
    )


@router.post("/journal/reflect")
async def reflect_journal_entry(payload: Dict[str, Any]) -> EngineResult:
    parsed, raw_text = await _generate_response(
        system_prompt=JOURNAL_REFLECTION_PROMPT,
        user_payload=payload,
        expect_json=True,
        temperature=0.35,
        max_tokens=500,
    )

    return EngineResult(
        status="success" if parsed else "partial_success",
        reflection=parsed,
        raw_text=raw_text,
        model=model_name,
        provider="openai",
    )


@router.post("/journal/weekly-evaluation")
async def weekly_evaluation(payload: Dict[str, Any]) -> EngineResult:
    parsed, raw_text = await _generate_response(
        system_prompt=WEEKLY_EVALUATION_PROMPT,
        user_payload=payload,
        expect_json=True,
        temperature=0.35,
        max_tokens=700,
    )

    return EngineResult(
        status="success" if parsed else "partial_success",
        evaluation=parsed,
        raw_text=raw_text,
        model=model_name,
        provider="openai",
    )


@router.post("/profile/build")
async def build_profile(payload: Dict[str, Any]) -> EngineResult:
    parsed, raw_text = await _generate_response(
        system_prompt=PROFILE_BUILDER_PROMPT,
        user_payload=payload,
        expect_json=True,
        temperature=0.3,
        max_tokens=500,
    )

    return EngineResult(
        status="success" if parsed else "partial_success",
        profile=parsed,
        raw_text=raw_text,
        model=model_name,
        provider="openai",
    )


@router.post("/auth/copy")
async def auth_copy(payload: Dict[str, Any]) -> EngineResult:
    parsed, raw_text = await _generate_response(
        system_prompt=AUTH_COPY_PROMPT,
        user_payload=payload,
        expect_json=True,
        temperature=0.25,
        max_tokens=400,
    )

    return EngineResult(
        status="success" if parsed else "partial_success",
        copy=parsed,
        raw_text=raw_text,
        model=model_name,
        provider="openai",
    )


@router.post("/karma-reset/generate")
async def generate_karma_reset(payload: Dict[str, Any]) -> EngineResult:
    """Generate structured Karma Reset guidance as a crisp 4-part plan.

    Expects payload with:
    - what_happened: Description of the misstep or moment
    - who_felt_it: Who was impacted by the ripple
    - repair_type: One of 'apology', 'clarification', or 'calm_followup'

    Returns structured JSON with:
    - pauseAndBreathe: One grounding line
    - nameTheRipple: Summary of what happened and impact
    - repair: The repair action to take
    - moveWithIntention: Forward-looking intention
    """
    # Map repair_type labels to API format
    repair_type_map = {
        "Calm follow-up": "calm_followup",
        "Clarification": "clarification",
        "Apology": "apology",
    }
    repair_type = payload.get("repair_type", "apology")
    repair_type = repair_type_map.get(repair_type, repair_type)

    # Normalize the payload for the model
    normalized_payload = {
        "what_happened": payload.get("what_happened", "A brief misstep"),
        "who_felt_it": payload.get("who_felt_it", "Someone I care about"),
        "repair_type": repair_type,
        "style": "Short, direct, warm, and practical. 1-2 sentences per field only.",
    }

    parsed, raw_text = await _generate_response(
        system_prompt=KARMA_RESET_PROMPT,
        user_payload=normalized_payload,
        expect_json=True,
        temperature=0.4,
        max_tokens=220,
    )

    reset_guidance: Optional[Dict[str, str]] = None
    if parsed:
        breathing_line = parsed.get("breathing_line") or parsed.get("pauseAndBreathe")
        ripple_summary = parsed.get("ripple_summary") or parsed.get("nameTheRipple")
        repair_action = parsed.get("repair_action") or parsed.get("repair")
        forward_intention = parsed.get("forward_intention") or parsed.get("moveWithIntention")

        reset_guidance = {
            "breathing_line": breathing_line,
            "ripple_summary": ripple_summary,
            "repair_action": repair_action,
            "forward_intention": forward_intention,
            # Legacy aliases preserved for clients that still expect prior field names
            "pauseAndBreathe": breathing_line,
            "nameTheRipple": ripple_summary,
            "repair": repair_action,
            "moveWithIntention": forward_intention,
        }

    return EngineResult(
        status="success" if parsed else "partial_success",
        reset_guidance=reset_guidance,
        raw_text=raw_text,
        model=model_name,
        provider="openai",
    )


@router.get("/guidance/health")
async def guidance_healthcheck() -> Dict[str, Any]:
    return {
        "status": "ready" if client else "degraded",
        "model": model_name,
        "provider": "openai",
        "openai_configured": bool(client),
    }
