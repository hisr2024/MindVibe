-- Migration: Enforce VARCHAR(64) journal entry IDs across all dependent tables
-- dialect: postgres-only
-- Purpose: Prevent PostgreSQL DatatypeMismatchError when recreating foreign keys
--          for journal_versions, journal_entry_tags, and journal_search_index.
-- Date: 2025-12-12

DO $$
DECLARE
    entry_data_type TEXT;
    entry_length INT;
BEGIN
    SELECT data_type, character_maximum_length
    INTO entry_data_type, entry_length
    FROM information_schema.columns
    WHERE table_name = 'journal_entries'
      AND column_name = 'id';

    IF entry_data_type IS NOT NULL AND (entry_data_type <> 'character varying' OR entry_length <> 64) THEN
        -- Drop dependent foreign keys before altering column types
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

        -- Align referencing columns to VARCHAR(64) when they don't already match
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'journal_entry_tags'
              AND column_name = 'entry_id'
              AND (data_type <> 'character varying' OR character_maximum_length <> 64)
        ) THEN
            ALTER TABLE journal_entry_tags
                ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'journal_versions'
              AND column_name = 'entry_id'
              AND (data_type <> 'character varying' OR character_maximum_length <> 64)
        ) THEN
            ALTER TABLE journal_versions
                ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'journal_search_index'
              AND column_name = 'entry_id'
              AND (data_type <> 'character varying' OR character_maximum_length <> 64)
        ) THEN
            ALTER TABLE journal_search_index
                ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'emotional_reset_sessions'
              AND column_name = 'journal_entry_id'
              AND (data_type <> 'character varying' OR character_maximum_length <> 64)
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
END $$;
