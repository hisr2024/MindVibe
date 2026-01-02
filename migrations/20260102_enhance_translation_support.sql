-- Migration: Add Translation Support Enhancements
-- Created: 2026-01-02
-- Description: Add additional translation support columns to users and messages tables

-- Add auto_translate preference to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auto_translate BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN users.auto_translate IS 'Whether to automatically translate messages for this user';
COMMENT ON COLUMN users.locale IS 'User preferred language code (e.g., en, es, hi)';

-- Create index on locale for faster queries
CREATE INDEX IF NOT EXISTS idx_users_locale ON users(locale);
CREATE INDEX IF NOT EXISTS idx_users_auto_translate ON users(auto_translate);

-- Add detected_language column to chat_translations if not exists
-- This helps track the detected source language of messages
ALTER TABLE chat_translations 
ADD COLUMN IF NOT EXISTS detected_language VARCHAR(10);

-- Add index for detected_language
CREATE INDEX IF NOT EXISTS idx_chat_translations_detected_language ON chat_translations(detected_language);

-- Add constraint to ensure language codes are valid
-- This helps prevent invalid language codes from being stored
ALTER TABLE chat_translations
ADD CONSTRAINT check_original_language_format 
CHECK (original_language ~* '^[a-z]{2}(-[A-Z]{2})?$' OR original_language IS NULL);

ALTER TABLE chat_translations
ADD CONSTRAINT check_target_language_format 
CHECK (target_language ~* '^[a-z]{2}(-[A-Z]{2})?$' OR target_language IS NULL);

ALTER TABLE chat_translations
ADD CONSTRAINT check_detected_language_format 
CHECK (detected_language ~* '^[a-z]{2}(-[A-Z]{2})?$' OR detected_language IS NULL);

-- Update comments
COMMENT ON COLUMN chat_translations.detected_language IS 'Auto-detected language code of the original message';

-- Create a view for user translation preferences (useful for queries)
CREATE OR REPLACE VIEW user_translation_preferences AS
SELECT 
    id as user_id,
    locale as preferred_language,
    auto_translate,
    created_at,
    deleted_at
FROM users
WHERE deleted_at IS NULL;

COMMENT ON VIEW user_translation_preferences IS 'View providing easy access to user translation preferences';
