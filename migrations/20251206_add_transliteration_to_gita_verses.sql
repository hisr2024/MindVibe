-- Migration: Add transliteration column to gita_verses table
-- Date: 2025-12-06
-- Description: Adds missing transliteration column for production database schema alignment
-- This migration is idempotent and safe to run on both empty and existing databases

-- Add transliteration column if it doesn't exist
-- Using DO block for conditional column addition
DO $$
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'gita_verses'
        AND column_name = 'transliteration'
    ) THEN
        ALTER TABLE gita_verses
        ADD COLUMN transliteration TEXT;
        
        RAISE NOTICE 'Added transliteration column to gita_verses table';
    ELSE
        RAISE NOTICE 'Column transliteration already exists in gita_verses table';
    END IF;
END $$;

-- Verify the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'gita_verses'
        AND column_name = 'transliteration'
    ) THEN
        RAISE NOTICE 'Migration completed successfully: transliteration column is present';
    ELSE
        RAISE EXCEPTION 'Migration failed: transliteration column not found';
    END IF;
END $$;
