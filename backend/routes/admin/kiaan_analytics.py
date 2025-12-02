"""Admin KIAAN analytics routes (read-only).

This module provides read-only access to KIAAN usage analytics for admins.
KIAAN protection is enforced - admins cannot:
- Modify KIAAN chatbot logic
- Alter wisdom database
- Access encrypted conversations
- Change response algorithms
- Bypass quota limits

Admins CAN:
- View usage analytics (read-only)
- Monitor question counts
- See topic trends (aggregated)
- Export anonymized data
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.middleware.rbac import (
    get_current_admin,
    AdminContext,
    PermissionChecker,
)
from backend.models import (
    AdminPermission,
    KiaanUsageAnalytics,
    UsageTracking,
)


router = APIRouter(prefix="/api/admin/kiaan", tags=["admin-kiaan-analytics"])


# =============================================================================
# Schemas
# =============================================================================

class KiaanDailyStats(BaseModel):
    """Daily KIAAN usage statistics."""
    date: datetime
    total_questions: int
    unique_users: int
    avg_response_time_ms: Optional[int]
    satisfaction_avg: Optional[float]


class KiaanOverviewOut(BaseModel):
    """KIAAN analytics overview."""
    total_questions_today: int
    total_questions_week: int
    total_questions_month: int
    unique_users_today: int
    unique_users_week: int
    unique_users_month: int
    avg_response_time_ms: Optional[int]
    avg_satisfaction: Optional[float]


class KiaanTrendsOut(BaseModel):
    """KIAAN usage trends."""
    daily_stats: list[KiaanDailyStats]
    topic_distribution: dict[str, int]
    questions_by_tier: dict[str, int]


class KiaanQuotaUsageOut(BaseModel):
    """KIAAN quota usage statistics."""
    total_users_with_quota: int
    users_at_quota_limit: int
    avg_usage_percentage: float
    usage_by_tier: dict[str, dict]


# =============================================================================
# Routes
# =============================================================================

@router.get("/overview", response_model=KiaanOverviewOut)
async def get_kiaan_overview(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get KIAAN analytics overview.
    
    Permissions required: kiaan:analytics_view
    
    Note: This is READ-ONLY access to aggregated analytics.
    No conversation content or personal data is exposed.
    """
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # Today's stats
    today_stmt = select(KiaanUsageAnalytics).where(
        KiaanUsageAnalytics.date >= today_start
    ).order_by(KiaanUsageAnalytics.date.desc()).limit(1)
    today_result = await db.execute(today_stmt)
    today_stats = today_result.scalars().first()
    
    # Week's stats (sum)
    week_stmt = select(
        func.sum(KiaanUsageAnalytics.total_questions).label("questions"),
        func.sum(KiaanUsageAnalytics.unique_users).label("users"),
    ).where(KiaanUsageAnalytics.date >= week_start)
    week_result = await db.execute(week_stmt)
    week_stats = week_result.first()
    
    # Month's stats (sum)
    month_stmt = select(
        func.sum(KiaanUsageAnalytics.total_questions).label("questions"),
        func.sum(KiaanUsageAnalytics.unique_users).label("users"),
    ).where(KiaanUsageAnalytics.date >= month_start)
    month_result = await db.execute(month_stmt)
    month_stats = month_result.first()
    
    # Average response time (last 7 days)
    avg_response_stmt = select(
        func.avg(KiaanUsageAnalytics.avg_response_time_ms)
    ).where(
        KiaanUsageAnalytics.date >= week_start,
        KiaanUsageAnalytics.avg_response_time_ms.isnot(None),
    )
    avg_response_result = await db.execute(avg_response_stmt)
    avg_response = avg_response_result.scalar()
    
    # Average satisfaction (last 7 days)
    avg_sat_stmt = select(
        func.avg(KiaanUsageAnalytics.satisfaction_avg)
    ).where(
        KiaanUsageAnalytics.date >= week_start,
        KiaanUsageAnalytics.satisfaction_avg.isnot(None),
    )
    avg_sat_result = await db.execute(avg_sat_stmt)
    avg_satisfaction = avg_sat_result.scalar()
    
    return KiaanOverviewOut(
        total_questions_today=today_stats.total_questions if today_stats else 0,
        total_questions_week=week_stats.questions if week_stats and week_stats.questions else 0,
        total_questions_month=month_stats.questions if month_stats and month_stats.questions else 0,
        unique_users_today=today_stats.unique_users if today_stats else 0,
        unique_users_week=week_stats.users if week_stats and week_stats.users else 0,
        unique_users_month=month_stats.users if month_stats and month_stats.users else 0,
        avg_response_time_ms=int(avg_response) if avg_response else None,
        avg_satisfaction=round(float(avg_satisfaction), 2) if avg_satisfaction else None,
    )


