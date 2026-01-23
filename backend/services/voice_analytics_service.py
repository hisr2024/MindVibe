"""
KIAAN Voice Analytics Service

Provides comprehensive voice analytics tracking, aggregation, and reporting
for the KIAAN voice assistant system. Tracks conversation quality, TTS usage,
performance metrics, and user engagement patterns.

This service implements real-time analytics collection and daily aggregation
for the admin dashboard, replacing mock data with production metrics.
"""

import asyncio
import logging
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, Dict, List, Any
from collections import defaultdict

from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    VoiceConversation,
    VoiceAnalytics,
    VoiceQualityMetrics,
    VoiceWakeWordEvent,
    VoiceEnhancementSession,
    VoiceDailyCheckin,
    UserVoicePreferences,
    User,
)

logger = logging.getLogger(__name__)


class VoiceAnalyticsService:
    """Service for tracking and aggregating voice analytics data."""

    # Google Cloud TTS pricing (per 1M characters as of 2026)
    TTS_PRICING = {
        "standard": 4.00,  # Standard voices
        "wavenet": 16.00,  # WaveNet voices
        "neural2": 16.00,  # Neural2 voices
        "studio": 160.00,  # Studio voices
        "journey": 30.00,  # Journey voices
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    # =========================================================================
    # Conversation Logging
    # =========================================================================

    async def log_voice_conversation(
        self,
        user_id: str,
        session_id: str,
        user_query: str,
        kiaan_response: str,
        detected_intent: Optional[str] = None,
        detected_emotion: Optional[str] = None,
        confidence_score: float = 0.0,
        concern_category: Optional[str] = None,
        mood_at_time: Optional[str] = None,
        verse_ids: Optional[List[str]] = None,
        speech_to_text_ms: Optional[int] = None,
        ai_processing_ms: Optional[int] = None,
        text_to_speech_ms: Optional[int] = None,
        user_audio_duration_ms: Optional[int] = None,
        response_audio_duration_ms: Optional[int] = None,
        language_used: str = "en",
        voice_type_used: str = "friendly",
    ) -> VoiceConversation:
        """
        Log a voice conversation with full metrics.

        Args:
            user_id: User identifier
            session_id: Voice session identifier
            user_query: User's spoken query (transcribed)
            kiaan_response: KIAAN's response text
            detected_intent: Detected user intent
            detected_emotion: Detected emotional state
            confidence_score: AI confidence in understanding (0.0-1.0)
            concern_category: Categorized concern type
            mood_at_time: User's mood state
            verse_ids: Related Gita verse IDs
            speech_to_text_ms: STT processing time
            ai_processing_ms: AI response generation time
            text_to_speech_ms: TTS synthesis time
            user_audio_duration_ms: Duration of user's audio
            response_audio_duration_ms: Duration of response audio
            language_used: Language code
            voice_type_used: Voice persona used

        Returns:
            Created VoiceConversation record
        """
        # Calculate total latency
        total_latency_ms = None
        if all([speech_to_text_ms, ai_processing_ms, text_to_speech_ms]):
            total_latency_ms = speech_to_text_ms + ai_processing_ms + text_to_speech_ms

        conversation = VoiceConversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            user_query=user_query,
            kiaan_response=kiaan_response,
            detected_intent=detected_intent,
            detected_emotion=detected_emotion,
            confidence_score=confidence_score,
            concern_category=concern_category,
            mood_at_time=mood_at_time,
            verse_ids=verse_ids,
            speech_to_text_ms=speech_to_text_ms,
            ai_processing_ms=ai_processing_ms,
            text_to_speech_ms=text_to_speech_ms,
            total_latency_ms=total_latency_ms,
            user_audio_duration_ms=user_audio_duration_ms,
            response_audio_duration_ms=response_audio_duration_ms,
            language_used=language_used,
            voice_type_used=voice_type_used,
        )

        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)

        logger.info(
            f"Logged voice conversation {conversation.id} for user {user_id} "
            f"(latency: {total_latency_ms}ms)"
        )

        return conversation

    async def update_conversation_feedback(
        self,
        conversation_id: str,
        user_rating: Optional[int] = None,
        user_feedback: Optional[str] = None,
        was_helpful: Optional[bool] = None,
        verses_helpful: Optional[bool] = None,
    ) -> Optional[VoiceConversation]:
        """Update conversation with user feedback."""
        result = await self.db.execute(
            select(VoiceConversation).where(VoiceConversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            return None

        if user_rating is not None:
            conversation.user_rating = user_rating
        if user_feedback is not None:
            conversation.user_feedback = user_feedback
        if was_helpful is not None:
            conversation.was_helpful = was_helpful
        if verses_helpful is not None:
            conversation.verses_helpful = verses_helpful

        await self.db.commit()
        await self.db.refresh(conversation)

        logger.info(f"Updated feedback for conversation {conversation_id}")
        return conversation

    # =========================================================================
    # Quality Metrics Tracking
    # =========================================================================

    async def log_quality_metrics(
        self,
        conversation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        stt_provider: str = "web_speech_api",
        stt_confidence: Optional[float] = None,
        stt_word_count: Optional[int] = None,
        stt_language_detected: Optional[str] = None,
        tts_provider: str = "google_cloud",
        tts_voice_used: Optional[str] = None,
        tts_character_count: Optional[int] = None,
        audio_duration_ms: Optional[int] = None,
        audio_size_bytes: Optional[int] = None,
        tts_cache_hit: bool = False,
        cache_key: Optional[str] = None,
        request_time_ms: Optional[int] = None,
    ) -> VoiceQualityMetrics:
        """Log detailed quality metrics for a voice interaction."""
        metrics = VoiceQualityMetrics(
            conversation_id=conversation_id,
            user_id=user_id,
            stt_provider=stt_provider,
            stt_confidence=stt_confidence,
            stt_word_count=stt_word_count,
            stt_language_detected=stt_language_detected,
            tts_provider=tts_provider,
            tts_voice_used=tts_voice_used,
            tts_character_count=tts_character_count,
            audio_duration_ms=audio_duration_ms,
            audio_size_bytes=audio_size_bytes,
            tts_cache_hit=tts_cache_hit,
            cache_key=cache_key,
            request_time_ms=request_time_ms,
        )

        self.db.add(metrics)
        await self.db.commit()

        return metrics

    # =========================================================================
    # Wake Word Event Tracking
    # =========================================================================

    async def log_wake_word_event(
        self,
        wake_word_detected: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        detection_confidence: Optional[float] = None,
        is_valid_activation: bool = True,
        ambient_noise_level: Optional[float] = None,
        device_type: Optional[str] = None,
        browser_type: Optional[str] = None,
    ) -> VoiceWakeWordEvent:
        """Log a wake word detection event."""
        event = VoiceWakeWordEvent(
            user_id=user_id,
            session_id=session_id,
            wake_word_detected=wake_word_detected,
            detection_confidence=detection_confidence,
            is_valid_activation=is_valid_activation,
            ambient_noise_level=ambient_noise_level,
            device_type=device_type,
            browser_type=browser_type,
        )

        self.db.add(event)
        await self.db.commit()

        return event

    # =========================================================================
    # Enhancement Session Tracking
    # =========================================================================

    async def start_enhancement_session(
        self,
        user_id: str,
        session_type: str,
        enhancement_config: Dict[str, Any],
        binaural_frequency: Optional[str] = None,
        binaural_base_frequency: Optional[int] = None,
        breathing_pattern: Optional[str] = None,
        ambient_type: Optional[str] = None,
        ambient_volume: Optional[float] = None,
    ) -> VoiceEnhancementSession:
        """Start a voice enhancement session."""
        session = VoiceEnhancementSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_type=session_type,
            enhancement_config=enhancement_config,
            binaural_frequency=binaural_frequency,
            binaural_base_frequency=binaural_base_frequency,
            breathing_pattern=breathing_pattern,
            ambient_type=ambient_type,
            ambient_volume=ambient_volume,
        )

        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)

        logger.info(f"Started {session_type} enhancement session {session.id}")
        return session

    async def end_enhancement_session(
        self,
        session_id: str,
        duration_seconds: int,
        completed: bool = True,
        effectiveness_rating: Optional[int] = None,
        breath_count: Optional[int] = None,
    ) -> Optional[VoiceEnhancementSession]:
        """End a voice enhancement session with metrics."""
        result = await self.db.execute(
            select(VoiceEnhancementSession).where(
                VoiceEnhancementSession.id == session_id
            )
        )
        session = result.scalar_one_or_none()

        if not session:
            return None

        session.ended_at = datetime.utcnow()
        session.duration_seconds = duration_seconds
        session.completed = completed
        session.effectiveness_rating = effectiveness_rating
        if breath_count is not None:
            session.breath_count = breath_count

        await self.db.commit()
        await self.db.refresh(session)

        logger.info(f"Ended enhancement session {session_id} ({duration_seconds}s)")
        return session

    # =========================================================================
    # Daily Check-in Tracking
    # =========================================================================

    async def log_daily_checkin(
        self,
        user_id: str,
        is_morning: bool = True,
        mood: Optional[str] = None,
        energy_level: Optional[int] = None,
        stress_level: Optional[int] = None,
        detected_emotions: Optional[Dict[str, float]] = None,
        voice_sentiment_score: Optional[float] = None,
        affirmation_played: Optional[str] = None,
        affirmation_resonated: Optional[bool] = None,
    ) -> VoiceDailyCheckin:
        """Log or update a daily voice check-in."""
        today = date.today()

        # Try to find existing check-in for today
        result = await self.db.execute(
            select(VoiceDailyCheckin).where(
                and_(
                    VoiceDailyCheckin.user_id == user_id,
                    VoiceDailyCheckin.checkin_date == today,
                )
            )
        )
        checkin = result.scalar_one_or_none()

        if not checkin:
            checkin = VoiceDailyCheckin(
                user_id=user_id,
                checkin_date=today,
            )
            self.db.add(checkin)

        # Update based on morning/evening
        if is_morning:
            checkin.morning_mood = mood
            checkin.morning_checkin_at = datetime.utcnow()
        else:
            checkin.evening_mood = mood
            checkin.evening_checkin_at = datetime.utcnow()

        # Update common fields
        if energy_level is not None:
            checkin.energy_level = energy_level
        if stress_level is not None:
            checkin.stress_level = stress_level
        if detected_emotions is not None:
            checkin.detected_emotions = detected_emotions
        if voice_sentiment_score is not None:
            checkin.voice_sentiment_score = voice_sentiment_score
        if affirmation_played is not None:
            checkin.affirmation_played = affirmation_played
        if affirmation_resonated is not None:
            checkin.affirmation_resonated = affirmation_resonated

        await self.db.commit()
        await self.db.refresh(checkin)

        return checkin

    # =========================================================================
    # Daily Analytics Aggregation
    # =========================================================================

    async def aggregate_daily_analytics(
        self, target_date: Optional[date] = None
    ) -> VoiceAnalytics:
        """
        Aggregate voice analytics for a given day.

        This should be run via a scheduled job (e.g., cron) daily.
        """
        if target_date is None:
            target_date = date.today() - timedelta(days=1)  # Yesterday

        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())

        logger.info(f"Aggregating voice analytics for {target_date}")

        # Get all conversations for the day
        conversations_result = await self.db.execute(
            select(VoiceConversation).where(
                and_(
                    VoiceConversation.created_at >= start_datetime,
                    VoiceConversation.created_at <= end_datetime,
                    VoiceConversation.deleted_at.is_(None),
                )
            )
        )
        conversations = conversations_result.scalars().all()

        # Basic counts
        total_queries = len(conversations)
        unique_users = len(set(c.user_id for c in conversations))
        unique_sessions = len(set(c.session_id for c in conversations))

        # Performance metrics
        latencies = [c.total_latency_ms for c in conversations if c.total_latency_ms]
        stt_times = [c.speech_to_text_ms for c in conversations if c.speech_to_text_ms]
        ai_times = [c.ai_processing_ms for c in conversations if c.ai_processing_ms]
        tts_times = [c.text_to_speech_ms for c in conversations if c.text_to_speech_ms]

        avg_latency = int(sum(latencies) / len(latencies)) if latencies else None
        avg_stt = int(sum(stt_times) / len(stt_times)) if stt_times else None
        avg_ai = int(sum(ai_times) / len(ai_times)) if ai_times else None
        avg_tts = int(sum(tts_times) / len(tts_times)) if tts_times else None

        # Percentile latencies
        p95_latency = None
        p99_latency = None
        if latencies:
            sorted_latencies = sorted(latencies)
            p95_idx = int(len(sorted_latencies) * 0.95)
            p99_idx = int(len(sorted_latencies) * 0.99)
            p95_latency = sorted_latencies[min(p95_idx, len(sorted_latencies) - 1)]
            p99_latency = sorted_latencies[min(p99_idx, len(sorted_latencies) - 1)]

        # Quality metrics
        confidence_scores = [
            float(c.confidence_score) for c in conversations if c.confidence_score
        ]
        avg_confidence = (
            sum(confidence_scores) / len(confidence_scores)
            if confidence_scores
            else None
        )

        ratings = [c.user_rating for c in conversations if c.user_rating]
        avg_rating = sum(ratings) / len(ratings) if ratings else None

        positive_count = sum(1 for c in conversations if c.was_helpful is True)
        negative_count = sum(1 for c in conversations if c.was_helpful is False)

        # Distribution data
        language_dist: Dict[str, int] = defaultdict(int)
        voice_type_dist: Dict[str, int] = defaultdict(int)
        concern_dist: Dict[str, int] = defaultdict(int)
        emotion_dist: Dict[str, int] = defaultdict(int)

        for conv in conversations:
            language_dist[conv.language_used] += 1
            if conv.voice_type_used:
                voice_type_dist[conv.voice_type_used] += 1
            if conv.concern_category:
                concern_dist[conv.concern_category] += 1
            if conv.detected_emotion:
                emotion_dist[conv.detected_emotion] += 1

        # Get quality metrics for TTS calculations
        quality_metrics_result = await self.db.execute(
            select(VoiceQualityMetrics).where(
                and_(
                    VoiceQualityMetrics.created_at >= start_datetime,
                    VoiceQualityMetrics.created_at <= end_datetime,
                )
            )
        )
        quality_metrics = quality_metrics_result.scalars().all()

        # TTS usage
        total_chars = sum(
            m.tts_character_count for m in quality_metrics if m.tts_character_count
        )
        total_audio_ms = sum(
            m.audio_duration_ms for m in quality_metrics if m.audio_duration_ms
        )
        total_audio_minutes = total_audio_ms / 60000.0 if total_audio_ms else 0

        cache_hits = sum(1 for m in quality_metrics if m.tts_cache_hit)
        cache_hit_rate = (
            cache_hits / len(quality_metrics) if quality_metrics else 0
        )

        # Estimate TTS cost (using studio voice pricing as average)
        estimated_cost = (total_chars / 1_000_000) * self.TTS_PRICING["studio"]

        # Wake word stats
        wake_events_result = await self.db.execute(
            select(VoiceWakeWordEvent).where(
                and_(
                    VoiceWakeWordEvent.created_at >= start_datetime,
                    VoiceWakeWordEvent.created_at <= end_datetime,
                )
            )
        )
        wake_events = wake_events_result.scalars().all()

        wake_activations = len(wake_events)
        false_positives = sum(1 for e in wake_events if not e.is_valid_activation)

        # Enhancement session stats
        enhancement_result = await self.db.execute(
            select(VoiceEnhancementSession).where(
                and_(
                    VoiceEnhancementSession.started_at >= start_datetime,
                    VoiceEnhancementSession.started_at <= end_datetime,
                    VoiceEnhancementSession.deleted_at.is_(None),
                )
            )
        )
        enhancements = enhancement_result.scalars().all()

        binaural_count = sum(1 for e in enhancements if e.session_type == "binaural")
        spatial_count = sum(1 for e in enhancements if e.session_type == "spatial")
        breathing_count = sum(1 for e in enhancements if e.session_type == "breathing")

        # Error tracking (conversations without response or with fallback)
        error_count = sum(1 for c in conversations if not c.kiaan_response)
        fallback_count = sum(
            1 for c in conversations
            if c.kiaan_response and "try asking that again" in c.kiaan_response.lower()
        )

        # Create or update analytics record
        existing_result = await self.db.execute(
            select(VoiceAnalytics).where(VoiceAnalytics.analytics_date == target_date)
        )
        analytics = existing_result.scalar_one_or_none()

        if not analytics:
            analytics = VoiceAnalytics(analytics_date=target_date)
            self.db.add(analytics)

        # Update all fields
        analytics.total_voice_sessions = unique_sessions
        analytics.total_voice_queries = total_queries
        analytics.unique_voice_users = unique_users
        analytics.avg_speech_to_text_ms = avg_stt
        analytics.avg_ai_processing_ms = avg_ai
        analytics.avg_text_to_speech_ms = avg_tts
        analytics.avg_total_latency_ms = avg_latency
        analytics.p95_latency_ms = p95_latency
        analytics.p99_latency_ms = p99_latency
        analytics.avg_confidence_score = avg_confidence
        analytics.avg_user_rating = avg_rating
        analytics.positive_feedback_count = positive_count
        analytics.negative_feedback_count = negative_count
        analytics.language_distribution = dict(language_dist)
        analytics.voice_type_distribution = dict(voice_type_dist)
        analytics.concern_distribution = dict(concern_dist)
        analytics.emotion_distribution = dict(emotion_dist)
        analytics.error_count = error_count
        analytics.fallback_response_count = fallback_count
        analytics.tts_characters_synthesized = total_chars
        analytics.tts_audio_minutes_generated = total_audio_minutes
        analytics.tts_cache_hit_rate = cache_hit_rate
        analytics.estimated_tts_cost_usd = estimated_cost
        analytics.binaural_beats_sessions = binaural_count
        analytics.spatial_audio_sessions = spatial_count
        analytics.breathing_sync_sessions = breathing_count
        analytics.wake_word_activations = wake_activations
        analytics.wake_word_false_positives = false_positives
        analytics.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(analytics)

        logger.info(
            f"Aggregated analytics for {target_date}: "
            f"{total_queries} queries, {unique_users} users, "
            f"{avg_latency}ms avg latency"
        )

        return analytics

    # =========================================================================
    # Analytics Queries (for Dashboard)
    # =========================================================================

    async def get_voice_overview(
        self, days: int = 30
    ) -> Dict[str, Any]:
        """Get voice analytics overview for dashboard."""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        result = await self.db.execute(
            select(VoiceAnalytics).where(
                and_(
                    VoiceAnalytics.analytics_date >= start_date,
                    VoiceAnalytics.analytics_date <= end_date,
                )
            ).order_by(VoiceAnalytics.analytics_date.desc())
        )
        analytics = result.scalars().all()

        if not analytics:
            return {
                "total_queries": 0,
                "total_users": 0,
                "avg_latency_ms": 0,
                "avg_rating": 0,
                "cache_hit_rate": 0,
                "estimated_cost_usd": 0,
            }

        # Aggregate across all days
        total_queries = sum(a.total_voice_queries for a in analytics)
        total_users = sum(a.unique_voice_users for a in analytics)

        latencies = [a.avg_total_latency_ms for a in analytics if a.avg_total_latency_ms]
        avg_latency = int(sum(latencies) / len(latencies)) if latencies else 0

        ratings = [float(a.avg_user_rating) for a in analytics if a.avg_user_rating]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0

        cache_rates = [
            float(a.tts_cache_hit_rate) for a in analytics if a.tts_cache_hit_rate
        ]
        cache_hit_rate = sum(cache_rates) / len(cache_rates) if cache_rates else 0

        total_cost = sum(
            float(a.estimated_tts_cost_usd) for a in analytics if a.estimated_tts_cost_usd
        )

        # Today's stats
        today_analytics = next(
            (a for a in analytics if a.analytics_date == end_date), None
        )

        return {
            "total_queries": total_queries,
            "total_users": total_users,
            "avg_latency_ms": avg_latency,
            "avg_rating": round(avg_rating, 2),
            "cache_hit_rate": round(cache_hit_rate * 100, 1),
            "estimated_cost_usd": round(total_cost, 2),
            "today": {
                "queries": today_analytics.total_voice_queries if today_analytics else 0,
                "users": today_analytics.unique_voice_users if today_analytics else 0,
            },
            "trend_data": [
                {
                    "date": str(a.analytics_date),
                    "queries": a.total_voice_queries,
                    "users": a.unique_voice_users,
                    "latency": a.avg_total_latency_ms,
                }
                for a in reversed(analytics)
            ],
        }

    async def get_voice_trends(
        self, days: int = 30
    ) -> Dict[str, Any]:
        """Get detailed voice analytics trends."""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        result = await self.db.execute(
            select(VoiceAnalytics).where(
                and_(
                    VoiceAnalytics.analytics_date >= start_date,
                    VoiceAnalytics.analytics_date <= end_date,
                )
            ).order_by(VoiceAnalytics.analytics_date.asc())
        )
        analytics = result.scalars().all()

        # Aggregate distributions
        language_totals: Dict[str, int] = defaultdict(int)
        voice_type_totals: Dict[str, int] = defaultdict(int)
        concern_totals: Dict[str, int] = defaultdict(int)
        emotion_totals: Dict[str, int] = defaultdict(int)

        for a in analytics:
            if a.language_distribution:
                for lang, count in a.language_distribution.items():
                    language_totals[lang] += count
            if a.voice_type_distribution:
                for vt, count in a.voice_type_distribution.items():
                    voice_type_totals[vt] += count
            if a.concern_distribution:
                for concern, count in a.concern_distribution.items():
                    concern_totals[concern] += count
            if a.emotion_distribution:
                for emotion, count in a.emotion_distribution.items():
                    emotion_totals[emotion] += count

        return {
            "daily_stats": [
                {
                    "date": str(a.analytics_date),
                    "queries": a.total_voice_queries,
                    "users": a.unique_voice_users,
                    "sessions": a.total_voice_sessions,
                    "avg_latency_ms": a.avg_total_latency_ms,
                    "avg_rating": float(a.avg_user_rating) if a.avg_user_rating else None,
                    "error_count": a.error_count,
                }
                for a in analytics
            ],
            "language_distribution": dict(language_totals),
            "voice_type_distribution": dict(voice_type_totals),
            "concern_distribution": dict(concern_totals),
            "emotion_distribution": dict(emotion_totals),
            "enhancement_usage": {
                "binaural": sum(a.binaural_beats_sessions for a in analytics),
                "spatial": sum(a.spatial_audio_sessions for a in analytics),
                "breathing": sum(a.breathing_sync_sessions for a in analytics),
            },
            "tts_metrics": {
                "total_characters": sum(a.tts_characters_synthesized or 0 for a in analytics),
                "total_audio_minutes": sum(
                    float(a.tts_audio_minutes_generated or 0) for a in analytics
                ),
                "avg_cache_hit_rate": sum(
                    float(a.tts_cache_hit_rate or 0) for a in analytics
                ) / len(analytics) if analytics else 0,
                "total_cost_usd": sum(
                    float(a.estimated_tts_cost_usd or 0) for a in analytics
                ),
            },
        }

    async def get_conversation_history(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a user."""
        result = await self.db.execute(
            select(VoiceConversation)
            .where(
                and_(
                    VoiceConversation.user_id == user_id,
                    VoiceConversation.deleted_at.is_(None),
                )
            )
            .order_by(VoiceConversation.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        conversations = result.scalars().all()

        return [
            {
                "id": c.id,
                "query": c.user_query,
                "response": c.kiaan_response,
                "intent": c.detected_intent,
                "emotion": c.detected_emotion,
                "concern": c.concern_category,
                "verses": c.verse_ids,
                "language": c.language_used,
                "latency_ms": c.total_latency_ms,
                "rating": c.user_rating,
                "helpful": c.was_helpful,
                "created_at": c.created_at.isoformat(),
            }
            for c in conversations
        ]


# Singleton accessor
_voice_analytics_service: Optional[VoiceAnalyticsService] = None


def get_voice_analytics_service(db: AsyncSession) -> VoiceAnalyticsService:
    """Get or create VoiceAnalyticsService instance."""
    return VoiceAnalyticsService(db)
