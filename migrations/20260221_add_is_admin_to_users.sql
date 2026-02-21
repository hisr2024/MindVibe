-- Add is_admin column to users table
-- Enables admin-based developer access bypass in feature_access middleware
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
