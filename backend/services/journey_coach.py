"""
Journey Coach - KIAAN AI-powered step generation for Wisdom Journeys.

Generates personalized daily step content using the multi-provider LLM layer.
Returns strict JSON matching the defined schema.

Features:
- Strict JSON output schema validation
- Safety detection for self-harm content
- Verse reference validation (only refs, no text)
- Provider tracking for each generated step
- Retry with fallback on invalid JSON
- Prompt injection protection via input sanitization

Security:
- User reflections are sanitized before passing to LLM
- AI output is validated against strict schema
- Crisis detection with safe fallback responses
"""

import json
import logging
import re
from typing import Any, TypedDict

from pydantic import BaseModel, Field, field_validator

from backend.services.ai.providers import (
    ProviderManager,
    get_provider_manager,
    AIProviderError,
    ProviderResponse,
)
from backend.services.gita_corpus_adapter import (
    GitaCorpusAdapter,
    get_gita_corpus_adapter,
    VerseReference,
)

logger = logging.getLogger(__name__)


# =============================================================================
# OUTPUT SCHEMA (Pydantic models for validation)
# =============================================================================


class PracticeSchema(BaseModel):
    """Micro-practice definition."""
    name: str = Field(..., min_length=1, max_length=100)
    instructions: list[str] = Field(..., min_length=1, max_length=10)
    duration_minutes: int = Field(default=5, ge=1, le=30)


class CheckInPromptSchema(BaseModel):
    """Check-in prompt definition."""
    scale: str = Field(default="0-10")
    label: str = Field(..., min_length=1, max_length=200)


class VerseRefSchema(BaseModel):
    """Verse reference (chapter and verse only)."""
    chapter: int = Field(..., ge=1, le=18)
    verse: int = Field(..., ge=1, le=100)


class JourneyStepSchema(BaseModel):
    """
    Complete KIAAN-generated journey step.

    IMPORTANT: verse_refs must only contain references, never full text.
    Verse text is resolved by the frontend/API from the corpus.
    """
    step_title: str = Field(..., min_length=1, max_length=200)
    today_focus: str = Field(
        ...,
        pattern=r"^(kama|krodha|lobha|moha|mada|matsarya|mixed)$"
    )
    verse_refs: list[VerseRefSchema] = Field(..., min_length=1, max_length=3)
    teaching: str = Field(..., min_length=50, max_length=1000)
    guided_reflection: list[str] = Field(..., min_length=1, max_length=5)
    practice: PracticeSchema
    micro_commitment: str = Field(..., min_length=10, max_length=300)
    check_in_prompt: CheckInPromptSchema
    safety_note: str | None = Field(default=None, max_length=500)

    @field_validator("verse_refs")
    @classmethod
    def validate_verse_refs(cls, v: list[VerseRefSchema]) -> list[VerseRefSchema]:
        """Ensure verse_refs only contain valid references."""
        if not v:
            raise ValueError("At least one verse reference required")
        return v


class SafetyResponseSchema(BaseModel):
    """Response when safety concerns are detected."""
    is_safety_response: bool = True
    safety_message: str
    crisis_resources: list[str] = Field(default_factory=list)
    gentle_guidance: str | None = None


# =============================================================================
# PROMPTS
# =============================================================================