@router.get("/trends", response_model=KiaanTrendsOut)
async def get_kiaan_trends(
    request: Request,
    days: int = Query(30, ge=1, le=365),
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get KIAAN usage trends.
    
    Permissions required: kiaan:analytics_view
    
    Note: Topic distribution is aggregated and anonymized.
    No individual user data is exposed.
    """
    start_date = datetime.now() - timedelta(days=days)
    
    # Daily stats
    daily_stmt = (
        select(KiaanUsageAnalytics)
        .where(KiaanUsageAnalytics.date >= start_date)
        .order_by(KiaanUsageAnalytics.date.asc())
    )
    daily_result = await db.execute(daily_stmt)
    daily_entries = daily_result.scalars().all()
    
    daily_stats = [
        KiaanDailyStats(
            date=entry.date,
            total_questions=entry.total_questions,
            unique_users=entry.unique_users,
            avg_response_time_ms=entry.avg_response_time_ms,
            satisfaction_avg=float(entry.satisfaction_avg) if entry.satisfaction_avg else None,
        )
        for entry in daily_entries
    ]
    
    # Aggregate topic distribution
    topic_distribution: dict[str, int] = {}
    questions_by_tier: dict[str, int] = {}
    
    for entry in daily_entries:
        if entry.topic_distribution:
            for topic, count in entry.topic_distribution.items():
                topic_distribution[topic] = topic_distribution.get(topic, 0) + count
        
        if entry.questions_by_tier:
            for tier, count in entry.questions_by_tier.items():
                questions_by_tier[tier] = questions_by_tier.get(tier, 0) + count
    
    return KiaanTrendsOut(
        daily_stats=daily_stats,
        topic_distribution=topic_distribution,
        questions_by_tier=questions_by_tier,
    )


@router.get("/quota-usage", response_model=KiaanQuotaUsageOut)
async def get_kiaan_quota_usage(
    request: Request,
    admin: AdminContext = Depends(get_current_admin),
    _: None = Depends(PermissionChecker(AdminPermission.KIAAN_ANALYTICS_VIEW)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get KIAAN quota usage statistics.
    
    Permissions required: kiaan:analytics_view
    
    Note: This shows aggregated quota usage, not individual user data.
    Admins CANNOT bypass or modify quota limits through this endpoint.
    """
    # Get current period's usage tracking for KIAAN
    now = datetime.now()
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total users with quota
    total_stmt = select(func.count(UsageTracking.id)).where(
        UsageTracking.feature == "kiaan_questions",
        UsageTracking.period_start >= period_start,
    )
    total_result = await db.execute(total_stmt)
    total_users_with_quota = total_result.scalar() or 0
    
    # Users at quota limit
    at_limit_stmt = select(func.count(UsageTracking.id)).where(
        UsageTracking.feature == "kiaan_questions",
        UsageTracking.period_start >= period_start,
        UsageTracking.usage_count >= UsageTracking.usage_limit,
    )
    at_limit_result = await db.execute(at_limit_stmt)
    users_at_quota_limit = at_limit_result.scalar() or 0
    
    # Average usage percentage
    avg_usage_stmt = select(
        func.avg(UsageTracking.usage_count * 100.0 / UsageTracking.usage_limit)
    ).where(
        UsageTracking.feature == "kiaan_questions",
        UsageTracking.period_start >= period_start,
        UsageTracking.usage_limit > 0,
    )
    avg_usage_result = await db.execute(avg_usage_stmt)
    avg_usage = avg_usage_result.scalar()
    
    # Usage by tier (simplified - group by limit as proxy for tier)
    usage_by_tier: dict[str, dict] = {}
    tier_limits = {10: "free", 50: "basic", 200: "premium", 1000: "enterprise"}
    
    for limit, tier_name in tier_limits.items():
        tier_stmt = select(
            func.count(UsageTracking.id).label("users"),
            func.sum(UsageTracking.usage_count).label("total_used"),
        ).where(
            UsageTracking.feature == "kiaan_questions",
            UsageTracking.period_start >= period_start,
            UsageTracking.usage_limit == limit,
        )
        tier_result = await db.execute(tier_stmt)
        tier_data = tier_result.first()
        
        usage_by_tier[tier_name] = {
            "users": tier_data.users if tier_data and tier_data.users else 0,
            "total_questions": tier_data.total_used if tier_data and tier_data.total_used else 0,
            "limit_per_user": limit,
        }
    
    return KiaanQuotaUsageOut(
        total_users_with_quota=total_users_with_quota,
        users_at_quota_limit=users_at_quota_limit,
        avg_usage_percentage=round(float(avg_usage), 2) if avg_usage else 0.0,
        usage_by_tier=usage_by_tier,
    )
