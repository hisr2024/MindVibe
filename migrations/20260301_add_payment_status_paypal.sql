-- Migration: Add paypal_order_id column to payments table
-- Purpose: Support direct PayPal order tracking alongside Stripe PayPal integration.
-- This column stores the PayPal order ID for payments made through PayPal,
-- enabling payment status tracking across Stripe, Razorpay, and PayPal.
--
-- Idempotent: Safe to run multiple times (uses IF NOT EXISTS).

-- Add paypal_order_id column to payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(128) UNIQUE;

-- Create index for PayPal order ID lookups
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id
    ON payments (paypal_order_id)
    WHERE paypal_order_id IS NOT NULL;

-- Create composite index for user payment history queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_payments_user_created_desc
    ON payments (user_id, created_at DESC)
    WHERE deleted_at IS NULL;