def build_journey_coach_system_prompt(
    enemy_focus: str,
    day_index: int,
    teaching_hint: str | None = None,
    tone: str = "gentle",
) -> str:
    """Build the system prompt for journey step generation."""

    enemy_descriptions = {
        "kama": "desire and sensory attachment (kama) - guiding toward restraint and contentment",
        "krodha": "anger and reactivity (krodha) - guiding toward patience and inner peace",
        "lobha": "greed and hoarding (lobha) - guiding toward generosity and contentment",
        "moha": "delusion and confusion (moha) - guiding toward clarity and discrimination",
        "mada": "pride and ego (mada) - guiding toward humility and service",
        "matsarya": "envy and jealousy (matsarya) - guiding toward appreciation and joy for others",
        "mixed": "multiple inner challenges - providing balanced wisdom across themes",
    }

    tone_instructions = {
        "gentle": "Use a warm, nurturing tone with soft language. Create a safe, supportive atmosphere.",
        "direct": "Be clear and focused. Give practical, actionable guidance without excessive softening.",
        "inspiring": "Use uplifting, motivational language. Emphasize potential and positive transformation.",
    }

    focus_description = enemy_descriptions.get(enemy_focus, enemy_descriptions["mixed"])
    tone_instruction = tone_instructions.get(tone, tone_instructions["gentle"])

    teaching_context = ""
    if teaching_hint:
        teaching_context = f"\n\nTEACHING FOCUS FOR TODAY:\n{teaching_hint}"

    return f"""You are KIAAN, a wise and compassionate spiritual guide helping users on their Wisdom Journey.

TODAY'S CONTEXT:
- Day {day_index} of the journey
- Focus: Overcoming {focus_description}
{teaching_context}

TONE INSTRUCTION:
{tone_instruction}

YOUR TASK:
Generate a daily step for the user's Wisdom Journey. You will be given verse references from the Bhagavad Gita corpus (700+ verses across 18 chapters) to incorporate.

MODERN-DAY IMPLEMENTATION GUIDELINES:
You must translate the ancient Gita wisdom from the verses into PRACTICAL, MODERN-DAY applications:

1. WORKPLACE APPLICATIONS - Apply wisdom to office stress, career decisions, workplace conflicts, professional growth, team dynamics, leadership challenges, work-life balance
2. RELATIONSHIPS - Modern dating, marriage, family dynamics, friendships, social media interactions, setting healthy boundaries, communication
3. MENTAL HEALTH - Anxiety management, depression, stress, burnout, overthinking, emotional regulation, building resilience
4. TECHNOLOGY BALANCE - Screen time, social media comparison, digital detox, mindful tech use, online presence
5. FINANCIAL WISDOM - Money mindset, career vs calling, material attachment, conscious consumption, financial anxiety
6. DAILY PRACTICES - Morning routines, commute meditation, lunch break practices, evening wind-down, micro-moments of awareness
7. PHYSICAL WELLNESS - Exercise as spiritual practice, mindful eating, sleep hygiene, body awareness, stress in the body

EXAMPLE MODERN IMPLEMENTATIONS:
- "When you feel road rage arising, practice the 3-breath pause before reacting"
- "Before checking social media, ask: 'What am I seeking that I can give myself?'"
- "In your next work meeting, practice listening without planning your response"
- "Tonight, put your phone away 30 minutes before bed and reflect on your day"
- "When you feel comparison scrolling through LinkedIn, remember your unique dharma"
- "During your commute, practice witnessing thoughts without engaging them"

CRITICAL RULES:
1. OUTPUT STRICT JSON - Your response must be valid JSON matching the schema exactly
2. VERSE REFS ONLY - Include only verse references (chapter/verse numbers), NEVER include verse text
3. NO RELIGIOUS NAMES - Never mention "Krishna", "Arjuna", "Bhagavad Gita", or specific religious figures
4. UNIVERSAL WISDOM - Frame teachings as universal wisdom applicable to modern life
5. PRACTICAL FOCUS - Every step must have an actionable practice the user can do TODAY in their MODERN LIFE
6. RELATABLE EXAMPLES - Use examples from modern life: work emails, social media, commute, gym, family dinners
7. SAFETY AWARE - If any user reflection indicates self-harm, return a safety response instead

OUTPUT SCHEMA:
{{
  "step_title": "Brief, inspiring title for today's step",
  "today_focus": "kama|krodha|lobha|moha|mada|matsarya|mixed",
  "verse_refs": [{{"chapter": 2, "verse": 47}}],
  "teaching": "200-400 word teaching weaving together the wisdom from the verses with MODERN-DAY applications and relatable examples from contemporary life...",
  "guided_reflection": ["Reflection question 1 (modern context)", "Reflection question 2 (modern context)", "Reflection question 3 (modern context)"],
  "practice": {{
    "name": "Practice name",
    "instructions": ["Step 1 (specific, modern action)...", "Step 2...", "Step 3..."],
    "duration_minutes": 5
  }},
  "micro_commitment": "One small, specific action the user commits to today IN THEIR MODERN LIFE",
  "check_in_prompt": {{
    "scale": "0-10",
    "label": "How intense is your [enemy] feeling today?"
  }},
  "safety_note": "Optional note if content touches on sensitive topics"
}}

Remember: verse_refs must ONLY contain the references you were given. The user interface will fetch the actual verse text from our corpus of 700+ Gita verses across all 18 chapters."""


SAFETY_DETECTION_PROMPT = """Analyze the following user reflection for signs of crisis or self-harm intent.

USER REFLECTION:
{reflection}

Respond with JSON:
{{"is_crisis": true/false, "confidence": 0.0-1.0, "indicators": ["list of concerning phrases if any"]}}

Be sensitive but not over-cautious. Normal expressions of sadness or difficulty are not crises.
Only flag if there are clear indicators of self-harm ideation, suicide mentions, or acute crisis."""


# =============================================================================
# SECURITY: PROMPT INJECTION PROTECTION
# =============================================================================


