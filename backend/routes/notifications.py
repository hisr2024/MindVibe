"""Notification routes: push subscription management, notification inbox, preferences.

Endpoints:
- GET  /vapid-key    — Get the VAPID public key for Web Push
- POST /subscribe    — Register a push subscription (FCM/Web Push)
- POST /unsubscribe  — Unregister a push subscription (matches frontend)
- DELETE /subscribe  — Unregister a push subscription (by query param)
- GET  /inbox        — Get user's notifications (paginated)
- POST /{id}/read    — Mark notification as read
- GET  /preferences  — Get notification preferences
- PUT  /preferences  — Update notification preferences
"""

import os
import logging
from datetime import UTC, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user, get_db
from backend.middleware.rate_limiter import limiter
from backend.models.notification import (
    Notification,
    NotificationPreference,
    NotificationStatus,
    PushSubscription,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# VAPID public key for Web Push (set via environment variable)
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PushSubscriptionIn(BaseModel):
    """Web Push subscription payload from the browser.

    Accepts both direct format and wrapped format from the frontend:
    - Direct: { endpoint, keys, device_name }
    - Wrapped: { subscription: { endpoint, keys } }
    """

    endpoint: str = Field(default="", max_length=2048)
    keys: dict | None = None
    device_name: str | None = Field(None, max_length=128)
    # Frontend sends { subscription: { endpoint, keys, ... } }
    subscription: dict | None = None


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
# GET /vapid-key — VAPID public key for Web Push
# ---------------------------------------------------------------------------

@router.get("/vapid-key")
async def get_vapid_key(request: Request):
    """Return the VAPID public key so the browser can subscribe to Web Push.

    If VAPID_PUBLIC_KEY is not configured, returns 404 to signal the frontend
    to fall back to local-only notifications.
    """
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VAPID key not configured. Push notifications are not available.",
        )
    return {"public_key": VAPID_PUBLIC_KEY}


# ---------------------------------------------------------------------------
# POST /subscribe — register push subscription
# ---------------------------------------------------------------------------

@router.post("/subscribe", response_model=PushSubscriptionOut, status_code=201)
@limiter.limit("10/minute")
async def subscribe_push(
    request: Request,
    payload: PushSubscriptionIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> PushSubscriptionOut:
    """Register a push notification subscription for the current user.

    Accepts both direct and wrapped formats:
    - Direct: { endpoint: "...", keys: {...} }
    - Wrapped: { subscription: { endpoint: "...", keys: {...} } }

    If the endpoint already exists for this user, reactivates it
    instead of creating a duplicate.
    """
    # Handle wrapped subscription format from frontend
    endpoint = payload.endpoint
    keys = payload.keys
    if payload.subscription and not endpoint:
        endpoint = payload.subscription.get("endpoint", "")
        keys = payload.subscription.get("keys", keys)

    if not endpoint:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Push subscription endpoint is required",
        )

    # Check for existing subscription with same endpoint
    stmt = select(PushSubscription).where(
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint == endpoint,
    )
    existing = (await db.execute(stmt)).scalars().first()

    if existing:
        existing.is_active = True
        existing.keys = keys
        existing.last_used_at = datetime.now(UTC)
        existing.user_agent = request.headers.get("User-Agent")
        await db.commit()
        logger.info("Push subscription reactivated: %s for user %s", existing.id, user_id)
        return PushSubscriptionOut(status="reactivated", subscription_id=existing.id)

    sub = PushSubscription(
        user_id=user_id,
        endpoint=endpoint,
        keys=keys,
        device_name=payload.device_name,
        user_agent=request.headers.get("User-Agent"),
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    logger.info("Push subscription created: %s for user %s", sub.id, user_id)
    return PushSubscriptionOut(status="subscribed", subscription_id=sub.id)


# ---------------------------------------------------------------------------
# POST /unsubscribe — unregister push subscription (frontend format)
# ---------------------------------------------------------------------------

class UnsubscribeIn(BaseModel):
    """Unsubscribe request from the frontend."""
    endpoint: str = Field(..., max_length=2048)


@router.post("/unsubscribe")
@limiter.limit("10/minute")
async def unsubscribe_push_post(
    request: Request,
    payload: UnsubscribeIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Deactivate a push subscription by endpoint URL (POST body).

    This endpoint matches the frontend pushService.ts which sends:
    POST /api/notifications/unsubscribe { endpoint: "..." }
    """
    await db.execute(
        update(PushSubscription)
        .where(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint == payload.endpoint,
        )
        .values(is_active=False)
    )
    await db.commit()
    return {"status": "unsubscribed"}


# ---------------------------------------------------------------------------
# DELETE /subscribe — unregister push subscription (query param)
# ---------------------------------------------------------------------------

@router.delete("/subscribe")
@limiter.limit("10/minute")
async def unsubscribe_push(
    request: Request,
    endpoint: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Deactivate a push subscription by endpoint URL (query parameter)."""
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
    user_id: str = Depends(get_current_user),
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
    user_id: str = Depends(get_current_user),
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
    user_id: str = Depends(get_current_user),
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
    user_id: str = Depends(get_current_user),
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
