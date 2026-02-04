-- Migration: Add deleted_at column to journey tables for soft delete support
-- Date: 2026-02-04
-- Description: The UserJourney and UserJourneyStepState models use SoftDeleteMixin
--              which requires a deleted_at column. This was missing from the original migration.

-- Add deleted_at to user_journeys
ALTER TABLE user_journeys
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_journeys_deleted ON user_journeys(deleted_at);

-- Add deleted_at to user_journey_step_state
ALTER TABLE user_journey_step_state
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_journey_step_state_deleted ON user_journey_step_state(deleted_at);

-- Add deleted_at to journey_templates (also uses SoftDeleteMixin)
ALTER TABLE journey_templates
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_journey_templates_deleted ON journey_templates(deleted_at);

-- Add deleted_at to journey_template_steps (also uses SoftDeleteMixin)
ALTER TABLE journey_template_steps
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_journey_template_steps_deleted ON journey_template_steps(deleted_at);
