-- Add missing columns to users table that exist in the ORM model but were
-- never added via migration.  On databases created fresh by create_all() these
-- columns already exist; IF NOT EXISTS makes this idempotent.
--
-- Without these columns, every SELECT on the users table fails with
-- "UndefinedColumn: column users.failed_login_attempts does not exist"
-- which causes 500 Internal Server Error on login and all auth endpoints.

-- Account lockout / brute force protection
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;

-- Locale preference
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(8) NOT NULL DEFAULT 'en';

-- Mobile client fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token VARCHAR(512) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_platform VARCHAR(10) DEFAULT NULL;
