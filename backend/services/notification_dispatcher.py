"""Notification Dispatcher — preference-aware push notification delivery.

Provides a single entry point for sending notifications to users.
Checks user preferences and quiet hours before dispatching.
Creates a Notification record in the database for inbox tracking.
Handles token cleanup for invalid devices.

Usage:
    from backend.services.notification_dispatcher import dispatch_notification

    await dispatch_notification(
        db=db_session,
        user_id="user-123",
        notification_type="milestone",
        title="Journey Complete!",
        body="You've completed Transform Anger.",
        data={"type": "milestone", "journeyId": "j-456"},
    )

Notification types and their backend preference mapping:
    - "daily_verse"       → daily_checkin_reminder
    - "journey_reminder"  → journey_step_reminder
    - "streak"            → streak_encouragement
    - "sakha"             → (always send — no per-category opt-out yet)
    - "milestone"         → (always send — no per-category opt-out yet)
"""

import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.notification import (
    Notification,
    NotificationPreference,
    NotificationStatus,
    PushSubscription,
)
from backend.services.expo_push import extract_invalid_tokens, send_expo_push

logger = logging.getLogger(__name__)

# Maps notification_type → NotificationPreference field name
PREFERENCE_MAP: dict[str, str] = {
    "daily_verse": "daily_checkin_reminder",
    "journey_reminder": "journey_step_reminder",
    "streak": "streak_encouragement",
    "weekly_reflection": "weekly_reflection",
}

# Maps notification_type → Android channel ID
CHANNEL_MAP: dict[str, str] = {
    "daily_verse": "daily-verse",
    "journey_reminder": "journey-reminders",
    "streak": "streak-alerts",
    "sakha": "sakha-insights",
    "milestone": "milestones",
}

# Maps notification_type → iOS category ID
CATEGORY_MAP: dict[str, str] = {
    "daily_verse": "daily-verse",
    "journey_reminder": "journey-reminder",
    "streak": "streak-alert",
}


def _is_in_quiet_hours(
    quiet_start: int | None, quiet_end: int | None
) -> bool:
    """Check if the current UTC hour falls within the user's quiet hours.

    Quiet hours are stored as UTC integers (0-23).
    Handles ranges that cross midnight (e.g., 22 → 6).
    """
    if quiet_start is None or quiet_end is None:
        return False

    current_hour = datetime.now(UTC).hour

    if quiet_start <= quiet_end:
        # Simple range (e.g., 22-23 or 8-17)
        return quiet_start <= current_hour < quiet_end
    else:
        # Range crosses midnight (e.g., 22-6)
        return current_hour >= quiet_start or current_hour < quiet_end


async def dispatch_notification(
    db: AsyncSession,
    user_id: str,
    notification_type: str,
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
) -> None:
    """Send a push notification to a user, respecting their preferences.

    Performs the following steps:
    1. Fetch user's notification preferences
    2. Check if the notification type is enabled
    3. Check if current time is within quiet hours
    4. Create a Notification record in the database (for inbox)
    5. Fetch active Expo push tokens for the user
    6. Send via Expo Push API
    7. Update notification status and clean up invalid tokens

    Args:
        db: Async database session.
        user_id: Target user's ID.
        notification_type: One of: daily_verse, journey_reminder, streak, sakha, milestone.
        title: Notification title.
        body: Notification body text.
        data: Custom data payload for deep linking.

    Raises:
        No exceptions — all errors are logged and silently handled.
        Push notification delivery is best-effort.
    """
    try:
        # Step 1: Check user preferences
        pref_result = await db.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == user_id
            )
        )
        pref = pref_result.scalars().first()

        # Step 2: Check if notification type is enabled
        if pref:
            # Check global push toggle
            if not pref.push_enabled:
                logger.debug(
                    "Push disabled for user %s — skipping %s",
                    user_id,
                    notification_type,
                )
                return

            # Check per-category toggle
            pref_field = PREFERENCE_MAP.get(notification_type)
            if pref_field and not getattr(pref, pref_field, True):
                logger.debug(
                    "Notification type %s disabled for user %s",
                    notification_type,
                    user_id,
                )
                return

            # Step 3: Check quiet hours
            if _is_in_quiet_hours(pref.quiet_hours_start, pref.quiet_hours_end):
                logger.debug(
                    "User %s is in quiet hours — skipping %s",
                    user_id,
                    notification_type,
                )
                return

        # Step 4: Create notification record for inbox
        notification = Notification(
            user_id=user_id,
            title=title,
            body=body,
            action_url=data.get("type", "") if data else "",
            channel="push",
            status=NotificationStatus.PENDING.value,
            scheduled_at=datetime.now(UTC),
        )
        db.add(notification)
        await db.flush()  # Get notification ID without committing

        # Step 5: Fetch active Expo push tokens
        token_result = await db.execute(
            select(PushSubscription.endpoint).where(
                PushSubscription.user_id == user_id,
                PushSubscription.is_active.is_(True),
                PushSubscription.endpoint.startswith("ExponentPushToken["),
            )
        )
        tokens = [row[0] for row in token_result.all()]

        if not tokens:
            logger.debug(
                "No active Expo push tokens for user %s — notification saved to inbox only",
                user_id,
            )
            notification.status = NotificationStatus.SENT.value
            notification.sent_at = datetime.now(UTC)
            await db.commit()
            return

        # Step 6: Send via Expo Push API
        channel_id = CHANNEL_MAP.get(notification_type)
        category_id = CATEGORY_MAP.get(notification_type)

        tickets = await send_expo_push(
            tokens=tokens,
            title=title,
            body=body,
            data=data,
            channel_id=channel_id,
            category_id=category_id,
            priority="high" if notification_type in ("streak", "milestone") else "default",
        )

        # Step 7: Update notification status
        has_success = any(t.get("status") == "ok" for t in tickets)
        if has_success:
            notification.status = NotificationStatus.SENT.value
            notification.sent_at = datetime.now(UTC)
        else:
            notification.status = NotificationStatus.FAILED.value
            notification.failed_at = datetime.now(UTC)
            notification.failure_reason = "All push tickets failed"

        # Clean up invalid tokens
        invalid_tokens = extract_invalid_tokens(tickets, tokens)
        if invalid_tokens:
            await db.execute(
                update(PushSubscription)
                .where(
                    PushSubscription.user_id == user_id,
                    PushSubscription.endpoint.in_(invalid_tokens),
                )
                .values(is_active=False)
            )
            logger.info(
                "Deactivated %d invalid push tokens for user %s",
                len(invalid_tokens),
                user_id,
            )

        await db.commit()

        logger.info(
            "Dispatched %s notification to user %s (%d tokens, %d tickets)",
            notification_type,
            user_id,
            len(tokens),
            len(tickets),
        )

    except Exception:
        logger.exception(
            "Failed to dispatch %s notification to user %s",
            notification_type,
            user_id,
        )
        # Don't re-raise — notification delivery is best-effort
