-- Migration: Expand VoiceType CHECK constraint to include all 7 voice types
-- Date: 2026-03-12
-- Description: The VoiceType enum was expanded from 3 values (calm, wisdom, friendly)
--   to 7 values (+ energetic, soothing, storytelling, chanting).
--   This migration updates the CHECK constraint on user_voice_preferences.preferred_voice_type
--   to accept the new values. Without this, INSERT/UPDATE with new voice types would fail.

-- Step 1: Drop the old CHECK constraint (only allows calm, wisdom, friendly)
DO $$
BEGIN
    -- Try dropping the constraint by its expected name
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_voice_preferences_preferred_voice_type_check'
        AND table_name = 'user_voice_preferences'
    ) THEN
        ALTER TABLE user_voice_preferences
        DROP CONSTRAINT user_voice_preferences_preferred_voice_type_check;
    END IF;
END $$;

-- Step 2: Add the updated CHECK constraint with all 7 voice types
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_voice_preferences'
    ) THEN
        ALTER TABLE user_voice_preferences
        ADD CONSTRAINT user_voice_preferences_preferred_voice_type_check
        CHECK (preferred_voice_type IN ('calm', 'wisdom', 'friendly', 'energetic', 'soothing', 'storytelling', 'chanting'));
    END IF;
END $$;
