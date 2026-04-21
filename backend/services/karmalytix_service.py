"""KarmaLytix Service: Sacred Reflections Analysis engine.

Analyzes journal metadata only (mood_labels, tag_labels, timestamps, frequency,
verse bookmarks, assessment responses, emotional logs) — never decrypted content.
Provides 5-dimension karma scoring, pattern detection, and KIAAN insight generation.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date, datetime, time, timedelta
from typing import Any, Optional

from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.emotional import UserAssessment, UserEmotionalLog, UserVerseBookmark
from backend.models.journal import JournalEntry
from backend.models.karmalytix import KarmaLytixReport, KarmaPattern, KarmaScore
from backend.services.karmalytix_prompts import (
    build_karma_insight_prompt,
    select_verses_for_dimensions,
)
from backend.services.karmalytix_reflection import (
    generate_structured_reflection,
)

logger = logging.getLogger(__name__)

# Positive and negative mood sets for emotional balance scoring
POSITIVE_MOODS = frozenset(
    {"peaceful", "grateful", "hopeful", "joyful", "content", "devotional", "blissful"}
)
NEGATIVE_MOODS = frozenset(
    {"anxious", "sad", "angry", "overwhelmed", "hurt", "guilty", "fearful"}
)

# Category labels the mobile composer folds into ``tag_labels`` (Prompt 2
# spec). Kept in sync with ``apps/mobile/app/journal/new.tsx::CATEGORIES``.
_CATEGORY_LABELS = frozenset({"Gratitude", "Reflection", "Prayer", "Dream", "Shadow"})
_TIME_TAG_PREFIX = "time:"

# Minimum number of entries before a full Sacred Mirror is generated.
_MIN_ENTRIES_FOR_REPORT = 3


class KarmaLytixService:
    """Core KarmaLytix engine for karma scoring, patterns, and reports."""

    # ── PUBLIC API ────────────────────────────────────────────────────────

    async def get_dashboard_data(self, db: AsyncSession, user_id: str) -> dict[str, Any]:
        """Get complete dashboard data: score, patterns, latest report, history."""
        score, patterns = await asyncio.gather(
            self.calculate_karma_score(db, user_id),
            self.detect_patterns(db, user_id),
        )
        latest_report = await self._get_latest_report(db, user_id)
        history = await self._get_report_history(db, user_id, limit=8)
        return {
            "score": score,
            "patterns": patterns,
            "latest_report": latest_report,
            "history": history,
            "privacy_note": "KarmaLytix analyzes only metadata \u2014 your journal content is never read.",
        }

    async def generate_weekly_report(
        self, db: AsyncSession, user_id: str, force_regenerate: bool = False
    ) -> KarmaLytixReport:
        """Generate or retrieve the weekly karma report."""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        if not force_regenerate:
            existing = await self._get_existing_report(db, user_id, week_start, "weekly")
            if existing:
                return existing

        metadata = await self._aggregate_journal_metadata(db, user_id, week_start, week_end)
        mood_data = await self._get_mood_data(db, user_id, week_start, week_end)
        emotional_logs = await self._get_emotional_logs(db, user_id, week_start, week_end)
        bookmarks = await self._get_verse_bookmark_count(db, user_id, week_start, week_end)
        assessment_data = await self._get_assessment_data(db, user_id, week_start, week_end)

        score = await self.calculate_karma_score(
            db,
            user_id,
            mood_data=mood_data,
            journal_metadata=metadata,
            emotional_logs=emotional_logs,
            verse_bookmarks=bookmarks,
            assessment_data=assessment_data,
        )

        prev_start = week_start - timedelta(days=7)
        prev_score = await self._get_score_for_period(db, user_id, prev_start)
        comparison = self._compare_to_previous(score, prev_score)
        patterns = await self.detect_patterns(db, user_id)

        karma_dimensions = {
            "emotional_balance": score.emotional_balance,
            "spiritual_growth": score.spiritual_growth,
            "consistency": score.consistency,
            "self_awareness": score.self_awareness,
            "wisdom_integration": score.wisdom_integration,
        }

        # Enrich the metadata summary with the same plaintext signals the
        # mobile Sacred Mirror already renders client-side. Bookmarks are
        # counted here so the Claude prompt sees the real number rather
        # than the client's local guess.
        enriched_metadata = {
            **metadata,
            "verse_bookmarks": bookmarks,
            "assessment_completed": bool(
                (assessment_data or {}).get("completed_this_week")
            ),
        }

        # Compose the weekly_assessment payload that the Sacred Mirror
        # prompt consumes. The persistence layer for raw assessment text
        # currently lives client-side (see the mobile KarmaLytix spec),
        # so only fields we can infer or receive from the server-side
        # UserAssessment table are included here.
        weekly_assessment_payload: dict[str, Any] | None = None
        if (assessment_data or {}).get("completed_this_week"):
            weekly_assessment_payload = {
                "completed_this_week": assessment_data["completed_this_week"],
            }

        verses = await select_verses_for_dimensions(karma_dimensions)
        structured_reflection = await generate_structured_reflection(
            period_start=week_start.isoformat(),
            period_end=week_end.isoformat(),
            dimensions=karma_dimensions,
            overall_score=score.overall_score,
            metadata=enriched_metadata,
            weekly_assessment=weekly_assessment_payload,
        )
        insight = await self._generate_kiaan_insight(karma_dimensions, patterns, comparison)

        # Merge the KIAAN gita_echo into the recommended verses list so the
        # mobile screen always finds at least one verse reference.
        merged_verses = list(verses)
        gita_echo = structured_reflection.get("gita_echo")
        if isinstance(gita_echo, dict) and gita_echo:
            merged_verses.insert(
                0,
                {
                    "chapter": gita_echo.get("chapter"),
                    "verse": gita_echo.get("verse"),
                    "sanskrit": gita_echo.get("sanskrit"),
                    "theme": gita_echo.get("connection"),
                },
            )

        patterns_payload: dict[str, Any] = {
            "active_count": len([p for p in patterns if p.is_active]),
            **structured_reflection,
        }

        report = KarmaLytixReport(
            user_id=user_id,
            report_date=today,
            report_type="weekly",
            period_start=week_start,
            period_end=week_end,
            karma_dimensions=karma_dimensions,
            overall_karma_score=score.overall_score,
            journal_metadata_summary=enriched_metadata,
            kiaan_insight=insight,
            recommended_verses=merged_verses,
            patterns_detected=patterns_payload,
            comparison_to_previous=comparison,
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)
        return report

    async def calculate_karma_score(
        self,
        db: AsyncSession,
        user_id: str,
        mood_data: Optional[dict[str, Any]] = None,
        journal_metadata: Optional[dict[str, Any]] = None,
        emotional_logs: Optional[list[Any]] = None,
        verse_bookmarks: int = 0,
        assessment_data: Optional[dict[str, Any]] = None,
        score_date: Optional[date] = None,
    ) -> KarmaScore:
        """Calculate or update today's karma score across 5 dimensions."""
        today = score_date or date.today()
        result = await db.execute(
            select(KarmaScore).where(
                and_(KarmaScore.user_id == user_id, KarmaScore.score_date == today)
            )
        )
        existing = result.scalar_one_or_none()

        week_start = today - timedelta(days=7)
        if journal_metadata is None:
            journal_metadata = await self._aggregate_journal_metadata(db, user_id, week_start, today)
        if mood_data is None:
            mood_data = await self._get_mood_data(db, user_id, week_start, today)
        if emotional_logs is None:
            emotional_logs = await self._get_emotional_logs(db, user_id, week_start, today)

        eb = self._calc_emotional_balance(mood_data, journal_metadata)
        sg = await self._calc_spiritual_growth(db, user_id, eb)
        cs = self._calc_consistency(journal_metadata)
        sa = self._calc_self_awareness(journal_metadata, emotional_logs)
        wi = self._calc_wisdom_integration(verse_bookmarks, assessment_data)
        overall = round((eb + sg + cs + sa + wi) / 5)

        if existing:
            existing.emotional_balance = eb
            existing.spiritual_growth = sg
            existing.consistency = cs
            existing.self_awareness = sa
            existing.wisdom_integration = wi
            existing.overall_score = overall
            await db.commit()
            await db.refresh(existing)
            return existing

        score = KarmaScore(
            user_id=user_id,
            score_date=today,
            emotional_balance=eb,
            spiritual_growth=sg,
            consistency=cs,
            self_awareness=sa,
            wisdom_integration=wi,
            overall_score=overall,
        )
        db.add(score)
        await db.commit()
        await db.refresh(score)
        return score

    async def detect_patterns(self, db: AsyncSession, user_id: str) -> list[KarmaPattern]:
        """Detect karma patterns from score history over the last 30 days."""
        thirty_ago = date.today() - timedelta(days=30)
        result = await db.execute(
            select(KarmaScore)
            .where(and_(KarmaScore.user_id == user_id, KarmaScore.score_date >= thirty_ago))
            .order_by(KarmaScore.score_date)
        )
        scores = result.scalars().all()
        new_patterns: list[KarmaPattern] = []

        if len(scores) >= 3:
            recent_7 = [s.overall_score for s in scores[-7:]]
            if self._is_upward(recent_7):
                new_patterns.append(
                    KarmaPattern(
                        user_id=user_id,
                        pattern_type="growth_trajectory",
                        pattern_name="Rising Karma",
                        description="Your overall karma score shows consistent growth over 7 days.",
                        confidence_score=0.80,
                        supporting_data={"scores": recent_7},
                        gita_verse_ref={"chapter": 6, "verse": 35, "theme": "abhyasa \u2014 consistent practice"},
                    )
                )

            if len(scores) >= 14:
                recent_14 = [s.overall_score for s in scores[-14:]]
                if (max(recent_14) - min(recent_14)) < 8:
                    new_patterns.append(
                        KarmaPattern(
                            user_id=user_id,
                            pattern_type="stagnation",
                            pattern_name="Steady Plateau",
                            description="Your scores have been consistent but not growing. A breakthrough may be near.",
                            confidence_score=0.70,
                            supporting_data={"variance": max(recent_14) - min(recent_14)},
                            gita_verse_ref={"chapter": 3, "verse": 37, "theme": "overcoming inertia"},
                        )
                    )

            if len(scores) >= 4:
                recent_4 = [s.overall_score for s in scores[-4:]]
                if recent_4[-1] - recent_4[0] >= 15:
                    new_patterns.append(
                        KarmaPattern(
                            user_id=user_id,
                            pattern_type="breakthrough",
                            pattern_name="Karmic Breakthrough",
                            description="A significant positive shift in your karma score has been detected.",
                            confidence_score=0.85,
                            supporting_data={"jump": recent_4[-1] - recent_4[0]},
                            gita_verse_ref={"chapter": 18, "verse": 73, "theme": "clarity after confusion"},
                        )
                    )

        for p in new_patterns:
            db.add(p)
        if new_patterns:
            await db.commit()

        result = await db.execute(
            select(KarmaPattern)
            .where(and_(KarmaPattern.user_id == user_id, KarmaPattern.is_active == True))  # noqa: E712
            .order_by(desc(KarmaPattern.confidence_score))
        )
        return list(result.scalars().all())

    # ── KIAAN INSIGHT ─────────────────────────────────────────────────────

    async def _generate_kiaan_insight(
        self,
        karma_data: dict[str, int],
        patterns: list[KarmaPattern],
        comparison: dict[str, Any],
    ) -> str:
        """Generate KIAAN sacred karma insight with fallback."""
        prompt = build_karma_insight_prompt(karma_data, patterns, comparison)
        try:
            from backend.services.kiaan_sovereign_mind import get_sovereign_mind

            mind = await get_sovereign_mind()
            result = await asyncio.wait_for(
                mind.think(query=prompt, context={"type": "karma_analysis"}),
                timeout=10.0,
            )
            return result.get("response", self._fallback_insight(karma_data))
        except Exception as e:
            logger.warning(f"KIAAN insight fallback: {e}")
            return self._fallback_insight(karma_data)

    # ── DIMENSION SCORING ─────────────────────────────────────────────────

    def _calc_emotional_balance(self, mood_data: dict[str, Any], metadata: dict[str, Any]) -> int:
        """Score emotional balance from mood distribution and swing frequency."""
        counts = mood_data.get("mood_counts", {})
        total = sum(counts.values())
        if not total:
            return 50

        positive = sum(counts.get(m, 0) for m in POSITIVE_MOODS)
        ratio = positive / total

        daily = mood_data.get("daily_primary_moods", [])
        swings = sum(
            1
            for i in range(1, len(daily))
            if daily[i] in NEGATIVE_MOODS and daily[i - 1] in POSITIVE_MOODS
        )
        raw = ratio * 80 + 20 - min(swings * 8, 30)
        return min(max(round(raw), 0), 100)

    def _calc_consistency(self, metadata: dict[str, Any]) -> int:
        """Score consistency from journaling frequency and depth."""
        days = metadata.get("journaling_days", 0)
        entries = metadata.get("entry_count", 0)
        coverage = min(days / 7.0, 1.0) * 70
        depth = min((entries - days) * 3, 30) if entries > days else 0
        return min(max(round(coverage + depth), 0), 100)

    def _calc_self_awareness(self, metadata: dict[str, Any], logs: list[Any]) -> int:
        """Score self-awareness from tag diversity and emotional log frequency."""
        tags = metadata.get("unique_tag_count", 0)
        log_count = len(logs) if logs else 0
        return min(max(round(min(tags * 8, 50) + min(log_count * 7, 50)), 0), 100)

    def _calc_wisdom_integration(
        self, bookmarks: int, assessment_data: Optional[dict[str, Any]]
    ) -> int:
        """Score wisdom integration from verse bookmarks and assessment completion."""
        bm = min(bookmarks * 15, 60)
        assess = min((assessment_data or {}).get("completed_this_week", 0) * 20, 40)
        return min(max(round(bm + assess), 0), 100)

    async def _calc_spiritual_growth(self, db: AsyncSession, user_id: str, current_eb: int) -> int:
        """Score spiritual growth by comparing current emotional balance to previous period."""
        prev_date = date.today() - timedelta(days=7)
        result = await db.execute(
            select(KarmaScore)
            .where(and_(KarmaScore.user_id == user_id, KarmaScore.score_date >= prev_date))
            .order_by(KarmaScore.score_date)
            .limit(1)
        )
        prev = result.scalar_one_or_none()
        if not prev:
            return 50
        return min(max(round(50 + (current_eb - prev.overall_score) * 2.5), 0), 100)

    def _compare_to_previous(self, current: KarmaScore, prev: Optional[KarmaScore]) -> dict[str, Any]:
        """Compare current score to previous period."""
        if not prev:
            return {"overall_delta": 0, "dimension_deltas": {}, "is_first_report": True}
        return {
            "overall_delta": current.overall_score - prev.overall_score,
            "dimension_deltas": {
                "emotional_balance": current.emotional_balance - prev.emotional_balance,
                "spiritual_growth": current.spiritual_growth - prev.spiritual_growth,
                "consistency": current.consistency - prev.consistency,
                "self_awareness": current.self_awareness - prev.self_awareness,
                "wisdom_integration": current.wisdom_integration - prev.wisdom_integration,
            },
            "is_first_report": False,
        }

    def _is_upward(self, scores: list[int]) -> bool:
        """Check if scores show an upward trend."""
        if len(scores) < 3:
            return False
        mid = len(scores) // 2
        return sum(scores[mid:]) > sum(scores[:mid])

    def _fallback_insight(self, karma_data: dict[str, int]) -> str:
        """Generate a fallback insight when KIAAN is unavailable."""
        overall = sum(karma_data.values()) / len(karma_data) if karma_data else 50
        if overall >= 70:
            return (
                "Your karma reflects consistent spiritual effort. As BG 6.35 teaches: "
                "practice and detachment together bring the mind into harmony. "
                "You are walking this path."
            )
        elif overall >= 50:
            return (
                "Your spiritual journey is unfolding steadily. BG 2.40: "
                "'Even a little of this dharma saves one from great fear.' "
                "Each small step matters."
            )
        return (
            "Every great spiritual journey passes through valleys. "
            "Arjuna himself put down his bow before Krishna spoke. "
            "This reflection is the beginning of your rising."
        )

    # ── DATA GATHERING ────────────────────────────────────────────────────

    @staticmethod
    def _to_dt_range(start: date, end: date) -> tuple[datetime, datetime]:
        """Convert date range to datetime range for timestamp column queries."""
        return datetime.combine(start, time.min), datetime.combine(end, time.max)

    async def _aggregate_journal_metadata(
        self, db: AsyncSession, user_id: str, start: date, end: date
    ) -> dict[str, Any]:
        """Aggregate journal metadata (mood_labels, tag_labels, timestamps) — never content.

        In addition to the raw counts, this derives three "dominant" fields
        used by the Sacred Mirror prompt: dominant_mood, dominant_category,
        and dominant_time_of_day. Category and time-of-day are sourced from
        conventional ``tag_labels`` entries: categories match the fixed set
        (Gratitude/Reflection/Prayer/Dream/Shadow) and time-of-day tags are
        ``time:<band>`` (brahma / pratah / madhyanha / sandhya / ratri).
        """
        start_dt, end_dt = self._to_dt_range(start, end)
        result = await db.execute(
            select(JournalEntry).where(
                and_(
                    JournalEntry.user_id == user_id,
                    JournalEntry.created_at >= start_dt,
                    JournalEntry.created_at <= end_dt,
                    JournalEntry.deleted_at.is_(None),
                )
            )
        )
        entries = result.scalars().all()
        if not entries:
            return {
                "entry_count": 0,
                "journaling_days": 0,
                "mood_counts": {},
                "tag_frequencies": {},
                "unique_tag_count": 0,
                "top_tags": [],
                "dominant_mood": None,
                "dominant_category": None,
                "dominant_time_of_day": None,
            }

        days = {e.created_at.date() for e in entries}
        mood_counts: dict[str, int] = {}
        tag_freq: dict[str, int] = {}
        category_counts: dict[str, int] = {}
        time_counts: dict[str, int] = {}
        for e in entries:
            for m in e.mood_labels or []:
                mood_counts[m] = mood_counts.get(m, 0) + 1
            for t in e.tag_labels or []:
                if t in _CATEGORY_LABELS:
                    category_counts[t] = category_counts.get(t, 0) + 1
                    continue
                if t.startswith(_TIME_TAG_PREFIX):
                    band = t[len(_TIME_TAG_PREFIX):]
                    time_counts[band] = time_counts.get(band, 0) + 1
                    continue
                tag_freq[t] = tag_freq.get(t, 0) + 1

        def _top(counts: dict[str, int]) -> str | None:
            return max(counts, key=counts.get) if counts else None  # type: ignore[arg-type]

        top_tags_sorted = sorted(tag_freq.items(), key=lambda kv: kv[1], reverse=True)[:5]

        return {
            "entry_count": len(entries),
            "journaling_days": len(days),
            "mood_counts": mood_counts,
            "tag_frequencies": tag_freq,
            "unique_tag_count": len(tag_freq),
            "top_tags": top_tags_sorted,
            "dominant_mood": _top(mood_counts),
            "dominant_category": _top(category_counts),
            "dominant_time_of_day": _top(time_counts),
        }

    async def _get_mood_data(
        self, db: AsyncSession, user_id: str, start: date, end: date
    ) -> dict[str, Any]:
        """Extract mood distribution and daily primary moods from journal metadata."""
        start_dt, end_dt = self._to_dt_range(start, end)
        result = await db.execute(
            select(JournalEntry)
            .where(
                and_(
                    JournalEntry.user_id == user_id,
                    JournalEntry.created_at >= start_dt,
                    JournalEntry.created_at <= end_dt,
                    JournalEntry.deleted_at.is_(None),
                )
            )
            .order_by(JournalEntry.created_at)
        )
        entries = result.scalars().all()
        mood_counts: dict[str, int] = {}
        daily_moods: list[str] = []
        cur_day: date | None = None
        day_mood: str | None = None

        for e in entries:
            d = e.created_at.date()
            if d != cur_day:
                if day_mood:
                    daily_moods.append(day_mood)
                cur_day = d
                day_mood = None
            for m in e.mood_labels or []:
                mood_counts[m] = mood_counts.get(m, 0) + 1
                day_mood = m
        if day_mood:
            daily_moods.append(day_mood)

        return {"mood_counts": mood_counts, "daily_primary_moods": daily_moods}

    async def _get_emotional_logs(
        self, db: AsyncSession, user_id: str, start: date, end: date
    ) -> list[Any]:
        """Get emotional check-in logs for the period."""
        start_dt, end_dt = self._to_dt_range(start, end)
        result = await db.execute(
            select(UserEmotionalLog).where(
                and_(
                    UserEmotionalLog.user_id == user_id,
                    UserEmotionalLog.created_at >= start_dt,
                    UserEmotionalLog.created_at <= end_dt,
                )
            )
        )
        return list(result.scalars().all())

    async def _get_verse_bookmark_count(
        self, db: AsyncSession, user_id: str, start: date, end: date
    ) -> int:
        """Count verse bookmarks created during the period."""
        start_dt, end_dt = self._to_dt_range(start, end)
        result = await db.execute(
            select(UserVerseBookmark).where(
                and_(
                    UserVerseBookmark.user_id == user_id,
                    UserVerseBookmark.created_at >= start_dt,
                    UserVerseBookmark.created_at <= end_dt,
                )
            )
        )
        return len(result.scalars().all())

    async def _get_assessment_data(
        self, db: AsyncSession, user_id: str, start: date, end: date
    ) -> dict[str, int]:
        """Get assessment completion count for the period."""
        start_dt, end_dt = self._to_dt_range(start, end)
        result = await db.execute(
            select(UserAssessment).where(
                and_(
                    UserAssessment.user_id == user_id,
                    UserAssessment.created_at >= start_dt,
                    UserAssessment.created_at <= end_dt,
                )
            )
        )
        return {"completed_this_week": len(result.scalars().all())}

    async def _get_existing_report(
        self, db: AsyncSession, user_id: str, report_date: date, report_type: str
    ) -> KarmaLytixReport | None:
        """Get existing report for a specific date and type."""
        result = await db.execute(
            select(KarmaLytixReport).where(
                and_(
                    KarmaLytixReport.user_id == user_id,
                    KarmaLytixReport.report_date == report_date,
                    KarmaLytixReport.report_type == report_type,
                )
            )
        )
        return result.scalar_one_or_none()

    async def _get_latest_report(self, db: AsyncSession, user_id: str) -> KarmaLytixReport | None:
        """Get the most recent report for the user."""
        result = await db.execute(
            select(KarmaLytixReport)
            .where(KarmaLytixReport.user_id == user_id)
            .order_by(desc(KarmaLytixReport.report_date))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def _get_report_history(
        self, db: AsyncSession, user_id: str, limit: int = 8
    ) -> list[KarmaLytixReport]:
        """Get report history ordered by date descending."""
        result = await db.execute(
            select(KarmaLytixReport)
            .where(KarmaLytixReport.user_id == user_id)
            .order_by(desc(KarmaLytixReport.report_date))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def _get_score_for_period(
        self, db: AsyncSession, user_id: str, period_start: date
    ) -> KarmaScore | None:
        """Get the earliest score on or after a given date."""
        result = await db.execute(
            select(KarmaScore)
            .where(and_(KarmaScore.user_id == user_id, KarmaScore.score_date >= period_start))
            .order_by(KarmaScore.score_date)
            .limit(1)
        )
        return result.scalar_one_or_none()


karmalytix_service = KarmaLytixService()
