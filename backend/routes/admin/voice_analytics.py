"""Admin Voice Analytics Routes

Provides comprehensive voice analytics dashboard for admins.
Real data from voice_analytics table replaces mock data.

Permissions: kiaan:analytics_view (read-only)
"""

from datetime import datetime, timedelta, date
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.middleware.rbac import (
    get_current_admin,
    AdminContext,
    PermissionChecker,
)
from backend.models import (
    AdminPermission,
    VoiceAnalytics,
    VoiceConversation,
    VoiceEnhancementSession,
    VoiceQualityMetrics,
    UserVoicePreferences,
)

router = APIRouter(prefix="/api/admin/voice", tags=["admin-voice-analytics"])


# =============================================================================
# Schemas
# =============================================================================

class VoiceDailyStats(BaseModel):
    """Daily voice usage statistics."""
    date: str
    total_queries: int
    unique_users: int
    avg_latency_ms: Optional[int]
    avg_rating: Optional[float]
    error_count: int


class VoiceOverviewOut(BaseModel):
    """Voice analytics overview."""
    total_queries_today: int
    total_queries_week: int
    total_queries_month: int
    unique_users_today: int
    unique_users_week: int
    unique_users_month: int
    avg_latency_ms: Optional[int]
    p95_latency_ms: Optional[int]
    avg_rating: Optional[float]
    cache_hit_rate: float
    estimated_cost_usd: float


class VoiceTrendsOut(BaseModel):
    """Voice usage trends."""
    daily_stats: List[VoiceDailyStats]
    language_distribution: dict
    voice_type_distribution: dict
    concern_distribution: dict
    emotion_distribution: dict
    enhancement_usage: dict


class VoiceQualityOut(BaseModel):
    """Voice quality metrics."""
    avg_stt_confidence: Optional[float]
    avg_tts_latency_ms: Optional[int]
    total_characters_synthesized: int
    total_audio_minutes: float
    cache_hit_rate: float
    error_rate: float


class VoiceEnhancementStats(BaseModel):
    """Enhancement session statistics."""
    total_sessions: int
    binaural_sessions: int
    spatial_sessions: int
    breathing_sessions: int
    avg_duration_seconds: Optional[int]
    avg_effectiveness_rating: Optional[float]
    completion_rate: float


# =============================================================================
# Routes
# =============================================================================

