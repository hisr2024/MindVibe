-- Migration: Fix foreign key type mismatch for user_id columns
-- Description: Changes user_id columns from INTEGER to VARCHAR(255) to match users.id type
-- Date: 2025-12-02

-- This migration fixes the foreign key type mismatch where:
-- - users.id is VARCHAR (string/UUID from authentication system)
-- - user_id foreign key columns were incorrectly defined as INTEGER

-- ============================================================================
-- IMPORTANT: This migration must be run AFTER the users table has been updated
-- to use VARCHAR for the id column. If the users table still uses INTEGER,
-- this migration will fail.
-- ============================================================================

-- Step 1: Drop all foreign key constraints that reference users.id
-- These constraints prevent us from changing the column types

DO $$
BEGIN
    -- Drop foreign key on user_subscriptions
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions'
    ) THEN
        ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
    END IF;

    -- Drop foreign key on usage_tracking
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking'
    ) THEN
        ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_fkey;
    END IF;

    -- Drop foreign key on payments
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'payments'
    ) THEN
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
    END IF;

    -- Drop foreign key on user_profiles (if exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
    END IF;

    -- Drop foreign key on moods (if exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'moods'
    ) THEN
        ALTER TABLE moods DROP CONSTRAINT IF EXISTS moods_user_id_fkey;
    END IF;

    -- Drop foreign key on journal_blobs (if exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_blobs'
    ) THEN
        ALTER TABLE journal_blobs DROP CONSTRAINT IF EXISTS journal_blobs_user_id_fkey;
    END IF;

    -- Drop foreign key on works (if exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'works'
    ) THEN
        ALTER TABLE works DROP CONSTRAINT IF EXISTS works_user_id_fkey;
    END IF;

    -- Drop foreign key on sessions (if exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions'
    ) THEN
        ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
    END IF;

    -- Drop foreign key on refresh_tokens (if exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'refresh_tokens'
    ) THEN
        ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
    END IF;
END $$;

-- Step 2: Alter column types from INTEGER to VARCHAR(255) to match users.id
-- Note: The USING clause (e.g., user_id::VARCHAR) casts existing integer values to strings during conversion

-- Alter user_subscriptions.user_id when table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_subscriptions') THEN
        ALTER TABLE user_subscriptions
            ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Alter usage_tracking.user_id when table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='usage_tracking') THEN
        ALTER TABLE usage_tracking
            ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Alter payments.user_id when table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='payments') THEN
        ALTER TABLE payments
            ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Alter user_profiles.user_id (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='user_id') THEN
        ALTER TABLE user_profiles ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Alter moods.user_id (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='moods' AND column_name='user_id') THEN
        ALTER TABLE moods ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Alter journal_blobs.user_id (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_blobs' AND column_name='user_id') THEN
        ALTER TABLE journal_blobs ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Alter works.user_id (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='works' AND column_name='user_id') THEN
        ALTER TABLE works ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Alter sessions.user_id (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='user_id') THEN
        ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Alter refresh_tokens.user_id (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='refresh_tokens' AND column_name='user_id') THEN
        ALTER TABLE refresh_tokens ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR;
    END IF;
END $$;

-- Step 3: Re-create foreign key constraints with correct types

-- Re-create foreign key on user_subscriptions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_subscriptions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='user_subscriptions'
              AND constraint_name='user_subscriptions_user_id_fkey'
        ) THEN
            ALTER TABLE user_subscriptions
                ADD CONSTRAINT user_subscriptions_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Re-create foreign key on usage_tracking
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='usage_tracking') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='usage_tracking'
              AND constraint_name='usage_tracking_user_id_fkey'
        ) THEN
            ALTER TABLE usage_tracking
                ADD CONSTRAINT usage_tracking_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Re-create foreign key on payments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='payments') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='payments'
              AND constraint_name='payments_user_id_fkey'
        ) THEN
            ALTER TABLE payments
                ADD CONSTRAINT payments_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Re-create foreign key on user_profiles (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='user_profiles'
              AND constraint_name='user_profiles_user_id_fkey'
        ) THEN
            ALTER TABLE user_profiles
                ADD CONSTRAINT user_profiles_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Re-create foreign key on moods (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='moods') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='moods'
              AND constraint_name='moods_user_id_fkey'
        ) THEN
            ALTER TABLE moods
                ADD CONSTRAINT moods_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Re-create foreign key on journal_blobs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='journal_blobs') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='journal_blobs'
              AND constraint_name='journal_blobs_user_id_fkey'
        ) THEN
            ALTER TABLE journal_blobs
                ADD CONSTRAINT journal_blobs_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Re-create foreign key on works (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='works') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='works'
              AND constraint_name='works_user_id_fkey'
        ) THEN
            ALTER TABLE works
                ADD CONSTRAINT works_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Re-create foreign key on sessions (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sessions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='sessions'
              AND constraint_name='sessions_user_id_fkey'
        ) THEN
            ALTER TABLE sessions
                ADD CONSTRAINT sessions_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Re-create foreign key on refresh_tokens (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='refresh_tokens') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name='refresh_tokens'
              AND constraint_name='refresh_tokens_user_id_fkey'
        ) THEN
            ALTER TABLE refresh_tokens
                ADD CONSTRAINT refresh_tokens_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Step 4: Verify the migration was successful
-- This query will show all foreign key constraints on tables referencing users.id
-- SELECT
--     tc.constraint_name,
--     tc.table_name,
--     kcu.column_name,
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--     ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--     ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--     AND ccu.table_name = 'users'
--     AND ccu.column_name = 'id';
