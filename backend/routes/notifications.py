"""Notification routes: push subscription management, notification inbox, preferences.

Endpoints:
- POST /subscribe    — Register a push subscription (FCM/Web Push)
- DELETE /subscribe  — Unregister a push subscription
- GET /inbox         — Get user's notifications (paginated)
- POST /{id}/read    — Mark notification as read
- GET /preferences   — Get notification preferences
- PUT /preferences   — Update notification preferences
"""

import logging
from datetime import UTC, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_id, get_db
from backend.middleware.rate_limiter import limiter
from backend.models.notification import (
    Notification,
    NotificationPreference,
    NotificationStatus,
    PushSubscription,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PushSubscriptionIn(BaseModel):
    """Web Push subscription payload from the browser."""

    endpoint: str = Field(..., max_length=2048)
    keys: dict | None = None
    device_name: str | None = Field(None, max_length=128)


class PushSubscriptionOut(BaseModel):
    status: str
    subscription_id: str


class NotificationItem(BaseModel):
    id: str
    title: str
    body: str
    icon: str | None = None
    action_url: str | None = None
    status: str
    created_at: datetime
    read_at: datetime | None = None


class NotificationInboxOut(BaseModel):
    items: list[NotificationItem]
    total: int
    unread_count: int


class PreferencesIn(BaseModel):
    push_enabled: bool | None = None
    email_enabled: bool | None = None
    daily_checkin_reminder: bool | None = None
    journey_step_reminder: bool | None = None
    streak_encouragement: bool | None = None
    weekly_reflection: bool | None = None
    community_activity: bool | None = None
    quiet_hours_start: int | None = None
    quiet_hours_end: int | None = None


class PreferencesOut(BaseModel):
    push_enabled: bool
    email_enabled: bool
    daily_checkin_reminder: bool
    journey_step_reminder: bool
    streak_encouragement: bool
    weekly_reflection: bool
    community_activity: bool
    quiet_hours_start: int | None
    quiet_hours_end: int | None


# ---------------------------------------------------------------------------
# POST /subscribe — register push subscription
# ---------------------------------------------------------------------------

@router.post("/subscribe", response_model=PushSubscriptionOut, status_code=201)
@limiter.limit("10/minute")
async def subscribe_push(
    request: Request,
    payload: PushSubscriptionIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PushSubscriptionOut:
    """Register a push notification subscription for the current user.

    If the endpoint already exists for this user, reactivates it
    instead of creating a duplicate.
    """
    # Check for existing subscription with same endpoint
    stmt = select(PushSubscription).where(
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint == payload.endpoint,
    )
    existing = (await db.execute(stmt)).scalars().first()

    if existing:
        existing.is_active = True
        existing.keys = payload.keys
        existing.last_used_at = datetime.now(UTC)
        existing.user_agent = request.headers.get("User-Agent")
        await db.commit()
        logger.info("Push subscription reactivated: %s for user %s", existing.id, user_id)
        return PushSubscriptionOut(status="reactivated", subscription_id=existing.id)

    sub = PushSubscription(
        user_id=user_id,
        endpoint=payload.endpoint,
        keys=payload.keys,
        device_name=payload.device_name,
        user_agent=request.headers.get("User-Agent"),
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    logger.info("Push subscription created: %s for user %s", sub.id, user_id)
    return PushSubscriptionOut(status="subscribed", subscription_id=sub.id)


# ---------------------------------------------------------------------------
# DELETE /subscribe — unregister push subscription
# ---------------------------------------------------------------------------

@router.delete("/subscribe")
@limiter.limit("10/minute")
async def unsubscribe_push(
    request: Request,
    endpoint: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Deactivate a push subscription by endpoint URL."""
    await db.execute(
        update(PushSubscription)
        .where(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint == endpoint,
        )
        .values(is_active=False)
    )
    await db.commit()
    return {"status": "unsubscribed"}


# ---------------------------------------------------------------------------
# GET /inbox — notification inbox
# ---------------------------------------------------------------------------

@router.get("/inbox", response_model=NotificationInboxOut)
async def get_inbox(
    request: Request,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> NotificationInboxOut:
    """Get the user's notification inbox (most recent first)."""
    limit = min(limit, 100)

    base_filter = [
        Notification.user_id == user_id,
        Notification.deleted_at.is_(None),
    ]

    # Total count
    total = (await db.execute(
        select(func.count(Notification.id)).where(*base_filter)
    )).scalar() or 0

    # Unread count
    unread = (await db.execute(
        select(func.count(Notification.id)).where(
            *base_filter,
            Notification.read_at.is_(None),
        )
    )).scalar() or 0

    # Fetch page
    stmt = (
        select(Notification)
        .where(*base_filter)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()

    items = [
        NotificationItem(
            id=n.id,
            title=n.title,
            body=n.body,
            icon=n.icon,
            action_url=n.action_url,
            status=n.status,
            created_at=n.created_at,
            read_at=n.read_at,
        )
        for n in rows
    ]

    return NotificationInboxOut(items=items, total=total, unread_count=unread)


# ---------------------------------------------------------------------------
# POST /{id}/read — mark notification as read
# ---------------------------------------------------------------------------

@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Mark a notification as read."""
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    )
    notif = (await db.execute(stmt)).scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notif.read_at is None:
        notif.read_at = datetime.now(UTC)
        notif.status = NotificationStatus.READ.value
        await db.commit()

    return {"status": "read", "id": notification_id}


# ---------------------------------------------------------------------------
# GET /preferences — notification preferences
# ---------------------------------------------------------------------------

@router.get("/preferences", response_model=PreferencesOut)
async def get_preferences(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PreferencesOut:
    """Get the user's notification preferences."""
    stmt = select(NotificationPreference).where(
        NotificationPreference.user_id == user_id
    )
    pref = (await db.execute(stmt)).scalars().first()

    if not pref:
        # Return defaults
        return PreferencesOut(
            push_enabled=True,
            email_enabled=True,
            daily_checkin_reminder=True,
            journey_step_reminder=True,
            streak_encouragement=True,
            weekly_reflection=True,
            community_activity=False,
            quiet_hours_start=None,
            quiet_hours_end=None,
        )

    return PreferencesOut(
        push_enabled=pref.push_enabled,
        email_enabled=pref.email_enabled,
        daily_checkin_reminder=pref.daily_checkin_reminder,
        journey_step_reminder=pref.journey_step_reminder,
        streak_encouragement=pref.streak_encouragement,
        weekly_reflection=pref.weekly_reflection,
        community_activity=pref.community_activity,
        quiet_hours_start=pref.quiet_hours_start,
        quiet_hours_end=pref.quiet_hours_end,
    )


# ---------------------------------------------------------------------------
# PUT /preferences — update notification preferences
# ---------------------------------------------------------------------------

@router.put("/preferences", response_model=PreferencesOut)
async def update_preferences(
    request: Request,
    payload: PreferencesIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PreferencesOut:
    """Update the user's notification preferences."""
    stmt = select(NotificationPreference).where(
        NotificationPreference.user_id == user_id
    )
    pref = (await db.execute(stmt)).scalars().first()

    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.add(pref)

    # Only update fields that were explicitly provided
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pref, key, value)

    pref.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(pref)

    return PreferencesOut(
        push_enabled=pref.push_enabled,
        email_enabled=pref.email_enabled,
        daily_checkin_reminder=pref.daily_checkin_reminder,
        journey_step_reminder=pref.journey_step_reminder,
        streak_encouragement=pref.streak_encouragement,
        weekly_reflection=pref.weekly_reflection,
        community_activity=pref.community_activity,
        quiet_hours_start=pref.quiet_hours_start,
        quiet_hours_end=pref.quiet_hours_end,
    )
