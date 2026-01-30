-- Add is_free column to journey_templates table
-- Migration: 20260129_add_is_free_to_journey_templates.sql
--
-- This migration adds support for:
-- 1. Free journeys accessible to all users without subscription
-- 2. One journey marked as free for user testing
-- 3. Developers continue to have full access to all journeys

-- Add is_free column to journey_templates
ALTER TABLE journey_templates ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;

-- Create index for quick free journey lookups
CREATE INDEX IF NOT EXISTS idx_journey_templates_free ON journey_templates(is_free) WHERE is_free = true;

-- Mark the first featured journey as free (Transform Anger / Krodha)
-- This allows users to test the journey feature without subscribing
-- Note: PostgreSQL doesn't support LIMIT in UPDATE, so we use a subquery
UPDATE journey_templates
SET is_free = true
WHERE id = (
    SELECT id FROM journey_templates
    WHERE slug LIKE '%anger%' OR slug LIKE '%krodha%'
    LIMIT 1
);

-- If no anger/krodha journey exists, mark any first featured journey as free
UPDATE journey_templates
SET is_free = true
WHERE id = (
    SELECT id FROM journey_templates
    WHERE is_featured = true
      AND NOT EXISTS (SELECT 1 FROM journey_templates WHERE is_free = true)
    LIMIT 1
);

-- Add comment for documentation
COMMENT ON COLUMN journey_templates.is_free IS 'Whether this journey is free for all users (one should be marked free for testing)';
