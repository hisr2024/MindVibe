import datetime as dt
import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import desc, func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime

from backend.deps import get_db, get_current_user_flexible
from backend.models import (
    EncryptedBlob,
    JournalEntry,
    JournalVersion,
    JournalSearchIndex,
)
from backend.schemas import BlobIn, BlobOut
from backend.schemas.journal import (
    JournalEntryCreate,
    JournalEntryOut,
    JournalEntryUpdate,
    JournalSearchRequest,
    JournalAnalytics,
    SyncRequest,
    SyncResponse,
)

# Import subscription access control - optional for backwards compatibility
try:
    from backend.services.subscription_service import check_journal_access, get_or_create_free_subscription
    from backend.middleware.feature_access import get_current_user_id, is_developer
    SUBSCRIPTION_ENABLED = True
except ImportError:
    SUBSCRIPTION_ENABLED = False

router = APIRouter(prefix="/journal", tags=["journal"])


class QuickSaveIn(BaseModel):
    """Quick save from KIAAN chat to journal."""
    content: str
    source: str = "kiaan_chat"


class QuickSaveOut(BaseModel):
    """Response for quick save."""
    success: bool
    message: str
    saved_at: str


async def _check_journal_permission(request: Request, db: AsyncSession, premium: bool = False) -> None:
    """Check if user has journal access.

    Basic encrypted journaling is free; advanced premium-only features can
    opt-in to the stricter check via ``premium=True``.
    Developers bypass all journal access restrictions.
    """
    if not SUBSCRIPTION_ENABLED:
        return  # Allow access if subscription system is not enabled

    try:
        user_id = await get_current_user_id(request)

        # Ensure user has a subscription
        await get_or_create_free_subscription(db, user_id)

        # Developer bypass — full journal access
        if await is_developer(db, user_id):
            return

        # Only enforce the premium gate when required
        if premium:
            has_access = await check_journal_access(db, user_id)
            if not has_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "feature_not_available",
                        "feature": "encrypted_journal",
                        "message": "This capability requires an active subscription.",
                        "upgrade_url": "/subscription/upgrade",
                    },
                )
    except HTTPException:
        raise
    except Exception as e:
        # Log but allow access on error - graceful degradation
        import logging
        logging.warning(f"Journal access check failed, allowing access: {e}")


@router.post("/quick-save", response_model=QuickSaveOut)
async def quick_save_to_journal(
    request: Request,
    payload: QuickSaveIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> QuickSaveOut:
    """Quick-save a KIAAN insight directly to journal.
    
    This endpoint allows users to save KIAAN responses to their journal
    with a single click. The content is wrapped in a journal entry format.
    
    Args:
        payload: Contains the content to save and source identifier.
        
    Returns:
        QuickSaveOut: Confirmation of the save operation.
    """
    # Check subscription access for journal
    await _check_journal_permission(request, db)
    
    # Create a formatted journal entry
    timestamp = dt.datetime.utcnow()
    formatted_content = {
        "type": "kiaan_insight",
        "content": payload.content,
        "source": payload.source,
        "saved_at": timestamp.isoformat(),
    }
    
    # Save as encrypted blob (in production, content would be encrypted client-side)
    import json
    blob_json = json.dumps(formatted_content)
    
    res = await db.execute(
        insert(EncryptedBlob)
        .values(user_id=user_id, blob_json=blob_json)
        .returning(EncryptedBlob.id, EncryptedBlob.created_at)
    )
    row = res.first()
    await db.commit()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save insight to journal",
        )
    
    return QuickSaveOut(
        success=True,
        message="Insight saved to your journal 📝",
        saved_at=row.created_at.isoformat(),
    )


