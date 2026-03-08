"""
Unit tests for feature access middleware.

Tests the feature access control middleware including:
- Subscription requirement
- KIAAN quota enforcement
- Journal access control
- Generic feature guards
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException

from backend.models import SubscriptionTier, SubscriptionStatus


class TestFeatureAccessDependencies:
    """Test feature access dependency classes."""

    @pytest.mark.asyncio
    async def test_subscription_required_import(self):
        """Test that subscription requirement dependencies can be imported."""
        from backend.middleware.feature_access import (
            SubscriptionRequired,
            KiaanQuotaRequired,
            JournalAccessRequired,
            FeatureRequired,
            require_subscription,
            require_kiaan_quota,
            require_journal_access,
            require_feature,
        )

        # Verify instances exist
        assert require_subscription is not None
        assert require_kiaan_quota is not None
        assert require_journal_access is not None

        # Verify factory function works
        feature_dep = require_feature("advanced_analytics")
        assert isinstance(feature_dep, FeatureRequired)
        assert feature_dep.feature_name == "advanced_analytics"

    @pytest.mark.asyncio
    async def test_feature_required_initialization(self):
        """Test FeatureRequired initialization with different features."""
        from backend.middleware.feature_access import FeatureRequired

        # Test with different feature names
        journal_guard = FeatureRequired("encrypted_journal")
        assert journal_guard.feature_name == "encrypted_journal"

        analytics_guard = FeatureRequired("advanced_analytics")
        assert analytics_guard.feature_name == "advanced_analytics"

        sso_guard = FeatureRequired("sso")
        assert sso_guard.feature_name == "sso"


class TestGetCurrentUserId:
    """Test the get_current_user_id helper function."""

    @pytest.mark.asyncio
    async def test_get_current_user_id_import(self):
        """Test that get_current_user_id can be imported."""
        from backend.middleware.feature_access import get_current_user_id

        assert callable(get_current_user_id)


class TestQuotaEnforcement:
    """Test quota enforcement logic."""

    def test_free_tier_limit(self):
        """Test that free tier has 5 questions limit."""
        from backend.config.feature_config import get_kiaan_quota

        quota = get_kiaan_quota(SubscriptionTier.FREE)
        assert quota == 5

    def test_sadhak_tier_limit(self):
        """Test that Sadhak tier has 300 questions limit."""
        from backend.config.feature_config import get_kiaan_quota

        quota = get_kiaan_quota(SubscriptionTier.SADHAK)
        assert quota == 300

    def test_siddha_tier_unlimited(self):
        """Test that Siddha tier has unlimited questions."""
        from backend.config.feature_config import get_kiaan_quota

        quota = get_kiaan_quota(SubscriptionTier.SIDDHA)
        assert quota == -1  # -1 means unlimited


class TestJournalAccessControl:
    """Test journal access control logic."""

    def test_free_tier_no_journal(self):
        """Test that free tier cannot access journal."""
        from backend.config.feature_config import has_feature_access

        has_access = has_feature_access(SubscriptionTier.FREE, "encrypted_journal")
        assert has_access is False

    def test_sadhak_tier_has_journal(self):
        """Test that Sadhak tier can access journal."""
        from backend.config.feature_config import has_feature_access

        has_access = has_feature_access(SubscriptionTier.SADHAK, "encrypted_journal")
        assert has_access is True

    def test_siddha_tier_has_journal(self):
        """Test that Siddha tier can access journal."""
        from backend.config.feature_config import has_feature_access

        has_access = has_feature_access(SubscriptionTier.SIDDHA, "encrypted_journal")
        assert has_access is True


class TestFeatureAccessMatrix:
    """Test the complete feature access matrix."""

    def test_free_tier_features(self):
        """Test all features for free tier."""
        from backend.config.feature_config import has_feature_access

        # Should have
        assert has_feature_access(SubscriptionTier.FREE, "mood_tracking") is True
        assert has_feature_access(SubscriptionTier.FREE, "wisdom_access") is True

        # Should NOT have
        assert has_feature_access(SubscriptionTier.FREE, "encrypted_journal") is False
        assert has_feature_access(SubscriptionTier.FREE, "advanced_analytics") is False
        assert has_feature_access(SubscriptionTier.FREE, "priority_support") is False
        assert has_feature_access(SubscriptionTier.FREE, "offline_access") is False
        assert has_feature_access(SubscriptionTier.FREE, "white_label") is False
        assert has_feature_access(SubscriptionTier.FREE, "sso") is False

    def test_sadhak_tier_features(self):
        """Test all features for Sadhak tier."""
        from backend.config.feature_config import has_feature_access

        # Should have
        assert has_feature_access(SubscriptionTier.SADHAK, "mood_tracking") is True
        assert has_feature_access(SubscriptionTier.SADHAK, "wisdom_access") is True
        assert has_feature_access(SubscriptionTier.SADHAK, "encrypted_journal") is True
        assert has_feature_access(SubscriptionTier.SADHAK, "advanced_analytics") is True
        assert has_feature_access(SubscriptionTier.SADHAK, "priority_support") is True
        assert has_feature_access(SubscriptionTier.SADHAK, "offline_access") is True

        # Should NOT have
        assert has_feature_access(SubscriptionTier.SADHAK, "white_label") is False
        assert has_feature_access(SubscriptionTier.SADHAK, "sso") is False
        assert has_feature_access(SubscriptionTier.SADHAK, "dedicated_support") is False

    def test_siddha_tier_features(self):
        """Test all features for Siddha tier."""
        from backend.config.feature_config import has_feature_access

        # Should have all features
        assert has_feature_access(SubscriptionTier.SIDDHA, "encrypted_journal") is True
        assert has_feature_access(SubscriptionTier.SIDDHA, "advanced_analytics") is True
        assert has_feature_access(SubscriptionTier.SIDDHA, "priority_support") is True
        assert has_feature_access(SubscriptionTier.SIDDHA, "offline_access") is True
        assert has_feature_access(SubscriptionTier.SIDDHA, "dedicated_support") is True

        # White label and SSO still not included
        assert has_feature_access(SubscriptionTier.SIDDHA, "white_label") is False
        assert has_feature_access(SubscriptionTier.SIDDHA, "sso") is False


class TestKiaanResponseQuality:
    """Test that KIAAN response quality is unchanged across tiers.

    Critical requirement: Response quality must be identical regardless of tier.
    """

    def test_no_quality_differentiation_in_features(self):
        """Verify there's no 'response_quality' or similar feature that differs by tier."""
        from backend.config.feature_config import TIER_FEATURES

        # Check that no tier has a 'response_quality' or similar field
        quality_related_keys = [
            "response_quality",
            "ai_quality",
            "model_tier",
            "response_length",
            "ai_model",
        ]

        for tier, features in TIER_FEATURES.items():
            for key in quality_related_keys:
                assert key not in features, f"Tier {tier} should not have quality-related feature: {key}"


