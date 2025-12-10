-- Migration: Fix Achievement Enum Case Mismatch
-- Description: Update enum types to use uppercase values for consistency
-- Date: 2024-12-10
-- Author: GitHub Copilot (Fixed)

-- This migration fixes the case mismatch between Python enums (uppercase)
-- and PostgreSQL enums (lowercase) in the Karmic Tree system.

-- ==============================================================================
-- Step 1: Fix AchievementCategory enum
-- ==============================================================================

-- Add temporary text column to store uppercase values
ALTER TABLE achievements ADD COLUMN category_temp TEXT;

-- Copy and convert existing data to uppercase
UPDATE achievements
SET category_temp = UPPER(category::text)
WHERE category IS NOT NULL;

-- Drop the old enum column
ALTER TABLE achievements DROP COLUMN category;

-- Drop the old enum type
DROP TYPE IF EXISTS achievementcategory CASCADE;

-- Create new enum type with uppercase values
CREATE TYPE achievementcategory AS ENUM ('MOOD', 'JOURNAL', 'CHAT', 'STREAK', 'WELLNESS');

-- Add new column with correct enum type
ALTER TABLE achievements ADD COLUMN category achievementcategory;

-- Copy data from temp column to new enum column
UPDATE achievements
SET category = category_temp::achievementcategory
WHERE category_temp IS NOT NULL;

-- Drop temporary column
ALTER TABLE achievements DROP COLUMN category_temp;

-- ==============================================================================
-- Step 2: Fix AchievementRarity enum (achievements table)
-- ==============================================================================

-- Add temporary text column
ALTER TABLE achievements ADD COLUMN rarity_temp TEXT;

-- Copy and convert existing data to uppercase
UPDATE achievements
SET rarity_temp = UPPER(rarity::text)
WHERE rarity IS NOT NULL;

-- Drop the old enum column from achievements
ALTER TABLE achievements DROP COLUMN rarity;

-- Note: Can't drop type yet because unlockables still uses it
-- We'll handle both tables, then drop the type

-- ==============================================================================
-- Step 3: Fix AchievementRarity enum (unlockables table)
-- ==============================================================================

-- Add temporary text column to unlockables
ALTER TABLE unlockables ADD COLUMN rarity_temp TEXT;

-- Copy and convert existing data to uppercase
UPDATE unlockables
SET rarity_temp = UPPER(rarity::text)
WHERE rarity IS NOT NULL;

-- Drop the old enum column from unlockables
ALTER TABLE unlockables DROP COLUMN rarity;

-- Now drop the old enum type (both tables no longer use it)
DROP TYPE IF EXISTS achievementrarity CASCADE;

-- Create new enum type with uppercase values
CREATE TYPE achievementrarity AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- Add new columns with correct enum type
ALTER TABLE achievements ADD COLUMN rarity achievementrarity;
ALTER TABLE unlockables ADD COLUMN rarity achievementrarity;

-- Copy data from temp columns to new enum columns
UPDATE achievements
SET rarity = rarity_temp::achievementrarity
WHERE rarity_temp IS NOT NULL;

UPDATE unlockables
SET rarity = rarity_temp::achievementrarity
WHERE rarity_temp IS NOT NULL;

-- Drop temporary columns
ALTER TABLE achievements DROP COLUMN rarity_temp;
ALTER TABLE unlockables DROP COLUMN rarity_temp;

-- ==============================================================================
-- Step 4: Fix UnlockableType enum
-- ==============================================================================

-- Add temporary text column
ALTER TABLE unlockables ADD COLUMN kind_temp TEXT;

-- Copy and convert existing data to uppercase
UPDATE unlockables
SET kind_temp = UPPER(kind::text)
WHERE kind IS NOT NULL;

-- Drop the old enum column
ALTER TABLE unlockables DROP COLUMN kind;

-- Drop the old enum type
DROP TYPE IF EXISTS unlockabletype CASCADE;

-- Create new enum type with uppercase values
CREATE TYPE unlockabletype AS ENUM ('THEME', 'PROMPT', 'BADGE', 'BOOST');

-- Add new column with correct enum type
ALTER TABLE unlockables ADD COLUMN kind unlockabletype;

-- Copy data from temp column to new enum column
UPDATE unlockables
SET kind = kind_temp::unlockabletype
WHERE kind_temp IS NOT NULL;

-- Drop temporary column
ALTER TABLE unlockables DROP COLUMN kind_temp;

-- ==============================================================================
-- Step 5: Set NOT NULL constraints (if they were originally NOT NULL)
-- ==============================================================================

-- Note: Only set NOT NULL if the original schema had these constraints
-- Check your models.py to confirm

ALTER TABLE achievements ALTER COLUMN category SET NOT NULL;
ALTER TABLE achievements ALTER COLUMN rarity SET NOT NULL;
ALTER TABLE unlockables ALTER COLUMN rarity SET NOT NULL;
ALTER TABLE unlockables ALTER COLUMN kind SET NOT NULL;

-- ==============================================================================
-- Verification
-- ==============================================================================

-- Verify the migration was successful
DO $
DECLARE
    achievement_count INTEGER;
    unlockable_count INTEGER;
    category_sample TEXT;
    rarity_sample TEXT;
BEGIN
    -- Check achievements table
    SELECT COUNT(*) INTO achievement_count FROM achievements;
    RAISE NOTICE 'Total achievements after migration: %', achievement_count;
    
    -- Check unlockables table
    SELECT COUNT(*) INTO unlockable_count FROM unlockables;
    RAISE NOTICE 'Total unlockables after migration: %', unlockable_count;
    
    -- Sample values to verify uppercase conversion
    SELECT category::text INTO category_sample FROM achievements LIMIT 1;
    RAISE NOTICE 'Sample category value: %', category_sample;
    
    SELECT rarity::text INTO rarity_sample FROM achievements LIMIT 1;
    RAISE NOTICE 'Sample rarity value: %', rarity_sample;
    
    -- Log success
    RAISE NOTICE 'Achievement enum case migration completed successfully';
END $;
