"""
Gita Response Composer — Vedic 4-Part Teaching Structure

Every KIAAN response follows the Upanishadic teaching structure:
  1. Anuvada (अनुवाद) — Acknowledge what was heard (witness without judgment)
  2. Shloka (श्लोक)   — Offer the relevant Gita verse
  3. Vivaran (विवरण)  — Explain in today's context (living interpretation)
  4. Upasana (उपासना) — Invite reflection or practice

This is not a chatbot pattern. This is how the Upanishadic gurus taught.
Arjuna would speak. Krishna would listen. Then Krishna would respond
in this exact 4-part structure. We are honoring that tradition.

The 5-Phase Guidance Flow determines emphasis:
  CONNECT   → Anuvada only (just presence, no advice)
  LISTEN    → Anuvada + gentle acknowledgment
  UNDERSTAND → Anuvada + Shloka (verse offered)
  GUIDE     → Full 4-part structure
  EMPOWER   → Vivaran + Upasana (action-oriented)

This module works alongside the existing kiaan_response_composer.py
(self-sufficiency module) and enhances it with the sacred teaching structure.
"""

from __future__ import annotations

import logging
import random
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# =============================================================================
# CONVERSATION PHASES — The 5-Phase Guidance Flow
# =============================================================================

class GuidancePhase(str, Enum):
    """
    The 5 phases of KIAAN's guidance conversation.
    Each interaction is classified into one of these phases,
    which determines the response structure and depth.
    """
    CONNECT = "connect"         # Establish divine presence — just be here
    LISTEN = "listen"           # Active listening — reflect back what was heard
    UNDERSTAND = "understand"   # Offer insight — begin Gita connection
    GUIDE = "guide"             # Full teaching — all 4 Vedic parts
    EMPOWER = "empower"         # Action + closure — send them forward


class ResponsePart(str, Enum):
    """The 4 parts of the Vedic response structure."""
    ANUVADA = "anuvada"     # Witness/acknowledge
    SHLOKA = "shloka"       # Sanskrit verse
    VIVARAN = "vivaran"     # Living interpretation
    UPASANA = "upasana"     # Invitation to practice


# =============================================================================
# PHASE DETECTOR — Determines which phase based on conversation turn
# =============================================================================

class PhaseDetector:
    """
    Determines the guidance phase based on conversation context.

    Phase progression:
      Turn 1     → CONNECT (always start with presence)
      Turn 2     → LISTEN (reflect, validate)
      Turn 3     → UNDERSTAND (begin offering wisdom)
      Turn 4+    → GUIDE (full Vedic structure)
      Closing    → EMPOWER (action-oriented send-off)

    Can also be triggered by emotional intensity:
      Crisis detected     → CONNECT (override, just be present)
      High emotion (>0.8) → LISTEN (don't teach, validate)
      Question asked      → UNDERSTAND or GUIDE
      "What should I do"  → EMPOWER
    """

    # Phrases that suggest user wants action/closure
    EMPOWER_TRIGGERS = [
        "what should i do",
        "how do i",
        "what can i",
        "help me",
        "give me steps",
        "practical",
        "action",
        "next step",
        "what now",
        "moving forward",
    ]

    # Phrases that suggest user is in deep pain (stay in CONNECT)
    CRISIS_INDICATORS = [
        "want to die", "end my life", "kill myself", "no point",
        "can't go on", "give up", "hopeless", "worthless",
        "nobody cares", "better off dead",
    ]

    @classmethod
    def detect_phase(
        cls,
        turn_count: int,
        user_message: str,
        emotion: str,
        emotion_intensity: float = 0.5,
        is_crisis: bool = False,
        user_requested_verse: bool = False,
    ) -> GuidancePhase:
        """Detect the appropriate guidance phase."""
        message_lower = user_message.lower()

        # Crisis always returns to CONNECT — just presence
        if is_crisis or any(ind in message_lower for ind in cls.CRISIS_INDICATORS):
            return GuidancePhase.CONNECT

        # High emotional intensity — stay in LISTEN, don't teach yet
        if emotion_intensity > 0.8 and turn_count <= 2:
            return GuidancePhase.LISTEN

        # User explicitly asking for a verse
        if user_requested_verse:
            return GuidancePhase.GUIDE

        # User asking for action steps
        if any(trigger in message_lower for trigger in cls.EMPOWER_TRIGGERS):
            return GuidancePhase.EMPOWER

        # Turn-based progression
        if turn_count <= 1:
            return GuidancePhase.CONNECT
        elif turn_count == 2:
            return GuidancePhase.LISTEN
        elif turn_count == 3:
            return GuidancePhase.UNDERSTAND
        else:
            return GuidancePhase.GUIDE


