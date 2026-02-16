"""
Unit tests for subscription service.

Tests the subscription service including:
- Free tier auto-assignment
- Feature access checking
- Quota enforcement
- Usage tracking
"""

import pytest
from datetime import datetime, timedelta, UTC
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    User,
    SubscriptionPlan,
    UserSubscription,
    UsageTracking,
    SubscriptionTier,
    SubscriptionStatus,
)


class TestFeatureConfig:
    """Test feature configuration."""

    def test_tier_features_free(self):
        """Test FREE tier features."""
        from backend.config.feature_config import get_tier_features, TIER_FEATURES

        features = get_tier_features(SubscriptionTier.FREE)
        assert features["kiaan_questions_monthly"] == 15
        assert features["encrypted_journal"] is False
        assert features["mood_tracking"] is True
        assert features["wisdom_access"] is True
        assert features["data_retention_days"] == 30

    def test_tier_features_basic(self):
        """Test BASIC tier features."""
        from backend.config.feature_config import get_tier_features

        features = get_tier_features(SubscriptionTier.BASIC)
        assert features["kiaan_questions_monthly"] == 150
        assert features["encrypted_journal"] is True
        assert features["advanced_analytics"] is False
        assert features["data_retention_days"] == 365

    def test_tier_features_premium(self):
        """Test PREMIUM tier features."""
        from backend.config.feature_config import get_tier_features

        features = get_tier_features(SubscriptionTier.PREMIUM)
        assert features["kiaan_questions_monthly"] == 300
        assert features["encrypted_journal"] is True
        assert features["priority_support"] is True
        assert features["offline_access"] is True

    def test_tier_features_enterprise(self):
        """Test ENTERPRISE (Elite) tier features."""
        from backend.config.feature_config import get_tier_features

        features = get_tier_features(SubscriptionTier.ENTERPRISE)
        assert features["kiaan_questions_monthly"] == 800
        assert features["white_label"] is False
        assert features["sso"] is False
        assert features["dedicated_support"] is True
        assert features["wisdom_journeys_limit"] == -1  # Unlimited

    def test_tier_features_premier(self):
        """Test PREMIER tier features."""
        from backend.config.feature_config import get_tier_features

        features = get_tier_features(SubscriptionTier.PREMIER)
        assert features["kiaan_questions_monthly"] == -1  # Unlimited
        assert features["white_label"] is False
        assert features["sso"] is False
        assert features["dedicated_support"] is True
        assert features["wisdom_journeys_limit"] == -1  # Unlimited

    def test_has_feature_access(self):
        """Test has_feature_access function."""
        from backend.config.feature_config import has_feature_access
        
        # Free tier should NOT have journal access
        assert has_feature_access(SubscriptionTier.FREE, "encrypted_journal") is False
        
        # Basic tier should have journal access
        assert has_feature_access(SubscriptionTier.BASIC, "encrypted_journal") is True
        
        # Free tier should have mood tracking
        assert has_feature_access(SubscriptionTier.FREE, "mood_tracking") is True

    def test_get_kiaan_quota(self):
        """Test get_kiaan_quota function."""
        from backend.config.feature_config import get_kiaan_quota

        assert get_kiaan_quota(SubscriptionTier.FREE) == 15
        assert get_kiaan_quota(SubscriptionTier.BASIC) == 150
        assert get_kiaan_quota(SubscriptionTier.PREMIUM) == 300
        assert get_kiaan_quota(SubscriptionTier.ENTERPRISE) == 800  # Elite tier
        assert get_kiaan_quota(SubscriptionTier.PREMIER) == -1  # Premier — unlimited


class TestSubscriptionModels:
    """Test subscription models."""

    @pytest.mark.asyncio
    async def test_create_subscription_plan(self, test_db: AsyncSession):
        """Test creating a subscription plan."""
        plan = SubscriptionPlan(
            tier=SubscriptionTier.FREE,
            name="Free",
            description="Free tier description",
            price_monthly=Decimal("0.00"),
            features={"kiaan_questions_monthly": 10},
            kiaan_questions_monthly=10,
            encrypted_journal=False,
            data_retention_days=30,
        )
        test_db.add(plan)
        await test_db.commit()
        await test_db.refresh(plan)

        assert plan.id is not None
        assert plan.tier == SubscriptionTier.FREE
        assert plan.price_monthly == Decimal("0.00")
        assert plan.kiaan_questions_monthly == 10
        assert plan.encrypted_journal is False

    @pytest.mark.asyncio
    async def test_create_user_subscription(self, test_db: AsyncSession):
        """Test creating a user subscription."""
        # Create user
        user = User(
            auth_uid="sub-test-user",
            email="sub@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create plan
        plan = SubscriptionPlan(
            tier=SubscriptionTier.BASIC,
            name="Basic",
            price_monthly=Decimal("9.99"),
            kiaan_questions_monthly=100,
            encrypted_journal=True,
            data_retention_days=365,
        )
        test_db.add(plan)
        await test_db.commit()
        await test_db.refresh(plan)

        # Create subscription
        now = datetime.now(UTC)
        subscription = UserSubscription(
            user_id=user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
        )
        test_db.add(subscription)
        await test_db.commit()
        await test_db.refresh(subscription)

        assert subscription.id is not None
        assert subscription.user_id == user.id
        assert subscription.plan_id == plan.id
        assert subscription.status == SubscriptionStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_create_usage_tracking(self, test_db: AsyncSession):
        """Test creating a usage tracking record."""
        # Create user
        user = User(
            auth_uid="usage-test-user",
            email="usage@example.com",
            hashed_password="hashed_password",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create usage tracking
        now = datetime.now(UTC)
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_end = period_start.replace(month=period_start.month + 1) if period_start.month < 12 else period_start.replace(year=period_start.year + 1, month=1)

        usage = UsageTracking(
            user_id=user.id,
            feature="kiaan_questions",
            period_start=period_start,
            period_end=period_end,
            usage_count=5,
            usage_limit=20,
        )
        test_db.add(usage)
        await test_db.commit()
        await test_db.refresh(usage)

        assert usage.id is not None
        assert usage.user_id == user.id
        assert usage.feature == "kiaan_questions"
        assert usage.usage_count == 5
        assert usage.usage_limit == 20


class TestSubscriptionStatusEnum:
    """Test subscription status enum values."""

    def test_subscription_status_values(self):
        """Test that all expected status values exist."""
        assert SubscriptionStatus.ACTIVE.value == "active"
        assert SubscriptionStatus.PAST_DUE.value == "past_due"
        assert SubscriptionStatus.CANCELED.value == "canceled"
        assert SubscriptionStatus.EXPIRED.value == "expired"
        assert SubscriptionStatus.TRIALING.value == "trialing"


class TestSubscriptionTierEnum:
    """Test subscription tier enum values."""

    def test_subscription_tier_values(self):
        """Test that all expected tier values exist."""
        assert SubscriptionTier.FREE.value == "free"
        assert SubscriptionTier.BASIC.value == "basic"
        assert SubscriptionTier.PREMIUM.value == "premium"
        assert SubscriptionTier.ENTERPRISE.value == "enterprise"
        assert SubscriptionTier.PREMIER.value == "premier"
