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


# ==================== FALLBACK RESPONSES ====================

# Legacy 4-part fallback for backward compatibility
FALLBACK_GUIDANCE: dict[str, dict[str, str]] = {
    "apology": {
        "breathingLine": "Take four slow breaths. Let each exhale soften the moment.",
        "rippleSummary": "You experienced a moment that affected someone you care about.",
        "repairAction": "Offer a sincere apology that acknowledges the moment with genuine care.",
        "forwardIntention": "Move forward with intention to communicate with kindness."
    },
    "clarification": {
        "breathingLine": "Breathe deeply. Clear communication begins with inner calm.",
        "rippleSummary": "A misunderstanding created distance between you and another.",
        "repairAction": "Gently clarify your intention and invite understanding.",
        "forwardIntention": "Speak with clarity and compassion in future interactions."
    },
    "calm_followup": {
        "breathingLine": "Take a centering breath. Calm begins within.",
        "rippleSummary": "A tense moment left residue in your connection.",
        "repairAction": "Return with warmth and re-center the conversation.",
        "forwardIntention": "Practice responding with patience and presence."
    },
    "self-forgive": {
        "breathingLine": "Breathe in self-compassion. Breathe out self-judgment.",
        "rippleSummary": "You are holding yourself to impossible standards.",
        "repairAction": "Release self-blame and choose kindness toward yourself.",
        "forwardIntention": "Practice self-compassion as you would show others."
    }
}


# Shad-Ripu descriptions for fallback guidance personalization
_SHAD_RIPU_DESCRIPTIONS: dict[str, str] = {
    "kama": "desire and attachment (kama) — the craving that blinds the wise",
    "krodha": "anger (krodha) — the fire that the Gita calls the gate to self-destruction",
    "lobha": "greed and grasping (lobha) — the hunger that can never be satisfied",
    "moha": "delusion and attachment (moha) — the veil that obscures your true nature",
    "mada": "ego and pride (mada) — the false self that mistakes itself for the atman",
    "matsarya": "envy and jealousy (matsarya) — the poison of comparison that steals peace",
}

# Shad-Ripu to Gita verse mapping for fallback guidance
_SHAD_RIPU_GITA_VERSES: dict[str, str] = {
    "kama": "BG 3.37 teaches: 'It is desire, it is anger, born of the rajasic guna, all-devouring and most sinful — know this as the enemy here.'",
    "krodha": "BG 2.63 warns: 'From anger comes delusion; from delusion, loss of memory; from loss of memory, destruction of intelligence; and from that, one perishes.'",
    "lobha": "BG 14.17 teaches: 'From sattva arises knowledge, from rajas arises greed, and from tamas arise negligence, delusion and ignorance.'",
    "moha": "BG 2.13 teaches: 'Just as the embodied soul passes through childhood, youth and old age, so too does it pass into another body — the wise are not deluded by this.'",
    "mada": "BG 16.4 warns: 'Ostentation, arrogance, pride, anger, harshness and ignorance — these belong to one born of demoniac nature.'",
    "matsarya": "BG 12.13 teaches: 'One who is free from malice toward all beings, friendly and compassionate — such a devotee is dear to Me.'",
}

