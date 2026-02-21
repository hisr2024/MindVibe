"""Error tracking and monitoring for MindVibe API."""

import os
import logging
from functools import wraps

logger = logging.getLogger(__name__)

# Optional Sentry integration
SENTRY_DSN = os.getenv("SENTRY_DSN")

if SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            traces_sample_rate=0.1,
            environment=os.getenv("ENVIRONMENT", "production")
        )
        logger.info("Sentry error tracking initialized")
    except ImportError:
        logger.warning("Sentry SDK not installed, error tracking disabled")


def track_errors(func):
    """Decorator to track errors in endpoints."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}", exc_info=True)
            if SENTRY_DSN:
                try:
                    import sentry_sdk
                    sentry_sdk.capture_exception(e)
                except ImportError:
                    logger.debug("Optional monitoring dependency not available", exc_info=True)
            raise
    return wrapper
