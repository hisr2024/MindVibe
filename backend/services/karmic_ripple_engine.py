"""
Karmic Ripple Analysis Engine

A sophisticated system for analyzing the ripple effects of actions and emotions,
grounded in Bhagavad Gita's karma philosophy and modern behavioral science.

This engine provides:
1. Action-Consequence Mapping based on Gita karma principles
2. Samskara (Imprint) Pattern Recognition
3. Vasana (Tendency) Analysis
4. Guna (Quality) Transformation Guidance
5. Ripple Effect Visualization Data

Core Gita Concepts:
- Karma: Every action has consequences (BG 4.17)
- Nishkama Karma: Action without attachment to fruits (BG 2.47)
- Samskaras: Mental imprints from repeated actions (BG 18.60)
- Vasanas: Latent tendencies driving behavior (BG 7.27)
- Gunas: Qualities coloring all actions (BG 14.5)

Research foundations:
- Behavioral chain analysis (DBT)
- Consequence mapping (ABA)
- Pattern recognition in behavioral therapy
"""

import datetime
import logging
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from backend.services.mood_analytics_engine import (
    Guna,
    MoodAnalysis,
    mood_analytics,
)

logger = logging.getLogger(__name__)


# =============================================================================
# CORE DATA STRUCTURES
# =============================================================================

class KarmicIntent(Enum):
    """
    Intent behind an action (Bhagavad Gita perspective).

    The Gita emphasizes that intent colors the karma:
    - Sattvic intent: For the good of all, without ego
    - Rajasic intent: For personal gain or recognition
    - Tamasic intent: From ignorance or harmful motives
    """
    SATTVIC = "sattvic"   # Pure, selfless, for universal good
    RAJASIC = "rajasic"   # Passionate, self-interested
    TAMASIC = "tamasic"   # Ignorant, harmful, destructive


class ActionType(Enum):
    """
    Types of actions in karmic analysis.

    From Bhagavad Gita Chapter 18:
    - Thought (manasa): Mental actions
    - Speech (vacha): Verbal actions
    - Body (karmana): Physical actions
    """
    THOUGHT = "thought"   # Internal mental action
    SPEECH = "speech"     # Verbal/written communication
    BODY = "body"         # Physical action


class RippleTimeframe(Enum):
    """Timeframe for karmic ripple effects."""
    IMMEDIATE = "immediate"  # Seconds to minutes
    SHORT_TERM = "short_term"  # Hours to days
    MEDIUM_TERM = "medium_term"  # Weeks to months
    LONG_TERM = "long_term"  # Years to lifetime
    TRANSGENERATIONAL = "transgenerational"  # Beyond one lifetime (patterns passed on)


class SamskaraType(Enum):
    """
    Types of Samskaras (mental imprints).

    Samskaras are grooves in the mind created by repeated actions.
    They can be:
    - Constructive: Leading to growth and liberation
    - Destructive: Creating suffering and bondage
    - Neutral: Neither particularly helpful nor harmful
    """
    CONSTRUCTIVE = "constructive"
    DESTRUCTIVE = "destructive"
    NEUTRAL = "neutral"


@dataclass
class RippleEffect:
    """
    A single ripple effect from an action.

    Represents one consequence in the chain of cause and effect.
    """
    description: str
    timeframe: RippleTimeframe
    affected_domain: str  # relationships, self, work, etc.
    intensity: float  # 0.0 to 1.0
    valence: str  # positive, negative, neutral
    guna: Guna
    reversibility: float  # 0.0 (irreversible) to 1.0 (fully reversible)

    def to_dict(self) -> dict[str, Any]:
        return {
            "description": self.description,
            "timeframe": self.timeframe.value,
            "affected_domain": self.affected_domain,
            "intensity": round(self.intensity, 2),
            "valence": self.valence,
            "guna": self.guna.value,
            "reversibility": round(self.reversibility, 2),
        }


