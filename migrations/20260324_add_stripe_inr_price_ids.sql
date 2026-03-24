-- Add INR-specific Stripe Price ID columns to subscription_plans.
--
-- Stripe Checkout requires pre-created Price objects. When the checkout
-- currency is INR (for Google Pay INR or Stripe UPI), we need separate
-- Price IDs configured in INR in the Stripe Dashboard.
--
-- These columns are nullable: when not set, INR payments fall back to
-- Razorpay (for UPI) or use the default USD Price IDs (for card/Google Pay
-- where Stripe handles currency conversion automatically).

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS stripe_price_id_monthly_inr VARCHAR(128),
    ADD COLUMN IF NOT EXISTS stripe_price_id_yearly_inr VARCHAR(128);
