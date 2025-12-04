-- Migration: Align journal_entries.id with application UUID string type
-- dialect: postgres-only
-- Description: Cast journal_entries.id to VARCHAR(64) when legacy integer schema exists,
--              then restore foreign keys that depend on the column.
-- Date: 2025-12-11

DO $$
BEGIN
    -- Drop existing foreign key constraints if they are present.
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'journal_entry_tags'
          AND constraint_name = 'journal_entry_tags_entry_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE journal_entry_tags DROP CONSTRAINT journal_entry_tags_entry_id_fkey';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'journal_versions'
          AND constraint_name = 'journal_versions_entry_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE journal_versions DROP CONSTRAINT journal_versions_entry_id_fkey';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'journal_search_index'
          AND constraint_name = 'journal_search_index_entry_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE journal_search_index DROP CONSTRAINT journal_search_index_entry_id_fkey';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'emotional_reset_sessions'
          AND constraint_name = 'emotional_reset_sessions_journal_entry_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE emotional_reset_sessions DROP CONSTRAINT emotional_reset_sessions_journal_entry_id_fkey';
    END IF;

    -- Align column types to VARCHAR(64) when they exist and differ.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_entries'
          AND column_name = 'id'
          AND (
              data_type <> 'character varying'
              OR character_maximum_length IS DISTINCT FROM 64
          )
    ) THEN
        EXECUTE 'ALTER TABLE journal_entries ALTER COLUMN id TYPE VARCHAR(64) USING id::VARCHAR(64)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'emotional_reset_sessions'
          AND column_name = 'journal_entry_id'
    ) THEN
        EXECUTE 'ALTER TABLE emotional_reset_sessions ALTER COLUMN journal_entry_id TYPE VARCHAR(64) USING journal_entry_id::VARCHAR(64)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_search_index'
          AND column_name = 'entry_id'
    ) THEN
        EXECUTE 'ALTER TABLE journal_search_index ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_versions'
          AND column_name = 'entry_id'
    ) THEN
        EXECUTE 'ALTER TABLE journal_versions ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64)';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_entry_tags'
          AND column_name = 'entry_id'
    ) THEN
        EXECUTE 'ALTER TABLE journal_entry_tags ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64)';
    END IF;

    -- Recreate foreign key constraints with proper delete behaviors.
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotional_reset_sessions')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries')
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'emotional_reset_sessions'
             AND column_name = 'journal_entry_id'
       ) THEN
        EXECUTE 'ALTER TABLE emotional_reset_sessions
                 ADD CONSTRAINT emotional_reset_sessions_journal_entry_id_fkey
                 FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_search_index')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries')
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'journal_search_index'
             AND column_name = 'entry_id'
       ) THEN
        EXECUTE 'ALTER TABLE journal_search_index
                 ADD CONSTRAINT journal_search_index_entry_id_fkey
                 FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_versions')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries')
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'journal_versions'
             AND column_name = 'entry_id'
       ) THEN
        EXECUTE 'ALTER TABLE journal_versions
                 ADD CONSTRAINT journal_versions_entry_id_fkey
                 FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_tags')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries')
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'journal_entry_tags'
             AND column_name = 'entry_id'
       ) THEN
        EXECUTE 'ALTER TABLE journal_entry_tags
                 ADD CONSTRAINT journal_entry_tags_entry_id_fkey
                 FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE';
    END IF;
END;
$$;