@router.get("/overview", response_model=VoiceOverviewOut)
async def get_voice_overview(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get voice analytics overview.

    Permissions required: kiaan:analytics_view
    """
    now = datetime.now()
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Today's stats
    today_stmt = select(VoiceAnalytics).where(
        VoiceAnalytics.analytics_date == today
    )
    today_result = await db.execute(today_stmt)
    today_stats = today_result.scalar_one_or_none()

    # Week's stats (sum)
    week_stmt = select(
        func.sum(VoiceAnalytics.total_voice_queries).label("queries"),
        func.sum(VoiceAnalytics.unique_voice_users).label("users"),
    ).where(VoiceAnalytics.analytics_date >= week_ago)
    week_result = await db.execute(week_stmt)
    week_stats = week_result.first()

    # Month's stats (sum)
    month_stmt = select(
        func.sum(VoiceAnalytics.total_voice_queries).label("queries"),
        func.sum(VoiceAnalytics.unique_voice_users).label("users"),
        func.avg(VoiceAnalytics.avg_total_latency_ms).label("avg_latency"),
        func.avg(VoiceAnalytics.p95_latency_ms).label("p95_latency"),
        func.avg(VoiceAnalytics.avg_user_rating).label("avg_rating"),
        func.avg(VoiceAnalytics.tts_cache_hit_rate).label("cache_rate"),
        func.sum(VoiceAnalytics.estimated_tts_cost_usd).label("total_cost"),
    ).where(VoiceAnalytics.analytics_date >= month_ago)
    month_result = await db.execute(month_stmt)
    month_stats = month_result.first()

    return VoiceOverviewOut(
        total_queries_today=today_stats.total_voice_queries if today_stats else 0,
        total_queries_week=int(week_stats.queries) if week_stats and week_stats.queries else 0,
        total_queries_month=int(month_stats.queries) if month_stats and month_stats.queries else 0,
        unique_users_today=today_stats.unique_voice_users if today_stats else 0,
        unique_users_week=int(week_stats.users) if week_stats and week_stats.users else 0,
        unique_users_month=int(month_stats.users) if month_stats and month_stats.users else 0,
        avg_latency_ms=int(month_stats.avg_latency) if month_stats and month_stats.avg_latency else None,
        p95_latency_ms=int(month_stats.p95_latency) if month_stats and month_stats.p95_latency else None,
        avg_rating=round(float(month_stats.avg_rating), 2) if month_stats and month_stats.avg_rating else None,
        cache_hit_rate=round(float(month_stats.cache_rate) * 100, 1) if month_stats and month_stats.cache_rate else 0.0,
        estimated_cost_usd=round(float(month_stats.total_cost), 2) if month_stats and month_stats.total_cost else 0.0,
    )


@router.get("/trends", response_model=VoiceTrendsOut)
async def get_voice_trends(
    request: Request,
    days: int = Query(30, ge=1, le=365),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get voice usage trends.

    Permissions required: kiaan:analytics_view
    """
    start_date = date.today() - timedelta(days=days)

    # Daily stats
    daily_stmt = (
        select(VoiceAnalytics)
        .where(VoiceAnalytics.analytics_date >= start_date)
        .order_by(VoiceAnalytics.analytics_date.asc())
    )
    daily_result = await db.execute(daily_stmt)
    daily_entries = daily_result.scalars().all()

    daily_stats = [
        VoiceDailyStats(
            date=str(entry.analytics_date),
            total_queries=entry.total_voice_queries,
            unique_users=entry.unique_voice_users,
            avg_latency_ms=entry.avg_total_latency_ms,
            avg_rating=float(entry.avg_user_rating) if entry.avg_user_rating else None,
            error_count=entry.error_count or 0,
        )
        for entry in daily_entries
    ]

    # Aggregate distributions
    language_dist = {}
    voice_type_dist = {}
    concern_dist = {}
    emotion_dist = {}

    for entry in daily_entries:
        if entry.language_distribution:
            for lang, count in entry.language_distribution.items():
                language_dist[lang] = language_dist.get(lang, 0) + count
        if entry.voice_type_distribution:
            for vt, count in entry.voice_type_distribution.items():
                voice_type_dist[vt] = voice_type_dist.get(vt, 0) + count
        if entry.concern_distribution:
            for concern, count in entry.concern_distribution.items():
                concern_dist[concern] = concern_dist.get(concern, 0) + count
        if entry.emotion_distribution:
            for emotion, count in entry.emotion_distribution.items():
                emotion_dist[emotion] = emotion_dist.get(emotion, 0) + count

    # Enhancement usage
    enhancement_usage = {
        "binaural": sum(e.binaural_beats_sessions or 0 for e in daily_entries),
        "spatial": sum(e.spatial_audio_sessions or 0 for e in daily_entries),
        "breathing": sum(e.breathing_sync_sessions or 0 for e in daily_entries),
    }

    return VoiceTrendsOut(
        daily_stats=daily_stats,
        language_distribution=language_dist,
        voice_type_distribution=voice_type_dist,
        concern_distribution=concern_dist,
        emotion_distribution=emotion_dist,
        enhancement_usage=enhancement_usage,
    )


@router.get("/quality", response_model=VoiceQualityOut)
async def get_voice_quality(
    request: Request,
    days: int = Query(30, ge=1, le=365),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get voice quality metrics.

    Permissions required: kiaan:analytics_view
    """
    start_date = date.today() - timedelta(days=days)

    # Get aggregated metrics from analytics table
    metrics_stmt = select(
        func.avg(VoiceAnalytics.avg_confidence_score).label("avg_confidence"),
        func.avg(VoiceAnalytics.avg_text_to_speech_ms).label("avg_tts"),
        func.sum(VoiceAnalytics.tts_characters_synthesized).label("total_chars"),
        func.sum(VoiceAnalytics.tts_audio_minutes_generated).label("total_minutes"),
        func.avg(VoiceAnalytics.tts_cache_hit_rate).label("cache_rate"),
        func.sum(VoiceAnalytics.error_count).label("errors"),
        func.sum(VoiceAnalytics.total_voice_queries).label("total_queries"),
    ).where(VoiceAnalytics.analytics_date >= start_date)

    result = await db.execute(metrics_stmt)
    metrics = result.first()

    error_rate = 0.0
    if metrics and metrics.total_queries and metrics.total_queries > 0:
        error_rate = (metrics.errors or 0) / metrics.total_queries * 100

    return VoiceQualityOut(
        avg_stt_confidence=round(float(metrics.avg_confidence), 3) if metrics and metrics.avg_confidence else None,
        avg_tts_latency_ms=int(metrics.avg_tts) if metrics and metrics.avg_tts else None,
        total_characters_synthesized=int(metrics.total_chars) if metrics and metrics.total_chars else 0,
        total_audio_minutes=round(float(metrics.total_minutes), 2) if metrics and metrics.total_minutes else 0.0,
        cache_hit_rate=round(float(metrics.cache_rate) * 100, 1) if metrics and metrics.cache_rate else 0.0,
        error_rate=round(error_rate, 2),
    )


@router.get("/enhancements", response_model=VoiceEnhancementStats)
async def get_enhancement_stats(
    request: Request,
    days: int = Query(30, ge=1, le=365),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get voice enhancement session statistics.

    Permissions required: kiaan:analytics_view
    """
    start_datetime = datetime.combine(date.today() - timedelta(days=days), datetime.min.time())

    # Get all enhancement sessions in period
    sessions_stmt = select(VoiceEnhancementSession).where(
        and_(
            VoiceEnhancementSession.started_at >= start_datetime,
            VoiceEnhancementSession.deleted_at.is_(None),
        )
    )
    result = await db.execute(sessions_stmt)
    sessions = result.scalars().all()

    total = len(sessions)
    binaural = sum(1 for s in sessions if s.session_type == "binaural")
    spatial = sum(1 for s in sessions if s.session_type == "spatial")
    breathing = sum(1 for s in sessions if s.session_type == "breathing")

    durations = [s.duration_seconds for s in sessions if s.duration_seconds]
    avg_duration = int(sum(durations) / len(durations)) if durations else None

    ratings = [s.effectiveness_rating for s in sessions if s.effectiveness_rating]
    avg_rating = sum(ratings) / len(ratings) if ratings else None

    completed = sum(1 for s in sessions if s.completed)
    completion_rate = (completed / total * 100) if total > 0 else 0.0

    return VoiceEnhancementStats(
        total_sessions=total,
        binaural_sessions=binaural,
        spatial_sessions=spatial,
        breathing_sessions=breathing,
        avg_duration_seconds=avg_duration,
        avg_effectiveness_rating=round(avg_rating, 2) if avg_rating else None,
        completion_rate=round(completion_rate, 1),
    )


@router.get("/user-preferences-summary")
async def get_user_preferences_summary(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated summary of user voice preferences.

    Permissions required: kiaan:analytics_view
    """
    # Language preferences distribution
    lang_stmt = select(
        UserVoicePreferences.preferred_language,
        func.count().label("count")
    ).group_by(UserVoicePreferences.preferred_language)
    lang_result = await db.execute(lang_stmt)
    language_prefs = {row.preferred_language: row.count for row in lang_result}

    # Voice type preferences
    voice_type_stmt = select(
        UserVoicePreferences.preferred_voice_type,
        func.count().label("count")
    ).group_by(UserVoicePreferences.preferred_voice_type)
    voice_result = await db.execute(voice_type_stmt)
    voice_type_prefs = {row.preferred_voice_type: row.count for row in voice_result}

    # Voice gender preferences
    gender_stmt = select(
        UserVoicePreferences.preferred_voice_gender,
        func.count().label("count")
    ).group_by(UserVoicePreferences.preferred_voice_gender)
    gender_result = await db.execute(gender_stmt)
    gender_prefs = {row.preferred_voice_gender: row.count for row in gender_result}

    # Enhancement features adoption
    enhancement_stmt = select(
        func.sum(func.cast(UserVoicePreferences.binaural_beats_enabled, Integer)).label("binaural"),
        func.sum(func.cast(UserVoicePreferences.spatial_audio_enabled, Integer)).label("spatial"),
        func.sum(func.cast(UserVoicePreferences.breathing_sync_enabled, Integer)).label("breathing"),
        func.sum(func.cast(UserVoicePreferences.ambient_sounds_enabled, Integer)).label("ambient"),
        func.sum(func.cast(UserVoicePreferences.wake_word_enabled, Integer)).label("wake_word"),
        func.sum(func.cast(UserVoicePreferences.offline_enabled, Integer)).label("offline"),
        func.count().label("total_users"),
    )

    enhancement_result = await db.execute(enhancement_stmt)
    enhancements = enhancement_result.first()

    total = enhancements.total_users if enhancements else 1

    return {
        "language_preferences": language_prefs,
        "voice_type_preferences": voice_type_prefs,
        "voice_gender_preferences": gender_prefs,
        "feature_adoption": {
            "binaural_beats": round((enhancements.binaural or 0) / total * 100, 1) if enhancements else 0,
            "spatial_audio": round((enhancements.spatial or 0) / total * 100, 1) if enhancements else 0,
            "breathing_sync": round((enhancements.breathing or 0) / total * 100, 1) if enhancements else 0,
            "ambient_sounds": round((enhancements.ambient or 0) / total * 100, 1) if enhancements else 0,
            "wake_word": round((enhancements.wake_word or 0) / total * 100, 1) if enhancements else 0,
            "offline_mode": round((enhancements.offline or 0) / total * 100, 1) if enhancements else 0,
        },
        "total_users_with_preferences": total,
    }


@router.post("/aggregate-daily")
async def trigger_daily_aggregation(
    request: Request,
    target_date: Optional[str] = None,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger daily analytics aggregation.

    Useful for backfilling or reprocessing data.

    Permissions required: kiaan:analytics_view
    """
    from backend.services.voice_analytics_service import get_voice_analytics_service
    from datetime import datetime

    analytics_service = get_voice_analytics_service(db)

    if target_date:
        target = datetime.strptime(target_date, "%Y-%m-%d").date()
    else:
        target = date.today() - timedelta(days=1)

    result = await analytics_service.aggregate_daily_analytics(target)

    return {
        "status": "success",
        "date": str(result.analytics_date),
        "total_queries": result.total_voice_queries,
        "unique_users": result.unique_voice_users,
    }
