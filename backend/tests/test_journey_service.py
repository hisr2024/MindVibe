"""
Comprehensive Test Suite for Journey Service

Tests all CRUD operations, validation, authorization, and error handling
for the Personal Journeys feature.
"""

import sys
import os
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestJourneyServiceErrorCodes:
    """Test journey service error codes and HTTP status codes."""

    def test_not_found_error_code(self):
        """JourneyNotFoundError should have correct status code."""
        from backend.services.journey_service import JourneyNotFoundError

        error = JourneyNotFoundError("test-id")

        assert error.status_code == 404
        assert error.code == "JOURNEY_NOT_FOUND"
        assert "test-id" in error.message
        print("✅ JourneyNotFoundError has correct code (404)")

    def test_validation_error_code(self):
        """JourneyValidationError should have correct status code."""
        from backend.services.journey_service import JourneyValidationError

        error = JourneyValidationError("Invalid field")

        assert error.status_code == 400
        assert error.code == "VALIDATION_ERROR"
        assert "Invalid field" in error.message
        print("✅ JourneyValidationError has correct code (400)")

    def test_authorization_error_code(self):
        """JourneyAuthorizationError should have correct status code."""
        from backend.services.journey_service import JourneyAuthorizationError

        error = JourneyAuthorizationError()

        assert error.status_code == 403
        assert error.code == "UNAUTHORIZED"
        print("✅ JourneyAuthorizationError has correct code (403)")

    def test_base_error_attributes(self):
        """JourneyServiceError should have required attributes."""
        from backend.services.journey_service import JourneyServiceError

        error = JourneyServiceError("Test error", "TEST_CODE", 418)

        assert error.message == "Test error"
        assert error.code == "TEST_CODE"
        assert error.status_code == 418
        assert str(error) == "Test error"
        print("✅ JourneyServiceError has all required attributes")


class TestJourneyServiceCRUD:
    """Test journey service CRUD operations."""

    @pytest.mark.asyncio
    async def test_get_journey_not_found(self):
        """Get non-existent journey should raise JourneyNotFoundError."""
        from backend.services.journey_service import JourneyService, JourneyNotFoundError

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=None)
        mock_db.execute = AsyncMock(return_value=mock_result)

        service = JourneyService(mock_db)

        with pytest.raises(JourneyNotFoundError) as exc_info:
            await service.get_journey("nonexistent-id", "user-123")

        assert exc_info.value.status_code == 404
        print("✅ Get non-existent journey raises JourneyNotFoundError")

    @pytest.mark.asyncio
    async def test_get_journey_wrong_owner(self):
        """Get journey with wrong owner should raise JourneyAuthorizationError."""
        from backend.services.journey_service import JourneyService, JourneyAuthorizationError

        mock_db = AsyncMock()
        mock_journey = MagicMock()
        mock_journey.owner_id = "other-user"
        mock_journey.deleted_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=mock_journey)
        mock_db.execute = AsyncMock(return_value=mock_result)

        service = JourneyService(mock_db)

        with pytest.raises(JourneyAuthorizationError) as exc_info:
            await service.get_journey("journey-123", "wrong-user")

        assert exc_info.value.status_code == 403
        print("✅ Get journey with wrong owner raises JourneyAuthorizationError")

    @pytest.mark.asyncio
    async def test_update_journey_partial(self):
        """Update journey should only modify provided fields."""
        from backend.services.journey_service import JourneyService

        mock_db = AsyncMock()
        mock_journey = MagicMock()
        mock_journey.id = "journey-123"
        mock_journey.owner_id = "user-456"
        mock_journey.title = "Original Title"
        mock_journey.description = "Original description"
        mock_journey.status = "draft"
        mock_journey.cover_image_url = None
        mock_journey.tags = []
        mock_journey.created_at = datetime.now()
        mock_journey.updated_at = None
        mock_journey.deleted_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=mock_journey)
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        service = JourneyService(mock_db)

        # Only update title
        result = await service.update_journey(
            journey_id="journey-123",
            user_id="user-456",
            title="New Title"
        )

        # Verify only title changed
        assert mock_journey.title == "New Title"
        assert mock_journey.description == "Original description"
        print("✅ Partial update only modifies provided fields")

    @pytest.mark.asyncio
    async def test_delete_journey_soft_delete(self):
        """Delete journey should perform soft delete."""
        from backend.services.journey_service import JourneyService

        mock_db = AsyncMock()
        mock_journey = MagicMock()
        mock_journey.id = "journey-123"
        mock_journey.owner_id = "user-456"
        mock_journey.deleted_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=mock_journey)
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()

        service = JourneyService(mock_db)

        await service.delete_journey("journey-123", "user-456")

        # Verify soft delete was performed
        assert mock_journey.deleted_at is not None
        mock_db.commit.assert_called_once()
        print("✅ Delete performs soft delete (sets deleted_at)")


class TestJourneyServiceList:
    """Test journey service list operations."""

    @pytest.mark.asyncio
    async def test_list_journeys_executes_query(self):
        """List journeys should execute database query."""
        from backend.services.journey_service import JourneyService

        mock_db = AsyncMock()

        # Mock for count query
        mock_count_result = MagicMock()
        mock_count_result.scalar = MagicMock(return_value=5)

        # Mock for items query
        mock_items_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[])
        mock_items_result.scalars = MagicMock(return_value=mock_scalars)

        mock_db.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        service = JourneyService(mock_db)

        result = await service.list_journeys(user_id="user-123", limit=5, offset=0)

        # Verify query was executed
        assert mock_db.execute.call_count == 2
        assert "items" in result
        assert "total" in result
        assert "limit" in result
        assert "offset" in result
        print("✅ List journeys executes database query")

    @pytest.mark.asyncio
    async def test_list_journeys_invalid_status(self):
        """List journeys with invalid status should raise validation error."""
        from backend.services.journey_service import JourneyService, JourneyValidationError

        mock_db = AsyncMock()
        service = JourneyService(mock_db)

        with pytest.raises(JourneyValidationError) as exc_info:
            await service.list_journeys(user_id="user-123", status="invalid_status")

        assert "Invalid status" in str(exc_info.value)
        print("✅ List journeys with invalid status raises validation error")


class TestJourneyServiceValidStatus:
    """Test journey service valid status values."""

    def test_valid_statuses_defined(self):
        """JourneyService should have VALID_STATUSES defined."""
        from backend.services.journey_service import JourneyService

        assert hasattr(JourneyService, 'VALID_STATUSES')
        assert "draft" in JourneyService.VALID_STATUSES
        assert "active" in JourneyService.VALID_STATUSES
        assert "completed" in JourneyService.VALID_STATUSES
        assert "archived" in JourneyService.VALID_STATUSES
        print("✅ All valid statuses are defined")

    def test_valid_statuses_count(self):
        """JourneyService should have exactly 4 valid statuses."""
        from backend.services.journey_service import JourneyService

        assert len(JourneyService.VALID_STATUSES) == 4
        print("✅ Exactly 4 valid statuses defined")


class TestJourneyServiceHelpers:
    """Test journey service helper methods."""

    def test_journey_to_dict_exists(self):
        """JourneyService should have _journey_to_dict method."""
        from backend.services.journey_service import JourneyService

        mock_db = MagicMock()
        service = JourneyService(mock_db)

        assert hasattr(service, '_journey_to_dict')
        print("✅ _journey_to_dict method exists")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
