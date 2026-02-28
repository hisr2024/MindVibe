"""
KIAAN Conversation Flow State Machine — Module 4 of 4 Self-Sufficiency Modules

Manages multi-turn conversations without LLM by tracking phase transitions,
accumulated context, and optimal response selection across turns.

State Machine Phases:
    CONNECT  → Initial validation, establish safety ("I hear you")
    LISTEN   → Deeper exploration, pattern identification ("Tell me more")
    UNDERSTAND → Name the mechanism, connect dots ("Here's the pattern")
    GUIDE    → Deliver insight + wisdom + action ("The research shows...")
    EMPOWER  → Reinforce agency, close loop ("You have what you need")

Transition Rules:
    connect → listen:     After 1 turn, or if user elaborates
    listen → understand:  After 2 turns, or if pattern detected
    understand → guide:   After 3 turns, or if user asks for advice
    guide → empower:      After 5 turns, or if user shows readiness
    ANY → connect:        If new crisis/emotion detected (reset)

The state machine integrates with all 3 other modules:
    - Response Composer: Assembles responses based on current phase
    - Distillation Pipeline: Learns from LLM responses when used
    - Verse Graph: Selects verses appropriate for current phase
"""

from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.self_sufficiency import ConversationFlowSnapshot

logger = logging.getLogger(__name__)


# =============================================================================
# PHASE DEFINITIONS
# =============================================================================

PHASES = ["connect", "listen", "understand", "guide", "empower"]

# Moods that require extra time in validation phases
HIGH_INTENSITY_MOODS = {
    "sad", "anxious", "overwhelmed", "hurt", "fearful", "lonely", "guilty",
}

# Positive moods that can accelerate through phases
POSITIVE_MOODS = {"happy", "excited", "hopeful", "peaceful", "grateful"}

# Intents that influence phase transitions
ADVICE_INTENTS = {"asking_advice", "seeking_wisdom"}
SHARING_INTENTS = {"sharing", "venting"}
CELEBRATING_INTENTS = {"celebrating"}


class PhaseTransition:
    """Represents a state machine transition."""

    def __init__(
        self,
        from_phase: str,
        to_phase: str,
        trigger: str,
        turn: int,
    ):
        self.from_phase = from_phase
        self.to_phase = to_phase
        self.trigger = trigger
        self.turn = turn

    def to_dict(self) -> dict:
        return {
            "from": self.from_phase,
            "to": self.to_phase,
            "trigger": self.trigger,
            "turn": self.turn,
        }