# Problem category to Gita context mapping for fallback guidance
_CATEGORY_GITA_CONTEXT: dict[str, str] = {
    "relationship_conflict": "The Gita teaches that all relationships are a field of karma — how we treat others reflects our inner state. Your relationship struggle is recognized by Krishna as one of the deepest tests of dharma.",
    "work_career": "The Gita's central teaching on karma yoga (BG 3.19) speaks directly to your work struggle: perform your duty without attachment to results. Your worth is not measured by recognition but by the sincerity of your effort.",
    "self_worth": "Krishna tells Arjuna (BG 6.5): 'Let one lift oneself by one's own Self; let not one degrade oneself.' Your struggle with self-worth is the very battle the Gita was spoken to address — you are the eternal atman, worthy beyond measure.",
    "family_tensions": "The Gita begins with Arjuna's own family conflict — torn between duty and love. Krishna's answer applies to your situation: follow your swadharma (own duty) even when family expectations pull you away from your truth.",
    "anxiety_health": "BG 2.66 speaks directly to your anxiety: 'For one who has no peace, how can there be happiness?' Your restless mind is what the Gita calls the 'uncontrolled mind' — and Krishna gives the exact remedy: abhyasa (practice) and vairagya (detachment).",
    "loss_grief": "The Gita's most comforting teaching was spoken for moments exactly like yours. BG 2.20: 'The soul is never born and never dies.' Your grief honors the love — and the Gita assures you that what you loved was never truly lost.",
    "betrayal_injustice": "When Arjuna faced betrayal by those he trusted, Krishna did not minimize his pain. Instead, He taught equanimity (BG 2.56): 'One who is undisturbed by suffering, free from attachment, fear and anger — such a sage is called sthitaprajna.' Your pain is valid; the Gita shows you how to carry it without being consumed.",
    "spiritual_crisis": "Arjuna's own spiritual crisis — his total collapse of purpose in Chapter 1 — IS the reason the Gita exists. Every word Krishna spoke was to a man who had lost all meaning. Your crisis is not a failure; it is the beginning of awakening.",
    "addiction": "The Gita speaks directly to addiction in BG 2.62-63: contemplation of sense objects leads to attachment, from attachment springs desire, from desire arises anger, and from anger comes delusion. Your struggle with addiction is this chain — and the Gita provides the exact method to break it: vairagya (detachment) practiced with abhyasa (consistent effort, BG 6.35).",
    "financial_stress": "The Gita teaches (BG 2.15) that the contacts of the senses with their objects give rise to feelings of cold and heat, pleasure and pain — they are transient. Your financial worry is real, but the Gita reminds you that your true wealth is the imperishable atman. BG 3.12 warns against enjoying resources without offering — balance duty with detachment, and act from dharma rather than fear.",
    "loneliness": "The Gita reveals (BG 6.29) that one who sees the Self in all beings and all beings in the Self never feels alone. Your loneliness is the ego's illusion of separateness. Krishna promises (BG 9.29): 'I am equally present in all beings; no one is hateful or dear to Me.' The divine presence dwells in every being around you — you are never truly alone.",
    "parenting": "Arjuna's own dilemma was about family — duty to elders, responsibility to the next generation. The Gita teaches (BG 3.21): whatever a great person does, others follow. Your parenting struggle is swadharma — your unique sacred duty — and the Gita affirms that performing one's own duty imperfectly is better than another's duty perfectly (BG 3.35).",
    "academic_pressure": "The Gita's core teaching applies directly to your academic pressure: BG 2.47 — you have a right to study and effort, never to the results. Krishna tells Arjuna (BG 6.17): yoga of moderation — balanced in eating, sleeping, recreation, and work — is the path to freedom from suffering. Excellence comes from balance, not burnout.",
    "social_anxiety": "The Gita describes the sthitaprajna (BG 2.56) — one undisturbed by suffering, free from attachment, fear, and anger. Social anxiety is the fear of judgment — and the Gita teaches (BG 12.15) that one who is not disturbed by others and who does not disturb others is dear to the divine. Your worth does not depend on others' opinions.",
    "decision_paralysis": "Arjuna's entire crisis was decision paralysis — frozen between two duties on the battlefield. Krishna's answer spans 18 chapters but begins with BG 2.31-33: consider your swadharma first. The Gita's decision framework is clear: act according to your nature and duty, without attachment to outcome. BG 18.63 says: deliberate on this fully, then do as you wish.",
    "chronic_illness": "The Gita's most compassionate teaching for chronic suffering is BG 2.14: sense contacts causing pleasure and pain are impermanent — endure them bravely, O Bharata. Your body is the kshetra (field) — you are the kshetrajna (knower of the field), untouched by its conditions (BG 13.1). The atman within you is beyond all physical suffering.",
}

