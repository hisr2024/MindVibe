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

            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotional_reset_sessions') THEN
                ALTER TABLE emotional_reset_sessions DROP CONSTRAINT IF EXISTS emotional_reset_sessions_journal_entry_id_fkey;
            END IF;

            -- Align referencing columns to the expected VARCHAR(64) type
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'journal_entry_tags' AND column_name = 'entry_id' AND data_type = 'integer'
            ) THEN
                ALTER TABLE journal_entry_tags
                    ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
            END IF;

            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'journal_versions' AND column_name = 'entry_id' AND data_type = 'integer'
            ) THEN
                ALTER TABLE journal_versions
                    ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
            END IF;

            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'journal_search_index' AND column_name = 'entry_id' AND data_type = 'integer'
            ) THEN
                ALTER TABLE journal_search_index
                    ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
            END IF;

            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'emotional_reset_sessions' AND column_name = 'journal_entry_id' AND data_type = 'integer'
            ) THEN
                ALTER TABLE emotional_reset_sessions
                    ALTER COLUMN journal_entry_id TYPE VARCHAR(64) USING journal_entry_id::VARCHAR(64);
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

            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotional_reset_sessions') THEN
                ALTER TABLE emotional_reset_sessions
                    ADD CONSTRAINT emotional_reset_sessions_journal_entry_id_fkey
                    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
            END IF;
        END IF;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE '[journal_migration] Skipping legacy type alignment for journal_entries.id: %', SQLERRM;
    END;
END $$ LANGUAGE plpgsql;

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

-- Ensure legacy deployments have the client_updated_at column before creating the index
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_entries'
          AND column_name = 'client_updated_at'
    ) THEN
        ALTER TABLE journal_entries ADD COLUMN client_updated_at TIMESTAMPTZ;

        -- Backfill with the best available timestamp to satisfy the NOT NULL expectation
        UPDATE journal_entries
        SET client_updated_at = COALESCE(updated_at, created_at, NOW())
        WHERE client_updated_at IS NULL;

        ALTER TABLE journal_entries ALTER COLUMN client_updated_at SET NOT NULL;
    END IF;
END $$ LANGUAGE plpgsql;

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

-- Render's migration runner splits statements by semicolon, so keep the
-- journal_versions definition free of inline semicolons inside the table body
-- (i.e., avoid separate ALTERs right after this block). Explicitly declare the
-- foreign keys inside the table so the statement stands alone.
CREATE TABLE IF NOT EXISTS journal_versions (
    id SERIAL PRIMARY KEY,
    entry_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    encrypted_content JSONB NOT NULL,
    encryption_meta JSONB NULL,
    client_updated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT journal_versions_entry_id_fkey
        FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT journal_versions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
