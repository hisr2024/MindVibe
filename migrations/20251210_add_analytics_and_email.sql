CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128),
    session_id VARCHAR(128),
    event_name VARCHAR(128) NOT NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'client',
    properties JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_source ON analytics_events(source);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

CREATE TABLE IF NOT EXISTS email_notifications (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(256) NOT NULL,
    template VARCHAR(64) NOT NULL,
    subject VARCHAR(256) NOT NULL,
    payload JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_template ON email_notifications(template);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);