# Breath context per shad-ripu for Phase 3 fallback
_BREATH_CONTEXT_TEMPLATE: dict[str, str] = {
    "krodha": "You came here carrying the fire of anger connected to {situation}. With each exhale, release that fire. Let the cool breath dissolve the heat that burns both you and {feeling}. The anger served a purpose — it told you something mattered. But now let it go.",
    "moha": "You came here lost in the fog of confusion about {situation}. With each exhale, release that fog. Let clarity flow in with each inhale. The confusion around {feeling} is moha's grip — and breath is what loosens it.",
    "kama": "You came here gripped by the craving connected to {situation}. With each exhale, release that grip. Let contentment fill the space where desire consumed you. The attachment to {feeling} transforms with each breath into love without chains.",
    "lobha": "You came here with the grasping that drives {situation}. With each exhale, release the clenched fist. Let your hands and heart open. The clinging around {feeling} softens with each breath — trust that what is truly yours will remain.",
    "mada": "You came here weighed down by the ego and pride behind {situation}. With each exhale, release that weight. Let humility soften what has hardened. The wall between you and {feeling} dissolves breath by breath.",
    "matsarya": "You came here carrying the poison of comparison that fuels {situation}. With each exhale, release that poison. Let gratitude for your unique path fill each inhale. The envy that distances you from {feeling} has no power over the atman.",
    "default": "You came here carrying the weight of {situation}. With each exhale, release that weight. Let each inhale bring fresh prana — life force — into the spaces where {feeling} has created tension. The Gita teaches (BG 4.29) that pranayama is a sacred offering. Cross the bridge between body and mind now, breath by breath.",
}


