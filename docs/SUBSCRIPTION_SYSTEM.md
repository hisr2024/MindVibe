# Subscription System Documentation

## Overview

MindVibe uses a subscription-based monetization system with four tiers: Free, Basic, Premium, and Enterprise. The system is designed to protect KIAAN's core functionality while providing premium features for paying subscribers.

## KIAAN Protection Rules

**Critical:** These rules ensure KIAAN's core value is preserved:

1. **Free Tier: 10 KIAAN questions/month maximum**
2. **Encrypted Journal: Subscribers only** (Basic tier and above)
3. **Response Quality: Unchanged across all tiers** - KIAAN provides the same quality of wisdom regardless of subscription level
4. **Privacy: All encryption and security maintained**

## Subscription Tiers

### FREE (Default)
- **Price:** $0/month
- **KIAAN Questions:** 10/month
- **Encrypted Journal:** ❌
- **Mood Tracking:** ✅
- **Wisdom Access:** ✅
- **Data Retention:** 30 days

### BASIC ($9.99/month)
- **Price:** $9.99/month or $99.99/year
- **KIAAN Questions:** 100/month
- **Encrypted Journal:** ✅
- **Mood Tracking:** ✅
- **Wisdom Access:** ✅
- **Advanced Analytics:** ✅
- **Data Retention:** 365 days

### PREMIUM ($19.99/month)
- **Price:** $19.99/month or $199.99/year
- **KIAAN Questions:** Unlimited
- **Encrypted Journal:** ✅
- **All Basic Features:** ✅
- **Priority Support:** ✅
- **Offline Access:** ✅
- **Data Retention:** Unlimited

### ENTERPRISE ($499/month)
- **Price:** $499/month or $4,999/year
- **KIAAN Questions:** Unlimited
- **All Premium Features:** ✅
- **White Label:** ✅
- **SSO:** ✅
- **Dedicated Support:** ✅
- **Data Retention:** Unlimited

## Architecture

### Database Models

```
subscription_plans
├── id (PK)
├── tier (ENUM: free, basic, premium, enterprise)
├── name
├── description
├── price_monthly
├── price_yearly
├── stripe_price_id_monthly
├── stripe_price_id_yearly
├── features (JSON)
├── kiaan_questions_monthly
├── encrypted_journal
├── data_retention_days
└── is_active

user_subscriptions
├── id (PK)
├── user_id (FK → users)
├── plan_id (FK → subscription_plans)
├── status (ENUM: active, past_due, canceled, expired, trialing)
├── stripe_customer_id
├── stripe_subscription_id
├── current_period_start
├── current_period_end
├── cancel_at_period_end
└── canceled_at

usage_tracking
├── id (PK)
├── user_id (FK → users)
├── feature (e.g., "kiaan_questions")
├── period_start
├── period_end
├── usage_count
└── usage_limit

payments
├── id (PK)
├── user_id (FK → users)
├── subscription_id (FK → user_subscriptions)
├── stripe_payment_intent_id
├── stripe_invoice_id
├── amount
├── currency
├── status (ENUM: pending, succeeded, failed, refunded)
└── description
```

### Services

#### `backend/services/subscription_service.py`
- `get_user_subscription()` - Get user's current subscription
- `get_or_create_free_subscription()` - Auto-assign free tier to new users
- `check_kiaan_quota()` - Check if user has remaining KIAAN questions
- `increment_kiaan_usage()` - Increment usage after successful response
- `check_journal_access()` - Check if user can access encrypted journal
- `get_usage_stats()` - Get current usage statistics

#### `backend/services/stripe_service.py`
- `create_stripe_customer()` - Create Stripe customer
- `create_checkout_session()` - Create Stripe checkout for subscription purchase
- `cancel_subscription()` - Cancel a subscription
- `verify_webhook_signature()` - Verify Stripe webhook authenticity
- `handle_webhook_event()` - Process Stripe webhook events

### Middleware

#### `backend/middleware/feature_access.py`
- `require_subscription` - Ensures user has active subscription
- `require_kiaan_quota` - Enforces question limit for free tier
- `require_journal_access` - Blocks free tier from journal
- `require_feature(feature_name)` - Generic feature guard

## API Endpoints

### Subscriptions (`/api/subscriptions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tiers` | List available subscription plans |
| GET | `/current` | Get user's current subscription |
| POST | `/checkout` | Create Stripe checkout session |
| POST | `/cancel` | Cancel subscription |
| POST | `/webhook` | Stripe webhook handler |
| GET | `/usage` | Get usage statistics |

### Example Responses

#### GET /api/subscriptions/tiers
```json
[
  {
    "id": 1,
    "tier": "free",
    "name": "Free",
    "description": "Get started with MindVibe core features",
    "price_monthly": "0.00",
    "price_yearly": null,
    "features": {...},
    "kiaan_questions_monthly": 10,
    "encrypted_journal": false,
    "data_retention_days": 30
  }
]
```

#### GET /api/subscriptions/usage
```json
{
  "feature": "kiaan_questions",
  "period_start": "2024-01-01T00:00:00Z",
  "period_end": "2024-02-01T00:00:00Z",
  "usage_count": 5,
  "usage_limit": 10,
  "remaining": 5,
  "is_unlimited": false
}
```

## Stripe Integration

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (create in Stripe Dashboard)
STRIPE_BASIC_MONTHLY_PRICE_ID=price_...
STRIPE_BASIC_YEARLY_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_...
```

### Webhook Events Handled

- `checkout.session.completed` - Subscription purchase completed
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

### Setting Up Stripe

1. Create a Stripe account at https://dashboard.stripe.com
2. Create products for each subscription tier
3. Create prices (monthly and yearly) for each product
4. Copy the price IDs to your environment variables
5. Set up webhook endpoint to `/api/subscriptions/webhook`
6. Copy the webhook signing secret

## Usage Tracking

### Quota Reset

Usage quotas reset at the beginning of each calendar month (UTC). The system tracks:
- Current usage count
- Usage limit based on tier
- Period start and end dates

### Quota Enforcement

When a free tier user reaches their 10 question limit:

```json
{
  "status": "error",
  "response": "You've reached your monthly limit of KIAAN conversations. 💙 Upgrade your plan to continue our journey together.",
  "error_code": "quota_exceeded",
  "usage_count": 10,
  "usage_limit": 10,
  "upgrade_url": "/subscription/upgrade"
}
```

## Security Considerations

1. **Webhook Verification**: All Stripe webhooks are verified using the webhook signature
2. **No Card Storage**: Credit card data is never stored - handled entirely by Stripe
3. **Database Transactions**: Quota updates use transactions to prevent race conditions
4. **Graceful Degradation**: If subscription service fails, system allows access (fail-open for availability)
5. **Existing Security**: All existing encryption and security measures for journals are maintained

## Testing

### Running Tests

```bash
# Run subscription-related tests
pytest tests/unit/test_subscription_service.py -v
pytest tests/unit/test_feature_access.py -v

# Run all tests
pytest tests/ -v
```

### Test Coverage Requirements

- All subscription service functions must be tested
- Feature access middleware must be tested
- Stripe webhook handling must be tested
- Quota enforcement must be thoroughly tested

## Database Migration

Apply the subscription system migration:

```bash
# Migration is automatically applied on startup if RUN_MIGRATIONS_ON_STARTUP=true
# Or manually apply:
# The migration file: migrations/20251202_add_subscription_system.sql
```

## Seed Data

Seed the subscription plans:

```bash
python -m backend.scripts.seed_subscription_plans
```

This creates the four subscription tiers with their default features and pricing.
