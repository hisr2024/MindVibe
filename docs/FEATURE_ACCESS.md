# Feature Access Control Guide

## Overview

MindVibe uses a feature access control system to manage which features are available to users based on their subscription tier. This guide explains how to use the feature access middleware in your code.

## Quick Start

### Checking Feature Access in Routes

```python
from fastapi import Depends
from backend.middleware.feature_access import (
    require_subscription,
    require_kiaan_quota,
    require_journal_access,
    require_feature,
)

# Require any active subscription
@router.get("/protected")
async def protected_route(user_id: int = Depends(require_subscription)):
    return {"message": "You have an active subscription"}

# Require KIAAN quota (enforces 5 question limit for free tier)
@router.post("/chat")
async def chat_route(quota_info: tuple = Depends(require_kiaan_quota)):
    user_id, usage_count, usage_limit = quota_info
    return {"user_id": user_id, "remaining": usage_limit - usage_count}

# Require journal access (Sadhak+ subscribers only)
@router.post("/journal")
async def journal_route(user_id: int = Depends(require_journal_access)):
    return {"message": "You can access your journal"}

# Require a specific feature
@router.get("/analytics")
async def analytics_route(user_id: int = Depends(require_feature("advanced_analytics"))):
    return {"message": "You have access to advanced analytics"}
```

## Available Dependencies

### `require_subscription`

Ensures the user has an active subscription (including free tier).

**Returns:** `int` - The user ID

**Raises:**
- `402 Payment Required` if subscription is expired or canceled

### `require_kiaan_quota`

Enforces KIAAN question limits based on subscription tier.

**Returns:** `tuple[int, int, int]` - (user_id, usage_count, usage_limit)

**Raises:**
- `429 Too Many Requests` if user has exceeded their quota

**Example Response when quota exceeded:**
```json
{
  "error": "quota_exceeded",
  "message": "You have reached your monthly limit of 5 KIAAN questions. Upgrade your subscription for more questions.",
  "usage_count": 5,
  "usage_limit": 5,
  "tier": "free",
  "upgrade_url": "/subscription/upgrade"
}
```

### `require_journal_access`

Ensures the user has access to the encrypted journal feature (Sadhak tier or higher).

**Returns:** `int` - The user ID

**Raises:**
- `403 Forbidden` if user doesn't have journal access

**Example Response:**
```json
{
  "error": "feature_not_available",
  "feature": "encrypted_journal",
  "message": "Encrypted journal is a Sadhak feature. Upgrade to Sadhak or higher to access your private journal.",
  "tier": "free",
  "upgrade_url": "/subscription/upgrade"
}
```

### `require_feature(feature_name)`

Generic feature guard that checks if the user has access to a specific feature.

**Parameters:**
- `feature_name` - The name of the feature to check

**Returns:** `int` - The user ID

**Raises:**
- `403 Forbidden` if user doesn't have access to the feature

## Feature Names

Available feature names that can be checked:

| Feature Name | FREE | SADHAK | SIDDHA |
|-------------|------|--------|--------|
| `mood_tracking` | yes | yes | yes |
| `wisdom_access` | yes | yes | yes |
| `encrypted_journal` | no | yes | yes |
| `advanced_analytics` | no | yes | yes |
| `priority_support` | no | yes | yes |
| `offline_access` | no | yes | yes |
| `dedicated_support` | no | no | yes |
| `white_label` | no | no | no |
| `sso` | no | no | no |

## Using the Service Layer

For more control, you can use the subscription service directly:

```python
from backend.services.subscription_service import (
    get_user_subscription,
    get_user_tier,
    check_feature_access,
    check_kiaan_quota,
    check_journal_access,
    increment_kiaan_usage,
    get_usage_stats,
)

# Get user's subscription
subscription = await get_user_subscription(db, user_id)

# Get user's tier
tier = await get_user_tier(db, user_id)

# Check if user can access a feature
has_access = await check_feature_access(db, user_id, "advanced_analytics")

# Check KIAAN quota
has_quota, usage_count, usage_limit = await check_kiaan_quota(db, user_id)

# Increment KIAAN usage
await increment_kiaan_usage(db, user_id)

# Get usage statistics
stats = await get_usage_stats(db, user_id, "kiaan_questions")
```

## Feature Configuration

Features are configured in `backend/config/feature_config.py`:

```python
from backend.config.feature_config import (
    TIER_FEATURES,
    get_tier_features,
    has_feature_access,
    get_kiaan_quota,
)

# Get all features for a tier
features = get_tier_features(SubscriptionTier.SADHAK)

# Check if a tier has access to a feature
has_access = has_feature_access(SubscriptionTier.FREE, "encrypted_journal")

# Get KIAAN quota for a tier
quota = get_kiaan_quota(SubscriptionTier.FREE)  # Returns 5
quota = get_kiaan_quota(SubscriptionTier.SIDDHA)  # Returns -1 (unlimited)
```

## Graceful Degradation

The system is designed to fail gracefully:

1. **Import Errors**: If subscription modules can't be imported, routes continue to work without feature restrictions
2. **Service Errors**: If quota checking fails, access is allowed (logged for debugging)
3. **Database Errors**: If the subscription tables aren't available, users aren't blocked

This ensures the application remains functional even if there are issues with the subscription system.

## Best Practices

1. **Always use dependencies** instead of manual checks when possible
2. **Check quota before processing** expensive operations
3. **Increment usage after success** - don't count failed attempts
4. **Provide clear error messages** with upgrade paths
5. **Log quota-related events** for debugging
6. **Don't differentiate response quality** based on tier - KIAAN should be equally helpful to all users

## Testing Feature Access

```python
import pytest
from backend.config.feature_config import has_feature_access, get_kiaan_quota
from backend.models import SubscriptionTier

def test_free_tier_no_journal():
    assert has_feature_access(SubscriptionTier.FREE, "encrypted_journal") is False

def test_sadhak_tier_has_journal():
    assert has_feature_access(SubscriptionTier.SADHAK, "encrypted_journal") is True

def test_free_tier_quota():
    assert get_kiaan_quota(SubscriptionTier.FREE) == 5

def test_siddha_unlimited():
    assert get_kiaan_quota(SubscriptionTier.SIDDHA) == -1
```