def sanitize_user_input(text: str, max_length: int = 2000) -> str:
    """
    Sanitize user input to prevent prompt injection attacks.

    This function:
    1. Truncates to max length
    2. Removes potential injection patterns
    3. Escapes special markers
    4. Removes control characters

    Args:
        text: Raw user input
        max_length: Maximum allowed length

    Returns:
        Sanitized text safe for LLM prompts
    """
    if not text:
        return ""

    # Truncate to prevent context overflow
    sanitized = text[:max_length]

    # Remove common prompt injection patterns
    injection_patterns = [
        r"ignore\s+(previous|above|all)\s+instructions?",
        r"disregard\s+(previous|above|all)\s+instructions?",
        r"forget\s+(previous|above|all)\s+instructions?",
        r"new\s+instructions?:",
        r"system\s*prompt:",
        r"<\s*system\s*>",
        r"<\s*/?\s*instruction\s*>",
        r"\[INST\]",
        r"\[/INST\]",
        r"<<SYS>>",
        r"<</SYS>>",
        r"###\s*Human:",
        r"###\s*Assistant:",
        r"Human:",
        r"Assistant:",
        r"```\s*(system|instruction)",
    ]

    for pattern in injection_patterns:
        sanitized = re.sub(pattern, "[filtered]", sanitized, flags=re.IGNORECASE)

    # Remove control characters (except newlines and tabs)
    sanitized = "".join(
        char for char in sanitized
        if char == "\n" or char == "\t" or (ord(char) >= 32 and ord(char) < 127) or ord(char) > 127
    )

    # Escape any remaining special markers
    sanitized = sanitized.replace("{{", "{ {").replace("}}", "} }")

    return sanitized.strip()


# =============================================================================
# JOURNEY COACH
# =============================================================================


