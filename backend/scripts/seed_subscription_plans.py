"""Seed script for subscription plans.

This script creates the initial subscription plans in the database.
Run with: python -m backend.scripts.seed_subscription_plans

Four-tier structure (March 2026):
- FREE (Seeker): 5 KIAAN questions/month, 1 Wisdom Journey
- BHAKTA: 50 questions/month, encrypted journal, 3 wisdom journeys ($6.99/month, $47.99/year)
- SADHAK: 300 questions/month, all features, 10 wisdom journeys ($12.99/month, $89.99/year)
- SIDDHA: Unlimited questions, unlimited everything ($22.99/month, $169.99/year)
"""

import asyncio
import os
import ssl as ssl_module
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict
from urllib.parse import parse_qs, urlparse

# Add the project root to the path
# Path: backend/scripts/seed_subscription_plans.py -> parents[2] = project root
project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.models import Base, SubscriptionPlan, SubscriptionTier


def _get_ssl_connect_args(db_url: str) -> Dict[str, Any]:
    """Build SSL connect args for asyncpg.

    Render PostgreSQL uses self-signed certificates, so we need to
    disable certificate verification while still using SSL encryption.

    IMPORTANT: On Render, we ALWAYS disable certificate verification
    because Render uses self-signed certificates that fail verification.
    """
    parsed = urlparse(db_url)
    query_params = parse_qs(parsed.query)

    ssl_pref = (
        os.getenv("DB_SSL_MODE") or
        query_params.get("sslmode", [None])[0] or
        query_params.get("ssl", [None])[0]
    )

    # Auto-detect Render environment (Render sets RENDER=true)
    is_render = os.getenv("RENDER", "").lower() == "true"

    # CRITICAL: On Render, ALWAYS disable certificate verification
    # Render uses self-signed certificates that will fail verification
    if is_render:
        ssl_context = ssl_module.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl_module.CERT_NONE
        return {"ssl": ssl_context}

    # Default to 'require' (SSL without cert verification) for Render compatibility
    if not ssl_pref:
        ssl_pref = "require"

    ssl_pref = ssl_pref.lower()

    # Full verification (only for non-Render environments with proper certs)
    if ssl_pref in {"verify-ca", "verify-full"}:
        return {"ssl": ssl_module.create_default_context()}

    # Require SSL but skip certificate verification (for self-signed certs)
    if ssl_pref in {"require", "required", "require-no-verify", "true", "1"}:
        ssl_context = ssl_module.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl_module.CERT_NONE
        return {"ssl": ssl_context}

    # Disable SSL
    if ssl_pref in {"disable", "false", "0"}:
        return {"ssl": False}

    # Default: SSL without verification for compatibility
    ssl_context = ssl_module.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl_module.CERT_NONE
    return {"ssl": ssl_context}


