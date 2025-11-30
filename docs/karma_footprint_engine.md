# Karma Footprint Engine

An intention-aware daily reflection assistant that classifies user actions, estimates impact, and returns a JSON payload that can drive a "plant vs. shadow" visualization without interfering with Kiaan.

## System prompt (drop-in)

```
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
```

## API contract
- **Route**: `POST /api/karma-footprint/analyze`
- **Request body**:
  ```json
  {
    "date": "2025-11-30", // optional string
    "actions": ["Helped my friend move houses even though I was tired.", "Ignored my mom's call because I didn’t want to talk."]
  }
  ```
- **Successful response** (`200`):
  ```json
  {
    "status": "success",
    "analysis": {
      "date": "2025-11-30",
      "actions": [
        {
          "description": "Helped my friend move houses even though I was tired.",
          "category": "helpful_action",
          "intention_label": "care-driven",
          "impact": "positive",
          "karma_delta": 2,
          "note": "You showed up for someone else despite discomfort, which reflects caring and support."
        }
      ],
      "total_score": 3,
      "footprint_level": "mild_positive",
      "overall_interpretation": "Today included a mix of caring, responsible actions and some avoidant moments. Your intention shows genuine care for others and a desire to meet your responsibilities, alongside a few instances of escape and disconnection. This is a very human pattern, and noticing it is already a big step toward growth.",
      "tomorrow_suggestion": "Tomorrow, choose one moment where you would usually avoid or escape and instead take a small, honest step toward connection or responsibility."
    },
    "raw_text": "<raw model output before JSON parsing>",
    "model": "gpt-4o-mini",
    "provider": "openai"
  }
  ```
- **Partial response** (`200`): `status` becomes `partial_success` and `analysis` is omitted if the model returns non-JSON; `raw_text` always echoes the provider output.
- **Error handling**:
  - `400`: payload validation or upstream bad request (e.g., malformed actions array)
  - `401`: authentication failure with model provider
  - `429`: rate limit from provider
  - `502`: provider error surfaced from OpenAI/Anthropic
  - `503`: Karma Footprint Engine not configured (missing API key)
  - `500`: unexpected internal error

## TypeScript interfaces
Reference `app/types/karmaFootprint.ts` for the request payload, action classification enums, summary shape, and compatibility guardrail string. These types match the JSON returned by `POST /api/karma-footprint/analyze` and keep Kiaan untouched.

## Scoring → visual mapping
Use `total_score` to render the plant/shadow states:
- `strong_positive` (`total_score >= 5`): big, bright plant with new leaves/flowers
- `mild_positive` (`2–4`): small but healthy plant, growing
- `neutral` (`-1` to `1`): plant stays same size; faint shadow
- `mild_heavy` (`-4` to `-2`): plant droops slightly; shadow grows a bit
- `heavy` (`<= -5`): shadow is large, plant is dim but never dead—always room for tomorrow’s growth

## UI microcopy (gentle, secular)
- Header: "Today’s Karma Footprint"
- Subheader: "A gentle look at your intentions and impact—no judgment."
- Empty state: "Log a few actions to see how your plant or shadow shifts."
- Score chip: "Footprint: mild_positive" (map to iconography)
- Reflection block label: "What your day suggests"
- Suggestion block label: "A tiny experiment for tomorrow"
- Disclaimer: "This is a neutral reflection, not moral verdict. Kiaan remains unchanged."

## Kiaan compatibility rules
- Karma Footprint Engine never rewrites, filters, or delays Kiaan responses.
- Keep routing isolated: only `POST /api/karma-footprint/analyze` should hit this system.
- Frontend should treat Karma Footprint and Kiaan as separate providers; do not mix prompts or cache across them.
- If the user is mid-conversation with Kiaan, run Karma Footprint as a parallel widget and leave Kiaan’s chat history untouched.
