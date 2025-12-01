from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db, get_user_id
from backend.schemas import JournalExport
from backend.services.data_portability import export_user_data, anonymize_user

router = APIRouter(prefix="/api/data", tags=["data-governance"])


@router.get("/export", response_model=JournalExport)
async def export_me(db: AsyncSession = Depends(get_db)):
    user_id = get_user_id()
    data = await export_user_data(db, user_id)
    return JournalExport(**data)


@router.delete("/", status_code=202)
async def delete_me(db: AsyncSession = Depends(get_db)):
    user_id = get_user_id()
    await anonymize_user(db, user_id)
    return {"user_id": user_id, "status": "scheduled_for_deletion"}


@router.get("/download", response_model=JournalExport)
async def download_my_data(db: AsyncSession = Depends(get_db)):
    """Download a JSON bundle of the authenticated user's data."""

    user_id = get_user_id()
    data = await export_user_data(db, user_id)
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f"attachment; filename=mindvibe-data-{user_id}.json"},
    )


@router.delete("/account", status_code=202)
async def delete_account(db: AsyncSession = Depends(get_db)):
    """Schedule the current account for anonymization and deletion."""

    user_id = get_user_id()
    await anonymize_user(db, user_id)
    return {
        "user_id": user_id,
        "status": "scheduled_for_deletion",
        "message": "Your account has been queued for secure deletion.",
    }
