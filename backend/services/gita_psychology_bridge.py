"""
Gita-Psychology Bridge

A sophisticated integration layer that maps modern psychological concepts
to Bhagavad Gita wisdom, enabling scientifically-grounded spiritual guidance.

This bridge connects:
- CBT distortions → Gita teachings on Maya (illusion)
- Emotional regulation → Yoga paths (Karma, Jnana, Bhakti, Dhyana)
- Mindfulness → Dhyana Yoga principles
- ACT (psychological flexibility) → Nishkama Karma
- Self-Compassion → Divine love teachings

The goal: Translate validated psychological interventions into language
that resonates with Gita wisdom while maintaining clinical effectiveness.
"""

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from backend.services.mood_analytics_engine import (
    CognitiveDistortion,
    EmotionalQuadrant,
    Guna,
    MoodAnalysis,
)

logger = logging.getLogger(__name__)


# =============================================================================
# GITA CONCEPTS
# =============================================================================

class YogaPath(Enum):
    """
    The four main yoga paths from Bhagavad Gita.

    Each path suits different temperaments and leads to the same goal.
    """
    KARMA = "karma"    # Path of selfless action (BG Ch. 3)
    JNANA = "jnana"    # Path of knowledge/wisdom (BG Ch. 4)
    BHAKTI = "bhakti"  # Path of devotion/love (BG Ch. 12)
    DHYANA = "dhyana"  # Path of meditation (BG Ch. 6)


class GitaConcept(Enum):
    """Core Bhagavad Gita concepts relevant to mental wellness."""

    # Self & Identity
    ATMAN = "atman"                    # True Self, beyond body-mind
    AHAMKARA = "ahamkara"              # Ego, sense of I-ness
    SAKSHI = "sakshi"                  # Witness consciousness

    # Action & Consequence
    KARMA = "karma"                    # Action and its effects
    NISHKAMA_KARMA = "nishkama_karma"  # Action without attachment to results
    SVADHARMA = "svadharma"            # One's own duty/nature

    # Mental States
    MAYA = "maya"                      # Illusion, distorted perception
    STHITAPRAJNA = "sthitaprajna"      # Stable wisdom, equanimity
    PRASADA = "prasada"                # Grace, inner peace

    # Transformation
    VAIRAGYA = "vairagya"              # Non-attachment, letting go
    ABHYASA = "abhyasa"                # Consistent practice
    SHRADDHA = "shraddha"              # Faith, trust

    # Gunas (Qualities)
    SATTVA = "sattva"                  # Purity, harmony
    RAJAS = "rajas"                    # Passion, activity
    TAMAS = "tamas"                    # Inertia, darkness


@dataclass
class GitaVersePrescription:
    """
    A verse prescription for a specific psychological state.

    Includes the verse reference, translation, and practical application.
    """
    chapter: int
    verse: int
    theme: str
    translation: str
    application: str
    practice: str
    psychological_parallel: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "reference": f"BG {self.chapter}.{self.verse}",
            "theme": self.theme,
            "translation": self.translation,
            "application": self.application,
            "practice": self.practice,
            "psychological_parallel": self.psychological_parallel,
        }


@dataclass
class PsychologicalBridge:
    """
    Bridge between psychological concept and Gita teaching.
    """
    psychological_concept: str
    psychological_description: str
    gita_concept: GitaConcept
    gita_explanation: str
    integration_insight: str
    practical_technique: str
    verses: list[tuple[int, int]] = field(default_factory=list)  # (chapter, verse)

    def to_dict(self) -> dict[str, Any]:
        return {
            "psychological_concept": self.psychological_concept,
            "psychological_description": self.psychological_description,
            "gita_concept": self.gita_concept.value,
            "gita_explanation": self.gita_explanation,
            "integration_insight": self.integration_insight,
            "practical_technique": self.practical_technique,
            "supporting_verses": [f"BG {c}.{v}" for c, v in self.verses],
        }


# =============================================================================
# DISTORTION-TO-GITA MAPPING
# =============================================================================