@dataclass
class KarmicChain:
    """
    A chain of cause and effect from initial action.

    Represents the full ripple analysis with multiple effects.
    """
    initial_action: str
    action_type: ActionType
    initial_intent: KarmicIntent
    guna_quality: Guna

    # Analysis results
    ripple_effects: list[RippleEffect] = field(default_factory=list)
    samskara_impact: str = ""
    vasana_pattern: str = ""

    # Transformation guidance
    repair_path: str = ""
    gita_wisdom: str = ""
    nishkama_alternative: str = ""  # How to do the same action without attachment

    # Metrics
    total_karma_weight: float = 0.0  # -1 to +1 (negative to positive)
    reversibility_score: float = 0.5

    def to_dict(self) -> dict[str, Any]:
        return {
            "initial_action": self.initial_action,
            "action_type": self.action_type.value,
            "initial_intent": self.initial_intent.value,
            "guna_quality": self.guna_quality.value,
            "ripple_effects": [r.to_dict() for r in self.ripple_effects],
            "samskara_impact": self.samskara_impact,
            "vasana_pattern": self.vasana_pattern,
            "repair_path": self.repair_path,
            "gita_wisdom": self.gita_wisdom,
            "nishkama_alternative": self.nishkama_alternative,
            "total_karma_weight": round(self.total_karma_weight, 2),
            "reversibility_score": round(self.reversibility_score, 2),
        }


@dataclass
class RepairAction:
    """
    A specific action to repair karmic damage.

    Based on Gita principles of:
    - Acknowledging harm (praayaschita)
    - Corrective action (prayatna)
    - Letting go of results (vairagya)
    """
    action_description: str
    action_type: ActionType
    timing: str  # When to do it
    difficulty: float  # 0.0 (easy) to 1.0 (challenging)
    expected_outcome: str
    gita_support: str  # Verse or principle that supports this

    def to_dict(self) -> dict[str, Any]:
        return {
            "action_description": self.action_description,
            "action_type": self.action_type.value,
            "timing": self.timing,
            "difficulty": round(self.difficulty, 2),
            "expected_outcome": self.expected_outcome,
            "gita_support": self.gita_support,
        }


@dataclass
class KarmicResetPlan:
    """
    Complete plan for karmic reset/repair.

    Integrates all analysis into actionable guidance.
    """
    # Context
    situation: str
    who_affected: str
    repair_type: str

    # Analysis
    mood_analysis: MoodAnalysis | None = None
    karmic_chain: KarmicChain | None = None

    # Reset plan
    breathing_guidance: str = ""
    ripple_acknowledgment: str = ""
    repair_actions: list[RepairAction] = field(default_factory=list)
    forward_intention: str = ""

    # Integration
    key_verse: str = ""
    mantra: str = ""
    daily_practice: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "situation": self.situation,
            "who_affected": self.who_affected,
            "repair_type": self.repair_type,
            "mood_analysis": self.mood_analysis.to_dict() if self.mood_analysis else None,
            "karmic_chain": self.karmic_chain.to_dict() if self.karmic_chain else None,
            "breathing_guidance": self.breathing_guidance,
            "ripple_acknowledgment": self.ripple_acknowledgment,
            "repair_actions": [r.to_dict() for r in self.repair_actions],
            "forward_intention": self.forward_intention,
            "key_verse": self.key_verse,
            "mantra": self.mantra,
            "daily_practice": self.daily_practice,
        }


# =============================================================================
# RIPPLE EFFECT TEMPLATES
# =============================================================================

