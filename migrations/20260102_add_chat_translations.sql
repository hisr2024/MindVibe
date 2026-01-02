-- Migration: Add Chat Translation Support
-- Created: 2026-01-02
-- Description: Add chat_translations table for storing original and translated chat responses

-- Create chat_translations table
CREATE TABLE IF NOT EXISTS chat_translations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    
    -- Message identification
    message_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Original message
    original_text TEXT NOT NULL,
    original_language VARCHAR(10) DEFAULT 'en',
    
    -- Translated message
    translated_text TEXT,
    target_language VARCHAR(10),
    
    -- Metadata
    translation_success BOOLEAN DEFAULT FALSE,
    translation_error TEXT,
    translation_provider VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for efficient lookups
    CONSTRAINT chat_translations_pkey PRIMARY KEY (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_translations_user_id ON chat_translations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_translations_session_id ON chat_translations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_translations_message_id ON chat_translations(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_translations_original_language ON chat_translations(original_language);
CREATE INDEX IF NOT EXISTS idx_chat_translations_target_language ON chat_translations(target_language);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_translations_updated_at
    BEFORE UPDATE ON chat_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_translations_updated_at();

-- Add comment for documentation
COMMENT ON TABLE chat_translations IS 'Stores original and translated chat responses with language tags';
COMMENT ON COLUMN chat_translations.message_id IS 'Unique identifier for the message';
COMMENT ON COLUMN chat_translations.original_text IS 'Original message text in source language';
COMMENT ON COLUMN chat_translations.translated_text IS 'Translated message text in target language';
COMMENT ON COLUMN chat_translations.translation_success IS 'Indicates if translation was successful';
