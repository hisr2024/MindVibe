"""Dynamic Wisdom Corpus - Effectiveness-Learning Verse Selection for KIAAN

ARCHITECTURE:
  Sits between WisdomKnowledgeBase (DB) and SakhaWisdomEngine (JSON) in the
  wisdom cascade. Unlike static lookup, this engine LEARNS from outcomes:

  1. Records which verses led to mood improvement per user/mood context
  2. Builds effectiveness scores: verse X + mood Y → Z% mood improvement
  3. Synthesizes contextual wisdom by combining related high-scoring verses
  4. Builds progressive cross-session wisdom paths (verse A → B → C)
  5. Adapts theme weights based on what actually helps each user

  The feedback loop:
    Wisdom delivered → user responds → mood re-detected → outcome recorded
    → effectiveness score updated → future selections weighted by effectiveness

  This is the LEARNING upgrade: from static scoring to adaptive intelligence.
"""

import datetime
import logging
import random
import re
import time
from collections import defaultdict
from typing import Any

from sqlalchemy import func as sa_func
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# ─── Mood Improvement Weights ────────────────────────────────────────────
# Defines which mood transitions count as "improvement" and by how much.
# Used to compute the effectiveness signal for the learning loop.
MOOD_IMPROVEMENT_WEIGHTS: dict[str, dict[str, float]] = {
    "anxious": {"peaceful": 1.0, "hopeful": 0.9, "neutral": 0.6, "grateful": 0.8},
    "sad": {"hopeful": 1.0, "peaceful": 0.8, "neutral": 0.6, "grateful": 0.9, "happy": 1.0},
    "angry": {"peaceful": 1.0, "neutral": 0.7, "hopeful": 0.6, "grateful": 0.8},
    "confused": {"hopeful": 0.9, "peaceful": 0.7, "neutral": 0.6, "excited": 0.7},
    "lonely": {"hopeful": 0.9, "grateful": 0.8, "peaceful": 0.7, "neutral": 0.5, "happy": 1.0},
    "overwhelmed": {"peaceful": 1.0, "neutral": 0.7, "hopeful": 0.8},
    "fearful": {"peaceful": 0.9, "hopeful": 1.0, "neutral": 0.6, "excited": 0.7},
    "frustrated": {"peaceful": 0.9, "neutral": 0.7, "hopeful": 0.8},
    "stressed": {"peaceful": 1.0, "neutral": 0.7, "hopeful": 0.8, "grateful": 0.9},
    "guilty": {"peaceful": 0.8, "hopeful": 0.9, "neutral": 0.6, "grateful": 0.8},
    "hurt": {"peaceful": 0.8, "hopeful": 0.9, "neutral": 0.6, "grateful": 0.7},
    "jealous": {"peaceful": 0.8, "neutral": 0.6, "grateful": 0.9, "hopeful": 0.7},
}

# Engagement signals and their weights for computing effectiveness
ENGAGEMENT_WEIGHTS = {
    "mood_improved": 0.40,        # Strongest signal: mood got better
    "session_continued": 0.25,    # User kept talking (didn't disengage)
    "response_length": 0.20,      # Longer responses = deeper engagement
    "explicit_positive": 0.15,    # User said "thank you", "that helps", etc.
}

# Minimum effectiveness records before we trust learned scores
MIN_RECORDS_FOR_LEARNING = 3

# How many top verses to consider from effectiveness-weighted pool
TOP_EFFECTIVENESS_CANDIDATES = 10

# Cache TTL for effectiveness scores (in-memory, per-process)
_EFFECTIVENESS_CACHE_TTL = 300  # 5 minutes

# Positive engagement keywords (detected in user's follow-up message)
_POSITIVE_ENGAGEMENT_PATTERNS = re.compile(
    r"\b(thank|thanks|helpful|helps|helped|better|makes sense|"
    r"good point|true|right|exactly|needed|appreciate|wow|"
    r"never thought|interesting|love that|beautiful)\b",
    re.IGNORECASE,
)


