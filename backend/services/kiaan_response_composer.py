"""
KIAAN Response Composition Engine — Module 1 of 4 Self-Sufficiency Modules

Assembles complete, high-quality responses WITHOUT LLM calls by combining
wisdom atoms, psychology frames, Gita verses, and action steps.

Architecture:
    User Message → Analysis (mood, topic, intent, entities)
                 → Phase Detection (connect/listen/understand/guide/empower)
                 → Atom Selection (query WisdomAtom table by context)
                 → Template Matching (find proven CompositionTemplate)
                 → Assembly (opener + body + action + wisdom + closer)
                 → Quality Check (word count, coherence, relevance)
                 → Response

Falls back to LLM only when:
1. No suitable atoms exist for the detected context
2. Quality check fails (below threshold)
3. User explicitly requests deeper analysis
"""

from __future__ import annotations

import logging
import random
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.self_sufficiency import (
    CompositionTemplate,
    WisdomAtom,
)

logger = logging.getLogger(__name__)


# =============================================================================
# ATOM CATEGORIES — Maps to the 5-slot response structure
# =============================================================================

ATOM_CATEGORIES = {
    "validation": "Empathic validation acknowledging the user's emotional state",
    "reframe": "Cognitive reframe offering a new perspective on the situation",
    "action": "Concrete, practical step the user can take right now",
    "wisdom": "Gita-grounded insight with psychology framing",
    "encouragement": "Closing encouragement reinforcing agency and capacity",
    "grounding": "Grounding technique or micro-practice",
    "reflection": "Reflective question for self-inquiry",
}

# Minimum quality threshold for self-sufficient responses
MIN_QUALITY_THRESHOLD = 0.4
MIN_ATOMS_REQUIRED = 3  # At least opener + body + closer


class ComposedResponse:
    """Result of the composition engine."""

    def __init__(
        self,
        response: str,
        mood: str,
        topic: str,
        phase: str,
        intent: str,
        atom_ids_used: list[str],
        template_id: str | None = None,
        verse_ref: str | None = None,
        is_self_sufficient: bool = True,
        confidence: float = 0.5,
    ):
        self.response = response
        self.mood = mood
        self.topic = topic
        self.phase = phase
        self.intent = intent
        self.atom_ids_used = atom_ids_used
        self.template_id = template_id
        self.verse_ref = verse_ref
        self.is_self_sufficient = is_self_sufficient
        self.confidence = confidence

    def to_dict(self) -> dict:
        return {
            "response": self.response,
            "mood": self.mood,
            "topic": self.topic,
            "phase": self.phase,
            "intent": self.intent,
            "atom_ids_used": self.atom_ids_used,
            "template_id": self.template_id,
            "verse_ref": self.verse_ref,
            "is_self_sufficient": self.is_self_sufficient,
            "confidence": self.confidence,
        }


