BEGIN;

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics_events'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
        ON analytics_events(event_type, created_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_analytics_user 
        ON analytics_events(user_id, created_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_analytics_created 
        ON analytics_events(created_at DESC);
        
        RAISE NOTICE 'Analytics indexes created successfully';
    ELSE
        RAISE WARNING 'analytics_events table does not exist, skipping index creation';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_analytics_user'
        ) THEN
            ALTER TABLE analytics_events 
            ADD CONSTRAINT fk_analytics_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

COMMENT ON TABLE analytics_events IS 'Lightweight analytics tracking for monitoring user activity and system events';

COMMIT;
