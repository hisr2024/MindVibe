"""
Karma Reset Engine - AI-Powered Karmic Transformation Orchestrator.

Extracts the AI guidance generation logic from the route handler into a
dedicated engine class. Manages the OpenAI client lifecycle, builds
situation-aware system prompts, parses structured JSON responses, and
provides graceful fallback when AI is unavailable.

The engine sits between KarmaResetService (data preparation / verse retrieval)
and the API route (HTTP concerns), owning the AI orchestration layer.

Gita Foundation (BG 4.38):
"In this world, there is nothing so purifying as knowledge.
One who is perfected in yoga finds it within the self in due course of time."
"""

import json
import logging
import os
from typing import Any

from openai import AsyncOpenAI

from backend.services.karma_reset_service import KarmaResetService
from backend.services.gita_karma_wisdom import KARMIC_PATHS, SEVEN_PHASES

logger = logging.getLogger(__name__)


# Shad-Ripu display names for prompt injection
_SHAD_RIPU_NAMES: dict[str, str] = {
    "kama": "Kama (desire/attachment)",
    "krodha": "Krodha (anger/rage)",
    "lobha": "Lobha (greed/grasping)",
    "moha": "Moha (delusion/confusion)",
    "mada": "Mada (ego/pride)",
    "matsarya": "Matsarya (envy/jealousy)",
}

# Phase keys expected in the AI JSON response
_PHASE_KEYS: list[str] = [
    "phase_1_witness_awareness",
    "phase_2_karmic_insight",
    "phase_3_sacred_breath",
    "phase_4_deep_acknowledgment",
    "phase_5_sacred_repair",
    "phase_6_sacred_intention",
    "phase_7_wisdom_integration",
]

# Legacy guidance keys
_LEGACY_KEYS: list[str] = [
    "breathingLine",
    "rippleSummary",
    "repairAction",
    "forwardIntention",
]


