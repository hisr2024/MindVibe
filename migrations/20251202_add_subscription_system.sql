-- Migration: Add subscription system tables
-- Description: Creates tables for subscription plans, user subscriptions, usage tracking, and payments
-- Note: Using VARCHAR with CHECK constraints instead of PostgreSQL ENUM types.
--       This approach is fully idempotent and avoids DO block parsing issues with the migration runner.
--       CHECK constraints provide equivalent data validation at the database level.

CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    tier VARCHAR(32) UNIQUE NOT NULL CHECK (tier IN ('free', 'basic', 'premium', 'enterprise')),
    name VARCHAR(64) NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10, 2) DEFAULT 0,
    price_yearly NUMERIC(10, 2),
    stripe_price_id_monthly VARCHAR(128),
    stripe_price_id_yearly VARCHAR(128),
    features JSONB DEFAULT '{}',
    kiaan_questions_monthly INTEGER DEFAULT 10,
    encrypted_journal BOOLEAN DEFAULT FALSE,
    data_retention_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Backfill missing columns on pre-existing tables (idempotent safety)
DO $$
BEGIN
    -- Add tier column if it does not exist (needed for index creation later)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'tier'
    ) THEN
        ALTER TABLE subscription_plans
            ADD COLUMN tier VARCHAR(32) DEFAULT 'free';
    END IF;

    -- Normalize existing rows before enforcing constraints
    UPDATE subscription_plans SET tier = 'free' WHERE tier IS NULL;

    -- Enforce NOT NULL on tier if it is currently nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans'
          AND column_name = 'tier'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE subscription_plans ALTER COLUMN tier SET NOT NULL;
    END IF;

    -- Add a deterministic check constraint for valid tiers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'subscription_plans'
          AND constraint_name = 'subscription_plans_tier_check'
    ) THEN
        ALTER TABLE subscription_plans
            ADD CONSTRAINT subscription_plans_tier_check
            CHECK (tier IN ('free', 'basic', 'premium', 'enterprise'));
    END IF;

    -- Add missing descriptive columns to align with current schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'name'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN name VARCHAR(64) NOT NULL DEFAULT 'Free';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'description'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'price_monthly'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN price_monthly NUMERIC(10, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'price_yearly'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN price_yearly NUMERIC(10, 2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'stripe_price_id_monthly'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_monthly VARCHAR(128);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'stripe_price_id_yearly'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_yearly VARCHAR(128);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'features'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN features JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'kiaan_questions_monthly'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN kiaan_questions_monthly INTEGER DEFAULT 10;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'encrypted_journal'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN encrypted_journal BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'data_retention_days'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN data_retention_days INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN updated_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_tier ON subscription_plans(tier);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trialing')),
    stripe_customer_id VARCHAR(128),
    stripe_subscription_id VARCHAR(128),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature VARCHAR(64) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON usage_tracking(feature);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period_start ON usage_tracking(period_start);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(128) UNIQUE,
    stripe_invoice_id VARCHAR(128),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    description TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Insert default subscription plans
INSERT INTO subscription_plans (tier, name, description, price_monthly, price_yearly, features, kiaan_questions_monthly, encrypted_journal, data_retention_days)
VALUES 
    ('free', 'Free', 'Get started with MindVibe core features', 0.00, NULL, 
     '{"kiaan_questions_monthly": 10, "encrypted_journal": false, "mood_tracking": true, "wisdom_access": true, "advanced_analytics": false, "priority_support": false, "offline_access": false, "data_retention_days": 30}',
     10, FALSE, 30),
    ('basic', 'Basic', 'Unlock journal access and more KIAAN conversations', 9.99, 99.99,
     '{"kiaan_questions_monthly": 100, "encrypted_journal": true, "mood_tracking": true, "wisdom_access": true, "advanced_analytics": true, "priority_support": false, "offline_access": false, "data_retention_days": 365}',
     100, TRUE, 365),
    ('premium', 'Premium', 'Unlimited KIAAN access with priority support', 19.99, 199.99,
     '{"kiaan_questions_monthly": -1, "encrypted_journal": true, "mood_tracking": true, "wisdom_access": true, "advanced_analytics": true, "priority_support": true, "offline_access": true, "data_retention_days": -1}',
     -1, TRUE, -1),
    ('enterprise', 'Enterprise', 'Complete solution for organizations', 499.00, 4999.00,
     '{"kiaan_questions_monthly": -1, "encrypted_journal": true, "mood_tracking": true, "wisdom_access": true, "advanced_analytics": true, "priority_support": true, "offline_access": true, "white_label": true, "sso": true, "dedicated_support": true, "data_retention_days": -1}',
     -1, TRUE, -1)
ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    kiaan_questions_monthly = EXCLUDED.kiaan_questions_monthly,
    encrypted_journal = EXCLUDED.encrypted_journal,
    data_retention_days = EXCLUDED.data_retention_days,
    updated_at = NOW();
