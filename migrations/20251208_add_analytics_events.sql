-- Migration: Add analytics_events table for lightweight event tracking
-- Purpose: Track user events and application metrics without affecting performance
-- Date: 2025-12-08

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id, created_at);

-- Add comment for documentation
COMMENT ON TABLE analytics_events IS 'Lightweight analytics event tracking for monitoring user activity and application metrics';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event (e.g., chat_message_sent, mood_logged, journal_entry_created)';
COMMENT ON COLUMN analytics_events.metadata IS 'Additional event metadata in JSON format';
