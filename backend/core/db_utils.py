"""
Database utility functions for resilient database operations.

Provides retry logic for transient database failures such as:
- Connection pool exhaustion
- Deadlocks
- Network timeouts
"""

import asyncio
import logging
from functools import wraps
from typing import Any, Callable, TypeVar

from sqlalchemy.exc import (
    DBAPIError,
    InterfaceError,
    OperationalError,
    TimeoutError as SATimeoutError,
)

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Exceptions that are considered transient and can be retried
TRANSIENT_EXCEPTIONS = (
    OperationalError,
    InterfaceError,
    SATimeoutError,
    DBAPIError,
    ConnectionError,
    TimeoutError,
)


async def with_db_retry(
    operation: Callable[[], Any],
    max_retries: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 5.0,
    operation_name: str = "database operation",
) -> Any:
    """
    Execute a database operation with exponential backoff retry.

    Args:
        operation: Async callable to execute
        max_retries: Maximum number of retry attempts (default: 3)
        base_delay: Initial delay in seconds (default: 0.5)
        max_delay: Maximum delay between retries (default: 5.0)
        operation_name: Name for logging purposes

    Returns:
        Result of the operation

    Raises:
        The last exception if all retries fail

    Example:
        result = await with_db_retry(
            lambda: db.commit(),
            operation_name="commit transaction"
        )
    """
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return await operation()
        except TRANSIENT_EXCEPTIONS as e:
            last_exception = e
            if attempt < max_retries:
                delay = min(base_delay * (2 ** attempt), max_delay)
                logger.warning(
                    f"Transient DB error in {operation_name} (attempt {attempt + 1}/{max_retries + 1}): {e}. "
                    f"Retrying in {delay:.1f}s..."
                )
                await asyncio.sleep(delay)
            else:
                logger.error(
                    f"All {max_retries + 1} attempts failed for {operation_name}: {e}"
                )

    if last_exception:
        raise last_exception


def db_retry(
    max_retries: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 5.0,
):
    """
    Decorator for adding retry logic to async database operations.

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay between retries

    Example:
        @db_retry(max_retries=3)
        async def save_user_progress(db, user_id, progress):
            user = await db.get(User, user_id)
            user.progress = progress
            await db.commit()
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await with_db_retry(
                lambda: func(*args, **kwargs),
                max_retries=max_retries,
                base_delay=base_delay,
                max_delay=max_delay,
                operation_name=func.__name__,
            )
        return wrapper
    return decorator


async def safe_commit(db, operation_name: str = "commit") -> None:
    """
    Safely commit with retry logic.

    Args:
        db: AsyncSession instance
        operation_name: Name for logging

    Example:
        await safe_commit(db, "save journey progress")
    """
    await with_db_retry(
        db.commit,
        operation_name=operation_name,
    )


async def safe_refresh(db, instance, operation_name: str = "refresh") -> None:
    """
    Safely refresh an instance with retry logic.

    Args:
        db: AsyncSession instance
        instance: SQLAlchemy model instance to refresh
        operation_name: Name for logging

    Example:
        await safe_refresh(db, user_journey, "refresh journey state")
    """
    await with_db_retry(
        lambda: db.refresh(instance),
        operation_name=operation_name,
    )
