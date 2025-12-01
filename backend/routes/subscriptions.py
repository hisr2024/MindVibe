"""Subscription management endpoints."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.models import Subscription, SubscriptionPlan
from backend.security.jwt import decode_access_token
from backend.security.rate_limiter import rate_limit
from backend.security.rbac import Role, require_roles
from backend.services.stripe_service import create_subscription

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


class PlanCreate(BaseModel):
    code: str = Field(min_length=3, max_length=64)
    name: str = Field(min_length=3, max_length=128)
    price_cents: int = Field(ge=0)
    currency: str = Field(default="usd", min_length=3, max_length=8)
    interval: str = Field(default="month", min_length=3, max_length=32)
    stripe_price_id: str | None = Field(default=None, max_length=128)
    features: dict[str, Any] | None = None


class PlanOut(BaseModel):
    id: int
    code: str
    name: str
    price_cents: int
    currency: str
    interval: str
    active: bool
    features: dict[str, Any] | None = None

    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    plan_code: str = Field(min_length=3, max_length=64)
    metadata: dict[str, Any] | None = None


class SubscriptionOut(BaseModel):
    id: int
    plan_code: str | None
    status: str
    stripe_subscription_id: str | None

    class Config:
        from_attributes = True


def _user_from_authorization(authorization: str | None) -> tuple[int, str | None]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    role = payload.get("role")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(user_id), role


@router.get("/plans", response_model=list[PlanOut], dependencies=[Depends(rate_limit(30, 60))])
async def list_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.active.is_(True)))
    return result.scalars().all()


@router.post(
    "/plans",
    response_model=PlanOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(Role.ADMIN))],
)
async def create_plan(payload: PlanCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.code == payload.code))
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail={"code": "plan_exists", "message": "Plan code already exists"})

    plan = SubscriptionPlan(
        code=payload.code,
        name=payload.name,
        price_cents=payload.price_cents,
        currency=payload.currency,
        interval=payload.interval,
        stripe_price_id=payload.stripe_price_id,
        features=payload.features,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.post("", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit(10, 60))])
async def start_subscription(
    payload: SubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    authorization: str | None = Header(default=None, convert_underscores=False),
):
    user_id, _ = _user_from_authorization(authorization)
    try:
        subscription = await create_subscription(db, user_id=user_id, plan_code=payload.plan_code, metadata=payload.metadata)
    except ValueError as exc:  # plan not found
        raise HTTPException(status_code=404, detail={"code": "plan_not_found", "message": str(exc)}) from exc
    plan = await db.get(SubscriptionPlan, subscription.plan_id) if subscription.plan_id else None
    return SubscriptionOut(
        id=subscription.id,
        plan_code=plan.code if plan else None,
        status=subscription.status,
        stripe_subscription_id=subscription.stripe_subscription_id,
    )


@router.get("/me", response_model=list[SubscriptionOut], dependencies=[Depends(rate_limit(20, 60))])
async def my_subscriptions(
    authorization: str | None = Header(default=None, convert_underscores=False),
    db: AsyncSession = Depends(get_db),
):
    user_id, _ = _user_from_authorization(authorization)
    result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    subscriptions = result.scalars().all()
    plan_map: dict[int, str] = {}
    plan_ids = [s.plan_id for s in subscriptions if s.plan_id]
    if plan_ids:
        plans = (
            await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id.in_(plan_ids)))
        ).scalars().all()
        plan_map = {plan.id: plan.code for plan in plans}
    return [
        SubscriptionOut(
            id=sub.id,
            plan_code=plan_map.get(sub.plan_id),
            status=sub.status,
            stripe_subscription_id=sub.stripe_subscription_id,
        )
        for sub in subscriptions
    ]