# Templates for different action categories
RIPPLE_TEMPLATES: dict[str, dict[str, Any]] = {
    "harsh_words": {
        "action_type": ActionType.SPEECH,
        "default_intent": KarmicIntent.RAJASIC,
        "default_guna": Guna.RAJAS,
        "ripples": [
            {
                "description": "The recipient feels hurt, their emotional state drops",
                "timeframe": RippleTimeframe.IMMEDIATE,
                "affected_domain": "relationships",
                "intensity": 0.7,
                "valence": "negative",
                "reversibility": 0.6,
            },
            {
                "description": "Trust erodes slightly - they remember this moment",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "relationships",
                "intensity": 0.5,
                "valence": "negative",
                "reversibility": 0.5,
            },
            {
                "description": "You carry residual guilt/regret, affecting your peace",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "self",
                "intensity": 0.4,
                "valence": "negative",
                "reversibility": 0.7,
            },
            {
                "description": "Pattern reinforcement - harsh speech becomes easier next time",
                "timeframe": RippleTimeframe.LONG_TERM,
                "affected_domain": "self",
                "intensity": 0.3,
                "valence": "negative",
                "reversibility": 0.4,
            },
        ],
        "samskara": "Reactive speech samskara - tendency to lash out when stressed",
        "vasana": "Anger vasana - latent irritability seeking expression",
        "repair_path": "Sincere apology acknowledging specific harm, followed by demonstrated change",
        "nishkama": "Express your needs clearly and calmly, without needing them to respond a certain way",
    },
    "broken_promise": {
        "action_type": ActionType.BODY,
        "default_intent": KarmicIntent.TAMASIC,
        "default_guna": Guna.TAMAS,
        "ripples": [
            {
                "description": "The other person's plans are disrupted",
                "timeframe": RippleTimeframe.IMMEDIATE,
                "affected_domain": "relationships",
                "intensity": 0.6,
                "valence": "negative",
                "reversibility": 0.5,
            },
            {
                "description": "Their trust in your word diminishes",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "relationships",
                "intensity": 0.7,
                "valence": "negative",
                "reversibility": 0.4,
            },
            {
                "description": "Your self-trust weakens - you doubt your own commitments",
                "timeframe": RippleTimeframe.MEDIUM_TERM,
                "affected_domain": "self",
                "intensity": 0.5,
                "valence": "negative",
                "reversibility": 0.6,
            },
        ],
        "samskara": "Avoidance samskara - tendency to overcommit then withdraw",
        "vasana": "Fear of confrontation driving false agreements",
        "repair_path": "Acknowledge the broken promise specifically, make amends where possible, commit only to what you can deliver",
        "nishkama": "Commit only to what aligns with your capacity, not what you think they want to hear",
    },
    "self_criticism": {
        "action_type": ActionType.THOUGHT,
        "default_intent": KarmicIntent.TAMASIC,
        "default_guna": Guna.TAMAS,
        "ripples": [
            {
                "description": "Your inner peace is disrupted, anxiety rises",
                "timeframe": RippleTimeframe.IMMEDIATE,
                "affected_domain": "self",
                "intensity": 0.6,
                "valence": "negative",
                "reversibility": 0.8,
            },
            {
                "description": "Motivation decreases, action becomes harder",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "self",
                "intensity": 0.5,
                "valence": "negative",
                "reversibility": 0.7,
            },
            {
                "description": "Self-worth gradually erodes",
                "timeframe": RippleTimeframe.LONG_TERM,
                "affected_domain": "self",
                "intensity": 0.7,
                "valence": "negative",
                "reversibility": 0.5,
            },
        ],
        "samskara": "Self-judgment samskara - habitual inner critic",
        "vasana": "Unworthiness vasana - deep belief in inadequacy",
        "repair_path": "Self-forgiveness practice, recognizing you are not your mistakes",
        "nishkama": "Observe mistakes without identifying with them - you are the witness, not the error",
    },
    "neglecting_duty": {
        "action_type": ActionType.BODY,
        "default_intent": KarmicIntent.TAMASIC,
        "default_guna": Guna.TAMAS,
        "ripples": [
            {
                "description": "Tasks pile up, creating future stress",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "work",
                "intensity": 0.5,
                "valence": "negative",
                "reversibility": 0.7,
            },
            {
                "description": "Others may have to compensate for your inaction",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "relationships",
                "intensity": 0.4,
                "valence": "negative",
                "reversibility": 0.6,
            },
            {
                "description": "Procrastination pattern strengthens",
                "timeframe": RippleTimeframe.LONG_TERM,
                "affected_domain": "self",
                "intensity": 0.5,
                "valence": "negative",
                "reversibility": 0.4,
            },
        ],
        "samskara": "Inertia samskara - resistance to action",
        "vasana": "Fear of failure driving avoidance",
        "repair_path": "Start with smallest possible step, build momentum through action",
        "nishkama": "Do your duty because it is your duty, not for the outcome",
    },
    "jealousy_expressed": {
        "action_type": ActionType.THOUGHT,
        "default_intent": KarmicIntent.RAJASIC,
        "default_guna": Guna.RAJAS,
        "ripples": [
            {
                "description": "Your inner peace is disturbed by comparison",
                "timeframe": RippleTimeframe.IMMEDIATE,
                "affected_domain": "self",
                "intensity": 0.6,
                "valence": "negative",
                "reversibility": 0.7,
            },
            {
                "description": "Relationship may be strained if expressed",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "relationships",
                "intensity": 0.5,
                "valence": "negative",
                "reversibility": 0.6,
            },
            {
                "description": "Gratitude diminishes, dissatisfaction grows",
                "timeframe": RippleTimeframe.MEDIUM_TERM,
                "affected_domain": "self",
                "intensity": 0.4,
                "valence": "negative",
                "reversibility": 0.6,
            },
        ],
        "samskara": "Comparison samskara - measuring self against others",
        "vasana": "Scarcity vasana - belief there isn't enough for everyone",
        "repair_path": "Practice mudita (sympathetic joy) - genuinely celebrate others' success",
        "nishkama": "Focus on your own path without comparing to others' journeys",
    },
    "kindness_shown": {
        "action_type": ActionType.BODY,
        "default_intent": KarmicIntent.SATTVIC,
        "default_guna": Guna.SATTVA,
        "ripples": [
            {
                "description": "The recipient feels valued and supported",
                "timeframe": RippleTimeframe.IMMEDIATE,
                "affected_domain": "relationships",
                "intensity": 0.6,
                "valence": "positive",
                "reversibility": 1.0,
            },
            {
                "description": "They may pay it forward to someone else",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "world",
                "intensity": 0.4,
                "valence": "positive",
                "reversibility": 1.0,
            },
            {
                "description": "Your own sense of purpose and connection deepens",
                "timeframe": RippleTimeframe.SHORT_TERM,
                "affected_domain": "self",
                "intensity": 0.5,
                "valence": "positive",
                "reversibility": 1.0,
            },
            {
                "description": "Kindness samskara strengthens - generosity becomes natural",
                "timeframe": RippleTimeframe.LONG_TERM,
                "affected_domain": "self",
                "intensity": 0.4,
                "valence": "positive",
                "reversibility": 1.0,
            },
        ],
        "samskara": "Generosity samskara - natural inclination to help",
        "vasana": "Abundance vasana - belief in shared prosperity",
        "repair_path": "Continue cultivating selfless service (seva)",
        "nishkama": "Give without expectation of return or recognition",
    },
}