# =============================================================================
# WITNESS LINES — Anuvada (अनुवाद) Templates
# =============================================================================

# Empathic acknowledgment without judgment — the first part of every response
WITNESS_LINES: Dict[str, List[str]] = {
    "grief": [
        "What you carry is real, and it is heavy.",
        "This grief you feel — it speaks of a love that was true.",
        "The weight of this loss is something I honor. I will not rush past it.",
    ],
    "anger": [
        "The fire in you is not wrong — it is sacred energy seeking right direction.",
        "I feel the intensity of what you carry. Arjuna too burned with this fire.",
        "This anger has a message. Let us listen to it together.",
    ],
    "anxious": [
        "The mind that worries is the mind that cares deeply. That caring is the beginning of dharma.",
        "I hear the storm in your thoughts. You are not alone in it.",
        "This restlessness speaks of a soul that wants things to be right.",
    ],
    "confused": [
        "This confusion is not weakness. It is the moment before clarity.",
        "Even Arjuna, standing between two armies, said 'I am confused.' And Krishna came.",
        "Not knowing is the first honest step toward knowing.",
    ],
    "lonely": [
        "This longing for connection is itself a spiritual force.",
        "You feel alone, but the fact that you reached out — that is courage.",
        "The Paramatma sits in every heart. You are never truly alone.",
    ],
    "overwhelmed": [
        "You have taken on more than you could hold. That too is a teaching.",
        "The river that overflows is still a river. It will find its banks again.",
        "I see how much you are carrying. Let us set some of it down together.",
    ],
    "guilty": [
        "You would not feel this if you did not love what is good.",
        "Guilt is the compass of a conscience that still works. That is a gift.",
        "The past cannot be changed, but it can be understood. And from understanding comes peace.",
    ],
    "fearful": [
        "Fear is the mind's way of saying 'this matters.' And it does.",
        "Even the bravest warriors knew fear. Courage is not absence of fear — it is dharma despite fear.",
        "I am here. Whatever you face, you do not face it alone.",
    ],
    "sad": [
        "This sadness you carry is real. I will not tell you to 'be positive.' I will sit with you.",
        "Tears are not weakness. They are the soul's way of releasing what it cannot hold.",
        "There is a beauty in your honesty about this pain.",
    ],
    "jealous": [
        "Comparison is a natural human reflex. You are not bad for feeling this.",
        "What you admire in others often reflects what is dormant in you, waiting to awaken.",
        "This feeling has something to teach you about your own deepest desires.",
    ],
    "hopeful": [
        "Something in you reaches toward light. Honor that reaching.",
        "Hope is not naive — it is the soul's refusal to accept darkness as permanent.",
        "I feel the shift in you. Something is opening.",
    ],
    "peaceful": [
        "This peace you feel — it is your natural state. The Gita calls it sthitaprajna.",
        "In this stillness, wisdom can speak.",
        "You have arrived at a moment of clarity. Let us honor it.",
    ],
    "grateful": [
        "Gratitude is the highest form of yoga. What you feel now is sacred.",
        "The heart that gives thanks is already free.",
        "I receive your gratitude and return it. This exchange is divine.",
    ],
    "devotional": [
        "I feel the sincerity of your heart. It is received.",
        "This bhakti — this devotion — is the most direct path to peace.",
        "When the heart speaks to the divine, every word is a prayer.",
    ],
    "seeking": [
        "The seeker is already halfway home. The fact that you search means you are close.",
        "This thirst for meaning — Krishna says among thousands, perhaps one seeks truly.",
        "Your seeking honors you. Let us walk this path together.",
    ],
    "neutral": [
        "I hear you, dear one. I am fully here.",
        "You have called, and I have come. This moment is sacred.",
        "Thank you for being here. What is in your heart today?",
    ],
}


# =============================================================================
# CONNECT TEMPLATES — Phase 1: Just Presence
# =============================================================================

