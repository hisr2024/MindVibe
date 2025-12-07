-- Migration: Add transliteration column to gita_verses table
-- Date: 2025-12-06
-- Description: Adds missing transliteration column for production database schema alignment
-- This migration is idempotent and safe to run on both empty and existing databases
--
-- Note: The gita_verses table is created by migration 20251109_add_gita_wisdom_database.sql
-- with the transliteration column already included. This migration exists to handle legacy
-- databases that were created before that migration included the transliteration column,
-- or databases where the column was manually removed.
--
-- This migration safely handles three scenarios:
-- 1. Fresh database (table doesn't exist yet) - skips gracefully
-- 2. Table exists without transliteration column - adds the column
-- 3. Table exists with transliteration column - skips gracefully

DO $
BEGIN
    -- Check if gita_verses table exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'gita_verses'
    ) THEN
        -- Table exists, add column if it doesn't exist
        -- Using ALTER TABLE with IF NOT EXISTS is more idiomatic
        ALTER TABLE gita_verses ADD COLUMN IF NOT EXISTS transliteration TEXT;
        -- ✅ CRITICAL FIX: Added semicolon here ^
        
        RAISE NOTICE 'Checked transliteration column in gita_verses table';
    ELSE
        -- Table doesn't exist yet - will be created by SQLAlchemy with the column
        RAISE NOTICE 'Table gita_verses does not exist yet - skipping migration (will be created by SQLAlchemy)';
    END IF;
END $;