DISTORTION_GITA_MAPPING: dict[CognitiveDistortion, PsychologicalBridge] = {
    CognitiveDistortion.ALL_OR_NOTHING: PsychologicalBridge(
        psychological_concept="All-or-Nothing Thinking",
        psychological_description="Seeing things in absolute black-and-white categories",
        gita_concept=GitaConcept.STHITAPRAJNA,
        gita_explanation="The person of steady wisdom (Sthitaprajna) transcends dualities, seeing beyond success/failure, pleasure/pain dichotomies (BG 2.57)",
        integration_insight="Reality exists in gradients. The wise see beyond extreme categories to find the middle path of discernment.",
        practical_technique="When you notice 'always' or 'never' thoughts, pause and ask: 'What would a person of steady wisdom see here?'",
        verses=[(2, 57), (2, 48), (6, 9)],
    ),

    CognitiveDistortion.CATASTROPHIZING: PsychologicalBridge(
        psychological_concept="Catastrophizing",
        psychological_description="Expecting the worst possible outcome",
        gita_concept=GitaConcept.SHRADDHA,
        gita_explanation="Faith (Shraddha) is not blind belief but trust in the process. The universe unfolds as it should (BG 4.39)",
        integration_insight="The mind projects fear onto an unknown future. Trust that you have handled challenges before and will again.",
        practical_technique="Replace 'What if everything goes wrong?' with 'I have survived 100% of my hardest days so far.'",
        verses=[(4, 39), (18, 66), (9, 22)],
    ),

    CognitiveDistortion.OVERGENERALIZATION: PsychologicalBridge(
        psychological_concept="Overgeneralization",
        psychological_description="Drawing broad conclusions from single events",
        gita_concept=GitaConcept.MAYA,
        gita_explanation="Maya (illusion) causes us to see patterns that don't exist, mistaking the temporary for the permanent (BG 7.14)",
        integration_insight="One event is one event. The mind creates false patterns from fear. See each moment freshly.",
        practical_technique="When you think 'This always happens,' ask: 'Is this truly always, or is it this specific situation?'",
        verses=[(7, 14), (4, 35), (13, 29)],
    ),

    CognitiveDistortion.MIND_READING: PsychologicalBridge(
        psychological_concept="Mind Reading",
        psychological_description="Assuming you know what others are thinking",
        gita_concept=GitaConcept.AHAMKARA,
        gita_explanation="The ego (Ahamkara) projects its own fears onto others. We see our insecurities reflected in imagined judgments (BG 3.27)",
        integration_insight="You cannot know another's mind. What you imagine they think often reveals your own self-judgment.",
        practical_technique="Replace 'They must think...' with 'I'm imagining they think... What do I actually know?'",
        verses=[(3, 27), (16, 18), (13, 7)],
    ),

    CognitiveDistortion.FORTUNE_TELLING: PsychologicalBridge(
        psychological_concept="Fortune Telling",
        psychological_description="Predicting negative outcomes with certainty",
        gita_concept=GitaConcept.NISHKAMA_KARMA,
        gita_explanation="Attachment to future outcomes causes suffering. Act with full presence, releasing control of results (BG 2.47)",
        integration_insight="The future is not written. Your actions now shape what unfolds. Focus on what you can control.",
        practical_technique="When predicting failure, ask: 'What action can I take NOW that aligns with my values?'",
        verses=[(2, 47), (18, 57), (4, 20)],
    ),

    CognitiveDistortion.EMOTIONAL_REASONING: PsychologicalBridge(
        psychological_concept="Emotional Reasoning",
        psychological_description="Believing feelings are facts",
        gita_concept=GitaConcept.SAKSHI,
        gita_explanation="The witness (Sakshi) observes emotions without being consumed by them. Feelings arise and pass; you are the awareness behind them (BG 2.14)",
        integration_insight="Feelings are signals, not truths. You can feel anxious without there being danger. Observe, don't identify.",
        practical_technique="Practice: 'I notice I'm feeling [emotion]' rather than 'I am [emotion].' You are the noticer.",
        verses=[(2, 14), (2, 58), (6, 19)],
    ),

    CognitiveDistortion.SHOULD_STATEMENTS: PsychologicalBridge(
        psychological_concept="Should Statements",
        psychological_description="Rigid rules about how things 'must' be",
        gita_concept=GitaConcept.SVADHARMA,
        gita_explanation="Your own dharma (Svadharma), imperfectly performed, is better than another's dharma perfectly performed (BG 3.35)",
        integration_insight="'Should' often reflects others' expectations, not your truth. What is YOUR path, your nature, your duty?",
        practical_technique="Replace 'I should...' with 'I could... and I choose to... because it aligns with my values.'",
        verses=[(3, 35), (18, 47), (18, 48)],
    ),

    CognitiveDistortion.LABELING: PsychologicalBridge(
        psychological_concept="Labeling",
        psychological_description="Fixed negative labels for self or others",
        gita_concept=GitaConcept.ATMAN,
        gita_explanation="You are not your actions, not your thoughts, not your body. You are the eternal Self (Atman) beyond all labels (BG 2.20)",
        integration_insight="Labels are snapshots, not portraits. You are a process of becoming, not a fixed identity.",
        practical_technique="When you say 'I am [negative label],' reframe to 'I did something that felt [negative], and I can learn from it.'",
        verses=[(2, 20), (2, 24), (13, 31)],
    ),

    CognitiveDistortion.PERSONALIZATION: PsychologicalBridge(
        psychological_concept="Personalization",
        psychological_description="Blaming yourself for things outside your control",
        gita_concept=GitaConcept.KARMA,
        gita_explanation="Actions have many causes. You are one actor in a vast interdependent web. Take responsibility for your part, not all parts (BG 5.14)",
        integration_insight="You influence, you do not control. Others have their own karma, their own choices. You are not omnipotent.",
        practical_technique="Ask: 'What was actually my responsibility here? What belonged to others or circumstances?'",
        verses=[(5, 14), (3, 27), (13, 29)],
    ),

    CognitiveDistortion.DISCOUNTING_POSITIVE: PsychologicalBridge(
        psychological_concept="Discounting the Positive",
        psychological_description="Dismissing good experiences as not counting",
        gita_concept=GitaConcept.PRASADA,
        gita_explanation="Grace (Prasada) is the recognition of gifts received. The wise cultivate gratitude for each moment of peace (BG 2.65)",
        integration_insight="Positive experiences count. They are data points as real as challenges. Let yourself receive them.",
        practical_technique="When dismissing something good, pause and say: 'This is real. I choose to let this in.'",
        verses=[(2, 65), (12, 18), (18, 54)],
    ),
}


