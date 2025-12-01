CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    rotated_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    parent_id VARCHAR(64) REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    reuse_detected BOOLEAN NOT NULL DEFAULT FALSE,
    rotated_to_id VARCHAR(64)
);

-- Ensure columns exist even if the table was created without the latest fields
ALTER TABLE IF EXISTS refresh_tokens
    ADD COLUMN IF NOT EXISTS parent_id VARCHAR(64) REFERENCES refresh_tokens(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS refresh_tokens
    ADD COLUMN IF NOT EXISTS rotated_to_id VARCHAR(64);
ALTER TABLE IF EXISTS refresh_tokens
    ADD COLUMN IF NOT EXISTS reuse_detected BOOLEAN NOT NULL DEFAULT FALSE;

-- Indexes to optimize common queries
-- Fast filter by session and active state
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_session_active ON refresh_tokens (session_id) WHERE revoked_at IS NULL;
-- Lookup by user for cleanup / listing
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user ON refresh_tokens (user_id);
-- Parent traversal (rotation chains)
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_parent ON refresh_tokens (parent_id);
-- Expiration pruning
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expires_at ON refresh_tokens (expires_at);
-- Revoked_at queries
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_revoked_at ON refresh_tokens (revoked_at);

-- NOTE: Future optimization: add a deterministic lookup_hash (CHAR(64)) + UNIQUE index for O(1) refresh token retrieval.
