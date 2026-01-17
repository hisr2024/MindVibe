"""
Wisdom Journey Service - Core orchestration for AI-powered personalized wisdom journeys.

Provides functionality for creating, managing, and personalizing multi-day wisdom sequences
based on user mood patterns, journal themes, and Gita verse relevance.
"""

import datetime
import logging
import uuid
from typing import Any

from sqlalchemy import and_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    WisdomJourney,
    JourneyStep,
    JourneyRecommendation,
    JourneyStatus,
    GitaVerse,
    Mood,
    JournalEntry,
)
from backend.services.gita_service import GitaService
from backend.services.wisdom_recommender import WisdomRecommender

logger = logging.getLogger(__name__)


class WisdomJourneyService:
    """Service layer for wisdom journey orchestration."""

    def __init__(self) -> None:
        """Initialize the wisdom journey service."""
        self.gita_service = GitaService()
        self.recommender = WisdomRecommender()

    async def generate_personalized_journey(
        self,
        db: AsyncSession,
        user_id: str,
        duration_days: int = 7,
        custom_title: str | None = None,
    ) -> WisdomJourney:
        """
        Generate a personalized wisdom journey based on user mood and journal data.

        Args:
            db: Database session
            user_id: User ID
            duration_days: Journey duration (default 7 days)
            custom_title: Optional custom journey title

        Returns:
            Created WisdomJourney instance
        """
        logger.info(f"Generating personalized journey for user {user_id}, duration: {duration_days} days")

        # 1. Analyze user context (mood + journals)
        user_context = await self._analyze_user_context(db, user_id)

        # 2. Get journey recommendation
        journey_template = await self.recommender.recommend_journey_template(user_context)

        # 3. Select relevant verses
        verse_ids = await self.recommender.select_journey_verses(
            db, user_context, num_verses=duration_days
        )

        # 4. Create journey
        journey_id = str(uuid.uuid4())

        title = custom_title or journey_template["title"]
        description = journey_template["description"]

        journey = WisdomJourney(
            id=journey_id,
            user_id=user_id,
            title=title,
            description=description,
            total_steps=duration_days,
            current_step=0,
            status=JourneyStatus.ACTIVE,
            progress_percentage=0,
            recommended_by="ai",
            recommendation_score=journey_template.get("score", 0.8),
            recommendation_reason=journey_template.get("reason"),
            source_mood_scores=user_context.get("mood_scores"),
            source_themes=user_context.get("themes"),
        )

        db.add(journey)

        # 5. Create journey steps
        steps = []
        for i, verse_id in enumerate(verse_ids, start=1):
            # Get verse details
            verse = await db.get(GitaVerse, verse_id)
            if not verse:
                logger.warning(f"Verse {verse_id} not found, skipping step {i}")
                continue

            # Generate reflection prompt
            reflection_prompt = await self._generate_reflection_prompt(verse, user_context)

            # Generate AI insight
            ai_insight = await self._generate_ai_insight(verse, user_context)

            step = JourneyStep(
                id=str(uuid.uuid4()),
                journey_id=journey_id,
                step_number=i,
                verse_id=verse_id,
                reflection_prompt=reflection_prompt,
                ai_insight=ai_insight,
                completed=False,
            )
            steps.append(step)
            db.add(step)

        await db.commit()
        await db.refresh(journey)

        logger.info(f"Created journey {journey_id} with {len(steps)} steps for user {user_id}")

        return journey

    async def get_journey(self, db: AsyncSession, journey_id: str) -> WisdomJourney | None:
        """
        Get journey by ID.

        Args:
            db: Database session
            journey_id: Journey ID

        Returns:
            WisdomJourney instance or None if not found
        """
        result = await db.execute(
            select(WisdomJourney).where(
                and_(
                    WisdomJourney.id == journey_id,
                    WisdomJourney.deleted_at.is_(None),
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_active_journey(self, db: AsyncSession, user_id: str) -> WisdomJourney | None:
        """
        Get user's active journey.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Active WisdomJourney or None
        """
        result = await db.execute(
            select(WisdomJourney)
            .where(
                and_(
                    WisdomJourney.user_id == user_id,
                    WisdomJourney.status == JourneyStatus.ACTIVE,
                    WisdomJourney.deleted_at.is_(None),
                )
            )
            .order_by(WisdomJourney.created_at.desc())
        )
        return result.scalar_one_or_none()

    async def get_journey_steps(
        self, db: AsyncSession, journey_id: str
    ) -> list[JourneyStep]:
        """
        Get all steps for a journey, ordered by step number.

        Args:
            db: Database session
            journey_id: Journey ID

        Returns:
            List of JourneyStep instances
        """
        result = await db.execute(
            select(JourneyStep)
            .where(
                and_(
                    JourneyStep.journey_id == journey_id,
                    JourneyStep.deleted_at.is_(None),
                )
            )
            .order_by(JourneyStep.step_number)
        )
        return list(result.scalars().all())

    async def get_current_step(
        self, db: AsyncSession, journey_id: str
    ) -> JourneyStep | None:
        """
        Get the current step for a journey.

        Args:
            db: Database session
            journey_id: Journey ID

        Returns:
            Current JourneyStep or None
        """
        journey = await self.get_journey(db, journey_id)
        if not journey:
            return None

        result = await db.execute(
            select(JourneyStep).where(
                and_(
                    JourneyStep.journey_id == journey_id,
                    JourneyStep.step_number == journey.current_step + 1,
                    JourneyStep.deleted_at.is_(None),
                )
            )
        )
        return result.scalar_one_or_none()

    async def mark_step_complete(
        self,
        db: AsyncSession,
        journey_id: str,
        step_number: int,
        time_spent_seconds: int | None = None,
        user_notes: str | None = None,
        user_rating: int | None = None,
    ) -> JourneyStep | None:
        """
        Mark a journey step as complete and update progress.

        Args:
            db: Database session
            journey_id: Journey ID
            step_number: Step number to complete
            time_spent_seconds: Time spent on step (optional)
            user_notes: User reflection notes (optional)
            user_rating: User rating 1-5 (optional)

        Returns:
            Updated JourneyStep or None if not found
        """
        # Get step
        result = await db.execute(
            select(JourneyStep).where(
                and_(
                    JourneyStep.journey_id == journey_id,
                    JourneyStep.step_number == step_number,
                    JourneyStep.deleted_at.is_(None),
                )
            )
        )
        step = result.scalar_one_or_none()
        if not step:
            logger.warning(f"Step {step_number} not found for journey {journey_id}")
            return None

        # Update step
        step.completed = True
        step.completed_at = datetime.datetime.now(datetime.UTC)
        if time_spent_seconds is not None:
            step.time_spent_seconds = time_spent_seconds
        if user_notes:
            step.user_notes = user_notes
        if user_rating is not None:
            step.user_rating = max(1, min(5, user_rating))  # Clamp to 1-5

        # Update journey progress
        journey = await self.get_journey(db, journey_id)
        if journey:
            journey.current_step = step_number
            journey.progress_percentage = int((step_number / journey.total_steps) * 100)

            # Check if journey complete
            if step_number >= journey.total_steps:
                journey.status = JourneyStatus.COMPLETED
                journey.completed_at = datetime.datetime.now(datetime.UTC)
                logger.info(f"Journey {journey_id} completed by user {journey.user_id}")

        await db.commit()
        await db.refresh(step)

        logger.info(f"Step {step_number} of journey {journey_id} marked complete")

        return step

    async def pause_journey(self, db: AsyncSession, journey_id: str) -> WisdomJourney | None:
        """
        Pause a journey.

        Args:
            db: Database session
            journey_id: Journey ID

        Returns:
            Updated WisdomJourney or None
        """
        journey = await self.get_journey(db, journey_id)
        if not journey:
            return None

        journey.status = JourneyStatus.PAUSED
        journey.paused_at = datetime.datetime.now(datetime.UTC)

        await db.commit()
        await db.refresh(journey)

        logger.info(f"Journey {journey_id} paused")

        return journey

    async def resume_journey(self, db: AsyncSession, journey_id: str) -> WisdomJourney | None:
        """
        Resume a paused journey.

        Args:
            db: Database session
            journey_id: Journey ID

        Returns:
            Updated WisdomJourney or None
        """
        journey = await self.get_journey(db, journey_id)
        if not journey or journey.status != JourneyStatus.PAUSED:
            return None

        journey.status = JourneyStatus.ACTIVE
        journey.paused_at = None

        await db.commit()
        await db.refresh(journey)

        logger.info(f"Journey {journey_id} resumed")

        return journey

    async def delete_journey(self, db: AsyncSession, journey_id: str) -> bool:
        """
        Soft delete a journey and its steps.

        Args:
            db: Database session
            journey_id: Journey ID

        Returns:
            True if successful, False otherwise
        """
        journey = await self.get_journey(db, journey_id)
        if not journey:
            return False

        # Soft delete journey
        journey.soft_delete()

        # Soft delete all steps
        steps = await self.get_journey_steps(db, journey_id)
        for step in steps:
            step.soft_delete()

        await db.commit()

        logger.info(f"Journey {journey_id} soft deleted")

        return True

    async def get_journey_recommendations(
        self, db: AsyncSession, user_id: str, limit: int = 3
    ) -> list[dict[str, Any]]:
        """
        Get personalized journey recommendations for a user.

        Args:
            db: Database session
            user_id: User ID
            limit: Number of recommendations to return

        Returns:
            List of recommendation dicts with template, score, and reason
        """
        # Analyze user context
        user_context = await self._analyze_user_context(db, user_id)

        # Get recommendations from recommender
        recommendations = await self.recommender.generate_recommendations(
            user_context, limit=limit
        )

        # Store recommendations for tracking
        for rec in recommendations:
            rec_record = JourneyRecommendation(
                user_id=user_id,
                journey_template=rec["template"],
                relevance_score=rec["score"],
                reason=rec.get("reason"),
                features_snapshot=user_context,
            )
            db.add(rec_record)

        await db.commit()

        return recommendations

    async def _analyze_user_context(
        self, db: AsyncSession, user_id: str
    ) -> dict[str, Any]:
        """
        Analyze user mood and journal data to build context for recommendations.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Dict with mood_scores, themes, and other context data
        """
        context: dict[str, Any] = {
            "user_id": user_id,
            "mood_scores": [],
            "themes": [],
            "emotion_tags": [],
        }

        # Get last 7 days of moods
        seven_days_ago = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=7)
        mood_result = await db.execute(
            select(Mood)
            .where(
                and_(
                    Mood.user_id == user_id,
                    Mood.created_at >= seven_days_ago,
                    Mood.deleted_at.is_(None),
                )
            )
            .order_by(Mood.created_at.desc())
        )
        moods = list(mood_result.scalars().all())

        if moods:
            context["mood_scores"] = [m.score for m in moods]
            context["mood_average"] = sum(context["mood_scores"]) / len(context["mood_scores"])
            context["mood_trend"] = self._calculate_mood_trend(context["mood_scores"])

            # Collect emotion tags
            for mood in moods:
                if mood.emotion_tags:
                    context["emotion_tags"].extend(mood.emotion_tags)

            context["emotion_tags"] = list(set(context["emotion_tags"]))  # Dedupe
        else:
            context["mood_average"] = 5.0  # Neutral default
            context["mood_trend"] = "neutral"

        # Get recent journal themes (last 30 days)
        thirty_days_ago = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=30)
        journal_result = await db.execute(
            select(JournalEntry)
            .where(
                and_(
                    JournalEntry.user_id == user_id,
                    JournalEntry.created_at >= thirty_days_ago,
                    JournalEntry.deleted_at.is_(None),
                )
            )
            .order_by(JournalEntry.created_at.desc())
            .limit(10)
        )
        journals = list(journal_result.scalars().all())

        if journals:
            # Extract tags as themes (privacy-preserving)
            for journal in journals:
                if journal.tags:
                    context["themes"].extend(journal.tags)

            context["themes"] = list(set(context["themes"]))  # Dedupe

        return context

    def _calculate_mood_trend(self, mood_scores: list[float]) -> str:
        """
        Calculate mood trend from recent scores.

        Args:
            mood_scores: List of mood scores (most recent first)

        Returns:
            "improving", "declining", or "stable"
        """
        if len(mood_scores) < 2:
            return "neutral"

        # Simple linear trend: compare first half to second half
        mid = len(mood_scores) // 2
        first_half_avg = sum(mood_scores[:mid]) / mid
        second_half_avg = sum(mood_scores[mid:]) / (len(mood_scores) - mid)

        diff = first_half_avg - second_half_avg  # Recent - older

        if diff > 1.0:
            return "improving"
        elif diff < -1.0:
            return "declining"
        else:
            return "stable"

    async def _generate_reflection_prompt(
        self, verse: GitaVerse, user_context: dict[str, Any]
    ) -> str:
        """
        Generate a personalized reflection prompt for a verse.

        Args:
            verse: GitaVerse instance
            user_context: User context dict

        Returns:
            Reflection prompt string
        """
        # Simple template-based approach (can be enhanced with AI later)
        mood_avg = user_context.get("mood_average", 5.0)

        if mood_avg < 4:
            return f"Reflect on how this verse resonates with your current challenges. What small step can you take today towards inner peace?"
        elif mood_avg > 7:
            return f"How can you use the energy from this verse to uplift others? Consider one act of compassion today."
        else:
            return f"What does this verse mean to you in your life right now? Journal your thoughts without judgment."

    async def _generate_ai_insight(
        self, verse: GitaVerse, user_context: dict[str, Any]
    ) -> str:
        """
        Generate AI-powered insight for a verse (placeholder for now).

        Args:
            verse: GitaVerse instance
            user_context: User context dict

        Returns:
            AI insight string
        """
        # Placeholder - can integrate with OpenAI later
        return f"This verse from Chapter {verse.chapter}, Verse {verse.verse} offers guidance on finding balance in challenging times."
