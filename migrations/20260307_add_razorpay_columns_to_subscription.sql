-- Migration: Add missing Razorpay columns to subscription-related tables
-- Dependencies: Requires 20251202_add_subscription_system.sql
-- Purpose: The SQLAlchemy model defines razorpay_plan_id_monthly and
--          razorpay_plan_id_yearly on subscription_plans, plus Razorpay and
--          payment_provider columns on user_subscriptions and payments, but
--          the original migration never created them. This causes
--          asyncpg.exceptions.UndefinedColumnError at runtime.
--
-- Also relaxes the tier CHECK constraint to include the 'premier' tier
-- which was added to the SubscriptionTier enum after the initial migration.
--
-- Idempotent: Safe to run multiple times (uses IF NOT EXISTS / exception handling).

-- ============================================================
-- 1. subscription_plans: Add Razorpay plan ID columns
-- ============================================================
ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS razorpay_plan_id_monthly VARCHAR(128);

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS razorpay_plan_id_yearly VARCHAR(128);

-- ============================================================
-- 2. user_subscriptions: Add Razorpay and payment_provider columns
-- ============================================================
ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(128);

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(128);

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(32) DEFAULT 'stripe';

-- Indexes for new user_subscriptions columns
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_razorpay_subscription_id
    ON user_subscriptions (razorpay_subscription_id)
    WHERE razorpay_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_razorpay_customer_id
    ON user_subscriptions (razorpay_customer_id)
    WHERE razorpay_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_provider
    ON user_subscriptions (payment_provider);

-- ============================================================
-- 3. payments: Add Razorpay and payment_provider columns
-- ============================================================
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(32) DEFAULT 'stripe_card';

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(128) UNIQUE;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(128);

-- Indexes for new payments columns
CREATE INDEX IF NOT EXISTS idx_payments_payment_provider
    ON payments (payment_provider);

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
    ON payments (razorpay_payment_id)
    WHERE razorpay_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
    ON payments (razorpay_order_id)
    WHERE razorpay_order_id IS NOT NULL;

-- ============================================================
-- 4. Update tier CHECK constraint to include 'premier'
-- ============================================================
DO $$
BEGIN
    -- Drop the old constraint that only allows 4 tiers
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'subscription_plans'
          AND constraint_name = 'subscription_plans_tier_check'
    ) THEN
        ALTER TABLE subscription_plans
            DROP CONSTRAINT subscription_plans_tier_check;
    END IF;

    -- Add updated constraint that includes 'premier'
    ALTER TABLE subscription_plans
        ADD CONSTRAINT subscription_plans_tier_check
        CHECK (tier IN ('free', 'basic', 'premium', 'enterprise', 'premier'));
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists with correct definition
        NULL;
END $$;
