-- Add email verification support to users table and create verification tokens table
-- This migration adds email_verified flag and email verification token storage

-- Add email verification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ DEFAULT NULL;

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(256) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_token_hash ON email_verification_tokens(token_hash);

-- Mark existing users as verified (they already proved ownership via existing flows)
UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE email_verified = FALSE AND deleted_at IS NULL;
