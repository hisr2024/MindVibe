-- Migration: Fix Achievement Enum Case Mismatch
-- Description: Update enum types to use uppercase values for consistency
-- Date: 2024-12-10
-- Author: GitHub Copilot

-- This migration fixes the case mismatch between Python enums (uppercase)
-- and PostgreSQL enums (lowercase) in the Karmic Tree system.

-- ==============================================================================
-- Step 1: Update AchievementCategory enum
-- ==============================================================================

-- Create new temporary enum type with uppercase values
DO $$ BEGIN
    CREATE TYPE achievementcategory_new AS ENUM ('MOOD', 'JOURNAL', 'CHAT', 'STREAK', 'WELLNESS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update existing data in achievements table
UPDATE achievements
SET category = CASE
    WHEN category::text = 'mood' THEN 'MOOD'::achievementcategory_new
    WHEN category::text = 'journal' THEN 'JOURNAL'::achievementcategory_new
    WHEN category::text = 'chat' THEN 'CHAT'::achievementcategory_new
    WHEN category::text = 'streak' THEN 'STREAK'::achievementcategory_new
    WHEN category::text = 'wellness' THEN 'WELLNESS'::achievementcategory_new
    ELSE category::text::achievementcategory_new
END::text::achievementcategory_new
WHERE category IS NOT NULL;

-- Drop old enum type and rename new one
ALTER TABLE achievements ALTER COLUMN category TYPE achievementcategory_new USING category::text::achievementcategory_new;
DROP TYPE IF EXISTS achievementcategory CASCADE;
ALTER TYPE achievementcategory_new RENAME TO achievementcategory;

-- ==============================================================================
-- Step 2: Update AchievementRarity enum
-- ==============================================================================

-- Create new temporary enum type with uppercase values
DO $$ BEGIN
    CREATE TYPE achievementrarity_new AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update existing data in achievements table
UPDATE achievements
SET rarity = CASE
    WHEN rarity::text = 'common' THEN 'COMMON'::achievementrarity_new
    WHEN rarity::text = 'rare' THEN 'RARE'::achievementrarity_new
    WHEN rarity::text = 'epic' THEN 'EPIC'::achievementrarity_new
    WHEN rarity::text = 'legendary' THEN 'LEGENDARY'::achievementrarity_new
    ELSE rarity::text::achievementrarity_new
END::text::achievementrarity_new
WHERE rarity IS NOT NULL;

-- Update existing data in unlockables table
UPDATE unlockables
SET rarity = CASE
    WHEN rarity::text = 'common' THEN 'COMMON'::achievementrarity_new
    WHEN rarity::text = 'rare' THEN 'RARE'::achievementrarity_new
    WHEN rarity::text = 'epic' THEN 'EPIC'::achievementrarity_new
    WHEN rarity::text = 'legendary' THEN 'LEGENDARY'::achievementrarity_new
    ELSE rarity::text::achievementrarity_new
END::text::achievementrarity_new
WHERE rarity IS NOT NULL;

-- Drop old enum type and rename new one
ALTER TABLE achievements ALTER COLUMN rarity TYPE achievementrarity_new USING rarity::text::achievementrarity_new;
ALTER TABLE unlockables ALTER COLUMN rarity TYPE achievementrarity_new USING rarity::text::achievementrarity_new;
DROP TYPE IF EXISTS achievementrarity CASCADE;
ALTER TYPE achievementrarity_new RENAME TO achievementrarity;

-- ==============================================================================
-- Step 3: Update UnlockableType enum
-- ==============================================================================

-- Create new temporary enum type with uppercase values
DO $$ BEGIN
    CREATE TYPE unlockabletype_new AS ENUM ('THEME', 'PROMPT', 'BADGE', 'BOOST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update existing data in unlockables table
UPDATE unlockables
SET kind = CASE
    WHEN kind::text = 'theme' THEN 'THEME'::unlockabletype_new
    WHEN kind::text = 'prompt' THEN 'PROMPT'::unlockabletype_new
    WHEN kind::text = 'badge' THEN 'BADGE'::unlockabletype_new
    WHEN kind::text = 'boost' THEN 'BOOST'::unlockabletype_new
    ELSE kind::text::unlockabletype_new
END::text::unlockabletype_new
WHERE kind IS NOT NULL;

-- Drop old enum type and rename new one
ALTER TABLE unlockables ALTER COLUMN kind TYPE unlockabletype_new USING kind::text::unlockabletype_new;
DROP TYPE IF EXISTS unlockabletype CASCADE;
ALTER TYPE unlockabletype_new RENAME TO unlockabletype;

-- ==============================================================================
-- Verification
-- ==============================================================================

-- Verify the migration was successful
DO $$
DECLARE
    achievement_count INTEGER;
    unlockable_count INTEGER;
BEGIN
    -- Check achievements table
    SELECT COUNT(*) INTO achievement_count FROM achievements;
    RAISE NOTICE 'Total achievements after migration: %', achievement_count;
    
    -- Check unlockables table
    SELECT COUNT(*) INTO unlockable_count FROM unlockables;
    RAISE NOTICE 'Total unlockables after migration: %', unlockable_count;
    
    -- Log success
    RAISE NOTICE 'Achievement enum case migration completed successfully';
END $$;