def get_deep_fallback_guidance(
    karmic_path: dict,
    situation: str = "",
    feeling: str = "",
    shad_ripu: str = "",
    healing_insight: str = "",
    problem_category: str = "",
) -> dict:
    """
    Generate deep fallback guidance from static Gita wisdom when AI is unavailable.

    Uses the karmic path's pre-mapped teachings, verses, and sadhana to provide
    meaningful guidance personalized to the user's specific problem.

    Args:
        karmic_path: Full karmic path data from KARMIC_PATHS
        situation: User's description of their problem
        feeling: Who was affected
        shad_ripu: Identified inner enemy driving the problem
        healing_insight: Gita-based healing insight for the problem
        problem_category: Life problem category

    Returns:
        Complete guidance dictionary with 7 personalized phases and sadhana
    """
    path_name = karmic_path.get("name", "The Path of Wisdom")
    core_verse = karmic_path.get("core_verse", {})
    teaching = karmic_path.get("karmic_teaching", "")
    sadhana = karmic_path.get("sadhana", [])
    guna = karmic_path.get("guna_analysis", "")

    # Build situation-aware phrases
    situation_short = situation[:120] if situation else "this karmic moment"
    situation_full = situation if situation else "this karmic moment"
    feeling_text = feeling if feeling else "those around you"

    enemy_desc = _SHAD_RIPU_DESCRIPTIONS.get(shad_ripu, "the restless gunas of prakriti")
    enemy_name = shad_ripu.title() if shad_ripu else "Rajas"
    enemy_verse = _SHAD_RIPU_GITA_VERSES.get(
        shad_ripu,
        "BG 3.27 teaches: 'All actions are performed by the gunas of prakriti "
        "— the self, deluded by ego, thinks I am the doer.'"
    )
    category_context = _CATEGORY_GITA_CONTEXT.get(problem_category, "")

    # Build 7-phase guidance from static wisdom
    phases = []
    phase_defs = SEVEN_PHASES

    # Phase 1: Sthiti Pariksha (Witness Awareness)
    phases.append({
        "phase": 1,
        "name": phase_defs[0]["name"],
        "sanskrit_name": phase_defs[0]["sanskrit_name"],
        "english_name": phase_defs[0]["english_name"],
        "icon": phase_defs[0]["icon"],
        "guidance": (
            f"Close your eyes and breathe. You came here because: {situation_full}. "
            f"This is real. This is your pain. And the Gita sees it. "
            f"{category_context} "
            f"Now, step back and become the sakshi — the witness. The Gita teaches (BG 13.22): "
            f"the Supreme Self in the body is the witness, the consenter, the sustainer. "
            f"From this witnessing place, your situation — {situation_short} — "
            f"becomes something you are experiencing, not something you ARE. "
            f"You are the eternal awareness. This problem exists in your life, but it does not define your being."
        ),
    })

    # Phase 2: Karma Darshan (Karmic Insight)
    phases.append({
        "phase": 2,
        "name": phase_defs[1]["name"],
        "sanskrit_name": phase_defs[1]["sanskrit_name"],
        "english_name": phase_defs[1]["english_name"],
        "icon": phase_defs[1]["icon"],
        "guidance": (
            f"Now let us look deeper at what is truly happening. Your situation — {situation_short} — "
            f"is not random. It has a root, and the Gita names it precisely: {enemy_desc}. "
            f"{enemy_verse} "
            f"In your specific case, {enemy_name} manifested as the force behind "
            f"'{situation_short}.' {guna} "
            f"This is not to blame you — the Gita is clear (BG 3.27): all actions are performed by the gunas, "
            f"the self deluded by ego thinks 'I am the doer.' "
            f"Recognizing {enemy_name} as the true driver — not your atman — is the first liberation. "
            f"You are not this pattern. You can transform it."
        ),
    })

    # Phase 3: Pranayama Shuddhi (Sacred Breath)
    breath_template = _BREATH_CONTEXT_TEMPLATE.get(shad_ripu, _BREATH_CONTEXT_TEMPLATE.get("default", ""))
    if breath_template:
        breath_line = breath_template.format(situation=situation_short, feeling=feeling_text)
    else:
        breath_line = (
            f"You came here carrying the agitated energy of {situation_short}. "
            f"With each exhale, release it. Let each inhale bring clarity to your "
            f"relationship with {feeling_text}."
        )
    phases.append({
        "phase": 3,
        "name": phase_defs[2]["name"],
        "sanskrit_name": phase_defs[2]["sanskrit_name"],
        "english_name": phase_defs[2]["english_name"],
        "icon": phase_defs[2]["icon"],
        "guidance": (
            f"Take seven deep breaths using the 4-7-8 pattern: inhale for 4 counts, hold for 7, exhale for 8. "
            f"{breath_line} "
            f"The Gita teaches (BG 4.29): some offer the outgoing breath into the incoming, restraining both. "
            f"This sacred breath purification calms the storm that {situation_short} has created within you — "
            f"so you can respond from wisdom, not from {enemy_name}'s reactivity."
        ),
    })

    # Phase 4: Pashchataap (Deep Acknowledgment)
    phases.append({
        "phase": 4,
        "name": phase_defs[3]["name"],
        "sanskrit_name": phase_defs[3]["sanskrit_name"],
        "english_name": phase_defs[3]["english_name"],
        "icon": phase_defs[3]["icon"],
        "guidance": (
            f"Now acknowledge the full reality of your situation with dharmic clarity. "
            f"Not guilt — which the Gita calls tamasic and leads to paralysis — but honest recognition. "
            f"Your situation — {situation_short} — has created ripples that touched {feeling_text}. "
            f"See those ripples clearly. How has {feeling_text} been affected? What changed because of this? "
            f"The Gita praises the courage of truthful self-assessment. "
            f"Arjuna himself had to face the full weight of his situation before Krishna could guide him forward. "
            f"This is not self-punishment — this is you standing in truth about {situation_short}, "
            f"which is the only foundation upon which genuine transformation through {path_name} can begin."
        ),
    })

    # Phase 5: Prayaschitta (Sacred Repair)
    repair_teaching = teaching if teaching else "The path of dharmic action transforms suffering into wisdom."
    healing_line = f" The Gita's wisdom for your specific situation: {healing_insight}" if healing_insight else ""
    phases.append({
        "phase": 5,
        "name": phase_defs[4]["name"],
        "sanskrit_name": phase_defs[4]["sanskrit_name"],
        "english_name": phase_defs[4]["english_name"],
        "icon": phase_defs[4]["icon"],
        "guidance": (
            f"Here is where the Gita's wisdom becomes your concrete action plan for {situation_short}. "
            f"Your path is {path_name}, and here is exactly how it applies to YOUR situation: "
            f"{repair_teaching}{healing_line} "
            f"The Gita teaches (BG 2.47): 'Your right is to the action alone, never to its fruits.' "
            f"For your specific situation, this means: take the repair action for {feeling_text} "
            f"as nishkama karma — sacred, desireless action. Do it because it is dharma — "
            f"not because you seek a specific outcome from {feeling_text}, not because you want relief from guilt. "
            f"The repair of {situation_short} itself is the offering. Begin today. Begin now."
        ),
    })

    # Phase 6: Sankalpa (Sacred Intention)
    phases.append({
        "phase": 6,
        "name": phase_defs[5]["name"],
        "sanskrit_name": phase_defs[5]["sanskrit_name"],
        "english_name": phase_defs[5]["english_name"],
        "icon": phase_defs[5]["icon"],
        "guidance": (
            f"Set your sankalpa — your sacred intention. Not just for {situation_short}, "
            f"but to transform the deeper pattern of {enemy_desc} that created it. "
            f"The Gita teaches (BG 6.5): 'Let one lift oneself by one's own Self; let not one degrade oneself.' "
            f"Your sankalpa: 'The next time {enemy_name} arises in my life — "
            f"in my relationship with {feeling_text}, in situations like {situation_short} — "
            f"I will recognize it as the guna acting, not as my true self. "
            f"I choose {path_name} as my dharmic response instead.' "
            f"Commit to the daily sadhana below. This is how you ensure that {situation_short} "
            f"becomes not a wound that repeats, but a turning point that transforms."
        ),
    })

    # Phase 7: Gita Darshan (Wisdom Integration)
    verse_text = core_verse.get("english", "Perform your duty without attachment to results.")
    sanskrit_text = core_verse.get("sanskrit", "")
    chapter = core_verse.get("chapter", "")
    verse_num = core_verse.get("verse", "")
    verse_ref = f"BG {chapter}.{verse_num}" if chapter and verse_num else ""
    gita_principle = karmic_path.get("gita_principle", "")
    phases.append({
        "phase": 7,
        "name": phase_defs[6]["name"],
        "sanskrit_name": phase_defs[6]["sanskrit_name"],
        "english_name": phase_defs[6]["english_name"],
        "icon": phase_defs[6]["icon"],
        "guidance": (
            f"Receive this teaching from the Gita, spoken across millennia directly to you — "
            f"to someone carrying exactly what you carry with {situation_short}"
            f"{f' ({verse_ref})' if verse_ref else ''}: "
            f"\"{verse_text}\" "
            f"{f'— {sanskrit_text}' if sanskrit_text else ''} "
            f"{f'{gita_principle} ' if gita_principle else ''}"
            f"This is not abstract philosophy — this verse was preserved for 5,000 years "
            f"so it could reach YOU in this exact moment, facing {situation_short}. "
            f"Through {path_name}, your relationship with {feeling_text} transforms, "
            f"your struggle with {enemy_name} transforms, and {situation_short} "
            f"transforms from suffering into wisdom, from karma into dharma. "
            f"You are not the same person who began this journey seven phases ago."
        ),
    })

    return {
        "phases": phases,
        "sadhana": sadhana,
    }


def get_legacy_fallback_guidance(repair_type: str) -> dict:
    """Get legacy 4-part fallback guidance for backward compatibility."""
    repair = repair_type.lower().replace("_", "-").replace(" ", "-")

    if repair in FALLBACK_GUIDANCE:
        return FALLBACK_GUIDANCE[repair]

    for key in FALLBACK_GUIDANCE:
        if key in repair or repair in key:
            return FALLBACK_GUIDANCE[key]

    return FALLBACK_GUIDANCE["apology"]


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
