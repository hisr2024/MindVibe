"""Error tracking and monitoring for MindVibe API.

Initializes Sentry when SENTRY_DSN is set, with FastAPI integration
for automatic request/response context. Filters sensitive spiritual
wellness data (journal entries, chat messages) before transmission.
"""

import os
import logging
from functools import wraps
from typing import Any, Callable, TypeVar, cast

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])

# Optional Sentry integration
SENTRY_DSN = os.getenv("SENTRY_DSN")
_sentry_available = False

if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        def _before_send(event: dict, hint: dict) -> dict | None:
            """Strip sensitive user data before sending to Sentry."""
            # Remove request body fields that may contain user content
            request_data = event.get("request", {}).get("data")
            if isinstance(request_data, dict):
                for key in ("encrypted_data", "content", "message",
                            "reflection", "journal", "password", "note"):
                    request_data.pop(key, None)

            # Remove authorization and cookie headers
            request_headers = event.get("request", {}).get("headers", {})
            for header in ("authorization", "cookie", "x-csrf-token"):
                request_headers.pop(header, None)

            return event

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.05")),
            environment=os.getenv("ENVIRONMENT", "production"),
            release=os.getenv("APP_VERSION", "unknown"),
            before_send=_before_send,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            # Never send PII automatically
            send_default_pii=False,
        )
        _sentry_available = True
        logger.info("Sentry error tracking initialized")
    except ImportError:
        logger.warning("Sentry SDK not installed, error tracking disabled")


def trigger_test_error() -> dict:
    """Send a test event to Sentry to verify the integration is working."""
    if not _sentry_available:
        return {"success": False, "message": "Sentry is not configured (SENTRY_DSN not set)"}

    import sentry_sdk
    event_id = sentry_sdk.capture_message("MindVibe backend Sentry test")
    logger.info(f"Sentry test event sent: {event_id}")
    return {
        "success": True,
        "message": "Test event sent to Sentry. Check your Sentry dashboard.",
        "event_id": str(event_id),
    }


def track_errors(func: F) -> F:
    """Decorator to track errors in endpoints with Sentry context."""
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}", exc_info=True)
            if _sentry_available:
                import sentry_sdk
                sentry_sdk.capture_exception(e)
            raise
    return cast(F, wrapper)
