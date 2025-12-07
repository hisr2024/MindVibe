-- Performance indexes (no schema changes)

-- Composite indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_moods_user_created ON moods(user_id, created_at DESC);
-- Index for score-based queries and filtering (different from covering index below)
CREATE INDEX IF NOT EXISTS idx_moods_user_score ON moods(user_id, mood_score);

CREATE INDEX IF NOT EXISTS idx_chat_user_created ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_user_created ON journal_entries(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_gita_chapter_verse ON gita_verses(chapter, verse_number);

-- Covering index with INCLUDE clause (PostgreSQL 11+ feature)
-- Allows index-only scans by including frequently accessed columns in the index,
-- reducing the need to access the table heap for common queries that filter by user_id and created_at
-- This is particularly effective for queries that also need to access mood_score and mood_level columns
CREATE INDEX IF NOT EXISTS idx_moods_user_recent_covering 
    ON moods(user_id, created_at DESC) 
    INCLUDE (mood_score, mood_level);
