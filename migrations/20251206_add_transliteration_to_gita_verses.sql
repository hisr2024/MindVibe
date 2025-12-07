-- Migration: Add transliteration column to gita_verses table
-- Date: 2025-12-06
-- Description: Adds missing transliteration column for production database schema alignment
-- This migration is idempotent and safe to run on both empty and existing databases

-- First check if table exists, then add column
DO $$
BEGIN
    -- Check if gita_verses table exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'gita_verses'
    ) THEN
        -- Table exists, check if column exists
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'gita_verses'
            AND column_name = 'transliteration'
        ) THEN
            -- Add the column
            ALTER TABLE gita_verses
            ADD COLUMN transliteration TEXT;
            
            RAISE NOTICE 'Added transliteration column to gita_verses table';
        ELSE
            RAISE NOTICE 'Column transliteration already exists in gita_verses table';
        END IF;
    ELSE
        -- Table doesn't exist yet - this is expected on fresh deployments
        -- The column will be created when SQLAlchemy creates the table
        RAISE NOTICE 'Table gita_verses does not exist yet - skipping migration (will be created by SQLAlchemy)';
    END IF;
END $$;

-- Verify the migration outcome
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'gita_verses'
    ) THEN
        -- Table exists, verify column
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'gita_verses'
            AND column_name = 'transliteration'
        ) THEN
            RAISE NOTICE 'Migration completed successfully: transliteration column is present';
        ELSE
            RAISE NOTICE 'Migration skipped: column will be created with table';
        END IF;
    ELSE
        RAISE NOTICE 'Migration verification skipped: table will be created by SQLAlchemy';
    END IF;
END $$;
