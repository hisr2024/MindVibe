CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    rotated_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    parent_id UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    reuse_detected BOOLEAN NOT NULL DEFAULT FALSE
);

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
