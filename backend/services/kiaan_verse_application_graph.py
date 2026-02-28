"""
KIAAN Verse Application Graph — Module 3 of 4 Self-Sufficiency Modules

Builds and maintains a weighted graph mapping Gita verses to real-world
situations (mood + topic combinations). Weights evolve through user feedback,
creating a self-improving verse recommendation system.

Graph structure:
    Nodes: Verses (by ref, e.g. "2.47") and Situations (mood + topic)
    Edges: Weighted connections with confidence scores

    Verse(2.47) ──[0.92, conf=0.85]──> Situation(anxious, academic)
    Verse(2.47) ──[0.65, conf=0.70]──> Situation(stressed, work)
    Verse(6.5)  ──[0.88, conf=0.90]──> Situation(sad, relationship)

Weight update rules:
    - Positive signal (thumbs up, save, share): weight += learning_rate * (1 - weight)
    - Negative signal (thumbs down, skip): weight -= learning_rate * weight
    - Decay: weights decay toward 0.5 if not used (prevents staleness)
    - Confidence: increases with more data (Bayesian)

This graph replaces static mood-to-verse mappings with a dynamic,
feedback-driven system that gets more accurate over time.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.self_sufficiency import VerseApplicationEdge

logger = logging.getLogger(__name__)

# Learning rate for weight updates (controls how fast the graph adapts)
LEARNING_RATE = 0.1

# Minimum confidence to include in recommendations
MIN_CONFIDENCE_THRESHOLD = 0.15

# Weight decay rate (per day of non-use)
DECAY_RATE = 0.005

# Prior counts for Bayesian confidence (prevents overconfidence from few signals)
PRIOR_POSITIVE = 1
PRIOR_NEGATIVE = 1


class VerseApplicationGraph:
    """
    Dynamic graph that maps verses to situations based on user feedback.

    The graph grows and adapts through three operations:
    1. record_show() — A verse was shown for a mood+topic
    2. record_signal() — User gave positive/negative feedback
    3. recommend() — Query the graph for best verses given mood+topic
    """

    # =========================================================================
    # GRAPH OPERATIONS
    # =========================================================================

    async def record_show(
        self,
        db: AsyncSession,
        verse_ref: str,
        mood: str,
        topic: str,
    ) -> VerseApplicationEdge:
        """
        Record that a verse was shown to a user for a given situation.

        Creates the edge if it doesn't exist, increments times_shown.
        """
        edge = await self._get_or_create_edge(db, verse_ref, mood, topic)

        await db.execute(
            update(VerseApplicationEdge)
            .where(VerseApplicationEdge.id == edge.id)
            .values(times_shown=VerseApplicationEdge.times_shown + 1)
        )
        await db.commit()

        return edge

    async def record_signal(
        self,
        db: AsyncSession,
        verse_ref: str,
        mood: str,
        topic: str,
        positive: bool,
    ) -> VerseApplicationEdge:
        """
        Record user feedback for a verse in a given situation.

        Positive signals:
        - User rated response helpful
        - User saved verse to journal
        - User shared verse
        - User gave thumbs up

        Negative signals:
        - User rated response unhelpful
        - User gave thumbs down
        - User explicitly said verse wasn't relevant
        """
        edge = await self._get_or_create_edge(db, verse_ref, mood, topic)

        if positive:
            new_positive = edge.positive_signals + 1
            new_negative = edge.negative_signals
        else:
            new_positive = edge.positive_signals
            new_negative = edge.negative_signals + 1

        # Recalculate weight using exponential moving average
        new_weight = self._calculate_weight(
            edge.weight, positive, LEARNING_RATE
        )

        # Recalculate confidence using Bayesian approach
        new_confidence = self._calculate_confidence(
            new_positive, new_negative, edge.times_shown
        )

        await db.execute(
            update(VerseApplicationEdge)
            .where(VerseApplicationEdge.id == edge.id)
            .values(
                weight=new_weight,
                confidence=new_confidence,
                positive_signals=new_positive,
                negative_signals=new_negative,
            )
        )
        await db.commit()

        logger.info(
            f"[VerseGraph] {verse_ref} → ({mood}, {topic}): "
            f"weight={new_weight:.3f} conf={new_confidence:.3f} "
            f"({'positive' if positive else 'negative'})"
        )

        return edge

    async def recommend(
        self,
        db: AsyncSession,
        mood: str,
        topic: str,
        exclude_refs: list[str] | None = None,
        limit: int = 5,
    ) -> list[dict]:
        """
        Get the best verse recommendations for a mood+topic situation.

        Returns verses ranked by (weight * confidence), ensuring diversity
        by not repeating recently-shown verses.

        Returns:
            List of dicts with verse_ref, weight, confidence, composite_score
        """
        exclude_refs = exclude_refs or []

        query = (
            select(VerseApplicationEdge)
            .where(
                VerseApplicationEdge.mood == mood,
                VerseApplicationEdge.topic == topic,
                VerseApplicationEdge.confidence >= MIN_CONFIDENCE_THRESHOLD,
            )
        )

        if exclude_refs:
            query = query.where(
                VerseApplicationEdge.verse_ref.notin_(exclude_refs)
            )

        result = await db.execute(query)
        edges = list(result.scalars().all())

        if not edges:
            # Try broader match: mood only (any topic)
            query = (
                select(VerseApplicationEdge)
                .where(
                    VerseApplicationEdge.mood == mood,
                    VerseApplicationEdge.confidence >= MIN_CONFIDENCE_THRESHOLD,
                )
            )
            if exclude_refs:
                query = query.where(
                    VerseApplicationEdge.verse_ref.notin_(exclude_refs)
                )

            result = await db.execute(query)
            edges = list(result.scalars().all())

        if not edges:
            return []

        # Score each edge: weight * confidence (with exploration bonus)
        scored = []
        for edge in edges:
            composite = edge.weight * edge.confidence

            # Exploration bonus: boost underexplored edges slightly
            if edge.times_shown < 5:
                composite += 0.05 * (5 - edge.times_shown)

            scored.append({
                "verse_ref": edge.verse_ref,
                "weight": round(edge.weight, 4),
                "confidence": round(edge.confidence, 4),
                "composite_score": round(composite, 4),
                "times_shown": edge.times_shown,
                "positive_signals": edge.positive_signals,
                "negative_signals": edge.negative_signals,
            })

        # Sort by composite score
        scored.sort(key=lambda x: x["composite_score"], reverse=True)

        return scored[:limit]

    async def get_verse_profile(
        self, db: AsyncSession, verse_ref: str
    ) -> list[dict]:
        """
        Get the full application profile for a verse.

        Returns all mood+topic combinations where this verse has been
        used, with their weights and confidence scores.
        """
        result = await db.execute(
            select(VerseApplicationEdge)
            .where(VerseApplicationEdge.verse_ref == verse_ref)
            .order_by(
                (VerseApplicationEdge.weight * VerseApplicationEdge.confidence).desc()
            )
        )
        edges = result.scalars().all()

        return [
            {
                "mood": e.mood,
                "topic": e.topic,
                "weight": round(e.weight, 4),
                "confidence": round(e.confidence, 4),
                "times_shown": e.times_shown,
                "positive_signals": e.positive_signals,
                "negative_signals": e.negative_signals,
            }
            for e in edges
        ]

    async def decay_stale_edges(
        self,
        db: AsyncSession,
        days_since_update: int = 30,
    ) -> int:
        """
        Apply weight decay to edges not updated recently.

        Prevents stale recommendations from dominating by gradually
        pulling weights toward 0.5 (neutral).

        Should be run as a scheduled task (daily or weekly).
        """
        cutoff = datetime.utcnow() - timedelta(days=days_since_update)

        result = await db.execute(
            select(VerseApplicationEdge).where(
                VerseApplicationEdge.updated_at < cutoff
            )
        )
        stale_edges = list(result.scalars().all())

        updated = 0
        for edge in stale_edges:
            # Decay toward 0.5 (neutral)
            if edge.weight > 0.5:
                new_weight = max(0.5, edge.weight - DECAY_RATE * days_since_update)
            elif edge.weight < 0.5:
                new_weight = min(0.5, edge.weight + DECAY_RATE * days_since_update)
            else:
                continue

            await db.execute(
                update(VerseApplicationEdge)
                .where(VerseApplicationEdge.id == edge.id)
                .values(weight=new_weight)
            )
            updated += 1

        if updated:
            await db.commit()
            logger.info(f"[VerseGraph] Decayed {updated} stale edges")

        return updated

    async def get_statistics(self, db: AsyncSession) -> dict:
        """Get graph statistics for monitoring."""
        from sqlalchemy import func

        total_result = await db.execute(
            select(func.count(VerseApplicationEdge.id))
        )
        total_edges = total_result.scalar() or 0

        unique_verses = await db.execute(
            select(func.count(VerseApplicationEdge.verse_ref.distinct()))
        )
        verse_count = unique_verses.scalar() or 0

        unique_situations = await db.execute(
            select(
                func.count(
                    func.concat(
                        VerseApplicationEdge.mood,
                        "-",
                        VerseApplicationEdge.topic,
                    ).distinct()
                )
            )
        )
        situation_count = unique_situations.scalar() or 0

        high_confidence = await db.execute(
            select(func.count(VerseApplicationEdge.id)).where(
                VerseApplicationEdge.confidence >= 0.7
            )
        )
        high_conf_count = high_confidence.scalar() or 0

        avg_weight = await db.execute(
            select(func.avg(VerseApplicationEdge.weight))
        )
        avg_w = avg_weight.scalar() or 0.5

        return {
            "total_edges": total_edges,
            "unique_verses": verse_count,
            "unique_situations": situation_count,
            "high_confidence_edges": high_conf_count,
            "average_weight": round(float(avg_w), 4),
        }

    # =========================================================================
    # INTERNAL HELPERS
    # =========================================================================

    async def _get_or_create_edge(
        self,
        db: AsyncSession,
        verse_ref: str,
        mood: str,
        topic: str,
    ) -> VerseApplicationEdge:
        """Get existing edge or create a new one."""
        result = await db.execute(
            select(VerseApplicationEdge).where(
                VerseApplicationEdge.verse_ref == verse_ref,
                VerseApplicationEdge.mood == mood,
                VerseApplicationEdge.topic == topic,
            )
        )
        edge = result.scalar_one_or_none()

        if edge:
            return edge

        # Create new edge with neutral weight
        edge = VerseApplicationEdge(
            verse_ref=verse_ref,
            mood=mood,
            topic=topic,
            weight=0.5,
            confidence=0.1,
            times_shown=0,
            positive_signals=0,
            negative_signals=0,
        )
        db.add(edge)
        await db.commit()
        await db.refresh(edge)
        return edge

    @staticmethod
    def _calculate_weight(
        current_weight: float,
        positive: bool,
        learning_rate: float,
    ) -> float:
        """
        Update weight using exponential moving average.

        Positive: weight moves toward 1.0
        Negative: weight moves toward 0.0
        """
        if positive:
            new_weight = current_weight + learning_rate * (1.0 - current_weight)
        else:
            new_weight = current_weight - learning_rate * current_weight

        return max(0.0, min(1.0, new_weight))

    @staticmethod
    def _calculate_confidence(
        positive: int,
        negative: int,
        times_shown: int,  # noqa: ARG004 (reserved for exposure-weighted confidence)
    ) -> float:
        """
        Calculate Bayesian confidence score.

        Uses Beta distribution with informative prior.
        Confidence increases with more data points.
        """
        total_signals = positive + negative
        total_with_prior = total_signals + PRIOR_POSITIVE + PRIOR_NEGATIVE

        if total_with_prior == 0:
            return 0.1

        # Beta distribution mean with prior
        p = (positive + PRIOR_POSITIVE) / total_with_prior

        # Confidence grows with sample size (logarithmic)
        sample_factor = min(1.0, math.log1p(total_signals) / math.log1p(50))

        # Combine proportion quality with sample size
        confidence = p * sample_factor

        return max(0.0, min(1.0, confidence))


# Singleton
_graph: VerseApplicationGraph | None = None


def get_verse_application_graph() -> VerseApplicationGraph:
    """Get the singleton VerseApplicationGraph instance."""
    global _graph
    if _graph is None:
        _graph = VerseApplicationGraph()
    return _graph
