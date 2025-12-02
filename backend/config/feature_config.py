"""Feature configuration for subscription tiers.

Defines which features are available for each subscription tier.
"""

from typing import Any

from backend.models import SubscriptionTier


# Feature configurations for each tier
# kiaan_questions_monthly: -1 = unlimited
TIER_FEATURES: dict[SubscriptionTier, dict[str, Any]] = {
    SubscriptionTier.FREE: {
        "kiaan_questions_monthly": 10,
        "encrypted_journal": False,
        "mood_tracking": True,
        "wisdom_access": True,
        "advanced_analytics": False,
        "priority_support": False,
        "offline_access": False,
        "white_label": False,
        "sso": False,
        "dedicated_support": False,
        "data_retention_days": 30,
    },
    SubscriptionTier.BASIC: {
        "kiaan_questions_monthly": 100,
        "encrypted_journal": True,
        "mood_tracking": True,
        "wisdom_access": True,
        "advanced_analytics": True,
        "priority_support": False,
        "offline_access": False,
        "white_label": False,
        "sso": False,
        "dedicated_support": False,
        "data_retention_days": 365,
    },
    SubscriptionTier.PREMIUM: {
        "kiaan_questions_monthly": -1,  # Unlimited
        "encrypted_journal": True,
        "mood_tracking": True,
        "wisdom_access": True,
        "advanced_analytics": True,
        "priority_support": True,
        "offline_access": True,
        "white_label": False,
        "sso": False,
        "dedicated_support": False,
        "data_retention_days": -1,  # Unlimited retention
    },
    SubscriptionTier.ENTERPRISE: {
        "kiaan_questions_monthly": -1,  # Unlimited
        "encrypted_journal": True,
        "mood_tracking": True,
        "wisdom_access": True,
        "advanced_analytics": True,
        "priority_support": True,
        "offline_access": True,
        "white_label": True,
        "sso": True,
        "dedicated_support": True,
        "data_retention_days": -1,  # Unlimited retention
    },
}


def get_tier_features(tier: SubscriptionTier) -> dict[str, Any]:
    """Get the feature configuration for a given tier.
    
    Args:
        tier: The subscription tier.
        
    Returns:
        dict: Feature configuration for the tier.
    """
    return TIER_FEATURES.get(tier, TIER_FEATURES[SubscriptionTier.FREE])


def has_feature_access(tier: SubscriptionTier, feature: str) -> bool:
    """Check if a tier has access to a specific feature.
    
    Args:
        tier: The subscription tier.
        feature: The feature name to check.
        
    Returns:
        bool: True if the tier has access to the feature.
    """
    features = get_tier_features(tier)
    feature_value = features.get(feature)
    
    if feature_value is None:
        return False
    
    # For boolean features
    if isinstance(feature_value, bool):
        return feature_value
    
    # For numeric features (quotas), any positive value or -1 (unlimited) grants access
    if isinstance(feature_value, int):
        return feature_value != 0
    
    return True


def get_kiaan_quota(tier: SubscriptionTier) -> int:
    """Get the KIAAN questions quota for a tier.
    
    Args:
        tier: The subscription tier.
        
    Returns:
        int: Monthly KIAAN questions limit (-1 = unlimited).
    """
    return get_tier_features(tier).get("kiaan_questions_monthly", 10)
