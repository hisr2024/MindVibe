"""Mobile-specific user endpoints: push token registration."""

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user, get_db
from backend.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["user-mobile"])


class PushTokenIn(BaseModel):
    """Register an Expo Push or FCM token for push notifications."""
    token: str = Field(..., min_length=1, max_length=512)
    platform: Literal["ios", "android"] = Field(...)


class PushTokenOut(BaseModel):
    detail: str = "Push token registered"
    code: str = "OK"


@router.post("/push-token", response_model=PushTokenOut)
async def register_push_token(
    request: Request,
    payload: PushTokenIn,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PushTokenOut:
    """
    Store the device push token on the user record.

    The mobile client calls this on login and whenever the Expo push
    token is refreshed. The stored token is used by the notification
    dispatcher to send Expo Push API notifications.
    """
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(push_token=payload.token, push_platform=payload.platform)
    )
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to save push token for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": "Failed to save push token", "code": "INTERNAL_ERROR"},
        )

    logger.info(f"Push token registered for user {user_id} ({payload.platform})")
    return PushTokenOut()
