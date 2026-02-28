"""
KIAAN Self-Sufficiency Orchestrator — Integration of all 4 core modules

This orchestrator ties together the 4 self-sufficiency modules into a
single cohesive system that can be called from any KIAAN endpoint.

Data flow:
    User Message
        ↓
    [1. Conversation Flow] → Determine phase, track state
        ↓
    [2. Response Composer] → Try LLM-free response assembly
        ↓ (if sufficient atoms)
    SELF-SUFFICIENT RESPONSE ──→ User
        ↓ (if insufficient)
    LLM FALLBACK ──→ User
        ↓
    [3. Distillation Pipeline] → Extract atoms from LLM response (async)
        ↓
    [4. Verse Graph] → Record verse usage + feedback signals

Growth model:
    The system starts fully dependent on LLM (Day 1).
    Each LLM response feeds the Distillation Pipeline, creating atoms.
    Each user interaction feeds the Verse Graph, improving recommendations.
    The Conversation Flow tracks which phases succeed without LLM.
    Over time, the Composition Engine handles more and more queries itself.

    Target: 80%+ self-sufficiency within 3 months of deployment.
"""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.kiaan_conversation_flow import (
    ConversationFlowEngine,
    get_conversation_flow_engine,
)
from backend.services.kiaan_distillation_pipeline import (
    DistillationPipeline,
    get_distillation_pipeline,
)
from backend.services.kiaan_response_composer import (
    ComposedResponse,
    ResponseCompositionEngine,
    get_response_composer,
)
from backend.services.kiaan_verse_application_graph import (
    VerseApplicationGraph,
    get_verse_application_graph,
)

logger = logging.getLogger(__name__)


class SelfSufficiencyResult:
    """Result from the self-sufficiency orchestrator."""

    def __init__(
        self,
        response: Optional[str],
        is_self_sufficient: bool,
        phase: str,
        mood: str,
        topic: str,
        intent: str,
        session_id: str,
        confidence: float = 0.0,
        atom_ids_used: list[str] | None = None,
        template_id: Optional[str] = None,
        verse_ref: Optional[str] = None,
        turn_count: int = 0,
    ):
        self.response = response
        self.is_self_sufficient = is_self_sufficient
        self.phase = phase
        self.mood = mood
        self.topic = topic
        self.intent = intent
        self.session_id = session_id
        self.confidence = confidence
        self.atom_ids_used = atom_ids_used or []
        self.template_id = template_id
        self.verse_ref = verse_ref
        self.turn_count = turn_count

    def to_dict(self) -> dict:
        return {
            "response": self.response,
            "is_self_sufficient": self.is_self_sufficient,
            "phase": self.phase,
            "mood": self.mood,
            "topic": self.topic,
            "intent": self.intent,
            "session_id": self.session_id,
            "confidence": self.confidence,
            "atom_ids_used": self.atom_ids_used,
            "template_id": self.template_id,
            "verse_ref": self.verse_ref,
            "turn_count": self.turn_count,
        }