@router.post("/blob", response_model=BlobOut)
async def upload_blob(
    request: Request,
    payload: BlobIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> dict:
    # Check subscription access for journal
    await _check_journal_permission(request, db)
    
    res = await db.execute(
        insert(EncryptedBlob)
        .values(user_id=user_id, blob_json=payload.blob_json)
        .returning(EncryptedBlob.id, EncryptedBlob.created_at, EncryptedBlob.blob_json)
    )
    row = res.first()
    await db.commit()
    if not row:
        raise Exception("Failed to create blob")
    return {
        "id": row.id,
        "created_at": row.created_at.isoformat(),
        "blob_json": row.blob_json,
    }


def _entry_to_out(entry: JournalEntry) -> JournalEntryOut:
    return JournalEntryOut(
        id=entry.id,
        encrypted_title=entry.encrypted_title,
        encrypted_content=entry.encrypted_content,
        moods=entry.mood_labels,
        tags=entry.tag_labels,
        client_updated_at=entry.client_updated_at,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


async def _record_version(
    db: AsyncSession,
    entry: JournalEntry,
    user_id: str,
    payload: JournalEntryCreate | JournalEntryUpdate,
) -> None:
    latest_version = await db.scalar(
        select(func.max(JournalVersion.version)).where(JournalVersion.entry_id == entry.id)
    )
    next_version = 1 if latest_version is None else latest_version + 1
    encrypted_content = (
        payload.content.dict()
        if hasattr(payload, "content") and payload.content
        else entry.encrypted_content
    )
    version_row = JournalVersion(
        entry_id=entry.id,
        user_id=user_id,
        version=next_version,
        encrypted_content=encrypted_content,
        encryption_meta=encrypted_content,
        client_updated_at=payload.client_updated_at,
    )
    db.add(version_row)


@router.post("/entries", response_model=JournalEntryOut, status_code=status.HTTP_201_CREATED)
async def create_entry(
    request: Request,
    payload: JournalEntryCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> JournalEntryOut:
    await _check_journal_permission(request, db, premium=False)

    entry_id = payload.entry_id or str(uuid.uuid4())
    existing = await db.get(JournalEntry, entry_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Entry already exists")

    entry = JournalEntry(
        id=entry_id,
        user_id=user_id,
        encrypted_title=payload.title.dict() if payload.title else None,
        encrypted_content=payload.content.dict(),
        encryption_meta=payload.content.dict(),
        mood_labels=payload.moods,
        tag_labels=payload.tags,
        client_updated_at=payload.client_updated_at,
    )
    db.add(entry)

    await _record_version(db, entry, user_id, payload)

    if payload.search_tokens:
        db.add(
            JournalSearchIndex(
                entry_id=entry_id,
                user_id=user_id,
                token_hashes=payload.search_tokens,
            )
        )

    await db.commit()
    await db.refresh(entry)
    return _entry_to_out(entry)


@router.get("/entries", response_model=list[JournalEntryOut])
async def list_entries(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
    limit: int = 50,
    cursor: datetime | None = None,
) -> Sequence[JournalEntryOut]:
    await _check_journal_permission(request, db, premium=False)

    query = (
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None))
        .order_by(desc(JournalEntry.updated_at))
        .limit(limit)
    )
    if cursor:
        query = query.where(JournalEntry.updated_at < cursor)

    res = await db.execute(query)
    entries = res.scalars().all()
    return [_entry_to_out(e) for e in entries]


@router.get("/entries/{entry_id}", response_model=JournalEntryOut)
async def get_entry(
    request: Request,
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> JournalEntryOut:
    await _check_journal_permission(request, db, premium=False)
    entry = await db.get(JournalEntry, entry_id)
    if not entry or entry.user_id != user_id or entry.deleted_at:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return _entry_to_out(entry)


@router.put("/entries/{entry_id}", response_model=JournalEntryOut)
async def update_entry(
    request: Request,
    entry_id: str,
    payload: JournalEntryUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> JournalEntryOut:
    await _check_journal_permission(request, db, premium=False)
    entry = await db.get(JournalEntry, entry_id)
    if not entry or entry.user_id != user_id or entry.deleted_at:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    # Simple timestamp-based conflict detection
    if payload.client_updated_at <= entry.client_updated_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Client update is older than server copy")

    if payload.title:
        entry.encrypted_title = payload.title.dict()
    if payload.content:
        entry.encrypted_content = payload.content.dict()
        entry.encryption_meta = payload.content.dict()
    if payload.moods is not None:
        entry.mood_labels = payload.moods
    if payload.tags is not None:
        entry.tag_labels = payload.tags
    if payload.search_tokens is not None:
        # Replace search index for entry
        await db.execute(
            JournalSearchIndex.__table__.delete().where(
                JournalSearchIndex.entry_id == entry_id, JournalSearchIndex.user_id == user_id
            )
        )
        if payload.search_tokens:
            db.add(
                JournalSearchIndex(
                    entry_id=entry_id,
                    user_id=user_id,
                    token_hashes=payload.search_tokens,
                )
            )

    entry.client_updated_at = payload.client_updated_at
    entry.updated_at = dt.datetime.utcnow()

    await _record_version(db, entry, user_id, payload)
    await db.commit()
    await db.refresh(entry)
    return _entry_to_out(entry)


@router.delete("/entries/{entry_id}")
async def delete_entry(
    request: Request,
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> dict:
    await _check_journal_permission(request, db, premium=False)
    entry = await db.get(JournalEntry, entry_id)
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    entry.soft_delete()
    entry.updated_at = dt.datetime.utcnow()
    await db.commit()
    return {"status": "deleted", "id": entry_id}


@router.post("/entries/sync", response_model=SyncResponse)
async def sync_entries(
    request: Request,
    payload: SyncRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> SyncResponse:
    await _check_journal_permission(request, db, premium=False)

    changed = await db.execute(
        select(JournalEntry)
        .where(
            JournalEntry.user_id == user_id,
            JournalEntry.updated_at >= payload.since,
        )
        .order_by(JournalEntry.updated_at)
        .limit(payload.limit)
    )
    entries = changed.scalars().all()

    deleted_rows = await db.execute(
        select(JournalEntry.id)
        .where(
            JournalEntry.user_id == user_id,
            JournalEntry.deleted_at.is_not(None),
            JournalEntry.updated_at >= payload.since,
        )
    )
    deleted_ids = [row[0] for row in deleted_rows.fetchall()]

    return SyncResponse(
        entries=[_entry_to_out(e) for e in entries if e.deleted_at is None],
        deleted=deleted_ids,
        server_timestamp=dt.datetime.utcnow(),
    )


@router.post("/search", response_model=list[JournalEntryOut])
async def search_entries(
    request: Request,
    payload: JournalSearchRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> Sequence[JournalEntryOut]:
    await _check_journal_permission(request, db, premium=True)

    # search using overlap on hashed tokens to preserve zero-knowledge
    search_rows = await db.execute(
        select(JournalSearchIndex.entry_id)
        .where(
            JournalSearchIndex.user_id == user_id,
            JournalSearchIndex.token_hashes.overlap(payload.token_hashes),
            JournalSearchIndex.deleted_at.is_(None),
        )
        .limit(payload.limit)
    )
    entry_ids = [row[0] for row in search_rows.fetchall()]
    if not entry_ids:
        return []

    entries_res = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.id.in_(entry_ids), JournalEntry.deleted_at.is_(None))
        .order_by(desc(JournalEntry.updated_at))
    )
    return [_entry_to_out(e) for e in entries_res.scalars().all()]


@router.get("/analytics", response_model=JournalAnalytics)
async def journal_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> JournalAnalytics:
    await _check_journal_permission(request, db, premium=True)

    total = await db.scalar(
        select(func.count()).select_from(
            select(JournalEntry.id)
            .where(JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None))
            .subquery()
        )
    )
    last_entry = await db.scalar(
        select(func.max(JournalEntry.created_at)).where(
            JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None)
        )
    )

    # streak calculation: count consecutive days ending today with at least one entry
    today = dt.datetime.utcnow().date()
    streak = 0
    longest = 0
    res = await db.execute(
        select(func.date_trunc("day", JournalEntry.created_at))
        .where(JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None))
        .group_by(func.date_trunc("day", JournalEntry.created_at))
        .order_by(desc(func.date_trunc("day", JournalEntry.created_at)))
    )
    last_day = None
    for (day_dt,) in res.fetchall():
        day = day_dt.date()
        if last_day is None:
            # start from today backwards
            expected = today
        else:
            expected = last_day - dt.timedelta(days=1)
        if day == expected:
            streak += 1
        else:
            longest = max(longest, streak)
            if day == today:
                streak = 1
            else:
                break
        last_day = day
        longest = max(longest, streak)

    return JournalAnalytics(
        total_entries=total or 0,
        last_entry_at=last_entry,
        current_streak_days=streak,
        longest_streak_days=longest,
    )


@router.get("/blob/latest", response_model=BlobOut | dict)
async def latest_blob(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible),
) -> dict:
    # Check subscription access for journal
    await _check_journal_permission(request, db)
    
    res = await db.execute(
        select(EncryptedBlob)
        .where(EncryptedBlob.user_id == user_id)
        .order_by(desc(EncryptedBlob.created_at))
        .limit(1)
    )
    row = res.scalar_one_or_none()
    if not row:
        return {}
    return {
        "id": row.id,
        "created_at": row.created_at.isoformat(),
        "blob_json": row.blob_json,
    }
