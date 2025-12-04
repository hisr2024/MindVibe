-- Migration: Add Emotional Reset Sessions Table
-- Date: 2025-12-06
-- Description: Creates the emotional_reset_sessions table for the 7-step guided
--              emotional reset flow. Supports tracking user sessions, step progress,
--              and optional journal entry integration.
-- Safe for Render deployment - no complex PL/pgSQL blocks
-- Idempotent and handles both fresh deploys and upgrades

-- Create emotional_reset_sessions table
CREATE TABLE IF NOT EXISTS emotional_reset_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    current_step INTEGER NOT NULL DEFAULT 1,
    emotions_input TEXT NULL,
    assessment_data JSON NULL,
    wisdom_verses JSON NULL,
    affirmations JSON NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    journal_entry_id VARCHAR(64) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_emotional_reset_sessions_user_id ON emotional_reset_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_reset_sessions_session_id ON emotional_reset_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_emotional_reset_sessions_journal_entry_id ON emotional_reset_sessions(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_emotional_reset_sessions_created_at ON emotional_reset_sessions(created_at);

-- Note: journal_entry_id references journal_entries(id) ON DELETE SET NULL
-- The FK constraint is not included here because journal_entries table may not exist yet.
-- It will be created by 20251210_journal_system.sql migration.
-- The ORM model (EmotionalResetSession) handles the relationship at the application level.