class KarmaResetEngine:
    """
    AI-powered Karma Reset Engine that generates personalized 7-phase
    karmic transformation guidance grounded in Bhagavad Gita wisdom.

    Responsibilities:
    - Manages AsyncOpenAI client lifecycle
    - Builds situation-aware system prompts combining wisdom context
      with problem analysis data
    - Calls the AI model and parses structured JSON responses
    - Falls back to static Gita wisdom when AI is unavailable
    - Returns structured guidance ready for the API response
    """

    def __init__(self) -> None:
        """Initialize the engine with OpenAI client and karma reset service."""
        self._service = KarmaResetService()
        self._client: AsyncOpenAI | None = None
        self._ready = False
        self._model = os.getenv("KARMA_RESET_MODEL", "gpt-4")

        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and openai_key != "your-api-key-here":
            try:
                self._client = AsyncOpenAI(api_key=openai_key, timeout=30.0)
                self._ready = True
                logger.info("KarmaResetEngine: AsyncOpenAI client initialized")
            except Exception as e:
                logger.error(f"KarmaResetEngine: Failed to initialize OpenAI: {e}")
        else:
            logger.warning("KarmaResetEngine: OPENAI_API_KEY not configured")

    @property
    def ready(self) -> bool:
        """Whether the AI client is initialized and ready."""
        return self._ready

    @property
    def service(self) -> KarmaResetService:
        """Access the underlying KarmaResetService for data preparation."""
        return self._service

    async def generate(
        self,
        db: Any,
        path_key: str,
        situation: str,
        feeling: str,
        problem_category: str = "",
        problem_id: str = "",
        shad_ripu: str = "",
        healing_insight: str = "",
    ) -> dict[str, Any]:
        """
        Generate complete karma reset guidance with AI + fallback.

        Orchestrates the full pipeline:
        1. Prepare deep reset data via KarmaResetService
        2. Build the AI system prompt with wisdom + problem context
        3. Call the AI model and parse structured JSON
        4. Fall back to static Gita wisdom on failure
        5. Validate guidance with Five Pillar compliance
        6. Return structured result for the API response

        Args:
            db: Async database session
            path_key: Karmic path key or legacy repair type
            situation: User's description of what happened
            feeling: Who was affected by the situation
            problem_category: Life problem category for richer context
            problem_id: Specific problem template ID
            shad_ripu: Identified inner enemy (kama, krodha, etc.)
            healing_insight: Gita-grounded healing insight

        Returns:
            Dictionary containing:
            - karmic_path: Resolved path data
            - deep_guidance: 7-phase guidance with sadhana and verses
            - reset_guidance: Legacy 4-part guidance (backward compat)
            - kiaan_metadata: Validation scores and verse data
            - model_used: Which model produced the guidance
        """
        # Step 1: Prepare deep reset data (path, verses, context)
        deep_data = await self._prepare_deep_data(db, path_key, situation, feeling)
        resolved_path = (
            KARMIC_PATHS.get(path_key)
            or self._service.resolve_karmic_path(path_key)
        )

        # Step 2: Attempt AI generation
        ai_guidance, legacy_guidance, model_used = await self._generate_ai_guidance(
            deep_data=deep_data,
            resolved_path=resolved_path,
            situation=situation,
            feeling=feeling,
            problem_category=problem_category,
            shad_ripu=shad_ripu,
            healing_insight=healing_insight,
        )

        # Step 3: Apply fallbacks
        if ai_guidance is None:
            from backend.routes.karma_reset_kiaan import get_deep_fallback_guidance
            ai_guidance = get_deep_fallback_guidance(
                resolved_path,
                situation=situation,
                feeling=feeling,
                shad_ripu=shad_ripu,
                healing_insight=healing_insight,
                problem_category=problem_category,
            )
            model_used = "fallback"

        if legacy_guidance is None:
            from backend.routes.karma_reset_kiaan import get_legacy_fallback_guidance
            legacy_guidance = get_legacy_fallback_guidance(
                resolved_path.get("repair_type_legacy", "apology")
            )

        # Step 4: Validate guidance with Five Pillar compliance
        validation_result = await self._validate_guidance(ai_guidance, deep_data)

        # Step 5: Build structured result
        return self._build_result(
            deep_data=deep_data,
            ai_guidance=ai_guidance,
            legacy_guidance=legacy_guidance,
            validation_result=validation_result,
            path_key=path_key,
            model_used=model_used,
        )

    async def _prepare_deep_data(
        self,
        db: Any,
        path_key: str,
        situation: str,
        feeling: str,
    ) -> dict[str, Any]:
        """Prepare deep reset data via KarmaResetService with error fallback."""
        try:
            deep_data = await self._service.generate_deep_reset(
                db=db,
                path_key=path_key,
                situation=situation,
                feeling=feeling,
            )
            logger.info(
                f"Deep reset data prepared: {deep_data['verse_results_count']} verses"
            )
            return deep_data
        except Exception as e:
            logger.error(f"Error generating deep reset data: {e}")
            fallback_path = KARMIC_PATHS.get(path_key, KARMIC_PATHS["kshama"])
            return {
                "karmic_path": {
                    "key": path_key,
                    "name": fallback_path.get("name", ""),
                    "sanskrit_name": fallback_path.get("sanskrit_name", ""),
                    "description": fallback_path.get("description", ""),
                    "gita_principle": fallback_path.get("gita_principle", ""),
                    "karmic_teaching": fallback_path.get("karmic_teaching", ""),
                    "guna_analysis": fallback_path.get("guna_analysis", ""),
                    "themes": fallback_path.get("themes", []),
                },
                "core_verse": fallback_path.get("core_verse", {}),
                "supporting_verses": fallback_path.get("supporting_verses", []),
                "sadhana": fallback_path.get("sadhana", []),
                "seven_phases": SEVEN_PHASES,
                "verse_display": [],
                "wisdom_context": "",
                "verse_results_count": 0,
            }

    async def _generate_ai_guidance(
        self,
        deep_data: dict[str, Any],
        resolved_path: dict[str, Any],
        situation: str,
        feeling: str,
        problem_category: str,
        shad_ripu: str,
        healing_insight: str,
    ) -> tuple[dict[str, Any] | None, dict[str, str] | None, str]:
        """
        Generate AI-powered guidance via OpenAI.

        Returns:
            Tuple of (ai_guidance, legacy_guidance, model_used).
            ai_guidance and legacy_guidance are None if AI fails.
        """
        if not self._ready or not self._client:
            return None, None, "fallback"

        try:
            system_prompt = self._build_system_prompt(
                deep_data=deep_data,
                resolved_path=resolved_path,
                situation=situation,
                feeling=feeling,
                problem_category=problem_category,
                shad_ripu=shad_ripu,
                healing_insight=healing_insight,
            )

            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": (
                            "Generate the deep 7-phase karma reset guidance "
                            "in JSON format. Make it profound, personal, and "
                            "grounded in Gita wisdom."
                        ),
                    },
                ],
                temperature=0.75,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )

            guidance_text = "{}"
            if response and response.choices and len(response.choices) > 0:
                msg = response.choices[0].message
                if msg and msg.content:
                    guidance_text = msg.content

            try:
                ai_data = json.loads(guidance_text)
            except (json.JSONDecodeError, ValueError) as parse_err:
                logger.error(f"AI JSON parse error: {parse_err}")
                return None, None, "fallback"

            # Build structured 7-phase guidance from AI response
            ai_guidance = self._parse_phase_guidance(ai_data, deep_data)

            # Extract legacy 4-part guidance
            legacy_guidance = {k: ai_data.get(k, "") for k in _LEGACY_KEYS}
            if not all(legacy_guidance.get(k) for k in _LEGACY_KEYS):
                legacy_guidance = None

            return ai_guidance, legacy_guidance, self._model

        except Exception as e:
            logger.error(f"OpenAI error during karma reset: {e}")
            return None, None, "fallback"

    def _parse_phase_guidance(
        self,
        ai_data: dict[str, Any],
        deep_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Parse AI response into structured 7-phase guidance."""
        phase_defs = SEVEN_PHASES
        phases = []
        for i, key in enumerate(_PHASE_KEYS):
            phase_def = phase_defs[i]
            phases.append({
                "phase": i + 1,
                "name": phase_def["name"],
                "sanskrit_name": phase_def["sanskrit_name"],
                "english_name": phase_def["english_name"],
                "icon": phase_def["icon"],
                "guidance": ai_data.get(key, phase_def["description"]),
            })
        return {
            "phases": phases,
            "sadhana": deep_data.get("sadhana", []),
        }

    def _build_system_prompt(
        self,
        deep_data: dict[str, Any],
        resolved_path: dict[str, Any],
        situation: str,
        feeling: str,
        problem_category: str,
        shad_ripu: str,
        healing_insight: str,
    ) -> str:
        """
        Build the comprehensive system prompt for AI guidance generation.

        Combines wisdom context from KarmaResetService with problem analysis
        data to create a deeply personalized prompt.
        """
        wisdom_context = deep_data.get("wisdom_context", "")
        path_name = resolved_path.get("name", "Kshama")
        path_teaching = resolved_path.get("karmic_teaching", "")
        gita_principle = resolved_path.get("gita_principle", "")

        # Build problem-specific context block
        problem_block = ""
        if problem_category or shad_ripu or healing_insight:
            problem_block = "\nPROBLEM ANALYSIS (weave this into EVERY phase):"
            if problem_category:
                problem_block += (
                    f"\n- LIFE AREA: {problem_category.replace('_', ' ').title()}"
                )
            if shad_ripu:
                enemy_name = _SHAD_RIPU_NAMES.get(shad_ripu, shad_ripu.title())
                problem_block += (
                    f"\n- INNER ENEMY (Shad-Ripu): {enemy_name} — this is the "
                    f"root force driving their suffering. Each phase must name "
                    f"and address this enemy specifically."
                )
            if healing_insight:
                problem_block += f"\n- GITA HEALING INSIGHT: {healing_insight}"
            problem_block += "\n"

        shad_ripu_ref = shad_ripu or "rajas/tamas"
        shad_ripu_or_force = shad_ripu or "the driving force"

        return f"""You are KIAAN — a sacred wisdom guide for deep karmic transformation, strictly grounded in Bhagavad Gita teachings.

A seeker comes to you with a REAL problem that is causing them suffering:
- THEIR EXACT PROBLEM: "{situation}"
- WHO IS AFFECTED: "{feeling}"
- CHOSEN KARMIC PATH: "{path_name}"
- KARMIC PATH TEACHING: "{path_teaching}"
- GITA PRINCIPLE: "{gita_principle}"
{problem_block}
{wisdom_context}

MISSION: Generate a DEEP 7-phase karmic transformation where EVERY phase does TWO things:
1. Addresses their SPECIFIC real-life problem ("{situation}") by name — so they feel "the Gita knows MY situation"
2. Shows EXACTLY how a specific Gita verse or teaching resolves THEIR particular suffering — not abstract wisdom, but "here is what the Gita says about YOUR exact problem"

The person should feel: "This is not generic spiritual advice. The Gita is speaking to ME, about MY situation, and giving ME a path forward."

Respond in JSON format with these exact keys:

{{
  "phase_1_witness_awareness": "4-6 sentences. FIRST: State their exact problem back to them ('{situation}') so they know you understand. THEN: Show them HOW the Gita's sakshi (witness) teaching (BG 13.22) applies to THEIR specific situation — not as abstract philosophy, but as 'When you are in the middle of [their situation], step back and observe from the atman.' End by showing what their problem looks like from the witness perspective.",
  "phase_2_karmic_insight": "4-6 sentences. DIAGNOSE: Name the inner enemy {shad_ripu_ref} and show EXACTLY how it created THEIR specific situation ('{situation}'). Quote the specific Gita verse about this enemy. Show the cause-and-effect: '{shad_ripu_or_force}' led to THIS action, which led to THIS consequence for {feeling}. Make them see the karmic mechanics behind their real problem.",
  "phase_3_sacred_breath": "3-4 sentences. Connect the breath practice to THEIR specific emotional state caused by '{situation}'. Name what they are physically feeling (racing heart from anxiety, clenched jaw from anger, heaviness from grief, restlessness from confusion). Make the pranayama feel like medicine prescribed specifically for the emotion THEIR problem creates.",
  "phase_4_deep_acknowledgment": "4-6 sentences. Help them see the FULL picture of '{situation}' with dharmic clarity. Name SPECIFICALLY how {feeling} was affected. What ripple did their situation create? The Gita does not ask for guilt — it asks for TRUTH. Show them what honest recognition looks like for THEIR exact situation. Reference how Arjuna too had to face his full reality before Krishna could guide him.",
  "phase_5_sacred_repair": "5-7 sentences. THIS IS THE MOST IMPORTANT PHASE. Give them a CONCRETE, SPECIFIC action plan for '{situation}' grounded in {path_name}. What EXACTLY should they do about their problem? What should they say to {feeling}? What specific behavior should they change? Quote BG 2.47 and show how nishkama karma applies to THEIR repair. Make it so specific they can act on it within 24 hours.",
  "phase_6_sacred_intention": "4-5 sentences. Help them set a sankalpa for the PATTERN behind '{situation}' — not just this one incident. Show how {shad_ripu_or_force} will try to recreate similar situations in the future. Give them a SPECIFIC recognition phrase: 'When I feel [trigger from their situation] arising again, I will...' Connect to BG 6.5.",
  "phase_7_wisdom_integration": "4-6 sentences. Deliver the core Gita verse from the chosen path AS IF IT WAS WRITTEN FOR '{situation}'. Do NOT just quote the verse — SHOW them: 'When the Gita says [verse], it is speaking about exactly what you went through with [their situation]. It means that [specific application to their problem].' End with concrete hope.",
  "breathingLine": "1-2 sentences connecting breath specifically to the emotion caused by '{situation}'",
  "rippleSummary": "1-2 sentences naming exactly how '{situation}' affected {feeling}",
  "repairAction": "1-2 sentences with the specific first step they should take about '{situation}' today",
  "forwardIntention": "1-2 sentences describing how their life with {feeling} transforms after this reset"
}}

CRITICAL REQUIREMENTS:
- EVERY phase must mention their actual problem ("{situation}") — not paraphrased into vague spiritual language
- EVERY phase must show HOW a specific Gita teaching applies to THEIR real-life situation
- The Gita wisdom must serve their problem, not the other way around
- Name the inner enemy ({shad_ripu_or_force}) by name in phases 2, 5, and 6
- Phase 5 must contain ACTIONABLE steps specific to THEIR problem that they can act on TODAY
- {feeling} must be mentioned by name in phases 1, 4, 5, and 7
- Be warm, compassionate, non-judgmental — like a wise friend who truly understands their specific pain
- All suggestions must be 100% Gita-compliant"""

    async def _validate_guidance(
        self,
        ai_guidance: dict[str, Any],
        deep_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Validate guidance against Five Pillar compliance."""
        all_guidance_text: dict[str, str] = {}
        phases = ai_guidance.get("phases", [])
        for phase in phases:
            phase_key = f"phase_{phase['phase']}"
            all_guidance_text[phase_key] = phase.get("guidance", "")

        return await self._service.validate_reset_guidance(
            guidance=all_guidance_text,
            verse_context=deep_data.get("wisdom_context", ""),
        )

    def _build_result(
        self,
        deep_data: dict[str, Any],
        ai_guidance: dict[str, Any],
        legacy_guidance: dict[str, str],
        validation_result: dict[str, Any],
        path_key: str,
        model_used: str,
    ) -> dict[str, Any]:
        """Assemble the final structured result for the API response."""
        verse_display = deep_data.get("verse_display", [])
        verse_metadata = []
        for vd in verse_display[:5]:
            verse_metadata.append({
                "verse_id": vd.get("verse_id", ""),
                "chapter": vd.get("chapter", 0),
                "verse_number": vd.get("verse_number", 0),
                "sanskrit": vd.get("sanskrit", ""),
                "transliteration": vd.get("transliteration", ""),
                "english": vd.get("english", ""),
                "hindi": vd.get("hindi", ""),
                "theme": vd.get("theme", ""),
                "score": vd.get("score", 0.0),
            })

        return {
            "karmic_path": deep_data.get("karmic_path", {"key": path_key}),
            "deep_guidance": {
                "phases": ai_guidance.get("phases", []),
                "sadhana": ai_guidance.get(
                    "sadhana", deep_data.get("sadhana", [])
                ),
                "core_verse": deep_data.get("core_verse", {}),
                "supporting_verses": deep_data.get("supporting_verses", []),
            },
            "reset_guidance": legacy_guidance,
            "kiaan_metadata": {
                "verses_used": deep_data.get("verse_results_count", 0),
                "verses": verse_metadata,
                "validation_passed": validation_result.get("valid", False),
                "validation_score": validation_result.get("score", 0.0),
                "five_pillar_score": validation_result.get(
                    "five_pillar_score", 0.0
                ),
                "compliance_level": validation_result.get(
                    "compliance_level", ""
                ),
                "pillars_met": validation_result.get("pillars_met", 0),
                "gita_terms_found": validation_result.get(
                    "gita_terms_found", []
                )[:10],
                "wisdom_context": deep_data.get("wisdom_context", "")[:300],
            },
            "model_used": model_used,
        }
