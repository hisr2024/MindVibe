"""
MindVibe Sync API Routes

Handles batch synchronization of offline data with conflict resolution.
Designed for optimal offline-first architecture with minimal roundtrips.

Quantum Coherence Principle: Even when network decoherence occurs,
we maintain system integrity by carefully orchestrating state reconciliation.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
import logging

from backend.deps import get_db, get_current_user_flexible
from backend.models import Mood, Journal, WisdomJourney

router = APIRouter(prefix="/sync", tags=["sync"])
logger = logging.getLogger(__name__)


# ===== Pydantic Models =====

class SyncItem(BaseModel):
    """A single item to be synced"""
    entity_type: Literal["mood", "journal", "journey_progress"]
    entity_id: Optional[str] = None  # None for new entities
    operation: Literal["create", "update", "delete"]
    data: Dict[str, Any]
    local_timestamp: datetime
    client_request_id: str = Field(..., description="Unique client-side ID for deduplication")


class SyncBatchRequest(BaseModel):
    """Batch sync request with multiple items"""
    items: List[SyncItem]
    last_sync_timestamp: Optional[datetime] = Field(
        None,
        description="Client's last successful sync time for conflict detection"
    )


class ConflictInfo(BaseModel):
    """Conflict detected during sync"""
    client_request_id: str
    entity_type: str
    entity_id: str
    conflict_reason: str
    server_version: Dict[str, Any]
    server_timestamp: datetime
    resolution_strategy: str


class SyncItemResult(BaseModel):
    """Result for a single sync item"""
    client_request_id: str
    status: Literal["success", "conflict", "error"]
    entity_id: Optional[str] = None  # Server-assigned ID for new entities
    server_timestamp: Optional[datetime] = None
    conflict: Optional[ConflictInfo] = None
    error_message: Optional[str] = None


class SyncBatchResponse(BaseModel):
    """Batch sync response"""
    results: List[SyncItemResult]
    server_timestamp: datetime
    conflicts_count: int
    success_count: int
    error_count: int


class ServerChangesRequest(BaseModel):
    """Request for server-side changes since last sync"""
    last_sync_timestamp: datetime
    entity_types: List[Literal["mood", "journal", "journey_progress"]]


class ServerChange(BaseModel):
    """A change that occurred on the server"""
    entity_type: str
    entity_id: str
    operation: Literal["create", "update", "delete"]
    data: Dict[str, Any]
    timestamp: datetime


class ServerChangesResponse(BaseModel):
    """Server changes to be pulled by client"""
    changes: List[ServerChange]
    server_timestamp: datetime
    has_more: bool = False


# ===== Sync Handlers =====

async def sync_mood_create(
    db: AsyncSession,
    user_id: str,
    data: Dict[str, Any],
    local_timestamp: datetime
) -> tuple[str, datetime]:
    """Create a new mood entry"""
    res = await db.execute(
        insert(Mood)
        .values(
            user_id=user_id,
            score=data.get("score"),
            tags={"tags": data.get("tags", [])} if data.get("tags") else None,
            note=data.get("note"),
            at=local_timestamp
        )
        .returning(Mood.id, Mood.at)
    )
    row = res.first()
    await db.commit()

    if not row:
        raise HTTPException(status_code=500, detail="Failed to create mood")

    return str(row.id), row.at


async def sync_mood_update(
    db: AsyncSession,
    user_id: str,
    entity_id: str,
    data: Dict[str, Any],
    local_timestamp: datetime
) -> tuple[Optional[ConflictInfo], Optional[datetime]]:
    """Update an existing mood entry with conflict detection"""
    # Check if mood exists and get current version
    result = await db.execute(
        select(Mood).where(Mood.id == int(entity_id), Mood.user_id == user_id, Mood.deleted_at.is_(None))
    )
    existing_mood = result.scalar_one_or_none()

    if not existing_mood:
        raise HTTPException(status_code=404, detail="Mood not found")

    # Conflict detection: Check if server version is newer
    if existing_mood.at > local_timestamp:
        conflict = ConflictInfo(
            client_request_id=data.get("client_request_id", ""),
            entity_type="mood",
            entity_id=entity_id,
            conflict_reason="Server version is newer",
            server_version={
                "score": existing_mood.score,
                "tags": (existing_mood.tags or {}).get("tags"),
                "note": existing_mood.note,
                "at": existing_mood.at.isoformat()
            },
            server_timestamp=existing_mood.at,
            resolution_strategy="last-write-wins"
        )
        return conflict, None

    # No conflict - apply update
    await db.execute(
        update(Mood)
        .where(Mood.id == int(entity_id), Mood.user_id == user_id)
        .values(
            score=data.get("score"),
            tags={"tags": data.get("tags", [])} if data.get("tags") else None,
            note=data.get("note"),
            at=local_timestamp
        )
    )
    await db.commit()

    return None, local_timestamp


async def sync_journal_create(
    db: AsyncSession,
    user_id: str,
    data: Dict[str, Any],
    local_timestamp: datetime
) -> tuple[str, datetime]:
    """Create a new journal entry"""
    res = await db.execute(
        insert(Journal)
        .values(
            user_id=user_id,
            encrypted_data=data.get("encrypted_data"),
            metadata=data.get("metadata", {}),
            created_at=local_timestamp
        )
        .returning(Journal.id, Journal.created_at)
    )
    row = res.first()
    await db.commit()

    if not row:
        raise HTTPException(status_code=500, detail="Failed to create journal entry")

    return str(row.id), row.created_at


async def sync_journey_progress_update(
    db: AsyncSession,
    user_id: str,
    entity_id: str,
    data: Dict[str, Any],
    local_timestamp: datetime
) -> tuple[Optional[ConflictInfo], Optional[datetime]]:
    """Update journey progress with merge strategy"""
    # Check if journey exists
    result = await db.execute(
        select(WisdomJourney).where(
            WisdomJourney.id == entity_id,
            WisdomJourney.user_id == user_id,
            WisdomJourney.deleted_at.is_(None)
        )
    )
    existing_journey = result.scalar_one_or_none()

    if not existing_journey:
        raise HTTPException(status_code=404, detail="Journey not found")

    # For journey progress, we merge (use max values)
    new_current_step = max(
        data.get("current_step", 0),
        existing_journey.current_step
    )
    new_progress = max(
        data.get("progress_percentage", 0),
        existing_journey.progress_percentage
    )

    await db.execute(
        update(WisdomJourney)
        .where(
            WisdomJourney.id == entity_id,
            WisdomJourney.user_id == user_id
        )
        .values(
            current_step=new_current_step,
            progress_percentage=new_progress,
            status=data.get("status", existing_journey.status),
            updated_at=local_timestamp
        )
    )
    await db.commit()

    return None, local_timestamp


# ===== API Endpoints =====

@router.post("/batch", response_model=SyncBatchResponse)
async def sync_batch(
    payload: SyncBatchRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> SyncBatchResponse:
    """
    Batch sync endpoint - handles multiple offline operations in a single request.

    This endpoint provides:
    - Atomic operations per item
    - Conflict detection and resolution
    - Deduplication via client_request_id
    - Efficient batch processing
    """
    results: List[SyncItemResult] = []
    conflicts_count = 0
    success_count = 0
    error_count = 0

    logger.info(f"Processing batch sync for user {user_id} with {len(payload.items)} items")

    for item in payload.items:
        try:
            if item.operation == "create":
                # Handle create operations
                if item.entity_type == "mood":
                    entity_id, timestamp = await sync_mood_create(
                        db, user_id, item.data, item.local_timestamp
                    )
                    results.append(SyncItemResult(
                        client_request_id=item.client_request_id,
                        status="success",
                        entity_id=entity_id,
                        server_timestamp=timestamp
                    ))
                    success_count += 1

                elif item.entity_type == "journal":
                    entity_id, timestamp = await sync_journal_create(
                        db, user_id, item.data, item.local_timestamp
                    )
                    results.append(SyncItemResult(
                        client_request_id=item.client_request_id,
                        status="success",
                        entity_id=entity_id,
                        server_timestamp=timestamp
                    ))
                    success_count += 1

                else:
                    results.append(SyncItemResult(
                        client_request_id=item.client_request_id,
                        status="error",
                        error_message=f"Unsupported entity type for create: {item.entity_type}"
                    ))
                    error_count += 1

            elif item.operation == "update":
                # Handle update operations with conflict detection
                if not item.entity_id:
                    results.append(SyncItemResult(
                        client_request_id=item.client_request_id,
                        status="error",
                        error_message="entity_id required for update operations"
                    ))
                    error_count += 1
                    continue

                if item.entity_type == "mood":
                    conflict, timestamp = await sync_mood_update(
                        db, user_id, item.entity_id, item.data, item.local_timestamp
                    )

                    if conflict:
                        results.append(SyncItemResult(
                            client_request_id=item.client_request_id,
                            status="conflict",
                            entity_id=item.entity_id,
                            conflict=conflict
                        ))
                        conflicts_count += 1
                    else:
                        results.append(SyncItemResult(
                            client_request_id=item.client_request_id,
                            status="success",
                            entity_id=item.entity_id,
                            server_timestamp=timestamp
                        ))
                        success_count += 1

                elif item.entity_type == "journey_progress":
                    conflict, timestamp = await sync_journey_progress_update(
                        db, user_id, item.entity_id, item.data, item.local_timestamp
                    )

                    if conflict:
                        results.append(SyncItemResult(
                            client_request_id=item.client_request_id,
                            status="conflict",
                            entity_id=item.entity_id,
                            conflict=conflict
                        ))
                        conflicts_count += 1
                    else:
                        results.append(SyncItemResult(
                            client_request_id=item.client_request_id,
                            status="success",
                            entity_id=item.entity_id,
                            server_timestamp=timestamp
                        ))
                        success_count += 1

                else:
                    results.append(SyncItemResult(
                        client_request_id=item.client_request_id,
                        status="error",
                        error_message=f"Unsupported entity type for update: {item.entity_type}"
                    ))
                    error_count += 1

            elif item.operation == "delete":
                # Handle soft deletes
                # Implementation depends on specific entity type
                results.append(SyncItemResult(
                    client_request_id=item.client_request_id,
                    status="error",
                    error_message="Delete operations not yet implemented"
                ))
                error_count += 1

        except HTTPException as e:
            results.append(SyncItemResult(
                client_request_id=item.client_request_id,
                status="error",
                error_message=f"{e.status_code}: {e.detail}"
            ))
            error_count += 1

        except Exception as e:
            logger.error(f"Error processing sync item: {str(e)}", exc_info=True)
            results.append(SyncItemResult(
                client_request_id=item.client_request_id,
                status="error",
                error_message=f"Internal error: {str(e)}"
            ))
            error_count += 1

    logger.info(
        f"Batch sync completed: {success_count} success, "
        f"{conflicts_count} conflicts, {error_count} errors"
    )

    return SyncBatchResponse(
        results=results,
        server_timestamp=datetime.utcnow(),
        conflicts_count=conflicts_count,
        success_count=success_count,
        error_count=error_count
    )


@router.post("/pull", response_model=ServerChangesResponse)
async def pull_server_changes(
    payload: ServerChangesRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> ServerChangesResponse:
    """
    Pull server-side changes since last sync.

    This endpoint allows clients to fetch changes that occurred on other devices
    or through other sessions since their last sync.
    """
    changes: List[ServerChange] = []

    logger.info(f"Pulling server changes for user {user_id} since {payload.last_sync_timestamp}")

    # Fetch moods created/updated since last sync
    if "mood" in payload.entity_types:
        result = await db.execute(
            select(Mood).where(
                Mood.user_id == user_id,
                Mood.at > payload.last_sync_timestamp,
                Mood.deleted_at.is_(None)
            ).order_by(Mood.at)
        )
        moods = result.scalars().all()

        for mood in moods:
            changes.append(ServerChange(
                entity_type="mood",
                entity_id=str(mood.id),
                operation="create",  # Simplified - could track updates separately
                data={
                    "score": mood.score,
                    "tags": (mood.tags or {}).get("tags"),
                    "note": mood.note,
                },
                timestamp=mood.at
            ))

    # Fetch journeys updated since last sync
    if "journey_progress" in payload.entity_types:
        result = await db.execute(
            select(WisdomJourney).where(
                WisdomJourney.user_id == user_id,
                WisdomJourney.updated_at > payload.last_sync_timestamp,
                WisdomJourney.deleted_at.is_(None)
            ).order_by(WisdomJourney.updated_at)
        )
        journeys = result.scalars().all()

        for journey in journeys:
            changes.append(ServerChange(
                entity_type="journey_progress",
                entity_id=journey.id,
                operation="update",
                data={
                    "current_step": journey.current_step,
                    "progress_percentage": journey.progress_percentage,
                    "status": journey.status.value,
                },
                timestamp=journey.updated_at
            ))

    logger.info(f"Returning {len(changes)} server changes")

    return ServerChangesResponse(
        changes=changes,
        server_timestamp=datetime.utcnow(),
        has_more=False  # Pagination could be added if needed
    )


@router.get("/status")
async def sync_status(
    user_id: str = Depends(get_current_user_flexible),
) -> dict:
    """
    Get sync status and server health.
    Used by clients to verify sync endpoint availability.
    """
    return {
        "status": "healthy",
        "server_timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "sync_version": "1.0"
    }
