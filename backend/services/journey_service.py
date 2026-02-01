"""
Journey Service - Business logic for Personal Journeys CRUD operations.

Provides methods for creating, reading, updating, and deleting personal journeys
with proper validation, authorization, and error handling.
"""

from __future__ import annotations

import datetime
import logging
import uuid
from typing import Any, Literal

from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import PersonalJourney, PersonalJourneyStatus

logger = logging.getLogger(__name__)

# Type aliases
SortField = Literal["created_at", "updated_at", "title"]
SortOrder = Literal["asc", "desc"]


class JourneyServiceError(Exception):
    """Base exception for journey service errors."""

    def __init__(self, message: str, code: str = "JOURNEY_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class JourneyNotFoundError(JourneyServiceError):
    """Raised when a journey is not found."""

    def __init__(self, journey_id: str):
        super().__init__(
            f"Journey not found: {journey_id}",
            "JOURNEY_NOT_FOUND",
            404
        )


class JourneyValidationError(JourneyServiceError):
    """Raised when journey data fails validation."""

    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR", 400)


class JourneyAuthorizationError(JourneyServiceError):
    """Raised when user is not authorized to access a journey."""

    def __init__(self):
        super().__init__(
            "You are not authorized to access this journey",
            "UNAUTHORIZED",
            403
        )


class JourneyService:
    """
    Service class for managing personal journeys.

    Provides CRUD operations with:
    - Input validation
    - Authorization checks
    - Proper error handling
    - Query optimization
    """

    # Valid status values
    VALID_STATUSES = {"draft", "active", "completed", "archived"}

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_journeys(
        self,
        user_id: str,
        *,
        status: str | None = None,
        search: str | None = None,
        sort_by: SortField = "updated_at",
        sort_order: SortOrder = "desc",
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        """
        List journeys for a user with filtering and pagination.

        Args:
            user_id: The owner's user ID
            status: Optional status filter
            search: Optional search term for title
            sort_by: Field to sort by
            sort_order: Sort direction
            limit: Maximum results to return
            offset: Number of results to skip

        Returns:
            Dict with 'items' (list of journeys) and 'total' (count)
        """
        # Build base query
        query = select(PersonalJourney).where(
            PersonalJourney.owner_id == user_id,
            PersonalJourney.deleted_at.is_(None)
        )

        # Apply status filter
        if status:
            if status not in self.VALID_STATUSES:
                raise JourneyValidationError(f"Invalid status: {status}")
            query = query.where(PersonalJourney.status == status)

        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.where(PersonalJourney.title.ilike(search_term))

        # Get total count before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        # Apply sorting
        sort_column = getattr(PersonalJourney, sort_by, PersonalJourney.updated_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column).nulls_last())
        else:
            query = query.order_by(asc(sort_column).nulls_last())

        # Apply pagination
        query = query.limit(min(limit, 100)).offset(offset)

        # Execute query
        result = await self.session.execute(query)
        journeys = result.scalars().all()

        return {
            "items": [self._journey_to_dict(j) for j in journeys],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    async def get_journey(self, journey_id: str, user_id: str) -> dict[str, Any]:
        """
        Get a single journey by ID.

        Args:
            journey_id: The journey ID
            user_id: The requesting user's ID (for authorization)

        Returns:
            Journey data as dict

        Raises:
            JourneyNotFoundError: If journey doesn't exist
            JourneyAuthorizationError: If user doesn't own the journey
        """
        journey = await self._get_journey_or_404(journey_id)
        self._check_ownership(journey, user_id)
        return self._journey_to_dict(journey)

    async def create_journey(
        self,
        user_id: str,
        *,
        title: str,
        description: str | None = None,
        status: str = "draft",
        cover_image_url: str | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Create a new journey.

        Args:
            user_id: The owner's user ID
            title: Journey title (required)
            description: Optional description
            status: Initial status (default: draft)
            cover_image_url: Optional cover image URL
            tags: Optional list of tags

        Returns:
            Created journey data as dict

        Raises:
            JourneyValidationError: If data is invalid
        """
        # Validate title
        title = title.strip()
        if not title:
            raise JourneyValidationError("Title is required")
        if len(title) > 255:
            raise JourneyValidationError("Title must be 255 characters or less")

        # Validate status
        if status not in self.VALID_STATUSES:
            raise JourneyValidationError(f"Invalid status: {status}")

        # Validate description length
        if description and len(description) > 5000:
            raise JourneyValidationError("Description must be 5000 characters or less")

        # Validate cover image URL
        if cover_image_url and len(cover_image_url) > 512:
            raise JourneyValidationError("Cover image URL must be 512 characters or less")

        # Validate tags
        if tags:
            if len(tags) > 10:
                raise JourneyValidationError("Maximum 10 tags allowed")
            tags = [t.strip()[:50] for t in tags if t.strip()]

        # Create journey
        journey = PersonalJourney(
            id=str(uuid.uuid4()),
            owner_id=user_id,
            title=title,
            description=description,
            status=PersonalJourneyStatus(status),
            cover_image_url=cover_image_url,
            tags=tags or [],
            created_at=datetime.datetime.now(datetime.UTC),
        )

        self.session.add(journey)
        await self.session.commit()
        await self.session.refresh(journey)

        logger.info(f"Created journey {journey.id} for user {user_id}")
        return self._journey_to_dict(journey)

    async def update_journey(
        self,
        journey_id: str,
        user_id: str,
        *,
        title: str | None = None,
        description: str | None = None,
        status: str | None = None,
        cover_image_url: str | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Update an existing journey.

        Args:
            journey_id: The journey ID
            user_id: The requesting user's ID
            title: New title (optional)
            description: New description (optional)
            status: New status (optional)
            cover_image_url: New cover image URL (optional)
            tags: New tags (optional)

        Returns:
            Updated journey data as dict

        Raises:
            JourneyNotFoundError: If journey doesn't exist
            JourneyAuthorizationError: If user doesn't own the journey
            JourneyValidationError: If data is invalid
        """
        journey = await self._get_journey_or_404(journey_id)
        self._check_ownership(journey, user_id)

        # Update title
        if title is not None:
            title = title.strip()
            if not title:
                raise JourneyValidationError("Title cannot be empty")
            if len(title) > 255:
                raise JourneyValidationError("Title must be 255 characters or less")
            journey.title = title

        # Update description
        if description is not None:
            if len(description) > 5000:
                raise JourneyValidationError("Description must be 5000 characters or less")
            journey.description = description

        # Update status
        if status is not None:
            if status not in self.VALID_STATUSES:
                raise JourneyValidationError(f"Invalid status: {status}")
            journey.status = PersonalJourneyStatus(status)

        # Update cover image URL
        if cover_image_url is not None:
            if cover_image_url and len(cover_image_url) > 512:
                raise JourneyValidationError("Cover image URL must be 512 characters or less")
            journey.cover_image_url = cover_image_url or None

        # Update tags
        if tags is not None:
            if len(tags) > 10:
                raise JourneyValidationError("Maximum 10 tags allowed")
            journey.tags = [t.strip()[:50] for t in tags if t.strip()]

        journey.updated_at = datetime.datetime.now(datetime.UTC)

        await self.session.commit()
        await self.session.refresh(journey)

        logger.info(f"Updated journey {journey_id} by user {user_id}")
        return self._journey_to_dict(journey)

    async def delete_journey(self, journey_id: str, user_id: str) -> None:
        """
        Soft delete a journey.

        Args:
            journey_id: The journey ID
            user_id: The requesting user's ID

        Raises:
            JourneyNotFoundError: If journey doesn't exist
            JourneyAuthorizationError: If user doesn't own the journey
        """
        journey = await self._get_journey_or_404(journey_id)
        self._check_ownership(journey, user_id)

        # Soft delete
        journey.deleted_at = datetime.datetime.now(datetime.UTC)
        await self.session.commit()

        logger.info(f"Deleted journey {journey_id} by user {user_id}")

    async def _get_journey_or_404(self, journey_id: str) -> PersonalJourney:
        """Get a journey by ID or raise 404."""
        query = select(PersonalJourney).where(
            PersonalJourney.id == journey_id,
            PersonalJourney.deleted_at.is_(None)
        )
        result = await self.session.execute(query)
        journey = result.scalar_one_or_none()

        if not journey:
            raise JourneyNotFoundError(journey_id)

        return journey

    def _check_ownership(self, journey: PersonalJourney, user_id: str) -> None:
        """Check if user owns the journey."""
        if journey.owner_id != user_id:
            raise JourneyAuthorizationError()

    @staticmethod
    def _journey_to_dict(journey: PersonalJourney) -> dict[str, Any]:
        """Convert a journey model to a dictionary."""
        return {
            "id": journey.id,
            "owner_id": journey.owner_id,
            "title": journey.title,
            "description": journey.description,
            "status": journey.status.value if isinstance(journey.status, PersonalJourneyStatus) else journey.status,
            "cover_image_url": journey.cover_image_url,
            "tags": journey.tags or [],
            "created_at": journey.created_at.isoformat() if journey.created_at else None,
            "updated_at": journey.updated_at.isoformat() if journey.updated_at else None,
        }


def get_journey_service(session: AsyncSession) -> JourneyService:
    """Factory function to create a JourneyService instance."""
    return JourneyService(session)
