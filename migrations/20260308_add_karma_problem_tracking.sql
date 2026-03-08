-- Migration: Add problem tracking to karma_reset_sessions
-- Date: 2026-03-08
-- Purpose: Track which real-life problem categories users select,
--          enabling analytics on common problems and path effectiveness.

-- Add problem tracking columns to karma_reset_sessions
ALTER TABLE karma_reset_sessions
ADD COLUMN IF NOT EXISTS problem_category VARCHAR(64) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS problem_id VARCHAR(64) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS shad_ripu VARCHAR(32) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS analysis_confidence FLOAT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS matched_keywords TEXT DEFAULT NULL;

-- Index for problem analytics queries
CREATE INDEX IF NOT EXISTS idx_karma_sessions_problem_category
ON karma_reset_sessions (problem_category)
WHERE problem_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_karma_sessions_shad_ripu
ON karma_reset_sessions (shad_ripu)
WHERE shad_ripu IS NOT NULL;

-- Composite index for user problem history
CREATE INDEX IF NOT EXISTS idx_karma_sessions_user_problem
ON karma_reset_sessions (user_id, problem_category, created_at DESC)
WHERE problem_category IS NOT NULL;

COMMENT ON COLUMN karma_reset_sessions.problem_category IS 'Life problem category (e.g., relationship_conflict, anxiety_health)';
COMMENT ON COLUMN karma_reset_sessions.problem_id IS 'Specific problem template ID (e.g., hurt_partner, constant_anxiety)';
COMMENT ON COLUMN karma_reset_sessions.shad_ripu IS 'Identified inner enemy driving the problem (kama, krodha, lobha, moha, mada, matsarya)';
COMMENT ON COLUMN karma_reset_sessions.analysis_confidence IS 'AI analysis confidence score (0.0 to 1.0)';
COMMENT ON COLUMN karma_reset_sessions.matched_keywords IS 'Keywords matched during situation analysis (JSON array)';
