-- Migration: Remove foreign key constraint from emotional_reset_sessions to allow anonymous users
-- Date: 2025-12-07
-- Description: Drops the user_id foreign key constraint to enable anonymous emotional reset sessions.
--              Anonymous users have user_id like 'anon-abc123' which doesn't exist in users table.
--              This migration is safe and idempotent.

-- Drop the foreign key constraint if it exists
-- Note: The constraint name follows PostgreSQL's default naming convention: {table}_{column}_fkey
ALTER TABLE emotional_reset_sessions
DROP CONSTRAINT IF EXISTS emotional_reset_sessions_user_id_fkey;

-- The user_id column remains NOT NULL and indexed, but no longer requires a matching user in users table.
-- This allows both:
--   - Authenticated users: user_id matches a real user in users table
--   - Anonymous users: user_id is a generated ID like 'anon-{12-char-hex}'
--
-- Data integrity notes:
-- - Anonymous sessions auto-expire after 30 minutes (implemented in application layer)
-- - Authenticated user sessions are validated at the application layer via get_current_user()
-- - The index on user_id is preserved for query performance
