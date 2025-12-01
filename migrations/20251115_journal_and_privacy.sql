-- Journal schema and privacy primitives
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64),
    ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS magic_link_token VARCHAR(128),
    ADD COLUMN IF NOT EXISTS magic_link_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    entry_uuid VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_ciphertext TEXT NOT NULL,
    content_ciphertext TEXT NOT NULL,
    encryption_key_id VARCHAR(64) NOT NULL,
    mood_score INTEGER,
    tags JSONB,
    attachments JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_created_at ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_deleted ON journal_entries(deleted_at);

CREATE TABLE IF NOT EXISTS journal_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(256),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_journal_tags_name UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS journal_entry_tags (
    entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES journal_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS journal_attachments (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    file_name VARCHAR(256) NOT NULL,
    media_type VARCHAR(128) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    encryption_key_id VARCHAR(64) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_journal_attachments_entry_id ON journal_attachments(entry_id);
