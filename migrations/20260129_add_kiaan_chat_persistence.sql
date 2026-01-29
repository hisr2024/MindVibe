-- Migration: Add KIAAN Chat Persistence Tables
-- Date: 2026-01-29
-- Description: Adds tables for persistent KIAAN chat history storage
--              Enables conversation history, analytics, and cross-device sync

-- ============================================================================
-- KIAAN Chat Messages Table
-- ============================================================================
-- Stores individual messages in KIAAN conversations
-- Supports both authenticated and anonymous users

CREATE TABLE IF NOT EXISTS kiaan_chat_messages (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,

    -- Message content
    user_message TEXT NOT NULL,
    kiaan_response TEXT NOT NULL,
    summary TEXT,

    -- Context and metadata
    context VARCHAR(64),
    detected_emotion VARCHAR(32),
    mood_at_time VARCHAR(32),

    -- Gita wisdom integration
    verses_used JSONB,
    validation_score NUMERIC(4, 3),
    gita_terms_found JSONB,

    -- Language and translation
    language VARCHAR(8) DEFAULT 'en',
    translation TEXT,

    -- Model information
    model_used VARCHAR(64),
    provider_used VARCHAR(32),
    was_cached BOOLEAN DEFAULT FALSE,
    was_streaming BOOLEAN DEFAULT FALSE,

    -- Performance metrics
    response_time_ms INTEGER,
    token_count INTEGER,

    -- User feedback
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    was_helpful BOOLEAN,
    saved_to_journal BOOLEAN DEFAULT FALSE,

    -- Soft delete support
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_kiaan_chat_messages_user_id ON kiaan_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_kiaan_chat_messages_session_id ON kiaan_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_kiaan_chat_messages_created_at ON kiaan_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kiaan_chat_messages_user_session ON kiaan_chat_messages(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_kiaan_chat_messages_not_deleted ON kiaan_chat_messages(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- KIAAN Chat Sessions Table
-- ============================================================================
-- Groups messages into sessions for context and analytics

CREATE TABLE IF NOT EXISTS kiaan_chat_sessions (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,

    -- Session metadata
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,

    -- Context
    initial_mood VARCHAR(32),
    initial_context VARCHAR(64),
    language VARCHAR(8) DEFAULT 'en',

    -- Session summary (generated on close)
    session_summary TEXT,
    dominant_emotion VARCHAR(32),
    verses_explored JSONB,

    -- Analytics
    avg_response_time_ms INTEGER,
    total_tokens_used INTEGER,
    was_helpful BOOLEAN
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_kiaan_chat_sessions_user_id ON kiaan_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_kiaan_chat_sessions_started_at ON kiaan_chat_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_kiaan_chat_sessions_user_recent ON kiaan_chat_sessions(user_id, started_at DESC);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE kiaan_chat_messages IS 'Stores KIAAN chat conversation history for persistence and analytics';
COMMENT ON TABLE kiaan_chat_sessions IS 'Groups KIAAN chat messages into sessions for context continuity';

COMMENT ON COLUMN kiaan_chat_messages.session_id IS 'Groups messages in a conversation session';
COMMENT ON COLUMN kiaan_chat_messages.verses_used IS 'Array of Gita verse IDs used in response';
COMMENT ON COLUMN kiaan_chat_messages.validation_score IS 'Gita wisdom validation score (0-1)';
COMMENT ON COLUMN kiaan_chat_messages.gita_terms_found IS 'Sanskrit/Gita terms found in response';
COMMENT ON COLUMN kiaan_chat_messages.was_cached IS 'Whether response was served from cache';
COMMENT ON COLUMN kiaan_chat_messages.was_streaming IS 'Whether response was streamed via SSE';

COMMENT ON COLUMN kiaan_chat_sessions.verses_explored IS 'Unique verses discussed during session';
COMMENT ON COLUMN kiaan_chat_sessions.dominant_emotion IS 'Most frequent emotion detected in session';
