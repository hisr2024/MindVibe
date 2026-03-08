-- Migration: Add Bhakta subscription tier
-- Description: Adds 'bhakta' as a valid subscription tier value.
--   The Bhakta tier sits between Free (Seeker) and Sadhak:
--   $6.99/month, 50 KIAAN questions, encrypted journal, 3 Wisdom Journeys.
-- Dependencies: Requires subscription_plans and user_subscriptions tables.

-- Update the CHECK constraint on subscription_plans.tier to include 'bhakta'
-- First drop the old constraint, then add the new one
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_tier_check;
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_tier_check
    CHECK (tier IN ('free', 'bhakta', 'basic', 'sadhak', 'premium', 'siddha', 'enterprise'));

-- Update CHECK constraint on user_subscriptions if it has one on the tier column
-- (user_subscriptions references plan_id, so this may not be needed, but just in case)

-- Update any CHECK constraints on subscription_links.plan_tier
ALTER TABLE subscription_links DROP CONSTRAINT IF EXISTS subscription_links_plan_tier_check;
ALTER TABLE subscription_links ADD CONSTRAINT subscription_links_plan_tier_check
    CHECK (plan_tier IN ('free', 'bhakta', 'basic', 'sadhak', 'premium', 'siddha', 'enterprise'));
