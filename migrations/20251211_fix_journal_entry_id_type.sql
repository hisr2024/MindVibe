-- Migration: Align journal_entries.id with application UUID string type
-- Description: Cast journal_entries.id to VARCHAR(64) when legacy integer schema exists,
--              then restore foreign keys that depend on the column.
-- Date: 2025-12-11

-- Drop dependent foreign keys if legacy tables already exist
ALTER TABLE IF EXISTS journal_entry_tags DROP CONSTRAINT IF EXISTS journal_entry_tags_entry_id_fkey;
ALTER TABLE IF EXISTS journal_versions DROP CONSTRAINT IF EXISTS journal_versions_entry_id_fkey;
ALTER TABLE IF EXISTS journal_search_index DROP CONSTRAINT IF EXISTS journal_search_index_entry_id_fkey;
ALTER TABLE IF EXISTS emotional_reset_sessions DROP CONSTRAINT IF EXISTS emotional_reset_sessions_journal_entry_id_fkey;

-- Align referencing columns to the expected VARCHAR(64) type
ALTER TABLE IF EXISTS journal_entry_tags ALTER COLUMN IF EXISTS entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
ALTER TABLE IF EXISTS journal_versions ALTER COLUMN IF EXISTS entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
ALTER TABLE IF EXISTS journal_search_index ALTER COLUMN IF EXISTS entry_id TYPE VARCHAR(64) USING entry_id::VARCHAR(64);
ALTER TABLE IF EXISTS emotional_reset_sessions ALTER COLUMN IF EXISTS journal_entry_id TYPE VARCHAR(64) USING journal_entry_id::VARCHAR(64);

-- Update the primary key column to the expected VARCHAR(64) type
ALTER TABLE IF EXISTS journal_entries ALTER COLUMN IF EXISTS id TYPE VARCHAR(64) USING id::VARCHAR(64);

-- Restore foreign keys with the corrected type
ALTER TABLE IF EXISTS journal_entry_tags
    ADD CONSTRAINT journal_entry_tags_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS journal_versions
    ADD CONSTRAINT journal_versions_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS journal_search_index
    ADD CONSTRAINT journal_search_index_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS emotional_reset_sessions
    ADD CONSTRAINT emotional_reset_sessions_journal_entry_id_fkey
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
