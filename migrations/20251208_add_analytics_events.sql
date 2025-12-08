CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public'
            AND table_name = 'analytics_events'
            AND constraint_name = 'fk_analytics_user'
        ) THEN
            ALTER TABLE analytics_events 
            ADD CONSTRAINT fk_analytics_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);

COMMENT ON TABLE analytics_events IS 'Lightweight analytics tracking for monitoring user activity and system events';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event being tracked (e.g., chat_message_sent, mood_logged, journal_entry_created)';
COMMENT ON COLUMN analytics_events.user_id IS 'Reference to the user who triggered the event (nullable for anonymous or system events)';
COMMENT ON COLUMN analytics_events.metadata IS 'Additional event metadata and context stored as JSON';
COMMENT ON COLUMN analytics_events.created_at IS 'Timestamp when the event was recorded';