class ResponseCompositionEngine:
    """
    Assembles complete responses from atomic wisdom components.

    The engine follows a 3-tier fallback strategy:
    1. Template Match — Find a proven CompositionTemplate for this exact context
    2. Dynamic Assembly — Select best atoms per slot and assemble on the fly
    3. LLM Fallback — Signal that LLM is needed (returns None)
    """

    async def compose(
        self,
        db: AsyncSession,
        mood: str,
        topic: str,
        phase: str,
        intent: str,
        entities: list[str] | None = None,
        recent_atom_ids: list[str] | None = None,
        recent_verse_refs: list[str] | None = None,
    ) -> ComposedResponse | None:
        """
        Attempt to compose a complete response without LLM.

        Returns ComposedResponse if successful, None if LLM fallback needed.
        """
        recent_atom_ids = recent_atom_ids or []
        recent_verse_refs = recent_verse_refs or []

        # Tier 1: Try template match
        template_result = await self._try_template_match(
            db, mood, topic, phase, intent
        )
        if template_result:
            logger.info(
                f"[Composer] Template match for {mood}/{topic}/{phase}"
            )
            return template_result

        # Tier 2: Dynamic assembly
        dynamic_result = await self._try_dynamic_assembly(
            db, mood, topic, phase, intent, entities,
            recent_atom_ids, recent_verse_refs,
        )
        if dynamic_result:
            logger.info(
                f"[Composer] Dynamic assembly for {mood}/{topic}/{phase}"
            )
            return dynamic_result

        # Tier 3: Signal LLM fallback needed
        logger.info(
            f"[Composer] No sufficient atoms for {mood}/{topic}/{phase} — LLM needed"
        )
        return None

    # =========================================================================
    # TIER 1: Template Matching
    # =========================================================================

    async def _try_template_match(
        self,
        db: AsyncSession,
        mood: str,
        topic: str,
        phase: str,
        intent: str,
    ) -> ComposedResponse | None:
        """Find a proven template matching this exact context."""
        query = (
            select(CompositionTemplate)
            .where(
                CompositionTemplate.mood == mood,
                CompositionTemplate.topic == topic,
                CompositionTemplate.phase == phase,
                CompositionTemplate.is_active.is_(True),
                CompositionTemplate.deleted_at.is_(None),
                CompositionTemplate.effectiveness_score >= MIN_QUALITY_THRESHOLD,
            )
            .order_by(CompositionTemplate.effectiveness_score.desc())
            .limit(5)
        )

        result = await db.execute(query)
        templates = list(result.scalars().all())

        if not templates:
            return None

        # Weighted random selection from top templates (variety)
        total_score = sum(t.effectiveness_score for t in templates)
        if total_score == 0:
            return None

        rand = random.random() * total_score
        selected = templates[0]
        cumulative = 0.0
        for template in templates:
            cumulative += template.effectiveness_score
            if rand <= cumulative:
                selected = template
                break

        # Use pre-rendered response if available, otherwise assemble from atoms
        if selected.rendered_response:
            response_text = selected.rendered_response
        else:
            response_text = await self._assemble_from_template(db, selected)
            if not response_text:
                return None

        # Record usage
        await db.execute(
            update(CompositionTemplate)
            .where(CompositionTemplate.id == selected.id)
            .values(
                times_used=CompositionTemplate.times_used + 1,
                last_used_at=datetime.utcnow(),
            )
        )
        await db.commit()

        atom_ids = [
            aid for aid in [
                selected.opener_atom_id,
                selected.body_atom_id,
                selected.action_atom_id,
                selected.wisdom_atom_id,
                selected.closer_atom_id,
            ] if aid
        ]

        return ComposedResponse(
            response=response_text,
            mood=mood,
            topic=topic,
            phase=phase,
            intent=intent,
            atom_ids_used=atom_ids,
            template_id=selected.id,
            is_self_sufficient=True,
            confidence=selected.effectiveness_score,
        )

    async def _assemble_from_template(
        self, db: AsyncSession, template: CompositionTemplate
    ) -> str | None:
        """Assemble response text from a template's atom references."""
        parts = []

        for atom_id in [
            template.opener_atom_id,
            template.body_atom_id,
            template.action_atom_id,
            template.wisdom_atom_id,
            template.closer_atom_id,
        ]:
            if atom_id:
                result = await db.execute(
                    select(WisdomAtom).where(
                        WisdomAtom.id == atom_id,
                        WisdomAtom.deleted_at.is_(None),
                    )
                )
                atom = result.scalar_one_or_none()
                if atom:
                    parts.append(atom.content)

        if len(parts) < MIN_ATOMS_REQUIRED:
            return None

        return " ".join(parts)

    # =========================================================================
    # TIER 2: Dynamic Assembly
    # =========================================================================

    async def _try_dynamic_assembly(
        self,
        db: AsyncSession,
        mood: str,
        topic: str,
        phase: str,
        intent: str,
        entities: list[str] | None,  # noqa: ARG002 (reserved for entity-aware atom selection)
        recent_atom_ids: list[str],
        recent_verse_refs: list[str],  # noqa: ARG002 (reserved for verse novelty filtering)
    ) -> ComposedResponse | None:
        """Dynamically select best atoms per slot and assemble."""
        # Define which atom categories to use based on phase
        slot_categories = self._get_slot_categories(phase)

        assembled_parts: list[str] = []
        used_atom_ids: list[str] = []
        verse_ref: str | None = None

        for category in slot_categories:
            atom = await self._select_best_atom(
                db, category, mood, topic, phase, intent,
                recent_atom_ids + used_atom_ids,
            )
            if atom:
                assembled_parts.append(atom.content)
                used_atom_ids.append(atom.id)
                if atom.verse_ref and not verse_ref:
                    verse_ref = atom.verse_ref

                # Record atom usage
                await db.execute(
                    update(WisdomAtom)
                    .where(WisdomAtom.id == atom.id)
                    .values(
                        times_used=WisdomAtom.times_used + 1,
                        last_used_at=datetime.utcnow(),
                    )
                )

        await db.commit()

        if len(assembled_parts) < MIN_ATOMS_REQUIRED:
            return None

        response_text = " ".join(assembled_parts)

        # Calculate confidence based on atom scores
        avg_confidence = 0.5
        if used_atom_ids:
            result = await db.execute(
                select(WisdomAtom.effectiveness_score).where(
                    WisdomAtom.id.in_(used_atom_ids)
                )
            )
            scores = [row[0] for row in result.all()]
            if scores:
                avg_confidence = sum(scores) / len(scores)

        return ComposedResponse(
            response=response_text,
            mood=mood,
            topic=topic,
            phase=phase,
            intent=intent,
            atom_ids_used=used_atom_ids,
            verse_ref=verse_ref,
            is_self_sufficient=True,
            confidence=avg_confidence,
        )

    def _get_slot_categories(self, phase: str) -> list[str]:
        """Determine which atom categories to fill based on conversation phase."""
        phase_slots = {
            "connect": ["validation", "grounding", "reflection"],
            "listen": ["validation", "reframe", "reflection"],
            "understand": ["validation", "reframe", "action", "reflection"],
            "guide": ["validation", "reframe", "wisdom", "action", "encouragement"],
            "empower": ["reframe", "wisdom", "action", "encouragement"],
        }
        return phase_slots.get(phase, ["validation", "reframe", "encouragement"])

    async def _select_best_atom(
        self,
        db: AsyncSession,
        category: str,
        mood: str,
        topic: str,
        phase: str,
        intent: str,
        exclude_ids: list[str],
    ) -> WisdomAtom | None:
        """
        Select the best atom for a given slot.

        Scoring:
        - Mood match: +3.0
        - Topic match: +2.0
        - Phase match: +1.5
        - Intent match: +1.0
        - Effectiveness score: +score * 2.0
        - Novelty (not recently used): +1.0
        """
        query = (
            select(WisdomAtom)
            .where(
                WisdomAtom.category == category,
                WisdomAtom.deleted_at.is_(None),
                WisdomAtom.effectiveness_score >= 0.3,
            )
            .limit(50)
        )

        if exclude_ids:
            query = query.where(WisdomAtom.id.notin_(exclude_ids))

        result = await db.execute(query)
        candidates = list(result.scalars().all())

        if not candidates:
            return None

        # Score candidates
        scored = []
        for atom in candidates:
            score = 0.0

            # Mood match
            if mood in (atom.mood_tags or []):
                score += 3.0

            # Topic match
            if topic in (atom.topic_tags or []):
                score += 2.0

            # Phase match
            if phase in (atom.phase_tags or []):
                score += 1.5

            # Intent match
            if intent in (atom.intent_tags or []):
                score += 1.0

            # Effectiveness bonus
            score += atom.effectiveness_score * 2.0

            # Novelty bonus (used less = better variety)
            if atom.times_used < 10:
                score += 1.0

            scored.append((atom, score))

        # Sort by score, pick from top 3 for variety
        scored.sort(key=lambda x: x[1], reverse=True)
        top_candidates = scored[:min(3, len(scored))]

        if not top_candidates:
            return None

        # Weighted random from top candidates
        total = sum(s for _, s in top_candidates)
        if total == 0:
            return top_candidates[0][0]

        rand = random.random() * total
        cumulative = 0.0
        for atom, score in top_candidates:
            cumulative += score
            if rand <= cumulative:
                return atom

        return top_candidates[0][0]

    # =========================================================================
    # FEEDBACK INTEGRATION
    # =========================================================================

    async def record_feedback(
        self,
        db: AsyncSession,
        atom_ids: list[str],
        template_id: str | None,
        positive: bool,
    ) -> None:
        """
        Record user feedback to improve future compositions.

        Positive feedback increases effectiveness scores.
        Negative feedback decreases them with decay.
        """
        for atom_id in atom_ids:
            if positive:
                await db.execute(
                    update(WisdomAtom)
                    .where(WisdomAtom.id == atom_id)
                    .values(
                        positive_feedback=WisdomAtom.positive_feedback + 1,
                    )
                )
            else:
                await db.execute(
                    update(WisdomAtom)
                    .where(WisdomAtom.id == atom_id)
                    .values(
                        negative_feedback=WisdomAtom.negative_feedback + 1,
                    )
                )

        # Recalculate effectiveness scores for affected atoms
        for atom_id in atom_ids:
            result = await db.execute(
                select(WisdomAtom).where(WisdomAtom.id == atom_id)
            )
            atom = result.scalar_one_or_none()
            if atom:
                total_signals = atom.positive_feedback + atom.negative_feedback
                if total_signals > 0:
                    # Wilson score interval lower bound for ranking
                    # Provides better sorting than simple positive/total ratio
                    new_score = _wilson_score(
                        atom.positive_feedback, total_signals
                    )
                    await db.execute(
                        update(WisdomAtom)
                        .where(WisdomAtom.id == atom_id)
                        .values(effectiveness_score=new_score)
                    )

        # Update template if applicable
        if template_id:
            if positive:
                await db.execute(
                    update(CompositionTemplate)
                    .where(CompositionTemplate.id == template_id)
                    .values(
                        positive_feedback=CompositionTemplate.positive_feedback + 1,
                    )
                )
            else:
                await db.execute(
                    update(CompositionTemplate)
                    .where(CompositionTemplate.id == template_id)
                    .values(
                        negative_feedback=CompositionTemplate.negative_feedback + 1,
                    )
                )

            # Recalculate template score
            result = await db.execute(
                select(CompositionTemplate).where(
                    CompositionTemplate.id == template_id
                )
            )
            template = result.scalar_one_or_none()
            if template:
                total = template.positive_feedback + template.negative_feedback
                if total > 0:
                    new_score = _wilson_score(template.positive_feedback, total)
                    await db.execute(
                        update(CompositionTemplate)
                        .where(CompositionTemplate.id == template_id)
                        .values(effectiveness_score=new_score)
                    )

        await db.commit()
        logger.info(
            f"[Composer] Recorded {'positive' if positive else 'negative'} "
            f"feedback for {len(atom_ids)} atoms"
        )


def _wilson_score(positive: int, total: int, z: float = 1.96) -> float:
    """
    Wilson score interval lower bound.

    Better than simple positive/total ratio because it accounts for
    sample size. Items with few ratings get conservative scores.
    z=1.96 corresponds to 95% confidence interval.
    """
    if total == 0:
        return 0.5

    p = positive / total
    denominator = 1 + z * z / total
    center = p + z * z / (2 * total)
    spread = z * ((p * (1 - p) + z * z / (4 * total)) / total) ** 0.5

    return max(0.0, min(1.0, (center - spread) / denominator))


# Singleton
_composer: ResponseCompositionEngine | None = None


def get_response_composer() -> ResponseCompositionEngine:
    """Get the singleton ResponseCompositionEngine instance."""
    global _composer
    if _composer is None:
        _composer = ResponseCompositionEngine()
    return _composer