# Plan definitions — 4-tier structure (March 2026)
SUBSCRIPTION_PLANS = [
    {
        "tier": SubscriptionTier.FREE,
        "name": "Seeker",
        "description": "Begin your spiritual journey with KIAAN's core guidance",
        "price_monthly": Decimal("0.00"),
        "price_yearly": None,
        "stripe_price_id_monthly": None,
        "stripe_price_id_yearly": None,
        "features": {
            "kiaan_questions_monthly": 5,
            "encrypted_journal": False,
            "mood_tracking": True,
            "wisdom_access": True,
            "advanced_analytics": False,
            "priority_support": False,
            "offline_access": False,
            "data_retention_days": 30,
            "wisdom_journeys": True,
            "wisdom_journeys_limit": 1,
        },
        "kiaan_questions_monthly": 5,
        "encrypted_journal": False,
        "data_retention_days": 30,
    },
    {
        "tier": SubscriptionTier.BHAKTA,
        "name": "Bhakta",
        "description": "50 KIAAN questions with encrypted journal and 3 Wisdom Journeys",
        "price_monthly": Decimal("6.99"),
        "price_yearly": Decimal("47.99"),
        "stripe_price_id_monthly": os.getenv("STRIPE_BHAKTA_MONTHLY_PRICE_ID"),
        "stripe_price_id_yearly": os.getenv("STRIPE_BHAKTA_YEARLY_PRICE_ID"),
        "features": {
            "kiaan_questions_monthly": 50,
            "encrypted_journal": True,
            "mood_tracking": True,
            "wisdom_access": True,
            "advanced_analytics": False,
            "priority_support": False,
            "offline_access": False,
            "data_retention_days": 90,
            "wisdom_journeys": True,
            "wisdom_journeys_limit": 3,
        },
        "kiaan_questions_monthly": 50,
        "encrypted_journal": True,
        "data_retention_days": 90,
    },
    {
        "tier": SubscriptionTier.SADHAK,
        "name": "Sadhak",
        "description": "300 KIAAN questions with all features, Voice Companion, and 10 Wisdom Journeys",
        "price_monthly": Decimal("12.99"),
        "price_yearly": Decimal("89.99"),
        "stripe_price_id_monthly": os.getenv("STRIPE_SADHAK_MONTHLY_PRICE_ID"),
        "stripe_price_id_yearly": os.getenv("STRIPE_SADHAK_YEARLY_PRICE_ID"),
        "features": {
            "kiaan_questions_monthly": 300,
            "encrypted_journal": True,
            "mood_tracking": True,
            "wisdom_access": True,
            "advanced_analytics": True,
            "priority_support": True,
            "offline_access": True,
            "data_retention_days": -1,
            "wisdom_journeys": True,
            "wisdom_journeys_limit": 10,
        },
        "kiaan_questions_monthly": 300,
        "encrypted_journal": True,
        "data_retention_days": -1,  # Unlimited
    },
    {
        "tier": SubscriptionTier.SIDDHA,
        "name": "Siddha",
        "description": "Unlimited KIAAN questions, unlimited Wisdom Journeys, and dedicated support",
        "price_monthly": Decimal("22.99"),
        "price_yearly": Decimal("169.99"),
        "stripe_price_id_monthly": os.getenv("STRIPE_SIDDHA_MONTHLY_PRICE_ID"),
        "stripe_price_id_yearly": os.getenv("STRIPE_SIDDHA_YEARLY_PRICE_ID"),
        "features": {
            "kiaan_questions_monthly": -1,  # Unlimited
            "encrypted_journal": True,
            "mood_tracking": True,
            "wisdom_access": True,
            "advanced_analytics": True,
            "priority_support": True,
            "offline_access": True,
            "dedicated_support": True,
            "data_retention_days": -1,
            "wisdom_journeys": True,
            "wisdom_journeys_limit": -1,  # Unlimited
        },
        "kiaan_questions_monthly": -1,  # Unlimited
        "encrypted_journal": True,
        "data_retention_days": -1,  # Unlimited
    },
]


async def seed_subscription_plans(
    db_url: str | None = None,
    existing_engine=None,
) -> None:
    """Seed the subscription plans into the database.

    Args:
        db_url: Optional database URL. If not provided, uses DATABASE_URL env var.
            NOTE: SQLAlchemy's ``str(engine.url)`` masks the password, so callers
            should pass ``existing_engine`` instead when the engine is already
            available.
        existing_engine: Optional existing SQLAlchemy AsyncEngine to reuse.
            When provided, ``db_url`` is ignored and no new engine is created.
            This avoids password-masking issues with ``str(engine.url)``.
    """
    owns_engine = existing_engine is None

    if existing_engine is not None:
        local_engine = existing_engine
    else:
        if not db_url:
            db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

        # Convert postgres:// to postgresql+asyncpg://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgresql://") and "asyncpg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        local_engine = create_async_engine(
            db_url,
            echo=False,
            connect_args=_get_ssl_connect_args(db_url),
        )

    session_maker = async_sessionmaker(local_engine, expire_on_commit=False)

    # Create tables if they don't exist
    async with local_engine.begin() as conn:
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

    # Only dispose if we created the engine ourselves
    if owns_engine:
        await local_engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_subscription_plans())