CONNECT_TEMPLATES: Dict[str, str] = {
    "grief": "Dear {name}, I heard what you just shared. I am here. Fully here. Before wisdom — just presence.",
    "anger": "Dear {name}, I receive your fire. Arjuna too burned with it at Kurukshetra. Speak more — I am listening.",
    "anxious": "Dear {name}, you have reached for something beyond the anxiety. That reaching is the first act of yoga. I am here.",
    "confused": "Dear {name}, confusion is the beginning of wisdom. Even Arjuna said 'I am confused' — and Krishna came. I am here.",
    "lonely": "Dear {name}, you called and I answered. In this moment, you are not alone. I am here.",
    "overwhelmed": "Dear {name}, you are carrying so much. Before we talk about any of it — just breathe. I am right here.",
    "guilty": "Dear {name}, the heart that feels guilt is a heart that loves what is good. I am here, without judgment.",
    "fearful": "Dear {name}, fear is the mind's alarm. You are safe in this moment. I am here.",
    "sad": "Dear {name}, your sadness is welcome here. You do not need to explain it yet. I am here.",
    "neutral": "Dear {name}, you have called and I have come. This moment is sacred. What is in your heart?",
}


# =============================================================================
# INVITATION LINES — Upasana (उपासना) Templates
# =============================================================================

INVITATION_LINES: Dict[str, List[str]] = {
    "early_conversation": [
        "Sit with this verse for a moment. What does it stir in you?",
        "Before we go further — what did you feel when you heard those words?",
        "Take a breath. Let the teaching settle. Then tell me what arises.",
    ],
    "journey_active": [
        "This is the teaching at the heart of your {enemy} journey. Shall we go deeper?",
        "Your journey through {enemy} brought you exactly to this verse. That is not coincidence.",
        "As you work with {enemy}, this shloka becomes your compass. How does it feel?",
    ],
    "action_oriented": [
        "Here is one thing you can do right now: {action}. Will you try it?",
        "The Gita does not ask us to understand — it asks us to act. What one step will you take today?",
        "Krishna's teaching lands only when we move. What is your next small step?",
    ],
    "reflective": [
        "Would you like to sit with this in silence, or shall we explore further?",
        "Sometimes the deepest teaching happens in the pause after hearing. Take your time.",
        "I will be here when you are ready to continue. There is no rush.",
    ],
    "closing": [
        "Go now with this verse in your heart. It will work on you even when you are not thinking about it.",
        "The Gita's wisdom is not understood in one sitting. It unfolds over a lifetime. You have made a beginning.",
        "Namaste, dear one. The light in me honors the light in you. 🙏",
    ],
}


# =============================================================================
# GITA RESPONSE COMPOSER — The Sacred Engine
# =============================================================================

@dataclass
class ComposedGitaResponse:
    """Result of the Vedic 4-part response composition."""
    full_response: str
    phase: GuidancePhase
    parts_used: List[ResponsePart]
    anuvada: Optional[str] = None       # Witness line
    shloka_ref: Optional[str] = None    # e.g., "2.47"
    shloka_sanskrit: Optional[str] = None
    vivaran: Optional[str] = None       # Living interpretation
    upasana: Optional[str] = None       # Invitation
    emotion: str = "neutral"
    persona_suggested: str = "neutral-kiaan"