# =============================================================================
# REPAIR TYPE MAPPINGS
# =============================================================================

REPAIR_TYPE_GUIDANCE: dict[str, dict[str, str]] = {
    "apology": {
        "breathing_focus": "Ground yourself before speaking. Steady breath, steady heart.",
        "repair_principle": "True apology acknowledges specific harm without justification.",
        "gita_wisdom": "The wise grieve neither for the living nor the dead (BG 2.11) - release attachment to being 'right'",
        "forward_intention": "I commit to conscious speech, speaking only what is true, kind, and necessary.",
        "mantra": "I acknowledge my impact. I am willing to change.",
    },
    "clarification": {
        "breathing_focus": "Clear breath for clear communication. Let go of defensiveness.",
        "repair_principle": "Seek first to understand, then to be understood.",
        "gita_wisdom": "The steadfast in wisdom abandon both good and evil (BG 2.50) - transcend the need to be 'right'",
        "forward_intention": "I commit to listening fully before responding.",
        "mantra": "Truth spoken with compassion heals. I speak to connect, not to win.",
    },
    "calm_followup": {
        "breathing_focus": "Extended exhale activates your parasympathetic system. Calm body, calm words.",
        "repair_principle": "Respond from your centered self, not your reactive self.",
        "gita_wisdom": "Yoga is skill in action (BG 2.50) - respond with precision, not impulse",
        "forward_intention": "I choose measured response over reactive outburst.",
        "mantra": "I am not my emotions. I witness and choose my response.",
    },
    "self_forgive": {
        "breathing_focus": "Breathe compassion into your heart space. You deserve the same kindness you'd give others.",
        "repair_principle": "Self-forgiveness is not excusing, it's releasing the burden so you can act better.",
        "gita_wisdom": "Even if you are the most sinful of sinners, you shall cross over all sin by the raft of knowledge (BG 4.36)",
        "forward_intention": "I release self-punishment and commit to growth.",
        "mantra": "I am learning. My mistakes do not define me. I am the witness, not the action.",
    },
}


