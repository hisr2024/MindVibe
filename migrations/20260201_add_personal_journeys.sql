-- Migration: Add personal_journeys table for simple CRUD journeys feature
-- Created: 2026-02-01

-- Create the personal_journeys table
CREATE TABLE IF NOT EXISTS personal_journeys (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    cover_image_url VARCHAR(512),
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_personal_journeys_owner_id ON personal_journeys(owner_id);
CREATE INDEX IF NOT EXISTS idx_personal_journeys_status ON personal_journeys(status);
CREATE INDEX IF NOT EXISTS idx_personal_journeys_created_at ON personal_journeys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_journeys_updated_at ON personal_journeys(updated_at DESC NULLS LAST);

-- Add check constraint for status values
ALTER TABLE personal_journeys
    ADD CONSTRAINT chk_personal_journeys_status
    CHECK (status IN ('draft', 'active', 'completed', 'archived'));

-- Comment on table
COMMENT ON TABLE personal_journeys IS 'User personal journeys for goal tracking and progress management';
