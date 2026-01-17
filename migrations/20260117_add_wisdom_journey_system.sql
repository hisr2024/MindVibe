-- Migration: Add Wisdom Journey System
-- Description: AI-powered personalized wisdom journeys with dynamic verse sequences
-- Date: 2026-01-17

-- Create JourneyStatus enum
DO $$ BEGIN
    CREATE TYPE journeystatus AS ENUM ('active', 'paused', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create wisdom_journeys table
CREATE TABLE IF NOT EXISTS wisdom_journeys (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Journey configuration
    total_steps INTEGER NOT NULL DEFAULT 7,
    current_step INTEGER NOT NULL DEFAULT 0,

    -- Status and progress
    status journeystatus NOT NULL DEFAULT 'active',
    progress_percentage INTEGER NOT NULL DEFAULT 0,

    -- Personalization metadata
    recommended_by VARCHAR(64),  -- "ai", "mood_based", "journal_based", "manual"
    recommendation_score NUMERIC(5, 4),  -- 0.0-1.0
    recommendation_reason TEXT,

    -- Source data for personalization (privacy-preserving)
    source_mood_scores JSON,  -- Last 7 days mood averages
    source_themes JSON,  -- Extracted journal themes

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for wisdom_journeys
CREATE INDEX IF NOT EXISTS idx_wisdom_journeys_user_id ON wisdom_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_journeys_status ON wisdom_journeys(status);
CREATE INDEX IF NOT EXISTS idx_wisdom_journeys_created_at ON wisdom_journeys(created_at);

-- Create journey_steps table
CREATE TABLE IF NOT EXISTS journey_steps (
    id VARCHAR(64) PRIMARY KEY,
    journey_id VARCHAR(64) NOT NULL REFERENCES wisdom_journeys(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,

    -- Verse association
    verse_id INTEGER REFERENCES gita_verses(id) ON DELETE SET NULL,

    -- Step content
    reflection_prompt TEXT,
    ai_insight TEXT,

    -- User progress
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,

    -- User reflection (encrypted)
    user_notes TEXT,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Unique constraint
    CONSTRAINT uq_journey_step UNIQUE (journey_id, step_number)
);

-- Create indexes for journey_steps
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey_id ON journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_verse_id ON journey_steps(verse_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_step_number ON journey_steps(step_number);

-- Create journey_recommendations table
CREATE TABLE IF NOT EXISTS journey_recommendations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Recommendation details
    journey_template VARCHAR(128) NOT NULL,
    relevance_score NUMERIC(5, 4) NOT NULL,  -- 0.0-1.0
    reason TEXT,

    -- User interaction
    accepted BOOLEAN,
    journey_id VARCHAR(64) REFERENCES wisdom_journeys(id) ON DELETE SET NULL,

    -- ML features (for retraining)
    features_snapshot JSON,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for journey_recommendations
CREATE INDEX IF NOT EXISTS idx_journey_recommendations_user_id ON journey_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_recommendations_created_at ON journey_recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_journey_recommendations_journey_id ON journey_recommendations(journey_id);

-- Comments for documentation
COMMENT ON TABLE wisdom_journeys IS 'AI-powered personalized wisdom journeys with dynamic verse sequences';
COMMENT ON TABLE journey_steps IS 'Individual steps in a wisdom journey with associated verses and reflections';
COMMENT ON TABLE journey_recommendations IS 'Tracks journey recommendations for continuous ML improvement';

COMMENT ON COLUMN wisdom_journeys.recommended_by IS 'Source of recommendation: ai, mood_based, journal_based, manual';
COMMENT ON COLUMN wisdom_journeys.recommendation_score IS 'ML confidence score for journey relevance (0.0-1.0)';
COMMENT ON COLUMN wisdom_journeys.source_mood_scores IS 'Privacy-preserving mood data used for personalization';
COMMENT ON COLUMN wisdom_journeys.source_themes IS 'Privacy-preserving journal themes extracted (no content)';

COMMENT ON COLUMN journey_steps.reflection_prompt IS 'Personalized reflection question for the verse';
COMMENT ON COLUMN journey_steps.ai_insight IS 'AI-generated contextual insight for the verse';
COMMENT ON COLUMN journey_steps.user_notes IS 'User reflection notes (encrypted at application layer)';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON wisdom_journeys TO mindvibe_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON journey_steps TO mindvibe_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON journey_recommendations TO mindvibe_app;
-- GRANT USAGE, SELECT ON SEQUENCE journey_recommendations_id_seq TO mindvibe_app;
