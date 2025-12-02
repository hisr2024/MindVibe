"""Seed script for subscription plans.

This script creates the initial subscription plans in the database.
Run with: python -m backend.scripts.seed_subscription_plans

Plans created:
- FREE: 10 KIAAN questions/month, no journal access
- BASIC: 100 questions/month, journal access ($9.99/month)
- PREMIUM: Unlimited questions, all features ($19.99/month)
- ENTERPRISE: All features + white label ($499/month)
"""

import asyncio
import os
import sys
from decimal import Decimal
from pathlib import Path

# Add the project root to the path
# Path: backend/scripts/seed_subscription_plans.py -> parents[2] = project root
project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from backend.models import Base, SubscriptionPlan, SubscriptionTier


# Plan definitions
SUBSCRIPTION_PLANS = [
    {
        "tier": SubscriptionTier.FREE,
        "name": "Free",
        "description": "Get started with MindVibe's core features",
        "price_monthly": Decimal("0.00"),
        "price_yearly": None,
        "stripe_price_id_monthly": None,
        "stripe_price_id_yearly": None,
        "features": {
            "kiaan_questions_monthly": 10,
            "encrypted_journal": False,
            "mood_tracking": True,
            "wisdom_access": True,
            "advanced_analytics": False,
            "priority_support": False,
            "offline_access": False,
            "data_retention_days": 30,
        },
        "kiaan_questions_monthly": 10,
        "encrypted_journal": False,
        "data_retention_days": 30,
    },
    {
        "tier": SubscriptionTier.BASIC,
        "name": "Basic",
        "description": "Unlock journal access and more KIAAN conversations",
        "price_monthly": Decimal("9.99"),
        "price_yearly": Decimal("99.99"),
        "stripe_price_id_monthly": os.getenv("STRIPE_BASIC_MONTHLY_PRICE_ID"),
        "stripe_price_id_yearly": os.getenv("STRIPE_BASIC_YEARLY_PRICE_ID"),
        "features": {
            "kiaan_questions_monthly": 100,
            "encrypted_journal": True,
            "mood_tracking": True,
            "wisdom_access": True,
            "advanced_analytics": True,
            "priority_support": False,
            "offline_access": False,
            "data_retention_days": 365,
        },
        "kiaan_questions_monthly": 100,
        "encrypted_journal": True,
        "data_retention_days": 365,
    },
    {
        "tier": SubscriptionTier.PREMIUM,
        "name": "Premium",
        "description": "Unlimited KIAAN access with priority support",
        "price_monthly": Decimal("19.99"),
        "price_yearly": Decimal("199.99"),
        "stripe_price_id_monthly": os.getenv("STRIPE_PREMIUM_MONTHLY_PRICE_ID"),
        "stripe_price_id_yearly": os.getenv("STRIPE_PREMIUM_YEARLY_PRICE_ID"),
        "features": {
            "kiaan_questions_monthly": -1,
            "encrypted_journal": True,
            "mood_tracking": True,
            "wisdom_access": True,
            "advanced_analytics": True,
            "priority_support": True,
            "offline_access": True,
            "data_retention_days": -1,
        },
        "kiaan_questions_monthly": -1,  # Unlimited
        "encrypted_journal": True,
        "data_retention_days": -1,  # Unlimited
    },
    {
        "tier": SubscriptionTier.ENTERPRISE,
        "name": "Enterprise",
        "description": "Complete solution for organizations",
        "price_monthly": Decimal("499.00"),
        "price_yearly": Decimal("4999.00"),
        "stripe_price_id_monthly": os.getenv("STRIPE_ENTERPRISE_MONTHLY_PRICE_ID"),
        "stripe_price_id_yearly": os.getenv("STRIPE_ENTERPRISE_YEARLY_PRICE_ID"),
        "features": {
            "kiaan_questions_monthly": -1,
            "encrypted_journal": True,
            "mood_tracking": True,
            "wisdom_access": True,
            "advanced_analytics": True,
            "priority_support": True,
            "offline_access": True,
            "white_label": True,
            "sso": True,
            "dedicated_support": True,
            "data_retention_days": -1,
        },
        "kiaan_questions_monthly": -1,  # Unlimited
        "encrypted_journal": True,
        "data_retention_days": -1,  # Unlimited
    },
]


async def seed_subscription_plans(db_url: str | None = None) -> None:
    """Seed the subscription plans into the database.
    
    Args:
        db_url: Optional database URL. If not provided, uses DATABASE_URL env var.
    """
    if not db_url:
        db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        
    # Convert postgres:// to postgresql+asyncpg://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(db_url, echo=False)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with session_maker() as db:
        for plan_data in SUBSCRIPTION_PLANS:
            tier = plan_data["tier"]
            
            # Check if plan already exists
            stmt = select(SubscriptionPlan).where(SubscriptionPlan.tier == tier)
            result = await db.execute(stmt)
            existing = result.scalars().first()
            
            if existing:
                print(f"Updating existing plan: {tier.value}")
                # Update existing plan
                existing.name = plan_data["name"]
                existing.description = plan_data["description"]
                existing.price_monthly = plan_data["price_monthly"]
                existing.price_yearly = plan_data["price_yearly"]
                existing.stripe_price_id_monthly = plan_data["stripe_price_id_monthly"]
                existing.stripe_price_id_yearly = plan_data["stripe_price_id_yearly"]
                existing.features = plan_data["features"]
                existing.kiaan_questions_monthly = plan_data["kiaan_questions_monthly"]
                existing.encrypted_journal = plan_data["encrypted_journal"]
                existing.data_retention_days = plan_data["data_retention_days"]
            else:
                print(f"Creating new plan: {tier.value}")
                # Create new plan
                plan = SubscriptionPlan(
                    tier=tier,
                    name=plan_data["name"],
                    description=plan_data["description"],
                    price_monthly=plan_data["price_monthly"],
                    price_yearly=plan_data["price_yearly"],
                    stripe_price_id_monthly=plan_data["stripe_price_id_monthly"],
                    stripe_price_id_yearly=plan_data["stripe_price_id_yearly"],
                    features=plan_data["features"],
                    kiaan_questions_monthly=plan_data["kiaan_questions_monthly"],
                    encrypted_journal=plan_data["encrypted_journal"],
                    data_retention_days=plan_data["data_retention_days"],
                )
                db.add(plan)
        
        await db.commit()
        print("✅ Subscription plans seeded successfully!")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_subscription_plans())