class TestWisdomJourneysAccess:
    """Test Wisdom Journeys access across tiers.

    Critical: FREE tier should have trial access (1 journey, 3 days).
    """

    def test_free_tier_has_trial_access(self):
        """Test that FREE tier has trial access to Wisdom Journeys."""
        from backend.config.feature_config import (
            get_wisdom_journeys_limit,
            is_wisdom_journeys_trial,
            get_wisdom_journeys_trial_days,
            has_feature_access,
        )

        # FREE tier should have trial access
        assert has_feature_access(SubscriptionTier.FREE, "wisdom_journeys") is True
        assert get_wisdom_journeys_limit(SubscriptionTier.FREE) == 1
        assert is_wisdom_journeys_trial(SubscriptionTier.FREE) is True
        assert get_wisdom_journeys_trial_days(SubscriptionTier.FREE) == 3

    def test_sadhak_tier_wisdom_journeys(self):
        """Test that SADHAK tier has full Wisdom Journeys access with 10 journeys."""
        from backend.config.feature_config import (
            get_wisdom_journeys_limit,
            is_wisdom_journeys_trial,
            has_feature_access,
        )

        assert has_feature_access(SubscriptionTier.SADHAK, "wisdom_journeys") is True
        assert get_wisdom_journeys_limit(SubscriptionTier.SADHAK) == 10
        assert is_wisdom_journeys_trial(SubscriptionTier.SADHAK) is False

    def test_siddha_tier_unlimited_journeys(self):
        """Test that SIDDHA tier has unlimited journeys."""
        from backend.config.feature_config import (
            get_wisdom_journeys_limit,
            has_feature_access,
        )

        assert has_feature_access(SubscriptionTier.SIDDHA, "wisdom_journeys") is True
        assert get_wisdom_journeys_limit(SubscriptionTier.SIDDHA) == -1  # Unlimited
