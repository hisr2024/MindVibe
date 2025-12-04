-- Journal backend tables with E2E encrypted blobs
-- dialect: postgres-only
-- NOTE: This migration handles both fresh deployments and upgrades from legacy schemas. 

-- Attempt to enable pg_trgm extension (needed for search)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        BEGIN
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
        EXCEPTION
            WHEN insufficient_privilege THEN
                RAISE NOTICE 'Skipping pg_trgm extension (insufficient privileges)';
            WHEN undefined_file THEN
                RAISE NOTICE 'Skipping pg_trgm extension (not available on this host)';
        END;
    END IF;
END $$;

-- Create journal_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_title JSONB NULL,
    encrypted_content JSONB NOT NULL,
    encryption_meta JSONB NULL,
    mood_labels JSONB NULL,
    tag_labels JSONB NULL,
    client_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_client_ts ON journal_entries(client_updated_at);

-- Create journal_tags table
CREATE TABLE IF NOT EXISTS journal_tags (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    color VARCHAR(16) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(user_id, name)
);

-- Create journal_entry_tags junction table
CREATE TABLE IF NOT EXISTS journal_entry_tags (
    entry_id VARCHAR(64) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES journal_tags(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY(entry_id, tag_id)
);

-- Create journal_versions table
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

-- Create journal_search_index table
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

-- Handle legacy schema upgrades: align journal_entries. id to VARCHAR(64) if needed
-- This block only runs if the table existed before this migration AND had the wrong column type
DO $$
DECLARE
    current_type TEXT;
    current_length INT;
BEGIN
    -- Check if journal_entries exists and get current id column type
    SELECT data_type, character_maximum_length 
    INTO current_type, current_length
    FROM information_schema.columns
    WHERE table_name = 'journal_entries' 
      AND column_name = 'id'
      AND table_schema = current_schema();

    -- If column exists but is not VARCHAR(64), we need to align it
    IF current_type IS NOT NULL AND (current_type <> 'character varying' OR current_length IS DISTINCT FROM 64) THEN
        RAISE NOTICE 'Legacy schema detected: aligning journal_entries.id from % to VARCHAR(64)', current_type;
        
        -- Drop dependent foreign keys
        ALTER TABLE journal_entry_tags DROP CONSTRAINT IF EXISTS journal_entry_tags_entry_id_fkey;
        ALTER TABLE journal_versions DROP CONSTRAINT IF EXISTS journal_versions_entry_id_fkey;
        ALTER TABLE journal_search_index DROP CONSTRAINT IF EXISTS journal_search_index_entry_id_fkey;
        
        -- Check if emotional_reset_sessions exists and has the FK
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'emotional_reset_sessions' 
              AND column_name = 'journal_entry_id'
              AND table_schema = current_schema()
        ) THEN
            ALTER TABLE emotional_reset_sessions DROP CONSTRAINT IF EXISTS emotional_reset_sessions_journal_entry_id_fkey;
        END IF;

        -- Convert all columns to VARCHAR(64)
        ALTER TABLE journal_entry_tags ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
        ALTER TABLE journal_versions ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
        ALTER TABLE journal_search_index ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'emotional_reset_sessions' 
              AND column_name = 'journal_entry_id'
        ) THEN
            ALTER TABLE emotional_reset_sessions ALTER COLUMN journal_entry_id TYPE VARCHAR(64) USING journal_entry_id::VARCHAR(64);
        END IF;

        -- Convert primary key column
        ALTER TABLE journal_entries ALTER COLUMN id TYPE VARCHAR(64) USING id::VARCHAR(64);

        -- Recreate primary key constraint
        ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_pkey;
        ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);

        -- Restore foreign keys
        ALTER TABLE journal_entry_tags 
            ADD CONSTRAINT journal_entry_tags_entry_id_fkey 
            FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
        
        ALTER TABLE journal_versions 
            ADD CONSTRAINT journal_versions_entry_id_fkey 
            FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
        
        ALTER TABLE journal_search_index 
            ADD CONSTRAINT journal_search_index_entry_id_fkey 
            FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'emotional_reset_sessions' 
              AND column_name = 'journal_entry_id'
        ) THEN
            ALTER TABLE emotional_reset_sessions 
                ADD CONSTRAINT emotional_reset_sessions_journal_entry_id_fkey 
                FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
        END IF;

        RAISE NOTICE 'Successfully aligned journal_entries.id to VARCHAR(64)';
    ELSIF current_type IS NOT NULL THEN
        RAISE NOTICE 'journal_entries.id already VARCHAR(64), no alignment needed';
    ELSE
        RAISE NOTICE 'Fresh deployment: journal_entries created with VARCHAR(64) id';
    END IF;
END $$;
