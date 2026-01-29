-- Fix Wisdom Journeys Schema Issues
-- Migration: 20260129_fix_wisdom_journeys_schema.sql
--
-- This migration fixes:
-- 1. Missing deleted_at columns for soft delete support (SoftDeleteMixin)
-- 2. Missing database indices for performance
-- 3. Missing CHECK constraints for data integrity
-- 4. Additional indices for common query patterns

-- =============================================================================
-- 1. ADD MISSING deleted_at COLUMNS FOR SOFT DELETE
-- =============================================================================

-- Add deleted_at to journey_templates
ALTER TABLE journey_templates
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at to journey_template_steps
ALTER TABLE journey_template_steps
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at to user_journeys
ALTER TABLE user_journeys
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at to user_journey_step_state
ALTER TABLE user_journey_step_state
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =============================================================================
-- 2. ADD MISSING INDICES FOR PERFORMANCE
-- =============================================================================

-- Index for soft delete queries on journey_templates
CREATE INDEX IF NOT EXISTS idx_journey_templates_deleted_at
ON journey_templates(deleted_at)
WHERE deleted_at IS NULL;

-- Index for soft delete queries on journey_template_steps
CREATE INDEX IF NOT EXISTS idx_journey_template_steps_deleted_at
ON journey_template_steps(deleted_at)
WHERE deleted_at IS NULL;

-- Index for soft delete queries on user_journeys
CREATE INDEX IF NOT EXISTS idx_user_journeys_deleted_at
ON user_journeys(deleted_at)
WHERE deleted_at IS NULL;

-- Index for soft delete queries on user_journey_step_state
CREATE INDEX IF NOT EXISTS idx_user_journey_step_state_deleted_at
ON user_journey_step_state(deleted_at)
WHERE deleted_at IS NULL;

-- Composite index for active journey lookups (common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_journeys_user_active
ON user_journeys(user_id, status, deleted_at)
WHERE status = 'active' AND deleted_at IS NULL;

-- Index for completed_at analytics queries
CREATE INDEX IF NOT EXISTS idx_user_journeys_completed_at
ON user_journeys(completed_at)
WHERE completed_at IS NOT NULL;

-- Index for step delivery queries
CREATE INDEX IF NOT EXISTS idx_user_journey_step_completed
ON user_journey_step_state(completed_at)
WHERE completed_at IS NOT NULL;

-- Composite index for step state lookups (journey + day)
CREATE INDEX IF NOT EXISTS idx_user_journey_step_state_journey_day
ON user_journey_step_state(user_journey_id, day_index);

-- Index for template steps by day (for step generation)
CREATE INDEX IF NOT EXISTS idx_journey_template_steps_day
ON journey_template_steps(journey_template_id, day_index);

-- Index on active templates by slug (most common lookup)
CREATE INDEX IF NOT EXISTS idx_journey_templates_slug_active
ON journey_templates(slug)
WHERE is_active = true AND deleted_at IS NULL;

-- =============================================================================
-- 3. ADD MISSING INDICES TO LEGACY TABLES (wisdom_journeys, journey_steps)
-- =============================================================================

-- Composite index for user's active journeys (legacy)
CREATE INDEX IF NOT EXISTS idx_wisdom_journeys_user_status
ON wisdom_journeys(user_id, status)
WHERE deleted_at IS NULL;

-- Index for journey steps by journey and day (legacy)
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey_day
ON journey_steps(journey_id, step_number);

-- Index for completed steps (legacy)
CREATE INDEX IF NOT EXISTS idx_journey_steps_completed
ON journey_steps(completed_at)
WHERE completed_at IS NOT NULL;

-- =============================================================================
-- 4. ADD CHECK CONSTRAINTS FOR DATA INTEGRITY
-- =============================================================================

-- Ensure progress_percentage is between 0 and 100 (legacy wisdom_journeys)
DO $$ BEGIN
    ALTER TABLE wisdom_journeys
    ADD CONSTRAINT chk_wisdom_journeys_progress
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure current_day_index is positive (user_journeys)
DO $$ BEGIN
    ALTER TABLE user_journeys
    ADD CONSTRAINT chk_user_journeys_day_index
    CHECK (current_day_index > 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure user_rating is between 1 and 5 (legacy journey_steps)
DO $$ BEGIN
    ALTER TABLE journey_steps
    ADD CONSTRAINT chk_journey_steps_rating
    CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN journey_templates.deleted_at IS 'Soft delete timestamp - NULL means record is active';
COMMENT ON COLUMN journey_template_steps.deleted_at IS 'Soft delete timestamp - NULL means record is active';
COMMENT ON COLUMN user_journeys.deleted_at IS 'Soft delete timestamp - NULL means record is active';
COMMENT ON COLUMN user_journey_step_state.deleted_at IS 'Soft delete timestamp - NULL means record is active';

-- =============================================================================
-- 6. VERIFY MIGRATION SUCCESS
-- =============================================================================

DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    -- Check journey_templates.deleted_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'journey_templates' AND column_name = 'deleted_at'
    ) THEN
        missing_columns := missing_columns || 'journey_templates.deleted_at, ';
    END IF;

    -- Check user_journeys.deleted_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_journeys' AND column_name = 'deleted_at'
    ) THEN
        missing_columns := missing_columns || 'user_journeys.deleted_at, ';
    END IF;

    IF missing_columns != '' THEN
        RAISE WARNING 'Migration may have failed. Missing columns: %', missing_columns;
    ELSE
        RAISE NOTICE 'Migration 20260129_fix_wisdom_journeys_schema completed successfully';
    END IF;
END $$;
