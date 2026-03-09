-- Migration: Fix subscription schema gaps (model vs database alignment)
-- Dependencies: Requires 20251202_add_subscription_system.sql
-- Purpose: The SQLAlchemy models define columns that the original migration
--          never created, causing asyncpg.exceptions.UndefinedColumnError.
--
-- Fixes applied:
--   1. subscription_plans: Add razorpay_plan_id_monthly/yearly columns
--   2. user_subscriptions: Add razorpay + payment_provider columns
--   3. payments: Add razorpay + payment_provider columns
--   4. Tier CHECK constraint: Include 'premier' tier
--   5. subscription_links: Create table (was only in SQLAlchemy model)
--   6. Default value alignment: kiaan_questions_monthly, usage_limit
--   7. Missing index: stripe_invoice_id on payments
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

    -- Add updated constraint with canonical tier names
    ALTER TABLE subscription_plans
        ADD CONSTRAINT subscription_plans_tier_check
        CHECK (tier IN ('free', 'bhakta', 'sadhak', 'siddha'));
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists with correct definition
        NULL;
END $$;

-- ============================================================
-- 5. Create subscription_links table (Razorpay subscription links)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_links (
    id SERIAL PRIMARY KEY,
    razorpay_subscription_id VARCHAR(128) NOT NULL UNIQUE,
    razorpay_plan_id VARCHAR(128) NOT NULL,
    plan_tier VARCHAR(32) NOT NULL CHECK (plan_tier IN ('free', 'bhakta', 'sadhak', 'siddha')),
    billing_period VARCHAR(16) DEFAULT 'monthly',
    short_url VARCHAR(512) NOT NULL,
    status VARCHAR(32) DEFAULT 'created' CHECK (status IN ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired')),
    total_count INTEGER DEFAULT 0,
    start_at TIMESTAMPTZ,
    expire_by TIMESTAMPTZ,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(32),
    offer_id VARCHAR(128),
    addons_json JSONB,
    notes JSONB,
    description TEXT,
    created_by_admin_id INTEGER,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_links_razorpay_sub_id
    ON subscription_links (razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_links_razorpay_plan_id
    ON subscription_links (razorpay_plan_id);

CREATE INDEX IF NOT EXISTS idx_subscription_links_plan_tier
    ON subscription_links (plan_tier);

CREATE INDEX IF NOT EXISTS idx_subscription_links_status
    ON subscription_links (status);

CREATE INDEX IF NOT EXISTS idx_subscription_links_created_by_admin_id
    ON subscription_links (created_by_admin_id)
    WHERE created_by_admin_id IS NOT NULL;

-- ============================================================
-- 6. Fix default value mismatches (model vs migration)
-- ============================================================

-- kiaan_questions_monthly: free tier default=5 (matches feature_config.py)
ALTER TABLE subscription_plans
    ALTER COLUMN kiaan_questions_monthly SET DEFAULT 5;

-- usage_limit: free tier default=5 (matches feature_config.py)
ALTER TABLE usage_tracking
    ALTER COLUMN usage_limit SET DEFAULT 5;

-- ============================================================
-- 7. Add missing index on payments.stripe_invoice_id
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payments_stripe_invoice_id
    ON payments (stripe_invoice_id)
    WHERE stripe_invoice_id IS NOT NULL;
