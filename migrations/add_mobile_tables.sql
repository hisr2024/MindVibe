CREATE TABLE IF NOT EXISTS users_devices (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(20) CHECK (platform IN ('ios', 'android', 'web')),
    last_active TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_devices_user_id ON users_devices(user_id);

CREATE TABLE IF NOT EXISTS sync_queue (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id, synced) WHERE synced = FALSE;

CREATE TABLE IF NOT EXISTS realtime_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) REFERENCES users(id),
    payload JSONB NOT NULL,
    delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
