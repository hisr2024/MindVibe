from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import desc, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.models import EncryptedBlob
from backend.schemas import BlobIn, BlobOut

# Import subscription access control - optional for backwards compatibility
try:
    from backend.services.subscription_service import check_journal_access, get_or_create_free_subscription
    from backend.middleware.feature_access import get_current_user_id
    SUBSCRIPTION_ENABLED = True
except ImportError:
    SUBSCRIPTION_ENABLED = False

router = APIRouter(prefix="/journal", tags=["journal"])


async def _check_journal_permission(request: Request, db: AsyncSession) -> None:
    """Check if user has journal access (paid subscribers only).
    
    Raises HTTPException 403 if user doesn't have access.
    """
    if not SUBSCRIPTION_ENABLED:
        return  # Allow access if subscription system is not enabled
    
    try:
        user_id = await get_current_user_id(request)
        
        # Ensure user has a subscription
        await get_or_create_free_subscription(db, user_id)
        
        # Check journal access
        has_access = await check_journal_access(db, user_id)
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "feature_not_available",
                    "feature": "encrypted_journal",
                    "message": "The encrypted journal is a premium feature. "
                              "Upgrade to Basic or higher to access your private journal.",
                    "upgrade_url": "/subscription/upgrade",
                },
            )
    except HTTPException:
        raise
    except Exception as e:
        # Log but allow access on error - graceful degradation
        import logging
        logging.warning(f"Journal access check failed, allowing access: {e}")


@router.post("/blob", response_model=BlobOut)
async def upload_blob(
    request: Request,
    payload: BlobIn,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
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


@router.get("/blob/latest", response_model=BlobOut | dict)
async def latest_blob(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
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