# =============================================================================
# KARMIC RIPPLE ENGINE
# =============================================================================

class KarmicRippleEngine:
    """
    Engine for analyzing karmic ripple effects of actions.

    Combines Gita wisdom with behavioral science to help users:
    1. Understand the full impact of their actions
    2. See patterns (samskaras) driving behavior
    3. Find paths to repair and transformation
    4. Cultivate nishkama karma (action without attachment)
    """

    def __init__(self) -> None:
        """Initialize the Karmic Ripple Engine."""
        self._analytics = mood_analytics
        logger.info("KarmicRippleEngine initialized")

    def analyze_situation(
        self,
        situation: str,
        who_affected: str,
        repair_type: str,
        emotional_context: str | None = None,
    ) -> KarmicResetPlan:
        """
        Perform full karmic analysis and generate reset plan.

        Args:
            situation: Description of what happened
            who_affected: Who was affected by the action
            repair_type: Type of repair needed (apology, clarification, etc.)
            emotional_context: Optional additional emotional context

        Returns:
            Complete KarmicResetPlan with analysis and guidance
        """
        # Step 1: Analyze emotional state
        analysis_text = f"{situation} {emotional_context or ''}"
        mood = self._analytics.analyze(analysis_text)

        # Step 2: Determine action category
        action_category = self._categorize_action(situation)

        # Step 3: Generate karmic chain
        chain = self._build_karmic_chain(situation, action_category, mood)

        # Step 4: Get repair guidance
        repair_guidance = REPAIR_TYPE_GUIDANCE.get(
            repair_type.lower().replace("-", "_").replace(" ", "_"),
            REPAIR_TYPE_GUIDANCE["apology"]
        )

        # Step 5: Generate personalized repair actions
        repair_actions = self._generate_repair_actions(
            situation, who_affected, repair_type, mood, chain
        )

        # Step 6: Build complete plan
        plan = KarmicResetPlan(
            situation=situation,
            who_affected=who_affected,
            repair_type=repair_type,
            mood_analysis=mood,
            karmic_chain=chain,
            breathing_guidance=self._generate_breathing_guidance(mood, repair_guidance),
            ripple_acknowledgment=self._generate_ripple_acknowledgment(chain, who_affected),
            repair_actions=repair_actions,
            forward_intention=repair_guidance["forward_intention"],
            key_verse=repair_guidance["gita_wisdom"],
            mantra=repair_guidance["mantra"],
            daily_practice=self._generate_daily_practice(chain, mood),
        )

        return plan

    def _categorize_action(self, situation: str) -> str:
        """Categorize the situation into a known action type."""
        situation_lower = situation.lower()

        # Check for speech-related actions
        speech_keywords = [
            "said", "told", "yelled", "shouted", "words", "spoke", "texted",
            "messaged", "harsh", "rude", "mean", "cruel"
        ]
        if any(kw in situation_lower for kw in speech_keywords):
            return "harsh_words"

        # Check for broken promises
        promise_keywords = [
            "promise", "committed", "said i would", "supposed to",
            "didn't show", "forgot", "broke", "failed to"
        ]
        if any(kw in situation_lower for kw in promise_keywords):
            return "broken_promise"

        # Check for self-criticism
        self_keywords = [
            "myself", "i'm such", "i'm so", "hate myself", "stupid",
            "worthless", "failure", "can't do anything"
        ]
        if any(kw in situation_lower for kw in self_keywords):
            return "self_criticism"

        # Check for neglecting duty
        duty_keywords = [
            "didn't do", "procrastinated", "avoided", "ignored",
            "put off", "lazy", "didn't finish"
        ]
        if any(kw in situation_lower for kw in duty_keywords):
            return "neglecting_duty"

        # Check for jealousy
        jealousy_keywords = [
            "jealous", "envious", "why do they", "not fair",
            "they have", "i don't have", "comparing"
        ]
        if any(kw in situation_lower for kw in jealousy_keywords):
            return "jealousy_expressed"

        # Default
        return "harsh_words"

    def _build_karmic_chain(
        self,
        situation: str,
        category: str,
        mood: MoodAnalysis
    ) -> KarmicChain:
        """Build the karmic chain analysis."""
        template = RIPPLE_TEMPLATES.get(category, RIPPLE_TEMPLATES["harsh_words"])

        # Create ripple effects from template
        ripples = []
        for r in template["ripples"]:
            ripple = RippleEffect(
                description=r["description"],
                timeframe=r["timeframe"],
                affected_domain=r["affected_domain"],
                intensity=r["intensity"],
                valence=r["valence"],
                guna=template["default_guna"],
                reversibility=r["reversibility"],
            )
            ripples.append(ripple)

        # Calculate overall karma weight
        karma_weight = sum(
            r.intensity * (-1 if r.valence == "negative" else 1)
            for r in ripples
        ) / len(ripples) if ripples else 0

        # Calculate reversibility score
        reversibility = sum(r.reversibility for r in ripples) / len(ripples) if ripples else 0.5

        chain = KarmicChain(
            initial_action=situation,
            action_type=template["action_type"],
            initial_intent=template["default_intent"],
            guna_quality=template["default_guna"],
            ripple_effects=ripples,
            samskara_impact=template["samskara"],
            vasana_pattern=template["vasana"],
            repair_path=template["repair_path"],
            gita_wisdom=self._get_gita_wisdom_for_chain(mood, template["default_guna"]),
            nishkama_alternative=template["nishkama"],
            total_karma_weight=karma_weight,
            reversibility_score=reversibility,
        )

        return chain

    def _get_gita_wisdom_for_chain(self, mood: MoodAnalysis, guna: Guna) -> str:
        """Get appropriate Gita wisdom based on state."""
        if guna == Guna.RAJAS:
            return "He who is free from attachment, who is not elated by success nor depressed by failure, such a one possesses balanced wisdom. (BG 2.57)"
        elif guna == Guna.TAMAS:
            return "Action is indeed better than inaction. Even the maintenance of your body cannot be accomplished without action. (BG 3.8)"
        else:
            return "Perform your duty equipoised, abandoning all attachment to success or failure. Such equanimity is called Yoga. (BG 2.48)"

    def _generate_repair_actions(
        self,
        situation: str,
        who_affected: str,
        repair_type: str,
        mood: MoodAnalysis,
        chain: KarmicChain,
    ) -> list[RepairAction]:
        """Generate specific repair actions based on analysis."""
        actions = []

        repair_type_normalized = repair_type.lower().replace("-", "_").replace(" ", "_")

        if repair_type_normalized == "apology":
            actions.append(RepairAction(
                action_description=f"Acknowledge specifically how your actions affected {who_affected}",
                action_type=ActionType.SPEECH,
                timing="When both parties are calm, within 24-48 hours",
                difficulty=0.6,
                expected_outcome="They feel heard and validated",
                gita_support="Speak the truth which is pleasant (BG 17.15)",
            ))
            actions.append(RepairAction(
                action_description="Express what you wish you had done differently, without excuses",
                action_type=ActionType.SPEECH,
                timing="During the same conversation",
                difficulty=0.5,
                expected_outcome="Shows genuine understanding and growth",
                gita_support="Perform action with equanimity (BG 2.48)",
            ))
            actions.append(RepairAction(
                action_description="Commit to a specific changed behavior",
                action_type=ActionType.SPEECH,
                timing="As part of the apology",
                difficulty=0.4,
                expected_outcome="Trust begins to rebuild through demonstrated change",
                gita_support="By Karma Yoga, one attains the highest (BG 3.19)",
            ))

        elif repair_type_normalized == "clarification":
            actions.append(RepairAction(
                action_description="Request a calm moment to discuss the misunderstanding",
                action_type=ActionType.SPEECH,
                timing="When emotions have settled",
                difficulty=0.4,
                expected_outcome="Creates space for productive dialogue",
                gita_support="The wise speak with gentle words (BG 17.15)",
            ))
            actions.append(RepairAction(
                action_description="Listen fully to their perspective before sharing yours",
                action_type=ActionType.BODY,
                timing="During the conversation",
                difficulty=0.6,
                expected_outcome="Full understanding before response",
                gita_support="Control of the senses leads to wisdom (BG 2.68)",
            ))

        elif repair_type_normalized == "calm_followup":
            actions.append(RepairAction(
                action_description="Pause and take 5 deep breaths before any response",
                action_type=ActionType.BODY,
                timing="Immediately, before speaking",
                difficulty=0.5,
                expected_outcome="Activated parasympathetic response, calmer state",
                gita_support="The controlled mind is a friend (BG 6.6)",
            ))
            actions.append(RepairAction(
                action_description="Express your needs without blame or accusation",
                action_type=ActionType.SPEECH,
                timing="After grounding",
                difficulty=0.7,
                expected_outcome="Clear communication without escalation",
                gita_support="Speak what is true, pleasant, and beneficial (BG 17.15)",
            ))

        elif repair_type_normalized in ["self_forgive", "self-forgive"]:
            actions.append(RepairAction(
                action_description="Write down what happened without judgment, as if observing another",
                action_type=ActionType.THOUGHT,
                timing="In a quiet moment today",
                difficulty=0.5,
                expected_outcome="Separation between self and action",
                gita_support="The wise see action in inaction (BG 4.18)",
            ))
            actions.append(RepairAction(
                action_description="Identify what you were trying to protect or express through the action",
                action_type=ActionType.THOUGHT,
                timing="After writing",
                difficulty=0.6,
                expected_outcome="Compassionate understanding of motivation",
                gita_support="All beings are born into delusion (BG 7.27)",
            ))
            actions.append(RepairAction(
                action_description="Speak compassionately to yourself as you would to a dear friend",
                action_type=ActionType.SPEECH,
                timing="Daily, especially when self-criticism arises",
                difficulty=0.4,
                expected_outcome="New samskara of self-compassion",
                gita_support="You are dear to Me (BG 18.65)",
            ))

        return actions

    def _generate_breathing_guidance(
        self,
        mood: MoodAnalysis,
        repair_guidance: dict[str, str]
    ) -> str:
        """Generate personalized breathing guidance."""
        base = repair_guidance["breathing_focus"]

        # Add specific pattern based on arousal
        if mood.emotion_vector.arousal > 0.5:
            pattern = "Use the calming pattern: Inhale 4, Hold 4, Exhale 6, Hold 2. The extended exhale activates your parasympathetic nervous system."
        elif mood.emotion_vector.arousal < -0.3:
            pattern = "Use the energizing pattern: Inhale 5, Hold 2, Exhale 4, Hold 1. This gently builds energy while maintaining calm."
        else:
            pattern = "Use box breathing: Inhale 4, Hold 4, Exhale 4, Hold 4. This creates perfect balance."

        return f"{base}\n\n{pattern}"

    def _generate_ripple_acknowledgment(
        self,
        chain: KarmicChain,
        who_affected: str
    ) -> str:
        """Generate acknowledgment of ripple effects."""
        parts = ["Your action created ripples:"]

        for ripple in chain.ripple_effects[:3]:  # Top 3 effects
            parts.append(f"• {ripple.description}")

        parts.append(f"\nThese ripples affected: {who_affected}")
        parts.append(f"\nThe good news: Reversibility score is {chain.reversibility_score:.0%}")

        return "\n".join(parts)

    def _generate_daily_practice(
        self,
        chain: KarmicChain,
        mood: MoodAnalysis
    ) -> str:
        """Generate recommended daily practice based on analysis."""
        practices = []

        # Based on guna imbalance
        if mood.guna_balance.get("rajas", 0) > 0.5:
            practices.append("5 minutes of silent sitting meditation to cultivate stillness")
        if mood.guna_balance.get("tamas", 0) > 0.5:
            practices.append("Morning walk or gentle movement to build energy")

        # Based on samskara
        if "reactive" in chain.samskara_impact.lower():
            practices.append("PAUSE practice: Before speaking, ask - Is it True? Is it Kind? Is it Necessary?")
        if "avoidance" in chain.samskara_impact.lower():
            practices.append("One small action daily toward what you're avoiding")
        if "judgment" in chain.samskara_impact.lower():
            practices.append("Self-compassion phrases morning and evening")

        # Default
        if not practices:
            practices.append("5 minutes of conscious breathing with gratitude")

        return " | ".join(practices)

    def get_ripple_visualization_data(
        self,
        chain: KarmicChain
    ) -> dict[str, Any]:
        """
        Generate data for visual ripple effect display.

        Returns data suitable for frontend visualization.
        """
        circles = []

        for i, ripple in enumerate(chain.ripple_effects):
            # Convert timeframe to radius multiplier
            radius_map = {
                RippleTimeframe.IMMEDIATE: 1,
                RippleTimeframe.SHORT_TERM: 2,
                RippleTimeframe.MEDIUM_TERM: 3,
                RippleTimeframe.LONG_TERM: 4,
                RippleTimeframe.TRANSGENERATIONAL: 5,
            }
            radius = radius_map.get(ripple.timeframe, 2)

            # Color based on valence
            color_map = {
                "positive": "#4CAF50",  # Green
                "negative": "#F44336",  # Red
                "neutral": "#9E9E9E",   # Gray
            }
            color = color_map.get(ripple.valence, "#9E9E9E")

            circles.append({
                "id": f"ripple_{i}",
                "radius": radius,
                "intensity": ripple.intensity,
                "color": color,
                "label": ripple.description[:50],
                "domain": ripple.affected_domain,
                "timeframe": ripple.timeframe.value,
                "reversibility": ripple.reversibility,
            })

        return {
            "center_action": chain.initial_action[:50],
            "center_intent": chain.initial_intent.value,
            "center_guna": chain.guna_quality.value,
            "ripple_circles": circles,
            "total_karma": chain.total_karma_weight,
            "can_heal": chain.reversibility_score > 0.5,
        }


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

karmic_ripple_engine = KarmicRippleEngine()