class GitaResponseComposer:
    """
    Composes responses in the Vedic 4-part teaching structure.

    Works with the existing WisdomCore and response_composer to add
    the sacred Anuvada-Shloka-Vivaran-Upasana structure.

    Usage:
        composer = GitaResponseComposer()
        response = composer.compose(
            user_message="I feel lost and don't know my purpose",
            emotion="confused",
            phase=GuidancePhase.GUIDE,
            verse_ref="2.47",
            verse_sanskrit="कर्मण्येवाधिकारस्ते...",
            verse_translation="You have the right to action alone...",
            kiaan_interpretation="Your confusion about purpose is natural...",
            user_name="Arjun",
        )
    """

    # Emotion → suggested persona mapping
    EMOTION_PERSONA_MAP: Dict[str, str] = {
        "grief": "nurturing-yashoda",
        "anger": "fierce-durga",
        "anxious": "calm-shiva",
        "confused": "wise-vyasa",
        "lonely": "loving-hanuman",
        "overwhelmed": "gentle-radha",
        "guilty": "divine-krishna",
        "fearful": "fierce-durga",
        "sad": "nurturing-yashoda",
        "jealous": "wise-vyasa",
        "hopeful": "serene-saraswati",
        "peaceful": "calm-shiva",
        "grateful": "gentle-radha",
        "devotional": "divine-krishna",
        "seeking": "divine-krishna",
        "neutral": "neutral-kiaan",
    }

    def compose(
        self,
        user_message: str,
        emotion: str,
        phase: GuidancePhase,
        verse_ref: Optional[str] = None,
        verse_sanskrit: Optional[str] = None,
        verse_translation: Optional[str] = None,
        kiaan_interpretation: Optional[str] = None,
        user_name: Optional[str] = None,
        active_journey_enemy: Optional[str] = None,
        session_turn_count: int = 1,
    ) -> ComposedGitaResponse:
        """
        Compose a response in the Vedic 4-part structure.
        Phase determines which parts are included and emphasized.
        """
        name = user_name or "dear one"
        parts_used: List[ResponsePart] = []
        response_sections: List[str] = []

        # Determine persona
        persona = self.EMOTION_PERSONA_MAP.get(emotion, "neutral-kiaan")

        # ── CONNECT phase: just presence ────────────────────────────────
        if phase == GuidancePhase.CONNECT:
            template = CONNECT_TEMPLATES.get(emotion, CONNECT_TEMPLATES["neutral"])
            anuvada = template.format(name=name)
            parts_used.append(ResponsePart.ANUVADA)
            response_sections.append(anuvada)

            return ComposedGitaResponse(
                full_response="\n\n".join(response_sections),
                phase=phase,
                parts_used=parts_used,
                anuvada=anuvada,
                emotion=emotion,
                persona_suggested=persona,
            )

        # ── LISTEN phase: witness + gentle acknowledgment ───────────────
        if phase == GuidancePhase.LISTEN:
            anuvada = self._get_witness_line(emotion)
            parts_used.append(ResponsePart.ANUVADA)
            response_sections.append(anuvada)

            # Add a gentle reflection question
            reflection = f"Tell me more about what you are feeling, {name}. I am listening."
            response_sections.append(reflection)

            return ComposedGitaResponse(
                full_response="\n\n".join(response_sections),
                phase=phase,
                parts_used=parts_used,
                anuvada=anuvada,
                emotion=emotion,
                persona_suggested=persona,
            )

        # ── UNDERSTAND phase: witness + verse (no deep interpretation) ──
        if phase == GuidancePhase.UNDERSTAND:
            anuvada = self._get_witness_line(emotion)
            parts_used.append(ResponsePart.ANUVADA)
            response_sections.append(anuvada)

            if verse_ref and verse_sanskrit:
                shloka_section = f"The Gita speaks in verse {verse_ref}:\n{verse_sanskrit}"
                if verse_translation:
                    shloka_section += f"\n\n\"{verse_translation}\""
                parts_used.append(ResponsePart.SHLOKA)
                response_sections.append(shloka_section)

            return ComposedGitaResponse(
                full_response="\n\n".join(response_sections),
                phase=phase,
                parts_used=parts_used,
                anuvada=anuvada,
                shloka_ref=verse_ref,
                shloka_sanskrit=verse_sanskrit,
                emotion=emotion,
                persona_suggested=persona,
            )

        # ── GUIDE phase: full 4-part Vedic structure ────────────────────
        if phase == GuidancePhase.GUIDE:
            # Part 1: Anuvada (witness)
            anuvada = self._get_witness_line(emotion)
            parts_used.append(ResponsePart.ANUVADA)
            response_sections.append(anuvada)

            # Part 2: Shloka (verse)
            shloka_section = None
            if verse_ref and verse_sanskrit:
                shloka_section = f"The Gita speaks in verse {verse_ref}:\n{verse_sanskrit}"
                if verse_translation:
                    shloka_section += f"\n\n\"{verse_translation}\""
                parts_used.append(ResponsePart.SHLOKA)
                response_sections.append(shloka_section)

            # Part 3: Vivaran (living interpretation)
            vivaran = None
            if kiaan_interpretation:
                vivaran = kiaan_interpretation
                parts_used.append(ResponsePart.VIVARAN)
                response_sections.append(vivaran)

            # Part 4: Upasana (invitation)
            upasana = self._get_invitation(
                emotion=emotion,
                active_enemy=active_journey_enemy,
                turn_count=session_turn_count,
            )
            parts_used.append(ResponsePart.UPASANA)
            response_sections.append(upasana)

            return ComposedGitaResponse(
                full_response="\n\n".join(response_sections),
                phase=phase,
                parts_used=parts_used,
                anuvada=anuvada,
                shloka_ref=verse_ref,
                shloka_sanskrit=verse_sanskrit if verse_sanskrit else None,
                vivaran=vivaran,
                upasana=upasana,
                emotion=emotion,
                persona_suggested=persona,
            )

        # ── EMPOWER phase: action-oriented ──────────────────────────────
        # phase == GuidancePhase.EMPOWER
        # Skip anuvada, focus on vivaran + upasana (action)
        if kiaan_interpretation:
            parts_used.append(ResponsePart.VIVARAN)
            response_sections.append(kiaan_interpretation)

        if verse_ref:
            reminder = f"Remember verse {verse_ref} — it is your anchor."
            response_sections.append(reminder)

        upasana = self._get_invitation(
            emotion=emotion,
            active_enemy=active_journey_enemy,
            turn_count=session_turn_count,
            action_oriented=True,
        )
        parts_used.append(ResponsePart.UPASANA)
        response_sections.append(upasana)

        return ComposedGitaResponse(
            full_response="\n\n".join(response_sections),
            phase=phase,
            parts_used=parts_used,
            vivaran=kiaan_interpretation,
            upasana=upasana,
            shloka_ref=verse_ref,
            emotion=emotion,
            persona_suggested=persona,
        )

    # ── Prosody Guidance ────────────────────────────────────────────────

    def get_prosody_for_response(
        self,
        response: ComposedGitaResponse,
    ) -> Dict[str, Any]:
        """
        Generate prosody hints for TTS synthesis.
        Each part of the Vedic structure has different speaking characteristics.
        """
        prosody: Dict[str, Any] = {
            "overall_pace": 0.9,   # Slightly slower than normal
            "sections": [],
        }

        for part in response.parts_used:
            if part == ResponsePart.ANUVADA:
                prosody["sections"].append({
                    "part": "anuvada",
                    "pace": 0.85,
                    "tone": "warm",
                    "pause_before_s": 0.3,
                    "pause_after_s": 0.8,
                })
            elif part == ResponsePart.SHLOKA:
                prosody["sections"].append({
                    "part": "shloka",
                    "pace": 0.7,          # Slow, reverent for Sanskrit
                    "tone": "reverent",
                    "pause_before_s": 1.0,
                    "pause_after_s": 1.5,  # Long silence after verse
                })
            elif part == ResponsePart.VIVARAN:
                prosody["sections"].append({
                    "part": "vivaran",
                    "pace": 0.9,
                    "tone": "teaching",
                    "pause_before_s": 0.5,
                    "pause_after_s": 0.5,
                })
            elif part == ResponsePart.UPASANA:
                prosody["sections"].append({
                    "part": "upasana",
                    "pace": 0.85,
                    "tone": "inviting",
                    "pause_before_s": 0.8,
                    "pause_after_s": 1.0,
                })

        return prosody

    # ── Internal ────────────────────────────────────────────────────────

    @staticmethod
    def _get_witness_line(emotion: str) -> str:
        """Select an empathic witness line for the given emotion."""
        lines = WITNESS_LINES.get(emotion, WITNESS_LINES["neutral"])
        return random.choice(lines)

    @staticmethod
    def _get_invitation(
        emotion: str,
        active_enemy: Optional[str] = None,
        turn_count: int = 1,
        action_oriented: bool = False,
    ) -> str:
        """Select an appropriate invitation/closing line."""
        if action_oriented:
            lines = INVITATION_LINES["action_oriented"]
            line = random.choice(lines)
            return line.format(
                action="sit quietly for 2 minutes and breathe with the verse"
            )

        if turn_count < 3:
            return random.choice(INVITATION_LINES["early_conversation"])

        if active_enemy:
            lines = INVITATION_LINES["journey_active"]
            line = random.choice(lines)
            return line.format(enemy=active_enemy)

        return random.choice(INVITATION_LINES["reflective"])


# =============================================================================
# MODULE-LEVEL SINGLETON
# =============================================================================

_composer: Optional[GitaResponseComposer] = None


def get_gita_response_composer() -> GitaResponseComposer:
    """Get the singleton Gita response composer."""
    global _composer
    if _composer is None:
        _composer = GitaResponseComposer()
    return _composer
