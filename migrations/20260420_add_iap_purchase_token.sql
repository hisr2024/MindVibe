-- Add Play Billing / StoreKit purchase-identification columns to
-- user_subscriptions.
--
-- Why we need these columns:
-- 1. Upgrade / downgrade: Play Billing requires the *previous*
--    purchase_token to be passed to `requestSubscription` along with a
--    `replacementModeAndroid`. Without it, Play errors with
--    "You already own this item" when a user tries to switch tiers.
--    The mobile client can read this locally from
--    `getAvailablePurchases()`, but the backend still needs to persist
--    it for webhook lookup (see #3).
-- 2. Admin ops: cancelling, refunding, or auditing a subscription via
--    the Google Play Developer API or App Store Server API requires
--    the purchase token / original transaction id respectively.
-- 3. Real-time Developer Notifications (Google) and App Store Server
--    Notifications v2 (Apple) deliver events keyed by purchase_token /
--    originalTransactionId. Without persisting them, the backend
--    cannot map a webhook payload back to a UserSubscription row, so
--    renewals, grace periods, and cancellations silently never update.
--
-- Both columns are nullable so existing free-tier and Stripe-only
-- subscriptions remain valid. Indexed because webhook handlers and the
-- current-subscription query both look rows up by token.

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS store_product_id   VARCHAR(128),
    ADD COLUMN IF NOT EXISTS store_purchase_token VARCHAR(4096);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_store_purchase_token
    ON user_subscriptions (store_purchase_token)
    WHERE store_purchase_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_store_product_id
    ON user_subscriptions (store_product_id)
    WHERE store_product_id IS NOT NULL;
