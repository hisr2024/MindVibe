-- Migration: Align journal_entries.id with application UUID string type
-- Description: Cast journal_entries.id to VARCHAR(64) when legacy integer schema exists,
--              then restore foreign keys that depend on the column.
-- Date: 2025-12-11

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
