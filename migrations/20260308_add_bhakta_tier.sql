-- Migration: Add Bhakta subscription tier
-- Description: Adds 'bhakta' as a valid subscription tier value.
--   The Bhakta tier sits between Free (Seeker) and Sadhak:
--   $6.99/month, 50 KIAAN questions, encrypted journal, 3 Wisdom Journeys.
-- Dependencies: Requires subscription_plans and user_subscriptions tables.

-- Clean up legacy/typo tier values before applying the new CHECK constraint.
-- Remap all old tier names to the canonical 4-tier system:
--   basic → bhakta, premium/premier → sadhak, enterprise → siddha
-- Delete duplicates first, then remap.
DELETE FROM subscription_plans
    WHERE tier IN ('premier', 'basic', 'premium', 'enterprise')
    AND EXISTS (SELECT 1 FROM subscription_plans sp2 WHERE sp2.tier IN ('free', 'bhakta', 'sadhak', 'siddha') AND sp2.tier != subscription_plans.tier);
UPDATE subscription_plans SET tier = 'bhakta' WHERE tier = 'basic';
UPDATE subscription_plans SET tier = 'sadhak' WHERE tier IN ('premium', 'premier');
UPDATE subscription_plans SET tier = 'siddha' WHERE tier = 'enterprise';
-- Map any remaining unknown tier values to 'free'
DELETE FROM subscription_plans
    WHERE tier NOT IN ('free', 'bhakta', 'sadhak', 'siddha')
    AND EXISTS (SELECT 1 FROM subscription_plans sp2 WHERE sp2.tier = 'free');
UPDATE subscription_plans SET tier = 'free'
    WHERE tier NOT IN ('free', 'bhakta', 'sadhak', 'siddha');

-- Update the CHECK constraint on subscription_plans.tier to canonical 4 tiers only
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_tier_check;
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_tier_check
    CHECK (tier IN ('free', 'bhakta', 'sadhak', 'siddha'));

-- Update any CHECK constraints on subscription_links.plan_tier
ALTER TABLE subscription_links DROP CONSTRAINT IF EXISTS subscription_links_plan_tier_check;
ALTER TABLE subscription_links ADD CONSTRAINT subscription_links_plan_tier_check
    CHECK (plan_tier IN ('free', 'bhakta', 'sadhak', 'siddha'));
