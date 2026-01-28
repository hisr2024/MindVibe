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
        """Test that free tier has 20 questions limit."""
        from backend.config.feature_config import get_kiaan_quota

        quota = get_kiaan_quota(SubscriptionTier.FREE)
        assert quota == 20

    def test_basic_tier_limit(self):
        """Test that basic tier has 50 questions limit."""
        from backend.config.feature_config import get_kiaan_quota

        quota = get_kiaan_quota(SubscriptionTier.BASIC)
        assert quota == 50

    def test_premium_tier_limit(self):
        """Test that premium tier has 300 questions limit."""
        from backend.config.feature_config import get_kiaan_quota

        quota = get_kiaan_quota(SubscriptionTier.PREMIUM)
        assert quota == 300

    def test_enterprise_tier_unlimited(self):
        """Test that enterprise tier has unlimited questions."""
        from backend.config.feature_config import get_kiaan_quota

        quota = get_kiaan_quota(SubscriptionTier.ENTERPRISE)
        assert quota == -1  # -1 means unlimited


class TestJournalAccessControl:
    """Test journal access control logic."""

    def test_free_tier_no_journal(self):
        """Test that free tier cannot access journal."""
        from backend.config.feature_config import has_feature_access
        
        has_access = has_feature_access(SubscriptionTier.FREE, "encrypted_journal")
        assert has_access is False

    def test_basic_tier_has_journal(self):
        """Test that basic tier can access journal."""
        from backend.config.feature_config import has_feature_access
        
        has_access = has_feature_access(SubscriptionTier.BASIC, "encrypted_journal")
        assert has_access is True

    def test_premium_tier_has_journal(self):
        """Test that premium tier can access journal."""
        from backend.config.feature_config import has_feature_access
        
        has_access = has_feature_access(SubscriptionTier.PREMIUM, "encrypted_journal")
        assert has_access is True

    def test_enterprise_tier_has_journal(self):
        """Test that enterprise tier can access journal."""
        from backend.config.feature_config import has_feature_access
        
        has_access = has_feature_access(SubscriptionTier.ENTERPRISE, "encrypted_journal")
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

    def test_basic_tier_features(self):
        """Test all features for basic tier."""
        from backend.config.feature_config import has_feature_access

        # Should have
        assert has_feature_access(SubscriptionTier.BASIC, "mood_tracking") is True
        assert has_feature_access(SubscriptionTier.BASIC, "wisdom_access") is True
        assert has_feature_access(SubscriptionTier.BASIC, "encrypted_journal") is True

        # Should NOT have
        assert has_feature_access(SubscriptionTier.BASIC, "advanced_analytics") is False
        assert has_feature_access(SubscriptionTier.BASIC, "priority_support") is False
        assert has_feature_access(SubscriptionTier.BASIC, "offline_access") is False
        assert has_feature_access(SubscriptionTier.BASIC, "white_label") is False
        assert has_feature_access(SubscriptionTier.BASIC, "sso") is False

    def test_premium_tier_features(self):
        """Test all features for premium tier."""
        from backend.config.feature_config import has_feature_access
        
        # Should have all basic features plus premium
        assert has_feature_access(SubscriptionTier.PREMIUM, "encrypted_journal") is True
        assert has_feature_access(SubscriptionTier.PREMIUM, "advanced_analytics") is True
        assert has_feature_access(SubscriptionTier.PREMIUM, "priority_support") is True
        assert has_feature_access(SubscriptionTier.PREMIUM, "offline_access") is True
        
        # Should NOT have enterprise-only features
        assert has_feature_access(SubscriptionTier.PREMIUM, "white_label") is False
        assert has_feature_access(SubscriptionTier.PREMIUM, "sso") is False

    def test_enterprise_tier_features(self):
        """Test all features for enterprise tier."""
        from backend.config.feature_config import has_feature_access
        
        # Should have ALL features
        assert has_feature_access(SubscriptionTier.ENTERPRISE, "encrypted_journal") is True
        assert has_feature_access(SubscriptionTier.ENTERPRISE, "advanced_analytics") is True
        assert has_feature_access(SubscriptionTier.ENTERPRISE, "priority_support") is True
        assert has_feature_access(SubscriptionTier.ENTERPRISE, "offline_access") is True
        assert has_feature_access(SubscriptionTier.ENTERPRISE, "white_label") is True
        assert has_feature_access(SubscriptionTier.ENTERPRISE, "sso") is True
        assert has_feature_access(SubscriptionTier.ENTERPRISE, "dedicated_support") is True


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
