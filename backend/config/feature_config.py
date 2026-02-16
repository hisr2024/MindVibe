"""Feature configuration for subscription tiers.

Defines which features are available for each subscription tier.
"""

from typing import Any

from backend.models import SubscriptionTier


# Feature configurations for each tier
# kiaan_questions_monthly: -1 = unlimited
TIER_FEATURES: dict[SubscriptionTier, dict[str, Any]] = {
    SubscriptionTier.FREE: {
        "kiaan_questions_monthly": 15,
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
        # Wisdom Journeys - Trial access for free users
        "wisdom_journeys": True,  # Allow trial access
        "wisdom_journeys_limit": 1,  # 1 trial journey
        "wisdom_journeys_trial": True,  # This is a trial (limited to 3 days)
        "wisdom_journeys_trial_days": 3,  # Trial limited to first 3 days
        # KIAAN Ecosystem - Gated per tier
        "kiaan_divine_chat": True,  # Basic divine chat allowed
        "kiaan_friend_mode": True,  # Friend mode allowed (shares quota)
        "kiaan_voice_companion": False,  # Voice companion is Premium+
        "kiaan_agent": False,  # Agent is Premium+
        "kiaan_soul_reading": False,  # Soul reading is Premium+
        "kiaan_voice_synthesis": False,  # Voice synthesis is Basic+
        "kiaan_quantum_dive": False,  # Quantum dive is Premium+
    },
    SubscriptionTier.BASIC: {
        "kiaan_questions_monthly": 150,
        "encrypted_journal": True,
        "mood_tracking": True,
        "wisdom_access": True,
        "advanced_analytics": False,
        "priority_support": False,
        "offline_access": False,
        "white_label": False,
        "sso": False,
        "dedicated_support": False,
        "data_retention_days": 365,
        # Wisdom Journeys - Access for Basic
        "wisdom_journeys": True,
        "wisdom_journeys_limit": 3,  # Can have 3 active journeys
        # KIAAN Ecosystem
        "kiaan_divine_chat": True,
        "kiaan_friend_mode": True,
        "kiaan_voice_companion": False,  # Voice companion is Premium+
        "kiaan_agent": False,  # Agent is Premium+
        "kiaan_soul_reading": False,  # Soul reading is Premium+
        "kiaan_voice_synthesis": True,  # Voice synthesis unlocked
        "kiaan_quantum_dive": False,  # Quantum dive is Premium+
    },
    SubscriptionTier.PREMIUM: {
        "kiaan_questions_monthly": 300,
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
        # Wisdom Journeys - Full access for Premium
        "wisdom_journeys": True,
        "wisdom_journeys_limit": 10,  # Can have up to 10 active journeys
        # KIAAN Ecosystem - Full access
        "kiaan_divine_chat": True,
        "kiaan_friend_mode": True,
        "kiaan_voice_companion": True,
        "kiaan_agent": True,
        "kiaan_soul_reading": True,
        "kiaan_voice_synthesis": True,
        "kiaan_quantum_dive": True,
    },
    # NOTE: Enterprise tier is no longer offered to new subscribers.
    # Kept here for backward compatibility with existing enterprise users.
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
        # Wisdom Journeys - Unlimited for Enterprise
        "wisdom_journeys": True,
        "wisdom_journeys_limit": -1,  # Unlimited active journeys
        # KIAAN Ecosystem - Full unlimited access
        "kiaan_divine_chat": True,
        "kiaan_friend_mode": True,
        "kiaan_voice_companion": True,
        "kiaan_agent": True,
        "kiaan_soul_reading": True,
        "kiaan_voice_synthesis": True,
        "kiaan_quantum_dive": True,
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


def get_wisdom_journeys_limit(tier: SubscriptionTier) -> int:
    """Get the Wisdom Journeys limit for a tier.

    Args:
        tier: The subscription tier.

    Returns:
        int: Maximum active journeys allowed (-1 = unlimited, 0 = no access).
    """
    return get_tier_features(tier).get("wisdom_journeys_limit", 0)


def is_wisdom_journeys_trial(tier: SubscriptionTier) -> bool:
    """Check if the tier has trial access to Wisdom Journeys.

    Args:
        tier: The subscription tier.

    Returns:
        bool: True if this is trial access (limited days).
    """
    return get_tier_features(tier).get("wisdom_journeys_trial", False)


def get_wisdom_journeys_trial_days(tier: SubscriptionTier) -> int:
    """Get the trial days limit for Wisdom Journeys.

    Args:
        tier: The subscription tier.

    Returns:
        int: Maximum days allowed in trial (0 = no limit).
    """
    return get_tier_features(tier).get("wisdom_journeys_trial_days", 0)