# =============================================================================
# QUADRANT-TO-YOGA PATH MAPPING
# =============================================================================

QUADRANT_YOGA_MAPPING: dict[EmotionalQuadrant, dict[str, Any]] = {
    EmotionalQuadrant.ACTIVATED_UNPLEASANT: {
        "primary_path": YogaPath.DHYANA,
        "secondary_path": YogaPath.KARMA,
        "rationale": "High activation with negative valence (anxiety, anger) benefits from meditation to calm the nervous system, followed by purposeful action to channel energy.",
        "immediate_practice": "Extended exhale breathing to activate parasympathetic response",
        "daily_practice": "Morning meditation (even 5 minutes) before the day activates",
        "key_verses": [(6, 5), (6, 6), (2, 56)],
        "mantra": "I am not my thoughts. I am the awareness observing them.",
    },

    EmotionalQuadrant.DEACTIVATED_UNPLEASANT: {
        "primary_path": YogaPath.KARMA,
        "secondary_path": YogaPath.BHAKTI,
        "rationale": "Low activation with negative valence (depression, lethargy) benefits from action to build energy, and connection/devotion to combat isolation.",
        "immediate_practice": "One small completed action, no matter how small",
        "daily_practice": "Morning movement (walk, stretch) + evening gratitude list",
        "key_verses": [(3, 8), (3, 19), (12, 9)],
        "mantra": "Action is my offering. Each step matters.",
    },

    EmotionalQuadrant.ACTIVATED_PLEASANT: {
        "primary_path": YogaPath.KARMA,
        "secondary_path": YogaPath.JNANA,
        "rationale": "High activation with positive valence (excitement, joy) can be channeled into meaningful action while wisdom prevents attachment to the high.",
        "immediate_practice": "Channel energy into service or creative expression",
        "daily_practice": "Evening reflection: What did I contribute today?",
        "key_verses": [(2, 47), (3, 35), (4, 33)],
        "mantra": "I act fully, releasing attachment to results.",
    },

    EmotionalQuadrant.DEACTIVATED_PLEASANT: {
        "primary_path": YogaPath.JNANA,
        "secondary_path": YogaPath.DHYANA,
        "rationale": "Low activation with positive valence (calm, content) is ideal for deepening wisdom through study and sustained meditation.",
        "immediate_practice": "Contemplation on a teaching that resonates",
        "daily_practice": "Extended meditation + study of wisdom texts",
        "key_verses": [(4, 34), (4, 39), (6, 17)],
        "mantra": "In stillness, wisdom arises.",
    },
}