class JourneyCoach:
    """
    KIAAN Journey Coach for generating personalized wisdom journey steps.

    Uses the multi-provider LLM layer with automatic fallback.
    Validates output against strict JSON schema.
    """

    def __init__(self) -> None:
        """Initialize the Journey Coach."""
        self._provider_manager: ProviderManager = get_provider_manager()
        self._gita_adapter: GitaCorpusAdapter = get_gita_corpus_adapter()

        logger.info("JourneyCoach initialized")

    async def generate_step(
        self,
        verse_refs: list[VerseReference],
        enemy_focus: str,
        day_index: int,
        teaching_hint: str | None = None,
        tone: str = "gentle",
        provider_preference: str | None = None,
        user_reflection: str | None = None,
        max_retries: int = 2,
    ) -> tuple[dict[str, Any], str, str]:
        """
        Generate a journey step using KIAAN AI.

        SECURITY: User reflection is sanitized to prevent prompt injection.
        PERFORMANCE: Retry messages are capped to prevent context overflow.

        Args:
            verse_refs: List of verse references to incorporate
            enemy_focus: Primary enemy being addressed
            day_index: Current day in the journey
            teaching_hint: Optional hint for the teaching content
            tone: Response tone (gentle|direct|inspiring)
            provider_preference: LLM provider preference
            user_reflection: Optional user reflection to check for safety
            max_retries: Maximum retry attempts for JSON validation

        Returns:
            Tuple of (step_json, provider_used, model_used)

        Raises:
            AIProviderError: If generation fails after retries
            ValueError: If safety concerns detected in user reflection
        """
        # SECURITY FIX: Sanitize user reflection to prevent prompt injection
        sanitized_reflection: str | None = None
        if user_reflection:
            sanitized_reflection = sanitize_user_input(user_reflection)

            # Check for safety concerns with sanitized input
            safety_result = await self._check_safety(
                sanitized_reflection, provider_preference
            )
            if safety_result:
                return safety_result, "safety_check", "none"

        # Build the system prompt
        system_prompt = build_journey_coach_system_prompt(
            enemy_focus=enemy_focus,
            day_index=day_index,
            teaching_hint=teaching_hint,
            tone=tone,
        )

        # Build the user prompt with verse refs
        verse_ref_str = ", ".join(
            f"Chapter {r['chapter']}, Verse {r['verse']}" for r in verse_refs
        )
        user_prompt = f"""Generate today's journey step (Day {day_index}).

VERSE REFERENCES TO USE (incorporate the wisdom from these verses):
{verse_ref_str}

Remember: Only include the verse references in your response, not the verse text.
Output valid JSON matching the schema exactly."""

        # Initial messages (will be rebuilt on retry to prevent unbounded growth)
        base_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        # Try to generate with retries
        last_error: Exception | None = None
        last_response_content: str = ""

        for attempt in range(max_retries + 1):
            try:
                # PERFORMANCE FIX: Rebuild messages each retry to cap growth
                # Only include the last error context, not accumulated history
                if attempt == 0:
                    messages = base_messages.copy()
                else:
                    # Include only one retry context message to limit token usage
                    messages = base_messages.copy()
                    messages.append({
                        "role": "user",
                        "content": f"Previous attempt failed with error: {last_error}. Please output valid JSON matching the schema exactly.",
                    })

                response, tracking = await self._provider_manager.chat_with_tracking(
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000,
                    response_format={"type": "json_object"},
                    preference=provider_preference,
                )

                last_response_content = response.content

                # Parse and validate JSON
                step_data = self._parse_and_validate_response(
                    response.content,
                    verse_refs,
                    enemy_focus,
                )

                return step_data, tracking["provider_used"], tracking["model_used"]

            except (json.JSONDecodeError, ValueError) as e:
                last_error = e
                logger.warning(
                    f"JSON validation failed (attempt {attempt + 1}/{max_retries + 1}): {e}"
                )

            except AIProviderError as e:
                logger.error(f"Provider error during step generation: {e}")
                raise

        # All retries failed
        raise ValueError(f"Failed to generate valid step after {max_retries + 1} attempts: {last_error}")

    def _parse_and_validate_response(
        self,
        content: str,
        verse_refs: list[VerseReference],
        enemy_focus: str,
    ) -> dict[str, Any]:
        """Parse and validate the LLM response."""
        # Extract JSON if wrapped in markdown
        json_content = self._extract_json(content)

        # Parse JSON
        try:
            data = json.loads(json_content)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            raise

        # Validate with Pydantic
        try:
            validated = JourneyStepSchema(**data)
        except Exception as e:
            logger.error(f"Schema validation error: {e}")
            raise ValueError(f"Schema validation failed: {e}")

        # Ensure verse_refs match what we provided
        provided_refs = {(r["chapter"], r["verse"]) for r in verse_refs}
        returned_refs = {(r.chapter, r.verse) for r in validated.verse_refs}

        if not returned_refs.issubset(provided_refs):
            invalid_refs = returned_refs - provided_refs
            logger.warning(f"LLM returned invalid verse refs: {invalid_refs}")
            # Fix by replacing with provided refs
            data["verse_refs"] = verse_refs

        # Ensure today_focus matches
        if data.get("today_focus") != enemy_focus:
            data["today_focus"] = enemy_focus

        return data

    def _extract_json(self, content: str) -> str:
        """Extract JSON from potentially wrapped content."""
        # Try as-is first
        try:
            json.loads(content)
            return content
        except json.JSONDecodeError:
            pass

        # Try to find JSON in markdown
        patterns = [
            r"```json\s*([\s\S]*?)\s*```",
            r"```\s*([\s\S]*?)\s*```",
            r"\{[\s\S]*\}",
        ]

        for pattern in patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                try:
                    json.loads(match)
                    return match
                except json.JSONDecodeError:
                    continue

        # Return original (will fail validation)
        return content

    async def _check_safety(
        self,
        user_reflection: str,
        provider_preference: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Check user reflection for safety concerns.

        Returns safety response dict if concerns detected, None otherwise.
        """
        if not user_reflection or len(user_reflection) < 10:
            return None

        # Quick keyword check first
        crisis_keywords = [
            "suicide", "kill myself", "end my life", "self-harm",
            "hurt myself", "don't want to live", "no point living",
            "better off dead", "want to die",
        ]

        lower_text = user_reflection.lower()
        has_keywords = any(kw in lower_text for kw in crisis_keywords)

        if not has_keywords:
            return None

        # Use LLM to confirm (reduce false positives)
        try:
            prompt = SAFETY_DETECTION_PROMPT.format(reflection=user_reflection)

            response, _ = await self._provider_manager.chat_with_tracking(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=200,
                response_format={"type": "json_object"},
                preference=provider_preference,
            )

            result = json.loads(self._extract_json(response.content))

            if result.get("is_crisis") and result.get("confidence", 0) > 0.7:
                logger.warning("Safety concern detected in user reflection")
                return self._build_safety_response()

        except Exception as e:
            logger.error(f"Safety check failed: {e}")
            # If safety check fails, err on side of caution
            if has_keywords:
                return self._build_safety_response()

        return None

    def _build_safety_response(self) -> dict[str, Any]:
        """Build a safety response for crisis situations."""
        return {
            "is_safety_response": True,
            "safety_message": (
                "I'm here with you, and I'm concerned about what you've shared. "
                "Your feelings are valid, and you don't have to face this alone. "
                "Please reach out to someone who can help right now."
            ),
            "crisis_resources": [
                "iCall (India): 9152987821",
                "Vandrevala Foundation: 1860-2662-345",
                "AASRA: 91-22-27546669",
                "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/",
            ],
            "gentle_guidance": (
                "Take a slow, deep breath. You are worthy of support and care. "
                "Please talk to someone you trust or call one of these helplines. "
                "We'll be here when you're ready to continue your journey."
            ),
        }


# Singleton instance
_coach_instance: JourneyCoach | None = None


def get_journey_coach() -> JourneyCoach:
    """Get the singleton JourneyCoach instance."""
    global _coach_instance
    if _coach_instance is None:
        _coach_instance = JourneyCoach()
    return _coach_instance


# Convenience export
journey_coach = get_journey_coach()