class DynamicWisdomCorpus:
    """Effectiveness-learning wisdom engine for KIAAN.

    Learns from user outcomes to select wisdom that actually helps.
    Uses a simple but effective scoring model:

    effectiveness = (mood_improved * 0.4) + (session_continued * 0.25)
                  + (response_length_normalized * 0.20) + (explicit_positive * 0.15)

    Verses with higher effectiveness for a given mood get selected more often.
    """

    def __init__(self) -> None:
        # In-memory cache: (mood, verse_ref) → effectiveness score
        self._effectiveness_cache: dict[str, dict[str, float]] = {}
        self._cache_timestamp: float = 0
        # Track which verses have been effective per mood (global across users)
        self._global_effectiveness: dict[str, list[tuple[str, float]]] = {}

    async def get_effectiveness_weighted_verse(
        self,
        db: AsyncSession,
        mood: str,
        user_message: str,
        phase: str,
        user_id: str,
        verse_history: list[str] | None = None,
        mood_intensity: float = 0.5,
    ) -> dict[str, Any] | None:
        """Get a verse weighted by learned effectiveness for this mood.

        Returns the best verse from the effectiveness-weighted pool, or None
        if there isn't enough learned data to make a confident selection.
        """
        verse_history = verse_history or []

        # Load effectiveness scores (cached)
        scores = await self._get_effectiveness_scores(db, mood)

        if not scores:
            logger.debug(f"DynamicWisdom: No effectiveness data for mood={mood}")
            return None

        # Filter out already-seen verses
        seen = set(verse_history)
        candidates = [
            (ref, eff) for ref, eff in scores
            if ref not in seen and eff > 0.3  # Only use verses above effectiveness threshold
        ]

        if not candidates:
            logger.debug(f"DynamicWisdom: All effective verses already seen for mood={mood}")
            return None

        # Weighted random selection: higher effectiveness = higher probability
        total_weight = sum(eff for _, eff in candidates)
        if total_weight <= 0:
            return None

        # Select using weighted distribution
        pick = random.uniform(0, total_weight)
        cumulative = 0.0
        selected_ref = candidates[0][0]
        selected_eff = candidates[0][1]

        for ref, eff in candidates:
            cumulative += eff
            if cumulative >= pick:
                selected_ref = ref
                selected_eff = eff
                break

        # Look up the actual verse content
        verse = await self._resolve_verse(db, selected_ref)
        if not verse:
            return None

        verse["effectiveness_score"] = selected_eff
        verse["source"] = "dynamic_corpus"

        logger.info(
            f"DynamicWisdom: Selected verse {selected_ref} "
            f"(effectiveness={selected_eff:.2f}) for mood={mood}"
        )
        return verse

    async def get_progressive_wisdom_path(
        self,
        db: AsyncSession,
        user_id: str,
        mood: str,
        session_count: int = 0,
    ) -> list[dict[str, Any]]:
        """Build a progressive wisdom path based on what's worked across sessions.

        For returning users, builds on previously effective wisdom by selecting
        verses from the same themes/chapters that led to mood improvement.
        """
        from backend.models.wisdom import WisdomEffectiveness

        # Find themes that were effective for this user
        try:
            result = await db.execute(
                select(
                    WisdomEffectiveness.theme_used,
                    sa_func.avg(WisdomEffectiveness.effectiveness).label("avg_eff"),
                    sa_func.count().label("cnt"),
                )
                .where(
                    WisdomEffectiveness.user_id == user_id,
                    WisdomEffectiveness.effectiveness.isnot(None),
                    WisdomEffectiveness.effectiveness > 0.4,
                )
                .group_by(WisdomEffectiveness.theme_used)
                .order_by(sa_func.avg(WisdomEffectiveness.effectiveness).desc())
                .limit(3)
            )
            rows = result.all()
        except Exception as e:
            logger.debug(f"DynamicWisdom: Progressive path query failed: {e}")
            return []

        if not rows:
            return []

        # Get the top effective themes
        effective_themes = [row[0] for row in rows if row[0]]
        if not effective_themes:
            return []

        # Use Sakha engine to find verse paths along these themes
        from backend.services.sakha_wisdom_engine import get_sakha_wisdom_engine
        sakha = get_sakha_wisdom_engine()
        if not sakha or sakha.get_verse_count() == 0:
            return []

        path_verses = []
        for theme in effective_themes[:3]:
            verse = sakha.get_contextual_verse(
                mood=mood,
                user_message=theme,  # Use theme as search context
                phase="guide",
                mood_intensity=0.5,
            )
            if verse and verse["verse_ref"] not in {v["verse_ref"] for v in path_verses}:
                verse["path_theme"] = theme
                path_verses.append(verse)

        return path_verses

    async def record_wisdom_delivery(
        self,
        db: AsyncSession,
        user_id: str,
        session_id: str,
        verse_ref: str,
        principle: str | None,
        mood: str,
        mood_intensity: float,
        phase: str,
        theme: str | None = None,
    ) -> None:
        """Record that a piece of wisdom was delivered to a user.

        Called immediately after wisdom is included in a response.
        The outcome fields (mood_after, engagement) are filled later
        when the user's next message arrives or the session ends.
        """
        from backend.models.wisdom import WisdomEffectiveness

        try:
            record = WisdomEffectiveness(
                user_id=user_id,
                session_id=session_id,
                verse_ref=verse_ref,
                principle=principle[:256] if principle else None,
                mood_at_delivery=mood,
                mood_intensity_at_delivery=mood_intensity,
                phase_at_delivery=phase,
                theme_used=theme,
            )
            db.add(record)
            await db.flush()
            logger.debug(
                f"DynamicWisdom: Recorded delivery of {verse_ref} "
                f"to user={user_id[:8]}... mood={mood}"
            )
        except Exception as e:
            logger.warning(f"DynamicWisdom: Failed to record delivery: {e}")

    async def record_wisdom_outcome(
        self,
        db: AsyncSession,
        user_id: str,
        session_id: str,
        mood_after: str,
        user_response: str | None = None,
        session_continued: bool = True,
    ) -> None:
        """Record the outcome after wisdom was delivered.

        Called when the user sends their next message (we can detect their
        new mood and engagement level) or when the session ends.
        """
        from backend.models.wisdom import WisdomEffectiveness

        try:
            # Find the most recent unresolved delivery for this user/session
            result = await db.execute(
                select(WisdomEffectiveness)
                .where(
                    WisdomEffectiveness.user_id == user_id,
                    WisdomEffectiveness.session_id == session_id,
                    WisdomEffectiveness.mood_after.is_(None),
                )
                .order_by(WisdomEffectiveness.delivered_at.desc())
                .limit(1)
            )
            record = result.scalar_one_or_none()

            if not record:
                return

            # Fill in outcome data
            record.mood_after = mood_after
            record.user_continued_session = session_continued

            # Detect mood improvement
            mood_before = record.mood_at_delivery
            improvement_map = MOOD_IMPROVEMENT_WEIGHTS.get(mood_before, {})
            mood_improved = mood_after in improvement_map
            record.mood_improved = mood_improved

            # Measure engagement from response
            response_length = len(user_response) if user_response else 0
            record.user_response_length = response_length

            # Compute engagement score
            engagement = self._compute_engagement_score(
                mood_improved=mood_improved,
                improvement_weight=improvement_map.get(mood_after, 0.0),
                session_continued=session_continued,
                response_length=response_length,
                user_response=user_response,
            )
            record.engagement_score = engagement
            record.effectiveness = engagement
            record.outcome_recorded_at = datetime.datetime.now(datetime.timezone.utc)

            await db.flush()

            logger.info(
                f"DynamicWisdom: Outcome for verse {record.verse_ref}: "
                f"mood {mood_before}→{mood_after}, "
                f"improved={mood_improved}, effectiveness={engagement:.2f}"
            )

            # Invalidate cache so next selection uses fresh data
            self._cache_timestamp = 0

        except Exception as e:
            logger.warning(f"DynamicWisdom: Failed to record outcome: {e}")

    def _compute_engagement_score(
        self,
        mood_improved: bool,
        improvement_weight: float,
        session_continued: bool,
        response_length: int,
        user_response: str | None,
    ) -> float:
        """Compute a 0.0-1.0 engagement/effectiveness score from outcome signals."""
        score = 0.0

        # Mood improvement (strongest signal)
        if mood_improved:
            score += ENGAGEMENT_WEIGHTS["mood_improved"] * improvement_weight
        elif mood_improved is False:
            # Mood didn't improve — small penalty but not zero
            # (the wisdom may still have helped even if mood stayed the same)
            score += ENGAGEMENT_WEIGHTS["mood_improved"] * 0.2

        # Session continuation
        if session_continued:
            score += ENGAGEMENT_WEIGHTS["session_continued"]

        # Response length (normalized: 0-200 chars = low, 200+ = full)
        if response_length > 0:
            length_normalized = min(response_length / 200.0, 1.0)
            score += ENGAGEMENT_WEIGHTS["response_length"] * length_normalized

        # Explicit positive engagement (user said "thanks", "helps", etc.)
        if user_response and _POSITIVE_ENGAGEMENT_PATTERNS.search(user_response):
            score += ENGAGEMENT_WEIGHTS["explicit_positive"]

        return min(score, 1.0)

    async def _get_effectiveness_scores(
        self,
        db: AsyncSession,
        mood: str,
    ) -> list[tuple[str, float]]:
        """Get effectiveness-ranked verses for a mood, using cache when fresh."""
        now = time.monotonic()

        # Check cache
        if (
            mood in self._effectiveness_cache
            and (now - self._cache_timestamp) < _EFFECTIVENESS_CACHE_TTL
        ):
            return self._effectiveness_cache[mood]

        # Query aggregated effectiveness from DB
        from backend.models.wisdom import WisdomEffectiveness

        try:
            result = await db.execute(
                select(
                    WisdomEffectiveness.verse_ref,
                    sa_func.avg(WisdomEffectiveness.effectiveness).label("avg_eff"),
                    sa_func.count().label("record_count"),
                )
                .where(
                    WisdomEffectiveness.mood_at_delivery == mood,
                    WisdomEffectiveness.effectiveness.isnot(None),
                )
                .group_by(WisdomEffectiveness.verse_ref)
                .having(sa_func.count() >= MIN_RECORDS_FOR_LEARNING)
                .order_by(sa_func.avg(WisdomEffectiveness.effectiveness).desc())
                .limit(TOP_EFFECTIVENESS_CANDIDATES)
            )
            rows = result.all()
        except Exception as e:
            logger.debug(f"DynamicWisdom: Effectiveness query failed: {e}")
            return []

        if not rows:
            return []

        scores = [(row[0], float(row[1])) for row in rows]

        # Update cache
        self._effectiveness_cache[mood] = scores
        self._cache_timestamp = now

        logger.debug(
            f"DynamicWisdom: Loaded {len(scores)} effective verses for mood={mood}, "
            f"top={scores[0][0]}({scores[0][1]:.2f})"
        )
        return scores

    async def _resolve_verse(
        self,
        db: AsyncSession,
        verse_ref: str,
    ) -> dict[str, Any] | None:
        """Resolve a verse reference to full verse content.

        Tries SakhaWisdomEngine first (fast, in-memory), then DB.
        """
        # Try Sakha engine (in-memory JSON corpus)
        from backend.services.sakha_wisdom_engine import get_sakha_wisdom_engine
        sakha = get_sakha_wisdom_engine()
        if sakha:
            verse = sakha.get_verse_by_ref(verse_ref)
            if verse:
                return verse

        # Fallback: query DB
        try:
            from backend.models.wisdom import GitaVerse
            parts = verse_ref.split(".")
            if len(parts) == 2:
                chapter = int(parts[0])
                verse_num = int(parts[1])
                result = await db.execute(
                    select(GitaVerse).where(
                        GitaVerse.chapter == chapter,
                        GitaVerse.verse == verse_num,
                    )
                )
                gv = result.scalar_one_or_none()
                if gv:
                    return {
                        "verse_ref": verse_ref,
                        "wisdom": gv.english,
                        "principle": gv.principle,
                        "sanskrit": gv.sanskrit,
                        "chapter": gv.chapter,
                        "theme": gv.theme,
                        "mental_health_applications": gv.mental_health_applications or [],
                    }
        except Exception as e:
            logger.debug(f"DynamicWisdom: DB verse lookup failed for {verse_ref}: {e}")

        return None

    async def get_corpus_stats(self, db: AsyncSession) -> dict[str, Any]:
        """Get statistics about the dynamic wisdom corpus effectiveness data."""
        from backend.models.wisdom import WisdomEffectiveness

        try:
            # Total records
            total_result = await db.execute(
                select(sa_func.count()).select_from(WisdomEffectiveness)
            )
            total = total_result.scalar() or 0

            # Records with outcomes
            outcome_result = await db.execute(
                select(sa_func.count())
                .select_from(WisdomEffectiveness)
                .where(WisdomEffectiveness.effectiveness.isnot(None))
            )
            with_outcomes = outcome_result.scalar() or 0

            # Average effectiveness
            avg_result = await db.execute(
                select(sa_func.avg(WisdomEffectiveness.effectiveness))
                .where(WisdomEffectiveness.effectiveness.isnot(None))
            )
            avg_effectiveness = avg_result.scalar()

            # Mood improvement rate
            improved_result = await db.execute(
                select(sa_func.count())
                .select_from(WisdomEffectiveness)
                .where(WisdomEffectiveness.mood_improved.is_(True))
            )
            mood_improved_count = improved_result.scalar() or 0

            # Top moods covered
            mood_result = await db.execute(
                select(
                    WisdomEffectiveness.mood_at_delivery,
                    sa_func.count().label("cnt"),
                )
                .group_by(WisdomEffectiveness.mood_at_delivery)
                .order_by(sa_func.count().desc())
                .limit(5)
            )
            top_moods = {row[0]: row[1] for row in mood_result.all()}

            return {
                "total_records": total,
                "records_with_outcomes": with_outcomes,
                "average_effectiveness": round(float(avg_effectiveness), 3) if avg_effectiveness else None,
                "mood_improvement_rate": (
                    round(mood_improved_count / with_outcomes, 3)
                    if with_outcomes > 0 else None
                ),
                "top_moods": top_moods,
                "cache_entries": len(self._effectiveness_cache),
                "learning_threshold": MIN_RECORDS_FOR_LEARNING,
            }

        except Exception as e:
            logger.warning(f"DynamicWisdom: Stats query failed: {e}")
            return {"error": str(e)}


# ─── Singleton ────────────────────────────────────────────────────────────

_dynamic_corpus: DynamicWisdomCorpus | None = None


def get_dynamic_wisdom_corpus() -> DynamicWisdomCorpus:
    """Get the singleton DynamicWisdomCorpus instance."""
    global _dynamic_corpus
    if _dynamic_corpus is None:
        _dynamic_corpus = DynamicWisdomCorpus()
    return _dynamic_corpus