# =============================================================================
# GUNA TRANSFORMATION GUIDANCE
# =============================================================================

GUNA_TRANSFORMATION: dict[Guna, dict[str, Any]] = {
    Guna.TAMAS: {
        "current_state": "Inertia, confusion, heaviness",
        "target_state": Guna.RAJAS,
        "mechanism": "Gentle activation through small actions builds momentum",
        "practices": [
            "Begin with the smallest possible action - even standing up",
            "Expose yourself to morning sunlight within 30 minutes of waking",
            "One completed task, no matter how small, breaks the inertia",
            "Movement of any kind - walk, stretch, dance - shifts energy",
        ],
        "gita_wisdom": "From action comes purification. Even imperfect action is better than inaction (BG 3.8)",
        "pitfalls": [
            "Overwhelming yourself with too much change at once",
            "Self-criticism when progress feels slow",
            "Waiting until you 'feel like it' - action creates motivation",
        ],
        "key_verses": [(3, 8), (3, 4), (14, 13)],
    },

    Guna.RAJAS: {
        "current_state": "Restless, attached, reactive",
        "target_state": Guna.SATTVA,
        "mechanism": "Conscious pausing and purpose-alignment transforms passion into wisdom",
        "practices": [
            "Before acting, pause and ask: 'Is this necessary? Is it aligned?'",
            "Practice nishkama karma - act fully, then release the outcome",
            "Evening stillness practice - no devices, just presence",
            "Observe cravings without acting on them immediately",
        ],
        "gita_wisdom": "Perform action without attachment. This equanimity is yoga (BG 2.48)",
        "pitfalls": [
            "Mistaking busyness for productivity",
            "Attaching identity to achievements",
            "Burning out from unsustainable intensity",
        ],
        "key_verses": [(2, 48), (2, 47), (14, 12)],
    },

    Guna.SATTVA: {
        "current_state": "Clear, peaceful, wise",
        "target_state": "Transcendence (Gunatita)",
        "mechanism": "Even sattva can become a subtle attachment. True freedom transcends all gunas.",
        "practices": [
            "Practice non-attachment even to peace and clarity",
            "Serve without need for recognition or spiritual 'points'",
            "See the divine in all beings, regardless of their guna state",
            "Rest in awareness itself, beyond even 'spiritual' identity",
        ],
        "gita_wisdom": "When the seer transcends the three gunas, they attain immortality (BG 14.20)",
        "pitfalls": [
            "Spiritual pride or feeling 'better than' others",
            "Attachment to peaceful states",
            "Withdrawing from life rather than engaging wisely",
        ],
        "key_verses": [(14, 20), (14, 22), (14, 25)],
    },
}


# =============================================================================
# GITA PSYCHOLOGY BRIDGE
# =============================================================================