class ConversationFlowEngine:
    """
    Manages conversation state across turns.

    Usage:
        engine = ConversationFlowEngine()

        # Start or resume a conversation
        state = await engine.get_or_create_state(db, session_id, user_id)

        # Process a turn
        result = await engine.advance(
            db, session_id,
            mood="anxious", topic="academic",
            intent="sharing", entities=["exam"]
        )

        # result.current_phase tells the Response Composer which slot
        # categories to use for response assembly
    """

    async def get_or_create_state(
        self,
        db: AsyncSession,
        session_id: str,
        user_id: str | None = None,
    ) -> ConversationFlowSnapshot:
        """Get existing conversation state or create a new one."""
        result = await db.execute(
            select(ConversationFlowSnapshot).where(
                ConversationFlowSnapshot.session_id == session_id,
                ConversationFlowSnapshot.deleted_at.is_(None),
            )
        )
        snapshot = result.scalar_one_or_none()

        if snapshot:
            return snapshot

        # Create new state at CONNECT phase
        snapshot = ConversationFlowSnapshot(
            session_id=session_id,
            user_id=user_id,
            current_phase="connect",
            turn_count=0,
            mood_history=[],
            topic_history=[],
            intent_history=[],
            entities_seen=[],
            verse_refs_used=[],
            atom_ids_used=[],
            transition_log=[],
        )
        db.add(snapshot)
        await db.commit()
        await db.refresh(snapshot)
        return snapshot

    async def advance(
        self,
        db: AsyncSession,
        session_id: str,
        mood: str,
        topic: str,
        intent: str,
        entities: list[str] | None = None,
        verse_ref_used: str | None = None,
        atom_ids_used: list[str] | None = None,
        used_llm: bool = False,
    ) -> ConversationFlowSnapshot:
        """
        Process a new turn and advance the state machine.

        This is called after analyzing the user's message but before
        composing the response. The returned state tells the Composer
        which phase to use for response assembly.
        """
        entities = entities or []
        atom_ids_used = atom_ids_used or []

        result = await db.execute(
            select(ConversationFlowSnapshot).where(
                ConversationFlowSnapshot.session_id == session_id,
                ConversationFlowSnapshot.deleted_at.is_(None),
            )
        )
        snapshot = result.scalar_one_or_none()

        if not snapshot:
            snapshot = await self.get_or_create_state(db, session_id)

        # Record the current turn's context
        new_mood_history = list(snapshot.mood_history or []) + [mood]
        new_topic_history = list(snapshot.topic_history or []) + [topic]
        new_intent_history = list(snapshot.intent_history or []) + [intent]
        new_entities = list(set((snapshot.entities_seen or []) + entities))
        new_verse_refs = list(snapshot.verse_refs_used or [])
        new_atom_ids = list(snapshot.atom_ids_used or [])

        if verse_ref_used:
            new_verse_refs.append(verse_ref_used)
        new_atom_ids.extend(atom_ids_used)

        # Calculate the next phase
        old_phase = snapshot.current_phase
        new_phase = self._calculate_next_phase(
            current_phase=old_phase,
            turn_count=snapshot.turn_count + 1,
            mood=mood,
            intent=intent,
            mood_history=new_mood_history,
        )

        # Build transition log entry if phase changed
        new_transition_log = list(snapshot.transition_log or [])
        if new_phase != old_phase:
            transition = PhaseTransition(
                from_phase=old_phase,
                to_phase=new_phase,
                trigger=self._describe_trigger(
                    old_phase, new_phase, mood, intent,
                    snapshot.turn_count + 1,
                ),
                turn=snapshot.turn_count + 1,
            )
            new_transition_log.append(transition.to_dict())

        # Calculate dominant mood and topic
        dominant_mood = self._get_dominant(new_mood_history)
        dominant_topic = self._get_dominant(new_topic_history)

        # Update self-sufficiency tracking
        new_self_sufficient = snapshot.self_sufficient_turns
        if not used_llm:
            new_self_sufficient += 1

        # Persist the updated state
        await db.execute(
            update(ConversationFlowSnapshot)
            .where(ConversationFlowSnapshot.id == snapshot.id)
            .values(
                current_phase=new_phase,
                turn_count=snapshot.turn_count + 1,
                mood_history=new_mood_history,
                topic_history=new_topic_history,
                intent_history=new_intent_history,
                entities_seen=new_entities,
                verse_refs_used=new_verse_refs,
                atom_ids_used=new_atom_ids,
                transition_log=new_transition_log,
                dominant_mood=dominant_mood,
                dominant_topic=dominant_topic,
                used_llm=snapshot.used_llm or used_llm,
                self_sufficient_turns=new_self_sufficient,
            )
        )
        await db.commit()

        # Refresh to get updated values
        await db.refresh(snapshot)

        if new_phase != old_phase:
            logger.info(
                f"[Flow] Session {session_id[:8]}: "
                f"{old_phase} → {new_phase} (turn {snapshot.turn_count})"
            )

        return snapshot

    async def close_session(
        self,
        db: AsyncSession,
        session_id: str,
    ) -> dict | None:
        """
        Close a conversation session and return summary stats.

        Soft-deletes the snapshot so it's preserved for analytics
        but won't be returned by get_or_create_state.
        """
        result = await db.execute(
            select(ConversationFlowSnapshot).where(
                ConversationFlowSnapshot.session_id == session_id,
                ConversationFlowSnapshot.deleted_at.is_(None),
            )
        )
        snapshot = result.scalar_one_or_none()

        if not snapshot:
            return None

        summary = {
            "session_id": session_id,
            "total_turns": snapshot.turn_count,
            "final_phase": snapshot.current_phase,
            "dominant_mood": snapshot.dominant_mood,
            "dominant_topic": snapshot.dominant_topic,
            "used_llm": snapshot.used_llm,
            "self_sufficient_turns": snapshot.self_sufficient_turns,
            "self_sufficiency_rate": (
                snapshot.self_sufficient_turns / max(1, snapshot.turn_count)
            ),
            "transition_count": len(snapshot.transition_log or []),
            "unique_verses_used": len(set(snapshot.verse_refs_used or [])),
            "unique_atoms_used": len(set(snapshot.atom_ids_used or [])),
        }

        # Soft delete
        await db.execute(
            update(ConversationFlowSnapshot)
            .where(ConversationFlowSnapshot.id == snapshot.id)
            .values(deleted_at=datetime.utcnow())
        )
        await db.commit()

        logger.info(
            f"[Flow] Session {session_id[:8]} closed: "
            f"{summary['total_turns']} turns, "
            f"{summary['self_sufficiency_rate']:.0%} self-sufficient"
        )

        return summary

    # =========================================================================
    # PHASE TRANSITION LOGIC
    # =========================================================================

    def _calculate_next_phase(
        self,
        current_phase: str,
        turn_count: int,
        mood: str,
        intent: str,
        mood_history: list[str],
    ) -> str:
        """
        Determine the next conversation phase.

        Rules (in priority order):
        1. Crisis/strong new emotion → CONNECT (reset)
        2. Celebrating → GUIDE (skip to wisdom)
        3. Asking advice → GUIDE (accelerate)
        4. Turn-based progression with mood awareness
        """
        is_high_intensity = mood in HIGH_INTENSITY_MOODS
        is_positive = mood in POSITIVE_MOODS
        is_seeking_advice = intent in ADVICE_INTENTS
        is_celebrating = intent in CELEBRATING_INTENTS

        # Rule 1: Emotion shift detection → reset to CONNECT
        if self._detected_emotion_shift(mood, mood_history):
            return "connect"

        # Rule 2: Celebration → GUIDE (deliver wisdom for positive moments)
        if is_celebrating:
            if turn_count <= 1:
                return "connect"  # Acknowledge first
            return "guide"

        # Rule 3: Seeking advice → accelerate to GUIDE (only from understand+)
        # We don't skip listen — the user needs to be heard before being guided.
        if is_seeking_advice and current_phase in ("understand", "guide") and turn_count >= 2:
            return "guide"

        # Rule 4: Phase-specific progression
        if current_phase == "connect":
            if is_high_intensity:
                # Stay in connect longer for intense emotions
                if turn_count >= 2:
                    return "listen"
            else:
                if turn_count >= 1:
                    return "listen"

        elif current_phase == "listen":
            if is_high_intensity:
                if turn_count >= 3:
                    return "understand"
            elif is_positive:
                if turn_count >= 2:
                    return "guide"  # Skip understand for positive moods
            else:
                if turn_count >= 3:
                    return "understand"

        elif current_phase == "understand":
            if turn_count >= 4:
                return "guide"
            if is_seeking_advice:
                return "guide"

        elif current_phase == "guide":
            if turn_count >= 6:
                return "empower"

        elif current_phase == "empower":
            # Stay in empower (terminal phase unless reset)
            pass

        return current_phase

    def _detected_emotion_shift(
        self,
        current_mood: str,
        mood_history: list[str],
    ) -> bool:
        """
        Detect if the user's emotion has significantly shifted.

        Triggers a phase reset to CONNECT when:
        - User switches from positive to high-intensity negative
        - User introduces a completely new emotion category
        """
        if len(mood_history) < 2:
            return False

        previous_mood = mood_history[-2] if len(mood_history) >= 2 else "neutral"

        # Positive → High intensity negative = significant shift
        if previous_mood in POSITIVE_MOODS and current_mood in HIGH_INTENSITY_MOODS:
            return True

        # Neutral → High intensity negative = significant shift
        return previous_mood == "neutral" and current_mood in HIGH_INTENSITY_MOODS

    def _describe_trigger(
        self,
        from_phase: str,
        to_phase: str,
        mood: str,
        intent: str,
        turn: int,
    ) -> str:
        """Generate a human-readable description of the transition trigger."""
        if to_phase == "connect" and from_phase != "connect":
            return f"emotion_shift:{mood}"
        if intent in ADVICE_INTENTS and to_phase == "guide":
            return f"advice_request:turn_{turn}"
        if intent in CELEBRATING_INTENTS:
            return f"celebration:turn_{turn}"
        return f"turn_progression:turn_{turn}"

    @staticmethod
    def _get_dominant(history: list[str]) -> str | None:
        """Get the most frequent item in a history list."""
        if not history:
            return None

        counts: dict[str, int] = {}
        for item in history:
            if item and item != "neutral" and item != "general":
                counts[item] = counts.get(item, 0) + 1

        if not counts:
            return history[-1] if history else None

        return max(counts, key=counts.get)

    # =========================================================================
    # ANALYTICS
    # =========================================================================

    async def get_session_analytics(
        self, db: AsyncSession, session_id: str
    ) -> dict | None:
        """Get analytics for a specific session."""
        result = await db.execute(
            select(ConversationFlowSnapshot).where(
                ConversationFlowSnapshot.session_id == session_id,
            )
        )
        snapshot = result.scalar_one_or_none()
        if not snapshot:
            return None

        return {
            "session_id": session_id,
            "current_phase": snapshot.current_phase,
            "turn_count": snapshot.turn_count,
            "dominant_mood": snapshot.dominant_mood,
            "dominant_topic": snapshot.dominant_topic,
            "mood_history": snapshot.mood_history,
            "topic_history": snapshot.topic_history,
            "transition_log": snapshot.transition_log,
            "used_llm": snapshot.used_llm,
            "self_sufficient_turns": snapshot.self_sufficient_turns,
            "self_sufficiency_rate": (
                snapshot.self_sufficient_turns / max(1, snapshot.turn_count)
            ),
            "verses_used": snapshot.verse_refs_used,
            "atoms_used": len(snapshot.atom_ids_used or []),
        }


# Singleton
_flow_engine: ConversationFlowEngine | None = None


def get_conversation_flow_engine() -> ConversationFlowEngine:
    """Get the singleton ConversationFlowEngine instance."""
    global _flow_engine
    if _flow_engine is None:
        _flow_engine = ConversationFlowEngine()
    return _flow_engine
