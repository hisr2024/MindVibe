-- Journal backend tables with E2E encrypted blobs
-- NOTE: Some legacy deployments created `journal_entries.id` as an integer primary
-- key. Because this migration introduces new tables that reference
-- `journal_entries(id)` as a VARCHAR(64) UUID string, we proactively align the
-- column type before creating those tables. This avoids PostgreSQL rejecting the
-- foreign keys with a "DatatypeMismatchError" during deployment.

DO $$
DECLARE
    column_is_integer BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_entries'
          AND column_name = 'id'
          AND data_type = 'integer'
    ) INTO column_is_integer;

    IF column_is_integer THEN
        -- Drop dependent foreign keys if legacy tables already exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_tags') THEN
            ALTER TABLE journal_entry_tags DROP CONSTRAINT IF EXISTS journal_entry_tags_entry_id_fkey;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_versions') THEN
            ALTER TABLE journal_versions DROP CONSTRAINT IF EXISTS journal_versions_entry_id_fkey;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_search_index') THEN
            ALTER TABLE journal_search_index DROP CONSTRAINT IF EXISTS journal_search_index_entry_id_fkey;
        END IF;

        -- Update the primary key column to the expected VARCHAR(64) type
        ALTER TABLE journal_entries
            ALTER COLUMN id TYPE VARCHAR(64) USING id::VARCHAR(64);

        -- Restore foreign keys with the corrected type
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_tags') THEN
            ALTER TABLE journal_entry_tags
                ADD CONSTRAINT journal_entry_tags_entry_id_fkey
                FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_versions') THEN
            ALTER TABLE journal_versions
                ADD CONSTRAINT journal_versions_entry_id_fkey
                FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_search_index') THEN
            ALTER TABLE journal_search_index
                ADD CONSTRAINT journal_search_index_entry_id_fkey
                FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_title JSONB NULL,
    encrypted_content JSONB NOT NULL,
    encryption_meta JSONB NULL,
    mood_labels JSONB NULL,
    tag_labels JSONB NULL,
    client_updated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_client_ts ON journal_entries(client_updated_at);

CREATE TABLE IF NOT EXISTS journal_tags (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    color VARCHAR(16) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS journal_entry_tags (
    entry_id VARCHAR(64) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES journal_tags(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY(entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS journal_versions (
    id SERIAL PRIMARY KEY,
    entry_id VARCHAR(64) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    encrypted_content JSONB NOT NULL,
    encryption_meta JSONB NULL,
    client_updated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_versions_entry ON journal_versions(entry_id, version DESC);

CREATE TABLE IF NOT EXISTS journal_search_index (
    id SERIAL PRIMARY KEY,
    entry_id VARCHAR(64) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hashes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_search_user ON journal_search_index(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_search_tokens ON journal_search_index USING GIN (token_hashes);