class GitaPsychologyBridge:
    """
    Bridge between modern psychology and Bhagavad Gita wisdom.

    Provides context-aware translation between psychological concepts
    and Gita teachings for therapeutic applications.
    """

    def __init__(self) -> None:
        """Initialize the bridge."""
        logger.info("GitaPsychologyBridge initialized")

    def get_distortion_guidance(
        self,
        distortion: CognitiveDistortion
    ) -> PsychologicalBridge | None:
        """
        Get Gita-integrated guidance for a cognitive distortion.

        Args:
            distortion: The cognitive distortion detected

        Returns:
            PsychologicalBridge with integrated guidance
        """
        return DISTORTION_GITA_MAPPING.get(distortion)

    def get_all_distortion_bridges(
        self,
        distortions: list[CognitiveDistortion]
    ) -> list[dict[str, Any]]:
        """
        Get guidance for multiple distortions.

        Args:
            distortions: List of detected distortions

        Returns:
            List of guidance dictionaries
        """
        result = []
        for distortion in distortions:
            bridge = self.get_distortion_guidance(distortion)
            if bridge:
                result.append(bridge.to_dict())
        return result

    def get_yoga_path_guidance(
        self,
        quadrant: EmotionalQuadrant
    ) -> dict[str, Any]:
        """
        Get yoga path recommendation based on emotional quadrant.

        Args:
            quadrant: Current emotional quadrant

        Returns:
            Yoga path guidance dictionary
        """
        guidance = QUADRANT_YOGA_MAPPING.get(quadrant, QUADRANT_YOGA_MAPPING[
            EmotionalQuadrant.DEACTIVATED_PLEASANT
        ])

        return {
            "primary_path": guidance["primary_path"].value,
            "secondary_path": guidance["secondary_path"].value,
            "rationale": guidance["rationale"],
            "immediate_practice": guidance["immediate_practice"],
            "daily_practice": guidance["daily_practice"],
            "key_verses": [f"BG {c}.{v}" for c, v in guidance["key_verses"]],
            "mantra": guidance["mantra"],
        }

    def get_guna_transformation_plan(
        self,
        current_guna: Guna
    ) -> dict[str, Any]:
        """
        Get transformation guidance for current guna state.

        Args:
            current_guna: Predominant guna

        Returns:
            Transformation plan dictionary
        """
        guidance = GUNA_TRANSFORMATION.get(current_guna, GUNA_TRANSFORMATION[Guna.RAJAS])

        return {
            "current_state": guidance["current_state"],
            "target_state": guidance["target_state"].value if isinstance(guidance["target_state"], Guna) else guidance["target_state"],
            "mechanism": guidance["mechanism"],
            "practices": guidance["practices"],
            "gita_wisdom": guidance["gita_wisdom"],
            "pitfalls_to_avoid": guidance["pitfalls"],
            "key_verses": [f"BG {c}.{v}" for c, v in guidance["key_verses"]],
        }

    def get_complete_psychological_integration(
        self,
        analysis: MoodAnalysis
    ) -> dict[str, Any]:
        """
        Get complete Gita-psychology integration for a mood analysis.

        Combines distortion guidance, yoga path, and guna transformation.

        Args:
            analysis: Complete mood analysis from MoodAnalyticsEngine

        Returns:
            Comprehensive integration dictionary
        """
        # Distortion guidance
        distortion_bridges = self.get_all_distortion_bridges(analysis.distortions_detected)

        # Yoga path based on quadrant
        yoga_guidance = self.get_yoga_path_guidance(analysis.emotion_vector.quadrant)

        # Guna transformation
        guna_plan = self.get_guna_transformation_plan(analysis.emotion_vector.guna)

        # Synthesize key insight
        key_insight = self._synthesize_insight(
            analysis,
            distortion_bridges,
            yoga_guidance,
            guna_plan
        )

        return {
            "key_insight": key_insight,
            "distortion_wisdom": distortion_bridges,
            "yoga_path_guidance": yoga_guidance,
            "guna_transformation": guna_plan,
            "integrated_practice": self._create_integrated_practice(
                analysis, yoga_guidance, guna_plan
            ),
            "daily_intention": self._create_daily_intention(analysis),
        }

    def _synthesize_insight(
        self,
        analysis: MoodAnalysis,
        distortions: list[dict[str, Any]],
        yoga: dict[str, Any],
        guna: dict[str, Any]
    ) -> str:
        """Synthesize a single key insight from all analysis."""
        parts = []

        # Primary emotional state
        emotion = analysis.primary_emotion.replace("_", " ")
        parts.append(f"You're experiencing {emotion}.")

        # Distortion insight
        if distortions:
            d = distortions[0]
            parts.append(f"Your mind may be caught in {d['psychological_concept'].lower()}.")
            parts.append(f"Remember: {d['gita_explanation'][:100]}...")

        # Path forward
        parts.append(
            f"Your path today: {yoga['immediate_practice']}. "
            f"{yoga['mantra']}"
        )

        return " ".join(parts)

    def _create_integrated_practice(
        self,
        analysis: MoodAnalysis,
        yoga: dict[str, Any],
        guna: dict[str, Any]
    ) -> dict[str, str]:
        """Create an integrated practice recommendation."""
        return {
            "morning": guna["practices"][0] if guna.get("practices") else "5 minutes of conscious breathing",
            "during_day": yoga["immediate_practice"],
            "evening": yoga["daily_practice"],
            "when_triggered": (
                analysis.breathing_protocol + " breathing pattern"
            ),
        }

    def _create_daily_intention(self, analysis: MoodAnalysis) -> str:
        """Create a daily intention based on analysis."""
        intentions = {
            "anxious": "Today I practice releasing what I cannot control.",
            "stressed": "Today I take one thing at a time, fully present.",
            "sad": "Today I honor my feelings while opening to moments of light.",
            "angry": "Today I pause before reacting, choosing my response.",
            "overwhelmed": "Today I focus on the next small step, nothing more.",
            "hopeless": "Today I trust that this too shall pass.",
            "confused": "Today I rest in not-knowing, trusting clarity will come.",
            "fearful": "Today I do one thing that scares me, gently.",
            "guilty": "Today I practice self-forgiveness and forward motion.",
            "lonely": "Today I reach out to one person, even briefly.",
        }

        return intentions.get(
            analysis.primary_emotion,
            "Today I move through life with awareness and compassion."
        )

    def get_verse_prescriptions_for_state(
        self,
        analysis: MoodAnalysis,
        count: int = 3
    ) -> list[GitaVersePrescription]:
        """
        Get verse prescriptions tailored to current emotional state.

        Args:
            analysis: Mood analysis
            count: Number of verses to return

        Returns:
            List of tailored verse prescriptions
        """
        prescriptions = []

        # Emotion-based prescriptions
        emotion_verses: dict[str, list[GitaVersePrescription]] = {
            "anxious": [
                GitaVersePrescription(
                    chapter=2, verse=47,
                    theme="Releasing Attachment to Outcomes",
                    translation="You have the right to work only, never to its fruits. Let not the fruits of action be your motive.",
                    application="Your anxiety stems from trying to control what you cannot. Focus on your actions, release the rest.",
                    practice="Before each action today, say: 'I do my part fully. The outcome is not mine to control.'",
                    psychological_parallel="This aligns with ACT's concept of acceptance - accepting uncertainty while taking valued action.",
                ),
                GitaVersePrescription(
                    chapter=6, verse=5,
                    theme="Self as Friend, Not Enemy",
                    translation="Elevate yourself by your own self. Do not degrade yourself. The self alone is the friend of the self, and the self alone is the enemy of the self.",
                    application="Your inner critic is not helping. Become your own ally.",
                    practice="When self-criticism arises, ask: 'Would I speak this way to a friend?'",
                    psychological_parallel="Core self-compassion principle: treating yourself with the same kindness you'd offer others.",
                ),
            ],
            "sad": [
                GitaVersePrescription(
                    chapter=2, verse=14,
                    theme="Impermanence of Feelings",
                    translation="The contacts of the senses with their objects give rise to feelings of cold and heat, pleasure and pain. They come and go; they are impermanent. Bear them patiently.",
                    application="This sadness is real, but it is not permanent. Like weather, it will change.",
                    practice="When sadness feels overwhelming, remind yourself: 'This is temporary. I will feel differently again.'",
                    psychological_parallel="This mirrors mindfulness-based cognitive therapy's approach to decentering from emotions.",
                ),
            ],
            "angry": [
                GitaVersePrescription(
                    chapter=2, verse=56,
                    theme="Freedom from Reactive Emotions",
                    translation="One whose mind is not shaken by adversity, who is free from attachment, fear, and anger, is called a sage of steady wisdom.",
                    application="Anger arises, but you don't have to be its puppet. There's space between stimulus and response.",
                    practice="When anger rises, pause 3 breaths before any response. In that pause, choose.",
                    psychological_parallel="This is the 'pause and respond' technique from Dialectical Behavior Therapy (DBT).",
                ),
            ],
        }

        # Get verses for primary emotion
        if analysis.primary_emotion in emotion_verses:
            prescriptions.extend(emotion_verses[analysis.primary_emotion])

        # Add yoga path verse
        path_guidance = QUADRANT_YOGA_MAPPING.get(analysis.emotion_vector.quadrant)
        if path_guidance:
            ch, v = path_guidance["key_verses"][0]
            prescriptions.append(GitaVersePrescription(
                chapter=ch, verse=v,
                theme=f"{path_guidance['primary_path'].value.title()} Yoga Practice",
                translation="[Verse translation would be looked up from database]",
                application=path_guidance["rationale"],
                practice=path_guidance["daily_practice"],
                psychological_parallel="Matches your current emotional quadrant for optimal effectiveness.",
            ))

        return prescriptions[:count]


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

gita_psychology_bridge = GitaPsychologyBridge()
