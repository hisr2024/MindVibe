-- Migration: Align journal entry foreign key types and constraints
-- dialect: postgres-only

DO $$
DECLARE
    entry_data_type TEXT;
    entry_length INT;
    rec RECORD;
BEGIN
    -- Ensure journal_entries.id exists and is VARCHAR(64)
    SELECT data_type, character_maximum_length
    INTO entry_data_type, entry_length
    FROM information_schema.columns
    WHERE table_schema = current_schema
      AND table_name = 'journal_entries'
      AND column_name = 'id';

    IF entry_data_type IS NOT NULL AND (entry_data_type <> 'character varying' OR entry_length <> 64) THEN
        EXECUTE 'ALTER TABLE journal_entries ALTER COLUMN id TYPE VARCHAR(64) USING id::VARCHAR(64)';
    END IF;

    -- journal_entry_tags.entry_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema
          AND table_name = 'journal_entry_tags'
          AND column_name = 'entry_id'
    ) THEN
        FOR rec IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name
             AND kcu.constraint_schema = tc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.constraint_schema
            WHERE tc.table_schema = current_schema
              AND tc.table_name = 'journal_entry_tags'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'entry_id'
              AND ccu.table_name = 'journal_entries'
              AND ccu.column_name = 'id'
        LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'journal_entry_tags', rec.constraint_name);
        END LOOP;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema
              AND table_name = 'journal_entry_tags'
              AND column_name = 'entry_id'
              AND (data_type <> 'character varying' OR character_maximum_length <> 64)
        ) THEN
            EXECUTE 'ALTER TABLE journal_entry_tags ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64)';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name
             AND kcu.constraint_schema = tc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.constraint_schema
            WHERE tc.table_schema = current_schema
              AND tc.table_name = 'journal_entry_tags'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'entry_id'
              AND ccu.table_name = 'journal_entries'
              AND ccu.column_name = 'id'
        ) THEN
            EXECUTE 'ALTER TABLE journal_entry_tags ADD CONSTRAINT journal_entry_tags_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE';
        END IF;
    END IF;

    -- journal_versions.entry_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema
          AND table_name = 'journal_versions'
          AND column_name = 'entry_id'
    ) THEN
        FOR rec IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name
             AND kcu.constraint_schema = tc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.constraint_schema
            WHERE tc.table_schema = current_schema
              AND tc.table_name = 'journal_versions'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'entry_id'
              AND ccu.table_name = 'journal_entries'
              AND ccu.column_name = 'id'
        LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'journal_versions', rec.constraint_name);
        END LOOP;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema
              AND table_name = 'journal_versions'
              AND column_name = 'entry_id'
              AND (data_type <> 'character varying' OR character_maximum_length <> 64)
        ) THEN
            EXECUTE 'ALTER TABLE journal_versions ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64)';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name
             AND kcu.constraint_schema = tc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.constraint_schema
            WHERE tc.table_schema = current_schema
              AND tc.table_name = 'journal_versions'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'entry_id'
              AND ccu.table_name = 'journal_entries'
              AND ccu.column_name = 'id'
        ) THEN
            EXECUTE 'ALTER TABLE journal_versions ADD CONSTRAINT journal_versions_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE';
        END IF;
    END IF;

    -- journal_search_index.entry_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema
          AND table_name = 'journal_search_index'
          AND column_name = 'entry_id'
    ) THEN
        FOR rec IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name
             AND kcu.constraint_schema = tc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.constraint_schema
            WHERE tc.table_schema = current_schema
              AND tc.table_name = 'journal_search_index'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'entry_id'
              AND ccu.table_name = 'journal_entries'
              AND ccu.column_name = 'id'
        LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'journal_search_index', rec.constraint_name);
        END LOOP;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema
              AND table_name = 'journal_search_index'
              AND column_name = 'entry_id'
              AND (data_type <> 'character varying' OR character_maximum_length <> 64)
        ) THEN
            EXECUTE 'ALTER TABLE journal_search_index ALTER COLUMN entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64)';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name
             AND kcu.constraint_schema = tc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.constraint_schema
            WHERE tc.table_schema = current_schema
              AND tc.table_name = 'journal_search_index'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'entry_id'
              AND ccu.table_name = 'journal_entries'
              AND ccu.column_name = 'id'
        ) THEN
            EXECUTE 'ALTER TABLE journal_search_index ADD CONSTRAINT journal_search_index_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE';
        END IF;
    END IF;

    -- emotional_reset_sessions.journal_entry_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema
          AND table_name = 'emotional_reset_sessions'
          AND column_name = 'journal_entry_id'
    ) THEN
        FOR rec IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name
             AND kcu.constraint_schema = tc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.constraint_schema
            WHERE tc.table_schema = current_schema
              AND tc.table_name = 'emotional_reset_sessions'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'journal_entry_id'
              AND ccu.table_name = 'journal_entries'
              AND ccu.column_name = 'id'
        LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'emotional_reset_sessions', rec.constraint_name);
        END LOOP;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema
              AND table_name = 'emotional_reset_sessions'
              AND column_name = 'journal_entry_id'
              AND (data_type <> 'character varying' OR character_maximum_length <> 64)
        ) THEN
            EXECUTE 'ALTER TABLE emotional_reset_sessions ALTER COLUMN journal_entry_id TYPE VARCHAR(64) USING journal_entry_id::VARCHAR(64)';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name
             AND kcu.constraint_schema = tc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.constraint_schema
            WHERE tc.table_schema = current_schema
              AND tc.table_name = 'emotional_reset_sessions'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'journal_entry_id'
              AND ccu.table_name = 'journal_entries'
              AND ccu.column_name = 'id'
        ) THEN
            EXECUTE 'ALTER TABLE emotional_reset_sessions ADD CONSTRAINT emotional_reset_sessions_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL';
        END IF;
    END IF;
END $$;
