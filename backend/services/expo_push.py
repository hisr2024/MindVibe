"""Expo Push Notification Service — sends push notifications via Expo Push API.

Supports the Kiaanverse mobile app by sending server-triggered notifications
(Sakha insights, milestones, streak reminders) through Expo's push service.

Expo Push API docs: https://docs.expo.dev/push-notifications/sending-notifications/

Features:
- Chunked sending (max 100 messages per request)
- Expo push token format validation (ExponentPushToken[xxx])
- Error handling with DeviceNotRegistered detection
- Async HTTP via httpx
- Receipt fetching for delivery confirmation

Usage:
    from backend.services.expo_push import send_expo_push

    tickets = await send_expo_push(
        tokens=["ExponentPushToken[abc123]"],
        title="Journey Complete!",
        body="You've finished your journey.",
        data={"type": "milestone", "journeyId": "j-123"},
        channel_id="milestones",
    )
"""

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts"
MAX_CHUNK_SIZE = 100
REQUEST_TIMEOUT = 30.0


def _is_valid_expo_token(token: str) -> bool:
    """Check if a string is a valid Expo push token format."""
    return token.startswith("ExponentPushToken[") and token.endswith("]")


async def send_expo_push(
    tokens: list[str],
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
    channel_id: str | None = None,
    category_id: str | None = None,
    priority: str = "default",
    sound: str = "default",
) -> list[dict[str, Any]]:
    """Send push notifications via the Expo Push API.

    Args:
        tokens: List of Expo push tokens (ExponentPushToken[xxx] format).
        title: Notification title.
        body: Notification body text.
        data: Custom data payload (delivered to the app).
        channel_id: Android notification channel ID.
        category_id: iOS notification category ID.
        priority: Push priority ("default", "normal", "high").
        sound: Sound to play ("default" or null).

    Returns:
        List of ticket responses from the Expo Push API.
        Each ticket has a structure like:
        - {"status": "ok", "id": "ticket-xxx"} on success
        - {"status": "error", "message": "...", "details": {...}} on failure

    Note:
        Tokens that fail with "DeviceNotRegistered" should be deactivated
        in the database. The caller is responsible for this cleanup.
    """
    # Filter to valid Expo push tokens only
    valid_tokens = [t for t in tokens if _is_valid_expo_token(t)]
    if not valid_tokens:
        logger.debug("No valid Expo push tokens to send to")
        return []

    # Build message payloads
    messages: list[dict[str, Any]] = []
    for token in valid_tokens:
        msg: dict[str, Any] = {
            "to": token,
            "title": title,
            "body": body,
            "sound": sound,
            "priority": priority,
        }
        if data:
            msg["data"] = data
        if channel_id:
            msg["channelId"] = channel_id
        if category_id:
            msg["categoryId"] = category_id
        messages.append(msg)

    # Send in chunks of MAX_CHUNK_SIZE
    all_tickets: list[dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        for i in range(0, len(messages), MAX_CHUNK_SIZE):
            chunk = messages[i : i + MAX_CHUNK_SIZE]
            try:
                response = await client.post(
                    EXPO_PUSH_URL,
                    json=chunk,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Accept-Encoding": "gzip, deflate",
                    },
                )
                response.raise_for_status()
                result = response.json()
                tickets = result.get("data", [])
                all_tickets.extend(tickets)

                # Log any individual ticket errors
                for j, ticket in enumerate(tickets):
                    if ticket.get("status") == "error":
                        details = ticket.get("details", {})
                        error_type = details.get("error", "unknown")
                        logger.warning(
                            "Expo push ticket error for token %s: %s - %s",
                            chunk[j].get("to", "unknown"),
                            error_type,
                            ticket.get("message", ""),
                        )

            except httpx.HTTPStatusError as e:
                logger.error(
                    "Expo Push API HTTP error: %s %s",
                    e.response.status_code,
                    e.response.text[:200],
                )
            except httpx.HTTPError as e:
                logger.error("Expo Push API request failed: %s", e)

    logger.info(
        "Sent %d push notifications, got %d tickets",
        len(messages),
        len(all_tickets),
    )
    return all_tickets


async def get_push_receipts(ticket_ids: list[str]) -> dict[str, Any]:
    """Fetch delivery receipts for previously sent push notifications.

    Call this after a delay (e.g., 15 minutes) to check delivery status.

    Args:
        ticket_ids: List of ticket IDs from send_expo_push() responses.

    Returns:
        Dict mapping ticket_id to receipt data:
        - {"status": "ok"} — delivered successfully
        - {"status": "error", "message": "...", "details": {...}} — failed
    """
    if not ticket_ids:
        return {}

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                EXPO_RECEIPTS_URL,
                json={"ids": ticket_ids},
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            result = response.json()
            return result.get("data", {})
    except httpx.HTTPError as e:
        logger.error("Failed to fetch push receipts: %s", e)
        return {}


def extract_invalid_tokens(tickets: list[dict[str, Any]], tokens: list[str]) -> list[str]:
    """Extract tokens that should be deactivated based on ticket errors.

    Returns a list of tokens where the device is no longer registered.
    These tokens should have their PushSubscription.is_active set to False.
    """
    invalid: list[str] = []
    valid_tokens = [t for t in tokens if _is_valid_expo_token(t)]

    for i, ticket in enumerate(tickets):
        if i >= len(valid_tokens):
            break
        if ticket.get("status") == "error":
            details = ticket.get("details", {})
            if details.get("error") == "DeviceNotRegistered":
                invalid.append(valid_tokens[i])

    return invalid