class KiaanSelfSufficiencyOrchestrator:
    """
    Central orchestrator for KIAAN's self-sufficiency system.

    Usage in KIAAN endpoints:

        orchestrator = get_self_sufficiency_orchestrator()

        # Step 1: Try self-sufficient response
        result = await orchestrator.try_respond(
            db=db,
            session_id=session_id,
            user_id=user_id,
            user_message=user_message,
            mood=detected_mood,
            topic=detected_topic,
            intent=detected_intent,
            entities=detected_entities,
        )

        if result.is_self_sufficient:
            # Use self-sufficient response (no LLM cost)
            return result.response
        else:
            # Fall back to LLM
            llm_response = await call_llm(...)

            # Feed the response back to grow the system
            await orchestrator.learn_from_llm(
                db=db,
                session_id=session_id,
                user_message=user_message,
                llm_response=llm_response,
                mood=detected_mood,
                topic=detected_topic,
                intent=detected_intent,
                phase=result.phase,
            )

            return llm_response
    """

    def __init__(self) -> None:
        self.flow_engine: ConversationFlowEngine = get_conversation_flow_engine()
        self.composer: ResponseCompositionEngine = get_response_composer()
        self.pipeline: DistillationPipeline = get_distillation_pipeline()
        self.verse_graph: VerseApplicationGraph = get_verse_application_graph()

    async def try_respond(
        self,
        db: AsyncSession,
        session_id: str,
        user_id: Optional[str],
        user_message: str,
        mood: str,
        topic: str,
        intent: str,
        entities: list[str] | None = None,
    ) -> SelfSufficiencyResult:
        """
        Attempt to generate a response without LLM.

        Steps:
        1. Advance conversation state machine
        2. Check verse graph for recommended verses
        3. Try response composition from atoms
        4. Return result (self-sufficient or needing LLM)
        """
        entities = entities or []

        # Step 1: Advance conversation flow
        state = await self.flow_engine.advance(
            db=db,
            session_id=session_id,
            mood=mood,
            topic=topic,
            intent=intent,
            entities=entities,
        )

        phase = state.current_phase
        turn_count = state.turn_count

        # Step 2: Check verse graph for recommendations
        verse_recommendations = await self.verse_graph.recommend(
            db=db,
            mood=mood,
            topic=topic,
            exclude_refs=state.verse_refs_used or [],
            limit=3,
        )

        # Step 3: Try composition
        composed = await self.composer.compose(
            db=db,
            mood=mood,
            topic=topic,
            phase=phase,
            intent=intent,
            entities=entities,
            recent_atom_ids=state.atom_ids_used or [],
            recent_verse_refs=state.verse_refs_used or [],
        )

        if composed and composed.response:
            # Record verse usage in graph if applicable
            if composed.verse_ref:
                await self.verse_graph.record_show(
                    db, composed.verse_ref, mood, topic
                )

            # Update flow state with atoms and verse used
            await self.flow_engine.advance(
                db=db,
                session_id=session_id,
                mood=mood,
                topic=topic,
                intent=intent,
                entities=entities,
                verse_ref_used=composed.verse_ref,
                atom_ids_used=composed.atom_ids_used,
                used_llm=False,
            )

            logger.info(
                f"[SelfSufficiency] Self-sufficient response for "
                f"{mood}/{topic}/{phase} (conf={composed.confidence:.2f})"
            )

            return SelfSufficiencyResult(
                response=composed.response,
                is_self_sufficient=True,
                phase=phase,
                mood=mood,
                topic=topic,
                intent=intent,
                session_id=session_id,
                confidence=composed.confidence,
                atom_ids_used=composed.atom_ids_used,
                template_id=composed.template_id,
                verse_ref=composed.verse_ref,
                turn_count=turn_count,
            )

        # Composition failed — signal LLM needed
        logger.info(
            f"[SelfSufficiency] LLM needed for {mood}/{topic}/{phase}"
        )

        return SelfSufficiencyResult(
            response=None,
            is_self_sufficient=False,
            phase=phase,
            mood=mood,
            topic=topic,
            intent=intent,
            session_id=session_id,
            turn_count=turn_count,
        )

    async def learn_from_llm(
        self,
        db: AsyncSession,
        session_id: str,
        user_message: str,
        llm_response: str,
        mood: str,
        topic: str,
        intent: str,
        phase: str,
        source_message_id: Optional[str] = None,
    ) -> dict:
        """
        Feed an LLM response back into the system to grow self-sufficiency.

        Should be called after every LLM response. Runs the distillation
        pipeline to extract reusable atoms.
        """
        # Run distillation pipeline
        new_atoms = await self.pipeline.distill(
            db=db,
            llm_response=llm_response,
            user_message=user_message,
            detected_mood=mood,
            detected_topic=topic,
            detected_intent=intent,
            detected_phase=phase,
            source_message_id=source_message_id,
        )

        # Update flow state to note LLM was used
        await self.flow_engine.advance(
            db=db,
            session_id=session_id,
            mood=mood,
            topic=topic,
            intent=intent,
            used_llm=True,
            atom_ids_used=[a.id for a in new_atoms],
        )

        return {
            "atoms_created": len(new_atoms),
            "atom_categories": [a.category for a in new_atoms],
        }

    async def record_feedback(
        self,
        db: AsyncSession,
        session_id: str,
        verse_ref: Optional[str],
        mood: str,
        topic: str,
        atom_ids: list[str] | None,
        template_id: Optional[str],
        positive: bool,
    ) -> None:
        """
        Record user feedback to improve all systems.

        Called when user gives thumbs up/down, saves to journal, or
        explicitly rates a response.
        """
        # Feed into verse graph
        if verse_ref:
            await self.verse_graph.record_signal(
                db, verse_ref, mood, topic, positive
            )

        # Feed into composition engine
        if atom_ids or template_id:
            await self.composer.record_feedback(
                db, atom_ids or [], template_id, positive
            )

        logger.info(
            f"[SelfSufficiency] Feedback recorded: "
            f"{'positive' if positive else 'negative'} "
            f"verse={verse_ref} atoms={len(atom_ids or [])}"
        )

    async def get_system_stats(self, db: AsyncSession) -> dict:
        """Get comprehensive self-sufficiency system statistics."""
        from sqlalchemy import func, select as sa_select

        from backend.models.self_sufficiency import (
            CompositionTemplate,
            ConversationFlowSnapshot,
            VerseApplicationEdge,
            WisdomAtom,
        )

        # Atom stats
        total_atoms = await db.execute(
            sa_select(func.count(WisdomAtom.id)).where(
                WisdomAtom.deleted_at.is_(None)
            )
        )

        atoms_by_category = await db.execute(
            sa_select(
                WisdomAtom.category,
                func.count(WisdomAtom.id),
            )
            .where(WisdomAtom.deleted_at.is_(None))
            .group_by(WisdomAtom.category)
        )

        # Graph stats
        graph_stats = await self.verse_graph.get_statistics(db)

        # Template stats
        total_templates = await db.execute(
            sa_select(func.count(CompositionTemplate.id)).where(
                CompositionTemplate.deleted_at.is_(None),
                CompositionTemplate.is_active == True,
            )
        )

        # Flow stats (active sessions)
        active_sessions = await db.execute(
            sa_select(func.count(ConversationFlowSnapshot.id)).where(
                ConversationFlowSnapshot.deleted_at.is_(None),
            )
        )

        # Self-sufficiency rate (from closed sessions)
        closed_sessions = await db.execute(
            sa_select(
                func.avg(ConversationFlowSnapshot.self_sufficient_turns),
                func.avg(ConversationFlowSnapshot.turn_count),
            ).where(
                ConversationFlowSnapshot.deleted_at.isnot(None),
                ConversationFlowSnapshot.turn_count > 0,
            )
        )
        closed_row = closed_sessions.first()
        avg_self_suff = float(closed_row[0] or 0) if closed_row else 0
        avg_turns = float(closed_row[1] or 1) if closed_row else 1

        return {
            "atoms": {
                "total": total_atoms.scalar() or 0,
                "by_category": dict(atoms_by_category.all()),
            },
            "verse_graph": graph_stats,
            "templates": {
                "total_active": total_templates.scalar() or 0,
            },
            "sessions": {
                "active": active_sessions.scalar() or 0,
            },
            "self_sufficiency": {
                "avg_self_sufficient_turns": round(avg_self_suff, 1),
                "avg_total_turns": round(avg_turns, 1),
                "rate": round(avg_self_suff / max(1, avg_turns), 3),
            },
        }


# Singleton
_orchestrator: Optional[KiaanSelfSufficiencyOrchestrator] = None


def get_self_sufficiency_orchestrator() -> KiaanSelfSufficiencyOrchestrator:
    """Get the singleton KiaanSelfSufficiencyOrchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = KiaanSelfSufficiencyOrchestrator()
    return _orchestrator
